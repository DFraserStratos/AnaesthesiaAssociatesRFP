/**
 * Xero handoff (Phase 10; WI2/WI2a, X2/X3, D-handoff) — replaces the Phase-08/09
 * stub. Takes an invoiced BillingCase and creates the atomic ACCREC + DRAFT
 * ACCPAY pair (RFP Invoice creation pattern), linked back through the case via
 * the returned Xero GUIDs (not natively linked in Xero).
 *
 *  - CONTACT RESOLUTION follows RFP Appendix 2 (the prototype implements
 *    Appendix 2 over Appendix 1 — the NHI never crosses to Xero, convention 8):
 *    try the cached ContactID, then an authoritative lookup by ContactNumber,
 *    then create. Organisational payers (hospital/insurer/surgeon/organisation)
 *    map to `organisation`-type contacts keyed by the holder id (a distinct,
 *    globally-unique namespace, never a patient hidden id) and never archive.
 *    Patients key on `hiddenInternalId`; billable parties on their own hidden id
 *    (each payer its own contact). An ARCHIVED match is invoiced against and
 *    unarchived (the Xero unarchive step is TBC in the sandbox — surfaced).
 *  - NO PERSONAL INFORMATION IN XERO (catch-up Phase 16; US-09.3.1, OQ-30):
 *    a patient or billable-party contact is named only by a neutral label built
 *    from its hidden id ("Patient PT0001"), never a name, NHI or contact detail.
 *  - The anaesthetist PAYEE is an `organisation`-type contact (Xero has no
 *    anaesthetist type; org type is archive-exempt, correct for the payee).
 *  - THE PAYABLE IS THE GROSS AMOUNT (catch-up Phase 16; FT-10.3): the ACCPAY's
 *    amountPayable equals the ACCREC's amountDue. AA's own fee is a separate
 *    monthly invoice and is never deducted here.
 *  - Both records store InvoiceNumber (the ACCPAY's with `-P`, US-08.4.3),
 *    Reference (the case reference) and the issue date (US-09.1.1).
 *  - IDEMPOTENT: a case whose `accRecId` is set is a no-op (retry-safe).
 *  - FAULT PATH (D-handoff): `settings.failNextHandoff` records `handoffFailure`
 *    on the case, clears the flag, creates NO pair and keeps `status:'invoiced'`
 *    — all in one mutate. A fault is DATA, not a throw. Retry = re-invoke this
 *    idempotent handoff (distinct from `retryBillingCase`, which rebuilds
 *    invoices and keys off `status:'failed'`).
 *
 * One `mutate`, `source:'system'` audit (`xero.contactResolved`, `xero.pairCreated`).
 */

import { buyerCreatedTaxInvoiceFor, supplierFor } from '../domain/billing/invoicePresentation'
import type { Anaesthetist, BillingCase, Booking, CounterpartyRef, XeroContact } from '../domain/types'
import type { LockedPayee } from '../domain/billing/lock'
import { AA_HOLDING_ACCOUNT } from '../domain/billing/prepayment'
import { xeroIndividualContactName } from '../domain/xeroContact'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { casesForBooking, counterpartyName } from './selectors'

const HANDOFF_ACTOR: Actor = { who: 'Xero handoff', role: 'system', source: 'system' }

const HANDOFF_FAULT = {
  code: 'handoffFault',
  message:
    'Xero handoff failed (simulated fault). No ACCREC/ACCPAY pair was created; the invoice stands. Resolve and retry from the billing monitor.',
}

const UNARCHIVE_NOTE =
  'This contact was archived; it is unarchived to invoice against it. The Xero unarchive step is TBC in the sandbox.'

export interface ContactSpec {
  /** Composite cache key `${kind}:${id}` — never a raw id (4 disjoint org namespaces). */
  key: string
  contactNumber: string
  name: string
  type: XeroContact['type']
}

/**
 * The anaesthetist's Xero contact: the payee on every procedure ACCPAY, and the
 * contact AA's fee invoice is raised against (catch-up Phase 16). An org-type
 * contact (archive-exempt). The key uses the registration number, which IS the
 * anaesthetist id, so it matches the seed's payee key (`seed/history.ts`) and
 * every caller reuses the one contact via the cache rather than minting a
 * duplicate.
 */
/** The AA Holding account's Xero contact (catch-up Phase 27; FT-06.3): one persistent organisation contact. */
export function holdingAccountContactSpec(): ContactSpec {
  return { key: AA_HOLDING_ACCOUNT.contactKey, contactNumber: AA_HOLDING_ACCOUNT.contactNumber, name: AA_HOLDING_ACCOUNT.name, type: 'organisation' }
}

export function anaesthetistContactSpec(anaesthetist: Pick<Anaesthetist, 'registrationNumber' | 'name'>): ContactSpec {
  return {
    key: `anaesthetist:${anaesthetist.registrationNumber}`,
    contactNumber: `ANAE-${anaesthetist.registrationNumber}`,
    name: anaesthetist.name,
    type: 'organisation',
  }
}

/**
 * The payer contact spec for an invoice counterparty (no NHI or other
 * personal information; convention 8). Another payer on a Booking (catch-up
 * Phase 21) keys on the `billableParty` namespace its `BP####` id always had,
 * so a guardian re-expressed as a payer (Hana Park, BP0001) keeps its Xero
 * contact; Aria's folded record (BP0002) keeps its own. The ids never clash:
 * payer ids are allocated from the same counter.
 */
export function payerContactSpec(
  cp: CounterpartyRef,
  masters: AppState['masters'],
  booking?: Pick<Booking, 'id'>,
): ContactSpec {
  if (cp.kind === 'patient') {
    // ContactNumber = the patient's hidden internal id (never the NHI); the
    // name is the neutral label built from it (no personal information in Xero).
    return { key: `patient:${cp.id}`, contactNumber: cp.id, name: xeroIndividualContactName('patient', cp.id), type: 'patient' }
  }
  if (cp.kind === 'payer' || cp.kind === 'billableParty') {
    return { key: `billableParty:${cp.id}`, contactNumber: cp.id, name: xeroIndividualContactName('billableParty', cp.id), type: 'billableParty' }
  }
  // hospital / insurer / surgeon / organisation / party → one persistent
  // organisation contact, keyed by the (globally-unique) holder id.
  return { key: `${cp.kind}:${cp.id}`, contactNumber: cp.id, name: counterpartyName({ masters }, cp, booking?.id), type: 'organisation' }
}

export interface ResolveResult {
  contactId: string
  counters: Record<string, number>
  via: 'cache' | 'contactNumber' | 'created'
  unarchived: boolean
}

/**
 * Resolve a contact into `contacts`/`cache` (mutated in place — the caller
 * passes fresh recipe-local copies): cached ContactID → lookup by ContactNumber
 * → create (RFP Appendix 2). An archived match is unarchived. Returns the id,
 * how it resolved, and the bumped counters.
 */
export function resolveContactInto(
  spec: ContactSpec,
  contacts: Record<string, XeroContact>,
  cache: Record<string, string>,
  counters: Record<string, number>,
): ResolveResult {
  let contactId: string | undefined
  let via: ResolveResult['via'] = 'created'

  const cached = cache[spec.key]
  if (cached !== undefined && contacts[cached] !== undefined) {
    contactId = cached
    via = 'cache'
  } else {
    const found = Object.values(contacts).find((c) => c.contactNumber === spec.contactNumber)
    if (found !== undefined) {
      contactId = found.contactId
      via = 'contactNumber'
    }
  }

  let nextCounters = counters
  if (contactId === undefined) {
    const allocated = allocateId(counters, 'xeroContact')
    nextCounters = allocated.counters
    contactId = allocated.id
    contacts[contactId] = {
      contactId,
      contactNumber: spec.contactNumber,
      name: spec.name,
      type: spec.type,
      archived: false,
    }
  }

  // Archived-contact match: invoice against it, unarchive it (org contacts never
  // archive, so this only bites patient/billableParty matches).
  let unarchived = false
  const resolved = contacts[contactId]
  if (resolved !== undefined && resolved.archived) {
    contacts[contactId] = { ...resolved, archived: false }
    unarchived = true
  }

  cache[spec.key] = contactId
  return { contactId, counters: nextCounters, via, unarchived }
}

export function contactResolvedMeta(contactId: string, spec: ContactSpec, r: ResolveResult): MutationMeta {
  return {
    entityType: 'xeroContact',
    entityId: contactId,
    action: 'xero.contactResolved',
    after: {
      contactNumber: spec.contactNumber,
      type: spec.type,
      via: r.via,
      ...(r.unarchived ? { unarchived: true, note: UNARCHIVE_NOTE } : {}),
    },
  }
}

export interface HandoffResult {
  accRecId?: string
  accPayId?: string
  failed?: boolean
}

/**
 * Hand a single invoiced BillingCase off to Xero. Idempotent, fault-tolerant
 * (a fault is recorded on the case, never thrown), and audited source=system.
 */
export function handoffCase(api: AppStoreApi, caseId: string): Outcome<HandoffResult> {
  const state = api.getState()
  const theCase = state.billing.cases[caseId]
  if (theCase === undefined) return refuse('notFound', 'Billing case not found.')
  // Idempotent: already handed off.
  if (theCase.accRecId !== undefined) {
    return ok({ accRecId: theCase.accRecId, ...(theCase.accPayId !== undefined ? { accPayId: theCase.accPayId } : {}) })
  }
  if (theCase.status === 'failed' || theCase.invoiceId === undefined) {
    return refuse('noInvoice', 'This case has no invoice to hand off (a failed billing case).')
  }
  const invoice = state.billing.invoices[theCase.invoiceId]
  if (invoice === undefined) return refuse('noInvoice', 'The case invoice was not found.')
  // The payee locked at authorise (catch-up Phase 25): its contact and supplier block, never a Booking-to-List join.
  const payeeRecord = payeeForCase(state, theCase)
  if (payeeRecord === undefined) {
    return refuse('noAnaesthetist', 'Could not resolve the anaesthetist payee for this case.')
  }

  // Fault path: record the fault, clear the flag, create no pair (all one mutate). A fault
  // scoped to one Booking (`failHandoffBookingId`, catch-up Phase 25's staged failure) waits for it.
  const scoped = state.settings.failHandoffBookingId
  if (state.settings.failNextHandoff === true && (scoped === undefined || scoped === theCase.bookingId)) {
    mutate(
      api,
      HANDOFF_ACTOR,
      { entityType: 'billingCase', entityId: caseId, action: 'xero.handoffFailed', after: { ...HANDOFF_FAULT } },
      (s) => {
        const existing = s.billing.cases[caseId]
        if (existing === undefined) return {}
        return {
          billing: {
            ...s.billing,
            cases: { ...s.billing.cases, [caseId]: { ...existing, handoffFailure: { ...HANDOFF_FAULT } } },
          },
          settings: (() => {
            const { failHandoffBookingId: _scoped, ...rest } = s.settings
            return { ...rest, failNextHandoff: false }
          })(),
        }
      },
    )
    return ok({ failed: true })
  }

  const payerSpec = payerContactSpec(invoice.counterparty, state.masters)
  // A prepayment's payable credits the AA Holding account, not the anaesthetist (FT-06.3, D38; catch-up Phase 27).
  const toHolding = invoice.kind === 'prePayment'
  const payeeSpec = toHolding ? holdingAccountContactSpec() : anaesthetistContactSpec({ registrationNumber: payeeRecord.anaesthetistId, name: payeeRecord.name })

  const metas: MutationMeta[] = []
  let out: HandoffResult = {}
  mutate(api, HANDOFF_ACTOR, metas, (s) => {
    const existing = s.billing.cases[caseId]
    if (existing === undefined || existing.accRecId !== undefined) {
      // Raced/no-op: a prior commit already handed this off. Emit a harmless
      // audit-only note so the mutate still has its required entry.
      metas.push({ entityType: 'billingCase', entityId: caseId, action: 'xero.handoffNoop' })
      return {}
    }
    let counters = s.counters
    const contacts = { ...s.xero.contacts }
    const accRecs = { ...s.xero.accRecs }
    const accPays = { ...s.xero.accPays }
    const cache = { ...s.billing.contactIdCache }
    const cases = { ...s.billing.cases }

    const payer = resolveContactInto(payerSpec, contacts, cache, counters)
    counters = payer.counters
    metas.push(contactResolvedMeta(payer.contactId, payerSpec, payer))

    // A no-charge invoice (catch-up Phase 24): a $0.00 receivable, nothing owed so marked paid, and no
    // payable leg, so no BCTI (16's count unchanged). A reading, logged.
    if (invoice.noCharge === true) {
      const xr0 = allocateId(counters, 'xeroAccRec')
      counters = xr0.counters
      const at = clockISO(s.clock)
      accRecs[xr0.id] = {
        id: xr0.id,
        kind: 'procedure',
        invoiceId: invoice.id,
        contactId: payer.contactId,
        invoiceNumber: invoice.invoiceNumber,
        reference: invoice.caseReference,
        issuedAtISO: at,
        amountDue: 0,
        amountReceived: 0,
        paidAtISO: at,
        status: 'paid',
      }
      // Nothing is owed, so the case reads paid (stamped) and nothing is disbursed.
      cases[caseId] = { ...existing, accRecId: xr0.id, status: 'paid' as const, paidInAtISO: at }
      delete cases[caseId]!.handoffFailure
      out = { accRecId: xr0.id }
      metas.push({
        entityType: 'billingCase',
        entityId: caseId,
        action: 'xero.pairCreated',
        after: { accRecId: xr0.id, invoiceNumber: invoice.invoiceNumber, payerContactId: payer.contactId, amountDue: 0, noCharge: true },
      })
      return { xero: { ...s.xero, contacts, accRecs }, billing: { ...s.billing, cases, contactIdCache: cache }, counters }
    }

    const payee = resolveContactInto(payeeSpec, contacts, cache, counters)
    counters = payee.counters
    metas.push(contactResolvedMeta(payee.contactId, payeeSpec, payee))

    const xr = allocateId(counters, 'xeroAccRec')
    counters = xr.counters
    const xp = allocateId(counters, 'xeroAccPay')
    counters = xp.counters
    const issuedAtISO = clockISO(s.clock)

    accRecs[xr.id] = {
      id: xr.id,
      kind: 'procedure',
      invoiceId: invoice.id,
      contactId: payer.contactId,
      invoiceNumber: invoice.invoiceNumber,
      reference: invoice.caseReference,
      issuedAtISO,
      amountDue: invoice.total,
      amountReceived: 0,
      status: 'awaitingPayment',
    }
    accPays[xp.id] = {
      id: xp.id,
      accRecId: xr.id,
      contactId: payee.contactId,
      invoiceNumber: `${invoice.invoiceNumber}-P`,
      reference: invoice.caseReference,
      issuedAtISO,
      anaesthetistId: payeeRecord.anaesthetistId,
      amountPayable: invoice.total,
      amountAuthorised: 0,
      amountDisbursed: 0,
      status: 'draft',
      ...(toHolding ? { payeeAccount: AA_HOLDING_ACCOUNT.payeeAccount } : {}),
      // The ACCPAY stands as the buyer-created tax invoice (US-09.1.4; provisional, OQ-29): one per receivable, the same value.
      taxInvoice: buyerCreatedTaxInvoiceFor(invoice, payeeRecord.supplier),
    }
    // Clear any prior handoff fault on success (a resolved-and-retried case).
    const updated = { ...existing, accRecId: xr.id, accPayId: xp.id, status: 'handedOff' as const }
    delete updated.handoffFailure
    cases[caseId] = updated
    out = { accRecId: xr.id, accPayId: xp.id }

    metas.push({
      entityType: 'billingCase',
      entityId: caseId,
      action: 'xero.pairCreated',
      after: {
        accRecId: xr.id,
        accPayId: xp.id,
        invoiceNumber: invoice.invoiceNumber,
        payerContactId: payer.contactId,
        payeeContactId: payee.contactId,
        amountDue: invoice.total,
        amountPayable: invoice.total,
        taxInvoiceProvisional: true,
      },
    })

    return {
      xero: { ...s.xero, contacts, accRecs, accPays },
      billing: { ...s.billing, cases, contactIdCache: cache },
      counters,
    }
  })

  return ok(out)
}

/**
 * Hand off every eligible (invoiced, not-yet-paired, not-failed) case for a Booking
 * — the pre-payment pre-invoice seam (D-pre-invoice-pair: the pre-invoice gets
 * the full ACCREC+ACCPAY pair, so a fully-prepaid procedure still has a
 * disbursement path). Idempotent.
 */
export function handoffCasesForBooking(api: AppStoreApi, bookingId: string): void {
  for (const c of casesForBooking(api.getState(), bookingId)) {
    if (c.invoiceId !== undefined && c.accRecId === undefined && c.status !== 'failed') {
      handoffCase(api, c.id)
    }
  }
}

/**
 * Who a case pays, with the details its ACCPAY and BCTI print (catch-up Phase
 * 25, DM-42): the payee locked at authorise. A pre-payment case, raised at
 * setup before any lock, still reads the List's anaesthetist (until 27 and 41).
 */
function payeeForCase(state: Pick<AppState, 'schedule' | 'masters' | 'billing'>, theCase: BillingCase): LockedPayee | undefined {
  const locked = theCase.payeeAnaesthetistId !== undefined ? state.billing.locks[theCase.bookingId]?.payee : undefined
  if (locked !== undefined && locked.anaesthetistId === theCase.payeeAnaesthetistId) return locked
  const booking = state.schedule.bookings[theCase.bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const anaesthetist = list?.anaesthetistId !== undefined ? state.masters.anaesthetists[list.anaesthetistId] : undefined
  return anaesthetist !== undefined ? { anaesthetistId: anaesthetist.registrationNumber, name: anaesthetist.name, supplier: supplierFor(anaesthetist) } : undefined
}

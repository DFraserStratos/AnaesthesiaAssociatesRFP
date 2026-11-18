/**
 * Xero handoff (Phase 10; WI2/WI2a, X2/X3, D-handoff). Since catch-up Phase 36
 * Xero mirrors the ledger: `handoffPair` takes a ledger pair and creates the
 * atomic ACCREC + DRAFT ACCPAY (RFP Invoice creation pattern) from its legs,
 * stamping the legs' mirror ids (not natively linked in Xero).
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
 *  - Both records store InvoiceNumber (the legs' numbers: the ACCPAY's with
 *    `-P`, US-08.4.3), Reference (the pair id only, OQ-30) and the issue date
 *    (US-09.1.1).
 *  - IDEMPOTENT: a pair whose receivable has its mirror id is a no-op.
 *  - FAULT PATH (D-handoff): `settings.failNextHandoff` records
 *    `handoffFailure` on the pair, clears the flag and creates NO Xero records,
 *    all in one mutate. The pair and its money stand ("Not yet in Xero"). A
 *    fault is DATA, not a throw. Retry = re-invoke this idempotent hand-off
 *    (distinct from `retryBillingException`, which raises invoices a failed
 *    Booking never got).
 *
 * One `mutate`, `source:'system'` audit (`xero.contactResolved`, `xero.pairCreated`).
 */

import { buyerCreatedTaxInvoiceFor, supplierFor } from '../domain/billing/invoicePresentation'
import type { AaFeeLedgerPair, Anaesthetist, Booking, BookingLedgerPair, CounterpartyRef, XeroContact } from '../domain/types'
import { isAaFeePair, isBookingPair, isHoldingLeg, payeeAnaesthetistOf } from '../domain/billing/ledger'
import { aaFeeAccRecFor } from '../domain/billing/aaFee'
import type { LockedPayee } from '../domain/billing/lock'
import { AA_HOLDING_ACCOUNT } from '../domain/billing/prepayment'
import { xeroIndividualContactName } from '../domain/xeroContact'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { counterpartyName } from './selectors'
import { pairsForBooking, pairsForList } from './ledgerSelectors'

const HANDOFF_ACTOR: Actor = { who: 'Xero handoff', role: 'system', source: 'system' }

const HANDOFF_FAULT = {
  code: 'handoffFault',
  message:
    'Xero handoff failed (simulated fault). The invoice and its ledger pair stand, not yet in Xero. Resolve and retry from the billing monitor.',
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
 * Mirror one ledger pair in Xero (catch-up Phase 36; US-09.1.1, FT-09.1): the
 * ACCREC built from the receivable leg, the ACCPAY from the payable leg (to
 * its stamped payee: the anaesthetist, or the AA Holding account's contact),
 * the legs' mirror ids stamped in the same mutate. An `aaFee` pair gets its
 * 16-style ACCREC and no ACCPAY. The hand-off never creates, amends or deletes
 * ledger money: it only stamps mirror ids and clears `handoffFailure`.
 * Idempotent (a mirrored pair is a no-op); a fault is recorded on the pair,
 * which stands, "Not yet in Xero". Audited source=system.
 */
export function handoffPair(api: AppStoreApi, pairId: string): Outcome<HandoffResult> {
  const state = api.getState()
  const pair = state.billing.ledger[pairId]
  if (pair === undefined) return refuse('notFound', 'Ledger pair not found.')
  // Idempotent: already mirrored.
  if (pair.receivable.xeroAccRecId !== undefined) {
    const accPayId = isBookingPair(pair) ? pair.payable?.xeroAccPayId : undefined
    return ok({ accRecId: pair.receivable.xeroAccRecId, ...(accPayId !== undefined ? { accPayId } : {}) })
  }
  if (isAaFeePair(pair)) return handoffAaFeePair(api, pair)
  const invoice = state.billing.invoices[pair.invoiceId]
  if (invoice === undefined) return refuse('noInvoice', 'The pair invoice was not found.')
  // The payee stamped on the pair (catch-up Phase 25's lock); a prepayment's ACCPAY names the List's anaesthetist at the time, as 27 left it.
  const payeeRecord = payeeRecordFor(state, pair)
  if (payeeRecord === undefined && pair.payable !== undefined) {
    return refuse('noAnaesthetist', 'Could not resolve the anaesthetist payee for this pair.')
  }

  // Fault path: record the fault, clear the flag, create no Xero records (all one mutate). A fault
  // scoped to one Booking (`failHandoffBookingId`, catch-up Phase 25's staged failure) waits for it.
  const scoped = state.settings.failHandoffBookingId
  if (state.settings.failNextHandoff === true && (scoped === undefined || scoped === pair.bookingId)) {
    mutate(
      api,
      HANDOFF_ACTOR,
      { entityType: 'ledgerPair', entityId: pairId, action: 'xero.handoffFailed', after: { ...HANDOFF_FAULT } },
      (s) => {
        const existing = s.billing.ledger[pairId]
        if (existing === undefined) return {}
        const { failHandoffBookingId: _scoped, ...rest } = s.settings
        return {
          billing: { ...s.billing, ledger: { ...s.billing.ledger, [pairId]: { ...existing, handoffFailure: { ...HANDOFF_FAULT } } } },
          settings: { ...rest, failNextHandoff: false },
        }
      },
    )
    return ok({ failed: true })
  }

  const payerSpec = payerContactSpec(invoice.counterparty, state.masters)
  // A prepayment's payable credits the AA Holding account, not the anaesthetist (FT-06.3, D38; catch-up Phases 27, 27a).
  const toHolding = pair.payable !== undefined && isHoldingLeg(pair.payable)
  const payeeSpec = payeeRecord === undefined ? undefined : toHolding ? holdingAccountContactSpec() : anaesthetistContactSpec({ registrationNumber: payeeRecord.anaesthetistId, name: payeeRecord.name })

  const metas: MutationMeta[] = []
  let out: HandoffResult = {}
  mutate(api, HANDOFF_ACTOR, metas, (s) => {
    const existing = s.billing.ledger[pairId]
    if (existing === undefined || !isBookingPair(existing) || existing.receivable.xeroAccRecId !== undefined) {
      // Raced/no-op: a prior commit already mirrored this. An audit-only note so the mutate has its entry.
      metas.push({ entityType: 'ledgerPair', entityId: pairId, action: 'xero.handoffNoop' })
      return {}
    }
    let counters = s.counters
    const contacts = { ...s.xero.contacts }
    const accRecs = { ...s.xero.accRecs }
    const accPays = { ...s.xero.accPays }
    const cache = { ...s.billing.contactIdCache }

    const payer = resolveContactInto(payerSpec, contacts, cache, counters)
    counters = payer.counters
    metas.push(contactResolvedMeta(payer.contactId, payerSpec, payer))

    const r = existing.receivable
    const issuedAtISO = clockISO(s.clock)
    const xr = allocateId(counters, 'xeroAccRec')
    counters = xr.counters
    // A no-charge invoice (catch-up Phase 24): a $0.00 receivable, nothing owed so marked paid, no payable, no BCTI.
    const noCharge = existing.payable === undefined
    accRecs[xr.id] = {
      id: xr.id,
      kind: 'procedure',
      invoiceId: invoice.id,
      contactId: payer.contactId,
      invoiceNumber: r.number,
      reference: existing.id,
      issuedAtISO,
      amountDue: r.amount,
      amountReceived: r.receivedAmount,
      ...(noCharge ? { paidAtISO: r.paidInAtISO ?? issuedAtISO } : {}),
      status: noCharge ? 'paid' : 'awaitingPayment',
    }
    const next = { ...existing, receivable: { ...r, xeroAccRecId: xr.id } }
    delete next.handoffFailure
    out = { accRecId: xr.id }

    if (existing.payable !== undefined && payeeSpec !== undefined && payeeRecord !== undefined) {
      const payee = resolveContactInto(payeeSpec, contacts, cache, counters)
      counters = payee.counters
      metas.push(contactResolvedMeta(payee.contactId, payeeSpec, payee))
      const xp = allocateId(counters, 'xeroAccPay')
      counters = xp.counters
      const p = existing.payable
      accPays[xp.id] = {
        id: xp.id,
        accRecId: xr.id,
        contactId: payee.contactId,
        invoiceNumber: p.number,
        reference: existing.id,
        issuedAtISO,
        anaesthetistId: payeeRecord.anaesthetistId,
        amountPayable: p.amount,
        amountAuthorised: p.releasedAmount,
        amountDisbursed: p.disbursedAmount,
        status: 'draft',
        ...(toHolding ? { payeeAccount: AA_HOLDING_ACCOUNT.payeeAccount } : {}),
        // The ACCPAY stands as the buyer-created tax invoice (US-09.1.4; provisional, OQ-29): one per receivable, the same value.
        taxInvoice: buyerCreatedTaxInvoiceFor(invoice, payeeRecord.supplier),
      }
      next.payable = { ...p, xeroAccPayId: xp.id }
      out = { accRecId: xr.id, accPayId: xp.id }
    }

    metas.push({
      entityType: 'ledgerPair',
      entityId: pairId,
      action: 'xero.pairCreated',
      after: {
        accRecId: out.accRecId,
        ...(out.accPayId !== undefined ? { accPayId: out.accPayId } : {}),
        invoiceNumber: r.number,
        payerContactId: payer.contactId,
        amountDue: r.amount,
        ...(existing.payable !== undefined ? { amountPayable: existing.payable.amount, taxInvoiceProvisional: true } : { noCharge: true }),
      },
    })

    return {
      xero: { ...s.xero, contacts, accRecs, accPays },
      billing: { ...s.billing, ledger: { ...s.billing.ledger, [pairId]: next }, contactIdCache: cache },
      counters,
    }
  })

  return ok(out)
}

/** An AA fee pair's mirror: a `kind:'aaFee'` ACCREC against the anaesthetist's existing contact, no ACCPAY (16's shape). */
function handoffAaFeePair(api: AppStoreApi, pair: AaFeeLedgerPair): Outcome<HandoffResult> {
  const state = api.getState()
  const fee = state.billing.aaFeeInvoices[pair.aaFeeInvoiceId]
  const anaesthetist = state.masters.anaesthetists[pair.anaesthetistId]
  if (fee === undefined || anaesthetist === undefined) return refuse('notFound', 'The AA fee invoice or its anaesthetist was not found.')
  const spec = anaesthetistContactSpec(anaesthetist)
  const metas: MutationMeta[] = []
  let accRecId: string | undefined
  mutate(api, HANDOFF_ACTOR, metas, (s) => {
    const existing = s.billing.ledger[pair.id]
    if (existing === undefined || !isAaFeePair(existing) || existing.receivable.xeroAccRecId !== undefined) {
      metas.push({ entityType: 'ledgerPair', entityId: pair.id, action: 'xero.handoffNoop' })
      return {}
    }
    let counters = s.counters
    const contacts = { ...s.xero.contacts }
    const cache = { ...s.billing.contactIdCache }
    const contact = resolveContactInto(spec, contacts, cache, counters)
    counters = contact.counters
    metas.push(contactResolvedMeta(contact.contactId, spec, contact))
    const xr = allocateId(counters, 'xeroAccRec')
    counters = xr.counters
    accRecId = xr.id
    const accRec = aaFeeAccRecFor(fee, existing, { accRecId: xr.id, contactId: contact.contactId, issuedAtISO: fee.raisedAtISO })
    const next = { ...existing, receivable: { ...existing.receivable, xeroAccRecId: xr.id } }
    delete next.handoffFailure
    metas.push({ entityType: 'aaFeeInvoice', entityId: fee.id, action: 'xero.pairCreated', after: { accRecId: xr.id, invoiceNumber: fee.invoiceNumber, amountDue: fee.total, kind: 'aaFee' } })
    return {
      xero: { ...s.xero, contacts, accRecs: { ...s.xero.accRecs, [xr.id]: accRec } },
      billing: { ...s.billing, ledger: { ...s.billing.ledger, [pair.id]: next }, contactIdCache: cache },
      counters,
    }
  })
  return ok(accRecId !== undefined ? { accRecId } : {})
}

/** Mirror every pair of a Booking not yet in Xero. Idempotent. */
export function handoffPairsForBooking(api: AppStoreApi, bookingId: string): void {
  for (const p of pairsForBooking(api.getState(), bookingId)) {
    if (p.receivable.xeroAccRecId === undefined) handoffPair(api, p.id)
  }
}

/**
 * Mirror every pair of a just-run List (Phase 10). Reads the committed pairs
 * through a fresh `getState()` (the run committed synchronously before this).
 * Idempotent per pair; a fault is recorded on the pair.
 */
export function handoffListPairs(api: AppStoreApi, listId: string): void {
  for (const p of pairsForList(api.getState(), listId)) {
    if (p.receivable.xeroAccRecId === undefined) handoffPair(api, p.id)
  }
}

/**
 * Who a pair's ACCPAY names, with the details its BCTI prints (catch-up Phase
 * 25, DM-42): the payee stamped on the pair, from the Booking's lock. A
 * prepayment's ACCPAY credits the AA Holding account and names the List's
 * anaesthetist at the time (27), never its payee.
 */
function payeeRecordFor(state: Pick<AppState, 'schedule' | 'masters' | 'billing'>, pair: BookingLedgerPair): LockedPayee | undefined {
  const stamped = pair.payable !== undefined ? payeeAnaesthetistOf(pair.payable) : undefined
  if (stamped !== undefined) {
    const locked = state.billing.locks[pair.bookingId]?.payee
    if (locked !== undefined && locked.anaesthetistId === stamped) return locked
    const a = state.masters.anaesthetists[stamped]
    return a !== undefined ? { anaesthetistId: a.registrationNumber, name: a.name, supplier: supplierFor(a) } : undefined
  }
  const booking = state.schedule.bookings[pair.bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const anaesthetist = list?.anaesthetistId !== undefined ? state.masters.anaesthetists[list.anaesthetistId] : undefined
  return anaesthetist !== undefined ? { anaesthetistId: anaesthetist.registrationNumber, name: anaesthetist.name, supplier: supplierFor(anaesthetist) } : undefined
}

const JOURNAL_FAULT = {
  code: 'journalFault',
  message: 'Xero did not accept the transfer journal (simulated fault). The transfer stands; resolve and retry from the billing monitor.',
}

/**
 * Mirror a prepayment transfer to Xero (catch-up Phase 27a; US-06.5.1,
 * US-09.1.3): a simulated manual journal, `MJ-` numbered, two lines (debit the
 * AA Holding account's payable, credit the anaesthetist's), referencing the
 * prepayment invoice number and never naming the patient (convention 8). How
 * the real system posts the move is still open (US-06.5.1's Technical
 * discussion): it is kept in this one function. The same shape as
 * `handoffPair`: one mutate, idempotent (a posted transfer is a no-op), a fault
 * recorded on the transfer and never thrown (`failNextHandoff`, scoped to a
 * Booking by `failHandoffBookingId`), retried by the Billing monitor.
 */
export function postTransferJournal(api: AppStoreApi, transferId: string): Outcome<{ journalId?: string; failed?: boolean }> {
  const state = api.getState()
  const transfer = state.billing.transfers[transferId]
  if (transfer === undefined) return refuse('notFound', 'Transfer not found.')
  if (transfer.xeroJournalId !== undefined) return ok({ journalId: transfer.xeroJournalId })
  const invoice = state.billing.invoices[transfer.invoiceId]
  const toId = payeeAnaesthetistOf(transfer.in)
  const anaesthetist = toId !== undefined ? state.masters.anaesthetists[toId] : undefined
  if (invoice === undefined || anaesthetist === undefined) return refuse('notFound', 'The transfer has no invoice or anaesthetist to post against.')

  const scoped = state.settings.failHandoffBookingId
  if (state.settings.failNextHandoff === true && (scoped === undefined || scoped === transfer.bookingId)) {
    mutate(api, HANDOFF_ACTOR, { entityType: 'ledgerPair', entityId: transfer.collectPairId, action: 'xero.journalFailed', after: { transferId, ...JOURNAL_FAULT } }, (s) => {
      const existing = s.billing.transfers[transferId]
      if (existing === undefined) return {}
      const { failHandoffBookingId: _scoped, ...rest } = s.settings
      return {
        billing: { ...s.billing, transfers: { ...s.billing.transfers, [transferId]: { ...existing, journalFailure: { ...JOURNAL_FAULT } } } },
        settings: { ...rest, failNextHandoff: false },
      }
    })
    return ok({ failed: true })
  }

  const holdingSpec = holdingAccountContactSpec()
  const anaesthetistSpec = anaesthetistContactSpec(anaesthetist)
  const metas: MutationMeta[] = []
  let journalId: string | undefined
  mutate(api, HANDOFF_ACTOR, metas, (s) => {
    const existing = s.billing.transfers[transferId]
    if (existing === undefined || existing.xeroJournalId !== undefined) {
      metas.push({ entityType: 'ledgerPair', entityId: transfer.collectPairId, action: 'xero.journalNoop' })
      return {}
    }
    let counters = s.counters
    const contacts = { ...s.xero.contacts }
    const cache = { ...s.billing.contactIdCache }
    const holding = resolveContactInto(holdingSpec, contacts, cache, counters)
    counters = holding.counters
    metas.push(contactResolvedMeta(holding.contactId, holdingSpec, holding))
    const payee = resolveContactInto(anaesthetistSpec, contacts, cache, counters)
    counters = payee.counters
    metas.push(contactResolvedMeta(payee.contactId, anaesthetistSpec, payee))
    const xj = allocateId(counters, 'xeroJournal')
    counters = xj.counters
    const mj = allocateId(counters, 'xeroJournalNumber')
    counters = mj.counters
    journalId = xj.id
    const description = `Transfer of prepayment ${invoice.invoiceNumber}`
    const journals = {
      ...s.xero.journals,
      [xj.id]: {
        id: xj.id,
        journalNumber: mj.id,
        transferId,
        reference: invoice.invoiceNumber,
        dateISO: existing.createdAtISO,
        lines: [
          { contactId: holding.contactId, description, debit: existing.in.amount, credit: 0 },
          { contactId: payee.contactId, description, debit: 0, credit: existing.in.amount },
        ],
      },
    }
    const posted = { ...existing, xeroJournalId: xj.id }
    delete posted.journalFailure
    metas.push({
      entityType: 'ledgerPair',
      entityId: existing.collectPairId,
      action: 'xero.journalPosted',
      after: { transferId, journalNumber: mj.id, reference: invoice.invoiceNumber, amount: existing.in.amount },
    })
    return {
      xero: { ...s.xero, contacts, journals },
      billing: { ...s.billing, contactIdCache: cache, transfers: { ...s.billing.transfers, [transferId]: posted } },
      counters,
    }
  })
  return ok(journalId !== undefined ? { journalId } : {})
}

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
 *  - THE GATE (catch-up Phase 37, EP-09; amends Phase 10's D-handoff): every
 *    hand-off passes `handoffPair`. During a Xero outage, or with the demo
 *    fault armed, the call is written to the Xero sync queue with its failed
 *    attempt and retried with backoff on the demo clock (`xeroQueue.ts`); the
 *    pair and its money stand ("Not yet in Xero", waiting for Xero). There is
 *    no fault flag on the pair and no manual "Resolve & retry" for a hand-off.
 *
 * One `mutate`, `source:'system'` audit (`xero.contactResolved`, `xero.pairCreated`).
 *
 * THE CORRECTION (catch-up Phase 39; US-08.6.2 "Both sides move"): a credit's
 * Xero side is `handoffCorrection`, through the same gate and queue: in one
 * mutate the original's ACCREC is credited (an ACCRECCREDIT) and its ACCPAY
 * voided or credited (an ACCPAYCREDIT), and every replacement's pair is
 * created by the same mirror code as `createXeroPair` (`mirrorPairInto`). A
 * replacement's pair is never handed off on its own: `handoffPair` routes it to
 * its correction, and refuses a credited pair.
 */

import { buyerCreatedTaxInvoiceFor, supplierFor } from '../domain/billing/invoicePresentation'
import type { AaFeeLedgerPair, Anaesthetist, Booking, BookingLedgerPair, CounterpartyRef, LedgerPair, XeroAccPay, XeroAccRec, XeroContact, XeroCreditNote } from '../domain/types'
import { isAaFeePair, isBookingPair, isHoldingLeg, payeeAnaesthetistOf } from '../domain/billing/ledger'
import { xeroCorrectionPlan } from '../domain/billing/creditNote'
import { CREDIT_MESSAGES } from '../shared/procedureEventCopy'
import { aaFeeAccRecFor } from '../domain/billing/aaFee'
import type { LockedPayee } from '../domain/billing/lock'
import { AA_HOLDING_ACCOUNT } from '../domain/billing/prepayment'
import { xeroIndividualContactName } from '../domain/xeroContact'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { counterpartyName } from './selectors'
import { correctionQueuedFor, handoffQueuedFor, journalQueuedFor, pairForInvoice, pairsForBooking, pairsForList } from './ledgerSelectors'
import { enqueueXeroWork, gateFor } from './xeroGate'

const HANDOFF_ACTOR: Actor = { who: 'Xero handoff', role: 'system', source: 'system' }

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
  /** The call went to the Xero sync queue instead (outage or the armed fault); the queue retries it. */
  queued?: boolean
  queueItemId?: string
}

/** A mirrored pair's ids, or undefined while it is not in Xero. */
function mirroredIds(pair: LedgerPair): HandoffResult | undefined {
  if (pair.receivable.xeroAccRecId === undefined) return undefined
  const accPayId = isBookingPair(pair) ? pair.payable?.xeroAccPayId : undefined
  return { accRecId: pair.receivable.xeroAccRecId, ...(accPayId !== undefined ? { accPayId } : {}) }
}

/**
 * Hand one ledger pair off to Xero, through the gate (catch-up Phase 37;
 * EP-09). Every caller (the billing run's `handoffListPairs`, a retried
 * Booking, the prepayment raise, the AA fee run) comes here. Xero available:
 * the pair is mirrored now (`createXeroPair`). Xero unavailable, or the demo
 * fault armed for this pair: the call is written to the Xero sync queue with
 * its first failed attempt and retried with backoff on the demo clock, and
 * the result says `queued`. The ledger pair stands either way, so
 * authorising a List is never blocked by Xero. Idempotent: a mirrored pair is
 * a no-op, and a pair already queued is not queued twice.
 */
export function handoffPair(api: AppStoreApi, pairId: string): Outcome<HandoffResult> {
  const state = api.getState()
  const pair = state.billing.ledger[pairId]
  if (pair === undefined) return refuse('notFound', 'Ledger pair not found.')
  const mirrored = mirroredIds(pair)
  if (mirrored !== undefined) return ok(mirrored)
  // A credited pair (catch-up Phase 39) is never mirrored afterwards: its credit cancelled it.
  if (isBookingPair(pair) && pair.credit !== undefined) return refuse('invoiceCredited', CREDIT_MESSAGES.invoiceCredited)
  if (handoffQueuedFor(state, pairId) !== undefined) return ok({ queued: true })
  // A replacement issued with a credit goes to Xero with its correction, never on its own.
  const correction = isBookingPair(pair) ? correctionOfReplacement(state, pair.invoiceId) : undefined
  if (correction !== undefined) {
    const out = handoffCorrection(api, correction)
    if (!out.ok) return out
    const now = mirroredIds(api.getState().billing.ledger[pairId]!)
    return ok(now ?? { queued: true })
  }
  const verdict = gateFor(state, { ...(isBookingPair(pair) ? { bookingId: pair.bookingId } : {}) })
  if (!verdict.go) {
    const queued = enqueueXeroWork(api, { kind: 'handoff', idempotencyKey: `HANDOFF-${pairId}`, target: { pairId }, lastError: verdict.error, consumesFault: verdict.consumesFault })
    return queued.ok ? ok({ queued: true, queueItemId: queued.value.itemId }) : queued
  }
  return createXeroPair(api, pairId)
}

/**
 * Mirror one ledger pair in Xero (catch-up Phase 36; US-09.1.1, FT-09.1): the
 * ACCREC built from the receivable leg, the ACCPAY from the payable leg (to
 * its stamped payee: the anaesthetist, or the AA Holding account's contact),
 * the legs' mirror ids stamped in the same mutate. An `aaFee` pair gets its
 * 16-style ACCREC and no ACCPAY. The hand-off never creates, amends or deletes
 * ledger money: it only stamps mirror ids. Idempotent (a mirrored pair is a
 * no-op). The gate (`handoffPair`) and the Xero sync queue call it; nothing
 * else does. Audited source=system.
 */
export function createXeroPair(api: AppStoreApi, pairId: string): Outcome<HandoffResult> {
  const state = api.getState()
  const pair = state.billing.ledger[pairId]
  if (pair === undefined) return refuse('notFound', 'Ledger pair not found.')
  // Idempotent: already mirrored.
  const mirrored = mirroredIds(pair)
  if (mirrored !== undefined) return ok(mirrored)
  if (isAaFeePair(pair)) return handoffAaFeePair(api, pair)
  // A credited pair not yet in Xero (catch-up Phase 39): nothing to mirror, its credit cancelled it (a queued hand-off completes as a no-op).
  if (isBookingPair(pair) && pair.credit !== undefined) return ok({})
  const ready = mirrorReadiness(state, pair)
  if (!ready.ok) return ready

  const metas: MutationMeta[] = []
  let out: HandoffResult = {}
  mutate(api, HANDOFF_ACTOR, metas, (s) => {
    const existing = s.billing.ledger[pairId]
    if (existing === undefined || !isBookingPair(existing) || existing.receivable.xeroAccRecId !== undefined) {
      // Raced/no-op: a prior commit already mirrored this. An audit-only note so the mutate has its entry.
      metas.push({ entityType: 'ledgerPair', entityId: pairId, action: 'xero.handoffNoop' })
      return {}
    }
    const work = mirrorWorkOf(s)
    out = mirrorPairInto(s, work, pairId, metas)
    return mirrorPatch(s, work)
  })

  return ok(out)
}

/** The recipe-local copies a mirror writes (contacts, the ACCREC and ACCPAY maps, the ledger, the contact cache, the counters). */
export interface MirrorWork {
  counters: Record<string, number>
  contacts: Record<string, XeroContact>
  accRecs: Record<string, XeroAccRec>
  accPays: Record<string, XeroAccPay>
  creditNotes: Record<string, XeroCreditNote>
  cache: Record<string, string>
  ledger: Record<string, LedgerPair>
}

function mirrorWorkOf(s: AppState): MirrorWork {
  return {
    counters: s.counters,
    contacts: { ...s.xero.contacts },
    accRecs: { ...s.xero.accRecs },
    accPays: { ...s.xero.accPays },
    creditNotes: { ...s.xero.creditNotes },
    cache: { ...s.billing.contactIdCache },
    ledger: { ...s.billing.ledger },
  }
}

function mirrorPatch(s: AppState, work: MirrorWork): Pick<AppState, 'xero' | 'billing' | 'counters'> {
  return {
    xero: { ...s.xero, contacts: work.contacts, accRecs: work.accRecs, accPays: work.accPays, creditNotes: work.creditNotes },
    billing: { ...s.billing, ledger: work.ledger, contactIdCache: work.cache },
    counters: work.counters,
  }
}

/** Whether a Booking pair can be mirrored: its invoice exists and its payee resolves. */
function mirrorReadiness(state: Pick<AppState, 'schedule' | 'masters' | 'billing'>, pair: BookingLedgerPair): Outcome<undefined> {
  if (state.billing.invoices[pair.invoiceId] === undefined) return refuse('noInvoice', 'The pair invoice was not found.')
  if (payeeRecordFor(state, pair) === undefined && pair.payable !== undefined) return refuse('noAnaesthetist', 'Could not resolve the anaesthetist payee for this pair.')
  return ok(undefined)
}

/**
 * Mirror one Booking pair into `work` (the body `createXeroPair` and the
 * correction share; catch-up Phase 39 extracted it): the ACCREC from the
 * receivable leg, the ACCPAY from the payable leg (to its stamped payee: the
 * anaesthetist, or the AA Holding account's contact), the legs' mirror ids
 * stamped. Never creates, amends or deletes ledger money. A pair already
 * mirrored, or not ready, is left as it is.
 */
export function mirrorPairInto(s: AppState, work: MirrorWork, pairId: string, metas: MutationMeta[]): HandoffResult {
  const existing = work.ledger[pairId]
  if (existing === undefined || !isBookingPair(existing)) return {}
  if (existing.receivable.xeroAccRecId !== undefined) return mirroredIds(existing) ?? {}
  const invoice = s.billing.invoices[existing.invoiceId]
  // The payee stamped on the pair (catch-up Phase 25's lock); a prepayment's ACCPAY names the List's anaesthetist at the time, as 27 left it.
  const payeeRecord = payeeRecordFor(s, existing)
  if (invoice === undefined || (payeeRecord === undefined && existing.payable !== undefined)) return {}

  const payerSpec = payerContactSpec(invoice.counterparty, s.masters)
  // A prepayment's payable credits the AA Holding account, not the anaesthetist (FT-06.3, D38; catch-up Phases 27, 27a).
  const toHolding = existing.payable !== undefined && isHoldingLeg(existing.payable)
  const payeeSpec = payeeRecord === undefined ? undefined : toHolding ? holdingAccountContactSpec() : anaesthetistContactSpec({ registrationNumber: payeeRecord.anaesthetistId, name: payeeRecord.name })

  const payer = resolveContactInto(payerSpec, work.contacts, work.cache, work.counters)
  work.counters = payer.counters
  metas.push(contactResolvedMeta(payer.contactId, payerSpec, payer))

  const r = existing.receivable
  const issuedAtISO = clockISO(s.clock)
  const xr = allocateId(work.counters, 'xeroAccRec')
  work.counters = xr.counters
  // A no-charge invoice (catch-up Phase 24): a $0.00 receivable, nothing owed so marked paid, no payable, no BCTI.
  const noCharge = existing.payable === undefined
  work.accRecs[xr.id] = {
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
  let out: HandoffResult = { accRecId: xr.id }

  if (existing.payable !== undefined && payeeSpec !== undefined && payeeRecord !== undefined) {
    const payee = resolveContactInto(payeeSpec, work.contacts, work.cache, work.counters)
    work.counters = payee.counters
    metas.push(contactResolvedMeta(payee.contactId, payeeSpec, payee))
    const xp = allocateId(work.counters, 'xeroAccPay')
    work.counters = xp.counters
    const p = existing.payable
    work.accPays[xp.id] = {
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
  work.ledger[pairId] = next
  return out
}

// ---------------------------------------------------------------------------
// The correction (catch-up Phase 39; US-08.6.2 "Both sides move")
// ---------------------------------------------------------------------------

/** The credit note a replacement invoice was issued with, while its correction has not reached Xero. */
function correctionOfReplacement(state: Pick<AppState, 'billing'>, invoiceId: string): string | undefined {
  const note = Object.values(state.billing.creditNotes).find((c) => c.replacementInvoiceIds.includes(invoiceId))
  return note !== undefined && note.xero === undefined ? note.id : undefined
}

/** The pairs a correction creates: one per replacement invoice. */
function replacementPairIds(state: Pick<AppState, 'billing'>, creditNoteId: string): string[] {
  const note = state.billing.creditNotes[creditNoteId]
  if (note === undefined) return []
  return note.replacementInvoiceIds.flatMap((id) => {
    const pair = pairForInvoice(state, id)
    return pair !== undefined ? [pair.id] : []
  })
}

export interface CorrectionHandoffResult {
  accRecCreditNoteId?: string
  accPayCreditNoteId?: string
  accPayVoided?: boolean
  /** The replacement pairs mirrored with it. */
  pairIds?: string[]
  /** The correction went to the Xero sync queue (outage or the armed fault); the queue retries it. */
  queued?: boolean
  queueItemId?: string
}

/**
 * Hand a credit's correction to Xero, through the gate (catch-up Phase 37's
 * queue): Xero available, the reversal and every replacement's pair land in
 * one commit (`createXeroCorrection`). Xero unavailable, or the demo fault
 * armed (`failNextHandoff`, which faults the whole correction, so nothing is
 * reversed or created in Xero): the call is written to the Xero sync queue
 * (kind `correction`, its pairs reading "waiting for Xero") and the failure is
 * recorded on the credit note (`xeroFailure`) until it lands; the queue's
 * retry (and the monitor's Retry now) runs `createXeroCorrection` again, so
 * the retry reverses and re-creates together. Idempotent: a correction in
 * Xero is a no-op, and one already queued is not queued twice.
 */
export function handoffCorrection(api: AppStoreApi, creditNoteId: string): Outcome<CorrectionHandoffResult> {
  const state = api.getState()
  const note = state.billing.creditNotes[creditNoteId]
  if (note === undefined) return refuse('notFound', 'Credit note not found.')
  if (note.xero !== undefined) return ok(correctionResultOf(state, creditNoteId))
  if (correctionQueuedFor(state, creditNoteId) !== undefined) return ok({ queued: true })
  const verdict = gateFor(state, { bookingId: note.bookingId })
  if (!verdict.go) {
    const queued = enqueueXeroWork(api, {
      kind: 'correction',
      idempotencyKey: `CORRECTION-${creditNoteId}`,
      target: { creditNoteId, pairId: note.pairId, pairIds: [note.pairId, ...replacementPairIds(state, creditNoteId)] },
      lastError: verdict.error,
      consumesFault: verdict.consumesFault,
    })
    if (!queued.ok) return queued
    mutate(
      api,
      HANDOFF_ACTOR,
      { entityType: 'creditNote', entityId: creditNoteId, action: 'creditNote.xeroWaiting', after: { creditNoteNumber: note.creditNoteNumber, queueItemId: queued.value.itemId, error: verdict.error }, stampBookingId: null },
      (s) => {
        const now = s.billing.creditNotes[creditNoteId]!
        return { billing: { ...s.billing, creditNotes: { ...s.billing.creditNotes, [creditNoteId]: { ...now, xeroFailure: { code: verdict.consumesFault ? 'fault' : 'outage', message: verdict.error } } } } }
      },
    )
    return ok({ queued: true, queueItemId: queued.value.itemId })
  }
  return createXeroCorrection(api, creditNoteId)
}

function correctionResultOf(state: Pick<AppState, 'billing'>, creditNoteId: string): CorrectionHandoffResult {
  const x = state.billing.creditNotes[creditNoteId]?.xero
  return {
    ...(x?.accRecCreditNoteId !== undefined ? { accRecCreditNoteId: x.accRecCreditNoteId } : {}),
    ...(x?.accPayCreditNoteId !== undefined ? { accPayCreditNoteId: x.accPayCreditNoteId } : {}),
    ...(x !== undefined ? { accPayVoided: x.accPayVoided } : {}),
    pairIds: replacementPairIds(state, creditNoteId),
  }
}

/**
 * The correction in Xero, one mutate (actor "Xero handoff", source system):
 * `xeroCorrectionPlan` applied to the original's mirror (the ACCRECCREDIT
 * allocated against the ACCREC, which becomes `credited`; a draft ACCPAY
 * `voided`, or an ACCPAYCREDIT `${number}-P` against an authorised or paid one,
 * which becomes `credited`) and every replacement's pair mirrored by
 * `mirrorPairInto`. Each Xero credit note carries the engine's credit note id,
 * so 37's divergence check never reads it as drift. An original never handed
 * off has nothing to reverse: only the new pairs are created. Audited
 * `xero.creditNoteCreated`, `xero.accPayVoided` or `xero.accPayCredited`, and
 * `xero.pairCreated` per new pair. The gate and the queue call it. Idempotent.
 */
export function createXeroCorrection(api: AppStoreApi, creditNoteId: string): Outcome<CorrectionHandoffResult> {
  const state = api.getState()
  const note = state.billing.creditNotes[creditNoteId]
  if (note === undefined) return refuse('notFound', 'Credit note not found.')
  if (note.xero !== undefined) return ok(correctionResultOf(state, creditNoteId))
  const original = state.billing.ledger[note.pairId]
  if (original === undefined || !isBookingPair(original)) return refuse('notFound', 'Ledger pair not found.')
  const pairIds = replacementPairIds(state, creditNoteId)
  for (const id of pairIds) {
    const pair = state.billing.ledger[id]
    if (pair !== undefined && isBookingPair(pair)) {
      const ready = mirrorReadiness(state, pair)
      if (!ready.ok) return ready
    }
  }

  const metas: MutationMeta[] = []
  mutate(api, HANDOFF_ACTOR, metas, (s) => {
    const nowNote = s.billing.creditNotes[creditNoteId]
    if (nowNote === undefined || nowNote.xero !== undefined) {
      metas.push({ entityType: 'creditNote', entityId: creditNoteId, action: 'xero.correctionNoop', stampBookingId: null })
      return {}
    }
    const work = mirrorWorkOf(s)
    const pair = work.ledger[nowNote.pairId] as BookingLedgerPair
    const accRecId = pair.receivable.xeroAccRecId
    const accPayId = pair.payable?.xeroAccPayId
    const accRec = accRecId !== undefined ? work.accRecs[accRecId] : undefined
    const accPay = accPayId !== undefined ? work.accPays[accPayId] : undefined
    const plan = xeroCorrectionPlan(accRec, accPay, { creditNoteNumber: nowNote.creditNoteNumber, total: nowNote.total })
    const issuedAtISO = clockISO(s.clock)
    let accRecCreditNoteId: string | undefined
    let accPayCreditNoteId: string | undefined
    let accPayVoided = false
    if (accRec !== undefined && plan.accRec !== undefined) {
      // The ACCRECCREDIT is addressed to the credit's party and allocated against the original ACCREC either way (the sim does not model a contact mismatch).
      const spec = payerContactSpec(nowNote.counterparty, s.masters)
      const contact = resolveContactInto(spec, work.contacts, work.cache, work.counters)
      work.counters = contact.counters
      metas.push(contactResolvedMeta(contact.contactId, spec, contact))
      const xcn = allocateId(work.counters, 'xeroCreditNote')
      work.counters = xcn.counters
      accRecCreditNoteId = xcn.id
      work.creditNotes[xcn.id] = {
        id: xcn.id,
        type: 'ACCRECCREDIT',
        creditNoteNumber: plan.accRec.creditNoteNumber,
        againstId: accRec.id,
        contactId: contact.contactId,
        reference: pair.id,
        creditNoteId,
        total: plan.accRec.total,
        allocated: plan.accRec.allocated,
        status: 'authorised',
        issuedAtISO,
      }
      work.accRecs[accRec.id] = { ...accRec, status: 'credited' }
      metas.push({
        entityType: 'creditNote',
        entityId: creditNoteId,
        action: 'xero.creditNoteCreated',
        after: { type: 'ACCRECCREDIT', creditNoteNumber: plan.accRec.creditNoteNumber, xeroCreditNoteId: xcn.id, againstInvoiceNumber: accRec.invoiceNumber, total: plan.accRec.total, allocated: plan.accRec.allocated, unallocated: plan.accRec.unallocated },
        stampBookingId: null,
      })
    }
    if (accPay !== undefined && plan.accPay.action === 'void') {
      accPayVoided = true
      work.accPays[accPay.id] = { ...accPay, status: 'voided' }
      metas.push({ entityType: 'xeroAccPay', entityId: accPay.id, action: 'xero.accPayVoided', before: { status: accPay.status }, after: { status: 'voided', invoiceNumber: accPay.invoiceNumber, creditNoteNumber: nowNote.creditNoteNumber }, stampBookingId: null })
    } else if (accPay !== undefined && plan.accPay.action === 'credit') {
      const xcn = allocateId(work.counters, 'xeroCreditNote')
      work.counters = xcn.counters
      accPayCreditNoteId = xcn.id
      work.creditNotes[xcn.id] = {
        id: xcn.id,
        type: 'ACCPAYCREDIT',
        creditNoteNumber: plan.accPay.creditNoteNumber,
        againstId: accPay.id,
        contactId: accPay.contactId,
        reference: pair.id,
        creditNoteId,
        total: plan.accPay.total,
        allocated: plan.accPay.allocated,
        status: 'authorised',
        issuedAtISO,
      }
      work.accPays[accPay.id] = { ...accPay, status: 'credited' }
      metas.push({
        entityType: 'xeroAccPay',
        entityId: accPay.id,
        action: 'xero.accPayCredited',
        before: { status: accPay.status },
        after: { status: 'credited', creditNoteNumber: plan.accPay.creditNoteNumber, xeroCreditNoteId: xcn.id, total: plan.accPay.total, allocated: plan.accPay.allocated, unallocated: plan.accPay.unallocated },
        stampBookingId: null,
      })
    }
    const mirroredPairs: string[] = []
    for (const id of pairIds) {
      const out = mirrorPairInto(s, work, id, metas)
      if (out.accRecId !== undefined) mirroredPairs.push(id)
    }
    if (metas.length === 0) metas.push({ entityType: 'creditNote', entityId: creditNoteId, action: 'xero.correctionNoop', stampBookingId: null })
    const { xeroFailure: _cleared, ...rest } = nowNote
    const nextNote = { ...rest, xero: { ...(accRecCreditNoteId !== undefined ? { accRecCreditNoteId } : {}), ...(accPayCreditNoteId !== undefined ? { accPayCreditNoteId } : {}), accPayVoided } }
    const negativeId = nowNote.negativeInvoiceId
    const negative = negativeId !== undefined ? s.billing.negativeInvoices[negativeId] : undefined
    const patch = mirrorPatch(s, work)
    return {
      ...patch,
      billing: {
        ...patch.billing,
        creditNotes: { ...s.billing.creditNotes, [creditNoteId]: nextNote },
        ...(negative !== undefined && accPayCreditNoteId !== undefined ? { negativeInvoices: { ...s.billing.negativeInvoices, [negative.id]: { ...negative, accPayCreditNoteId } } } : {}),
      },
    }
  })
  return ok(correctionResultOf(api.getState(), creditNoteId))
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

/**
 * Post a prepayment transfer's journal to Xero, through the gate (catch-up
 * Phase 37): posted now when Xero answers, else written to the Xero sync queue
 * (kind `journal`) and retried with backoff, as `handoffPair` does for a pair.
 * The transfer stands either way. Idempotent.
 */
export function postTransferJournal(api: AppStoreApi, transferId: string): Outcome<{ journalId?: string; queued?: boolean }> {
  const state = api.getState()
  const transfer = state.billing.transfers[transferId]
  if (transfer === undefined) return refuse('notFound', 'Transfer not found.')
  if (transfer.xeroJournalId !== undefined) return ok({ journalId: transfer.xeroJournalId })
  if (journalQueuedFor(state, transferId) !== undefined) return ok({ queued: true })
  const verdict = gateFor(state, { bookingId: transfer.bookingId })
  if (!verdict.go) {
    const queued = enqueueXeroWork(api, { kind: 'journal', idempotencyKey: `JOURNAL-${transferId}`, target: { transferId }, lastError: verdict.error, consumesFault: verdict.consumesFault })
    return queued.ok ? ok({ queued: true }) : queued
  }
  return createTransferJournal(api, transferId)
}

/**
 * Mirror a prepayment transfer to Xero (catch-up Phase 27a; US-06.5.1,
 * US-09.1.3): a simulated manual journal, `MJ-` numbered, two lines (debit the
 * AA Holding account's payable, credit the anaesthetist's), referencing the
 * prepayment invoice number and never naming the patient (convention 8). How
 * the real system posts the move is still open (US-06.5.1's Technical
 * discussion): it is kept in this one function. One mutate, idempotent (a
 * posted transfer is a no-op). The gate and the Xero sync queue call it.
 */
export function createTransferJournal(api: AppStoreApi, transferId: string): Outcome<{ journalId?: string }> {
  const state = api.getState()
  const transfer = state.billing.transfers[transferId]
  if (transfer === undefined) return refuse('notFound', 'Transfer not found.')
  if (transfer.xeroJournalId !== undefined) return ok({ journalId: transfer.xeroJournalId })
  const invoice = state.billing.invoices[transfer.invoiceId]
  const toId = payeeAnaesthetistOf(transfer.in)
  const anaesthetist = toId !== undefined ? state.masters.anaesthetists[toId] : undefined
  if (invoice === undefined || anaesthetist === undefined) return refuse('notFound', 'The transfer has no invoice or anaesthetist to post against.')

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

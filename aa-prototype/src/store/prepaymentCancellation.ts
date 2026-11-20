/**
 * Settling a prepayment automatically (catch-up Phase 41; US-06.5.2,
 * US-06.3.7, US-02.5.3's prepaid case; D56, D67, D53, D31, D85).
 *
 * One function, `settlePrepaymentInvoiceInto`, used by three callers, each in
 * its own commit:
 *  - `settlePrepaymentOnCancel`: inside `cancelBooking`'s `mutate`, for every
 *    actor. Each issued prepayment invoice on the Booking (one per payer) is
 *    credited in full through 39's issue path (`issueCreditInto`) and, for the
 *    money received, refunded in full to that invoice's payer from the AA
 *    Holding account (`canPayOutOfHolding('refund')`). Unpaid: the credit
 *    only, so the patient is not chased.
 *  - `settlePrepaidContractChange`: inside `setProcedureContract`'s commit, when
 *    the office moves a Procedure covered by an issued prepayment invoice onto
 *    a Contract that is not prepaid (OQ-119 answered, D67). The whole
 *    prepayment invoice is credited (D31: never a share); another prepaid
 *    Procedure on it then derives a fresh prepayment awaiting approval (27).
 *  - `refundLatePrepaymentPayment`: inside `receivePayment`'s commit, when money
 *    arrives on a prepayment invoice credited by either of the above: it is
 *    held for the payer and refunded straight back.
 *
 * The credit is an event on the Procedure raised by the system and issued at
 * once, with no review step (the catalogue makes it automatic). Nothing is
 * reversed against an anaesthetist: before 27a's transfer the payable is the
 * AA Holding account's (`creditTargetFor`). A cancel is never refused because
 * of a prepayment; a settlement that cannot be made is audited and the cancel
 * stands. The refund's Xero posting is one function, `postPrepaymentRefund`
 * (xeroHandoff.ts), called after the commit.
 */

import type { CreditCause, PrepaymentRefund, ProcedureEvent } from '../domain/types'
import { canPayOutOfHolding } from '../domain/billing/prepayHolding'
import { roundToCents, toCents } from '../domain/billing/money'
import { gstComponentOf, isBookingPair } from '../domain/billing/ledger'
import { allocateId, type MutationMeta } from './mutate'
import type { AppState } from './appStore'
import { issueCreditInto, type CreditRunDraft } from './creditActions'
import { livePrePaymentInvoicesForBooking, prePaymentInvoicesForBooking } from './selectors'
import { pairForInvoice } from './ledgerSelectors'

/** Who raises an automatic settlement. */
export const SETTLEMENT_ACTOR = { who: 'System', role: 'system' as const }

export const SETTLEMENT_REASON: Record<'prepaymentCancelled' | 'prepaidContractChanged', string> = {
  prepaymentCancelled: 'Booking cancelled: prepayment settled',
  prepaidContractChanged: 'Contract changed off prepaid after the prepayment invoice was sent',
}

type SettlementCause = Extract<CreditCause, 'prepaymentCancelled' | 'prepaidContractChanged'>

/** The slices a settlement writes, as a patch to merge into the caller's commit. */
export interface SettlementPatch {
  billing: AppState['billing']
  schedule: AppState['schedule']
  counters: AppState['counters']
}

export interface SettledInvoice {
  invoiceId: string
  creditNoteId?: string
  creditNoteNumber?: string
  refundId?: string
  refunded: number
  /** Why it could not be credited (the cancel or change stands; logged). */
  skipped?: string
}

/**
 * Credit one prepayment invoice in full and refund what was received, inside
 * the caller's commit. Reads and returns whole slices (`s` is the state after
 * the caller's own change). Idempotent: an invoice already credited is left
 * as it is.
 */
export function settlePrepaymentInvoiceInto(
  s: AppState,
  invoiceId: string,
  cause: SettlementCause,
  atISO: string,
  metas: MutationMeta[],
): { patch: SettlementPatch; settled: SettledInvoice } {
  const unchanged = { billing: s.billing, schedule: s.schedule, counters: s.counters }
  const invoice = s.billing.invoices[invoiceId]
  const pair = invoice !== undefined ? pairForInvoice(s, invoiceId) : undefined
  if (invoice === undefined || invoice.kind !== 'prePayment' || pair === undefined) return { patch: unchanged, settled: { invoiceId, refunded: 0, skipped: 'notFound' } }
  if (pair.credit !== undefined || Object.values(s.billing.creditNotes).some((c) => c.originalInvoiceId === invoiceId)) {
    return { patch: unchanged, settled: { invoiceId, refunded: 0, skipped: 'alreadyCredited' } }
  }

  // The credit event: raised by the system, approved at once (no review step), on the invoice's first Procedure.
  const eid = allocateId(s.counters, 'procedureEvent')
  const event: ProcedureEvent = {
    id: eid.id,
    procedureId: invoice.procedureIds?.[0] ?? '',
    bookingId: invoice.bookingId,
    kind: 'credit',
    occurredOnISO: s.clock.todayISO,
    billable: true,
    party: { sameAs: true },
    detail: { kind: 'credit', credit: { originalInvoiceId: invoiceId, reason: SETTLEMENT_REASON[cause], cause, replacementEventIds: [] } },
    review: { state: 'approved', by: { ...SETTLEMENT_ACTOR }, atISO },
    addedBy: { ...SETTLEMENT_ACTOR },
    addedAtISO: atISO,
  }
  const withEvent: AppState = { ...s, counters: eid.counters, schedule: { ...s.schedule, procedureEvents: { ...s.schedule.procedureEvents, [event.id]: event } } }
  const own: MutationMeta[] = []
  const draft: CreditRunDraft = {
    s: withEvent,
    counters: withEvent.counters,
    maps: { invoices: { ...s.billing.invoices }, invoiceLines: { ...s.billing.invoiceLines }, ledger: { ...s.billing.ledger } },
    procedureEvents: { ...withEvent.schedule.procedureEvents },
    creditNotes: { ...s.billing.creditNotes },
    negativeInvoices: { ...s.billing.negativeInvoices },
    transfers: { ...s.billing.transfers },
    metas: own,
  }
  const issued = issueCreditInto(draft, event.id, atISO)
  if (!issued.ok) {
    metas.push({ entityType: 'invoice', entityId: invoiceId, action: 'prepayment.settlementSkipped', after: { invoiceNumber: invoice.invoiceNumber, cause, reason: issued.message }, stampBookingId: null })
    return { patch: unchanged, settled: { invoiceId, refunded: 0, skipped: issued.message } }
  }
  metas.push(...own)
  const creditNoteId = issued.value.creditNoteId
  const note = draft.creditNotes[creditNoteId]!

  // The refund: everything received on it, paid out by the system from the AA Holding account (D56, D53).
  const prepaymentRefunds = { ...s.billing.prepaymentRefunds }
  let refundId: string | undefined
  let refunded = 0
  const pairRaw = draft.maps.ledger[pair.id]
  const pairNow = pairRaw !== undefined && isBookingPair(pairRaw) ? pairRaw : undefined
  const received = pairNow?.credit !== undefined ? roundToCents(pairNow.credit.heldForPayer - (pairNow.credit.refundedAmount ?? 0)) : 0
  if (pairNow !== undefined && pairNow.credit !== undefined && toCents(received) > 0 && canPayOutOfHolding('refund')) {
    const rid = allocateId(draft.counters, 'prepaymentRefund')
    draft.counters = rid.counters
    refundId = rid.id
    refunded = received
    const refund: PrepaymentRefund = {
      id: rid.id,
      bookingId: invoice.bookingId,
      prepaymentInvoiceId: invoiceId,
      creditNoteId,
      cause: cause === 'prepaymentCancelled' ? 'cancelled' : 'contractChanged',
      counterparty: invoice.counterparty,
      amount: received,
      paidAtISO: atISO,
    }
    prepaymentRefunds[rid.id] = refund
    draft.maps.ledger[pair.id] = { ...pairNow, credit: { ...pairNow.credit, refundedAmount: roundToCents((pairNow.credit.refundedAmount ?? 0) + received) } }
    metas.push({
      entityType: 'prepaymentRefund',
      entityId: rid.id,
      action: cause === 'prepaymentCancelled' ? 'prepaymentRefund.cancelled' : 'prepaymentRefund.contractChanged',
      after: { invoiceNumber: invoice.invoiceNumber, creditNoteNumber: note.creditNoteNumber, amount: received, to: invoice.billedTo?.name ?? invoice.counterparty.id, from: 'AA Holding account' },
      stampBookingId: null,
    })
  }

  return {
    patch: {
      billing: {
        ...s.billing,
        invoices: draft.maps.invoices,
        invoiceLines: draft.maps.invoiceLines,
        ledger: draft.maps.ledger,
        creditNotes: draft.creditNotes,
        negativeInvoices: draft.negativeInvoices,
        transfers: draft.transfers,
        prepaymentRefunds,
      },
      schedule: { ...withEvent.schedule, procedureEvents: draft.procedureEvents },
      counters: draft.counters,
    },
    settled: { invoiceId, creditNoteId, creditNoteNumber: note.creditNoteNumber, ...(refundId !== undefined ? { refundId } : {}), refunded },
  }
}

/**
 * Settle every issued prepayment invoice on a cancelled Booking (US-06.5.2),
 * inside `cancelBooking`'s commit; `s` already holds the cancellation. Audited
 * `booking.prepaymentSettled` as the system. A Booking with no issued
 * prepayment returns `s` unchanged and audits nothing.
 */
export function settlePrepaymentOnCancel(s: AppState, bookingId: string, atISO: string, metas: MutationMeta[]): { patch: SettlementPatch | null; settled: SettledInvoice[] } {
  const live = livePrePaymentInvoicesForBooking(s, bookingId).filter((i) => i.approval !== undefined)
  // A prepayment credited by hand earlier (39's credit, US-08.6.5) still holds what was received for the payer: the cancel refunds it in full.
  const liveIds = new Set(live.map((i) => i.id))
  const heldByHand = prePaymentInvoicesForBooking(s, bookingId).filter((i) => {
    if (liveIds.has(i.id)) return false
    const credit = pairForInvoice(s, i.id)?.credit
    return credit !== undefined && credit.reversedOn === undefined && toCents(credit.heldForPayer - (credit.refundedAmount ?? 0)) > 0
  })
  if (live.length === 0 && heldByHand.length === 0) return { patch: null, settled: [] }
  let state = s
  const settled: SettledInvoice[] = []
  for (const invoice of live) {
    const out = settlePrepaymentInvoiceInto(state, invoice.id, 'prepaymentCancelled', atISO, metas)
    state = { ...state, ...out.patch }
    settled.push(out.settled)
  }
  for (const invoice of heldByHand) {
    const out = refundHeldInto(state, invoice.id, atISO, metas)
    if (out === null) continue
    state = { ...state, ...out.patch }
    settled.push(out.settled)
  }
  const credited = settled.filter((x) => x.creditNoteNumber !== undefined)
  if (credited.length > 0) {
    metas.push({
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.prepaymentSettled',
      after: { creditNotes: credited.map((x) => x.creditNoteNumber), refunded: roundToCents(credited.reduce((c, x) => c + x.refunded, 0)), by: SETTLEMENT_ACTOR.who },
    })
  }
  return { patch: { billing: state.billing, schedule: state.schedule, counters: state.counters }, settled }
}

/** Refund what a by-hand credit holds for the payer on a prepayment invoice (on cancellation), out of the AA Holding account. */
function refundHeldInto(s: AppState, invoiceId: string, atISO: string, metas: MutationMeta[]): { patch: SettlementPatch; settled: SettledInvoice } | null {
  const invoice = s.billing.invoices[invoiceId]
  const pair = pairForInvoice(s, invoiceId)
  const note = Object.values(s.billing.creditNotes).find((c) => c.originalInvoiceId === invoiceId)
  if (invoice === undefined || pair === undefined || pair.credit === undefined || note === undefined || !canPayOutOfHolding('refund')) return null
  const amount = roundToCents(pair.credit.heldForPayer - (pair.credit.refundedAmount ?? 0))
  if (toCents(amount) <= 0) return null
  const rid = allocateId(s.counters, 'prepaymentRefund')
  const refund: PrepaymentRefund = { id: rid.id, bookingId: invoice.bookingId, prepaymentInvoiceId: invoiceId, creditNoteId: note.id, cause: 'cancelled', counterparty: invoice.counterparty, amount, paidAtISO: atISO }
  metas.push({
    entityType: 'prepaymentRefund',
    entityId: rid.id,
    action: 'prepaymentRefund.cancelled',
    after: { invoiceNumber: invoice.invoiceNumber, creditNoteNumber: note.creditNoteNumber, amount, to: invoice.billedTo?.name ?? invoice.counterparty.id, from: 'AA Holding account' },
    stampBookingId: null,
  })
  return {
    patch: {
      billing: {
        ...s.billing,
        ledger: { ...s.billing.ledger, [pair.id]: { ...pair, credit: { ...pair.credit, refundedAmount: roundToCents((pair.credit.refundedAmount ?? 0) + amount) } } },
        prepaymentRefunds: { ...s.billing.prepaymentRefunds, [rid.id]: refund },
      },
      schedule: s.schedule,
      counters: rid.counters,
    },
    settled: { invoiceId, creditNoteId: note.id, creditNoteNumber: note.creditNoteNumber, refundId: rid.id, refunded: amount },
  }
}

/**
 * A Procedure moved by the office onto a Contract that is not prepaid after its
 * prepayment invoice was sent or paid (US-06.3.7; OQ-119 answered, D67):
 * settled as a cancellation of that prepayment, inside `setProcedureContract`'s
 * commit; `s` already holds the new Contract. The whole invoice is credited
 * (D31). Audited `procedure.prepaymentSettled`.
 */
export function settlePrepaidContractChange(s: AppState, procedureId: string, prepaymentInvoiceId: string, atISO: string, metas: MutationMeta[]): { patch: SettlementPatch | null; settled?: SettledInvoice } {
  const out = settlePrepaymentInvoiceInto(s, prepaymentInvoiceId, 'prepaidContractChanged', atISO, metas)
  if (out.settled.creditNoteNumber === undefined) return { patch: null, settled: out.settled }
  metas.push({
    entityType: 'procedure',
    entityId: procedureId,
    action: 'procedure.prepaymentSettled',
    after: { creditNote: out.settled.creditNoteNumber, refunded: out.settled.refunded, by: SETTLEMENT_ACTOR.who },
  })
  return { patch: out.patch, settled: out.settled }
}

/** Whether money arriving on this invoice is refunded at once: a prepayment invoice credited by a cancellation or a Contract change. */
export function refundsLatePayment(s: Pick<AppState, 'billing'>, invoiceId: string): string | undefined {
  const note = Object.values(s.billing.creditNotes).find((c) => c.originalInvoiceId === invoiceId)
  return note !== undefined && (note.cause === 'prepaymentCancelled' || note.cause === 'prepaidContractChanged') ? note.id : undefined
}

/**
 * Money arriving after a cancellation's or a Contract change's credit (US-06.5.2
 * AC "a payment received after that credit note"), inside `receivePayment`'s
 * commit: the receipt is recorded and held for the payer, then refunded
 * straight back by the system. A by-hand credit (39's) is not touched: its
 * money stays held (US-08.6.5). The catalogue leaves who refunds it unstated;
 * D56 says refunded too, so the system does (a reading).
 */
export function refundLatePrepaymentPayment(
  s: AppState,
  invoiceId: string,
  amount: number,
  receipt: { id: string; idempotencyKey: string; source: 'webhook' | 'poll' | 'allocation' },
  atISO: string,
  metas: MutationMeta[],
): { patch: Pick<SettlementPatch, 'billing' | 'counters'>; refundId: string } | null {
  const creditNoteId = refundsLatePayment(s, invoiceId)
  const pair = pairForInvoice(s, invoiceId)
  const invoice = s.billing.invoices[invoiceId]
  if (creditNoteId === undefined || pair === undefined || pair.credit === undefined || invoice === undefined) return null
  const cents = toCents(amount)
  if (cents <= 0) return null
  const value = cents / 100
  const rid = allocateId(s.counters, 'prepaymentRefund')
  const refund: PrepaymentRefund = { id: rid.id, bookingId: invoice.bookingId, prepaymentInvoiceId: invoiceId, creditNoteId, cause: 'latePayment', counterparty: invoice.counterparty, amount: value, paidAtISO: atISO }
  const nextPair = {
    ...pair,
    receivable: { ...pair.receivable, receivedAmount: roundToCents(pair.receivable.receivedAmount + value) },
    credit: { ...pair.credit, heldForPayer: roundToCents(pair.credit.heldForPayer + value), refundedAmount: roundToCents((pair.credit.refundedAmount ?? 0) + value) },
  }
  const note = s.billing.creditNotes[creditNoteId]
  metas.push({ entityType: 'ledgerPair', entityId: pair.id, action: 'ledger.receiptRecorded', after: { invoiceNumber: invoice.invoiceNumber, amount: value, source: receipt.source, heldForPayer: true } })
  metas.push({
    entityType: 'prepaymentRefund',
    entityId: rid.id,
    action: 'prepaymentRefund.latePayment',
    after: { invoiceNumber: invoice.invoiceNumber, creditNoteNumber: note?.creditNoteNumber, amount: value, from: 'AA Holding account' },
    stampBookingId: null,
  })
  return {
    patch: {
      billing: {
        ...s.billing,
        ledger: { ...s.billing.ledger, [pair.id]: nextPair },
        receipts: {
          ...s.billing.receipts,
          [receipt.id]: { id: receipt.id, pairId: pair.id, pairKind: pair.kind, ...(pair.receivable.xeroAccRecId !== undefined ? { accRecId: pair.receivable.xeroAccRecId } : {}), grossAmount: value, gstAmount: gstComponentOf(value), atISO, idempotencyKey: receipt.idempotencyKey, source: receipt.source },
        },
        prepaymentRefunds: { ...s.billing.prepaymentRefunds, [rid.id]: refund },
      },
      counters: rid.counters,
    },
    refundId: rid.id,
  }
}

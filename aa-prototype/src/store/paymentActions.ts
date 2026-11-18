/**
 * Payment detection (Phase 10; WI3, X4): the RFP's webhook + daily
 * reconciliation poll, both writing through ONE handler keyed by the payment
 * idempotency key (RFP: "both paths write through the same handler, keyed by
 * InvoiceID, so a duplicate webhook or a poll re-detecting an already-processed
 * payment is a no-op").
 *
 * Since catch-up Phase 36 the money is recorded in the LEDGER first (US-08.3.2,
 * US-10.2.1, US-09.2.1), then mirrored to Xero, in one mutate
 * (`applyReceiptInto`, the one path every receipt takes: webhook, poll, an
 * office allocation of an unmatched receipt, an AA fee payment):
 *   - the ledger: the receivable's received, the payable released by 16's
 *     rule (`payableReleasedFor`, both legs together), `paidInAtISO` once at
 *     full, and a `LedgerReceipt` (the GST-report source + the idempotency
 *     key-set), GST = gross × 0.15 / 1.15;
 *   - the Xero mirror: a `PaymentIn` (unless Xero already holds it, the
 *     missed-webhook case the poll catches), the ACCREC's received and status,
 *     the ACCPAY authorised for exactly what was received.
 * A payment on an ACCREC that no pair links is held as an `UnmatchedReceipt`.
 *
 * All automated money events audit `source:'system'` (convention 7). The
 * payable equals the receivable (FT-10.3): AA's own fee is a separate monthly
 * invoice, never deducted from a payable (catch-up Phase 16).
 */

import type { LedgerPair, LedgerReceipt, LedgerTransfer, PaymentIn, UnmatchedReceipt, XeroAccPay, XeroAccRec } from '../domain/types'
import { roundToCents, toCents } from '../domain/billing/money'
import { payableReleasedFor } from '../domain/billing/payableRelease'
import { applyReceipt, gstComponentOf, isBookingPair, payeeAnaesthetistOf, transferOfPair } from '../domain/billing/ledger'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { pairByAccRec } from './ledgerSelectors'

export { gstComponentOf }

/** The system actors for the two detection paths (both audit source=system). */
export const PAYMENT_ACTOR: Record<'webhook' | 'poll', Actor> = {
  webhook: { who: 'Xero webhook', role: 'system', source: 'system' },
  poll: { who: 'Reconciliation poll', role: 'system', source: 'system' },
}

export interface ReceivePaymentInput {
  accRecId: string
  /** Gross amount received (GST-inclusive), before clamping to the balance due. */
  amount: number
  idempotencyKey: string
  source: 'webhook' | 'poll'
  /**
   * The instant Xero received the money. Omit for a live webhook (uses the
   * clock); the reconciliation poll passes the missed payment's OWN date so a
   * reconciled receipt lands in the correct GST period, not the detection day.
   */
  atISO?: string
}

/** Whether a key is already processed: a ledger receipt or an unmatched receipt carries it. */
export function receiptKeySeen(state: Pick<AppState, 'billing'>, key: string): boolean {
  return Object.values(state.billing.receipts).some((r) => r.idempotencyKey === key) || Object.values(state.billing.unmatchedReceipts).some((u) => u.idempotencyKey === key)
}

/**
 * Who a receipt is the income of: a procedure pair's stamped payee; a
 * prepayment's transfer payee once transferred, else the List's anaesthetist
 * now (27a: a Booking moved to the office has none, and its money is the AA
 * Holding account's); never anyone for an AA fee payment (AA's own money).
 */
function receiptAnaesthetist(state: Pick<AppState, 'schedule' | 'billing'>, pair: LedgerPair, transfer: LedgerTransfer | undefined): string | undefined {
  if (!isBookingPair(pair)) return undefined
  const stamped = pair.payable !== undefined ? payeeAnaesthetistOf(pair.payable) : undefined
  if (stamped !== undefined) return stamped
  if (transfer !== undefined) return payeeAnaesthetistOf(transfer.in)
  const booking = state.schedule.bookings[pair.bookingId]
  return booking !== undefined ? state.schedule.lists[booking.listId]?.anaesthetistId : undefined
}

export interface ReceiptWrite {
  pairId: string
  amount: number
  idempotencyKey: string
  /** The ledger receipt's source; the Xero `PaymentIn` takes the same (an AA fee's is `aaFee`). */
  source: LedgerReceipt['source']
  atISO: string
}

/**
 * The one receipt path (catch-up Phase 36): inside a caller's mutate recipe,
 * apply `w` to its pair in the ledger and mirror it to Xero. Returns the state
 * patch and the counters, or null when nothing applies (fully received, or no
 * pair). The caller has checked idempotency.
 */
export function applyReceiptInto(
  s: AppState,
  counters: Record<string, number>,
  w: ReceiptWrite,
  metas: MutationMeta[],
): { patch: Pick<AppState, 'billing' | 'xero'>; counters: Record<string, number>; added: number } | null {
  const pair = s.billing.ledger[w.pairId]
  if (pair === undefined) return null
  const transfer = isBookingPair(pair) && pair.kind === 'prePayment' ? transferOfPair(s.billing.transfers, pair.id) : undefined
  const applied = applyReceipt(pair, w.amount, w.atISO, transfer)
  if (toCents(applied.added) <= 0) return null
  const next = applied.pair
  const added = applied.added
  const ledger = { ...s.billing.ledger, [pair.id]: next }
  const transfers = applied.transfer !== undefined ? { ...s.billing.transfers, [applied.transfer.id]: applied.transfer } : s.billing.transfers
  const anaesthetistId = receiptAnaesthetist(s, pair, transfer)

  let c = counters
  const rct = allocateId(c, 'receipt')
  c = rct.counters
  const accRecId = pair.receivable.xeroAccRecId
  const receipt: LedgerReceipt = {
    id: rct.id,
    pairId: pair.id,
    pairKind: pair.kind,
    ...(anaesthetistId !== undefined ? { anaesthetistId } : {}),
    ...(accRecId !== undefined ? { accRecId } : {}),
    grossAmount: added,
    gstAmount: gstComponentOf(added),
    atISO: w.atISO,
    idempotencyKey: w.idempotencyKey,
    source: w.source,
  }
  const released = isBookingPair(next) ? (applied.transfer?.in.releasedAmount ?? next.payable?.releasedAmount) : undefined
  metas.push({
    entityType: 'ledgerPair',
    entityId: pair.id,
    action: 'ledger.receiptRecorded',
    after: { amount: added, cumulative: next.receivable.receivedAmount, ...(released !== undefined ? { released } : {}), source: w.source },
  })
  if (applied.transfer !== undefined && transfer !== undefined) {
    metas.push({ entityType: 'ledgerPair', entityId: pair.id, action: 'prepayment.transferReleased', after: { transferId: transfer.id, released: applied.transfer.in.releasedAmount, increment: applied.releasedIncrement } })
  }

  // The Xero mirror: the payment, the ACCREC's received, the ACCPAY authorised for exactly what was received.
  const payments = { ...s.xero.payments }
  const accRecs = { ...s.xero.accRecs }
  const accPays = { ...s.xero.accPays }
  const recNow = accRecId !== undefined ? s.xero.accRecs[accRecId] : undefined
  if (accRecId !== undefined && recNow !== undefined) {
    if (!Object.values(s.xero.payments).some((p) => p.idempotencyKey === w.idempotencyKey)) {
      const pmt = allocateId(c, 'paymentIn')
      c = pmt.counters
      payments[pmt.id] = { id: pmt.id, accRecId, amount: added, atISO: w.atISO, idempotencyKey: w.idempotencyKey, source: w.source } satisfies PaymentIn
    }
    const newReceived = roundToCents(recNow.amountReceived + added)
    const fullyPaid = toCents(newReceived) >= toCents(recNow.amountDue)
    accRecs[accRecId] = {
      ...recNow,
      amountReceived: newReceived,
      status: fullyPaid ? 'paid' : 'awaitingPayment',
      // Set once, by the completing payment.
      ...(fullyPaid && recNow.paidAtISO === undefined ? { paidAtISO: w.atISO } : {}),
    } satisfies XeroAccRec
    metas.push({
      entityType: 'xeroAccRec',
      entityId: accRecId,
      action: 'xero.paymentReceived',
      after: { amount: added, cumulative: newReceived, fullyPaid, source: w.source, idempotencyKey: w.idempotencyKey },
    })
    const accPayId = isBookingPair(pair) ? pair.payable?.xeroAccPayId : undefined
    const payNow = accPayId !== undefined ? s.xero.accPays[accPayId] : undefined
    if (accPayId !== undefined && payNow !== undefined) {
      const authorised = payableReleasedFor(newReceived, payNow.amountPayable)
      accPays[accPayId] = { ...payNow, amountAuthorised: authorised, status: authorised > 0 && payNow.status === 'draft' ? 'authorised' : payNow.status } satisfies XeroAccPay
      metas.push({ entityType: 'xeroAccPay', entityId: accPayId, action: 'xero.accpayAuthorised', after: { authorisedCumulative: authorised, increment: roundToCents(authorised - payNow.amountAuthorised) } })
    }
  }

  return {
    patch: {
      billing: { ...s.billing, ledger, transfers, receipts: { ...s.billing.receipts, [rct.id]: receipt } },
      xero: { ...s.xero, payments, accRecs, accPays },
    },
    counters: c,
    added,
  }
}

/**
 * Detect a payment on an ACCREC. Idempotent by `idempotencyKey`; a replay or a
 * poll re-detect is a no-op. Returns `applied:false` when nothing changed
 * (duplicate key, or the receivable is already fully received). A payment on
 * an ACCREC no pair links is held as an unmatched receipt (catch-up Phase 36).
 */
export function receivePayment(api: AppStoreApi, input: ReceivePaymentInput): Outcome<{ applied: boolean; unmatchedReceiptId?: string }> {
  const state = api.getState()
  const accRec = state.xero.accRecs[input.accRecId]
  if (accRec === undefined) return refuse('notFound', 'ACCREC not found.')
  // AA's own fee invoice is paid through recordAaFeePayment, never as a
  // procedure receipt (catch-up Phase 16).
  if (accRec.kind === 'aaFee') {
    return refuse('aaFeeInvoice', 'This is an AA fee invoice; record its payment as a fee payment.')
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return refuse('invalidAmount', 'The payment amount must be positive.')
  }
  if (receiptKeySeen(state, input.idempotencyKey)) return ok({ applied: false })

  const pair = pairByAccRec(state, input.accRecId)
  if (pair === undefined) {
    // No pair links it: hold the money in the ledger, out of balance until the office clears it.
    const out = recordUnmatchedReceipt(api, { amount: input.amount, reference: `${accRec.invoiceNumber} (no matching invoice)`, idempotencyKey: input.idempotencyKey, source: input.source, ...(input.atISO !== undefined ? { atISO: input.atISO } : {}) })
    return out.ok ? ok({ applied: true, unmatchedReceiptId: out.value.id }) : out
  }
  if (toCents(pair.receivable.amount - pair.receivable.receivedAmount) <= 0) return ok({ applied: false })

  let applied = false
  const metas: MutationMeta[] = []
  mutate(api, PAYMENT_ACTOR[input.source], metas, (s) => {
    const atISO = input.atISO ?? clockISO(s.clock)
    const out = applyReceiptInto(s, s.counters, { pairId: pair.id, amount: input.amount, idempotencyKey: input.idempotencyKey, source: input.source, atISO }, metas)
    if (out === null) {
      metas.push({ entityType: 'ledgerPair', entityId: pair.id, action: 'ledger.receiptNoop' })
      return {}
    }
    applied = true
    return { ...out.patch, counters: out.counters }
  })
  return ok({ applied })
}

export interface UnmatchedReceiptInput {
  amount: number
  reference: string
  idempotencyKey: string
  source: 'webhook' | 'poll'
  /** Set only when the bank reference names an anaesthetist; never guessed from the amount. */
  anaesthetistId?: string
  atISO?: string
}

/**
 * A receipt that matches no invoice (catch-up Phase 36; US-08.3.4): held in
 * the ledger as an `UnmatchedReceipt`, so the ledger reads out of balance by
 * its amount until the office allocates or refunds it. The Xero webhook's
 * system actor; idempotent by key; an attribution must be an active
 * anaesthetist.
 */
export function recordUnmatchedReceipt(api: AppStoreApi, input: UnmatchedReceiptInput): Outcome<{ id: string; applied: boolean }> {
  const state = api.getState()
  if (!Number.isFinite(input.amount) || toCents(input.amount) <= 0) return refuse('invalidAmount', 'The receipt amount must be positive.')
  const existing = Object.values(state.billing.unmatchedReceipts).find((u) => u.idempotencyKey === input.idempotencyKey)
  if (existing !== undefined) return ok({ id: existing.id, applied: false })
  if (input.anaesthetistId !== undefined) {
    const a = state.masters.anaesthetists[input.anaesthetistId]
    if (a === undefined || a.active === false) return refuse('unknownAnaesthetist', 'The receipt names no active anaesthetist.')
  }
  let id = ''
  const metas: MutationMeta[] = []
  mutate(api, PAYMENT_ACTOR[input.source], metas, (s) => {
    const allocated = allocateId(s.counters, 'unmatchedReceipt')
    id = allocated.id
    metas.push({ entityType: 'unmatchedReceipt', entityId: id, action: 'ledger.unmatchedReceipt', after: { amount: roundToCents(input.amount), reference: input.reference, ...(input.anaesthetistId !== undefined ? { anaesthetistId: input.anaesthetistId } : {}) } })
    const receipt: UnmatchedReceipt = {
      id,
      amount: roundToCents(input.amount),
      reference: input.reference,
      atISO: input.atISO ?? clockISO(s.clock),
      idempotencyKey: input.idempotencyKey,
      source: input.source,
      ...(input.anaesthetistId !== undefined ? { anaesthetistId: input.anaesthetistId } : {}),
      status: 'held',
    }
    return { billing: { ...s.billing, unmatchedReceipts: { ...s.billing.unmatchedReceipts, [id]: receipt } }, counters: allocated.counters }
  })
  return ok({ id, applied: true })
}

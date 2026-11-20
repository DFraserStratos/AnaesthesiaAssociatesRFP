/**
 * Disbursement detected from Xero (catch-up Phase 37; US-09.2.4, FT-10.2,
 * RV-40; OQ-111 answered, D53). Payments to anaesthetists are made in Xero's
 * payables run; the Billing Engine never makes one. It learns of each bill
 * payment by Xero's bill-paid webhook, or at the next reconciliation poll if
 * the webhook goes missing, and only then records the disbursement against the
 * payable leg, so "paid into AA" and "disbursed to the anaesthetist" stay two
 * separately tracked states (US-10.1.2).
 *
 * `recordDisbursement` is the ONLY code that records a disbursement, whoever
 * paid: the webhook, the poll, the queue's `disbursementSync`, and later 39a's
 * weekly run. Idempotent by the bill payment's key, exactly as receipts are for
 * payments. A payable to the AA Holding account is never disbursed (27a).
 */

import { idempotencyKeysOf, nettingKeys } from './indexes'
import type { BookingLedgerPair, LedgerDisbursement, NegativeInvoice, PayableLeg } from '../domain/types'
import { roundToCents, toCents } from '../domain/billing/money'
import { applyDisbursement, applyOffset, isBookingPair, payeeAnaesthetistOf, settledOn } from '../domain/billing/ledger'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { completeRunsIn } from './paymentCycleActions'

/** Who tells the engine a bill was paid (both audit source system). */
export const DETECTION_ACTOR: Record<'webhook' | 'poll', Actor> = {
  webhook: { who: 'Xero webhook', role: 'system', source: 'system' },
  poll: { who: 'Reconciliation poll', role: 'system', source: 'system' },
}

export interface RecordDisbursementInput {
  /** The ACCPAY Xero paid (a pair's payable leg). */
  accPayId?: string
  /** Or the transfer whose payable Xero paid (27a: a transferred prepayment has no ACCPAY of its own). */
  transferId?: string
  xeroDisbursementId: string
  amount: number
  /** When Xero paid the bill (the poll passes the payment's own date). */
  atISO: string
  /** The bill payment's key (`BILLPAY-`). */
  idempotencyKey: string
  detectedBy: 'webhook' | 'poll'
  /** The Xero payables run that paid it. */
  payablesRunId: string
}

/** Whether the ledger already holds a disbursement with this bill payment's key. */
export function disbursementKeySeen(state: Pick<AppState, 'billing'>, key: string): boolean {
  // Indexed (catch-up Phase 43): the poll asks this per Xero bill payment.
  return idempotencyKeysOf(state.billing.disbursements).has(key)
}

interface LegRef {
  id: string
  kind: 'pair' | 'transfer'
  leg: PayableLeg
  collectPairId?: string
}

/** The payable leg a bill payment pays: the pair whose payable Xero mirrors by this ACCPAY, or the transfer's `in` leg. */
function legFor(state: Pick<AppState, 'billing'>, input: Pick<RecordDisbursementInput, 'accPayId' | 'transferId'>): LegRef | undefined {
  if (input.transferId !== undefined) {
    const t = state.billing.transfers[input.transferId]
    return t !== undefined ? { id: t.id, kind: 'transfer', leg: t.in, collectPairId: t.collectPairId } : undefined
  }
  if (input.accPayId === undefined) return undefined
  for (const pair of Object.values(state.billing.ledger)) {
    if (isBookingPair(pair) && pair.payable?.xeroAccPayId === input.accPayId) return { id: pair.id, kind: 'pair', leg: pair.payable }
  }
  return undefined
}

/**
 * Record one bill payment Xero made, against its payable leg (Phase 36's pure
 * `applyDisbursement`: cumulative disbursed, `paidOutAtISO` when full), and
 * write the `LedgerDisbursement`, in one mutate audited `ledger.disbursed`.
 * Refuses an unknown ACCPAY, the AA Holding account, and an amount above
 * released less disbursed (the poll logs and skips a refusal). A replayed key
 * is a no-op.
 */
export function recordDisbursement(api: AppStoreApi, input: RecordDisbursementInput): Outcome<{ applied: boolean; ledgerDisbursementId?: string }> {
  const state = api.getState()
  if (disbursementKeySeen(state, input.idempotencyKey)) return ok({ applied: false })
  const ref = legFor(state, input)
  if (ref === undefined) return refuse('unknownPayable', 'No payable in the ledger matches this bill payment.')
  const anaesthetistId = payeeAnaesthetistOf(ref.leg)
  if (anaesthetistId === undefined) return refuse('holdingSystemOnly', 'The AA Holding account is never paid by a payables run.')
  const moved = applyDisbursement(ref.leg, input.amount, input.atISO)
  if (!moved.ok) return refuse(moved.code, moved.code === 'aboveReleased' ? 'The bill payment is more than the payable has released.' : 'The bill payment cannot be recorded.')

  let ledgerDisbursementId: string | undefined
  const metas: MutationMeta[] = []
  mutate(api, DETECTION_ACTOR[input.detectedBy], metas, (s) => {
    if (disbursementKeySeen(s, input.idempotencyKey)) {
      metas.push({ entityType: 'ledgerPair', entityId: ref.collectPairId ?? ref.id, action: 'ledger.disburseNoop', after: { idempotencyKey: input.idempotencyKey } })
      return {}
    }
    const allocated = allocateId(s.counters, 'ledgerDisbursement')
    ledgerDisbursementId = allocated.id
    const leg = moved.leg
    const entry: LedgerDisbursement = {
      id: allocated.id,
      pairId: ref.id,
      anaesthetistId,
      amount: input.amount,
      atISO: input.atISO,
      payablesRunId: input.payablesRunId,
      xeroDisbursementId: input.xeroDisbursementId,
      idempotencyKey: input.idempotencyKey,
      detectedBy: input.detectedBy,
    }
    const fullyPaidOut = toCents(settledOn(leg)) >= toCents(leg.amount)
    metas.push({
      entityType: 'ledgerPair',
      entityId: ref.collectPairId ?? ref.id,
      action: 'ledger.disbursed',
      after: { ...(ref.kind === 'transfer' ? { transferId: ref.id } : {}), increment: input.amount, cumulative: leg.disbursedAmount, payablesRunId: input.payablesRunId, fullyPaidOut, detectedBy: input.detectedBy },
    })
    const billing =
      ref.kind === 'pair'
        ? { ...s.billing, ledger: { ...s.billing.ledger, [ref.id]: { ...s.billing.ledger[ref.id]!, payable: leg } as AppState['billing']['ledger'][string] } }
        : { ...s.billing, transfers: { ...s.billing.transfers, [ref.id]: { ...s.billing.transfers[ref.id]!, in: leg } } }
    const withEntry = { ...billing, disbursements: { ...billing.disbursements, [entry.id]: entry } }
    // The run completes in the detection that settles its last unheld line (catch-up Phase 39a).
    const done = completeRunsIn(withEntry, input.atISO, ref.id)
    metas.push(...done.metas)
    return { billing: { ...withEntry, payablesRuns: done.payablesRuns }, counters: allocated.counters }
  })
  return ok({ applied: ledgerDisbursementId !== undefined, ...(ledgerDisbursementId !== undefined ? { ledgerDisbursementId } : {}) })
}

// ---------------------------------------------------------------------------
// Netting detected from Xero (catch-up Phase 39a; US-10.2.5)
// ---------------------------------------------------------------------------

export interface RecordOffsetInput {
  /** The bill (ACCPAY) the credit was allocated against. */
  accPayId: string
  /** The ACCPAYCREDIT allocated (the negative invoice's `accPayCreditNoteId`). */
  accPayCreditId: string
  xeroAllocationId: string
  amount: number
  atISO: string
  /** `CNALLOC-<id>`. */
  idempotencyKey: string
  detectedBy: 'webhook' | 'poll'
  payablesRunId: string
}

/** Whether the ledger already holds a netting with this allocation's key. */
export function offsetKeySeen(state: Pick<AppState, 'billing'>, key: string): boolean {
  // Indexed: the poll asks this per Xero credit allocation.
  return nettingKeys(state.billing.negativeInvoices).has(key)
}

/**
 * Record one credit allocation Xero made in a payment run: the bill's
 * `offsetAmount` rises (never cash, so receipts held stay true), the negative
 * invoice gains the netting (and `netted` once its open amount reaches zero)
 * and the credited pair's `credit.nettedAmount` moves in step, in one mutate
 * audited `ledger.offsetRecorded`. Idempotent by the `CNALLOC-` key, so the
 * webhook, the poll and the queue each record it once.
 */
export function recordOffset(api: AppStoreApi, input: RecordOffsetInput): Outcome<{ applied: boolean }> {
  const state = api.getState()
  if (offsetKeySeen(state, input.idempotencyKey)) return ok({ applied: false })
  const bill = Object.values(state.billing.ledger).find((p): p is BookingLedgerPair => isBookingPair(p) && p.payable?.xeroAccPayId === input.accPayId)
  if (bill === undefined || bill.payable === undefined) return refuse('unknownPayable', 'No payable in the ledger matches this credit allocation.')
  const negative = Object.values(state.billing.negativeInvoices).find((n) => n.accPayCreditNoteId === input.accPayCreditId)
  if (negative === undefined) return refuse('unknownNegative', 'No negative invoice matches this credit allocation.')
  const credited = state.billing.ledger[negative.pairId]
  if (credited === undefined || !isBookingPair(credited) || credited.credit === undefined) return refuse('unknownNegative', 'The credited invoice is not in the ledger.')
  const open = roundToCents(negative.recoveryDue - (negative.nettings ?? []).reduce((n, x) => n + x.amount, 0))
  if (toCents(input.amount) > toCents(open)) return refuse('aboveOpen', 'The allocation is more than the negative invoice has left to net.')
  const moved = applyOffset(bill.payable, input.amount, input.atISO)
  if (!moved.ok) return refuse(moved.code, moved.code === 'aboveReleased' ? 'The allocation is more than the payable has released.' : 'The allocation cannot be recorded.')

  let applied = false
  const metas: MutationMeta[] = []
  mutate(api, DETECTION_ACTOR[input.detectedBy], metas, (s) => {
    if (offsetKeySeen(s, input.idempotencyKey)) {
      metas.push({ entityType: 'ledgerPair', entityId: bill.id, action: 'ledger.offsetNoop', after: { idempotencyKey: input.idempotencyKey } })
      return {}
    }
    applied = true
    const neg = s.billing.negativeInvoices[negative.id]!
    const nettings = [...(neg.nettings ?? []), { runId: input.payablesRunId, pairId: bill.id, amount: input.amount, atISO: input.atISO, idempotencyKey: input.idempotencyKey, xeroAllocationId: input.xeroAllocationId }]
    const nettedTotal = roundToCents(nettings.reduce((n, x) => n + x.amount, 0))
    const status: NegativeInvoice['status'] = toCents(nettedTotal) >= toCents(neg.recoveryDue) ? 'netted' : 'toNet'
    const creditedNow = s.billing.ledger[negative.pairId] as BookingLedgerPair
    const billNow = s.billing.ledger[bill.id] as BookingLedgerPair
    // When the bill IS the credited pair (never: a credited payable takes no offset) the two writes would collide; applyOffset refuses a reversed leg.
    const ledger = {
      ...s.billing.ledger,
      [bill.id]: { ...billNow, payable: moved.leg },
      [negative.pairId]: { ...creditedNow, credit: { ...creditedNow.credit!, nettedAmount: nettedTotal } },
    }
    metas.push({
      entityType: 'ledgerPair',
      entityId: bill.id,
      action: 'ledger.offsetRecorded',
      after: { negativeInvoice: neg.number, amount: input.amount, offsetCumulative: moved.leg.offsetAmount, payablesRunId: input.payablesRunId, nettedCumulative: nettedTotal, negativeStatus: status, detectedBy: input.detectedBy },
    })
    const billing = { ...s.billing, ledger, negativeInvoices: { ...s.billing.negativeInvoices, [neg.id]: { ...neg, nettings, status } } }
    const done = completeRunsIn(billing, input.atISO, bill.id)
    metas.push(...done.metas)
    return { billing: { ...billing, payablesRuns: done.payablesRuns } }
  })
  return ok({ applied })
}

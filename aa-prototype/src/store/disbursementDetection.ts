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

import type { LedgerDisbursement, PayableLeg } from '../domain/types'
import { toCents } from '../domain/billing/money'
import { applyDisbursement, isBookingPair, payeeAnaesthetistOf } from '../domain/billing/ledger'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

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
  return Object.values(state.billing.disbursements).some((d) => d.idempotencyKey === key)
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
    const fullyPaidOut = toCents(leg.disbursedAmount) >= toCents(leg.amount)
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
    return { billing: { ...billing, disbursements: { ...billing.disbursements, [entry.id]: entry } }, counters: allocated.counters }
  })
  return ok({ applied: ledgerDisbursementId !== undefined, ...(ledgerDisbursementId !== undefined ? { ledgerDisbursementId } : {}) })
}

/**
 * The daily reconciliation poll (Phase 10; WI3, X4): the RFP's safety net for
 * missed or failed webhook delivery. Subscribes to `dayAdvanced` and
 * re-detects what Xero holds that the ledger has not recorded, through the
 * same handlers as the webhooks, so a duplicate is a no-op:
 *  - payments: every Xero payment no receipt carries the key of, through
 *    `receivePayment` (source poll), dated when Xero received the money;
 *  - bill payments (catch-up Phase 37; US-09.2.4): every Xero bill payment no
 *    ledger disbursement carries the key of, through `recordDisbursement`
 *    (detected by poll), dated when Xero paid it;
 *  - divergences (catch-up Phase 37; EP-09, US-09.2.2): invoices voided or
 *    amended directly in Xero, flagged once for the office.
 * During a Xero outage the poll cannot read Xero: it queues itself
 * (`POLL-<date>`) and returns, and the Xero sync queue runs it later.
 *
 * The seeded missed-webhook `PaymentIn` is what the poll catches on the next
 * day advance, "aligns with the reappears-next-day behaviour" the RFP describes.
 */

import { receivePayment } from './paymentActions'
import { disbursementKeySeen, recordDisbursement } from './disbursementDetection'
import { flagXeroDivergences } from './xeroDivergenceActions'
import { enqueueXeroWork, XERO_OUTAGE_ERROR, xeroAvailable } from './xeroGate'
import type { AppStoreApi } from './appStore'
import { onAppEvent } from './events'

export interface PollResult {
  /** Payments newly recorded. */
  payments: number
  /** Bill payments newly recorded as disbursements. */
  disbursements: number
  /** Voids and amendments newly flagged. */
  divergences: number
  /** True when Xero was unavailable and the poll waits in the queue. */
  queued?: boolean
}

/** Run the poll now. */
export function runReconciliationPoll(api: AppStoreApi): PollResult {
  if (!xeroAvailable(api.getState())) {
    enqueueXeroWork(api, { kind: 'poll', idempotencyKey: `POLL-${api.getState().clock.todayISO}`, target: {}, lastError: XERO_OUTAGE_ERROR })
    return { payments: 0, disbursements: 0, divergences: 0, queued: true }
  }
  const state = api.getState()
  const mirroredKeys = new Set(Object.values(state.billing.receipts).map((r) => r.idempotencyKey))
  let payments = 0
  for (const payment of Object.values(state.xero.payments)) {
    if (mirroredKeys.has(payment.idempotencyKey)) continue
    // An AA fee payment never has a receipt (it is not a procedure receipt), so
    // without this skip every day advance would re-detect it (catch-up Phase 16).
    if (payment.source === 'aaFee' || state.xero.accRecs[payment.accRecId]?.kind === 'aaFee') continue
    const outcome = receivePayment(api, {
      accRecId: payment.accRecId,
      amount: payment.amount,
      idempotencyKey: payment.idempotencyKey,
      source: 'poll',
      // Backdate the receipt to when Xero actually received the money (not the
      // poll-detection day) so every dated view reads the day the money moved.
      atISO: payment.atISO,
    })
    if (outcome.ok && outcome.value.applied) payments += 1
  }

  let disbursements = 0
  for (const bill of Object.values(api.getState().xero.disbursements).sort((a, b) => a.id.localeCompare(b.id))) {
    if (disbursementKeySeen(api.getState(), bill.idempotencyKey)) continue
    const outcome = recordDisbursement(api, {
      ...(bill.accPayId !== undefined ? { accPayId: bill.accPayId } : {}),
      ...(bill.transferId !== undefined ? { transferId: bill.transferId } : {}),
      xeroDisbursementId: bill.id,
      amount: bill.amount,
      // Dated when Xero paid the bill, not the detection day.
      atISO: bill.atISO,
      idempotencyKey: bill.idempotencyKey,
      detectedBy: 'poll',
      payablesRunId: bill.payablesRunId,
    })
    // A refusal (above what is released, the AA Holding account) is logged by the audit of what did land and skipped, never thrown.
    // A bill paid on a payable the engine has reversed by a credit is flagged below, by `flagXeroDivergences` (catch-up Phase 39 review).
    if (outcome.ok && outcome.value.applied) disbursements += 1
  }

  const divergences = flagXeroDivergences(api)
  return { payments, disbursements, divergences }
}

/**
 * Subscribe the reconciliation poll to `dayAdvanced` for one store. Call once at
 * app bootstrap for the singleton; returns the unsubscribe (tests use it).
 */
export function wireReconciliationPoll(api: AppStoreApi): () => void {
  return onAppEvent((event) => {
    if (event.type === 'dayAdvanced') runReconciliationPoll(api)
  })
}

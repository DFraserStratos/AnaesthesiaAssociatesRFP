/**
 * The daily reconciliation poll (Phase 10; WI3, X4) — the RFP's safety net for
 * missed/failed webhook delivery. Subscribes to `dayAdvanced` (the documented
 * hook) and re-detects any Xero payment the Billing Engine has not yet mirrored
 * (no receipt carries its idempotency key), applying it through the SAME
 * `receivePayment` handler as the webhook, source `poll`. Idempotent: a payment
 * already mirrored (by webhook or a prior poll) is skipped.
 *
 * The seeded missed-webhook `PaymentIn` (an unmirrored Xero payment) is what the
 * poll catches on the next day advance, "aligns with the reappears-next-day
 * behaviour" the RFP describes.
 */

import { receivePayment } from './paymentActions'
import type { AppStoreApi } from './appStore'
import { onAppEvent } from './events'

/** Apply every unmirrored Xero payment. Returns how many were newly applied. */
export function runReconciliationPoll(api: AppStoreApi): number {
  const state = api.getState()
  const mirroredKeys = new Set(Object.values(state.billing.receipts).map((r) => r.idempotencyKey))
  let applied = 0
  for (const payment of Object.values(state.xero.payments)) {
    if (mirroredKeys.has(payment.idempotencyKey)) continue
    const outcome = receivePayment(api, {
      accRecId: payment.accRecId,
      amount: payment.amount,
      idempotencyKey: payment.idempotencyKey,
      source: 'poll',
      // Backdate the receipt to when Xero actually received the money (not the
      // poll-detection day) so it lands in the correct GST period.
      atISO: payment.atISO,
    })
    if (outcome.ok && outcome.value.applied) applied += 1
  }
  return applied
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

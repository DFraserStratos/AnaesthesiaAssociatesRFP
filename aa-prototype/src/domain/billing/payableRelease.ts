/**
 * The payable-release rule (catch-up Phase 16; US-10.2.1, FT-10.3). The ACCPAY
 * equals its ACCREC's amount due, so a payment releases the payable for exactly
 * the amount received, to the cent; the remainder stays outstanding on the
 * receivable. AA's own fee is a separate monthly invoice and is never deducted
 * here.
 */

import { roundToCents, toCents } from './money'

/**
 * The cumulative amount of a payable released once `receivedCumulative` has
 * been received against its receivable: the amount received, clamped to the
 * payable. Zero or negative input releases nothing.
 */
export function payableReleasedFor(receivedCumulative: number, amountPayable: number): number {
  if (!Number.isFinite(receivedCumulative) || !Number.isFinite(amountPayable)) return 0
  if (toCents(receivedCumulative) <= 0 || toCents(amountPayable) <= 0) return 0
  return roundToCents(Math.min(receivedCumulative, amountPayable))
}

/**
 * The price status, one selector (catch-up Phase 21a; US-03.6.1, US-05.2.8,
 * AR-58 5.7). Completion's price condition, the capture form's "Needs a
 * price" state and the review flags all read it. Phase 24 replaces the bodies
 * of `priceStatusFor` and `computedPriceFor` with its full price function and
 * keeps the signatures.
 *
 * "Needs a price" blocking completion is our reading (AR-58 A48).
 */

import type { Procedure } from '../types'
import { procedureNeedsPrice, type Contract } from './contracts'
import { feeFor, type FeeContext } from './fee'

export type PriceStatus = { status: 'priced' } | { status: 'needsPrice'; reason: 'noRangeInForce' | 'openPrice' }

/**
 * A typed price (an open price's `enteredPrice`, or the office's fixed fee) is
 * priced; a fixed price reads Phase 19a's range in force on the List's date
 * (none: needs a price); an open price with no amount needs a price; the RVG
 * kinds are priced. A Procedure with no Contract has no price status (the
 * Contract condition reports it): undefined.
 */
export function priceStatusFor(
  procedure: Pick<Procedure, 'enteredPrice' | 'priceOverride'>,
  contract: Contract | undefined,
  listDateISO: string,
): PriceStatus | undefined {
  if (contract === undefined) return undefined
  if (!procedureNeedsPrice(contract, listDateISO, procedure)) return { status: 'priced' }
  return { status: 'needsPrice', reason: contract.pricing.kind === 'open' ? 'openPrice' : 'noRangeInForce' }
}

/**
 * The price the Contract works out with nothing typed, for the review flag's
 * "beside the computed price" (Admin only): the range price on a fixed price,
 * the fee engine's figure on an RVG kind, none on an open price or with no
 * price in force. No new money maths: the fee engine's own figure, at the
 * Procedure's allocation in its Booking (`ctx.allocation`, catch-up Phase 23;
 * a typed price never changes who took part in the split).
 */
export function computedPriceFor(procedure: Procedure, contract: Contract | undefined, ctx: FeeContext): number | undefined {
  if (contract === undefined || contract.pricing.kind === 'open') return undefined
  const { priceOverride: _override, enteredPrice: _typed, ...untyped } = procedure
  const fee = feeFor(untyped, { ...ctx, contract })
  return fee.needsPrice ? undefined : fee.total
}

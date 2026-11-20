/**
 * The price status, one selector (catch-up Phase 21a; US-03.6.1, US-05.2.8,
 * AR-58 5.7). Completion's price condition, the capture form's "Needs a
 * price" state and the review flags all read it. Since catch-up Phase 24 both
 * bodies call the one price function (`procedurePrice.ts`); the signatures
 * are 21a's.
 *
 * "Needs a price" blocking completion is our reading (AR-58 A48).
 */

import type { Procedure } from '../types'
import type { Contract } from './contracts'
import { feeFor, type FeeContext } from './fee'
import { priceFor, type HeldPrices, type NeedsPriceReason } from './procedurePrice'

export type PriceStatus = { status: 'priced' } | { status: 'needsPrice'; reason: NeedsPriceReason }

/**
 * The ladder (with the held amounts where the caller has them, 21a's
 * signature plus an optional `held`): a held or typed price is priced; a fixed price reads its range in force on
 * the List's date (none: needs a price); an open price with no amount needs a
 * price; the RVG kinds are priced. A Procedure with no Contract has no price
 * status (the Contract condition reports it): undefined.
 */
export function priceStatusFor(
  procedure: Pick<Procedure, 'enteredPrice'>,
  contract: Contract | undefined,
  listDateISO: string,
  held?: HeldPrices,
): PriceStatus | undefined {
  if (contract === undefined) return undefined
  const price = priceFor({ contract, dateISO: listDateISO, enteredPrice: procedure.enteredPrice, units: 0, unitValue: 0, ...(held !== undefined ? { held } : {}) })
  return price.status === 'priced' ? { status: 'priced' } : { status: 'needsPrice', reason: price.reason }
}

/**
 * The price the Contract works out with nothing typed or held, for "beside
 * the computed price" (Review, the office's sheet, the anaesthetist's price
 * line): the range price on a fixed price, units x the rate (less the
 * discount) on an RVG kind; none on an
 * open price or with no price in force. The Procedure's allocation in its
 * Booking (`ctx.allocation`, catch-up Phase 23) is kept: a typed price never
 * changes who took part in the split.
 */
export function computedPriceFor(procedure: Procedure, contract: Contract | undefined, ctx: FeeContext): number | undefined {
  if (contract === undefined || contract.pricing.kind === 'open') return undefined
  const { enteredPrice: _typed, ...untyped } = procedure
  const { held: _held, ...unheld } = ctx
  const fee = feeFor(untyped, { ...unheld, contract })
  return fee.price.status === 'priced' ? fee.price.computedTotal : undefined
}

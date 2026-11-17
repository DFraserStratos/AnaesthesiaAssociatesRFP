import type { Contract } from '../../domain/types'
import { isRvgKind } from '../../domain/billing/contracts'
import { rangeInForce } from '../../domain/billing/priceRanges'
import { formatCurrency } from '../format'

/** The Contract chooser's words, kept beside its parts (`railParts.tsx`; UI unification U4). A plain module, so fast refresh stays clean. */

/** The heading over the destination's two backstops at the top of every Contract list. */
export const NO_CONTRACT_HEADING = 'No contract'

/** A Contract as the rail lists name it: the backstops as "No contract · RVG" and "No contract · Fixed price", whoever holds them. */
export function railContractLabel(c: Contract): string {
  if (c.systemRole === 'noContractRvg' || c.systemRole === 'rvgFallback') return 'No contract · RVG'
  if (c.systemRole === 'openPriceFallback') return c.prepaid ? 'Prepaid · Fixed price' : 'No contract · Fixed price'
  return c.name
}

/** A backstop's price as its row shows it. */
export function backstopPriceText(c: Contract): string {
  return c.pricing.kind === 'open' ? 'Type the amount' : 'RVG'
}

/** The destination's backstops, in the rail's order: No contract · RVG, then No contract · Fixed price. */
export function railBackstops(step: { rvgBackstop?: Contract; otherPrice?: { contract: Contract } } | undefined): Contract[] {
  return [step?.rvgBackstop, step?.otherPrice?.contract].filter((c): c is Contract => c !== undefined)
}

export const AMOUNT_HINT = 'Type the price for this procedure.'
export const AMOUNT_INVALID_HINT = 'Type the amount in dollars and cents.'


/** A Contract's price as a row shows it: its fixed price in force, "Prepaid" before it, or how it is priced. */
export function contractPriceText(contract: Contract, dateISO: string): string {
  if (contract.pricing.kind === 'open') return 'Other price'
  if (isRvgKind(contract.pricing.kind)) return contract.pricing.kind === 'rvgAnaesthetistRate' ? 'RVG' : contract.pricing.kind === 'rvgContractRate' ? 'RVG, agreed rate' : 'RVG, discounted'
  const range = rangeInForce(contract, dateISO)
  const price = range === null ? 'Needs a price' : formatCurrency(range.price)
  return contract.prepaid ? `Prepaid · ${price}` : price
}

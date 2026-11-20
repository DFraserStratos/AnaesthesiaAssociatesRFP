/**
 * The rate and discount a pricing kind sets for time (catch-up Phase 39b,
 * extracted from 24's `computedPriceOf`; AR-58 2.3, DM-50). The one place a
 * rate is derived: a Procedure's computed price (`procedurePrice.ts`) and a
 * timed pre-op or post-op event (`prePostOpEvent.ts`) both call it, so the two
 * cannot drift.
 *
 * - `rvgAnaesthetistRate`: the anaesthetist's own unit value, no discount;
 * - `rvgContractRate`: the Contract's `unitRate`;
 * - `rvgDiscount`: the anaesthetist's unit value, less `discountPct`;
 * - `fixed` and `open`: none (US-05.2.5: nothing further is calculated).
 *
 * No Contract (none chosen yet) reads as No contract · RVG, the anaesthetist's
 * unit value, as 24 does.
 */

import type { ContractPricing } from './contracts'

export type TimedRate =
  | { kind: 'rate'; rate: number; rateOrigin: 'contractRate' | 'unitValue'; discountPercent: number }
  | { kind: 'none' }

export function timedRateFor(pricing: ContractPricing | undefined, unitValue: number): TimedRate {
  const p = pricing ?? { kind: 'rvgAnaesthetistRate' as const }
  switch (p.kind) {
    case 'rvgAnaesthetistRate':
      return { kind: 'rate', rate: unitValue, rateOrigin: 'unitValue', discountPercent: 0 }
    case 'rvgContractRate':
      return { kind: 'rate', rate: p.unitRate, rateOrigin: 'contractRate', discountPercent: 0 }
    case 'rvgDiscount':
      return { kind: 'rate', rate: unitValue, rateOrigin: 'unitValue', discountPercent: p.discountPct }
    case 'fixed':
    case 'open':
      return { kind: 'none' }
  }
}

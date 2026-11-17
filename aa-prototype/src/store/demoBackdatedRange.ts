/**
 * Demo trigger body (catch-up Phase 24, work item 12; US-05.2.8): "Demo: add a
 * backdated price range" on Merivale's Face lift. Adds a range from 1 Jul 2026
 * at $3,300.00 (a demo figure above the seeded $3,100.00) through 19a's
 * `addPriceRange`, as the office: the unedited Face lift Bookings re-price,
 * while the typed-price one and the AUTHORISED, invoiced one stay put. (No
 * Face lift is prepaid; the prepaid hold is shown on Dr Souter's price list,
 * `rangePrepaidBooking`, and pinned by `pricingBeats.test.ts`.)
 * Deterministic and idempotent: refused once the range is there.
 */

import type { Outcome } from './mutate'
import { refuse } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { addPriceRange } from './contractActions'
import { DEMO_OFFICE_ACTOR } from './demoActors'

export const BACKDATED_RANGE_CONTRACT_ID = 'CT-MER-FACELIFT'
export const BACKDATED_RANGE = { startISO: '2026-07-01', price: 3300 } as const

/** True once the demo range is on the Contract (the trigger then hides). */
export function backdatedRangeAdded(state: Pick<AppState, 'masters'>): boolean {
  const contract = state.masters.contracts[BACKDATED_RANGE_CONTRACT_ID]
  return contract?.pricing.kind === 'fixed' && contract.pricing.ranges.some((r) => r.startISO === BACKDATED_RANGE.startISO)
}

export function addBackdatedRangeDemo(api: AppStoreApi): Outcome {
  if (backdatedRangeAdded(api.getState())) return refuse('alreadyAdded', 'The backdated range is already on the Face lift.')
  return addPriceRange(api, DEMO_OFFICE_ACTOR, BACKDATED_RANGE_CONTRACT_ID, { ...BACKDATED_RANGE })
}

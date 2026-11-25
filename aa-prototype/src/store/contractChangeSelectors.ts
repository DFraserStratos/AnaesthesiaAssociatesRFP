/**
 * The store's reads of the Contract change warnings (catch-up Phase 25a;
 * US-04.1.2, US-04.2.15, D79): the pure lists in
 * `domain/billing/contractChanges.ts` over the live schedule and locks. Read
 * only: nothing here moves or re-prices a Procedure.
 */

import type { AppState } from './appStore'
import type { Contract, ContractId, PriceRange } from '../domain/types'
import { authorisedKeptPrice, proceduresStillOnContract, type KeptPriceRow, type StillOnRow } from '../domain/billing/contractChanges'
import { proceduresPerRange, rangesOf } from '../domain/billing/priceRanges'
import { prepaymentRaisedFor } from './selectors'
import { lockedAgainstContract, type LockedAgainst } from './locks'

/** The Procedures dated on or after `fromISO` still on the Contract, that can still move. */
export function stillOnContract(state: Pick<AppState, 'schedule' | 'masters'>, contractId: ContractId, fromISO: string): StillOnRow[] {
  return proceduresStillOnContract(
    { procedures: state.schedule.procedures, bookings: state.schedule.bookings, lists: state.schedule.lists, patients: state.masters.patients },
    contractId,
    fromISO,
  )
}

/** The authorised Procedures a range on the Contract (as it now stands) left at their locked price. */
export function keptPriceForRange(state: Pick<AppState, 'billing' | 'masters'>, contractId: ContractId, range: PriceRange): KeptPriceRow[] {
  const contract = state.masters.contracts[contractId]
  if (contract === undefined || contract.pricing.kind !== 'fixed') return []
  return authorisedKeptPrice(state.billing.locks, contractId, rangesOf(contract), range)
}

/** A date before any List's (the "from" that makes `stillOnContract` list every not-yet-authorised Procedure). */
export const ON_CONTRACT_FROM_ANY_DATE = '0001-01-01'

/**
 * Who a Contract touches (build plan Phase 45; US-04.1.7 "Who it touches"): every Procedure on it
 * not yet authorised, a past List still awaiting review included, by date; then the Bookings
 * authorised against it, each at its locked price, newest lock first. Read only.
 */
export function onContract(state: Pick<AppState, 'schedule' | 'masters' | 'billing'>, contractId: ContractId): { open: StillOnRow[]; authorised: LockedAgainst[] } {
  return { open: stillOnContract(state, contractId, ON_CONTRACT_FROM_ANY_DATE), authorised: lockedAgainstContract(state, contractId) }
}

/**
 * The day a Disable's confirm lists the Procedures still on the Contract from (build plan Phase 45;
 * DM-04): today, since a Disable acts at once (D90, OQ-144 open). Phase 49 widens it to a
 * replacement's change date for a late disable. The one place that date is chosen.
 */
export function disableFromISO(_state: Pick<AppState, 'masters'>, _contractId: ContractId, todayISO: string): string {
  return todayISO
}

/**
 * How many Procedures each of a fixed price's ranges priced (build plan Phase 45; US-04.2.15
 * "Table"): the pure `proceduresPerRange` over the live schedule and locks, with the Procedures
 * a raised prepayment holds left out.
 */
export function pricedPerRange(state: Pick<AppState, 'schedule' | 'billing'>, contractId: ContractId, contract: Contract): Record<string, number> {
  const prepaidHeld = new Set<string>()
  for (const p of Object.values(state.schedule.procedures)) {
    if (p.governingContractId === contractId && prepaymentRaisedFor(state, p.id)) prepaidHeld.add(p.id)
  }
  return proceduresPerRange(contract, { procedures: state.schedule.procedures, bookings: state.schedule.bookings, lists: state.schedule.lists, locks: state.billing.locks, prepaidHeld })
}

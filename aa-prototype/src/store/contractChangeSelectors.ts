/**
 * The store's reads of the Contract change warnings (catch-up Phase 25a;
 * US-04.1.2, US-04.2.15, D79): the pure lists in
 * `domain/billing/contractChanges.ts` over the live schedule and locks. Read
 * only: nothing here moves or re-prices a Procedure.
 */

import type { AppState } from './appStore'
import type { ContractId, PriceRange } from '../domain/types'
import { authorisedKeptPrice, keptPriceOnContract, proceduresStillOnContract, type KeptPriceRow, type StillOnRow } from '../domain/billing/contractChanges'
import { rangesOf } from '../domain/billing/priceRanges'

/** The Procedures dated on or after `fromISO` still on the Contract, that can still move. */
export function stillOnContract(state: Pick<AppState, 'schedule' | 'masters'>, contractId: ContractId, fromISO: string): StillOnRow[] {
  return proceduresStillOnContract(
    { procedures: state.schedule.procedures, bookings: state.schedule.bookings, lists: state.schedule.lists, patients: state.masters.patients },
    contractId,
    fromISO,
  )
}

/** Every authorised Procedure on the Contract left at a locked price its ranges no longer give. */
export function keptPriceOnContractNow(state: Pick<AppState, 'billing' | 'masters'>, contractId: ContractId): KeptPriceRow[] {
  const contract = state.masters.contracts[contractId]
  if (contract === undefined || contract.pricing.kind !== 'fixed') return []
  return keptPriceOnContract(state.billing.locks, contractId, rangesOf(contract))
}

/** The authorised Procedures a range on the Contract (as it now stands) left at their locked price. */
export function keptPriceForRange(state: Pick<AppState, 'billing' | 'masters'>, contractId: ContractId, range: PriceRange): KeptPriceRow[] {
  const contract = state.masters.contracts[contractId]
  if (contract === undefined || contract.pricing.kind !== 'fixed') return []
  return authorisedKeptPrice(state.billing.locks, contractId, rangesOf(contract), range)
}

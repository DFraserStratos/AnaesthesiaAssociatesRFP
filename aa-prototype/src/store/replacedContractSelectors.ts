/**
 * The store's read of the replaced-Contract to-do (build plan Phase 49; DM-03,
 * D94): the pure rule over the live Contracts, the audit's replacements and
 * the demo clock's today. Read only; nothing is stored.
 */

import { contractReplacements, type ContractReplacement } from '../domain/billing/contractHistory'
import { replacedContractStillActive, type ReplacedContractRow } from '../domain/warnings/rules/replacedContractStillActive'
import type { AppState } from './appStore'

/**
 * The replacements whose change date is still ahead of the demo clock, soonest first (the newest
 * replacement of each old Contract): what "Reach the change date" moves the clock to. With
 * `contractId`, only the replacement that Contract is the old or the new one of.
 */
export function replacementsAhead(state: Pick<AppState, 'audit' | 'clock'>, contractId?: string): ContractReplacement[] {
  const newest = new Map<string, ContractReplacement>()
  for (const r of contractReplacements(state.audit)) newest.set(r.replacesId, r)
  return [...newest.values()]
    .filter((r) => r.fromISO > state.clock.todayISO && (contractId === undefined || r.replacesId === contractId || r.contractId === contractId))
    .sort((a, b) => a.fromISO.localeCompare(b.fromISO) || a.contractId.localeCompare(b.contractId))
}

/** The old Contracts still Active on or after their replacement's date: the "Disable <old>" to-dos. */
export function replacedContractsToDisable(state: Pick<AppState, 'masters' | 'audit' | 'clock'>): ReplacedContractRow[] {
  return replacedContractStillActive(state.masters.contracts, contractReplacements(state.audit), state.clock.todayISO)
}

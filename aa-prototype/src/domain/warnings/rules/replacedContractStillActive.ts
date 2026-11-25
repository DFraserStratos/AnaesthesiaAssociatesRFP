/**
 * A replaced Contract is still active on or after its replacement's date
 * (build plan Phase 49; US-04.1.8 "Old one left active", DM-03, D94). When the
 * office replaces a Contract from a date and leaves the old one Active, both
 * are offered until it disables the old one (D90: no scheduled disable,
 * OQ-144 open). From the change date this rule names the old Contract as a
 * To-do: "Disable <old>".
 *
 * Its subject is a Contract, not a Booking, so it is not in `WARNING_RULES`
 * (whose facts are one Booking's). It is derived each read from the Contracts,
 * the audit's replacements (`contractReplacements`) and today: it stores
 * nothing, not even a clearance, has no Clear, and never blocks (it is not in
 * `lifecycle.ts` or `authoriseBlockersFor`). Disabling either Contract takes
 * the row away; making the old one active again brings it back.
 */

import type { ContractReplacement } from '../../billing/contractHistory'
import type { Contract, ContractId } from '../../types'

/** The rule's words (its title and the to-do's reading). */
export const REPLACED_CONTRACT_STILL_ACTIVE_TEXT = "A replaced Contract is still active on or after its replacement's date"

/** One old Contract to disable. */
export interface ReplacedContractRow {
  contractId: ContractId
  contractName: string
  aaCode: string
  replacementId: ContractId
  replacementName: string
  replacementCode: string
  /** The change date (`YYYY-MM-DD`). */
  fromISO: string
}

/**
 * Every Active Contract whose newest replacement's date is today or past,
 * while that replacement is itself Active, by date then name.
 */
export function replacedContractStillActive(
  contracts: Readonly<Record<ContractId, Contract>>,
  replacements: readonly ContractReplacement[],
  todayISO: string,
): ReplacedContractRow[] {
  // The newest replacement of each old Contract (`replacements` is oldest saved first).
  const newest = new Map<ContractId, ContractReplacement>()
  for (const r of replacements) newest.set(r.replacesId, r)
  const rows: ReplacedContractRow[] = []
  for (const r of newest.values()) {
    const old = contracts[r.replacesId]
    const replacement = contracts[r.contractId]
    if (old === undefined || replacement === undefined) continue
    if (old.systemRole !== undefined || old.status !== 'active' || replacement.status !== 'active') continue
    if (todayISO < r.fromISO) continue
    rows.push({
      contractId: old.id,
      contractName: old.name,
      aaCode: old.aaCode,
      replacementId: replacement.id,
      replacementName: replacement.name,
      replacementCode: replacement.aaCode,
      fromISO: r.fromISO,
    })
  }
  return rows.sort((a, b) => a.fromISO.localeCompare(b.fromISO) || a.contractName.localeCompare(b.contractName) || a.contractId.localeCompare(b.contractId))
}

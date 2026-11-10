/**
 * Starting values from the Contract (catch-up Phase 19a; DM-43, US-03.3.1,
 * US-04.2.18; AR-58 5.7 steps 3 and 4, A15; D3, D12).
 *
 * Choosing a Contract fills the Procedure's RVG code from the Contract's
 * default RVG code where none is set; a Procedure that already has one keeps
 * it, with its times and modifiers (A15). Base units then come from the RVG
 * group alone through 19's resolver (`resolveStartingUnits`): a Contract
 * states no units. Modifier units start at 0 (19b adds its pre-applied ones).
 * No source is stored. On a fixed or open price the code is for reference
 * only: its units never reach the fee.
 */

import type { Procedure } from '../types'
import type { Contract } from './contracts'
import { rvgGroupPickRefusal, type RvgGroup, type RvgGroupId } from './rvgGroups'

/**
 * The RVG code a Contract choice fills in, or null when nothing changes: the
 * Procedure already has a code, the Contract names none, or its default is no
 * longer a row that can be picked (missing or retired).
 */
export function fillFromContract(
  procedure: Pick<Procedure, 'rvgGroupId'>,
  contract: Pick<Contract, 'defaultRvgGroupId'> | undefined,
  rvgGroups: Readonly<Record<RvgGroupId, RvgGroup>>,
): { rvgGroupId: RvgGroupId } | null {
  if (procedure.rvgGroupId !== undefined) return null
  const id = contract?.defaultRvgGroupId ?? null
  if (id === null) return null
  if (rvgGroupPickRefusal(rvgGroups, id, undefined) !== null) return null
  return { rvgGroupId: id }
}

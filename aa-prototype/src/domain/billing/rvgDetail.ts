/**
 * What a Procedure asks for follows its Contract's pricing kind (catch-up
 * Phase 21a; US-03.3.9, US-03.3.3, US-03.3.4; Donald's D9; AR-58 5.7 step 4).
 * The one place this is decided: the capture form, the completion rule
 * (`completion.ts`) and the capture hooks all read it. If D9 is reversed, this
 * file is the one change.
 *
 * - On a Contract priced from RVG units (the three RVG kinds, No contract ·
 *   RVG included) the RVG code, the start and finish times and the modifiers
 *   step are asked for and required.
 * - On a fixed or open price the form collapses: an RVG code may be picked for
 *   reference only, and no times or modifiers are asked for.
 * - With no Contract yet nothing is required and nothing is hidden: completion
 *   refuses on the Contract first (our reading, logged in Phase 21a).
 *
 * Recorded times and modifiers are kept when a Contract change collapses the
 * form (AR-58 A15) and are ignored by a fixed or open price; they show again
 * if the Contract goes back to an RVG kind. Nothing here writes.
 *
 * `rvgCodeToFill` (catch-up Phase 20's derived "RVG code to fill in") moved
 * here from `contractRail.ts` so the rule has one home.
 */

import type { Procedure } from '../types'
import { isRvgKind, type Contract } from './contracts'

/**
 * True on the three RVG kinds (No contract · RVG included); false on a fixed
 * or open price, a Disabled Contract asking by its kind. (The rate x time
 * line that once exempted a Procedure is gone, catch-up Phase 24, RV-03.)
 */
export function asksRvgDetail(contract: Pick<Contract, 'pricing'> | undefined): boolean {
  return contract !== undefined && isRvgKind(contract.pricing.kind)
}

/** How each part of the RVG detail is asked for on this Procedure's form. */
export interface RvgDetailSpec {
  /** 'required' on an RVG kind; 'reference' (optional, for reference only) on a fixed or open price; 'optional' with no Contract yet. */
  rvgCode: 'required' | 'reference' | 'optional'
  /** 'shown' with no Contract yet: shown, not yet required. */
  times: 'required' | 'hidden' | 'shown'
  modifiers: 'required' | 'hidden' | 'shown'
}

/** The form spec for a Procedure on this Contract (undefined: no Contract yet). */
export function rvgDetailFor(contract: Pick<Contract, 'pricing'> | undefined): RvgDetailSpec {
  if (contract === undefined) return { rvgCode: 'optional', times: 'shown', modifiers: 'shown' }
  if (asksRvgDetail(contract)) return { rvgCode: 'required', times: 'required', modifiers: 'required' }
  return { rvgCode: 'reference', times: 'hidden', modifiers: 'hidden' }
}

/**
 * Derived, never stored (US-03.3.1, US-04.3.4): the Procedure is on a Contract
 * priced from RVG units and has no RVG code, so the anaesthetist is asked for
 * it.
 */
export function rvgCodeToFill(
  masters: { contracts: Readonly<Record<string, Contract>> },
  procedure: Pick<Procedure, 'governingContractId' | 'rvgGroupId'>,
): boolean {
  if (procedure.governingContractId === undefined || procedure.rvgGroupId !== undefined) return false
  return asksRvgDetail(masters.contracts[procedure.governingContractId])
}

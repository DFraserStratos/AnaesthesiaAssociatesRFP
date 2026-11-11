/**
 * The facts a Procedure's modifier rules read, gathered from the store in one
 * place (catch-up Phase 19b): the patient's date of birth, the procedure date
 * (the List's) and the RVG group, with the master. The store actions, the
 * group pick and `editProcedure`'s reconciliation all build them here, so they
 * agree with the fee assemblers.
 */

import type { Procedure, RvgGroupId } from '../domain/types'
import type { ModifierFacts } from '../domain/billing/modifiers'
import { reconcileClaims } from '../domain/billing/modifiers'
import { groupOf } from '../domain/billing/rvgGroups'
import type { AppState } from './appStore'

/** The modifier facts for a Procedure (optionally on another RVG group, for a change about to be written). */
export function modifierFactsFor(
  state: Pick<AppState, 'schedule' | 'masters'>,
  procedure: Procedure,
  rvgGroupId: RvgGroupId | undefined = procedure.rvgGroupId,
): ModifierFacts {
  const booking = state.schedule.bookings[procedure.bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const dob = booking !== undefined ? state.masters.patients[booking.patientId]?.dobISO : undefined
  const group = groupOf(state.masters.rvgGroups, rvgGroupId)
  return {
    ...(dob !== undefined ? { patientDobISO: dob } : {}),
    ...(list !== undefined ? { procedureDateISO: list.dateISO } : {}),
    ...(group !== undefined ? { group } : {}),
    modifiers: state.masters.modifiers,
  }
}

/**
 * The claims and removals a change of RVG group leaves (`reconcileClaims`), or
 * null when nothing changes. Written in the same commit as the change.
 */
export function reconciledForGroup(
  state: Pick<AppState, 'schedule' | 'masters'>,
  procedure: Procedure,
  rvgGroupId: RvgGroupId | undefined,
): Pick<Procedure, 'modifierClaims' | 'removedModifierIds'> | null {
  const next = reconcileClaims(procedure.modifierClaims, procedure.removedModifierIds, modifierFactsFor(state, procedure, rvgGroupId))
  const same =
    next.modifierClaims.length === procedure.modifierClaims.length &&
    next.removedModifierIds.length === procedure.removedModifierIds.length
  return same ? null : next
}

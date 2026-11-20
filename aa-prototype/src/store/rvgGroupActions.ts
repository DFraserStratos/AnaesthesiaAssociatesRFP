/**
 * The RVG groups master and the RVG code on a Procedure (catch-up Phase 19;
 * US-05.1.1, US-05.1.3, DM-13).
 *
 * The office adds, edits, retires and restores rows; each change is one
 * audited `mutate()` commit (`rvgGroup.*`, before and after). Duplicate codes
 * are allowed (Procedures link by hidden id), only an exact duplicate is
 * refused. A figure edit re-prices unlocked Procedures on the row live (there
 * is no pricing snapshot until Phase 25); built invoices keep their amounts.
 * Retiring hides a row from the picker and keeps it for the Procedures on it.
 *
 * `pickRvgGroup` sets or clears a Procedure's RVG code: the entry point Phase
 * 20's Contract pick and Phase 19a's default RVG code use.
 *
 * Rules are data from the model module (`domain/billing/rvgGroups.ts`).
 */

import {
  cleanRvgGroupInput,
  rvgGroupPickRefusal,
  rvgGroupRefusal,
  type RvgGroup,
  type RvgGroupId,
  type RvgGroupInput,
} from '../domain/billing/rvgGroups'
import type { Procedure } from '../domain/types'
import type { AppState, AppStoreApi } from './appStore'
import { slicesOf, withSource, type Plan, type PlanSource } from './masterPlanners'
import { getBooking, editRefusal } from './lifecycle'
import { reconciledForGroup } from './modifierFacts'
import { claimsAuditView } from '../domain/billing/modifiers'
import { allocateId, mutate, ok, refuse, type Actor, type Outcome } from './mutate'

const OFFICE_ONLY = 'Only the office can change the RVG groups.'

/** What an audit entry records of a row (the id is the entity id). */
function auditView(g: RvgGroup | RvgGroupInput): Record<string, unknown> {
  return {
    code: g.code,
    description: g.description,
    anatomy: g.anatomy,
    baseUnits: g.baseUnits,
    baseUnitsRange: g.baseUnitsRange,
    modifierUnits: g.modifierUnits,
  }
}

/** Plan an RVG group's create (the seed load folds the same planner). */
export function planRvgGroupCreate(state: AppState, actor: Actor, input: RvgGroupInput, source?: PlanSource): Outcome<Plan> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const refused = rvgGroupRefusal(input, state.masters.rvgGroups)
  if (refused !== null) return refuse(refused.code, refused.message)
  const clean = cleanRvgGroupInput(input)
  const alloc = allocateId(state.counters, 'rvgGroup')
  const id = alloc.id
  // AA's own rows include no modifier (only the published Neurosurgery and Spine rows do, catch-up Phase 19b).
  const row: RvgGroup = { id, ...clean, retired: false, includedModifierIds: [] }
  return ok({
    id,
    next: { ...slicesOf(state), masters: { ...state.masters, rvgGroups: { ...state.masters.rvgGroups, [id]: row } }, counters: alloc.counters },
    metas: withSource([{ entityType: 'rvgGroup', entityId: id, action: 'rvgGroup.create', after: auditView(row), stampBookingId: null }], source),
  })
}

/** Add an RVG group (AA's own, never marked as such). Audited `rvgGroup.create`. */
export function createRvgGroup(api: AppStoreApi, actor: Actor, input: RvgGroupInput): Outcome<{ id: RvgGroupId }> {
  const plan = planRvgGroupCreate(api.getState(), actor, input)
  if (!plan.ok) return plan
  mutate(api, actor, plan.value.metas, () => plan.value.next)
  return ok({ id: plan.value.id })
}

/** Edit every field of a row but its id. Audited `rvgGroup.update` with before and after. */
export function editRvgGroup(api: AppStoreApi, actor: Actor, id: RvgGroupId, input: RvgGroupInput): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const state = api.getState()
  const current = state.masters.rvgGroups[id]
  if (current === undefined) return refuse('notFound', 'RVG group not found.')
  const refused = rvgGroupRefusal(input, state.masters.rvgGroups, id)
  if (refused !== null) return refuse(refused.code, refused.message)
  const clean = cleanRvgGroupInput(input)
  const next: RvgGroup = { ...current, ...clean }
  if (clean.baseUnitsRange === undefined) delete next.baseUnitsRange
  const before = auditView(current)
  const after = auditView(next)
  if (JSON.stringify(before) === JSON.stringify(after)) return ok(undefined)
  mutate(api, actor, { entityType: 'rvgGroup', entityId: id, action: 'rvgGroup.update', before, after, stampBookingId: null }, (s) => ({
    masters: { ...s.masters, rvgGroups: { ...s.masters.rvgGroups, [id]: next } },
  }))
  return ok(undefined)
}

function setRetired(
  api: AppStoreApi,
  actor: Actor,
  id: RvgGroupId,
  retired: boolean,
  meta: { action: 'rvgGroup.retire' } | { action: 'rvgGroup.restore' },
): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const current = api.getState().masters.rvgGroups[id]
  if (current === undefined) return refuse('notFound', 'RVG group not found.')
  if (current.retired === retired) {
    return retired ? refuse('alreadyRetired', 'This RVG group is already retired.') : refuse('notRetired', 'This RVG group is not retired.')
  }
  mutate(
    api,
    actor,
    {
      entityType: 'rvgGroup',
      entityId: id,
      action: meta.action,
      before: { retired: current.retired },
      after: { retired },
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, rvgGroups: { ...s.masters.rvgGroups, [id]: { ...current, retired } } } }),
  )
  return ok(undefined)
}

/** Retire a row: hidden from the picker, kept for the Procedures already on it. Audited `rvgGroup.retire`. */
export function retireRvgGroup(api: AppStoreApi, actor: Actor, id: RvgGroupId): Outcome {
  return setRetired(api, actor, id, true, { action: 'rvgGroup.retire' })
}

/** Restore a retired row to the picker. Audited `rvgGroup.restore`. */
export function restoreRvgGroup(api: AppStoreApi, actor: Actor, id: RvgGroupId): Outcome {
  return setRetired(api, actor, id, false, { action: 'rvgGroup.restore' })
}

/**
 * Set or clear a Procedure's RVG code (`null` clears: the code is optional).
 * When the row changes, the chosen and typed base units are cleared so the new
 * row's starting value shows; the Procedure's description is never touched.
 * Same rights as `editProcedure`. One audited `procedure.update`.
 */
export function pickRvgGroup(api: AppStoreApi, actor: Actor, procedureId: string, rvgGroupId: RvgGroupId | null): Outcome {
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return refuse('notFound', 'Procedure not found.')
  const found = getBooking(state, procedure.bookingId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Booking.')
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights
  const pick = rvgGroupPickRefusal(state.masters.rvgGroups, rvgGroupId, procedure.rvgGroupId)
  if (pick !== null) return refuse(pick.code, pick.message)

  const nextId = rvgGroupId ?? undefined
  if (nextId === procedure.rvgGroupId) return ok(undefined)

  const next: Procedure = { ...procedure }
  if (nextId === undefined) delete next.rvgGroupId
  else next.rvgGroupId = nextId
  delete next.baseUnitsSelected
  delete next.baseUnitsCaptured
  // A change of group re-derives the included modifiers: a claim the new
  // group now includes, and a removal that no longer applies, drop in the same
  // commit (catch-up Phase 19b, `reconcileClaims`).
  const reconciled = reconciledForGroup(state, procedure, nextId)
  if (reconciled !== null) Object.assign(next, reconciled)

  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.update',
      before: {
        rvgGroupId: procedure.rvgGroupId,
        baseUnitsSelected: procedure.baseUnitsSelected,
        baseUnitsCaptured: procedure.baseUnitsCaptured,
        ...(reconciled !== null ? claimsAuditView(procedure, state.masters.modifiers) : {}),
      },
      after: {
        rvgGroupId: nextId,
        baseUnitsSelected: undefined,
        baseUnitsCaptured: undefined,
        ...(reconciled !== null ? claimsAuditView(reconciled, state.masters.modifiers) : {}),
      },
    },
    (s) => ({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: next } } }),
  )
  return ok(undefined)
}

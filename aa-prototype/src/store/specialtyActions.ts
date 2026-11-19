/**
 * AA's specialties list (catch-up Phase 18a; US-13.4.4, DM-63): add, rename,
 * remove. Office only, one audited `mutate()` commit each, refusals as data
 * from the model module (`domain/specialties.ts`).
 *
 * A rename changes the one record, so every surgeon and Contract holding it
 * shows the new name (US-13.4.4 Shared). A specialty is never removed while a
 * surgeon or Contract holds it, so no surgeon is ever left with none.
 */

import { specialtyNameRefusal, specialtyUsage, specialtyUsageText } from '../domain/specialties'
import { allocateId, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { slicesOf, withSource, type Plan, type PlanSource } from './masterPlanners'

/** Plan a specialty's create (the seed load folds the same planner). */
export function planSpecialtyCreate(state: AppState, actor: Actor, fields: { name: string }, source?: PlanSource): Outcome<Plan> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change the specialties list.')
  const refused = specialtyNameRefusal(fields.name, state.masters.specialties)
  if (refused !== null) return refuse(refused.code, refused.message)
  const trimmed = fields.name.trim()
  const alloc = allocateId(state.counters, 'specialty')
  const id = alloc.id
  return ok({
    id,
    next: {
      ...slicesOf(state),
      masters: { ...state.masters, specialties: { ...state.masters.specialties, [id]: { id, name: trimmed } } },
      counters: alloc.counters,
    },
    metas: withSource([{ entityType: 'specialty', entityId: id, action: 'specialty.create', after: { name: trimmed }, stampBookingId: null }], source),
  })
}

/** Add a specialty. Audited `specialty.create`. */
export function createSpecialty(api: AppStoreApi, actor: Actor, name: string): Outcome<{ id: string }> {
  const plan = planSpecialtyCreate(api.getState(), actor, { name })
  if (!plan.ok) return plan
  mutate(api, actor, plan.value.metas, () => plan.value.next)
  return ok({ id: plan.value.id })
}

/** Rename a specialty. Audited `specialty.update`, the name before and after. */
export function renameSpecialty(api: AppStoreApi, actor: Actor, id: string, name: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change the specialties list.')
  const state = api.getState()
  const existing = state.masters.specialties[id]
  if (existing === undefined) return refuse('notFound', 'Specialty not found.')
  const refused = specialtyNameRefusal(name, state.masters.specialties, id)
  if (refused !== null) return refuse(refused.code, refused.message)
  const trimmed = name.trim()
  if (trimmed === existing.name) return ok(undefined)
  mutate(
    api,
    actor,
    { entityType: 'specialty', entityId: id, action: 'specialty.update', before: { name: existing.name }, after: { name: trimmed }, stampBookingId: null },
    (s) => ({ masters: { ...s.masters, specialties: { ...s.masters.specialties, [id]: { ...existing, name: trimmed } } } }),
  )
  return ok(undefined)
}

/** Remove a specialty no surgeon or Contract holds. Audited `specialty.remove`. */
export function removeSpecialty(api: AppStoreApi, actor: Actor, id: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change the specialties list.')
  const state = api.getState()
  const existing = state.masters.specialties[id]
  if (existing === undefined) return refuse('notFound', 'Specialty not found.')
  const usage = specialtyUsage(state.masters, id)
  if (usage.surgeons > 0 || usage.contracts > 0) {
    return refuse('specialtyHeld', `${existing.name} is held by ${specialtyUsageText(usage)}, so it cannot be removed. Rename it instead, or change them first.`, { usage })
  }
  mutate(
    api,
    actor,
    { entityType: 'specialty', entityId: id, action: 'specialty.remove', before: { name: existing.name }, stampBookingId: null },
    (s) => {
      const { [id]: _removed, ...rest } = s.masters.specialties
      return { masters: { ...s.masters, specialties: rest } }
    },
  )
  return ok(undefined)
}

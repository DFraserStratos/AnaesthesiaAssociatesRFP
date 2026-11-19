/**
 * The master public-holiday calendar (catch-up Phase 42; DM-38, US-13.4.1,
 * US-01.5.1): add, edit and delete, office only, one audited `mutate()` each
 * (`publicHoliday.create|update|delete`). Conflicts are never stamped here:
 * `mutate()` reconciles the Lists on the old and new dates at every hospital
 * (`conflictReconcile.ts`), so marking a hospital open clears exactly its
 * flags. Each action returns `{ flagged, resolved }` from the mutation, the
 * shape 30's `HolidaySheet` result line reads.
 *
 * Also here: the edit of the RVG time rule (19a handed it on), tiers only.
 */

import { cleanPublicHoliday, publicHolidayRefusal, type PublicHolidayFields } from '../domain/masterValidation'
import { describeTimeRule, validateRvgTimeRule, type RvgTimeRule } from '../domain/billing/timeUnits'
import type { PublicHoliday } from '../domain/types'
import { allocateId, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { slicesOf, withSource, type Plan, type PlanSource } from './masterPlanners'

const OFFICE_ONLY = 'Only the office can change the public holidays.'

/** What the audit records of a row: names, never ids, for the hospitals open. */
function auditView(row: Omit<PublicHoliday, 'id'>, state: Pick<AppState, 'masters'>): Record<string, unknown> {
  return {
    dateISO: row.dateISO,
    name: row.name,
    kind: row.kind,
    ...(row.region !== undefined ? { region: row.region } : {}),
    openHospitals: row.openHospitalIds.length === 0 ? 'None' : row.openHospitalIds.map((id) => state.masters.hospitals[id]?.name ?? id),
  }
}

/** Plan a public holiday's create (the seed load folds the same planner). */
export function planPublicHolidayCreate(state: AppState, actor: Actor, fields: PublicHolidayFields, source?: PlanSource): Outcome<Plan> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const refused = publicHolidayRefusal(fields, state.masters)
  if (refused !== null) return refuse(refused.code, refused.message)
  const clean = cleanPublicHoliday(fields)
  const alloc = allocateId(state.counters, 'publicHoliday')
  const row: PublicHoliday = { id: alloc.id, ...clean }
  return ok({
    id: alloc.id,
    next: {
      ...slicesOf(state),
      masters: { ...state.masters, publicHolidays: { ...state.masters.publicHolidays, [alloc.id]: row } },
      counters: alloc.counters,
    },
    metas: withSource(
      [{ entityType: 'publicHoliday', entityId: alloc.id, action: 'publicHoliday.create', after: auditView(clean, state), stampBookingId: null }],
      source,
    ),
  })
}

export interface PublicHolidayResult {
  id: string
  /** Lists newly flagged by this change. */
  flagged: number
  /** Lists whose flag this change cleared. */
  resolved: number
}

/** Add a public holiday. Every hospital not listed open is closed that day; its Lists are flagged in the same commit. */
export function addPublicHoliday(api: AppStoreApi, actor: Actor, fields: PublicHolidayFields): Outcome<PublicHolidayResult> {
  const plan = planPublicHolidayCreate(api.getState(), actor, fields)
  if (!plan.ok) return plan
  const result = mutate(api, actor, plan.value.metas, () => plan.value.next)
  return ok({ id: plan.value.id, flagged: result.conflictsRaised.length, resolved: result.conflictsResolved.length })
}

/**
 * Edit a public holiday's date, name, kind, region or open hospitals, with
 * the add's refusals. Moving the date clears the old day's flags and raises
 * the new day's; listing a hospital open clears its flags only. Audited
 * `publicHoliday.update` with the changed fields before and after.
 */
export function editPublicHoliday(api: AppStoreApi, actor: Actor, id: string, patch: Partial<PublicHolidayFields>): Outcome<PublicHolidayResult> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const state = api.getState()
  const prev = state.masters.publicHolidays[id]
  if (prev === undefined) return refuse('notFound', 'Public holiday not found.')
  const fields: PublicHolidayFields = {
    dateISO: patch.dateISO ?? prev.dateISO,
    name: patch.name ?? prev.name,
    kind: patch.kind ?? prev.kind,
    ...('region' in patch ? (patch.region !== undefined ? { region: patch.region } : {}) : prev.region !== undefined ? { region: prev.region } : {}),
    openHospitalIds: patch.openHospitalIds ?? prev.openHospitalIds,
  }
  const refused = publicHolidayRefusal(fields, state.masters, id)
  if (refused !== null) return refuse(refused.code, refused.message)
  const next: PublicHoliday = { id, ...cleanPublicHoliday(fields) }
  const before = auditView(prev, state)
  const after = auditView(next, state)
  const changed = Object.keys({ ...before, ...after }).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
  if (changed.length === 0) return ok({ id, flagged: 0, resolved: 0 })
  const result = mutate(
    api,
    actor,
    {
      entityType: 'publicHoliday',
      entityId: id,
      action: 'publicHoliday.update',
      before: Object.fromEntries(changed.map((k) => [k, before[k] ?? ''])),
      after: Object.fromEntries(changed.map((k) => [k, after[k] ?? ''])),
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, publicHolidays: { ...s.masters.publicHolidays, [id]: next } } }),
  )
  return ok({ id, flagged: result.conflictsRaised.length, resolved: result.conflictsResolved.length })
}

/** Delete a public holiday; its flags clear. The audit keeps the full row. Audited `publicHoliday.delete`. */
export function deletePublicHoliday(api: AppStoreApi, actor: Actor, id: string): Outcome<PublicHolidayResult> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const state = api.getState()
  const prev = state.masters.publicHolidays[id]
  if (prev === undefined) return refuse('notFound', 'Public holiday not found.')
  const result = mutate(
    api,
    actor,
    { entityType: 'publicHoliday', entityId: id, action: 'publicHoliday.delete', before: { id, ...auditView(prev, state) }, stampBookingId: null },
    (s) => {
      const publicHolidays = { ...s.masters.publicHolidays }
      delete publicHolidays[id]
      return { masters: { ...s.masters, publicHolidays } }
    },
  )
  return ok({ id, flagged: result.conflictsRaised.length, resolved: result.conflictsResolved.length })
}

/** How many Lists a public holiday flags now (the view's "Lists affected" and the delete confirmation). */
export function listsFlaggedByPublicHoliday(state: Pick<AppState, 'schedule'>, id: string): number {
  const cause = `publicHoliday:${id}`
  return Object.values(state.schedule.lists).filter((l) => l.conflicts.some((c) => c.cause === cause)).length
}

// ---------------------------------------------------------------------------
// The RVG time rule (US-05.2.2; 19a's handoff)
// ---------------------------------------------------------------------------

export const PART_INTERVAL_FIXED = 'A part interval always rounds up.'

/**
 * Edit the RVG time rule's tiers. Office only; refused with 19a's
 * `validateRvgTimeRule` sentences, and a part-interval change is refused (the
 * rule applies to recorded time only and a part interval always rounds up).
 * Fees are derived from `masters.rvgTimeRule`, so every Procedure with no
 * AUTHORISED lock re-prices (ACTIVE and SUBMITTED Lists) and a locked one,
 * and every raised invoice, keeps its figures. Audited `rvgTimeRule.update`,
 * before and after in words.
 */
export function editRvgTimeRule(api: AppStoreApi, actor: Actor, rule: RvgTimeRule): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change the RVG time rule.')
  if (rule.partInterval !== 'roundUp') return refuse('partIntervalFixed', PART_INTERVAL_FIXED)
  const invalid = validateRvgTimeRule(rule)
  if (invalid !== null) return refuse('invalidRule', invalid)
  const prev = api.getState().masters.rvgTimeRule
  const next: RvgTimeRule = { tiers: rule.tiers.map((t) => ({ ...t })), partInterval: 'roundUp' }
  if (JSON.stringify(prev) === JSON.stringify(next)) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'rvgTimeRule',
      entityId: 'rvgTimeRule',
      action: 'rvgTimeRule.update',
      before: { rule: describeTimeRule(prev) },
      after: { rule: describeTimeRule(next) },
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, rvgTimeRule: next } }),
  )
  return ok(undefined)
}

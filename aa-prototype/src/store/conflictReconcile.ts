/**
 * The conflict reconcile inside `mutate()` (catch-up Phase 30; US-01.5.2 AC1
 * and AC2, US-01.5.4 AC2). Called only from `mutate.ts`.
 *
 * After a recipe runs, this works out which Lists' conflict facts the patch
 * touched, re-runs the one rule (`domain/conflicts.ts`) over them, folds the
 * changed Lists into the patch and returns one audit meta per conflict raised
 * or resolved, for the same commit. No store action writes `List.conflicts`
 * itself, so every path that can put a List on a clash (assign, phone advice,
 * a Booking, an edit, a move, a status write, a holiday, a projection, a
 * roll-forward, a feed) raises it, and every path that removes the clash
 * resolves it.
 *
 * Touched Lists: a changed List record; the List in a changed Slot record; the
 * Lists at the old and new (date, hospital) of any holiday added, removed or
 * changed; every List when the status master changed. Metas follow the facts,
 * not the stored copy: `list.conflict` when a cause newly arises,
 * `list.conflictResolved` when it goes. An office clear or "Flag again" (which
 * change only `conflictClears`) and a List locking (AUTHORISED) write none.
 */

import {
  CONFLICT_REASONS,
  conflictFactsFor,
  describeConflict,
  expectedConflicts,
  holidayIndex,
  holidayKey,
  reconcileListConflicts,
  type ConflictLookups,
  type ExpectedConflict,
  type HolidayIndex,
} from '../domain/conflicts'
import type { HospitalHoliday, List, Slot } from '../domain/types'
import type { AppState } from './appStore'
import type { DomainPatch, MutationMeta } from './mutate'

/** What a mutation did to conflicts (`mutate()`'s return value). */
export interface MutationResult {
  /** Lists that gained a conflict cause in this mutation. */
  conflictsRaised: string[]
  /** Lists that lost a conflict cause in this mutation. */
  conflictsResolved: string[]
}

const EMPTY_MUTATION_RESULT: MutationResult = Object.freeze({ conflictsRaised: [], conflictsResolved: [] }) as MutationResult

type Facts = { slots: Readonly<Record<string, Slot>>; statuses: AppState['masters']['slotStatuses']; holidays: HolidayIndex }

/** "Dr Rutherford" from the master (the store does not import `shared/format`; Phase 28's ruling). */
export function drName(masters: Pick<AppState['masters'], 'anaesthetists'>, anaesthetistId: string): string {
  const name = masters.anaesthetists[anaesthetistId]?.name ?? 'The anaesthetist'
  const surname = name.trim().split(/\s+/).at(-1) ?? name
  return name.startsWith('Dr ') ? `Dr ${surname}` : name
}

export function conflictLookups(state: { masters: AppState['masters']; schedule: Pick<AppState['schedule'], 'slots'> }): ConflictLookups {
  return {
    holidays: state.masters.holidays,
    hospitalName: (id) => state.masters.hospitals[id]?.name ?? 'The hospital',
    anaesthetistName: (id) => drName(state.masters, id),
    slots: state.schedule.slots,
    statuses: state.masters.slotStatuses,
  }
}

function listsAtHoliday(lists: Readonly<Record<string, List>>, keys: ReadonlySet<string>, into: Set<string>): void {
  if (keys.size === 0) return
  for (const list of Object.values(lists)) {
    if (list.hospitalId !== undefined && keys.has(holidayKey(list.dateISO, list.hospitalId))) into.add(list.id)
  }
}

function changedHolidayKeys(
  before: Readonly<Record<string, HospitalHoliday>>,
  after: Readonly<Record<string, HospitalHoliday>>,
): Set<string> {
  const keys = new Set<string>()
  for (const id of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const b = before[id]
    const a = after[id]
    if (a === b) continue
    if (b !== undefined) keys.add(holidayKey(b.dateISO, b.hospitalId))
    if (a !== undefined) keys.add(holidayKey(a.dateISO, a.hospitalId))
  }
  return keys
}

function touchedListIds(state: AppState, schedule: AppState['schedule'], masters: AppState['masters']): Set<string> {
  const touched = new Set<string>()
  const before = state.schedule
  if (masters.slotStatuses !== state.masters.slotStatuses) {
    for (const id of Object.keys(schedule.lists)) touched.add(id)
    return touched
  }
  if (schedule.lists !== before.lists) {
    for (const [id, list] of Object.entries(schedule.lists)) if (before.lists[id] !== list) touched.add(id)
    // A removed List's live conflicts resolve with it (audited as such).
    for (const id of Object.keys(before.lists)) if (schedule.lists[id] === undefined) touched.add(id)
  }
  if (schedule.slots !== before.slots) {
    const changedSlots = new Set<string>()
    for (const [id, slot] of Object.entries(schedule.slots)) if (before.slots[id] !== slot) changedSlots.add(id)
    if (changedSlots.size > 0) {
      for (const list of Object.values(schedule.lists)) if (list.slotId !== undefined && changedSlots.has(list.slotId)) touched.add(list.id)
    }
  }
  if (masters.holidays !== state.masters.holidays) {
    listsAtHoliday(schedule.lists, changedHolidayKeys(state.masters.holidays, masters.holidays), touched)
  }
  return touched
}

/** Which fact went, for the resolved meta. */
function whatChanged(cause: ExpectedConflict, before: List, after: List, beforeState: AppState, masters: AppState['masters'], slots: Readonly<Record<string, Slot>>): string {
  if (cause.kind === 'holiday') {
    const id = cause.holidayId ?? ''
    const was = beforeState.masters.holidays[id]
    const now = masters.holidays[id]
    if (now === undefined) return 'holidayDeleted'
    if (was !== undefined && (was.dateISO !== now.dateISO || was.hospitalId !== now.hospitalId)) return 'holidayMoved'
    if (before.hospitalId !== after.hospitalId) return 'hospitalChanged'
    return 'listMoved'
  }
  if (before.slotId !== after.slotId) return 'listReassigned'
  const slot = after.slotId !== undefined ? slots[after.slotId] : undefined
  if (slot !== undefined && slot.status !== cause.statusKey) return 'sessionStatusChanged'
  return 'statusMasterChanged'
}

/**
 * Reconcile the Lists a patch touched. Returns the patch with its schedule's
 * Lists brought in line, the metas to append, and the result `mutate()` hands
 * back to its caller.
 */
export function reconcileConflictsInPatch(
  state: AppState,
  patch: DomainPatch,
  atISO: string,
): { patch: DomainPatch; metas: MutationMeta[]; result: MutationResult } {
  const schedule = patch.schedule ?? state.schedule
  const masters = patch.masters ?? state.masters
  if (schedule === state.schedule && masters === state.masters) return { patch, metas: [], result: EMPTY_MUTATION_RESULT }
  const touched = touchedListIds(state, schedule, masters)
  if (touched.size === 0) return { patch, metas: [], result: EMPTY_MUTATION_RESULT }

  const afterFacts: Facts = { slots: schedule.slots, statuses: masters.slotStatuses, holidays: holidayIndex(masters.holidays) }
  const beforeFacts: Facts = { slots: state.schedule.slots, statuses: state.masters.slotStatuses, holidays: holidayIndex(state.masters.holidays) }
  const afterLookups = conflictLookups({ masters, schedule })
  const beforeLookups = conflictLookups(state)

  let lists: Record<string, List> | null = null
  const metas: MutationMeta[] = []
  const raised: string[] = []
  const resolved: string[] = []
  for (const id of [...touched].sort()) {
    const list = schedule.lists[id]
    if (list === undefined) {
      const removed = state.schedule.lists[id]
      if (removed === undefined || removed.conflicts.length === 0) continue
      for (const c of removed.conflicts) {
        const { detail } = describeConflict(c, removed, beforeLookups)
        metas.push({
          entityType: 'list',
          entityId: id,
          action: 'list.conflictResolved',
          before: { cause: c.cause, kind: c.kind, reason: CONFLICT_REASONS[c.kind], detail },
          after: { cause: c.cause, change: 'listRemoved' },
          stampBookingId: null,
        })
      }
      resolved.push(id)
      continue
    }
    const facts = conflictFactsFor(list, afterFacts)
    const expected = expectedConflicts(list, facts)
    const { next } = reconcileListConflicts(list, expected, atISO)
    if (next !== list) {
      lists ??= { ...schedule.lists }
      lists[id] = next
    }

    // Metas follow the facts: a cause newly arising, or one that went. A List
    // locking (AUTHORISED) or being cleared changes neither.
    const prev = state.schedule.lists[id]
    const beforeAll = prev === undefined ? [] : expectedConflicts(prev, conflictFactsFor(prev, beforeFacts), { ignoreLock: true })
    const beforeShown = prev === undefined ? [] : expectedConflicts(prev, conflictFactsFor(prev, beforeFacts))
    const afterAll = expectedConflicts(list, facts, { ignoreLock: true })
    const beforeCauses = new Set(beforeAll.map((c) => c.cause))
    const afterCauses = new Set(afterAll.map((c) => c.cause))
    const newly = expected.filter((c) => !beforeCauses.has(c.cause))
    const gone = beforeShown.filter((c) => !afterCauses.has(c.cause))
    for (const c of newly) {
      const { detail } = describeConflict(c, list, afterLookups)
      metas.push({
        entityType: 'list',
        entityId: id,
        action: 'list.conflict',
        after: { cause: c.cause, kind: c.kind, reason: CONFLICT_REASONS[c.kind], detail },
        stampBookingId: null,
      })
    }
    for (const c of gone) {
      const { detail } = describeConflict(c, prev!, beforeLookups)
      metas.push({
        entityType: 'list',
        entityId: id,
        action: 'list.conflictResolved',
        before: { cause: c.cause, kind: c.kind, reason: CONFLICT_REASONS[c.kind], detail },
        after: { cause: c.cause, change: whatChanged(c, prev!, list, state, masters, schedule.slots) },
        stampBookingId: null,
      })
    }
    if (newly.length > 0) raised.push(id)
    if (gone.length > 0) resolved.push(id)
  }

  const nextPatch: DomainPatch = lists === null ? patch : { ...patch, schedule: { ...schedule, lists } }
  return { patch: nextPatch, metas, result: { conflictsRaised: raised, conflictsResolved: resolved } }
}

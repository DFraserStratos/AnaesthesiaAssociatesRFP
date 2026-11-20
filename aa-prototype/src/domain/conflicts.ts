/**
 * Conflicts, as one derived rule (catch-up Phase 30; US-01.5.2, US-01.5.4,
 * FT-01.5; OQ-09 answered: a soft warning, never a block).
 *
 * A List conflicts when, and only when, its hospital is closed on its date (a
 * hospital holiday row): kind `holiday`. An anaesthetist's unavailability,
 * short-notice sickness included, is never a conflict (D59, OQ-81 part 3;
 * catch-up Phase 32b): a List never stays on a closed session, because every
 * status write that closes a session holding a List moves the List first
 * (`markUnavailableAndMoveList`). An AUTHORISED List (locked, nothing left to
 * resolve) and a seeded backdrop List never conflict. A Draft List can carry a
 * `holiday` conflict.
 *
 * "Booked List" in the catalogue (US-01.5.2 AC2, US-01.5.4 AC1) reads as any
 * assigned List, with or without Bookings: a List exists only once assigned,
 * and a recurring booking creates its List before any Bookings exist.
 *
 * Nothing here is stamped by a store action: `mutate()` re-runs
 * `reconcileListConflicts` over every List whose facts a mutation touched
 * (`store/conflictReconcile.ts`), and the seed ends with
 * `reconcileAllConflicts`. Wording is derived (`describeConflict`), never
 * stored. Pure: no React, no store, no `shared/`.
 */

import type { ConflictClear, HospitalHoliday, List, ListConflict, PublicHoliday } from './types'
import { closuresAt, closuresIndex, type Closure, type ClosureIndex, type ClosureSources } from './holidays'

// ---------------------------------------------------------------------------
// Backdrop history (moved here from store/selectors.ts so the domain can read it)
// ---------------------------------------------------------------------------

/**
 * Seeded historical backdrop (Phase 10; `seed/history.ts`). These settled
 * L-HIST Lists / HINV invoices exist to populate the ANAESTHETIST money views
 * (Outstanding, payments, the GST report); they are NOT live office-pipeline items, so the
 * office surfaces (billing monitor, Invoices table, recently-billed, the demo
 * payment picker) exclude them, while the ledger money selectors include them.
 * Since catch-up Phase 38a Dr Souter's are also her browsable history (search
 * and the date lookup reach them, January to June 2026); they stay out of the
 * office surfaces and the anaesthetist's main view.
 * `L-RB-` is the "Seed a month of BCTIs" demo action's history (catch-up Phase 16).
 */
export function isBackdropList(list: Pick<List, 'id'>): boolean {
  return list.id.startsWith('L-HIST') || list.id.startsWith('L-RB-')
}

// ---------------------------------------------------------------------------
// Causes
// ---------------------------------------------------------------------------

export const holidayCause = (holidayId: string): string => `holiday:${holidayId}`
/** A master public holiday's cause (catch-up Phase 42), beside a hospital holiday's. */
export const publicHolidayCause = (publicHolidayId: string): string => `publicHoliday:${publicHolidayId}`

/** A conflict as its facts, before it is stamped with when it was raised. */
export type ExpectedConflict = Omit<ListConflict, 'raisedAtISO'>

/** Rebuild a conflict's facts from its cause (a cleared conflict is held only as its cause). */
export function conflictFromCause(cause: string): ExpectedConflict | null {
  const [kind, a] = cause.split(':')
  if (a === undefined || a === '') return null
  if (kind === 'holiday') return { kind: 'holiday', cause, holidayId: a }
  if (kind === 'publicHoliday') return { kind: 'holiday', cause, publicHolidayId: a }
  return null
}

// ---------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------

/** The closures a List's hospital has on its date, read through `domain/holidays.ts` (catch-up Phase 42). */
export type HolidayIndex = ClosureIndex

export { closureKey as holidayKey } from './holidays'

/** Index both calendars (hospital holidays and the master public holidays) for the rule. */
export function holidayIndex(sources: ClosureSources): HolidayIndex {
  return closuresIndex(sources)
}

/** Everything the rule reads for one List: the closures at its hospital on its date. */
export interface ConflictFacts {
  closures: readonly Closure[]
}

export function conflictFactsFor(list: Pick<List, 'dateISO' | 'hospitalId'>, inputs: { holidays: HolidayIndex }): ConflictFacts {
  return { closures: closuresAt(inputs.holidays, list.dateISO, list.hospitalId) }
}

function conflictOf(closure: Closure): ExpectedConflict {
  return closure.source === 'hospital'
    ? { kind: 'holiday', cause: holidayCause(closure.holidayId), holidayId: closure.holidayId }
    : { kind: 'holiday', cause: publicHolidayCause(closure.publicHolidayId), publicHolidayId: closure.publicHolidayId }
}

// ---------------------------------------------------------------------------
// The rule
// ---------------------------------------------------------------------------

/**
 * The conflicts a List should carry, in a stable order (holidays by id).
 * `ignoreLock` computes the facts for an AUTHORISED List too, which the store
 * uses to tell a clash going (resolved) from a List locking.
 */
export function expectedConflicts(
  list: Pick<List, 'id' | 'state' | 'removedAtISO'>,
  facts: ConflictFacts,
  options: { ignoreLock?: boolean } = {},
): ExpectedConflict[] {
  if (isBackdropList(list)) return []
  // A removed Draft List has left every view but History (US-01.6.4).
  if (list.removedAtISO !== undefined) return []
  if (list.state === 'AUTHORISED' && options.ignoreLock !== true) return []
  return facts.closures.map(conflictOf)
}

/** A clear that still applies: its cause is among the expected conflicts. */
export function liveClears(list: Pick<List, 'conflictClears'>, expected: readonly ExpectedConflict[]): ConflictClear[] {
  const causes = new Set(expected.map((c) => c.cause))
  return (list.conflictClears ?? []).filter((c) => causes.has(c.cause))
}

export interface ReconcileResult {
  /** The same object when nothing changed. */
  next: List
  /** Conflicts now stored that were not before. */
  raised: ListConflict[]
  /** Conflicts no longer stored. */
  resolved: ListConflict[]
}

/**
 * Bring a List's stored conflicts in line with the expected ones: a conflict
 * that persists keeps its `raisedAtISO`, a new one is stamped `atISO`, a clear
 * whose cause has gone is dropped (so a clash that goes and comes back flags
 * again), and an expected conflict with a live clear is not stored (the clear
 * holds it back). Returns the same List object when nothing changed.
 */
export function reconcileListConflicts(list: List, expected: readonly ExpectedConflict[], atISO: string): ReconcileResult {
  const clears = liveClears(list, expected)
  const cleared = new Set(clears.map((c) => c.cause))
  const existing = new Map(list.conflicts.map((c) => [c.cause, c]))
  const conflicts: ListConflict[] = []
  const raised: ListConflict[] = []
  for (const e of expected) {
    if (cleared.has(e.cause)) continue
    const kept = existing.get(e.cause)
    if (kept !== undefined) {
      conflicts.push(kept)
    } else {
      const conflict: ListConflict = { ...e, raisedAtISO: atISO }
      conflicts.push(conflict)
      raised.push(conflict)
    }
  }
  const keptCauses = new Set(conflicts.map((c) => c.cause))
  const resolved = list.conflicts.filter((c) => !keptCauses.has(c.cause))
  const clearsChanged = clears.length !== (list.conflictClears ?? []).length
  const conflictsChanged =
    conflicts.length !== list.conflicts.length || conflicts.some((c, i) => c !== list.conflicts[i])
  if (!clearsChanged && !conflictsChanged) return { next: list, raised: [], resolved: [] }
  const next: List = { ...list, conflicts }
  if (clears.length > 0) next.conflictClears = clears
  else delete next.conflictClears
  return { next, raised, resolved }
}

/**
 * Reconcile every List (the seed's last step, and the invariant tests'
 * expectation). Returns the same record when nothing changed.
 */
export function reconcileAllConflicts(
  lists: Readonly<Record<string, List>>,
  inputs: {
    holidays: Readonly<Record<string, HospitalHoliday>> | readonly HospitalHoliday[]
    publicHolidays: Readonly<Record<string, PublicHoliday>> | readonly PublicHoliday[]
  },
  atISO: string,
): Record<string, List> {
  const holidays = holidayIndex({ hospitalHolidays: inputs.holidays, publicHolidays: inputs.publicHolidays })
  let out: Record<string, List> | null = null
  for (const list of Object.values(lists)) {
    const expected = expectedConflicts(list, conflictFactsFor(list, { holidays }))
    const { next } = reconcileListConflicts(list, expected, atISO)
    if (next !== list) {
      out ??= { ...lists }
      out[list.id] = next
    }
  }
  return out ?? (lists as Record<string, List>)
}

// ---------------------------------------------------------------------------
// Wording
// ---------------------------------------------------------------------------

export type ConflictReason = 'Hospital closed'

export const CONFLICT_REASONS: Record<ListConflict['kind'], ConflictReason> = {
  holiday: 'Hospital closed',
}

/** What the wording reads. Names arrive formatted (the domain never imports `shared/`). */
export interface ConflictLookups {
  holidays: Readonly<Record<string, HospitalHoliday>>
  /** The master public holidays (catch-up Phase 42); absent reads as none. */
  publicHolidays?: Readonly<Record<string, PublicHoliday>>
  hospitalName: (hospitalId: string) => string
}

function sentence(text: string): string {
  const t = text.trim()
  return /[.!?)]$/.test(t) ? t : `${t}.`
}

/** The reason and detail line for a conflict, for display and audit. No dashes, and never the word "slot" (OQ-64). */
export function describeConflict(
  conflict: Pick<ListConflict, 'kind' | 'holidayId' | 'publicHolidayId'>,
  list: Pick<List, 'hospitalId'>,
  lookups: ConflictLookups,
): { reason: ConflictReason; detail: string } {
  const reason = CONFLICT_REASONS[conflict.kind]
  if (conflict.publicHolidayId !== undefined) {
    // "St George's is closed: Labour Day (public holiday)." (catch-up Phase 42)
    const hospital = list.hospitalId !== undefined ? lookups.hospitalName(list.hospitalId) : 'The hospital'
    const row = lookups.publicHolidays?.[conflict.publicHolidayId]
    if (row === undefined) return { reason, detail: `${hospital} is closed on this date (public holiday).` }
    return { reason, detail: `${hospital} is closed: ${row.name.trim().replace(/[.!?]$/, '')} (public holiday).` }
  }
  const holiday = conflict.holidayId !== undefined ? lookups.holidays[conflict.holidayId] : undefined
  const hospitalId = holiday?.hospitalId ?? list.hospitalId
  const hospital = hospitalId !== undefined ? lookups.hospitalName(hospitalId) : 'The hospital'
  if (holiday === undefined) return { reason, detail: `${hospital} is closed on this date.` }
  return { reason, detail: `${hospital} is closed: ${sentence(holiday.name)}` }
}

// ---------------------------------------------------------------------------
// Preview (inline warnings before confirm)
// ---------------------------------------------------------------------------

/**
 * The conflicts an assignment, phone booking or edit would raise (a closed
 * hospital), for the warning shown before confirm (which never disables it).
 */
export function conflictPreview(input: {
  dateISO: string
  hospitalId: string | undefined
  holidays: Readonly<Record<string, HospitalHoliday>> | readonly HospitalHoliday[]
  publicHolidays: Readonly<Record<string, PublicHoliday>> | readonly PublicHoliday[]
}): ExpectedConflict[] {
  const index = holidayIndex({ hospitalHolidays: input.holidays, publicHolidays: input.publicHolidays })
  const facts: ConflictFacts = {
    closures: input.hospitalId === undefined ? [] : closuresAt(index, input.dateISO, input.hospitalId),
  }
  return expectedConflicts({ id: '', state: 'ACTIVE' }, facts)
}

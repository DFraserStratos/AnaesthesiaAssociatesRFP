/**
 * Conflicts, as one derived rule (catch-up Phase 30; US-01.5.2, US-01.5.4,
 * FT-01.5; OQ-09 answered: a soft warning, never a block).
 *
 * A List conflicts when, and only when:
 * - `holiday`: its hospital is closed on its date (a hospital holiday row), or
 * - `availability`: the Slot it sits in carries a closed status (Phase 29's
 *   `isClosed`, keyed on the status's fixed ID, so a relabelled status changes
 *   only the wording).
 * An AUTHORISED List (locked, nothing left to resolve) and a seeded backdrop
 * List never conflict. A List with no Slot record (Phase 31's Draft Lists) can
 * carry a `holiday` conflict but never an `availability` one.
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

import { isClosed, statusFor, type SlotStatusRecords } from './slotStatus'
import type { ConflictClear, HospitalHoliday, List, ListConflict, Slot, SlotStatusKey } from './types'

// ---------------------------------------------------------------------------
// Backdrop history (moved here from store/selectors.ts so the domain can read it)
// ---------------------------------------------------------------------------

/**
 * Seeded historical backdrop (Phase 10; `seed/history.ts`). These settled
 * L-HIST Lists / HINV invoices exist to populate the ANAESTHETIST money views
 * (receivables aging, GST); they are NOT live office-pipeline items, so the
 * office surfaces (billing monitor, Invoices table, recently-billed, the demo
 * payment picker) exclude them, while the mirror money selectors include them.
 * `L-RB-` is the "Seed a month of BCTIs" demo action's history (catch-up Phase 16).
 */
export function isBackdropList(list: Pick<List, 'id'>): boolean {
  return list.id.startsWith('L-HIST') || list.id.startsWith('L-RB-')
}

// ---------------------------------------------------------------------------
// Causes
// ---------------------------------------------------------------------------

export const holidayCause = (holidayId: string): string => `holiday:${holidayId}`
export const availabilityCause = (slotId: string, statusKey: SlotStatusKey): string => `availability:${slotId}:${statusKey}`

/** A conflict as its facts, before it is stamped with when it was raised. */
export type ExpectedConflict = Omit<ListConflict, 'raisedAtISO'>

/** Rebuild a conflict's facts from its cause (a cleared conflict is held only as its cause). */
export function conflictFromCause(cause: string): ExpectedConflict | null {
  const [kind, a, b] = cause.split(':')
  if (kind === 'holiday' && a !== undefined && a !== '') return { kind: 'holiday', cause, holidayId: a }
  if (kind === 'availability' && a !== undefined && b !== undefined) return { kind: 'availability', cause, slotId: a, statusKey: b }
  return null
}

// ---------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------

/** Holidays keyed `<dateISO>|<hospitalId>`, each list sorted by id. */
export type HolidayIndex = ReadonlyMap<string, readonly HospitalHoliday[]>

export const holidayKey = (dateISO: string, hospitalId: string): string => `${dateISO}|${hospitalId}`

export function holidayIndex(holidays: Readonly<Record<string, HospitalHoliday>> | readonly HospitalHoliday[]): HolidayIndex {
  const rows = Array.isArray(holidays) ? (holidays as readonly HospitalHoliday[]) : Object.values(holidays as Record<string, HospitalHoliday>)
  const index = new Map<string, HospitalHoliday[]>()
  for (const h of rows) {
    const key = holidayKey(h.dateISO, h.hospitalId)
    const bucket = index.get(key)
    if (bucket === undefined) index.set(key, [h])
    else bucket.push(h)
  }
  for (const bucket of index.values()) bucket.sort((x, y) => x.id.localeCompare(y.id))
  return index
}

/** Everything the rule reads for one List. */
export interface ConflictFacts {
  /** The List's Slot record, or undefined (a Draft List, or a backdrop List). */
  slot: Pick<Slot, 'id' | 'status'> | undefined
  statuses: SlotStatusRecords
  /** The holidays at the List's hospital on its date. */
  holidays: readonly HospitalHoliday[]
}

export function conflictFactsFor(
  list: Pick<List, 'slotId' | 'dateISO' | 'hospitalId'>,
  inputs: { slots: Readonly<Record<string, Slot>>; statuses: SlotStatusRecords; holidays: HolidayIndex },
): ConflictFacts {
  return {
    // A Draft List has no Slot, so it can carry a holiday conflict but never an availability one (catch-up Phase 31).
    slot: list.slotId === undefined ? undefined : inputs.slots[list.slotId],
    statuses: inputs.statuses,
    holidays: inputs.holidays.get(holidayKey(list.dateISO, list.hospitalId)) ?? [],
  }
}

// ---------------------------------------------------------------------------
// The rule
// ---------------------------------------------------------------------------

/**
 * The conflicts a List should carry, in a stable order (holidays by id, then
 * availability). `ignoreLock` computes the facts for an AUTHORISED List too,
 * which the store uses to tell a clash going (resolved) from a List locking.
 */
export function expectedConflicts(
  list: Pick<List, 'id' | 'state' | 'slotId' | 'removedAtISO'>,
  facts: ConflictFacts,
  options: { ignoreLock?: boolean } = {},
): ExpectedConflict[] {
  if (isBackdropList(list)) return []
  // A removed Draft List has left every view but History (US-01.6.4).
  if (list.removedAtISO !== undefined) return []
  if (list.state === 'AUTHORISED' && options.ignoreLock !== true) return []
  const out: ExpectedConflict[] = facts.holidays.map((h) => ({ kind: 'holiday', cause: holidayCause(h.id), holidayId: h.id }))
  const slot = facts.slot
  if (slot !== undefined && slot.id === list.slotId && isClosed(statusFor(facts.statuses, slot.status))) {
    out.push({ kind: 'availability', cause: availabilityCause(slot.id, slot.status), slotId: slot.id, statusKey: slot.status })
  }
  return out
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
  inputs: { slots: Readonly<Record<string, Slot>>; statuses: SlotStatusRecords; holidays: Readonly<Record<string, HospitalHoliday>> | readonly HospitalHoliday[] },
  atISO: string,
): Record<string, List> {
  const holidays = holidayIndex(inputs.holidays)
  let out: Record<string, List> | null = null
  for (const list of Object.values(lists)) {
    const expected = expectedConflicts(list, conflictFactsFor(list, { slots: inputs.slots, statuses: inputs.statuses, holidays }))
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

export type ConflictReason = 'Hospital closed' | 'Anaesthetist unavailable'

export const CONFLICT_REASONS: Record<ListConflict['kind'], ConflictReason> = {
  holiday: 'Hospital closed',
  availability: 'Anaesthetist unavailable',
}

/** What the wording reads. Names arrive formatted (the domain never imports `shared/`). */
export interface ConflictLookups {
  holidays: Readonly<Record<string, HospitalHoliday>>
  hospitalName: (hospitalId: string) => string
  /** "Dr Rutherford" */
  anaesthetistName: (anaesthetistId: string) => string
  slots: Readonly<Record<string, Slot>>
  statuses: SlotStatusRecords
}

function sentence(text: string): string {
  const t = text.trim()
  return /[.!?)]$/.test(t) ? t : `${t}.`
}

/** A note quoted mid-sentence: lower-case the first letter unless the first word is an acronym or a title. */
function quotedNote(note: string): string {
  const t = note.trim()
  const first = t.split(/\s+/)[0] ?? ''
  const keep = /^[A-Z]{2,}/.test(first) || /^(Dr|Mr|Ms|Mrs|Miss|Prof)\b/.test(first)
  return sentence(keep ? t : t.charAt(0).toLowerCase() + t.slice(1))
}

/**
 * The reason and detail line for a conflict, for display and audit. The status
 * word is the status's current label (the cause keeps its fixed ID). No dashes,
 * and never the word "slot" (OQ-64).
 */
export function describeConflict(
  conflict: Pick<ListConflict, 'kind' | 'holidayId' | 'slotId' | 'statusKey'>,
  list: Pick<List, 'anaesthetistId' | 'hospitalId'>,
  lookups: ConflictLookups,
): { reason: ConflictReason; detail: string } {
  const reason = CONFLICT_REASONS[conflict.kind]
  if (conflict.kind === 'holiday') {
    const holiday = conflict.holidayId !== undefined ? lookups.holidays[conflict.holidayId] : undefined
    const hospitalId = holiday?.hospitalId ?? list.hospitalId
    const hospital = hospitalId !== undefined ? lookups.hospitalName(hospitalId) : 'The hospital'
    if (holiday === undefined) return { reason, detail: `${hospital} is closed on this date.` }
    return { reason, detail: `${hospital} is closed: ${sentence(holiday.name)}` }
  }
  const who = list.anaesthetistId !== undefined ? lookups.anaesthetistName(list.anaesthetistId) : 'The anaesthetist'
  const label = statusFor(lookups.statuses, conflict.statusKey)?.label ?? 'unavailable'
  const slot = conflict.slotId !== undefined ? lookups.slots[conflict.slotId] : undefined
  const note = slot !== undefined && slot.status === conflict.statusKey ? (slot.note ?? '').trim() : ''
  const base = `${who} is marked ${label} for this session.`
  return { reason, detail: note === '' ? base : `${base} Note: ${quotedNote(note)}` }
}

// ---------------------------------------------------------------------------
// Preview (inline warnings before confirm)
// ---------------------------------------------------------------------------

/**
 * The conflicts an assignment, phone booking, edit or move would raise, for
 * the warning shown before confirm (which never disables it).
 */
export function conflictPreview(input: {
  dateISO: string
  hospitalId: string | undefined
  slot: Pick<Slot, 'id' | 'status'> | undefined
  statuses: SlotStatusRecords
  holidays: Readonly<Record<string, HospitalHoliday>> | readonly HospitalHoliday[]
}): ExpectedConflict[] {
  const index = holidayIndex(input.holidays)
  const facts: ConflictFacts = {
    slot: input.slot,
    statuses: input.statuses,
    holidays: input.hospitalId === undefined ? [] : (index.get(holidayKey(input.dateISO, input.hospitalId)) ?? []),
  }
  return expectedConflicts({ id: '', state: 'ACTIVE', slotId: input.slot?.id ?? '' }, facts)
}

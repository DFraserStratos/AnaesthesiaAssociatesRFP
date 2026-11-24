/**
 * The seed's public hospital sessions, re-homed (catch-up Phase 32d; DM-71,
 * RV-43, D86: OQ-139 answered). Public is a Slot status (`publicHospital`)
 * that works like Unavailable, with an optional note and no List detail; the
 * prototype-only `public` List kind is retired.
 *
 * The seed still projects the twelve weekly public patterns and the recorded
 * window's acute draws as Lists in its first pass (kind `private`), so every
 * `rng()` and `slotRng` draw, the filler Bookings' `bookable` selection and
 * every Booking's placement stay exactly as they were. Once the last Booking is
 * placed, `rehomePublicLists` settles each of those Lists (our reading, logged
 * for the owner):
 *
 * - a List holding a Booking stays where it is, an ordinary private List with
 *   the same id, hospital, surgeon, note and figures, and no recurring link
 *   (its pattern is not a recurring booking any more);
 * - a bookless List goes, and its session becomes Public with the note "CPH",
 *   carrying the anaesthetist's series id when a pattern projected it, or as a
 *   one-off when a recorded-window draw did.
 *
 * Each anaesthetist with a pattern gets one weekly Public series from the
 * canvas start with no end date (`publicSessionSeries`), so `seriesCalendarFor`
 * paints days added later as Public. An occurrence where a List survives is a
 * deleted instance of the series, so no closed status ever sits under a List
 * and no flag, conflict or Draft List is raised. No surviving id moves; a
 * removed List leaves a gap and nothing is renumbered.
 *
 * Pure: seed time only, no clock reads.
 */

import type { AvailabilitySeries, List, RecurringBooking, SeriesException, Slot, Weekday } from '../types'
import { instanceKey, seriesOccurrences } from '../availabilitySeries'
import { slotIdFor } from '../slots'
import { SEED_STATUS } from '../slotStatus'
import { HOSP } from './cast'
import { PUBLIC_SESSION_PATTERNS, type PublicSessionPattern } from './recurringBookings'

/** The note on every seeded Public session (Christchurch Public Hospital). */
export const PUBLIC_SESSION_NOTE = 'CPH'

/** When the seed's Public series were created (the canvas's notional set-up). */
export const PUBLIC_SERIES_CREATED_AT = '2026-11-04T08:00:00'

/** The patterns as the first pass projects them: private Lists, every field as before. */
export function publicPatternsForFirstPass(patterns: readonly PublicSessionPattern[] = PUBLIC_SESSION_PATTERNS): RecurringBooking[] {
  return patterns.map((p) => ({ ...p, kind: 'private' }))
}

/** The anaesthetists with a pattern, in first-pattern order, with their weekdays and sessions. */
function patternsByAnaesthetist(patterns: readonly PublicSessionPattern[]): Map<string, PublicSessionPattern[]> {
  const out = new Map<string, PublicSessionPattern[]>()
  for (const p of patterns) {
    const bucket = out.get(p.anaesthetistId)
    if (bucket === undefined) out.set(p.anaesthetistId, [p])
    else bucket.push(p)
  }
  return out
}

/** The series id of the n-th seeded Public series (the store's `AS####` form). */
export function publicSeriesId(n: number): string {
  return `AS${String(n).padStart(4, '0')}`
}

/**
 * One weekly Public series per anaesthetist with a pattern: their weekdays, AM,
 * PM or both (each anaesthetist's patterns share one session choice; a dev
 * assertion holds it), note "CPH", from `startISO` with no end date.
 */
export function publicSessionSeries(
  startISO: string,
  patterns: readonly PublicSessionPattern[] = PUBLIC_SESSION_PATTERNS,
): AvailabilitySeries[] {
  const out: AvailabilitySeries[] = []
  for (const [anaesthetistId, rows] of patternsByAnaesthetist(patterns)) {
    const weekdays = [...new Set(rows.map((r) => r.dayOfWeek as Weekday))].sort((a, b) => a - b)
    const sessionsByDay = new Map<number, Set<string>>()
    for (const r of rows) {
      const set = sessionsByDay.get(r.dayOfWeek) ?? new Set<string>()
      set.add(r.session)
      sessionsByDay.set(r.dayOfWeek, set)
    }
    const shapes = new Set([...sessionsByDay.values()].map((s) => [...s].sort().join('+')))
    if (shapes.size !== 1) throw new Error(`Public patterns for ${anaesthetistId} mix session choices`)
    const shape = [...shapes][0]!
    const sessions = shape === 'AM+PM' ? 'both' : (shape as 'AM' | 'PM')
    out.push({
      id: publicSeriesId(out.length + 1),
      anaesthetistId,
      statusKey: SEED_STATUS.publicHospital,
      sessions,
      note: PUBLIC_SESSION_NOTE,
      weekdays,
      everyWeeks: 1,
      startISO,
      exceptions: {},
      createdAtISO: PUBLIC_SERIES_CREATED_AT,
    })
  }
  return out
}

export interface RehomeResult {
  /** Lists that held a Booking and stay, now private with no recurring link. */
  kept: string[]
  /** Bookless Lists removed; their sessions are Public. */
  removed: string[]
  /** The seeded Public series, their surviving-List occurrences recorded as deleted instances. */
  series: AvailabilitySeries[]
}

/**
 * Re-home the first pass's public Lists (see the file header). `publicListIds`
 * are the Lists the patterns and the acute draws projected; `bookedListIds`
 * every List a Booking sits on. Mutates `lists` and `slots` in place, as the
 * seed's other fixups do.
 */
export function rehomePublicLists(input: {
  lists: Record<string, List>
  slots: Record<string, Slot>
  publicListIds: ReadonlySet<string>
  bookedListIds: ReadonlySet<string>
  canvasStartISO: string
  canvasEndISO: string
  patterns?: readonly PublicSessionPattern[]
}): RehomeResult {
  const { lists, slots, publicListIds, bookedListIds } = input
  const patterns = input.patterns ?? PUBLIC_SESSION_PATTERNS
  const patternIds = new Set(patterns.map((p) => p.id))
  const series = publicSessionSeries(input.canvasStartISO, patterns)
  const seriesByAnaesthetist = new Map(series.map((s) => [s.anaesthetistId, s]))
  const kept: string[] = []
  const removed: string[] = []

  for (const id of [...publicListIds].sort()) {
    const list = lists[id]
    if (list === undefined || list.state === 'DRAFT' || list.slotId === undefined) continue
    const fromPattern = list.recurringBookingId !== undefined && patternIds.has(list.recurringBookingId)
    if (bookedListIds.has(id) || list.hospitalId !== HOSP.cph) {
      const { recurringBookingId: _rb, ...rest } = list
      lists[id] = fromPattern ? { ...rest, kind: 'private' } : { ...list, kind: 'private' }
      kept.push(id)
      continue
    }
    const slot = slots[list.slotId]
    delete lists[id]
    removed.push(id)
    if (slot === undefined) continue
    const owner = fromPattern ? seriesByAnaesthetist.get(list.anaesthetistId) : undefined
    const next: Slot = { ...slot, status: SEED_STATUS.publicHospital, note: PUBLIC_SESSION_NOTE }
    if (owner !== undefined) next.seriesId = owner.id
    slots[slot.id] = next
  }

  // A List that kept its pattern link elsewhere (a fixup re-pointed it) loses it too.
  for (const [id, list] of Object.entries(lists)) {
    if (list.recurringBookingId !== undefined && patternIds.has(list.recurringBookingId)) {
      const { recurringBookingId: _rb, ...rest } = list
      lists[id] = rest as List
    }
  }

  // An occurrence the series did not paint, where the session is still open (a
  // List survives there, or a fixup freed it), is a deleted instance, so a later
  // series write never closes a session under a List. Closed sessions (leave)
  // are left as they are, as `planSeriesWrite` would.
  for (const s of series) {
    const exceptions: Record<string, SeriesException> = {}
    for (const occ of seriesOccurrences(s, input.canvasStartISO, input.canvasEndISO)) {
      const slot = slots[slotIdFor(s.anaesthetistId, occ.dateISO, occ.session)]
      if (slot === undefined || slot.seriesId === s.id) continue
      if (slot.status !== SEED_STATUS.free) continue
      exceptions[instanceKey(occ.dateISO, occ.session)] = { kind: 'deleted' }
    }
    s.exceptions = exceptions
  }

  return { kept, removed, series }
}

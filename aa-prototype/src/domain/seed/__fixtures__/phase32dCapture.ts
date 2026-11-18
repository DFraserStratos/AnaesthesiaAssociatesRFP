/**
 * Catch-up Phase 32d parity capture (work item 1): what the public List kind's
 * retirement must not move, and the facts it may move, each kept apart.
 *
 * Written once, from the seed as Phase U6 left it (the `public` List kind still
 * in place), into `phase-32d-seed-baseline.json` by a one-off writer, BEFORE
 * the seed was re-homed; `publicRehome.test.ts` compares the re-homed seed with
 * it. Never rewritten. Pure: reads a seed state, no store, no clock. Imported
 * only by tests.
 */

import type { AuditEntry, List, Slot } from '../../types'
import type { SeedState } from '../index'

/** A List as the parity compares it: everything but its kind and its recurring link. */
export type ListFace = Omit<List, 'kind' | 'recurringBookingId' | 'recurringOrigin'>

export interface Phase32dSeedBaseline {
  /** Every Booking, Procedure and billing line, whole. */
  bookings: SeedState['schedule']['bookings']
  procedures: SeedState['schedule']['procedures']
  billingLines: SeedState['schedule']['billingLines']
  /** Every List that holds a Booking, without kind and recurring link. */
  listsWithBookings: Record<string, ListFace>
  /** Every other List (none holds a Booking), whole, the public ones included. */
  otherLists: Record<string, List>
  /** The public-kind Lists, split by whether a Booking sits on them. */
  publicWithBookings: string[]
  publicBookless: string[]
  /** Every Slot, as one compact line (`slotLine`). */
  slots: Record<string, string>
  /** Free sessions (no List, an open status) per day, Tue 21 to Fri 24 Jul. */
  freeByDay: Record<string, number>
  /** The Draft Lists' ids (requests and recurring clashes). */
  draftListIds: string[]
  /** Every seeded audit entry, as one compact line (`auditLine`). */
  audit: string[]
}

export const PARITY_DAYS = ['2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24'] as const

function face(list: List): ListFace {
  const { kind: _kind, recurringBookingId: _rb, recurringOrigin: _ro, ...rest } = list as List & { recurringOrigin?: unknown }
  return rest as ListFace
}

/** The free sessions on a day: a Slot with no List in it whose status is open for bookings. */
export function freeSessionsOn(state: SeedState, dateISO: string): number {
  const held = new Set(Object.values(state.schedule.lists).flatMap((l) => (l.slotId !== undefined ? [l.slotId] : [])))
  const statuses = state.masters.slotStatuses
  return Object.values(state.schedule.slots).filter(
    (s) => s.dateISO === dateISO && !held.has(s.id) && statuses[s.status]?.bookable === true,
  ).length
}

/** A Slot's whole content on one line: status, note, series, times. */
export function slotLine(s: Slot): string {
  return [s.status, s.note ?? '', s.seriesId ?? '', s.startTime ?? '', s.endTime ?? ''].join('|')
}

/** An audit entry's identity on one line. */
export function auditLine(a: AuditEntry): string {
  return [a.id, a.entityType, a.entityId, a.action, a.atISO].join('|')
}

export function capturePhase32d(state: SeedState): Phase32dSeedBaseline {
  const withBooking = new Set(Object.values(state.schedule.bookings).map((b) => b.listId))
  const listsWithBookings: Record<string, ListFace> = {}
  const otherLists: Record<string, List> = {}
  const publicWithBookings: string[] = []
  const publicBookless: string[] = []
  for (const list of Object.values(state.schedule.lists).sort((a, b) => a.id.localeCompare(b.id))) {
    if (withBooking.has(list.id)) listsWithBookings[list.id] = face(list)
    else otherLists[list.id] = list
    if ((list.kind as string) === 'public') (withBooking.has(list.id) ? publicWithBookings : publicBookless).push(list.id)
  }
  const freeByDay: Record<string, number> = {}
  for (const d of PARITY_DAYS) freeByDay[d] = freeSessionsOn(state, d)
  return {
    bookings: state.schedule.bookings,
    procedures: state.schedule.procedures,
    billingLines: state.schedule.billingLines,
    listsWithBookings,
    otherLists,
    publicWithBookings,
    publicBookless,
    slots: Object.fromEntries(Object.values(state.schedule.slots).map((s) => [s.id, slotLine(s)])),
    freeByDay,
    draftListIds: Object.values(state.schedule.lists)
      .filter((l) => l.state === 'DRAFT')
      .map((l) => l.id)
      .sort(),
    audit: state.audit.map(auditLine),
  }
}

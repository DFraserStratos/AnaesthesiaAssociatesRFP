/**
 * THE canvas generator (catch-up Phase 28; US-01.1.1, FT-01.1, US-01.1.3;
 * OQ-81 part 1, settled in the room). The one generation path for the seed,
 * the clock's roll-forward, a new anaesthetist, a start-date edit, a
 * reactivation and a horizon extension.
 *
 * For every ACTIVE anaesthetist, on every date from their start date, it
 * writes an AM and a PM Slot, in the catalogue's order:
 *   1. an inactive anaesthetist, or a date before the start date, gets no Slot;
 *   2. every other Slot is written FREE (EP-01: "each new Slot starts as free");
 *   3. the anaesthetist's calendar is painted onto the Slot's status and note:
 *      the seed's leave windows, then the active availability series
 *      (catch-up Phase 29), which fill only a Slot still at the default status
 *      and mark it with their `seriesId`;
 *   4. the surgeons' recurring bookings are painted on top: a recurring booking on
 *      an open Slot projects a List (id `projectedListId`, state ACTIVE), and
 *      its session times become Slot overrides; one on a closed Slot (any
 *      status not open for bookings, `isClosed` over the status master)
 *      projects nothing and is returned as a clash (Phase 31 turns each clash
 *      into a Draft List, OQ-81 part 2).
 * Nothing is invented: no random sessions, on any date (the slot RNG survives
 * only for the seed's recorded window and filler Bookings). Recurring bookings
 * follow their start and end dates and work on any day, weekends included
 * (catch-up Phase 30). Generation stamps no conflict: a projected List at a
 * closed hospital is flagged by the one rule (`domain/conflicts.ts`), which
 * `mutate()` and the seed's last step run.
 *
 * Pure and order-independent: the same masters and date always yield identical
 * Slots and Lists, so a roll-forward deep-equals a fresh generation.
 */

import { parseISO } from 'date-fns'
import type { List, RecurringBooking, SeedLeaveWindow, Session, Slot, SlotStatusKey } from '../types'
import { projectedListId, slotDatesFor, slotIdFor } from '../slots'
import { defaultSlotStatusKey, isClosedKey, type SlotStatusRecords } from '../slotStatus'
import { activeOn } from '../recurringBookingProjection'

export interface CanvasAnaesthetist {
  id: string
  startDateISO: string
  active: boolean
}

export interface CanvasMasters {
  anaesthetists: readonly CanvasAnaesthetist[]
  recurringBookings: readonly RecurringBooking[]
  /** The anaesthetists' calendar as generator input (the seed's leave windows). */
  leave: readonly SeedLeaveWindow[]
  /**
   * The active availability series' instances on the dates being generated
   * (catch-up Phase 29: `seriesCalendarFor`), painted after `leave` with the
   * series fill rule. Empty for the seed (no series is seeded).
   */
  series: readonly SeriesCalendarEntry[]
  /** The status master: the default status and the closed test read it, never a literal. */
  statuses: SlotStatusRecords
}

/** One series instance as calendar input (an `edited` exception carries its own status; a `deleted` one is absent). */
export interface SeriesCalendarEntry {
  anaesthetistId: string
  dateISO: string
  session: Session
  status: SlotStatusKey
  note?: string
  seriesId: string
}

/** How many sessions the series painted in a generation (for the generate audit entries). */
export function seriesPaintedCount(generated: Pick<GeneratedCanvas, 'slots'>): number {
  return generated.slots.filter((s) => s.seriesId !== undefined).length
}

/** A recurring booking that met a closed Slot: not projected; the store makes it a Draft List (catch-up Phase 31, OQ-81 part 2). */
export interface RecurringClash {
  recurringBookingId: string
  slotId: string
}

export interface GeneratedCanvas {
  slots: Slot[]
  lists: List[]
  clashes: RecurringClash[]
}

const SESSIONS: readonly Session[] = ['AM', 'PM'] as const

/** Generate the Slots, projected Lists and clashes for the given dates. */
export function generateCanvasForDates(masters: CanvasMasters, datesISO: readonly string[]): GeneratedCanvas {
  const slots: Slot[] = []
  const lists: List[] = []
  const clashes: RecurringClash[] = []

  // Index the masters once (the scale test runs 85 x full horizon through here).
  // Several rows may share a weekday and session (one retired, its successor
  // starting): the first in id order that is running that date paints it, as in
  // the projection (`recurringBookingFor`).
  const recurringBySlot = new Map<string, RecurringBooking[]>()
  for (const recurring of [...masters.recurringBookings].sort((a, b) => a.id.localeCompare(b.id))) {
    const key = `${recurring.anaesthetistId}|${recurring.dayOfWeek}|${recurring.session}`
    const bucket = recurringBySlot.get(key)
    if (bucket === undefined) recurringBySlot.set(key, [recurring])
    else bucket.push(recurring)
  }
  const leaveBySlot = new Map<string, SeedLeaveWindow>()
  for (const row of masters.leave) leaveBySlot.set(`${row.anaesthetistId}|${row.dateISO}|${row.session}`, row)
  const seriesBySlot = new Map<string, SeriesCalendarEntry>()
  for (const row of masters.series) {
    const key = `${row.anaesthetistId}|${row.dateISO}|${row.session}`
    if (!seriesBySlot.has(key)) seriesBySlot.set(key, row)
  }
  const defaultKey = defaultSlotStatusKey(masters.statuses)
  const active = masters.anaesthetists.filter((a) => a.active)

  for (const dateISO of datesISO) {
    const dayOfWeek = parseISO(dateISO).getDay()

    for (const anaesthetist of active) {
      // 1. No Slot before the start date (US-01.1.3).
      if (slotDatesFor(anaesthetist.startDateISO, [dateISO]).length === 0) continue
      for (const session of SESSIONS) {
        // 2. Every Slot starts at the default status (Free).
        const slot: Slot = {
          id: slotIdFor(anaesthetist.id, dateISO, session),
          anaesthetistId: anaesthetist.id,
          dateISO,
          session,
          status: defaultKey,
        }

        // 3. The calendar: the seed's leave, then the series (only onto a Slot
        // still at the default status, so a series never overwrites leave).
        const calendarKey = `${anaesthetist.id}|${dateISO}|${session}`
        const leave = leaveBySlot.get(calendarKey)
        if (leave !== undefined) {
          slot.status = leave.status
          if (leave.note !== undefined) slot.note = leave.note
        }
        const instance = seriesBySlot.get(calendarKey)
        if (instance !== undefined && slot.status === defaultKey) {
          slot.status = instance.status
          if (instance.note !== undefined) slot.note = instance.note
          slot.seriesId = instance.seriesId
        }

        // 4. The recurring bookings, on top.
        const recurring = recurringBySlot.get(`${anaesthetist.id}|${dayOfWeek}|${session}`)?.find((r) => activeOn(r, dateISO))
        if (recurring !== undefined) {
          if (isClosedKey(masters.statuses, slot.status)) {
            clashes.push({ recurringBookingId: recurring.id, slotId: slot.id })
          } else {
            const list: List = {
              id: projectedListId(anaesthetist.id, dateISO, session),
              slotId: slot.id,
              dateISO,
              anaesthetistId: anaesthetist.id,
              session,
              state: 'ACTIVE',
              kind: recurring.kind,
              hospitalId: recurring.hospitalId,
              surgeonId: recurring.surgeonId,
              conflicts: [],
              recurringBookingId: recurring.id,
            }
            if (recurring.notes !== undefined) list.notes = recurring.notes
            if (recurring.startTime !== undefined) slot.startTime = recurring.startTime
            if (recurring.endTime !== undefined) slot.endTime = recurring.endTime
            lists.push(list)
          }
        }

        slots.push(slot)
      }
    }
  }

  return { slots, lists, clashes }
}

/** The generator's view of the anaesthetist master. */
export function canvasAnaesthetists(
  anaesthetists: Readonly<Record<string, { registrationNumber: string; startDateISO: string; active: boolean }>> | readonly { registrationNumber: string; startDateISO: string; active: boolean }[],
): CanvasAnaesthetist[] {
  const rows = Array.isArray(anaesthetists) ? anaesthetists : Object.values(anaesthetists)
  return (rows as readonly { registrationNumber: string; startDateISO: string; active: boolean }[]).map((a) => ({
    id: a.registrationNumber,
    startDateISO: a.startDateISO,
    active: a.active,
  }))
}

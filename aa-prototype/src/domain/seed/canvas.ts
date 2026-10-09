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
 *   3. the anaesthetist's calendar (the seed's leave windows) is painted onto
 *      the Slot's status and note;
 *   4. the surgeons' recurring bookings are painted on top: a template on a
 *      free Slot projects a List (id `projectedListId`, state ACTIVE), and its
 *      template times become Slot overrides; a template on an unavailable or
 *      holiday Slot projects nothing and is returned as a clash (Phase 31 turns
 *      each clash into a Draft List, OQ-81 part 2).
 * Nothing is invented: no random sessions, on any date (the slot RNG survives
 * only for the seed's recorded window and filler Bookings). Recurring bookings
 * keep the weekday-only guard until Phase 30 adds weekend patterns. Hospital
 * holidays flag a projected List and never change it.
 *
 * Pure and order-independent: the same masters and date always yield identical
 * Slots and Lists, so a roll-forward deep-equals a fresh generation.
 */

import { parseISO } from 'date-fns'
import type { HospitalHoliday, List, ListConflict, PermanentList, SeedLeaveWindow, Session, Slot } from '../types'
import { projectedListId, slotDatesFor, slotIdFor } from '../slots'

export interface CanvasAnaesthetist {
  id: string
  startDateISO: string
  active: boolean
}

export interface CanvasMasters {
  anaesthetists: readonly CanvasAnaesthetist[]
  permanentLists: readonly PermanentList[]
  /** The anaesthetists' calendar as generator input (the seed's leave windows). */
  leave: readonly SeedLeaveWindow[]
  holidays: readonly HospitalHoliday[]
}

/** A recurring booking that met an unavailable or holiday Slot: not projected, traced for Phase 31. */
export interface RecurringClash {
  permanentListId: string
  slotId: string
}

export interface GeneratedCanvas {
  slots: Slot[]
  lists: List[]
  clashes: RecurringClash[]
}

const SESSIONS: readonly Session[] = ['AM', 'PM'] as const

/**
 * The hospital-holiday conflict a List at a closed hospital carries (the
 * generator, the seed's `placeList`, `assignListToSlot` and `addHospitalHoliday`
 * share it). Null when the hospital is open that day.
 */
export function closedHospitalConflict(
  list: { hospitalId?: string; dateISO: string },
  holidays: readonly HospitalHoliday[],
): ListConflict | null {
  if (list.hospitalId === undefined) return null
  const hit = holidays.find((h) => h.dateISO === list.dateISO && h.hospitalId === list.hospitalId)
  return hit === undefined ? null : { kind: 'holiday', message: closedHospitalMessage(hit.name) }
}

export function closedHospitalMessage(holidayName: string): string {
  return `${holidayName}: the hospital is closed on this date.`
}

/** Generate the Slots, projected Lists and clashes for the given dates. */
export function generateCanvasForDates(masters: CanvasMasters, datesISO: readonly string[]): GeneratedCanvas {
  const slots: Slot[] = []
  const lists: List[] = []
  const clashes: RecurringClash[] = []

  // Index the masters once (the scale test runs 85 x full horizon through here).
  const templateBySlot = new Map<string, PermanentList>()
  for (const template of masters.permanentLists) {
    templateBySlot.set(`${template.anaesthetistId}|${template.dayOfWeek}|${template.session}`, template)
  }
  const leaveBySlot = new Map<string, SeedLeaveWindow>()
  for (const row of masters.leave) leaveBySlot.set(`${row.anaesthetistId}|${row.dateISO}|${row.session}`, row)
  const holidaysByDate = new Map<string, HospitalHoliday[]>()
  for (const holiday of masters.holidays) {
    const existing = holidaysByDate.get(holiday.dateISO)
    if (existing === undefined) holidaysByDate.set(holiday.dateISO, [holiday])
    else existing.push(holiday)
  }
  const active = masters.anaesthetists.filter((a) => a.active)

  for (const dateISO of datesISO) {
    const dayOfWeek = parseISO(dateISO).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    for (const anaesthetist of active) {
      // 1. No Slot before the start date (US-01.1.3).
      if (slotDatesFor(anaesthetist.startDateISO, [dateISO]).length === 0) continue
      for (const session of SESSIONS) {
        // 2. Every Slot starts free.
        const slot: Slot = {
          id: slotIdFor(anaesthetist.id, dateISO, session),
          anaesthetistId: anaesthetist.id,
          dateISO,
          session,
          status: 'free',
        }

        // 3. The calendar.
        const leave = leaveBySlot.get(`${anaesthetist.id}|${dateISO}|${session}`)
        if (leave !== undefined) {
          slot.status = leave.status
          if (leave.note !== undefined) slot.note = leave.note
        }

        // 4. The recurring bookings, on top.
        const template = isWeekend ? undefined : templateBySlot.get(`${anaesthetist.id}|${dayOfWeek}|${session}`)
        if (template !== undefined) {
          if (slot.status !== 'free') {
            clashes.push({ permanentListId: template.id, slotId: slot.id })
          } else {
            const list: List = {
              id: projectedListId(anaesthetist.id, dateISO, session),
              slotId: slot.id,
              dateISO,
              anaesthetistId: anaesthetist.id,
              session,
              state: 'ACTIVE',
              kind: template.kind,
              conflicts: [],
            }
            if (template.hospitalId !== null) list.hospitalId = template.hospitalId
            if (template.surgeonId !== null) list.surgeonId = template.surgeonId
            if (template.notes !== undefined) list.notes = template.notes
            if (template.startTime !== undefined) slot.startTime = template.startTime
            if (template.endTime !== undefined) slot.endTime = template.endTime
            const conflict = closedHospitalConflict(list, holidaysByDate.get(dateISO) ?? [])
            if (conflict !== null) list.conflicts.push(conflict)
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

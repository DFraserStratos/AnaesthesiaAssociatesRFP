/**
 * THE canvas generator — the one deterministic source of Lists. The seeder,
 * the clock's roll-forward and the scale test all call this same function.
 *
 * For every (anaesthetist x date x session) it builds exactly one List — the
 * canvas invariant of 2 Lists per anaesthetist per day:
 *   1. availability master rows (holiday/unavailable) take the slot cleanly —
 *      at generation time approved leave is already-actioned office knowledge,
 *      so a templated booking under a leave window yields a clean leave List,
 *      never a conflict (conflicts are the RUNTIME `setAvailability` path's
 *      job, when live bookings already exist);
 *   2. otherwise the Permanent List template for that weekday fills the slot;
 *   3. otherwise the slot's own hashed RNG fills it (plenty free, some ad hoc
 *      private bookings, occasional public acute cover and unavailability) —
 *      slot-hashed randomness makes generation order-independent, so rolling
 *      the horizon forward reproduces exactly what a fresh full-horizon seed
 *      would have produced (PROGRESS decision, Phase 02);
 *   4. hospital holidays flag (never restatus) a booked List on that date.
 */

import { parseISO } from 'date-fns'
import type {
  AnaesthetistAvailability,
  HospitalHoliday,
  List,
  PermanentList,
  Session,
  SurgeonId,
} from '../types'
import { slotRng } from './slotHash'
import { HOSP, SURG } from './cast'

export interface CanvasMasters {
  /** The seed constant — part of every slot hash. */
  seed: number
  anaesthetistIds: readonly string[]
  permanentLists: readonly PermanentList[]
  availability: readonly AnaesthetistAvailability[]
  holidays: readonly HospitalHoliday[]
}

const SESSIONS: readonly Session[] = ['AM', 'PM'] as const

/** Deterministic slot-derived List id. */
export function listIdForSlot(anaesthetistId: string, dateISO: string, session: Session): string {
  return `L-${anaesthetistId}-${dateISO}-${session}`
}

/** Default session times for a generated booked List. */
function defaultTimes(statusKey: string, session: Session): { startTime: string; endTime: string } | null {
  if (statusKey === 'preop') {
    return session === 'AM' ? { startTime: '09:00', endTime: '12:00' } : { startTime: '13:00', endTime: '17:00' }
  }
  if (statusKey === 'private' || statusKey === 'public') {
    return session === 'AM' ? { startTime: '07:30', endTime: '12:30' } : { startTime: '13:00', endTime: '17:30' }
  }
  return null
}

/** Ad hoc booking pools for the slot RNG (CES stays ophthalmic). */
const ADHOC_HOSPITALS = [HOSP.stg, HOSP.sx, HOSP.forte, HOSP.ces] as const
const CES_SURGEONS: readonly SurgeonId[] = [SURG.whitford, SURG.reid] as const
const GENERAL_SURGEONS: readonly SurgeonId[] = [
  SURG.hale, SURG.patel, SURG.okafor, SURG.lim, SURG.doyle, SURG.tan, SURG.nand, SURG.cameron,
] as const

function pick<T>(rng: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)]
  if (item === undefined) throw new Error('pick from empty pool')
  return item
}

/**
 * Generate the Lists for the given dates — exactly 2 per anaesthetist per day.
 * Pure and order-independent: the same (masters, date, slot) always yields an
 * identical List regardless of which other dates are generated alongside it.
 */
export function generateListsForDates(masters: CanvasMasters, datesISO: readonly string[]): List[] {
  const lists: List[] = []

  // Index the masters once (the scale test runs 85 x full horizon through here).
  const templateBySlot = new Map<string, PermanentList>()
  for (const template of masters.permanentLists) {
    templateBySlot.set(`${template.anaesthetistId}|${template.dayOfWeek}|${template.session}`, template)
  }
  const availabilityBySlot = new Map<string, AnaesthetistAvailability>()
  for (const row of masters.availability) {
    availabilityBySlot.set(`${row.anaesthetistId}|${row.dateISO}|${row.session}`, row)
  }
  const holidaysByDate = new Map<string, HospitalHoliday[]>()
  for (const holiday of masters.holidays) {
    const existing = holidaysByDate.get(holiday.dateISO)
    if (existing === undefined) holidaysByDate.set(holiday.dateISO, [holiday])
    else existing.push(holiday)
  }

  for (const dateISO of datesISO) {
    const dayOfWeek = parseISO(dateISO).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    for (const anaesthetistId of masters.anaesthetistIds) {
      for (const session of SESSIONS) {
        const list: List = {
          id: listIdForSlot(anaesthetistId, dateISO, session),
          dateISO,
          anaesthetistId,
          session,
          state: 'DRAFT',
          statusKey: 'free',
          conflicts: [],
        }

        const availability = availabilityBySlot.get(`${anaesthetistId}|${dateISO}|${session}`)
        const template = templateBySlot.get(`${anaesthetistId}|${dayOfWeek}|${session}`)

        if (availability !== undefined && availability.kind !== 'available') {
          list.statusKey = availability.kind
          if (availability.note !== undefined) list.notes = availability.note
        } else if (template !== undefined && !isWeekend) {
          list.statusKey = template.statusKey
          if (template.hospitalId !== null) list.hospitalId = template.hospitalId
          if (template.surgeonId !== null) list.surgeonId = template.surgeonId
          if (template.notes !== undefined) list.notes = template.notes
        } else {
          // RNG fill — each slot hashes its own stream (order-independent).
          const rng = slotRng(masters.seed, 'fill', anaesthetistId, dateISO, session)
          const draw = rng()
          if (isWeekend) {
            if (draw < 0.08) {
              list.statusKey = 'unavailable'
              list.notes = 'Not available'
            }
          } else if (draw < 0.11) {
            // Office-assigned ad hoc private booking (the non-permanent ~20%
            // of surgeon assignments).
            list.statusKey = 'private'
            const hospitalId = pick(rng, ADHOC_HOSPITALS)
            list.hospitalId = hospitalId
            list.surgeonId = hospitalId === HOSP.ces ? pick(rng, CES_SURGEONS) : pick(rng, GENERAL_SURGEONS)
          } else if (draw < 0.17) {
            list.statusKey = 'public'
            list.hospitalId = HOSP.cph
            list.notes = 'Acute theatre'
          } else if (draw < 0.22) {
            list.statusKey = 'unavailable'
            list.notes = 'Not available'
          }
        }

        const times = defaultTimes(list.statusKey, session)
        if (times !== null) {
          list.startTime = times.startTime
          list.endTime = times.endTime
        }

        // Hospital holidays flag booked Lists; they never restatus them.
        if (list.hospitalId !== undefined) {
          const holidays = holidaysByDate.get(dateISO)
          const hit = holidays?.find((h) => h.hospitalId === list.hospitalId)
          if (hit !== undefined) {
            list.conflicts.push({
              kind: 'holiday',
              message: `${hit.name}: the hospital is closed on this date.`,
            })
          }
        }

        lists.push(list)
      }
    }
  }

  return lists
}

/**
 * The seed's leave calendar (catch-up Phase 28: was the availability master,
 * reconciled into the canvas; now generator input only, painted onto the
 * Slots' status after they are written free) and hospital holidays (upcoming, feeding Phase 06's
 * conflict flags).
 *
 * The design pins: Souter on leave Fri 24 to Sun 26 Jul; Beaumont on leave
 * through Sun 26 ("back Mon 27"); Ngatai through Tue 28 ("back Wed 29");
 * Ngata unavailable Tue 21 (ICU on call); Delaney unavailable Thu 23.
 */

import type { HospitalHoliday, SeedLeaveWindow, Session } from '../types'
import { enumerateDatesISO } from '../clock'
import { ANAE, HOSPITALS } from './cast'

const SESSIONS: readonly Session[] = ['AM', 'PM'] as const

function window(
  anaesthetistId: string,
  fromISO: string,
  toISO: string,
  status: 'holiday' | 'unavailable',
  note: string,
): SeedLeaveWindow[] {
  const rows: SeedLeaveWindow[] = []
  for (const dateISO of enumerateDatesISO(fromISO, toISO)) {
    for (const session of SESSIONS) rows.push({ anaesthetistId, dateISO, session, status, note })
  }
  return rows
}

/**
 * The seed's calendar. Roll-forward and `addAnaesthetist` pass this same
 * constant, so a far edge they generate deep-equals a fresh seed's. Leave set
 * at runtime lives on the Slots it covers (Phase 29 owns leave beyond them).
 */
export const SEED_LEAVE: readonly SeedLeaveWindow[] = [
  ...window(ANAE.souter, '2026-07-24', '2026-07-26', 'holiday', 'Annual leave / back Monday'),
  ...window(ANAE.beaumont, '2026-07-13', '2026-07-26', 'holiday', 'Annual leave / back Mon 27'),
  ...window(ANAE.ngatai, '2026-07-16', '2026-07-28', 'holiday', 'Annual leave / back Wed 29'),
  ...window(ANAE.ngata, '2026-07-21', '2026-07-21', 'unavailable', 'Not available / ICU on call'),
  ...window(ANAE.delaney, '2026-07-23', '2026-07-23', 'unavailable', 'Not available / on call tonight'),
  // Two future windows so holiday content exists beyond July.
  ...window(ANAE.ropata, '2026-08-24', '2026-08-28', 'holiday', 'Annual leave'),
  ...window(ANAE.sharma, '2026-09-14', '2026-09-16', 'holiday', 'NZSA conference'),
] as const

/**
 * Regional public holidays within the horizon, one row per hospital (Labour
 * Day Mon 26 Oct; Canterbury Anniversary Fri 13 Nov 2026). Booked Lists at a
 * hospital on its holiday get a conflict flag from the generator.
 */
export const HOSPITAL_HOLIDAYS: readonly HospitalHoliday[] = HOSPITALS.flatMap((hospital, i) => [
  { id: `HH${String(i * 2 + 1).padStart(3, '0')}`, hospitalId: hospital.id, dateISO: '2026-10-26', name: 'Labour Day' },
  { id: `HH${String(i * 2 + 2).padStart(3, '0')}`, hospitalId: hospital.id, dateISO: '2026-11-13', name: 'Canterbury Anniversary Day' },
])

/**
 * Availability master rows (leave and unavailability, reconciled into the
 * canvas by the generator) and hospital holidays (upcoming, feeding Phase 06's
 * conflict flags).
 *
 * The design pins: Souter on leave Fri 24 to Sun 26 Jul; Beaumont on leave
 * through Sun 26 ("back Mon 27"); Ngatai through Tue 28 ("back Wed 29");
 * Ngata unavailable Tue 21 (ICU on call); Delaney unavailable Thu 23.
 */

import type { AnaesthetistAvailability, HospitalHoliday, Session } from '../types'
import { enumerateDatesISO } from '../clock'
import { ANAE, HOSPITALS } from './cast'

const SESSIONS: readonly Session[] = ['AM', 'PM'] as const

let n = 0
function window(
  anaesthetistId: string,
  fromISO: string,
  toISO: string,
  kind: 'holiday' | 'unavailable',
  note: string,
): AnaesthetistAvailability[] {
  const rows: AnaesthetistAvailability[] = []
  for (const dateISO of enumerateDatesISO(fromISO, toISO)) {
    for (const session of SESSIONS) {
      n += 1
      rows.push({
        id: `AV${String(n).padStart(4, '0')}`,
        anaesthetistId,
        dateISO,
        session,
        kind,
        note,
      })
    }
  }
  return rows
}

export const AVAILABILITY: readonly AnaesthetistAvailability[] = [
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

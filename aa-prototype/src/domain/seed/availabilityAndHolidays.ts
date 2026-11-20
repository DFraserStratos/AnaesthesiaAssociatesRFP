/**
 * The seed's leave calendar (catch-up Phase 28: was the availability master,
 * reconciled into the canvas; now generator input only, painted onto the
 * Slots' status after they are written free), hospital holidays and the master
 * public holidays (upcoming, feeding the conflict flags).
 *
 * The design pins: Souter on leave Fri 24 to Sun 26 Jul; Beaumont on leave
 * through Sun 26 ("back Mon 27"); Ngatai through Tue 28 ("back Wed 29");
 * Ngata unavailable Tue 21 (ICU on call); Delaney unavailable Thu 23.
 */

import type { HospitalHoliday, PublicHoliday, SeedLeaveWindow, Session } from '../types'
import { enumerateDatesISO } from '../clock'
import { ANAE, HOSP } from './cast'

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
 * The master public-holiday calendar (catch-up Phase 42; DM-38, US-13.4.1):
 * one row per statutory or regional holiday, closing every hospital unless it
 * is listed open that day. Labour Day and Canterbury Anniversary Day were one
 * row per hospital before; AA rooms had none, so it is listed open on those
 * two and no List's flag moves (`publicHolidayMigration.test.ts`). Only the
 * first two fall inside the seed's horizon; the rest make the calendar look
 * real and flag Lists if the clock is rolled forward.
 */
export const PUBLIC_HOLIDAYS: readonly PublicHoliday[] = [
  { id: 'PH001', dateISO: '2026-10-26', name: 'Labour Day', kind: 'national', openHospitalIds: [HOSP.aaRooms] },
  { id: 'PH002', dateISO: '2026-11-13', name: 'Canterbury Anniversary Day', kind: 'regional', region: 'Canterbury', openHospitalIds: [HOSP.aaRooms] },
  { id: 'PH003', dateISO: '2026-12-25', name: 'Christmas Day', kind: 'national', openHospitalIds: [] },
  { id: 'PH004', dateISO: '2026-12-28', name: 'Boxing Day (observed)', kind: 'national', openHospitalIds: [] },
  { id: 'PH005', dateISO: '2027-01-01', name: "New Year's Day", kind: 'national', openHospitalIds: [] },
  { id: 'PH006', dateISO: '2027-01-04', name: "Day after New Year's Day (observed)", kind: 'national', openHospitalIds: [] },
  { id: 'PH007', dateISO: '2027-02-08', name: 'Waitangi Day (observed)', kind: 'national', openHospitalIds: [] },
]

/**
 * Each hospital's own closures (US-01.5.1): only hospital-specific ones since
 * catch-up Phase 42 moved the statutory days to `PUBLIC_HOLIDAYS`. The `HH`
 * id range stays for these.
 */
export const HOSPITAL_HOLIDAYS: readonly HospitalHoliday[] = [
  // Catch-up Phase 30: the seeded holiday conflict on the S2 day, a real
  // closure behind it (it replaces Phase 06's fabricated message). `HH9xx`
  // sits outside the runtime `HHN` prefix.
  { id: 'HH900', hospitalId: HOSP.sx, dateISO: '2026-07-22', name: 'Theatre maintenance closure' },
]

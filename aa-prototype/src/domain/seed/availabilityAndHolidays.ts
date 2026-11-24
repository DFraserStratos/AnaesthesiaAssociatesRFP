/**
 * The seed's leave calendar (catch-up Phase 28: was the availability master,
 * reconciled into the canvas; now generator input only, painted onto the
 * Slots' status after they are written free), hospital holidays and the master
 * public holidays (upcoming, feeding the conflict flags).
 *
 * The design pins: Souter on leave Fri 27 to Sun 29 Nov; Beaumont on leave
 * through Sun 29 ("back Mon 30"); Ngatai through Tue 1 Dec ("back Wed 2");
 * Ngata unavailable Tue 24 (ICU on call); Delaney unavailable Thu 26.
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
  ...window(ANAE.souter, '2026-11-27', '2026-11-29', 'holiday', 'Annual leave / back Monday'),
  ...window(ANAE.beaumont, '2026-11-16', '2026-11-29', 'holiday', 'Annual leave / back Mon 30'),
  ...window(ANAE.ngatai, '2026-11-19', '2026-12-01', 'holiday', 'Annual leave / back Wed 2'),
  ...window(ANAE.ngata, '2026-11-24', '2026-11-24', 'unavailable', 'Not available / ICU on call'),
  ...window(ANAE.delaney, '2026-11-26', '2026-11-26', 'unavailable', 'Not available / on call tonight'),
  // Two future windows so holiday content exists beyond the design week.
  ...window(ANAE.ropata, '2026-12-28', '2027-01-01', 'holiday', 'Annual leave'),
  ...window(ANAE.sharma, '2027-01-18', '2027-01-20', 'holiday', 'NZSA conference'),
] as const

/**
 * The master public-holiday calendar (catch-up Phase 42; DM-38, US-13.4.1):
 * one row per statutory or regional holiday, closing every hospital unless it
 * is listed open that day. Labour Day and Canterbury Anniversary Day were one
 * row per hospital before; AA rooms had none, so it is listed open on those
 * two and no List's flag moves (`publicHolidayMigration.test.ts`). Labour Day
 * is past; Anniversary Day falls in the horizon's recent days, and the
 * Christmas, New Year, Waitangi and Easter days ahead close the hospitals.
 */
export const PUBLIC_HOLIDAYS: readonly PublicHoliday[] = [
  { id: 'PH001', dateISO: '2026-10-26', name: 'Labour Day', kind: 'national', openHospitalIds: [HOSP.aaRooms] },
  { id: 'PH002', dateISO: '2026-11-13', name: 'Canterbury Anniversary Day', kind: 'regional', region: 'Canterbury', openHospitalIds: [HOSP.aaRooms, HOSP.stg, HOSP.sx, HOSP.forte, HOSP.ces] },
  { id: 'PH003', dateISO: '2026-12-25', name: 'Christmas Day', kind: 'national', openHospitalIds: [] },
  { id: 'PH004', dateISO: '2026-12-28', name: 'Boxing Day (observed)', kind: 'national', openHospitalIds: [] },
  { id: 'PH005', dateISO: '2027-01-01', name: "New Year's Day", kind: 'national', openHospitalIds: [] },
  { id: 'PH006', dateISO: '2027-01-04', name: "Day after New Year's Day (observed)", kind: 'national', openHospitalIds: [] },
  { id: 'PH007', dateISO: '2027-02-08', name: 'Waitangi Day (observed)', kind: 'national', openHospitalIds: [] },
  { id: 'PH008', dateISO: '2027-03-26', name: 'Good Friday', kind: 'national', openHospitalIds: [] },
  { id: 'PH009', dateISO: '2027-03-29', name: 'Easter Monday', kind: 'national', openHospitalIds: [] },
  { id: 'PH010', dateISO: '2027-04-26', name: 'Anzac Day (observed)', kind: 'national', openHospitalIds: [] },
]

/**
 * The Christmas break: each private hospital's planned shutdown, first closed
 * day to last (inclusive; public holidays inside it stay on the master
 * calendar only). Recurring Lists skip these days (`shutdown`), so the
 * calendar reads closed, not as a run of conflicts. Christchurch Public closes
 * only on the public holidays.
 */
const CHRISTMAS_SHUTDOWNS: readonly { hospitalId: string; key: string; fromISO: string; toISO: string }[] = [
  { hospitalId: HOSP.stg, key: 'STG', fromISO: '2026-12-24', toISO: '2027-01-10' },
  { hospitalId: HOSP.sx, key: 'SX', fromISO: '2026-12-24', toISO: '2027-01-10' },
  { hospitalId: HOSP.forte, key: 'FORTE', fromISO: '2026-12-24', toISO: '2027-01-04' },
  { hospitalId: HOSP.ces, key: 'CES', fromISO: '2026-12-21', toISO: '2027-01-17' },
  { hospitalId: HOSP.aaRooms, key: 'ROOMS', fromISO: '2026-12-24', toISO: '2027-01-10' },
]

const PUBLIC_HOLIDAY_DATES = new Set(PUBLIC_HOLIDAYS.map((p) => p.dateISO))

const CHRISTMAS_SHUTDOWN_DAYS: readonly HospitalHoliday[] = CHRISTMAS_SHUTDOWNS.flatMap(({ hospitalId, key, fromISO, toISO }) =>
  enumerateDatesISO(fromISO, toISO)
    .filter((dateISO) => !PUBLIC_HOLIDAY_DATES.has(dateISO))
    .map((dateISO) => ({ id: `HHX-${key}-${dateISO}`, hospitalId, dateISO, name: 'Christmas shutdown', shutdown: true })),
)

/**
 * Each hospital's own closures (US-01.5.1): only hospital-specific ones since
 * catch-up Phase 42 moved the statutory days to `PUBLIC_HOLIDAYS`. The `HH`
 * id range stays for these.
 */
export const HOSPITAL_HOLIDAYS: readonly HospitalHoliday[] = [
  // Catch-up Phase 30: the seeded holiday conflict on the S2 day, a real
  // closure behind it (it replaces Phase 06's fabricated message). `HH9xx`
  // sits outside the runtime `HHN` prefix.
  { id: 'HH900', hospitalId: HOSP.sx, dateISO: '2026-11-25', name: 'Theatre maintenance closure' },
  ...CHRISTMAS_SHUTDOWN_DAYS,
]

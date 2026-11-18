/**
 * Recurring bookings: the weekly patterns that create the canvas's Lists.
 * Souter's reproduce her design week exactly; the rest are derived from the
 * two design days (Tue 21 and Thu 23 July) plus plausible filler, sized so
 * roughly 80% of surgeon-assigned Lists derive from a recurring booking (the
 * RFP's figure; the remainder are the office's ad hoc assignments the seed
 * records in its demo window, `seedRecordedWindow`).
 *
 * dayOfWeek matches Date.getDay(): 1 = Monday ... 5 = Friday.
 */

import type { ListKind, RecurringBooking } from '../types'
import { ANAE, HOSP, SURG } from './cast'

/**
 * A weekly public hospital session (catch-up Phase 32d, D86): until Phase 32d a
 * recurring booking of the retired `public` List kind. Seed-only: it keeps the
 * `RCB` id it always had (so no other row's id moves) and the hospital, surgeon
 * and note its projected Lists carried, because the seed still projects it in
 * the first pass to keep every draw and Booking identical
 * (`seed/publicSessions.ts`), then re-homes it as each anaesthetist's weekly
 * Public series. It is never a recurring booking in the app.
 */
export interface PublicSessionPattern extends Omit<RecurringBooking, 'kind'> {
  kind: 'publicSession'
}

let n = 0
function nextId(): string {
  n += 1
  return `RCB${String(n).padStart(3, '0')}`
}

function pub(
  anaesthetistId: string,
  dayOfWeek: 1 | 2 | 3 | 4 | 5,
  session: 'AM' | 'PM',
  hospitalId: string,
  surgeonId: string,
  notes: string,
): PublicSessionPattern {
  return { id: nextId(), anaesthetistId, dayOfWeek, session, kind: 'publicSession', hospitalId, surgeonId, notes }
}

function rb(
  anaesthetistId: string,
  dayOfWeek: 1 | 2 | 3 | 4 | 5,
  session: 'AM' | 'PM',
  kind: ListKind,
  hospitalId: string,
  surgeonId: string,
  notes?: string,
): RecurringBooking {
  const row: RecurringBooking = {
    id: nextId(),
    anaesthetistId,
    dayOfWeek,
    session,
    kind,
    hospitalId,
    surgeonId,
  }
  // Pre-op clinics run shorter sessions; the projection writes these as the
  // Slot's own times (catch-up Phase 28; before, the generator hard-coded them).
  if (kind === 'preop') {
    row.startTime = session === 'AM' ? '09:00' : '13:00'
    row.endTime = session === 'AM' ? '12:00' : '17:00'
  }
  if (notes !== undefined) row.notes = notes
  return row
}

const PREOP_NOTE = 'Pre-op clinic / AA rooms'
const ACUTE_NOTE = 'Acute theatre'

/**
 * The pairing rule (catch-up Phase 31; US-01.3.1): every recurring booking names
 * a hospital (or the AA rooms location) and a surgeon, because it projects
 * Lists. Our reading, logged for the owner (no OQ): a pre-op clinic names the
 * surgeon whose patients it assesses. The public patterns' on-call surgeon is
 * used only by the seed's first pass (the Lists that keep Bookings keep it); a
 * Public session names nobody (catch-up Phase 32d supersedes Phase 31's reading
 * that an acute or public theatre names its on-call surgeon). Each pick holds no Contract, sits in no surgeon group and
 * has no pairing preference, so no fee, Contract fit or picker group moves.
 */
const ACUTE_ON_CALL = SURG.okafor
const ELECTIVE_ORTHO = SURG.patel

const SEED_PATTERN_ROWS: readonly (RecurringBooking | PublicSessionPattern)[] = [
  // --- Souter: the design week (Mon Forte/Okafor + STG/Lim; Tue STG/Hale +
  // SX/Patel; Wed CES/Whitford AM; Thu CPH acute AM + pre-op PM) ---
  rb(ANAE.souter, 1, 'AM', 'private', HOSP.forte, SURG.okafor),
  rb(ANAE.souter, 1, 'PM', 'private', HOSP.stg, SURG.lim),
  rb(ANAE.souter, 2, 'AM', 'private', HOSP.stg, SURG.hale),
  rb(ANAE.souter, 2, 'PM', 'private', HOSP.sx, SURG.patel),
  rb(ANAE.souter, 3, 'AM', 'private', HOSP.ces, SURG.whitford),
  pub(ANAE.souter, 4, 'AM', HOSP.cph, ACUTE_ON_CALL, ACUTE_NOTE),
  rb(ANAE.souter, 4, 'PM', 'preop', HOSP.aaRooms, SURG.patel, PREOP_NOTE),

  // --- Rutherford ---
  rb(ANAE.rutherford, 1, 'AM', 'private', HOSP.sx, SURG.doyle),
  rb(ANAE.rutherford, 2, 'AM', 'private', HOSP.forte, SURG.okafor),
  rb(ANAE.rutherford, 2, 'PM', 'private', HOSP.forte, SURG.okafor),
  rb(ANAE.rutherford, 4, 'AM', 'private', HOSP.stg, SURG.hale),
  rb(ANAE.rutherford, 4, 'PM', 'private', HOSP.stg, SURG.hale),

  // --- Sharma ---
  pub(ANAE.sharma, 2, 'AM', HOSP.cph, ACUTE_ON_CALL, ACUTE_NOTE),
  rb(ANAE.sharma, 3, 'PM', 'private', HOSP.sx, SURG.patel),
  rb(ANAE.sharma, 4, 'AM', 'private', HOSP.forte, SURG.lim),

  // --- Ngata ---
  pub(ANAE.ngata, 2, 'AM', HOSP.cph, ACUTE_ON_CALL, ACUTE_NOTE),
  rb(ANAE.ngata, 4, 'PM', 'private', HOSP.sx, SURG.doyle),
  rb(ANAE.ngata, 5, 'AM', 'private', HOSP.forte, SURG.okafor),

  // --- Beaumont ---
  rb(ANAE.beaumont, 1, 'AM', 'private', HOSP.stg, SURG.hale),
  rb(ANAE.beaumont, 3, 'AM', 'private', HOSP.sx, SURG.patel),
  rb(ANAE.beaumont, 3, 'PM', 'private', HOSP.sx, SURG.patel),
  rb(ANAE.beaumont, 5, 'AM', 'private', HOSP.ces, SURG.whitford),

  // --- A. Chen ---
  rb(ANAE.chen, 2, 'AM', 'private', HOSP.ces, SURG.whitford),
  rb(ANAE.chen, 2, 'PM', 'private', HOSP.ces, SURG.reid),
  rb(ANAE.chen, 4, 'AM', 'private', HOSP.ces, SURG.whitford),
  rb(ANAE.chen, 5, 'AM', 'private', HOSP.ces, SURG.reid),

  // --- Ropata ---
  pub(ANAE.ropata, 2, 'AM', HOSP.cph, ELECTIVE_ORTHO, 'Elective ortho'),
  pub(ANAE.ropata, 2, 'PM', HOSP.cph, ELECTIVE_ORTHO, 'Elective ortho'),
  pub(ANAE.ropata, 4, 'AM', HOSP.cph, ELECTIVE_ORTHO, 'Elective ortho'),
  pub(ANAE.ropata, 4, 'PM', HOSP.cph, ELECTIVE_ORTHO, 'Elective ortho'),

  // --- Delaney ---
  pub(ANAE.delaney, 1, 'PM', HOSP.cph, ACUTE_ON_CALL, ACUTE_NOTE),
  rb(ANAE.delaney, 2, 'AM', 'preop', HOSP.aaRooms, SURG.okafor, PREOP_NOTE),
  rb(ANAE.delaney, 5, 'AM', 'private', HOSP.stg, SURG.doyle),

  // --- Hughes (mostly free by design) ---
  pub(ANAE.hughes, 1, 'AM', HOSP.cph, ACUTE_ON_CALL, ACUTE_NOTE),

  // --- Morrison ---
  rb(ANAE.morrison, 1, 'AM', 'private', HOSP.stg, SURG.tan),
  rb(ANAE.morrison, 2, 'AM', 'private', HOSP.stg, SURG.tan),
  rb(ANAE.morrison, 2, 'PM', 'private', HOSP.forte, SURG.nand),
  rb(ANAE.morrison, 4, 'AM', 'private', HOSP.stg, SURG.tan),
  rb(ANAE.morrison, 4, 'PM', 'private', HOSP.forte, SURG.okafor),

  // --- Whitaker ---
  pub(ANAE.whitaker, 2, 'AM', HOSP.cph, ACUTE_ON_CALL, ACUTE_NOTE),
  rb(ANAE.whitaker, 2, 'PM', 'preop', HOSP.aaRooms, SURG.lim, PREOP_NOTE),
  pub(ANAE.whitaker, 4, 'AM', HOSP.cph, ACUTE_ON_CALL, ACUTE_NOTE),
  pub(ANAE.whitaker, 5, 'AM', HOSP.cph, ACUTE_ON_CALL, ACUTE_NOTE),

  // --- Ngatai ---
  rb(ANAE.ngatai, 1, 'PM', 'private', HOSP.sx, SURG.patel),
  rb(ANAE.ngatai, 3, 'AM', 'private', HOSP.ces, SURG.reid),

  // --- Strand ---
  rb(ANAE.strand, 2, 'AM', 'private', HOSP.ces, SURG.reid),
  rb(ANAE.strand, 3, 'PM', 'private', HOSP.ces, SURG.whitford),
  rb(ANAE.strand, 4, 'AM', 'private', HOSP.ces, SURG.reid),

  // --- Fitzgerald: her design days (Tue 21 AM, Thu 23 AM/PM) plus the
  // weekdays the scenario bookings land on (Tue 14 bariatric, Wed 15 Aria,
  // Wed 29 prepayment). Tue PM is deliberately left off — Tue 21 PM (St
  // George's, surgeon TBC) is a one-off pinned by the index.ts fixup, not a
  // weekly pattern. ---
  rb(ANAE.fitzgerald, 2, 'AM', 'private', HOSP.sx, SURG.doyle),
  rb(ANAE.fitzgerald, 3, 'AM', 'private', HOSP.forte, SURG.lim),
  rb(ANAE.fitzgerald, 4, 'AM', 'private', HOSP.sx, SURG.patel),
  rb(ANAE.fitzgerald, 4, 'PM', 'preop', HOSP.aaRooms, SURG.tan, PREOP_NOTE),
] as const

const isPublicPattern = (row: RecurringBooking | PublicSessionPattern): row is PublicSessionPattern => row.kind === 'publicSession'

/** The surgeons' recurring bookings (private and pre-op only since catch-up Phase 32d), ids as before. */
export const RECURRING_BOOKINGS: readonly RecurringBooking[] = SEED_PATTERN_ROWS.filter(
  (row): row is RecurringBooking => !isPublicPattern(row),
)

/** The twelve weekly public hospital sessions (catch-up Phase 32d), with the `RCB` ids they always had. */
export const PUBLIC_SESSION_PATTERNS: readonly PublicSessionPattern[] = SEED_PATTERN_ROWS.filter(isPublicPattern)

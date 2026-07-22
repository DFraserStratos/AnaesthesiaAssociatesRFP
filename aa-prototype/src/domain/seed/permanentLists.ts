/**
 * Permanent List templates — the weekly patterns the canvas generates from.
 * Souter's reproduce her design week exactly; the rest are derived from the
 * two design days (Tue 21 and Thu 23 July) plus plausible filler, sized so
 * roughly 80% of surgeon-assigned Lists derive from a Permanent List (the
 * RFP's figure; the remainder are office-assigned ad hoc bookings from the
 * canvas generator's slot RNG).
 *
 * dayOfWeek matches Date.getDay(): 1 = Monday ... 5 = Friday.
 */

import type { PermanentList } from '../types'
import { ANAE, HOSP, SURG } from './cast'

let n = 0
function pl(
  anaesthetistId: string,
  dayOfWeek: 1 | 2 | 3 | 4 | 5,
  session: 'AM' | 'PM',
  statusKey: 'private' | 'public' | 'preop',
  hospitalId: string | null,
  surgeonId: string | null,
  notes?: string,
): PermanentList {
  n += 1
  const row: PermanentList = {
    id: `PL${String(n).padStart(3, '0')}`,
    anaesthetistId,
    dayOfWeek,
    session,
    statusKey,
    hospitalId,
    surgeonId,
  }
  if (notes !== undefined) row.notes = notes
  return row
}

const PREOP_NOTE = 'Pre-op clinic / AA rooms'
const ACUTE_NOTE = 'Acute theatre'

export const PERMANENT_LISTS: readonly PermanentList[] = [
  // --- Souter: the design week (Mon Forte/Okafor + STG/Lim; Tue STG/Hale +
  // SX/Patel; Wed CES/Whitford AM; Thu CPH acute AM + pre-op PM) ---
  pl(ANAE.souter, 1, 'AM', 'private', HOSP.forte, SURG.okafor),
  pl(ANAE.souter, 1, 'PM', 'private', HOSP.stg, SURG.lim),
  pl(ANAE.souter, 2, 'AM', 'private', HOSP.stg, SURG.hale),
  pl(ANAE.souter, 2, 'PM', 'private', HOSP.sx, SURG.patel),
  pl(ANAE.souter, 3, 'AM', 'private', HOSP.ces, SURG.whitford),
  pl(ANAE.souter, 4, 'AM', 'public', HOSP.cph, null, ACUTE_NOTE),
  pl(ANAE.souter, 4, 'PM', 'preop', null, null, PREOP_NOTE),

  // --- Rutherford ---
  pl(ANAE.rutherford, 1, 'AM', 'private', HOSP.sx, SURG.doyle),
  pl(ANAE.rutherford, 2, 'AM', 'private', HOSP.forte, SURG.okafor),
  pl(ANAE.rutherford, 2, 'PM', 'private', HOSP.forte, SURG.okafor),
  pl(ANAE.rutherford, 4, 'AM', 'private', HOSP.stg, SURG.hale),
  pl(ANAE.rutherford, 4, 'PM', 'private', HOSP.stg, SURG.hale),

  // --- Sharma ---
  pl(ANAE.sharma, 2, 'AM', 'public', HOSP.cph, null, ACUTE_NOTE),
  pl(ANAE.sharma, 3, 'PM', 'private', HOSP.sx, SURG.patel),
  pl(ANAE.sharma, 4, 'AM', 'private', HOSP.forte, SURG.lim),

  // --- Ngata ---
  pl(ANAE.ngata, 2, 'AM', 'public', HOSP.cph, null, ACUTE_NOTE),
  pl(ANAE.ngata, 4, 'PM', 'private', HOSP.sx, SURG.doyle),
  pl(ANAE.ngata, 5, 'AM', 'private', HOSP.forte, SURG.okafor),

  // --- Beaumont ---
  pl(ANAE.beaumont, 1, 'AM', 'private', HOSP.stg, SURG.hale),
  pl(ANAE.beaumont, 3, 'AM', 'private', HOSP.sx, SURG.patel),
  pl(ANAE.beaumont, 3, 'PM', 'private', HOSP.sx, SURG.patel),
  pl(ANAE.beaumont, 5, 'AM', 'private', HOSP.ces, SURG.whitford),

  // --- A. Chen ---
  pl(ANAE.chen, 2, 'AM', 'private', HOSP.ces, SURG.whitford),
  pl(ANAE.chen, 2, 'PM', 'private', HOSP.ces, SURG.reid),
  pl(ANAE.chen, 4, 'AM', 'private', HOSP.ces, SURG.whitford),
  pl(ANAE.chen, 5, 'AM', 'private', HOSP.ces, SURG.reid),

  // --- Ropata ---
  pl(ANAE.ropata, 2, 'AM', 'public', HOSP.cph, null, 'Elective ortho'),
  pl(ANAE.ropata, 2, 'PM', 'public', HOSP.cph, null, 'Elective ortho'),
  pl(ANAE.ropata, 4, 'AM', 'public', HOSP.cph, null, 'Elective ortho'),
  pl(ANAE.ropata, 4, 'PM', 'public', HOSP.cph, null, 'Elective ortho'),

  // --- Delaney ---
  pl(ANAE.delaney, 1, 'PM', 'public', HOSP.cph, null, ACUTE_NOTE),
  pl(ANAE.delaney, 2, 'AM', 'preop', null, null, PREOP_NOTE),
  pl(ANAE.delaney, 5, 'AM', 'private', HOSP.stg, SURG.doyle),

  // --- Hughes (mostly free by design) ---
  pl(ANAE.hughes, 1, 'AM', 'public', HOSP.cph, null, ACUTE_NOTE),

  // --- Morrison ---
  pl(ANAE.morrison, 1, 'AM', 'private', HOSP.stg, SURG.tan),
  pl(ANAE.morrison, 2, 'AM', 'private', HOSP.stg, SURG.tan),
  pl(ANAE.morrison, 2, 'PM', 'private', HOSP.forte, SURG.nand),
  pl(ANAE.morrison, 4, 'AM', 'private', HOSP.stg, SURG.tan),
  pl(ANAE.morrison, 4, 'PM', 'private', HOSP.forte, SURG.okafor),

  // --- Whitaker ---
  pl(ANAE.whitaker, 2, 'AM', 'public', HOSP.cph, null, ACUTE_NOTE),
  pl(ANAE.whitaker, 2, 'PM', 'preop', null, null, PREOP_NOTE),
  pl(ANAE.whitaker, 4, 'AM', 'public', HOSP.cph, null, ACUTE_NOTE),
  pl(ANAE.whitaker, 5, 'AM', 'public', HOSP.cph, null, ACUTE_NOTE),

  // --- Ngatai ---
  pl(ANAE.ngatai, 1, 'PM', 'private', HOSP.sx, SURG.patel),
  pl(ANAE.ngatai, 3, 'AM', 'private', HOSP.ces, SURG.reid),

  // --- Strand ---
  pl(ANAE.strand, 2, 'AM', 'private', HOSP.ces, SURG.reid),
  pl(ANAE.strand, 3, 'PM', 'private', HOSP.ces, SURG.whitford),
  pl(ANAE.strand, 4, 'AM', 'private', HOSP.ces, SURG.reid),
] as const

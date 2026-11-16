/**
 * The Bookings catch-up Phase 20a adds to carry AR-35's illustrative wording
 * (AI-made, not from AA: notes/2026-10-08-procedure-picker-and-source-text.md,
 * "Illustrative source wording"; see `sourceWording.ts`).
 *
 * - The "RTK" Booking (US-02.5.7): on Dr Souter's Tue 4 Aug AM St George's
 *   List at 09:30, clear of the S13, S14 and S15 targets (08:30, 11:00, 12:00)
 *   and MSG-STG-1012's 12:15. The rooms sent "RTK" (row 1); the hospital's
 *   download replaced it with "right total knee" (row 2). Its procedure text is
 *   the hospital's; the rooms' original is in its change history, as the
 *   seeded `procedure.procedureText.replace` audit row. On St George's RVG
 *   (no invoice description), so its invoice description is the hospital's.
 * - The expert rows (15, 17, 21, 34, 35): wording only someone who knows can
 *   read, on Dr Souter's forward ACTIVE Lists, Tue 28 Jul PM (Southern Cross)
 *   and Thu 30 Jul AM (Christchurch Private). On No contract · RVG (20's rule:
 *   where nothing fits); 15, 17 and 35 have no RVG code yet, 21 has P1 and 34
 *   S9b (whose included modifier 19b pre-applies).
 *
 * Each Booking's display source follows the seed's rule (St George's, Southern
 * Cross and Christchurch Private send feeds: hospital download); its procedure
 * text keeps the channel AR-35 names (the rooms' PDF, an email).
 * Appended after every other seeded Booking and Procedure (the next free ids),
 * so no existing Booking or Procedure id moves; RNG-free; uncaptured and never invoiced, so no S1
 * to S5 figure moves. Each patient is a generated one with no other Booking
 * that day.
 */

import type { AuditEntry, Booking, BookingSource, Procedure, ProcedureText } from '../types'
import { projectedListId } from '../slots'
import { ANAE } from './cast'
import { CONTRACT } from './contracts'
import { RVG_GROUP } from './rvgGroups'
import { SOURCE_WORDING, type SourceWordingRow } from './sourceWording'
import { seedArrivalISO, seedText } from './procedureText'

export const RTK_BOOKING_LIST_ID = projectedListId(ANAE.souter, '2026-08-04', 'AM')
const SX_TUE28_PM = projectedListId(ANAE.souter, '2026-07-28', 'PM')
const CPH_THU30_AM = projectedListId(ANAE.souter, '2026-07-30', 'AM')

/** When the rooms' "RTK" arrived, and when the hospital's download replaced it. */
const RTK_ROOMS_AT = '2026-07-14T09:00:00'
const RTK_HOSPITAL_AT = '2026-07-20T16:00:00'
/** The hospital that sent "right total knee". */
const RTK_FROM = "St George's"

interface Spec {
  listId: string
  patientId: string
  time: string
  wording: SourceWordingRow
  bookingSource: BookingSource
  rvgGroupId?: string
  billingReference?: string
}

const SPECS: readonly Spec[] = [
  // Rows 1 and 2: the Booking whose rooms' text the hospital's replaced.
  { listId: RTK_BOOKING_LIST_ID, patientId: 'PT0022', time: '09:30', wording: SOURCE_WORDING[2], bookingSource: 'hospitalDownload', rvgGroupId: RVG_GROUP.ll4!, billingReference: 'SG-2026-0921' },
  // The expert rows.
  { listId: SX_TUE28_PM, patientId: 'PT0023', time: '13:00', wording: SOURCE_WORDING[15], bookingSource: 'hospitalDownload' },
  { listId: SX_TUE28_PM, patientId: 'PT0024', time: '14:00', wording: SOURCE_WORDING[17], bookingSource: 'hospitalDownload' },
  { listId: CPH_THU30_AM, patientId: 'PT0025', time: '08:00', wording: SOURCE_WORDING[21], bookingSource: 'hospitalDownload', rvgGroupId: RVG_GROUP.p1! },
  { listId: CPH_THU30_AM, patientId: 'PT0026', time: '09:00', wording: SOURCE_WORDING[34], bookingSource: 'hospitalDownload', rvgGroupId: RVG_GROUP.s9b! },
  { listId: CPH_THU30_AM, patientId: 'PT0027', time: '11:00', wording: SOURCE_WORDING[35], bookingSource: 'hospitalDownload' },
]

export interface SourceWordingBookings {
  bookings: Booking[]
  procedures: Procedure[]
  /** The id of the Booking whose rooms' "RTK" the hospital's text replaced. */
  rtkBookingId: string
  rtkProcedureId: string
  /** The rooms' text the hospital's replaced, as it arrived (the create's audit holds it). */
  rtkRoomsText: ProcedureText
  /** The seeded replace entry (its id is given when the seed audit is numbered). */
  replaceAudit: Omit<AuditEntry, 'id'>
  next: { booking: number; procedure: number }
}

export function seedSourceWordingBookings(
  next: { booking: number; procedure: number },
  listDateOf: (listId: string) => string,
): SourceWordingBookings {
  const bookings: Booking[] = []
  const procedures: Procedure[] = []
  let b = next.booking
  let p = next.procedure
  for (const spec of SPECS) {
    const bookingId = `BK${String(b).padStart(4, '0')}`
    const procedureId = `P${String(p).padStart(4, '0')}`
    bookings.push({
      id: bookingId,
      listId: spec.listId,
      patientId: spec.patientId,
      scheduledTime: spec.time,
      completed: false,
      payer: { kind: 'patient' },
      source: spec.bookingSource,
      lastModifiedBy: 'Kirsty W.',
      lastModifiedAtISO: '2026-07-20T16:30:00',
    })
    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      procedureText: seedText(
        spec.wording.asReceived,
        spec.wording.source,
        spec.wording.row === 2 ? RTK_HOSPITAL_AT : seedArrivalISO(spec.wording.source, listDateOf(spec.listId)),
        spec.wording.row === 2 ? RTK_FROM : undefined,
      ),
      invoiceDescription: null,
      isAdditional: false,
      modifierClaims: [],
      removedModifierIds: [],
      governingContractId: spec.wording.row === 2 ? CONTRACT.stgRvg : CONTRACT.noContractRvg,
    }
    if (spec.rvgGroupId !== undefined) procedure.rvgGroupId = spec.rvgGroupId
    if (spec.billingReference !== undefined) procedure.billingReference = spec.billingReference
    procedures.push(procedure)
    b += 1
    p += 1
  }

  const rtk = procedures[0]!
  const rooms = SOURCE_WORDING[1]
  const hospital = SOURCE_WORDING[2]
  const roomsText: ProcedureText = { text: rooms.asReceived, source: rooms.source, receivedAtISO: RTK_ROOMS_AT }
  return {
    bookings,
    procedures,
    rtkBookingId: rtk.bookingId,
    rtkProcedureId: rtk.id,
    rtkRoomsText: roomsText,
    replaceAudit: {
      entityType: 'procedure',
      entityId: rtk.id,
      who: 'Hospital booking download',
      role: 'system',
      source: 'integration',
      action: 'procedure.procedureText.replace',
      before: { bookingId: rtk.bookingId, procedureText: roomsText },
      after: { bookingId: rtk.bookingId, procedureText: { text: hospital.asReceived, source: hospital.source, from: RTK_FROM } },
      atISO: RTK_HOSPITAL_AT,
    },
    next: { booking: b, procedure: p },
  }
}

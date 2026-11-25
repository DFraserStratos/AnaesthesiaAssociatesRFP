/**
 * The aged unpaid invoice (Phase 62; US-08.4.7): the Invoices tab shows an
 * unpaid invoice's age ("Unpaid · 40 days"), and every other unpaid invoice
 * the office lists is under a fortnight old. One completed Booking on Dr
 * Ngata's Wed 14 Oct AM List at St George's (a Knee arthroscopy on St
 * George's RVG, billed to the hospital, so no patient balance moves),
 * AUTHORISED and billed Thu 15 Oct: the seed's billing slice raises its
 * invoice in the range beat's series (AA-2026-S2402, `SEED_AUTHORISED_INVOICED_BOOKING_IDS`),
 * 40 days old on the demo day, unpaid and not yet in Xero.
 *
 * The List sits before the canvas horizon, so it is backdrop (`L-HIST`, no
 * Slot record) as the history's are; its invoice is not (`isBackdropInvoice`).
 * Ids in their own `HX` namespace, sorting after every other seeded Booking
 * (the seed audit dates Bookings by their place in id order), with a pinned
 * existing patient, appended after every other record, RNG-free: no id,
 * counter or scripted figure moves.
 */

import type { Booking, List, Procedure } from '../types'
import { slotIdFor } from '../slots'
import { originForNewList } from '../lists/listOrigin'
import { ANAE, HOSP, SURG } from './cast'
import { CONTRACT } from './contracts'
import { genericPatientIds } from './patients'
import { rvgGroupIdForLegacyCode } from './rvgGroups'
import { seedText } from './procedureText'

const DAY = '2026-10-14'
/** When the List was authorised and billed: 40 days before the demo day (never the clock). */
export const AGED_INVOICE_BILLED_ISO = '2026-10-15T09:00:00'
export const AGED_INVOICE_LIST_ID = 'L-HIST-HX-01'
export const AGED_INVOICE_BOOKING_ID = 'HXBK01'
const PROCEDURE_ID = 'HXP01'
/** A pinned generic patient (the history's own pool, by fixed index; no `takePatient`). */
const PATIENT_INDEX = 46

export function seedAgedInvoiceBooking(): { list: List; bookings: Booking[]; procedures: Procedure[] } {
  const patientId = genericPatientIds()[PATIENT_INDEX]
  if (patientId === undefined) throw new Error(`no generic patient at ${PATIENT_INDEX}`)
  const completedAtISO = `${DAY}T09:20:00`
  const list: List = {
    id: AGED_INVOICE_LIST_ID,
    // Before the schedule horizon: it names its Slot but no Slot record exists (`isBackdropList`).
    slotId: slotIdFor(ANAE.ngata, DAY, 'AM'),
    dateISO: DAY,
    anaesthetistId: ANAE.ngata,
    session: 'AM',
    state: 'AUTHORISED',
    kind: 'private',
    hospitalId: HOSP.stg,
    surgeonId: SURG.hale,
    conflicts: [],
    origin: originForNewList({ kind: 'office' }),
    billedAtISO: AGED_INVOICE_BILLED_ISO,
  }
  const booking: Booking = {
    id: AGED_INVOICE_BOOKING_ID,
    listId: AGED_INVOICE_LIST_ID,
    patientId,
    scheduledTime: '08:00',
    completed: true,
    completedAtISO,
    // St George's sends its lists as a download (the seed's source rule).
    source: 'hospitalDownload',
    lastModifiedBy: 'Dr Tom Ngata',
    lastModifiedAtISO: completedAtISO,
  }
  const procedure: Procedure = {
    id: PROCEDURE_ID,
    bookingId: AGED_INVOICE_BOOKING_ID,
    payer: { kind: 'patient' },
    procedureText: seedText('Knee arthroscopy'),
    invoiceDescription: null,
    isPrimary: true,
    modifierClaims: [],
    removedModifierIds: [],
    governingContractId: CONTRACT.stgRvg,
    rvgGroupId: rvgGroupIdForLegacyCode('49558'),
    anaestheticStartISO: `${DAY}T08:05:00`,
    handoverISO: `${DAY}T09:10:00`,
  }
  return { list, bookings: [booking], procedures: [procedure] }
}

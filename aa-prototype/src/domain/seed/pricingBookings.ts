/**
 * Catch-up Phase 24 session 2's seed (work item 11; US-03.3.10, US-03.5.1,
 * US-05.2.5, US-05.2.8, US-05.4.1 to US-05.4.3): the price beats. Demo values.
 *
 * **Dr Souter's Mon 27 Jul AM List at Forte (ACTIVE)**, after Aria's
 * uncaptured Booking (`contractRateCaptureBooking`, read-only at $26.50), one
 * Booking per state of her price line:
 * - `discountBooking`: Forte Health RVG less 10% (`discountContract`, the
 *   override off): units at her own value less 10%, the discount shown as
 *   applied, read-only.
 * - `priceCaptureBooking`: No contract · RVG, uncaptured: she may type a price.
 * Two beats reuse earlier Bookings (markers only): `ownListFixedBooking` is
 * Riley's on her own prepaid price list (Fri 24 Jul AM, read-only, never
 * overridden, OQ-117 and OQ-96) and `openPriceBooking` is 21a's No contract ·
 * Fixed price with no amount (Mon 10 Aug PM: "Needs a price" until she types it).
 *
 * **The backdated range beat** (Merivale's Face lift, `CT-MER-FACELIFT`, its
 * one range $3,100 from 1 Jun 2026), beside 19a's unedited Booking:
 * - `rangeTypedBooking`: a Face lift with the office's typed $2,950.00 (Mon 10
 *   Aug PM, ACTIVE);
 * - `rangeAuthorisedBooking`: a Face lift on Dr Souter's Thu 16 Jul PM List at
 *   AA's rooms, AUTHORISED and invoiced at $3,100.00 (the seed's billing
 *   slice raises its invoice);
 * - the prepaid one is the seeded paid prepayment Booking (its marker reused).
 *
 * **The no-charge beat** (`noChargeBooking`): a completed Booking with a typed
 * $0.00 on Dr Souter's SUBMITTED Mon 13 Jul AM List, which no beat authorises.
 *
 * Dedicated pinned patients (`PAT_24`), appended after every other seeded
 * Booking and Procedure, RNG-free, so no id or scripted figure moves.
 */

import type { AuditEntry, Booking, Procedure } from '../types'
import { projectedListId } from '../slots'
import { ANAE } from './cast'
import { CONTRACT } from './contracts'
import { PAT_24 } from './patients'
import { MERIVALE_BOOKING_LIST_ID } from './pricedItemBookings'
import { PRICED_ITEM } from './pricedItems'
import { rvgGroupIdForLegacyCode } from './rvgGroups'
import { seedText } from './procedureText'

/** Dr Souter's Mon 27 Jul AM List at Forte (Aria's uncaptured Booking is on it). */
export const PRICE_LINE_LIST_ID = projectedListId(ANAE.souter, '2026-07-27', 'AM')
/** Dr Souter's Thu 16 Jul PM List at AA's rooms: made AUTHORISED and invoiced for the range beat. */
export const RANGE_AUTHORISED_LIST_ID = projectedListId(ANAE.souter, '2026-07-16', 'PM')
/** When the seeded AUTHORISED List was billed (never the clock). */
export const RANGE_AUTHORISED_BILLED_ISO = '2026-07-17T09:00:00'
/** The office's typed price on the range beat's Face lift (a demo figure). */
export const RANGE_TYPED_PRICE = 2950

const SOUTER = 'Dr Melanie Souter'
const OFFICE = 'Kirsty W.'

export type PricingBookingKey =
  | 'discountBooking'
  | 'priceCaptureBooking'
  | 'rangeTypedBooking'
  | 'rangeAuthorisedBooking'
  | 'noChargeBooking'

interface Spec {
  key: PricingBookingKey
  listId: string
  day: string
  patientId: string
  time: string
  text: string
  contractId: string
  legacyCode?: string
  start?: string
  finish?: string
  completed: boolean
  enteredPrice?: number
  /** Who typed `enteredPrice` (its seeded audit row). */
  typedBy?: 'office' | 'anaesthetist'
  /** The seed's source rule: Forte's rooms send PDFs; St George's a feed; AA's rooms the office. */
  source: Booking['source']
}

function specs(noChargeListId: string): readonly Spec[] {
  const MON27 = '2026-07-27'
  const MON10AUG = '2026-08-10'
  return [
    { key: 'discountBooking', listId: PRICE_LINE_LIST_ID, day: MON27, patientId: PAT_24.discount, time: '11:15', text: 'Breast reduction, bilateral', contractId: CONTRACT.forteDiscount, legacyCode: '45200', completed: false, source: 'surgeonPdf' },
    { key: 'priceCaptureBooking', listId: PRICE_LINE_LIST_ID, day: MON27, patientId: PAT_24.priceCapture, time: '12:15', text: 'Skin flap repair, cheek', contractId: CONTRACT.noContractRvg, legacyCode: '45030', completed: false, source: 'surgeonPdf' },
    { key: 'rangeTypedBooking', listId: MERIVALE_BOOKING_LIST_ID, day: MON10AUG, patientId: PAT_24.rangeTyped, time: '17:45', text: 'Face lift', contractId: PRICED_ITEM.merFaceLift, completed: false, enteredPrice: RANGE_TYPED_PRICE, typedBy: 'office', source: 'hospitalDownload' },
    { key: 'rangeAuthorisedBooking', listId: RANGE_AUTHORISED_LIST_ID, day: '2026-07-16', patientId: PAT_24.rangeAuthorised, time: '13:30', text: 'Face lift', contractId: PRICED_ITEM.merFaceLift, start: '13:35', finish: '16:05', completed: true, source: 'admin' },
    { key: 'noChargeBooking', listId: noChargeListId, day: '2026-07-13', patientId: PAT_24.noCharge, time: '11:30', text: 'Scar revision, forearm', contractId: CONTRACT.noContractRvg, legacyCode: '45030', start: '11:35', finish: '12:20', completed: true, enteredPrice: 0, typedBy: 'anaesthetist', source: 'surgeonPdf' },
  ]
}

export function seedPricingBookings(
  next: { booking: number; procedure: number },
  noChargeListId: string,
): {
  bookings: Booking[]
  procedures: Procedure[]
  audit: AuditEntry[]
  ids: Record<PricingBookingKey, string>
  next: { booking: number; procedure: number }
} {
  const bookings: Booking[] = []
  const procedures: Procedure[] = []
  const audit: AuditEntry[] = []
  const ids = {} as Record<PricingBookingKey, string>
  let b = next.booking
  let p = next.procedure
  for (const spec of specs(noChargeListId)) {
    const bookingId = `BK${String(b).padStart(4, '0')}`
    const procedureId = `P${String(p).padStart(4, '0')}`
    const completedAtISO = `${spec.day}T${spec.finish ?? '12:00'}:00`
    const booking: Booking = {
      id: bookingId,
      listId: spec.listId,
      patientId: spec.patientId,
      scheduledTime: spec.time,
      completed: spec.completed,
      source: spec.source,
      lastModifiedBy: spec.completed ? SOUTER : OFFICE,
      lastModifiedAtISO: spec.completed ? completedAtISO : '2026-07-20T15:40:00',
    }
    if (spec.completed) booking.completedAtISO = completedAtISO
    bookings.push(booking)
    const procedure: Procedure = {
      id: procedureId,
      bookingId,
      payer: { kind: 'patient' },
      procedureText: seedText(spec.text),
      invoiceDescription: null,
      isPrimary: true,
      modifierClaims: [],
      removedModifierIds: [],
      governingContractId: spec.contractId,
    }
    if (spec.legacyCode !== undefined) procedure.rvgGroupId = rvgGroupIdForLegacyCode(spec.legacyCode)
    if (spec.start !== undefined && spec.finish !== undefined) {
      procedure.anaestheticStartISO = `${spec.day}T${spec.start}:00`
      procedure.handoverISO = `${spec.day}T${spec.finish}:00`
    }
    if (spec.enteredPrice !== undefined) procedure.enteredPrice = spec.enteredPrice
    procedures.push(procedure)
    if (spec.enteredPrice !== undefined && spec.typedBy !== undefined) {
      const office = spec.typedBy === 'office'
      audit.push({
        id: `seed-24-price-${spec.key}`,
        entityType: 'procedure',
        entityId: procedureId,
        who: office ? OFFICE : SOUTER,
        role: office ? 'office' : 'anaesthetist',
        source: office ? 'office' : 'anaesthetist',
        action: 'procedure.price',
        before: { enteredPrice: null },
        after: { enteredPrice: spec.enteredPrice },
        atISO: office ? '2026-07-20T15:40:00' : `${spec.day}T12:25:00`,
      })
    }
    ids[spec.key] = bookingId
    b += 1
    p += 1
  }
  return { bookings, procedures, audit, ids, next: { booking: b, procedure: p } }
}

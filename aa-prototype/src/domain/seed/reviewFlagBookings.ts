/**
 * Catch-up Phase 21a session 2's seed (US-07.2.2, US-04.3.11): the
 * review-flags List and the movable fixed-price Booking.
 *
 * **The review-flags List** (`SEED_LIST_IDS.reviewFlags`): Dr Chen's Tue 14 Jul
 * AM List at Christchurch Eye Surgery with Dr Whitford, a past-dated List the
 * seed leaves empty, made SUBMITTED so it waits in the Review queue. No S1 to
 * S5 beat uses it (S2 Beat 4 reviews Dr Morrison's Mon 20 List).
 *
 * - `contractChangeBooking`: Dr Chen changed the Contract from the Southern
 *   Cross "Cataract IOL (LA by Anaesthetist)" fixed price to Christchurch Eye
 *   Surgery RVG (an audited `procedure.contract` row by him, no approval):
 *   "Changed by Dr Chen: was Cataract IOL (LA by Anaesthetist)".
 * - `typedPriceBooking`: No contract · RVG with the office's fixed fee typed
 *   beside the computed fee: "Price typed: $1,200.00 (computed ...)".
 * - `reviewNeedsPrice`: No contract · Fixed price with no amount, so it is
 *   not complete: "Needs a price" and "Not marked completed". The office types
 *   the price and completes it before the List authorises.
 * - `otherSurgeonContract`: a Merivale fixed price linked to Ms Lim on Dr
 *   Whitford's List: "Contract not offered on this List".
 *
 * **The movable Booking** (`movableFixedBooking`): a Merivale Face lift (linked
 * to Ms Lim) on Dr Souter's Mon 10 Aug PM List with Ms Lim, ACTIVE, so Admin
 * Day's Move can carry it to her Mon 10 Aug AM List with Mr Okafor and Review
 * flags it there.
 *
 * Dedicated pinned patients (`PAT_21A_REVIEW`), appended after every other
 * seeded Booking and Procedure, RNG-free, so no id or scripted figure moves.
 */

import type { AuditEntry, Booking, Procedure } from '../types'
import { projectedListId } from '../slots'
import { seedFallbackId } from '../billing/fallbacks'
import { ANAE } from './cast'
import { CONTRACT } from './contracts'
import { PAT_21A_REVIEW } from './patients'
import { MERIVALE_BOOKING_LIST_ID } from './pricedItemBookings'
import { PRICED_ITEM } from './pricedItems'
import { rvgGroupIdForLegacyCode } from './rvgGroups'
import { seedText } from './procedureText'

export const REVIEW_FLAGS_LIST_ID = projectedListId(ANAE.chen, '2026-07-14', 'AM')
const DAY = '2026-07-14'
const CHEN = 'Dr Alistair Chen'

/** The Contract Dr Chen changed from (a candidate on his List: Southern Cross's fixed price at Christchurch Eye Surgery). */
export const CONTRACT_CHANGED_FROM = 'CT-CES-SXAP-CATIOL'
const CES_RVG = 'CT-CES-D1'

export type ReviewFlagBookingKey = 'contractChangeBooking' | 'typedPriceBooking' | 'reviewNeedsPrice' | 'otherSurgeonContract' | 'movableFixedBooking'

interface Spec {
  key: ReviewFlagBookingKey
  listId: string
  patientId: string
  time: string
  text: string
  contractId: string
  legacyCode?: string
  /** Start and finish as HH:MM on the List's day (RVG kinds). */
  start?: string
  finish?: string
  completed: boolean
  priceOverride?: Procedure['priceOverride']
}

const SPECS: readonly Spec[] = [
  { key: 'contractChangeBooking', listId: REVIEW_FLAGS_LIST_ID, patientId: PAT_21A_REVIEW.contractChange, time: '08:00', text: 'Cataract extraction and lens, left', contractId: CES_RVG, legacyCode: '42702', start: '08:05', finish: '08:50', completed: true },
  {
    key: 'typedPriceBooking',
    listId: REVIEW_FLAGS_LIST_ID,
    patientId: PAT_21A_REVIEW.typedPrice,
    time: '09:00',
    text: 'Vitrectomy, left',
    contractId: CONTRACT.noContractRvg,
    legacyCode: '42725',
    start: '09:05',
    finish: '10:05',
    completed: true,
    priceOverride: { kind: 'fixedFee', amount: 1200, reason: 'Fee agreed with the patient before surgery' },
  },
  { key: 'reviewNeedsPrice', listId: REVIEW_FLAGS_LIST_ID, patientId: PAT_21A_REVIEW.needsPrice, time: '10:15', text: 'Pterygium excision, right', contractId: seedFallbackId('patient-standard'), completed: false },
  { key: 'otherSurgeonContract', listId: REVIEW_FLAGS_LIST_ID, patientId: PAT_21A_REVIEW.otherSurgeon, time: '11:00', text: 'Upper blepharoplasty, both', contractId: PRICED_ITEM.merFaceLift1, completed: true },
  { key: 'movableFixedBooking', listId: MERIVALE_BOOKING_LIST_ID, patientId: PAT_21A_REVIEW.movableFixed, time: '17:00', text: 'Face lift', contractId: PRICED_ITEM.merFaceLift, completed: false },
]

export function seedReviewFlagBookings(next: { booking: number; procedure: number }): {
  bookings: Booking[]
  procedures: Procedure[]
  audit: AuditEntry[]
  ids: Record<ReviewFlagBookingKey, string>
  next: { booking: number; procedure: number }
} {
  const bookings: Booking[] = []
  const procedures: Procedure[] = []
  const audit: AuditEntry[] = []
  const ids = {} as Record<ReviewFlagBookingKey, string>
  let b = next.booking
  let p = next.procedure
  for (const spec of SPECS) {
    const bookingId = `BK${String(b).padStart(4, '0')}`
    const procedureId = `P${String(p).padStart(4, '0')}`
    const onReview = spec.listId === REVIEW_FLAGS_LIST_ID
    const completedAtISO = `${DAY}T${spec.finish ?? '11:45'}:00`
    const booking: Booking = {
      id: bookingId,
      listId: spec.listId,
      patientId: spec.patientId,
      scheduledTime: spec.time,
      completed: spec.completed,
      // The seed's source rule: Christchurch Eye Surgery's rooms send PDFs; St George's sends a feed.
      source: onReview ? 'surgeonPdf' : 'hospitalDownload',
      lastModifiedBy: spec.completed ? CHEN : 'Kirsty W.',
      lastModifiedAtISO: spec.completed ? completedAtISO : '2026-07-20T15:20:00',
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
      procedure.anaestheticStartISO = `${DAY}T${spec.start}:00`
      procedure.handoverISO = `${DAY}T${spec.finish}:00`
    }
    if (spec.priceOverride !== undefined) procedure.priceOverride = spec.priceOverride
    // Christchurch Eye Surgery's own Contract carries its reference, as every other seeded hospital-billed Procedure does.
    if (spec.contractId === CES_RVG) procedure.billingReference = 'CES-2026-0714-01'
    procedures.push(procedure)
    if (spec.key === 'contractChangeBooking') {
      // Dr Chen's change on his own List (Phase 20's record), before he completed it; never approved.
      audit.push({
        id: 'seed-21a-contract-change',
        entityType: 'procedure',
        entityId: procedureId,
        who: CHEN,
        role: 'anaesthetist',
        source: 'anaesthetist',
        action: 'procedure.contract',
        before: { governingContractId: CONTRACT_CHANGED_FROM },
        after: { governingContractId: CES_RVG },
        atISO: `${DAY}T08:52:00`,
      })
    }
    ids[spec.key] = bookingId
    b += 1
    p += 1
  }
  return { bookings, procedures, audit, ids, next: { booking: b, procedure: p } }
}

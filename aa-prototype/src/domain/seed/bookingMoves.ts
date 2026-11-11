/**
 * The one seed record catch-up Phase 32a adds (US-01.4.7's acceptance beat):
 * a Booking on Dr Beaumont's Fri 31 Jul AM List at Christchurch Eye Surgery
 * (Mr Whitford), a session where Dr Souter is not available. The canvas gave
 * no colleague Booking in a session she is closed in, so the PWA stand-in
 * "Colleague moves a Booking to me" offers this one only after she sets Fri 31
 * AM available herself, which is her acceptance (OQ-85, D61).
 *
 * Appended after every other seeded Booking and Procedure (the next free ids),
 * RNG-free, on a List no beat scripts; the canvas generator is untouched.
 */

import type { Booking, Procedure } from '../types'
import { projectedListId } from '../slots'
import { ANAE } from './cast'
import { CONTRACT } from './contracts'
import { rvgGroupIdForLegacyCode } from './rvgGroups'

export const ACCEPTANCE_BEAT_LIST_ID = projectedListId(ANAE.beaumont, '2026-07-31', 'AM')
export const ACCEPTANCE_BEAT_PATIENT_ID = 'PT0120'

export function seedBookingMoveBookings(next: { booking: number; procedure: number }): {
  bookings: Booking[]
  procedures: Procedure[]
  next: { booking: number; procedure: number }
} {
  const bookingId = `BK${String(next.booking).padStart(4, '0')}`
  const booking: Booking = {
    id: bookingId,
    listId: ACCEPTANCE_BEAT_LIST_ID,
    // A generated patient, so no scripted patient gains a second Booking.
    patientId: ACCEPTANCE_BEAT_PATIENT_ID,
    scheduledTime: '08:30',
    completed: false,
    // Christchurch Eye Surgery Lists arrive as the surgeon's PDF (the seed's source rule).
    source: 'surgeonPdf',
    attachments: [],
    lastModifiedBy: 'Kirsty W.',
    lastModifiedAtISO: '2026-07-20T16:40:00',
  }
  const procedure: Procedure = {
    id: `P${String(next.procedure).padStart(4, '0')}`,
    bookingId,
    description: 'Cataract extraction with IOL',
    rvgGroupId: rvgGroupIdForLegacyCode('42702'),
    isAdditional: false,
    modifierClaims: [],
    removedModifierIds: [],
    governingContractId: CONTRACT.cesRvg,
    billingReference: 'CE-2026-0731',
  }
  return { bookings: [booking], procedures: [procedure], next: { booking: next.booking + 1, procedure: next.procedure + 1 } }
}

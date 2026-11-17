/**
 * A payer on each Procedure (catch-up Phase 22a; US-11.2.2, US-08.2.1; D85,
 * provisional on OQ-140): two seed additions, appended after every other
 * seeded Booking and Procedure (the next free ids), RNG-free, so no existing
 * id or S1 to S5 figure moves.
 *
 * - Grace Park's Booking gains a second Procedure on No contract · RVG whose
 *   payer is copied from her first: Hana Park, the same BP0001, so the two
 *   share one invoice (a copied payer is the same payer).
 * - The payer review List gains one Booking (`twoPayerBooking`): Joyce Halvorsen,
 *   whose two Procedures on No contract · RVG each name a payer typed in
 *   separately with the same name and email, two BP ids (BP0004 and BP0005).
 *   Payers are never matched on name or email, so authorising the List raises
 *   two invoices (US-08.2.1 "Payer typed separately").
 */

import type { Procedure, ProcedurePayer, Booking } from '../types'
import { CONTRACT } from './contracts'
import { HANA_PARK_PAYER, PAT_22A } from './patients'
import { PAYER_REVIEW_LIST_ID } from './payerReviewBookings'
import { rvgGroupIdForLegacyCode } from './rvgGroups'
import { seedText } from './procedureText'

const DAY = '2026-07-17'

/** The same person, typed in separately on each Procedure: two payers (two BP ids), never matched on name or email. */
const TYPED_PAYER = { kind: 'other', name: 'Erik Halvorsen', relationship: 'Son', email: 'erik.halvorsen@example.net' } as const
export const TWO_PAYER_FIRST: ProcedurePayer = { ...TYPED_PAYER, id: 'BP0004' }
export const TWO_PAYER_SECOND: ProcedurePayer = { ...TYPED_PAYER, id: 'BP0005' }

export function seedProcedurePayerBookings(
  next: { booking: number; procedure: number },
  guardianBookingId: string,
): {
  bookings: Booking[]
  procedures: Procedure[]
  ids: { graceParkSecondProcedure: string; twoPayerBooking: string; twoPayerProcedures: [string, string] }
  next: { booking: number; procedure: number }
} {
  let p = next.procedure
  const procedureId = (): string => `P${String(p++).padStart(4, '0')}`

  // Grace Park's second Procedure: not yet done (her List is Fri 24 Jul), its payer copied from the first.
  const gracePark: Procedure = {
    id: procedureId(),
    bookingId: guardianBookingId,
    payer: HANA_PARK_PAYER,
    procedureText: seedText('Examination under anaesthetic, both eyes'),
    invoiceDescription: null,
    governingContractId: CONTRACT.noContractRvg,
    rvgGroupId: rvgGroupIdForLegacyCode('42794'),
    isAdditional: true,
    modifierClaims: [],
    removedModifierIds: [],
  }

  const bookingId = `BK${String(next.booking).padStart(4, '0')}`
  const booking: Booking = {
    id: bookingId,
    listId: PAYER_REVIEW_LIST_ID,
    patientId: PAT_22A.twoPayers,
    scheduledTime: '13:30',
    completed: true,
    completedAtISO: `${DAY}T14:45:00`,
    // The seed's source rule: Christchurch Eye Surgery's rooms send PDFs.
    source: 'surgeonPdf',
    lastModifiedBy: 'Dr Alistair Chen',
    lastModifiedAtISO: `${DAY}T14:45:00`,
  }
  const first: Procedure = {
    id: procedureId(),
    bookingId,
    payer: TWO_PAYER_FIRST,
    procedureText: seedText('Cataract extraction and lens, right'),
    invoiceDescription: null,
    governingContractId: CONTRACT.noContractRvg,
    rvgGroupId: rvgGroupIdForLegacyCode('42702'),
    isAdditional: false,
    modifierClaims: [],
    removedModifierIds: [],
    anaestheticStartISO: `${DAY}T13:35:00`,
    handoverISO: `${DAY}T14:10:00`,
  }
  const second: Procedure = {
    id: procedureId(),
    bookingId,
    payer: TWO_PAYER_SECOND,
    procedureText: seedText('Cataract extraction and lens, left'),
    invoiceDescription: null,
    governingContractId: CONTRACT.noContractRvg,
    rvgGroupId: rvgGroupIdForLegacyCode('42702'),
    isAdditional: true,
    modifierClaims: [],
    removedModifierIds: [],
    anaestheticStartISO: `${DAY}T14:10:00`,
    handoverISO: `${DAY}T14:45:00`,
  }

  return {
    bookings: [booking],
    procedures: [gracePark, first, second],
    ids: { graceParkSecondProcedure: gracePark.id, twoPayerBooking: bookingId, twoPayerProcedures: [first.id, second.id] },
    next: { booking: next.booking + 1, procedure: p },
  }
}

/**
 * The payer review List (catch-up Phase 21; US-11.2.2 to US-11.2.4, US-11.4.3):
 * Dr Chen's Fri 17 Jul AM List at Christchurch Eye Surgery with Mr Reid, a
 * past-dated List the seed leaves empty, made SUBMITTED so it waits in the
 * Review queue. No S1 to S5 beat uses it (S3 reviews Dr Souter's Mon 20 Lists),
 * and its patients are dedicated pinned patients (`PAT_REVIEW`), never handed
 * out by the filler. Every Booking is completed, on No contract · RVG unless
 * stated, so the List authorises with its warnings open.
 *
 * - `childPayer`: Ella Moana, 15 on the List's date, the patient pays: the
 *   child payer warning (derived, not seeded).
 * - `payerContactMissing`: Kevin Doherty, no email and no postal address on
 *   file: "Email or postal address needed" on the Procedure's payer and Review.
 * - `familyTrustPayer`: Robert Whitcombe, the Whitcombe Family Trust ticked as
 *   payer with a postal address and no email: no flag (Phase 22 posts it).
 * - `approvalMissing`: Janet Ormsby, funded by NIB on nib's Contract with no
 *   approval number: the approval warning; the rail suggests Special › NIB.
 * - `funderNoWarning`: Peter Tawhiri, funded by Health NZ with no number: no
 *   warning (a funder, not an insurer).
 *
 * And one Booking off the List (`suggestedTag`): Lucy Fairhall, funded by
 * Southern Cross Health Society with an approval number, on Dr Fitzgerald's empty
 * Thu 23 Jul AM List at Southern Cross with no Contract yet, so the office's
 * step rail opens on it with Southern Cross › SXAP marked "Suggested".
 *
 * Appended after every other seeded Booking and Procedure (the next free ids),
 * RNG-free, so no existing id or S1 to S5 figure moves.
 */

import type { Booking, ProcedurePayer, Procedure } from '../types'
import { projectedListId } from '../slots'
import { ANAE } from './cast'
import { CONTRACT } from './contracts'
import { PARTY } from './parties'
import { PAT_REVIEW } from './patients'
import { rvgGroupIdForLegacyCode } from './rvgGroups'
import { seedText } from './procedureText'

export const PAYER_REVIEW_LIST_ID = projectedListId(ANAE.chen, '2026-07-17', 'AM')
const DAY = '2026-07-17'

/** The Whitcombe Family Trust, paying by post (BP0003, the first payer id after the retired master's two). */
export const FAMILY_TRUST_PAYER: ProcedurePayer = {
  kind: 'other',
  id: 'BP0003',
  name: 'Whitcombe Family Trust',
  relationship: 'Family trust',
  postalAddress: { line1: 'PO Box 13245', city: 'Christchurch', postcode: '8141' },
}

/** Dr Fitzgerald's Thu 23 Jul AM List at Southern Cross with Ms Patel (SX-002 is tagged SXAP): empty in the seed, off every beat. */
export const SUGGESTED_TAG_LIST_ID = projectedListId(ANAE.fitzgerald, '2026-07-23', 'AM')

interface Spec {
  key: 'childPayer' | 'payerContactMissing' | 'familyTrustPayer' | 'approvalMissing' | 'funderNoWarning' | 'suggestedTag'
  /** Default: the payer review List. */
  listId?: string
  patientId: string
  time: string
  text: string
  legacyCode?: string
  /** Undefined: no Contract yet ("Needs an invoice destination"). */
  contractId?: string
  payer?: ProcedurePayer
  funderPartyId?: string
  insuranceApprovalNumber?: string
  /** Not completed (a forward List). */
  open?: true
  /** Anaesthetic start and finish, as HH:MM on the List's day. */
  start: string
  finish: string
}

const SPECS: readonly Spec[] = [
  { key: 'childPayer', patientId: PAT_REVIEW.childPayer, time: '08:00', text: 'Strabismus correction, left eye', legacyCode: '42794', contractId: CONTRACT.noContractRvg, start: '08:05', finish: '09:00' },
  { key: 'payerContactMissing', patientId: PAT_REVIEW.contactMissing, time: '09:15', text: 'Cataract extraction and lens, right', legacyCode: '42702', contractId: CONTRACT.noContractRvg, start: '09:20', finish: '10:00' },
  { key: 'familyTrustPayer', patientId: PAT_REVIEW.familyTrust, time: '10:15', text: 'Cataract extraction and lens, left', legacyCode: '42702', contractId: CONTRACT.noContractRvg, payer: FAMILY_TRUST_PAYER, start: '10:20', finish: '11:00' },
  { key: 'approvalMissing', patientId: PAT_REVIEW.approvalMissing, time: '11:15', text: 'Vitrectomy, right', legacyCode: '42725', contractId: CONTRACT.nibRvg, funderPartyId: PARTY.nib, start: '11:20', finish: '12:15' },
  { key: 'funderNoWarning', patientId: PAT_REVIEW.funderNoWarning, time: '12:30', text: 'Cataract extraction and lens, right', legacyCode: '42702', contractId: CONTRACT.noContractRvg, funderPartyId: PARTY.healthNz, start: '12:35', finish: '13:15' },
  { key: 'suggestedTag', listId: SUGGESTED_TAG_LIST_ID, patientId: PAT_REVIEW.suggestedTag, time: '08:30', text: 'lap chole', funderPartyId: PARTY.schs, insuranceApprovalNumber: 'SCHS-2026-55120', open: true, start: '', finish: '' },
]

export type PayerReviewKey = Spec['key']

export function seedPayerReviewBookings(next: { booking: number; procedure: number }): {
  bookings: Booking[]
  procedures: Procedure[]
  ids: Record<PayerReviewKey, string>
  next: { booking: number; procedure: number }
} {
  const bookings: Booking[] = []
  const procedures: Procedure[] = []
  const ids = {} as Record<PayerReviewKey, string>
  let b = next.booking
  let p = next.procedure
  for (const spec of SPECS) {
    const bookingId = `BK${String(b).padStart(4, '0')}`
    const completedAtISO = `${DAY}T${spec.finish}:00`
    const booking: Booking = {
      id: bookingId,
      listId: spec.listId ?? PAYER_REVIEW_LIST_ID,
      patientId: spec.patientId,
      scheduledTime: spec.time,
      completed: spec.open !== true,
      // The seed's source rule: Christchurch Eye Surgery's rooms send PDFs; Southern Cross sends a feed.
      source: spec.open === true ? 'hospitalDownload' : 'surgeonPdf',
      lastModifiedBy: spec.open === true ? 'Kirsty W.' : 'Dr Alistair Chen',
      lastModifiedAtISO: spec.open === true ? '2026-07-20T16:30:00' : completedAtISO,
    }
    if (spec.open !== true) booking.completedAtISO = completedAtISO
    if (spec.funderPartyId !== undefined) booking.funderPartyId = spec.funderPartyId
    if (spec.insuranceApprovalNumber !== undefined) booking.insuranceApprovalNumber = spec.insuranceApprovalNumber
    bookings.push(booking)
    const procedure: Procedure = {
      id: `P${String(p).padStart(4, '0')}`,
      bookingId,
      payer: spec.payer ?? { kind: 'patient' },
      procedureText: seedText(spec.text),
      invoiceDescription: null,
      isPrimary: true,
      modifierClaims: [],
      removedModifierIds: [],
    }
    if (spec.contractId !== undefined) procedure.governingContractId = spec.contractId
    if (spec.legacyCode !== undefined) procedure.rvgGroupId = rvgGroupIdForLegacyCode(spec.legacyCode)
    if (spec.open !== true) {
      procedure.anaestheticStartISO = `${DAY}T${spec.start}:00`
      procedure.handoverISO = `${DAY}T${spec.finish}:00`
    }
    procedures.push(procedure)
    ids[spec.key] = bookingId
    b += 1
    p += 1
  }
  return { bookings, procedures, ids, next: { booking: b, procedure: p } }
}

/**
 * Catch-up Phase 25a's seed (US-07.2.2, D81): the Disabled Contract flag.
 *
 * Christchurch Eye Surgery's old rate (`CONTRACT.cesOldRate`, held by the
 * hospital, RVG at the Contract's rate, so it fits 21a's review-flags List and
 * "Contract not offered on this List" stays quiet) was disabled by the office
 * on Fri 10 Jul 2026: a `contract.disable` audit entry, the only place the day
 * is kept. One completed Booking on that List (Dr Chen's Tue 14 Jul AM, already
 * SUBMITTED) is still on it: Review reads "Contract disabled on Fri 10 Jul" and
 * the List still authorises.
 *
 * A dedicated pinned patient (`PAT_25A`), appended after every other seeded
 * Booking and Procedure, RNG-free, so no id or scripted figure moves.
 */

import type { AuditEntry, Booking, Procedure } from '../types'
import { CONTRACT } from './contracts'
import { PAT_25A } from './patients'
import { REVIEW_FLAGS_LIST_ID } from './reviewFlagBookings'
import { rvgGroupIdForLegacyCode } from './rvgGroups'
import { seedText } from './procedureText'

const DAY = '2026-11-17'
const CHEN = 'Dr Alistair Chen'

/** The office's disable of the old rate (Kirsty W., Fri 10 Jul 2026). */
export const DISABLED_CONTRACT_ON = '2026-11-13'

export function seedDisabledContractBooking(next: { booking: number; procedure: number }): {
  bookings: Booking[]
  procedures: Procedure[]
  audit: AuditEntry[]
  ids: { disabledContractBooking: string }
  next: { booking: number; procedure: number }
} {
  const bookingId = `BK${String(next.booking).padStart(4, '0')}`
  const procedureId = `P${String(next.procedure).padStart(4, '0')}`
  const completedAtISO = `${DAY}T12:40:00`
  const booking: Booking = {
    id: bookingId,
    listId: REVIEW_FLAGS_LIST_ID,
    patientId: PAT_25A.disabledContract,
    scheduledTime: '11:45',
    completed: true,
    completedAtISO,
    // Christchurch Eye Surgery's rooms send PDFs (the seed's source rule).
    source: 'surgeonPdf',
    lastModifiedBy: CHEN,
    lastModifiedAtISO: completedAtISO,
  }
  const procedure: Procedure = {
    id: procedureId,
    bookingId,
    payer: { kind: 'patient' },
    procedureText: seedText('Cataract extraction and lens, right'),
    invoiceDescription: null,
    isPrimary: true,
    modifierClaims: [],
    removedModifierIds: [],
    governingContractId: CONTRACT.cesOldRate,
    rvgGroupId: rvgGroupIdForLegacyCode('42702'),
    anaestheticStartISO: `${DAY}T11:50:00`,
    handoverISO: `${DAY}T12:35:00`,
  }
  const audit: AuditEntry[] = [
    {
      id: 'seed-25a-contract-disable',
      entityType: 'contract',
      entityId: CONTRACT.cesOldRate,
      who: 'Kirsty W.',
      role: 'office',
      source: 'office',
      action: 'contract.disable',
      before: { status: 'active' },
      after: { status: 'disabled' },
      atISO: `${DISABLED_CONTRACT_ON}T16:05:00`,
    },
  ]
  return {
    bookings: [booking],
    procedures: [procedure],
    audit,
    ids: { disabledContractBooking: bookingId },
    next: { booking: next.booking + 1, procedure: next.procedure + 1 },
  }
}

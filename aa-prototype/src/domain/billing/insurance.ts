/**
 * Insurance on the Booking, in one place (catch-up Phase 21; US-11.4.3,
 * DM-12; OQ-93 answered, D28 extended 5 November).
 *
 * The Booking names its insurer or funder as a Party and holds the approval
 * number. A missing approval number is the only insurance warning, and only
 * for an insurer (our reading, AR-58 A42): a Party of kind `insurer` (NIB,
 * Southern Cross Health Society), never a `funder` (ACC, Health NZ). There is
 * no check of the insurer against the Contracts chosen, and the funder never
 * reaches who is billed (`whoIsBilled.ts`).
 */

import type { Booking } from '../types'
import type { Party } from './parties'
import { FUNDER_PARTY_KINDS } from './fundingTags'

/** The Parties a Booking may name as its insurer or funder. */
export function isInsurerOrFunder(party: Pick<Party, 'kind'> | undefined): boolean {
  return party !== undefined && FUNDER_PARTY_KINDS.includes(party.kind)
}

/** The insurer and funder Parties, insurers first, each by name (the Funder sheet's choices). */
export function insurerAndFunderParties(parties: Readonly<Record<string, Party>>): Party[] {
  return Object.values(parties)
    .filter((p) => isInsurerOrFunder(p))
    .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'insurer' ? -1 : 1))
}

/** True when the Booking holds an approval number (blank is none). */
export function hasApprovalNumber(booking: Pick<Booking, 'insuranceApprovalNumber'>): boolean {
  return booking.insuranceApprovalNumber !== undefined && booking.insuranceApprovalNumber.trim() !== ''
}

/**
 * US-11.4.3: the Booking's funder is an insurer and there is no approval
 * number. Silent for a blank funder, for ACC and Health NZ (funders), and
 * whatever Contract was chosen.
 */
export function approvalNumberMissing(
  booking: Pick<Booking, 'funderPartyId' | 'insuranceApprovalNumber'>,
  parties: Readonly<Record<string, Pick<Party, 'kind'>>>,
): boolean {
  if (booking.funderPartyId === undefined) return false
  return parties[booking.funderPartyId]?.kind === 'insurer' && !hasApprovalNumber(booking)
}

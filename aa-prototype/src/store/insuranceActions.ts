/**
 * The Booking's insurer or funder and its approval number: their one writer
 * (catch-up Phase 21; US-11.4.3, DM-12; OQ-93, D28).
 *
 * The office records and changes both; the anaesthetist may too on their own
 * List (on the day is when they usually learn of an approval; no date gate),
 * both under `editRefusal` (until AUTHORISED). The funder must be a Party of
 * kind insurer or funder; a blank funder is fine when the patient pays.
 * Nothing here touches who is billed or the Contracts offered. Phase 33 sets
 * both from a hospital download row through this action.
 */

import { isInsurerOrFunder } from '../domain/billing/insurance'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { editRefusal, getBooking } from './lifecycle'

export interface InsuranceInput {
  /** The insurer or funder Party, or undefined for none (the patient pays). */
  funderPartyId?: string
  /** The approval number; blank clears it. */
  insuranceApprovalNumber?: string
}

export const CHOOSE_INSURER_OR_FUNDER = 'Choose an insurer or funder.'

/** The funder as History narrates it: the Party's name, or "None". */
function funderText(state: Pick<AppState, 'masters'>, funderPartyId: string | undefined): string {
  return funderPartyId === undefined ? 'None' : (state.masters.parties[funderPartyId]?.name ?? funderPartyId)
}

/** Set the Booking's insurer or funder and approval number (the one writer). Audited `booking.insurance`. */
export function setBookingInsurance(api: AppStoreApi, actor: Actor, bookingId: string, input: InsuranceInput): Outcome {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found
  if (booking.cancellation !== undefined) return refuse('bookingCancelled', 'This Booking is cancelled.')
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  // A funder already on the Booking stays acceptable (its Party may have changed kind since); a new one must be an insurer or funder.
  if (input.funderPartyId !== undefined && input.funderPartyId !== booking.funderPartyId && !isInsurerOrFunder(state.masters.parties[input.funderPartyId])) {
    return refuse('notInsurerOrFunder', CHOOSE_INSURER_OR_FUNDER)
  }
  const number = input.insuranceApprovalNumber?.trim()
  const next = { ...booking }
  if (input.funderPartyId === undefined) delete next.funderPartyId
  else next.funderPartyId = input.funderPartyId
  if (number === undefined || number === '') delete next.insuranceApprovalNumber
  else next.insuranceApprovalNumber = number
  if (next.funderPartyId === booking.funderPartyId && next.insuranceApprovalNumber === booking.insuranceApprovalNumber) return ok(undefined)

  mutate(
    api,
    actor,
    {
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.insurance',
      before: { insurerOrFunder: funderText(state, booking.funderPartyId), insuranceApprovalNumber: booking.insuranceApprovalNumber ?? null },
      after: { insurerOrFunder: funderText(state, next.funderPartyId), insuranceApprovalNumber: next.insuranceApprovalNumber ?? null },
    },
    (s) => ({ schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [bookingId]: next } } }),
  )
  return ok(undefined)
}

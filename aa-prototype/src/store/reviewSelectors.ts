/**
 * Review's inputs (catch-up Phase 21a): one selector gathers what the pure
 * review-flag list (`domain/billing/reviewFlags.ts`) reads for a Booking, so
 * Review, the PWA and the seed tests all see the same flags.
 */

import type { AppState } from './appStore'
import type { Booking } from '../domain/types'
import { feeContextFor } from '../domain/billing/validateBookingForBilling'
import { feeFor } from '../domain/billing/fee'
import { groupOf } from '../domain/billing/rvgGroups'
import { computedPriceFor } from '../domain/billing/priceStatus'
import { reviewFlagsForBooking, type ReviewBookingInput, type ReviewFlag } from '../domain/billing/reviewFlags'
import { billingContextForBooking, proceduresForBooking, railContextForList, railMastersOf } from './selectors'
import { contractChangeFor } from './contractApprovalActions'

/** The flag list's input for one Booking; undefined on a Draft List (no anaesthetist prices it). */
export function reviewInputFor(state: AppState, booking: Booking): ReviewBookingInput | undefined {
  const list = state.schedule.lists[booking.listId]
  const ctx = billingContextForBooking(state, booking)
  if (list === undefined || ctx === undefined) return undefined
  const procedures = proceduresForBooking(state, booking.id).map((procedure) => {
    const feeCtx = feeContextFor(procedure, ctx)
    const fee = feeFor(procedure, feeCtx)
    const rvgGroup = groupOf(state.masters.rvgGroups, procedure.rvgGroupId)
    const contract = feeCtx.contract
    const computedPrice = contract !== undefined ? computedPriceFor(procedure, contract, feeCtx) : undefined
    const contractChange = contractChangeFor(state, procedure.id)
    return {
      procedure,
      fee,
      ...(rvgGroup !== undefined ? { rvgGroup } : {}),
      ...(computedPrice !== undefined ? { computedPrice } : {}),
      ...(contractChange !== undefined ? { contractChange } : {}),
    }
  })
  const patient = state.masters.patients[booking.patientId]
  return {
    booking,
    procedures,
    rail: { masters: railMastersOf(state), ctx: railContextForList(state, list, booking) },
    ...(patient !== undefined ? { patient } : {}),
    timeRule: state.masters.rvgTimeRule,
    modifierInputs: { patientDobISO: patient?.dobISO, procedureDateISO: list.dateISO, modifiers: state.masters.modifiers },
  }
}

/** A Booking's review flags, in rule order (none when cancelled or on a Draft List). */
export function reviewFlagsFor(state: AppState, bookingId: string): ReviewFlag[] {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return []
  const input = reviewInputFor(state, booking)
  return input === undefined ? [] : reviewFlagsForBooking(input)
}

/** Every flag on a List's non-cancelled Bookings, in Booking order (Review's Flags tile). */
export function reviewFlagsOnList(state: AppState, listId: string): ReviewFlag[] {
  return Object.values(state.schedule.bookings)
    .filter((b) => b.listId === listId && b.cancellation === undefined)
    .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '') || a.id.localeCompare(b.id))
    .flatMap((b) => reviewFlagsFor(state, b.id))
}

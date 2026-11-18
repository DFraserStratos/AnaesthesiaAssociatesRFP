/**
 * Review's inputs (catch-up Phase 21a): one selector gathers what the pure
 * review-flag list (`domain/billing/reviewFlags.ts`) reads for a Booking, so
 * Review, the PWA and the seed tests all see the same flags.
 */

import type { AppState } from './appStore'
import type { Booking } from '../domain/types'
import { bookingFeesFor, feeContextFor } from '../domain/billing/validateBookingForBilling'
import { groupOf } from '../domain/billing/rvgGroups'
import { computedPriceFor } from '../domain/billing/priceStatus'
import { disabledDaysByContract } from '../domain/billing/contractHistory'
import { reviewFlagsForBooking, type ReviewBookingInput, type ReviewFlag } from '../domain/billing/reviewFlags'
import { billingContextForBooking, proceduresForBooking, railContextForList, railMastersOf } from './selectors'
import { contractChangeFor } from './contractApprovalActions'
import { prepaymentForProcedure } from './prepaymentSelectors'

/**
 * The flag list's input for one Booking; undefined on a Draft List (no
 * anaesthetist prices it). `disabledDays` is `disabledDaysByContract(state.audit)`:
 * pass it when reading many Bookings so the audit is read once (catch-up Phase 25a).
 */
export function reviewInputFor(
  state: AppState,
  booking: Booking,
  disabledDays: Readonly<Record<string, string>> = disabledDaysByContract(state.audit),
): ReviewBookingInput | undefined {
  const list = state.schedule.lists[booking.listId]
  const ctx = billingContextForBooking(state, booking)
  if (list === undefined || ctx === undefined) return undefined
  const bookingProcedures = proceduresForBooking(state, booking.id)
  // The Booking is priced once, under the multi-procedure rule (catch-up Phase 23).
  const priced = bookingFeesFor(bookingProcedures, ctx)
  if (priced.kind === 'structural') return undefined
  const procedures = bookingProcedures.map((procedure) => {
    const feeCtx = feeContextFor(procedure, ctx)
    const fee = priced.fees[procedure.id]!
    const rvgGroup = groupOf(state.masters.rvgGroups, procedure.rvgGroupId)
    const contract = feeCtx.contract
    const computedPrice = contract !== undefined ? computedPriceFor(procedure, contract, { ...feeCtx, allocation: fee.allocation, bookingProcedureCount: bookingProcedures.length }) : undefined
    const contractChange = contractChangeFor(state, procedure.id)
    // A raised prepayment's chip (catch-up Phase 27).
    const prepay = prepaymentForProcedure(state, procedure.id)
    return {
      ...(prepay !== undefined ? { prepayment: { status: prepay.status, issued: prepay.invoiceId !== undefined } } : {}),
      procedure,
      fee,
      ...(rvgGroup !== undefined ? { rvgGroup } : {}),
      ...(computedPrice !== undefined ? { computedPrice } : {}),
      ...(contractChange !== undefined ? { contractChange } : {}),
    }
  })
  // The disable day of each of the Booking's Disabled Contracts (catch-up Phase 25a, D81).
  const disabledOn: Record<string, string> = {}
  for (const p of bookingProcedures) {
    const id = p.governingContractId
    const day = id !== undefined ? disabledDays[id] : undefined
    if (id !== undefined && day !== undefined) disabledOn[id] = day
  }
  const patient = state.masters.patients[booking.patientId]
  return {
    booking,
    procedures,
    rail: { masters: railMastersOf(state), ctx: railContextForList(state, list, booking) },
    ...(patient !== undefined ? { patient } : {}),
    timeRule: state.masters.rvgTimeRule,
    modifierInputs: { patientDobISO: patient?.dobISO, procedureDateISO: list.dateISO, modifiers: state.masters.modifiers },
    listState: list.state,
    disabledOn,
  }
}

/** A Booking's review flags, in rule order (none when cancelled or on a Draft List). */
export function reviewFlagsFor(state: AppState, bookingId: string, disabledDays?: Readonly<Record<string, string>>): ReviewFlag[] {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return []
  const input = reviewInputFor(state, booking, disabledDays)
  return input === undefined ? [] : reviewFlagsForBooking(input)
}

/** Every flag on a List's non-cancelled Bookings, in Booking order (Review's Flags tile). */
export function reviewFlagsOnList(state: AppState, listId: string): ReviewFlag[] {
  const disabledDays = disabledDaysByContract(state.audit)
  return Object.values(state.schedule.bookings)
    .filter((b) => b.listId === listId && b.cancellation === undefined)
    .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '') || a.id.localeCompare(b.id))
    .flatMap((b) => reviewFlagsFor(state, b.id, disabledDays))
}

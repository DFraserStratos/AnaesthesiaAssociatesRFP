/**
 * The Split button's write (catch-up Phase 22; US-08.2.3, DM-28, RV-31): a
 * user action on the Booking, for the office and for the anaesthetist on
 * their own Booking, inside 38a's edit window (`editRefusal`: until the List
 * is AUTHORISED). Every rule is `domain/billing/splitShare.ts`'s; this action
 * adds the rights, the refusals and one audited commit. Nothing is written to
 * the Contract.
 */

import type { CounterpartyRef, FeeSplit } from '../domain/types'
import { feeContextFor } from '../domain/billing/validateBookingForBilling'
import { feeFor, type FeeResult } from '../domain/billing/fee'
import { NO_FEE_TO_SPLIT_MESSAGE, resolveSplit } from '../domain/billing/splitShare'
import { billablePartyForProcedure } from '../domain/billing/whoIsBilled'
import { isBillablePartyOn, partyOptionsFor, type PartyOption } from '../domain/billing/partyOptions'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { editRefusal, getBooking } from './lifecycle'
import { billingContextForBooking, bookingRequiresPrepayment, counterpartyName } from './selectors'

/** The refusal on a Procedure whose Booking carries the interim prepayment flag (INTERIM until Phase 27). */
export const PREPAID_PROCEDURE_MESSAGE = 'A prepaid procedure is billed by its prepayment.'

export { NO_FEE_TO_SPLIT_MESSAGE }

/** The Procedure's fee as the run would compute it, or undefined with no Contract or no price. */
export function procedureFeeNow(state: AppState, procedureId: string): FeeResult | undefined {
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined || procedure.governingContractId === undefined) return undefined
  const booking = state.schedule.bookings[procedure.bookingId]
  if (booking === undefined) return undefined
  const ctx = billingContextForBooking(state, booking)
  if (ctx === undefined) return undefined
  const fee = feeFor(procedure, feeContextFor(procedure, ctx))
  return fee.needsPrice ? undefined : fee
}

/** The party the Procedure's Contract bills (who is invoiced with no split). */
export function contractPartyFor(state: AppState, procedureId: string): CounterpartyRef | undefined {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  if (procedure === undefined || booking === undefined) return undefined
  const contract = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
  return billablePartyForProcedure(contract, procedure, booking.patientId, state.masters.parties)
}

/** The party picker's options for a Procedure (the one selector; `PartyPicker` reads it). */
export function partyOptionsForProcedure(state: AppState, procedureId: string): PartyOption[] {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  if (procedure === undefined || booking === undefined) return []
  return partyOptionsFor(procedure, booking.patientId, contractPartyFor(state, procedureId), state.masters.parties, (ref) => counterpartyName(state, ref, booking.id))
}

/**
 * Set (or with `null` remove) the split of one Procedure's fee. Refuses an
 * unresolvable split with `resolveSplit`'s reason, a prepaid Procedure, and a
 * Procedure with no fee yet. Audited `procedure.split`.
 */
export function setProcedureSplit(
  api: AppStoreApi,
  actor: Actor,
  bookingId: string,
  procedureId: string,
  split: FeeSplit | null,
): Outcome {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined || procedure.bookingId !== bookingId) return refuse('notFound', 'That procedure is not on this Booking.')
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights
  if (found.booking.cancellation !== undefined) return refuse('bookingCancelled', 'This Booking is cancelled.')

  if (split === null) {
    if (procedure.split === undefined) return ok(undefined)
  } else {
    if (bookingRequiresPrepayment(state, bookingId)) return refuse('prepaidProcedure', PREPAID_PROCEDURE_MESSAGE)
    const fee = procedureFeeNow(state, procedureId)
    if (fee === undefined || fee.total <= 0) return refuse('noFee', NO_FEE_TO_SPLIT_MESSAGE)
    if (split.shares.some((share) => !isBillablePartyOn(procedure, found.booking.patientId, share.party, state.masters.parties))) {
      return refuse('partyUnknown', 'Choose each party from the list.')
    }
    const resolved = resolveSplit(fee.total, split.shares)
    if (!resolved.ok) return refuse('splitInvalid', resolved.reason)
  }

  const next = { ...procedure }
  if (split === null) delete next.split
  else next.split = { shares: split.shares.map((s) => ({ party: { ...s.party }, basis: { ...s.basis } })) }

  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.split',
      before: { split: procedure.split ?? null },
      after: { split: next.split ?? null },
    },
    (s) => ({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: next } } }),
  )
  return ok(undefined)
}

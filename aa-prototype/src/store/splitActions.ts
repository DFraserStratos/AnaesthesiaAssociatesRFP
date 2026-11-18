/**
 * The Split button's write (catch-up Phase 22; US-08.2.3, DM-28, RV-31): a
 * user action on the Booking, for the office and for the anaesthetist on
 * their own Booking, inside 38a's edit window (`editRefusal`: until the List
 * is AUTHORISED). Every rule is `domain/billing/splitShare.ts`'s; this action
 * adds the rights, the refusals and one audited commit. Nothing is written to
 * the Contract.
 */

import { autoSendPrepayments } from './prepaymentActions'
import type { CounterpartyRef, FeeSplit, OtherPayer, SplitShare, SplitShareBasis } from '../domain/types'
import { bookingFeesFor } from '../domain/billing/validateBookingForBilling'
import type { FeeResult } from '../domain/billing/fee'
import { feeIn } from '../domain/billing/bookingFee'
import { NO_FEE_TO_SPLIT_MESSAGE, resolveSplit } from '../domain/billing/splitShare'
import { billablePartyForProcedure } from '../domain/billing/whoIsBilled'
import { isShareBillableOn, partyOptionsFor, type PartyOption } from '../domain/billing/partyOptions'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import { payerFromInput, payerInputRefusal, sameData, sameName, type PayerInput } from './payerActions'
import type { AppState, AppStoreApi } from './appStore'
import { editRefusal, getBooking } from './lifecycle'
import { billingContextForBooking, counterpartyName, proceduresForBooking } from './selectors'
import { prepaymentForProcedure } from './prepaymentSelectors'

/** The refusal on a split of a prepaid Procedure (catch-up Phase 27): its prepayment bills its one payer. */
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
  // Priced in its Booking, under the multi-procedure rule (catch-up Phase 23).
  const fee = feeIn(bookingFeesFor(proceduresForBooking(state, booking.id), ctx), procedure.id)
  return fee === undefined || fee.needsPrice ? undefined : fee
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

/** "Another person" as a form hands it in (catch-up Phase 22a): no id for a new person, the share's id when editing them. */
export type SplitPersonInput = Extract<PayerInput, { kind: 'other' }>

/** A share as the Split sheet hands it in: a party from the picker, or another person as typed. */
export type SplitShareInput = SplitShare | { person: SplitPersonInput; basis: SplitShareBasis }

export interface FeeSplitInput {
  shares: SplitShareInput[]
}

/**
 * The stored shares for the input: each "another person" through
 * `payerFromInput` (21's contact checks; a new person gets the next `BP####`;
 * the same person on this split, by id and name, keeps theirs, a renamed one
 * is a new person). A stored share naming a person must be one this split
 * already holds (the sheet re-sends shares it did not touch).
 */
function resolveShares(
  input: FeeSplitInput,
  current: readonly SplitShare[],
  counters: Record<string, number>,
): { ok: true; shares: SplitShare[]; counters: Record<string, number> } | { ok: false; outcome: Outcome } {
  const held = new Map<string, OtherPayer>()
  for (const share of current) if (share.person !== undefined) held.set(share.person.id, share.person)
  let next = counters
  const shares: SplitShare[] = []
  for (const share of input.shares) {
    if ('party' in share) {
      // A stored person is re-sent as this split holds them, never with details changed here (an edit comes as typed input).
      const person = share.person !== undefined ? held.get(share.person.id) : undefined
      if (share.person !== undefined && person === undefined) return { ok: false, outcome: refuse('partyUnknown', 'Choose each party from the list.') }
      shares.push({ party: { ...share.party }, basis: { ...share.basis }, ...(person !== undefined ? { person } : {}) })
      continue
    }
    const refused = payerInputRefusal(share.person)
    if (refused !== null) return { ok: false, outcome: refused }
    // One person, one share: the same held id typed twice is refused (two sets of details for one id).
    if (share.person.id !== undefined && input.shares.filter((s) => !('party' in s) && s.person.id === share.person.id).length > 1) {
      return { ok: false, outcome: refuse('partyUnknown', 'Each person can take one share only.') }
    }
    const before = share.person.id !== undefined ? held.get(share.person.id) : undefined
    const keepsId = before !== undefined && sameName(before.name, share.person.name)
    const resolved = payerFromInput(keepsId ? share.person : { ...share.person, id: undefined }, next)
    next = resolved.counters
    const person = resolved.payer as OtherPayer
    shares.push({ party: { kind: 'payer', id: person.id }, basis: { ...share.basis }, person })
  }
  return { ok: true, shares, counters: next }
}

/**
 * Set (or with `null` remove) the split of one Procedure's fee. Refuses an
 * unresolvable split with `resolveSplit`'s reason, a prepaid Procedure, and a
 * Procedure with no fee yet. A share may name "another person" (catch-up
 * Phase 22a; US-08.2.3, DM-28), kept on the share with their own `BP####` id.
 * Audited `procedure.split`.
 */
export function setProcedureSplit(
  api: AppStoreApi,
  actor: Actor,
  bookingId: string,
  procedureId: string,
  input: FeeSplitInput | FeeSplit | null,
): Outcome {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined || procedure.bookingId !== bookingId) return refuse('notFound', 'That procedure is not on this Booking.')
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights
  if (found.booking.cancellation !== undefined) return refuse('bookingCancelled', 'This Booking is cancelled.')

  let split: FeeSplit | null = null
  let counters = state.counters
  if (input === null) {
    if (procedure.split === undefined) return ok(undefined)
  } else {
    const prepayment = prepaymentForProcedure(state, procedureId)
    // Prepaid, or covered by a sent prepayment it has since left (held and left off until 41 settles it): never split.
    if (prepayment !== undefined) return refuse('prepaidProcedure', PREPAID_PROCEDURE_MESSAGE)
    const fee = procedureFeeNow(state, procedureId)
    if (fee === undefined || fee.total <= 0) return refuse('noFee', NO_FEE_TO_SPLIT_MESSAGE)
    const shares = resolveShares(input, procedure.split?.shares ?? [], state.counters)
    if (!shares.ok) return shares.outcome
    if (shares.shares.some((share) => !isShareBillableOn(procedure, found.booking.patientId, share, state.masters.parties))) {
      return refuse('partyUnknown', 'Choose each party from the list.')
    }
    const resolved = resolveSplit(fee.total, shares.shares)
    if (!resolved.ok) return refuse('splitInvalid', resolved.reason)
    split = { shares: shares.shares }
    counters = shares.counters
  }

  // The same split re-saved writes nothing (no audit, no stamp).
  if (split !== null && procedure.split !== undefined && sameData(split, procedure.split)) return ok(undefined)

  const next = { ...procedure }
  if (split === null) delete next.split
  else next.split = split

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
    (s) => ({ counters, schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: next } } }),
  )
  // With prepayment approval off, a group this makes ready is sent now (catch-up Phase 27).
  autoSendPrepayments(api, procedure.bookingId)
  return ok(undefined)
}

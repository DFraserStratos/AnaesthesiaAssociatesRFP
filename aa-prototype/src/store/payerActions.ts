/**
 * The payer on a Booking: its one writer (catch-up Phase 21; US-11.2.2,
 * US-11.2.3; DM-11; AR-44 `#payer`).
 *
 * `setBookingPayer` is the only action that changes `Booking.payer` after
 * creation. The "different payer" tick clear keeps the patient as the payer
 * (any email or postal address typed here fills only what the patient record
 * lacks, for this Booking); ticked names any party who pays: a parent, a
 * guardian, a benefactor or a family trust. The office and the anaesthetist
 * may change it until the List is AUTHORISED (`editRefusal`, as 38a left it).
 * A payer with neither an email nor a postal address is saved: the sheet asks
 * and Review flags it (`payerContactMissing`), never a block (our reading).
 * Phase 27 hooks its prepayment re-check here; Phase 25 locks it at
 * AUTHORISED (already refused by `editRefusal`).
 */

import type { BookingPayer, PostalAddress } from '../domain/types'
import { cleanPostalAddress, emailProblem, formatPostalAddress, isBlankPostalAddress, postalAddressProblem } from '../domain/billing/payer'
import { payerCounterparty } from '../domain/billing/whoIsBilled'
import { prePaymentInvoicesForBooking } from './selectors'
import { allocateId, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { editRefusal, getBooking } from './lifecycle'

/** What a form hands in: the stored shape, with an address as typed and no id for a new other payer. */
export type PayerInput =
  | { kind: 'patient'; email?: string; postalAddress?: Partial<PostalAddress> }
  | {
      kind: 'other'
      /** Kept when editing the same other payer; omitted for a new one (a `BP####` id is allocated). */
      id?: string
      name: string
      relationship?: string
      email?: string
      postalAddress?: Partial<PostalAddress>
      phone?: string
    }

export const PAYER_NAME_REQUIRED = "Enter the payer's name."
export const PAYER_LOCKED_BY_PREPAYMENT = 'A prepayment invoice has already been raised to the current payer, so the payer cannot change.'

/** What is wrong with a payer as typed, or null (the store and the sheet share it). */
export function payerInputRefusal(input: PayerInput): Outcome<never> | null {
  if (input.kind === 'other' && input.name.trim() === '') return refuse('payerNameRequired', PAYER_NAME_REQUIRED)
  const badEmail = emailProblem(input.email)
  if (badEmail !== null) return refuse('payerEmailInvalid', badEmail)
  if (!isBlankPostalAddress(input.postalAddress)) {
    const badAddress = postalAddressProblem(input.postalAddress)
    if (badAddress !== null) return refuse('payerAddressInvalid', badAddress)
  }
  return null
}

function trimmed(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === '' ? undefined : value.trim()
}

/**
 * The stored payer for an input, allocating a `BP####` id for a new other
 * payer from `counters.billableParty` (the retired master's counter, so ids
 * never clash with BP0001 or Aria's BP0002).
 */
export function payerFromInput(
  input: PayerInput,
  counters: Record<string, number>,
): { payer: BookingPayer; counters: Record<string, number> } {
  const email = trimmed(input.email)
  const postalAddress = cleanPostalAddress(input.postalAddress)
  if (input.kind === 'patient') {
    return {
      payer: { kind: 'patient', ...(email !== undefined ? { email } : {}), ...(postalAddress !== undefined ? { postalAddress } : {}) },
      counters,
    }
  }
  let id = input.id
  let next = counters
  if (id === undefined) {
    const alloc = allocateId(counters, 'billableParty')
    id = alloc.id
    next = alloc.counters
  }
  const relationship = trimmed(input.relationship)
  const phone = trimmed(input.phone)
  return {
    payer: {
      kind: 'other',
      id,
      name: input.name.trim(),
      ...(relationship !== undefined ? { relationship } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(postalAddress !== undefined ? { postalAddress } : {}),
      ...(phone !== undefined ? { phone } : {}),
    },
    counters: next,
  }
}

/** The payer as History narrates it: "Grace Park (Patient)", "Hana Park (Mother)". */
export function payerAuditText(state: Pick<AppState, 'masters'>, payer: BookingPayer, patientId: string): string {
  if (payer.kind === 'patient') return `${state.masters.patients[patientId]?.name ?? 'The patient'} (Patient)`
  return payer.relationship !== undefined ? `${payer.name} (${payer.relationship})` : payer.name
}

/** The contact the Booking holds for its payer, for History: email, postal address and phone, or "None". */
export function payerContactAuditText(payer: BookingPayer): string {
  const parts = [payer.email, payer.postalAddress !== undefined ? formatPostalAddress(payer.postalAddress) : undefined, payer.kind === 'other' ? payer.phone : undefined]
  const held = parts.filter((p): p is string => p !== undefined && p !== '')
  return held.length > 0 ? held.join(' · ') : 'None'
}

/** A JSON key order independent comparison of two values (seeded and typed payers build keys in different orders). */
export function sameData(a: unknown, b: unknown): boolean {
  const stable = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(stable) : v !== null && typeof v === 'object' ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, stable((v as Record<string, unknown>)[k])])) : v
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b))
}

/** Names compared as a person would: case and spacing aside. */
function sameName(a: string, b: string): boolean {
  return a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Set the payer on a Booking (the one writer). Refuses a cancelled Booking,
 * edit rights per `editRefusal` (the anaesthetist on their own List, the
 * office until AUTHORISED), a blank other payer's name, a malformed email and
 * an incomplete postal address. Audited `booking.payer`.
 *
 * Editing the same other payer keeps their `BP####` id (and Xero contact); a
 * different name is a different person and gets a new id, so two debtors never
 * share one id. Once a prepayment invoice has been raised, the payer cannot
 * move to a different party (Phase 27 owns re-checking and cancelling it).
 */
export function setBookingPayer(api: AppStoreApi, actor: Actor, bookingId: string, input: PayerInput): Outcome {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found
  if (booking.cancellation !== undefined) return refuse('bookingCancelled', 'This Booking is cancelled.')
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  const refused = payerInputRefusal(input)
  if (refused !== null) return refused

  // The sheet passes the current other payer's id when it edits them; a new payer gets the next id.
  if (input.kind === 'other' && input.id !== undefined && (booking.payer.kind !== 'other' || booking.payer.id !== input.id)) {
    return refuse('payerIdUnknown', 'That payer is not on this Booking.')
  }
  // A different name is a different person: a new id, never the old one's Xero contact.
  const keepsId = input.kind === 'other' && input.id !== undefined && booking.payer.kind === 'other' && sameName(booking.payer.name, input.name)
  const resolved = payerFromInput(input.kind === 'other' && !keepsId ? { ...input, id: undefined } : input, state.counters)
  const next = resolved.payer
  if (sameData(next, booking.payer)) return ok(undefined)
  // A prepayment already invoiced to the current payer stays with them (US-06.3.5's re-check is Phase 27's).
  const before = payerCounterparty(booking)
  const after = payerCounterparty({ ...booking, payer: next })
  if ((before.kind !== after.kind || before.id !== after.id) && prePaymentInvoicesForBooking(state, bookingId).length > 0) {
    return refuse('prepaymentRaised', PAYER_LOCKED_BY_PREPAYMENT)
  }

  mutate(
    api,
    actor,
    {
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.payer',
      before: { payer: payerAuditText(state, booking.payer, booking.patientId), payerContact: payerContactAuditText(booking.payer) },
      after: { payer: payerAuditText(state, next, booking.patientId), payerContact: payerContactAuditText(next) },
    },
    (s) => ({
      counters: resolved.counters,
      schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [bookingId]: { ...booking, payer: next } } },
    }),
  )
  return ok(undefined)
}

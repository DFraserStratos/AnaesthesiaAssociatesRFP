/**
 * The payer on each Procedure: its one writer (catch-up Phase 21, moved onto
 * each Procedure by catch-up Phase 22a; US-11.2.2, US-11.2.3; DM-11; AR-44
 * `#payer`).
 *
 * `setProcedurePayer` is the only action that changes `Procedure.payer` after
 * creation. The "different payer" tick clear keeps the patient as the payer
 * (any email or postal address typed here fills only what the patient record
 * lacks, for this Booking); ticked names any party who pays: a parent, a
 * guardian, a benefactor or a family trust. The office and the anaesthetist
 * may change it until the List is AUTHORISED (`editRefusal`, as 38a left it;
 * v6 had only the admin team set it, unresolved). A payer with neither an
 * email nor a postal address is saved: the sheet asks and Review flags it
 * (`payerContactMissing`), never a block (our reading). Phase 27 hooks its
 * prepayment re-check here; Phase 25 locks it at AUTHORISED (already refused
 * by `editRefusal`).
 */

import type { PostalAddress, ProcedurePayer } from '../domain/types'
import { cleanPostalAddress, emailProblem, formatPostalAddress, isBlankPostalAddress, postalAddressProblem } from '../domain/billing/payer'
import { payerKey, payerOfferFor } from '../domain/billing/procedurePayer'
import { payerLockedByPrepayment, proceduresForBooking } from './selectors'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
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
export const PAYER_LOCKED_BY_PREPAYMENT = "A prepayment invoice has already been raised to this Procedure's payer, so its payer cannot change."


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
): { payer: ProcedurePayer; counters: Record<string, number> } {
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
export function payerAuditText(state: Pick<AppState, 'masters'>, payer: ProcedurePayer, patientId: string): string {
  if (payer.kind === 'patient') return `${state.masters.patients[patientId]?.name ?? 'The patient'} (Patient)`
  return payer.relationship !== undefined ? `${payer.name} (${payer.relationship})` : payer.name
}

/** The contact a Procedure holds for its payer, for History: email, postal address and phone, or "None". */
export function payerContactAuditText(payer: ProcedurePayer): string {
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

/** True when two payers are the same person: the same identity (`payerKey`), never a name or email. */
function sameIdentity(a: ProcedurePayer, b: ProcedurePayer, patientId: string): boolean {
  return payerKey(a, patientId) === payerKey(b, patientId)
}

/**
 * Set a Procedure's payer (the one writer; catch-up Phase 22a, US-11.2.2,
 * replacing 21's `setProcedurePayer`). Refuses a cancelled Booking, edit rights
 * per `editRefusal` (the anaesthetist on their own List, the office until
 * AUTHORISED), a blank other payer's name, a malformed email and an
 * incomplete postal address. Audited per Procedure (`procedure.payer`).
 *
 * - Identity, never matching: editing the same other payer keeps their
 *   `BP####` id (and Xero contact); a different name is a different person
 *   and gets a new id, so two debtors never share one id.
 * - The same person's contact edited (the same id, or the patient's typed
 *   fill-ins) updates every Procedure on the Booking holding that identity,
 *   with no offer: one record per payer on a Booking.
 * - A change of payer applies to this Procedure and to each of `alsoApplyTo`,
 *   which must all be in the offer (`payerOfferFor`: the Booking's other
 *   Procedures holding the same payer, not billed to their holder); the
 *   Procedures left out keep their payer.
 * - Per payer lock (US-06.3.1 "Payer locked"; 27 keeps it through the
 *   approval lifecycle): a Procedure covered by its payer's raised prepayment
 *   invoice cannot change payer; another payer's Procedures still can.
 *
 * PROVISIONAL (OQ-140, D85): a payer on each Procedure, the change offered to
 * the others, each ticked by default and never forced. Going back to one
 * payer per Booking is `alsoApplyTo` always being every Procedure on the
 * Booking; nothing else changes.
 */
export function setProcedurePayer(
  api: AppStoreApi,
  actor: Actor,
  procedureId: string,
  input: PayerInput,
  alsoApplyTo: readonly string[] = [],
): Outcome {
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return refuse('notFound', 'Procedure not found.')
  const found = getBooking(state, procedure.bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found
  if (booking.cancellation !== undefined) return refuse('bookingCancelled', 'This Booking is cancelled.')
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  const refused = payerInputRefusal(input)
  if (refused !== null) return refused

  const current = procedure.payer
  // The sheet passes the current other payer's id when it edits them; a new payer gets the next id.
  if (input.kind === 'other' && input.id !== undefined && (current.kind !== 'other' || current.id !== input.id)) {
    return refuse('payerIdUnknown', "That payer is not this Procedure's payer.")
  }
  // A different name is a different person: a new id, never the old one's Xero contact.
  const keepsId = input.kind === 'other' && input.id !== undefined && current.kind === 'other' && sameName(current.name, input.name)
  const resolved = payerFromInput(input.kind === 'other' && !keepsId ? { ...input, id: undefined } : input, state.counters)
  const procedures = proceduresForBooking(state, booking.id)
  const changesPayer = !sameIdentity(resolved.payer, current, booking.patientId)
  // Back to the patient with nothing typed: the patient's record as the Booking already holds it (one record per payer).
  const heldPatient = procedures.find((p) => p.id !== procedureId && p.payer.kind === 'patient')?.payer
  const typedNothing = input.kind === 'patient' && resolved.payer.kind === 'patient' && resolved.payer.email === undefined && resolved.payer.postalAddress === undefined
  const next = changesPayer && typedNothing && heldPatient !== undefined ? heldPatient : resolved.payer
  if (sameData(next, current)) return ok(undefined)
  const targets = new Set<string>()
  if (changesPayer) {
    const offered = new Set(payerOfferFor(procedures, procedureId, state.masters.contracts, booking.patientId).map((p) => p.id))
    for (const id of alsoApplyTo) {
      if (!offered.has(id)) return refuse('notOffered', 'That procedure does not have the same payer, so the change cannot apply to it.')
    }
    for (const id of [procedureId, ...alsoApplyTo]) {
      if (payerLockedByPrepayment(state, id)) return refuse('prepaymentRaised', PAYER_LOCKED_BY_PREPAYMENT)
      targets.add(id)
    }
  }
  // One record per payer on a Booking: every Procedure already holding the new payer takes the same details.
  for (const p of procedures) if (sameIdentity(p.payer, next, booking.patientId)) targets.add(p.id)

  const written = procedures.filter((p) => targets.has(p.id) && !sameData(p.payer, next))
  const metas: MutationMeta[] = written.map((p) => ({
    entityType: 'procedure',
    entityId: p.id,
    action: 'procedure.payer',
    before: { payer: payerAuditText(state, p.payer, booking.patientId), payerContact: payerContactAuditText(p.payer) },
    after: { payer: payerAuditText(state, next, booking.patientId), payerContact: payerContactAuditText(next) },
  }))
  mutate(api, actor, metas, (s) => {
    const updated = { ...s.schedule.procedures }
    for (const p of written) updated[p.id] = { ...p, payer: next }
    return { counters: resolved.counters, schedule: { ...s.schedule, procedures: updated } }
  })
  return ok(undefined)
}

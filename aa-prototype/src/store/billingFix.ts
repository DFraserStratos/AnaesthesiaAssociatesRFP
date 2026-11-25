/**
 * The Billing tab's fixes for a failed Booking (Phase 60; US-13.3.1,
 * US-13.3.2, D116): Retry (with the Xero hand-off the monitor always did),
 * Fix the payer then retry, and Mark resolved by hand.
 *
 * Each step is its own audited write through `mutate()` or an existing
 * action: Fix the payer edits whoever is billed (the holder Party through
 * `editParty`, the patient through `editPatient`, another payer's contact on
 * its Procedures here), then retries; a refused edit is returned unchanged and
 * nothing is retried; a refused retry leaves the edit in place. Mark resolved
 * stamps who and why on the exception and raises nothing, so it carries no
 * pair ids. Office only throughout. Nothing here is a lifecycle guard.
 */

import type { BillingException, DeliveryMethod, Party, PostalAddress, Procedure } from '../domain/types'
import { invoiceDeliveryFor, otherPayerHeld, partyForCounterparty } from '../domain/billing/whoIsBilled'
import { ADDRESS_LINE_PROBLEM, cleanPostalAddress, emailProblem, formatPostalAddress, isBlankPostalAddress, postalAddressProblem } from '../domain/billing/payer'
import type { LockedParty } from '../domain/billing/lock'
import { clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { retryBillingException, type BillingRunResult } from './billingRun'
import { handoffPairsForBooking } from './xeroHandoff'
import { editParty } from './partyActions'
import { editPatient } from './intake'
import { payerLockedByPrepayment, proceduresForBooking } from './selectors'

/** What a retry returns: the invoices raised and the ledger pairs made with them. */
export type BillingRetryValue = BillingRunResult & { pairIds: string[] }

/** Who is billed for a failed Booking, as the Fix the payer sheet edits them. */
export type PayerFixTarget =
  | { kind: 'party'; partyId: string; name: string; email?: string; postalAddress?: string; deliveryMethod?: DeliveryMethod }
  | { kind: 'patient'; patientId: string; name: string; email?: string; postalAddress?: PostalAddress }
  | { kind: 'payer'; payerId: string; procedureIds: string[]; name: string; email?: string; postalAddress?: PostalAddress; locked: boolean }

/** What the office types: a holder Party's address is one line of text, a person's is in NZ Post parts. */
export interface PayerFixInput {
  email: string
  postalAddress?: string | Partial<PostalAddress>
}

const OFFICE_ONLY = 'Only the office can fix a billing failure.'

/** The exception, or the refusal every action here shares (office only, not found, already resolved). */
function openException(state: Pick<AppState, 'billing'>, actor: Actor, exceptionId: string): Outcome<BillingException> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const exception = state.billing.exceptions[exceptionId]
  if (exception === undefined) return refuse('notFound', 'Billing failure not found.')
  if (exception.resolvedAtISO !== undefined) return refuse('alreadyResolved', 'This billing failure is already resolved.')
  return ok(exception)
}

/**
 * Retry a failed Booking (the Billing tab's Retry, and the second step of Fix
 * the payer): `retryBillingException`, then, when it raised the invoices, each
 * new pair is handed off to Xero as the Billing monitor's Retry always did.
 * Returns the retry's outcome unchanged.
 */
export function retryBillingFailure(api: AppStoreApi, actor: Actor, exceptionId: string): Outcome<BillingRetryValue> {
  const bookingId = api.getState().billing.exceptions[exceptionId]?.bookingId
  const outcome = retryBillingException(api, actor, exceptionId)
  if (outcome.ok && bookingId !== undefined) handoffPairsForBooking(api, bookingId)
  return outcome
}

/**
 * Mark a billing failure resolved by hand (US-13.3.2): the office says why in
 * a short note. Stamps `resolvedAtISO`, `resolvedBy` and `resolvedNote`, never
 * `resolvedPairIds` (nothing was raised). Audited `billing.exceptionResolvedByHand`.
 */
export function markBillingExceptionResolved(api: AppStoreApi, actor: Actor, exceptionId: string, note: string): Outcome {
  const found = openException(api.getState(), actor, exceptionId)
  if (!found.ok) return found
  const resolvedNote = note.trim()
  if (resolvedNote === '') return refuse('noteRequired', 'Say why it is resolved.')
  const exception = found.value
  mutate(
    api,
    actor,
    {
      entityType: 'billingException',
      entityId: exceptionId,
      action: 'billing.exceptionResolvedByHand',
      after: { bookingId: exception.bookingId, code: exception.code, resolvedBy: actor.who, resolvedNote },
      stampBookingId: null,
    },
    (s) => {
      const atISO = clockISO(s.clock)
      const current = s.billing.exceptions[exceptionId] ?? exception
      const resolved: BillingException = { ...current, resolvedAtISO: atISO, resolvedBy: actor.who, resolvedNote }
      return { billing: { ...s.billing, exceptions: { ...s.billing.exceptions, [exceptionId]: resolved } } }
    },
  )
  return ok(undefined)
}

/** The Procedures of the lock a locked party's invoice bills. */
function lockedPartyProcedures(state: Pick<AppState, 'schedule'>, lock: { procedures: readonly { procedureId: string; charges: readonly { partyKey: string }[] }[] }, party: LockedParty): Procedure[] {
  return lock.procedures.flatMap((p) => {
    if (!p.charges.some((c) => c.partyKey === party.key)) return []
    const live = state.schedule.procedures[p.procedureId]
    return live !== undefined ? [live] : []
  })
}

/**
 * Who is billed for the failed Booking, as Fix the payer edits them: of the
 * Booking's locked parties, the one with nowhere to be sent to now (no billing
 * email or postal address, read live), else the first. A holder Party, the
 * patient, or another payer with the Booking's Procedures that hold them (and
 * whether a raised prepayment locks that payer). Undefined with no lock, no
 * party, or a party that no longer exists.
 */
export function payerFixTarget(state: Pick<AppState, 'schedule' | 'masters' | 'billing'>, exceptionId: string): PayerFixTarget | undefined {
  const exception = state.billing.exceptions[exceptionId]
  if (exception === undefined) return undefined
  const booking = state.schedule.bookings[exception.bookingId]
  const lock = state.billing.locks[exception.bookingId]
  if (booking === undefined || lock === undefined || lock.parties.length === 0) return undefined
  const patient = state.masters.patients[booking.patientId]
  const party =
    lock.parties.find((p) => invoiceDeliveryFor(p.ref, lockedPartyProcedures(state, lock, p), booking.patientId, patient, state.masters.parties).method === 'none') ??
    lock.parties[0]!
  const ref = party.ref

  if (ref.kind === 'patient') {
    if (patient === undefined) return undefined
    return {
      kind: 'patient',
      patientId: booking.patientId,
      name: patient.name,
      ...(patient.email !== undefined ? { email: patient.email } : {}),
      ...(patient.postalAddress !== undefined ? { postalAddress: patient.postalAddress } : {}),
    }
  }
  if (ref.kind === 'payer') {
    const procedures = proceduresForBooking(state, booking.id).filter((p) => holdsPayer(p, ref.id))
    const held = otherPayerHeld(procedures, ref.id)
    if (held === undefined) return undefined
    const procedureIds = procedures.map((p) => p.id)
    return {
      kind: 'payer',
      payerId: ref.id,
      procedureIds,
      name: held.name,
      ...(held.email !== undefined ? { email: held.email } : {}),
      ...(held.postalAddress !== undefined ? { postalAddress: held.postalAddress } : {}),
      locked: procedureIds.some((id) => payerLockedByPrepayment(state, id)),
    }
  }
  const holder = partyForCounterparty(ref, state.masters.parties)
  if (holder === undefined) return undefined
  return {
    kind: 'party',
    partyId: holder.id,
    name: holder.name,
    ...(holder.email !== undefined ? { email: holder.email } : {}),
    ...(holder.postalAddress !== undefined ? { postalAddress: holder.postalAddress } : {}),
    ...(holder.deliveryMethod !== undefined ? { deliveryMethod: holder.deliveryMethod } : {}),
  }
}

/** True when the Procedure holds this other payer: as its payer, or as a split share's person. */
function holdsPayer(procedure: Pick<Procedure, 'payer' | 'split'>, payerId: string): boolean {
  if (procedure.payer.kind === 'other' && procedure.payer.id === payerId) return true
  return procedure.split?.shares.some((s) => s.person?.id === payerId) ?? false
}

/** A holder Party's address typed in parts, as its one line of text. */
function partyAddressText(address: PayerFixInput['postalAddress']): string {
  if (address === undefined) return ''
  if (typeof address === 'string') return address.trim()
  const cleaned = cleanPostalAddress(address)
  return cleaned !== undefined ? formatPostalAddress(cleaned) : ''
}

/** The Party's current fields, as `editParty` takes them (every field each call). */
function partyFieldsOf(party: Party & { kind: Exclude<Party['kind'], 'aa'> }) {
  return {
    kind: party.kind,
    name: party.name,
    codePrefix: party.codePrefix,
    ...(party.billingName !== undefined ? { billingName: party.billingName } : {}),
    ...(party.email !== undefined ? { email: party.email } : {}),
    ...(party.postalAddress !== undefined ? { postalAddress: party.postalAddress } : {}),
    ...(party.deliveryMethod !== undefined ? { deliveryMethod: party.deliveryMethod } : {}),
    ...(party.hospitalId !== undefined ? { hospitalId: party.hospitalId } : {}),
  }
}

/**
 * Fix the payer, then retry (US-13.3.2, D116): edit the billing email and
 * postal address of whoever is billed for the failed Booking through the
 * existing edit (`editParty` for a holder Party, sending by email when one is
 * given else by post; `editPatient` for the patient; another payer's contact
 * on the Procedures that hold them, refused while a raised prepayment locks
 * that payer), then `retryBillingFailure`. Needs an email or a postal
 * address. A refused edit is returned unchanged and nothing is retried; a
 * refused retry leaves the edit in place and is returned.
 */
export function fixBookingPayer(api: AppStoreApi, actor: Actor, exceptionId: string, input: PayerFixInput): Outcome<BillingRetryValue> {
  const state = api.getState()
  const found = openException(state, actor, exceptionId)
  if (!found.ok) return found
  const target = payerFixTarget(state, exceptionId)
  if (target === undefined) return refuse('noPayer', 'This Booking has no payer to fix. Mark it resolved instead.')

  const email = input.email.trim()
  const badEmail = emailProblem(email)
  if (badEmail !== null) return refuse('emailInvalid', badEmail)

  if (target.kind === 'party') {
    const address = partyAddressText(input.postalAddress)
    if (email === '' && address === '') return refuse('contactRequired', CONTACT_REQUIRED)
    const party = state.masters.parties[target.partyId]
    if (party === undefined) return refuse('notFound', 'Party not found.')
    if (party.kind === 'aa') return refuse('aaReadOnly', 'The Anaesthesia Associates Party cannot be changed.')
    const edited = editParty(api, actor, party.id, {
      ...partyFieldsOf({ ...party, kind: party.kind }),
      email,
      postalAddress: address,
      deliveryMethod: email !== '' ? 'email' : 'post',
    })
    if (!edited.ok) return edited
    return retryBillingFailure(api, actor, exceptionId)
  }

  // A person's address is in NZ Post parts.
  if (typeof input.postalAddress === 'string' && input.postalAddress.trim() !== '') return refuse('postalAddressInvalid', ADDRESS_LINE_PROBLEM)
  const parts = typeof input.postalAddress === 'object' ? input.postalAddress : undefined
  const blankAddress = isBlankPostalAddress(parts)
  if (email === '' && blankAddress) return refuse('contactRequired', CONTACT_REQUIRED)
  if (!blankAddress) {
    const badAddress = postalAddressProblem(parts)
    if (badAddress !== null) return refuse('postalAddressInvalid', badAddress)
  }
  const postalAddress = cleanPostalAddress(parts)

  if (target.kind === 'patient') {
    // No `viaBookingId`: the Booking is authorised, so this is the office's record edit.
    const edited = editPatient(api, actor, target.patientId, { email, ...(postalAddress !== undefined ? { postalAddress } : {}) })
    if (!edited.ok) return edited
    return retryBillingFailure(api, actor, exceptionId)
  }

  if (target.locked) {
    return refuse('payerLocked', 'A prepayment has been raised to this payer, so their details are locked. Mark the failure resolved instead.')
  }
  const written = setPayerContact(api, actor, target, email, postalAddress)
  if (!written.ok) return written
  return retryBillingFailure(api, actor, exceptionId)
}

const CONTACT_REQUIRED = 'Enter a billing email or a postal address.'

/**
 * Write another payer's email and postal address on every Procedure of the
 * Booking that holds them (as its payer or a split share's person), in one
 * `mutate`; identity (id, name) unchanged. Audited `procedure.payerContact`,
 * one entry per Procedure. Blank fields are cleared.
 */
function setPayerContact(
  api: AppStoreApi,
  actor: Actor,
  target: Extract<PayerFixTarget, { kind: 'payer' }>,
  email: string,
  postalAddress: PostalAddress | undefined,
): Outcome {
  const state = api.getState()
  const withContact = <P extends { email?: string; postalAddress?: PostalAddress }>(payer: P): P => {
    const { email: _e, postalAddress: _a, ...rest } = payer
    return { ...rest, ...(email !== '' ? { email } : {}), ...(postalAddress !== undefined ? { postalAddress } : {}) } as P
  }
  const text = (p: { email?: string; postalAddress?: PostalAddress }) => ({
    email: p.email ?? '',
    postalAddress: p.postalAddress !== undefined ? formatPostalAddress(p.postalAddress) : '',
  })
  const updated: Record<string, Procedure> = {}
  const metas: MutationMeta[] = []
  for (const id of target.procedureIds) {
    const procedure = state.schedule.procedures[id]
    if (procedure === undefined) continue
    const before = otherPayerHeld([procedure], target.payerId)
    const next: Procedure = {
      ...procedure,
      ...(procedure.payer.kind === 'other' && procedure.payer.id === target.payerId ? { payer: withContact(procedure.payer) } : {}),
      ...(procedure.split !== undefined
        ? { split: { ...procedure.split, shares: procedure.split.shares.map((s) => (s.person?.id === target.payerId ? { ...s, person: withContact(s.person) } : s)) } }
        : {}),
    }
    updated[id] = next
    metas.push({
      entityType: 'procedure',
      entityId: id,
      action: 'procedure.payerContact',
      before: { payerId: target.payerId, ...(before !== undefined ? text(before) : {}) },
      after: { payerId: target.payerId, ...text({ ...(email !== '' ? { email } : {}), ...(postalAddress !== undefined ? { postalAddress } : {}) }) },
      stampBookingId: null,
    })
  }
  if (metas.length === 0) return refuse('noPayer', 'This payer is no longer on the Booking.')
  mutate(api, actor, metas, (s) => ({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, ...updated } } }))
  return ok(undefined)
}

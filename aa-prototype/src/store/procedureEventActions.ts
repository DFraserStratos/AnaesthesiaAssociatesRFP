/**
 * Events on a Procedure (catch-up Phase 38b; DM-17, DM-18, D13, US-08.6.3,
 * US-03.7.3): one store action per step (add, update, remove, approve,
 * decline) and the next billing run for events (`runEventInvoicing`), plus the
 * derived selectors. The rules live in `domain/billing/procedureEvent.ts`; the
 * free-form pricing in `domain/billing/additionalInvoice.ts`; every word that
 * names an event in `shared/procedureEventCopy.ts`.
 *
 * A credit (catch-up Phase 39, `creditActions.ts`) is an event too: its
 * replacements are ordinary additional-invoice events with `replaces`, and the
 * credit and its replacements are reviewed, edited, removed and issued as one
 * unit. The review actions here hand a credit to `creditActions.ts`.
 *
 * Immutability (US-07.3.2): no action here writes the Booking, its
 * Procedures, its lock or the original invoice. An event write stamps no
 * Booking (`stampBookingId: null`), so an invoiced Booking deep-equals before
 * and after. Every back-link (an original's additional invoices) is derived.
 */

import type {
  CounterpartyRef,
  EventParty,
  FreeFormLine,
  Invoice,
  InvoiceId,
  ProcedureEvent,
  ProcedureEventKind,
} from '../domain/types'
import {
  EVENT_KINDS,
  eventInvoicing,
  eventLines,
  eventStatus,
  mayEditEvent,
  resolveEventParty,
  validateEventBase,
  type EventActor,
  type EventRefusal,
  type ResolvedEventParty,
} from '../domain/billing/procedureEvent'
import { priceFreeFormInvoice, type FreeFormPricing } from '../domain/billing/additionalInvoice'
import { billablePartyForProcedure, billedToFor, invoiceDeliveryFor, isPersonParty, type DeliveryPlan } from '../domain/billing/whoIsBilled'
import { supplierFor } from '../domain/billing/invoicePresentation'
import { postalAddressLines } from '../domain/billing/payer'
import type { DraftInvoice, LockedPayee } from '../domain/billing/lock'
import { CREDIT_MESSAGES, EVENT_MESSAGES } from '../shared/procedureEventCopy'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { materialiseInvoices } from './invoiceMaterialise'
import { handoffCorrection, handoffPair } from './xeroHandoff'
import { counterpartyName, invoiceAddresseeName } from './selectors'
import { payerFromInput, payerInputRefusal, type PayerInput } from './payerActions'
import {
  approveCreditUnit,
  creditNoteForInvoice,
  declineCreditUnit,
  issueCreditInto,
  planCreditIssue,
  removeCreditUnit,
  replacementsOf,
  updateCreditPart,
  type CreditRunDraft,
} from './creditActions'

type EventState = Pick<AppState, 'schedule' | 'billing' | 'masters'>

// ---------------------------------------------------------------------------
// Selectors (derived, never stored)
// ---------------------------------------------------------------------------

/**
 * Whose Procedure this is (US-08.6.3 "their own Procedure", our reading): the
 * anaesthetist the Procedure's payable goes to, 25's locked payee; for a
 * Booking with no lock, the List's anaesthetist. The ownership rule lives
 * here, in `mayRaise` and in `mayEditEvent` only.
 */
export function procedureOwner(state: Pick<AppState, 'schedule' | 'billing'>, procedureId: string): string | undefined {
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return undefined
  const lock = state.billing.locks[procedure.bookingId]
  if (lock !== undefined) return lock.payee.anaesthetistId
  const booking = state.schedule.bookings[procedure.bookingId]
  return booking !== undefined ? state.schedule.lists[booking.listId]?.anaesthetistId : undefined
}

function byNumber(a: Invoice, b: Invoice): number {
  return a.invoiceNumber.localeCompare(b.invoiceNumber)
}

function sameRef(a: CounterpartyRef, b: CounterpartyRef): boolean {
  return a.kind === b.kind && a.id === b.id
}

/**
 * The invoice an additional invoice relates to: the run's invoice whose
 * `procedureIds` include the Procedure (where 22's split put it on two, the
 * one for `party`, else the first by number), else its prepayment invoice
 * when that is its only one (a prepaid Procedure 27 priced at the prepaid
 * amount, nothing left to bill). Never a plain additional invoice.
 *
 * A credited invoice (catch-up Phase 39) is skipped for its live replacements
 * on this Procedure, by number (a chain followed to its end), so a later
 * additional invoice on a credited Procedure still finds its original; with
 * no live replacement (a credit with none) there is none, and 38b's own
 * refusal applies.
 */
export function liveInvoiceForProcedure(state: Pick<AppState, 'billing'>, procedureId: string, party?: CounterpartyRef): Invoice | undefined {
  const all = Object.values(state.billing.invoices).filter((i) => (i.procedureIds ?? []).includes(procedureId))
  const standard = all.filter((i) => i.kind === 'standard').sort(byNumber)
  if (standard.length > 0) {
    const seen = new Set<string>()
    const liveOf = (inv: Invoice): Invoice[] => {
      if (seen.has(inv.id)) return []
      seen.add(inv.id)
      if (creditNoteForInvoice(state, inv.id) === undefined) return [inv]
      return replacementsOf(state, inv.id)
        .filter((r) => (r.procedureIds ?? []).includes(procedureId))
        .flatMap(liveOf)
    }
    const live = standard.flatMap(liveOf)
    if (party !== undefined) {
      const forParty = live.find((i) => sameRef(i.counterparty, party))
      if (forParty !== undefined) return forParty
    }
    return live[0]
  }
  const prepaid = all.filter((i) => i.kind === 'prePayment').sort(byNumber)
  return prepaid[0]
}

function eventOrder(a: ProcedureEvent, b: ProcedureEvent): number {
  return a.occurredOnISO === b.occurredOnISO ? a.id.localeCompare(b.id) : a.occurredOnISO.localeCompare(b.occurredOnISO)
}

/** A Procedure's events, date then id. */
export function eventsForProcedure(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }, procedureId: string): ProcedureEvent[] {
  return Object.values(state.schedule.procedureEvents).filter((e) => e.procedureId === procedureId).sort(eventOrder)
}

/** A Booking's events, date then id. */
export function eventsForBooking(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }, bookingId: string): ProcedureEvent[] {
  return Object.values(state.schedule.procedureEvents).filter((e) => e.bookingId === bookingId).sort(eventOrder)
}

/** Events awaiting the office's review, oldest raised first. */
export function eventsAwaitingReview(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }): ProcedureEvent[] {
  return Object.values(state.schedule.procedureEvents)
    .filter((e) => eventStatus(e) === 'awaitingReview')
    .sort((a, b) => (a.addedAtISO === b.addedAtISO ? a.id.localeCompare(b.id) : a.addedAtISO.localeCompare(b.addedAtISO)))
}

/** Approved, invoice-ticked events the next billing run will invoice, id order. */
export function approvedEventsAwaitingRun(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }): ProcedureEvent[] {
  return Object.values(state.schedule.procedureEvents)
    .filter((e) => eventStatus(e) === 'approved')
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** The additional invoices raised against an original invoice (derived from their `additionalTo` lineage), by number. */
export function additionalInvoicesFor(state: Pick<AppState, 'billing'>, invoiceId: string): Invoice[] {
  return Object.values(state.billing.invoices)
    .filter((i) => i.kind === 'additional' && (i.lineage ?? []).some((l) => l.role === 'additionalTo' && l.invoiceId === invoiceId))
    .sort(byNumber)
}

/** A Procedure's additional invoices, by number. */
export function additionalInvoicesForProcedure(state: Pick<AppState, 'billing'>, procedureId: string): Invoice[] {
  return Object.values(state.billing.invoices)
    .filter((i) => i.kind === 'additional' && (i.procedureIds ?? []).includes(procedureId))
    .sort(byNumber)
}

/** The original an additional invoice relates to. */
export function originalInvoiceFor(state: Pick<AppState, 'billing'>, invoiceId: string): Invoice | undefined {
  const link = state.billing.invoices[invoiceId]?.lineage?.find((l) => l.role === 'additionalTo')
  return link !== undefined ? state.billing.invoices[link.invoiceId] : undefined
}

/** The event an invoice was raised from. */
export function eventForInvoice(state: Pick<AppState, 'schedule' | 'billing'>, invoiceId: string): ProcedureEvent | undefined {
  const eventId = state.billing.invoices[invoiceId]?.eventId
  return eventId !== undefined ? state.schedule.procedureEvents[eventId] : undefined
}

/** The Procedure's own billable party (21's rule; 22a's payer where its Contract bills the payer, else the holder Party). */
function procedurePartyOf(state: EventState, procedureId: string): CounterpartyRef | undefined {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  if (procedure === undefined || booking === undefined) return undefined
  const contract = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
  return billablePartyForProcedure(contract, procedure, booking.patientId, state.masters.parties)
}

/** An event's party, resolved against its Procedure's original invoice (`resolveEventParty`). */
export function resolvedPartyOf(state: EventState, event: Pick<ProcedureEvent, 'party' | 'procedureId'>): ResolvedEventParty | undefined {
  const named = event.party.sameAs ? undefined : event.party.party
  const original = liveInvoiceForProcedure(state, event.procedureId, named)
  const procedureParty = procedurePartyOf(state, event.procedureId)
  return resolveEventParty(event, {
    ...(original !== undefined ? { originalInvoice: original } : {}),
    ...(procedureParty !== undefined ? { procedureParty } : {}),
  })
}

/** The name an event bills, one way everywhere: its invoice's addressee once invoiced, else the resolved party's. */
export function eventPartyName(state: EventState, event: ProcedureEvent): string | undefined {
  if (event.invoiceId !== undefined) {
    const inv = state.billing.invoices[event.invoiceId]
    if (inv !== undefined) return invoiceAddresseeName(state, inv)
  }
  const resolved = resolvedPartyOf(state, event)
  return resolved !== undefined ? (resolved.billedTo?.name ?? counterpartyName(state, resolved.counterparty, event.bookingId)) : undefined
}

/** The original invoice an event relates to (the one for its named party where a split put the Procedure on two). */
export function originalForEvent(state: Pick<AppState, 'billing'>, event: Pick<ProcedureEvent, 'party' | 'procedureId'>): Invoice | undefined {
  return liveInvoiceForProcedure(state, event.procedureId, event.party.sameAs ? undefined : event.party.party)
}

/** The priced lines of an event (an additional invoice's free-form lines; a credit has none and refuses `noLines`). */
export function pricingOf(event: Pick<ProcedureEvent, 'detail'>): FreeFormPricing {
  return priceFreeFormInvoice(eventLines(event))
}

/**
 * Where the invoice to a named party would go: a typed invoice email, a named
 * person's own contact, else 21's one delivery rule for that party.
 */
export function namedPartyDelivery(state: EventState, procedureId: string, party: EventParty): DeliveryPlan | undefined {
  if (party.sameAs) return undefined
  const email = party.invoiceEmail?.trim()
  if (email !== undefined && email !== '') return { method: 'email', to: email }
  if (party.person !== undefined) {
    const personEmail = party.person.email?.trim()
    if (personEmail !== undefined && personEmail !== '') return { method: 'email', to: personEmail }
    if (party.person.postalAddress !== undefined) return { method: 'post', lines: postalAddressLines(party.person.postalAddress) }
    return { method: 'none' }
  }
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  if (procedure === undefined || booking === undefined) return { method: 'none' }
  return invoiceDeliveryFor(party.party, [procedure], booking.patientId, state.masters.patients[booking.patientId], state.masters.parties)
}

/** What raising an event of `kind` on this Procedure would refuse for state reasons (the button's disabled sentence), or null. */
export function raiseRefusal(state: EventState & Pick<AppState, 'clock'>, actor: EventActor, procedureId: string, kind: ProcedureEventKind = 'additionalInvoice'): EventRefusal | null {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (procedure === undefined || booking === undefined || list === undefined) return { code: 'notFound', message: 'Procedure not found.' }
  if (booking.cancellation !== undefined) return { code: 'bookingCancelled', message: 'This Booking is cancelled.' }
  const invoiced = list.state === 'AUTHORISED' && liveInvoiceForProcedure(state, procedureId) !== undefined
  return validateEventBase(
    { occurredOnISO: list.dateISO, party: { sameAs: true } },
    kind,
    actor,
    { ownerAnaesthetistId: procedureOwner(state, procedureId), listDateISO: list.dateISO, todayISO: state.clock.todayISO, procedureInvoiced: invoiced },
  )
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * An event's party as a form hands it in: "same as", a picked party, or
 * "Another person" as typed (22a's form parts), who gets a `BP####` id from
 * the payer counter when saved, as a split share's person does.
 */
export type EventPartyInput = EventParty | { sameAs: false; personInput: Extract<PayerInput, { kind: 'other' }>; invoiceEmail?: string }

export interface ProcedureEventInput {
  kind: ProcedureEventKind
  occurredOnISO: string
  party: EventPartyInput
  lines: FreeFormLine[]
  /** The invoice tick, for a kind that shows it (39b); ignored when the kind fixes it on. */
  billable?: boolean
}

/** The stored party for an input, allocating a new person's id (refusal when the person is not valid). */
export function partyFromInput(input: EventPartyInput, counters: Record<string, number>): Outcome<{ party: EventParty; counters: Record<string, number> }> {
  if (!('personInput' in input)) return ok({ party: structuredClone(input), counters })
  const bad = payerInputRefusal(input.personInput)
  if (bad !== null) return bad
  const made = payerFromInput(input.personInput, counters)
  if (made.payer.kind !== 'other') return refuse('partyMissing', 'Pick who to bill.')
  const email = input.invoiceEmail?.trim()
  return ok({
    party: { sameAs: false, party: { kind: 'payer', id: made.payer.id }, person: made.payer, ...(email !== undefined && email !== '' ? { invoiceEmail: email } : {}) },
    counters: made.counters,
  })
}

export function eventActor(actor: Actor): EventActor {
  return { role: actor.role, ...(actor.anaesthetistId !== undefined ? { anaesthetistId: actor.anaesthetistId } : {}) }
}

/** Validate an event's input for this raiser: items 2 and 3. Refusal or the pricing. */
export function validateInput(
  state: EventState & Pick<AppState, 'clock'>,
  raiser: EventActor,
  procedureId: string,
  input: { kind: ProcedureEventKind; occurredOnISO: string; party: EventParty; lines: readonly FreeFormLine[] },
): Outcome<FreeFormPricing & { kind: 'priced' }> {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (procedure === undefined || booking === undefined || list === undefined) return refuse('notFound', 'Procedure not found.')
  if (booking.cancellation !== undefined) return refuse('bookingCancelled', 'This Booking is cancelled.')
  const invoiced = list.state === 'AUTHORISED' && liveInvoiceForProcedure(state, procedureId) !== undefined
  const delivery = namedPartyDelivery(state, procedureId, input.party)
  const base = validateEventBase(input, input.kind, raiser, {
    ownerAnaesthetistId: procedureOwner(state, procedureId),
    listDateISO: list.dateISO,
    todayISO: state.clock.todayISO,
    procedureInvoiced: invoiced,
    ...(delivery !== undefined ? { namedPartyDelivery: delivery } : {}),
  })
  if (base !== null) return refuse(base.code, base.message, { field: base.field })
  const priced = priceFreeFormInvoice(input.lines)
  if (priced.kind === 'refused') return refuse(priced.code, priced.message, { lineIndex: priced.lineIndex, field: priced.field })
  return ok(priced)
}

export function cleanLines(lines: readonly FreeFormLine[]): FreeFormLine[] {
  return lines.map((l) => ({ description: l.description.trim(), quantity: l.quantity, unitAmount: l.unitAmount }))
}

export function partyForAudit(party: EventParty): unknown {
  return party.sameAs ? 'sameAs' : { kind: party.party.kind, id: party.party.id, ...(party.person !== undefined ? { person: party.person.name } : {}) }
}

/**
 * Raise an event on a Procedure (US-08.6.3 "Button"): the office on any
 * invoiced Procedure, the anaesthetist on their own. One `mutate()`; the
 * event awaits the office's review (D13). Raises nothing: the next billing run does.
 */
export function addProcedureEvent(api: AppStoreApi, actor: Actor, procedureId: string, input: ProcedureEventInput): Outcome<{ eventId: string }> {
  // A credit is raised with its replacements in one step (`submitCredit`), never as a bare event.
  if (input.kind !== 'additionalInvoice') return refuse('kindNotAllowed', 'Raise a credit with the credit note option.')
  const state = api.getState()
  const raiser = eventActor(actor)
  const madeParty = partyFromInput(input.party, state.counters)
  if (!madeParty.ok) return madeParty
  const valid = validateInput(state, raiser, procedureId, { ...input, party: madeParty.value.party })
  if (!valid.ok) return valid
  const procedure = state.schedule.procedures[procedureId]!
  const rules = EVENT_KINDS[input.kind]
  // The invoice tick: fixed on for an additional invoice; shown on the form for 39b's kinds.
  const billable = rules.tick === 'fixedOn' ? true : (input.billable ?? true)
  let eventId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const id = allocateId(madeParty.value.counters, 'procedureEvent')
    eventId = id.id
    const atISO = clockISO(s.clock)
    const event: ProcedureEvent = {
      id: id.id,
      procedureId,
      bookingId: procedure.bookingId,
      kind: input.kind,
      occurredOnISO: input.occurredOnISO,
      billable,
      party: madeParty.value.party,
      detail: { kind: 'additionalInvoice', lines: cleanLines(input.lines) },
      review: { state: billable && rules.reviewed ? 'awaitingReview' : 'approved' },
      addedBy: { who: actor.who, role: actor.role, ...(actor.role === 'anaesthetist' && actor.anaesthetistId !== undefined ? { anaesthetistId: actor.anaesthetistId } : {}) },
      addedAtISO: atISO,
    }
    metas.push({
      entityType: 'procedureEvent',
      entityId: id.id,
      action: 'procedureEvent.add',
      after: {
        kind: event.kind,
        procedureId,
        bookingId: event.bookingId,
        occurredOnISO: event.occurredOnISO,
        party: partyForAudit(event.party),
        lines: eventLines(event),
        subtotal: valid.value.subtotal,
        gst: valid.value.gst,
        total: valid.value.total,
        eventRaisedBy: actor.who,
      },
      stampBookingId: null,
    })
    return { schedule: { ...s.schedule, procedureEvents: { ...s.schedule.procedureEvents, [id.id]: event } }, counters: id.counters }
  })
  return ok({ eventId })
}

/** The guard an edit or removal shares: found, editable by this actor. */
export function editGuard(state: Pick<AppState, 'schedule' | 'billing'>, actor: Actor, eventId: string): Outcome<ProcedureEvent> {
  const event = state.schedule.procedureEvents[eventId]
  if (event === undefined) return refuse('notFound', EVENT_MESSAGES.notFound)
  const status = eventStatus(event)
  if (status === 'approved') return refuse('approved', EVENT_MESSAGES.approvedLocked)
  if (status === 'invoiced') return refuse('invoiced', EVENT_MESSAGES.invoicedLocked)
  if (!mayEditEvent(event, eventActor(actor), procedureOwner(state, event.procedureId))) return refuse('notYours', EVENT_MESSAGES.notYours)
  return ok(event)
}

/**
 * Edit an event awaiting review or declined (`mayEditEvent`). An edit of a
 * declined event sends it back to review. Validated against its raiser.
 */
export function updateProcedureEvent(
  api: AppStoreApi,
  actor: Actor,
  eventId: string,
  patch: Partial<Pick<ProcedureEventInput, 'occurredOnISO' | 'party' | 'lines'>>,
): Outcome<{ eventId: string }> {
  const state = api.getState()
  const guard = editGuard(state, actor, eventId)
  if (!guard.ok) return guard
  const before = guard.value
  // A credit and its replacements are edited as one correction (catch-up Phase 39): back to review together.
  if (before.kind === 'credit' || before.replaces !== undefined) return updateCreditPart(api, actor, eventId, patch)
  const madeParty = partyFromInput(patch.party ?? before.party, state.counters)
  if (!madeParty.ok) return madeParty
  const next = {
    kind: before.kind,
    occurredOnISO: patch.occurredOnISO ?? before.occurredOnISO,
    party: madeParty.value.party,
    lines: patch.lines ?? eventLines(before),
  }
  const raiser: EventActor = { role: before.addedBy.role, ...(before.addedBy.anaesthetistId !== undefined ? { anaesthetistId: before.addedBy.anaesthetistId } : {}) }
  const valid = validateInput(state, raiser, before.procedureId, next)
  if (!valid.ok) return valid
  mutate(
    api,
    actor,
    {
      entityType: 'procedureEvent',
      entityId: eventId,
      action: 'procedureEvent.update',
      before: { occurredOnISO: before.occurredOnISO, party: partyForAudit(before.party), lines: eventLines(before), review: before.review.state },
      after: { occurredOnISO: next.occurredOnISO, party: partyForAudit(next.party), lines: cleanLines(next.lines), review: 'awaitingReview', total: valid.value.total },
      stampBookingId: null,
    },
    (s) => {
      const current = s.schedule.procedureEvents[eventId]!
      const updated: ProcedureEvent = {
        ...current,
        occurredOnISO: next.occurredOnISO,
        party: structuredClone(next.party),
        detail: { kind: 'additionalInvoice', lines: cleanLines(next.lines) },
        review: { state: 'awaitingReview' },
        updatedAtISO: clockISO(s.clock),
      }
      return { schedule: { ...s.schedule, procedureEvents: { ...s.schedule.procedureEvents, [eventId]: updated } }, counters: madeParty.value.counters }
    },
  )
  return ok({ eventId })
}

/** Remove an event awaiting review or declined (`mayEditEvent`). The audit keeps the full record. */
export function removeProcedureEvent(api: AppStoreApi, actor: Actor, eventId: string): Outcome<{ eventId: string }> {
  const state = api.getState()
  const guard = editGuard(state, actor, eventId)
  if (!guard.ok) return guard
  // A credit is removed with its replacements; a replacement alone is not (catch-up Phase 39).
  if (guard.value.kind === 'credit') return removeCreditUnit(api, actor, eventId)
  if (guard.value.replaces !== undefined) return refuse('partOfCorrection', CREDIT_MESSAGES.partOfCorrection)
  mutate(
    api,
    actor,
    { entityType: 'procedureEvent', entityId: eventId, action: 'procedureEvent.remove', before: structuredClone(guard.value), stampBookingId: null },
    (s) => {
      const procedureEvents = { ...s.schedule.procedureEvents }
      delete procedureEvents[eventId]
      return { schedule: { ...s.schedule, procedureEvents } }
    },
  )
  return ok({ eventId })
}

export function reviewGuard(state: Pick<AppState, 'schedule'>, actor: Actor, eventId: string): Outcome<ProcedureEvent> {
  if (actor.role !== 'office') return refuse('officeOnly', EVENT_MESSAGES.officeOnlyReview)
  const event = state.schedule.procedureEvents[eventId]
  if (event === undefined) return refuse('notFound', EVENT_MESSAGES.notFound)
  if (eventStatus(event) !== 'awaitingReview') return refuse('notAwaitingReview', EVENT_MESSAGES.notAwaiting)
  return ok(event)
}

/**
 * The office approves an event (the one standard review step, D13), whoever
 * raised it. Re-validates against its raiser and re-prices, so a stale event
 * refuses with the same sentences. Approval raises nothing: the run does.
 */
export function approveProcedureEvent(api: AppStoreApi, actor: Actor, eventId: string): Outcome<{ eventId: string }> {
  const state = api.getState()
  const guard = reviewGuard(state, actor, eventId)
  if (!guard.ok) return guard
  const event = guard.value
  // A credit is approved with its replacements; a replacement never alone (catch-up Phase 39).
  if (event.replaces !== undefined) return refuse('partOfCorrection', CREDIT_MESSAGES.partOfCorrection)
  if (event.kind === 'credit') return approveCreditUnit(api, actor, eventId)
  const raiser: EventActor = { role: event.addedBy.role, ...(event.addedBy.anaesthetistId !== undefined ? { anaesthetistId: event.addedBy.anaesthetistId } : {}) }
  const valid = validateInput(state, raiser, event.procedureId, { kind: event.kind, occurredOnISO: event.occurredOnISO, party: event.party, lines: eventLines(event) })
  if (!valid.ok) return valid
  mutate(
    api,
    actor,
    { entityType: 'procedureEvent', entityId: eventId, action: 'procedureEvent.approve', before: { review: 'awaitingReview' }, after: { review: 'approved', total: valid.value.total, eventRaisedBy: event.addedBy.who }, stampBookingId: null },
    (s) => {
      const current = s.schedule.procedureEvents[eventId]!
      return {
        schedule: {
          ...s.schedule,
          procedureEvents: { ...s.schedule.procedureEvents, [eventId]: { ...current, review: { state: 'approved', by: { who: actor.who, role: actor.role }, atISO: clockISO(s.clock) } } },
        },
      }
    },
  )
  return ok({ eventId })
}

/** The office declines an event with a reason (shown to whoever raised it). */
export function declineProcedureEvent(api: AppStoreApi, actor: Actor, eventId: string, reason: string): Outcome<{ eventId: string }> {
  const state = api.getState()
  const guard = reviewGuard(state, actor, eventId)
  if (!guard.ok) return guard
  if (guard.value.replaces !== undefined) return refuse('partOfCorrection', CREDIT_MESSAGES.partOfCorrection)
  const why = reason.trim()
  if (why === '') return refuse('reasonRequired', EVENT_MESSAGES.giveReason)
  // A credit is declined with its replacements (catch-up Phase 39).
  if (guard.value.kind === 'credit') return declineCreditUnit(api, actor, eventId, why)
  mutate(
    api,
    actor,
    { entityType: 'procedureEvent', entityId: eventId, action: 'procedureEvent.decline', before: { review: 'awaitingReview' }, after: { review: 'declined', reason: why }, stampBookingId: null },
    (s) => {
      const current = s.schedule.procedureEvents[eventId]!
      return {
        schedule: {
          ...s.schedule,
          procedureEvents: { ...s.schedule.procedureEvents, [eventId]: { ...current, review: { state: 'declined', by: { who: actor.who, role: actor.role }, atISO: clockISO(s.clock), reason: why } } },
        },
      }
    },
  )
  return ok({ eventId })
}

// ---------------------------------------------------------------------------
// The next billing run for events
// ---------------------------------------------------------------------------

export interface EventRunResult {
  /** Every invoice the run raised: plain additional invoices and the replacements issued with a credit. */
  invoiceIds: InvoiceId[]
  pairIds: string[]
  /** The credit notes the run issued (catch-up Phase 39), each with its negative invoice and replacements. */
  creditNoteIds: string[]
  /** Events the run could not invoice (a stale party or price), with why; they stay approved. */
  skipped: { eventId: string; message: string }[]
}

/** The original's delivery as a plan, for "same as": the invoice goes where the original went. */
export function deliveryOfOriginal(original: Invoice): DeliveryPlan {
  const d = original.delivery
  if (d === undefined) return { method: 'none' }
  // The address it last went to (a resend to a corrected address wins).
  const last = d.method === 'email' && d.status === 'sent' ? d.sends[d.sends.length - 1] : undefined
  if (d.method === 'email') return last !== undefined ? { method: 'email', to: last.to } : { method: 'none' }
  return { method: 'post', lines: [...d.address] }
}

/** The payee the additional invoice pays: 25's locked payee, else the List's anaesthetist. */
export function payeeOf(state: EventState, bookingId: string): LockedPayee | undefined {
  const lock = state.billing.locks[bookingId]
  if (lock !== undefined) return lock.payee
  const booking = state.schedule.bookings[bookingId]
  const id = booking !== undefined ? state.schedule.lists[booking.listId]?.anaesthetistId : undefined
  const anaesthetist = id !== undefined ? state.masters.anaesthetists[id] : undefined
  return anaesthetist !== undefined ? { anaesthetistId: anaesthetist.registrationNumber, name: anaesthetist.name, supplier: supplierFor(anaesthetist) } : undefined
}

/** What the run needs to raise one additional invoice from its event. */
export interface PlannedAdditional {
  event: ProcedureEvent
  draft: DraftInvoice
  original: Invoice
  party: ResolvedEventParty
  payee: LockedPayee
  pricing: FreeFormPricing & { kind: 'priced' }
}

/**
 * Plan one additional invoice from its event (38b's issue path): re-validated
 * against its raiser and re-priced, addressed by its party, laid out and
 * delivered like its original. A replacement (catch-up Phase 39) resolves
 * "same as" against the invoice it replaces, never the Procedure's live one.
 */
export function planAdditionalInvoice(state: EventState & Pick<AppState, 'clock'>, event: ProcedureEvent): PlannedAdditional | { message: string } {
  const raiser: EventActor = { role: event.addedBy.role, ...(event.addedBy.anaesthetistId !== undefined ? { anaesthetistId: event.addedBy.anaesthetistId } : {}) }
  const valid = validateInput(state, raiser, event.procedureId, { kind: 'additionalInvoice', occurredOnISO: event.occurredOnISO, party: event.party, lines: eventLines(event) })
  const named = event.party.sameAs ? undefined : event.party.party
  const original = event.replaces !== undefined ? state.billing.invoices[event.replaces.originalInvoiceId] : liveInvoiceForProcedure(state, event.procedureId, named)
  const procedureParty = procedurePartyOf(state, event.procedureId)
  const party = resolveEventParty(event, {
    ...(original !== undefined ? { originalInvoice: original } : {}),
    ...(procedureParty !== undefined ? { procedureParty } : {}),
  })
  const payee = payeeOf(state, event.bookingId)
  if (!valid.ok) return { message: valid.message }
  if (original === undefined || party === undefined || payee === undefined) return { message: 'The original invoice or payee is missing.' }
  const pricing = valid.value
  const procedure = state.schedule.procedures[event.procedureId]!
  const delivery: DeliveryPlan = party.sameAs ? deliveryOfOriginal(original) : (namedPartyDelivery(state, event.procedureId, event.party) ?? { method: 'none' })
  // A person billed by name gets the run's snapshot, as every run invoice does (`billedToFor`).
  const booking = state.schedule.bookings[event.bookingId]!
  const billedTo =
    party.billedTo ??
    (!party.sameAs && isPersonParty(party.counterparty) ? billedToFor(party.counterparty, [procedure], booking.patientId, state.masters.patients[booking.patientId]) : undefined)
  const draft: DraftInvoice = {
    counterparty: party.counterparty,
    ...(billedTo !== undefined ? { billedTo } : {}),
    layout: party.sameAs ? original.layout : isPersonParty(party.counterparty) ? 'patient' : 'contractHolder',
    lines: pricing.lines.map((l) => ({ procedureId: procedure.id, kind: 'fee' as const, description: l.description, amount: l.amount, quantity: l.quantity, unitAmount: l.unitAmount })),
    subtotal: pricing.subtotal,
    gst: pricing.gst,
    total: pricing.total,
    procedureIds: [procedure.id],
    ...(original.crossMatch !== undefined ? { crossMatch: { ...original.crossMatch } } : {}),
    ...(party.sameAs && original.holderReference !== undefined ? { holderReference: original.holderReference } : {}),
    delivery,
  }
  return { event, draft, original, party, payee, pricing }
}

/** The run's working copies, written by each event's issue inside the one commit (`CreditRunDraft` is the same shape). */
export interface EventRunWork {
  counters: Record<string, number>
  maps: { invoices: Record<string, Invoice>; invoiceLines: AppState['billing']['invoiceLines']; ledger: AppState['billing']['ledger'] }
  procedureEvents: AppState['schedule']['procedureEvents']
  metas: MutationMeta[]
}

/**
 * Issue one planned additional invoice into the run's working copies: its own
 * number from the ordinary sequence, `kind: 'additional'`, its lineage
 * (`additionalTo` for a plain one; `rebillOf` for a replacement, passed by the
 * credit) and `eventId`, its own ledger pair (payable to the locked payee),
 * the event stamped. Returns the invoice and pair ids.
 */
export function issueAdditionalInto(
  s: AppState,
  work: EventRunWork,
  p: PlannedAdditional,
  atISO: string,
  opts: { lineage?: Invoice['lineage']; createAfter?: Record<string, unknown> } = {},
): { invoiceId: InvoiceId; pairIds: string[] } {
  const procedure = s.schedule.procedures[p.event.procedureId]
  const made = materialiseInvoices(
    s,
    work.counters,
    [p.draft],
    {
      bookingId: p.event.bookingId,
      atISO,
      kind: 'additional',
      send: true,
      createAction: 'invoice.additionalCreated',
      payee: p.payee,
      lineage: opts.lineage ?? [{ role: 'additionalTo', invoiceId: p.original.id }],
      eventId: p.event.id,
      createAfter: {
        originalInvoiceNumber: p.original.invoiceNumber,
        procedureId: p.event.procedureId,
        procedure: procedure?.invoiceDescription?.text ?? procedure?.procedureText?.text ?? p.event.procedureId,
        lines: p.pricing.lines,
        eventRaisedBy: p.event.addedBy.who,
        eventId: p.event.id,
        ...(opts.createAfter ?? {}),
      },
    },
    work.maps,
  )
  work.counters = made.counters
  work.maps = { invoices: made.invoices, invoiceLines: made.invoiceLines, ledger: made.ledger }
  const invoiceId = made.invoiceIds[0]!
  work.procedureEvents[p.event.id] = { ...work.procedureEvents[p.event.id]!, invoiceId }
  work.metas.push({
    entityType: 'procedureEvent',
    entityId: p.event.id,
    action: 'procedureEvent.invoiced',
    after: { invoiceId, invoiceNumber: made.invoices[invoiceId]!.invoiceNumber },
    stampBookingId: null,
  })
  work.metas.push(...made.metas)
  if (!sameRef(p.original.counterparty, p.party.counterparty)) {
    work.metas.push({
      entityType: 'invoice',
      entityId: invoiceId,
      action: 'invoice.partyChanged',
      before: { counterparty: p.original.counterparty, invoiceNumber: p.original.invoiceNumber },
      after: { counterparty: p.party.counterparty },
      stampBookingId: null,
    })
  }
  return { invoiceId, pairIds: made.pairIds }
}

/**
 * The next billing run for events (`EVENT_RULES.nextRun: 'explicitRun'`): one
 * `mutate()` that invoices every approved, invoice-ticked, not yet invoiced
 * event, in id order, by `eventInvoicing` (OQ-121, D69). An additional
 * invoice is always its own invoice: its own number from the ordinary
 * sequence, the original's layout and delivery, `kind: 'additional'`, the
 * `additionalTo` lineage and `eventId`, and its own ledger pair (payable to
 * the locked payee). An approved credit (catch-up Phase 39) is issued in the
 * same commit by `issueCreditInto`, with its replacements; the generic loop
 * skips any event with `replaces` (a replacement is issued only through its
 * credit). Then each plain additional invoice's pair is handed to Xero, and
 * each credit's reversal and new pairs together (`handoffCorrection`), so no
 * replacement pair is handed off twice. `eventIds` narrows the run (the PWA
 * stand-in). `runBillingForList` is never involved, and no run creates an
 * event or a credit. Invoices each event exactly once.
 */
export function runEventInvoicing(api: AppStoreApi, actor: Actor, opts: { eventIds?: readonly string[] } = {}): Outcome<EventRunResult> {
  const state = api.getState()
  const narrowed = opts.eventIds !== undefined ? new Set(opts.eventIds) : undefined
  const due = approvedEventsAwaitingRun(state).filter((e) => (narrowed === undefined || narrowed.has(e.id)) && e.replaces === undefined)
  if (due.length === 0) return refuse('nothingToInvoice', EVENT_MESSAGES.nothingToRun)

  type Planned = { kind: 'additional'; plan: PlannedAdditional } | { kind: 'credit'; eventId: string }
  const planned: Planned[] = []
  const skipped: EventRunResult['skipped'] = []
  for (const event of due) {
    if (event.kind === 'credit') {
      const plan = planCreditIssue(state, event.id)
      if (!plan.ok) skipped.push({ eventId: event.id, message: plan.message })
      else planned.push({ kind: 'credit', eventId: event.id })
      continue
    }
    const plan = planAdditionalInvoice(state, event)
    if ('message' in plan) {
      skipped.push({ eventId: event.id, message: plan.message })
      continue
    }
    // OQ-121, D69: the additional invoice never bundles; a bundling kind (39b) would join the run's invoice for its party here.
    if (eventInvoicing(event, { runInvoiceForParty: false }) !== 'ownInvoice') continue
    planned.push({ kind: 'additional', plan })
  }
  if (planned.length === 0) return refuse('nothingToInvoice', skipped[0]?.message ?? EVENT_MESSAGES.nothingToRun)

  const invoiceIds: InvoiceId[] = []
  const pairIds: string[] = []
  const plainPairIds: string[] = []
  const creditNoteIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const atISO = clockISO(s.clock)
    const work: CreditRunDraft = {
      s,
      counters: s.counters,
      maps: { invoices: { ...s.billing.invoices }, invoiceLines: { ...s.billing.invoiceLines }, ledger: { ...s.billing.ledger } },
      procedureEvents: { ...s.schedule.procedureEvents },
      creditNotes: { ...s.billing.creditNotes },
      negativeInvoices: { ...s.billing.negativeInvoices },
      metas,
    }
    for (const p of planned) {
      if (p.kind === 'additional') {
        const made = issueAdditionalInto(s, work, p.plan, atISO)
        invoiceIds.push(made.invoiceId)
        pairIds.push(...made.pairIds)
        plainPairIds.push(...made.pairIds)
        continue
      }
      const issued = issueCreditInto(work, p.eventId, atISO)
      if (!issued.ok) {
        skipped.push({ eventId: p.eventId, message: issued.message })
        continue
      }
      creditNoteIds.push(issued.value.creditNoteId)
      invoiceIds.push(...issued.value.invoiceIds)
      pairIds.push(...issued.value.pairIds)
    }
    return {
      billing: { ...s.billing, invoices: work.maps.invoices, invoiceLines: work.maps.invoiceLines, ledger: work.maps.ledger, creditNotes: work.creditNotes, negativeInvoices: work.negativeInvoices },
      schedule: { ...s.schedule, procedureEvents: work.procedureEvents },
      counters: work.counters,
    }
  })
  for (const pairId of plainPairIds) handoffPair(api, pairId)
  for (const creditNoteId of creditNoteIds) handoffCorrection(api, creditNoteId)
  return ok({ invoiceIds, pairIds, creditNoteIds, skipped })
}

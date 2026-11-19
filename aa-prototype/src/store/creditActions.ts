/**
 * Credit notes and credit-and-rebill (catch-up Phase 39; FT-08.6, US-08.6.2,
 * US-08.6.5, US-07.3.2, US-13.5.2, DM-24, DM-25, OQ-19, OQ-42, OQ-63).
 *
 * A wrong or unwanted invoice is never edited and its Booking never unlocked:
 * it is credited in full and new invoices are issued. A credit is an event on
 * the Procedure (OQ-63, D13): `submitCredit` writes the credit event and one
 * ordinary additional-invoice event per replacement (each with `replaces`),
 * all awaiting 38b's one review step, linked both ways. The credit and its
 * replacements are reviewed, edited, removed and issued as one unit: 38b's
 * review actions hand a credit (or a replacement) to the unit functions here,
 * so there is one queue. The next billing run issues an approved credit with
 * its replacements in its one commit (`issueCreditInto`), then hands the
 * reversal and the new pairs to Xero together (`handoffCorrection`).
 *
 * Who may credit (US-08.6.5, OQ-61, OQ-76): the office on any Procedure, the
 * anaesthetist on their own (38b's `mayRaise` and `procedureOwner`); a split
 * (`cause: 'split'`) is office only. Nothing outside `submitCredit` raises a
 * credit: no run, threshold or price difference calls it (US-06.4.1).
 *
 * Immutability (US-07.3.2): the original invoice, its lines, the Booking, its
 * Procedures and its lock are never written. "Credited", "Credit waiting for
 * review", "Credited by CN-2026-0001" and "Rebilled as AA-2026-0013" are
 * derived by the selectors below. Every write stamps no Booking
 * (`stampBookingId: null`).
 *
 * The rebill's basis (the labelled reading): a rebill is a 38b additional
 * invoice with its own stored lines and party, its payable to the Procedure's
 * locked payee. No new lock is made and no snapshot is rewritten.
 */

import type {
  AuditEntry,
  BookingLedgerPair,
  CounterpartyRef,
  CreditCause,
  CreditEventDetail,
  CreditNote,
  EventParty,
  FreeFormLine,
  Invoice,
  InvoiceId,
  NegativeInvoice,
  ProcedureEvent,
  ReversalPlan,
} from '../domain/types'
import { creditDetailOf, eventLines, eventStatus, mayRaise, resolveEventParty, type EventActor, type ResolvedEventParty } from '../domain/billing/procedureEvent'
import { creditInFull, rebillDraftFrom, reversalPlan, splitTotalCheck, type CreditInFull } from '../domain/billing/creditNote'
import { defaultEventDate } from '../domain/billing/procedureEvent'
import { applyCredit, payeeAnaesthetistOf, settledOn } from '../domain/billing/ledger'
import { toCents } from '../domain/billing/money'
import { deliveryStampFor } from '../domain/billing/invoicePresentation'
import type { DeliveryPlan } from '../domain/billing/whoIsBilled'
import { CREDIT_MESSAGES, CREDIT_SYNC_MESSAGES, EVENT_MESSAGES, SPLIT_MESSAGES } from '../shared/procedureEventCopy'
import { drSurname } from '../shared/format'
import { auditViewerEntries, sortAuditNewestFirst } from '../shared/audit'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { BILLING_RUN_SENDER } from './invoiceMaterialise'
import { pairForInvoice } from './ledgerSelectors'
import {
  cleanLines,
  deliveryOfOriginal,
  editGuard,
  eventActor,
  issueAdditionalInto,
  liveInvoiceForProcedure,
  liveInvoicesForProcedure,
  namedPartyDelivery,
  partyForAudit,
  partyFromInput,
  planAdditionalInvoice,
  procedureOwner,
  reviewGuard,
  validateInput,
  type EventPartyInput,
  type EventRunWork,
  type PlannedAdditional,
  type ProcedureEventInput,
} from './procedureEventActions'

type CreditState = Pick<AppState, 'schedule' | 'billing' | 'masters' | 'clock' | 'xero'>

// ---------------------------------------------------------------------------
// Selectors (derived, never stored)
// ---------------------------------------------------------------------------

function byNumber(a: Invoice, b: Invoice): number {
  return a.invoiceNumber.localeCompare(b.invoiceNumber)
}

/** The credit note that credited an invoice, once issued. */
export function creditNoteForInvoice(state: Pick<AppState, 'billing'>, invoiceId: string): CreditNote | undefined {
  return Object.values(state.billing.creditNotes).find((c) => c.originalInvoiceId === invoiceId)
}

/** The invoices issued to replace a credited one (their `rebillOf` lineage), by number: "Rebilled as AA-2026-0013". */
export function replacementsOf(state: Pick<AppState, 'billing'>, invoiceId: string): Invoice[] {
  return Object.values(state.billing.invoices)
    .filter((i) => (i.lineage ?? []).some((l) => l.role === 'rebillOf' && l.invoiceId === invoiceId))
    .sort(byNumber)
}

/** The credited invoice a replacement rebills: "Rebills AA-2026-0007 (credited by CN-2026-0001)". */
export function rebillOriginFor(state: Pick<AppState, 'billing'>, invoiceId: string): Invoice | undefined {
  const link = state.billing.invoices[invoiceId]?.lineage?.find((l) => l.role === 'rebillOf')
  return link !== undefined ? state.billing.invoices[link.invoiceId] : undefined
}

/**
 * Whether an invoice stands for this Procedure: its own `procedureIds`, or,
 * for a replacement, those of the invoice it rebills (followed up the
 * `rebillOf` lineage), so every Procedure of a credited invoice that covered
 * several reaches its replacement.
 */
export function invoiceCoversProcedure(state: Pick<AppState, 'billing'>, invoiceId: string, procedureId: string): boolean {
  const seen = new Set<string>()
  let invoice = state.billing.invoices[invoiceId]
  while (invoice !== undefined && !seen.has(invoice.id)) {
    if ((invoice.procedureIds ?? []).includes(procedureId)) return true
    seen.add(invoice.id)
    invoice = rebillOriginFor(state, invoice.id)
  }
  return false
}

/** Every credit event raised against an invoice, id order. */
function creditEventsFor(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }, invoiceId: string): ProcedureEvent[] {
  return Object.values(state.schedule.procedureEvents)
    .filter((e) => creditDetailOf(e)?.originalInvoiceId === invoiceId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** A credit event on this invoice waiting for review or for the next run (awaiting review or approved), other than `exceptId`. */
export function pendingCreditEventFor(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }, invoiceId: string, exceptId?: string): ProcedureEvent | undefined {
  return creditEventsFor(state, invoiceId).find((e) => e.id !== exceptId && (eventStatus(e) === 'awaitingReview' || eventStatus(e) === 'approved'))
}

/** The credit event of an invoice: the issued one, else the pending one, else the latest declined one. */
export function creditEventForInvoice(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }, invoiceId: string): ProcedureEvent | undefined {
  const all = creditEventsFor(state, invoiceId)
  return all.find((e) => eventStatus(e) === 'invoiced') ?? pendingCreditEventFor(state, invoiceId) ?? all.filter((e) => eventStatus(e) === 'declined').at(-1)
}

export type InvoiceStanding = 'live' | 'creditPending' | 'credited'

/** An invoice's standing: credited (a credit note exists), a credit waiting for review or the next run, or live. Never stored. */
export function invoiceStanding(state: Pick<AppState, 'schedule' | 'billing'>, invoiceId: string): InvoiceStanding {
  if (creditNoteForInvoice(state, invoiceId) !== undefined) return 'credited'
  return pendingCreditEventFor(state, invoiceId) !== undefined ? 'creditPending' : 'live'
}

/** An anaesthetist's negative invoices, by number (Phase 39a nets the `toNet` ones). */
export function negativeInvoicesFor(state: Pick<AppState, 'billing'>, anaesthetistId: string): NegativeInvoice[] {
  return Object.values(state.billing.negativeInvoices)
    .filter((n) => n.anaesthetistId === anaesthetistId)
    .sort((a, b) => a.number.localeCompare(b.number))
}

/** A credit event's replacement events, in the credit's order. */
export function replacementEventsOf(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }, creditEventId: string): ProcedureEvent[] {
  const credit = creditDetailOf(state.schedule.procedureEvents[creditEventId])
  if (credit === undefined) return []
  return credit.replacementEventIds.flatMap((id) => (state.schedule.procedureEvents[id] !== undefined ? [state.schedule.procedureEvents[id]] : []))
}

/** The credit an event belongs to: a credit event itself, or the credit a replacement belongs to. */
export function creditEventOf(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }, eventId: string): ProcedureEvent | undefined {
  const event = state.schedule.procedureEvents[eventId]
  if (event === undefined) return undefined
  if (event.kind === 'credit') return event
  return event.replaces !== undefined ? state.schedule.procedureEvents[event.replaces.creditEventId] : undefined
}

/**
 * The review queue's rows (38b's Events tab, one queue): each event awaiting
 * review, a credit carrying its replacements nested and a replacement never on
 * its own row. Oldest raised first, as `eventsAwaitingReview`.
 */
export function reviewRowsAwaiting(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }): { event: ProcedureEvent; replacements: ProcedureEvent[] }[] {
  return Object.values(state.schedule.procedureEvents)
    .filter((e) => e.replaces === undefined && eventStatus(e) === 'awaitingReview')
    .sort((a, b) => (a.addedAtISO === b.addedAtISO ? a.id.localeCompare(b.id) : a.addedAtISO.localeCompare(b.addedAtISO)))
    .map((event) => ({ event, replacements: event.kind === 'credit' ? replacementEventsOf(state, event.id) : [] }))
}

/** The reversal a credit of this invoice would make now, from its pair's legs (the sheet's money state); undefined with no pair. */
export function currentReversalPlan(state: Pick<AppState, 'billing'>, invoiceId: string): ReversalPlan | undefined {
  const pair = pairForInvoice(state, invoiceId)
  if (pair === undefined) return undefined
  return reversalPlan({ total: pair.receivable.amount, received: pair.receivable.receivedAmount, released: pair.payable?.releasedAmount ?? 0, disbursed: pair.payable !== undefined ? settledOn(pair.payable) : 0 })
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** One replacement as a form hands it in: 38b's additional-invoice input. `eventId` keeps an existing replacement when a credit is edited. */
export interface CreditReplacementInput {
  eventId?: string
  occurredOnISO: string
  party: EventPartyInput
  lines: FreeFormLine[]
}

/** A credit as the sheet hands it in (`CreditSheet`, the anaesthetist's `CreditForm`). */
export interface CreditInput {
  invoiceId: InvoiceId
  /** The Procedure the credit sits on; defaults to the invoice's first. */
  procedureId?: string
  /** Who the credit note goes to; defaults to the original's billable party ("same as"). */
  party?: EventPartyInput
  /** An invoice email for a named party. */
  invoiceEmail?: string
  reason: string
  cause: CreditCause
  replacements: CreditReplacementInput[]
}

interface ValidCredit {
  original: Invoice
  procedureId: string
  party: EventParty
  replacements: { eventId?: string; occurredOnISO: string; party: EventParty; lines: FreeFormLine[]; subtotal: number; total: number }[]
  counters: Record<string, number>
}

/** A named party's typed invoice email, folded into its stored party. */
function withInvoiceEmail(party: EventPartyInput, invoiceEmail: string | undefined): EventPartyInput {
  const email = invoiceEmail?.trim()
  if (party.sameAs || email === undefined || email === '') return party
  return { ...party, invoiceEmail: email }
}

/**
 * Why this actor may not credit this invoice for state reasons (the Credit
 * note button's disabled sentence), or null. The form's own refusals (reason,
 * party, lines, the split's total) come from `submitCredit`.
 */
export function creditRefusalFor(state: Pick<AppState, 'schedule' | 'billing'>, actor: EventActor, invoiceId: string, cause: CreditCause = 'correction', opts: { procedureId?: string; editing?: string } = {}): { code: string; message: string } | null {
  if (state.billing.aaFeeInvoices[invoiceId] !== undefined) return { code: 'kindNotCreditable', message: CREDIT_MESSAGES.aaFeeNotCreditable }
  const original = state.billing.invoices[invoiceId]
  if (original === undefined) return { code: 'notFound', message: CREDIT_MESSAGES.invoiceNotFound }
  if (original.kind === 'prePayment') return { code: 'kindNotCreditable', message: CREDIT_MESSAGES.prepaymentNotCreditable }
  if (original.noCharge === true) return { code: 'kindNotCreditable', message: CREDIT_MESSAGES.noChargeNotCreditable }
  const procedureId = opts.procedureId ?? original.procedureIds?.[0]
  if (procedureId === undefined || !invoiceCoversProcedure(state, invoiceId, procedureId)) return { code: 'procedureNotOnInvoice', message: CREDIT_MESSAGES.procedureNotOnInvoice }
  if (!mayRaise('credit', actor, procedureOwner(state, procedureId))) return { code: 'notOwnProcedure', message: CREDIT_MESSAGES.notOwnProcedure }
  if (cause === 'split' && actor.role !== 'office') return { code: 'splitOfficeOnly', message: CREDIT_MESSAGES.splitOfficeOnly }
  const pair = pairForInvoice(state, invoiceId)
  if (pair === undefined || pair.payable === undefined || payeeAnaesthetistOf(pair.payable) === undefined) return { code: 'noPair', message: CREDIT_MESSAGES.noPair }
  if (creditNoteForInvoice(state, invoiceId) !== undefined || pair.credit !== undefined) return { code: 'alreadyCredited', message: CREDIT_MESSAGES.alreadyCredited }
  if (pendingCreditEventFor(state, invoiceId, opts.editing) !== undefined) return { code: 'correctionPending', message: CREDIT_MESSAGES.correctionPending }
  return null
}

/** Every refusal `submitCredit` makes, in order, for this raiser; re-run on approval and on edit (`editing` is the credit being edited). */
function validateCredit(
  state: CreditState,
  raiser: EventActor,
  input: Omit<CreditInput, 'party'> & { party: EventPartyInput },
  opts: { counters: Record<string, number>; editing?: string },
): Outcome<ValidCredit> {
  const stateRefusal = creditRefusalFor(state, raiser, input.invoiceId, input.cause, {
    ...(input.procedureId !== undefined ? { procedureId: input.procedureId } : {}),
    ...(opts.editing !== undefined ? { editing: opts.editing } : {}),
  })
  if (stateRefusal !== null) return refuse(stateRefusal.code, stateRefusal.message)
  const original = state.billing.invoices[input.invoiceId]!
  const procedureId = input.procedureId ?? original.procedureIds![0]!
  if (input.reason.trim() === '') return refuse('reasonRequired', CREDIT_MESSAGES.reasonRequired, { field: 'reason' })

  let counters = opts.counters
  const madeParty = partyFromInput(withInvoiceEmail(input.party, input.invoiceEmail), counters)
  if (!madeParty.ok) return madeParty
  counters = madeParty.value.counters
  const party = madeParty.value.party
  if (!party.sameAs) {
    if (party.party.id.trim() === '') return refuse('partyMissing', 'Pick who to bill.', { field: 'party' })
    const delivery = namedPartyDelivery(state, procedureId, party)
    if (delivery !== undefined && delivery.method === 'none') return refuse('invoiceEmailRequired', CREDIT_MESSAGES.invoiceEmailRequired, { field: 'party' })
  }

  const replacements: ValidCredit['replacements'] = []
  for (let i = 0; i < input.replacements.length; i++) {
    const r = input.replacements[i]!
    const madeR = partyFromInput(r.party, counters)
    if (!madeR.ok) return refuse(madeR.code, madeR.message, { replacementIndex: i })
    counters = madeR.value.counters
    const valid = validateInput(state, raiser, procedureId, { kind: 'additionalInvoice', occurredOnISO: r.occurredOnISO, party: madeR.value.party, lines: r.lines })
    if (!valid.ok) return refuse(valid.code, valid.message, { replacementIndex: i, ...(typeof valid.details === 'object' && valid.details !== null ? valid.details : {}) })
    replacements.push({ ...(r.eventId !== undefined ? { eventId: r.eventId } : {}), occurredOnISO: r.occurredOnISO, party: madeR.value.party, lines: cleanLines(r.lines), subtotal: valid.value.subtotal, total: valid.value.total })
  }

  // OQ-77 part 1 (answered): a split's new invoices add up to the credited invoice, before GST. Not applied to a plain credit or a rebill.
  if (input.cause === 'split') {
    if (replacements.length < 2) return refuse('splitNeedsTwo', CREDIT_MESSAGES.splitNeedsTwo)
    const check = splitTotalCheck(original, replacements.map((r) => r.lines))
    if (!check.ok) return refuse(check.code, check.message, { leftToAllocate: check.leftToAllocate, gstRounding: check.gstRounding })
  }
  return ok({ original, procedureId, party, replacements, counters })
}

function raiserOf(event: ProcedureEvent): EventActor {
  return { role: event.addedBy.role, ...(event.addedBy.anaesthetistId !== undefined ? { anaesthetistId: event.addedBy.anaesthetistId } : {}) }
}

function sameRef(a: CounterpartyRef, b: CounterpartyRef): boolean {
  return a.kind === b.kind && a.id === b.id
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

function replacementAddMeta(event: ProcedureEvent, v: ValidCredit['replacements'][number], original: Invoice, raisedBy: string): MutationMeta {
  return {
    entityType: 'procedureEvent',
    entityId: event.id,
    action: 'procedureEvent.add',
    after: {
      kind: event.kind,
      procedureId: event.procedureId,
      bookingId: event.bookingId,
      occurredOnISO: event.occurredOnISO,
      party: partyForAudit(event.party),
      lines: v.lines,
      subtotal: v.subtotal,
      total: v.total,
      eventRaisedBy: raisedBy,
      replaces: { creditEventId: event.replaces?.creditEventId, originalInvoiceNumber: original.invoiceNumber },
    },
    stampBookingId: null,
  }
}

function creditAuditAfter(v: ValidCredit, reason: string, cause: CreditCause, raisedBy: string): Record<string, unknown> {
  return {
    originalInvoiceNumber: v.original.invoiceNumber,
    reason: reason.trim(),
    cause,
    party: partyForAudit(v.party),
    replacementCount: v.replacements.length,
    replacementTotals: v.replacements.map((r) => r.total),
    eventRaisedBy: raisedBy,
  }
}

/**
 * Submit a credit (US-08.6.5, US-08.6.2): the original credited in full to the
 * chosen party (the original's by default; any billable party, audited
 * `credit.partyChanged`), with a reason, and zero or more replacement
 * additional invoices (38b's lines, party and date). One `mutate()` writes the
 * credit event and one additional-invoice event per replacement, all awaiting
 * the one review step, linked both ways, audited `credit.submitted`
 * (`entityType: 'creditNote'`). Issues nothing: the next billing run does.
 */
export function submitCredit(api: AppStoreApi, actor: Actor, input: CreditInput): Outcome<{ creditEventId: string; replacementEventIds: string[] }> {
  const state = api.getState()
  const raiser = eventActor(actor)
  const valid = validateCredit(state, raiser, { ...input, party: input.party ?? { sameAs: true } }, { counters: state.counters })
  if (!valid.ok) return valid
  const v = valid.value
  const procedure = state.schedule.procedures[v.procedureId]!
  let creditEventId = ''
  const replacementEventIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = v.counters
    const atISO = clockISO(s.clock)
    const addedBy: ProcedureEvent['addedBy'] = { who: actor.who, role: actor.role, ...(actor.role === 'anaesthetist' && actor.anaesthetistId !== undefined ? { anaesthetistId: actor.anaesthetistId } : {}) }
    const cid = allocateId(counters, 'procedureEvent')
    counters = cid.counters
    creditEventId = cid.id
    const events = { ...s.schedule.procedureEvents }
    const replacementEvents: ProcedureEvent[] = v.replacements.map((r, i) => {
      const rid = allocateId(counters, 'procedureEvent')
      counters = rid.counters
      replacementEventIds.push(rid.id)
      return {
        id: rid.id,
        procedureId: v.procedureId,
        bookingId: procedure.bookingId,
        kind: 'additionalInvoice',
        occurredOnISO: r.occurredOnISO,
        billable: true,
        party: r.party,
        detail: { kind: 'additionalInvoice', lines: r.lines },
        review: { state: 'awaitingReview' },
        replaces: { creditEventId: cid.id, originalInvoiceId: v.original.id, ...(input.cause === 'split' ? { componentIndex: i } : {}) },
        addedBy,
        addedAtISO: atISO,
      }
    })
    const credit: ProcedureEvent = {
      id: cid.id,
      procedureId: v.procedureId,
      bookingId: procedure.bookingId,
      kind: 'credit',
      occurredOnISO: s.clock.todayISO,
      billable: true,
      party: v.party,
      detail: { kind: 'credit', credit: { originalInvoiceId: v.original.id, reason: input.reason.trim(), cause: input.cause, replacementEventIds: [...replacementEventIds] } },
      review: { state: 'awaitingReview' },
      addedBy,
      addedAtISO: atISO,
    }
    events[credit.id] = credit
    for (const e of replacementEvents) events[e.id] = e
    metas.push({ entityType: 'creditNote', entityId: cid.id, action: 'credit.submitted', after: creditAuditAfter(v, input.reason, input.cause, actor.who), stampBookingId: null })
    if (!v.party.sameAs && !sameRef(v.party.party, v.original.counterparty)) {
      metas.push({ entityType: 'creditNote', entityId: cid.id, action: 'credit.partyChanged', before: { counterparty: v.original.counterparty, invoiceNumber: v.original.invoiceNumber }, after: { party: partyForAudit(v.party) }, stampBookingId: null })
    }
    replacementEvents.forEach((e, i) => metas.push(replacementAddMeta(e, v.replacements[i]!, v.original, actor.who)))
    return { schedule: { ...s.schedule, procedureEvents: events }, counters }
  })
  return ok({ creditEventId, replacementEventIds })
}

// ---------------------------------------------------------------------------
// Review: the credit and its replacements as one unit
// ---------------------------------------------------------------------------

/** The stored credit as `validateCredit` reads it, for a re-check on approval. */
function storedInput(event: ProcedureEvent, credit: CreditEventDetail, replacements: readonly ProcedureEvent[]): Omit<CreditInput, 'party'> & { party: EventPartyInput } {
  return {
    invoiceId: credit.originalInvoiceId,
    procedureId: event.procedureId,
    party: event.party,
    reason: credit.reason,
    cause: credit.cause,
    replacements: replacements.map((r) => ({ eventId: r.id, occurredOnISO: r.occurredOnISO, party: r.party, lines: eventLines(r) })),
  }
}

/** A credit event and its replacements, all present and in one review state. */
function creditUnit(state: Pick<AppState, 'schedule'>, creditEventId: string): Outcome<{ event: ProcedureEvent; credit: CreditEventDetail; replacements: ProcedureEvent[] }> {
  const event = state.schedule.procedureEvents[creditEventId]
  const credit = creditDetailOf(event)
  if (event === undefined || credit === undefined) return refuse('notACredit', CREDIT_MESSAGES.notACredit)
  const replacements = replacementEventsOf(state, creditEventId)
  if (replacements.length !== credit.replacementEventIds.length) return refuse('notFound', EVENT_MESSAGES.notFound)
  return ok({ event, credit, replacements })
}

/**
 * Approve a credit with its replacements (38b's one review step; called by
 * `approveProcedureEvent`). Re-runs `submitCredit`'s refusals against its
 * raiser, as 38b re-validates on approval. Issues nothing: the run does.
 */
export function approveCreditUnit(api: AppStoreApi, actor: Actor, creditEventId: string): Outcome<{ eventId: string }> {
  const state = api.getState()
  const guard = reviewGuard(state, actor, creditEventId)
  if (!guard.ok) return guard
  const unit = creditUnit(state, creditEventId)
  if (!unit.ok) return unit
  const { event, credit, replacements } = unit.value
  if (replacements.some((r) => eventStatus(r) !== 'awaitingReview')) return refuse('notAwaitingReview', EVENT_MESSAGES.notAwaiting)
  const valid = validateCredit(state, raiserOf(event), storedInput(event, credit, replacements), { counters: state.counters, editing: creditEventId })
  if (!valid.ok) return valid
  const metas: MutationMeta[] = [
    {
      entityType: 'creditNote',
      entityId: creditEventId,
      action: 'credit.approved',
      before: { review: 'awaitingReview' },
      after: { review: 'approved', originalInvoiceNumber: valid.value.original.invoiceNumber, replacementCount: replacements.length, eventRaisedBy: event.addedBy.who },
      stampBookingId: null,
    },
    ...replacements.map((r, i): MutationMeta => ({
      entityType: 'procedureEvent',
      entityId: r.id,
      action: 'procedureEvent.approve',
      before: { review: 'awaitingReview' },
      after: { review: 'approved', total: valid.value.replacements[i]!.total, eventRaisedBy: r.addedBy.who },
      stampBookingId: null,
    })),
  ]
  mutate(api, actor, metas, (s) => {
    const review = { state: 'approved' as const, by: { who: actor.who, role: actor.role }, atISO: clockISO(s.clock) }
    const events = { ...s.schedule.procedureEvents }
    for (const id of [creditEventId, ...credit.replacementEventIds]) events[id] = { ...events[id]!, review }
    return { schedule: { ...s.schedule, procedureEvents: events } }
  })
  return ok({ eventId: creditEventId })
}

/** Decline a credit with its replacements, with a reason shown to whoever raised it (called by `declineProcedureEvent`). */
export function declineCreditUnit(api: AppStoreApi, actor: Actor, creditEventId: string, reason: string): Outcome<{ eventId: string }> {
  const state = api.getState()
  const guard = reviewGuard(state, actor, creditEventId)
  if (!guard.ok) return guard
  const why = reason.trim()
  if (why === '') return refuse('reasonRequired', EVENT_MESSAGES.giveReason)
  const unit = creditUnit(state, creditEventId)
  if (!unit.ok) return unit
  const { credit } = unit.value
  const metas: MutationMeta[] = [
    { entityType: 'creditNote', entityId: creditEventId, action: 'credit.declined', before: { review: 'awaitingReview' }, after: { review: 'declined', reason: why }, stampBookingId: null },
    ...credit.replacementEventIds.map((id): MutationMeta => ({ entityType: 'procedureEvent', entityId: id, action: 'procedureEvent.decline', before: { review: 'awaitingReview' }, after: { review: 'declined', reason: why }, stampBookingId: null })),
  ]
  mutate(api, actor, metas, (s) => {
    const review = { state: 'declined' as const, by: { who: actor.who, role: actor.role }, atISO: clockISO(s.clock), reason: why }
    const events = { ...s.schedule.procedureEvents }
    for (const id of [creditEventId, ...credit.replacementEventIds]) events[id] = { ...events[id]!, review }
    return { schedule: { ...s.schedule, procedureEvents: events } }
  })
  return ok({ eventId: creditEventId })
}

// ---------------------------------------------------------------------------
// Edit and remove (awaiting review or declined; 38b's `mayEditEvent`)
// ---------------------------------------------------------------------------

/**
 * Edit a credit awaiting review or declined, through the sheet it came from
 * (`CreditSheet`, or the anaesthetist's `CreditForm`): its party, reason, cause
 * and replacements are rewritten in one `mutate()`. A replacement given with
 * its `eventId` is kept and updated; one left out is removed; one without an
 * id is added. The whole correction goes back to review. Validated against its
 * raiser, with every `submitCredit` refusal. The original is fixed.
 */
export function updateCredit(api: AppStoreApi, actor: Actor, creditEventId: string, input: Omit<CreditInput, 'invoiceId'> & { invoiceId?: InvoiceId }): Outcome<{ creditEventId: string; replacementEventIds: string[] }> {
  const state = api.getState()
  const guard = editGuard(state, actor, creditEventId)
  if (!guard.ok) return guard
  const unit = creditUnit(state, creditEventId)
  if (!unit.ok) return unit
  const { event, credit, replacements } = unit.value
  if (input.invoiceId !== undefined && input.invoiceId !== credit.originalInvoiceId) return refuse('invoiceFixed', 'A credit cannot move to another invoice. Remove it and raise a new one.')
  const keptIds = new Set(replacements.map((r) => r.id))
  if (input.replacements.some((r) => r.eventId !== undefined && !keptIds.has(r.eventId))) return refuse('notFound', EVENT_MESSAGES.notFound)
  const valid = validateCredit(
    state,
    raiserOf(event),
    { ...input, invoiceId: credit.originalInvoiceId, procedureId: event.procedureId, party: input.party ?? { sameAs: true } },
    { counters: state.counters, editing: creditEventId },
  )
  if (!valid.ok) return valid
  const v = valid.value
  const replacementEventIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = v.counters
    const atISO = clockISO(s.clock)
    const events = { ...s.schedule.procedureEvents }
    const used = new Set<string>()
    const writes: { event: ProcedureEvent; added: boolean; index: number }[] = []
    v.replacements.forEach((r, i) => {
      const existing = r.eventId !== undefined ? events[r.eventId] : undefined
      let id = existing?.id
      if (id === undefined) {
        const rid = allocateId(counters, 'procedureEvent')
        counters = rid.counters
        id = rid.id
      }
      used.add(id)
      replacementEventIds.push(id)
      const next: ProcedureEvent = {
        ...(existing ?? { id, procedureId: event.procedureId, bookingId: event.bookingId, addedBy: event.addedBy, addedAtISO: atISO }),
        id,
        kind: 'additionalInvoice',
        occurredOnISO: r.occurredOnISO,
        billable: true,
        party: r.party,
        detail: { kind: 'additionalInvoice', lines: r.lines },
        review: { state: 'awaitingReview' },
        replaces: { creditEventId, originalInvoiceId: credit.originalInvoiceId, ...(input.cause === 'split' ? { componentIndex: i } : {}) },
        ...(existing !== undefined ? { updatedAtISO: atISO } : {}),
      }
      events[id] = next
      writes.push({ event: next, added: existing === undefined, index: i })
    })
    const removed = replacements.filter((r) => !used.has(r.id))
    for (const r of removed) delete events[r.id]
    events[creditEventId] = {
      ...event,
      party: v.party,
      detail: { kind: 'credit', credit: { originalInvoiceId: credit.originalInvoiceId, reason: input.reason.trim(), cause: input.cause, replacementEventIds: [...replacementEventIds] } },
      review: { state: 'awaitingReview' },
      updatedAtISO: atISO,
    }
    metas.push({
      entityType: 'creditNote',
      entityId: creditEventId,
      action: 'credit.updated',
      before: { reason: credit.reason, cause: credit.cause, party: partyForAudit(event.party), replacementCount: credit.replacementEventIds.length, review: event.review.state },
      after: { ...creditAuditAfter(v, input.reason, input.cause, event.addedBy.who), review: 'awaitingReview' },
      stampBookingId: null,
    })
    for (const r of removed) metas.push({ entityType: 'procedureEvent', entityId: r.id, action: 'procedureEvent.remove', before: structuredClone(r), stampBookingId: null })
    for (const w of writes) {
      const vr = v.replacements[w.index]!
      if (w.added) metas.push(replacementAddMeta(w.event, vr, v.original, event.addedBy.who))
      else {
        const before = replacements.find((r) => r.id === w.event.id)!
        metas.push({
          entityType: 'procedureEvent',
          entityId: w.event.id,
          action: 'procedureEvent.update',
          before: { occurredOnISO: before.occurredOnISO, party: partyForAudit(before.party), lines: eventLines(before), review: before.review.state },
          after: { occurredOnISO: vr.occurredOnISO, party: partyForAudit(vr.party), lines: vr.lines, review: 'awaitingReview', total: vr.total },
          stampBookingId: null,
        })
      }
    }
    return { schedule: { ...s.schedule, procedureEvents: events }, counters }
  })
  return ok({ creditEventId, replacementEventIds })
}

/**
 * 38b's `updateProcedureEvent` on a part of a correction: the credit's party
 * or date, or one replacement's lines, party or date. The whole correction is
 * re-checked (a split's equal total included) and goes back to review.
 */
export function updateCreditPart(
  api: AppStoreApi,
  actor: Actor,
  eventId: string,
  patch: Partial<Pick<ProcedureEventInput, 'occurredOnISO' | 'party' | 'lines'>>,
): Outcome<{ eventId: string }> {
  const state = api.getState()
  const creditEvent = creditEventOf(state, eventId)
  const unit = creditEvent !== undefined ? creditUnit(state, creditEvent.id) : refuse<never>('notACredit', CREDIT_MESSAGES.notACredit)
  if (!unit.ok) return unit
  const { event, credit, replacements } = unit.value
  const isCredit = eventId === event.id
  const out = updateCredit(api, actor, event.id, {
    procedureId: event.procedureId,
    party: isCredit && patch.party !== undefined ? patch.party : event.party,
    reason: credit.reason,
    cause: credit.cause,
    replacements: replacements.map((r) => ({
      eventId: r.id,
      occurredOnISO: !isCredit && r.id === eventId && patch.occurredOnISO !== undefined ? patch.occurredOnISO : r.occurredOnISO,
      party: !isCredit && r.id === eventId && patch.party !== undefined ? patch.party : r.party,
      lines: !isCredit && r.id === eventId && patch.lines !== undefined ? patch.lines : eventLines(r),
    })),
  })
  return out.ok ? ok({ eventId }) : out
}

/** Remove a credit awaiting review or declined, with its replacements (called by `removeProcedureEvent`). The audit keeps the full records. */
export function removeCreditUnit(api: AppStoreApi, actor: Actor, creditEventId: string): Outcome<{ eventId: string }> {
  const state = api.getState()
  const guard = editGuard(state, actor, creditEventId)
  if (!guard.ok) return guard
  const unit = creditUnit(state, creditEventId)
  if (!unit.ok) return unit
  const { event, replacements } = unit.value
  const metas: MutationMeta[] = [
    { entityType: 'creditNote', entityId: creditEventId, action: 'credit.removed', before: structuredClone(event), stampBookingId: null },
    ...replacements.map((r): MutationMeta => ({ entityType: 'procedureEvent', entityId: r.id, action: 'procedureEvent.remove', before: structuredClone(r), stampBookingId: null })),
  ]
  mutate(api, actor, metas, (s) => {
    const events = { ...s.schedule.procedureEvents }
    for (const id of [creditEventId, ...replacements.map((r) => r.id)]) delete events[id]
    return { schedule: { ...s.schedule, procedureEvents: events } }
  })
  return ok({ eventId: creditEventId })
}

// ---------------------------------------------------------------------------
// Issue (inside the next billing run's one commit)
// ---------------------------------------------------------------------------

/** What issuing one approved credit needs, read from the state before the run's commit. */
export interface CreditIssuePlan {
  event: ProcedureEvent
  credit: CreditEventDetail
  original: Invoice
  pair: BookingLedgerPair
  anaesthetistId: string
  reversal: ReversalPlan
  note: CreditInFull
  party: ResolvedEventParty
  delivery: DeliveryPlan
  replacements: PlannedAdditional[]
}

/**
 * Whether Xero holds money on this pair that the ledger has not recorded yet
 * (catch-up Phase 39 review): a payment or a payout made in Xero that a missed
 * webhook or an outage held back (the ACCREC's received or the ACCPAY's
 * disbursed above the leg's; a Xero payment or bill payment no ledger entry
 * carries the key of), or a `paymentSync` or `disbursementSync` still open in
 * the Xero sync queue for it. A credit issued now would reverse from the
 * ledger alone and lose that money.
 */
export function xeroMoneyNotInLedger(state: Pick<AppState, 'billing' | 'xero'>, pair: BookingLedgerPair): boolean {
  const accRecId = pair.receivable.xeroAccRecId
  const accPayId = pair.payable?.xeroAccPayId
  const accRec = accRecId !== undefined ? state.xero.accRecs[accRecId] : undefined
  const accPay = accPayId !== undefined ? state.xero.accPays[accPayId] : undefined
  if (accRec !== undefined && toCents(accRec.amountReceived) > toCents(pair.receivable.receivedAmount)) return true
  if (accPay !== undefined && pair.payable !== undefined && toCents(accPay.amountDisbursed) > toCents(pair.payable.disbursedAmount)) return true
  if (accRecId !== undefined) {
    const receipts = new Set(Object.values(state.billing.receipts).map((r) => r.idempotencyKey))
    if (Object.values(state.xero.payments).some((p) => p.accRecId === accRecId && !receipts.has(p.idempotencyKey))) return true
  }
  if (accPayId !== undefined) {
    const disbursed = new Set(Object.values(state.billing.disbursements).map((d) => d.idempotencyKey))
    if (Object.values(state.xero.disbursements).some((d) => d.accPayId === accPayId && !disbursed.has(d.idempotencyKey))) return true
  }
  return Object.values(state.billing.xeroQueue).some((q) => {
    if (q.status === 'sent') return false
    if (q.kind === 'paymentSync') {
      const on = q.target.xeroPaymentId !== undefined ? state.xero.payments[q.target.xeroPaymentId]?.accRecId : q.target.accRecId
      return q.target.pairId === pair.id || (on !== undefined && on === accRecId)
    }
    if (q.kind === 'disbursementSync') {
      const on = q.target.xeroDisbursementId !== undefined ? state.xero.disbursements[q.target.xeroDisbursementId]?.accPayId : undefined
      return q.target.pairId === pair.id || (on !== undefined && on === accPayId)
    }
    return false
  })
}

/**
 * Plan the issue of an approved credit (the run's pre-check and
 * `issueCreditInto`'s read): the original and its pair still uncredited, every
 * replacement approved and priceable, the reversal from the legs at issue
 * time (a payment recorded while the credit waited is included). While Xero
 * holds money on the original that the ledger has not recorded
 * (`xeroMoneyNotInLedger`) it is refused `waitingForXero`: the run skips it
 * and it stays approved until the poll or the queue records that money.
 */
export function planCreditIssue(state: CreditState, creditEventId: string): Outcome<CreditIssuePlan> {
  const unit = creditUnit(state, creditEventId)
  if (!unit.ok) return unit
  const { event, credit, replacements } = unit.value
  if (eventStatus(event) !== 'approved') return refuse('notApproved', EVENT_MESSAGES.nothingToRun)
  const original = state.billing.invoices[credit.originalInvoiceId]
  if (original === undefined) return refuse('notFound', CREDIT_MESSAGES.invoiceNotFound)
  const pair = pairForInvoice(state, original.id)
  const anaesthetistId = pair?.payable !== undefined ? payeeAnaesthetistOf(pair.payable) : undefined
  if (pair === undefined || pair.payable === undefined || anaesthetistId === undefined) return refuse('noPair', CREDIT_MESSAGES.noPair)
  if (creditNoteForInvoice(state, original.id) !== undefined || pair.credit !== undefined) return refuse('alreadyCredited', CREDIT_MESSAGES.alreadyCredited)
  // The reversal is read from the ledger, so it waits until Xero and the ledger agree (catch-up Phase 39 review).
  if (xeroMoneyNotInLedger(state, pair)) return refuse('waitingForXero', CREDIT_SYNC_MESSAGES.waitingForXeroSync)
  const planned: PlannedAdditional[] = []
  for (const r of replacements) {
    if (eventStatus(r) !== 'approved') return refuse('notApproved', EVENT_MESSAGES.nothingToRun)
    const plan = planAdditionalInvoice(state, r)
    if ('message' in plan) return refuse('replacementRefused', plan.message)
    planned.push(plan)
  }
  const party = resolveEventParty(event, { originalInvoice: original })
  if (party === undefined) return refuse('partyMissing', 'Pick who to bill.')
  const delivery: DeliveryPlan = party.sameAs ? deliveryOfOriginal(original) : (namedPartyDelivery(state, event.procedureId, event.party) ?? { method: 'none' })
  const lines = Object.values(state.billing.invoiceLines)
    .filter((l) => l.invoiceId === original.id)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
  const reversal = reversalPlan({ total: original.total, received: pair.receivable.receivedAmount, released: pair.payable.releasedAmount, disbursed: settledOn(pair.payable) })
  return ok({ event, credit, original, pair, anaesthetistId, reversal, note: creditInFull(original, lines), party, delivery, replacements: planned })
}

/** The run's working copies (`runEventInvoicing`'s one commit), with the credit's records. */
export interface CreditRunDraft extends EventRunWork {
  /** The state the commit started from. */
  s: AppState
  creditNotes: AppState['billing']['creditNotes']
  negativeInvoices: AppState['billing']['negativeInvoices']
}

/**
 * Issue one approved credit inside `runEventInvoicing`'s commit (never called
 * by the UI): the credit note (`creditInFull`, delivered by the engine to the
 * chosen party through 22's delivery plan); the negative invoice to the
 * original's payee (`offset` when nothing was paid out, else `toNet`);
 * `applyCredit` on the original pair; each replacement through 38b's
 * additional-invoice issue path (its own number, pair, payable to the locked
 * payee and BCTI) with the `rebillOf` lineage; the ids stamped on the events.
 * Each step is its own audit entry (US-13.5.2). The original invoice, its
 * lines, the Booking, its Procedures and its lock are not written.
 */
export function issueCreditInto(draft: CreditRunDraft, creditEventId: string, atISO: string): Outcome<{ creditNoteId: string; negativeInvoiceId: string; invoiceIds: InvoiceId[]; pairIds: string[] }> {
  const planned = planCreditIssue(draft.s, creditEventId)
  if (!planned.ok) return planned
  const p = planned.value
  // The ids the ledger's credit names are held locally: the draft's counters (and the credit note number) move only once every refusal has passed.
  const cn = allocateId(draft.counters, 'creditNote')
  const neg = allocateId(cn.counters, 'negativeInvoice')
  const creditNoteId = cn.id
  const negativeInvoiceId = neg.id

  const pairNow = draft.maps.ledger[p.pair.id]!
  const credited = applyCredit(pairNow, p.reversal, { creditNoteId, negativeInvoiceId, atISO })
  if (!credited.ok) return refuse(credited.code, CREDIT_MESSAGES.alreadyCredited)
  const num = allocateId(neg.counters, 'creditNoteNumber')
  draft.counters = num.counters
  const creditNoteNumber = num.id
  draft.maps = { ...draft.maps, ledger: { ...draft.maps.ledger, [p.pair.id]: credited.pair } }

  // The replacements, through 38b's issue path, each its own invoice with the `rebillOf` lineage.
  const invoiceIds: InvoiceId[] = []
  const pairIds: string[] = []
  const rebillMetas: MutationMeta[] = []
  for (const r of p.replacements) {
    const made = issueAdditionalInto(draft.s, draft, r, atISO, {
      lineage: [{ role: 'rebillOf', invoiceId: p.original.id }],
      createAfter: { rebillOf: p.original.invoiceNumber, creditNoteNumber },
    })
    invoiceIds.push(made.invoiceId)
    pairIds.push(...made.pairIds)
    rebillMetas.push({
      entityType: 'invoice',
      entityId: made.invoiceId,
      action: 'invoice.rebilled',
      after: { invoiceNumber: draft.maps.invoices[made.invoiceId]!.invoiceNumber, rebillOf: p.original.invoiceNumber, creditNoteNumber, reason: p.credit.reason },
      stampBookingId: null,
    })
  }

  const status: NegativeInvoice['status'] = p.reversal.recoveryDue > 0 ? 'toNet' : 'offset'
  const negative: NegativeInvoice = {
    id: negativeInvoiceId,
    number: `${creditNoteNumber}-P`,
    anaesthetistId: p.anaesthetistId,
    creditNoteId,
    originalInvoiceId: p.original.id,
    pairId: p.pair.id,
    cause: 'credit',
    amount: p.reversal.negativeInvoiceTotal,
    offsetAmount: p.reversal.offsetAgainstPayable,
    recoveryDue: p.reversal.recoveryDue,
    status,
    issuedAtISO: atISO,
  }
  const delivery = deliveryStampFor(p.delivery, atISO, BILLING_RUN_SENDER)
  const note: CreditNote = {
    id: creditNoteId,
    creditNoteNumber,
    originalInvoiceId: p.original.id,
    pairId: p.pair.id,
    creditEventId,
    bookingId: p.original.bookingId,
    procedureIds: [...(p.original.procedureIds ?? [])],
    counterparty: p.party.counterparty,
    ...(p.party.billedTo !== undefined ? { billedTo: p.party.billedTo } : {}),
    ...(p.original.supplier !== undefined ? { supplier: { ...p.original.supplier } } : {}),
    ...(p.original.agent !== undefined ? { agent: { ...p.original.agent } } : {}),
    gstTreatment: p.note.gstTreatment,
    lines: p.note.lines,
    subtotal: p.note.subtotal,
    gst: p.note.gst,
    total: p.note.total,
    reason: p.credit.reason,
    cause: p.credit.cause,
    replacementInvoiceIds: [...invoiceIds],
    negativeInvoiceId,
    issuedAtISO: atISO,
    issuedBy: { who: p.event.addedBy.who, role: p.event.addedBy.role },
    delivery,
    reversal: p.reversal,
  }
  draft.creditNotes[creditNoteId] = note
  draft.negativeInvoices[negativeInvoiceId] = negative
  const event = draft.procedureEvents[creditEventId]!
  draft.procedureEvents[creditEventId] = { ...event, detail: { kind: 'credit', credit: { ...p.credit, creditNoteId, negativeInvoiceId } } }

  const metas = draft.metas
  metas.push({ entityType: 'invoice', entityId: p.original.id, action: 'invoice.credited', after: { invoiceNumber: p.original.invoiceNumber, creditNoteNumber, reason: p.credit.reason }, stampBookingId: null })
  metas.push({
    entityType: 'creditNote',
    entityId: creditNoteId,
    action: 'creditNote.create',
    after: {
      creditNoteNumber,
      originalInvoiceNumber: p.original.invoiceNumber,
      creditEventId,
      cause: p.credit.cause,
      reason: p.credit.reason,
      counterparty: note.counterparty,
      lines: note.lines,
      subtotal: note.subtotal,
      gst: note.gst,
      total: note.total,
      reversal: p.reversal,
      eventRaisedBy: p.event.addedBy.who,
    },
    stampBookingId: null,
  })
  if (delivery.status === 'sent') {
    metas.push({ entityType: 'creditNote', entityId: creditNoteId, action: 'creditNote.sent', after: { to: delivery.sends[0]?.to, atISO }, stampBookingId: null })
  } else if (delivery.status === 'toPost') {
    metas.push({ entityType: 'creditNote', entityId: creditNoteId, action: 'creditNote.toPost', after: { address: delivery.address.join(', ') }, stampBookingId: null })
  } else {
    metas.push({ entityType: 'creditNote', entityId: creditNoteId, action: 'creditNote.notSent', after: { reason: 'noAddress' }, stampBookingId: null })
  }
  metas.push({ entityType: 'ledgerPair', entityId: p.pair.id, action: 'ledger.receivableCredited', after: { creditNoteNumber, credited: p.reversal.receivableCredited, heldForPayer: p.reversal.heldForPayer }, stampBookingId: null })
  metas.push({
    entityType: 'negativeInvoice',
    entityId: negativeInvoiceId,
    action: 'negativeInvoice.create',
    after: { number: negative.number, anaesthetistId: negative.anaesthetistId, amount: negative.amount, offset: negative.offsetAmount, toNet: negative.recoveryDue, status, creditNoteNumber },
    stampBookingId: null,
  })
  metas.push({
    entityType: 'ledgerPair',
    entityId: p.pair.id,
    action: 'ledger.payableReversed',
    after: { negativeInvoiceNumber: negative.number, reversed: p.reversal.negativeInvoiceTotal, releaseCancelled: p.reversal.releaseCancelled, recoveryDue: p.reversal.recoveryDue },
    stampBookingId: null,
  })
  metas.push({ entityType: 'creditNote', entityId: creditEventId, action: 'credit.issued', after: { creditNoteId, creditNoteNumber, invoiceIds }, stampBookingId: null })
  metas.push(...rebillMetas)
  // A split (US-08.6.4): the components side by side with the credited invoice they add up to (OQ-77 part 1).
  if (p.credit.cause === 'split') {
    metas.push({
      entityType: 'invoice',
      entityId: p.original.id,
      action: 'invoice.split',
      after: {
        invoiceNumber: p.original.invoiceNumber,
        creditNoteNumber,
        componentCount: p.replacements.length,
        creditedSubtotal: p.original.subtotal,
        creditedTotal: p.original.total,
        componentNumbers: invoiceIds.map((id) => draft.maps.invoices[id]?.invoiceNumber ?? id),
        componentSubtotals: p.replacements.map((r) => r.pricing.subtotal),
        componentTotals: p.replacements.map((r) => r.pricing.total),
      },
      stampBookingId: null,
    })
  }
  return ok({ creditNoteId, negativeInvoiceId, invoiceIds, pairIds })
}

/**
 * A split component's place among its credit's replacements (US-08.6.4): its
 * event's `replaces.componentIndex` when stamped, else its order among the
 * credited invoice's replacements. Derived, never stored on the invoice.
 */
export function splitPartOf(
  state: Pick<AppState, 'billing'> & { schedule: Pick<AppState['schedule'], 'procedureEvents'> },
  invoiceId: string,
  originalId: string,
): { part: number; of: number } | undefined {
  const siblings = replacementsOf(state, originalId)
  if (siblings.length < 2) return undefined
  const event = Object.values(state.schedule.procedureEvents).find((e) => e.invoiceId === invoiceId && e.replaces !== undefined)
  const index = event?.replaces?.componentIndex ?? siblings.findIndex((s) => s.id === invoiceId)
  return index >= 0 ? { part: index + 1, of: siblings.length } : undefined
}

/** Whose Procedure this is, titled ("Dr Sharma"): `procedureOwner`'s anaesthetist, or undefined. */
export function procedureOwnerSurname(state: Pick<AppState, 'schedule' | 'billing' | 'masters'>, procedureId: string): string | undefined {
  const ownerId = procedureOwner(state, procedureId)
  const anaesthetist = ownerId !== undefined ? state.masters.anaesthetists[ownerId] : undefined
  return anaesthetist !== undefined ? drSurname(anaesthetist.name) : undefined
}

// ---------------------------------------------------------------------------
// The Booking's History (catch-up Phase 39 review)
// ---------------------------------------------------------------------------

/**
 * Every entity id whose audit trail a Booking's History merges: the Booking,
 * its Procedures and their billing lines (live, and those a `procedure.remove`
 * took with it), and its billing: its invoices, its Procedures' events (a
 * credit's own entries are audited on its event id) and its credit notes and
 * negative invoices.
 */
export function bookingHistoryEntityIds(state: Pick<AppState, 'schedule' | 'billing' | 'audit'>, bookingId: string): string[] {
  const procedureIds = Object.values(state.schedule.procedures)
    .filter((p) => p.bookingId === bookingId)
    .map((p) => p.id)
    .sort()
  for (const a of state.audit) {
    if (a.entityType !== 'procedure' || a.action !== 'procedure.remove' || procedureIds.includes(a.entityId)) continue
    if ((a.before as { bookingId?: string } | undefined)?.bookingId === bookingId) procedureIds.push(a.entityId)
  }
  const procedureSet = new Set(procedureIds)
  const lineIds = new Set(
    Object.values(state.schedule.billingLines)
      .filter((l) => procedureSet.has(l.procedureId))
      .map((l) => l.id),
  )
  for (const a of state.audit) {
    const before = a.before as { procedureId?: string } | undefined
    if (a.entityType === 'billingLine' && before?.procedureId !== undefined && procedureSet.has(before.procedureId)) lineIds.add(a.entityId)
  }
  const invoiceIds = Object.values(state.billing.invoices)
    .filter((i) => i.bookingId === bookingId)
    .map((i) => i.id)
    .sort()
  const eventIds = Object.values(state.schedule.procedureEvents)
    .filter((e) => e.bookingId === bookingId || procedureSet.has(e.procedureId))
    .map((e) => e.id)
    .sort()
  const invoiceSet = new Set(invoiceIds)
  const notes = Object.values(state.billing.creditNotes)
    .filter((c) => c.bookingId === bookingId || invoiceSet.has(c.originalInvoiceId))
    .sort((a, b) => a.id.localeCompare(b.id))
  const negativeIds = notes.flatMap((c) => (c.negativeInvoiceId !== undefined ? [c.negativeInvoiceId] : []))
  return [bookingId, ...procedureIds, ...[...lineIds].sort(), ...invoiceIds, ...eventIds, ...notes.map((c) => c.id), ...negativeIds]
}

/**
 * A Booking's History entries (catch-up Phase 39 review: a credit shows on the
 * Booking it credits): the audit entries of every id `bookingHistoryEntityIds`
 * names, less `AUDIT_VIEWER_EXCLUDED` (money moving is recorded in Xero, not
 * History), newest first. The History sheet adds the List's change sets.
 */
export function bookingHistoryEntries(state: Pick<AppState, 'schedule' | 'billing' | 'audit'>, bookingId: string): AuditEntry[] {
  const ids = new Set(bookingHistoryEntityIds(state, bookingId))
  return sortAuditNewestFirst(auditViewerEntries(state.audit.filter((a) => ids.has(a.entityId))))
}

// ---------------------------------------------------------------------------
// Session 2: the rebill from a copy (US-08.6.6)
// ---------------------------------------------------------------------------

/** An invoice's stored lines in the order the document prints them. */
function linesOf(state: Pick<AppState, 'billing'>, invoiceId: string) {
  return Object.values(state.billing.invoiceLines)
    .filter((l) => l.invoiceId === invoiceId)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
}

/**
 * The office's "Start from a copy of the original's lines" (US-08.6.6): a
 * replacement card's initial value, ready for `submitCredit`'s
 * `replacements`: `rebillDraftFrom`'s lines and "same as" party, dated the
 * later of today and the List date (38b's default). Undefined for an unknown
 * invoice. The copy is the office's only; the anaesthetist types new invoices.
 */
export function rebillReplacementFor(state: Pick<AppState, 'schedule' | 'billing' | 'clock'>, invoiceId: string): CreditReplacementInput | undefined {
  const original = state.billing.invoices[invoiceId]
  if (original === undefined) return undefined
  const booking = state.schedule.bookings[original.bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const draft = rebillDraftFrom(original, linesOf(state, invoiceId))
  return { occurredOnISO: defaultEventDate(list?.dateISO ?? state.clock.todayISO, state.clock.todayISO), party: draft.party, lines: draft.lines }
}

// ---------------------------------------------------------------------------
// Session 2: split a combined Procedure (US-08.6.4, OQ-53, OQ-77)
// ---------------------------------------------------------------------------

/**
 * The invoice a split of this Procedure credits: its first live standard
 * invoice by number (a split Procedure's per-party invoices each split on
 * their own: the sheet passes the one it opened from), else its first with a
 * credit waiting, else its first credited one (so the guard says which). A
 * credited invoice's live replacements stand in for it (`liveInvoicesForProcedure`).
 * Labelled reading (no combination marker exists, OQ-53): any live, post-paid
 * standard invoice of an invoiced Procedure can be split.
 */
export function splitTargetFor(state: Pick<AppState, 'schedule' | 'billing'>, procedureId: string): Invoice | undefined {
  const standard = Object.values(state.billing.invoices)
    .filter((i) => i.kind === 'standard' && (i.procedureIds ?? []).includes(procedureId))
    .sort(byNumber)
  // A credited invoice's live replacements stand in for it (the `rebillOf` lineage), on every Procedure it covered.
  const live = liveInvoicesForProcedure(state, procedureId)
  return live.find((i) => invoiceStanding(state, i.id) === 'live') ?? live.find((i) => invoiceStanding(state, i.id) === 'creditPending') ?? standard[0]
}

/**
 * Why this actor may not split this Procedure now (the **Split into
 * additional invoices** button's disabled sentence), or null. Office only
 * (`splitOfficeOnly`); before the invoice exists a split is a normal admin
 * edit (`notYetInvoiced`, OQ-77 part 3, D41: no credit, no path here); a
 * prepaid Procedure's only invoice is its prepayment invoice
 * (`prepaidNotSplittable`, Phase 41); then every `creditRefusalFor` refusal
 * on the target invoice (`alreadyCredited`, `correctionPending`, no pair).
 * The two-component and equal-total rules are the form's, re-checked by
 * `submitCredit`.
 */
export function canSplitCombined(state: Pick<AppState, 'schedule' | 'billing'>, procedureId: string, actor: EventActor): { code: string; message: string } | null {
  if (actor.role !== 'office') return { code: 'splitOfficeOnly', message: CREDIT_MESSAGES.splitOfficeOnly }
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (procedure === undefined || booking === undefined || list === undefined) return { code: 'notFound', message: SPLIT_MESSAGES.procedureNotFound }
  const target = list.state === 'AUTHORISED' ? splitTargetFor(state, procedureId) : undefined
  if (target === undefined) {
    const prepaid = Object.values(state.billing.invoices).some((i) => i.kind === 'prePayment' && (i.procedureIds ?? []).includes(procedureId))
    return prepaid ? { code: 'prepaidNotSplittable', message: SPLIT_MESSAGES.prepaidNotSplittable } : { code: 'notYetInvoiced', message: SPLIT_MESSAGES.notYetInvoiced }
  }
  return creditRefusalFor(state, actor, target.id, 'split', { procedureId })
}

/**
 * Split a combined Procedure after its invoice is sent (US-08.6.4): a thin
 * wrapper of `submitCredit` with `cause: 'split'`, behind `canSplitCombined`.
 * At least two components, each its own free-form additional invoice with its
 * own party, adding up to the credited invoice before GST (`splitTotalCheck`).
 * The invoice defaults to `splitTargetFor`. Raises nothing: the review step
 * and the next run issue the credit and its components together; the run
 * audits `invoice.split`.
 */
export function splitCombinedProcedure(
  api: AppStoreApi,
  actor: Actor,
  input: Omit<CreditInput, 'cause' | 'invoiceId' | 'procedureId'> & { procedureId: string; invoiceId?: InvoiceId },
): Outcome<{ creditEventId: string; replacementEventIds: string[] }> {
  const state = api.getState()
  const refused = canSplitCombined(state, input.procedureId, eventActor(actor))
  if (refused !== null) return refuse(refused.code, refused.message)
  const invoiceId = input.invoiceId ?? splitTargetFor(state, input.procedureId)!.id
  return submitCredit(api, actor, { ...input, invoiceId, cause: 'split' })
}

// ---------------------------------------------------------------------------
// Session 2: the Credit note option on a Procedure (US-08.6.5)
// ---------------------------------------------------------------------------

/**
 * Whether the **Credit note** entry shows on a Procedure for this actor, and
 * how: `hidden` on a colleague's Procedure (the store refuses it anyway) and
 * on one not invoiced yet; `hidden` with the caption "Crediting a prepayment
 * invoice is not in this prototype yet." when the Procedure's only invoice is
 * its prepayment invoice (Phase 41); `disabled` with its sentence while a
 * credit waits or once the invoice is credited (and for a no-charge invoice
 * or one with no ledger pair); else `enabled` on the invoice it credits (the
 * Procedure's live invoice, a rebill once the original is credited), with
 * `invoiceIds`: every live invoice of the Procedure this actor may credit now,
 * by number (22's fee split bills two parties, so the UI lets the user pick).
 * Where the first live invoice waits for a credit but another can still be
 * credited, `enabled` on that other one.
 */
export type CreditOption =
  | { kind: 'hidden'; caption?: string }
  | { kind: 'disabled'; invoiceId: InvoiceId; reason: string }
  | { kind: 'enabled'; invoiceId: InvoiceId; invoiceIds: InvoiceId[] }

export function creditOptionFor(state: Pick<AppState, 'schedule' | 'billing'>, actor: EventActor, procedureId: string): CreditOption {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (procedure === undefined || booking === undefined || list === undefined) return { kind: 'hidden' }
  if (!mayRaise('credit', actor, procedureOwner(state, procedureId))) return { kind: 'hidden' }
  const onProcedure = Object.values(state.billing.invoices).filter((i) => (i.procedureIds ?? []).includes(procedureId))
  if (onProcedure.length === 0) return { kind: 'hidden' }
  if (onProcedure.every((i) => i.kind === 'prePayment')) return { kind: 'hidden', caption: CREDIT_MESSAGES.prepaymentNotCreditable }
  if (list.state !== 'AUTHORISED') return { kind: 'hidden' }
  const live = liveInvoiceForProcedure(state, procedureId)
  // Credited with no live replacement: the original, disabled as credited.
  const target = live ?? splitTargetFor(state, procedureId)
  if (target === undefined) return { kind: 'hidden' }
  if (target.kind === 'prePayment') return { kind: 'hidden', caption: CREDIT_MESSAGES.prepaymentNotCreditable }
  const refused = creditRefusalFor(state, actor, target.id, 'correction', { procedureId })
  if (refused?.code === 'notOwnProcedure') return { kind: 'hidden' }
  // Every live invoice this actor may credit now, by number (more than one where 22's fee split billed two parties).
  const creditable = liveInvoicesForProcedure(state, procedureId)
    .filter((i) => creditRefusalFor(state, actor, i.id, 'correction', { procedureId }) === null)
    .map((i) => i.id)
  if (refused === null) return { kind: 'enabled', invoiceId: target.id, invoiceIds: creditable }
  // The first live invoice waits for its credit and another can still be credited: offer that one.
  if (creditable.length > 0) return { kind: 'enabled', invoiceId: creditable[0]!, invoiceIds: creditable }
  return { kind: 'disabled', invoiceId: target.id, reason: refused.message }
}

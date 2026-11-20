/**
 * Pre-op, post-op and billing events in the store (catch-up Phase 39b;
 * US-03.7.1, US-03.7.2, US-05.5.2, FT-03.7, DM-46). 38b's actions stay the one
 * write path: `addProcedureEvent`, `updateProcedureEvent` and
 * `approveProcedureEvent` hand these kinds here, as they hand a credit to
 * `creditActions.ts`. The rules are pure, in `domain/billing/prePostOpEvent.ts`,
 * `billingEvent.ts` and 38b's `procedureEvent.ts`.
 *
 * How an approved event is billed (OQ-121 answered, D69; 38b's one rule,
 * `eventInvoicing`), read for the prototype (logged for the owner):
 * - a List's own billing run (`runBillingForList`, at authorise) is a billing
 *   run: an approved, ticked event on a Procedure of that List joins the
 *   invoice the run raises for the same billable party on its Booking, as its
 *   own dated line priced from its frozen `pricing` (`planEventBundle`). The
 *   lock (25) is neither read for the event nor written;
 * - the explicit next run (`runEventInvoicing`) gives every other approved
 *   event an invoice of its own, traceable to the Procedure and its invoice
 *   (`planKindInvoice`);
 * - a credit billing event only rides on its party's invoice (a negative
 *   line); one that would take that invoice below $0.00 goes back to review.
 *
 * Immutability (US-07.3.2): nothing here writes the Booking, its Procedures or
 * its lock; every event write stamps no Booking.
 */

import type {
  BillingEventDetail,
  CounterpartyRef,
  EventParty,
  Invoice,
  InvoiceId,
  PrePostOpEventDetail,
  ProcedureEvent,
  ProcedureEventKind,
} from '../domain/types'
import { EVENT_KINDS, eventInvoicing, eventStatus, validateEventBase, type EventActor } from '../domain/billing/procedureEvent'
import {
  eventInvoiceLine,
  officePricing,
  pricePrePostOpEvent,
  typedAmountProblem,
  validatePrePostOpEvent,
  type EventPricing,
  type EventRecording,
  type PrePostOpEventType,
} from '../domain/billing/prePostOpEvent'
import { priceBillingEvent, validateBillingEvent, type BillingEventDirection } from '../domain/billing/billingEvent'
import { billablePartyForProcedure, billedToFor, invoiceDeliveryFor, isPersonParty, type DeliveryPlan } from '../domain/billing/whoIsBilled'
import { gstOn, invoiceLayoutFor, type InvoiceLineView } from '../domain/billing/invoicePresentation'
import { roundToCents, toCents } from '../domain/billing/money'
import type { DraftInvoice, LockedPayee } from '../domain/billing/lock'
import { EVENT_KIND_MESSAGES, EVENT_TYPE_LABEL, eventLineLead } from '../shared/procedureEventCopy'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { materialiseInvoices } from './invoiceMaterialise'
import {
  addProcedureEvent,
  deliveryOfOriginal,
  eventActor,
  liveInvoicesForProcedure,
  namedPartyDelivery,
  partyForAudit,
  partyFromInput,
  payeeOf,
  procedureOwner,
  resolvedPartyOf,
  type EventPartyInput,
  type EventRunWork,
} from './procedureEventActions'

type KindState = Pick<AppState, 'schedule' | 'billing' | 'masters' | 'clock'>

/** The kinds this file owns. */
export type PricedEventKind = 'preOp' | 'postOp' | 'billing'

export function isPricedKind(kind: ProcedureEventKind): kind is PricedEventKind {
  return kind === 'preOp' || kind === 'postOp' || kind === 'billing'
}

export type KindDetail = PrePostOpEventDetail | BillingEventDetail

/** The store's sentences for these kinds: one home, the copy map (`EVENT_KIND_MESSAGES` there). */
export { EVENT_KIND_MESSAGES } from '../shared/procedureEventCopy'

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** A pre-op or post-op event as a sheet hands it in. */
export interface PrePostOpEventInput {
  kind: 'preOp' | 'postOp'
  type: PrePostOpEventType
  occurredOnISO: string
  startTime?: string
  recording: EventRecording
  /** An ACC preset's code (US-05.5.2). */
  code?: string
  /** The invoice tick (on by default). */
  billable?: boolean
  party: EventPartyInput
}

/** A billing event as its sheet hands it in. */
export interface BillingEventInput {
  direction: BillingEventDirection
  description: string
  amount: number
  occurredOnISO: string
  billable?: boolean
  party: EventPartyInput
}

/** The detail stored for a pre-op or post-op input. */
export function prePostOpDetail(input: Pick<PrePostOpEventInput, 'kind' | 'type' | 'recording' | 'code'>): PrePostOpEventDetail {
  return {
    kind: input.kind,
    type: input.type,
    recording: structuredClone(input.recording),
    ...(input.code !== undefined && input.type === 'accPreOpAssessment' ? { code: input.code } : {}),
  }
}

/** The detail stored for a billing event input. */
export function billingDetail(input: Pick<BillingEventInput, 'direction' | 'description' | 'amount'>): BillingEventDetail {
  return { kind: 'billing', direction: input.direction, description: input.description.trim(), amount: roundToCents(input.amount) }
}

/** Add a pre-op or post-op event (US-03.7.1): a thin wrapper over 38b's `addProcedureEvent`, the one write path. */
export function addPrePostOpEvent(api: AppStoreApi, actor: Actor, procedureId: string, input: PrePostOpEventInput): Outcome<{ eventId: string }> {
  return addProcedureEvent(api, actor, procedureId, {
    kind: input.kind,
    occurredOnISO: input.occurredOnISO,
    ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
    billable: input.billable ?? true,
    party: input.party,
    lines: [],
    detail: prePostOpDetail(input),
  })
}

/** Add a billing event (US-03.7.2): a free-form charge or credit; a thin wrapper over 38b's `addProcedureEvent`. */
export function addBillingEvent(api: AppStoreApi, actor: Actor, procedureId: string, input: BillingEventInput): Outcome<{ eventId: string }> {
  return addProcedureEvent(api, actor, procedureId, {
    kind: 'billing',
    occurredOnISO: input.occurredOnISO,
    billable: input.billable ?? true,
    party: input.party,
    lines: [],
    detail: billingDetail(input),
  })
}

// ---------------------------------------------------------------------------
// Validation (the guard and the kind's own checks)
// ---------------------------------------------------------------------------

interface ProcedureCtx {
  procedureInvoiced: boolean
  listDateISO: string
}

function procedureCtx(state: KindState, procedureId: string): Outcome<ProcedureCtx> {
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (procedure === undefined || booking === undefined || list === undefined) return refuse('notFound', 'Procedure not found.')
  if (booking.cancellation !== undefined) return refuse('bookingCancelled', 'This Booking is cancelled.')
  // A Draft List has no anaesthetist yet (catch-up Phase 31): nobody owns the Procedure.
  if (list.anaesthetistId === undefined) return refuse('listUnassigned', EVENT_KIND_MESSAGES.listUnassigned)
  // Invoiced means a live standard invoice: a prepayment invoice alone is not the Procedure's invoice (review: money integrity).
  return ok({ procedureInvoiced: liveInvoicesForProcedure(state, procedureId).length > 0, listDateISO: list.dateISO })
}

/**
 * Whether this raiser may record this event on the Procedure: 38b's guard
 * (`validateEventBase`: who, own Procedure, the per-kind date rule, the
 * party), then the kind's own checks. Any List state from ACTIVE to billed.
 */
export function kindEventRefusal(
  state: KindState,
  raiser: EventActor,
  procedureId: string,
  input: { kind: PricedEventKind; occurredOnISO: string; startTime?: string; party: EventParty; detail: KindDetail },
  /** At approval the recorded Contract fee is not re-checked: pricing reports a fee gone (`eventFeeGone`) and the office may set a price. */
  opts: { checkFee?: boolean } = {},
): Outcome<null> {
  const pc = procedureCtx(state, procedureId)
  if (!pc.ok) return pc
  const dates = { listDateISO: pc.value.listDateISO, todayISO: state.clock.todayISO }
  const delivery = namedPartyDelivery(state, procedureId, input.party)
  const base = validateEventBase(input, input.kind, raiser, {
    ownerAnaesthetistId: procedureOwner(state, procedureId),
    ...dates,
    procedureInvoiced: pc.value.procedureInvoiced,
    ...(delivery !== undefined ? { namedPartyDelivery: delivery } : {}),
  })
  if (base !== null) return refuse(base.code, base.message, { field: base.field })
  const d = input.detail
  if (d.kind === 'billing') {
    const bad = validateBillingEvent({ direction: d.direction, description: d.description, amount: d.amount, occurredOnISO: input.occurredOnISO }, dates)
    if (bad !== null) return refuse(bad.code, bad.message, { field: bad.field })
    // A credit only rides on its party's invoice in a run; once the Procedure is invoiced, 39's credit note is the route.
    if (d.direction === 'credit' && pc.value.procedureInvoiced) return refuse('creditAfterInvoice', EVENT_KIND_MESSAGES.creditAfterInvoice, { field: 'direction' })
    return ok(null)
  }
  const bad = validatePrePostOpEvent({ kind: d.kind, type: d.type, occurredOnISO: input.occurredOnISO, ...(input.startTime !== undefined ? { startTime: input.startTime } : {}), recording: d.recording, ...(d.code !== undefined ? { code: d.code } : {}) }, dates)
  if (bad !== null) return refuse(bad.code, bad.message, { field: bad.field })
  if (opts.checkFee !== false && d.recording.kind === 'fixedFee' && d.recording.source === 'contractEventFee') {
    const procedure = state.schedule.procedures[procedureId]!
    const fee = state.masters.contractEventFees[d.recording.eventFeeId]
    if (fee === undefined || fee.contractId !== procedure.governingContractId || fee.eventType !== d.type) return refuse('feeNotOnContract', EVENT_KIND_MESSAGES.feeNotOnContract, { field: 'amount' })
  }
  return ok(null)
}

function raiserOf(event: Pick<ProcedureEvent, 'addedBy'>): EventActor {
  return { role: event.addedBy.role, ...(event.addedBy.anaesthetistId !== undefined ? { anaesthetistId: event.addedBy.anaesthetistId } : {}) }
}

function detailForAudit(detail: KindDetail): Record<string, unknown> {
  if (detail.kind === 'billing') return { direction: detail.direction, description: detail.description, amount: detail.amount }
  const r = detail.recording
  return {
    type: detail.type,
    ...(detail.code !== undefined ? { code: detail.code } : {}),
    recording: r.kind === 'time' ? `${r.minutes} min` : r.source === 'typed' ? `typed ${r.amount}` : `contract fee ${r.eventFeeId}`,
  }
}

// ---------------------------------------------------------------------------
// Writes: add and edit (called by 38b's actions)
// ---------------------------------------------------------------------------

/** What `addProcedureEvent` hands over for one of these kinds. */
export interface KindEventWrite {
  kind: PricedEventKind
  occurredOnISO: string
  startTime?: string
  billable?: boolean
  party: EventPartyInput
  detail: KindDetail
}

/**
 * Record a pre-op, post-op or billing event (`addProcedureEvent` calls this
 * for these kinds). One `mutate()`; a ticked event awaits the office's review
 * (D13); an un-ticked one is recorded and never reviewed or invoiced.
 */
export function addKindEvent(api: AppStoreApi, actor: Actor, procedureId: string, input: KindEventWrite): Outcome<{ eventId: string }> {
  const state = api.getState()
  const madeParty = partyFromInput(input.party, state.counters)
  if (!madeParty.ok) return madeParty
  const party = madeParty.value.party
  const refusal = kindEventRefusal(state, eventActor(actor), procedureId, { ...input, party })
  if (!refusal.ok) return refusal
  const procedure = state.schedule.procedures[procedureId]!
  const billable = input.billable ?? true
  let eventId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const id = allocateId(madeParty.value.counters, 'procedureEvent')
    eventId = id.id
    const event: ProcedureEvent = {
      id: id.id,
      procedureId,
      bookingId: procedure.bookingId,
      kind: input.kind,
      occurredOnISO: input.occurredOnISO,
      ...(input.startTime !== undefined && input.kind !== 'billing' ? { startTime: input.startTime } : {}),
      billable,
      party,
      detail: structuredClone(input.detail),
      review: { state: billable && EVENT_KINDS[input.kind].reviewed ? 'awaitingReview' : 'approved' },
      addedBy: { who: actor.who, role: actor.role, ...(actor.role === 'anaesthetist' && actor.anaesthetistId !== undefined ? { anaesthetistId: actor.anaesthetistId } : {}) },
      addedAtISO: clockISO(s.clock),
    }
    metas.push({
      entityType: 'procedureEvent',
      entityId: id.id,
      action: 'procedureEvent.add',
      after: {
        kind: input.kind,
        procedureId,
        bookingId: event.bookingId,
        occurredOnISO: event.occurredOnISO,
        ...(event.startTime !== undefined ? { startTime: event.startTime } : {}),
        billable,
        party: partyForAudit(party),
        ...detailForAudit(event.detail as KindDetail),
        eventRaisedBy: actor.who,
      },
      stampBookingId: null,
    })
    return { schedule: { ...s.schedule, procedureEvents: { ...s.schedule.procedureEvents, [id.id]: event } }, counters: id.counters }
  })
  return ok({ eventId })
}

/** An edit's patch for these kinds. */
export interface KindEventPatch {
  occurredOnISO?: string
  startTime?: string
  billable?: boolean
  party?: EventPartyInput
  detail?: KindDetail
}

/**
 * Edit a pre-op, post-op or billing event (`updateProcedureEvent` calls this
 * past 38b's `editGuard`): validated against its raiser; a ticked event goes
 * back to review (a declined one included), its price cleared.
 */
export function updateKindEvent(api: AppStoreApi, actor: Actor, before: ProcedureEvent, patch: KindEventPatch): Outcome<{ eventId: string }> {
  const state = api.getState()
  if (!isPricedKind(before.kind)) return refuse('kindNotAllowed', 'Not this kind.')
  const madeParty = partyFromInput(patch.party ?? before.party, state.counters)
  if (!madeParty.ok) return madeParty
  const detail = patch.detail ?? (before.detail as KindDetail)
  if (detail.kind !== before.kind) return refuse('kindChanged', 'An event keeps its kind. Remove it and add another.')
  const next = {
    kind: before.kind,
    occurredOnISO: patch.occurredOnISO ?? before.occurredOnISO,
    // An empty start time clears it (the sheet sends '' when the field is emptied).
    ...((patch.startTime ?? before.startTime ?? '') !== '' && before.kind !== 'billing' ? { startTime: (patch.startTime ?? before.startTime)! } : {}),
    party: madeParty.value.party,
    detail,
  }
  const refusal = kindEventRefusal(state, raiserOf(before), before.procedureId, next)
  if (!refusal.ok) return refusal
  const billable = patch.billable ?? before.billable
  mutate(
    api,
    actor,
    {
      entityType: 'procedureEvent',
      entityId: before.id,
      action: 'procedureEvent.update',
      before: { occurredOnISO: before.occurredOnISO, billable: before.billable, party: partyForAudit(before.party), ...detailForAudit(before.detail as KindDetail), review: before.review.state },
      after: { occurredOnISO: next.occurredOnISO, billable, party: partyForAudit(next.party), ...detailForAudit(detail), review: billable ? 'awaitingReview' : 'approved', ...(billable ? {} : { notInvoiced: true }) },
      stampBookingId: null,
    },
    (s) => {
      const current = s.schedule.procedureEvents[before.id]!
      const { pricing: _pricing, startTime: _start, ...rest } = current
      const updated: ProcedureEvent = {
        ...rest,
        occurredOnISO: next.occurredOnISO,
        ...('startTime' in next ? { startTime: next.startTime } : {}),
        billable,
        party: structuredClone(next.party),
        detail: structuredClone(detail),
        review: { state: billable ? 'awaitingReview' : 'approved' },
        updatedAtISO: clockISO(s.clock),
      }
      return { schedule: { ...s.schedule, procedureEvents: { ...s.schedule.procedureEvents, [before.id]: updated } }, counters: madeParty.value.counters }
    },
  )
  return ok({ eventId: before.id })
}

// ---------------------------------------------------------------------------
// Pricing at review
// ---------------------------------------------------------------------------

/** The office's own price at review: required on `noEventRate`, else it replaces the computed price. */
export interface OfficePriceInput {
  amount: number
  reason: string
}

/**
 * An event's price as the office would approve it now: read live from the
 * Procedure's Contract as it stands, its event fees and the owner's unit
 * value (never the Booking's lock). The review sheet shows it; approval
 * freezes it.
 */
export function eventPriceNow(
  state: Pick<AppState, 'schedule' | 'billing' | 'masters'>,
  event: Pick<ProcedureEvent, 'procedureId' | 'billable' | 'detail'>,
): { kind: 'priced'; pricing: EventPricing } | { kind: 'refused'; code: string; message: string } {
  const d = event.detail
  if (d.kind === 'billing') return priceBillingEvent({ billable: event.billable, direction: d.direction, amount: d.amount })
  if (d.kind !== 'preOp' && d.kind !== 'postOp') return { kind: 'refused', code: 'kindNotPriced', message: 'This kind is priced elsewhere.' }
  const procedure = state.schedule.procedures[event.procedureId]
  const contract = procedure?.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
  const owner = procedureOwner(state, event.procedureId)
  const unitValue = owner !== undefined ? (state.masters.anaesthetists[owner]?.unitValue ?? 0) : 0
  return pricePrePostOpEvent(
    { billable: event.billable, type: d.type, recording: d.recording },
    { contract: contract !== undefined ? { id: contract.id, pricing: contract.pricing } : undefined, eventFees: state.masters.contractEventFees, unitValue, timeRule: state.masters.rvgTimeRule },
  )
}

/**
 * The office approves a pre-op, post-op or billing event (`approveProcedureEvent`
 * calls this past 38b's review guard): re-validated against its raiser, priced
 * now and frozen in `pricing`. A `noEventRate` event needs the office's price
 * and reason. Approval raises nothing: a run does.
 */
export function approveKindEvent(api: AppStoreApi, actor: Actor, event: ProcedureEvent, opts: { officePrice?: OfficePriceInput } = {}): Outcome<{ eventId: string }> {
  const state = api.getState()
  if (!isPricedKind(event.kind)) return refuse('kindNotAllowed', 'Not this kind.')
  const refusal = kindEventRefusal(state, raiserOf(event), event.procedureId, {
    kind: event.kind,
    occurredOnISO: event.occurredOnISO,
    ...(event.startTime !== undefined ? { startTime: event.startTime } : {}),
    party: event.party,
    detail: event.detail as KindDetail,
  }, { checkFee: false })
  if (!refusal.ok) return refusal
  let pricing: EventPricing
  if (opts.officePrice !== undefined) {
    if (event.detail.kind === 'billing') return refuse('officePriceOnBilling', EVENT_KIND_MESSAGES.noOfficePriceOnBilling)
    const amount = opts.officePrice.amount
    if (!(amount === 0 || !typedAmountProblem(amount))) return refuse('officePriceInvalid', EVENT_KIND_MESSAGES.officePriceInvalid, { field: 'officePrice' })
    if (opts.officePrice.reason.trim() === '') return refuse('officeReasonRequired', EVENT_KIND_MESSAGES.officeReasonRequired, { field: 'officeReason' })
    const procedure = state.schedule.procedures[event.procedureId]!
    const contract = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
    pricing = officePricing(amount, opts.officePrice.reason, contract !== undefined ? { id: contract.id, pricing: contract.pricing } : undefined)
  } else {
    const priced = eventPriceNow(state, event)
    if (priced.kind === 'refused') return refuse(priced.code, priced.message)
    pricing = priced.pricing
  }
  mutate(
    api,
    actor,
    {
      entityType: 'procedureEvent',
      entityId: event.id,
      action: 'procedureEvent.approve',
      before: { review: 'awaitingReview' },
      after: { review: 'approved', kind: event.kind, basis: pricing.basis, amount: pricing.amount, ...(pricing.officeReason !== undefined ? { officeReason: pricing.officeReason } : {}), eventRaisedBy: event.addedBy.who },
      stampBookingId: null,
    },
    (s) => {
      const current = s.schedule.procedureEvents[event.id]!
      return {
        schedule: {
          ...s.schedule,
          procedureEvents: { ...s.schedule.procedureEvents, [event.id]: { ...current, pricing, review: { state: 'approved', by: { who: actor.who, role: actor.role }, atISO: clockISO(s.clock) } } },
        },
      }
    },
  )
  return ok({ eventId: event.id })
}

// ---------------------------------------------------------------------------
// The invoice line (one shape for the run, the own invoice and Regenerate)
// ---------------------------------------------------------------------------

/** The words of an event's invoice line, from the copy map. */
function lineWords(event: Pick<ProcedureEvent, 'detail'>, pricing: EventPricing): { lead: string; subject: string; code?: string } {
  const d = event.detail
  if (d.kind === 'billing') return { lead: eventLineLead(d, pricing.amount)!, subject: d.description }
  if (d.kind === 'preOp' || d.kind === 'postOp') return { lead: eventLineLead(d)!, subject: EVENT_TYPE_LABEL[d.type], ...(d.code !== undefined ? { code: d.code } : {}) }
  return { lead: '', subject: '' }
}

/** An approved event's invoice line, from its frozen `pricing` (undefined when it has none). */
export function eventLineView(event: Pick<ProcedureEvent, 'id' | 'procedureId' | 'occurredOnISO' | 'detail' | 'pricing'>): InvoiceLineView | undefined {
  if (event.pricing === undefined) return undefined
  const line = eventInvoiceLine(event, event.pricing, lineWords(event, event.pricing))
  return {
    procedureId: line.procedureId,
    kind: line.kind,
    description: line.description,
    amount: line.amount,
    quantity: line.quantity,
    unitAmount: line.unitAmount,
    serviceDateISO: line.serviceDateISO,
    eventId: line.eventId,
  }
}

/** The order a run adds event lines in: charges, then credits, each by id (so a credit never meets a partial total). */
export function bundleOrder<T extends Pick<ProcedureEvent, 'id' | 'pricing'>>(events: readonly T[]): T[] {
  const byId = (a: T, b: T) => a.id.localeCompare(b.id, undefined, { numeric: true })
  return [...events.filter((e) => (e.pricing?.amount ?? 0) >= 0).sort(byId), ...events.filter((e) => (e.pricing?.amount ?? 0) < 0).sort(byId)]
}

/** A draft with one more line, its subtotal, GST (at the foot, 22) and total worked again. */
export function withEventLine(draft: DraftInvoice, line: InvoiceLineView): DraftInvoice {
  const subtotal = roundToCents(draft.subtotal + line.amount)
  const gst = gstOn(subtotal)
  // The line's Procedure joins the invoice's Procedures (an event on another Procedure billed to this party), so it stays traceable.
  const procedureIds = line.procedureId !== undefined && !draft.procedureIds.includes(line.procedureId) ? [...draft.procedureIds, line.procedureId] : draft.procedureIds
  // A credit that brings the invoice to $0.00 makes it a no-charge invoice, as a $0 own invoice is (no payable leg or BCTI).
  const { noCharge: _noCharge, ...rest } = draft
  return { ...rest, lines: [...draft.lines, line], procedureIds, subtotal, gst, total: roundToCents(subtotal + gst), ...(toCents(subtotal) === 0 ? { noCharge: true as const } : {}) }
}

/** A draft a run may add an event line to: GST worked at the foot (no printed figure) and not a no-charge invoice. */
function takesEventLines(draft: DraftInvoice): boolean {
  return draft.noCharge !== true && toCents(draft.gst) === toCents(gstOn(draft.subtotal))
}

function sameRef(a: CounterpartyRef, b: CounterpartyRef): boolean {
  return a.kind === b.kind && a.id === b.id
}

// ---------------------------------------------------------------------------
// A List's billing run: bundle onto the run's invoice for the same party
// ---------------------------------------------------------------------------

export interface EventBundlePlan {
  drafts: DraftInvoice[]
  /** Events now a line on one of `drafts`. */
  bundled: string[]
  /** Credits that would take their invoice below $0.00: back to review. */
  backToReview: { eventId: string; message: string }[]
}

/**
 * Plan one Booking's event lines in a List's billing run: every approved,
 * ticked, priced, bundlable event of the Booking not yet invoiced joins the
 * draft for its billable party (`eventInvoicing` with the run's invoice for
 * that party), charges then credits; a credit that would take the draft below
 * $0.00 goes back to review. Events for a party with no draft stay approved
 * for the next run's own invoice. Pure over the state.
 */
export function planEventBundle(
  state: Pick<AppState, 'schedule' | 'billing' | 'masters'>,
  bookingId: string,
  drafts: readonly DraftInvoice[],
  /** The Booking's events, when the caller grouped them once for a whole run (full scale: never a scan per Booking). */
  bookingEvents?: readonly ProcedureEvent[],
): EventBundlePlan {
  const due = (bookingEvents ?? Object.values(state.schedule.procedureEvents)).filter(
    (e) => e.bookingId === bookingId && e.replaces === undefined && eventStatus(e) === 'approved' && e.pricing !== undefined && EVENT_KINDS[e.kind]?.mayBundle === true,
  )
  const next = drafts.map((d) => ({ ...d, lines: [...d.lines] }))
  const bundled: string[] = []
  const backToReview: EventBundlePlan['backToReview'] = []
  for (const event of bundleOrder(due)) {
    const party = resolvedPartyOf(state, event)
    if (party === undefined) continue
    const index = next.findIndex((d) => sameRef(d.counterparty, party.counterparty) && takesEventLines(d))
    if (eventInvoicing(event, { runInvoiceForParty: index >= 0 }) !== 'bundleOnRunInvoice') {
      // A credit only rides on its party's invoice: with none in this run it can never be billed, so it goes back to review.
      if ((event.pricing?.amount ?? 0) < 0) backToReview.push({ eventId: event.id, message: EVENT_KIND_MESSAGES.creditNoInvoice })
      continue
    }
    const line = eventLineView(event)!
    const draft = next[index]!
    if (draft.subtotal + line.amount < -0.005) {
      backToReview.push({ eventId: event.id, message: EVENT_KIND_MESSAGES.creditTooBig })
      continue
    }
    next[index] = withEventLine(draft, line)
    bundled.push(event.id)
  }
  return { drafts: next, bundled, backToReview }
}

/**
 * Stamp a run's bundled events with the invoice and line that carry them, and
 * send any credit too big for its invoice back to review, inside the run's
 * `mutate()`. Audits `invoice.eventLine` (event, Procedure, invoice, amount).
 */
export function stampBundledEvents(
  procedureEvents: AppState['schedule']['procedureEvents'],
  made: { invoiceIds: readonly InvoiceId[]; invoices: Record<string, Invoice>; invoiceLines: AppState['billing']['invoiceLines'] },
  plan: Pick<EventBundlePlan, 'bundled' | 'backToReview'>,
  atISO: string,
): { procedureEvents: AppState['schedule']['procedureEvents']; metas: MutationMeta[] } {
  const events = { ...procedureEvents }
  const metas: MutationMeta[] = []
  const ids = new Set(made.invoiceIds)
  const lines = Object.values(made.invoiceLines).filter((l) => ids.has(l.invoiceId) && l.eventId !== undefined)
  for (const eventId of plan.bundled) {
    const line = lines.find((l) => l.eventId === eventId)
    const event = events[eventId]
    // Never leave a billed line's event unstamped: the next run would bill it again on its own invoice.
    if (line === undefined || event === undefined) throw new Error(`Event ${eventId} was planned onto an invoice but its line is missing`)
    events[eventId] = { ...event, invoiceId: line.invoiceId, invoiceLineId: line.id }
    metas.push({
      entityType: 'invoice',
      entityId: line.invoiceId,
      action: 'invoice.eventLine',
      after: { eventId, procedureId: event.procedureId, invoiceNumber: made.invoices[line.invoiceId]?.invoiceNumber, amount: line.amount, kind: event.kind },
      stampBookingId: null,
    })
    metas.push({ entityType: 'procedureEvent', entityId: eventId, action: 'procedureEvent.invoiced', after: { invoiceId: line.invoiceId, invoiceNumber: made.invoices[line.invoiceId]?.invoiceNumber, bundled: true }, stampBookingId: null })
  }
  for (const back of plan.backToReview) {
    const event = events[back.eventId]
    if (event === undefined) continue
    // Back to review with no price: the office prices it again (a stale frozen price never reads as current).
    const { pricing: _pricing, ...rest } = event
    events[back.eventId] = { ...rest, review: { state: 'awaitingReview', reason: back.message, atISO } }
    metas.push({ entityType: 'procedureEvent', entityId: back.eventId, action: 'procedureEvent.backToReview', after: { reason: back.message }, stampBookingId: null })
  }
  return { procedureEvents: events, metas }
}

// ---------------------------------------------------------------------------
// The explicit next run: an invoice of its own
// ---------------------------------------------------------------------------

export interface PlannedKindInvoice {
  event: ProcedureEvent
  draft: DraftInvoice
  original: Invoice | undefined
  payee: LockedPayee
  sameAs: boolean
}

/**
 * Plan an approved event's own invoice in the next run (no invoice for its
 * party in the run): one dated line, addressed to its party (the original
 * invoice's addressee and address for "same as" once the Procedure is
 * invoiced, else the Procedure's billable party by 21's rules), laid out by
 * 22's rule, paying the locked payee (else the List's anaesthetist). A credit
 * never stands alone.
 */
export function planKindInvoice(state: KindState, event: ProcedureEvent): PlannedKindInvoice | { message: string; backToReview?: true } {
  const pricing = event.pricing
  if (pricing === undefined) return { message: EVENT_KIND_MESSAGES.needsPrice }
  // The guard again, as 38b's issue path re-validates: a cancelled Booking or an unassigned List raises nothing.
  const guard = procedureCtx(state, event.procedureId)
  if (!guard.ok) return { message: guard.message }
  // A credit rides only on its party's invoice in a List's run: once the Procedure is invoiced that can never happen, so it goes back to review.
  if (pricing.amount < 0) return guard.value.procedureInvoiced ? { message: EVENT_KIND_MESSAGES.creditNoInvoice, backToReview: true } : { message: EVENT_KIND_MESSAGES.creditWaits }
  const procedure = state.schedule.procedures[event.procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  if (procedure === undefined || booking === undefined) return { message: 'Procedure not found.' }
  const named = event.party.sameAs ? undefined : event.party.party
  // A live standard invoice only: a prepayment invoice is never the Procedure's original (review: money integrity).
  const live = liveInvoicesForProcedure(state, event.procedureId)
  const original = (named !== undefined ? live.find((i) => sameRef(i.counterparty, named)) : undefined) ?? live[0]
  const party = resolvedPartyOf(state, event)
  const payee = payeeOf(state, event.bookingId)
  if (party === undefined || payee === undefined) return { message: 'The billable party or payee is missing.' }
  const contract = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
  const patient = state.masters.patients[booking.patientId]
  const isProcedureParty = (() => {
    const own = billablePartyForProcedure(contract, procedure, booking.patientId, state.masters.parties)
    return own !== undefined && sameRef(own, party.counterparty)
  })()
  const delivery: DeliveryPlan =
    party.sameAs && original !== undefined
      ? deliveryOfOriginal(original)
      : !party.sameAs
        ? (namedPartyDelivery(state, event.procedureId, event.party) ?? { method: 'none' })
        : invoiceDeliveryFor(party.counterparty, [procedure], booking.patientId, patient, state.masters.parties)
  const billedTo = party.billedTo ?? (isPersonParty(party.counterparty) ? billedToFor(party.counterparty, [procedure], booking.patientId, patient) : undefined)
  const line = eventLineView(event)!
  const subtotal = roundToCents(line.amount)
  const gst = gstOn(subtotal)
  const draft: DraftInvoice = {
    counterparty: party.counterparty,
    ...(billedTo !== undefined ? { billedTo } : {}),
    layout: party.sameAs && original !== undefined ? original.layout : invoiceLayoutFor(contract, party.counterparty, isProcedureParty),
    lines: [line],
    subtotal,
    gst,
    total: roundToCents(subtotal + gst),
    ...(pricing.contractId !== undefined ? { contractId: pricing.contractId } : {}),
    procedureIds: [procedure.id],
    ...(original?.crossMatch !== undefined ? { crossMatch: { ...original.crossMatch } } : {}),
    ...(party.sameAs && original?.holderReference !== undefined ? { holderReference: original.holderReference } : {}),
    ...(toCents(subtotal) === 0 ? { noCharge: true as const } : {}),
    delivery,
  }
  return { event, draft, original, payee, sameAs: party.sameAs }
}

/**
 * Issue a planned own invoice into the run's working copies: its own number,
 * `kind: 'additional'` (38b's event-invoice kind), `eventId`, the
 * `additionalTo` lineage when the Procedure has an invoice, its own ledger
 * pair (payable to the locked payee), the event stamped.
 */
export function issueKindInvoiceInto(s: AppState, work: EventRunWork, p: PlannedKindInvoice, atISO: string): { invoiceId: InvoiceId; pairIds: string[] } {
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
      createAction: 'invoice.eventInvoiceCreated',
      payee: p.payee,
      lineage: p.original !== undefined ? [{ role: 'additionalTo', invoiceId: p.original.id }] : [],
      eventId: p.event.id,
      createAfter: {
        ...(p.original !== undefined ? { originalInvoiceNumber: p.original.invoiceNumber } : {}),
        procedureId: p.event.procedureId,
        procedure: procedure?.invoiceDescription?.text ?? procedure?.procedureText?.text ?? p.event.procedureId,
        eventKind: p.event.kind,
        eventId: p.event.id,
        eventRaisedBy: p.event.addedBy.who,
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
  return { invoiceId, pairIds: made.pairIds }
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** An invoice's event lines (derived from the lines' `eventId`, never stored on the invoice), by line id. */
export function eventLinesFor(state: Pick<AppState, 'billing'>, invoiceId: string): AppState['billing']['invoiceLines'][string][] {
  return Object.values(state.billing.invoiceLines)
    .filter((l) => l.invoiceId === invoiceId && l.eventId !== undefined)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
}

/** The events bundled onto an invoice as lines, in the order a run added them (Regenerate reads them). */
export function bundledEventsOf(state: Pick<AppState, 'schedule'>, invoiceId: string): ProcedureEvent[] {
  return bundleOrder(Object.values(state.schedule.procedureEvents).filter((e) => e.invoiceId === invoiceId && e.invoiceLineId !== undefined))
}

/**
 * Events on a Procedure: the one place their rules live (catch-up Phase 38b;
 * DM-17, D13, FT-03.7, US-08.6.3). Pure; Phase 39 (credits) and 39b (pre-op,
 * post-op and the billing event) add kinds here without reshaping the record.
 *
 * Words shown to users live in `shared/procedureEventCopy.ts`; the refusal
 * sentences here name the charge, never "event", so the name stays in one map.
 */

import type { ActorRole, CounterpartyRef, CreditEventDetail, FreeFormLine, InvoiceBilledTo, ProcedureEvent, ProcedureEventKind } from '../types'
import type { DeliveryPlan } from './whoIsBilled'
import { eventDateRefusal, type EventDateRule } from './prePostOpEvent'

/** The readings this element is built on, one field each. */
export const EVENT_RULES = {
  /** D13 (OQ-63): an event is its own element on the Procedure, never a Procedure added to the Booking. */
  model: 'ownElement',
  /** D13: one standard review step, the office's, whoever raised it (no second-person check; logged for the owner). */
  review: 'office',
  /**
   * Our reading (drift check step 3): the prototype has no scheduled batch, so
   * "the next billing run" is an explicit run of `runEventInvoicing` (the
   * Billing monitor's demo action; the PWA stand-in). A List's own authorise
   * never sweeps or creates events. The real system's run is scheduled.
   */
  nextRun: 'explicitRun',
  /** Our reading of #24: the "same as" tick is ticked by default. */
  sameAsDefault: true,
  /** Our reading: on their own Procedure the anaesthetist sees each event's total and party; no review action, invoice link or Booking total. */
  anaesthetistSees: 'ownTotalsAndParty',
} as const

export interface EventKindRules {
  /** Who may raise it. */
  addedBy: readonly ActorRole[]
  /** An anaesthetist raises it only on their own Procedure (`procedureOwner`). */
  anaesthetistOwnOnly: boolean
  /** `fixedOn`: always invoiced, no tick shown; `shown`: the tick is on the form (39b). */
  tick: 'fixedOn' | 'shown'
  /** Goes through the review step (D13). */
  reviewed: boolean
  /** May be bundled onto the run's invoice for the same party (OQ-121, D69). */
  mayBundle: boolean
  /** Only on a Procedure that already has an invoice. */
  needsInvoicedProcedure: boolean
}

/**
 * Each kind's rules. `additionalInvoice` (US-08.6.3 as changed on 2026-10-07):
 * the office on any Procedure, the anaesthetist on their own; always invoiced;
 * reviewed; always its own invoice; after invoicing only.
 * Stop-condition flips: `reviewed: false` (no review step) or `addedBy: ['office']` (office only).
 */
export const EVENT_KINDS: Readonly<Record<ProcedureEventKind, EventKindRules>> = {
  additionalInvoice: {
    addedBy: ['office', 'anaesthetist'],
    anaesthetistOwnOnly: true,
    tick: 'fixedOn',
    reviewed: true,
    mayBundle: false,
    needsInvoicedProcedure: true,
  },
  /**
   * A credit (catch-up Phase 39; US-08.6.5, OQ-61, OQ-76, D13): the office on
   * any Procedure, the anaesthetist on their own (the rule its additional
   * invoice uses); through the one review step with its replacements; issued
   * as its own credit note by the next run. The `split` cause is office only,
   * enforced in the store. Nothing raises one automatically (US-06.4.1).
   */
  credit: {
    addedBy: ['office', 'anaesthetist'],
    anaesthetistOwnOnly: true,
    tick: 'fixedOn',
    reviewed: true,
    mayBundle: false,
    needsInvoicedProcedure: true,
  },
  /**
   * Pre-op and post-op events and the billing event (catch-up Phase 39b;
   * US-03.7.1, US-03.7.2, D13, OQ-121 (D69)): the anaesthetist on their own
   * Procedure or the office, at any time from an ACTIVE List on; the invoice
   * tick shown; reviewed; bundled with the same party's invoice in a run
   * where there is one, otherwise their own. Reading (commented here as the
   * doc asks): on a Procedure split by 22's Split button, "same as" is the
   * Procedure's who-is-invoiced, and the line goes on that party's invoice,
   * never split.
   */
  preOp: { addedBy: ['anaesthetist', 'office'], anaesthetistOwnOnly: true, tick: 'shown', reviewed: true, mayBundle: true, needsInvoicedProcedure: false },
  postOp: { addedBy: ['anaesthetist', 'office'], anaesthetistOwnOnly: true, tick: 'shown', reviewed: true, mayBundle: true, needsInvoicedProcedure: false },
  billing: { addedBy: ['anaesthetist', 'office'], anaesthetistOwnOnly: true, tick: 'shown', reviewed: true, mayBundle: true, needsInvoicedProcedure: false },
}

/** Each kind's date rule (catch-up Phase 39b): a pre-op event on or before the List date; every other kind on or after it. */
export function dateRuleOf(kind: ProcedureEventKind): EventDateRule {
  return kind === 'preOp' ? 'onOrBeforeList' : 'onOrAfterList'
}

/** An event's free-form lines (an additional invoice's); none on a credit, which mirrors its original instead. */
export function eventLines(event: Pick<ProcedureEvent, 'detail'>): FreeFormLine[] {
  return event.detail.kind === 'additionalInvoice' ? event.detail.lines : []
}

/** A credit event's detail, or undefined on any other kind. */
export function creditDetailOf(event: Pick<ProcedureEvent, 'detail'> | undefined): CreditEventDetail | undefined {
  return event !== undefined && event.detail.kind === 'credit' ? event.detail.credit : undefined
}

/** The derived status: never stored. */
export type ProcedureEventStatus = 'notBillable' | 'awaitingReview' | 'declined' | 'approved' | 'invoiced'

/** Who is acting, as the rules need it. */
export interface EventActor {
  role: ActorRole
  anaesthetistId?: string
}

/** An event's status, from its record alone. A credit reads `invoiced` once its credit note is issued (catch-up Phase 39). */
export function eventStatus(event: Pick<ProcedureEvent, 'billable' | 'invoiceId' | 'review'> & { detail?: ProcedureEvent['detail'] }): ProcedureEventStatus {
  if (!event.billable) return 'notBillable'
  if (event.invoiceId !== undefined) return 'invoiced'
  if (event.detail?.kind === 'credit' && event.detail.credit.creditNoteId !== undefined) return 'invoiced'
  return event.review.state
}

/**
 * May this actor raise an event of this kind on a Procedure owned by
 * `ownerAnaesthetistId` (25's locked payee, `procedureOwner`)? The ownership
 * rule lives here, in `mayEditEvent` and in `procedureOwner` only.
 */
export function mayRaise(
  kind: ProcedureEventKind,
  actor: EventActor,
  ownerAnaesthetistId: string | undefined,
  kinds: Readonly<Record<string, EventKindRules>> = EVENT_KINDS,
): boolean {
  const rules = kinds[kind]
  if (rules === undefined || !rules.addedBy.includes(actor.role)) return false
  if (actor.role === 'anaesthetist' && rules.anaesthetistOwnOnly) {
    return actor.anaesthetistId !== undefined && actor.anaesthetistId === ownerAnaesthetistId
  }
  return true
}

/**
 * May this actor edit or remove the event? The office on any event; an
 * anaesthetist only on one they raised, on their own Procedure. Both only
 * while it awaits review or was declined.
 */
export function mayEditEvent(
  event: Pick<ProcedureEvent, 'billable' | 'invoiceId' | 'review' | 'addedBy'>,
  actor: EventActor,
  ownerAnaesthetistId: string | undefined,
): boolean {
  const status = eventStatus(event)
  // An un-ticked event (catch-up Phase 39b) is never reviewed, so it stays editable, as one awaiting review does.
  if (status !== 'awaitingReview' && status !== 'declined' && status !== 'notBillable') return false
  if (actor.role === 'office') return true
  if (actor.role !== 'anaesthetist' || actor.anaesthetistId === undefined) return false
  return event.addedBy.anaesthetistId === actor.anaesthetistId && ownerAnaesthetistId === actor.anaesthetistId
}

/** How the next run invoices an event. */
export type EventInvoicing = 'bundleOnRunInvoice' | 'ownInvoice'

/**
 * OQ-121, D69 (answered 4 November 2026): every approved, invoice-ticked event
 * is billed in the next billing run and never held for the Procedure's own
 * invoice; it is bundled onto the invoice that run raises for the same
 * billable party where there is one, otherwise it is an invoice of its own,
 * traceable to the Procedure. An additional invoice (`mayBundle: false`) is
 * always its own. Nothing else decides it.
 */
export function eventInvoicing(
  event: Pick<ProcedureEvent, 'kind'>,
  ctx: { runInvoiceForParty?: boolean },
  kinds: Readonly<Record<string, EventKindRules>> = EVENT_KINDS,
): EventInvoicing {
  const rules = kinds[event.kind]
  return rules?.mayBundle === true && ctx.runInvoiceForParty === true ? 'bundleOnRunInvoice' : 'ownInvoice'
}

/** The party an event bills, resolved. */
export interface ResolvedEventParty {
  counterparty: CounterpartyRef
  /** A person's details as at the run (the original's snapshot when "same as"; the named person's). */
  billedTo?: InvoiceBilledTo
  /** An invoice email typed for a named party: where the invoice goes. */
  invoiceEmail?: string
  sameAs: boolean
}

/**
 * An event's party (US-03.7.1): it defaults to its Procedure's. "Same as"
 * resolves to the original invoice's counterparty and person details when the
 * Procedure has an invoice, else to the Procedure's billable party (21's
 * `billablePartyForProcedure`: its own payer (22a) where its Contract bills
 * the payer, else the holder Party). A named party is returned as given.
 * Undefined when "same as" has nothing to resolve to.
 */
export function resolveEventParty(
  event: Pick<ProcedureEvent, 'party'>,
  ctx: { originalInvoice?: { counterparty: CounterpartyRef; billedTo?: InvoiceBilledTo }; procedureParty?: CounterpartyRef },
): ResolvedEventParty | undefined {
  const party = event.party
  if (!party.sameAs) {
    const person = party.person
    const billedTo: InvoiceBilledTo | undefined =
      person !== undefined
        ? {
            name: person.name,
            ...(person.email !== undefined && person.email.trim() !== '' ? { email: person.email.trim() } : {}),
            ...(person.postalAddress !== undefined ? { postalAddress: person.postalAddress } : {}),
          }
        : undefined
    const email = party.invoiceEmail?.trim()
    return {
      counterparty: party.party,
      ...(billedTo !== undefined ? { billedTo } : {}),
      ...(email !== undefined && email !== '' ? { invoiceEmail: email } : {}),
      sameAs: false,
    }
  }
  if (ctx.originalInvoice !== undefined) {
    return {
      counterparty: ctx.originalInvoice.counterparty,
      ...(ctx.originalInvoice.billedTo !== undefined ? { billedTo: ctx.originalInvoice.billedTo } : {}),
      sameAs: true,
    }
  }
  if (ctx.procedureParty !== undefined) return { counterparty: ctx.procedureParty, sameAs: true }
  return undefined
}

/** What the base validation reads from an event being raised or edited. */
export interface EventBaseInput {
  occurredOnISO: string
  party: ProcedureEvent['party']
}

export interface EventValidationContext {
  ownerAnaesthetistId: string | undefined
  /** The Procedure's List date. */
  listDateISO: string
  /** The demo clock's today. */
  todayISO: string
  /** The Procedure has a live invoice. */
  procedureInvoiced: boolean
  /** A named party's delivery plan (21's `invoiceDeliveryFor`, or the typed invoice email). */
  namedPartyDelivery?: DeliveryPlan
}

export interface EventRefusal {
  code: string
  message: string
  field?: 'occurredOnISO' | 'party' | 'lines'
}

/**
 * The checks every kind shares. Readings (drift check step 3): the charge's
 * date is on or after the List date and not after the later of today and the
 * List date (a List dated after the demo's today and authorised for a demo
 * may use its own date).
 */
export function validateEventBase(
  input: EventBaseInput,
  kind: ProcedureEventKind,
  actor: EventActor,
  ctx: EventValidationContext,
  kinds: Readonly<Record<string, EventKindRules>> = EVENT_KINDS,
): EventRefusal | null {
  const rules = kinds[kind]
  if (rules === undefined || !rules.addedBy.includes(actor.role)) {
    return { code: 'kindNotAllowed', message: 'You cannot raise this kind of charge.' }
  }
  if (!mayRaise(kind, actor, ctx.ownerAnaesthetistId, kinds)) {
    return {
      code: 'notOwnProcedure',
      message: kind === 'additionalInvoice' ? 'You can create an additional invoice only on your own Procedure.' : 'You can add this only on your own Procedure.',
    }
  }
  if (rules.needsInvoicedProcedure && !ctx.procedureInvoiced) {
    return { code: 'notInvoiced', message: 'This Procedure has no invoice yet. An additional invoice is for charges after invoicing.' }
  }
  if (kind === 'additionalInvoice' || kind === 'credit') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.occurredOnISO)) {
      return { code: 'dateInvalid', message: 'Give the date of the charge.', field: 'occurredOnISO' }
    }
    if (input.occurredOnISO < ctx.listDateISO) {
      return { code: 'dateBeforeProcedure', message: 'The charge cannot be dated before the procedure.', field: 'occurredOnISO' }
    }
    const latest = ctx.todayISO > ctx.listDateISO ? ctx.todayISO : ctx.listDateISO
    if (input.occurredOnISO > latest) {
      return { code: 'dateInFuture', message: 'The charge cannot be dated in the future.', field: 'occurredOnISO' }
    }
  } else {
    // Catch-up Phase 39b: the per-kind date rule (a pre-op event on or before the List date).
    const date = eventDateRefusal(dateRuleOf(kind), input.occurredOnISO, ctx)
    if (date !== null) {
      const message = date.code === 'dateBeforeProcedure' && kind === 'postOp' ? 'A post-op event cannot be dated before the procedure.' : date.message
      return { code: date.code, message, field: 'occurredOnISO' }
    }
  }
  if (!input.party.sameAs) {
    if (input.party.party.id.trim() === '') {
      return { code: 'partyMissing', message: 'Pick who to bill.', field: 'party' }
    }
    if (ctx.namedPartyDelivery !== undefined && ctx.namedPartyDelivery.method === 'none') {
      return { code: 'partyNoAddress', message: 'This party has no invoice email or postal address. Pick another party.', field: 'party' }
    }
  }
  return null
}

/** The default date of the charge: the later of today and the List date. */
export function defaultEventDate(listDateISO: string, todayISO: string): string {
  return todayISO > listDateISO ? todayISO : listDateISO
}

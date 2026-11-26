/**
 * The billing run (Phase 08) — the RFP's Billing Engine Integration Point.
 *
 * It acts on a single event, a List reaching AUTHORISED, and consumes the
 * whole List as a unit. Since catch-up Phase 25 it prices ONLY from each
 * Booking's pricing snapshot written at authorise (`billing.locks`,
 * `invoiceDraftsFromLock`; US-08.1.1, RV-11): no Contract, range, route or
 * payer is resolved here and nothing reads `state.masters` but the payer's
 * contact details (D116, below). A Booking with no lock, or a rejected one, fails as a whole and is held back while the rest of
 * the List bills (OQ-05); the List never fails. Each invoice's ledger pair is
 * made with it, its payable to the locked payee (catch-up Phase 36); a failed
 * Booking is a `BillingException`, never a pair. A payer with no billing
 * email or postal address, read fresh from the masters at the run (the one
 * read it makes), fails the Booking whole too (D116): nothing of it is raised,
 * however many invoices it has. Then `List.billedAtISO` is stamped.
 *
 * `billedAtISO` = COMPLETION OF THE LIST'S BILLING RUN (§11 labelled reading;
 * 3rd review #12): it is what removes the List from the anaesthetist's views.
 * A per-booking exception does not hold the List on screen (its invoice lands on
 * retry via the Phase 09 monitor), and a Xero handoff failure (Phase 10) does
 * not restore visibility.
 *
 * The whole run commits atomically through ONE `mutate()` — invoices, lines,
 * ledger pairs, exceptions, the billedAt stamp and every audit entry land together, with
 * source=system ("audit trails of manual and automated actions are required").
 *
 * Wiring: `wireBillingRun(useAppStore)` is called once at app bootstrap
 * (main.tsx). The event emitter is module-global, so the run re-checks the
 * List's state in ITS OWN store — the AUTHORISED + not-yet-billed guards make
 * a foreign store's emission a harmless no-op. Tests call `runBillingForList`
 * directly or wire explicitly and unsubscribe.
 */

import type { BillingException, BookingId, InvoiceDelivery, InvoiceId, ProcedureEvent } from '../domain/types'
import { emailProblem } from '../domain/billing/payer'
import { deliveryGapFor, materialiseInvoices, withLiveDelivery } from './invoiceMaterialise'
import { PAYER_NO_ADDRESS_CODE, PAYER_NO_ADDRESS_REASON } from '../domain/billing/billingStatus'
import { invoiceDraftsFromLock, LOCK_MISSING_MESSAGE, type BookingBuildResult } from '../domain/billing/lock'
import {
  allocateId,
  clockISO,
  mutate,
  ok,
  refuse,
  type Actor,
  type MutationMeta,
  type Outcome,
} from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { bookingsForList } from './selectors'
import { onAppEvent } from './events'
import { handoffListPairs } from './xeroHandoff'
import { settlePrepaymentsForList } from './prepaymentSettlement'
import { planEventBundle, stampBundledEvents, type EventBundlePlan } from './eventKindActions'

/**
 * A Booking's built invoices with its approved events added as lines on the
 * draft for their party (catch-up Phase 39b; OQ-121, D69: the List's run is a
 * billing run). Priced from each event's frozen `pricing`, never the lock.
 */
function withEventBundle(state: AppState, bookingId: BookingId, result: BookingBuildResult, bookingEvents?: readonly ProcedureEvent[]): { bookingId: BookingId; result: BookingBuildResult; bundle?: EventBundlePlan } {
  if (result.kind !== 'invoices') return { bookingId, result }
  const bundle = planEventBundle(state, bookingId, result.invoices, bookingEvents)
  if (bundle.bundled.length === 0 && bundle.backToReview.length === 0) return { bookingId, result }
  return { bookingId, result: { kind: 'invoices', invoices: bundle.drafts }, bundle }
}

/**
 * D116: each draft's payer read fresh; one with nowhere to be sent to fails the
 * Booking whole, its events left approved and unstamped like any other failure.
 * `send` says which details the invoices go out with when nothing is missing:
 * the List run keeps the lock's (no master edit moves an invoice, US-08.4.4),
 * taking the fresh ones only where the lock had none; a retry sends to the
 * fresh ones, so a payer fixed from the Billing tab is what it reaches.
 */
function withPayerChecked(state: Pick<AppState, 'schedule' | 'masters'>, patientId: string, built: { bookingId: BookingId; result: BookingBuildResult; bundle?: EventBundlePlan }, send: 'locked' | 'live'): { bookingId: BookingId; result: BookingBuildResult; bundle?: EventBundlePlan } {
  if (built.result.kind !== 'invoices') return built
  const locked = built.result.invoices
  const live = withLiveDelivery(state, patientId, locked)
  if (deliveryGapFor(live) !== undefined) {
    return { bookingId: built.bookingId, result: { kind: 'exception', procedureId: '', code: PAYER_NO_ADDRESS_CODE, message: PAYER_NO_ADDRESS_REASON } }
  }
  const drafts = send === 'live' ? live : locked.map((d, i) => (d.delivery === undefined || d.delivery.method === 'none' ? live[i]! : d))
  return { ...built, result: { kind: 'invoices', invoices: drafts } }
}

const BILLING_RUN_ACTOR: Actor = { who: 'Billing run', role: 'system', source: 'system' }

export interface BillingRunException {
  bookingId: BookingId
  code: string
  message: string
  /** The Procedure that failed resolution, when the failure is procedure-level. */
  procedureId?: string
}

export interface BillingRunResult {
  invoiceIds: InvoiceId[]
  exceptions: BillingRunException[]
}

/**
 * Run billing for one AUTHORISED, not-yet-billed List. Idempotent by the
 * `alreadyBilled` guard — one run per List, ever (retries of failed Bookings are
 * the Phase 09 monitor's job, against the stored `BillingException`).
 */
export function runBillingForList(api: AppStoreApi, listId: string): Outcome<BillingRunResult> {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (list.state !== 'AUTHORISED') {
    return refuse('listNotAuthorised', 'Only an authorised List can be billed.')
  }
  if (list.billedAtISO !== undefined) {
    return refuse('alreadyBilled', 'This List has already completed its billing run.')
  }

  // Decide everything first (pure), then commit once. Cancelled Bookings are
  // retained but excluded from billing entirely.
  const bookings = bookingsForList(state, listId).filter((c) => c.cancellation === undefined)
  // From the lock alone: the engine never reads a master (US-08.1.1).
  // Catch-up Phase 39b: each Booking's approved events join the run's invoice for their party (`planEventBundle`, D69).
  // The events grouped by Booking once for the whole run (full scale: never a scan of every event per Booking).
  const eventsByBooking = new Map<string, ProcedureEvent[]>()
  for (const e of Object.values(state.schedule.procedureEvents)) eventsByBooking.set(e.bookingId, [...(eventsByBooking.get(e.bookingId) ?? []), e])
  const built: { bookingId: BookingId; result: BookingBuildResult; bundle?: EventBundlePlan }[] = bookings.map((booking) =>
    withPayerChecked(state, booking.patientId, withEventBundle(state, booking.id, buildFromLock(state, booking.id), eventsByBooking.get(booking.id) ?? []), 'locked'),
  )

  const invoiceIds: InvoiceId[] = []
  const exceptions: BillingRunException[] = []
  const metas: MutationMeta[] = []

  mutate(api, BILLING_RUN_ACTOR, metas, (s) => {
    let counters = s.counters
    let procedureEvents = s.schedule.procedureEvents
    const invoices = { ...s.billing.invoices }
    const invoiceLines = { ...s.billing.invoiceLines }
    const ledger = { ...s.billing.ledger }
    const billingExceptions = { ...s.billing.exceptions }
    const atISO = clockISO(s.clock)
    let sentCount = 0
    let toPostCount = 0
    let notSentCount = 0

    for (const { bookingId, result, bundle } of built) {
      if (result.kind === 'exception') {
        const bx = allocateId(counters, 'billingException')
        counters = bx.counters
        const procedureId = result.procedureId !== '' ? result.procedureId : undefined
        // The failure is a `BillingException` (catch-up Phase 36): no invoice was raised, so no pair. The
        // Booking fails whole (OQ-05); the monitor retries against it; the audit entry is the history.
        billingExceptions[bx.id] = {
          id: bx.id,
          bookingId,
          listId,
          code: result.code,
          message: result.message,
          ...(procedureId !== undefined ? { procedureId } : {}),
          atISO,
        } satisfies BillingException
        exceptions.push({
          bookingId,
          code: result.code,
          message: result.message,
          ...(procedureId !== undefined ? { procedureId } : {}),
        })
        metas.push({
          entityType: 'booking',
          entityId: bookingId,
          action: 'booking.billingException',
          after: {
            billingExceptionId: bx.id,
            code: result.code,
            message: result.message,
            ...(procedureId !== undefined ? { procedureId } : {}),
          },
          stampBookingId: null, // AUTHORISED Bookings are locked; billing never stamps them
        })
        continue
      }

      const made = materialiseInvoices(s, counters, result.invoices, { bookingId, atISO, kind: 'standard', send: true, createAction: 'invoice.create', payee: s.billing.locks[bookingId]!.payee }, { invoices, invoiceLines, ledger })
      counters = made.counters
      const bookingInvoiceIds = made.invoiceIds
      metas.push(...made.metas)
      if (bundle !== undefined) {
        const stamped = stampBundledEvents(procedureEvents, made, bundle, atISO)
        procedureEvents = stamped.procedureEvents
        metas.push(...stamped.metas)
      }
      sentCount += made.sentCount
      toPostCount += made.toPostCount
      notSentCount += made.notSentCount

      invoiceIds.push(...bookingInvoiceIds)
      metas.push({
        entityType: 'booking',
        entityId: bookingId,
        action: 'booking.billed',
        after: { invoiceIds: bookingInvoiceIds },
        stampBookingId: null,
      })
      // Prepaid Procedures left off the final invoice, nothing deducted (catch-up Phase 27; US-08.2.2, D57).
      // An all-prepaid Booking raises no invoice and reads billed; its prepayment moves by 27a's transfer.
      const settled = s.billing.locks[bookingId]?.settledByPrepayment ?? {}
      const settledIds = Object.keys(settled)
      if (settledIds.length > 0) {
        metas.push({
          entityType: 'booking',
          entityId: bookingId,
          action: 'booking.prepaidSettled',
          after: { procedureIds: settledIds, prepaymentInvoiceIds: [...new Set(settledIds.map((id) => settled[id]!.prepaymentInvoiceId))] },
          stampBookingId: null,
        })
      }
    }

    metas.push({
      entityType: 'list',
      entityId: listId,
      action: 'list.billed',
      after: { billedAtISO: atISO, invoiceCount: invoiceIds.length, exceptionCount: exceptions.length, sentCount, toPostCount, notSentCount },
      stampBookingId: null,
    })

    return {
      billing: { ...s.billing, invoices, invoiceLines, ledger, exceptions: billingExceptions },
      schedule: {
        ...s.schedule,
        // Re-read from `s`, not the pre-run closure: if another listAuthorised
        // listener ever writes the List before this one runs, its write must
        // not be clobbered (guards make `?? list` unreachable in practice).
        lists: { ...s.schedule.lists, [listId]: { ...(s.schedule.lists[listId] ?? list), billedAtISO: atISO } },
        procedureEvents,
      },
      counters,
    }
  })

  return ok({ invoiceIds, exceptions })
}

const BILLING_RETRY_ACTOR: Actor = { who: 'Billing run (retry)', role: 'system', source: 'system' }

/**
 * Retry one billing exception (the Phase 09 monitor's Resolve and retry;
 * catch-up Phase 36). Rebuilds ONLY that Booking, from its lock alone (catch-up
 * Phase 25, payee included): nothing re-edits a master and nothing re-prices,
 * so a retry bills exactly what was locked. On success it raises the invoices
 * with their ledger pairs in one mutate, stamps the exception resolved with
 * the pairs it made, and audits `billing.exceptionResolved`. Idempotent: a
 * resolved exception refuses `alreadyResolved`; a rebuild that still fails
 * leaves it untouched. The payer is read fresh (D116): one still with no billing
 * email or postal address refuses `payerNoAddress`; a fixed one is what the
 * invoice is sent to. Office only. Never touches the List's other invoices.
 */
export function retryBillingException(api: AppStoreApi, actor: Actor, exceptionId: string): Outcome<BillingRunResult & { pairIds: string[] }> {
  const state = api.getState()
  const exception = state.billing.exceptions[exceptionId]
  if (exception === undefined) return refuse('notFound', 'Billing exception not found.')
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can retry a billing exception.')
  }
  if (exception.resolvedAtISO !== undefined) {
    return refuse('alreadyResolved', 'This billing exception is already resolved; nothing to retry.')
  }
  const bookingId = exception.bookingId
  if (state.schedule.bookings[bookingId] === undefined) return refuse('notFound', 'The billing exception has no Booking.')

  const { result, bundle } = withPayerChecked(state, state.schedule.bookings[bookingId]!.patientId, withEventBundle(state, bookingId, buildFromLock(state, bookingId)), 'live')
  // Still failing (the payer still has nowhere to be sent to, among others): leave the exception as it is.
  if (result.kind === 'exception') return refuse(result.code, result.message)
  const payee = state.billing.locks[bookingId]!.payee

  let invoiceIds: InvoiceId[] = []
  let pairIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, BILLING_RETRY_ACTOR, metas, (s) => {
    const atISO = clockISO(s.clock)
    const made = materialiseInvoices(s, s.counters, result.invoices, {
      bookingId,
      atISO,
      kind: 'standard',
      send: true,
      createAction: 'invoice.create',
      payee,
    })
    invoiceIds = made.invoiceIds
    pairIds = made.pairIds
    metas.push(...made.metas)
    const stamped = bundle !== undefined ? stampBundledEvents(s.schedule.procedureEvents, made, bundle, atISO) : undefined
    if (stamped !== undefined) metas.push(...stamped.metas)
    metas.push({
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.billed',
      after: { invoiceIds, retriedExceptionId: exceptionId },
      stampBookingId: null,
    })
    metas.push({
      entityType: 'billingException',
      entityId: exceptionId,
      action: 'billing.exceptionResolved',
      after: { pairIds: made.pairIds, invoiceIds },
      stampBookingId: null,
    })
    const resolved = { ...exception, resolvedAtISO: atISO, resolvedPairIds: [...made.pairIds] }
    return {
      billing: { ...s.billing, invoices: made.invoices, invoiceLines: made.invoiceLines, ledger: made.ledger, exceptions: { ...s.billing.exceptions, [exceptionId]: resolved } },
      ...(stamped !== undefined ? { schedule: { ...s.schedule, procedureEvents: stamped.procedureEvents } } : {}),
      counters: made.counters,
    }
  })

  return ok({ invoiceIds, exceptions: [], pairIds })
}

/** One Booking's invoices from its lock: none is `lockMissing`, a rejected one fails with its reason (US-08.5.1). */
function buildFromLock(state: Pick<AppState, 'billing'>, bookingId: BookingId): BookingBuildResult {
  const lock = state.billing.locks[bookingId]
  if (lock === undefined) return { kind: 'exception', procedureId: '', code: 'lockMissing', message: LOCK_MISSING_MESSAGE }
  // Per-booking isolation is absolute: a build error becomes a billing exception, never a throw (8th review).
  try {
    return invoiceDraftsFromLock(lock)
  } catch (error) {
    return { kind: 'exception', procedureId: '', code: 'runError', message: error instanceof Error ? error.message : 'The billing run failed on this Booking.' }
  }
}

/**
 * The office's Resend on the invoice rail (catch-up Phase 22; US-08.4.2): the
 * run already sent or queued every invoice, so this only appends a send. An
 * emailed invoice is sent again (to `to` when given, else its address); an
 * invoice with no address, or one marked to post, is emailed once an address
 * is typed (the print view stays). Office only; audited `invoice.resend`.
 */
export function resendInvoice(api: AppStoreApi, actor: Actor, invoiceId: string, opts: { to?: string } = {}): Outcome {
  const state = api.getState()
  const invoice = state.billing.invoices[invoiceId]
  if (invoice === undefined) return refuse('notFound', 'Invoice not found.')
  if (invoice.delivery === undefined) return refuse('notSendable', 'This invoice is not sent by the billing run.')
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can resend an invoice.')
  const typed = opts.to?.trim()
  const problem = typed !== undefined && typed !== '' ? emailProblem(typed) : null
  if (problem !== null) return refuse('emailInvalid', problem)
  const previous = invoice.delivery.status === 'sent' ? invoice.delivery.sends[invoice.delivery.sends.length - 1]?.to : undefined
  const to = typed !== undefined && typed !== '' ? typed : previous
  if (to === undefined) return refuse('noAddress', 'Type an email address to send this invoice to.')

  const atISO = clockISO(state.clock)
  const sends = invoice.delivery.status === 'sent' ? invoice.delivery.sends : []
  const delivery: InvoiceDelivery = { method: 'email', status: 'sent', sends: [...sends, { atISO, to, by: actor.who }] }
  mutate(
    api,
    actor,
    {
      entityType: 'invoice',
      entityId: invoiceId,
      action: 'invoice.resend',
      before: { delivery: invoice.delivery.status },
      after: { to, atISO },
      stampBookingId: null,
    },
    (s) => ({ billing: { ...s.billing, invoices: { ...s.billing.invoices, [invoiceId]: { ...invoice, delivery } } } }),
  )
  return ok(undefined)
}

/**
 * Subscribe the billing run to `listAuthorised` for one store. Call once at
 * app bootstrap for the singleton; returns the unsubscribe (tests use it). The
 * run commits synchronously, then its pairs are handed off to Xero (Phase 10),
 * then the List's prepayments move from the AA Holding account to whoever did
 * it (catch-up Phase 27a).
 */
export function wireBillingRun(api: AppStoreApi): () => void {
  return onAppEvent((event) => {
    if (event.type !== 'listAuthorised') return
    const result = runBillingForList(api, event.listId)
    if (result.ok) handoffListPairs(api, event.listId)
    // The prepayment transfer's trigger, in this one place (catch-up Phase 27a; OQ-125 open, D72,
    // provisional): the office authorising the List. If AA answers "confirmed and submitted", this
    // line moves to that event and the Billing monitor's caption changes; nothing else does.
    settlePrepaymentsForList(api, event.listId)
  })
}

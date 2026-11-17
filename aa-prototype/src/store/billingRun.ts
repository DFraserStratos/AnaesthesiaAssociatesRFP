/**
 * The billing run (Phase 08) — the RFP's Billing Engine Integration Point.
 *
 * It acts on a single event, a List reaching AUTHORISED, and consumes the
 * whole List as a unit. Since catch-up Phase 25 it prices ONLY from each
 * Booking's pricing snapshot written at authorise (`billing.locks`,
 * `invoiceDraftsFromLock`; US-08.1.1, RV-11): no Contract, range, route or
 * payer is resolved here and nothing reads `state.masters`. A Booking with no
 * lock, or a rejected one, fails as a whole and is held back while the rest of
 * the List bills (OQ-05); the List never fails. Each case is stamped with the
 * locked payee. Then `List.billedAtISO` is stamped.
 *
 * `billedAtISO` = COMPLETION OF THE LIST'S BILLING RUN (§11 labelled reading;
 * 3rd review #12): it is what removes the List from the anaesthetist's views.
 * A per-booking exception does not hold the List on screen (its invoice lands on
 * retry via the Phase 09 monitor), and a Xero handoff failure (Phase 10) does
 * not restore visibility.
 *
 * The whole run commits atomically through ONE `mutate()` — invoices, lines,
 * cases, the billedAt stamp and every audit entry land together, with
 * source=system ("audit trails of manual and automated actions are required").
 *
 * Wiring: `wireBillingRun(useAppStore)` is called once at app bootstrap
 * (main.tsx). The event emitter is module-global, so the run re-checks the
 * List's state in ITS OWN store — the AUTHORISED + not-yet-billed guards make
 * a foreign store's emission a harmless no-op. Tests call `runBillingForList`
 * directly or wire explicitly and unsubscribe.
 */

import type { BillingCase, BookingId, InvoiceDelivery, InvoiceId } from '../domain/types'
import { emailProblem } from '../domain/billing/payer'
import { materialiseInvoices } from './invoiceMaterialise'
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
import { bookingsForList, casesForList } from './selectors'
import { onAppEvent } from './events'
import { handoffCase } from './xeroHandoff'

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
 * the Phase 09 monitor's job, against the stored BillingCase).
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
  const built: { bookingId: BookingId; result: BookingBuildResult }[] = bookings.map((booking) => ({
    bookingId: booking.id,
    result: buildFromLock(state, booking.id),
  }))

  const invoiceIds: InvoiceId[] = []
  const exceptions: BillingRunException[] = []
  const metas: MutationMeta[] = []

  mutate(api, BILLING_RUN_ACTOR, metas, (s) => {
    let counters = s.counters
    const invoices = { ...s.billing.invoices }
    const invoiceLines = { ...s.billing.invoiceLines }
    const cases = { ...s.billing.cases }
    const atISO = clockISO(s.clock)
    let sentCount = 0
    let toPostCount = 0
    let notSentCount = 0

    for (const { bookingId, result } of built) {
      if (result.kind === 'exception') {
        const bc = allocateId(counters, 'billingCase')
        counters = bc.counters
        const procedureId = result.procedureId !== '' ? result.procedureId : undefined
        // The failure lives ON the case — the system of record Phase 09's
        // monitor retries against; the audit entry is the history.
        const payee = s.billing.locks[bookingId]?.payee.anaesthetistId
        cases[bc.id] = {
          id: bc.id,
          bookingId,
          ...(payee !== undefined ? { payeeAnaesthetistId: payee } : {}),
          status: 'failed',
          receivedAmount: 0,
          authorisedAmount: 0,
          disbursedAmount: 0,
          failure: {
            code: result.code,
            message: result.message,
            ...(procedureId !== undefined ? { procedureId } : {}),
          },
        } satisfies BillingCase
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
            billingCaseId: bc.id,
            code: result.code,
            message: result.message,
            ...(procedureId !== undefined ? { procedureId } : {}),
          },
          stampBookingId: null, // AUTHORISED Bookings are locked; billing never stamps them
        })
        continue
      }

      const made = materialiseInvoices(s, counters, result.invoices, { bookingId, atISO, kind: 'standard', send: true, createAction: 'invoice.create', payee: s.billing.locks[bookingId]!.payee }, { invoices, invoiceLines, cases })
      counters = made.counters
      const bookingInvoiceIds = made.invoiceIds
      metas.push(...made.metas)
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
    }

    metas.push({
      entityType: 'list',
      entityId: listId,
      action: 'list.billed',
      after: { billedAtISO: atISO, invoiceCount: invoiceIds.length, exceptionCount: exceptions.length, sentCount, toPostCount, notSentCount },
      stampBookingId: null,
    })

    return {
      billing: { ...s.billing, invoices, invoiceLines, cases },
      schedule: {
        ...s.schedule,
        // Re-read from `s`, not the pre-run closure: if another listAuthorised
        // listener ever writes the List before this one runs, its write must
        // not be clobbered (guards make `?? list` unreachable in practice).
        lists: { ...s.schedule.lists, [listId]: { ...(s.schedule.lists[listId] ?? list), billedAtISO: atISO } },
      },
      counters,
    }
  })

  return ok({ invoiceIds, exceptions })
}

const BILLING_RETRY_ACTOR: Actor = { who: 'Billing run (retry)', role: 'system', source: 'system' }

/**
 * Retry a single failed BillingCase (Phase 09 monitor). Rebuilds ONLY that
 * Booking, from its lock alone (catch-up Phase 25): nothing re-edits a master
 * and nothing re-prices, so a retry bills exactly what was locked (a wrong
 * price after invoicing is a credit note and rebill, Phase 39). On success it
 * flips the failed case to `invoiced`, reusing its id. Idempotent: a case that
 * is not `failed` is refused (a second retry after success), and a rebuild
 * that still fails leaves the case untouched. Audited source=system; office
 * only. Retrying one Booking never touches the List's other invoices.
 */
export function retryBillingCase(api: AppStoreApi, actor: Actor, caseId: string): Outcome<BillingRunResult> {
  const state = api.getState()
  const failed = state.billing.cases[caseId]
  if (failed === undefined) return refuse('notFound', 'Billing case not found.')
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can retry a failed billing case.')
  }
  if (failed.status !== 'failed') {
    return refuse('caseNotFailed', 'This billing case is not in a failed state; nothing to retry.')
  }
  const bookingId = failed.bookingId
  if (state.schedule.bookings[bookingId] === undefined) return refuse('notFound', 'The failed case has no Booking.')

  const result = buildFromLock(state, bookingId)
  // Still failing: leave the case failed, unchanged.
  if (result.kind === 'exception') return refuse(result.code, result.message)
  const payee = state.billing.locks[bookingId]!.payee

  let invoiceIds: InvoiceId[] = []
  const metas: MutationMeta[] = []
  mutate(api, BILLING_RETRY_ACTOR, metas, (s) => {
    const atISO = clockISO(s.clock)
    // The first invoice reuses the failed case's id (flip failed -> invoiced,
    // dropping its `failure`); any extra invoices allocate fresh cases.
    const made = materialiseInvoices(s, s.counters, result.invoices, {
      bookingId,
      atISO,
      kind: 'standard',
      send: true,
      createAction: 'invoice.create',
      reuseCaseId: failed.id,
      payee,
    })
    invoiceIds = made.invoiceIds
    metas.push(...made.metas)
    metas.push({
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.billed',
      after: { invoiceIds, retriedCaseId: failed.id },
      stampBookingId: null,
    })
    return { billing: { ...s.billing, invoices: made.invoices, invoiceLines: made.invoiceLines, cases: made.cases }, counters: made.counters }
  })

  return ok({ invoiceIds, exceptions: [] })
}

/** One Booking's invoices from its lock: none is `lockMissing`, a rejected one fails with its reason (US-08.5.1). */
function buildFromLock(state: Pick<AppState, 'billing'>, bookingId: BookingId): BookingBuildResult {
  const lock = state.billing.locks[bookingId]
  if (lock === undefined) return { kind: 'exception', procedureId: '', code: 'lockMissing', message: LOCK_MISSING_MESSAGE }
  // Per-booking isolation is absolute: a build error becomes a failed case, never a throw (8th review).
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
 * Hand every eligible case of a just-run List off to Xero (Phase 10). Reads the
 * committed cases via a fresh `getState()` (the run committed synchronously
 * before this), so it never depends on a second listAuthorised listener's
 * ordering (D-handoff). Idempotent per case; a fault is recorded on the case.
 */
export function handoffListCases(api: AppStoreApi, listId: string): void {
  for (const c of casesForList(api.getState(), listId)) {
    if (c.invoiceId !== undefined && c.accRecId === undefined && c.status !== 'failed') {
      handoffCase(api, c.id)
    }
  }
}

/**
 * Subscribe the billing run to `listAuthorised` for one store. Call once at
 * app bootstrap for the singleton; returns the unsubscribe (tests use it). The
 * run commits synchronously, then its cases are handed off to Xero (Phase 10).
 */
export function wireBillingRun(api: AppStoreApi): () => void {
  return onAppEvent((event) => {
    if (event.type !== 'listAuthorised') return
    const result = runBillingForList(api, event.listId)
    if (result.ok) handoffListCases(api, event.listId)
  })
}

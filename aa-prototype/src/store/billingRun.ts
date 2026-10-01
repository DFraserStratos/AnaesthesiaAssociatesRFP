/**
 * The billing run (Phase 08) — the RFP's Billing Engine Integration Point.
 *
 * It acts on a single event, a List reaching AUTHORISED, and consumes the
 * whole List as a unit: iterate Bookings and Procedures, resolve the counterparty
 * per Procedure, rate via the Phase 01 calculator, group by counterparty per
 * Booking into Invoices (+ a BillingCase each), and stamp `List.billedAtISO`.
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

import type { BillingCase, BookingId, Invoice, InvoiceId, InvoiceLine } from '../domain/types'
import {
  buildInvoicesForBooking,
  type BookingBuildResult,
  type InvoiceBuildContext,
} from '../domain/billing/invoiceBuild'
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
import type { AppStoreApi } from './appStore'
import { billingContextForBooking, bookingsForList, casesForList, prePaidByProcedure, proceduresForBooking } from './selectors'
import { getBooking } from './lifecycle'
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
  const built: { bookingId: BookingId; result: BookingBuildResult }[] = bookings.map((booking) => {
    const bookingCtx = billingContextForBooking(state, booking)
    if (bookingCtx === undefined) {
      return {
        bookingId: booking.id,
        result: {
          kind: 'exception',
          procedureId: '',
          code: 'noContext',
          message: 'Billing context could not be assembled for this Booking.',
        },
      }
    }
    // Net off any pre-payment already invoiced for this booking (Phase 09): the
    // run bills only the remaining balance (a full pre-payment nets to $0 and
    // raises no balance invoice).
    const prePaid = prePaidByProcedure(state, booking.id)
    const buildCtx: InvoiceBuildContext = {
      ...bookingCtx,
      listDateISO: list.dateISO,
      patientId: booking.patientId,
      ...(list.hospitalId !== undefined ? { listHospitalId: list.hospitalId } : {}),
      ...(Object.keys(prePaid).length > 0 ? { prePaidByProcedure: prePaid } : {}),
    }
    // Per-booking isolation is absolute: a build error becomes a failed
    // BillingCase, never a throw — the run executes inside authoriseList's
    // event emit, and a throw there would strand the List AUTHORISED-unbilled
    // with the authorise already committed (8th review).
    try {
      return {
        bookingId: booking.id,
        result: buildInvoicesForBooking(booking, proceduresForBooking(state, booking.id), buildCtx),
      }
    } catch (error) {
      return {
        bookingId: booking.id,
        result: {
          kind: 'exception',
          procedureId: '',
          code: 'runError',
          message: error instanceof Error ? error.message : 'The billing run failed on this Booking.',
        },
      }
    }
  })

  const invoiceIds: InvoiceId[] = []
  const exceptions: BillingRunException[] = []
  const metas: MutationMeta[] = []

  mutate(api, BILLING_RUN_ACTOR, metas, (s) => {
    let counters = s.counters
    const invoices = { ...s.billing.invoices }
    const invoiceLines = { ...s.billing.invoiceLines }
    const cases = { ...s.billing.cases }
    const atISO = clockISO(s.clock)

    for (const { bookingId, result } of built) {
      if (result.kind === 'exception') {
        const bc = allocateId(counters, 'billingCase')
        counters = bc.counters
        const procedureId = result.procedureId !== '' ? result.procedureId : undefined
        // The failure lives ON the case — the system of record Phase 09's
        // monitor retries against; the audit entry is the history.
        cases[bc.id] = {
          id: bc.id,
          bookingId,
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

      const bookingInvoiceIds: InvoiceId[] = []
      for (const draft of result.invoices) {
        const bc = allocateId(counters, 'billingCase')
        counters = bc.counters
        const inv = allocateId(counters, 'invoice')
        counters = inv.counters
        const num = allocateId(counters, 'invoiceNumber')
        counters = num.counters

        // The BillingCase id doubles as the internal CaseReference (links the
        // invoice back to its Booking; display-only, never the remittance key).
        const invoice: Invoice = {
          id: inv.id,
          invoiceNumber: num.id,
          caseReference: bc.id,
          bookingId,
          counterparty: draft.counterparty,
          layout: draft.layout,
          kind: 'standard',
          subtotal: draft.subtotal,
          gst: draft.gst,
          total: draft.total,
          raisedAtISO: atISO,
        }
        invoices[inv.id] = invoice
        for (const line of draft.lines) {
          const il = allocateId(counters, 'invoiceLine')
          counters = il.counters
          const stored: InvoiceLine = {
            id: il.id,
            invoiceId: inv.id,
            description: line.description,
            amount: line.amount,
          }
          if (line.procedureId !== undefined) stored.procedureId = line.procedureId
          if (line.units !== undefined) stored.units = line.units
          invoiceLines[il.id] = stored
        }
        cases[bc.id] = { id: bc.id, bookingId, invoiceId: inv.id, status: 'invoiced', receivedAmount: 0, authorisedAmount: 0, disbursedAmount: 0 } satisfies BillingCase
        bookingInvoiceIds.push(inv.id)
        metas.push({
          entityType: 'invoice',
          entityId: inv.id,
          action: 'invoice.create',
          after: {
            invoiceNumber: num.id,
            caseReference: bc.id,
            bookingId,
            counterparty: draft.counterparty,
            subtotal: draft.subtotal,
            gst: draft.gst,
            total: draft.total,
          },
          stampBookingId: null,
        })
      }

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
      after: { billedAtISO: atISO, invoiceCount: invoiceIds.length, exceptionCount: exceptions.length },
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
 * Resolve-and-retry a single failed BillingCase (Phase 09 monitor). Rebuilds
 * ONLY that Booking against current data (after the office fixed it, e.g. restored
 * a contract) and, on success, flips the failed case to `invoiced` reusing its
 * id. Idempotent: a case that is not `failed` is refused (a second retry after
 * success is a no-op), and a rebuild that still fails leaves the case untouched.
 * The rebill is a billing-engine action, so it audits source=system regardless
 * of who pressed the button; office-gated (the monitor button is office).
 *
 * Failure isolation (the recorded reading): retrying one Booking never touches the
 * List's other invoices — no duplication.
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
  const found = getBooking(state, failed.bookingId)
  if (found === undefined) return refuse('notFound', 'The failed case has no Booking.')
  const { booking, list } = found

  const bookingCtx = billingContextForBooking(state, booking)
  if (bookingCtx === undefined) return refuse('noContext', 'Billing context could not be assembled for this Booking.')
  const prePaid = prePaidByProcedure(state, booking.id)
  const buildCtx: InvoiceBuildContext = {
    ...bookingCtx,
    listDateISO: list.dateISO,
    patientId: booking.patientId,
    ...(list.hospitalId !== undefined ? { listHospitalId: list.hospitalId } : {}),
    ...(Object.keys(prePaid).length > 0 ? { prePaidByProcedure: prePaid } : {}),
  }

  let result: BookingBuildResult
  try {
    result = buildInvoicesForBooking(booking, proceduresForBooking(state, booking.id), buildCtx)
  } catch (error) {
    return refuse('runError', error instanceof Error ? error.message : 'The billing run failed on this Booking.')
  }
  if (result.kind === 'exception') {
    // Still failing — the data is not fixed. Leave the case failed unchanged.
    return refuse(result.code, result.message)
  }

  const invoiceIds: InvoiceId[] = []
  const metas: MutationMeta[] = []
  mutate(api, BILLING_RETRY_ACTOR, metas, (s) => {
    let counters = s.counters
    const invoices = { ...s.billing.invoices }
    const invoiceLines = { ...s.billing.invoiceLines }
    const cases = { ...s.billing.cases }
    const atISO = clockISO(s.clock)

    result.invoices.forEach((draft, index) => {
      // The first invoice reuses the failed case's id (flip failed -> invoiced,
      // dropping its `failure`); any extra invoices allocate fresh cases (COS is
      // single-counterparty, so this is a defensive belt).
      let bcId = failed.id
      if (index > 0) {
        const bc = allocateId(counters, 'billingCase')
        counters = bc.counters
        bcId = bc.id
      }
      const inv = allocateId(counters, 'invoice')
      counters = inv.counters
      const num = allocateId(counters, 'invoiceNumber')
      counters = num.counters

      const invoice: Invoice = {
        id: inv.id,
        invoiceNumber: num.id,
        caseReference: bcId,
        bookingId: booking.id,
        counterparty: draft.counterparty,
        layout: draft.layout,
        kind: 'standard',
        subtotal: draft.subtotal,
        gst: draft.gst,
        total: draft.total,
        raisedAtISO: atISO,
      }
      invoices[inv.id] = invoice
      for (const line of draft.lines) {
        const il = allocateId(counters, 'invoiceLine')
        counters = il.counters
        const stored: InvoiceLine = { id: il.id, invoiceId: inv.id, description: line.description, amount: line.amount }
        if (line.procedureId !== undefined) stored.procedureId = line.procedureId
        if (line.units !== undefined) stored.units = line.units
        invoiceLines[il.id] = stored
      }
      cases[bcId] = { id: bcId, bookingId: booking.id, invoiceId: inv.id, status: 'invoiced', receivedAmount: 0, authorisedAmount: 0, disbursedAmount: 0 } satisfies BillingCase
      invoiceIds.push(inv.id)
      metas.push({
        entityType: 'invoice',
        entityId: inv.id,
        action: 'invoice.create',
        after: { invoiceNumber: num.id, caseReference: bcId, bookingId: booking.id, counterparty: draft.counterparty, total: draft.total },
        stampBookingId: null,
      })
    })

    metas.push({
      entityType: 'booking',
      entityId: booking.id,
      action: 'booking.billed',
      after: { invoiceIds, retriedCaseId: failed.id },
      stampBookingId: null,
    })

    return { billing: { ...s.billing, invoices, invoiceLines, cases }, counters }
  })

  return ok({ invoiceIds, exceptions: [] })
}

/**
 * Mark an invoice emailed (the RFP: invoices are "printed" and emailed from
 * the Billing Engine — the demo marks the send and badges it as simulated).
 * Direct-claim insurer invoices are refused: nib presentation runs through
 * their upload portal instead.
 */
export function markInvoiceEmailed(api: AppStoreApi, actor: Actor, invoiceId: string): Outcome {
  const state = api.getState()
  const invoice = state.billing.invoices[invoiceId]
  // Guard order per the lifecycle convention (authoriseList): entity, then its
  // intrinsic/state facts, then the actor's role.
  if (invoice === undefined) return refuse('notFound', 'Invoice not found.')
  if (invoice.counterparty.kind === 'insurer') {
    return refuse(
      'uploadPortal',
      'Direct claim insurer invoices are presented via the insurer upload portal, not emailed.',
    )
  }
  if (invoice.emailedAtISO !== undefined) {
    return refuse('alreadyEmailed', 'This invoice has already been marked emailed.')
  }
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can mark an invoice emailed.')
  }

  const emailedAtISO = clockISO(state.clock)
  mutate(
    api,
    actor,
    {
      entityType: 'invoice',
      entityId: invoiceId,
      action: 'invoice.email',
      after: { emailedAtISO },
      stampBookingId: null,
    },
    (s) => ({
      billing: {
        ...s.billing,
        invoices: { ...s.billing.invoices, [invoiceId]: { ...invoice, emailedAtISO } },
      },
    }),
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

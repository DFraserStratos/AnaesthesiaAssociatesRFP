/**
 * Pre-payment office actions (Phase 09; B7).
 *
 *  - `raisePreProcedureInvoice` produces the pre-procedure invoice through the
 *    normal document pipeline (an `Invoice{kind:'prePayment'}` + line(s) + a
 *    `BillingCase{status:'invoiced'}`), covering only the patient-funded
 *    (BillableParty-route `selfFundedPrepayment`) procedures. It NEVER stamps
 *    `list.billedAtISO` — this is a pre-day invoice, not the billing run. It is
 *    refused once the List is AUTHORISED or billed (the balance run would then
 *    have already billed the full amount, so raising a deposit too would double
 *    charge), and is idempotent (refused if a pre-payment invoice already exists).
 *
 *  - `overridePrepaymentGate` records the office's real-world "proceed anyway"
 *    call (a browser prototype cannot itself verify a payment): it writes
 *    `Booking.prepaymentOverride` with a mandatory reason, audited and shown as a
 *    flagged override everywhere the Booking appears. It lifts the completion gate
 *    (2nd review #6; the settled hard-gate + audited-override ruling).
 *
 * OPEN QUESTION surfaced in UI copy: the RFP leaves the pre-payment timing vs
 * the AUTHORISED billing trigger open; this is the prototype's proposed reading
 * (pre-invoice pre-day, balance at the run).
 */

import type { BillingCase, Invoice, InvoiceLine, PrepaymentOverride } from '../domain/types'
import {
  buildPrePaymentInvoiceForBooking,
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
import {
  billingContextForBooking,
  bookingRequiresPrepayment,
  prePaymentInvoicesForBooking,
  proceduresForBooking,
} from './selectors'
import { getBooking } from './lifecycle'
import { handoffCasesForBooking } from './xeroHandoff'

/**
 * Raise the pre-procedure invoice for a Booking's patient-funded portion.
 * Office-only; refused on an AUTHORISED/billed List and idempotent.
 */
export function raisePreProcedureInvoice(
  api: AppStoreApi,
  actor: Actor,
  bookingId: string,
): Outcome<{ invoiceIds: string[] }> {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found

  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office raises a pre-procedure invoice.')
  }
  if (booking.cancellation !== undefined) {
    return refuse('bookingCancelled', 'This Booking is cancelled; no pre-payment invoice is raised.')
  }
  // Refuse once the List is authorised or billed: the balance run would then
  // have billed the full amount, so a deposit invoice too would double charge.
  if (list.state === 'AUTHORISED' || list.billedAtISO !== undefined) {
    return refuse(
      'listBilled',
      'This List is already authorised or billed. Raising a pre-payment invoice now would double charge; the balance is billed by the run.',
    )
  }
  if (!bookingRequiresPrepayment(state, bookingId)) {
    return refuse('notPrepayment', 'This Booking has no self funded pre-payment procedure to invoice.')
  }
  if (prePaymentInvoicesForBooking(state, bookingId).length > 0) {
    return refuse('alreadyRaised', 'A pre-payment invoice has already been raised for this Booking.')
  }

  const bookingCtx = billingContextForBooking(state, booking)
  if (bookingCtx === undefined) {
    return refuse('noContext', 'Billing context could not be assembled for this Booking.')
  }
  const buildCtx: InvoiceBuildContext = {
    ...bookingCtx,
    listDateISO: list.dateISO,
    patientId: booking.patientId,
    ...(list.hospitalId !== undefined ? { listHospitalId: list.hospitalId } : {}),
  }
  const built = buildPrePaymentInvoiceForBooking(booking, proceduresForBooking(state, bookingId), buildCtx)
  if (built.kind === 'exception') {
    return refuse(built.code, built.message)
  }
  if (built.invoices.length === 0) {
    return refuse('notPrepayment', 'This Booking has no self funded pre-payment procedure to invoice.')
  }

  const invoiceIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = s.counters
    const invoices = { ...s.billing.invoices }
    const invoiceLines = { ...s.billing.invoiceLines }
    const cases = { ...s.billing.cases }
    const atISO = clockISO(s.clock)

    for (const draft of built.invoices) {
      const bc = allocateId(counters, 'billingCase')
      counters = bc.counters
      const inv = allocateId(counters, 'invoice')
      counters = inv.counters
      const num = allocateId(counters, 'invoiceNumber')
      counters = num.counters

      const invoice: Invoice = {
        id: inv.id,
        invoiceNumber: num.id,
        caseReference: bc.id,
        bookingId,
        counterparty: draft.counterparty,
        layout: draft.layout,
        kind: 'prePayment',
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
      invoiceIds.push(inv.id)
      metas.push({
        entityType: 'invoice',
        entityId: inv.id,
        action: 'invoice.raisePrePayment',
        after: {
          invoiceNumber: num.id,
          caseReference: bc.id,
          bookingId,
          counterparty: draft.counterparty,
          subtotal: draft.subtotal,
          total: draft.total,
        },
        // The Booking is not stamped: raising a pre-invoice is not a Booking edit and
        // must not restamp lastModified (nor is the List billed).
        stampBookingId: null,
      })
    }

    return { billing: { ...s.billing, invoices, invoiceLines, cases }, counters }
  })

  // Hand the pre-invoice case(s) off to Xero as a full ACCREC+ACCPAY pair
  // (D-pre-invoice-pair) once the raise has committed. Idempotent.
  handoffCasesForBooking(api, bookingId)

  return ok({ invoiceIds })
}

/**
 * Record an office override of the pre-payment completion gate (audited, with a
 * mandatory reason). Lifts the block; shown as a flagged override wherever the
 * Booking appears. Blocked on an AUTHORISED List (its Bookings are locked).
 */
export function overridePrepaymentGate(
  api: AppStoreApi,
  actor: Actor,
  bookingId: string,
  reason: string,
): Outcome {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found

  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can override the pre-payment gate.')
  }
  if (reason.trim() === '') {
    return refuse('reasonRequired', 'An override reason is required.')
  }
  if (list.state === 'AUTHORISED') {
    return refuse('listAuthorised', 'This List is authorised and its Bookings are locked.')
  }
  if (!bookingRequiresPrepayment(state, bookingId)) {
    return refuse('notPrepayment', 'This Booking does not require pre-payment; there is nothing to override.')
  }
  if (booking.prepaymentOverride !== undefined) {
    return refuse('alreadyOverridden', 'The pre-payment gate is already overridden on this Booking.')
  }

  const override: PrepaymentOverride = { reason: reason.trim(), by: actor.who, atISO: clockISO(state.clock) }
  mutate(
    api,
    actor,
    {
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.prepaymentOverride',
      after: { reason: override.reason },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        bookings: { ...s.schedule.bookings, [bookingId]: { ...booking, prepaymentOverride: override } },
      },
    }),
  )
  return ok(undefined)
}

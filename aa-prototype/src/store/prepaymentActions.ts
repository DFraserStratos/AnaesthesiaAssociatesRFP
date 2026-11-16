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
 *  An unpaid prepayment never blocks completion (catch-up Phase 15a; D5,
 *  OQ-57): it raises the `prepaymentUnpaid` warning (`domain/warnings`). The
 *  July completion gate and its audited override are gone.
 *
 * OPEN QUESTION surfaced in UI copy: the RFP leaves the pre-payment timing vs
 * the AUTHORISED billing trigger open; this is the prototype's proposed reading
 * (pre-invoice pre-day, balance at the run).
 */

import { listHospitalFor } from '../domain/listPairing'
import {
  buildPrePaymentInvoiceForBooking,
  type InvoiceBuildContext,
} from '../domain/billing/invoiceBuild'
import { materialiseInvoices } from './invoiceMaterialise'
import {
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
    return refuse('notPrepayment', 'This booking has no procedure on a prepaid Contract.')
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
    ...listHospitalFor(list, state.masters.hospitals),
  }
  const built = buildPrePaymentInvoiceForBooking(booking, proceduresForBooking(state, bookingId), buildCtx)
  if (built.kind === 'exception') {
    return refuse(built.code, built.message)
  }
  if (built.invoices.length === 0) {
    return refuse('notPrepayment', 'This booking has no procedure on a prepaid Contract.')
  }

  let invoiceIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    // Today the office raises the prepayment invoice itself, so it is sent as
    // it is raised; Phase 27 raises it unsent and sends it on admin approval
    // (D6) through the same materialiser's separate send step.
    const made = materialiseInvoices(s, s.counters, built.invoices, {
      bookingId,
      atISO: clockISO(s.clock),
      kind: 'prePayment',
      send: true,
      createAction: 'invoice.raisePrePayment',
    })
    invoiceIds = made.invoiceIds
    metas.push(...made.metas)
    return { billing: { ...s.billing, invoices: made.invoices, invoiceLines: made.invoiceLines, cases: made.cases }, counters: made.counters }
  })

  // Hand the pre-invoice case(s) off to Xero as a full ACCREC+ACCPAY pair
  // (D-pre-invoice-pair) once the raise has committed. Idempotent.
  handoffCasesForBooking(api, bookingId)

  return ok({ invoiceIds })
}

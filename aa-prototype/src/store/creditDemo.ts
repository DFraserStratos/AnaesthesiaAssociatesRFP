/**
 * Demo trigger bodies for credits (catch-up Phase 39 session 2, work item 14),
 * in the store so the PWA build reaches them (`pwaPurity`). Each acts through
 * the product's own store actions, so every write is guarded and audited.
 *
 * - "Stage combined procedure": a billed, post-paid Merivale combination on a
 *   past, empty List a Merivale surgeon sits on, so its invoice can be split.
 * - "Stage refund after payout": the invoice paid in full and its payable paid
 *   out in Xero, so a following credit raises a negative invoice to net.
 * - The PWA stand-in "Office reviews this credit": the office approves the
 *   oldest credit awaiting review on the Booking, with its replacements, and
 *   the next run issues it (narrowed to that credit).
 */

import { ANAE } from '../domain/seed'
import { PAT, PAT_39 } from '../domain/seed/patients'
import { PRICED_ITEM } from '../domain/seed/pricedItems'
import { projectedListId } from '../domain/slots'
import type { Invoice, InvoiceId } from '../domain/types'
import { roundToCents } from '../domain/billing/money'
import { eventStatus } from '../domain/billing/procedureEvent'
import { CREDIT_DEMO_COPY } from '../shared/procedureEventCopy'
import { drSurname } from '../shared/format'
import { createBooking } from './bookingActions'
import { confirmNoModifiers } from './modifierActions'
import { authoriseList, cancelBooking, completeBooking, submitList } from './lifecycle'
import { approveProcedureEvent, liveInvoiceForProcedure, runEventInvoicing } from './procedureEventActions'
import { invoiceStanding, reviewRowsAwaiting } from './creditActions'
import { pairForInvoice } from './ledgerSelectors'
import { deliverPaymentWebhook } from './paymentActions'
import { approveAndPayPairForDemo } from './payablesActions'
import { xeroAvailable } from './xeroGate'
import { OFFICE_ACTOR, OFFICE_SIMULATION_ACTOR } from './demoActors'
import { ok, refuse, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

// ---------------------------------------------------------------------------
// Stage combined procedure
// ---------------------------------------------------------------------------

/**
 * The staged combination (picked at the drift check by a one-off seed query):
 * Dr Delaney's Fri 10 Jul PM List at Forte with Ms G. Lim, a Merivale surgeon,
 * past, ACTIVE, empty and on no S1 to S5 beat. Its patient is the dedicated
 * pinned `PAT_39.combined`; its Procedure is priced from Merivale's
 * "Facelift plus 2 add ons (eg bleph & fat grafting)" Contract, post-paid and
 * held by the rooms, which is not billed, so the patient is.
 */
export const COMBINED_DEMO = {
  listId: projectedListId(ANAE.delaney, '2026-07-10', 'PM'),
  patientId: PAT_39.combined,
  contractId: PRICED_ITEM.merFaceLift2,
  procedureText: 'Facelift, upper blepharoplasty and fat grafting',
  scheduledTime: '13:30',
} as const

/** The staged combination's Booking, Procedure and invoice, once staged. */
export function stagedCombined(state: Pick<AppState, 'schedule' | 'billing'>): { bookingId: string; procedureId?: string; invoice?: Invoice } | undefined {
  const booking = Object.values(state.schedule.bookings).find((b) => b.listId === COMBINED_DEMO.listId && b.patientId === COMBINED_DEMO.patientId && b.cancellation === undefined)
  if (booking === undefined) return undefined
  const procedure = Object.values(state.schedule.procedures).find((p) => p.bookingId === booking.id)
  const invoice = Object.values(state.billing.invoices)
    .filter((i) => i.kind === 'standard' && i.bookingId === booking.id)
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))[0]
  return { bookingId: booking.id, ...(procedure !== undefined ? { procedureId: procedure.id } : {}), ...(invoice !== undefined ? { invoice } : {}) }
}

/** Why "Stage combined procedure" cannot run, or null. */
export function stageCombinedRefusal(state: Pick<AppState, 'schedule' | 'billing' | 'masters'>): string | null {
  if (stagedCombined(state) !== undefined) return CREDIT_DEMO_COPY.alreadyStaged
  const list = state.schedule.lists[COMBINED_DEMO.listId]
  if (list === undefined) return 'The combination List is not present in this seed.'
  if (list.state !== 'ACTIVE') return 'The combination List is no longer open.'
  if (state.masters.patients[COMBINED_DEMO.patientId] === undefined) return 'The combination patient is not present in this seed.'
  return null
}

/**
 * Stage a billed Merivale combination: one Booking for the dedicated patient
 * (the payer filled from the patient by `createBooking`, 22a), its Procedure
 * on the combination Contract, the modifiers answered "None apply", completed,
 * the List submitted and authorised (locked, billed by the run and handed to
 * Xero) as the office, exactly as stage-post-op does. A Booking that cannot be
 * completed is cancelled, so it never reads as "Already staged".
 */
export function stageCombinedProcedure(api: AppStoreApi): Outcome<{ bookingId: string; procedureId: string; invoiceId: InvoiceId; invoiceNumber: string }> {
  const refused = stageCombinedRefusal(api.getState())
  if (refused !== null) return refuse('unavailable', refused)
  const patient = api.getState().masters.patients[COMBINED_DEMO.patientId]!
  const actor = OFFICE_ACTOR
  const made = createBooking(api, actor, COMBINED_DEMO.listId, {
    patient: { nhi: patient.nhi, name: patient.name, dobISO: patient.dobISO },
    sourceText: { text: COMBINED_DEMO.procedureText, source: 'email' },
    governingContractId: COMBINED_DEMO.contractId,
    scheduledTime: COMBINED_DEMO.scheduledTime,
  })
  if (!made.ok) return made
  const { bookingId } = made.value
  const procedureId = Object.values(api.getState().schedule.procedures).find((p) => p.bookingId === bookingId)!.id
  const answered = confirmNoModifiers(api, actor, procedureId)
  const completed = answered.ok ? completeBooking(api, actor, bookingId) : answered
  if (!completed.ok) {
    cancelBooking(api, actor, bookingId, 'Demo staging did not complete')
    return completed
  }
  const submitted = submitList(api, actor, COMBINED_DEMO.listId)
  if (!submitted.ok) return submitted
  const authorised = authoriseList(api, actor, COMBINED_DEMO.listId)
  if (!authorised.ok) return refuse(authorised.code, `Refused: ${authorised.message}`)
  const invoice = stagedCombined(api.getState())?.invoice
  if (invoice === undefined) return refuse('notBilled', 'Authorised, but the billing run raised no invoice for it.')
  return ok({ bookingId, procedureId, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber })
}

// ---------------------------------------------------------------------------
// Stage refund after payout
// ---------------------------------------------------------------------------

/** Sarah Mitchell's first episode (38b's `stage-post-op` List): Dr Sharma's Tue 14 Jul AM. */
export const POST_OP_LIST_ID = projectedListId(ANAE.sharma, '2026-07-14', 'AM')

/** Sarah Mitchell's live invoice once `stage-post-op` has run (a rebill once credited), else undefined. */
export function mitchellLiveInvoice(state: Pick<AppState, 'schedule' | 'billing'>): Invoice | undefined {
  if (state.schedule.lists[POST_OP_LIST_ID]?.state !== 'AUTHORISED') return undefined
  const booking = Object.values(state.schedule.bookings).find((b) => b.listId === POST_OP_LIST_ID && b.patientId === PAT.mitchell && b.cancellation === undefined)
  const procedure = booking !== undefined ? Object.values(state.schedule.procedures).find((p) => p.bookingId === booking.id) : undefined
  if (procedure === undefined) return undefined
  return liveInvoiceForProcedure(state, procedure.id) ?? Object.values(state.billing.invoices).find((i) => i.kind === 'standard' && (i.procedureIds ?? []).includes(procedure.id))
}

/** The invoice "Stage refund after payout" acts on: the URL's invoice, else (the Billing monitor) Sarah Mitchell's. */
export function refundAfterPayoutTarget(state: Pick<AppState, 'schedule' | 'billing'>, invoiceId: string | undefined): string | undefined {
  return invoiceId ?? mitchellLiveInvoice(state)?.id
}

/** Why "Stage refund after payout" cannot run on this invoice (undefined: the Billing monitor's Sarah Mitchell), or null. */
export function refundAfterPayoutRefusal(state: AppState, invoiceId: string | undefined): string | null {
  const targetId = refundAfterPayoutTarget(state, invoiceId)
  if (targetId === undefined) return invoiceId === undefined ? CREDIT_DEMO_COPY.stagePostOpFirst : 'Open an invoice first'
  if (state.billing.aaFeeInvoices[targetId] !== undefined) return CREDIT_DEMO_COPY.kindNotHere
  const invoice = state.billing.invoices[targetId]
  if (invoice === undefined) return 'Open an invoice first'
  if (invoice.kind === 'prePayment') return CREDIT_DEMO_COPY.kindNotHere
  const standing = invoiceStanding(state, targetId)
  if (standing === 'credited') return CREDIT_DEMO_COPY.invoiceCredited
  if (standing === 'creditPending') return CREDIT_DEMO_COPY.creditWaiting
  const pair = pairForInvoice(state, targetId)
  if (pair === undefined || pair.payable === undefined || pair.receivable.xeroAccRecId === undefined || pair.payable.xeroAccPayId === undefined) return 'Not handed off to Xero'
  if (roundToCents(pair.payable.disbursedAmount) >= roundToCents(pair.payable.amount) && pair.payable.amount > 0) return CREDIT_DEMO_COPY.alreadyPaidOut
  if (!xeroAvailable(state)) return 'Xero is unavailable: restore it first'
  return null
}

/**
 * Pay the invoice in full and pay its anaesthetist out (US-08.6.5's paid-out
 * case): the rest of the balance through 14's payment webhook (keyed
 * `STAGE-REFUND-<accRecId>`, so a replay is a no-op), then the office
 * approves a one-line staged run in this week and Xero pays it with the
 * bill-paid webhook delivered (catch-up Phase 39a's
 * `approveAndPayPairForDemo`), so the engine records the disbursement. A following credit's negative
 * invoice then has the whole amount to net.
 */
export function stageRefundAfterPayout(api: AppStoreApi, invoiceId: string | undefined): Outcome<{ invoiceId: string; invoiceNumber: string; payee: string; paidOut: number }> {
  const refused = refundAfterPayoutRefusal(api.getState(), invoiceId)
  if (refused !== null) return refuse('unavailable', refused)
  const targetId = refundAfterPayoutTarget(api.getState(), invoiceId)!
  const before = pairForInvoice(api.getState(), targetId)!
  const accRecId = before.receivable.xeroAccRecId!
  const accRec = api.getState().xero.accRecs[accRecId]
  const remaining = accRec !== undefined ? roundToCents(accRec.amountDue - accRec.amountReceived) : 0
  if (remaining > 0) {
    const paid = deliverPaymentWebhook(api, { accRecId, amount: remaining, idempotencyKey: `STAGE-REFUND-${accRecId}` })
    if (!paid.ok) return paid
  }
  // The office approves a one-line staged run first (catch-up Phase 39a: no payout skips approval), then Xero pays it.
  const out = approveAndPayPairForDemo(api, OFFICE_SIMULATION_ACTOR, before.id)
  if (!out.ok) return out
  const state = api.getState()
  const lock = state.billing.locks[state.billing.invoices[targetId]!.bookingId]
  const payee = drSurname(lock?.payee.name ?? 'the anaesthetist')
  return ok({ invoiceId: targetId, invoiceNumber: state.billing.invoices[targetId]!.invoiceNumber, payee, paidOut: out.value.totalDisbursed })
}

// ---------------------------------------------------------------------------
// The PWA stand-in: Office reviews this credit
// ---------------------------------------------------------------------------

/** The oldest credit awaiting review on a Booking (a credit, never a replacement). */
function oldestCreditAwaitingOn(state: Pick<AppState, 'schedule'>, bookingId: string): string | undefined {
  return reviewRowsAwaiting(state).find((r) => r.event.kind === 'credit' && r.event.bookingId === bookingId)?.event.id
}

export function officeReviewsCreditRefusal(state: Pick<AppState, 'schedule'>, bookingId: string): string | null {
  return oldestCreditAwaitingOn(state, bookingId) === undefined ? CREDIT_DEMO_COPY.noCreditAwaiting : null
}

/**
 * The PWA's office stand-in for a credit: approve the oldest credit awaiting
 * review on this Booking with its replacements (38b's review step), then issue
 * it in the next billing run, narrowed to it (its replacements go with it, and
 * the run hands the correction to Xero).
 */
export function officeReviewsCredit(api: AppStoreApi, bookingId: string): Outcome<{ creditNoteNumber: string; invoiceNumbers: string[] }> {
  const eventId = oldestCreditAwaitingOn(api.getState(), bookingId)
  if (eventId === undefined) return refuse('nothingAwaiting', CREDIT_DEMO_COPY.noCreditAwaiting)
  const approved = approveProcedureEvent(api, OFFICE_SIMULATION_ACTOR, eventId)
  if (!approved.ok) return approved
  const run = runEventInvoicing(api, OFFICE_SIMULATION_ACTOR, { eventIds: [eventId] })
  if (!run.ok) return refuse(run.code, `Approved by the office, not yet issued: ${run.message}`)
  const creditNoteId = run.value.creditNoteIds[0]
  const state = api.getState()
  if (creditNoteId === undefined || eventStatus(state.schedule.procedureEvents[eventId]!) !== 'invoiced') {
    return refuse('notIssued', `Approved by the office, not yet issued: ${run.value.skipped[0]?.message ?? 'the run skipped it'}`)
  }
  return ok({
    creditNoteNumber: state.billing.creditNotes[creditNoteId]?.creditNoteNumber ?? creditNoteId,
    invoiceNumbers: run.value.invoiceIds.map((id) => state.billing.invoices[id]?.invoiceNumber ?? id),
  })
}

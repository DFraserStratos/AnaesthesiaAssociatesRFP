/**
 * Demo staging for a prepayment settled automatically (catch-up Phase 41;
 * US-06.5.2, US-06.3.7, US-06.3.6), the bodies of three demo triggers:
 *  - "Payment arrives after the credit note": on a cancelled Booking whose
 *    prepayment invoice was credited unpaid, the payer pays the invoice total
 *    anyway (the simulated bank feed, through `receivePayment`), and the store
 *    refunds it at once.
 *  - "Change Contract after prepayment sent": the office moves the prepaid
 *    Procedure onto a Contract that is not prepaid (`setProcedureContract`),
 *    so the store credits the prepayment invoice and refunds what was paid.
 *  - "Office sends a prepayment reminder" (the PWA's office stand-in):
 *    `sendPrepaymentReminder` as the simulated office.
 * Deterministic: candidates in a stable order, idempotency keys from ids and
 * counts, never the clock or randomness.
 */

import type { AppState, AppStoreApi } from './appStore'
import { ok, refuse, type Actor, type Outcome } from './mutate'
import { receivePayment } from './paymentActions'
import { setProcedureContract } from './contractSelectionActions'
import { remindablePrepaymentInvoices, reminderAddressFor, sendPrepaymentReminder, REMINDER_MESSAGES } from './prepaymentActions'
import { pairForInvoice } from './ledgerSelectors'
import { prePaymentInvoicesForBooking, prepaidHeldFor } from './selectors'
import { isPrepaidContract } from '../domain/billing/prepayment'
import { formatMoney } from '../domain/billing/money'

export const PREPAYMENT_SETTLEMENT_DEMO_COPY = {
  lateOnlyCancelled: 'Only on a cancelled booking with a credited, unpaid prepayment',
  lateRefunded: (amount: number) => `Late payment of ${formatMoney(amount)} refunded to the payer.`,
  noSentPrepayment: 'No sent prepayment on this booking',
  listAuthorised: 'This List is authorised',
  noNonPrepaidContract: 'No Contract that is not prepaid is on offer for this procedure',
  contractChanged: (contractName: string, creditNoteNumber: string | undefined) =>
    creditNoteNumber !== undefined
      ? `The office moved the procedure to ${contractName}. Prepayment invoice credited as ${creditNoteNumber}, and anything paid refunded from the AA Holding account.`
      : `The office moved the procedure to ${contractName}.`,
  noUnpaidPrepayment: 'No unpaid prepayment on this booking',
  noInvoiceEmail: 'No invoice email for the payer',
  reminderSent: 'Reminder sent by the AA office',
} as const

type DemoState = Pick<AppState, 'schedule' | 'billing' | 'masters' | 'xero'>

// ---------------------------------------------------------------------------
// Payment arrives after the credit note (US-06.5.2 AC)
// ---------------------------------------------------------------------------

/**
 * The prepayment invoice a late payment lands on: on a cancelled Booking,
 * credited by the cancellation while unpaid (no refund yet against it), its
 * receivable mirrored to Xero.
 */
export function latePaymentTarget(state: Pick<AppState, 'schedule' | 'billing'>, bookingId: string | undefined): { invoiceId: string; accRecId: string; amount: number } | undefined {
  const booking = bookingId !== undefined ? state.schedule.bookings[bookingId] : undefined
  if (booking === undefined || booking.cancellation === undefined) return undefined
  const refunds = Object.values(state.billing.prepaymentRefunds)
  for (const invoice of prePaymentInvoicesForBooking(state, booking.id)) {
    const note = Object.values(state.billing.creditNotes).find((c) => c.originalInvoiceId === invoice.id)
    if (note === undefined || note.cause !== 'prepaymentCancelled') continue
    if (refunds.some((r) => r.prepaymentInvoiceId === invoice.id)) continue
    const accRecId = pairForInvoice(state, invoice.id)?.receivable.xeroAccRecId
    if (accRecId === undefined) continue
    return { invoiceId: invoice.id, accRecId, amount: invoice.total }
  }
  return undefined
}

export function latePaymentRefusal(state: Pick<AppState, 'schedule' | 'billing'>, bookingId: string | undefined): string | null {
  return latePaymentTarget(state, bookingId) === undefined ? PREPAYMENT_SETTLEMENT_DEMO_COPY.lateOnlyCancelled : null
}

/** The payer pays the credited invoice's total through the simulated bank feed; the store refunds it at once. */
export function stageLatePrepaymentPayment(api: AppStoreApi, bookingId: string | undefined): Outcome<{ amount: number; refundId: string }> {
  const state = api.getState()
  const target = latePaymentTarget(state, bookingId)
  if (target === undefined) return refuse('notStageable', PREPAYMENT_SETTLEMENT_DEMO_COPY.lateOnlyCancelled)
  const lateCount = Object.values(state.billing.prepaymentRefunds).filter((r) => r.prepaymentInvoiceId === target.invoiceId && r.cause === 'latePayment').length
  const before = new Set(Object.keys(state.billing.prepaymentRefunds))
  const out = receivePayment(api, { accRecId: target.accRecId, amount: target.amount, idempotencyKey: `demo-late-${target.invoiceId}-${lateCount + 1}`, source: 'webhook' })
  if (!out.ok) return out
  const refund = Object.values(api.getState().billing.prepaymentRefunds).find((r) => !before.has(r.id) && r.cause === 'latePayment')
  if (refund === undefined) return refuse('notRefunded', 'The payment was not refunded.')
  return ok({ amount: refund.amount, refundId: refund.id })
}

// ---------------------------------------------------------------------------
// Change Contract after prepayment sent (US-06.3.7, D67)
// ---------------------------------------------------------------------------

/** The first Procedure on the Booking a sent, standing prepayment invoice covers, with that invoice. */
function heldProcedure(state: DemoState, bookingId: string): { procedureId: string; invoiceId: string } | undefined {
  const held = prepaidHeldFor(state, bookingId)
  const procedureId = Object.keys(held).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0]
  return procedureId !== undefined ? { procedureId, invoiceId: held[procedureId]!.prepaymentInvoiceId } : undefined
}

export function contractChangeRefusal(state: DemoState, bookingId: string | undefined): string | null {
  const booking = bookingId !== undefined ? state.schedule.bookings[bookingId] : undefined
  if (booking === undefined || booking.cancellation !== undefined || heldProcedure(state, booking.id) === undefined) return PREPAYMENT_SETTLEMENT_DEMO_COPY.noSentPrepayment
  if (state.schedule.lists[booking.listId]?.state === 'AUTHORISED') return PREPAYMENT_SETTLEMENT_DEMO_COPY.listAuthorised
  return null
}

/** The Contracts that are not prepaid, insurers' first (the seeded insurer Contract), then the rest, each by id. */
function nonPrepaidCandidates(state: DemoState): string[] {
  const insurer = (holderId: string) => (state.masters.parties[holderId]?.kind === 'insurer' ? 0 : 1)
  return Object.values(state.masters.contracts)
    .filter((c) => !isPrepaidContract(c))
    .sort((a, b) => insurer(a.holderId) - insurer(b.holderId) || a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map((c) => c.id)
}

/**
 * As the office, move the prepaid Procedure onto the first Contract that is
 * not prepaid the rail's own guard accepts (a refused pick writes nothing),
 * so the store credits the prepayment invoice in full and refunds what was
 * received. Settles once: then nothing sent is left on the Booking.
 */
export function stagePrepaidContractChange(api: AppStoreApi, actor: Actor, bookingId: string | undefined): Outcome<{ procedureId: string; contractId: string; creditNoteNumber?: string }> {
  const state = api.getState()
  const refusal = contractChangeRefusal(state, bookingId)
  if (refusal !== null) return refuse('notStageable', refusal)
  const held = heldProcedure(state, bookingId!)!
  for (const contractId of nonPrepaidCandidates(state)) {
    if (!setProcedureContract(api, actor, held.procedureId, contractId).ok) continue
    const note = Object.values(api.getState().billing.creditNotes).find((c) => c.originalInvoiceId === held.invoiceId && c.cause === 'prepaidContractChanged')
    return ok({ procedureId: held.procedureId, contractId, ...(note !== undefined ? { creditNoteNumber: note.creditNoteNumber } : {}) })
  }
  return refuse('noCandidate', PREPAYMENT_SETTLEMENT_DEMO_COPY.noNonPrepaidContract)
}

// ---------------------------------------------------------------------------
// Office sends a prepayment reminder (the PWA's office stand-in; US-06.3.6)
// ---------------------------------------------------------------------------

/** The first unpaid or part-paid prepayment invoice on the Booking with an invoice email for its payer. */
function reminderTarget(state: DemoState, bookingId: string): string | undefined {
  return remindablePrepaymentInvoices(state, bookingId).find((id) => {
    const invoice = state.billing.invoices[id]
    return invoice !== undefined && reminderAddressFor(invoice) !== undefined
  })
}

export function standInReminderRefusal(state: DemoState, bookingId: string | undefined): string | null {
  const booking = bookingId !== undefined ? state.schedule.bookings[bookingId] : undefined
  if (booking === undefined || booking.cancellation !== undefined) return PREPAYMENT_SETTLEMENT_DEMO_COPY.noUnpaidPrepayment
  const list = state.schedule.lists[booking.listId]
  if (list !== undefined && (list.state === 'AUTHORISED' || list.billedAtISO !== undefined)) return REMINDER_MESSAGES.listAuthorised
  if (remindablePrepaymentInvoices(state, booking.id).length === 0) return PREPAYMENT_SETTLEMENT_DEMO_COPY.noUnpaidPrepayment
  if (reminderTarget(state, booking.id) === undefined) return PREPAYMENT_SETTLEMENT_DEMO_COPY.noInvoiceEmail
  return null
}

/** Send the reminder as the simulated office, to the first payer it can reach. */
export function sendReminderAsOfficeStandIn(api: AppStoreApi, actor: Actor, bookingId: string | undefined): Outcome<{ invoiceId: string; to: string }> {
  const state = api.getState()
  const refusal = standInReminderRefusal(state, bookingId)
  if (refusal !== null) return refuse('notStageable', refusal)
  return sendPrepaymentReminder(api, actor, bookingId!, { invoiceId: reminderTarget(state, bookingId!)! })
}

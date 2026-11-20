/**
 * A Booking's prepayments settled automatically (catch-up Phase 41; US-06.5.2,
 * US-06.3.7, D56, D67), as the Booking's prepayment panel reads them: each
 * prepayment invoice credited by a cancellation or by the office changing the
 * Contract off prepaid, with its credit note and every refund the system paid
 * against it out of the AA Holding account (the cancellation's, the Contract
 * change's and any late payment's). On a cancelled Booking a prepayment the
 * office credited by hand before the cancel shows too, since the cancel
 * refunded what it held. Pure: the panel feeds it the store's slices.
 */

import type { AppState } from '../../store'
import type { CreditCause, PrepaymentRefund } from '../../domain/types'
import { prePaymentInvoicesForBooking } from '../../store/selectors'

export type SettlementState = {
  billing: Pick<AppState['billing'], 'invoices' | 'creditNotes' | 'prepaymentRefunds'>
  schedule: Pick<AppState['schedule'], 'bookings'>
}

export interface SettledPrepayment {
  invoiceId: string
  invoiceNumber: string
  /** The prepayment invoice's payer by name, as the invoice holds it. */
  payerName?: string
  creditNoteId: string
  creditNoteNumber: string
  cause: CreditCause
  /** Refunds paid against this credit, oldest first. */
  refunds: Pick<PrepaymentRefund, 'id' | 'amount' | 'paidAtISO' | 'cause'>[]
}

const SETTLED_BY: ReadonlySet<CreditCause> = new Set<CreditCause>(['prepaymentCancelled', 'prepaidContractChanged'])

/** The Booking's settled prepayments, by credit note number. Empty when none was settled. */
export function settledPrepaymentsFor(state: SettlementState, bookingId: string): SettledPrepayment[] {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return []
  const cancelled = booking.cancellation !== undefined
  const invoices = prePaymentInvoicesForBooking(state, bookingId)
  if (invoices.length === 0) return []
  const refunds = Object.values(state.billing.prepaymentRefunds ?? {})
  const out: SettledPrepayment[] = []
  for (const invoice of invoices) {
    const note = Object.values(state.billing.creditNotes).find((c) => c.originalInvoiceId === invoice.id)
    if (note === undefined) continue
    const own = refunds
      .filter((r) => r.creditNoteId === note.id)
      .sort((a, b) => a.paidAtISO.localeCompare(b.paidAtISO) || a.id.localeCompare(b.id, undefined, { numeric: true }))
    // A by-hand credit (39's) shows here only once a cancellation refunded what it held; otherwise 41's settlement block owns it.
    if (!SETTLED_BY.has(note.cause) && !(cancelled && own.length > 0)) continue
    out.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      ...(invoice.billedTo?.name !== undefined ? { payerName: invoice.billedTo.name } : {}),
      creditNoteId: note.id,
      creditNoteNumber: note.creditNoteNumber,
      cause: note.cause,
      refunds: own.map((r) => ({ id: r.id, amount: r.amount, paidAtISO: r.paidAtISO, cause: r.cause })),
    })
  }
  return out.sort((a, b) => a.creditNoteNumber.localeCompare(b.creditNoteNumber, undefined, { numeric: true }))
}

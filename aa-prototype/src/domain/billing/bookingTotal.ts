/**
 * The office's Booking total with its events (catch-up Phase 38b; US-03.1.10,
 * Proposed). Pure: each Procedure's price (24's, as the Booking total already
 * computes it) and the events recorded on it.
 *
 * Our reading (logged for the owner; the story leaves both open): every
 * invoice-ticked event counts, including an additional invoice that is an
 * invoice of its own, whether awaiting review, approved or invoiced (a
 * declined or not-billable one does not); the total is ex GST with its GST
 * beside. Nothing is ever written to the Booking.
 */

import type { ProcedureEvent } from '../types'
import { freeFormSubtotal } from './additionalInvoice'
import { gstOn } from './invoicePresentation'
import { roundToCents } from './money'
import { eventLines, eventStatus } from './procedureEvent'

export interface BookingTotalWithEvents {
  procedures: { procedureId: string; price: number; events: { eventId: string; total: number }[] }[]
  /** The events' part of the total, ex GST. */
  eventsTotal: number
  /** Every Procedure's price plus its counted events, ex GST. */
  total: number
  gst: number
  totalIncGst: number
}

/** Does an event count toward the Booking total? Invoice-ticked and not declined. */
export function countsTowardBookingTotal(event: Pick<ProcedureEvent, 'billable' | 'invoiceId' | 'review'>): boolean {
  const status = eventStatus(event)
  return status === 'awaitingReview' || status === 'approved' || status === 'invoiced'
}

/** `bookingPrice` is the Booking's own price where it is not the plain sum (the multi-procedure rule's total); else the prices are summed. */
export function bookingTotalWithEvents(prices: readonly { procedureId: string; price: number }[], events: readonly ProcedureEvent[], opts: { bookingPrice?: number } = {}): BookingTotalWithEvents {
  const procedures = prices.map((p) => ({
    procedureId: p.procedureId,
    price: p.price,
    events: events
      .filter((e) => e.procedureId === p.procedureId && countsTowardBookingTotal(e))
      .map((e) => ({ eventId: e.id, total: freeFormSubtotal(eventLines(e)) })),
  }))
  const eventsTotal = roundToCents(procedures.reduce((sum, p) => sum + p.events.reduce((s, e) => s + e.total, 0), 0))
  const price = opts.bookingPrice ?? procedures.reduce((sum, p) => sum + p.price, 0)
  const total = roundToCents(price + eventsTotal)
  const gst = gstOn(total)
  return { procedures, eventsTotal, total, gst, totalIncGst: roundToCents(total + gst) }
}

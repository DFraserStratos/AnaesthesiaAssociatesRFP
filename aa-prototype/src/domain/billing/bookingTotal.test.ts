import { describe, expect, it } from 'vitest'
import type { ProcedureEvent } from '../types'
import { bookingTotalWithEvents } from './bookingTotal'

function ev(id: string, procedureId: string, amount: number, over: Partial<ProcedureEvent> = {}): ProcedureEvent {
  return {
    id,
    procedureId,
    bookingId: 'B1',
    kind: 'additionalInvoice',
    occurredOnISO: '2026-07-15',
    billable: true,
    party: { sameAs: true },
    detail: { kind: 'additionalInvoice', lines: [{ description: 'Post-op review', quantity: 1, unitAmount: amount }] },
    review: { state: 'awaitingReview' },
    addedBy: { who: 'Kirsty W.', role: 'office' },
    addedAtISO: '2026-07-21T09:00:00',
    ...over,
  }
}

describe('bookingTotalWithEvents (US-03.1.10)', () => {
  const prices = [
    { procedureId: 'P1', price: 1200 },
    { procedureId: 'P2', price: 400 },
  ]
  it('Total: $1,200 and $400 give $1,600, GST beside', () => {
    expect(bookingTotalWithEvents(prices, [])).toEqual({
      procedures: [
        { procedureId: 'P1', price: 1200, events: [] },
        { procedureId: 'P2', price: 400, events: [] },
      ],
      eventsTotal: 0,
      total: 1600,
      gst: 240,
      totalIncGst: 1840,
    })
  })
  it('Events shown: a post-op event adds its amount within its Procedure, in every counted state', () => {
    const events = [ev('EV1', 'P2', 30), ev('EV2', 'P2', 45, { review: { state: 'approved' } }), ev('EV3', 'P1', 10, { review: { state: 'approved' }, invoiceId: 'I1' })]
    const r = bookingTotalWithEvents(prices, events)
    expect(r.procedures[1]!.events).toEqual([{ eventId: 'EV1', total: 30 }, { eventId: 'EV2', total: 45 }])
    expect(r.procedures[0]!.events).toEqual([{ eventId: 'EV3', total: 10 }])
    expect(r.eventsTotal).toBe(85)
    expect(r.total).toBe(1685)
    expect(r.gst).toBe(252.75)
  })
  it('takes the Booking\'s own price where given (the multi-procedure total)', () => {
    expect(bookingTotalWithEvents(prices, [ev('EV1', 'P1', 30)], { bookingPrice: 1500 })).toMatchObject({ eventsTotal: 30, total: 1530, gst: 229.5, totalIncGst: 1759.5 })
  })
  it('a declined or not-billable event adds nothing', () => {
    const r = bookingTotalWithEvents(prices, [ev('EV1', 'P1', 30, { review: { state: 'declined', reason: 'x' } }), ev('EV2', 'P1', 30, { billable: false })])
    expect(r.total).toBe(1600)
    expect(r.procedures[0]!.events).toEqual([])
  })
})

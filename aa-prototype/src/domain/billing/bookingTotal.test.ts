import { describe, expect, it } from 'vitest'
import type { ProcedureEvent } from '../types'
import { bookingTotalWithEvents } from './bookingTotal'

function ev(id: string, procedureId: string, amount: number, over: Partial<ProcedureEvent> = {}): ProcedureEvent {
  return {
    id,
    procedureId,
    bookingId: 'B1',
    kind: 'additionalInvoice',
    occurredOnISO: '2026-11-18',
    billable: true,
    party: { sameAs: true },
    detail: { kind: 'additionalInvoice', lines: [{ description: 'Post-op review', quantity: 1, unitAmount: amount }] },
    review: { state: 'awaitingReview' },
    addedBy: { who: 'Kirsty W.', role: 'office' },
    addedAtISO: '2026-11-24T09:00:00',
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

  describe('a credit (catch-up Phase 39 review): the credited invoice counts once', () => {
    const credit = (id: string, review: ProcedureEvent['review'], over: Partial<ProcedureEvent> = {}): ProcedureEvent =>
      ev(id, 'P1', 0, {
        kind: 'credit',
        detail: { kind: 'credit', credit: { originalInvoiceId: 'I1', reason: 'Wrong amount', cause: 'correction', replacementEventIds: ['EV2'] } },
        review,
        ...over,
      })
    const rebill = (review: ProcedureEvent['review']) => ev('EV2', 'P1', 200, { review, replaces: { creditEventId: 'EVC', originalInvoiceId: 'I1' } })
    const invoices = { I1: { subtotal: 207 } }
    const one = [{ procedureId: 'P1', price: 207 }]

    it('a $207 invoice credited and rebilled at $200 totals $200, awaiting review, approved and issued', () => {
      for (const review of [{ state: 'awaitingReview' }, { state: 'approved' }] as ProcedureEvent['review'][]) {
        const r = bookingTotalWithEvents(one, [credit('EVC', review), rebill(review)], { invoices })
        expect(r.procedures[0]!.events).toEqual([{ eventId: 'EVC', total: -207 }, { eventId: 'EV2', total: 200 }])
        expect(r.total).toBe(200)
      }
      const issued = bookingTotalWithEvents(
        one,
        [credit('EVC', { state: 'approved' }, { detail: { kind: 'credit', credit: { originalInvoiceId: 'I1', reason: 'x', cause: 'correction', replacementEventIds: ['EV2'], creditNoteId: 'CN1' } } }), { ...rebill({ state: 'approved' }), invoiceId: 'I2' }],
        { invoices },
      )
      expect(issued.total).toBe(200)
    })

    it('a declined credit takes nothing off', () => {
      const r = bookingTotalWithEvents(one, [credit('EVC', { state: 'declined', reason: 'No' }), rebill({ state: 'declined', reason: 'No' })], { invoices })
      expect(r.total).toBe(207)
    })
  })
})

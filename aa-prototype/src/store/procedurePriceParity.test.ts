/**
 * Catch-up Phase 24 parity (work item 1, W13): every seeded price, Booking
 * total, invoice and prepayment build and BCTI count against
 * `__parity__/phase-24-baseline.json`, written from the code as Phase 23 left
 * it before Phase 24 replaced the price with one function. The fixture never
 * changes and this suite is never run with `-u`. The declared differences:
 *   - the seeded history Procedures on AUTHORISED Lists price at the amount
 *     their invoices carry (the ladder's first rung, `authorisedPriceFor`,
 *     INTERIM until 25), where the old engine recomputed them from their
 *     recorded units; their seeded invoices were written by hand and never
 *     matched the engine. Their rebuilt invoices print that amount as one line;
 *   - BK0179's typed $1,200 (the office's fixed fee with a reason, now the one
 *     typed price) prints as one fee line at $1,200, where it printed its RVG
 *     line and a "Price override, {reason}" adjustment. Its total is unchanged.
 *   - session 2 (`__parity__/phase24Declared.ts`): the rate x time line is gone
 *     and Aria is RVG at its own rate, so Fitzgerald's Wed 15 Jul Aria Booking
 *     moves from 3.0 hours at $480 ($1,440) to 22 units at $26.50 ($583.00), and
 *     both Aria Bookings' text drops "individually arranged hourly rate".
 * Nothing else moves: every other price, total, line, unit and BCTI count.
 */

import { describe, expect, it } from 'vitest'
import baselineJson from './__parity__/phase-24-baseline.json'
import { capturePhase24, type Phase24Baseline } from './__parity__/phase24Capture'
import { freshAppState } from './appStore'
import { PRICING_BOOKING_IDS, SEED_MARKERS } from '../domain/seed'
import { PHASE_24_ARIA_BOOKINGS } from './__parity__/phase24Declared'

const baseline = baselineJson as unknown as Phase24Baseline
const state = freshAppState()
const now = capturePhase24(state)

const typedBooking = SEED_MARKERS['typedPriceBooking']!.entityId
const authorisedListIds = new Set(Object.values(state.schedule.lists).filter((l) => l.state === 'AUTHORISED').map((l) => l.id))
const heldBookings = new Set(Object.values(state.schedule.bookings).filter((b) => authorisedListIds.has(b.listId) && !PRICING_BOOKING_IDS.includes(b.id)).map((b) => b.id))
/** Every declared Booking: the AUTHORISED history and the two Aria Bookings. */
const declared = (bookingId: string) => heldBookings.has(bookingId) || PHASE_24_ARIA_BOOKINGS.has(bookingId)

/** The amount each Procedure's standard invoices carry (the AUTHORISED rung's interim read). */
function invoicedAmount(procedureId: string): number {
  let sum = 0
  for (const line of Object.values(state.billing.invoiceLines)) {
    if (line.procedureId !== procedureId) continue
    if (state.billing.invoices[line.invoiceId]?.kind !== 'standard') continue
    sum += line.amount
  }
  return Math.round(sum * 100) / 100
}

describe('Phase 24 price parity', () => {
  it('the declared AUTHORISED set is the seeded history: 42 Procedures, every one on an AUTHORISED List with an invoice', () => {
    const held = now.fees.filter((r) => heldBookings.has(r.bookingId))
    expect(held).toHaveLength(42)
    expect(held.every((r) => r.procedureId.startsWith('HP'))).toBe(true)
  })

  it('every other seeded price is as before: total, charged units, B, T and M, the price status and the computed price', () => {
    expect(now.fees.filter((r) => !declared(r.bookingId))).toEqual(baseline.fees.filter((r) => !declared(r.bookingId)))
  })

  it('a history Procedure on an AUTHORISED List prices at its invoiced amount, its units and computed price unchanged', () => {
    for (const row of now.fees.filter((r) => heldBookings.has(r.bookingId))) {
      const before = baseline.fees.find((r) => r.procedureId === row.procedureId)!
      expect(row, row.procedureId).toEqual({ ...before, total: invoicedAmount(row.procedureId) })
    }
  })

  it('every other Booking total is as before', () => {
    expect(now.bookingTotals.filter((r) => !declared(r.bookingId))).toEqual(baseline.bookingTotals.filter((r) => !declared(r.bookingId)))
  })

  it('every other invoice and prepayment build is as before: grouping, totals, line amounts, units and wording', () => {
    const skip = (id: string) => declared(id) || id === typedBooking
    expect(now.bookings.filter((r) => !skip(r.bookingId))).toEqual(baseline.bookings.filter((r) => !skip(r.bookingId)))
  })

  it("BK0179's typed $1,200 prints as one fee line at the price, its invoice total unchanged", () => {
    const before = baseline.bookings.find((r) => r.bookingId === typedBooking)!
    const after = now.bookings.find((r) => r.bookingId === typedBooking)!
    if (before.result.kind !== 'invoices' || after.result.kind !== 'invoices') throw new Error('expected invoices')
    expect(after.result.invoices.map((i) => [i.counterparty, i.subtotal, i.total])).toEqual(before.result.invoices.map((i) => [i.counterparty, i.subtotal, i.total]))
    expect(before.result.invoices[0]!.lines.map((l) => l.kind)).toEqual(['fee', 'adjustment'])
    expect(after.result.invoices[0]!.lines.map((l) => [l.kind, l.amount])).toEqual([['fee', 1200]])
    expect(now.fees.find((r) => r.bookingId === typedBooking)).toMatchObject({ total: 1200, computed: 265.5 })
  })

  it("Fitzgerald's Aria Booking moves from $1,440 (3.0 hours at $480) to $583.00 (22 units at $26.50); the uncaptured Mon 27 one stays $0.00", () => {
    const fitz = SEED_MARKERS['contractRateBooking']!.entityId
    expect(baseline.bookingTotals.find((r) => r.bookingId === fitz)?.total).toBe(1440)
    expect(now.bookingTotals.find((r) => r.bookingId === fitz)?.total).toBe(583)
    expect(now.fees.find((r) => r.bookingId === fitz)).toMatchObject({ total: 583, billableUnits: 22, b: 8, t: 14, m: 0 })
    const capture = SEED_MARKERS['contractRateCaptureBooking']!.entityId
    expect(now.bookingTotals.find((r) => r.bookingId === capture)).toEqual(baseline.bookingTotals.find((r) => r.bookingId === capture))
  })

  it("session 2's additions price as seeded: the range beat's typed $2,950.00 and invoiced $3,100.00, the no-charge $0.00, the discount Booking 10% off", () => {
    const fee = (marker: string) => now.fees.find((r) => r.bookingId === SEED_MARKERS[marker]!.entityId)
    expect(fee('rangeTypedBooking')).toMatchObject({ total: 2950, computed: 3100 })
    expect(fee('rangeAuthorisedBooking')).toMatchObject({ total: 3100, computed: 3100 })
    expect(fee('noChargeBooking')).toMatchObject({ total: 0, needsPrice: false })
    const discount = fee('discountBooking')!
    // Uncaptured: base 6 only (the breast reduction's group), at Dr Souter's $26.50 less 10%: $159.00 less $15.90.
    expect(discount).toMatchObject({ total: 143.1, computed: 143.1, b: 6 })
    expect(fee('priceCaptureBooking')).toMatchObject({ needsPrice: false })
  })

  it('the BCTI count per anaesthetist and month is unchanged', () => {
    expect(now.bctis).toEqual(baseline.bctis)
  })

  it("S3's Holt and Prentice figures, the bariatric $2,800 and the Contract-rate Bookings hold (part of the full comparison; named here)", () => {
    const holt = SEED_MARKERS['splitBillingBooking']!.entityId
    expect(now.bookings.find((r) => r.bookingId === holt)).toEqual(baseline.bookings.find((r) => r.bookingId === holt))
    expect(now.fees.find((r) => r.procedureId === 'P0029')).toMatchObject({ total: 2800 })
  })
})

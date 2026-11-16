/**
 * Catch-up Phase 21 parity (drift-check step 4): every seeded Booking's
 * invoice grouping, totals, the name each invoice prints and the Xero contact
 * it lands on, and every issued invoice's counterparty and contact, as they
 * were BEFORE who is billed moved onto each Contract and the payer onto the
 * Booking. The fixture (`__parity__/phase-21-baseline.json`) was written once
 * from the untouched code by `__parity__/phase21Capture.ts` and never changes;
 * this suite is never run with `-u`.
 *
 * Declared differences, exact (US-11.2.1, US-11.2.2, DM-11, RV-30):
 *  - Doyle's bariatric Booking (BK0028), not yet invoiced: his price list bills
 *    the payer, so its two Procedures go to the patient on one invoice;
 *  - Hana Park (BP0001), the guardian master row, is the payer named on Grace
 *    Park's Booking: the ref kind `billableParty` becomes `payer`, the same id,
 *    name and Xero contact.
 * Everything else, Aria's clinic and S3's figures included, holds.
 */

import { describe, expect, it } from 'vitest'
import baseline from './__parity__/phase-21-baseline.json'
import { captureBaseline21, type BookingInvoicesRow, type Phase21Baseline } from './__parity__/phase21Capture'

const before = baseline as Phase21Baseline
const now = captureBaseline21()

const DOYLE = 'BK0028'
const DOYLE_NOW: BookingInvoicesRow = {
  bookingId: DOYLE,
  result: {
    kind: 'invoices',
    invoices: [
      { ref: 'patient:PT0015', name: 'Gareth Mills', contactNumber: 'PT0015', contactName: 'Patient PT0015', subtotal: 2861, total: 3290.15, procedures: ['P0029', 'P0030'] },
    ],
  },
}

/** Hana Park's ref, back in the fixture's form (the kind only). */
function asBefore<T extends { ref: string }>(face: T): T {
  return face.ref === 'payer:BP0001' ? { ...face, ref: 'billableParty:BP0001' } : face
}

describe('Phase 21 who-is-billed parity', () => {
  it('holds every seeded Booking: grouping, totals, printed name and Xero contact, bar the declared Doyle move', () => {
    const beforeRows = before.bookings.filter((r) => r.bookingId !== DOYLE)
    const nowRows = now.bookings
      // The payer review List's Bookings are this phase's named additions.
      .filter((r) => before.bookings.some((b) => b.bookingId === r.bookingId))
      .filter((r) => r.bookingId !== DOYLE)
      .map((r) => (r.result.kind === 'invoices' ? { ...r, result: { ...r.result, invoices: r.result.invoices.map(asBefore) } } : r))
    expect(nowRows).toEqual(beforeRows)
  })

  it("bills Doyle's bariatric Booking to the payer on the Booking, at his price list (US-11.2.1)", () => {
    expect(now.bookings.find((r) => r.bookingId === DOYLE)).toEqual(DOYLE_NOW)
    // No issued invoice was Doyle's, so none moves.
    expect(before.issued.some((i) => i.bookingId === DOYLE)).toBe(false)
  })

  it('keeps every issued invoice on its counterparty and Xero contact (Hana Park and the Aria clinic included)', () => {
    expect(now.issued.map(asBefore)).toEqual(before.issued)
    const hana = now.issued.find((i) => i.ref === 'payer:BP0001')
    expect(hana).toMatchObject({ name: 'Hana Park', contactNumber: 'BP0001', contactName: 'Billable party BP0001' })
  })

  it("holds S3's figures: Holt one invoice, Prentice two (funderOverride until Phase 22)", () => {
    const holt = now.bookings.find((r) => r.result.kind === 'invoices' && r.result.invoices.some((i) => i.name === 'Brian Holt' || i.total === 365.7))
    expect(holt?.result.kind === 'invoices' && holt.result.invoices.map((i) => i.total)).toEqual([365.7])
    const prentice = now.bookings.find((r) => r.result.kind === 'invoices' && r.result.invoices.some((i) => i.total === 152.38))
    expect(prentice?.result.kind === 'invoices' && prentice.result.invoices.map((i) => i.total).sort()).toEqual([152.38, 91.43])
  })
})

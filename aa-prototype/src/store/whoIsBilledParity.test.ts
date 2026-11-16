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
 *
 * Declared difference, catch-up Phase 22 (US-08.2.3, DM-28, RV-31):
 *  - Alan Prentice's fee-split Booking (BK0025, the `feeSplitBooking` marker):
 *    the per-line funder allocation is retired; the Procedure is on No
 *    contract · RVG with a split on the Booking (nib $132.50, the payer the
 *    rest), so its second invoice goes to Alan Prentice instead of St George's,
 *    the same totals ($152.38 and $91.43).
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

/** Prentice's fee-split Booking (catch-up Phase 22): nib's share unchanged, the rest now to the patient, the payer on the Booking. */
const PRENTICE = 'BK0025'
const PRENTICE_REST_NOW = { ref: 'patient:PT0011', name: 'Alan Prentice', contactNumber: 'PT0011', contactName: 'Patient PT0011', subtotal: 79.5, total: 91.43, procedures: ['P0026'] }
const PRENTICE_REST_BEFORE = { ref: 'hospital:H-STG', name: "St George's", contactNumber: 'H-STG', contactName: "St George's", subtotal: 79.5, total: 91.43, procedures: ['P0026'] }

/** Prentice's row, back in the fixture's form: only the rest share's party is mapped, never a figure. */
function prenticeAsBefore(row: BookingInvoicesRow): BookingInvoicesRow {
  if (row.bookingId !== PRENTICE || row.result.kind !== 'invoices') return row
  return { ...row, result: { ...row.result, invoices: row.result.invoices.map((i) => (i.ref === PRENTICE_REST_NOW.ref ? { ...i, ...PRENTICE_REST_BEFORE } : i)) } }
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
      .map(prenticeAsBefore)
    expect(nowRows).toEqual(beforeRows)
  })

  it("bills the rest of Prentice's split fee to Alan Prentice, not St George's, the same totals (catch-up Phase 22, US-08.2.3)", () => {
    const row = now.bookings.find((r) => r.bookingId === PRENTICE)
    expect(row?.result).toEqual({
      kind: 'invoices',
      invoices: [
        { ref: 'insurer:I-NIB', name: 'nib', contactNumber: 'I-NIB', contactName: 'nib', subtotal: 132.5, total: 152.38, procedures: ['P0026'] },
        PRENTICE_REST_NOW,
      ],
    })
    const was = before.bookings.find((r) => r.bookingId === PRENTICE)
    expect(was?.result.kind === 'invoices' && was.result.invoices[1]).toEqual(PRENTICE_REST_BEFORE)
    // Not yet invoiced in the seed, so no issued invoice moves.
    expect(before.issued.some((i) => i.bookingId === PRENTICE)).toBe(false)
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

  it("holds S3's figures: Holt one invoice, Prentice two (a split on the Booking since Phase 22)", () => {
    const holt = now.bookings.find((r) => r.result.kind === 'invoices' && r.result.invoices.some((i) => i.name === 'Brian Holt' || i.total === 365.7))
    expect(holt?.result.kind === 'invoices' && holt.result.invoices.map((i) => i.total)).toEqual([365.7])
    const prentice = now.bookings.find((r) => r.result.kind === 'invoices' && r.result.invoices.some((i) => i.total === 152.38))
    expect(prentice?.result.kind === 'invoices' && prentice.result.invoices.map((i) => i.total).sort()).toEqual([152.38, 91.43])
  })
})

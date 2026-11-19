/**
 * The pure credit rules (catch-up Phase 39; US-08.6.2, US-08.6.4, US-08.6.5,
 * OQ-77 parts 1 and 2, OQ-97): the credit note in full, the reversal of the
 * payable in every case, the split's equal total and the Xero correction plan.
 */

import { describe, expect, it } from 'vitest'
import { creditInFull, reversalPlan, splitTotalCheck, xeroCorrectionPlan, CREDIT_LINE_PREFIX, DEFAULT_GST_TREATMENT } from './creditNote'
import { gstOn } from './invoicePresentation'
import { roundToCents, toCents } from './money'
import type { FreeFormLine } from '../types'

const cents = (n: number) => toCents(n)

describe('creditInFull (AC "Credit in full")', () => {
  const invoiceOf = (amounts: number[]) => {
    const subtotal = roundToCents(amounts.reduce((s, a) => s + a, 0))
    const gst = gstOn(subtotal)
    return { invoice: { subtotal, gst, total: roundToCents(subtotal + gst) }, lines: amounts.map((amount, i) => ({ description: `Line ${i + 1}`, amount })) }
  }

  for (const n of [1, 2, 7]) {
    it(`mirrors ${n} line${n === 1 ? '' : 's'} exactly, prefixed "Credit:", the same totals`, () => {
      const amounts = Array.from({ length: n }, (_, i) => roundToCents(100.01 + i * 33.37))
      const { invoice, lines } = invoiceOf(amounts)
      const note = creditInFull(invoice, lines)
      expect(note.lines).toHaveLength(n)
      note.lines.forEach((l, i) => {
        expect(l.description).toBe(`${CREDIT_LINE_PREFIX}Line ${i + 1}`)
        expect(l.amount).toBe(amounts[i])
      })
      expect({ subtotal: note.subtotal, gst: note.gst, total: note.total }).toEqual(invoice)
      expect(cents(note.lines.reduce((s, l) => s + l.amount, 0))).toBe(cents(invoice.subtotal))
    })
  }

  it('credits in full even when one line was wrong, keeping a free-form quantity', () => {
    const note = creditInFull({ subtotal: 90, gst: 13.5, total: 103.5 }, [
      { description: 'Ward review', amount: 60, quantity: 2 },
      { description: 'Wrong line', amount: 30 },
    ])
    expect(note.lines).toEqual([
      { description: 'Credit: Ward review', quantity: 2, amount: 60 },
      { description: 'Credit: Wrong line', amount: 30 },
    ])
    expect(note.total).toBe(103.5)
  })

  it("keeps the original's GST treatment (prices ex GST, GST at the foot)", () => {
    expect(creditInFull({ subtotal: 1, gst: 0.15, total: 1.15 }, []).gstTreatment).toBe(DEFAULT_GST_TREATMENT)
    expect(DEFAULT_GST_TREATMENT).toBe('exclusiveAtFoot')
  })
})

describe('reversalPlan (US-08.6.5 "Payable reversed", OQ-77 part 2)', () => {
  const invariants = (total: number, received: number, released: number, disbursed: number) => {
    const plan = reversalPlan({ total, received, released, disbursed })
    expect(cents(plan.receivableCredited)).toBe(cents(total))
    expect(cents(plan.negativeInvoiceTotal)).toBe(cents(total))
    expect(cents(plan.offsetAgainstPayable) + cents(plan.recoveryDue)).toBe(cents(total))
    expect(cents(plan.heldForPayer) + (cents(total) - cents(received))).toBe(cents(total))
    // The payable is always reversed: never a zero negative invoice on a priced invoice.
    expect(cents(plan.negativeInvoiceTotal)).toBeGreaterThan(0)
    return plan
  }

  it('unpaid: credited to zero, the whole negative invoice offset, nothing held', () => {
    expect(invariants(115, 0, 0, 0)).toEqual({ receivableCredited: 115, negativeInvoiceTotal: 115, offsetAgainstPayable: 115, releaseCancelled: 0, heldForPayer: 0, recoveryDue: 0 })
  })

  it('a half payment in odd cents, not paid out: the received part held for the payer, the release cancelled', () => {
    const total = 1234.57
    const half = 617.28
    expect(invariants(total, half, half, 0)).toEqual({ receivableCredited: 1234.57, negativeInvoiceTotal: 1234.57, offsetAgainstPayable: 1234.57, releaseCancelled: 617.28, heldForPayer: 617.28, recoveryDue: 0 })
  })

  it('fully paid, not paid out', () => {
    expect(invariants(100, 100, 100, 0)).toMatchObject({ offsetAgainstPayable: 100, releaseCancelled: 100, heldForPayer: 100, recoveryDue: 0 })
  })

  it('fully paid, part paid out: the undisbursed part offset, the paid-out part to net', () => {
    expect(invariants(100, 100, 100, 40)).toEqual({ receivableCredited: 100, negativeInvoiceTotal: 100, offsetAgainstPayable: 60, releaseCancelled: 60, heldForPayer: 100, recoveryDue: 40 })
  })

  it('fully paid out: nothing offset, all to net', () => {
    expect(invariants(345.67, 345.67, 345.67, 345.67)).toMatchObject({ offsetAgainstPayable: 0, releaseCancelled: 0, heldForPayer: 345.67, recoveryDue: 345.67 })
  })

  it('is exact to the cent on float-unfriendly amounts', () => {
    const plan = invariants(0.3, 0.1, 0.1, 0.07)
    expect(plan).toEqual({ receivableCredited: 0.3, negativeInvoiceTotal: 0.3, offsetAgainstPayable: 0.23, releaseCancelled: 0.03, heldForPayer: 0.1, recoveryDue: 0.07 })
  })

  it('is deterministic', () => {
    const input = { total: 980.05, received: 490.03, released: 490.03, disbursed: 200.01 }
    expect(reversalPlan(input)).toEqual(reversalPlan(input))
  })
})

describe('splitTotalCheck (OQ-77 part 1, US-08.6.4 "Same total")', () => {
  const credited = { subtotal: 100, total: 115 }
  const line = (unitAmount: number, quantity = 1): FreeFormLine[] => [{ description: 'Component', quantity, unitAmount }]

  it('accepts components that add up to the credited subtotal ex GST', () => {
    expect(splitTotalCheck(credited, [line(60), line(40)])).toEqual({ ok: true, leftToAllocate: 0, gstRounding: 0, sum: 100 })
  })

  it('refuses a cent over, with the plain sentence', () => {
    const out = splitTotalCheck(credited, [line(60.01), line(40)])
    expect(out.ok).toBe(false)
    if (out.ok) return
    expect(out.code).toBe('splitTotalMismatch')
    expect(out.leftToAllocate).toBe(-0.01)
    expect(out.message).toBe('The new invoices must add up to the credited $100.00 before GST. They come to $100.01.')
  })

  it('refuses a cent under', () => {
    const out = splitTotalCheck(credited, [line(59.99), line(40)])
    expect(out).toMatchObject({ ok: false, leftToAllocate: 0.01, sum: 99.99 })
  })

  it('counts an empty component as nothing', () => {
    expect(splitTotalCheck(credited, [line(100), []])).toMatchObject({ ok: true, leftToAllocate: 0 })
    expect(splitTotalCheck(credited, [line(60), []])).toMatchObject({ ok: false, leftToAllocate: 40 })
  })

  it('accepts three components whose GST rounds differently, showing the rounding (at most a cent each)', () => {
    // $0.30 ex GST split three ways: GST on each $0.10 rounds up to 2 cents (6 in all), on the whole to 5 cents.
    const small = { subtotal: 0.3, total: roundToCents(0.3 + gstOn(0.3)) }
    const out = splitTotalCheck(small, [line(0.1), line(0.1), line(0.1)])
    expect(out.ok).toBe(true)
    const componentsTotal = [0.1, 0.1, 0.1].reduce((s, a) => s + cents(roundToCents(a + gstOn(a))), 0)
    expect(cents(out.gstRounding)).toBe(componentsTotal - cents(small.total))
    expect(out.gstRounding).toBe(0.01)
    expect(Math.abs(cents(out.gstRounding))).toBeLessThanOrEqual(3)
  })

  it('is deterministic', () => {
    expect(splitTotalCheck(credited, [line(12.34, 3), line(62.98)])).toEqual(splitTotalCheck(credited, [line(12.34, 3), line(62.98)]))
  })
})

describe('xeroCorrectionPlan (US-08.6.2 "Both sides move")', () => {
  const rec = (amountDue: number, amountReceived: number) => ({ amountDue, amountReceived })
  const credit = { creditNoteNumber: 'CN-2026-0001', total: 115 }

  it('a draft ACCPAY with nothing authorised is voided; the ACCRECCREDIT is allocated in full', () => {
    expect(xeroCorrectionPlan(rec(115, 0), { status: 'draft', amountPayable: 115, amountAuthorised: 0, amountDisbursed: 0 }, credit)).toEqual({
      accRec: { creditNoteNumber: 'CN-2026-0001', total: 115, allocated: 115, unallocated: 0 },
      accPay: { action: 'void' },
    })
  })

  it('an authorised ACCPAY gets an ACCPAYCREDIT -P for the total, allocated against what is unpaid; the paid part of the ACCREC is unallocated', () => {
    expect(xeroCorrectionPlan(rec(115, 57.5), { status: 'authorised', amountPayable: 115, amountAuthorised: 57.5, amountDisbursed: 0 }, credit)).toEqual({
      accRec: { creditNoteNumber: 'CN-2026-0001', total: 115, allocated: 57.5, unallocated: 57.5 },
      accPay: { action: 'credit', creditNoteNumber: 'CN-2026-0001-P', total: 115, allocated: 115, unallocated: 0 },
    })
  })

  it('a paid ACCPAY: the ACCPAYCREDIT is unallocated by what was paid out (recoveryDue)', () => {
    expect(xeroCorrectionPlan(rec(115, 115), { status: 'paid', amountPayable: 115, amountAuthorised: 115, amountDisbursed: 115 }, credit)).toEqual({
      accRec: { creditNoteNumber: 'CN-2026-0001', total: 115, allocated: 0, unallocated: 115 },
      accPay: { action: 'credit', creditNoteNumber: 'CN-2026-0001-P', total: 115, allocated: 0, unallocated: 115 },
    })
  })

  it('an original never handed off has nothing to reverse', () => {
    expect(xeroCorrectionPlan(undefined, undefined, credit)).toEqual({ accPay: { action: 'none' } })
  })

  it('carries numbers and amounts only', () => {
    const plan = xeroCorrectionPlan(rec(115, 0), { status: 'draft', amountPayable: 115, amountAuthorised: 0, amountDisbursed: 0 }, credit)
    expect(JSON.stringify(plan)).not.toMatch(/name|nhi|patient/i)
  })
})

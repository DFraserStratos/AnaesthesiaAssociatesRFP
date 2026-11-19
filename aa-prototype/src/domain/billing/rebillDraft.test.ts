/**
 * The rebill from a copy of the original's lines (catch-up Phase 39 session 2,
 * work item 9; US-08.6.6): `rebillDraftFrom` copies each positive line at
 * quantity 1 and its stored ex-GST amount, folds a negative line into the line
 * it follows, and always prices through 38b's `priceFreeFormInvoice` to the
 * original's total exactly.
 */

import { describe, expect, it } from 'vitest'
import { rebillDraftFrom, DEFAULT_GST_TREATMENT } from './creditNote'
import { priceFreeFormInvoice } from './additionalInvoice'
import { gstOn } from './invoicePresentation'
import { roundToCents } from './money'

/** An original as the run writes one: lines, subtotal, GST at the foot, total. */
function originalOf(amounts: number[], number = 'AA-2026-0007') {
  const subtotal = roundToCents(amounts.reduce((s, a) => s + a, 0))
  const gst = gstOn(subtotal)
  return {
    invoice: { invoiceNumber: number, subtotal, gst, total: roundToCents(subtotal + gst) },
    lines: amounts.map((amount, i) => ({ description: amount < 0 ? `Discount ${i + 1}` : `Anaesthesia, ${i + 3} units`, amount })),
  }
}

function priced(lines: ReturnType<typeof rebillDraftFrom>['lines']) {
  const out = priceFreeFormInvoice(lines, { gstTreatment: DEFAULT_GST_TREATMENT })
  if (out.kind !== 'priced') throw new Error(out.message)
  return out
}

describe('rebillDraftFrom (US-08.6.6)', () => {
  for (const n of [1, 2, 7]) {
    it(`copies ${n} line${n === 1 ? '' : 's'} at quantity 1 and the stored amount, and prices to the original's total exactly`, () => {
      const amounts = Array.from({ length: n }, (_, i) => roundToCents(123.45 + i * 41.07 + (i % 3) * 0.005))
      const { invoice, lines } = originalOf(amounts)
      const draft = rebillDraftFrom(invoice, lines)
      expect(draft.party).toEqual({ sameAs: true })
      expect(draft.lines).toEqual(lines.map((l) => ({ description: l.description, quantity: 1, unitAmount: l.amount })))
      const p = priced(draft.lines)
      expect(p.subtotal).toBe(invoice.subtotal)
      expect(p.gst).toBe(invoice.gst)
      expect(p.total).toBe(invoice.total)
    })
  }

  it('drops a zero line', () => {
    const { invoice, lines } = originalOf([400, 0, 50])
    expect(rebillDraftFrom(invoice, lines).lines.map((l) => l.unitAmount)).toEqual([400, 50])
  })

  it('folds a lowering line into the line it follows, to the exact total', () => {
    const { invoice, lines } = originalOf([1033.5, -103.35, 85])
    const draft = rebillDraftFrom(invoice, lines)
    expect(draft.lines).toEqual([
      { description: 'Anaesthesia, 3 units, less Discount 2', quantity: 1, unitAmount: 930.15 },
      { description: 'Anaesthesia, 5 units', quantity: 1, unitAmount: 85 },
    ])
    expect(priced(draft.lines).total).toBe(invoice.total)
  })

  it('copies a positive line after a negative one as its own line', () => {
    const { invoice, lines } = originalOf([200, -20, 60])
    const draft = rebillDraftFrom(invoice, lines)
    expect(draft.lines).toHaveLength(2)
    expect(draft.lines[1]).toEqual({ description: 'Anaesthesia, 5 units', quantity: 1, unitAmount: 60 })
  })

  it('drops a line a deduction takes to zero, with its deduction', () => {
    const { invoice, lines } = originalOf([300, 100, -100])
    expect(rebillDraftFrom(invoice, lines).lines).toEqual([{ description: 'Anaesthesia, 3 units', quantity: 1, unitAmount: 300 }])
  })

  it('is one line "Rebill of {number}" at the subtotal when nothing positive remains or a deduction outruns its line', () => {
    const lone = originalOf([-50, 500])
    expect(rebillDraftFrom(lone.invoice, lone.lines).lines).toEqual([{ description: 'Rebill of AA-2026-0007', quantity: 1, unitAmount: 450 }])
    const outrun = originalOf([500, 40, -60])
    const draft = rebillDraftFrom(outrun.invoice, outrun.lines)
    expect(draft.lines).toEqual([{ description: 'Rebill of AA-2026-0007', quantity: 1, unitAmount: 480 }])
    expect(priced(draft.lines).total).toBe(outrun.invoice.total)
    expect(rebillDraftFrom({ invoiceNumber: 'AA-2026-0009', subtotal: 120 }, []).lines).toEqual([{ description: 'Rebill of AA-2026-0009', quantity: 1, unitAmount: 120 }])
  })

  it('is deterministic and never writes its input', () => {
    const { invoice, lines } = originalOf([1033.5, -103.35, 85, 12.34])
    const before = structuredClone({ invoice, lines })
    expect(rebillDraftFrom(invoice, lines)).toEqual(rebillDraftFrom(invoice, lines))
    expect({ invoice, lines }).toEqual(before)
  })
})

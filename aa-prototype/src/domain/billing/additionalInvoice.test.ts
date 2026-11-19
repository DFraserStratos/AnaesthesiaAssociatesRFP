import { describe, expect, it } from 'vitest'
import { freeFormSubtotal, lineAmount, priceFreeFormInvoice } from './additionalInvoice'
import source from './additionalInvoice.ts?raw'

describe('priceFreeFormInvoice (D10, OQ-45)', () => {
  it('prices the worked figure', () => {
    const r = priceFreeFormInvoice([{ description: 'Post-op ward review, Wed 15 Jul, 15 min', quantity: 1, unitAmount: 30 }])
    expect(r).toEqual({ kind: 'priced', lines: [{ description: 'Post-op ward review, Wed 15 Jul, 15 min', quantity: 1, unitAmount: 30, amount: 30 }], subtotal: 30, gst: 4.5, total: 34.5 })
  })
  it('rounds each line to the cent and sums three lines exactly', () => {
    const r = priceFreeFormInvoice([
      { description: 'A', quantity: 2.5, unitAmount: 12.34 },
      { description: 'B', quantity: 3, unitAmount: 0.1 },
      { description: 'C', quantity: 1, unitAmount: 0.2 },
    ])
    expect(r.kind).toBe('priced')
    if (r.kind !== 'priced') return
    expect(r.lines.map((l) => l.amount)).toEqual([30.85, 0.3, 0.2])
    expect(r.subtotal).toBe(31.35)
    expect(r.gst).toBe(4.7)
    expect(r.total).toBe(36.05)
  })
  it('refuses each bad input with its sentence', () => {
    expect(priceFreeFormInvoice([])).toMatchObject({ kind: 'refused', code: 'noLines', message: 'Add at least one line.' })
    expect(priceFreeFormInvoice([{ description: ' ', quantity: 1, unitAmount: 1 }])).toMatchObject({ code: 'descriptionMissing', message: 'Each line needs a description.', lineIndex: 0 })
    expect(priceFreeFormInvoice([{ description: 'A', quantity: 0, unitAmount: 1 }])).toMatchObject({ code: 'quantityInvalid', field: 'quantity' })
    expect(priceFreeFormInvoice([{ description: 'A', quantity: 1, unitAmount: -5 }])).toMatchObject({ code: 'amountInvalid', field: 'unitAmount' })
    expect(priceFreeFormInvoice([{ description: 'A', quantity: 1, unitAmount: 1 }, { description: 'B', quantity: Number.NaN, unitAmount: 1 }])).toMatchObject({ code: 'quantityInvalid', lineIndex: 1 })
    expect(priceFreeFormInvoice([{ description: 'A', quantity: 0.001, unitAmount: 0.001 }])).toMatchObject({ code: 'lineZero' })
  })
  it('rounds a half cent up, and refuses a line that comes to nothing', () => {
    expect(lineAmount(0.25, 8.54)).toBe(2.14)
    expect(lineAmount(2.5, 12.34)).toBe(30.85)
    expect(priceFreeFormInvoice([{ description: 'A', quantity: 0.25, unitAmount: 8.54 }])).toMatchObject({ kind: 'priced', subtotal: 2.14 })
    expect(priceFreeFormInvoice([{ description: 'A', quantity: 1, unitAmount: 50 }, { description: 'B', quantity: 0.001, unitAmount: 1 }])).toMatchObject({ kind: 'refused', code: 'lineZero', lineIndex: 1 })
  })
  it('is deterministic and gives a subtotal for lists', () => {
    const lines = [{ description: 'A', quantity: 1, unitAmount: 85 }]
    expect(priceFreeFormInvoice(lines)).toEqual(priceFreeFormInvoice(lines))
    expect(freeFormSubtotal(lines)).toBe(85)
    expect(freeFormSubtotal([])).toBe(0)
  })
  it('imports nothing from the fee, Contract, line, resolver, precedence, unit, modifier or RVG modules (D10)', () => {
    const imports = [...source.matchAll(/from '([^']+)'/g)].map((m) => m[1])
    expect(imports.sort()).toEqual(['../types', './invoicePresentation', './money'])
  })
})

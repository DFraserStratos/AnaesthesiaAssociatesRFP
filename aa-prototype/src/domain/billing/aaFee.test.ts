import { describe, expect, it } from 'vitest'
import { aaFeeFixedTotal, aaFeeFor, validateAaFeeSettings } from './aaFee'
import { toCents } from './money'
import type { AaFeeSettings } from '../types'

const SETTINGS: AaFeeSettings = {
  fixedItems: [
    { id: 'a', description: 'Practice management', amount: 350 },
    { id: 'b', description: 'Office and reception', amount: 150 },
  ],
  perBctiCharge: 5,
}

describe('aaFeeFor (US-10.3.1, US-10.3.3)', () => {
  it('reproduces the acceptance example: $500 + $5 x 40 = $700 before GST, $805.00 with GST at the foot', () => {
    const fee = aaFeeFor(SETTINGS, 40)
    expect(fee.subtotal).toBe(700)
    expect(fee.gst).toBe(105)
    expect(fee.total).toBe(805)
    expect(fee.lines.map((l) => l.amount)).toEqual([350, 150, 200])
    expect(fee.lines[2]!.description).toBe('BCTIs: 40 x $5.00')
  })

  it('is the fixed items plus rate times count; a changed rate gives the new subtotal', () => {
    expect(aaFeeFor(SETTINGS, 12).subtotal).toBe(560)
    expect(aaFeeFor({ ...SETTINGS, perBctiCharge: 6 }, 40).subtotal).toBe(740)
    expect(aaFeeFixedTotal(SETTINGS)).toBe(500)
  })

  it('charges the fixed items only with no BCTIs', () => {
    const fee = aaFeeFor(SETTINGS, 0)
    expect(fee.subtotal).toBe(500)
    expect(fee.lines[2]!.amount).toBe(0)
  })

  it('conserves GST to the cent', () => {
    for (const n of [0, 1, 3, 17, 40, 333]) {
      const fee = aaFeeFor({ ...SETTINGS, perBctiCharge: 4.37 }, n)
      expect(toCents(fee.subtotal) + toCents(fee.gst)).toBe(toCents(fee.total))
    }
  })

  it('names the BCTI line with the label given', () => {
    expect(aaFeeFor(SETTINGS, 2, 'BCTIs paid in July 2026').lines[2]!.description).toBe('BCTIs paid in July 2026: 2 x $5.00')
  })
})

describe('validateAaFeeSettings', () => {
  it('accepts the sample schedule', () => {
    expect(validateAaFeeSettings(SETTINGS)).toBeNull()
  })

  it('refuses an empty description, a negative or fractional-cent amount, and a bad rate', () => {
    expect(validateAaFeeSettings({ ...SETTINGS, fixedItems: [{ id: 'x', description: ' ', amount: 1 }] })).toMatch(/description/)
    expect(validateAaFeeSettings({ ...SETTINGS, fixedItems: [{ id: 'x', description: 'X', amount: -1 }] })).toMatch(/zero or more/)
    expect(validateAaFeeSettings({ ...SETTINGS, fixedItems: [{ id: 'x', description: 'X', amount: 1.005 }] })).toMatch(/to the cent/)
    expect(validateAaFeeSettings({ ...SETTINGS, perBctiCharge: Number.NaN })).toMatch(/per BCTI/)
  })
})

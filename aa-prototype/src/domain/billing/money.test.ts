import { describe, expect, it } from 'vitest'
import { amountInputText, formatMoney, parseAmount, parseAmountOrNaN, roundToCents } from './money'
import { parsePriceText } from './priceRanges'

/** `formatCurrency` as it was before U1 (shared/format.ts), the pin formatMoney's defaults match on everything but the sign. */
function formatCurrencyBeforeU1(n: number): string {
  return `$${n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

describe('formatMoney', () => {
  it('groups thousands with two decimals by default (question 21)', () => {
    expect(formatMoney(3100)).toBe('$3,100.00')
    expect(formatMoney(3200)).toBe('$3,200.00')
    expect(formatMoney(1234567.891)).toBe('$1,234,567.89')
    expect(formatMoney(12.5)).toBe('$12.50')
    expect(formatMoney(999.99)).toBe('$999.99')
  })

  it('prints a negative as "-$34.45", the sign before the dollar sign', () => {
    expect(formatMoney(-34.45)).toBe('-$34.45')
    expect(formatMoney(-1234.5)).toBe('-$1,234.50')
    expect(formatMoney(-0.005)).toBe('-$0.01')
    expect(formatMoney(-1).includes('\u2212')).toBe(false)
    expect(formatMoney(-1).includes('$-')).toBe(false)
  })

  it('prints zero, negative zero and a negative that rounds to zero as "$0.00"', () => {
    expect(formatMoney(0)).toBe('$0.00')
    expect(formatMoney(-0)).toBe('$0.00')
    expect(formatMoney(-0.004)).toBe('$0.00')
    expect(formatMoney(-0.004, { cents: 'whenAny' })).toBe('$0')
  })

  it('matches the pre-U1 formatCurrency on every value it is likely to meet, but for where the minus sits', () => {
    const values = [0, 0.005, 0.01, 1.005, 2.675, 30, 365.7, 1440, 2861, 3290.15, 1e6 + 0.5, -50, -3100.25]
    for (let cents = -200000; cents <= 400000; cents += 137) values.push(cents / 100)
    for (const v of values) expect(formatMoney(v), String(v)).toBe(formatCurrencyBeforeU1(v).replace('$-', '-$'))
  })

  it("'whenAny' drops .00 on whole dollars only", () => {
    expect(formatMoney(3100, { cents: 'whenAny' })).toBe('$3,100')
    expect(formatMoney(3100.5, { cents: 'whenAny' })).toBe('$3,100.50')
    expect(formatMoney(0, { cents: 'whenAny' })).toBe('$0')
  })

  it("'always' signs before the dollar sign and leaves zero unsigned", () => {
    expect(formatMoney(50, { sign: 'always' })).toBe('+$50.00')
    expect(formatMoney(-1234.5, { sign: 'always' })).toBe('-$1,234.50')
    expect(formatMoney(0, { sign: 'always' })).toBe('$0.00')
    expect(formatMoney(-0.001, { sign: 'always' })).toBe('$0.00')
  })

  it('agrees with roundToCents on the cent amounts the fee maths produces', () => {
    for (const v of [12.345, 2861 * 1.15, 21 * 30, 3100 * 0.15, 99.999]) {
      expect(formatMoney(roundToCents(v))).toBe(formatMoney(v))
    }
  })
})

/**
 * The three parsers U1 replaced, pinned on 16 Nov 2026 before the change. BillingCard's rule
 * is the one kept; the other columns record what changed (the U1 PROGRESS entry lists it).
 */
const PINS: ReadonlyArray<{ text: string; billingCard: number | undefined; contractRail: number | undefined; aaFees: number }> = [
  { text: '$1,234.50', billingCard: 1234.5, contractRail: 1234.5, aaFees: 1234.5 },
  { text: '1234.5', billingCard: 1234.5, contractRail: 1234.5, aaFees: 1234.5 },
  { text: ' 3 100 ', billingCard: 3100, contractRail: 3100, aaFees: 3100 },
  { text: '12.345', billingCard: undefined, contractRail: 12.35, aaFees: 12.345 },
  { text: '-5', billingCard: undefined, contractRail: undefined, aaFees: -5 },
  { text: '', billingCard: undefined, contractRail: undefined, aaFees: Number.NaN },
  { text: 'abc', billingCard: undefined, contractRail: undefined, aaFees: Number.NaN },
  { text: '.5', billingCard: undefined, contractRail: 0.5, aaFees: 0.5 },
  { text: '5.', billingCard: undefined, contractRail: 5, aaFees: 5 },
  { text: '1e3', billingCard: undefined, contractRail: 1000, aaFees: 1000 },
]

describe('parseAmount', () => {
  it("keeps BillingCard's rule exactly", () => {
    for (const pin of PINS) expect(parseAmount(pin.text), JSON.stringify(pin.text)).toBe(pin.billingCard)
  })

  it('reads typed money with $, commas and spaces', () => {
    expect(parseAmount('$1,234.50')).toBe(1234.5)
    expect(parseAmount('3200')).toBe(3200)
    expect(parseAmount('0')).toBe(0)
    expect(parseAmount('0.05')).toBe(0.05)
  })

  it('is no amount when blank, negative, not a plain number or past the cent', () => {
    for (const text of ['', '  ', 'abc', '-5', '12.345', '1e3', '.5', '5.', 'Infinity', '0x10']) expect(parseAmount(text), text).toBeUndefined()
  })

  it('parseAmountOrNaN (price ranges, AA fees) is NaN exactly where parseAmount is no amount', () => {
    for (const pin of PINS) {
      const n = parseAmountOrNaN(pin.text)
      if (pin.billingCard === undefined) expect(n, JSON.stringify(pin.text)).toBeNaN()
      else expect(n).toBe(pin.billingCard)
    }
    expect(parsePriceText('$3,200')).toBe(3200)
  })

  it('records the inputs whose result changed for the other two parsers (on the owner review list)', () => {
    const changed = (col: 'contractRail' | 'aaFees') =>
      PINS.filter((p) => {
        const before = p[col]
        const after = col === 'aaFees' ? parseAmountOrNaN(p.text) : parseAmount(p.text)
        return !(Object.is(before, after) || (Number.isNaN(before as number) && Number.isNaN(after as number)))
      }).map((p) => p.text)
    expect(changed('contractRail')).toEqual(['12.345', '.5', '5.', '1e3'])
    expect(changed('aaFees')).toEqual(['12.345', '-5', '.5', '5.', '1e3'])
  })
})

describe('amountInputText', () => {
  it('writes an amount as an amount field starts out holding, and parseAmount reads it back', () => {
    expect(amountInputText(41.5)).toBe('41.50')
    expect(amountInputText(1234)).toBe('1234.00')
    expect(parseAmount(amountInputText(36.25))).toBe(36.25)
  })
})

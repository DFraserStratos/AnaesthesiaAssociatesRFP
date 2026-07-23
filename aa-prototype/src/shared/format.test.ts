/** Phase 05 — the Monday-anchored week helpers behind the dashboard week strip. */

import { describe, expect, it } from 'vitest'
import { mondayOf, weekDays, shiftWeeks, formatCurrency } from './format'

// DEMO_TODAY (2026-07-21) is a Tuesday; its week runs Mon 20 to Sun 26 Jul.

describe('mondayOf', () => {
  it('returns the Monday of the week for any day', () => {
    expect(mondayOf('2026-07-21')).toBe('2026-07-20') // Tue -> Mon
    expect(mondayOf('2026-07-20')).toBe('2026-07-20') // Mon -> itself
    expect(mondayOf('2026-07-26')).toBe('2026-07-20') // Sun -> Mon of the same week
  })
})

describe('weekDays', () => {
  it('returns the seven ISO dates Monday..Sunday', () => {
    expect(weekDays('2026-07-21')).toEqual([
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
      '2026-07-25',
      '2026-07-26',
    ])
  })

  it('anchors on the Monday regardless of the day passed', () => {
    expect(weekDays('2026-07-24')).toEqual(weekDays('2026-07-20'))
  })
})

describe('shiftWeeks', () => {
  it('shifts a date by whole weeks', () => {
    expect(shiftWeeks('2026-07-21', 1)).toBe('2026-07-28')
    expect(shiftWeeks('2026-07-21', -1)).toBe('2026-07-14')
    expect(shiftWeeks('2026-07-21', 0)).toBe('2026-07-21')
  })
})

describe('formatCurrency', () => {
  it('always shows two decimals with grouping (one format across the web app)', () => {
    expect(formatCurrency(845)).toBe('$845.00')
    expect(formatCurrency(2605.5)).toBe('$2,605.50')
    expect(formatCurrency(0)).toBe('$0.00')
  })
})

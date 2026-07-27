/** Phase 05 — the Monday-anchored week helpers behind the dashboard week strip. */

import { describe, expect, it } from 'vitest'
import { mondayOf, weekDays, shiftWeeks, formatCurrency, drSurname, initialsOf, surnameOf } from './format'

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

describe('surnameOf', () => {
  it('drops the title and keeps the last name', () => {
    expect(surnameOf('Dr Melanie Souter')).toBe('Souter')
    expect(surnameOf('Dr. Alistair Chen')).toBe('Chen')
    expect(surnameOf('Kirsty W.')).toBe('W.')
  })

  it('survives a single word and an empty string', () => {
    expect(surnameOf('Souter')).toBe('Souter')
    expect(surnameOf('')).toBe('')
  })
})

describe('drSurname', () => {
  it('is the ONE short form: mobile and web greet identically', () => {
    // The bug this pins: mobile greeted "Dr Melanie", web "Dr Souter".
    expect(drSurname('Dr Melanie Souter')).toBe('Dr Souter')
    expect(drSurname('Dr Oliver Strand')).toBe('Dr Strand')
  })

  it('does not title an empty name', () => {
    expect(drSurname('')).toBe('')
  })
})

describe('initialsOf', () => {
  it('takes at most two upper-case initials, ignoring the title', () => {
    expect(initialsOf('Dr Melanie Souter')).toBe('MS')
    expect(initialsOf('Dr James Rutherford')).toBe('JR')
    expect(initialsOf('Souter')).toBe('S')
    expect(initialsOf('')).toBe('')
  })
})

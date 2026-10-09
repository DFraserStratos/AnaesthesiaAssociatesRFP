/** Phase 05 — the Monday-anchored week helpers behind the dashboard week strip. */

import { describe, expect, it } from 'vitest'
import { mondayOf, weekDays, shiftWeeks, formatCurrency, drSurname, initialsOf, surnameOf, titledSurname, waitingLabel, locationName, pairingLine } from './format'

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

describe('titledSurname', () => {
  it('keeps the title and the surname, and invents no title', () => {
    expect(titledSurname('Ms A. Reid')).toBe('Ms Reid')
    expect(titledSurname('Dr Priya Sharma')).toBe('Dr Sharma')
    expect(titledSurname('Mr J. Whitford')).toBe('Mr Whitford')
    expect(titledSurname('Jane Smith')).toBe('Jane Smith')
  })
})

describe('Draft List and location formatting (catch-up Phase 31)', () => {
  it('waitingLabel: minutes under an hour, whole hours under a day, then days and hours', () => {
    expect(waitingLabel(0)).toBe('0 min')
    expect(waitingLabel(45)).toBe('45 min')
    expect(waitingLabel(60)).toBe('1 h')
    expect(waitingLabel(16 * 60 + 59)).toBe('16 h')
    expect(waitingLabel(24 * 60)).toBe('1 d')
    expect(waitingLabel(3 * 24 * 60 + 22 * 60 + 10)).toBe('3 d 22 h')
  })

  it('locationName and pairingLine read the location record and the surgeon', () => {
    const masters = {
      hospitals: { 'H-FORTE': { name: 'Forte Health' }, 'H-AAROOMS': { name: 'AA rooms' } },
      surgeons: { 'S-NAND': { name: 'Mr V. Nand' } },
    }
    expect(locationName('H-AAROOMS', masters.hospitals)).toBe('AA rooms')
    expect(locationName('H-GONE', masters.hospitals)).toBe('H-GONE')
    expect(pairingLine({ hospitalId: 'H-FORTE', surgeonId: 'S-NAND' }, masters)).toBe('Forte Health · Mr V. Nand')
  })
})

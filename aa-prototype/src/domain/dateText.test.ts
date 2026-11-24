import { describe, expect, it } from 'vitest'
import { dateRange, hhmm, longDayNoYear, plainDate, plural, pluralWord, shortDay, stampText } from './dateText'

describe('dateRange (question 24)', () => {
  it('reads "Tue 24 Nov to Fri 27 Nov" in the apps', () => {
    expect(dateRange('2026-11-24', '2026-11-27')).toBe('Tue 24 Nov to Fri 27 Nov')
  })

  it('reads "4 Feb 2027 to 7 Mar 2027" for money and contracts', () => {
    expect(dateRange('2027-02-04', '2027-03-07', { withYear: true })).toBe('4 Feb 2027 to 7 Mar 2027')
  })

  it('reads one day when both ends match, in either shape', () => {
    expect(dateRange('2026-11-24', '2026-11-24')).toBe('Tue 24 Nov')
    expect(dateRange('2026-11-24T08:00:00', '2026-11-24T17:00:00', { withYear: true })).toBe('24 Nov 2026')
  })

  it('never uses a dash', () => {
    expect(dateRange('2026-11-24', '2026-12-08')).not.toMatch(/[–—-]/)
  })
})

describe('stampText (question 24)', () => {
  it('reads "Tue 24 Nov, 08:00"', () => {
    expect(stampText('2026-11-24T08:00:00')).toBe('Tue 24 Nov, 08:00')
  })

  it('drops the weekday on request', () => {
    expect(stampText('2026-11-23T16:00:00', { weekday: false })).toBe('23 Nov, 16:00')
  })

  it('reads the day alone when there is no time', () => {
    expect(stampText('2026-11-24')).toBe('Tue 24 Nov')
  })
})

describe('hhmm', () => {
  it('slices HH:MM from a local-naive ISO datetime', () => {
    expect(hhmm('2026-11-24T08:05:00')).toBe('08:05')
    expect(hhmm('2026-11-24')).toBe('')
    expect(hhmm(undefined)).toBe('')
  })

  it('pads whole minutes since midnight', () => {
    expect(hhmm(0)).toBe('00:00')
    expect(hhmm(485)).toBe('08:05')
    expect(hhmm(23 * 60 + 59)).toBe('23:59')
  })
})

describe('plural', () => {
  it('counts with the word', () => {
    expect(plural(1, 'session')).toBe('1 session')
    expect(plural(3, 'session')).toBe('3 sessions')
    expect(plural(0, 'List')).toBe('0 Lists')
    expect(plural(2, 'it is', 'they are')).toBe('2 they are')
  })

  it('pluralWord gives the word alone', () => {
    expect(pluralWord(1, 'The List stays', 'The Lists stay')).toBe('The List stays')
    expect(pluralWord(4, 'day')).toBe('days')
  })
})

describe('the moved day helpers keep their shapes', () => {
  it('shortDay and plainDate', () => {
    expect(shortDay('2026-11-24T08:00:00')).toBe('Tue 24 Nov')
    expect(plainDate('2027-02-04')).toBe('4 Feb 2027')
  })
})

describe('longDayNoYear', () => {
  it('reads "Tuesday 24 November"', () => {
    expect(longDayNoYear('2026-11-24T08:00:00')).toBe('Tuesday 24 November')
  })
})

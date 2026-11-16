import { describe, expect, it } from 'vitest'
import { dateRange, hhmm, longDayNoYear, plainDate, plural, pluralWord, shortDay, stampText } from './dateText'

describe('dateRange (question 24)', () => {
  it('reads "Tue 21 Jul to Fri 24 Jul" in the apps', () => {
    expect(dateRange('2026-07-21', '2026-07-24')).toBe('Tue 21 Jul to Fri 24 Jul')
  })

  it('reads "1 Oct 2026 to 1 Nov 2026" for money and contracts', () => {
    expect(dateRange('2026-10-01', '2026-11-01', { withYear: true })).toBe('1 Oct 2026 to 1 Nov 2026')
  })

  it('reads one day when both ends match, in either shape', () => {
    expect(dateRange('2026-07-21', '2026-07-21')).toBe('Tue 21 Jul')
    expect(dateRange('2026-07-21T08:00:00', '2026-07-21T17:00:00', { withYear: true })).toBe('21 Jul 2026')
  })

  it('never uses a dash', () => {
    expect(dateRange('2026-07-21', '2026-08-04')).not.toMatch(/[–—-]/)
  })
})

describe('stampText (question 24)', () => {
  it('reads "Tue 21 Jul, 08:00"', () => {
    expect(stampText('2026-07-21T08:00:00')).toBe('Tue 21 Jul, 08:00')
  })

  it('drops the weekday on request', () => {
    expect(stampText('2026-07-20T16:00:00', { weekday: false })).toBe('20 Jul, 16:00')
  })

  it('reads the day alone when there is no time', () => {
    expect(stampText('2026-07-21')).toBe('Tue 21 Jul')
  })
})

describe('hhmm', () => {
  it('slices HH:MM from a local-naive ISO datetime', () => {
    expect(hhmm('2026-07-21T08:05:00')).toBe('08:05')
    expect(hhmm('2026-07-21')).toBe('')
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
    expect(shortDay('2026-07-21T08:00:00')).toBe('Tue 21 Jul')
    expect(plainDate('2026-10-01')).toBe('1 Oct 2026')
  })
})

describe('longDayNoYear', () => {
  it('reads "Tuesday 21 July"', () => {
    expect(longDayNoYear('2026-07-21T08:00:00')).toBe('Tuesday 21 July')
  })
})

import { describe, expect, it } from 'vitest'
import type { PublicHoliday } from './types'
import { PUBLIC_HOLIDAYS } from './seed/availabilityAndHolidays'
import {
  coverAt,
  hoursText,
  isOverdue,
  nextOpening,
  respondBy,
  statusText,
  SUPPORT_CONFIG,
  supportReadings,
} from './support'

const HOLIDAYS: readonly PublicHoliday[] = PUBLIC_HOLIDAYS
const at = (h: number, m = 0) => h * 60 + m

describe('support rules (catch-up Phase 43b; US-15.0.8, US-15.0.9)', () => {
  describe('the stories\' acceptance criteria', () => {
    it('a P1 at 10:00am on a weekday is due by 11:00am (both channels)', () => {
      expect(respondBy('productSupport', 'P1', '2026-07-21T10:00:00', HOLIDAYS)).toBe('2026-07-21T11:00:00')
      expect(respondBy('helpLine', 'P1', '2026-07-21T10:00:00', HOLIDAYS)).toBe('2026-07-21T11:00:00')
    })

    it('a ticket at 7:00pm on a weekday is after hours with no guaranteed time', () => {
      expect(coverAt('productSupport', '2026-07-21', at(19), HOLIDAYS)).toEqual({ kind: 'afterHours', answered: false })
      expect(respondBy('productSupport', 'P1', '2026-07-21T19:00:00', HOLIDAYS)).toBeNull()
      expect(respondBy('helpLine', 'P3', '2026-07-21T19:00:00', HOLIDAYS)).toBeNull()
    })

    it('a ticket on a national public holiday reads publicHoliday (the call-out needs AA)', () => {
      const cover = coverAt('productSupport', '2026-10-26', at(10), HOLIDAYS)
      expect(cover).toMatchObject({ kind: 'publicHoliday', answered: false, holidayName: 'Labour Day' })
      expect(respondBy('productSupport', 'P2', '2026-10-26T10:00:00', HOLIDAYS)).toBeNull()
    })
  })

  it('after hours on the help line, a security breach or the platform offline is due within the hour', () => {
    expect(respondBy('helpLine', 'P1', '2026-07-21T19:00:00', HOLIDAYS, 'securityBreach')).toBe('2026-07-21T20:00:00')
    expect(respondBy('helpLine', 'P1', '2026-07-21T23:30:00', HOLIDAYS, 'platformOffline')).toBe('2026-07-22T00:30:00')
    // Product support takes no reason: after hours is best effort.
    expect(respondBy('productSupport', 'P1', '2026-07-21T19:00:00', HOLIDAYS, 'securityBreach')).toBeNull()
  })

  it('a P1 at 4:30pm rolls to 9:00am the next business day', () => {
    expect(respondBy('helpLine', 'P1', '2026-07-21T16:30:00', HOLIDAYS)).toBe('2026-07-22T09:00:00')
    // Friday 4:30pm rolls over the weekend.
    expect(respondBy('helpLine', 'P1', '2026-07-24T16:30:00', HOLIDAYS)).toBe('2026-07-27T09:00:00')
  })

  it('P2 is by the close of that business day; P4 has no time', () => {
    expect(respondBy('helpLine', 'P2', '2026-07-21T09:00:00', HOLIDAYS)).toBe('2026-07-21T17:00:00')
    expect(respondBy('productSupport', 'P4', '2026-07-21T09:00:00', HOLIDAYS)).toBeNull()
  })

  it('the two P3 rules are never crossed: help line 4 business hours, product support 3 business days', () => {
    expect(respondBy('helpLine', 'P3', '2026-07-21T10:00:00', HOLIDAYS)).toBe('2026-07-21T14:00:00')
    expect(respondBy('helpLine', 'P3', '2026-07-21T15:00:00', HOLIDAYS)).toBe('2026-07-22T10:30:00')
    expect(respondBy('productSupport', 'P3', '2026-07-21T10:00:00', HOLIDAYS)).toBe('2026-07-24T10:00:00')
    expect(SUPPORT_CONFIG.response.helpLine.P3.label).toBe('4 hours')
    expect(SUPPORT_CONFIG.response.productSupport.P3.label).toBe('3 business days')
  })

  it('a Friday product-support P3 lands the next Wednesday, a day later over a holiday Monday', () => {
    expect(respondBy('productSupport', 'P3', '2026-07-24T11:00:00', HOLIDAYS)).toBe('2026-07-29T11:00:00')
    // Fri 23 Oct; Mon 26 Oct is Labour Day.
    expect(respondBy('productSupport', 'P3', '2026-10-23T11:00:00', HOLIDAYS)).toBe('2026-10-29T11:00:00')
  })

  it('Canterbury Anniversary (regional) is a working day for support', () => {
    expect(coverAt('helpLine', '2026-11-13', at(10), HOLIDAYS).kind).toBe('inHours')
  })

  it('reads closed at the seed clock (8:00am) and open at 8:30am', () => {
    expect(coverAt('helpLine', '2026-07-21', at(8), HOLIDAYS).kind).toBe('afterHours')
    expect(statusText('helpLine', '2026-07-21', at(8), HOLIDAYS)).toEqual({ open: false, text: 'Closed, opens 8:30am' })
    expect(coverAt('helpLine', '2026-07-21', at(8, 30), HOLIDAYS).kind).toBe('inHours')
    expect(statusText('helpLine', '2026-07-21', at(9), HOLIDAYS)).toEqual({ open: true, text: 'Open now' })
    expect(coverAt('helpLine', '2026-07-21', at(17), HOLIDAYS).kind).toBe('afterHours')
  })

  it('names the next opening: tomorrow, a weekday, past a holiday', () => {
    expect(statusText('helpLine', '2026-07-21', at(19), HOLIDAYS).text).toBe('Closed, opens 8:30am tomorrow')
    expect(statusText('helpLine', '2026-07-24', at(19), HOLIDAYS).text).toBe('Closed, opens 8:30am Monday')
    expect(nextOpening('helpLine', '2026-10-23', at(19), HOLIDAYS)).toEqual({ dateISO: '2026-10-27', minutes: at(8, 30) })
    expect(statusText('helpLine', '2026-10-26', at(10), HOLIDAYS).text).toBe('Closed for Labour Day, opens 8:30am tomorrow')
    expect(nextOpening('helpLine', '2026-07-21', at(10), HOLIDAYS)).toBeNull()
  })

  it('the Christmas window is limited cover on product support only, holidays still closed', () => {
    expect(coverAt('productSupport', '2026-12-23', at(10), HOLIDAYS).kind).toBe('inHours')
    expect(coverAt('productSupport', '2026-12-24', at(10), HOLIDAYS).kind).toBe('christmas')
    expect(coverAt('productSupport', '2027-01-06', at(10), HOLIDAYS).kind).toBe('christmas')
    expect(coverAt('productSupport', '2027-01-07', at(10), HOLIDAYS).kind).toBe('inHours')
    expect(coverAt('productSupport', '2026-12-25', at(10), HOLIDAYS).kind).toBe('publicHoliday')
    expect(coverAt('helpLine', '2026-12-24', at(10), HOLIDAYS).kind).toBe('inHours')
    expect(respondBy('productSupport', 'P1', '2026-12-24T10:00:00', HOLIDAYS)).toBeNull()
    expect(statusText('productSupport', '2026-12-24', at(10), HOLIDAYS).text).toBe('Open now, limited Christmas cover')
  })

  it('an 8:00am start on one channel opens 8:00 on that channel only', () => {
    const before = SUPPORT_CONFIG.hours.productSupport.open
    const hours = SUPPORT_CONFIG.hours as { productSupport: { open: string } }
    hours.productSupport.open = '08:00'
    try {
      expect(coverAt('productSupport', '2026-07-21', at(8), HOLIDAYS).kind).toBe('inHours')
      expect(coverAt('helpLine', '2026-07-21', at(8), HOLIDAYS).kind).toBe('afterHours')
      expect(hoursText('productSupport')).toMatch(/^8:00am to 5:00pm NZT/)
    } finally {
      hours.productSupport.open = before
    }
  })

  it('reads the hours in words from the config', () => {
    expect(hoursText('helpLine')).toBe('8:30am to 5:00pm NZT, Monday to Friday, excluding New Zealand public holidays')
  })

  it('a Logged ticket past its respond-by is overdue; responded or without a time never is', () => {
    expect(isOverdue({ status: 'logged', respondByISO: '2026-07-21T11:00:00' }, '2026-07-21T11:01:00')).toBe(true)
    expect(isOverdue({ status: 'logged', respondByISO: '2026-07-21T11:00:00' }, '2026-07-21T11:00:00')).toBe(false)
    expect(isOverdue({ status: 'responded', respondByISO: '2026-07-21T11:00:00' }, '2026-07-22T11:00:00')).toBe(false)
    expect(isOverdue({ status: 'logged' }, '2027-01-01T00:00:00')).toBe(false)
  })

  it('a product-support response that would fall in the Christmas window is best effort (no time)', () => {
    // Wed 23 Dec P3 would be due Wed 30 Dec; a 4:30pm P1 on 23 Dec would be due 24 Dec at 9:00am.
    expect(respondBy('productSupport', 'P3', '2026-12-23T10:00:00', HOLIDAYS)).toBeNull()
    expect(respondBy('productSupport', 'P1', '2026-12-23T16:30:00', HOLIDAYS)).toBeNull()
    expect(respondBy('productSupport', 'P1', '2026-12-23T10:00:00', HOLIDAYS)).toBe('2026-12-23T11:00:00')
    // The help line has no Christmas window.
    expect(respondBy('helpLine', 'P1', '2026-12-23T16:30:00', HOLIDAYS)).toBe('2026-12-24T09:00:00')
  })

  it('a Christmas window inside one year is read plainly, not as a wrap', () => {
    const christmas = SUPPORT_CONFIG.christmas as { from: string; to: string }
    const before = { ...christmas }
    christmas.from = '12-20'
    christmas.to = '12-31'
    try {
      expect(coverAt('productSupport', '2026-03-02', at(10), HOLIDAYS).kind).toBe('inHours')
      expect(coverAt('productSupport', '2026-12-21', at(10), HOLIDAYS).kind).toBe('christmas')
      expect(coverAt('productSupport', '2027-01-05', at(10), HOLIDAYS).kind).toBe('inHours')
    } finally {
      Object.assign(christmas, before)
    }
  })

  it('the readings are worded from the config, so an 8:00am start changes them', () => {
    expect(supportReadings()[0]).toBe('Both channels open at 8:30am; whether AA needs cover from 8:00am is still to be agreed.')
    expect(supportReadings()[4]).toContain('24 December to 6 January')
    const hours = SUPPORT_CONFIG.hours as { helpLine: { open: string } }
    hours.helpLine.open = '08:00'
    try {
      expect(supportReadings()[0]).toMatch(/^The help line opens at 8:00am and product support at 8:30am/)
    } finally {
      hours.helpLine.open = '08:30'
    }
  })
})

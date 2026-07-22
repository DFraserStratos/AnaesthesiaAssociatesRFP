import { describe, expect, it } from 'vitest'
import {
  advanceDays,
  advanceMinutes,
  DEMO_TODAY,
  enumerateDatesISO,
  horizonFor,
  INITIAL_CLOCK,
  now,
  today,
} from './clock'

describe('demo clock state', () => {
  it('starts on DEMO_TODAY at 08:00', () => {
    expect(INITIAL_CLOCK).toEqual({ todayISO: '2026-07-21', minutesSinceMidnight: 480 })
    expect(today(INITIAL_CLOCK)).toBe(DEMO_TODAY)
  })

  it('now() is deterministic and built from the state', () => {
    const d = now(INITIAL_CLOCK)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6)
    expect(d.getDate()).toBe(21)
    expect(d.getHours()).toBe(8)
    expect(d.getMinutes()).toBe(0)
  })
})

describe('advanceMinutes', () => {
  it('advances within the day', () => {
    const s = advanceMinutes(INITIAL_CLOCK, 95)
    expect(s).toEqual({ todayISO: '2026-07-21', minutesSinceMidnight: 480 + 95 })
  })

  it('rolls past midnight into the next day', () => {
    const lateEvening = { todayISO: '2026-07-21', minutesSinceMidnight: 23 * 60 + 50 }
    const s = advanceMinutes(lateEvening, 20)
    expect(s).toEqual({ todayISO: '2026-07-22', minutesSinceMidnight: 10 })
  })

  it('carries multiple days', () => {
    const s = advanceMinutes(INITIAL_CLOCK, 2 * 24 * 60 + 30)
    expect(s).toEqual({ todayISO: '2026-07-23', minutesSinceMidnight: 480 + 30 })
  })
})

describe('advanceDays', () => {
  it('advances whole days keeping the time of day', () => {
    const s = advanceDays(INITIAL_CLOCK, 3)
    expect(s).toEqual({ todayISO: '2026-07-24', minutesSinceMidnight: 480 })
  })

  it('crosses month boundaries', () => {
    const s = advanceDays({ todayISO: '2026-07-31', minutesSinceMidnight: 0 }, 1)
    expect(s.todayISO).toBe('2026-08-01')
  })
})

describe('horizon helpers (Phase 02 seeder seams)', () => {
  it('spans DEMO_TODAY minus 14 days to plus 4 months', () => {
    expect(horizonFor(DEMO_TODAY)).toEqual({ startISO: '2026-07-07', endISO: '2026-11-21' })
  })

  it('enumerateDatesISO is inclusive of both ends and spans month boundaries', () => {
    expect(enumerateDatesISO('2026-07-30', '2026-08-02')).toEqual([
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ])
  })

  it('the full horizon enumerates 138 days', () => {
    const { startISO, endISO } = horizonFor(DEMO_TODAY)
    const dates = enumerateDatesISO(startISO, endISO)
    expect(dates).toHaveLength(138)
    expect(dates[0]).toBe('2026-07-07')
    expect(dates[dates.length - 1]).toBe('2026-11-21')
  })
})

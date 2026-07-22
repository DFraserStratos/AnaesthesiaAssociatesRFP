import { describe, expect, it } from 'vitest'
import { PARTIAL_INTERVAL_ROUNDING, timeUnits, timeUnitsFromMinutes } from './timeUnits'

describe('timeUnitsFromMinutes — tiered T1/T2 rule', () => {
  it('is the labelled round-up assumption', () => {
    expect(PARTIAL_INTERVAL_ROUNDING).toBe('up')
  })

  // The named boundary cases from the phase plan.
  it.each([
    [0, 0],
    [1, 1], // a started 15 min interval rounds up (ASSUMPTION)
    [15, 1],
    [16, 2],
    [90, 6],
    [119, 8],
    [120, 8], // exactly 2 hours stays in tier 1
    [121, 9], // 2h01 starts the first 10 min interval of tier 2
    [150, 11], // 2h30 = 8 + 3
    [300, 26], // 5h = 8 + 18
  ])('%i minutes = %i units', (minutes, units) => {
    expect(timeUnitsFromMinutes(minutes)).toBe(units)
  })

  it('yields 0 for negative spans', () => {
    expect(timeUnitsFromMinutes(-30)).toBe(0)
  })
})

describe('timeUnits over Dates', () => {
  it('computes from start/end Dates', () => {
    const start = new Date('2026-07-21T08:00:00')
    const end = new Date('2026-07-21T10:30:00')
    expect(timeUnits(start, end)).toBe(11)
  })

  it('yields 0 when end is not after start', () => {
    const start = new Date('2026-07-21T10:00:00')
    expect(timeUnits(start, start)).toBe(0)
    expect(timeUnits(start, new Date('2026-07-21T09:00:00'))).toBe(0)
  })
})

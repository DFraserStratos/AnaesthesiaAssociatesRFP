import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RVG_TIME_RULE as R,
  describeTimeRule,
  timeUnits,
  timeUnitsFromMinutes,
  validateRvgTimeRule,
  type RvgTimeRule,
} from './timeUnits'

describe('timeUnitsFromMinutes: the RVG time tiers held as data (US-05.2.2, D25)', () => {
  it("US-05.2.2's criteria: 95 minutes is 7, 125 minutes is 9", () => {
    expect(timeUnitsFromMinutes(95, R)).toBe(7)
    expect(timeUnitsFromMinutes(125, R)).toBe(9)
  })

  it.each([
    [0, 0],
    [1, 1], // a part interval always rounds up (OQ-75, confirmed)
    [15, 1],
    [16, 2],
    [90, 6],
    [119, 8],
    [120, 8], // exactly 2 hours stays in the first tier
    [121, 9], // 2h01 starts the first 10 minute interval of the second tier
    [150, 11], // 2h30 = 8 + 3
    [300, 26], // 5h = 8 + 18
  ])('%i minutes = %i units', (minutes, units) => {
    expect(timeUnitsFromMinutes(minutes, R)).toBe(units)
  })

  it('yields 0 for negative or non-numeric spans', () => {
    expect(timeUnitsFromMinutes(-30, R)).toBe(0)
    expect(timeUnitsFromMinutes(Number.NaN, R)).toBe(0)
  })

  it('a different rule changes the result: the tiers are data, not code', () => {
    const halfHourly: RvgTimeRule = { tiers: [{ fromMinute: 0, intervalMinutes: 30 }], partInterval: 'roundUp' }
    expect(timeUnitsFromMinutes(95, halfHourly)).toBe(4)
    const threeTiers: RvgTimeRule = {
      tiers: [
        { fromMinute: 0, intervalMinutes: 15 },
        { fromMinute: 60, intervalMinutes: 10 },
        { fromMinute: 120, intervalMinutes: 5 },
      ],
      partInterval: 'roundUp',
    }
    // 60 / 15 = 4, 60 / 10 = 6, 5 / 5 = 1.
    expect(timeUnitsFromMinutes(125, threeTiers)).toBe(11)
  })
})

describe('timeUnits over Dates', () => {
  it('computes from the start and finish stamps', () => {
    expect(timeUnits(new Date('2026-11-24T08:00:00'), new Date('2026-11-24T10:30:00'), R)).toBe(11)
  })

  it('yields 0 when the finish is not after the start', () => {
    const start = new Date('2026-11-24T10:00:00')
    expect(timeUnits(start, start, R)).toBe(0)
    expect(timeUnits(start, new Date('2026-11-24T09:00:00'), R)).toBe(0)
  })
})

describe('validateRvgTimeRule', () => {
  it('accepts the seeded rule', () => {
    expect(validateRvgTimeRule(R)).toBeNull()
  })

  it.each<[string, RvgTimeRule]>([
    ['no tiers', { tiers: [], partInterval: 'roundUp' }],
    ['a first tier after 0', { tiers: [{ fromMinute: 10, intervalMinutes: 15 }], partInterval: 'roundUp' }],
    ['a zero interval', { tiers: [{ fromMinute: 0, intervalMinutes: 0 }], partInterval: 'roundUp' }],
    ['a fractional interval', { tiers: [{ fromMinute: 0, intervalMinutes: 7.5 }], partInterval: 'roundUp' }],
    [
      'tiers out of order',
      { tiers: [{ fromMinute: 0, intervalMinutes: 15 }, { fromMinute: 120, intervalMinutes: 10 }, { fromMinute: 60, intervalMinutes: 5 }], partInterval: 'roundUp' },
    ],
    ['rounding other than up', { tiers: [{ fromMinute: 0, intervalMinutes: 15 }], partInterval: 'down' as 'roundUp' }],
  ])('refuses %s', (_label, rule) => {
    expect(validateRvgTimeRule(rule)).not.toBeNull()
  })
})

describe('describeTimeRule', () => {
  it('reads the seeded rule in words', () => {
    expect(describeTimeRule(R)).toBe('1 unit per 15 minutes or part for the first 2 hours, then 1 unit per 10 minutes or part.')
  })
})

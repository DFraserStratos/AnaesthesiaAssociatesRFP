/**
 * Repeating days off (catch-up Phase 29; US-01.5.3): occurrences, exceptions,
 * the series fill rule and the one-line description. Pure, demo-clock dates.
 */

import { describe, expect, it } from 'vitest'
import {
  activeSeriesUsing,
  describeSeries,
  instanceKey,
  planSeriesWrite,
  seriesInstances,
  seriesOccurrences,
  validateSeriesDraft,
  type AvailabilitySeriesDraft,
} from './availabilitySeries'
import { slotIdFor } from './slots'
import { seedSlotStatusRecords } from './seed'
import type { AvailabilitySeries, Slot } from './types'

const statuses = seedSlotStatusRecords()

const series = (over: Partial<AvailabilitySeries> = {}): AvailabilitySeries => ({
  id: 'AS0001',
  anaesthetistId: 'A1',
  statusKey: 'unavailable',
  sessions: 'PM',
  weekdays: [5],
  everyWeeks: 1,
  startISO: '2026-07-24',
  exceptions: {},
  createdAtISO: '2026-07-21T08:00:00',
  ...over,
})

const dates = (occ: { dateISO: string; session: string }[]) => occ.map((o) => `${o.dateISO} ${o.session}`)

describe('seriesOccurrences', () => {
  it('weekly Fridays PM across a month boundary', () => {
    expect(dates(seriesOccurrences(series(), '2026-07-20', '2026-08-16'))).toEqual([
      '2026-07-24 PM',
      '2026-07-31 PM',
      '2026-08-07 PM',
      '2026-08-14 PM',
    ])
  })

  it('fortnightly counts whole weeks from the start\'s week', () => {
    expect(dates(seriesOccurrences(series({ everyWeeks: 2 }), '2026-07-20', '2026-08-31'))).toEqual([
      '2026-07-24 PM',
      '2026-08-07 PM',
      '2026-08-21 PM',
    ])
  })

  it('counts calendar weeks, so the NZ daylight-saving change (27 Sep 2026) cannot drift it', () => {
    expect(dates(seriesOccurrences(series({ everyWeeks: 2, sessions: 'AM' }), '2026-09-14', '2026-10-12'))).toEqual([
      '2026-09-18 AM',
      '2026-10-02 AM',
    ])
  })

  it('a series that starts mid-week skips the earlier days of that week, then repeats from its week', () => {
    const s = series({ weekdays: [1, 3, 5], sessions: 'both', everyWeeks: 2, startISO: '2026-07-22' })
    expect(dates(seriesOccurrences(s, '2026-07-20', '2026-08-02'))).toEqual([
      '2026-07-22 AM',
      '2026-07-22 PM',
      '2026-07-24 AM',
      '2026-07-24 PM',
    ])
    expect(dates(seriesOccurrences(s, '2026-08-03', '2026-08-03'))).toEqual(['2026-08-03 AM', '2026-08-03 PM'])
  })

  it('stops at the until date', () => {
    expect(dates(seriesOccurrences(series({ untilISO: '2026-07-31' }), '2026-07-20', '2026-08-31'))).toEqual(['2026-07-24 PM', '2026-07-31 PM'])
  })

  it('is deterministic', () => {
    expect(seriesOccurrences(series(), '2026-07-20', '2026-12-31')).toEqual(seriesOccurrences(series(), '2026-07-20', '2026-12-31'))
  })
})

describe('seriesInstances: exceptions applied', () => {
  it('drops a deleted instance and carries an edited one\'s own status and note', () => {
    const s = series({
      note: 'Rooms',
      exceptions: {
        [instanceKey('2026-07-31', 'PM')]: { kind: 'deleted' },
        [instanceKey('2026-08-07', 'PM')]: { kind: 'edited', statusKey: 'holiday', note: 'Away' },
      },
    })
    const out = seriesInstances(s, '2026-07-20', '2026-08-10')
    expect(out.map((i) => [i.dateISO, i.statusKey, i.note, i.edited])).toEqual([
      ['2026-07-24', 'unavailable', 'Rooms', false],
      ['2026-08-07', 'holiday', 'Away', true],
    ])
  })
})

describe('planSeriesWrite: fills only default sessions in no other series', () => {
  const slot = (dateISO: string, over: Partial<Slot> = {}): Slot => ({
    id: slotIdFor('A1', dateISO, 'PM'),
    anaesthetistId: 'A1',
    dateISO,
    session: 'PM',
    status: 'free',
    ...over,
  })
  const slots: Record<string, Slot> = Object.fromEntries(
    [
      slot('2026-07-24', { status: 'holiday', note: 'Annual leave' }), // seeded leave: left
      slot('2026-07-31', { status: 'unavailable', seriesId: 'AS0009' }), // another series: left
      slot('2026-08-07'), // free: set
      // 2026-08-14 has no Slot: skipped
    ].map((s) => [s.id, s]),
  )

  it('sets free sessions, leaves set ones as they are and skips dates with no session', () => {
    const plan = planSeriesWrite(series(), slots, { fromISO: '2026-07-24', toISO: '2026-08-14' }, statuses)
    expect(plan.set.map((p) => p.dateISO)).toEqual(['2026-08-07'])
    expect(plan.leftAsIs).toEqual([slotIdFor('A1', '2026-07-24', 'PM'), slotIdFor('A1', '2026-07-31', 'PM')])
    expect(plan.skipped).toBe(1)
  })

  it('a Free session already in another series is left too', () => {
    const owned = { ...slots, [slotIdFor('A1', '2026-08-07', 'PM')]: slot('2026-08-07', { seriesId: 'AS0009' }) }
    expect(planSeriesWrite(series(), owned, { fromISO: '2026-08-07', toISO: '2026-08-07' }, statuses).leftAsIs).toHaveLength(1)
  })
})

describe('validateSeriesDraft', () => {
  const ctx = { todayISO: '2026-07-21', horizonEndISO: '2026-11-21', statuses }
  const draft = (over: Partial<AvailabilitySeriesDraft> = {}): AvailabilitySeriesDraft => ({
    anaesthetistId: 'A1', statusKey: 'unavailable', sessions: 'PM', weekdays: [5], everyWeeks: 2, startISO: '2026-07-24', ...over,
  })
  it('accepts a sound draft and refuses each fault in plain words', () => {
    expect(validateSeriesDraft(draft(), ctx)).toEqual([])
    expect(validateSeriesDraft(draft({ weekdays: [] }), ctx)).toContain('Choose at least one day of the week.')
    expect(validateSeriesDraft(draft({ everyWeeks: 5 as never }), ctx)).toContain('Repeat every 1 to 4 weeks.')
    expect(validateSeriesDraft(draft({ startISO: '2026-07-20' }), ctx)).toContain('Start the series today or later.')
    expect(validateSeriesDraft(draft({ startISO: '2026-12-01' }), ctx).join(' ')).toMatch(/schedule runs to/)
    expect(validateSeriesDraft(draft({ untilISO: '2026-07-01' }), ctx)).toContain('The end date is before the start date.')
    expect(validateSeriesDraft(draft({ statusKey: 'nope' }), ctx)).toContain('Choose an availability status.')
    expect(validateSeriesDraft(draft({ statusKey: 'free' }), ctx)).toContain('Repeating days off need a status that is not open for bookings, not Free.')
  })
})

describe('describeSeries', () => {
  it('reads as one plain line, with no dash and no "slot"', () => {
    expect(describeSeries(series({ everyWeeks: 2, untilISO: '2026-09-25' }), 'Unavailable')).toBe('Unavailable, Friday PM, every 2 weeks, until 25 Sep')
    expect(describeSeries(series({ weekdays: [1, 3], sessions: 'both' }), 'On holiday')).toBe('On holiday, Mon and Wed, all day, every week, no end date')
    const line = describeSeries(series({ weekdays: [5, 1, 3] }), 'Unavailable')
    expect(line).toBe('Unavailable, Mon, Wed and Fri PM, every week, no end date')
    expect(line).not.toMatch(/[–—]|slot/i)
  })
})

describe('activeSeriesUsing', () => {
  it('counts active series by status, edited instances included, ended ones not', () => {
    const records = {
      a: series({ id: 'a' }),
      b: series({ id: 'b', statusKey: 'holiday', exceptions: { x: { kind: 'edited', statusKey: 'unavailable' } } }),
      c: series({ id: 'c', endedAtISO: '2026-07-22T08:00:00' }),
    }
    expect(activeSeriesUsing(records, 'unavailable', '2026-07-21')).toBe(2)
    expect(activeSeriesUsing(records, 'holiday', '2026-07-21')).toBe(1)
    // A series past its until date no longer counts.
    const finished = { d: series({ id: 'd', untilISO: '2026-07-31' }) }
    expect(activeSeriesUsing(finished, 'unavailable', '2026-08-01')).toBe(0)
    expect(activeSeriesUsing(finished, 'unavailable', '2026-07-31')).toBe(1)
  })
})

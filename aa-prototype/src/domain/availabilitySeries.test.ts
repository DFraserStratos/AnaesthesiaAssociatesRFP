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
  startISO: '2026-11-27',
  exceptions: {},
  createdAtISO: '2026-11-24T08:00:00',
  ...over,
})

const dates = (occ: { dateISO: string; session: string }[]) => occ.map((o) => `${o.dateISO} ${o.session}`)

describe('seriesOccurrences', () => {
  it('weekly Fridays PM across a month boundary', () => {
    expect(dates(seriesOccurrences(series(), '2026-11-23', '2026-12-20'))).toEqual([
      '2026-11-27 PM',
      '2026-12-04 PM',
      '2026-12-11 PM',
      '2026-12-18 PM',
    ])
  })

  it('fortnightly counts whole weeks from the start\'s week', () => {
    expect(dates(seriesOccurrences(series({ everyWeeks: 2 }), '2026-11-23', '2027-01-04'))).toEqual([
      '2026-11-27 PM',
      '2026-12-11 PM',
      '2026-12-25 PM',
    ])
  })

  it('counts calendar weeks, so the NZ daylight-saving change (27 Sep 2026) cannot drift it', () => {
    expect(dates(seriesOccurrences(series({ everyWeeks: 2, sessions: 'AM' }), '2027-01-18', '2027-02-15'))).toEqual([
      '2027-01-22 AM',
      '2027-02-05 AM',
    ])
  })

  it('a series that starts mid-week skips the earlier days of that week, then repeats from its week', () => {
    const s = series({ weekdays: [1, 3, 5], sessions: 'both', everyWeeks: 2, startISO: '2026-11-25' })
    expect(dates(seriesOccurrences(s, '2026-11-23', '2026-12-06'))).toEqual([
      '2026-11-25 AM',
      '2026-11-25 PM',
      '2026-11-27 AM',
      '2026-11-27 PM',
    ])
    expect(dates(seriesOccurrences(s, '2026-12-07', '2026-12-07'))).toEqual(['2026-12-07 AM', '2026-12-07 PM'])
  })

  it('stops at the until date', () => {
    expect(dates(seriesOccurrences(series({ untilISO: '2026-12-04' }), '2026-11-23', '2027-01-04'))).toEqual(['2026-11-27 PM', '2026-12-04 PM'])
  })

  it('is deterministic', () => {
    expect(seriesOccurrences(series(), '2026-11-23', '2026-12-31')).toEqual(seriesOccurrences(series(), '2026-11-23', '2026-12-31'))
  })
})

describe('seriesInstances: exceptions applied', () => {
  it('drops a deleted instance and carries an edited one\'s own status and note', () => {
    const s = series({
      note: 'Rooms',
      exceptions: {
        [instanceKey('2026-12-04', 'PM')]: { kind: 'deleted' },
        [instanceKey('2026-12-11', 'PM')]: { kind: 'edited', statusKey: 'holiday', note: 'Away' },
      },
    })
    const out = seriesInstances(s, '2026-11-23', '2026-12-14')
    expect(out.map((i) => [i.dateISO, i.statusKey, i.note, i.edited])).toEqual([
      ['2026-11-27', 'unavailable', 'Rooms', false],
      ['2026-12-11', 'holiday', 'Away', true],
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
      slot('2026-11-27', { status: 'holiday', note: 'Annual leave' }), // seeded leave: left
      slot('2026-12-04', { status: 'unavailable', seriesId: 'AS0009' }), // another series: left
      slot('2026-12-11'), // free: set
      // 2026-08-14 has no Slot: skipped
    ].map((s) => [s.id, s]),
  )

  it('sets free sessions, leaves set ones as they are and skips dates with no session', () => {
    const plan = planSeriesWrite(series(), slots, { fromISO: '2026-11-27', toISO: '2026-12-18' }, statuses)
    expect(plan.set.map((p) => p.dateISO)).toEqual(['2026-12-11'])
    expect(plan.leftAsIs).toEqual([slotIdFor('A1', '2026-11-27', 'PM'), slotIdFor('A1', '2026-12-04', 'PM')])
    expect(plan.skipped).toBe(1)
  })

  it('a Free session already in another series is left too', () => {
    const owned = { ...slots, [slotIdFor('A1', '2026-12-11', 'PM')]: slot('2026-12-11', { seriesId: 'AS0009' }) }
    expect(planSeriesWrite(series(), owned, { fromISO: '2026-12-11', toISO: '2026-12-11' }, statuses).leftAsIs).toHaveLength(1)
  })
})

describe('validateSeriesDraft', () => {
  const ctx = { todayISO: '2026-11-24', horizonEndISO: '2027-03-27', statuses }
  const draft = (over: Partial<AvailabilitySeriesDraft> = {}): AvailabilitySeriesDraft => ({
    anaesthetistId: 'A1', statusKey: 'unavailable', sessions: 'PM', weekdays: [5], everyWeeks: 2, startISO: '2026-11-27', ...over,
  })
  it('accepts a sound draft and refuses each fault in plain words', () => {
    expect(validateSeriesDraft(draft(), ctx)).toEqual([])
    expect(validateSeriesDraft(draft({ weekdays: [] }), ctx)).toContain('Choose at least one day of the week.')
    expect(validateSeriesDraft(draft({ everyWeeks: 5 as never }), ctx)).toContain('Repeat every 1 to 4 weeks.')
    expect(validateSeriesDraft(draft({ startISO: '2026-11-23' }), ctx)).toContain('Start the series today or later.')
    expect(validateSeriesDraft(draft({ startISO: '2027-04-06' }), ctx).join(' ')).toMatch(/schedule runs to/)
    expect(validateSeriesDraft(draft({ untilISO: '2026-11-04' }), ctx)).toContain('The end date is before the start date.')
    expect(validateSeriesDraft(draft({ statusKey: 'nope' }), ctx)).toContain('Choose an availability status.')
    expect(validateSeriesDraft(draft({ statusKey: 'free' }), ctx)).toContain('Repeating days off need a status that is not open for bookings, not Free.')
  })
})

describe('describeSeries', () => {
  it('reads as one plain line, with no dash and no "slot"', () => {
    expect(describeSeries(series({ everyWeeks: 2, untilISO: '2027-01-29' }), 'Unavailable')).toBe('Unavailable, Friday PM, every 2 weeks, until 29 Jan')
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
      c: series({ id: 'c', endedAtISO: '2026-11-25T08:00:00' }),
    }
    expect(activeSeriesUsing(records, 'unavailable', '2026-11-24')).toBe(2)
    expect(activeSeriesUsing(records, 'holiday', '2026-11-24')).toBe(1)
    // A series past its until date no longer counts.
    const finished = { d: series({ id: 'd', untilISO: '2026-12-04' }) }
    expect(activeSeriesUsing(finished, 'unavailable', '2026-12-05')).toBe(0)
    expect(activeSeriesUsing(finished, 'unavailable', '2026-12-04')).toBe(1)
  })
})

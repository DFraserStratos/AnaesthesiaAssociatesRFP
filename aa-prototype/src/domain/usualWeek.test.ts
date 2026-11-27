import { describe, expect, it } from 'vitest'
import type { AvailabilitySeries, RecurringBooking } from './types'
import { isRecurringBookingLive, publicSessionsOf, runsNote, runsText, timesText, usualWeek, weekdayPlural, weekdayShort } from './usualWeek'
import { RECURRING_BOOKINGS } from './seed/recurringBookings'
import { publicSessionSeries } from './seed/publicSessions'
import { ANAE, SURG } from './seed/cast'

const TODAY = '2026-11-24'

function rb(id: string, over: Partial<RecurringBooking> = {}): RecurringBooking {
  return { id, hospitalId: 'H1', anaesthetistId: 'A1', surgeonId: 'S1', dayOfWeek: 1, session: 'AM', kind: 'private', ...over }
}

function series(id: string, over: Partial<AvailabilitySeries> = {}): AvailabilitySeries {
  return {
    id,
    anaesthetistId: 'A1',
    statusKey: 'publicHospital',
    sessions: 'AM',
    note: 'CPH',
    weekdays: [4],
    everyWeeks: 1,
    startISO: '2026-07-01',
    exceptions: {},
    createdAtISO: '2026-07-01T08:00:00',
    ...over,
  }
}

const byId = (rows: readonly RecurringBooking[]) => Object.fromEntries(rows.map((r) => [r.id, r]))
const bySeriesId = (rows: readonly AvailabilitySeries[]) => Object.fromEntries(rows.map((r) => [r.id, r]))

describe('usualWeek grid placement', () => {
  it('lays an anaesthetist\'s live recurring bookings Monday to Friday by AM and PM', () => {
    const week = usualWeek({
      recurringBookings: byId([rb('R1', { dayOfWeek: 1, session: 'AM' }), rb('R2', { dayOfWeek: 3, session: 'PM' }), rb('R3', { anaesthetistId: 'A2' })]),
      perspective: 'anaesthetist',
      subjectId: 'A1',
      todayISO: TODAY,
    })
    expect(week.grid.AM.map((c) => c.dayOfWeek)).toEqual([1, 2, 3, 4, 5])
    expect(week.grid.AM[0]!.recurringBookings.map((r) => r.id)).toEqual(['R1'])
    expect(week.grid.PM[2]!.recurringBookings.map((r) => r.id)).toEqual(['R2'])
    expect(week.grid.AM.flatMap((c) => c.recurringBookings).map((r) => r.id)).toEqual(['R1'])
    expect(week.live.map((r) => r.id)).toEqual(['R1', 'R2'])
    expect(week.otherPeople).toBe(1)
  })

  it('stacks several recurring bookings in one surgeon cell, one per anaesthetist', () => {
    const week = usualWeek({
      recurringBookings: byId([
        rb('R1', { anaesthetistId: 'A1', dayOfWeek: 3, session: 'PM' }),
        rb('R2', { anaesthetistId: 'A2', dayOfWeek: 3, session: 'PM' }),
        rb('R3', { anaesthetistId: 'A2', dayOfWeek: 2, session: 'AM', surgeonId: 'S2' }),
      ]),
      perspective: 'surgeon',
      subjectId: 'S1',
      todayISO: TODAY,
    })
    expect(week.grid.PM[2]!.recurringBookings.map((r) => r.id)).toEqual(['R1', 'R2'])
    expect(week.live).toHaveLength(2)
    expect(week.otherPeople).toBe(2)
  })

  it('holds Ms Patel\'s seeded Wednesday PM with two anaesthetists', () => {
    const week = usualWeek({ recurringBookings: byId(RECURRING_BOOKINGS), perspective: 'surgeon', subjectId: SURG.patel, todayISO: TODAY })
    const wedPm = week.grid.PM[2]!.recurringBookings
    expect(wedPm.map((r) => r.anaesthetistId).sort()).toEqual([ANAE.beaumont, ANAE.sharma].sort())
  })
})

describe('usualWeek live and ended', () => {
  it('moves retired and past-end recurring bookings to the ended list and off the grid', () => {
    const week = usualWeek({
      recurringBookings: byId([
        rb('R1'),
        rb('R2', { dayOfWeek: 2, retiredAtISO: '2026-11-02T10:00:00', effectiveToISO: '2026-11-03' }),
        rb('R3', { dayOfWeek: 3, effectiveToISO: '2026-11-23' }),
        rb('R4', { dayOfWeek: 4, effectiveToISO: TODAY }),
        rb('R5', { dayOfWeek: 5, effectiveFromISO: '2026-12-07' }),
      ]),
      perspective: 'anaesthetist',
      subjectId: 'A1',
      todayISO: TODAY,
    })
    expect(week.live.map((r) => r.id)).toEqual(['R1', 'R4', 'R5'])
    expect(week.ended.map((r) => r.id)).toEqual(['R2', 'R3'])
    expect(week.grid.AM[1]!.recurringBookings).toEqual([])
    expect(week.grid.AM[2]!.recurringBookings).toEqual([])
    expect(week.grid.AM[3]!.recurringBookings.map((r) => r.id)).toEqual(['R4'])
    expect(week.grid.AM[4]!.recurringBookings.map((r) => r.id)).toEqual(['R5'])
  })

  it('reads a recurring booking as live until its end date has passed', () => {
    expect(isRecurringBookingLive({}, TODAY)).toBe(true)
    expect(isRecurringBookingLive({ effectiveToISO: TODAY }, TODAY)).toBe(true)
    expect(isRecurringBookingLive({ effectiveToISO: '2026-11-23' }, TODAY)).toBe(false)
    expect(isRecurringBookingLive({ retiredAtISO: '2026-11-30T09:00:00', effectiveToISO: '2026-12-31' }, TODAY)).toBe(false)
  })
})

describe('usualWeek off the grid', () => {
  it('keeps weekend recurring bookings out of the grid, Saturday before Sunday', () => {
    const week = usualWeek({
      recurringBookings: byId([rb('R1', { dayOfWeek: 0 }), rb('R2', { dayOfWeek: 6 }), rb('R3')]),
      perspective: 'anaesthetist',
      subjectId: 'A1',
      todayISO: TODAY,
    })
    expect(week.offGrid.map((r) => r.id)).toEqual(['R2', 'R1'])
    expect(week.grid.AM.flatMap((c) => c.recurringBookings).map((r) => r.id)).toEqual(['R3'])
    expect(week.live).toHaveLength(3)
  })
})

describe('usualWeek Public sessions', () => {
  const recurringBookings = byId([rb('R1', { dayOfWeek: 4, session: 'PM' })])

  it('reads an anaesthetist\'s active Public series onto the grid', () => {
    const week = usualWeek({
      recurringBookings,
      availabilitySeries: bySeriesId([series('AS1')]),
      perspective: 'anaesthetist',
      subjectId: 'A1',
      todayISO: TODAY,
    })
    expect(week.grid.AM[3]!.publicSession).toMatchObject({ seriesId: 'AS1', dayOfWeek: 4, session: 'AM', note: 'CPH' })
    expect(week.grid.PM[3]!.publicSession).toBeUndefined()
    expect(week.publicSessions).toHaveLength(1)
  })

  it('splits a both-sessions series into AM and PM and maps Saturday off the grid', () => {
    const sessions = publicSessionsOf(bySeriesId([series('AS1', { sessions: 'both', weekdays: [2, 6] })]), 'A1', TODAY)
    expect(sessions.map((p) => `${p.dayOfWeek}${p.session}`)).toEqual(['2AM', '2PM', '6AM', '6PM'])
    const week = usualWeek({ recurringBookings, availabilitySeries: bySeriesId([series('AS1', { sessions: 'both', weekdays: [2, 6] })]), perspective: 'anaesthetist', subjectId: 'A1', todayISO: TODAY })
    expect(week.offGridPublic.map((p) => `${p.dayOfWeek}${p.session}`)).toEqual(['6AM', '6PM'])
  })

  it('skips ended series, other statuses and other anaesthetists', () => {
    const sessions = publicSessionsOf(
      bySeriesId([
        series('AS1', { endedAtISO: '2026-11-01T09:00:00' }),
        series('AS2', { untilISO: '2026-11-20' }),
        series('AS3', { statusKey: 'unavailable' }),
        series('AS4', { anaesthetistId: 'A2' }),
      ]),
      'A1',
      TODAY,
    )
    expect(sessions).toEqual([])
  })

  it('never carries Public sessions on the surgeon perspective', () => {
    const week = usualWeek({
      recurringBookings,
      availabilitySeries: bySeriesId([series('AS1', { anaesthetistId: 'S1' })]),
      perspective: 'surgeon',
      subjectId: 'S1',
      todayISO: TODAY,
    })
    expect(week.publicSessions).toEqual([])
    expect(week.grid.AM.every((c) => c.publicSession === undefined)).toBe(true)
  })

  it('finds Dr Souter\'s seeded Thursday AM Public session beside her six recurring bookings', () => {
    const week = usualWeek({
      recurringBookings: byId(RECURRING_BOOKINGS),
      availabilitySeries: bySeriesId(publicSessionSeries('2026-07-01')),
      perspective: 'anaesthetist',
      subjectId: ANAE.souter,
      todayISO: TODAY,
    })
    expect(week.live).toHaveLength(6)
    expect(week.publicSessions.map((p) => `${p.dayOfWeek}${p.session}`)).toEqual(['4AM'])
    expect(week.grid.AM[3]!.recurringBookings).toEqual([])
  })
})

describe('usualWeek words', () => {
  it('names the days', () => {
    expect(weekdayShort(1)).toBe('Mon')
    expect(weekdayShort(0)).toBe('Sun')
    expect(weekdayPlural(3)).toBe('Wednesdays')
    expect(weekdayPlural(6)).toBe('Saturdays')
  })

  it('writes when a recurring booking runs', () => {
    expect(runsNote({}, TODAY)).toBeUndefined()
    expect(runsNote({ effectiveToISO: '2026-12-15' }, TODAY)).toBe('Until Tue 15 Dec')
    expect(runsNote({ effectiveFromISO: '2026-12-07' }, TODAY)).toBe('From Mon 7 Dec')
    expect(runsNote({ effectiveFromISO: '2026-07-01' }, TODAY)).toBeUndefined()
    expect(runsNote({ effectiveFromISO: '2026-12-07', effectiveToISO: '2026-12-21' }, TODAY)).toBe('From Mon 7 Dec until Mon 21 Dec')
    expect(runsText({}, TODAY)).toBe('Ongoing')
    expect(runsText({ effectiveToISO: '2026-12-15' }, TODAY)).toBe('Until Tue 15 Dec')
    expect(runsText({ retiredAtISO: '2026-11-02T10:00:00', effectiveToISO: '2026-11-03' }, TODAY)).toBe('Retired 2 Nov')
    expect(runsText({ effectiveToISO: '2026-11-10' }, TODAY)).toBe('Ended Tue 10 Nov')
    expect(timesText({ startTime: '13:00', endTime: '17:00' })).toBe('13:00 to 17:00')
    expect(timesText({})).toBeUndefined()
  })
})

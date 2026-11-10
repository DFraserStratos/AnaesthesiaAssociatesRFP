/**
 * The out-of-hours session module (catch-up Phase 32c; US-01.1.6): its label,
 * the day order every view sorts by, the one "Lists on this day" helper and
 * the open refusal.
 */

import { describe, expect, it } from 'vitest'
import { OUT_OF_HOURS, OUT_OF_HOURS_DESIGN, compareSessions, isOutOfHours, listsOnDay, openOutOfHoursRefusal, sessionRank, sessionText } from './outOfHours'
import { defaultScheduleSettings } from './slots'
import type { AssignedList, DraftList, List } from './types'

const base = { kind: 'private' as const, hospitalId: 'H1', surgeonId: 'S1', conflicts: [], state: 'ACTIVE' as const, anaesthetistId: 'A', dateISO: '2026-07-21' }
const am: AssignedList = { ...base, id: 'L-AM', session: 'AM', slotId: 'S-A-2026-07-21-AM' }
const pm: AssignedList = { ...base, id: 'L-PM', session: 'PM', slotId: 'S-A-2026-07-21-PM' }
const ooh: AssignedList = { ...base, id: 'L-OOH', session: 'OOH', slotId: 'S-A-2026-07-21-OOH' }
const draft: DraftList = { ...base, id: 'LG1', state: 'DRAFT', anaesthetistId: undefined, session: 'OOH', draft: { origin: 'request', sinceISO: '2026-07-20T09:00:00', by: 'Kirsty W.' } }
const lists: Record<string, List> = Object.fromEntries([ooh, pm, draft, am].map((l) => [l.id, l]))

describe('the out-of-hours session', () => {
  it('is the session OOH and reads "Out-of-hours" wherever AM or PM would', () => {
    expect(OUT_OF_HOURS).toBe('OOH')
    expect(isOutOfHours(ooh)).toBe(true)
    expect(isOutOfHours(pm)).toBe(false)
    expect([sessionText('AM'), sessionText(pm), sessionText(ooh), sessionText('OOH')]).toEqual(['AM', 'PM', 'Out-of-hours', 'Out-of-hours'])
  })

  it('sorts after PM, never by its text (OOH would sort between AM and PM)', () => {
    expect([sessionRank('AM'), sessionRank('PM'), sessionRank('OOH')]).toEqual([0, 1, 2])
    expect((['OOH', 'PM', 'AM'] as const).slice().sort(compareSessions)).toEqual(['AM', 'PM', 'OOH'])
  })

  it('seeds its default times into the schedule settings, 18:00 to 21:00', () => {
    expect(defaultScheduleSettings().defaultTimes.OOH).toEqual({ startTime: OUT_OF_HOURS_DESIGN.defaultStart, endTime: OUT_OF_HOURS_DESIGN.defaultEnd })
    expect(OUT_OF_HOURS_DESIGN.defaultStart).toBe('18:00')
  })
})

describe('listsOnDay', () => {
  it('AM, PM, then out-of-hours; never a Draft List, a colleague or another day', () => {
    expect(listsOnDay(lists, 'A', '2026-07-21').map((l) => l.id)).toEqual(['L-AM', 'L-PM', 'L-OOH'])
    expect(listsOnDay(Object.values(lists), 'B', '2026-07-21')).toEqual([])
    expect(listsOnDay(lists, 'A', '2026-07-22')).toEqual([])
  })
})

describe('openOutOfHoursRefusal', () => {
  const office = { role: 'office' as const, source: 'office' as const }
  const ok = { actor: office, dateISO: '2026-07-21', todayISO: '2026-07-21', hasRow: true, alreadyOpen: false }

  it('opens for the office, today or later, on a day the anaesthetist is on the schedule, once', () => {
    expect(openOutOfHoursRefusal(ok)).toBeNull()
    expect(openOutOfHoursRefusal({ ...ok, dateISO: '2026-07-30' })).toBeNull()
  })

  it('refuses in a plain sentence: the anaesthetist, a feed, a past day, no row, already open', () => {
    expect(openOutOfHoursRefusal({ ...ok, actor: { role: 'anaesthetist', source: 'anaesthetist' } })?.code).toBe('officeOnly')
    expect(openOutOfHoursRefusal({ ...ok, actor: { role: 'office', source: 'integration' } })?.code).toBe('officeOnly')
    expect(openOutOfHoursRefusal({ ...ok, dateISO: '2026-07-20' })?.code).toBe('pastDate')
    expect(openOutOfHoursRefusal({ ...ok, hasRow: false })?.code).toBe('noRow')
    expect(openOutOfHoursRefusal({ ...ok, alreadyOpen: true })).toMatchObject({ code: 'alreadyOpen', message: 'This anaesthetist already has an out-of-hours session that day.' })
    for (const r of [
      openOutOfHoursRefusal({ ...ok, dateISO: '2026-07-20' }),
      openOutOfHoursRefusal({ ...ok, hasRow: false }),
      openOutOfHoursRefusal({ ...ok, alreadyOpen: true }),
    ]) {
      expect(r?.message).not.toMatch(/slot|[–—]/i)
    }
  })
})

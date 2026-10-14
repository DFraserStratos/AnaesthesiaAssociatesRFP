/**
 * Days off ahead, repeating days off and single-instance edits (catch-up
 * Phase 29; US-01.2.1, US-01.5.3; OQ-27, OQ-64, OQ-81 part 1). One mechanism:
 * every action writes the Slot's own status; a series is a rule plus
 * exceptions; the clash with a List is the one rule; every generating path
 * paints series before recurring bookings.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  clearAvailability,
  createAvailabilitySeries,
  deleteAvailabilitySeries,
  seriesCalendarFor,
  setAvailabilityRange,
} from './availabilityActions'
import { setAvailability, setHorizonMonths, addAnaesthetist, reassignList } from './index'
import { addSlotStatus } from './slotStatusActions'
import { advanceClockDays } from './clockActions'
import { canvasMastersFrom } from './slotActions'
import { listInSlot, scheduleHorizon } from './selectors'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import type { Actor } from './mutate'
import { ANAE, SEED_LIST_IDS, generateCanvasForDates } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { instanceKey, type AvailabilitySeriesDraft } from '../domain/availabilitySeries'
import { enumerateDatesISO, horizonDatesBetween, horizonFor } from '../domain/clock'
import { parseISO, getISODay } from 'date-fns'
import { describeConflict } from '../domain/conflicts'
import { conflictLookups } from './conflictReconcile'

const OFFICE = OFFICE_ACTOR
const SOUTER = SOUTER_ACTOR
const SHARMA: Actor = { who: 'Dr Priya Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }
const FEED: Actor = { who: 'Feed', role: 'system', source: 'integration' }

const store = (): BoundAppStore => createAppStore()
const souterSlot = (api: BoundAppStore, dateISO: string, session: 'AM' | 'PM') => api.getState().schedule.slots[slotIdFor(ANAE.souter, dateISO, session)]!
const audit = (api: BoundAppStore, action: string) => api.getState().audit.filter((a) => a.action === action)

/** Fortnightly Friday PM Unavailable for Souter from Fri 31 Jul (Fri 24 holds her Lists; her seeded leave is Sat 25 to Sun 26). */
const fridayPm = (over: Partial<AvailabilitySeriesDraft> = {}): AvailabilitySeriesDraft => ({
  anaesthetistId: ANAE.souter,
  statusKey: 'unavailable',
  sessions: 'PM',
  weekdays: [5],
  everyWeeks: 2,
  startISO: '2026-07-31',
  ...over,
})

describe('setAvailabilityRange (days off ahead)', () => {
  it('a two-week holiday writes 28 sessions in one audit entry, plus one per List flagged (the office; catch-up Phase 32 refuses it for the anaesthetist while it holds Lists)', () => {
    const api = store()
    const range = { anaesthetistId: ANAE.souter, fromISO: '2026-08-17', toISO: '2026-08-30', sessions: 'both' as const, statusKey: 'holiday', note: 'Away' }
    const refused = setAvailabilityRange(api, SOUTER, range)
    expect(refused.ok ? '' : refused.code).toBe('holdsList')
    expect(refused.ok ? [] : (refused.details as { listIds: string[] }).listIds.length).toBeGreaterThan(1)
    expect(audit(api, 'availability.setRange')).toHaveLength(0)
    const out = setAvailabilityRange(api, OFFICE, range)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.set).toBe(28)
    expect(audit(api, 'availability.setRange')).toHaveLength(1)
    // Her Monday to Thursday recurring Lists sit in that fortnight.
    expect(out.value.flagged.length).toBeGreaterThan(0)
    expect(audit(api, 'list.conflict')).toHaveLength(out.value.flagged.length)
    for (const d of enumerateDatesISO('2026-08-17', '2026-08-30')) {
      expect(souterSlot(api, d, 'AM')).toMatchObject({ status: 'holiday', note: 'Away' })
    }
  })

  it('over a booked session the office flags exactly that List, leaving it otherwise identical, once', () => {
    const api = store()
    const listId = SEED_LIST_IDS.souterAm21
    const before = api.getState().schedule.lists[listId]!
    const out = setAvailabilityRange(api, OFFICE, { anaesthetistId: ANAE.souter, fromISO: '2026-07-21', toISO: '2026-07-21', sessions: 'AM', statusKey: 'unavailable' })
    expect(out.ok && out.value.flagged).toEqual([listId])
    setAvailabilityRange(api, OFFICE, { anaesthetistId: ANAE.souter, fromISO: '2026-07-21', toISO: '2026-07-21', sessions: 'AM', statusKey: 'holiday' })
    const after = api.getState().schedule.lists[listId]!
    expect(after.conflicts.filter((c) => c.kind === 'availability')).toHaveLength(1)
    expect(after.conflicts.find((c) => c.kind === 'availability')).toMatchObject({ statusKey: 'holiday', cause: `availability:${after.slotId}:holiday` })
    const detail = describeConflict(after.conflicts[0]!, after, conflictLookups(api.getState())).detail
    expect(detail).toMatch(/^Dr Souter is marked .+ for this session\.$/)
    expect(detail).not.toMatch(/notified|told/i)
    const { conflicts: _a, ...restAfter } = after
    const { conflicts: _b, ...restBefore } = before
    void _a
    void _b
    expect(restAfter).toEqual(restBefore)
  })

  it('Free over a booked session flags nothing and clears an earlier availability flag', () => {
    const api = store()
    const listId = SEED_LIST_IDS.souterAm21
    expect(setAvailability(api, OFFICE, ANAE.souter, '2026-07-21', 'AM', 'unavailable').ok).toBe(true)
    expect(api.getState().schedule.lists[listId]!.conflicts.some((c) => c.kind === 'availability')).toBe(true)
    const out = setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-07-21', toISO: '2026-07-21', sessions: 'AM', statusKey: 'free' })
    expect(out.ok && out.value.flagged).toEqual([])
    expect(out.ok && out.value.cleared).toEqual([listId])
    expect(api.getState().schedule.lists[listId]!.conflicts.some((c) => c.kind === 'availability')).toBe(false)
    expect(audit(api, 'list.conflictResolved')).toHaveLength(1)
    expect(audit(api, 'list.conflictCleared')).toHaveLength(0)
  })

  it('refuses, writing nothing: a colleague, an office-only status, a retired or unknown status, past and beyond-horizon dates, a feed, no session', () => {
    const api = store()
    const range = { anaesthetistId: ANAE.souter, fromISO: '2026-08-10', toISO: '2026-08-16', sessions: 'both' as const, statusKey: 'holiday' }
    expect(addSlotStatus(api, OFFICE, { label: 'Office hold', longLabel: 'Held by the office', description: 'Office use.', colour: 'unavailable', treatment: 'hatched', bookable: false, anaesthetistCanSet: false, isDefault: false }).ok).toBe(true)
    const before = api.getState()
    const code = (o: ReturnType<typeof setAvailabilityRange>) => (o.ok ? 'ok' : o.code)
    expect(code(setAvailabilityRange(api, SHARMA, range))).toBe('notOwnAvailability')
    expect(code(setAvailabilityRange(api, SOUTER, { ...range, statusKey: 'ST0001' }))).toBe('statusNotSettable')
    expect(code(setAvailabilityRange(api, SOUTER, { ...range, statusKey: 'nope' }))).toBe('statusNotFound')
    expect(code(setAvailabilityRange(api, SOUTER, { ...range, fromISO: '2026-07-20' }))).toBe('invalidRange')
    expect(code(setAvailabilityRange(api, SOUTER, { ...range, toISO: '2027-02-01' }))).toBe('invalidRange')
    expect(code(setAvailabilityRange(api, SOUTER, { ...range, toISO: '2026-08-01' }))).toBe('invalidRange')
    expect(code(setAvailabilityRange(api, FEED, range))).toBe('integrationForbidden')
    expect(api.getState().schedule).toBe(before.schedule)
    // The office may use an office-only status for anyone.
    expect(setAvailabilityRange(api, OFFICE, { ...range, statusKey: 'ST0001' }).ok).toBe(true)
    // No session before a start date.
    const added = addAnaesthetist(api, OFFICE, { registrationNumber: '99001', name: 'Dr Nadia Kerr', phone: '021 000 0000', email: 'n@example.test', unitValue: 25, gstPeriod: 'monthly', hpiId: '99KERN', startDateISO: '2026-08-12' } as never)
    expect(added.ok).toBe(true)
    const kerr: Actor = { who: 'Dr Nadia Kerr', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '99001' }
    const noSlot = setAvailabilityRange(api, kerr, { ...range, anaesthetistId: '99001' })
    expect(noSlot.ok ? 'ok' : noSlot.code).toBe('noSlot')
    expect(noSlot.ok ? '' : noSlot.message).not.toMatch(/slot/i)
  })

  it('is deterministic: the same actions give the same state', () => {
    const run = () => {
      const api = store()
      setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-10', toISO: '2026-08-16', sessions: 'both', statusKey: 'holiday' })
      createAvailabilitySeries(api, SOUTER, fridayPm())
      return api.getState()
    }
    const a = run()
    const b = run()
    expect(a.schedule).toEqual(b.schedule)
    expect(a.audit).toEqual(b.audit)
  })
})

describe('series (US-01.5.3)', () => {
  it('a fortnightly Friday PM series fills to the horizon and leaves an earlier day off alone', () => {
    const api = store()
    setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-14', toISO: '2026-08-14', sessions: 'PM', statusKey: 'holiday' })
    const out = createAvailabilitySeries(api, SOUTER, fridayPm())
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.seriesId).toBe('AS0001')
    expect(out.value.leftAsIs).toBe(1)
    expect(souterSlot(api, '2026-08-14', 'PM')).toMatchObject({ status: 'holiday' })
    expect(souterSlot(api, '2026-08-14', 'PM').seriesId).toBeUndefined()
    expect(souterSlot(api, '2026-07-31', 'PM')).toMatchObject({ status: 'unavailable', seriesId: 'AS0001' })
    expect(souterSlot(api, '2026-08-07', 'PM').seriesId).toBeUndefined()
    expect(souterSlot(api, '2026-08-28', 'PM')).toMatchObject({ status: 'unavailable', seriesId: 'AS0001' })
    const end = scheduleHorizon(api.getState()).endISO
    const fridays = enumerateDatesISO('2026-07-31', end).filter((d) => getISODay(parseISO(d)) === 5)
    const painted = fridays.filter((_, i) => i % 2 === 0)
    for (const d of painted) {
      const s = souterSlot(api, d, 'PM')
      if (listInSlot(api.getState(), s.id) === undefined && s.seriesId !== undefined) expect(s.status).toBe('unavailable')
    }
    expect(audit(api, 'availability.seriesCreated')).toHaveLength(1)
  })

  it('a weekend series leaves the seeded holiday (Sat 25 Jul) as it is', () => {
    const api = store()
    const out = createAvailabilitySeries(api, SOUTER, fridayPm({ weekdays: [6], everyWeeks: 1, sessions: 'both', startISO: '2026-07-25', untilISO: '2026-08-01' }))
    expect(out.ok && out.value.set + out.value.leftAsIs).toBe(4)
    expect(out.ok && out.value.leftAsIs).toBeGreaterThanOrEqual(2)
    expect(souterSlot(api, '2026-07-25', 'AM')).toMatchObject({ status: 'holiday', note: 'Annual leave / back Monday' })
  })

  it('a series over booked sessions: refused for the anaesthetist with each List, and the office\'s flags each List once', () => {
    const api = store()
    // Souter's Monday PM recurring List (St George's): every Monday PM holds one.
    const draft: AvailabilitySeriesDraft = { ...fridayPm(), weekdays: [1], everyWeeks: 1, startISO: '2026-08-24', untilISO: '2026-09-07' }
    const refused = createAvailabilitySeries(api, SOUTER, draft)
    expect(refused.ok ? '' : refused.code).toBe('holdsList')
    expect(refused.ok ? [] : (refused.details as { listIds: string[] }).listIds).toHaveLength(3)
    expect(Object.keys(api.getState().schedule.availabilitySeries)).toHaveLength(0)
    const out = createAvailabilitySeries(api, OFFICE, draft)
    expect(out.ok && out.value.flagged.length).toBe(3)
    for (const id of out.ok ? out.value.flagged : []) {
      expect(api.getState().schedule.lists[id]!.conflicts.filter((c) => c.kind === 'availability')).toHaveLength(1)
    }
  })

  it('a range over a series instance edits that instance; clearing another deletes it; both survive a roll forward', () => {
    const api = store()
    createAvailabilitySeries(api, SOUTER, fridayPm())
    const edited = setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-14', toISO: '2026-08-14', sessions: 'PM', statusKey: 'holiday' })
    expect(edited.ok && edited.value.seriesEdited).toBe(1)
    const cleared = clearAvailability(api, SOUTER, slotIdFor(ANAE.souter, '2026-08-28', 'PM'))
    expect(cleared.ok && cleared.value.seriesEdited).toBe(1)
    const series = api.getState().schedule.availabilitySeries['AS0001']!
    expect(series.exceptions[instanceKey('2026-08-14', 'PM')]).toEqual({ kind: 'edited', statusKey: 'holiday' })
    expect(series.exceptions[instanceKey('2026-08-28', 'PM')]).toEqual({ kind: 'deleted' })
    expect(souterSlot(api, '2026-08-28', 'PM')).toMatchObject({ status: 'free' })
    expect(souterSlot(api, '2026-08-28', 'PM').seriesId).toBeUndefined()
    expect(souterSlot(api, '2026-08-14', 'PM')).toMatchObject({ status: 'holiday', seriesId: 'AS0001' })

    const oldEnd = scheduleHorizon(api.getState()).endISO
    advanceClockDays(api, 14) // a fortnight: the far edge gains one series Friday
    const newEnd = scheduleHorizon(api.getState()).endISO
    expect(souterSlot(api, '2026-08-14', 'PM').status).toBe('holiday')
    expect(souterSlot(api, '2026-08-28', 'PM').status).toBe('free')
    const added = horizonDatesBetween(oldEnd, newEnd)
    const expected = seriesCalendarFor({ schedule: { availabilitySeries: { AS0001: series } } }, added)
    expect(expected.length).toBeGreaterThan(0)
    for (const e of expected) expect(api.getState().schedule.slots[slotIdFor(ANAE.souter, e.dateISO, e.session)]).toMatchObject({ status: 'unavailable', seriesId: 'AS0001' })
  })

  it('extending the horizon paints the series onto the added months', () => {
    const api = store()
    createAvailabilitySeries(api, SOUTER, fridayPm({ everyWeeks: 1 }))
    const oldEnd = scheduleHorizon(api.getState()).endISO
    expect(setHorizonMonths(api, OFFICE, 5).ok).toBe(true)
    const fridays = horizonDatesBetween(oldEnd, scheduleHorizon(api.getState()).endISO).filter((d) => getISODay(parseISO(d)) === 5)
    expect(fridays.length).toBeGreaterThan(3)
    for (const d of fridays) expect(souterSlot(api, d, 'PM')).toMatchObject({ status: 'unavailable', seriesId: 'AS0001' })
  })

  it('a recurring booking on a far-edge session a series closes is never placed: one RecurringClash, no List, no flag', () => {
    for (const statusKey of ['unavailable', 'ST0001']) {
      const api = store()
      if (statusKey === 'ST0001') {
        addSlotStatus(api, OFFICE, { label: 'Public hospital', longLabel: 'At the public hospital', description: 'Same effect as Unavailable.', colour: 'unavailable', treatment: 'hatched', bookable: false, anaesthetistCanSet: true, isDefault: false })
      }
      const end = scheduleHorizon(api.getState()).endISO
      // Souter's Monday PM is a recurring List; the series starts on the last horizon day, so no existing session is touched.
      const out = createAvailabilitySeries(api, SOUTER, { ...fridayPm(), statusKey, weekdays: [1], everyWeeks: 1, startISO: end })
      expect(out.ok && out.value.set).toBe(0)
      const state = api.getState()
      const nextEnd = horizonFor('2026-07-28', state.appSettings.schedule.horizonMonths).endISO
      const dates = horizonDatesBetween(end, nextEnd)
      const monday = dates.find((d) => getISODay(parseISO(d)) === 1)!
      const generated = generateCanvasForDates(canvasMastersFrom(state, dates), dates)
      const slotId = slotIdFor(ANAE.souter, monday, 'PM')
      expect(generated.clashes.filter((c) => c.slotId === slotId)).toHaveLength(1)
      expect(generated.lists.some((l) => l.slotId === slotId)).toBe(false)

      advanceClockDays(api, 7)
      const after = api.getState()
      expect(after.schedule.slots[slotId]).toMatchObject({ status: statusKey, seriesId: 'AS0001' })
      expect(listInSlot(after, slotId)).toBeUndefined()
      expect(after.audit.some((a) => a.action === 'list.conflict')).toBe(false)
    }
  })

  it('deleting a series returns its future instances to Free, keeps an edited one, leaves past ones', () => {
    const api = store()
    createAvailabilitySeries(api, SOUTER, fridayPm({ startISO: '2026-07-31', everyWeeks: 1 }))
    setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-14', toISO: '2026-08-14', sessions: 'PM', statusKey: 'holiday' })
    advanceClockDays(api, 11) // today Sat 1 Aug: Fri 31 Jul is past
    const out = deleteAvailabilitySeries(api, SOUTER, 'AS0001')
    expect(out.ok).toBe(true)
    expect(souterSlot(api, '2026-07-31', 'PM')).toMatchObject({ status: 'unavailable', seriesId: 'AS0001' })
    expect(souterSlot(api, '2026-08-07', 'PM')).toMatchObject({ status: 'free' })
    expect(souterSlot(api, '2026-08-07', 'PM').seriesId).toBeUndefined()
    expect(souterSlot(api, '2026-08-14', 'PM')).toMatchObject({ status: 'holiday' })
    expect(souterSlot(api, '2026-08-14', 'PM').seriesId).toBeUndefined()
    expect(api.getState().schedule.availabilitySeries['AS0001']!.endedAtISO).toBeDefined()
    expect(audit(api, 'availability.seriesDeleted')).toHaveLength(1)
    // An ended series paints nothing more.
    expect(seriesCalendarFor(api.getState(), ['2026-12-04'])).toEqual([])
  })

  it('an anaesthetist cannot create or delete a colleague\'s series; a draft with no weekday is refused', () => {
    const api = store()
    const colleague = createAvailabilitySeries(api, SHARMA, fridayPm())
    expect(colleague.ok ? 'ok' : colleague.code).toBe('notOwnAvailability')
    const empty = createAvailabilitySeries(api, SOUTER, fridayPm({ weekdays: [] }))
    expect(empty.ok ? '' : empty.message).toMatch(/at least one day/)
    createAvailabilitySeries(api, SOUTER, fridayPm())
    const del = deleteAvailabilitySeries(api, SHARMA, 'AS0001')
    expect(del.ok ? 'ok' : del.code).toBe('notOwnAvailability')
  })
})

describe('review fixes (catch-up Phase 29 review pass)', () => {
  it('Free over a session already Free clears a flag left on its List (the seeded Rutherford Wed 22 AM)', () => {
    const api = store()
    const listId = 'L-29104-2026-07-22-AM'
    expect(api.getState().schedule.lists[listId]!.conflicts.some((c) => c.kind === 'availability')).toBe(true)
    const out = setAvailabilityRange(api, OFFICE, { anaesthetistId: '29104', fromISO: '2026-07-22', toISO: '2026-07-22', sessions: 'AM', statusKey: 'free' })
    expect(out.ok && out.value.cleared).toEqual([listId])
    expect(api.getState().schedule.lists[listId]!.conflicts.some((c) => c.kind === 'availability')).toBe(false)
  })

  it('an anaesthetist cannot remove or overwrite a status only the office may set', () => {
    const api = store()
    addSlotStatus(api, OFFICE, { label: 'Office hold', longLabel: 'Held by the office', description: 'Office use.', colour: 'unavailable', treatment: 'hatched', bookable: false, anaesthetistCanSet: false, isDefault: false })
    setAvailabilityRange(api, OFFICE, { anaesthetistId: ANAE.souter, fromISO: '2026-08-14', toISO: '2026-08-14', sessions: 'AM', statusKey: 'ST0001' })
    const cleared = clearAvailability(api, SOUTER, slotIdFor(ANAE.souter, '2026-08-14', 'AM'))
    expect(cleared.ok ? 'ok' : cleared.code).toBe('statusNotSettable')
    const over = setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-14', toISO: '2026-08-15', sessions: 'both', statusKey: 'holiday' })
    expect(over.ok ? 'ok' : over.message).toMatch(/Office hold on Fri 14 Aug AM is set by the office/)
    expect(souterSlot(api, '2026-08-14', 'AM').status).toBe('ST0001')
  })

  it('a series needs a closed status', () => {
    const api = store()
    const out = createAvailabilitySeries(api, SOUTER, fridayPm({ statusKey: 'free' }))
    expect(out.ok ? '' : out.message).toMatch(/not open for bookings/)
  })

  it('reassigning a List out of a series instance takes that session out of the series for good', () => {
    const api = store()
    // Souter's Monday PM recurring List, flagged by a Monday PM series, then reassigned to a free colleague.
    createAvailabilitySeries(api, OFFICE, { ...fridayPm(), weekdays: [1], everyWeeks: 1, startISO: '2026-08-24', untilISO: '2026-08-24' })
    const slotId = slotIdFor(ANAE.souter, '2026-08-24', 'PM')
    const list = listInSlot(api.getState(), slotId)!
    const colleague = Object.values(api.getState().schedule.slots).find(
      (s) => s.dateISO === '2026-08-24' && s.session === 'PM' && s.anaesthetistId !== ANAE.souter && s.status === 'free' && listInSlot(api.getState(), s.id) === undefined,
    )!
    const moved = reassignList(api, OFFICE, list.id, colleague.anaesthetistId)
    expect(moved.ok).toBe(true)
    expect(api.getState().schedule.slots[slotId]).toMatchObject({ status: 'free' })
    expect(api.getState().schedule.slots[slotId]!.seriesId).toBeUndefined()
    expect(api.getState().schedule.availabilitySeries['AS0001']!.exceptions[instanceKey('2026-08-24', 'PM')]).toEqual({ kind: 'edited', statusKey: 'free' })
  })

  it('the audit names statuses by their label at the time', () => {
    const api = store()
    setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-14', toISO: '2026-08-14', sessions: 'PM', statusKey: 'holiday' })
    const entry = api.getState().audit.at(-1)!
    expect(entry.after).toMatchObject({ statusLabel: 'On holiday', statuses: { 'On holiday': 1 } })
  })

  it('deleting a series counts what returned to the default and what was kept', () => {
    const api = store()
    createAvailabilitySeries(api, SOUTER, fridayPm({ everyWeeks: 1, startISO: '2026-08-07', untilISO: '2026-08-28' }))
    setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-21', toISO: '2026-08-21', sessions: 'PM', statusKey: 'holiday' })
    const out = deleteAvailabilitySeries(api, SOUTER, 'AS0001')
    expect(out.ok && [out.value.set, out.value.unchanged]).toEqual([3, 1])
  })
})

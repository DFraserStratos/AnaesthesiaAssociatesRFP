/**
 * The out-of-hours session (catch-up Phase 32c; US-01.1.6): the office opens
 * and closes it, and once open it is a session like AM and PM: a new List or
 * a Draft List for the evening goes into it, the anaesthetist sets its
 * availability, the finders offer it while free, it sits after PM on her day,
 * and its Bookings go the whole way to the billing run.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { closeOutOfHoursRefusal, closeOutOfHoursSession, openOutOfHoursSession } from './outOfHoursActions'
import { assignListToSlot, setAvailability, setSlotDefaultTimes, setSlotTimes } from './slotActions'
import { formatAuditValue } from '../shared/audit/auditNarrative'
import { fieldLabel } from '../shared/audit/fieldLabels'
import { assignDraftList, createDraftList } from './draftListActions'
import { authoriseList, reassignBooking, submitList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { advanceClockDays } from './clockActions'
import { setAvailabilityRange } from './availabilityActions'
import { addOutOfHoursListAsSimulatedOffice, outOfHoursStandInRefusal } from './officeStandIn'
import { invoicesForList, listInSlot, openSlotViews, slotViewsForAnaesthetist, timesForList } from './selectors'
import { listsOnDayFor, mainViewFor } from './lookback'
import { OFFICE_ACTOR, OFFICE_SIMULATION_ACTOR, SOUTER_ACTOR } from './demoActors'
import type { Actor } from './mutate'
import { ANAE, HOSP, SEED_LIST_IDS, SURG } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { actionLabel } from '../shared/audit/actionLabels'

const OFFICE = OFFICE_ACTOR
const FEED: Actor = { who: 'HL7 feed', role: 'system', source: 'integration' }
const TODAY = '2026-11-24'
const SOUTER_OOH = slotIdFor(ANAE.souter, TODAY, 'OOH')
const store = (): BoundAppStore => createAppStore()

function opened(api: BoundAppStore = store(), times?: { startTime?: string; endTime?: string }): BoundAppStore {
  const out = openOutOfHoursSession(api, OFFICE, ANAE.souter, TODAY, times)
  if (!out.ok) throw new Error(out.message)
  return api
}

describe('openOutOfHoursSession', () => {
  it('writes a third Slot for the day, Free, at the default 18:00 to 21:00, audited', () => {
    const api = opened()
    expect(api.getState().schedule.slots[SOUTER_OOH]).toEqual({ id: SOUTER_OOH, anaesthetistId: ANAE.souter, dateISO: TODAY, session: 'OOH', status: 'free' })
    expect(timesForList(api.getState(), { slotId: SOUTER_OOH, session: 'OOH' })).toMatchObject({ startTime: '18:00', endTime: '21:00', overridden: false })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'session.outOfHoursOpen', entityId: SOUTER_OOH, role: 'office' })
    expect(actionLabel('session.outOfHoursOpen')).toBe('Out-of-hours session opened')
  })

  it('takes its own times', () => {
    const api = opened(store(), { startTime: '19:00', endTime: '22:30' })
    expect(api.getState().schedule.slots[SOUTER_OOH]).toMatchObject({ startTime: '19:00', endTime: '22:30' })
    expect(openOutOfHoursSession(store(), OFFICE, ANAE.souter, TODAY, { startTime: '21:00', endTime: '20:00' })).toMatchObject({ ok: false, code: 'invalidTimes' })
  })

  it('starts no earlier than her PM session ends, on opening and on a later time change', () => {
    expect(openOutOfHoursSession(store(), OFFICE, ANAE.souter, TODAY, { startTime: '17:00', endTime: '20:00' })).toMatchObject({
      ok: false,
      message: 'Start the out-of-hours session at or after the PM session ends (17:30).',
    })
    expect(openOutOfHoursSession(store(), OFFICE, ANAE.souter, TODAY, { startTime: '17:30', endTime: '20:00' }).ok).toBe(true)
    const api = opened()
    expect(setSlotTimes(api, OFFICE, SOUTER_OOH, { startTime: '05:00', endTime: '06:00' })).toMatchObject({ ok: false, code: 'invalidTimes' })
    expect(setSlotTimes(api, OFFICE, SOUTER_OOH, { startTime: '19:00' }).ok).toBe(true)
  })

  it('saving the AM and PM defaults keeps the out-of-hours default, and saving them unchanged logs nothing', () => {
    const api = store()
    const audit = api.getState().audit.length
    const { AM, PM } = api.getState().appSettings.schedule.defaultTimes
    expect(setSlotDefaultTimes(api, OFFICE, { AM, PM })).toMatchObject({ ok: true, value: { changed: false } })
    expect(api.getState().audit.length).toBe(audit)
    expect(setSlotDefaultTimes(api, OFFICE, { AM, PM, OOH: { startTime: '18:30', endTime: '21:30' } }).ok).toBe(true)
    expect(api.getState().appSettings.schedule.defaultTimes.OOH).toEqual({ startTime: '18:30', endTime: '21:30' })
  })

  it('refuses: the anaesthetist, a feed, a past day, no row that day, already open', () => {
    const api = opened()
    expect(openOutOfHoursSession(api, OFFICE, ANAE.souter, TODAY)).toMatchObject({ ok: false, code: 'alreadyOpen' })
    expect(openOutOfHoursSession(store(), SOUTER_ACTOR, ANAE.souter, TODAY)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(openOutOfHoursSession(store(), FEED, ANAE.souter, TODAY)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(openOutOfHoursSession(store(), OFFICE, ANAE.souter, '2026-11-23')).toMatchObject({ ok: false, code: 'pastDate' })
    expect(openOutOfHoursSession(store(), OFFICE, ANAE.souter, '2031-01-01')).toMatchObject({ ok: false, code: 'noRow' })
    // The PWA's office stand-in is the office.
    expect(openOutOfHoursSession(store(), OFFICE_SIMULATION_ACTOR, ANAE.souter, TODAY).ok).toBe(true)
  })

  it('leaves the AM and PM sessions and Lists exactly as they were', () => {
    const before = store().getState().schedule
    const after = opened().getState().schedule
    for (const s of ['AM', 'PM'] as const) expect(after.slots[slotIdFor(ANAE.souter, TODAY, s)]).toEqual(before.slots[slotIdFor(ANAE.souter, TODAY, s)])
    expect(after.lists).toEqual(before.lists)
  })
})

describe('closeOutOfHoursSession', () => {
  it('closes an empty one; refuses one holding a List, and the anaesthetist', () => {
    const api = opened()
    expect(closeOutOfHoursSession(api, SOUTER_ACTOR, SOUTER_OOH)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(assignListToSlot(api, OFFICE, SOUTER_OOH, { hospitalId: HOSP.sx, surgeonId: SURG.patel, kind: 'private' }).ok).toBe(true)
    expect(closeOutOfHoursRefusal(api.getState(), SOUTER_OOH)).toBe('It holds a List. Reassign or return the List first.')
    expect(closeOutOfHoursSession(api, OFFICE, SOUTER_OOH)).toMatchObject({ ok: false, code: 'notClosable' })
    const empty = opened()
    expect(closeOutOfHoursSession(empty, OFFICE, SOUTER_OOH).ok).toBe(true)
    expect(empty.getState().schedule.slots[SOUTER_OOH]).toBeUndefined()
    // An AM or PM session is never closed this way.
    expect(closeOutOfHoursSession(empty, OFFICE, slotIdFor(ANAE.souter, TODAY, 'PM'))).toMatchObject({ ok: false })
  })
})

describe('once open, it is a session like any other', () => {
  it('Assign List puts a new List in it; her day reads AM, PM, then out-of-hours', () => {
    const api = opened()
    const out = assignListToSlot(api, OFFICE, SOUTER_OOH, { hospitalId: HOSP.sx, surgeonId: SURG.patel, kind: 'private' })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const list = api.getState().schedule.lists[out.value.listId]
    expect(list).toMatchObject({ state: 'ACTIVE', session: 'OOH', slotId: SOUTER_OOH, anaesthetistId: ANAE.souter })
    expect(listInSlot(api.getState(), SOUTER_OOH)?.id).toBe(out.value.listId)
    expect(listsOnDayFor(api.getState(), ANAE.souter, TODAY, TODAY).map((l) => l.list.id)).toEqual([SEED_LIST_IDS.souterAm21, SEED_LIST_IDS.souterPm21, out.value.listId])
    const today = mainViewFor(api.getState(), ANAE.souter, TODAY, TODAY).upcoming.map((v) => v.slot.session)
    expect(today).toEqual(['AM', 'PM', 'OOH'])
  })

  it('a Draft List for the evening is assigned into it', () => {
    const api = opened()
    const d = createDraftList(api, OFFICE, { hospitalId: HOSP.stg, surgeonId: SURG.hale, dateISO: TODAY, session: 'OOH', source: 'phone' })
    expect(d.ok).toBe(true)
    if (!d.ok) return
    expect(assignDraftList(api, OFFICE, d.value.listId, { anaesthetistId: ANAE.souter }).ok).toBe(true)
    expect(api.getState().schedule.lists[d.value.listId]).toMatchObject({ state: 'ACTIVE', slotId: SOUTER_OOH, session: 'OOH' })
  })

  it('a Draft List for the evening cannot go to someone with no evening session open, and says so', () => {
    const api = store()
    const d = createDraftList(api, OFFICE, { hospitalId: HOSP.stg, surgeonId: SURG.hale, dateISO: TODAY, session: 'OOH', source: 'phone' })
    if (!d.ok) throw new Error(d.message)
    expect(assignDraftList(api, OFFICE, d.value.listId, { anaesthetistId: ANAE.souter })).toMatchObject({ ok: false, message: 'Dr Souter has no out-of-hours session open that day. Open one first.' })
  })

  it('History reads the session as Out-of-hours, never OOH', () => {
    expect(formatAuditValue('session', 'OOH')).toBe('Out-of-hours')
    expect(formatAuditValue('sessions', 'AM')).toBe('AM')
    expect(fieldLabel('OOH')).toBe('Out-of-hours')
  })

  it('the finders offer it while it is free; the anaesthetist marks it unavailable and it leaves them', () => {
    const api = opened()
    const offered = () => openSlotViews(api.getState(), TODAY, 'OOH').map((v) => v.slot.id)
    expect(offered()).toEqual([SOUTER_OOH])
    expect(setAvailability(api, SOUTER_ACTOR, ANAE.souter, TODAY, 'OOH', 'unavailable').ok).toBe(true)
    expect(offered()).toEqual([])
    expect(slotViewsForAnaesthetist(api.getState(), ANAE.souter, TODAY, TODAY).find((v) => v.slot.session === 'OOH')?.slot.status).toBe('unavailable')
  })

  it('her calendar changes it on its own day (the range form), never across days', () => {
    const api = opened()
    expect(setAvailabilityRange(api, SOUTER_ACTOR, { anaesthetistId: ANAE.souter, fromISO: TODAY, toISO: TODAY, sessions: 'OOH', statusKey: 'unavailable' }).ok).toBe(true)
    expect(api.getState().schedule.slots[SOUTER_OOH]?.status).toBe('unavailable')
    expect(setAvailabilityRange(api, SOUTER_ACTOR, { anaesthetistId: ANAE.souter, fromISO: TODAY, toISO: '2026-11-25', sessions: 'OOH', statusKey: 'free' })).toMatchObject({ ok: false, message: 'An out-of-hours session is changed one day at a time.' })
    expect(setAvailabilityRange(store(), SOUTER_ACTOR, { anaesthetistId: ANAE.souter, fromISO: TODAY, toISO: TODAY, sessions: 'OOH', statusKey: 'unavailable' })).toMatchObject({ ok: false, code: 'noSlot' })
  })

  it('the daily roll forward never generates one', () => {
    const api = store()
    advanceClockDays(api, 3)
    expect(Object.values(api.getState().schedule.slots).some((s) => s.session === 'OOH')).toBe(false)
  })
})

describe('its Bookings go the whole way, as on any List', () => {
  it('submit, authorise and the billing run', () => {
    const api = opened()
    const out = assignListToSlot(api, OFFICE, SOUTER_OOH, { hospitalId: HOSP.sx, surgeonId: SURG.patel, kind: 'private' })
    if (!out.ok) throw new Error(out.message)
    // A completed Booking from her submitted Mon 20 PM List.
    const done = Object.values(api.getState().schedule.bookings).find((b) => b.listId === `L-${ANAE.souter}-2026-11-23-PM` && b.completed && b.cancellation === undefined)!
    expect(reassignBooking(api, OFFICE, done.id, out.value.listId).ok).toBe(true)
    expect(submitList(api, OFFICE, out.value.listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, out.value.listId).ok).toBe(true)
    expect(runBillingForList(api, out.value.listId).ok).toBe(true)
    expect(invoicesForList(api.getState(), out.value.listId).length).toBeGreaterThan(0)
  })
})

describe('the PWA office stand-in', () => {
  it('opens tonight and puts a List in it from her latest List; then refuses a second', () => {
    const api = store()
    expect(outOfHoursStandInRefusal(api.getState(), ANAE.souter)).toBeNull()
    const out = addOutOfHoursListAsSimulatedOffice(api, ANAE.souter)
    expect(out).toMatchObject({ ok: true, value: { startTime: '18:00' } })
    if (!out.ok) return
    expect(api.getState().schedule.lists[out.value.listId]).toMatchObject({ session: 'OOH', slotId: SOUTER_OOH })
    expect(outOfHoursStandInRefusal(api.getState(), ANAE.souter)).toBe('An out-of-hours session is already open tonight')
  })
})

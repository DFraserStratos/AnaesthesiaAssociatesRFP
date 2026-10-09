/**
 * The Draft List demo triggers' bodies (catch-up Phase 31): an incoming
 * request, a Draft List for the day on screen, and the staged recurring clash
 * the roll forward paints.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { advanceClockDays } from './clockActions'
import {
  addDraftListForDay,
  cannedRequestDay,
  firstUnpaintedDay,
  incomingRequestRefusal,
  simulateIncomingDraftListRequest,
  stageRecurringClash,
  stageableRecurringBookings,
} from './draftListDemo'
import { draftListAvailabilityFor, waitingDraftLists } from './selectors'
import { ANAE } from '../domain/seed'

describe('Simulate incoming request', () => {
  it('logs the default Reid request for the next Thursday PM, by email, as the simulated office; Dr Sharma is free and not preferred there', () => {
    const api = createAppStore()
    const res = simulateIncomingDraftListRequest(api, 'ces-reid-thu-pm')
    expect(res.ok && res.value).toMatchObject({ dateISO: '2026-07-23', session: 'PM' })
    if (!res.ok) return
    const l = api.getState().schedule.lists[res.value.listId]!
    expect(l).toMatchObject({ state: 'DRAFT', hospitalId: 'H-CES', surgeonId: 'S-REID', draft: { origin: 'request', source: 'email', by: 'AA office (simulated)' } })
    expect(draftListAvailabilityFor(api.getState(), l.id)!.free.map((r) => r.anaesthetistId)).toContain(ANAE.sharma)
    // The duplicate guard: the same request waits once.
    expect(incomingRequestRefusal(api.getState(), 'ces-reid-thu-pm')).toBe('Already waiting on Draft Lists')
    expect(simulateIncomingDraftListRequest(api, 'ces-reid-thu-pm').ok).toBe(false)
  })

  it('the canned days follow the clock', () => {
    const api = createAppStore()
    expect(cannedRequestDay(api.getState(), 'ces-reid-thu-pm')?.dateISO).toBe('2026-07-23')
    advanceClockDays(api, 2)
    expect(cannedRequestDay(api.getState(), 'ces-reid-thu-pm')?.dateISO).toBe('2026-07-30')
    expect(cannedRequestDay(api.getState(), 'forte-nand-mon-am')?.dateISO).toBe('2026-07-27')
  })
})

describe('Add Draft List for this day', () => {
  it('adds one for the day, shows it on that day, and guards a passed day, a day beyond the schedule and a repeat', () => {
    const api = createAppStore()
    expect(addDraftListForDay(api, '2026-07-29', 'pm-forte-nand').ok).toBe(true)
    expect(waitingDraftLists(api.getState()).some((l) => l.dateISO === '2026-07-29' && l.session === 'PM')).toBe(true)
    expect(addDraftListForDay(api, '2026-07-29', 'pm-forte-nand')).toMatchObject({ ok: false, message: 'Already added' })
    expect(addDraftListForDay(api, '2026-07-01', 'am-stg-tan')).toMatchObject({ ok: false, message: 'This day has passed' })
    expect(addDraftListForDay(api, '2027-07-01', 'am-stg-tan')).toMatchObject({ ok: false, message: 'Beyond the schedule' })
  })
})

describe('Stage recurring clash (US-01.3.2 AC2 through the roll forward)', () => {
  it('writes only the availability for the first unpainted day; after the named presses that day holds exactly one Draft List; staging twice is refused', () => {
    const api = createAppStore()
    const { rb } = stageableRecurringBookings(api.getState())[0]!
    const day = firstUnpaintedDay(api.getState(), rb)!
    const listsBefore = api.getState().schedule.lists
    const slotsBefore = api.getState().schedule.slots
    const res = stageRecurringClash(api, rb.id)
    expect(res.ok && res.value).toMatchObject({ dateISO: day.dateISO, session: rb.session, presses: day.presses })
    expect(api.getState().schedule.lists).toBe(listsBefore)
    expect(api.getState().schedule.slots).toEqual(slotsBefore)
    expect(stageRecurringClash(api, rb.id)).toMatchObject({ ok: false, message: 'Already staged' })
    advanceClockDays(api, day.presses)
    const made = Object.values(api.getState().schedule.lists).filter((l) => l.draft?.projectedFor?.recurringBookingId === rb.id && l.draft.projectedFor.dateISO === day.dateISO)
    expect(made).toHaveLength(1)
    expect(made[0]).toMatchObject({ state: 'DRAFT', draft: { origin: 'recurringClash', fromAnaesthetistId: rb.anaesthetistId } })
    expect(api.getState().schedule.slots[`S-${rb.anaesthetistId}-${day.dateISO}-${rb.session}`]?.status).toBe('unavailable')
  })
})

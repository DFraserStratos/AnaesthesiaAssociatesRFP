/**
 * The shared notification pool (catch-up Phase 32; FT-13.8, US-13.8.1's
 * "Appears", "Not a to-do" and "Shared"; US-13.8.2; DM-41).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { latestNotificationForList, latestNotifications, movedToMe, movedToMeForList, notificationPool, postNotification } from './notifications'
import { markUnavailableAndMoveList, moveListToOffice, pushListToSlot } from './listMoveActions'
import { stageBusyMorning, stageColleagueMoveToOffice } from './listMoveDemo'
import { openWarnings } from './warnings'
import { addDayNote } from './dayNoteActions'
import { reassignList } from './slotActions'
import { advanceClockDays } from './clockActions'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { ANAE, LIST_MOVE_DEMO } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { NOTIFICATION_POOL_RULE } from '../domain/notifications'

const store = (): BoundAppStore => createAppStore()
const SOUTER = SOUTER_ACTOR
const MON27 = '2026-07-27'

describe('"Appears": every move posts exactly one notification', () => {
  it('for each of the three actions', () => {
    const api = store()
    expect(moveListToOffice(api, SOUTER, LIST_MOVE_DEMO.returnListId).ok).toBe(true)
    expect(Object.keys(api.getState().notifications)).toHaveLength(1)
    expect(pushListToSlot(api, SOUTER, LIST_MOVE_DEMO.movableListId, slotIdFor(ANAE.chen, MON27, 'PM')).ok).toBe(true)
    expect(Object.keys(api.getState().notifications)).toHaveLength(2)
    expect(markUnavailableAndMoveList(api, SOUTER, LIST_MOVE_DEMO.unavailableSlotId, 'unavailable', { route: 'office' }).ok).toBe(true)
    expect(Object.keys(api.getState().notifications)).toHaveLength(3)
    const rows = notificationPool(api.getState(), { page: 1 }).rows
    expect(rows.map((r) => r.notification.id)).toEqual(['NT0003', 'NT0002', 'NT0001'])
    expect(rows[1]?.text).toBe("Dr Souter moved Mon 27 Jul PM (St George's, Ms G. Lim) to Dr Chen")
    expect(rows[0]?.text).toMatch(/^Dr Souter returned Thu 23 Jul PM \(.+\) to the office when marking the session not available$/)
    expect(rows[0]?.target).toEqual({ kind: 'draftList', listId: listIdOf(rows[0]) })
    expect(rows[1]?.target).toMatchObject({ kind: 'list', dateISO: MON27 })
    expect(latestNotifications(api.getState(), 2).map((r) => r.notification.id)).toEqual(['NT0003', 'NT0002'])
    expect(latestNotificationForList(api.getState(), LIST_MOVE_DEMO.movableListId)?.id).toBe('NT0002')
  })

  it('a refused move posts nothing', () => {
    const api = store()
    moveListToOffice(api, OFFICE_ACTOR, LIST_MOVE_DEMO.returnListId)
    expect(api.getState().notifications).toEqual({})
  })
})

function listIdOf(row: { notification: { listId: string } } | undefined): string {
  return row?.notification.listId ?? ''
}

describe('"Not a to-do": the pool never feeds the to-do list, and a move writes no Warning', () => {
  it('leaves 15a\'s to-do rows as they were', () => {
    const api = store()
    const before = openWarnings(api.getState())
    stageBusyMorning(api)
    expect(Object.keys(api.getState().notifications)).toHaveLength(8)
    const after = openWarnings(api.getState())
    // The same warnings on the same Bookings: nothing added for a move (a moved List's row follows it).
    const key = (rows: typeof before) => rows.map((r) => `${r.bookingId}:${JSON.stringify(r.warning)}`).sort()
    expect(key(after)).toEqual(key(before))
    expect(api.getState().audit.some((a) => a.action.startsWith('warning.'))).toBe(false)
  })
})

describe('"Shared": one pool for the whole team', () => {
  it('takes no user, so every admin reads the same rows', () => {
    // The selectors take the state and a page, nothing about who is looking.
    expect(notificationPool.length).toBe(2)
    expect(latestNotifications.length).toBe(2)
    const api = store()
    stageColleagueMoveToOffice(api)
    const first = notificationPool(api.getState(), { page: 1 })
    // Kirsty works (a day note), then a second admin does: the pool reads the same for both.
    expect(addDayNote(api, OFFICE_ACTOR, '2026-07-21', 'Checked the overnight moves', false).ok).toBe(true)
    const afterKirsty = notificationPool(api.getState(), { page: 1 })
    expect(addDayNote(api, { who: 'Vanessa P.', role: 'office', source: 'office' }, '2026-07-21', 'Seen', false).ok).toBe(true)
    const afterSecond = notificationPool(api.getState(), { page: 1 })
    expect(afterKirsty.rows.map((r) => r.notification)).toEqual(first.rows.map((r) => r.notification))
    expect(afterSecond.rows.map((r) => [r.notification, r.text])).toEqual(afterKirsty.rows.map((r) => [r.notification, r.text]))
    expect(first.rows).toHaveLength(1)
    expect('read' in (first.rows[0]?.notification ?? {})).toBe(false)
  })
})

describe('paging (OQ-79 recommendation: every notice kept, newest first)', () => {
  it('thirteen notices make three pages of six', () => {
    const api = store()
    expect(stageBusyMorning(api).ok).toBe(true)
    expect(stageBusyMorning(api).ok).toBe(true)
    const all = Object.keys(api.getState().notifications).length
    expect(all).toBe(16)
    expect(NOTIFICATION_POOL_RULE.pageSize).toBe(6)
    // Trim to thirteen in a test-only copy of the state.
    const state = api.getState()
    const ids = Object.keys(state.notifications).sort().slice(0, 13)
    const thirteen = { ...state, notifications: Object.fromEntries(ids.map((id) => [id, state.notifications[id]!])) }
    const pages = [1, 2, 3].map((p) => notificationPool(thirteen, { page: p }))
    expect(pages.map((p) => p.rows.length)).toEqual([6, 6, 1])
    expect(pages[0]?.pageCount).toBe(3)
    expect(pages[0]?.rows[0]?.notification.id).toBe('NT0013')
    expect(pages[2]?.rows[0]?.notification.id).toBe('NT0001')
  })
})

describe('the colleague\'s notice (US-01.4.3 AC2)', () => {
  it('shows a List moved to her inside the window, follows the demo clock, and never a return to the office', () => {
    const api = store()
    expect(moveListToOffice(api, SOUTER, LIST_MOVE_DEMO.returnListId).ok).toBe(true)
    expect(pushListToSlot(api, SOUTER, LIST_MOVE_DEMO.movableListId, slotIdFor(ANAE.chen, MON27, 'PM')).ok).toBe(true)
    const today = api.getState().clock.todayISO
    expect(movedToMe(api.getState(), ANAE.chen, today).map((n) => n.id)).toEqual(['NT0002'])
    expect(movedToMeForList(api.getState(), ANAE.chen, LIST_MOVE_DEMO.movableListId, today)?.id).toBe('NT0002')
    expect(movedToMe(api.getState(), ANAE.souter, today)).toEqual([])
    advanceClockDays(api, 6)
    expect(movedToMe(api.getState(), ANAE.chen, api.getState().clock.todayISO)).toHaveLength(1)
    advanceClockDays(api, 1)
    expect(movedToMe(api.getState(), ANAE.chen, api.getState().clock.todayISO)).toHaveLength(0)
    // The record stays.
    expect(api.getState().notifications['NT0002']).toBeDefined()
  })
})

describe('the snapshot keeps an old notice true', () => {
  it('after the List moves again, its first notice still names where it was and who had it', () => {
    const api = store()
    expect(pushListToSlot(api, SOUTER, LIST_MOVE_DEMO.movableListId, slotIdFor(ANAE.chen, MON27, 'PM')).ok).toBe(true)
    const text = notificationPool(api.getState(), { page: 1 }).rows[0]!.text
    // The office then moves it on to Dr Ropata.
    expect(reassignList(api, OFFICE_ACTOR, LIST_MOVE_DEMO.movableListId, ANAE.ropata).ok).toBe(true)
    const again = notificationPool(api.getState(), { page: 1 })
    expect(again.rows).toHaveLength(1)
    expect(again.rows[0]!.text).toBe(text)
    expect(again.rows[0]!.notification).toMatchObject({ fromAnaesthetistId: ANAE.souter, toAnaesthetistId: ANAE.chen, dateISO: MON27, session: 'PM' })
  })
})

describe('postNotification', () => {
  it('appends one record with the next NT id, never overwriting', () => {
    const api = store()
    const s = api.getState()
    const input = { atISO: '2026-07-21T08:00:00', byActor: 'x', listId: 'L', route: 'office' as const, cause: 'move' as const, fromAnaesthetistId: 'A', dateISO: '2026-07-21', session: 'AM' as const, hospitalId: 'H', surgeonId: 'S', message: '  ' }
    const one = postNotification(s, input)
    expect(one.id).toBe('NT0001')
    expect(one.notifications['NT0001']).not.toHaveProperty('message')
    const two = postNotification({ notifications: one.notifications, counters: one.counters }, input)
    expect(two.id).toBe('NT0002')
    expect(Object.keys(two.notifications)).toEqual(['NT0001', 'NT0002'])
  })
})

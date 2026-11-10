/**
 * Notices that resolve and "Alert the office" (catch-up Phase 32b; US-13.8.3,
 * US-03.6.3, US-13.8.1; D58): the one tick, its audit and refusals, the
 * active/resolved filter and count, the alert's rules, and that an alert
 * changes nothing else.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { alertOffice, officeResolvesAlert, officeResolvesAlertRefusal, OFFICE_ALERT_NOTE_MAX } from './officeAlertActions'
import { activeAlertFor, activeNotificationCount, latestAlertFor, latestNotifications, movedToMe, notificationPool, resolveNotification } from './notifications'
import { submitList } from './lifecycle'
import { moveBookingToAnaesthetist, pushListToSlot } from './listMoveActions'
import { stageColleagueMoveToOffice } from './listMoveDemo'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { clockISO, type Actor } from './mutate'
import { ANAE, LIST_MOVE_DEMO, SEED_LIST_IDS } from '../domain/seed'
import { pushTargets } from '../domain/listMoves'
import { moveInputOf } from './selectors'

const OFFICE = OFFICE_ACTOR
const SOUTER = SOUTER_ACTOR
const SHARMA: Actor = { who: 'Dr Priya Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }
const FEED: Actor = { who: 'Feed', role: 'system', source: 'integration' }
const AM21 = SEED_LIST_IDS.souterAm21
const store = (): BoundAppStore => createAppStore()
const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)
const firstBooking = (api: BoundAppStore, listId: string) => Object.values(api.getState().schedule.bookings).find((b) => b.listId === listId && b.cancellation === undefined)!

describe('resolveNotification: the one tick (US-13.8.3)', () => {
  it('writes resolvedAt and resolvedBy once, audited with before and after; hidden by default, back with Show resolved; the count drops', () => {
    const api = store()
    expect(stageColleagueMoveToOffice(api).ok).toBe(true)
    const id = latestNotifications(api.getState() as never, 1)[0]!.notification.id
    const count = activeNotificationCount(api.getState())
    expect(count).toBeGreaterThan(0)
    const out = resolveNotification(api, OFFICE, id)
    expect(out.ok).toBe(true)
    const n = api.getState().notifications[id]!
    expect(n).toMatchObject({ resolvedBy: 'Kirsty W.', resolvedAt: clockISO(api.getState().clock) })
    expect(activeNotificationCount(api.getState())).toBe(count - 1)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'notification.resolve', entityType: 'notification', entityId: id, role: 'office', before: { resolvedAt: null }, after: { resolvedBy: 'Kirsty W.' } })
    const pool = api.getState() as never
    expect(notificationPool(pool, { page: 1 }).rows.some((r) => r.notification.id === id)).toBe(false)
    const all = notificationPool(pool, { page: 1, showResolved: true }).rows.find((r) => r.notification.id === id)
    expect(all?.resolved).toBe(true)
    expect(latestNotifications(pool, 6).some((r) => r.notification.id === id)).toBe(false)
  })

  it('refuses a second tick (written once), an unknown id, an anaesthetist and a feed, writing nothing', () => {
    const api = store()
    stageColleagueMoveToOffice(api)
    const id = latestNotifications(api.getState() as never, 1)[0]!.notification.id
    expect(code(resolveNotification(api, SOUTER, id))).toBe('officeOnly')
    expect(code(resolveNotification(api, FEED, id))).toBe('officeOnly')
    expect(code(resolveNotification(api, OFFICE, 'NT9999'))).toBe('notFound')
    resolveNotification(api, OFFICE, id)
    const before = api.getState()
    expect(code(resolveNotification(api, { ...OFFICE, who: 'Ben H.' }, id))).toBe('alreadyResolved')
    expect(api.getState()).toBe(before)
    expect(api.getState().notifications[id]?.resolvedBy).toBe('Kirsty W.')
  })

  it("nothing expires: a notice nobody ticks stays active however long it has been there", () => {
    const api = store()
    stageColleagueMoveToOffice(api)
    const n = activeNotificationCount(api.getState())
    api.setState({ clock: { ...api.getState().clock, todayISO: '2026-12-31' } })
    expect(activeNotificationCount(api.getState())).toBe(n)
  })

  it("the colleague's own Moved to you notice ignores the office's tick", () => {
    const api = store()
    const list = api.getState().schedule.lists[LIST_MOVE_DEMO.movableListId]!
    const to = pushTargets(moveInputOf(api.getState()), list.id)[0]!
    const moved = pushListToSlot(api, SOUTER, list.id, to.slotId)
    expect(moved.ok).toBe(true)
    const id = moved.ok ? moved.value.notificationId! : ''
    expect(movedToMe(api.getState(), to.anaesthetistId, api.getState().clock.todayISO).map((n) => n.id)).toContain(id)
    resolveNotification(api, OFFICE, id)
    expect(movedToMe(api.getState(), to.anaesthetistId, api.getState().clock.todayISO).map((n) => n.id)).toContain(id)
  })
})

describe('alertOffice (US-03.6.3)', () => {
  it('posts one active officeAlert notice with the note, audited on the List, in one commit', () => {
    const api = store()
    let commits = 0
    const off = api.subscribe(() => {
      commits += 1
    })
    const out = alertOffice(api, SOUTER, { listId: AM21, note: '  Not sure the Contract is right on these.  ' })
    off()
    expect(out.ok).toBe(true)
    expect(commits).toBe(1)
    const id = out.ok ? out.value.notificationId : ''
    expect(api.getState().notifications[id]).toMatchObject({ kind: 'officeAlert', listId: AM21, fromAnaesthetistId: ANAE.souter, message: 'Not sure the Contract is right on these.' })
    expect(api.getState().notifications[id]?.route).toBeUndefined()
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'notification.alert', entityType: 'list', entityId: AM21, role: 'anaesthetist' })
    expect(activeAlertFor(api.getState(), { listId: AM21 })?.id).toBe(id)
    const row = notificationPool(api.getState() as never, { page: 1 }).rows[0]!
    expect(row.notification.id).toBe(id)
    expect(row.target).toMatchObject({ kind: 'list', listId: AM21 })
    expect(row.text).toMatch(/^Dr Souter asked the office to check Tue 21 Jul AM/)
  })

  it('on a Booking: names the patient, opens the Booking, and changes no Booking state', () => {
    const api = store()
    const booking = firstBooking(api, AM21)
    const before = api.getState().schedule.bookings[booking.id]
    const out = alertOffice(api, SOUTER, { listId: AM21, bookingId: booking.id, note: 'Can you check the funder?' })
    expect(out.ok).toBe(true)
    expect(api.getState().schedule.bookings[booking.id]).toBe(before)
    expect(api.getState().schedule.lists[AM21]).toEqual(createAppStore().getState().schedule.lists[AM21])
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'notification.alert', entityType: 'booking', entityId: booking.id })
    const row = notificationPool(api.getState() as never, { page: 1 }).rows[0]!
    expect(row.target).toMatchObject({ kind: 'booking', bookingId: booking.id })
    expect(row.text).toMatch(/asked the office to check a Booking \(/)
    // A List alert and a Booking alert are different targets.
    expect(alertOffice(api, SOUTER, { listId: AM21, note: 'And the List' }).ok).toBe(true)
  })

  it('refuses: the office, a feed, a colleague, a Draft List, an AUTHORISED List, a cancelled or foreign Booking, a blank or long note, a second active alert', () => {
    const api = store()
    expect(code(alertOffice(api, OFFICE, { listId: AM21, note: 'x' }))).toBe('ownerOnly')
    expect(code(alertOffice(api, FEED, { listId: AM21, note: 'x' }))).toBe('ownerOnly')
    expect(code(alertOffice(api, SHARMA, { listId: AM21, note: 'x' }))).toBe('notOwnList')
    expect(code(alertOffice(api, SOUTER, { listId: 'LD-001', note: 'x' }))).toBe('notOwnList')
    expect(code(alertOffice(api, SOUTER, { listId: AM21, note: '   ' }))).toBe('noteRequired')
    expect(code(alertOffice(api, SOUTER, { listId: AM21, note: 'x'.repeat(OFFICE_ALERT_NOTE_MAX + 1) }))).toBe('noteTooLong')
    expect(code(alertOffice(api, SOUTER, { listId: AM21, bookingId: firstBooking(api, SEED_LIST_IDS.souterPm21).id, note: 'x' }))).toBe('notFound')
    const auth = { ...api.getState().schedule.lists[AM21]!, state: 'AUTHORISED' as const }
    const api2 = store()
    api2.setState({ schedule: { ...api2.getState().schedule, lists: { ...api2.getState().schedule.lists, [AM21]: auth } } as never })
    expect(code(alertOffice(api2, SOUTER, { listId: AM21, note: 'x' }))).toBe('listAuthorised')
    expect(Object.keys(api.getState().notifications)).toEqual(Object.keys(createAppStore().getState().notifications))
    expect(alertOffice(api, SOUTER, { listId: AM21, note: 'First' }).ok).toBe(true)
    const again = alertOffice(api, SOUTER, { listId: AM21, note: 'Second' })
    expect(again).toMatchObject({ ok: false, code: 'alreadyAlerted', message: 'The office already has an alert on this.' })
    // Once the office ticks it, a new alert can go.
    resolveNotification(api, OFFICE, activeAlertFor(api.getState(), { listId: AM21 })!.id)
    expect(alertOffice(api, SOUTER, { listId: AM21, note: 'Second' }).ok).toBe(true)
  })

  it('never changes the submit rule: the List submits while its alert is open (undecided, US-03.6.3)', () => {
    const api = store()
    expect(alertOffice(api, SOUTER, { listId: AM21, note: 'Please check' }).ok).toBe(true)
    expect(submitList(api, SOUTER, AM21).ok).toBe(true)
    expect(activeAlertFor(api.getState(), { listId: AM21 })).toBeDefined()
    // Still one active alert per target after submit.
    expect(code(alertOffice(api, SOUTER, { listId: AM21, note: 'Again' }))).toBe('alreadyAlerted')
  })

  it('a Booking alert follows the Booking when it moves to another List (review fix): still found, still one at a time', () => {
    const api = store()
    const booking = firstBooking(api, LIST_MOVE_DEMO.movableListId)
    expect(alertOffice(api, SOUTER, { listId: LIST_MOVE_DEMO.movableListId, bookingId: booking.id, note: 'Check please' }).ok).toBe(true)
    const to = Object.values(api.getState().schedule.slots).find((x) => x.dateISO === '2026-07-27' && x.session === 'PM' && x.anaesthetistId !== ANAE.souter && x.status === 'free' && !Object.values(api.getState().schedule.lists).some((l) => l.slotId === x.id) && api.getState().masters.anaesthetists[x.anaesthetistId]?.active === true)!
    const moved = moveBookingToAnaesthetist(api, SOUTER, booking.id, to.anaesthetistId)
    expect(moved.ok).toBe(true)
    const nowOn = api.getState().schedule.bookings[booking.id]!.listId
    expect(nowOn).not.toBe(LIST_MOVE_DEMO.movableListId)
    expect(activeAlertFor(api.getState(), { listId: nowOn, bookingId: booking.id })).toBeDefined()
    const receiver: Actor = { who: 'Colleague', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: to.anaesthetistId }
    expect(code(alertOffice(api, receiver, { listId: nowOn, bookingId: booking.id, note: 'Again' }))).toBe('alreadyAlerted')
    // The List the Booking left has no alert of its own.
    expect(activeAlertFor(api.getState(), { listId: LIST_MOVE_DEMO.movableListId })).toBeUndefined()
  })

  it('the PWA stand-in "Office resolves this alert" ticks the active alert as the simulated office; disabled with none', () => {
    const api = store()
    const target = { listId: AM21 }
    expect(officeResolvesAlertRefusal(api.getState(), target)).toBe('No open alert to the office here')
    alertOffice(api, SOUTER, { ...target, note: 'Check please' })
    expect(officeResolvesAlertRefusal(api.getState(), target)).toBeNull()
    expect(officeResolvesAlert(api, target).ok).toBe(true)
    expect(latestAlertFor(api.getState(), target)).toMatchObject({ resolvedBy: 'AA office (simulated)' })
    expect(activeAlertFor(api.getState(), target)).toBeUndefined()
  })
})

/**
 * The anaesthetist's main view, look-back and search selectors (catch-up Phase
 * 38a; US-07.4.2, US-07.4.1, US-03.1.6, US-03.1.7). Own work only, history
 * untouched, deterministic.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { createBooking } from './bookingActions'
import { isBackdropList } from './selectors'
import { mainViewFor } from './lookback'
import type { Actor } from './mutate'
import { listProgress } from '../domain/listProgress'
import { ANAE, SEED_LIST_IDS } from '../domain/seed'
import { assigned } from '../test/lists'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const TODAY = '2026-07-21'
const MONTH_END = '2026-08-21'

function store(): BoundAppStore {
  return createAppStore()
}
function view(api: BoundAppStore, anaesthetistId: string = ANAE.souter) {
  return mainViewFor(api.getState(), anaesthetistId, api.getState().clock.todayISO, MONTH_END)
}

describe('mainViewFor (US-07.4.2)', () => {
  it('at the demo today, earlier is exactly Mon 20 Jul AM and PM (not the empty 7 to 16 July Lists), oldest first', () => {
    const api = store()
    expect(api.getState().clock.todayISO).toBe(TODAY)
    const v = view(api)
    expect(v.earlier.map((l) => l.id)).toEqual([SEED_LIST_IDS.souterMon20Am, SEED_LIST_IDS.souterMon20Pm])
    for (const l of v.earlier) expect(l.state).toBe('SUBMITTED')
  })

  it('never shows a backdrop List, and upcoming starts today', () => {
    const api = store()
    const v = view(api)
    expect(v.earlier.some(isBackdropList)).toBe(false)
    expect(v.upcoming.some((u) => u.list !== undefined && isBackdropList(u.list))).toBe(false)
    expect(v.upcoming.every((u) => u.slot.dateISO >= TODAY && u.slot.dateISO <= MONTH_END)).toBe(true)
    expect(v.upcoming.some((u) => u.slot.dateISO === TODAY)).toBe(true)
  })

  it('authorising a List removes it from earlier at once', () => {
    const api = store()
    expect(authoriseList(api, OFFICE, SEED_LIST_IDS.souterMon20Pm).ok).toBe(true)
    expect(view(api).earlier.map((l) => l.id)).toEqual([SEED_LIST_IDS.souterMon20Am])
  })

  it('an authorised List today leaves the upcoming rows too', () => {
    const api = store()
    const today = SEED_LIST_IDS.souterAm21
    api.setState((s) => ({
      schedule: { ...s.schedule, lists: { ...s.schedule.lists, [today]: { ...assigned(s.schedule.lists[today]), state: 'AUTHORISED' as const } } },
    }))
    expect(view(api).upcoming.some((u) => u.list?.id === today)).toBe(false)
    // The session is held by a List that has left, so it shows nothing (not Free).
    expect(view(api).upcoming.some((u) => u.slot.id === assigned(api.getState().schedule.lists[today]).slotId)).toBe(false)
  })

  it('a past completed ACTIVE List shows in earlier as ready to submit', () => {
    const api = store()
    const past = Object.values(api.getState().schedule.lists).find(
      (l) => l.state === 'ACTIVE' && l.anaesthetistId === ANAE.souter && l.dateISO === '2026-07-14',
    )
    expect(past).toBeDefined()
    const created = createBooking(api, SOUTER, past!.id, {
      patient: { name: 'Past Patient', dobISO: '1970-01-01' },
      operation: 'Arthroscopy',
      billingRoute: 'hospital',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    api.setState((s) => ({
      schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [created.value.bookingId]: { ...s.schedule.bookings[created.value.bookingId]!, completed: true } } },
    }))
    const earlier = view(api).earlier
    const row = earlier.find((l) => l.id === past!.id)
    expect(row).toBeDefined()
    const bookings = Object.values(api.getState().schedule.bookings).filter((b) => b.listId === past!.id)
    expect(listProgress(row!, bookings, TODAY)).toBe('readyToSubmit')
    expect(earlier[0]?.id).toBe(past!.id)
  })

  it('a List moved to a colleague and every Draft List are absent', () => {
    const api = store()
    const moved = SEED_LIST_IDS.souterMon20Pm
    api.setState((s) => ({
      schedule: { ...s.schedule, lists: { ...s.schedule.lists, [moved]: { ...assigned(s.schedule.lists[moved]), anaesthetistId: ANAE.morrison } } },
    }))
    const v = view(api)
    expect(v.earlier.map((l) => l.id)).toEqual([SEED_LIST_IDS.souterMon20Am])
    expect(view(api, ANAE.morrison).earlier.some((l) => l.id === moved)).toBe(true)
    const shown = new Set([...v.earlier.map((l) => l.id), ...v.upcoming.flatMap((u) => (u.list !== undefined ? [u.list.id] : []))])
    const drafts = Object.values(api.getState().schedule.lists).filter((l) => l.state === 'DRAFT')
    expect(drafts.length).toBeGreaterThan(0)
    expect(drafts.some((d) => shown.has(d.id))).toBe(false)
  })

  it('is deterministic', () => {
    expect(view(store())).toEqual(view(store()))
  })
})

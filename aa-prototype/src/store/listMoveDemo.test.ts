/**
 * The anaesthetist-move demo triggers' bodies (catch-up Phase 32): a
 * colleague's own move, staged as that colleague, deterministic, never
 * touching the persona's Lists or anything the run sheet scripts.
 */

import { describe, expect, it } from 'vitest'
import { assigned } from '../test/lists'
import { createAppStore } from './appStore'
import {
  BUSY_MORNING_MOVES,
  colleagueMoveCandidates,
  colleagueMoveRefusal,
  moveToPersonaCandidate,
  moveToPersonaRefusal,
  stageBusyMorning,
  stageColleagueMoveToOffice,
  stageColleagueMoveToPersona,
} from './listMoveDemo'
import { anaesthetistActor } from './demoActors'
import { movedToMe, notificationPool } from './notifications'
import { ANAE, SCRIPTED_BEAT_SCHEDULE } from '../domain/seed'

const scriptedLists = new Set<string>(SCRIPTED_BEAT_SCHEDULE.listIds)
const scriptedSlots = new Set<string>(SCRIPTED_BEAT_SCHEDULE.slotIds)

describe('candidates on the pristine seed', () => {
  it('the office trigger has one, the busy morning eight, and none is the persona\'s or scripted', () => {
    const state = createAppStore().getState()
    const candidates = colleagueMoveCandidates(state)
    expect(candidates.length).toBeGreaterThanOrEqual(BUSY_MORNING_MOVES)
    for (const l of candidates) {
      expect(l.anaesthetistId).not.toBe(ANAE.souter)
      expect(scriptedLists.has(l.id), l.id).toBe(false)
      expect(scriptedSlots.has(l.slotId), l.slotId).toBe(false)
    }
    expect(colleagueMoveRefusal(state)).toBeNull()
    expect(colleagueMoveRefusal(state, undefined, BUSY_MORNING_MOVES)).toBeNull()
  })

  it("the PWA trigger has one, into a persona session that is open and not scripted (S2 Beat 3's target is never used)", () => {
    const state = createAppStore().getState()
    const found = moveToPersonaCandidate(state, ANAE.souter)!
    expect(found).toBeDefined()
    expect(scriptedLists.has(found.list.id)).toBe(false)
    expect(scriptedSlots.has(found.toSlotId)).toBe(false)
    expect(found.toSlotId.startsWith(`S-${ANAE.souter}-`)).toBe(true)
    expect(moveToPersonaRefusal(state, ANAE.souter)).toBeNull()
  })
})

describe('"One move"', () => {
  it('a colleague returns one List to the office, as themselves: one move, one notification, a Draft List', () => {
    const api = createAppStore()
    const expected = colleagueMoveCandidates(api.getState(), '2026-07-21')[0]!
    const out = stageColleagueMoveToOffice(api, '2026-07-21')
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.listId).toBe(expected.id)
    expect(api.getState().schedule.lists[expected.id]?.state).toBe('DRAFT')
    expect(Object.keys(api.getState().notifications)).toHaveLength(1)
    const move = api.getState().audit.find((a) => a.action === 'list.ownerMove')!
    expect(move.who).toBe(anaesthetistActor(api.getState(), expected.anaesthetistId)?.who)
    expect(move.role).toBe('anaesthetist')
    expect(api.getState().schedule.slots[expected.slotId]?.status).toBe('unavailable')
  })

  it('on a date with no candidate, takes the next date that has one', () => {
    const api = createAppStore()
    const out = stageColleagueMoveToOffice(api, '2026-07-25')
    expect(out.ok && out.value.dateISO >= '2026-07-25').toBe(true)
  })

  it('is deterministic', () => {
    const a = createAppStore()
    const b = createAppStore()
    stageColleagueMoveToOffice(a)
    stageColleagueMoveToOffice(b)
    expect(a.getState().notifications).toEqual(b.getState().notifications)
  })
})

describe('"A busy morning (8 moves)"', () => {
  it('makes eight moves, alternating returns and hand-ons, each its own notification; the pool then has two pages', () => {
    const api = createAppStore()
    const out = stageBusyMorning(api)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.moves).toHaveLength(BUSY_MORNING_MOVES)
    expect(out.value.moves.map((m) => m.route)).toContain('colleague')
    expect(out.value.moves.map((m) => m.route)).toContain('office')
    expect(Object.keys(api.getState().notifications)).toHaveLength(8)
    expect(notificationPool(api.getState(), { page: 1 }).pageCount).toBe(2)
    for (const m of out.value.moves.filter((x) => x.route === 'colleague')) {
      const list = assigned(api.getState().schedule.lists[m.listId])
      expect(list.anaesthetistId).not.toBe(ANAE.souter)
      expect(scriptedSlots.has(list.slotId)).toBe(false)
    }
  })
})

describe('"Colleague moves a List into my free session" (PWA)', () => {
  it('a colleague hands a List on into Dr Souter\'s free session; she sees it with the notice', () => {
    const api = createAppStore()
    const found = moveToPersonaCandidate(api.getState(), ANAE.souter)!
    const out = stageColleagueMoveToPersona(api, ANAE.souter)
    expect(out.ok).toBe(true)
    expect(assigned(api.getState().schedule.lists[found.list.id])).toMatchObject({ anaesthetistId: ANAE.souter, slotId: found.toSlotId })
    expect(movedToMe(api.getState(), ANAE.souter, api.getState().clock.todayISO)).toHaveLength(1)
  })

  it('reads its disabled reason when nothing fits', () => {
    const api = createAppStore()
    // Close every persona session from today on: nothing can be received.
    const state = api.getState()
    const slots = Object.fromEntries(Object.entries(state.schedule.slots).map(([id, s]) => [id, s.anaesthetistId === ANAE.souter ? { ...s, status: 'unavailable' } : s]))
    const closed = { ...state, schedule: { ...state.schedule, slots } }
    expect(moveToPersonaRefusal(closed, ANAE.souter)).toBe('No colleague List fits one of your free sessions')
    const noLists = { ...state, schedule: { ...state.schedule, lists: {} } }
    expect(colleagueMoveRefusal(noLists)).toBe('No List on the schedule fits')
  })
})

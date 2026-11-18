/**
 * Public as a Slot status in the store (catch-up Phase 32d, work item 5; D86,
 * OQ-139 answered). Every path reads `isOpenSlot` and `isClosed`, never a key
 * compare: a Public session is never offered for a List or cover, never takes
 * an assignment or a move, and changing it back to Free reopens it. The
 * re-homed anchor of 14's "Stage post-op scenario" still stages it.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { assignListToSlot, setAvailability, setHorizonMonths } from './slotActions'
import { assignDraftList } from './draftListActions'
import { markUnavailableAndMoveList, pushListToSlot } from './listMoveActions'
import { setAvailabilityRange } from './availabilityActions'
import { advanceClockDays } from './clockActions'
import { openSlotViews, slotView } from './selectors'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { ANAE, HOSP, SEED_LIST_IDS, SURG } from '../domain/seed'
import { horizonFor } from '../domain/clock'
import { projectedListId, slotIdFor } from '../domain/slots'
import { SEED_STATUS } from '../domain/slotStatus'
import { DEMO_TRIGGERS, POST_OP_ORIGINAL_LIST_ID } from '../shared/demoTriggers/registry'

const FRI21AUG = '2026-08-21'
const PUBLIC = SEED_STATUS.publicHospital

describe('Public as a Slot status (catch-up Phase 32d)', () => {
  it('the anaesthetist sets Public with a note; no finder offers it; back to Free reopens it for a List and for cover', () => {
    const api = createAppStore()
    const slotId = slotIdFor(ANAE.souter, FRI21AUG, 'AM')
    expect(openSlotViews(api.getState(), FRI21AUG, 'AM').some((v) => v.slot.id === slotId)).toBe(true)

    expect(setAvailability(api, SOUTER_ACTOR, ANAE.souter, FRI21AUG, 'AM', PUBLIC, 'CPH').ok).toBe(true)
    expect(api.getState().schedule.slots[slotId]).toMatchObject({ status: PUBLIC, note: 'CPH' })
    expect(slotView(api.getState(), slotId)?.open).toBe(false)
    expect(openSlotViews(api.getState(), FRI21AUG, 'AM').some((v) => v.slot.id === slotId)).toBe(false)
    const refused = assignListToSlot(api, OFFICE_ACTOR, slotId, { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'private' })
    expect(refused.ok ? '' : refused.code).toBe('sessionNotOpen')

    expect(setAvailability(api, SOUTER_ACTOR, ANAE.souter, FRI21AUG, 'AM', SEED_STATUS.free).ok).toBe(true)
    expect(openSlotViews(api.getState(), FRI21AUG, 'AM').some((v) => v.slot.id === slotId)).toBe(true)
    expect(assignListToSlot(api, OFFICE_ACTOR, slotId, { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'private' }).ok).toBe(true)
  })

  it('the office sets Public for the anaesthetist; a range works too', () => {
    const api = createAppStore()
    expect(setAvailability(api, OFFICE_ACTOR, ANAE.souter, FRI21AUG, 'PM', PUBLIC, 'CPH').ok).toBe(true)
    expect(api.getState().schedule.slots[slotIdFor(ANAE.souter, FRI21AUG, 'PM')]).toMatchObject({ status: PUBLIC, note: 'CPH' })
    const range = setAvailabilityRange(api, SOUTER_ACTOR, { anaesthetistId: ANAE.souter, fromISO: '2026-08-22', toISO: '2026-08-23', sessions: 'both', statusKey: PUBLIC, note: 'CPH' })
    expect(range.ok).toBe(true)
    for (const d of ['2026-08-22', '2026-08-23']) for (const s of ['AM', 'PM'] as const) expect(api.getState().schedule.slots[slotIdFor(ANAE.souter, d, s)]).toMatchObject({ status: PUBLIC, note: 'CPH' })
    const audit = api.getState().audit.filter((a) => a.entityId === slotIdFor(ANAE.souter, FRI21AUG, 'PM'))
    expect(audit.at(-1)?.role).toBe('office')
  })

  it('a List is never moved or pushed into a Public session', () => {
    const api = createAppStore()
    const target = slotIdFor(ANAE.souter, FRI21AUG, 'AM')
    expect(setAvailability(api, OFFICE_ACTOR, ANAE.souter, FRI21AUG, 'AM', PUBLIC, 'CPH').ok).toBe(true)
    const listId = projectedListId(ANAE.souter, '2026-08-17', 'AM')
    expect(api.getState().schedule.lists[listId]).toBeDefined()
    const pushed = pushListToSlot(api, SOUTER_ACTOR, listId, target)
    expect(pushed.ok).toBe(false)
    expect(api.getState().schedule.lists[listId]?.slotId).toBe(slotIdFor(ANAE.souter, '2026-08-17', 'AM'))
  })

  it('Public on a session holding a List runs the return-or-hand-on choice (32b): the List goes back, the session is Public', () => {
    const api = createAppStore()
    const listId = projectedListId(ANAE.souter, '2026-08-17', 'AM')
    const slotId = slotIdFor(ANAE.souter, '2026-08-17', 'AM')
    const out = markUnavailableAndMoveList(api, OFFICE_ACTOR, slotId, PUBLIC, { route: 'office' }, { note: 'CPH' })
    expect(out.ok).toBe(true)
    expect(api.getState().schedule.lists[listId]?.state).toBe('DRAFT')
    expect(api.getState().schedule.slots[slotId]).toMatchObject({ status: PUBLIC, note: 'CPH' })
  })

  it('rolled days show the weekly Public series, never a List', () => {
    const api = createAppStore()
    const oldEnd = horizonFor(api.getState().clock.todayISO, api.getState().appSettings.schedule.horizonMonths).endISO
    advanceClockDays(api, 14)
    const s = api.getState()
    const rolled = Object.values(s.schedule.slots).filter((x) => x.dateISO > oldEnd)
    const pub = rolled.filter((x) => x.status === PUBLIC)
    expect(pub.length).toBeGreaterThan(0)
    for (const slot of pub) expect(slot).toMatchObject({ note: 'CPH' })
    expect(Object.values(s.schedule.lists).some((l) => l.dateISO > oldEnd && l.hospitalId === HOSP.cph)).toBe(false)
  })

  it('the post-op anchor is a private List and "Stage post-op scenario" still authorises it', () => {
    const api = createAppStore()
    expect(api.getState().schedule.lists[POST_OP_ORIGINAL_LIST_ID]).toMatchObject({ kind: 'private', hospitalId: HOSP.cph })
    expect(api.getState().schedule.lists[SEED_LIST_IDS.billingFailure]).toBeDefined()
    const t = DEMO_TRIGGERS.find((x) => x.id === 'stage-post-op')!
    const ctx = { path: `/admin/review/${POST_OP_ORIGINAL_LIST_ID}`, params: { listId: POST_OP_ORIGINAL_LIST_ID }, surface: 'bar' as const, screen: {} }
    expect(t.run(api, ctx as never).ok).toBe(true)
    expect(api.getState().schedule.lists[POST_OP_ORIGINAL_LIST_ID]?.state).toBe('AUTHORISED')
  })

  it('the post-op trigger is enabled on its Review before it runs', () => {
    const api = createAppStore()
    const t = DEMO_TRIGGERS.find((x) => x.id === 'stage-post-op')!
    const ctx = { pathname: `/admin/review/${POST_OP_ORIGINAL_LIST_ID}`, params: { listId: POST_OP_ORIGINAL_LIST_ID }, published: {} }
    expect(t.when?.(api.getState(), ctx) ?? true).toBe(true)
    expect(t.disabledReason(api.getState(), ctx)).toBeNull()
  })

  it('a Draft List is never assigned into a Public session; back to Free it is', () => {
    const api = createAppStore()
    // St George's request LD-001 is for Tue 21 Jul PM: Dr Hughes is free then.
    expect(setAvailability(api, OFFICE_ACTOR, ANAE.hughes, '2026-07-21', 'PM', PUBLIC, 'CPH').ok).toBe(true)
    const refused = assignDraftList(api, OFFICE_ACTOR, 'LD-001', { anaesthetistId: ANAE.hughes })
    expect(refused.ok ? '' : refused.code).toBe('sessionNotOpen')
    expect(setAvailability(api, OFFICE_ACTOR, ANAE.hughes, '2026-07-21', 'PM', SEED_STATUS.free).ok).toBe(true)
    expect(assignDraftList(api, OFFICE_ACTOR, 'LD-001', { anaesthetistId: ANAE.hughes }).ok).toBe(true)
  })

  it('a List is never handed on into a colleague\'s Public session (32b\'s receive rule)', () => {
    const api = createAppStore()
    const from = slotIdFor(ANAE.souter, '2026-08-17', 'AM')
    const to = slotIdFor(ANAE.hughes, '2026-08-17', 'PM')
    expect(setAvailability(api, OFFICE_ACTOR, ANAE.hughes, '2026-08-17', 'PM', PUBLIC, 'CPH').ok).toBe(true)
    const out = markUnavailableAndMoveList(api, SOUTER_ACTOR, from, 'unavailable', { route: 'colleague', toSlotId: to })
    expect(out.ok).toBe(false)
    expect(api.getState().schedule.lists[projectedListId(ANAE.souter, '2026-08-17', 'AM')]?.slotId).toBe(from)
  })

  it('extending the horizon paints the weekly Public series onto the added months, never a List', () => {
    const api = createAppStore()
    const before = horizonFor(api.getState().clock.todayISO, api.getState().appSettings.schedule.horizonMonths).endISO
    expect(setHorizonMonths(api, OFFICE_ACTOR, api.getState().appSettings.schedule.horizonMonths + 1).ok).toBe(true)
    const added = Object.values(api.getState().schedule.slots).filter((s) => s.dateISO > before)
    expect(added.some((s) => s.status === PUBLIC && s.note === 'CPH')).toBe(true)
    expect(Object.values(api.getState().schedule.lists).some((l) => l.dateISO > before && l.hospitalId === HOSP.cph)).toBe(false)
  })
})

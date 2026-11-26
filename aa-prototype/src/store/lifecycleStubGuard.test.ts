/**
 * Phase 72: the stub guard (US-02.6.4, DM-18). A List holding only a stub can
 * be neither submitted nor authorised, with one reason from one place; a List
 * with any Booking that is not cancelled is never held up.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { authoriseBlockersFor, authoriseList, AUTHORISE_NEEDS_PRICE, STUB_ONLY_LIST, stubOnlyBlockerFor, submitList } from './lifecycle'
import { bookingsForList } from './selectors'
import { listHeldByStubOf } from './stubSelectors'
import { officeStandInRefusal } from './officeStandIn'
import { resolveStub } from './stubActions'
import { listHeldByStub, STUB_ONLY_REASON } from '../domain/intake/stubs'
import { SEED_STUB } from '../domain/seed/intakeSeed'
import type { Actor } from './mutate'
import type { Stub } from '../domain/types'

const SOUTER_ACTOR: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

/** A second standing stub, copied from the seeded one, placed on `listId`. */
function standStubOn(api: AppStoreApi, listId: string): string {
  const s = api.getState()
  const seed = s.intake.stubs[SEED_STUB.stubId]!
  const stub: Stub = { ...seed, id: 'STB-TEST', listId, importRowId: 'IRS-TEST' }
  api.setState({ intake: { ...s.intake, stubs: { ...s.intake.stubs, [stub.id]: stub } } })
  return stub.id
}

/** A seeded List in `state` whose Bookings are all complete, with at least `min` of them. */
function listIn(api: AppStoreApi, state: 'ACTIVE' | 'SUBMITTED', min: number): string {
  const s = api.getState()
  const found = Object.values(s.schedule.lists).find((l) => {
    if (l.state !== state || l.removedAtISO !== undefined || l.anaesthetistId === undefined) return false
    const active = bookingsForList(s, l.id).filter((b) => b.cancellation === undefined)
    return active.length >= min && active.every((b) => b.completed) && authoriseBlockersFor(s, l.id).length === 0
  })
  if (found === undefined) throw new Error(`no ${state} List with ${min} complete Bookings in the seed`)
  return found.id
}

describe('the pure rule', () => {
  it('holds only a List with a stub and no live Booking', () => {
    expect(listHeldByStub(0, 1)).toBe(true)
    expect(listHeldByStub(0, 0)).toBe(false)
    expect(listHeldByStub(2, 1)).toBe(false)
  })

  it('the reason has no dashes and names no price', () => {
    expect(STUB_ONLY_REASON).not.toMatch(/[–—]/)
    expect(STUB_ONLY_REASON).not.toMatch(/price/i)
  })
})

describe('a List holding only a stub', () => {
  it('is held, and submit is refused with the reason', () => {
    const api = createAppStore()
    expect(bookingsForList(api.getState(), SEED_STUB.listId)).toEqual([])
    expect(listHeldByStubOf(api.getState(), SEED_STUB.listId)).toBe(true)
    const out = submitList(api, SOUTER_ACTOR, SEED_STUB.listId)
    expect(out).toMatchObject({ ok: false, code: STUB_ONLY_LIST, message: STUB_ONLY_REASON })
    expect(api.getState().schedule.lists[SEED_STUB.listId]?.state).toBe('ACTIVE')
  })

  it('is refused by the office as well', () => {
    const api = createAppStore()
    expect(submitList(api, OFFICE_ACTOR, SEED_STUB.listId)).toMatchObject({ ok: false, code: STUB_ONLY_LIST })
  })

  it('submits once the stub is resolved with an NHI', () => {
    const api = createAppStore()
    const r = resolveStub(api, OFFICE_ACTOR, SEED_STUB.stubId, { kind: 'addNhi', nhi: SEED_STUB.nhiToType })
    expect(r.ok).toBe(true)
    expect(listHeldByStubOf(api.getState(), SEED_STUB.listId)).toBe(false)
  })

  it('is lifted when the stub is rejected', () => {
    const api = createAppStore()
    const r = resolveStub(api, OFFICE_ACTOR, SEED_STUB.stubId, { kind: 'reject', reason: 'Not for AA' })
    expect(r.ok).toBe(true)
    expect(listHeldByStubOf(api.getState(), SEED_STUB.listId)).toBe(false)
    expect(stubOnlyBlockerFor(api.getState(), SEED_STUB.listId)).toBeUndefined()
  })

  it('ignores a stub on a removed List', () => {
    const api = createAppStore()
    const s = api.getState()
    const list = s.schedule.lists[SEED_STUB.listId]!
    api.setState({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [list.id]: { ...list, removedAtISO: '2026-11-24T09:00:00' } } } })
    expect(listHeldByStubOf(api.getState(), SEED_STUB.listId)).toBe(false)
  })
})

describe('a List with Bookings and a stub', () => {
  it('is never held up: two Bookings and a stub submit as usual', () => {
    const api = createAppStore()
    const listId = listIn(api, 'ACTIVE', 2)
    standStubOn(api, listId)
    expect(listHeldByStubOf(api.getState(), listId)).toBe(false)
    expect(submitList(api, OFFICE_ACTOR, listId)).toMatchObject({ ok: true })
  })

  it('authorises as usual', () => {
    const api = createAppStore()
    const listId = listIn(api, 'SUBMITTED', 2)
    standStubOn(api, listId)
    expect(authoriseBlockersFor(api.getState(), listId)).toEqual([])
    expect(authoriseList(api, OFFICE_ACTOR, listId)).toMatchObject({ ok: true })
  })
})

describe('a submitted List left holding only a stub (its Bookings cancelled)', () => {
  function cancelledWithStub(): { api: AppStoreApi; listId: string } {
    const api = createAppStore()
    const listId = listIn(api, 'SUBMITTED', 1)
    const s = api.getState()
    const bookings = { ...s.schedule.bookings }
    for (const b of bookingsForList(s, listId)) bookings[b.id] = { ...b, cancellation: { reason: 'test', atISO: '2026-11-24T09:00:00', by: 'test' } as never }
    api.setState({ schedule: { ...s.schedule, bookings } })
    standStubOn(api, listId)
    return { api, listId }
  }

  it('is held, and authorise is refused with the reason, never "needs a price"', () => {
    const { api, listId } = cancelledWithStub()
    const out = authoriseList(api, OFFICE_ACTOR, listId)
    expect(out).toMatchObject({ ok: false, code: STUB_ONLY_LIST, message: STUB_ONLY_REASON })
    if (!out.ok) expect(out.message).not.toContain(AUTHORISE_NEEDS_PRICE)
    expect(api.getState().schedule.lists[listId]?.state).toBe('SUBMITTED')
  })

  it("Review's blocker is the refusal's, with no Booking named", () => {
    const { api, listId } = cancelledWithStub()
    const blockers = authoriseBlockersFor(api.getState(), listId)
    expect(blockers).toEqual([{ code: STUB_ONLY_LIST, message: STUB_ONLY_REASON }])
    const out = authoriseList(api, OFFICE_ACTOR, listId)
    if (!out.ok) expect(out.message).toBe(blockers[0]!.message)
  })

  it("the office stand-in's disabled reason is the same", () => {
    const { api, listId } = cancelledWithStub()
    expect(officeStandInRefusal(api.getState(), listId)).toBe(STUB_ONLY_REASON)
  })
})

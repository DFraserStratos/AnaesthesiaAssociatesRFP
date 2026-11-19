import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { feedChangesPrimary, feedChangesPrimaryRefusal, multiProcedureLoadRefusal, nextOpenSouterList, stageMultiProcedureBooking } from './demoMultiProcedure'
import { proceduresForBooking } from './selectors'
import { procedureFeeAlone } from './testFees'
import { DEMO_TRIGGERS } from '../shared/demoTriggers/registry'
import { MULTI_PROCEDURE_IDS, SEED_MARKERS } from '../domain/seed'
import type { AssignedList } from '../domain/types'

function staged() {
  const api = createAppStore()
  const res = stageMultiProcedureBooking(api)
  if (!res.ok) throw new Error(res.message)
  return { api, bookingId: res.value.bookingId, message: res.value.message }
}

describe('Load 3-procedure Booking (catch-up Phase 23)', () => {
  it("stages the spec on Dr Souter's next open List, primary first, 7 modifier units split 3 · 2 · 2, not complete", () => {
    const { api, bookingId, message } = staged()
    const s = api.getState()
    const booking = s.schedule.bookings[bookingId]!
    const list = s.schedule.lists[booking.listId] as AssignedList
    expect(list.id).toBe(nextOpenSouterList(createAppStore().getState())!.id)
    expect(list.state).toBe('ACTIVE')
    expect(booking.completed).toBe(false)
    expect(message).toMatch(/^Loaded on Dr Souter's \w{3} \d+ \w{3} (AM|PM) List: 3 procedures, 7 modifier units, split 3 · 2 · 2\.$/)
    const procs = proceduresForBooking(s, bookingId)
    expect(procs.map((p) => p.isPrimary)).toEqual([true, false, false])
    expect(procs.every((p) => p.governingContractId === 'CT-NO-CONTRACT')).toBe(true)
    const shares = procs.map(
      (p) => procedureFeeAlone({ procedure: p, siblings: procs, list, masters: s.masters, patientId: booking.patientId }).fee.allocation.modifierShare,
    )
    expect(shares).toEqual([3, 2, 2])
    // Audited as the demo's office stand-in.
    expect(s.audit.filter((a) => a.entityId === bookingId).every((a) => a.source === 'demo')).toBe(true)
  })

  it('is deterministic: two stores stage identical Bookings', () => {
    const a = staged()
    const b = staged()
    const strip = (api: ReturnType<typeof createAppStore>, id: string) => proceduresForBooking(api.getState(), id).map(({ id: _id, bookingId: _b, ...rest }) => rest)
    expect(strip(a.api, a.bookingId)).toEqual(strip(b.api, b.bookingId))
  })

  it('refuses a second load on the same List, naming it', () => {
    const { api } = staged()
    expect(multiProcedureLoadRefusal(api.getState())).toMatch(/^Already loaded on \w{3} \d+ \w{3} (AM|PM)$/)
    expect(stageMultiProcedureBooking(api).ok).toBe(false)
  })

  it('is disabled when Dr Souter has no open List ahead', () => {
    const api = createAppStore()
    api.setState((s) => ({ clock: { ...s.clock, todayISO: '2027-06-30' } }))
    expect(multiProcedureLoadRefusal(api.getState())).toBe('Dr Souter has no open List ahead')
  })
})

describe('Hospital feed changes the primary (catch-up Phase 23)', () => {
  it("makes the next Procedure primary through the List's feed, audited as integration, cycling", () => {
    const { api, bookingId } = staged()
    const [first, second, third] = proceduresForBooking(api.getState(), bookingId)
    const res = feedChangesPrimary(api, bookingId)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value.message).toMatch(/ made .+ the primary\. Base units now come from it\.$/)
    expect(api.getState().schedule.procedures[second!.id]!.isPrimary).toBe(true)
    const entries = api.getState().audit.filter((a) => a.action === 'procedure.setPrimary')
    expect(entries).toHaveLength(2)
    expect(entries.every((e) => e.source === 'integration')).toBe(true)
    feedChangesPrimary(api, bookingId)
    expect(api.getState().schedule.procedures[third!.id]!.isPrimary).toBe(true)
    feedChangesPrimary(api, bookingId)
    expect(api.getState().schedule.procedures[first!.id]!.isPrimary).toBe(true)
  })

  it('is deterministic', () => {
    const a = staged()
    const b = staged()
    feedChangesPrimary(a.api, a.bookingId)
    feedChangesPrimary(b.api, b.bookingId)
    expect(proceduresForBooking(a.api.getState(), a.bookingId).map((p) => p.isPrimary)).toEqual(proceduresForBooking(b.api.getState(), b.bookingId).map((p) => p.isPrimary))
  })

  it('is refused on a SUBMITTED List (the seeded Booking), on a cancelled Booking and on one with a single procedure', () => {
    const api = createAppStore()
    expect(feedChangesPrimaryRefusal(api.getState(), MULTI_PROCEDURE_IDS.booking)).toBe('A hospital feed cannot change a submitted List')
    expect(feedChangesPrimary(api, MULTI_PROCEDURE_IDS.booking).ok).toBe(false)
    expect(feedChangesPrimaryRefusal(api.getState(), SEED_MARKERS['feeSplitBooking']!.entityId)).toMatch(/submitted List|one procedure/)
    expect(feedChangesPrimaryRefusal(api.getState(), 'BK9999')).toBe('Open a Booking')
  })
})

describe('the two registry entries', () => {
  const load = DEMO_TRIGGERS.find((t) => t.id === 'load-multi-procedure-booking')!
  const feed = DEMO_TRIGGERS.find((t) => t.id === 'feed-changes-primary')!

  it('are registered once each, on the bar and the PWA sheet, with no Future-scope badge', () => {
    expect(DEMO_TRIGGERS.filter((t) => t.id === load.id || t.id === feed.id)).toHaveLength(2)
    for (const t of [load, feed]) {
      expect(t.surfaces).toEqual(['bar', 'pwa'])
      expect(t.badge).toBeUndefined()
      expect(t.label).not.toMatch(/[–—]|swap|slot/i)
    }
  })

  it('give their disabled reasons', () => {
    const { api, bookingId } = staged()
    const state = api.getState()
    expect(load.disabledReason(state, { pathname: '/admin', params: {}, published: {} })).toMatch(/^Already loaded on /)
    expect(feed.disabledReason(state, { pathname: '/admin', params: { bookingId: MULTI_PROCEDURE_IDS.booking }, published: {} })).toBe('A hospital feed cannot change a submitted List')
    expect(feed.disabledReason(state, { pathname: '/admin', params: { bookingId }, published: {} })).toBeNull()
    expect(feed.when?.(state, { pathname: '/admin', params: { bookingId: SEED_MARKERS['designDayPmList']!.entityId }, published: {} })).toBe(false)
  })
})

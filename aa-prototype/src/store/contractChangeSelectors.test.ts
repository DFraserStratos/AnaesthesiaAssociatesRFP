/**
 * The Contract change warnings and the Disabled Contract flag on the seeded
 * store (catch-up Phase 25a; US-04.1.2, US-04.2.15, US-07.2.2, D79, D81):
 * Merivale's Face lift, its un-authorised Mon 10 Aug Bookings and Judith
 * Calloway's AUTHORISED Thu 16 Jul one. Nothing moves; the flag never blocks.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { addBackdatedRangeDemo, BACKDATED_RANGE, BACKDATED_RANGE_CONTRACT_ID } from './demoBackdatedRange'
import { disableContract, enableContract } from './contractActions'
import { keptPriceForRange, keptPriceOnContractNow, stillOnContract } from './contractChangeSelectors'
import { reviewFlagsFor, reviewFlagsOnList } from './reviewSelectors'
import { contractDisabledOn, contractHistoryFor } from '../domain/billing/contractHistory'
import { SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import { authoriseBlockersFor } from './lifecycle'
import { OFFICE_ACTOR } from './demoActors'
import { MERIVALE_BOOKING_LIST_ID } from '../domain/seed/pricedItemBookings'

const FACE_LIFT = BACKDATED_RANGE_CONTRACT_ID

describe('the dated-change and disable list (US-04.1.2, D79)', () => {
  it("lists the un-authorised Face lifts from the day; Judith Calloway's AUTHORISED one is never listed", () => {
    const api = createAppStore()
    const rows = stillOnContract(api.getState(), FACE_LIFT, '2026-07-21')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.dateISO >= '2026-07-21')).toBe(true)
    const names = rows.map((r) => r.patientName)
    expect(names).toEqual(expect.arrayContaining(['Sophie Matthews', 'Paula Westerman', 'Fiona Lattimer']))
    expect(names).not.toContain('Judith Calloway')
    expect(rows.filter((r) => r.listId === MERIVALE_BOOKING_LIST_ID).length).toBeGreaterThanOrEqual(3)
  })

  it('disabling moves nothing: every Procedure keeps the Face lift', () => {
    const api = createAppStore()
    const before = JSON.stringify(api.getState().schedule.procedures)
    expect(disableContract(api, OFFICE_ACTOR, FACE_LIFT).ok).toBe(true)
    expect(JSON.stringify(api.getState().schedule.procedures)).toBe(before)
  })
})

describe('the Disabled Contract flag on the seeded store (US-07.2.2, D81)', () => {
  it("disable today: Review of Dr Souter's Mon 10 Aug PM flags each Face lift, Authorise is not blocked by it; Make active clears them", () => {
    const api = createAppStore()
    const blockersBefore = authoriseBlockersFor(api.getState(), MERIVALE_BOOKING_LIST_ID)
    expect(reviewFlagsOnList(api.getState(), MERIVALE_BOOKING_LIST_ID).filter((f) => f.rule === 'contractDisabled')).toEqual([])
    disableContract(api, OFFICE_ACTOR, FACE_LIFT)
    const flags = reviewFlagsOnList(api.getState(), MERIVALE_BOOKING_LIST_ID).filter((f) => f.rule === 'contractDisabled')
    expect(flags.length).toBeGreaterThanOrEqual(3)
    expect(new Set(flags.map((f) => f.text))).toEqual(new Set(['Contract disabled on Tue 21 Jul']))
    expect(authoriseBlockersFor(api.getState(), MERIVALE_BOOKING_LIST_ID)).toEqual(blockersBefore)
    enableContract(api, OFFICE_ACTOR, FACE_LIFT)
    expect(reviewFlagsOnList(api.getState(), MERIVALE_BOOKING_LIST_ID).filter((f) => f.rule === 'contractDisabled')).toEqual([])
  })
})

describe('the seeded Disabled Contract case (work item 7)', () => {
  it("the flag fires on exactly its seeded Booking, from the audit's disable day, and never blocks", () => {
    const s = createAppStore().getState()
    expect(contractDisabledOn(s.audit, 'CT-CES-2025')).toBe('2026-07-10')
    const id = SEED_MARKERS.disabledContractBooking!.entityId
    const flagged = Object.values(s.schedule.bookings).flatMap((b) => reviewFlagsFor(s, b.id)).filter((f) => f.rule === 'contractDisabled')
    expect(flagged.map((f) => [f.bookingId, f.text])).toEqual([[id, 'Contract disabled on Fri 10 Jul']])
    const booking = s.schedule.bookings[id]!
    expect(booking.listId).toBe(SEED_LIST_IDS.reviewFlags)
    expect(s.schedule.lists[booking.listId]?.state).toBe('SUBMITTED')
    // Only the one flag on it: its Contract still fits the List.
    expect(reviewFlagsFor(s, id).map((f) => f.rule)).toEqual(['contractDisabled'])
    // 21a's "Needs a price" Booking blocks the List on purpose; nothing blocks on this one.
    expect(JSON.stringify(authoriseBlockersFor(s, booking.listId))).not.toContain(id)
    // The Contract's History shows the disable.
    expect(contractHistoryFor(s.audit, 'CT-CES-2025').map((a) => [a.action, a.who])).toEqual([['contract.disable', 'Kirsty W.']])
  })
})

describe('the kept-price warning (US-04.2.15, D79)', () => {
  it("the backdated range keeps Judith Calloway's locked $3,100.00 and lists only her; the re-priced Face lifts are never listed", () => {
    const api = createAppStore()
    expect(keptPriceOnContractNow(api.getState(), FACE_LIFT)).toEqual([])
    expect(addBackdatedRangeDemo(api).ok).toBe(true)
    const rows = keptPriceForRange(api.getState(), FACE_LIFT, BACKDATED_RANGE)
    expect(rows.map((r) => [r.patientName, r.lockedPrice, r.rangePrice])).toEqual([['Judith Calloway', 3100, 3300]])
    expect(keptPriceOnContractNow(api.getState(), FACE_LIFT)).toEqual(rows)
  })
})

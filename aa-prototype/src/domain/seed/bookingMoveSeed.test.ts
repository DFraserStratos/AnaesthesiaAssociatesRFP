/**
 * Seed invariants for the single-Booking move (catch-up Phase 32a; US-01.4.7,
 * US-01.4.6). They protect S2 Beat 3d, the not-preferred and prepaid checks,
 * the PWA stand-in and the acceptance beat, rather than patch data.
 */

import { describe, expect, it } from 'vitest'
import { ANAE, BOOKING_MOVE_DEMO, LIST_MOVE_DEMO, SCRIPTED_BEAT_SCHEDULE, SURG, buildSeed } from './index'
import { addDaysISO, DEMO_TODAY } from '../clock'
import { bookingMoveReceivers, bookingMoveRefusal, bookingPlacement, freeColleagues, type BookingMoveInput } from '../bookingMoves'
import { slotIdFor } from '../slots'

const seed = buildSeed()
const input: BookingMoveInput = {
  lists: seed.schedule.lists,
  slots: seed.schedule.slots,
  anaesthetists: seed.masters.anaesthetists,
  bookings: seed.schedule.bookings,
  slotStatuses: seed.masters.slotStatuses,
}
const scriptedLists = new Set<string>(SCRIPTED_BEAT_SCHEDULE.listIds)
const scriptedSlots = new Set<string>(SCRIPTED_BEAT_SCHEDULE.slotIds)
const SIX_DAYS_ON = addDaysISO(DEMO_TODAY, 6)
const D = BOOKING_MOVE_DEMO

function listOf(bookingId: string) {
  const b = seed.schedule.bookings[bookingId]
  if (b === undefined) throw new Error(`${bookingId} missing`)
  const l = seed.schedule.lists[b.listId]
  if (l === undefined || l.state === 'DRAFT') throw new Error(`${bookingId}'s List is not assigned`)
  return l
}

function rowFor(bookingId: string, colleagueId: string) {
  return bookingMoveReceivers(input, bookingId, ANAE.souter, '').find((r) => r.anaesthetistId === colleagueId)
}

/** A Booking with a Procedure on a prepaid Contract (catch-up Phase 20: prepayment follows the Contract). */
function prepaid(bookingId: string): boolean {
  return Object.values(seed.schedule.procedures).some(
    (p) => p.bookingId === bookingId && p.governingContractId !== undefined && seed.masters.contracts[p.governingContractId]?.prepaid === true,
  )
}

describe('S2 Beat 3d: the movable Booking', () => {
  const list = listOf(D.bookingId)

  it("is a non-cancelled Booking on Souter's ACTIVE Wed 22 AM List at Christchurch Eye Surgery, in the next six days", () => {
    expect(list.id).toBe(D.sourceListId)
    expect(list).toMatchObject({ anaesthetistId: ANAE.souter, state: 'ACTIVE', hospitalId: 'H-CES', surgeonId: SURG.whitford, dateISO: '2026-11-25', session: 'AM' })
    expect(list.dateISO <= SIX_DAYS_ON).toBe(true)
    expect(bookingMoveRefusal(input, D.bookingId, ANAE.souter, DEMO_TODAY)).toBeNull()
    expect(bookingMoveRefusal(input, D.secondBookingId, ANAE.souter, DEMO_TODAY)).toBeNull()
  })

  it("is scripted for Beat 3d (with Whitaker's receiving session), and is none of Phase 32's pinned Lists", () => {
    expect(scriptedLists.has(D.sourceListId)).toBe(true)
    expect(scriptedSlots.has(slotIdFor(D.receiverId, '2026-11-25', 'AM'))).toBe(true)
    // The beat's other rows stay as the guide says: the second receiver, the colleague away, the List holder.
    expect(scriptedSlots.has(slotIdFor(D.secondReceiverId, '2026-11-25', 'AM'))).toBe(true)
    expect(scriptedSlots.has(slotIdFor(D.unavailableColleagueId, '2026-11-25', 'AM'))).toBe(true)
    expect(scriptedLists.has(`L-${D.listHoldingColleagueId}-2026-11-25-AM`)).toBe(true)
    expect(Object.values(LIST_MOVE_DEMO)).not.toContain(D.sourceListId)
  })

  it('has free colleagues of several tiers in name order, one not available and one already holding a List', () => {
    const free = freeColleagues(input, D.bookingId, ANAE.souter).map((r) => r.anaesthetistId)
    expect(free).toEqual([ANAE.delaney, ANAE.morrison, ANAE.ngata, ANAE.ropata, ANAE.sharma, ANAE.whitaker])
    const tiers = new Set(free.map((id) => seed.officePrivate.priorityTiers[id] ?? 4))
    expect(tiers.size).toBeGreaterThan(1)
    expect(rowFor(D.bookingId, D.receiverId)?.offer).not.toBeNull()
    expect(rowFor(D.bookingId, D.secondReceiverId)?.offer).not.toBeNull()
    expect(rowFor(D.bookingId, D.unavailableColleagueId)).toMatchObject({ offer: null, block: 'notAvailable' })
    expect(rowFor(D.bookingId, D.listHoldingColleagueId)).toMatchObject({ offer: null, block: 'hasList' })
  })
})

describe('the not-preferred receiver and the prepaid Bookings', () => {
  it("Mrs Riley's prepaid Booking (Ms Lim) can go to Dr Ropata, who has a not-preferred pairing with Ms Lim", () => {
    const list = listOf(D.notPreferredBookingId)
    expect(list.surgeonId).toBe(SURG.lim)
    expect(prepaid(D.notPreferredBookingId)).toBe(true)
    expect(bookingPlacement(input, D.notPreferredBookingId, D.notPreferredReceiverId).ok).toBe(true)
    const notPreferred = Object.values(seed.officePrivate.pairingPreferences).some(
      (p) => p.kind === 'NOT_PREFERRED' && p.endedAtISO === undefined && p.anaesthetistId === D.notPreferredReceiverId && p.surgeonId === SURG.lim,
    )
    expect(notPreferred).toBe(true)
  })

  it("the paid Nair Booking is prepaid, Souter's, movable and has free colleagues", () => {
    expect(prepaid(D.prepaidBookingId)).toBe(true)
    expect(listOf(D.prepaidBookingId).anaesthetistId).toBe(ANAE.souter)
    expect(bookingMoveRefusal(input, D.prepaidBookingId, ANAE.souter, DEMO_TODAY)).toBeNull()
    expect(freeColleagues(input, D.prepaidBookingId, ANAE.souter).length).toBeGreaterThan(0)
  })
})

describe('the trigger candidates', () => {
  it("the stand-in: Dr Hughes's unscripted Wed 22 PM Booking fits Souter's free, empty Wed 22 PM", () => {
    const list = listOf(D.standInBookingId)
    expect(list).toMatchObject({ anaesthetistId: ANAE.hughes, state: 'ACTIVE', dateISO: '2026-11-25', session: 'PM' })
    expect(scriptedLists.has(list.id)).toBe(false)
    expect(scriptedSlots.has(D.standInSlotId)).toBe(false)
    expect(bookingMoveRefusal(input, D.standInBookingId, ANAE.hughes, DEMO_TODAY)).toBeNull()
    expect(bookingPlacement(input, D.standInBookingId, ANAE.souter)).toEqual({ ok: true, slotId: D.standInSlotId })
  })

  it("the acceptance beat: the appended Booking on Beaumont's Fri 31 AM, where Souter is not available until she says so", () => {
    const acceptance = Object.values(seed.schedule.bookings).filter((b) => b.listId === D.acceptanceListId)
    expect(acceptance.map((b) => b.id)).toEqual(['BK0162'])
    expect(listOf('BK0162')).toMatchObject({ anaesthetistId: ANAE.beaumont, state: 'ACTIVE' })
    expect(scriptedLists.has(D.acceptanceListId)).toBe(false)
    expect(bookingPlacement(input, 'BK0162', ANAE.souter)).toMatchObject({ ok: false, code: 'notAvailable' })
    const accepted = { ...input, slots: { ...input.slots, [D.acceptanceSlotId]: { ...input.slots[D.acceptanceSlotId]!, status: 'free' } } }
    expect(bookingPlacement(accepted, 'BK0162', ANAE.souter).ok).toBe(true)
  })
})

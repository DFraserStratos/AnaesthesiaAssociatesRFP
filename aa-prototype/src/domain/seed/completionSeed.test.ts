/**
 * Catch-up Phase 21a: every completed, non-cancelled seeded Booking passes the
 * three-condition completion rule (a Contract, the RVG detail on RVG kinds, a
 * price), and the two session-1 markers read as built.
 */
import { describe, expect, it } from 'vitest'
import { buildSeed, SEED_MARKERS } from './index'
import { completionFailuresFor, type CompletionContext } from '../billing/completion'
import { rvgDetailFor } from '../billing/rvgDetail'
import type { Procedure } from '../types'

const seed = buildSeed()
const { masters, schedule } = seed

function proceduresOf(bookingId: string): Procedure[] {
  return Object.values(schedule.procedures)
    .filter((p) => p.bookingId === bookingId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function ctxFor(bookingId: string): CompletionContext {
  const booking = schedule.bookings[bookingId]!
  const list = schedule.lists[booking.listId]!
  return {
    contracts: masters.contracts,
    parties: masters.parties,
    rvgGroups: masters.rvgGroups,
    modifiers: masters.modifiers,
    listDateISO: list.dateISO,
    patientDobISO: masters.patients[booking.patientId]?.dobISO,
  }
}

describe('seeded Bookings and the completion rule (catch-up Phase 21a)', () => {
  // An AUTHORISED List's Bookings are locked and never checked again (the browsable history's typed
  // backdrop, catch-up Phase 38a): the rule applies to everything still open to change.
  it('every completed, non-cancelled seeded Booking on a List not yet authorised passes completionFailuresFor', () => {
    const failing: string[] = []
    for (const booking of Object.values(schedule.bookings)) {
      if (!booking.completed || booking.cancellation !== undefined) continue
      if (schedule.lists[booking.listId]?.state === 'AUTHORISED') continue
      const failures = completionFailuresFor(booking, proceduresOf(booking.id), ctxFor(booking.id))
      if (failures.length > 0) failing.push(`${booking.id}: ${failures.map((f) => f.code).join(', ')}`)
    }
    expect(failing).toEqual([])
  })

  it('the fixed-price Booking with no times, code or modifiers completes, and asks for none of them', () => {
    const id = SEED_MARKERS.fixedPriceNoTimes!.entityId
    const booking = schedule.bookings[id]!
    const [p] = proceduresOf(id)
    expect(booking.completed).toBe(false)
    expect(schedule.lists[booking.listId]!.state).toBe('ACTIVE')
    expect(p!.anaestheticStartISO).toBeUndefined()
    expect(p!.handoverISO).toBeUndefined()
    expect(p!.rvgGroupId).toBeUndefined()
    const contract = masters.contracts[p!.governingContractId!]!
    expect(contract.pricing.kind).toBe('fixed')
    expect(rvgDetailFor(contract)).toEqual({ rvgCode: 'reference', times: 'hidden', modifiers: 'hidden' })
    expect(completionFailuresFor(booking, [p!], ctxFor(id))).toEqual([])
  })

  it('the open-price Booking with no amount needs a price, and that alone', () => {
    const id = SEED_MARKERS.needsPriceBooking!.entityId
    const booking = schedule.bookings[id]!
    expect(schedule.lists[booking.listId]!.state).toBe('ACTIVE')
    const failures = completionFailuresFor(booking, proceduresOf(id), ctxFor(id))
    expect(failures.map((f) => f.code)).toEqual(['needsPrice'])
  })
})

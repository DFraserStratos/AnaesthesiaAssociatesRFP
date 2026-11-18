/**
 * Catch-up Phase 32d parity (work item 1; DM-71, RV-43, OQ-139 answered): the
 * public List kind is retired and the seed re-homed, and nothing billed moves.
 *
 * The fixture (`__fixtures__/phase-32d-seed-baseline.json`) was written once by
 * `__fixtures__/phase32dCapture.ts` from the seed as it stood BEFORE the
 * re-home (public Lists in place). This suite was green against that seed
 * before anything changed, and is never run with `-u`.
 *
 * Must not move: every Booking, Procedure and billing line; every List holding
 * a Booking (id, Slot, state, hospital, surgeon, notes; not its kind or its
 * recurring link); every other Slot and List; the free sessions per day, Tue 21
 * to Fri 24 Jul; the post-op anchor; the billing-failure List and Souter's
 * Thu 23 Jul Christchurch Public List.
 *
 * May move, each pinned below: the bookless public Lists (gone, their sessions
 * Public with the note "CPH"), the recurring-clash Draft Lists the public rows
 * raised (gone), the Draft Lists count, a re-homed List's kind (private).
 */

import { describe, expect, it } from 'vitest'
import baselineJson from './__fixtures__/phase-32d-seed-baseline.json'
import { auditLine, capturePhase32d, freeSessionsOn, PARITY_DAYS, type Phase32dSeedBaseline } from './__fixtures__/phase32dCapture'
import { buildSeed, DISABLED_CONTRACT_BOOKING_IDS, SEED_LIST_IDS } from './index'
import { projectedListId } from '../slots'
import { ANAE } from './cast'

const before = baselineJson as unknown as Phase32dSeedBaseline
const seed = buildSeed()
/**
 * Catch-up Phase 25a appended one Booking (and its Procedure) on a new Disabled
 * Contract after this fixture was written: set aside with its audit entries, so
 * every Booking, Procedure and entry 32d captured still compares as written.
 */
const ADDED_25A_BOOKINGS = new Set(DISABLED_CONTRACT_BOOKING_IDS)
const ADDED_25A_ENTITIES = new Set([
  ...ADDED_25A_BOOKINGS,
  ...Object.values(seed.schedule.procedures).filter((p) => ADDED_25A_BOOKINGS.has(p.bookingId)).map((p) => p.id),
  'CT-CES-2025',
])
const captured = capturePhase32d(seed)
const now = {
  ...captured,
  bookings: Object.fromEntries(Object.entries(captured.bookings).filter(([id]) => !ADDED_25A_BOOKINGS.has(id))),
  procedures: Object.fromEntries(Object.entries(captured.procedures).filter(([, p]) => !ADDED_25A_BOOKINGS.has(p.bookingId))),
}
const seedAuditBefore25a = seed.audit.filter((a) => !ADDED_25A_ENTITIES.has(a.entityId))
/**
 * The seed audit dates each Booking's synthetic "booked" entries by its place in
 * id order (`bookingISO`), so 25a's Booking moves every Booking whose id sorts
 * after it (the history Bookings, `HBK…`) by one slot: those entries, and their
 * Procedures' and billing lines', are compared without their time.
 */
const FIRST_25A = [...ADDED_25A_BOOKINGS].sort()[0]!
function bookingOfEntity(type: string, id: string): string | undefined {
  if (type === 'booking') return id
  if (type === 'procedure') return seed.schedule.procedures[id]?.bookingId
  if (type === 'billingLine') {
    const line = seed.schedule.billingLines[id]
    return line !== undefined ? seed.schedule.procedures[line.procedureId]?.bookingId : undefined
  }
  return undefined
}
const timeShifted25a = (line: string): string => {
  const [, type = '', id = ''] = line.split('|')
  const booking = bookingOfEntity(type, id)
  return booking !== undefined && booking > FIRST_25A ? line.split('|').slice(0, 4).join('|') : line
}

/** Dr Sharma's Tue 14 Jul AM List: 14's "Stage post-op scenario" anchor (POST_OP_ORIGINAL_LIST_ID). */
const POST_OP_ANCHOR = projectedListId(ANAE.sharma, '2026-07-14', 'AM')
/** Dr Souter's Thu 23 Jul AM List at Christchurch Public, eight Health NZ Bookings. */
const SOUTER_THU23 = projectedListId(ANAE.souter, '2026-07-23', 'AM')

/** The two prepaid Rhinoplasty Procedures Lane A's Phase 27 re-seeded: Riley's (BK0034) and Nair's (BK0038). */
const PHASE_27_MOVED = ['P0036', 'P0041'] as const
const omit = <T,>(rec: Record<string, T>, ids: readonly string[]): Record<string, T> =>
  Object.fromEntries(Object.entries(rec).filter(([id]) => !ids.includes(id)))

const removedListIds = new Set(before.publicBookless)
const removedSlotIds = new Set(before.publicBookless.map((id) => before.otherLists[id]!.slotId!))
const removedDraftIds = new Set(before.draftListIds.filter((id) => !now.draftListIds.includes(id)))

describe('Phase 32d parity: what must not move', () => {
  it('the baseline is the pre-re-home seed: 12 public Lists hold Bookings, 240 are bookless', () => {
    expect(before.publicWithBookings).toHaveLength(12)
    expect(before.publicBookless).toHaveLength(240)
    expect(before.publicWithBookings).toContain(POST_OP_ANCHOR)
    expect(before.publicWithBookings).toContain(SOUTER_THU23)
    // Ropata's Thu 16 Jul AM (the billing-failure List) was re-pointed to St George's by the Phase 09 fixup: not public.
    expect(before.listsWithBookings[SEED_LIST_IDS.billingFailure]).toBeDefined()
  })

  it('every Booking, Procedure and billing line is identical', () => {
    expect(now.bookings).toEqual(before.bookings)
    expect(omit(now.procedures, PHASE_27_MOVED)).toEqual(omit(before.procedures, PHASE_27_MOVED))
    expect(now.billingLines).toEqual(before.billingLines)
  })

  // Wave 1 sync: Lane A's Phase 27 (built beside 32d) re-seeded Riley's and Nair's Rhinoplasty Procedures on Dr
  // Souter's prepaid Contract, after this fixture was written. Only those fields moved; the fixture is never rewritten.
  it("Phase 27's prepayment re-seed moved only Riley's and Nair's Rhinoplasty: their prepayment detail, and Nair's Contract and invoice description", () => {
    for (const id of PHASE_27_MOVED) {
      const { prepaymentDetail: _a, governingContractId: _b, invoiceDescription: _c, ...was } = before.procedures[id] as typeof before.procedures[string] & { prepaymentDetail?: unknown }
      const { governingContractId: _d, invoiceDescription: _e, ...is } = now.procedures[id]!
      expect(is).toEqual(was)
      expect('prepaymentDetail' in now.procedures[id]!).toBe(false)
    }
    expect(now.procedures.P0036!.governingContractId).toBe(before.procedures.P0036!.governingContractId)
    expect(now.procedures.P0036!.invoiceDescription).toEqual(before.procedures.P0036!.invoiceDescription)
    expect(now.procedures.P0041).toMatchObject({ governingContractId: 'CT-SOUTER-RHINO', invoiceDescription: { origin: 'contract', text: 'Rhinoplasty' } })
  })

  it('every List holding a Booking keeps its id, Slot, state, hospital, surgeon and notes', () => {
    expect(now.listsWithBookings).toEqual(before.listsWithBookings)
  })

  it('every other List is unchanged, apart from the bookless public Lists and the public rows\' clash Draft Lists', () => {
    for (const [id, list] of Object.entries(before.otherLists)) {
      if (removedListIds.has(id) || removedDraftIds.has(id)) continue
      expect(seed.schedule.lists[id], id).toEqual(list)
    }
    const known = new Set([...Object.keys(before.otherLists), ...Object.keys(before.listsWithBookings)])
    expect(Object.keys(seed.schedule.lists).filter((id) => !known.has(id))).toEqual([])
  })

  it('every Slot is unchanged, apart from the sessions the bookless public Lists sat in', () => {
    for (const [id, line] of Object.entries(before.slots)) {
      if (removedSlotIds.has(id)) continue
      expect(now.slots[id], id).toBe(line)
    }
    expect(Object.keys(now.slots).sort()).toEqual(Object.keys(before.slots).sort())
  })

  it('free sessions per day, Tue 21 to Fri 24 Jul, are unchanged (a public List and a Public session are both not free)', () => {
    for (const d of PARITY_DAYS) expect(freeSessionsOn(seed, d), d).toBe(before.freeByDay[d])
    expect(before.freeByDay).toEqual({ '2026-07-21': 6, '2026-07-22': 13, '2026-07-23': 7, '2026-07-24': 16 })
  })

  it('the seeded audit is unchanged, apart from entries about removed Lists (sequence numbers close up after them)', () => {
    const gone = (line: string) => [...removedListIds, ...removedDraftIds].some((id) => line.split('|')[2] === id)
    const body = (line: string) => line.split('|').slice(1).join('|')
    // Sorted: a moved time also moves an entry's place in the (time-ordered) audit.
    const comparable = (lines: string[]) => lines.filter((l) => !gone(l)).map(timeShifted25a).map(body).sort()
    expect(comparable(seedAuditBefore25a.map(auditLine))).toEqual(comparable(before.audit))
  })

  it('the post-op anchor holds Sarah Mitchell\'s Health NZ Booking', () => {
    const list = seed.schedule.lists[POST_OP_ANCHOR]
    expect(list?.state).toBe(before.listsWithBookings[POST_OP_ANCHOR]!.state)
    const bookings = Object.values(seed.schedule.bookings).filter((b) => b.listId === POST_OP_ANCHOR)
    expect(bookings.length).toBeGreaterThan(0)
    const procs = Object.values(seed.schedule.procedures).filter((p) => bookings.some((b) => b.id === p.bookingId))
    expect(procs.some((p) => p.billingReference === 'HNZ-2026-3102')).toBe(true)
  })

  it('Souter\'s Thu 23 Jul AM keeps its eight Bookings, and the billing-failure List its own', () => {
    expect(Object.values(seed.schedule.bookings).filter((b) => b.listId === SOUTER_THU23)).toHaveLength(8)
    expect(seed.schedule.lists[SEED_LIST_IDS.billingFailure]).toBeDefined()
    expect(Object.values(seed.schedule.bookings).some((b) => b.listId === SEED_LIST_IDS.billingFailure)).toBe(true)
  })
})

describe('Phase 32d parity: what may move, each pinned', () => {
  const lists = seed.schedule.lists
  const bookless = before.publicBookless.filter((id) => before.otherLists[id]!.state !== 'DRAFT')
  const clashDrafts = before.publicBookless.filter((id) => before.otherLists[id]!.state === 'DRAFT')

  it('234 bookless public Lists are gone; each session is Public with the note "CPH", never under a List', () => {
    expect(bookless).toHaveLength(234)
    for (const id of bookless) {
      expect(lists[id], id).toBeUndefined()
      const slot = seed.schedule.slots[before.otherLists[id]!.slotId!]!
      expect(slot.status).toBe('publicHospital')
      expect(slot.note).toBe('CPH')
    }
    const held = new Set(Object.values(lists).flatMap((l) => (l.slotId !== undefined ? [l.slotId] : [])))
    const publicSlots = Object.values(seed.schedule.slots).filter((s) => s.status === 'publicHospital')
    expect(publicSlots).toHaveLength(234)
    expect(publicSlots.filter((s) => held.has(s.id))).toEqual([])
  })

  it('the 12 public Lists holding Bookings are private Lists with no recurring link, same id', () => {
    for (const id of before.publicWithBookings) {
      expect(lists[id]?.kind, id).toBe('private')
      expect(lists[id]?.recurringBookingId, id).toBeUndefined()
    }
    expect(Object.values(lists).some((l) => (l.kind as string) === 'public')).toBe(false)
  })

  it('the six recurring-clash Draft Lists the public rows raised are gone; the Draft Lists count is 10', () => {
    expect([...clashDrafts].sort()).toEqual([...removedDraftIds].sort())
    expect(clashDrafts).toHaveLength(6)
    expect(before.draftListIds).toHaveLength(16)
    expect(now.draftListIds).toHaveLength(10)
  })

  it('seven weekly Public series, note "CPH", no end date; the surviving Lists\' sessions are deleted instances', () => {
    const series = Object.values(seed.schedule.availabilitySeries)
    expect(series.map((s) => s.id)).toEqual(['AS0001', 'AS0002', 'AS0003', 'AS0004', 'AS0005', 'AS0006', 'AS0007'])
    for (const s of series) {
      expect(s.statusKey).toBe('publicHospital')
      expect(s.note).toBe('CPH')
      expect(s.untilISO).toBeUndefined()
      expect(s.everyWeeks).toBe(1)
    }
    expect(series.find((s) => s.anaesthetistId === ANAE.whitaker)).toMatchObject({ weekdays: [2, 4, 5], sessions: 'AM' })
    expect(series.find((s) => s.anaesthetistId === ANAE.ropata)).toMatchObject({ weekdays: [2, 4], sessions: 'both' })
    expect(Object.keys(series.find((s) => s.anaesthetistId === ANAE.sharma)!.exceptions)).toContain('2026-07-14-AM')
    expect(seed.counters.availabilitySeries).toBe(8)
  })
})

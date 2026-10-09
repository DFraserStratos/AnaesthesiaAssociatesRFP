/**
 * Draft Lists, the pure rules (catch-up Phase 31; FT-01.6, US-01.6.2,
 * US-01.6.3, OQ-81 part 2): the guards, the one order, the waiting time,
 * availability by status alone, and the recurring clash.
 */

import { describe, expect, it } from 'vitest'
import {
  answeringLists,
  compareDraftLists,
  draftListAvailability,
  isAssignedList,
  isDraftList,
  normaliseClash,
  recurringClashDraft,
  recurringClashListId,
  RECURRING_BOOKING_CHANGED,
  waitingMinutes,
} from './draftLists'
import { answeredKey } from './recurringBookingProjection'
import { seedSlotStatusRecords } from './seed'
import { slotIdFor } from './slots'
import type { DraftList, RecurringBooking, Slot, SlotStatus } from './types'

const draft = (over: Partial<DraftList> = {}): DraftList => ({
  id: 'LG0001',
  state: 'DRAFT',
  dateISO: '2026-07-23',
  session: 'PM',
  kind: 'private',
  hospitalId: 'H-STG',
  surgeonId: 'S-TAN',
  conflicts: [],
  draft: { origin: 'request', source: 'phone', sinceISO: '2026-07-21T08:00:00', by: 'Kirsty W.' },
  ...over,
})

const rb: RecurringBooking = {
  id: 'RCB099',
  anaesthetistId: 'A1',
  dayOfWeek: 3,
  session: 'AM',
  kind: 'public',
  hospitalId: 'H-CPH',
  surgeonId: 'S-OKAFOR',
  notes: 'Acute theatre',
}

describe('guards', () => {
  it('a live Draft List is DRAFT and not removed; an assigned List is anything else', () => {
    expect(isDraftList(draft())).toBe(true)
    expect(isDraftList(draft({ removedAtISO: '2026-07-21T09:00:00' }))).toBe(false)
    expect(isDraftList(undefined)).toBe(false)
    expect(isAssignedList(draft())).toBe(false)
    expect(isAssignedList({ ...draft(), state: 'ACTIVE', anaesthetistId: 'A1', slotId: 'S-1' } as never)).toBe(true)
  })
})

describe('compareDraftLists (US-01.6.2: ascending date, soonest first)', () => {
  it('orders by date, then AM before PM, then the longer wait, then id, and is stable', () => {
    const a = draft({ id: 'b', dateISO: '2026-07-22', session: 'PM' })
    const b = draft({ id: 'a', dateISO: '2026-07-22', session: 'AM' })
    const c = draft({ id: 'c', dateISO: '2026-07-21', session: 'PM' })
    const longer = draft({ id: 'z', dateISO: '2026-07-22', session: 'PM', draft: { ...draft().draft, sinceISO: '2026-07-19T08:00:00' } })
    const tie = draft({ id: 'a2', dateISO: '2026-07-22', session: 'PM' })
    const sorted = [a, b, c, longer, tie].sort(compareDraftLists).map((l) => l.id)
    expect(sorted).toEqual(['c', 'a', 'z', 'a2', 'b'])
    expect([tie, a, longer, b, c].sort(compareDraftLists).map((l) => l.id)).toEqual(sorted)
  })
})

describe('waitingMinutes (US-01.6.2 "how long it has been waiting")', () => {
  it('runs from the trail to now, and freezes at assignment or removal', () => {
    const l = draft()
    expect(waitingMinutes(l, '2026-07-21T08:45:00')).toBe(45)
    expect(waitingMinutes(l, '2026-07-22T09:00:00')).toBe(25 * 60)
    const assigned = draft({ draft: { ...l.draft, assignedAtISO: '2026-07-21T10:00:00' } })
    expect(waitingMinutes(assigned, '2026-07-30T10:00:00')).toBe(120)
    const removed = draft({ removedAtISO: '2026-07-21T09:30:00' })
    expect(waitingMinutes(removed, '2026-07-30T10:00:00')).toBe(90)
    // A re-date keeps the wait.
    expect(waitingMinutes({ ...l, dateISO: '2026-08-01' } as DraftList, '2026-07-21T08:45:00')).toBe(45)
  })
})

describe('draftListAvailability (US-01.6.3: everybody potentially available)', () => {
  const statuses = {
    ...seedSlotStatusRecords(),
    ST0001: { key: 'ST0001', label: 'Course', longLabel: 'Course', bookable: false } as SlotStatus,
    ST0002: { key: 'ST0002', label: 'Flexible', longLabel: 'Flexible', bookable: true } as SlotStatus,
  }
  const slot = (a: string, status: string): Slot => ({ id: slotIdFor(a, '2026-07-23', 'PM'), anaesthetistId: a, dateISO: '2026-07-23', session: 'PM', status })
  const slots = Object.fromEntries(
    [slot('A1', 'free'), slot('A2', 'unavailable'), slot('A3', 'holiday'), slot('A4', 'free'), slot('A5', 'ST0001'), slot('A6', 'ST0002')].map((s) => [s.id, s]),
  )
  const anaesthetists = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'].map((id) => ({ registrationNumber: id, active: id !== 'A8' }))
  const out = draftListAvailability({
    list: draft(),
    anaesthetists,
    slots,
    listIdBySlot: new Map([[slotIdFor('A4', '2026-07-23', 'PM'), 'L-A4']]),
    statuses,
  })

  it('splits by availability alone into free, not available and occupied, in roster order', () => {
    expect(out.free.map((r) => r.anaesthetistId)).toEqual(['A1', 'A6'])
    expect(out.notAvailable.map((r) => r.anaesthetistId)).toEqual(['A2', 'A3', 'A5'])
    expect(out.occupied).toEqual([expect.objectContaining({ anaesthetistId: 'A4', listId: 'L-A4' })])
  })

  it('loses and duplicates nobody, and leaves out the inactive and those with no session that day', () => {
    const all = [...out.free, ...out.notAvailable, ...out.occupied].map((r) => r.anaesthetistId).sort()
    expect(all).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6'])
  })

  it('an admin-added status lands by its bookable flag and keeps its own label', () => {
    expect(out.notAvailable.find((r) => r.anaesthetistId === 'A5')?.statusLabel).toBe('Course')
    expect(out.free.find((r) => r.anaesthetistId === 'A6')?.statusLabel).toBe('Flexible')
  })
})

describe('recurringClashDraft (OQ-81 part 2: the one rule)', () => {
  const slots = { [slotIdFor('A1', '2026-07-22', 'AM')]: { id: slotIdFor('A1', '2026-07-22', 'AM'), anaesthetistId: 'A1', dateISO: '2026-07-22', session: 'AM', status: 'holiday' } as Slot }

  it('turns a clash into a DRAFT List copying the recurring booking, with a stable id and no anaesthetist or session', () => {
    const clash = normaliseClash({ recurringBookingId: rb.id, slotId: slotIdFor('A1', '2026-07-22', 'AM') }, slots)!
    const out = recurringClashDraft(clash, rb, '2026-07-21', '2026-07-21T00:05:00', 'System')!
    expect(out).toMatchObject({
      id: 'LD-RCB099-2026-07-22-AM',
      state: 'DRAFT',
      dateISO: '2026-07-22',
      session: 'AM',
      kind: 'public',
      hospitalId: 'H-CPH',
      surgeonId: 'S-OKAFOR',
      notes: 'Acute theatre',
      recurringBookingId: 'RCB099',
      conflicts: [],
      draft: { origin: 'recurringClash', sinceISO: '2026-07-21T00:05:00', by: 'System', fromAnaesthetistId: 'A1', projectedFor: { recurringBookingId: 'RCB099', dateISO: '2026-07-22', session: 'AM' } },
    })
    expect(out.anaesthetistId).toBeUndefined()
    expect(out.slotId).toBeUndefined()
    expect(recurringClashListId('RCB099', '2026-07-22', 'AM')).toBe(out.id)
    expect(recurringClashDraft(clash, rb, '2026-07-21', '2026-07-21T00:05:00', 'System')).toEqual(out)
  })

  it('a generator clash and a projection skipped entry for the same session give the same record', () => {
    const fromGenerator = normaliseClash({ recurringBookingId: rb.id, slotId: slotIdFor('A1', '2026-07-22', 'AM') }, slots)
    const fromSkipped = normaliseClash({ recurringBookingId: rb.id, slotId: slotIdFor('A1', '2026-07-22', 'AM'), dateISO: '2026-07-22', statusKey: 'holiday' } as never, slots)
    expect(fromSkipped).toEqual(fromGenerator)
  })

  it('gives null for a past day and for a day the recurring booking is not running', () => {
    const clash = normaliseClash({ recurringBookingId: rb.id, slotId: slotIdFor('A1', '2026-07-22', 'AM') }, slots)!
    expect(recurringClashDraft(clash, rb, '2026-07-23', '2026-07-23T08:00:00', 'System')).toBeNull()
    expect(recurringClashDraft(clash, { ...rb, effectiveFromISO: '2026-08-01' }, '2026-07-21', '2026-07-21T08:00:00', 'System')).toBeNull()
    expect(recurringClashDraft(clash, { ...rb, effectiveToISO: '2026-07-21' }, '2026-07-21', '2026-07-21T08:00:00', 'System')).toBeNull()
  })
})

describe('answeringLists (no recurring booking answers a day twice)', () => {
  const clash = draft({
    id: 'LD-RCB099-2026-07-22-AM',
    dateISO: '2026-07-22',
    session: 'AM',
    recurringBookingId: 'RCB099',
    draft: { origin: 'recurringClash', sinceISO: '2026-07-21T00:05:00', by: 'System', fromAnaesthetistId: 'A1', projectedFor: { recurringBookingId: 'RCB099', dateISO: '2026-07-22', session: 'AM' } },
  })
  const key = answeredKey('RCB099', 'A1', '2026-07-22', 'AM')

  it('a clash Draft List answers for its day even after a re-date or a removal', () => {
    expect(answeringLists({ [clash.id]: clash }).get(key)?.id).toBe(clash.id)
    expect(answeringLists({ [clash.id]: { ...clash, dateISO: '2026-07-29' } }).has(key)).toBe(true)
    expect(answeringLists({ [clash.id]: { ...clash, removedAtISO: '2026-07-21T09:00:00' } }).has(key)).toBe(true)
  })

  it('stops answering when the recurring booking\'s own change removed it', () => {
    expect(answeringLists({ [clash.id]: { ...clash, removedAtISO: '2026-07-21T09:00:00', removeReason: RECURRING_BOOKING_CHANGED, removeCause: 'recurringBookingChanged' } }).has(key)).toBe(false)
  })

  it('an office removal keeps answering, whatever reason the office typed', () => {
    expect(answeringLists({ [clash.id]: { ...clash, removedAtISO: '2026-07-21T09:00:00', removeReason: RECURRING_BOOKING_CHANGED, removeCause: 'office' } }).has(key)).toBe(true)
  })

  it('a List assigned from a Draft List keeps answering; a removed request does not', () => {
    const assigned = { ...clash, state: 'ACTIVE', anaesthetistId: 'A2', slotId: 'S-A2-2026-07-22-AM' } as never
    expect(answeringLists({ x: assigned }).has(key)).toBe(true)
    expect(answeringLists({ y: draft({ removedAtISO: '2026-07-21T09:00:00' }) }).size).toBe(0)
  })
})

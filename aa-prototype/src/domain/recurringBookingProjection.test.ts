/**
 * The recurring-booking projection (catch-up Phase 30; US-01.3.2, DM-53,
 * OQ-81 parts 1 and 2): add, edit, move, retire, weekends, the skipped closed
 * sessions, the Lists it keeps, the horizon bound, determinism, and agreement
 * with the generator.
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import {
  activeOn,
  coversDate,
  projectAllRecurringBookings,
  projectRecurringBookingChange,
  recurringBookingFor,
  type ProjectionInputs,
} from './recurringBookingProjection'
import { buildSeed, generateCanvasForDates, seedSlotStatusRecords, type CanvasMasters } from './seed'
import { enumerateDatesISO, horizonFor, DEMO_TODAY } from './clock'
import { slotIdFor } from './slots'
import type { List, RecurringBooking, Slot } from './types'

const statuses = seedSlotStatusRecords()
// Mon 3 Aug to Sun 30 Aug 2026: four Mondays, four Saturdays.
const FROM = '2026-08-03'
const TO = '2026-08-30'

const rb = (over: Partial<RecurringBooking> = {}): RecurringBooking => ({
  id: 'RCB900',
  anaesthetistId: 'A1',
  dayOfWeek: 1,
  session: 'AM',
  kind: 'private',
  hospitalId: 'H-STG',
  surgeonId: 'S-HALE',
  ...over,
})

function canvas(recurringBookings: RecurringBooking[], over: Partial<CanvasMasters> = {}): { slots: Record<string, Slot>; lists: Record<string, List> } {
  const generated = generateCanvasForDates(
    { anaesthetists: [{ id: 'A1', startDateISO: '2020-01-06', active: true }, { id: 'A2', startDateISO: '2020-01-06', active: true }], recurringBookings, leave: [], series: [], statuses, ...over },
    enumerateDatesISO(FROM, TO),
  )
  return { slots: Object.fromEntries(generated.slots.map((s) => [s.id, s])), lists: Object.fromEntries(generated.lists.map((l) => [l.id, l])) }
}

function inputs(c: { slots: Record<string, Slot>; lists: Record<string, List> }, booked: string[] = [], range = { fromISO: FROM, toISO: TO }): ProjectionInputs {
  return {
    ...range,
    slots: c.slots,
    lists: c.lists,
    listBySlot: new Map(Object.values(c.lists).flatMap((l) => (l.slotId !== undefined ? [[l.slotId, l] as const] : []))),
    bookedListIds: new Set(booked),
    statuses,
  }
}

const mondays = ['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24']

describe('activeOn and coversDate', () => {
  it('honours start and end dates; weekends work', () => {
    const r = rb({ effectiveFromISO: '2026-08-10', effectiveToISO: '2026-08-17' })
    expect(activeOn(r, '2026-08-09')).toBe(false)
    expect(activeOn(r, '2026-08-10')).toBe(true)
    expect(activeOn(r, '2026-08-18')).toBe(false)
    expect(coversDate(rb({ dayOfWeek: 6 }), '2026-08-08')).toBe(true)
    expect(coversDate(rb({ dayOfWeek: 6 }), '2026-08-09')).toBe(false)
  })

  it('the first running row in id order paints a shared session', () => {
    const a = rb({ id: 'RCB002' })
    const b = rb({ id: 'RCB001', effectiveToISO: '2026-08-09' })
    expect(recurringBookingFor([a, b], 'A1', '2026-08-03', 'AM')?.id).toBe('RCB001')
    expect(recurringBookingFor([a, b], 'A1', '2026-08-10', 'AM')?.id).toBe('RCB002')
  })
})

describe('projectRecurringBookingChange', () => {
  it('add: creates an empty List on every open session it covers, nothing else', () => {
    const c = canvas([])
    const plan = projectRecurringBookingChange({ ...inputs(c), after: rb() })
    expect(plan.create.map((e) => e.dateISO)).toEqual(mondays)
    expect(plan.create[0]).toMatchObject({ slotId: slotIdFor('A1', '2026-08-03', 'AM'), fields: { kind: 'private', hospitalId: 'H-STG', surgeonId: 'S-HALE' } })
    expect([plan.update, plan.remove, plan.kept, plan.skipped].every((x) => x.length === 0)).toBe(true)
  })

  it('a Saturday recurring booking projects onto Saturdays', () => {
    const plan = projectRecurringBookingChange({ ...inputs(canvas([])), after: rb({ dayOfWeek: 6 }) })
    expect(plan.create.map((e) => e.dateISO)).toEqual(['2026-08-08', '2026-08-15', '2026-08-22', '2026-08-29'])
  })

  it('edit: empty projected Lists follow the new surgeon; a List with Bookings is kept', () => {
    const before = rb()
    const c = canvas([before])
    const booked = `L-A1-2026-08-10-AM`
    const plan = projectRecurringBookingChange({ ...inputs(c, [booked]), before, after: { ...before, surgeonId: 'S-LIM' } })
    expect(plan.update.map((e) => e.dateISO)).toEqual(['2026-08-03', '2026-08-17', '2026-08-24'])
    expect(plan.update[0]?.fields.surgeonId).toBe('S-LIM')
    expect(plan.kept).toEqual([expect.objectContaining({ listId: booked, reason: 'hasBookings' })])
    expect(plan.create).toEqual([])
  })

  it('moving to Tuesday removes the empty Monday Lists and creates Tuesday ones', () => {
    const before = rb()
    const c = canvas([before])
    const plan = projectRecurringBookingChange({ ...inputs(c), before, after: { ...before, dayOfWeek: 2 } })
    expect(plan.remove.map((e) => e.dateISO)).toEqual(mondays)
    expect(plan.create.map((e) => e.dateISO)).toEqual(['2026-08-04', '2026-08-11', '2026-08-18', '2026-08-25'])
  })

  it('retire: removes the empty Lists after its last date and keeps booked ones', () => {
    const before = rb()
    const c = canvas([before])
    const plan = projectRecurringBookingChange({ ...inputs(c, ['L-A1-2026-08-24-AM']), before, after: { ...before, effectiveToISO: '2026-08-10', retiredAtISO: '2026-08-02T09:00:00' } })
    expect(plan.remove.map((e) => e.dateISO)).toEqual(['2026-08-17'])
    expect(plan.kept.map((e) => [e.dateISO, e.reason])).toEqual([['2026-08-24', 'hasBookings']])
    expect(plan.create).toEqual([])
  })

  it('the calendar is painted first: Holiday and Unavailable sessions are skipped, never created', () => {
    const c = canvas([], { leave: [{ anaesthetistId: 'A1', dateISO: '2026-08-10', session: 'AM', status: 'holiday' }, { anaesthetistId: 'A1', dateISO: '2026-08-17', session: 'AM', status: 'unavailable' }] })
    const plan = projectRecurringBookingChange({ ...inputs(c), after: rb() })
    expect(plan.skipped.map((e) => [e.dateISO, e.statusKey])).toEqual([['2026-08-10', 'holiday'], ['2026-08-17', 'unavailable']])
    expect(plan.create.map((e) => e.dateISO)).toEqual(['2026-08-03', '2026-08-24'])
  })

  it('keeps an office-edited List, another recurring booking\'s List, and SUBMITTED or AUTHORISED ones', () => {
    const before = rb()
    const c = canvas([before])
    const edited = { ...c.lists['L-A1-2026-08-03-AM']! }
    delete edited.recurringBookingId
    c.lists[edited.id] = edited
    c.lists['L-A1-2026-08-10-AM'] = { ...c.lists['L-A1-2026-08-10-AM']!, recurringBookingId: 'RCB001' }
    c.lists['L-A1-2026-08-17-AM'] = { ...assigned(c.lists['L-A1-2026-08-17-AM']), state: 'SUBMITTED' }
    c.lists['L-A1-2026-08-24-AM'] = { ...assigned(c.lists['L-A1-2026-08-24-AM']), state: 'AUTHORISED' }
    const plan = projectRecurringBookingChange({ ...inputs(c), before, after: { ...before, surgeonId: 'S-LIM' } })
    expect(plan.kept.map((e) => e.reason)).toEqual(['officeEdited', 'otherRecurringBooking', 'submitted', 'authorised'])
    expect(plan.update).toEqual([])
  })

  it('every created List holds no Bookings and nothing before fromISO or after toISO changes', () => {
    const c = canvas([])
    const plan = projectRecurringBookingChange({ ...inputs(c, [], { fromISO: '2026-08-04', toISO: '2026-08-20' }), after: rb() })
    expect(plan.create.map((e) => e.dateISO)).toEqual(['2026-08-10', '2026-08-17'])
  })

  it('is deterministic', () => {
    const c = canvas([rb()])
    const a = projectRecurringBookingChange({ ...inputs(c), before: rb(), after: rb({ dayOfWeek: 3 }) })
    const b = projectRecurringBookingChange({ ...inputs(c), before: rb(), after: rb({ dayOfWeek: 3 }) })
    expect(a).toEqual(b)
  })
})

describe('projectAllRecurringBookings', () => {
  it('never removes; fills a session that has come free; earlier id wins a shared session', () => {
    const r = rb()
    const c = canvas([r])
    delete c.lists['L-A1-2026-08-10-AM']
    const plan = projectAllRecurringBookings({ ...inputs(c), recurringBookings: [rb({ id: 'RCB999', surgeonId: 'S-LIM' }), r] })
    expect(plan.create.map((e) => [e.dateISO, e.recurringBookingId])).toEqual([['2026-08-10', 'RCB900']])
    expect(plan.remove).toEqual([])
  })

  it('counts a kept or skipped session once when two arrangements cover it', () => {
    const r = rb()
    const c = canvas([r], { leave: [{ anaesthetistId: 'A1', dateISO: '2026-08-10', session: 'AM', status: 'holiday' }] })
    const twin = rb({ id: 'RCB999' })
    const plan = projectAllRecurringBookings({ ...inputs(c, ['L-A1-2026-08-03-AM']), recurringBookings: [r, twin] })
    expect(plan.kept.filter((k) => k.slotId === 'S-A1-2026-08-03-AM')).toHaveLength(1)
    expect(plan.skipped.filter((k) => k.slotId === 'S-A1-2026-08-10-AM')).toHaveLength(1)
  })

  it('agrees with the generator: over the fresh seed it creates, updates and removes nothing', () => {
    const seed = buildSeed()
    const horizon = horizonFor(DEMO_TODAY, seed.appSettings.schedule.horizonMonths)
    const lists = seed.schedule.lists
    const booked = new Set(Object.values(seed.schedule.bookings).map((b) => b.listId))
    const plan = projectAllRecurringBookings({
      fromISO: '2026-07-22',
      toISO: horizon.endISO,
      slots: seed.schedule.slots,
      lists,
      listBySlot: new Map(Object.values(lists).flatMap((l) => (l.slotId !== undefined ? [[l.slotId, l] as const] : []))),
      bookedListIds: booked,
      statuses: seed.masters.slotStatuses,
      recurringBookings: Object.values(seed.masters.recurringBookings),
    })
    expect(plan.create).toEqual([])
    expect(plan.update).toEqual([])
    expect(plan.remove).toEqual([])
    expect(plan.skipped.length).toBeGreaterThan(0)
  })
})

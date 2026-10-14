/**
 * The conflict reconcile inside mutate() (catch-up Phase 30; US-01.5.2 AC1 and
 * AC2, US-01.5.4 AC2): every path raises exactly once and resolves exactly
 * the right conflict, and the "no stale flag anywhere" invariant holds after
 * every step of a scripted run.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  addHospitalHoliday,
  addRecurringBooking,
  applyRecurringBookingsToCanvas,
  assignListToSlot,
  clearListConflict,
  createBooking,
  deleteHospitalHoliday,
  editHospitalHoliday,
  editList,
  editRecurringBooking,
  reassignList,
  restoreListConflict,
  retireRecurringBooking,
  setAvailability,
} from './index'
import { clearAvailability, createAvailabilitySeries } from './availabilityActions'
import { editSlotStatus } from './slotStatusActions'
import { advanceClockDays } from './clockActions'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { listInSlot } from './selectors'
import { mutate } from './mutate'
import { conflictFactsFor, expectedConflicts, holidayCause, holidayIndex, liveClears } from '../domain/conflicts'
import { ANAE, HOSP, SEED_LIST_IDS, SURG } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { DEMO_TODAY } from '../domain/clock'

const OFFICE = OFFICE_ACTOR
const SOUTER = SOUTER_ACTOR
const WED22 = '2026-07-22'

const store = (): BoundAppStore => createAppStore()
const audit = (api: BoundAppStore, action: string, entityId?: string) =>
  api.getState().audit.filter((a) => a.action === action && (entityId === undefined || a.entityId === entityId))

/** Every List's stored conflicts equal the rule minus its live clears; every stored clear is live. */
function assertNoStaleFlag(api: BoundAppStore, step: string): void {
  const s = api.getState()
  const holidays = holidayIndex(s.masters.holidays)
  for (const list of Object.values(s.schedule.lists)) {
    const expected = expectedConflicts(list, conflictFactsFor(list, { slots: s.schedule.slots, statuses: s.masters.slotStatuses, holidays }))
    const live = liveClears(list, expected)
    expect(live.length, `${step}: ${list.id} holds a stale clear`).toBe((list.conflictClears ?? []).length)
    const cleared = new Set(live.map((c) => c.cause))
    const want = expected.filter((c) => !cleared.has(c.cause))
    expect(list.conflicts.map(({ raisedAtISO: _r, ...c }) => c), `${step}: ${list.id}`).toEqual(want)
  }
}

describe('the "no stale flag anywhere" invariant over a scripted run', () => {
  it('holds after every step', () => {
    const api = store()
    const step = (name: string, run: () => { ok: boolean }) => {
      const out = run()
      expect(out.ok, name).toBe(true)
      assertNoStaleFlag(api, name)
    }
    assertNoStaleFlag(api, 'seed')
    step('the office blocks a booked session (a sickness phoned in)', () => setAvailability(api, OFFICE, ANAE.souter, DEMO_TODAY, 'AM', 'unavailable'))
    let phoneList = ''
    step('phone-book onto an unavailable session', () => {
      const out = assignListToSlot(api, OFFICE, slotIdFor(ANAE.ngata, DEMO_TODAY, 'AM'), { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'private' })
      if (out.ok) phoneList = out.value.listId
      return out.ok ? createBooking(api, OFFICE, phoneList, { patient: { name: 'Test Patient', dobISO: '1970-01-01' }, operation: 'Test', billingRoute: 'hospital' }) : out
    })
    let holidayId = ''
    step('add a holiday', () => {
      const out = addHospitalHoliday(api, OFFICE, HOSP.stg, '2026-07-23', 'Test closure')
      if (out.ok) holidayId = out.value.holidayId
      return out
    })
    step('edit it to another date', () => editHospitalHoliday(api, OFFICE, holidayId, { dateISO: '2026-07-28' }))
    step('change a List hospital onto a closure', () => editList(api, OFFICE, SEED_LIST_IDS.integrationSxList, { hospitalId: HOSP.stg }))
    step('reassign the sick anaesthetist\'s List', () => reassignList(api, OFFICE, `L-${ANAE.rutherford}-${WED22}-AM`, ANAE.sharma, 'unavailable'))
    step('un-block', () => setAvailability(api, SOUTER, ANAE.souter, DEMO_TODAY, 'AM', 'free'))
    const flagged = Object.values(api.getState().schedule.lists).find((l) => l.conflicts.some((c) => c.kind === 'holiday' && c.holidayId === 'HH900'))!
    step('office clear', () => clearListConflict(api, OFFICE, flagged.id, holidayCause('HH900'), 'Theatre confirmed running'))
    step('flag again', () => restoreListConflict(api, OFFICE, flagged.id, holidayCause('HH900')))
    step('clear again, then delete the seeded closure', () => clearListConflict(api, OFFICE, flagged.id, holidayCause('HH900')))
    step('delete the holiday', () => deleteHospitalHoliday(api, OFFICE, 'HH900'))
    step('delete the added holiday', () => deleteHospitalHoliday(api, OFFICE, holidayId))
    step('roll the clock', () => {
      advanceClockDays(api, 1)
      return { ok: true }
    })
    const monday = Object.values(api.getState().masters.recurringBookings).find((r) => r.dayOfWeek === 1 && r.hospitalId !== null)!
    step('edit a recurring booking and apply it', () => editRecurringBooking(api, OFFICE, monday.id, { hospitalId: HOSP.sx }))
    step('retire one', () => retireRecurringBooking(api, OFFICE, monday.id, '2026-09-01'))
    step('add a Saturday recurring booking at a closed hospital', () => {
      const hol = addHospitalHoliday(api, OFFICE, HOSP.cph, '2026-08-08', 'Saturday shutdown')
      if (!hol.ok) return hol
      return addRecurringBooking(api, OFFICE, { anaesthetistId: ANAE.hughes, dayOfWeek: 6, session: 'AM', kind: 'private', hospitalId: HOSP.cph, surgeonId: SURG.hale })
    })
    step('office records a sickness over a booked session', () => setAvailability(api, OFFICE, ANAE.ngata, WED22, 'PM', 'unavailable', 'Unwell'))
    step('a series over booked sessions (the office)', () =>
      createAvailabilitySeries(api, OFFICE, { anaesthetistId: ANAE.souter, statusKey: 'unavailable', sessions: 'AM', weekdays: [1], everyWeeks: 2, startISO: '2026-08-03' }),
    )
    const instance = Object.values(api.getState().schedule.slots).find((s) => s.anaesthetistId === ANAE.souter && s.seriesId !== undefined)!
    step('clear one instance', () => clearAvailability(api, SOUTER, instance.id))
    step('relabel a status', () => {
      const u = api.getState().masters.slotStatuses.unavailable!
      return editSlotStatus(api, OFFICE, 'unavailable', { label: 'Blocked', longLabel: u.longLabel, description: u.description, colour: u.colour, treatment: u.treatment, bookable: u.bookable, anaesthetistCanSet: u.anaesthetistCanSet, isDefault: u.isDefault === true })
    })
    step('make Unavailable bookable (every List reconciled)', () => {
      const u = api.getState().masters.slotStatuses.unavailable!
      return editSlotStatus(api, OFFICE, 'unavailable', { label: u.label, longLabel: u.longLabel, description: u.description, colour: u.colour, treatment: u.treatment, bookable: true, anaesthetistCanSet: u.anaesthetistCanSet, isDefault: false })
    })
    step('apply every recurring booking', () => applyRecurringBookingsToCanvas(api, OFFICE))
    expect(listInSlot(api.getState(), slotIdFor(ANAE.sharma, WED22, 'AM'))?.id).toBe(`L-${ANAE.rutherford}-${WED22}-AM`)
  })
})

describe('each path raises once and resolves the right conflict', () => {
  it('the office blocking a booked session raises one availability conflict, never stacking; un-blocking resolves it with no new one', () => {
    const api = store()
    const id = SEED_LIST_IDS.souterAm21
    // The anaesthetist herself is asked where the List goes instead (catch-up Phase 32, US-01.5.5).
    expect(setAvailability(api, SOUTER, ANAE.souter, DEMO_TODAY, 'AM', 'unavailable')).toMatchObject({ ok: false, code: 'holdsList' })
    setAvailability(api, OFFICE, ANAE.souter, DEMO_TODAY, 'AM', 'unavailable')
    setAvailability(api, OFFICE, ANAE.souter, DEMO_TODAY, 'AM', 'unavailable', 'still away')
    expect(api.getState().schedule.lists[id]!.conflicts).toHaveLength(1)
    expect(audit(api, 'list.conflict', id)).toHaveLength(1)
    setAvailability(api, SOUTER, ANAE.souter, DEMO_TODAY, 'AM', 'free')
    expect(api.getState().schedule.lists[id]!.conflicts).toEqual([])
    expect(audit(api, 'list.conflictResolved', id)).toHaveLength(1)
    expect(audit(api, 'list.conflict', id)).toHaveLength(1)
  })

  it('reassigning to an available anaesthetist resolves the availability conflict and keeps a holiday one', () => {
    const api = store()
    const id = `L-${ANAE.rutherford}-${WED22}-AM`
    addHospitalHoliday(api, OFFICE, HOSP.ces, WED22, 'Lift out of service')
    expect(api.getState().schedule.lists[id]!.conflicts.map((c) => c.kind).sort()).toEqual(['availability', 'holiday'])
    expect(reassignList(api, OFFICE, id, ANAE.sharma, 'unavailable').ok).toBe(true)
    expect(api.getState().schedule.lists[id]!.conflicts.map((c) => c.kind)).toEqual(['holiday'])
    const resolved = audit(api, 'list.conflictResolved', id)
    expect(resolved).toHaveLength(1)
    expect(resolved[0]!.after).toMatchObject({ change: 'listReassigned' })
  })

  it('changing the hospital off a closure resolves it; onto one raises it', () => {
    const api = store()
    const id = 'L-25490-2026-07-22-PM'
    expect(api.getState().schedule.lists[id]!.conflicts).toMatchObject([{ kind: 'holiday', holidayId: 'HH900' }])
    editList(api, OFFICE, id, { hospitalId: HOSP.stg })
    expect(api.getState().schedule.lists[id]!.conflicts).toEqual([])
    expect(audit(api, 'list.conflictResolved', id)[0]?.after).toMatchObject({ change: 'hospitalChanged' })
    editList(api, OFFICE, id, { hospitalId: HOSP.sx })
    expect(api.getState().schedule.lists[id]!.conflicts).toHaveLength(1)
  })

  it('the MutationResult counts match the metas; a mutation that touches no fact writes no conflict meta', () => {
    const api = store()
    const result = mutate(api, OFFICE, { entityType: 'holiday', entityId: 'HHX', action: 'holiday.create', stampBookingId: null }, (s) => ({
      masters: { ...s.masters, holidays: { ...s.masters.holidays, HHX: { id: 'HHX', hospitalId: HOSP.stg, dateISO: '2026-08-03', name: 'X' } } },
    }))
    expect(result.conflictsRaised.length).toBe(audit(api, 'list.conflict').length)
    expect(result.conflictsRaised.length).toBeGreaterThan(0)
    const before = api.getState().audit.length
    const none = mutate(api, OFFICE, { entityType: 'list', entityId: SEED_LIST_IDS.souterAm21, action: 'list.phoneNote', stampBookingId: null }, () => ({}))
    expect(none).toEqual({ conflictsRaised: [], conflictsResolved: [] })
    expect(api.getState().audit.length).toBe(before + 1)
  })

  it('a roll-forward writes no conflict meta unless a fact changed', () => {
    const api = store()
    advanceClockDays(api, 1)
    expect(audit(api, 'list.conflict')).toEqual([])
  })

  it('a renamed holiday changes only the wording: no conflict meta', () => {
    const api = store()
    editHospitalHoliday(api, OFFICE, 'HH900', { name: 'Sterilisation unit down' })
    expect(audit(api, 'list.conflict')).toEqual([])
    expect(audit(api, 'list.conflictResolved')).toEqual([])
  })
})

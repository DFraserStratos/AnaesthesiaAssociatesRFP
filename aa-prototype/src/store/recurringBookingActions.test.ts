/**
 * Recurring bookings over the existing canvas (catch-up Phase 30; US-01.3.2,
 * DM-53): add, edit, move, retire, weekends, the skipped closed sessions, the
 * horizon bound, "Apply to canvas now", the roll-forward's far edge, and one
 * audit batch per call.
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  addRecurringBooking,
  applyRecurringBookingsToCanvas,
  createBooking,
  editList,
  editRecurringBooking,
  logListNote,
  reassignList,
  retireRecurringBooking,
  setAvailability,
} from './index'
import { advanceClockDays } from './clockActions'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { listInSlot, previewRecurringBookingChange, previewRetireRecurringBooking, scheduleHorizon, tomorrowISO } from './selectors'
import { ANAE, HOSP, SURG } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import type { AssignedList, RecurringBooking } from '../domain/types'

const OFFICE = OFFICE_ACTOR
const store = (): BoundAppStore => createAppStore()

/** Rutherford's Monday AM recurring booking (Southern Cross, Mr Doyle). */
function rutherfordMonday(api: BoundAppStore): RecurringBooking {
  return Object.values(api.getState().masters.recurringBookings).find((r) => r.anaesthetistId === ANAE.rutherford && r.dayOfWeek === 1 && r.session === 'AM')!
}
/** A recurring booking's projected (assigned) Lists; its clash Draft Lists have their own tests. */
const projectedOf = (api: BoundAppStore, id: string) =>
  Object.values(api.getState().schedule.lists).filter((l): l is AssignedList => l.recurringBookingId === id && l.state !== 'DRAFT')
const isMonday = (iso: string) => new Date(`${iso}T12:00:00`).getDay() === 1

describe('editRecurringBooking', () => {
  it('a surgeon change updates every future empty projected List and keeps a booked one unchanged', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const target = projectedOf(api, rb.id).find((l) => l.dateISO === '2026-08-10')!
    expect(createBooking(api, OFFICE, target.id, { patient: { name: 'Test Patient', dobISO: '1970-01-01' }, operation: 'Test', billingRoute: 'hospital' }).ok).toBe(true)
    const bookedBefore = assigned(api.getState().schedule.lists[target.id])
    const auditBefore = api.getState().audit.length
    const out = editRecurringBooking(api, OFFICE, rb.id, { surgeonId: SURG.lim })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.updated).toBeGreaterThan(10)
    expect(out.value.kept).toEqual(expect.arrayContaining([expect.objectContaining({ listId: target.id, reason: 'hasBookings' })]))
    expect(api.getState().schedule.lists[target.id]).toBe(bookedBefore)
    const kept = new Set(out.value.kept.map((k) => k.listId))
    const future = projectedOf(api, rb.id).filter((l) => l.dateISO >= tomorrowISO(api.getState()) && !kept.has(l.id))
    expect(future.every((l) => l.surgeonId === SURG.lim)).toBe(true)
    // Mon 27 Jul already holds seeded Bookings: kept as it was.
    expect(api.getState().schedule.lists[`L-${ANAE.rutherford}-2026-07-27-AM`]?.surgeonId).toBe(SURG.doyle)
    // Nothing before tomorrow changed.
    expect(projectedOf(api, rb.id).filter((l) => l.dateISO < tomorrowISO(api.getState())).every((l) => l.surgeonId === SURG.doyle)).toBe(true)
    // One audit batch: the update plus a list.update per List.
    const entries = api.getState().audit.slice(auditBefore)
    expect(new Set(entries.map((e) => e.atISO)).size).toBe(1)
    expect(entries.filter((e) => e.action === 'list.update')).toHaveLength(out.value.updated)
    expect(out.value.firstAffectedDateISO).toBe(future.map((l) => l.dateISO).sort()[0])
  })

  it('the preview equals what applying does', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const plan = previewRecurringBookingChange(api.getState(), rb, { ...rb, dayOfWeek: 5 })
    const out = editRecurringBooking(api, OFFICE, rb.id, { dayOfWeek: 5 })
    expect(out.ok && [out.value.created, out.value.updated, out.value.removed, out.value.skipped.length]).toEqual([plan.create.length, plan.update.length, plan.remove.length, plan.skipped.length])
  })

  it('moving to another weekday removes the empty Monday Lists and creates the new day\'s', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const out = editRecurringBooking(api, OFFICE, rb.id, { dayOfWeek: 5 })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.removed).toBeGreaterThan(10)
    expect(out.value.created).toBeGreaterThan(0)
    const kept = new Set(out.value.kept.map((k) => k.listId))
    const future = projectedOf(api, rb.id).filter((l) => l.dateISO >= tomorrowISO(api.getState()) && !kept.has(l.id))
    expect(future.some((l) => isMonday(l.dateISO))).toBe(false)
    expect(kept.has(`L-${ANAE.rutherford}-2026-07-27-AM`)).toBe(true)
    expect(api.getState().audit.filter((a) => a.action === 'list.remove')).toHaveLength(out.value.removed)
  })

  it('a hand-edited projected List is kept (editList drops its provenance)', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const target = projectedOf(api, rb.id).find((l) => l.dateISO === '2026-08-17')!
    editList(api, OFFICE, target.id, { notes: 'Office note' })
    expect(api.getState().schedule.lists[target.id]?.recurringBookingId).toBeUndefined()
    const out = editRecurringBooking(api, OFFICE, rb.id, { surgeonId: SURG.lim })
    expect(out.ok && out.value.kept.some((k) => k.listId === target.id && k.reason === 'officeEdited')).toBe(true)
    expect(api.getState().schedule.lists[target.id]?.surgeonId).toBe(SURG.doyle)
  })

  it('a session already marked unavailable is skipped, counted, and left unavailable (the calendar first)', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const monday = '2026-08-24'
    const projected = projectedOf(api, rb.id).find((l) => l.dateISO === monday)!
    // Free the session first (as if never projected), then the anaesthetist marks it unavailable.
    expect(retireRecurringBooking(api, OFFICE, rb.id, '2026-08-23').ok).toBe(true)
    expect(api.getState().schedule.lists[projected.id]).toBeUndefined()
    expect(setAvailability(api, { who: 'Dr Rutherford', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.rutherford }, ANAE.rutherford, monday, 'AM', 'unavailable').ok).toBe(true)
    const out = addRecurringBooking(api, OFFICE, { anaesthetistId: ANAE.rutherford, dayOfWeek: 1, session: 'AM', kind: 'private', hospitalId: HOSP.sx, surgeonId: SURG.lim, effectiveFromISO: '2026-08-24' })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.skipped.map((s) => s.dateISO)).toContain(monday)
    expect(listInSlot(api.getState(), slotIdFor(ANAE.rutherford, monday, 'AM'))).toBeUndefined()
    expect(api.getState().schedule.slots[slotIdFor(ANAE.rutherford, monday, 'AM')]?.status).toBe('unavailable')
  })

  it('refuses a retired row, a backwards range and an end in the past', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)
    expect(code(editRecurringBooking(api, OFFICE, rb.id, { effectiveFromISO: '2026-09-10', effectiveToISO: '2026-09-01' }))).toBe('invalidRange')
    expect(code(editRecurringBooking(api, OFFICE, rb.id, { effectiveToISO: '2026-07-01' }))).toBe('endInPast')
    expect(code(editRecurringBooking(api, SOUTER_ACTOR, rb.id, { notes: 'x' }))).toBe('officeOnly')
    expect(retireRecurringBooking(api, OFFICE, rb.id).ok).toBe(true)
    expect(code(editRecurringBooking(api, OFFICE, rb.id, { notes: 'x' }))).toBe('alreadyRetired')
    expect(code(retireRecurringBooking(api, OFFICE, rb.id))).toBe('alreadyRetired')
  })
})

describe('addRecurringBooking', () => {
  it('a Saturday recurring booking creates empty ACTIVE Lists on every Saturday from tomorrow to the horizon\'s far end', () => {
    const api = store()
    const out = addRecurringBooking(api, OFFICE, { anaesthetistId: ANAE.hughes, dayOfWeek: 6, session: 'AM', kind: 'private', hospitalId: HOSP.stg, surgeonId: SURG.hale })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const lists = projectedOf(api, out.value.id)
    expect(lists.length).toBe(out.value.created)
    expect(lists.every((l) => new Date(`${l.dateISO}T12:00:00`).getDay() === 6 && l.state === 'ACTIVE')).toBe(true)
    const bookings = Object.values(api.getState().schedule.bookings)
    expect(lists.some((l) => bookings.some((b) => b.listId === l.id))).toBe(false)
    const dates = lists.map((l) => l.dateISO).sort()
    expect(dates[0]! >= tomorrowISO(api.getState())).toBe(true)
    expect(dates.at(-1)! <= scheduleHorizon(api.getState()).endISO).toBe(true)
    expect(out.value.id.startsWith('RCBN')).toBe(true)
  })

  it('the projection follows the horizon setting, not a constant', () => {
    const api = store()
    const out = addRecurringBooking(api, OFFICE, { anaesthetistId: ANAE.hughes, dayOfWeek: 6, session: 'PM', kind: 'private', hospitalId: HOSP.stg, surgeonId: SURG.hale })
    expect(out.ok).toBe(true)
    const end = scheduleHorizon(api.getState()).endISO
    expect(out.ok && projectedOf(api, out.value.id).every((l) => l.dateISO <= end)).toBe(true)
  })
})

describe('retireRecurringBooking', () => {
  it('removes the empty Lists after its last date, keeps booked ones, and never projects again (also on a roll-forward)', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const late = projectedOf(api, rb.id).find((l) => l.dateISO === '2026-09-14')!
    createBooking(api, OFFICE, late.id, { patient: { name: 'Test Patient', dobISO: '1970-01-01' }, operation: 'Test', billingRoute: 'hospital' })
    const out = retireRecurringBooking(api, OFFICE, rb.id, '2026-08-31')
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const remaining = projectedOf(api, rb.id).filter((l) => l.dateISO > '2026-08-31')
    expect(remaining.map((l) => l.id)).toEqual([late.id])
    expect(api.getState().masters.recurringBookings[rb.id]).toMatchObject({ effectiveToISO: '2026-08-31' })
    expect(api.getState().masters.recurringBookings[rb.id]?.retiredAtISO).toBeDefined()
    advanceClockDays(api, 7)
    expect(projectedOf(api, rb.id).filter((l) => l.dateISO > '2026-08-31').map((l) => l.id)).toEqual([late.id])
    expect(api.getState().audit.some((a) => a.action === 'recurringBooking.retire' && a.entityId === rb.id)).toBe(true)
  })
})

describe('applyRecurringBookingsToCanvas', () => {
  it('fills a projected session that came free; a second press is a no-op with no List meta', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const monday = '2026-09-07'
    // The session comes free: the arrangement ends before it, then is extended again
    // (an edit that would re-paint is not used, to test the view-level apply).
    expect(editRecurringBooking(api, OFFICE, rb.id, { effectiveToISO: '2026-09-06' }).ok).toBe(true)
    expect(listInSlot(api.getState(), slotIdFor(ANAE.rutherford, monday, 'AM'))).toBeUndefined()
    // Extend directly in the master (as a later phase's loader might), then apply.
    api.setState((s) => ({ masters: { ...s.masters, recurringBookings: { ...s.masters.recurringBookings, [rb.id]: { ...rb } } } }))
    const first = applyRecurringBookingsToCanvas(api, OFFICE)
    expect(first.ok && first.value.created).toBeGreaterThan(0)
    expect(listInSlot(api.getState(), slotIdFor(ANAE.rutherford, monday, 'AM'))?.recurringBookingId).toBe(rb.id)
    const metasBefore = api.getState().audit.length
    const second = applyRecurringBookingsToCanvas(api, OFFICE)
    expect(second.ok && [second.value.created, second.value.updated, second.value.removed]).toEqual([0, 0, 0])
    const added = api.getState().audit.slice(metasBefore)
    expect(added.map((a) => a.action)).toEqual(['recurringBooking.apply'])
  })

  it('never removes', () => {
    const api = store()
    const before = Object.keys(api.getState().schedule.lists).length
    applyRecurringBookingsToCanvas(api, OFFICE)
    expect(Object.keys(api.getState().schedule.lists).length).toBeGreaterThanOrEqual(before)
    expect(api.getState().audit.some((a) => a.action === 'list.remove')).toBe(false)
  })
})

describe('the roll-forward', () => {
  it('creates each recurring booking\'s List on the new far-edge day, empty', () => {
    const api = store()
    const added = addRecurringBooking(api, OFFICE, { anaesthetistId: ANAE.hughes, dayOfWeek: 0, session: 'AM', kind: 'private', hospitalId: HOSP.stg, surgeonId: SURG.hale })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    // Roll until a new Sunday arrives at the far edge.
    let found = false
    for (let i = 0; i < 7 && !found; i++) {
      advanceClockDays(api, 1)
      const end = scheduleHorizon(api.getState()).endISO
      const list = listInSlot(api.getState(), slotIdFor(ANAE.hughes, end, 'AM'))
      if (new Date(`${end}T12:00:00`).getDay() === 0) {
        expect(list?.recurringBookingId).toBe(added.value.id)
        expect(Object.values(api.getState().schedule.bookings).some((b) => b.listId === list?.id)).toBe(false)
        found = true
      }
    }
    expect(found).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Review-pass regressions (catch-up Phase 30, convention 18)
// ---------------------------------------------------------------------------

describe('the projection never loses office work', () => {
  it('a projected List with a phone note is kept, not removed, on retire', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const noted = projectedOf(api, rb.id).find((l) => l.dateISO === '2026-08-17')!
    expect(logListNote(api, OFFICE, noted.id, 'Theatre 3 confirmed').ok).toBe(true)
    const out = retireRecurringBooking(api, OFFICE, rb.id, '2026-08-10')
    expect(out.ok && out.value.kept.some((k) => k.listId === noted.id && k.reason === 'hasRecords')).toBe(true)
    expect(api.getState().schedule.lists[noted.id]).toBeDefined()
  })

  it('a projected List the office moved is not painted again in the session it left', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const moved = projectedOf(api, rb.id).find((l) => l.dateISO === '2026-08-10')!
    const vacated = moved.slotId
    // Move it to a colleague whose Mon 10 Aug AM is open, leaving Rutherford's session Free.
    const colleague = Object.values(api.getState().schedule.slots).find(
      (s) => s.dateISO === '2026-08-10' && s.session === 'AM' && s.anaesthetistId !== ANAE.rutherford && s.status === 'free' && listInSlot(api.getState(), s.id) === undefined,
    )!
    expect(reassignList(api, OFFICE, moved.id, colleague.anaesthetistId, 'free').ok).toBe(true)
    expect(api.getState().schedule.lists[moved.id]?.recurringOrigin).toEqual({ recurringBookingId: rb.id, slotId: vacated })
    const edit = editRecurringBooking(api, OFFICE, rb.id, { notes: 'Ortho' })
    expect(edit.ok && edit.value.kept.some((k) => k.reason === 'movedByOffice' && k.listId === moved.id)).toBe(true)
    expect(listInSlot(api.getState(), vacated)).toBeUndefined()
    expect(applyRecurringBookingsToCanvas(api, OFFICE).ok).toBe(true)
    expect(listInSlot(api.getState(), vacated)).toBeUndefined()
  })

  it('retire only removes: it never creates or updates, and its preview is what it applies', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    const preview = previewRetireRecurringBooking(api.getState(), rb, '2026-08-31')
    const out = retireRecurringBooking(api, OFFICE, rb.id, '2026-08-31')
    expect(out.ok && [out.value.created, out.value.updated, out.value.removed]).toEqual([0, 0, preview.remove.length])
  })

  it('notes are trimmed on edit, so the preview and the apply agree', () => {
    const api = store()
    const rb = rutherfordMonday(api)
    editRecurringBooking(api, OFFICE, rb.id, { notes: 'Ortho' })
    const again = editRecurringBooking(api, OFFICE, rb.id, { notes: 'Ortho ' })
    expect(again.ok && again.value.updated).toBe(0)
    expect(api.getState().masters.recurringBookings[rb.id]?.notes).toBe('Ortho')
  })

  it('blanking a recurring booking\'s session times resets them on its projected sessions', () => {
    const api = store()
    const preop = Object.values(api.getState().masters.recurringBookings).find((r) => r.kind === 'preop' && r.startTime !== undefined)!
    const list = projectedOf(api, preop.id).find((l) => l.dateISO > '2026-08-01' && !Object.values(api.getState().schedule.bookings).some((b) => b.listId === l.id))!
    expect(api.getState().schedule.slots[list.slotId]?.startTime).toBe(preop.startTime)
    const out = editRecurringBooking(api, OFFICE, preop.id, { startTime: '', endTime: '' })
    expect(out.ok && out.value.updated).toBeGreaterThan(0)
    expect(api.getState().schedule.slots[list.slotId]?.startTime).toBeUndefined()
  })
})

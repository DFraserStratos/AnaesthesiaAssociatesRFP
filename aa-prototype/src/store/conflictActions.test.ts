/**
 * The office clear and "Flag again", holiday edit and delete, accept-and-flag
 * on Booking paths, and the Conflicts screen's selectors (catch-up Phase 30;
 * US-01.5.1, US-01.5.2, US-01.5.4, OQ-09).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  addHospitalHoliday,
  clearListConflict,
  conflictRows,
  createBooking,
  deleteHospitalHoliday,
  editHospitalHoliday,
  hospitalMonth,
  listsFlaggedByHoliday,
  openConflictCount,
  reassignBooking,
  restoreListConflict,
} from './index'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { ANAE, HOSP, SEED_LIST_IDS } from '../domain/seed'
import { nextTestNhi } from './testNhi'

const OFFICE = OFFICE_ACTOR
const store = (): BoundAppStore => createAppStore()
const MORRISON_PM = 'L-25490-2026-07-22-PM'
const RUTHERFORD_AM = `L-${ANAE.rutherford}-2026-07-22-AM`
const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)

describe('clearListConflict and restoreListConflict', () => {
  it('a clear hides the conflict from the grid and the dashboard; Flag again restores it', () => {
    const api = store()
    const before = openConflictCount(api.getState())
    expect(clearListConflict(api, OFFICE, MORRISON_PM, 'holiday:HH900', 'Theatre confirmed running').ok).toBe(true)
    const list = api.getState().schedule.lists[MORRISON_PM]!
    expect(list.conflicts).toEqual([])
    expect(list.conflictClears).toMatchObject([{ cause: 'holiday:HH900', by: 'Kirsty W.', note: 'Theatre confirmed running' }])
    expect(openConflictCount(api.getState())).toBe(before - 1)
    const cleared = conflictRows(api.getState(), { includeCleared: true }).find((r) => r.listId === MORRISON_PM)!
    expect(cleared.clear?.note).toBe('Theatre confirmed running')
    expect(conflictRows(api.getState()).some((r) => r.listId === MORRISON_PM)).toBe(false)
    const audit = api.getState().audit.filter((a) => a.entityId === MORRISON_PM).map((a) => a.action)
    expect(audit).toContain('list.conflictCleared')
    expect(audit).not.toContain('list.conflictResolved')
    expect(restoreListConflict(api, OFFICE, MORRISON_PM, 'holiday:HH900').ok).toBe(true)
    expect(api.getState().schedule.lists[MORRISON_PM]!.conflicts).toHaveLength(1)
    expect(api.getState().audit.at(-1)?.action).toBe('list.conflictRestored')
    expect(openConflictCount(api.getState())).toBe(before)
  })

  it('a clear is dropped when its cause goes, and the clash coming back flags again', () => {
    const api = store()
    clearListConflict(api, OFFICE, MORRISON_PM, 'holiday:HH900')
    editHospitalHoliday(api, OFFICE, 'HH900', { dateISO: '2026-07-23' })
    expect(api.getState().schedule.lists[MORRISON_PM]!.conflictClears).toBeUndefined()
    editHospitalHoliday(api, OFFICE, 'HH900', { dateISO: '2026-07-22' })
    expect(api.getState().schedule.lists[MORRISON_PM]!.conflicts).toMatchObject([{ holidayId: 'HH900' }])
  })

  it('refuses: not the office, no List, no such live conflict, already cleared, not cleared', () => {
    const api = store()
    expect(code(clearListConflict(api, SOUTER_ACTOR, MORRISON_PM, 'holiday:HH900'))).toBe('officeOnly')
    expect(code(clearListConflict(api, OFFICE, 'L-nope', 'holiday:HH900'))).toBe('notFound')
    expect(code(clearListConflict(api, OFFICE, MORRISON_PM, 'holiday:HH001'))).toBe('conflictNotFound')
    expect(code(restoreListConflict(api, OFFICE, MORRISON_PM, 'holiday:HH900'))).toBe('notCleared')
    clearListConflict(api, OFFICE, MORRISON_PM, 'holiday:HH900')
    expect(code(clearListConflict(api, OFFICE, MORRISON_PM, 'holiday:HH900'))).toBe('alreadyCleared')
    expect(code(restoreListConflict(api, SOUTER_ACTOR, MORRISON_PM, 'holiday:HH900'))).toBe('officeOnly')
  })
})

describe('hospital holidays: edit and delete (US-01.5.1)', () => {
  it('moving the date resolves the old date\'s flags and raises the new date\'s', () => {
    const api = store()
    // Four Lists plus Dr Beaumont's two Draft Lists that day (catch-up Phase 31).
    const wed = listsFlaggedByHoliday(api.getState(), 'HH900')
    expect(wed).toBe(6)
    const out = editHospitalHoliday(api, OFFICE, 'HH900', { dateISO: '2026-07-23' })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value.resolved).toBe(6)
    expect(out.value.flagged).toBe(Object.values(api.getState().schedule.lists).filter((l) => l.dateISO === '2026-07-23' && l.hospitalId === HOSP.sx).length)
    expect(api.getState().schedule.lists[MORRISON_PM]!.conflicts).toEqual([])
    expect(api.getState().audit.find((a) => a.action === 'holiday.update')).toMatchObject({ before: { dateISO: '2026-07-22' }, after: { dateISO: '2026-07-23' } })
  })

  it('a rename changes the wording with no conflict meta', () => {
    const api = store()
    const out = editHospitalHoliday(api, OFFICE, 'HH900', { name: 'Sterilisation unit down' })
    expect(out.ok && out.value).toEqual({ flagged: 0, resolved: 0 })
    const row = conflictRows(api.getState()).find((r) => r.listId === MORRISON_PM)!
    expect(row.detail).toBe('Southern Cross is closed: Sterilisation unit down.')
  })

  it('deleting resolves every flag it caused, cleared ones included', () => {
    const api = store()
    clearListConflict(api, OFFICE, MORRISON_PM, 'holiday:HH900')
    const out = deleteHospitalHoliday(api, OFFICE, 'HH900')
    expect(out.ok && out.value.resolved).toBe(6)
    expect(api.getState().masters.holidays['HH900']).toBeUndefined()
    expect(api.getState().schedule.lists[MORRISON_PM]!.conflictClears).toBeUndefined()
    expect(api.getState().audit.find((a) => a.action === 'holiday.delete')?.before).toMatchObject({ id: 'HH900', name: 'Theatre maintenance closure' })
  })

  it('refuses: not the office, no row, empty name, bad date, a duplicate date at that hospital', () => {
    const api = store()
    expect(code(editHospitalHoliday(api, SOUTER_ACTOR, 'HH900', { name: 'x' }))).toBe('officeOnly')
    expect(code(editHospitalHoliday(api, OFFICE, 'HHnope', { name: 'x' }))).toBe('notFound')
    expect(code(editHospitalHoliday(api, OFFICE, 'HH900', { name: '  ' }))).toBe('nameRequired')
    expect(code(editHospitalHoliday(api, OFFICE, 'HH900', { dateISO: '22/07/2026' }))).toBe('dateRequired')
    // Labour Day is a master public holiday since catch-up Phase 42; a second closure of the hospital's own on HH900's date is the duplicate.
    expect(addHospitalHoliday(api, OFFICE, HOSP.sx, '2026-07-29', 'Lift repairs').ok).toBe(true)
    expect(code(editHospitalHoliday(api, OFFICE, 'HH900', { dateISO: '2026-07-29' }))).toBe('duplicateHoliday')
    expect(code(deleteHospitalHoliday(api, OFFICE, 'HHnope'))).toBe('notFound')
    expect(code(deleteHospitalHoliday(api, SOUTER_ACTOR, 'HH900'))).toBe('officeOnly')
  })
})

describe('accept and flag on Booking paths (US-01.5.2 AC1)', () => {
  it('a Booking created on, or moved onto, a conflicted List is accepted; the List stays flagged', () => {
    const api = store()
    const created = createBooking(api, OFFICE, MORRISON_PM, { patient: { nhi: nextTestNhi(), name: 'Test Patient', dobISO: '1970-01-01' }, sourceText: { text: 'Test', source: 'anaesthetist' } })
    expect(created.ok).toBe(true)
    expect(api.getState().schedule.lists[MORRISON_PM]!.conflicts).toHaveLength(1)
    const souterBooking = Object.values(api.getState().schedule.bookings).find((b) => b.listId === SEED_LIST_IDS.souterAm21 && b.cancellation === undefined)!
    expect(reassignBooking(api, OFFICE, souterBooking.id, MORRISON_PM).ok).toBe(true)
    expect(api.getState().schedule.lists[MORRISON_PM]!.conflicts).toHaveLength(1)
  })

  it('a holiday added over a booked List keeps the Bookings and flags the List', () => {
    const api = store()
    const bookings = () => Object.values(api.getState().schedule.bookings).filter((b) => b.listId === SEED_LIST_IDS.souterAm21).length
    const n = bookings()
    const out = addHospitalHoliday(api, OFFICE, HOSP.stg, '2026-07-21', 'Power outage')
    expect(out.ok && out.value.flaggedListCount).toBeGreaterThan(0)
    expect(bookings()).toBe(n)
    expect(api.getState().schedule.lists[SEED_LIST_IDS.souterAm21]!.conflicts).toMatchObject([{ kind: 'holiday' }])
  })
})

describe('conflict selectors', () => {
  it('lists hospital closures only (D59: unavailability is never a conflict), sorted by date, session then roster order, with reason and Booking count', () => {
    const api = store()
    const rows = conflictRows(api.getState(), { fromISO: '2026-07-22', toISO: '2026-07-22' })
    // Dr Beaumont's two Draft Lists show as hospital-closed rows with no anaesthetist (catch-up Phase 31).
    // Rutherford's returned Wed 22 AM List is a Draft List with no conflict (catch-up Phase 32b).
    expect([...rows.map((r) => r.listId)].sort()).toEqual(['L-46822-2026-07-22-AM', 'L-25490-2026-07-22-PM', 'L-41267-2026-07-22-PM', 'L-38455-2026-07-22-PM', 'LD-RCB020-2026-07-22-AM', 'LD-RCB021-2026-07-22-PM'].sort())
    expect(rows.every((r, i) => i === 0 || rows[i - 1]!.session <= r.session)).toBe(true)
    expect(rows.some((r) => r.listId === RUTHERFORD_AM)).toBe(false)
    expect(rows.every((r) => r.reason === 'Hospital closed')).toBe(true)
    expect(rows.filter((r) => r.listId.startsWith('LD-')).every((r) => r.anaesthetistId === undefined && r.slotId === undefined)).toBe(true)
    expect(rows.find((r) => r.listId === 'L-41267-2026-07-22-PM')?.bookingCount).toBe(2)
  })

  it('filters by hospital and anaesthetist (one reason left)', () => {
    const api = store()
    const s = api.getState()
    expect(conflictRows(s, { hospitalId: HOSP.ces }).every((r) => r.hospitalId === HOSP.ces)).toBe(true)
    expect(conflictRows(s, { anaesthetistId: ANAE.morrison }).every((r) => r.anaesthetistId === ANAE.morrison)).toBe(true)
  })

  it('counts open conflicts from today: Wed 22 only (Rutherford no longer one; recurring Lists skip public holidays)', () => {
    const api = store()
    // 19 until catch-up Phase 32d (three bookless public Lists became Public sessions); 16 until 24 Nov 2026,
    // when recurring Lists stopped being made on Labour Day and Canterbury Anniversary Day.
    expect(openConflictCount(api.getState())).toBe(6)
  })

  it('hospitalMonth: closures, Lists and conflicted Lists per day', () => {
    const api = store()
    const july = hospitalMonth(api.getState(), HOSP.sx, '2026-07')
    expect(july).toHaveLength(31)
    const wed = july.find((d) => d.dateISO === '2026-07-22')!
    expect(wed.closures.map((h) => h.id)).toEqual(['HH900'])
    expect(wed.listCount).toBe(6)
    expect(wed.conflictedCount).toBe(6)
    const oct = hospitalMonth(api.getState(), HOSP.sx, '2026-10').find((d) => d.dateISO === '2026-10-26')!
    // Catch-up Phase 42: Labour Day is the master calendar's, read-only on the hospital's month.
    expect(oct.closures).toEqual([])
    expect(oct.publicClosures.map((h) => h.name)).toEqual(['Labour Day'])
    const rooms = hospitalMonth(api.getState(), HOSP.aaRooms, '2026-10').find((d) => d.dateISO === '2026-10-26')!
    expect(rooms.publicClosures).toEqual([])
  })
})

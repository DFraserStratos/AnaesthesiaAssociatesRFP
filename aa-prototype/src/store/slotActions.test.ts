/**
 * Slots and Lists (catch-up Phase 28): generation in the catalogue's order,
 * assignment, the move between sessions, the one availability mechanism,
 * status independence from Bookings, times and defaults, the horizon setting,
 * cover markers, and one status read the same way by every app and finder.
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  assignListToSlot,
  moveListToSlot,
  previewHorizonChange,
  reassignList,
  requestCover,
  setAvailability,
  setHorizonMonths,
  setSlotDefaultTimes,
  setSlotTimes,
} from './slotActions'
import { authoriseList, cancelBooking, completeBooking, reassignBooking, submitList } from './lifecycle'
import { addPostOpAddendum, createBooking } from './bookingActions'
import { addAttachment } from './attachmentActions'
import { advanceClockDays } from './clockActions'
import { endPairingPreference, selectPairingPreferences } from './officePrivate'
import {
  bookingsForList,
  isOpenSlotView,
  listInSlot,
  rosterForDate,
  scheduleHorizon,
  slotFor,
  slotView,
  slotViewsForAnaesthetist,
  slotViewsForDate,
} from './selectors'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import type { Actor } from './mutate'
import { ANAE, HOSP, SEED_LIST_IDS, SURG, generateCanvasForDates, seedSlotStatusRecords, type CanvasMasters } from '../domain/seed'
import { displayStatusKey, slotIdFor } from '../domain/slots'
import { isOpenSlot } from '../domain/slotStatus'
import { enumerateDatesISO } from '../domain/clock'
import type { RecurringBooking, SeedLeaveWindow } from '../domain/types'

const OFFICE = OFFICE_ACTOR
const SOUTER = SOUTER_ACTOR
const SHARMA: Actor = { who: 'Dr Priya Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }
const TUE21 = '2026-07-21'
const WED22 = '2026-07-22'
const SHARMA_PM = slotIdFor(ANAE.sharma, TUE21, 'PM') // free, open for cover
const STRAND_PM = slotIdFor(ANAE.strand, TUE21, 'PM') // free, open for cover

function store(): BoundAppStore {
  return createAppStore()
}

/** The first open session on a date and session, other than `exclude`'s. */
function openSlotOn(api: BoundAppStore, dateISO: string, session: 'AM' | 'PM', exclude?: string) {
  const v = slotViewsForDate(api.getState(), dateISO)
    .filter((x) => x.slot.session === session && x.slot.anaesthetistId !== exclude && isOpenSlotView(x))
    .sort((a, b) => a.slot.id.localeCompare(b.slot.id))[0]
  if (v === undefined) throw new Error(`no open ${session} session on ${dateISO}`)
  return v.slot
}

const assign = (api: BoundAppStore, slotId: string, surgeonId: string = SURG.hale, hospitalId: string = HOSP.stg) =>
  assignListToSlot(api, OFFICE, slotId, { hospitalId, surgeonId, kind: 'private' })

// ---------------------------------------------------------------------------
// Generation (US-01.1.1, FT-01.1; OQ-81 part 1)
// ---------------------------------------------------------------------------

describe('generation: free Slots, then the calendar, then recurring bookings', () => {
  const recurring = (over: Partial<RecurringBooking>): RecurringBooking => ({
    id: 'PLX', anaesthetistId: 'A1', dayOfWeek: 1, session: 'AM', kind: 'private', hospitalId: HOSP.stg, surgeonId: SURG.hale, ...over,
  })
  const masters = (over: Partial<CanvasMasters> = {}): CanvasMasters => ({
    anaesthetists: [
      { id: 'A1', startDateISO: '2020-01-06', active: true },
      { id: 'A2', startDateISO: '2020-01-06', active: false },
      { id: 'A3', startDateISO: '2026-08-05', active: true },
    ],
    recurringBookings: [recurring({}), recurring({ id: 'PLY', dayOfWeek: 6 })],
    leave: [],
    series: [],
    statuses: seedSlotStatusRecords(),
    ...over,
  })
  // Mon 3 Aug to Sun 9 Aug 2026.
  const week = enumerateDatesISO('2026-08-03', '2026-08-09')

  it('writes exactly two Slots per active anaesthetist per day, none for an inactive one or before a start date', () => {
    const { slots } = generateCanvasForDates(masters(), week)
    const by = (a: string) => slots.filter((s) => s.anaesthetistId === a)
    expect(by('A1')).toHaveLength(14)
    expect(by('A2')).toHaveLength(0)
    expect(by('A3').map((s) => s.dateISO).sort()[0]).toBe('2026-08-05')
    expect(by('A3')).toHaveLength(10)
  })

  it('every Slot is free unless a recurring booking projected a List; weekend recurring bookings project too (catch-up Phase 30)', () => {
    const { slots, lists } = generateCanvasForDates(masters(), week)
    expect(lists).toHaveLength(2)
    expect(lists[0]).toMatchObject({ id: 'L-A1-2026-08-03-AM', slotId: 'S-A1-2026-08-03-AM', state: 'ACTIVE', kind: 'private', recurringBookingId: 'PLX' })
    expect(lists[1]).toMatchObject({ id: 'L-A1-2026-08-08-AM', recurringBookingId: 'PLY' })
    expect(slots.every((s) => s.status === 'free')).toBe(true)
  })

  it('the calendar wins: a recurring booking under leave projects no List and is traced as a clash', () => {
    const leave: SeedLeaveWindow[] = [{ anaesthetistId: 'A1', dateISO: '2026-08-03', session: 'AM', status: 'holiday', note: 'Annual leave' }]
    const { slots, lists, clashes } = generateCanvasForDates(masters({ leave }), week)
    expect(lists.filter((l) => l.dateISO === '2026-08-03')).toHaveLength(0)
    expect(clashes).toEqual([{ recurringBookingId: 'PLX', slotId: 'S-A1-2026-08-03-AM' }])
    expect(slots.find((s) => s.id === 'S-A1-2026-08-03-AM')).toMatchObject({ status: 'holiday', note: 'Annual leave' })
  })

  it('recurring-booking times become the Slot\'s own times; generation stamps no conflict (the one rule does)', () => {
    const { slots, lists } = generateCanvasForDates(masters({ recurringBookings: [recurring({ startTime: '09:00', endTime: '12:00' })] }), week)
    expect(slots.find((s) => s.id === 'S-A1-2026-08-03-AM')).toMatchObject({ startTime: '09:00', endTime: '12:00' })
    expect(lists[0]?.conflicts).toEqual([])
  })

  it('start and end dates bound a recurring booking; the first running row in id order paints a shared session', () => {
    const ended = recurring({ id: 'PLA', effectiveToISO: '2026-08-02' })
    const next = recurring({ id: 'PLB', effectiveFromISO: '2026-08-03', surgeonId: SURG.lim })
    const { lists } = generateCanvasForDates(masters({ recurringBookings: [next, ended] }), enumerateDatesISO('2026-07-27', '2026-08-03'))
    expect(lists.map((l) => [l.dateISO, l.recurringBookingId])).toEqual([
      ['2026-07-27', 'PLA'],
      ['2026-08-03', 'PLB'],
    ])
  })
})

// ---------------------------------------------------------------------------
// assignListToSlot (US-01.3.3)
// ---------------------------------------------------------------------------

describe('assignListToSlot', () => {
  it('creates exactly one ACTIVE LG List in the session, which then shows in place of its status', () => {
    const api = store()
    expect(slotView(api.getState(), STRAND_PM)?.displayKey).toBe('free')
    const before = Object.keys(api.getState().schedule.lists).length
    const out = assign(api, STRAND_PM)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const list = assigned(api.getState().schedule.lists[out.value.listId])
    expect(list).toMatchObject({ slotId: STRAND_PM, anaesthetistId: ANAE.strand, dateISO: TUE21, session: 'PM', state: 'ACTIVE', kind: 'private', hospitalId: HOSP.stg, surgeonId: SURG.hale })
    expect(list.id).toMatch(/^LG\d{4}$/)
    expect(Object.keys(api.getState().schedule.lists)).toHaveLength(before + 1)
    expect(slotView(api.getState(), STRAND_PM)?.displayKey).toBe('private')
    expect(api.getState().audit.filter((a) => a.action === 'list.create')).toHaveLength(1)
  })

  it('refuses: not the office, no such session, occupied, hospital or surgeon missing, bad kind', () => {
    const api = store()
    const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)
    expect(code(assignListToSlot(api, SOUTER, STRAND_PM, { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'private' }))).toBe('officeOnly')
    expect(code(assign(api, 'S-nope'))).toBe('notFound')
    expect(code(assign(api, slotIdFor(ANAE.souter, TUE21, 'AM')))).toBe('slotOccupied')
    expect(code(assignListToSlot(api, OFFICE, STRAND_PM, { hospitalId: '', surgeonId: SURG.hale, kind: 'private' }))).toBe('hospitalRequired')
    expect(code(assignListToSlot(api, OFFICE, STRAND_PM, { hospitalId: HOSP.stg, surgeonId: '', kind: 'private' }))).toBe('surgeonRequired')
    expect(code(assignListToSlot(api, OFFICE, STRAND_PM, { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'free' as never }))).toBe('invalidKind')
    expect(Object.values(api.getState().schedule.lists).some((l) => l.slotId === STRAND_PM)).toBe(false)
  })

  it('flags a hospital closed that day on the new List, never blocking (Labour Day)', () => {
    const api = store()
    const slot = openSlotOn(api, '2026-10-26', 'AM')
    const out = assign(api, slot.id)
    expect(out.ok).toBe(true)
    if (out.ok) expect(api.getState().schedule.lists[out.value.listId]?.conflicts).toMatchObject([{ kind: 'holiday' }])
    expect(api.getState().audit.filter((a) => a.action === 'list.conflict')).toHaveLength(1)
  })

  it('accepts and flags a session marked unavailable (OQ-09 soft warning; catch-up Phase 30 replaced the interim refusal)', () => {
    const api = store()
    const ngataAm = slotIdFor(ANAE.ngata, TUE21, 'AM')
    const out = assign(api, ngataAm)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const list = assigned(api.getState().schedule.lists[out.value.listId])
    expect(list.slotId).toBe(ngataAm)
    expect(list.conflicts).toMatchObject([{ kind: 'availability', slotId: ngataAm }])
    expect(api.getState().audit.filter((a) => a.action === 'list.conflict' && a.entityId === list.id)).toHaveLength(1)
  })

  it('a not-preferred pairing warns, never refuses: the office records one acknowledgement; a preferred or ended pairing records none', () => {
    const api = store()
    const acks = () => api.getState().audit.filter((a) => a.action === 'list.pairingAcknowledged')
    expect(assign(api, SHARMA_PM, SURG.reid, HOSP.ces).ok).toBe(true)
    expect(acks()).toHaveLength(1)
    expect(assign(api, slotIdFor(ANAE.sharma, '2026-07-23', 'PM'), SURG.whitford, HOSP.ces).ok).toBe(true)
    expect(acks()).toHaveLength(1)
    const entry = Object.values(selectPairingPreferences(api.getState())).find((e) => e.anaesthetistId === ANAE.sharma && e.surgeonId === SURG.reid)!
    expect(endPairingPreference(api, OFFICE, entry.id).ok).toBe(true)
    const sharmaOpen = slotViewsForAnaesthetist(api.getState(), ANAE.sharma, '2026-08-01', '2026-11-21').find(isOpenSlotView)!
    expect(assign(api, sharmaOpen.slot.id, SURG.reid, HOSP.ces).ok).toBe(true)
    expect(acks()).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// One status, independent of Bookings, read the same everywhere (US-01.2.3, US-01.4.2)
// ---------------------------------------------------------------------------

describe('the displayed status', () => {
  it('never changes as Bookings are created, completed, cancelled or moved (US-01.2.3)', () => {
    const api = store()
    const list = assigned(api.getState().schedule.lists[SEED_LIST_IDS.souterAm21])
    const keyOf = () => slotView(api.getState(), list.slotId)?.displayKey
    const start = keyOf()
    const created = createBooking(api, OFFICE, list.id, { patient: { name: 'Test Patient', dobISO: '1970-01-01' }, operation: 'Test', billingRoute: 'hospital' })
    expect(created.ok).toBe(true)
    expect(keyOf()).toBe(start)
    const existing = bookingsForList(api.getState(), list.id).find((b) => b.cancellation === undefined && !b.completed)!
    completeBooking(api, OFFICE, existing.id)
    expect(keyOf()).toBe(start)
    if (created.ok) cancelBooking(api, OFFICE, created.value.bookingId, 'Test')
    expect(keyOf()).toBe(start)
    const pm = assigned(api.getState().schedule.lists[SEED_LIST_IDS.souterPm21])
    reassignBooking(api, OFFICE, existing.id, pm.id)
    expect(keyOf()).toBe(start)
    expect(slotView(api.getState(), pm.slotId)?.displayKey).toBe(pm.kind)
  })

  it('a holiday session reads Holiday when empty and keeps its List\'s kind, with a conflict, when it holds one', () => {
    const api = store()
    expect(setAvailability(api, OFFICE, ANAE.strand, TUE21, 'PM', 'holiday').ok).toBe(true)
    expect(slotView(api.getState(), STRAND_PM)?.displayKey).toBe('holiday')
    const souterAm = assigned(api.getState().schedule.lists[SEED_LIST_IDS.souterAm21])
    const out = setAvailability(api, SOUTER, ANAE.souter, TUE21, 'AM', 'holiday')
    expect(out.ok && out.value.result).toBe('conflictFlagged')
    expect(slotView(api.getState(), souterAm.slotId)?.displayKey).toBe(souterAm.kind)
    expect(api.getState().schedule.lists[souterAm.id]?.kind).toBe(souterAm.kind)
    expect(api.getState().schedule.lists[souterAm.id]?.conflicts.filter((c) => c.kind === 'availability')).toHaveLength(1)
  })

  it('after a phone-advice assignment, the admin, mobile and web views and every finder agree it is booked (US-01.4.2)', () => {
    const api = store()
    const out = assign(api, SHARMA_PM)
    expect(out.ok).toBe(true)
    if (out.ok) createBooking(api, OFFICE, out.value.listId, { patient: { name: 'Phone Patient', dobISO: '1980-02-02' }, operation: 'Appendicectomy', billingRoute: 'hospital' })
    const state = api.getState()
    const admin = slotViewsForDate(state, TUE21).find((v) => v.slot.id === SHARMA_PM)!
    const personal = slotViewsForAnaesthetist(state, ANAE.sharma, TUE21, TUE21).find((v) => v.slot.id === SHARMA_PM)!
    const one = slotView(state, SHARMA_PM)!
    expect(new Set([admin.displayKey, personal.displayKey, one.displayKey])).toEqual(new Set(['private']))
    expect(isOpenSlot(one.slot, one.list, seedSlotStatusRecords())).toBe(false)
    expect(isOpenSlotView(admin)).toBe(false)
    // The mobile and web finders' "Free only" read isOpenSlotView over these views: it is gone.
    expect(slotViewsForDate(state, TUE21).filter(isOpenSlotView).some((v) => v.slot.id === SHARMA_PM)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// setAvailability: the one mechanism (FT-01.2)
// ---------------------------------------------------------------------------

describe('setAvailability', () => {
  it('writes only the Slot (no availability record exists to read)', () => {
    const api = store()
    const before = api.getState()
    const out = setAvailability(api, SHARMA, ANAE.sharma, TUE21, 'PM', 'unavailable', 'Unwell')
    expect(out.ok && out.value.result).toBe('updated')
    const after = api.getState()
    expect(after.schedule.slots[SHARMA_PM]).toMatchObject({ status: 'unavailable', note: 'Unwell' })
    expect(after.schedule.lists).toBe(before.schedule.lists)
    expect(after.masters).toBe(before.masters)
    expect('availability' in after.masters).toBe(false)
    expect(after.audit.at(-1)).toMatchObject({ action: 'session.status', entityId: SHARMA_PM })
  })

  it('marking a session holding a List free writes no conflict; repeated blocks leave at most one', () => {
    const api = store()
    const list = assigned(api.getState().schedule.lists[SEED_LIST_IDS.souterAm21])
    const conflicts = () => assigned(api.getState().schedule.lists[list.id]).conflicts.filter((c) => c.kind === 'availability')
    expect(setAvailability(api, SOUTER, ANAE.souter, TUE21, 'AM', 'free').ok).toBe(true)
    expect(conflicts()).toHaveLength(0)
    setAvailability(api, SOUTER, ANAE.souter, TUE21, 'AM', 'unavailable')
    setAvailability(api, SOUTER, ANAE.souter, TUE21, 'AM', 'free')
    setAvailability(api, SOUTER, ANAE.souter, TUE21, 'AM', 'unavailable', 'Again')
    expect(conflicts()).toHaveLength(1)
  })

  it('refuses another anaesthetist, a feed, and a day with no session', () => {
    const api = store()
    expect(setAvailability(api, SOUTER, ANAE.sharma, TUE21, 'PM', 'unavailable')).toMatchObject({ ok: false, code: 'notOwnAvailability' })
    expect(setAvailability(api, { who: 'Feed', role: 'system', source: 'integration' }, ANAE.sharma, TUE21, 'PM', 'free')).toMatchObject({ ok: false, code: 'integrationForbidden' })
    expect(setAvailability(api, SHARMA, ANAE.sharma, '2027-06-01', 'PM', 'unavailable')).toMatchObject({ ok: false, code: 'noSlot' })
  })
})

// ---------------------------------------------------------------------------
// reassignList / moveListToSlot (US-01.4.1; OQ-84 provisional; US-06.3.5)
// ---------------------------------------------------------------------------

describe('reassignList: the List moves between sessions', () => {
  it('keeps id, Bookings and history; the vacated session returns to Free; no List is created or deleted; own times travel', () => {
    const api = store()
    const source = assigned(api.getState().schedule.lists[SEED_LIST_IDS.rutherfordPm21])
    const fromSlot = api.getState().schedule.slots[source.slotId]!
    expect(fromSlot).toMatchObject({ startTime: '13:30', endTime: '17:00' })
    const bookingsBefore = bookingsForList(api.getState(), source.id).map((b) => b.id)
    const historyBefore = api.getState().audit.filter((a) => a.entityId === source.id).length
    const listCount = Object.keys(api.getState().schedule.lists).length

    const out = reassignList(api, OFFICE, source.id, ANAE.strand)
    expect(out).toEqual({ ok: true, value: { listId: source.id, vacatedSlotId: source.slotId } })
    const s = api.getState()
    const moved = assigned(s.schedule.lists[source.id])
    expect(moved).toMatchObject({ slotId: STRAND_PM, anaesthetistId: ANAE.strand, dateISO: TUE21, session: 'PM' })
    expect(bookingsForList(s, source.id).map((b) => b.id)).toEqual(bookingsBefore)
    expect(s.audit.filter((a) => a.entityId === source.id).length).toBe(historyBefore + 1)
    expect(Object.keys(s.schedule.lists)).toHaveLength(listCount)
    expect(listInSlot(s, STRAND_PM)?.id).toBe(source.id)
    expect(s.schedule.slots[source.slotId]).toMatchObject({ status: 'free' })
    expect(s.schedule.slots[source.slotId]?.startTime).toBeUndefined()
    expect(s.schedule.slots[STRAND_PM]).toMatchObject({ startTime: '13:30', endTime: '17:00' })
    expect(s.audit.some((a) => a.action === 'list.absorb' || a.action === 'list.regenerate')).toBe(false)
  })

  it('marks the vacated session Unavailable or Holiday on request, audited session.status', () => {
    const api = store()
    const source = assigned(api.getState().schedule.lists[SEED_LIST_IDS.rutherfordPm21])
    expect(reassignList(api, OFFICE, source.id, ANAE.strand, 'unavailable').ok).toBe(true)
    expect(api.getState().schedule.slots[source.slotId]?.status).toBe('unavailable')
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'session.status', entityId: source.slotId, after: { status: 'unavailable' } })
  })

  it('refuses: not the office, an authorised List, the same anaesthetist, no session, an occupied session', () => {
    const api = store()
    const id = SEED_LIST_IDS.rutherfordPm21
    const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)
    expect(code(reassignList(api, SOUTER, id, ANAE.strand))).toBe('officeOnly')
    expect(code(reassignList(api, OFFICE, id, ANAE.rutherford))).toBe('sameAnaesthetist')
    expect(code(reassignList(api, OFFICE, id, ANAE.souter))).toBe('slotOccupied')
    expect(code(reassignList(api, OFFICE, id, 'nobody'))).toBe('notFound')
    expect(code(moveListToSlot(api, OFFICE, id, slotIdFor(ANAE.strand, WED22, 'PM')))).toBe('differentSession')
    expect(code(moveListToSlot(api, OFFICE, id, assigned(api.getState().schedule.lists[id]).slotId))).toBe('sameSlot')
    const authorised = SEED_LIST_IDS.morrisonMon20
    expect(authoriseList(api, OFFICE, authorised).ok).toBe(true)
    expect(code(reassignList(api, OFFICE, authorised, ANAE.strand))).toBe('listAuthorised')
    expect(api.getState().schedule.lists[id]?.slotId).toBe(slotIdFor(ANAE.rutherford, TUE21, 'PM'))
  })

  it('a reassign onto a closed session is accepted and flagged (OQ-09); moving back to an open one resolves it', () => {
    const api = store()
    const id = SEED_LIST_IDS.rutherfordPm21
    // Ngata is unavailable all Tue 21 (ICU on call).
    expect(reassignList(api, OFFICE, id, ANAE.ngata).ok).toBe(true)
    const moved = assigned(api.getState().schedule.lists[id])
    expect(moved.anaesthetistId).toBe(ANAE.ngata)
    expect(moved.conflicts).toMatchObject([{ kind: 'availability' }])
    expect(reassignList(api, OFFICE, id, ANAE.rutherford).ok).toBe(true)
    expect(assigned(api.getState().schedule.lists[id]).conflicts).toEqual([])
    expect(api.getState().audit.filter((a) => a.entityId === id).map((a) => a.action)).toEqual(
      expect.arrayContaining(['list.conflict', 'list.conflictResolved']),
    )
  })

  it('an office move onto a not-preferred pairing writes one acknowledgement; an anaesthetist\'s own move writes none (US-01.4.5)', () => {
    const api = store()
    const chenPm = assigned(api.getState().schedule.lists[`L-${ANAE.chen}-${TUE21}-PM`])
    expect(chenPm.surgeonId).toBe(SURG.reid)
    expect(reassignList(api, OFFICE, chenPm.id, ANAE.sharma).ok).toBe(true)
    expect(api.getState().audit.filter((a) => a.action === 'list.pairingAcknowledged')).toHaveLength(1)

    const api2 = store()
    const chen: Actor = { who: 'Dr Alistair Chen', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.chen }
    expect(moveListToSlot(api2, chen, chenPm.id, SHARMA_PM).ok).toBe(true)
    expect(api2.getState().audit.some((a) => a.action === 'list.pairingAcknowledged')).toBe(false)
  })

  it('a move recalculates no prepayment, invoice or billing case (US-06.3.5: an honour system)', () => {
    const api = store()
    const prepaid = assigned(api.getState().schedule.lists[SEED_LIST_IDS.prepaymentPaidList])
    const target = openSlotOn(api, prepaid.dateISO, prepaid.session, prepaid.anaesthetistId)
    const billing = api.getState().billing
    const xero = api.getState().xero
    const bookings = bookingsForList(api.getState(), prepaid.id)
    expect(reassignList(api, OFFICE, prepaid.id, target.anaesthetistId).ok).toBe(true)
    expect(api.getState().billing).toEqual(billing)
    expect(api.getState().xero).toEqual(xero)
    expect(bookingsForList(api.getState(), prepaid.id)).toEqual(bookings)
  })
})

// ---------------------------------------------------------------------------
// Times (US-01.1.4)
// ---------------------------------------------------------------------------

describe('session times', () => {
  it('a session overrides the default; clearing returns to it; an override survives a default change', () => {
    const api = store()
    const souterAm = assigned(api.getState().schedule.lists[SEED_LIST_IDS.souterAm21])
    const times = (slotId: string) => slotView(api.getState(), slotId)!.times
    expect(times(STRAND_PM)).toEqual({ startTime: '13:00', endTime: '17:30', overridden: false })
    expect(setSlotTimes(api, OFFICE, STRAND_PM, { startTime: '13:15' }).ok).toBe(true)
    expect(times(STRAND_PM)).toEqual({ startTime: '13:15', endTime: '17:30', overridden: true })
    expect(setSlotDefaultTimes(api, OFFICE, { AM: { startTime: '07:30', endTime: '12:30' }, PM: { startTime: '13:30', endTime: '17:30' } }).ok).toBe(true)
    expect(times(STRAND_PM).startTime).toBe('13:15')
    expect(times(SHARMA_PM)).toEqual({ startTime: '13:30', endTime: '17:30', overridden: false })
    expect(setSlotTimes(api, OFFICE, STRAND_PM, { startTime: '' }).ok).toBe(true)
    expect(times(STRAND_PM).overridden).toBe(false)
    expect(times(souterAm.slotId).overridden).toBe(false)
    expect(api.getState().audit.filter((a) => a.action === 'session.times')).toHaveLength(2)
    expect(api.getState().audit.filter((a) => a.action === 'settings.scheduleDefaults')).toHaveLength(1)
  })

  it('refuses a non-office actor, bad or backwards times, and an authorised List', () => {
    const api = store()
    expect(setSlotTimes(api, SOUTER, STRAND_PM, { startTime: '13:15' })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(setSlotTimes(api, OFFICE, STRAND_PM, { startTime: '1pm' })).toMatchObject({ ok: false, code: 'invalidTime' })
    expect(setSlotTimes(api, OFFICE, STRAND_PM, { startTime: '18:00' })).toMatchObject({ ok: false, code: 'invalidTimes' })
    expect(setSlotDefaultTimes(api, OFFICE, { AM: { startTime: '12:00', endTime: '08:00' }, PM: { startTime: '13:00', endTime: '17:30' } })).toMatchObject({ ok: false, code: 'invalidTimes' })
  })
})

// ---------------------------------------------------------------------------
// The horizon (FT-01.1)
// ---------------------------------------------------------------------------

describe('the horizon setting', () => {
  it('4 to 3 months drops exactly the far-edge days and their empty Lists; 3 back to 4 restores the same far edge', () => {
    const api = store()
    const original = api.getState().schedule
    const preview = previewHorizonChange(api.getState(), 3)
    expect(preview).toMatchObject({ direction: 'shorten', fromEndISO: '2026-11-21', toEndISO: '2026-10-21', days: 31, listsWithBookings: 0 })
    const out = setHorizonMonths(api, OFFICE, 3)
    expect(out.ok).toBe(true)
    const s = api.getState()
    expect(scheduleHorizon(s).endISO).toBe('2026-10-21')
    expect(Object.values(s.schedule.slots).some((x) => x.dateISO > '2026-10-21')).toBe(false)
    expect(Object.values(s.schedule.lists).some((l) => l.dateISO > '2026-10-21')).toBe(false)
    expect(Object.keys(s.schedule.slots).length).toBe(Object.keys(original.slots).length - 31 * 14 * 2)

    expect(setHorizonMonths(api, OFFICE, 4).ok).toBe(true)
    expect(api.getState().schedule.slots).toEqual(original.slots)
    expect(api.getState().schedule.lists).toEqual(original.lists)
    expect(api.getState().audit.filter((a) => a.action === 'settings.horizon')).toHaveLength(2)
  })

  it('refuses to shorten over a List that holds a Booking, and changes nothing', () => {
    const api = store()
    const far = openSlotOn(api, '2026-11-02', 'AM')
    const assigned = assign(api, far.id)
    if (!assigned.ok) throw new Error('assign failed')
    createBooking(api, OFFICE, assigned.value.listId, { patient: { name: 'Far Patient', dobISO: '1960-03-03' }, operation: 'Hip', billingRoute: 'hospital' })
    const before = api.getState().schedule
    const out = setHorizonMonths(api, OFFICE, 3)
    expect(out).toMatchObject({
      ok: false,
      code: 'listsBeyondHorizon',
      message: '1 List after Wed 21 Oct 2026 holds Bookings or attachments (cancelled Bookings count). Move them first, or keep the longer horizon.',
    })
    expect(api.getState().schedule).toBe(before)
    expect(api.getState().appSettings.schedule.horizonMonths).toBe(4)
  })

  it('a cancelled Booking or a List attachment beyond the new end also blocks shortening (nothing orphaned or lost)', () => {
    const api = store()
    const far = openSlotOn(api, '2026-11-03', 'AM')
    const assigned = assign(api, far.id)
    if (!assigned.ok) throw new Error('assign failed')
    const booked = createBooking(api, OFFICE, assigned.value.listId, { patient: { name: 'Far Patient', dobISO: '1960-03-03' }, operation: 'Hip', billingRoute: 'hospital' })
    if (booked.ok) cancelBooking(api, OFFICE, booked.value.bookingId, 'Changed plans')
    expect(setHorizonMonths(api, OFFICE, 3)).toMatchObject({ ok: false, code: 'listsBeyondHorizon' })

    const api2 = store()
    const far2 = openSlotOn(api2, '2026-11-03', 'AM')
    const a2 = assign(api2, far2.id)
    if (!a2.ok) throw new Error('assign failed')
    expect(addAttachment(api2, OFFICE, { kind: 'list', id: a2.value.listId }, { name: 'Theatre list', kind: 'pdf', dataUrl: 'data:,x' }).ok).toBe(true)
    expect(setHorizonMonths(api2, OFFICE, 3)).toMatchObject({ ok: false, code: 'listsBeyondHorizon' })
  })

  it('shortening audits the ids of the empty Lists it dropped, and the same value is no change', () => {
    const api = store()
    expect(setHorizonMonths(api, OFFICE, 4)).toMatchObject({ ok: true, value: { direction: 'none', slots: 0, lists: 0 } })
    expect(api.getState().audit.some((a) => a.action === 'settings.horizon')).toBe(false)
    const out = setHorizonMonths(api, OFFICE, 3)
    expect(out.ok).toBe(true)
    const entry = api.getState().audit.filter((a) => a.action === 'settings.horizon').at(-1)!
    const after = entry.after as { droppedListIds?: string[]; lists: number }
    // Dropped Lists that carried a closure conflict audit it as resolved, in the same commit (catch-up Phase 30).
    const resolved = api.getState().audit.filter((a) => a.action === 'list.conflictResolved')
    expect(resolved.every((a) => after.droppedListIds?.includes(a.entityId) && (a.after as { change: string }).change === 'listRemoved')).toBe(true)
    expect(after.droppedListIds?.length).toBe(-after.lists)
    expect(after.droppedListIds?.every((id) => id.startsWith('L-'))).toBe(true)
  })

  it('refuses out-of-range months and a non-office actor; roll-forward then extends by the new setting', () => {
    const api = store()
    expect(setHorizonMonths(api, OFFICE, 0)).toMatchObject({ ok: false, code: 'invalidHorizon' })
    expect(setHorizonMonths(api, OFFICE, 25)).toMatchObject({ ok: false, code: 'invalidHorizon' })
    expect(setHorizonMonths(api, SOUTER, 5)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(setHorizonMonths(api, OFFICE, 5).ok).toBe(true)
    expect(scheduleHorizon(api.getState()).endISO).toBe('2026-12-21')
    advanceClockDays(api, 1)
    expect(Object.values(api.getState().schedule.slots).some((s) => s.dateISO === '2026-12-22')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// requestCover and the roster
// ---------------------------------------------------------------------------

describe('requestCover on a session', () => {
  it('records a pending offer on an open session and refuses one holding a List', () => {
    const api = store()
    const souterPmWed = slotIdFor(ANAE.souter, WED22, 'PM')
    expect(requestCover(api, SOUTER, souterPmWed, 'offer', 'Happy to hand this over').ok).toBe(true)
    expect(api.getState().schedule.slots[souterPmWed]?.coverRequest).toMatchObject({ kind: 'offer', status: 'pending', message: 'Happy to hand this over' })
    expect(api.getState().audit.at(-1)?.action).toBe('session.coverRequest')
    const souterAm = assigned(api.getState().schedule.lists[SEED_LIST_IDS.souterAm21])
    expect(requestCover(api, SOUTER, souterAm.slotId, 'offer')).toMatchObject({ ok: false, code: 'notFree' })
    // An assignment closes the session for cover and clears its marker.
    expect(assign(api, souterPmWed).ok).toBe(true)
    expect(api.getState().schedule.slots[souterPmWed]?.coverRequest).toBeUndefined()
  })
})

describe('rosterForDate', () => {
  it('lists every anaesthetist with a session that day, cast order first, then added ones', () => {
    const api = store()
    expect(rosterForDate(api.getState(), TUE21).map((a) => a.registrationNumber)[0]).toBe(ANAE.souter)
    expect(rosterForDate(api.getState(), TUE21)).toHaveLength(14)
    expect(rosterForDate(api.getState(), '2027-01-01')).toHaveLength(0)
    expect(slotFor(api.getState(), ANAE.souter, '2027-01-01', 'AM')).toBeUndefined()
    expect(displayStatusKey({ status: 'free' }, undefined)).toBe('free')
  })
})

describe('the post-op addendum fills an open session (interim until 38b)', () => {
  it('creates its List there and clears the session\'s cover marker', () => {
    const api = store()
    const sharma: Actor = { who: 'Dr Priya Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }
    expect(requestCover(api, sharma, SHARMA_PM, 'offer').ok).toBe(true)
    const original = `L-${ANAE.sharma}-2026-07-14-AM`
    const booking = bookingsForList(api.getState(), original)[0]!
    expect(submitList(api, OFFICE, original).ok).toBe(true)
    expect(authoriseList(api, OFFICE, original).ok).toBe(true)
    const out = addPostOpAddendum(api, OFFICE, booking.id)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(api.getState().schedule.lists[out.value.listId]?.slotId).toBe(SHARMA_PM)
    expect(api.getState().schedule.slots[SHARMA_PM]?.coverRequest).toBeUndefined()
  })
})

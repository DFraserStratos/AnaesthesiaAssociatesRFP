/**
 * The anaesthetist's main view, look-back and search selectors (catch-up Phase
 * 38a; US-07.4.2, US-07.4.1, US-03.1.6, US-03.1.7). Own work only, history
 * untouched, deterministic.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, cancelBooking } from './lifecycle'
import { createBooking } from './bookingActions'
import { isBackdropList } from './selectors'
import {
  BOOKING_SEARCH_CAP,
  invoicesForListView,
  listDaysFor,
  listsOnDayFor,
  lookbackBoundsFor,
  mainViewFor,
  searchBookingsFor,
} from './lookback'
import { advanceClockDays, advanceClockToNextMorning, resetDemo } from './clockActions'
import { applyRecurringBookingsToCanvas, editRecurringBooking, addAnaesthetist, addHospitalHoliday } from './mastersActions'
import { createAvailabilitySeries } from './availabilityActions'
import { setHorizonMonths } from './slotActions'
import { authoriseAsSimulatedOffice } from './officeStandIn'
import type { Actor } from './mutate'
import { listProgress } from '../domain/listProgress'
import { ANAE, HOSP, SEED_LIST_IDS, SEED_LOOKBACK } from '../domain/seed'
import { assigned } from '../test/lists'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const TODAY = '2026-07-21'
const MONTH_END = '2026-08-21'

function store(): BoundAppStore {
  return createAppStore()
}
function view(api: BoundAppStore, anaesthetistId: string = ANAE.souter) {
  return mainViewFor(api.getState(), anaesthetistId, api.getState().clock.todayISO, MONTH_END)
}

describe('mainViewFor (US-07.4.2)', () => {
  it('at the demo today, earlier is exactly Mon 13 Jul AM (catch-up Phase 23\'s three-procedure Booking) and Mon 20 Jul AM and PM (not the empty 7 to 16 July Lists), oldest first', () => {
    const api = store()
    expect(api.getState().clock.todayISO).toBe(TODAY)
    const v = view(api)
    expect(v.earlier.map((l) => l.id)).toEqual([SEED_LIST_IDS.multiProcedure, SEED_LIST_IDS.souterMon20Am, SEED_LIST_IDS.souterMon20Pm])
    for (const l of v.earlier) expect(l.state).toBe('SUBMITTED')
  })

  it('never shows a backdrop List, and upcoming starts today', () => {
    const api = store()
    const v = view(api)
    expect(v.earlier.some(isBackdropList)).toBe(false)
    expect(v.upcoming.some((u) => u.list !== undefined && isBackdropList(u.list))).toBe(false)
    expect(v.upcoming.every((u) => u.slot.dateISO >= TODAY && u.slot.dateISO <= MONTH_END)).toBe(true)
    expect(v.upcoming.some((u) => u.slot.dateISO === TODAY)).toBe(true)
  })

  it('authorising a List removes it from earlier at once', () => {
    const api = store()
    expect(authoriseList(api, OFFICE, SEED_LIST_IDS.souterMon20Pm).ok).toBe(true)
    expect(view(api).earlier.map((l) => l.id)).toEqual([SEED_LIST_IDS.multiProcedure, SEED_LIST_IDS.souterMon20Am])
  })

  it('an authorised List today leaves the upcoming rows too', () => {
    const api = store()
    const today = SEED_LIST_IDS.souterAm21
    api.setState((s) => ({
      schedule: { ...s.schedule, lists: { ...s.schedule.lists, [today]: { ...assigned(s.schedule.lists[today]), state: 'AUTHORISED' as const } } },
    }))
    expect(view(api).upcoming.some((u) => u.list?.id === today)).toBe(false)
    // The session is held by a List that has left, so it shows nothing (not Free).
    expect(view(api).upcoming.some((u) => u.slot.id === assigned(api.getState().schedule.lists[today]).slotId)).toBe(false)
  })

  it('a past completed ACTIVE List shows in earlier as ready to submit', () => {
    const api = store()
    const past = Object.values(api.getState().schedule.lists).find(
      (l) => l.state === 'ACTIVE' && l.anaesthetistId === ANAE.souter && l.dateISO === '2026-07-14',
    )
    expect(past).toBeDefined()
    const created = createBooking(api, SOUTER, past!.id, {
      patient: { name: 'Past Patient', dobISO: '1970-01-01' },
      sourceText: { text: 'Arthroscopy', source: 'anaesthetist' },
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    api.setState((s) => ({
      schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [created.value.bookingId]: { ...s.schedule.bookings[created.value.bookingId]!, completed: true } } },
    }))
    const earlier = view(api).earlier
    const row = earlier.find((l) => l.id === past!.id)
    expect(row).toBeDefined()
    const bookings = Object.values(api.getState().schedule.bookings).filter((b) => b.listId === past!.id)
    expect(listProgress(row!, bookings, TODAY)).toBe('readyToSubmit')
    // Oldest first: after Mon 13 Jul's submitted List (catch-up Phase 23), before Mon 20 Jul's.
    expect(earlier.map((l) => l.id).slice(0, 2)).toEqual([SEED_LIST_IDS.multiProcedure, past!.id])
  })

  it('a List moved to a colleague and every Draft List are absent', () => {
    const api = store()
    const moved = SEED_LIST_IDS.souterMon20Pm
    api.setState((s) => ({
      schedule: { ...s.schedule, lists: { ...s.schedule.lists, [moved]: { ...assigned(s.schedule.lists[moved]), anaesthetistId: ANAE.morrison } } },
    }))
    const v = view(api)
    expect(v.earlier.map((l) => l.id)).toEqual([SEED_LIST_IDS.multiProcedure, SEED_LIST_IDS.souterMon20Am])
    expect(view(api, ANAE.morrison).earlier.some((l) => l.id === moved)).toBe(true)
    const shown = new Set([...v.earlier.map((l) => l.id), ...v.upcoming.flatMap((u) => (u.list !== undefined ? [u.list.id] : []))])
    const drafts = Object.values(api.getState().schedule.lists).filter((l) => l.state === 'DRAFT')
    expect(drafts.length).toBeGreaterThan(0)
    expect(drafts.some((d) => shown.has(d.id))).toBe(false)
  })

  it('is deterministic', () => {
    expect(view(store())).toEqual(view(store()))
  })
})

const search = (api: BoundAppStore, q: string) => searchBookingsFor(api.getState(), ANAE.souter, q, api.getState().clock.todayISO)

describe('searchBookingsFor (US-03.1.7)', () => {
  it('finds Sarah Mitchell by name and by NHI: her July, April and March Souter Bookings, never her Booking on Dr Sharma\'s List', () => {
    const api = store()
    for (const q of ['mitchell', 'mitch', 'CQY9304', 'cqy 9304']) {
      const r = search(api, q)
      expect(r.upcoming.map((x) => x.dateISO), q).toEqual(['2026-07-27'])
      expect(r.past.map((x) => x.dateISO), q).toEqual(['2026-04-14', '2026-03-13'])
      expect(r.total).toBe(3)
      for (const row of [...r.upcoming, ...r.past]) {
        expect(api.getState().schedule.lists[row.listId]?.anaesthetistId).toBe(ANAE.souter)
      }
    }
    // Her Booking on Dr Sharma's List exists, and only Dr Sharma finds it.
    const sharma = searchBookingsFor(api.getState(), ANAE.sharma, 'mitchell', '2026-07-21')
    expect(sharma.total).toBe(1)
  })

  it('marks authorised history Invoiced and upcoming work by its progress', () => {
    const r = search(store(), 'mitchell')
    expect(r.past.map((x) => x.progress)).toEqual(['invoiced', 'invoiced'])
    expect(r.past[1]).toMatchObject({ listId: SEED_LOOKBACK.listId, session: 'AM', hospitalName: "St George's", nhi: 'CQY9304' })
  })

  it('finds Wiremu Tane by "tane" and Noah Prescott (no NHI) by name only', () => {
    const api = store()
    expect(search(api, 'tane').total).toBeGreaterThanOrEqual(3)
    const prescott = search(api, 'Prescott')
    expect(prescott.total).toBe(1)
    expect(prescott.upcoming[0]?.nhi).toBeUndefined()
  })

  it('never returns a cancelled Booking', () => {
    const api = store()
    const july = search(api, 'mitchell').upcoming[0]!
    expect(cancelBooking(api, SOUTER, july.bookingId, 'Patient unwell').ok).toBe(true)
    const after = search(api, 'mitchell')
    expect(after.upcoming).toHaveLength(0)
    expect(after.total).toBe(2)
  })

  it('caps at 50 rows and reports the true total', () => {
    const api = store()
    for (let i = 0; i < 60; i++) {
      const out = createBooking(api, OFFICE, SEED_LIST_IDS.souterAm21, {
        patient: { name: `Capstone Patient ${i}`, dobISO: '1980-01-01' },
        sourceText: { text: 'Test', source: 'anaesthetist' },
      })
      expect(out.ok).toBe(true)
    }
    const r = search(api, 'capstone')
    expect(r.total).toBe(60)
    expect(r.upcoming.length + r.past.length).toBe(BOOKING_SEARCH_CAP)
  })

  it('still finds a List the office just authorised (Mon 20 Jul PM, Alan Prentice)', () => {
    const api = store()
    expect(authoriseAsSimulatedOffice(api, SEED_LIST_IDS.souterMon20Pm).ok).toBe(true)
    const r = search(api, 'prentice')
    const monday = r.past.find((x) => x.listId === SEED_LIST_IDS.souterMon20Pm)
    expect(monday?.progress).toBe('invoiced')
    expect(r.past.some((x) => x.dateISO === '2026-06-04')).toBe(true)
    expect(mainViewFor(api.getState(), ANAE.souter, TODAY, MONTH_END).earlier.some((l) => l.id === SEED_LIST_IDS.souterMon20Pm)).toBe(false)
  })

  it('returns nothing for empty, too-short and unmatched queries', () => {
    const api = store()
    expect(search(api, '').total).toBe(0)
    expect(search(api, 'a').query.kind).toBe('tooShort')
    expect(search(api, 'zzz9999').total).toBe(0)
  })

  it('a Booking moved to a colleague\'s List is theirs, not hers', () => {
    const api = store()
    const july = search(api, 'mitchell').upcoming[0]!
    const colleagueList = Object.values(api.getState().schedule.lists).find((l) => l.state === 'ACTIVE' && l.anaesthetistId === ANAE.morrison)!
    api.setState((st) => ({
      schedule: { ...st.schedule, bookings: { ...st.schedule.bookings, [july.bookingId]: { ...st.schedule.bookings[july.bookingId]!, listId: colleagueList.id } } },
    }))
    expect(search(api, 'mitchell').upcoming).toHaveLength(0)
  })

  it('is deterministic', () => {
    expect(search(store(), 'mitchell')).toEqual(search(store(), 'mitchell'))
  })
})

describe('the date lookup (US-03.1.6)', () => {
  it('lookbackBoundsFor runs from January 2026 to the schedule horizon', () => {
    const b = lookbackBoundsFor(store().getState(), ANAE.souter)
    expect(b.firstISO).toBe('2026-01-12')
    expect(b.lastISO > TODAY).toBe(true)
  })

  it('listsOnDayFor reads the backdrop List on 13 March 2026, invoiced, with its three Bookings', () => {
    const day = listsOnDayFor(store().getState(), ANAE.souter, SEED_LOOKBACK.dateISO, TODAY)
    expect(day).toHaveLength(1)
    expect(day[0]).toMatchObject({ progress: 'invoiced' })
    expect(day[0]!.list.id).toBe(SEED_LOOKBACK.listId)
    expect(day[0]!.bookings.map((b) => b.patientName)).toContain('Sarah Mitchell')
    expect(day[0]!.bookings.every((b) => b.procedureNames.length > 0 && b.scheduledTime !== undefined)).toBe(true)
  })

  it('listsOnDayFor shows Mon 20 Jul AM before PM, submitted', () => {
    const day = listsOnDayFor(store().getState(), ANAE.souter, '2026-07-20', TODAY)
    expect(day.map((d) => [d.list.session, d.progress])).toEqual([
      ['AM', 'submitted'],
      ['PM', 'submitted'],
    ])
  })

  it('listDaysFor marks the March 2026 days that hold one of her Lists', () => {
    const days = listDaysFor(store().getState(), ANAE.souter, '2026-03')
    expect(days.map((d) => d.dateISO)).toEqual(['2026-03-03', '2026-03-10', '2026-03-13', '2026-03-18', '2026-03-24', '2026-03-27'])
    expect(days.every((d) => d.lists === 1)).toBe(true)
  })

  it('invoicesForListView lists the pinned List\'s invoices, paid', () => {
    const rows = invoicesForListView(store().getState(), SEED_LOOKBACK.listId)
    expect(rows).toHaveLength(3)
    expect(rows.every((r) => r.paid === 'paid' && r.party === "St George's")).toBe(true)
  })
})

describe('history survives the clock and the canvas', () => {
  const snapshot = (api: BoundAppStore) => {
    const s = api.getState()
    const lists = Object.values(s.schedule.lists).filter(isBackdropList)
    const listIds = new Set(lists.map((l) => l.id))
    const bookings = Object.values(s.schedule.bookings).filter((b) => listIds.has(b.listId))
    const bookingIds = new Set(bookings.map((b) => b.id))
    const procedures = Object.values(s.schedule.procedures).filter((p) => bookingIds.has(p.bookingId))
    return { lists, bookings, procedures }
  }

  it('Next morning, a 30-day jump, a recurring-booking edit and apply, a series save, a holiday, Add anaesthetist and a horizon change leave every backdrop record as seeded', () => {
    const api = store()
    const before = snapshot(api)
    expect(before.lists.length).toBe(25)

    advanceClockToNextMorning(api)
    const monday = Object.values(api.getState().masters.recurringBookings).find((r) => r.dayOfWeek === 1 && r.anaesthetistId === ANAE.souter)!
    expect(editRecurringBooking(api, OFFICE, monday.id, { hospitalId: HOSP.sx }).ok).toBe(true)
    expect(applyRecurringBookingsToCanvas(api, OFFICE).ok).toBe(true)
    expect(
      createAvailabilitySeries(api, SOUTER, {
        anaesthetistId: ANAE.souter,
        statusKey: 'unavailable',
        sessions: 'PM',
        weekdays: [5],
        everyWeeks: 2,
        startISO: '2026-08-07',
      }).ok,
    ).toBe(true)
    expect(addHospitalHoliday(api, OFFICE, HOSP.stg, '2026-08-14', 'Shutdown').ok).toBe(true)
    expect(
      addAnaesthetist(api, OFFICE, { registrationNumber: '99001', name: 'Dr Nadia Kerr', phone: '021 000 0000', email: 'n@example.test', unitValue: 25, gstPeriod: 'monthly', hpiId: '99KERN', startDateISO: '2026-08-12' } as never).ok,
    ).toBe(true)
    advanceClockDays(api, 30)
    // The horizon shortened and lengthened again.
    expect(setHorizonMonths(api, OFFICE, 2).ok).toBe(true)
    expect(setHorizonMonths(api, OFFICE, 6).ok).toBe(true)
    expect(snapshot(api)).toEqual(before)
  })

  it('un-authorised Lists that slid behind the canvas start stay in the earlier group', () => {
    const api = store()
    advanceClockDays(api, 30)
    const today = api.getState().clock.todayISO
    const earlier = mainViewFor(api.getState(), ANAE.souter, today, '2026-12-31').earlier.map((l) => l.id)
    expect(earlier).toContain(SEED_LIST_IDS.souterMon20Am)
    expect(earlier).toContain(SEED_LIST_IDS.souterMon20Pm)
    expect(search(api, 'mitchell').past.map((x) => x.dateISO)).toContain('2026-03-13')
  })

  it('Reset restores the seed', () => {
    const api = store()
    const before = snapshot(api)
    advanceClockDays(api, 30)
    resetDemo(api)
    expect(snapshot(api)).toEqual(before)
    expect(api.getState().clock.todayISO).toBe(TODAY)
  })
})


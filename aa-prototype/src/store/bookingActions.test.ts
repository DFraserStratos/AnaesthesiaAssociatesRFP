/**
 * Booking-creation guard tests (Phase 03) — createBooking dedupe + refusal matrix
 * and the completion gate a new Booking puts on its List. Every test
 * uses an isolated, non-persisted store seeded from buildSeed().
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { createBooking } from './bookingActions'
import { authoriseList, submitList } from './lifecycle'
import { bookingsForList, proceduresForBooking } from './selectors'
import type { Actor } from './mutate'
import { ANAE, PAT, SEED_MARKERS } from '../domain/seed'

const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}
const MORRISON: Actor = {
  who: 'Dr Kate Morrison',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.morrison,
}
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const SOUTER_PM = marker('designDayPmList')
const MORRISON_LIST = marker('submittedListMorrison')

function store(): BoundAppStore {
  return createAppStore()
}

describe('createBooking', () => {
  it('creates a Booking + first Procedure on an ACTIVE list, provisionally for a no-NHI patient', () => {
    const api = store()
    const patientsBefore = Object.keys(api.getState().masters.patients).length
    const bookingsBefore = bookingsForList(api.getState(), SOUTER_PM).length

    const outcome = createBooking(api, SOUTER, SOUTER_PM, {
      patient: { name: 'Ad Hoc Patient', dobISO: '1990-05-05' },
      operation: 'Diagnostic laparoscopy',
      rvgBaseCode: '20941',
      billingRoute: 'hospital',
      scheduledTime: '17:00',
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const state = api.getState()
    // A new provisional patient row was created (no NHI to match).
    expect(Object.keys(state.masters.patients).length).toBe(patientsBefore + 1)
    expect(bookingsForList(state, SOUTER_PM).length).toBe(bookingsBefore + 1)

    const booking = state.schedule.bookings[outcome.value.bookingId]
    expect(booking?.patientId).toBe(outcome.value.patientId)
    expect(booking?.completed).toBe(false)
    const procs = proceduresForBooking(state, outcome.value.bookingId)
    expect(procs).toHaveLength(1)
    expect(procs[0]?.isAdditional).toBe(false)
    expect(procs[0]?.billingRoute).toBe('hospital')

    const actions = state.audit.map((a) => a.action)
    expect(actions).toContain('booking.create')
    expect(actions).toContain('procedure.create')
  })

  it('reuses an existing patient by NHI (dedupe) rather than creating a duplicate', () => {
    const api = store()
    const patientsBefore = Object.keys(api.getState().masters.patients).length

    const outcome = createBooking(api, SOUTER, SOUTER_PM, {
      patient: { nhi: 'cqy9304', name: 'Sarah Mitchell', dobISO: '1988-04-12' },
      operation: 'Laparoscopic cholecystectomy',
      rvgBaseCode: '20941',
      billingRoute: 'hospital',
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    // No new patient row — the seeded Sarah Mitchell (PT0005) is reused.
    expect(Object.keys(api.getState().masters.patients).length).toBe(patientsBefore)
    expect(outcome.value.patientId).toBe(PAT.mitchell)
  })

  it('surfaces an invalid NHI verbatim and creates nothing', () => {
    const api = store()
    const bookingsBefore = Object.keys(api.getState().schedule.bookings).length
    const outcome = createBooking(api, SOUTER, SOUTER_PM, {
      patient: { nhi: 'AAA9999', name: 'Bad NHI', dobISO: '1990-01-01' },
      operation: 'Test',
      billingRoute: 'hospital',
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('invalidNhi')
    expect(Object.keys(api.getState().schedule.bookings).length).toBe(bookingsBefore)
  })

  it('refuses on a SUBMITTED list for the anaesthetist', () => {
    const api = store()
    const outcome = createBooking(api, MORRISON, MORRISON_LIST, {
      patient: { name: 'X', dobISO: '1990-01-01' },
      operation: 'Test',
      billingRoute: 'hospital',
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listSubmitted')
  })

  it('refuses a non-owned list', () => {
    const api = store()
    const outcome = createBooking(api, SOUTER, MORRISON_LIST, {
      patient: { name: 'X', dobISO: '1990-01-01' },
      operation: 'Test',
      billingRoute: 'hospital',
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('notOwnList')
  })

  it('refuses on an AUTHORISED list', () => {
    const api = store()
    // Authorise the Morrison SUBMITTED list first.
    expect(authoriseList(api, OFFICE, MORRISON_LIST).ok).toBe(true)
    const outcome = createBooking(api, OFFICE, MORRISON_LIST, {
      patient: { name: 'X', dobISO: '1990-01-01' },
      operation: 'Test',
      billingRoute: 'hospital',
    })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listAuthorised')
  })

  it('a new Booking holds its List back from submit until it is completed', () => {
    // A new Booking starts incomplete; the completion-gated submit must refuse.
    // Souter's AM list is all complete before it lands.
    const api = store()
    const amList = marker('designDayAmList')
    const outcome = createBooking(api, SOUTER, amList, {
      patient: { name: 'Ad Hoc Patient', dobISO: '1990-05-05' },
      operation: 'Diagnostic laparoscopy',
      rvgBaseCode: '20941',
      billingRoute: 'hospital',
      scheduledTime: '11:30',
    })
    expect(outcome.ok).toBe(true)
    const submit = submitList(api, SOUTER, amList)
    expect(submit.ok).toBe(false)
    if (!submit.ok) expect(submit.code).toBe('bookingsNotCompleted')
  })
})

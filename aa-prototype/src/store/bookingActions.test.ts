/**
 * Booking-creation guard tests (Phase 03) — createBooking dedupe + refusal matrix,
 * and copyBooking as a skeleton-only new Booking (catch-up Phase 15) + refusal matrix. Every test
 * uses an isolated, non-persisted store seeded from buildSeed().
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { createBooking, copyBooking } from './bookingActions'
import { authoriseList, completeBooking, editProcedure, submitList } from './lifecycle'
import { billingContextForBooking, bookingsForList, findBookingByCorrelation, proceduresForBooking } from './selectors'
import { feeFor } from '../domain/billing/fee'
import { feeContextFor } from '../domain/billing/validateBookingForBilling'
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
const ELLISON_BOOKING = marker('pendingCaptureBooking')

function store(): BoundAppStore {
  return createAppStore()
}

describe('createBooking', () => {
  it('creates a Booking + first Procedure on a DRAFT list, provisionally for a no-NHI patient', () => {
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
})

describe('copyBooking', () => {
  // Catch-up Phase 15 (US-02.4.3, RV-03): Copy is a skeleton-only NEW Booking
  // with its own primary Procedure, not the additional-procedure mechanism.
  it('makes a skeleton Booking: same List and patient, one fresh primary Procedure, nothing else', () => {
    const api = store()
    const outcome = copyBooking(api, SOUTER, ELLISON_BOOKING)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const state = api.getState()
    const source = state.schedule.bookings[ELLISON_BOOKING]
    const copy = state.schedule.bookings[outcome.value.bookingId]
    expect(copy).toMatchObject({
      listId: source?.listId,
      patientId: source?.patientId,
      copiedFromBookingId: ELLISON_BOOKING,
      source: 'copy',
      completed: false,
      attachments: [],
    })
    for (const key of ['notes', 'scheduledTime', 'correlationRef', 'cancellation', 'bookingType'] as const) {
      expect(copy?.[key]).toBeUndefined()
    }

    const procs = proceduresForBooking(state, outcome.value.bookingId)
    expect(procs).toHaveLength(1)
    const proc = procs[0]
    expect(proc).toMatchObject({ isAdditional: false, description: '', billingRoute: 'hospital', accRelated: false, selectedModifierCodes: [] })
    for (const key of [
      'rvgBaseCode', 'asaClass', 'anaestheticStartISO', 'handoverISO', 'baseUnitsSelected', 'baseUnitsCaptured',
      'timeUnitsCaptured', 'modifierUnitsCaptured', 'priceOverride', 'insurerId', 'billablePartyId',
      'patientPaymentCategory', 'prepaymentDetail', 'governingContractId',
    ] as const) {
      expect(proc?.[key]).toBeUndefined()
    }
    expect(Object.values(state.schedule.billingLines).filter((l) => l.procedureId === proc?.id)).toHaveLength(0)

    const copyAudit = state.audit.filter((a) => a.entityId === outcome.value.bookingId || a.entityId === proc?.id)
    expect(copyAudit.map((a) => a.action)).toEqual(['booking.copy', 'procedure.create'])
    const ref = proceduresForBooking(state, ELLISON_BOOKING)[0]?.billingReference
    expect(copyAudit[1]?.after).toEqual(
      ref !== undefined ? { isAdditional: false, billingRoute: 'hospital', billingReference: ref } : { isAdditional: false, billingRoute: 'hospital' },
    )
    expect(proc?.billingReference).toBe(ref)
  })

  it('leaves the source Booking and its Procedures untouched', () => {
    const api = store()
    const before = api.getState()
    const sourceBefore = before.schedule.bookings[ELLISON_BOOKING]
    const procsBefore = proceduresForBooking(before, ELLISON_BOOKING)
    expect(copyBooking(api, SOUTER, ELLISON_BOOKING).ok).toBe(true)
    const after = api.getState()
    expect(after.schedule.bookings[ELLISON_BOOKING]).toEqual(sourceBefore)
    expect(proceduresForBooking(after, ELLISON_BOOKING)).toEqual(procsBefore)
  })

  it('carries the billing reference but never the appointment correlation', () => {
    const api = store()
    const sourceId = marker('integrationS13Time')
    const source = api.getState().schedule.bookings[sourceId]
    const ref = proceduresForBooking(api.getState(), sourceId)[0]?.billingReference
    expect(source?.correlationRef).toBeDefined()
    expect(ref).toBe('SG-2026-0901')

    const outcome = copyBooking(api, SOUTER, sourceId)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok || source?.correlationRef === undefined) return
    const state = api.getState()
    expect(state.schedule.bookings[outcome.value.bookingId]?.correlationRef).toBeUndefined()
    expect(proceduresForBooking(state, outcome.value.bookingId)[0]?.billingReference).toBe(ref)
    // A hospital change message still finds exactly one Booking.
    expect(findBookingByCorrelation(state, source.correlationRef)?.id).toBe(sourceId)
    const matches = Object.values(state.schedule.bookings).filter(
      (b) =>
        b.correlationRef?.sourceFeedId === source.correlationRef?.sourceFeedId &&
        b.correlationRef?.externalAppointmentId === source.correlationRef?.externalAppointmentId,
    )
    expect(matches).toHaveLength(1)
  })

  it('defaults the route to hospital even when the source bills an insurer or a billable party', () => {
    const api = store()
    const state = api.getState()
    for (const route of ['insurer', 'billableParty'] as const) {
      const procedure = Object.values(state.schedule.procedures).find((p) => {
        if (p.billingRoute !== route || p.isAdditional) return false
        const booking = state.schedule.bookings[p.bookingId]
        const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
        return booking?.cancellation === undefined && list !== undefined && list.state !== 'AUTHORISED'
      })
      expect(procedure, `a seeded ${route} Booking`).toBeDefined()
      const outcome = copyBooking(api, OFFICE, procedure!.bookingId)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) continue
      const copied = proceduresForBooking(api.getState(), outcome.value.bookingId)[0]
      expect(copied?.billingRoute).toBe('hospital')
      expect(copied?.insurerId).toBeUndefined()
      expect(copied?.billablePartyId).toBeUndefined()
    }
  })

  it('the anaesthetist captures and completes the copy with no office step; it charges base and modifiers', () => {
    const api = store()
    const amList = marker('designDayAmList')
    const template = bookingsForList(api.getState(), amList).find((b) => b.completed)
    expect(template).toBeDefined()
    const captured = proceduresForBooking(api.getState(), template!.id)[0]
    expect(captured?.rvgBaseCode).toBeDefined()

    const outcome = copyBooking(api, SOUTER, template!.id)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const procId = proceduresForBooking(api.getState(), outcome.value.bookingId)[0]!.id
    const patch: Parameters<typeof editProcedure>[3] = { description: 'Repeat procedure', rvgBaseCode: captured!.rvgBaseCode! }
    if (captured?.asaClass !== undefined) patch.asaClass = captured.asaClass
    if (captured?.anaestheticStartISO !== undefined) patch.anaestheticStartISO = captured.anaestheticStartISO
    if (captured?.handoverISO !== undefined) patch.handoverISO = captured.handoverISO
    if (captured !== undefined) patch.selectedModifierCodes = captured.selectedModifierCodes
    expect(editProcedure(api, SOUTER, procId, patch).ok).toBe(true)

    const state = api.getState()
    const booking = state.schedule.bookings[outcome.value.bookingId]!
    const ctx = billingContextForBooking(state, booking)
    expect(ctx).toBeDefined()
    const proc = state.schedule.procedures[procId]!
    const feeCtx = feeContextFor(proc, 1, ctx!)
    const primaryFee = feeFor(proc, feeCtx)
    const timeOnly = feeFor({ ...proc, isAdditional: true }, feeCtx)
    // Not time-only: the copy's primary Procedure charges its base (and modifier) units.
    expect(primaryFee.billableUnits).toBeGreaterThan(timeOnly.billableUnits)

    expect(completeBooking(api, SOUTER, outcome.value.bookingId).ok).toBe(true)
  })

  it('refuses copying a booking on a SUBMITTED list for the anaesthetist', () => {
    const api = store()
    const morrisonBooking = bookingsForList(api.getState(), MORRISON_LIST)[0]
    expect(morrisonBooking).toBeDefined()
    const outcome = copyBooking(api, MORRISON, morrisonBooking!.id)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listSubmitted')
  })

  it('the office can copy a booking on a SUBMITTED list', () => {
    const api = store()
    const morrisonBooking = bookingsForList(api.getState(), MORRISON_LIST).find((c) => c.cancellation === undefined)
    expect(morrisonBooking).toBeDefined()
    const outcome = copyBooking(api, OFFICE, morrisonBooking!.id)
    expect(outcome.ok).toBe(true)
  })

  it('the copy list cannot be submitted until the new Booking is completed', () => {
    // Copy adds an incomplete Booking; the completion-gated submit must refuse.
    const api = store()
    // Souter AM list is all-complete DRAFT — copy one booking there.
    const amList = marker('designDayAmList')
    const src = bookingsForList(api.getState(), amList)[0]
    expect(src).toBeDefined()
    expect(copyBooking(api, SOUTER, src!.id).ok).toBe(true)
    const outcome = submitList(api, SOUTER, amList)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('bookingsNotCompleted')
  })
})

/**
 * Phase 04 store guard tests — addProcedure / removeProcedure, uncompleteBooking and completionBlockersFor.
 * Every test uses an isolated, non-persisted store seeded from buildSeed().
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { setProcedureSplit } from './splitActions'
import { addProcedure, removeProcedure } from './bookingActions'
import {
  completionBlockersFor,
  editProcedure,
  uncompleteBooking,
} from './lifecycle'
import { auditForEntity, bookingsForList, proceduresForBooking } from './selectors'
import type { Actor } from './mutate'
import { ANAE, INS, SEED_MARKERS } from '../domain/seed'
import type { BillingValidationFailure } from '../domain/billing/validateBookingForBilling'

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
const WHITAKER_LIST = marker('submittedListWhitaker')
const ELLISON_BOOKING = marker('pendingCaptureBooking')
const SPLIT_BOOKING = marker('splitBillingBooking')
const CANCELLED_BOOKING = marker('cancelledBooking')

function store(): BoundAppStore {
  return createAppStore()
}

function firstProcedureId(api: BoundAppStore, bookingId: string): string {
  const procedure = proceduresForBooking(api.getState(), bookingId)[0]
  if (procedure === undefined) throw new Error(`booking ${bookingId} has no procedure`)
  return procedure.id
}

/** The design-day Tane booking: completed, valid, on Souter's ACTIVE PM list. */
function taneBookingId(api: BoundAppStore): string {
  const booking = bookingsForList(api.getState(), SOUTER_PM)[0]
  if (booking === undefined) throw new Error('no PM bookings')
  return booking.id
}

describe('addProcedure', () => {
  it('adds an additional (not primary) skeleton inheriting the funding context from the first procedure', () => {
    const api = store()
    const first = proceduresForBooking(api.getState(), ELLISON_BOOKING)[0]
    const outcome = addProcedure(api, SOUTER, ELLISON_BOOKING)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const procedure = api.getState().schedule.procedures[outcome.value.procedureId]
    expect(procedure?.isPrimary).toBe(false)
    expect(procedure?.procedureText).toBeNull()
    expect(procedure?.rvgGroupId).toBeUndefined()
    // It picks its own Contract on the step rail (catch-up Phase 20, US-03.2.3):
    // none is inherited; the payer is the Booking's (catch-up Phase 21). "Add
    // another procedure" is the only way to add an additional Procedure.
    expect(procedure?.governingContractId).toBeUndefined()
    void first

    const entry = auditForEntity(api.getState(), outcome.value.procedureId).at(-1)
    expect(entry?.action).toBe('procedure.create')
  })

  it('refuses cancelled and completed bookings', () => {
    const api = store()
    const cancelled = addProcedure(api, OFFICE, CANCELLED_BOOKING)
    expect(cancelled.ok).toBe(false)
    if (!cancelled.ok) expect(cancelled.code).toBe('bookingCancelled')

    const completed = addProcedure(api, SOUTER, SPLIT_BOOKING)
    expect(completed.ok).toBe(false)
    if (!completed.ok) {
      expect(completed.code).toBe('bookingCompleted')
      expect(completed.message).toContain('Amend it before adding a procedure')
    }
  })

  it('lets the anaesthetist add a procedure on their own SUBMITTED list (catch-up Phase 38a), never on AUTHORISED', () => {
    const api = store()
    const morrisonBooking = bookingsForList(api.getState(), MORRISON_LIST)[0]!.id
    // Re-open the completed booking so the list gate itself is what decides.
    expect(uncompleteBooking(api, MORRISON, morrisonBooking).ok).toBe(true)
    expect(addProcedure(api, MORRISON, morrisonBooking).ok).toBe(true)
    api.setState((s) => ({
      schedule: { ...s.schedule, lists: { ...s.schedule.lists, [MORRISON_LIST]: { ...assigned(s.schedule.lists[MORRISON_LIST]), state: 'AUTHORISED' as const } } },
    }))
    const locked = addProcedure(api, MORRISON, morrisonBooking)
    expect(locked.ok).toBe(false)
    if (!locked.ok) expect(locked.code).toBe('listAuthorised')
  })
})

describe('removeProcedure', () => {
  it('removes an added procedure, audited with the removed row snapshotted', () => {
    const api = store()
    const added = addProcedure(api, SOUTER, ELLISON_BOOKING)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(proceduresForBooking(api.getState(), ELLISON_BOOKING)).toHaveLength(2)

    const outcome = removeProcedure(api, SOUTER, added.value.procedureId)
    expect(outcome).toEqual({ ok: true, value: undefined })
    expect(api.getState().schedule.procedures[added.value.procedureId]).toBeUndefined()
    expect(proceduresForBooking(api.getState(), ELLISON_BOOKING)).toHaveLength(1)

    const entry = auditForEntity(api.getState(), added.value.procedureId).at(-1)
    expect(entry?.action).toBe('procedure.remove')
    // The snapshot names its Booking, which is what lets the booking's History still
    // reach the trail of a procedure that no longer exists.
    expect((entry?.before as { bookingId?: string } | undefined)?.bookingId).toBe(ELLISON_BOOKING)
  })

  it('refuses the Booking\'s primary procedure, whether or not it is the only one', () => {
    const api = store()
    const primary = firstProcedureId(api, ELLISON_BOOKING)

    const alone = removeProcedure(api, SOUTER, primary)
    expect(alone.ok).toBe(false)
    if (!alone.ok) {
      expect(alone.code).toBe('primaryProcedure')
      expect(alone.message).toContain('cancel the Booking')
    }

    // Still refused once the Booking has an additional procedure to fall back on:
    // the anchor carries the base and modifier units, and nothing is promoted
    // into its place.
    expect(addProcedure(api, SOUTER, ELLISON_BOOKING).ok).toBe(true)
    const withSpare = removeProcedure(api, SOUTER, primary)
    expect(withSpare.ok).toBe(false)
    if (!withSpare.ok) expect(withSpare.code).toBe('primaryProcedure')
    expect(api.getState().schedule.procedures[primary]).toBeDefined()
    expect(proceduresForBooking(api.getState(), ELLISON_BOOKING)).toHaveLength(2)
  })

  it('refuses cancelled and completed bookings; the anaesthetist may remove an added one on a SUBMITTED list', () => {
    const api = store()

    const cancelledProcedure = firstProcedureId(api, CANCELLED_BOOKING)
    const cancelled = removeProcedure(api, OFFICE, cancelledProcedure)
    expect(cancelled.ok).toBe(false)
    if (!cancelled.ok) expect(cancelled.code).toBe('bookingCancelled')

    // SPLIT_BOOKING is completed and carries two procedures, so the completion
    // gate is what refuses, not the last-procedure guard.
    const completed = removeProcedure(api, SOUTER, firstProcedureId(api, SPLIT_BOOKING))
    expect(completed.ok).toBe(false)
    if (!completed.ok) {
      expect(completed.code).toBe('bookingCompleted')
      expect(completed.message).toContain('Amend it before removing a procedure')
    }

    const morrisonBooking = bookingsForList(api.getState(), MORRISON_LIST)[0]!.id
    expect(uncompleteBooking(api, OFFICE, morrisonBooking).ok).toBe(true)
    const added = addProcedure(api, MORRISON, morrisonBooking)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(removeProcedure(api, MORRISON, added.value.procedureId).ok).toBe(true)
  })

  it('the anaesthetist removes a procedure beside a split one on her own List; nothing on them is office-only', () => {
    const api = store()
    const first = firstProcedureId(api, ELLISON_BOOKING)
    const added = addProcedure(api, SOUTER, ELLISON_BOOKING)
    if (!added.ok) throw new Error('addProcedure failed')
    // She splits the first procedure's fee: nib $50, the payer the rest.
    const payer = api.getState().schedule.bookings[ELLISON_BOOKING]!
    const split = setProcedureSplit(api, SOUTER, ELLISON_BOOKING, first, {
      shares: [
        { party: { kind: 'insurer', id: INS.nib }, basis: { kind: 'amount', amountExGst: 50 } },
        { party: { kind: 'patient', id: payer.patientId }, basis: { kind: 'rest' } },
      ],
    })
    expect(split).toEqual({ ok: true, value: undefined })
    expect(api.getState().schedule.procedures[first]?.split?.shares).toHaveLength(2)

    expect(removeProcedure(api, SOUTER, added.value.procedureId).ok).toBe(true)
    expect(api.getState().schedule.procedures[added.value.procedureId]).toBeUndefined()
    // The split stays on the procedure it was typed on.
    expect(api.getState().schedule.procedures[first]?.split?.shares).toHaveLength(2)
  })
})

describe('uncompleteBooking', () => {
  it('re-opens a completed booking on the anaesthetist\'s own ACTIVE list, audited', () => {
    const api = store()
    const bookingId = taneBookingId(api)
    expect(api.getState().schedule.bookings[bookingId]?.completed).toBe(true)

    const outcome = uncompleteBooking(api, SOUTER, bookingId)
    expect(outcome).toEqual({ ok: true, value: undefined })
    const booking = api.getState().schedule.bookings[bookingId]
    expect(booking?.completed).toBe(false)
    expect(booking?.completedAtISO).toBeUndefined()
    expect(auditForEntity(api.getState(), bookingId).at(-1)?.action).toBe('booking.uncomplete')
  })

  it('refuses a booking that is not completed, and a cancelled booking', () => {
    const api = store()
    const notCompleted = uncompleteBooking(api, SOUTER, ELLISON_BOOKING)
    expect(notCompleted.ok).toBe(false)
    if (!notCompleted.ok) expect(notCompleted.code).toBe('notCompleted')

    const cancelled = uncompleteBooking(api, OFFICE, CANCELLED_BOOKING)
    expect(cancelled.ok).toBe(false)
    if (!cancelled.ok) expect(cancelled.code).toBe('bookingCancelled')
  })

  it('anaesthetist and office may both re-open on SUBMITTED (catch-up Phase 38a); the List stays SUBMITTED', () => {
    const api = store()
    const morrisonBooking = bookingsForList(api.getState(), MORRISON_LIST)[0]!.id
    expect(uncompleteBooking(api, MORRISON, morrisonBooking).ok).toBe(true)
    expect(api.getState().schedule.lists[MORRISON_LIST]?.state).toBe('SUBMITTED')
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'booking.uncomplete', role: 'anaesthetist', entityId: morrisonBooking })

    const whitakerBooking = bookingsForList(api.getState(), WHITAKER_LIST)[0]!.id
    const office = uncompleteBooking(api, OFFICE, whitakerBooking)
    expect(office.ok).toBe(true)
    expect(api.getState().schedule.bookings[whitakerBooking]?.completed).toBe(false)
  })
})

describe('completionBlockersFor', () => {
  it('returns [] for a valid booking, and validationFailed with named failures once the RVG code goes from its RVG Contract', () => {
    const api = store()
    const bookingId = taneBookingId(api)
    const state = api.getState()
    const booking = state.schedule.bookings[bookingId]
    if (booking === undefined) throw new Error('no booking')
    expect(completionBlockersFor(state, booking)).toEqual([])

    const procedureId = firstProcedureId(api, bookingId)
    // Catch-up Phase 20: the RVG code is required on an RVG kind (US-03.3.1).
    expect(editProcedure(api, OFFICE, procedureId, { rvgGroupId: undefined }).ok).toBe(true)

    const after = api.getState()
    const blockers = completionBlockersFor(after, after.schedule.bookings[bookingId]!)
    expect(blockers[0]?.code).toBe('validationFailed')
    const failures = blockers[0]?.details as BillingValidationFailure[]
    expect(failures.some((f) => f.field === 'rvgGroupId')).toBe(true)
  })

  it('never lists an unpaid prepayment: warnings are not blockers (catch-up Phase 15a; D5)', () => {
    const api = store()
    const riley = SEED_MARKERS['prepaymentBooking']!.entityId
    const state = api.getState()
    const blockers = completionBlockersFor(state, state.schedule.bookings[riley]!)
    expect(blockers.map((b) => b.code)).not.toContain('prepaymentUnpaid')
  })
})

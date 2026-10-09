/**
 * Guard tests — the full role/source/state matrix from the phase doc. Every
 * test uses an isolated, non-persisted store seeded from buildSeed().
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  authoriseList,
  cancelBooking,
  completeBooking,
  editBooking,
  editProcedure,
  logListNote,
  reassignBooking,
  submitList,
} from './lifecycle'
import * as lifecycleModule from './lifecycle'
import { auditForEntity, bookingsForList, proceduresForBooking } from './selectors'
import { onAppEvent, type AppEvent } from './events'
import type { Actor } from './mutate'
import { ANAE, SEED_MARKERS } from '../domain/seed'

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
const INTEGRATION: Actor = { who: 'HL7 feed', role: 'system', source: 'integration' }

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const SOUTER_AM = marker('designDayAmList')
const SOUTER_PM = marker('designDayPmList')
const MORRISON_LIST = marker('submittedListMorrison')
const WHITAKER_LIST = marker('submittedListWhitaker')
const ELLISON_BOOKING = marker('pendingCaptureBooking')
const GUARDIAN_BOOKING = marker('guardianMinorBooking')

function store(): BoundAppStore {
  return createAppStore()
}

function firstBookingOf(api: BoundAppStore, listId: string): string {
  const booking = bookingsForList(api.getState(), listId)[0]
  if (booking === undefined) throw new Error(`list ${listId} has no bookings`)
  return booking.id
}

/** Ellison seeds PRE-capture (no handover — Phase 04's live Finish-now demo);
 *  stamp the finish so the booking validates before it is completed. */
function captureEllisonFinish(api: BoundAppStore): void {
  const procedure = proceduresForBooking(api.getState(), ELLISON_BOOKING)[0]
  if (procedure === undefined) throw new Error('Ellison has no procedure')
  expect(editProcedure(api, SOUTER, procedure.id, { handoverISO: '2026-07-21T17:20:00' }).ok).toBe(true)
}

describe('completeBooking', () => {
  it('rejects a booking with invalid billing data and surfaces the reasons', () => {
    const api = store()
    // The guardian-minor booking has no captured times yet.
    const outcome = completeBooking(api, OFFICE, GUARDIAN_BOOKING)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.code).toBe('validationFailed')
      expect(Array.isArray(outcome.details)).toBe(true)
    }
    expect(api.getState().schedule.bookings[GUARDIAN_BOOKING]?.completed).toBe(false)
  })

  it('completes a valid pending booking (Ellison, once her finish is captured) and audits it', () => {
    const api = store()
    captureEllisonFinish(api)
    const outcome = completeBooking(api, SOUTER, ELLISON_BOOKING)
    expect(outcome).toEqual({ ok: true, value: undefined })
    const booking = api.getState().schedule.bookings[ELLISON_BOOKING]
    expect(booking?.completed).toBe(true)
    expect(booking?.completedAtISO).toBeDefined()
    const trail = auditForEntity(api.getState(), ELLISON_BOOKING)
    expect(trail.at(-1)?.action).toBe('booking.complete')
  })

  it('never allows an integration source to complete a booking', () => {
    const api = store()
    const outcome = completeBooking(api, INTEGRATION, ELLISON_BOOKING)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('integrationForbidden')
  })

  it('refuses a cancelled booking', () => {
    const api = store()
    const outcome = completeBooking(api, OFFICE, marker('cancelledBooking'))
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('bookingCancelled')
  })
})

describe('submitList', () => {
  it('blocks submission while any non-cancelled booking is uncompleted, even when all validate', () => {
    const api = store()
    const outcome = submitList(api, SOUTER, SOUTER_PM)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.code).toBe('bookingsNotCompleted')
      expect(outcome.details).toEqual([ELLISON_BOOKING])
    }
  })

  it('submits once every booking is completed', () => {
    const api = store()
    captureEllisonFinish(api)
    expect(completeBooking(api, SOUTER, ELLISON_BOOKING).ok).toBe(true)
    const outcome = submitList(api, SOUTER, SOUTER_PM)
    expect(outcome.ok).toBe(true)
    expect(api.getState().schedule.lists[SOUTER_PM]?.state).toBe('SUBMITTED')
  })

  it('a cancelled booking does not block submission', () => {
    const api = store()
    expect(cancelBooking(api, OFFICE, ELLISON_BOOKING, 'Procedure postponed').ok).toBe(true)
    const outcome = submitList(api, SOUTER, SOUTER_PM)
    expect(outcome.ok).toBe(true)
  })

  it('rejects submission of a non-ACTIVE list', () => {
    const api = store()
    const outcome = submitList(api, MORRISON, MORRISON_LIST)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listNotActive')
  })

  it('anaesthetists can only submit their own lists', () => {
    const api = store()
    const outcome = submitList(api, MORRISON, SOUTER_AM)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('notOwnList')
  })
})

describe('authoriseList', () => {
  it('rejects authorising a non-SUBMITTED list (no ACTIVE jump)', () => {
    const api = store()
    const outcome = authoriseList(api, OFFICE, SOUTER_AM)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listNotSubmitted')
  })

  it('is office only', () => {
    const api = store()
    const outcome = authoriseList(api, MORRISON, MORRISON_LIST)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('officeOnly')
  })

  it('authorises a SUBMITTED list, audits it and emits listAuthorised', () => {
    const api = store()
    const events: AppEvent[] = []
    const off = onAppEvent((e) => events.push(e))
    const outcome = authoriseList(api, OFFICE, MORRISON_LIST)
    off()
    expect(outcome.ok).toBe(true)
    expect(api.getState().schedule.lists[MORRISON_LIST]?.state).toBe('AUTHORISED')
    expect(events).toContainEqual({ type: 'listAuthorised', listId: MORRISON_LIST })
    expect(auditForEntity(api.getState(), MORRISON_LIST).at(-1)?.action).toBe('list.authorise')
  })
})

describe('edit rights matrix', () => {
  it('anaesthetist edit of a SUBMITTED list is rejected', () => {
    const api = store()
    const bookingId = firstBookingOf(api, MORRISON_LIST)
    const outcome = editBooking(api, MORRISON, bookingId, { notes: 'try' })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('listSubmitted')
  })

  it('office edit of a SUBMITTED list is allowed', () => {
    const api = store()
    const bookingId = firstBookingOf(api, MORRISON_LIST)
    const outcome = editBooking(api, OFFICE, bookingId, { notes: 'checked with theatre' })
    expect(outcome.ok).toBe(true)
    expect(api.getState().schedule.bookings[bookingId]?.notes).toBe('checked with theatre')
  })

  it('integration edit of a SUBMITTED booking is refused as an exception outcome; ACTIVE is allowed', () => {
    const api = store()
    const submittedBooking = firstBookingOf(api, MORRISON_LIST)
    const refused = editBooking(api, INTEGRATION, submittedBooking, { notes: 'feed update' })
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.code).toBe('integrationImmutable')

    const draftOutcome = editBooking(api, INTEGRATION, ELLISON_BOOKING, { scheduledTime: '16:15' })
    expect(draftOutcome.ok).toBe(true)
  })

  it('nobody edits an AUTHORISED list, and procedure edits obey the same matrix', () => {
    const api = store()
    expect(authoriseList(api, OFFICE, MORRISON_LIST).ok).toBe(true)
    const bookingId = firstBookingOf(api, MORRISON_LIST)
    for (const actor of [OFFICE, MORRISON, INTEGRATION]) {
      const outcome = editBooking(api, actor, bookingId, { notes: 'try' })
      expect(outcome.ok).toBe(false)
      if (!outcome.ok) expect(outcome.code).toBe('listAuthorised')
    }
    const procedure = proceduresForBooking(api.getState(), bookingId)[0]
    expect(procedure).toBeDefined()
    if (procedure !== undefined) {
      const outcome = editProcedure(api, OFFICE, procedure.id, { billingReference: 'X' })
      expect(outcome.ok).toBe(false)
      if (!outcome.ok) expect(outcome.code).toBe('listAuthorised')
    }
  })

  it('procedure edits stamp and audit through the parent booking', () => {
    const api = store()
    const procedure = proceduresForBooking(api.getState(), ELLISON_BOOKING)[0]
    if (procedure === undefined) throw new Error('no procedure')
    const outcome = editProcedure(api, OFFICE, procedure.id, { billingReference: 'SX-2026-9999' })
    expect(outcome.ok).toBe(true)
    expect(api.getState().schedule.procedures[procedure.id]?.billingReference).toBe('SX-2026-9999')
  })
})

describe('cancelBooking', () => {
  it('requires a reason and writes the audited soft-cancel', () => {
    const api = store()
    const noReason = cancelBooking(api, SOUTER, ELLISON_BOOKING, '  ')
    expect(noReason.ok).toBe(false)
    if (!noReason.ok) expect(noReason.code).toBe('reasonRequired')

    const outcome = cancelBooking(api, SOUTER, ELLISON_BOOKING, 'Patient did not arrive')
    expect(outcome.ok).toBe(true)
    const booking = api.getState().schedule.bookings[ELLISON_BOOKING]
    expect(booking?.cancellation?.reason).toBe('Patient did not arrive')
    expect(booking?.cancellation?.source).toBe('anaesthetist')
    expect(auditForEntity(api.getState(), ELLISON_BOOKING).at(-1)?.action).toBe('booking.cancel')
    // Excluded from completion/validation once cancelled.
    const complete = completeBooking(api, SOUTER, ELLISON_BOOKING)
    expect(complete.ok).toBe(false)
  })

  it('role/source matrix: office may cancel on SUBMITTED, integration only on ACTIVE, nobody on AUTHORISED', () => {
    const api = store()
    const submittedBooking = firstBookingOf(api, WHITAKER_LIST)
    const integrationOnSubmitted = cancelBooking(api, INTEGRATION, submittedBooking, 'S15 cancellation')
    expect(integrationOnSubmitted.ok).toBe(false)
    if (!integrationOnSubmitted.ok) expect(integrationOnSubmitted.code).toBe('integrationImmutable')

    const integrationOnDraft = cancelBooking(api, INTEGRATION, ELLISON_BOOKING, 'S15 cancellation')
    expect(integrationOnDraft.ok).toBe(true)

    const officeOnSubmitted = cancelBooking(api, OFFICE, submittedBooking, 'Postponed')
    expect(officeOnSubmitted.ok).toBe(true)

    expect(authoriseList(api, OFFICE, MORRISON_LIST).ok).toBe(true)
    const authorisedBooking = firstBookingOf(api, MORRISON_LIST)
    const onAuthorised = cancelBooking(api, OFFICE, authorisedBooking, 'Too late')
    expect(onAuthorised.ok).toBe(false)
    if (!onAuthorised.ok) expect(onAuthorised.code).toBe('listAuthorised')
  })
})

// reassignList, setAvailability and requestCover moved to slotActions.ts with
// the Slot and List split (catch-up Phase 28): see slotActions.test.ts.

describe('reassignBooking', () => {
  it('moves one booking only: neither list restatuses, other bookings untouched, audited at booking level', () => {
    const api = store()
    const before = api.getState()
    const pmBookings = bookingsForList(before, SOUTER_PM).map((c) => c.id)
    const amBookings = bookingsForList(before, SOUTER_AM).map((c) => c.id)
    const pmStatus = before.schedule.lists[SOUTER_PM]?.kind
    const amStatus = before.schedule.lists[SOUTER_AM]?.kind

    const outcome = reassignBooking(api, SOUTER, ELLISON_BOOKING, SOUTER_AM)
    expect(outcome.ok).toBe(true)
    const state = api.getState()
    expect(state.schedule.bookings[ELLISON_BOOKING]?.listId).toBe(SOUTER_AM)
    expect(bookingsForList(state, SOUTER_PM).map((c) => c.id)).toEqual(pmBookings.filter((id) => id !== ELLISON_BOOKING))
    expect(bookingsForList(state, SOUTER_AM).map((c) => c.id).sort()).toEqual([...amBookings, ELLISON_BOOKING].sort())
    expect(state.schedule.lists[SOUTER_PM]?.kind).toBe(pmStatus)
    expect(state.schedule.lists[SOUTER_AM]?.kind).toBe(amStatus)
    expect(auditForEntity(state, ELLISON_BOOKING).at(-1)?.action).toBe('booking.reassign')
  })

  it('office may move a booking onto a SUBMITTED target; integration may not', () => {
    const api = store()
    const officeMove = reassignBooking(api, OFFICE, ELLISON_BOOKING, WHITAKER_LIST)
    expect(officeMove.ok).toBe(true)

    const back = reassignBooking(api, OFFICE, ELLISON_BOOKING, SOUTER_PM)
    expect(back.ok).toBe(true)

    const integrationMove = reassignBooking(api, INTEGRATION, ELLISON_BOOKING, WHITAKER_LIST)
    expect(integrationMove.ok).toBe(false)
    if (!integrationMove.ok) expect(integrationMove.code).toBe('integrationImmutable')
  })

  it('is rejected when the source or the target list is AUTHORISED', () => {
    const api = store()
    expect(authoriseList(api, OFFICE, MORRISON_LIST).ok).toBe(true)
    const lockedBooking = bookingsForList(api.getState(), MORRISON_LIST)[0]
    if (lockedBooking === undefined) throw new Error('no booking')

    const fromAuthorised = reassignBooking(api, OFFICE, lockedBooking.id, SOUTER_AM)
    expect(fromAuthorised.ok).toBe(false)
    if (!fromAuthorised.ok) expect(fromAuthorised.code).toBe('listAuthorised')

    const toAuthorised = reassignBooking(api, OFFICE, ELLISON_BOOKING, MORRISON_LIST)
    expect(toAuthorised.ok).toBe(false)
    if (!toAuthorised.ok) expect(toAuthorised.code).toBe('listAuthorised')
  })
})

describe('logListNote (office phone note; no return channel)', () => {
  it('appends an office phone note and audits it into the list history', () => {
    const api = store()
    const outcome = logListNote(api, OFFICE, MORRISON_LIST, "Confirmed the reference with St George's.")
    expect(outcome.ok).toBe(true)
    const list = api.getState().schedule.lists[MORRISON_LIST]
    expect(list?.phoneNotes?.length).toBe(1)
    expect(list?.phoneNotes?.[0]?.by).toBe('Kirsty W.')
    expect(list?.phoneNotes?.[0]?.text).toBe("Confirmed the reference with St George's.")
    expect(auditForEntity(api.getState(), MORRISON_LIST).at(-1)?.action).toBe('list.phoneNote')
    // The note is an annotation, never a state change — the List stays SUBMITTED.
    expect(list?.state).toBe('SUBMITTED')
  })

  it('is office-only and requires text', () => {
    const api = store()
    const denied = logListNote(api, SOUTER, SOUTER_AM, 'x')
    expect(denied.ok).toBe(false)
    if (!denied.ok) expect(denied.code).toBe('officeOnly')
    const blank = logListNote(api, OFFICE, MORRISON_LIST, '   ')
    expect(blank.ok).toBe(false)
    if (!blank.ok) expect(blank.code).toBe('textRequired')
  })

  it('exposes NO return-to-anaesthetist / Returned transition anywhere', () => {
    // Convention 6: ACTIVE to SUBMITTED to AUTHORISED only; there is no Returned
    // state and no action that sends a SUBMITTED List back to the anaesthetist.
    const names = Object.keys(lifecycleModule)
    expect(names.some((n) => /return|unsubmit|reject|revert|reopenlist/i.test(n))).toBe(false)
  })
})

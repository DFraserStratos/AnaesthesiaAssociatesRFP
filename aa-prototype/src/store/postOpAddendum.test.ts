/**
 * Post-op addendum tests (Phase 09; B8).
 *
 * The addendum requires an AUTHORISED (locked) original, lands on a NEW List in
 * the original anaesthetist's open session today (catch-up Phase 28: interim
 * until Phase 38b), leaves the original Booking
 * byte-for-byte unchanged, and runs its OWN capture -> submit -> authorise ->
 * bill cycle to a separate invoice. Refused `noOpenSession` when no free, empty
 * session is available.
 */

import { completeAnswered } from '../test/completeAnswered'
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, editProcedure, submitList } from './lifecycle'
import { setProcedureContract } from './contractSelectionActions'
import { addPostOpAddendum } from './bookingActions'
import { runBillingForList } from './billingRun'
import { proceduresForBooking } from './selectors'
import { prepaymentStatusFor } from './prepaymentSelectors'
import type { Actor } from './mutate'
import type { Invoice } from '../domain/types'
import { ANAE, RVG_GROUP } from '../domain/seed'
import { projectedListId, slotIdFor } from '../domain/slots'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function store(): BoundAppStore {
  return createAppStore()
}

const SHARMA_TUE14 = projectedListId(ANAE.sharma, '2026-07-14', 'AM')
const SHARMA_TUE21_PM_SLOT = slotIdFor(ANAE.sharma, '2026-07-21', 'PM')

function originalOn(api: BoundAppStore, listId: string): string {
  const booking = Object.values(api.getState().schedule.bookings).find((c) => c.listId === listId)
  if (booking === undefined) throw new Error(`no booking on ${listId}`)
  return booking.id
}

/** Authorise Sharma's Tue 14 list (the original episode). Returns the booking id. */
function authoriseOriginal(api: BoundAppStore): string {
  const original = originalOn(api, SHARMA_TUE14)
  expect(submitList(api, OFFICE, SHARMA_TUE14).ok).toBe(true)
  expect(authoriseList(api, OFFICE, SHARMA_TUE14).ok).toBe(true)
  return original
}

describe('addPostOpAddendum', () => {
  it('requires an authorised original', () => {
    const api = store()
    const original = originalOn(api, SHARMA_TUE14) // still ACTIVE
    expect(addPostOpAddendum(api, OFFICE, original)).toMatchObject({ ok: false, code: 'notAuthorised' })
  })

  it('lands a linked addendum on the anaesthetist\'s empty free session today; original unchanged', () => {
    const api = store()
    const original = authoriseOriginal(api)
    const before = JSON.parse(JSON.stringify(api.getState().schedule.bookings[original])) as unknown

    const outcome = addPostOpAddendum(api, OFFICE, original)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const { bookingId, listId } = outcome.value

    const addendum = api.getState().schedule.bookings[bookingId]!
    expect(addendum.bookingType).toBe('postOpAddendum')
    expect(addendum.addendumOfBookingId).toBe(original)
    expect(addendum.patientId).toBe(api.getState().schedule.bookings[original]!.patientId)
    expect(addendum.completed).toBe(false)
    // AM holds a List; the addendum lands on a new List created in the open PM
    // session, copying the original List's hospital, surgeon and kind.
    const created = api.getState().schedule.lists[listId]!
    expect(listId.startsWith('LG')).toBe(true)
    expect(created.slotId).toBe(SHARMA_TUE21_PM_SLOT)
    expect(created).toMatchObject({ dateISO: '2026-07-21', session: 'PM', anaesthetistId: ANAE.sharma, state: 'ACTIVE' })
    const originalList = api.getState().schedule.lists[SHARMA_TUE14]!
    expect(created.kind).toBe(originalList.kind)
    expect(created.hospitalId).toBe(originalList.hospitalId)
    expect(created.surgeonId).toBe(originalList.surgeonId)
    const actions = api.getState().audit.slice(-3).map((a) => a.action)
    expect(actions).toEqual(['list.create', 'booking.create', 'procedure.create'])
    // Its one Procedure is its own Booking's primary (catch-up Phase 23).
    const addendumProcs = Object.values(api.getState().schedule.procedures).filter((p) => p.bookingId === bookingId)
    expect(addendumProcs.map((p) => p.isPrimary)).toEqual([true])

    // The original Booking is byte-for-byte unchanged (immutability answer).
    expect(api.getState().schedule.bookings[original]).toEqual(before)
  })

  it('runs its own cycle to an invoice while the original invoice is untouched', () => {
    const api = store()
    const original = authoriseOriginal(api)
    // Bill the original episode first.
    expect(runBillingForList(api, SHARMA_TUE14).ok).toBe(true)
    const originalInvoicesBefore = Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === original)
    expect(originalInvoicesBefore).toHaveLength(1)

    const added = addPostOpAddendum(api, OFFICE, original)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const { bookingId, listId } = added.value

    // Capture the addendum (a post-op pain consult), then run its own cycle.
    const proc = proceduresForBooking(api.getState(), bookingId)[0]!
    expect(
      editProcedure(api, OFFICE, proc.id, {
        rvgGroupId: RVG_GROUP.aaCystoscopy!,
        anaestheticStartISO: '2026-07-21T14:00:00',
        handoverISO: '2026-07-21T14:40:00',
        billingReference: 'PO-2026-0001',
      }).ok,
    ).toBe(true)
    expect(completeAnswered(api, OFFICE, bookingId).ok).toBe(true)
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)

    const addendumInvoices = Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === bookingId)
    expect(addendumInvoices).toHaveLength(1)
    // The original's invoice is untouched.
    const originalInvoicesAfter = Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === original)
    expect(originalInvoicesAfter).toHaveLength(1)
    expect(originalInvoicesAfter[0]).toEqual(originalInvoicesBefore[0] as Invoice)
  })

  it('never copies a prepaid Contract, so the addendum is not spuriously gated (catch-up Phase 20)', () => {
    const api = store()
    // Put the original episode on a prepaid Contract (Patient › Prepaid, Other price), then lock it.
    const original = originalOn(api, SHARMA_TUE14)
    const proc = proceduresForBooking(api.getState(), original)[0]!
    // Catch-up Phase 27: the prepaid Contract alone makes it prepaid; there is no prepayment detail to set.
    expect(setProcedureContract(api, OFFICE, proc.id, 'CT-FIX-PATIENT-PREPAID', { enteredPrice: 500 }).ok).toBe(true)
    expect(prepaymentStatusFor(api.getState(), original).status).not.toBe('none')
    expect(submitList(api, OFFICE, SHARMA_TUE14).ok).toBe(true)
    expect(authoriseList(api, OFFICE, SHARMA_TUE14).ok).toBe(true)

    const added = addPostOpAddendum(api, OFFICE, original)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const addendumProc = proceduresForBooking(api.getState(), added.value.bookingId)[0]!
    // A post-op event is never itself prepaid: the prepaid Contract is not
    // copied (it needs an invoice destination), so no prepayment follows it.
    expect(addendumProc.governingContractId).toBeUndefined()
    expect(prepaymentStatusFor(api.getState(), added.value.bookingId).status).toBe('none')
  })

  it('refuses noOpenSession when no free, empty session is available today', () => {
    const api = store()
    const original = authoriseOriginal(api)
    // First addendum takes the only free session (Sharma Tue 21 PM).
    expect(addPostOpAddendum(api, OFFICE, original).ok).toBe(true)
    // A second has nowhere to land (AM is booked, PM now holds the first addendum).
    expect(addPostOpAddendum(api, OFFICE, original)).toMatchObject({ ok: false, code: 'noOpenSession' })
  })
})

/**
 * The cancellation bench (build plan Phase 69; US-02.5.3, US-02.1.2, D117) on the real store: Southern Cross cancels
 * a Booking AA holds; "Mark cancelled" cancels it (kept on its List), Reject needs a reason and changes nothing, and a
 * decided cancellation reads its decision with no buttons.
 */

import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HOSP } from '../../../../../domain/seed/cast'
import type { IncomingBookingFields } from '../../../../../domain/types'
import { OFFICE_ACTOR, freshAppState, receiveCancellation, useAppStore } from '../../../../../store'
import { arrivalItemsOf } from '../../../../../store/intakeSelectors'
import { matchingView } from '../../../../../store/matchingSelectors'
import { CancellationBench } from './CancellationBench'

const api = useAppStore

function listItemOf(batchId: string) {
  const item = arrivalItemsOf(api.getState()).find((i) => i.batchId === batchId && i.kind !== 'needsNhi')
  if (item === undefined) throw new Error(`no arriving List for ${batchId}`)
  return item
}

/** A row for an existing Booking, as a hospital would send it unchanged. */
function rowFromBooking(bookingId: string): IncomingBookingFields {
  const s = api.getState()
  const booking = s.schedule.bookings[bookingId]!
  const list = s.schedule.lists[booking.listId]!
  const patient = s.masters.patients[booking.patientId]!
  const surgeon = list.surgeonId !== undefined && list.surgeonId !== null ? s.masters.surgeons[list.surgeonId] : undefined
  return {
    hospitalId: list.hospitalId,
    dateISO: list.dateISO,
    session: list.session,
    ...(surgeon !== undefined ? { surgeon: { name: surgeon.name, ...(surgeon.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) } } : {}),
    ...(booking.scheduledTime !== undefined ? { scheduledTime: booking.scheduledTime } : {}),
    patient: { name: patient.name, ...(patient.nhi !== undefined ? { nhi: patient.nhi } : {}), ...(patient.dobISO !== undefined && patient.dobISO !== '' ? { dobISO: patient.dobISO } : {}) },
    hospitalStatus: 'booked',
  }
}

/** A live Booking on an ACTIVE future List at Southern Cross whose row the matcher matches. */
function southernCrossBooking(): string {
  const s = api.getState()
  const view = matchingView(s)
  for (const b of Object.values(view.bookings).sort((a, c) => a.id.localeCompare(c.id))) {
    const list = view.lists[b.listId]
    if (b.cancelled || list === undefined || list.state !== 'ACTIVE' || list.surgeonId === undefined || b.patient.nhi === undefined) continue
    if (list.hospitalId !== HOSP.sx) continue
    if (list.dateISO <= s.clock.todayISO) continue
    return b.id
  }
  throw new Error('no Booking at Southern Cross')
}

const REASON = 'Patient unwell'

/** Southern Cross cancels one of AA's Bookings. */
function southernCrossCancels(): { batchId: string; bookingId: string; rowId: string } {
  const bookingId = southernCrossBooking()
  const out = receiveCancellation(api, HOSP.sx, { ...rowFromBooking(bookingId), hospitalStatus: 'cancelled', cancelReason: REASON })
  if (!out.ok) throw new Error(out.message)
  expect(listItemOf(out.value.batchId).kind).toBe('cancellation')
  return { batchId: out.value.batchId, bookingId, rowId: out.value.rowId }
}

function renderBench(batchId: string, onDone = vi.fn()) {
  const utils = render(
    <MemoryRouter>
      <CancellationBench arrival={listItemOf(batchId)} actor={OFFICE_ACTOR} onDone={onDone} />
    </MemoryRouter>,
  )
  return { ...utils, onDone }
}

const q = (sel: string) => document.querySelector<HTMLElement>(sel)
const bench = () => q('[data-shot="intake-bench-cancellation"]')!

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('CancellationBench', () => {
  it("shows the Booking with the hospital's reason and where it lands; Mark cancelled cancels it on its List", () => {
    const c = southernCrossCancels()
    const listId = api.getState().schedule.bookings[c.bookingId]!.listId
    const { onDone } = renderBench(c.batchId)

    const card = q('[data-shot="intake-cancellation-booking"]')!
    expect(card).toHaveAttribute('data-booking-id', c.bookingId)
    expect(card).toHaveTextContent("Hospital's reason")
    expect(card).toHaveTextContent(REASON)
    const where = q('[data-shot="intake-lands-card"]')!
    expect(where).toHaveTextContent('Where it lands')
    expect(where).toHaveAttribute('data-list-id', listId)

    fireEvent.click(q('[data-shot="intake-cancellation-apply"]')!)
    expect(onDone).toHaveBeenCalledTimes(1)
    const booking = api.getState().schedule.bookings[c.bookingId]!
    expect(booking.cancellation).toBeDefined()
    expect(booking.listId).toBe(listId)
    expect(api.getState().intake.rows[c.rowId]!.status).toBe('applied')
  })

  it('Reject needs a reason, typed or a quick chip; rejecting changes no Booking', () => {
    const c = southernCrossCancels()
    const scheduleBefore = api.getState().schedule
    const { onDone } = renderBench(c.batchId)

    fireEvent.click(q('[data-shot="intake-cancellation-reject"]')!)
    expect(q('[data-shot="intake-cancellation-reject-form"]')).toBeInTheDocument()
    const rejectBtn = within(bench()).getByRole('button', { name: 'Reject cancellation' })
    expect(rejectBtn).toBeDisabled()

    const field = within(bench()).getByLabelText('Why reject this cancellation')
    fireEvent.change(field, { target: { value: 'Wrong patient' } })
    expect(rejectBtn).toBeEnabled()
    fireEvent.change(field, { target: { value: '   ' } })
    expect(rejectBtn).toBeDisabled()
    fireEvent.click(within(bench()).getByRole('button', { name: 'Wrong hospital or date' }))
    expect(rejectBtn).toBeEnabled()

    fireEvent.click(rejectBtn)
    expect(onDone).toHaveBeenCalledTimes(1)
    const s = api.getState()
    expect(s.schedule).toBe(scheduleBefore)
    expect(s.schedule.bookings[c.bookingId]!.cancellation).toBeUndefined()
    expect(s.intake.rows[c.rowId]).toMatchObject({ status: 'rejected', decision: { kind: 'reject', reason: 'Wrong hospital or date' } })
  })

  it('a decided cancellation reads its decision, with no buttons', () => {
    const c = southernCrossCancels()
    const first = renderBench(c.batchId)
    fireEvent.click(q('[data-shot="intake-cancellation-apply"]')!)
    expect(first.onDone).toHaveBeenCalledTimes(1)
    first.unmount()

    renderBench(c.batchId)
    expect(q('[data-shot="intake-cancellation-decided"]')).toHaveTextContent('Marked cancelled')
    expect(q('[data-shot="intake-cancellation-apply"]')).toBeNull()
    expect(q('[data-shot="intake-cancellation-reject"]')).toBeNull()
    expect(within(bench()).queryAllByRole('button')).toHaveLength(0)
  })
})

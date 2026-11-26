/**
 * No confirm step at submit (US-13.7.3, Confirmed 2026-10-02): a List whose
 * Booking carries an open strong warning opens the usual "Submit this list to
 * the office?" sheet, with no warning text, and its Submit submits.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bookingsForList, completeBooking, freshAppState, SOUTER_ACTOR, useAppStore, warningsForBooking } from '../../store'
import { SEED_LIST_IDS, SEED_MARKERS } from '../../domain/seed'
import { SEED_STUB } from '../../domain/seed/intakeSeed'
import { STUB_ONLY_REASON } from '../../domain/intake/stubs'
import { SurfaceProvider } from '../surface'
import { SubmitListSheet } from './SubmitListSheet'

const RILEY = SEED_MARKERS['prepaymentBooking']!.entityId
const LIST = SEED_LIST_IDS.prepaymentUnpaidList

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('SubmitListSheet with a warning on the List', () => {
  it('shows the usual confirm sheet with no warning text and submits straight through', () => {
    // Catch-up Phase 27: Riley's prepayment warning is strong from two days out, so the demo clock goes to Thu 23 Jul.
    useAppStore.setState({ clock: { ...useAppStore.getState().clock, todayISO: '2026-11-26' } })
    for (const b of bookingsForList(useAppStore.getState(), LIST)) {
      if (b.cancellation === undefined && !b.completed) expect(completeBooking(useAppStore, SOUTER_ACTOR, b.id).ok).toBe(true)
    }
    const open = warningsForBooking(useAppStore.getState(), RILEY).filter((w) => w.clearance === undefined)
    expect(open.map((w) => w.strength)).toEqual(['strong'])

    const onSubmitted = vi.fn()
    render(
      <SurfaceProvider variant="mobile">
        <SubmitListSheet open listId={LIST} actor={SOUTER_ACTOR} mode="confirm" onClose={vi.fn()} onSubmitted={onSubmitted} />
      </SurfaceProvider>,
    )
    expect(screen.getByText('Submit this list to the office?')).toBeInTheDocument()
    expect(screen.queryByText(/warning/i)).toBeNull()
    expect(screen.queryByText(/Prepayment/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /anyway/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Submit to office' }))
    expect(onSubmitted).toHaveBeenCalled()
    expect(useAppStore.getState().schedule.lists[LIST]!.state).toBe('SUBMITTED')
  })
})

describe('SubmitListSheet with a List-level reason (the stub guard, US-02.6.4)', () => {
  it('blockers mode on a List holding only a stub reads "Waiting at intake" with the reason as a warning notice', () => {
    render(
      <SurfaceProvider variant="mobile">
        <SubmitListSheet open listId={SEED_STUB.listId} actor={SOUTER_ACTOR} mode="blockers" listReason={STUB_ONLY_REASON} onClose={vi.fn()} onSubmitted={vi.fn()} />
      </SurfaceProvider>,
    )
    expect(screen.getByText('Waiting at intake')).toBeInTheDocument()
    expect(screen.queryByText('Bookings still to finish')).toBeNull()
    const notice = document.querySelector('[data-shot="submit-list-reason"]')
    expect(notice).not.toBeNull()
    expect(notice).toHaveTextContent(STUB_ONLY_REASON)
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('with Bookings still to finish, the reason sits above the rows under the usual header', () => {
    const open = bookingsForList(useAppStore.getState(), LIST).filter((b) => b.cancellation === undefined && !b.completed)
    expect(open.length).toBeGreaterThan(0)
    render(
      <SurfaceProvider variant="mobile">
        <SubmitListSheet open listId={LIST} actor={SOUTER_ACTOR} mode="blockers" listReason="A reason for the List." onClose={vi.fn()} onSubmitted={vi.fn()} />
      </SurfaceProvider>,
    )
    expect(screen.getByText('Bookings still to finish')).toBeInTheDocument()
    const notice = screen.getByText('A reason for the List.')
    const firstPatient = useAppStore.getState().masters.patients[open[0]!.patientId]!.name
    const row = screen.getByText(firstPatient)
    expect(notice.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('without a reason, blockers mode looks as it always has', () => {
    render(
      <SurfaceProvider variant="mobile">
        <SubmitListSheet open listId={LIST} actor={SOUTER_ACTOR} mode="blockers" onClose={vi.fn()} onSubmitted={vi.fn()} />
      </SurfaceProvider>,
    )
    expect(screen.getByText('Bookings still to finish')).toBeInTheDocument()
    expect(document.querySelector('[data-shot="submit-list-reason"]')).toBeNull()
  })

  it('confirm on a List holding only a stub shows the refusal\'s reason and leaves the List active', () => {
    const onSubmitted = vi.fn()
    render(
      <SurfaceProvider variant="mobile">
        <SubmitListSheet open listId={SEED_STUB.listId} actor={SOUTER_ACTOR} mode="confirm" onClose={vi.fn()} onSubmitted={onSubmitted} />
      </SurfaceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Submit to office' }))
    expect(screen.getByText(STUB_ONLY_REASON)).toBeInTheDocument()
    expect(onSubmitted).not.toHaveBeenCalled()
    expect(useAppStore.getState().schedule.lists[SEED_STUB.listId]!.state).toBe('ACTIVE')
  })
})

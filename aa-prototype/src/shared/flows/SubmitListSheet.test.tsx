/**
 * No confirm step at submit (US-13.7.3, Confirmed 2026-10-02): a List whose
 * Booking carries an open strong warning opens the usual "Submit this list to
 * the office?" sheet, with no warning text, and its Submit submits.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bookingsForList, completeBooking, freshAppState, SOUTER_ACTOR, useAppStore, warningsForBooking } from '../../store'
import { SEED_LIST_IDS, SEED_MARKERS } from '../../domain/seed'
import { SurfaceProvider } from '../surface'
import { SubmitListSheet } from './SubmitListSheet'

const RILEY = SEED_MARKERS['prepaymentBooking']!.entityId
const LIST = SEED_LIST_IDS.prepaymentUnpaidList

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('SubmitListSheet with a warning on the List', () => {
  it('shows the usual confirm sheet with no warning text and submits straight through', () => {
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

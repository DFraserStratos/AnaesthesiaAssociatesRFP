/**
 * Admin Review's "Changed since submitted" cue and the completion gate on
 * Authorise (catch-up Phase 38a; US-07.2.1, US-07.2.3).
 */

import { cleanup, act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { editBooking, freshAppState, uncompleteBooking, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { ANAE, SEED_LIST_IDS } from '../../../domain/seed'
import { ReviewScreen } from './ReviewScreen'
import { ReviewQueue } from './ReviewQueue'

afterEach(cleanup)

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const PM = SEED_LIST_IDS.souterMon20Pm

function review() {
  return render(
    <SurfaceProvider variant="web">
      <ReviewScreen listId={PM} actor={OFFICE} onBack={vi.fn()} onOpen={vi.fn()} onViewInvoices={vi.fn()} />
    </SurfaceProvider>,
  )
}
const firstBooking = () => Object.values(useAppStore.getState().schedule.bookings).find((b) => b.listId === PM && b.cancellation === undefined)!

describe('Changed since submitted', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))

  it('is absent before any anaesthetist change, and after an office edit', () => {
    act(() => {
      editBooking(useAppStore, OFFICE, firstBooking().id, { notes: 'office' })
    })
    review()
    expect(document.querySelector('[data-shot="review-changed-since-submitted"]')).toBeNull()
  })

  it('shows the count after an anaesthetist edit and marks the changed Booking; also on the queue', () => {
    act(() => {
      editBooking(useAppStore, SOUTER, firstBooking().id, { notes: 'next-day fix' })
    })
    review()
    expect(document.querySelector('[data-shot="review-changed-since-submitted"]')?.textContent).toContain('Changed since submitted · 1')
    expect(document.querySelectorAll('[data-shot="review-changed-booking"]')).toHaveLength(1)
  })

  it('appears on the review queue row', () => {
    act(() => {
      editBooking(useAppStore, SOUTER, firstBooking().id, { notes: 'next-day fix' })
    })
    render(<ReviewQueue onOpen={vi.fn()} onViewInvoices={vi.fn()} />)
    expect(document.querySelectorAll('[data-shot="review-changed-since-submitted"]')).toHaveLength(1)
  })

  it('disables Authorise for billing while a re-opened Booking is incomplete, naming it', () => {
    const b = firstBooking()
    act(() => {
      uncompleteBooking(useAppStore, SOUTER, b.id)
    })
    review()
    expect(screen.getByRole('button', { name: 'Authorise for billing' })).toBeDisabled()
    const name = useAppStore.getState().masters.patients[b.patientId]!.name
    expect(screen.getByTestId('review-authorise-blocked').textContent).toContain(name)
  })
})

/**
 * The session drawer (catch-up Phase 28): an empty session's form, and the
 * drawer following its List, so a flow opened from it (Reassign list after
 * Assign List) stays mounted through to its success overlay.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE, HOSP, SURG } from '../../../domain/seed'
import { slotIdFor } from '../../../domain/slots'
import { assignListToSlot, freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared/surface'
import { SlotDrawer } from './SlotDrawer'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const STRAND_PM = slotIdFor(ANAE.strand, '2026-07-21', 'PM')

function renderDrawer(slotId: string, onClose = vi.fn()) {
  render(
    <MemoryRouter>
      <SurfaceProvider variant="web">
        <SlotDrawer slotId={slotId} actor={OFFICE} onClose={onClose} onOpenBooking={vi.fn()} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
  return onClose
}

describe('SlotDrawer', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('an empty session shows its status, times and the four actions, and no List state', () => {
    renderDrawer(STRAND_PM)
    const drawer = screen.getByTestId('admin-list-drawer')
    expect(drawer).toHaveAttribute('data-slot-id', STRAND_PM)
    expect(within(drawer).getByText('13:00 to 17:30')).toBeInTheDocument()
    for (const name of ['Assign List', 'Book (phone advice)', 'Edit times', 'History']) {
      expect(within(drawer).getByRole('button', { name })).toBeInTheDocument()
    }
    expect(drawer.textContent).not.toMatch(/ACTIVE|DRAFT|SUBMITTED/)
  })

  it('after Assign List from the drawer, a Reassign follows the moved List to its success overlay and closes', () => {
    vi.useFakeTimers()
    const onClose = renderDrawer(STRAND_PM)
    act(() => {
      assignListToSlot(useAppStore, OFFICE, STRAND_PM, { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'private' })
    })
    const drawer = screen.getByTestId('admin-list-drawer')
    expect(drawer).toHaveTextContent('ACTIVE')
    fireEvent.click(within(drawer).getByRole('button', { name: 'Reassign list' }))
    fireEvent.click(screen.getByRole('button', { name: /Sharma, Priya.*Free PM/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reassignment' }))
    expect(screen.getByTestId('list-reassignment-overlay')).toHaveTextContent('Moved to Sharma, Priya')
    // The drawer followed the List into Dr Sharma's session.
    expect(screen.getByTestId('admin-list-drawer')).toHaveAttribute('data-slot-id', slotIdFor(ANAE.sharma, '2026-07-21', 'PM'))
    act(() => vi.advanceTimersByTime(1100))
    expect(onClose).toHaveBeenCalled()
  })
})

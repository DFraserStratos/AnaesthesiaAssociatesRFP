/**
 * The session drawer (catch-up Phase 28): an empty session's form, and the
 * drawer following its List, so a flow opened from it (Reassign list after
 * Assign List) stays mounted through to its success overlay.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
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

  it('is a named modal dialog (U2 SidePanel): the h2 names it, the hooks sit on the dialog element', () => {
    renderDrawer(STRAND_PM)
    const dialog = screen.getByRole('dialog', { name: 'Strand, Oliver' })
    expect(dialog).toBe(screen.getByTestId('admin-list-drawer'))
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('data-shot', 'admin-slot-drawer')
    expect(dialog).toHaveAttribute('data-slot-id', STRAND_PM)
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Strand, Oliver' })).toBeInTheDocument()
    expect(document.activeElement).toBe(dialog)
  })

  it('Escape closes the drawer and focus returns to the control that opened it', () => {
    function Opener() {
      const [open, setOpen] = useState(false)
      return (
        <MemoryRouter>
          <SurfaceProvider variant="web">
            <button onClick={() => setOpen(true)}>Open session</button>
            {open && <SlotDrawer slotId={STRAND_PM} actor={OFFICE} onClose={() => setOpen(false)} onOpenBooking={vi.fn()} />}
          </SurfaceProvider>
        </MemoryRouter>
      )
    }
    render(<Opener />)
    const opener = screen.getByRole('button', { name: 'Open session' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByTestId('admin-list-drawer')).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(screen.queryByTestId('admin-list-drawer')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it('a sheet opened from the drawer closes first on Escape, then the drawer', () => {
    const onClose = renderDrawer(STRAND_PM)
    const drawer = screen.getByTestId('admin-list-drawer')
    fireEvent.click(within(drawer).getByRole('button', { name: 'History' }))
    expect(screen.getAllByRole('dialog')).toHaveLength(2)
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})

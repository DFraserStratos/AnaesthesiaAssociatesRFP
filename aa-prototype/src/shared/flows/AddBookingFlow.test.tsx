/**
 * Add a booking opens straight on the manual form (catch-up Phase 15b): manual
 * entry is the one way in (US-02.4.1), photo capture is Future Work (US-02.4.4)
 * reachable only through the badged demo action (`initialMode="photo"`), and
 * both prongs stamp `admin` for the office or `anaesthetistAdHoc` otherwise.
 */

import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bookingsForList, freshAppState, OFFICE_ACTOR, SOUTER_ACTOR, useAppStore, type Actor } from '../../store'
import { SEED_LIST_IDS } from '../../domain/seed'
import { SurfaceProvider } from '../surface'
import { AddBookingFlow } from './AddBookingFlow'

const LIST = SEED_LIST_IDS.souterPm21

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

afterEach(() => {
  vi.useRealTimers()
})

function renderFlow(actor: Actor, initialMode?: 'manual' | 'photo') {
  return render(
    <SurfaceProvider variant="mobile">
      <AddBookingFlow open listId={LIST} actor={actor} initialMode={initialMode} onClose={vi.fn()} onCreated={vi.fn()} />
    </SurfaceProvider>,
  )
}

function newBookingIds(before: Set<string>): string[] {
  return bookingsForList(useAppStore.getState(), LIST)
    .map((b) => b.id)
    .filter((id) => !before.has(id))
}

function saveManual() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ad Hoc Patient' } })
  fireEvent.change(screen.getByLabelText('Date of birth'), { target: { value: '1990-05-05' } })
  fireEvent.change(screen.getByLabelText('Operation'), { target: { value: 'Diagnostic laparoscopy' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))
}

describe('AddBookingFlow', () => {
  it('opens on the manual form under its title, with no chooser, photo choice or back control', () => {
    renderFlow(SOUTER_ACTOR)
    expect(screen.getByRole('heading', { name: 'Add a booking' })).toBeInTheDocument()
    expect(screen.getByText('Patient')).toBeInTheDocument()
    expect(screen.queryByText('Photo of paper list')).toBeNull()
    expect(screen.queryByText('Enter manually')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Back to Add a booking' })).toBeNull()
    expect(screen.queryByText('Future scope')).toBeNull()
  })

  it.each([
    ['an anaesthetist', SOUTER_ACTOR, 'anaesthetistAdHoc'],
    ['the office', OFFICE_ACTOR, 'admin'],
  ] as const)('stamps the manual Booking from %s as %s', (_who, actor, source) => {
    const before = new Set(bookingsForList(useAppStore.getState(), LIST).map((b) => b.id))
    renderFlow(actor)
    saveManual()
    const created = newBookingIds(before)
    expect(created).toHaveLength(1)
    expect(useAppStore.getState().schedule.bookings[created[0]!]?.source).toBe(source)
    expect(screen.getByText('Booking added')).toBeInTheDocument()
  })

  it.each([
    ['an anaesthetist', SOUTER_ACTOR, 'anaesthetistAdHoc'],
    ['the office', OFFICE_ACTOR, 'admin'],
  ] as const)('the Future-scope photo prong is badged, keeps one title, and stamps %s as %s', (_who, actor, source) => {
    vi.useFakeTimers()
    const before = new Set(bookingsForList(useAppStore.getState(), LIST).map((b) => b.id))
    renderFlow(actor, 'photo')
    expect(screen.getByText('Future scope')).toBeInTheDocument()
    expect(screen.getByText('Photo of the paper list')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Add a booking' })).toBeNull()

    fireEvent.click(screen.getAllByRole('img', { name: /^Sample paper card/ })[0]!)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))

    const created = newBookingIds(before)
    expect(created).toHaveLength(1)
    const booking = useAppStore.getState().schedule.bookings[created[0]!]
    expect(booking?.source).toBe(source)
    expect(booking?.attachments.map((a) => a.kind)).toEqual(['photo'])
  })

  it('a repeat Future-scope request while the photo prong is open restarts it at the card picker', () => {
    vi.useFakeTimers()
    const props = { open: true, listId: LIST, actor: SOUTER_ACTOR, initialMode: 'photo' as const, onClose: vi.fn(), onCreated: vi.fn() }
    const view = render(
      <SurfaceProvider variant="mobile">
        <AddBookingFlow {...props} resetKey={1} />
      </SurfaceProvider>,
    )
    fireEvent.click(screen.getAllByRole('img', { name: /^Sample paper card/ })[0]!)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole('button', { name: 'Save booking' })).toBeInTheDocument()

    view.rerender(
      <SurfaceProvider variant="mobile">
        <AddBookingFlow {...props} resetKey={2} />
      </SurfaceProvider>,
    )
    expect(screen.queryByRole('button', { name: 'Save booking' })).toBeNull()
    expect(screen.getAllByRole('img', { name: /^Sample paper card/ }).length).toBeGreaterThan(0)
  })
})

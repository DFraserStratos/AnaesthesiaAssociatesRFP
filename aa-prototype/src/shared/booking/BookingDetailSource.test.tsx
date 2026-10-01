import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore, type Actor } from '../../store'
import { SurfaceProvider } from '../surface'
import { AdminBookingDetailRoute } from '../../apps/admin/routes'
import { SEED_MARKERS } from '../../domain/seed'

/**
 * The Booking source line (DM-39; catch-up Phase 15) is display-only: one quiet
 * line when a source is recorded, and nothing at all (no placeholder) when not.
 */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderBooking(bookingId: string) {
  const booking = useAppStore.getState().schedule.bookings[bookingId]!
  const list = useAppStore.getState().schedule.lists[booking.listId]!
  return render(
    <MemoryRouter initialEntries={[`/admin/day/${list.dateISO}/bookings/${bookingId}`]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: '2026-07-21' }} />}>
            <Route path="day/:dateISO/bookings/:bookingId" element={<AdminBookingDetailRoute />} />
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

describe('Booking source line', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('shows the recorded source once, quietly', () => {
    const { container } = renderBooking(SEED_MARKERS['splitBillingBooking']!.entityId)
    const lines = container.querySelectorAll('[data-shot="booking-source"]')
    expect(lines).toHaveLength(1)
    const line = lines[0]
    expect(line?.textContent).toContain('Surgeon PDF')
  })

  it('renders nothing for a Booking with no recorded source', () => {
    const historyId = Object.keys(useAppStore.getState().schedule.bookings).find((id) => id.startsWith('HBK'))!
    expect(useAppStore.getState().schedule.bookings[historyId]?.source).toBeUndefined()
    const { container } = renderBooking(historyId)
    expect(screen.getAllByText(/Attachments/).length).toBeGreaterThan(0)
    expect(container.querySelector('[data-shot="booking-source"]')).toBeNull()
  })
})

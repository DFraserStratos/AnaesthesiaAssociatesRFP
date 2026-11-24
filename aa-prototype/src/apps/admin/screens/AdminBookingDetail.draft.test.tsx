/**
 * The Admin Booking detail's draft on screen (catch-up Phase 35; US-02.3.2):
 * the unsaved-changes guard in a data router, one change count across the save
 * bar, the leave dialog and the saved strip, notes typed then deleted leaving
 * the draft clean, a dismissed saved strip coming back after a Reset, and the
 * anaesthetist's web Booking still writing at once.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, MemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, OFFICE_ACTOR, SOUTER_ACTOR, useAppStore } from '../../../store'
import { resetDomainState } from '../../../store/mutate'
import { SurfaceProvider } from '../../../shared/surface'
import { AdminBookingDetailRoute } from '../routes'
import { BookingDetailView } from '../../web/screens/BookingDetailView'
import { SEED_MARKERS } from '../../../domain/seed'

const BOOKING = SEED_MARKERS['pendingCaptureBooking']!.entityId

function mountAdmin() {
  const booking = useAppStore.getState().schedule.bookings[BOOKING]!
  const list = useAppStore.getState().schedule.lists[booking.listId]!
  const router = createMemoryRouter(
    [
      {
        path: '/admin',
        element: (
          <SurfaceProvider variant="web">
            <Outlet context={{ actor: OFFICE_ACTOR, todayISO: '2026-11-24' }} />
          </SurfaceProvider>
        ),
        children: [
          { path: 'day/:dateISO/bookings/:bookingId', element: <AdminBookingDetailRoute /> },
          { path: 'elsewhere', element: <div>Somewhere else</div> },
        ],
      },
    ],
    { initialEntries: [`/admin/day/${list.dateISO}/bookings/${BOOKING}`] },
  )
  const view = render(<RouterProvider router={router} />)
  return { router, ...view }
}

const notesBox = () => screen.getByRole('textbox', { name: 'Notes for the office' })
const leaveDialog = () => document.querySelector('[data-shot="leave-without-saving"]')

describe('the Admin Booking draft on screen', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('a clean draft never blocks leaving', async () => {
    const { router } = mountAdmin()
    await act(async () => {
      await router.navigate('/admin/elsewhere')
    })
    expect(router.state.location.pathname).toBe('/admin/elsewhere')
    expect(leaveDialog()).toBeNull()
  })

  it('leaving while dirty asks first: Keep editing stays (and has focus), Discard and leave goes with the real store unchanged', async () => {
    const realNotes = useAppStore.getState().schedule.bookings[BOOKING]!.notes
    const { router } = mountAdmin()
    fireEvent.change(notesBox(), { target: { value: 'Drafted, not saved' } })
    expect(screen.getByTestId('unsaved-count').textContent).toBe('1')

    await act(async () => {
      await router.navigate('/admin/elsewhere')
    })
    expect(router.state.location.pathname).not.toBe('/admin/elsewhere')
    const dialog = leaveDialog() as HTMLElement
    expect(dialog).not.toBeNull()
    expect(within(dialog).getByText('1', { exact: true })).toBeTruthy()
    const keep = screen.getByRole('button', { name: 'Keep editing' })
    expect(document.activeElement).toBe(keep)
    act(() => keep.click())
    expect(router.state.location.pathname).not.toBe('/admin/elsewhere')
    expect((notesBox() as HTMLTextAreaElement).value).toBe('Drafted, not saved')

    await act(async () => {
      await router.navigate('/admin/elsewhere')
    })
    act(() => screen.getByRole('button', { name: 'Discard and leave' }).click())
    expect(router.state.location.pathname).toBe('/admin/elsewhere')
    expect(useAppStore.getState().schedule.bookings[BOOKING]!.notes).toBe(realNotes)
  })

  it('notes typed then deleted leave the draft clean', () => {
    const realNotes = useAppStore.getState().schedule.bookings[BOOKING]!.notes
    expect(realNotes ?? '').toBe('')
    mountAdmin()
    fireEvent.change(notesBox(), { target: { value: 'x' } })
    expect(document.querySelector('[data-shot="booking-save-bar"]')).not.toBeNull()
    fireEvent.change(notesBox(), { target: { value: '' } })
    expect(document.querySelector('[data-shot="booking-save-bar"]')).toBeNull()
  })

  it('the save bar and the saved strip count the same changes; a dismissed strip shows again after a Reset', () => {
    mountAdmin()
    fireEvent.change(notesBox(), { target: { value: 'Rooms called' } })
    const time = screen.getByRole('textbox', { name: 'Scheduled time' })
    fireEvent.change(time, { target: { value: '17:55' } })
    const unsaved = screen.getByTestId('unsaved-count').textContent
    expect(unsaved).toBe('2')
    act(() => screen.getByRole('button', { name: 'Save changes' }).click())
    expect(useAppStore.getState().schedule.bookings[BOOKING]!.scheduledTime).toBe('17:55')
    expect(screen.getByTestId('saved-count').textContent).toBe(`${unsaved} changes`)

    act(() => within(document.querySelector('[data-shot="booking-saved-strip"]') as HTMLElement).getByRole('button', { name: 'Dismiss' }).click())
    expect(document.querySelector('[data-shot="booking-saved-strip"]')).toBeNull()
    // After a Reset the same change-set id is allocated again: its strip must show.
    act(() => resetDomainState(useAppStore))
    fireEvent.change(notesBox(), { target: { value: 'After the reset' } })
    act(() => screen.getByRole('button', { name: 'Save changes' }).click())
    expect(document.querySelector('[data-shot="booking-saved-strip"]')).not.toBeNull()
  })
})

describe("the anaesthetist's web Booking", () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('still writes an edit to the real store at once (no draft, no save bar)', () => {
    const booking = useAppStore.getState().schedule.bookings[BOOKING]!
    const list = useAppStore.getState().schedule.lists[booking.listId]!
    expect(list.anaesthetistId).toBe(SOUTER_ACTOR.anaesthetistId)
    render(
      <MemoryRouter>
        <SurfaceProvider variant="web">
          <BookingDetailView bookingId={BOOKING} actor={SOUTER_ACTOR} todayISO="2026-11-24" onBack={() => {}} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    fireEvent.change(notesBox(), { target: { value: 'Written at once' } })
    fireEvent.blur(notesBox())
    expect(useAppStore.getState().schedule.bookings[BOOKING]!.notes).toBe('Written at once')
    expect(document.querySelector('[data-shot="booking-save-bar"]')).toBeNull()
  })
})

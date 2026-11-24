import { act, fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bookingsForList, freshAppState, OFFICE_ACTOR, SOUTER_ACTOR, useAppStore, type Actor } from '../../store'
import { SurfaceProvider } from '../surface'
import { BookingDetailBody } from './BookingDetailBody'
import { BOOKING_MOVE_DEMO, SEED_LIST_IDS } from '../../domain/seed'

/**
 * Move to a colleague on the Booking screen (catch-up Phase 32a; US-01.4.7):
 * offered to the anaesthetist only where the move is allowed, and the sheet
 * stays mounted through the commit, so the done state is not unmounted when the
 * entry point's gate closes.
 */
const D = BOOKING_MOVE_DEMO

function renderBody(bookingId: string, actor: Actor, onBack = vi.fn()) {
  const utils = render(
    <MemoryRouter>
      <SurfaceProvider variant="web">
        <BookingDetailBody bookingId={bookingId} actor={actor} onBack={onBack} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
  return { ...utils, onBack }
}

describe('Move to a colleague on the Booking screen', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('shows for the anaesthetist on her own ACTIVE List, never for the office or on a submitted List', () => {
    const own = renderBody(D.bookingId, SOUTER_ACTOR)
    expect(own.container.querySelector('[data-shot="move-booking-action"]')?.textContent).toContain('Move to a colleague')
    own.unmount()
    const office = renderBody(D.bookingId, OFFICE_ACTOR)
    expect(office.container.querySelector('[data-shot="move-booking-action"]')).toBeNull()
    office.unmount()
    const submitted = bookingsForList(useAppStore.getState(), SEED_LIST_IDS.souterMon20Am)[0]!
    const locked = renderBody(submitted.id, SOUTER_ACTOR)
    expect(locked.container.querySelector('[data-shot="move-booking-action"]')).toBeNull()
    locked.unmount()
    // A past day: the office's to move.
    useAppStore.setState({ clock: { ...useAppStore.getState().clock, todayISO: '2026-11-26' } })
    const past = renderBody(D.bookingId, SOUTER_ACTOR)
    expect(past.container.querySelector('[data-shot="move-booking-action"]')).toBeNull()
    past.unmount()
    // A cancelled Booking.
    useAppStore.setState(freshAppState())
    const b = useAppStore.getState().schedule.bookings[D.secondBookingId]!
    useAppStore.setState({ schedule: { ...useAppStore.getState().schedule, bookings: { ...useAppStore.getState().schedule.bookings, [b.id]: { ...b, cancellation: { atISO: '2026-11-24T08:00:00', by: 'Kirsty W.', reason: 'Patient unwell' } as typeof b.cancellation } } } })
    const cancelled = renderBody(D.secondBookingId, SOUTER_ACTOR)
    expect(cancelled.container.querySelector('[data-shot="move-booking-action"]')).toBeNull()
  })

  it('keeps the sheet through the move: the done state shows, then Back to your List leaves', () => {
    const { container, onBack } = renderBody(D.bookingId, SOUTER_ACTOR)
    fireEvent.click(container.querySelector('[data-shot="move-booking-action"] button')!)
    const doc = container.ownerDocument
    const receiver = doc.querySelector(`[data-shot="move-booking-receiver"][data-anaesthetist-id="${D.receiverId}"]`)
    expect(receiver).not.toBeNull()
    fireEvent.click(receiver!)
    const confirm = doc.querySelector('[data-shot="move-booking-confirm"]')!
    expect(confirm.textContent).toContain("A new List is created in Dr Whitaker's Wed 25 Nov AM session at Christchurch Eye Surgery.")
    expect(confirm.textContent).toContain('Dr Whitaker is paid for it.')
    expect(confirm.textContent).not.toMatch(/warning|prefer|anyway|estimate|deposit|[–—]/i)
    expect((doc.querySelector('[data-shot="move-booking-tell-office"] input') as HTMLInputElement).checked).toBe(false)
    act(() => {
      fireEvent.click(doc.querySelector('[data-shot="move-booking-submit"] button')!)
    })
    const done = doc.querySelector('[data-shot="move-booking-done"]')
    expect(done?.textContent).toContain('Moved to Dr Whitaker.')
    expect(done?.textContent).not.toContain('The office has been told.')
    expect(onBack).not.toHaveBeenCalled()
    expect(useAppStore.getState().schedule.bookings[D.bookingId]?.listId).not.toBe(D.sourceListId)
    fireEvent.click(Array.from(done!.querySelectorAll('button')).find((b) => b.textContent === 'Back to your List')!)
    expect(onBack).toHaveBeenCalled()
  })

  it('a searched colleague who is not available shows as a neutral row that cannot be picked', () => {
    const { container } = renderBody(D.bookingId, SOUTER_ACTOR)
    fireEvent.click(container.querySelector('[data-shot="move-booking-action"] button')!)
    const doc = container.ownerDocument
    fireEvent.change(doc.querySelector('[data-shot="move-booking-search"] input')!, { target: { value: 'chen' } })
    const blocked = doc.querySelector(`[data-shot="move-booking-blocked"][data-anaesthetist-id="${D.unavailableColleagueId}"]`)
    expect(blocked?.getAttribute('aria-disabled')).toBe('true')
    expect(blocked?.tagName).not.toBe('BUTTON')
    expect(blocked?.textContent).toContain('Not available this session. They can set it available in their app, then you can move it.')
  })

  it('shows the honour-system line on a prepaid Booking', () => {
    const { container } = renderBody(D.prepaidBookingId, SOUTER_ACTOR)
    fireEvent.click(container.querySelector('[data-shot="move-booking-action"] button')!)
    const doc = container.ownerDocument
    fireEvent.click(doc.querySelector('[data-shot="move-booking-receiver"]')!)
    const honour = doc.querySelector('[data-shot="move-booking-honour"]')
    expect(honour?.textContent).toMatch(/^This Booking is prepaid\. The prepaid amount stays as agreed, and moves to Dr \w+ once the List is authorised\.$/)
  })
})

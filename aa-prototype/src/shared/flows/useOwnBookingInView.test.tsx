import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, moveBookingToAnaesthetist, SOUTER_ACTOR, useAppStore } from '../../store'
import { BOOKING_MOVE_DEMO } from '../../domain/seed'
import { useOwnBookingInView } from './useListMoves'

/**
 * The Booking routes' own-Bookings rule (catch-up Phase 38a) with Phase 32a's
 * exception: a Booking she moves to a colleague stays in the view that showed
 * it, so the move sheet's done step is not unmounted by a redirect.
 */
const D = BOOKING_MOVE_DEMO
const SOUTER = SOUTER_ACTOR.anaesthetistId!

describe('useOwnBookingInView', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('shows her own Booking, and keeps it in view after she moves it to a colleague', () => {
    const { result, rerender } = renderHook(({ id }) => useOwnBookingInView(id, SOUTER), { initialProps: { id: D.bookingId as string | null } })
    expect(result.current).toBe(true)
    act(() => {
      const outcome = moveBookingToAnaesthetist(useAppStore, SOUTER_ACTOR, D.bookingId, D.receiverId, {})
      expect(outcome.ok).toBe(true)
    })
    expect(result.current).toBe(true)
    // Leaving the Booking ends the exception: coming back to it falls back.
    rerender({ id: null })
    expect(result.current).toBe(false)
    rerender({ id: D.bookingId })
    expect(result.current).toBe(false)
  })

  it("never shows a colleague's Booking reached directly, or a missing one", () => {
    const { result } = renderHook(() => useOwnBookingInView(D.standInBookingId, SOUTER))
    expect(result.current).toBe(false)
    const missing = renderHook(() => useOwnBookingInView('BK9999', SOUTER))
    expect(missing.result.current).toBe(false)
  })
})

/**
 * The PWA's office stand-in for an office save (catch-up Phase 35): the
 * handset cannot play the office, so "Office edits this Booking" saves one
 * change set as Kirsty W. through `saveBookingPatch`, moving the time 30
 * minutes later. The handset then shows the "changed by the office" notice.
 */

import type { AppState, AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { saveBookingPatch } from './bookingSaveActions'
import type { Outcome } from './mutate'

const STEP_MINUTES = 30
const LAST_MINUTE = 23 * 60 + 55

function minutesOf(time: string | undefined): number {
  const [h, m] = (time ?? '08:00').split(':').map(Number)
  return (h ?? 8) * 60 + (m ?? 0)
}

function timeOf(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** Why the office stand-in cannot run on this Booking, or null. */
export function officeEditsBookingRefusal(state: Pick<AppState, 'schedule'>, bookingId: string | undefined): string | null {
  if (bookingId === undefined) return 'Open a Booking first'
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return 'Open a Booking first'
  if (booking.cancellation !== undefined) return 'This Booking is cancelled'
  if (state.schedule.lists[booking.listId]?.state === 'AUTHORISED') return 'This Booking is locked'
  if (minutesOf(booking.scheduledTime) + STEP_MINUTES > LAST_MINUTE) return 'The time would pass 23:55'
  return null
}

/** The office saves the time 30 minutes later, as one change set. */
export function officeEditsBooking(api: AppStoreApi, bookingId: string): Outcome<{ time: string }> {
  const booking = api.getState().schedule.bookings[bookingId]
  const time = timeOf(minutesOf(booking?.scheduledTime) + STEP_MINUTES)
  const out = saveBookingPatch(api, OFFICE_ACTOR, bookingId, { booking: { scheduledTime: time } })
  return out.ok ? { ok: true, value: { time } } : out
}

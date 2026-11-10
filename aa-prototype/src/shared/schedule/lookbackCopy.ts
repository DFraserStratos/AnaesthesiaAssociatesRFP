/**
 * The search wording both anaesthetist apps share (catch-up Phase 38a), so the
 * phone and the web cannot drift on it.
 */

/** "3 Bookings for Mitchell", or, past the cap, "Showing 50 of 64. Add more of the name or the NHI." */
export function searchCountLine(total: number, shown: number, rawQuery: string): string {
  if (total > shown) return `Showing ${shown} of ${total}. Add more of the name or the NHI.`
  return `${total} ${total === 1 ? 'Booking' : 'Bookings'} for ${rawQuery.trim()}`
}

export const SEARCH_EMPTY = 'No Bookings match. Try part of the name or the full NHI.'
export const DAY_EMPTY = 'No Lists on this day.'

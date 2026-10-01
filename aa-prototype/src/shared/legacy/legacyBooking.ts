/**
 * Pre-Phase-15 Booking links. The catch-up renamed Card to Booking: ids moved
 * from `C####` to `BK####` and history ids from `HC##` to `HBK##`, in the same
 * allocation order, and routes from `…/cards/:cardId` to `…/bookings/:bookingId`.
 * Presenters' bookmarks and old shared links still carry the old form, so the
 * routers redirect them through these two pure helpers. Kept in `src/shared`,
 * not the harness shell, so the PWA's closure can use them (`pwaPurity.test.ts`).
 */

/** Map a legacy Card id to its Booking id. New ids and anything unknown pass
 *  through unchanged, so `RequireEntity` bounces a stale id as before. */
export function legacyBookingId(id: string): string {
  const card = /^C(\d+)$/.exec(id)
  if (card !== null) return `BK${card[1]}`
  const history = /^HC(\d+)$/.exec(id)
  if (history !== null) return `HBK${history[1]}`
  return id
}

/** A malformed escape (`%E0`) must not throw during render: keep it raw, so
 *  the id simply fails to resolve and `RequireEntity` bounces it. */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/** The `/bookings/` path for a legacy `…/cards/<id>` path, or null when the path
 *  is not a legacy Booking link. */
export function legacyBookingPath(pathname: string): string | null {
  const match = /^(.*)\/cards\/([^/]+)\/?$/.exec(pathname)
  if (match === null) return null
  return `${match[1]}/bookings/${legacyBookingId(safeDecode(match[2] ?? ''))}`
}

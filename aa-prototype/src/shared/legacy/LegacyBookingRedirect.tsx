import { Navigate, useLocation } from 'react-router-dom'
import { legacyBookingPath } from './legacyBooking'

/** Route element for a legacy `…/cards/:cardId` URL: replaces it with the
 *  matching `/bookings/` URL, keeping the query string. */
export function LegacyBookingRedirect() {
  const { pathname, search } = useLocation()
  const target = legacyBookingPath(pathname)
  return <Navigate to={`${target ?? pathname.replace(/\/cards\/.*$/, '')}${search}`} replace />
}

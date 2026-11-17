/**
 * Catch-up Phase 24 session 2's declared parity differences (work items 10
 * and 11), set aside by the earlier parity suites:
 * - the rate x time line is gone and the Aria Contract is RVG at its own
 *   rate, so Fitzgerald's Wed 15 Jul Aria Booking moves from 3.0 hours at
 *   $480 ($1,440) to 22 units at $26.50 ($583.00), and both Aria Bookings'
 *   text drops "individually arranged hourly rate";
 * - the seven price-beat Bookings (`seed/pricingBookings.ts`) are additions.
 * `procedurePriceParity.test.ts` pins the Aria figure and the additions.
 * Imported only by tests.
 */

import { PRICING_BOOKING_IDS, SEED_MARKERS } from '../../domain/seed'
import { freshAppState } from '../appStore'

/** The two Aria Bookings whose price or text moved. */
export const PHASE_24_ARIA_ONLY: ReadonlySet<string> = new Set([
  SEED_MARKERS['contractRateBooking']!.entityId,
  SEED_MARKERS['contractRateCaptureBooking']!.entityId,
])

/** Every Booking an earlier parity suite sets aside for Phase 24: the Aria two and the seven additions. */
export const PHASE_24_ARIA_BOOKINGS: ReadonlySet<string> = new Set([...PHASE_24_ARIA_ONLY, ...PRICING_BOOKING_IDS])

const procedures = Object.values(freshAppState().schedule.procedures)

export const PHASE_24_ARIA_PROCEDURES: ReadonlySet<string> = new Set(procedures.filter((p) => PHASE_24_ARIA_BOOKINGS.has(p.bookingId)).map((p) => p.id))

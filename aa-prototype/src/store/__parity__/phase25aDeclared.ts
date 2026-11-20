/**
 * Catch-up Phase 25a's declared parity addition (work item 7): one Booking on
 * the seeded Disabled Contract (Christchurch Eye Surgery 2025 rate), Margaret
 * Ellery's on 21a's review-flags List, appended after every other seeded
 * record. The earlier parity suites set it and its Procedure aside; nothing
 * else moves. `contractChangeSelectors.test.ts` pins the Booking itself.
 * Imported only by tests.
 */

import { DISABLED_CONTRACT_BOOKING_IDS } from '../../domain/seed'
import { freshAppState } from '../appStore'
import { withoutPhase40 } from './phase40Declared'

export const PHASE_25A_ADDED_BOOKINGS: ReadonlySet<string> = new Set(DISABLED_CONTRACT_BOOKING_IDS)

export const PHASE_25A_ADDED_PROCEDURES: ReadonlySet<string> = new Set(
  Object.values(withoutPhase40(freshAppState()).schedule.procedures)
    .filter((p) => PHASE_25A_ADDED_BOOKINGS.has(p.bookingId))
    .map((p) => p.id),
)

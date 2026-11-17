/**
 * Catch-up Phase 25's declared differences against the earlier phases'
 * pinned fixtures (which never change):
 *  - the billing code for a Procedure with no price is `needsPrice` (the lock
 *    builder's rejection, and the prepayment build's), where the run's old
 *    resolver said `contractIneffective` (removed with the resolver);
 *  - the seeded invoices of 24's AUTHORISED Face lift (BK0188) and of the
 *    seeded paid prepayment (BK0038) are addressed to the patient by name: the
 *    seed's build context now carries the patient record, as the run's always
 *    did ("The patient" was the seed's gap).
 * Imported only by tests.
 */

import { SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../../domain/seed'

/** The baseline rows with the renamed code. */
export function withPhase25Codes<T>(rows: T): T {
  return JSON.parse(JSON.stringify(rows).replaceAll('"code":"contractIneffective"', '"code":"needsPrice"')) as T
}

/** The seeded invoices whose addressee changed (BK0188, BK0038). */
export const PHASE_25_ADDRESSEE_BOOKINGS: ReadonlySet<string> = new Set([SEED_MARKERS['rangeAuthorisedBooking']!.entityId, SEED_PREPAID_BOOKING_ID])

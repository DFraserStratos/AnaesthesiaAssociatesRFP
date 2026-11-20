/**
 * The patient balance check's stamp (catch-up Phase 40; US-11.3.2, RV-36).
 *
 * Written inside the commit that creates a Booking (`createBooking`, every
 * path: manual entry, phone advice, 33's create-from-row, 33a's resolve) or
 * matches an incoming row to one (33's `decideImportRow`), never later. It is
 * the only stored part of the balance warning: the warning itself is derived
 * live by 15a's routine from the ledger. A second stamp writes nothing.
 * Kept apart from `patientActions.ts` so the create and match paths import
 * it without an import cycle.
 */

import type { Booking, IsoDateTime } from '../domain/types'

export type BalanceCheckTrigger = NonNullable<Booking['balanceCheck']>['trigger']

/** The Booking with its balance check stamped, or the same Booking when it already carries one. */
export function stampBalanceCheck(booking: Booking, trigger: BalanceCheckTrigger, atISO: IsoDateTime): Booking {
  if (booking.balanceCheck !== undefined) return booking
  return { ...booking, balanceCheck: { atISO, trigger } }
}

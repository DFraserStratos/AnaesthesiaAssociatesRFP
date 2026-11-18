/**
 * Invoice building (Phase 08; catch-up Phase 25). Since catch-up Phase 25 the
 * standard invoices are built from the pricing snapshot taken at AUTHORISED
 * (`lock.ts`, the one place): `buildInvoicesForBooking` is the preview of
 * what a lock taken now would bill, `invoiceDraftsFromLock(buildBookingLock(..))`,
 * so the preview and the lock cannot disagree. The billing run never calls it:
 * it reads the stored lock only. The prepayment invoice is built in
 * `prepayment.ts` (catch-up Phase 27).
 */

import type { Booking, Procedure } from '../types'
import { buildBookingLock, invoiceDraftsFromLock, type BookingBuildResult, type InvoiceBuildContext } from './lock'

export {
  NEEDS_INVOICE_DESTINATION_MESSAGE,
  PREPAID_SPLIT_MESSAGE,
  type BookingBuildResult,
  type DraftInvoice,
  type DraftInvoiceLine,
  type InvoiceBuildContext,
} from './lock'

/**
 * What a lock taken now would bill for this Booking (the preview, tests and
 * the seed's own invoices): every Procedure priced with its stored Contract
 * under the multi-procedure rule, billed to the party its Contract names (or
 * divided between its split's parties), grouped one invoice per party. Any
 * Procedure that cannot be priced or billed fails the whole Booking.
 */
export function buildInvoicesForBooking(booking: Booking, procedures: readonly Procedure[], ctx: InvoiceBuildContext): BookingBuildResult {
  // Cancelled Bookings are retained but never billed (7th review B23).
  if (booking.cancellation !== undefined) return { kind: 'invoices', invoices: [] }
  const lock = buildBookingLock({ booking, procedures, ctx, takenAtISO: '', takenBy: '', partyName: (ref) => ref.id })
  return invoiceDraftsFromLock(lock)
}


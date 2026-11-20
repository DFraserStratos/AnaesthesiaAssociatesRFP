/**
 * The Booking's fees as the UI assembles them, for Phase 24's parity capture.
 * The only part of the capture that may change after the baseline (to pass
 * what the assembler newly reads). Imported only by tests.
 */

import type { AppState } from '../appStore'
import { heldPricesForBooking, proceduresForBooking } from '../selectors'
import { bookingFee, type BookingFeeTotals } from '../../shared/capture/feeContext'
import type { AssignedList, Booking } from '../../domain/types'

export function bookingFeeView(state: AppState, list: AssignedList, booking: Booking): BookingFeeTotals {
  const procedures = proceduresForBooking(state, booking.id)
  // Phase 24: the assembler newly reads the held amounts (the AUTHORISED and prepaid rungs).
  return bookingFee({ procedures, list, masters: state.masters, patientId: booking.patientId, held: heldPricesForBooking(state, booking.id) })
}

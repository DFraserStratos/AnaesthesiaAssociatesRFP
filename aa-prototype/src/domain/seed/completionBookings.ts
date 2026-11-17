/**
 * The two Bookings catch-up Phase 21a adds (US-03.3.9, US-03.6.1, US-05.2.8),
 * on Dr Souter's Mon 10 Aug PM List at St George's with Ms G. Lim (the
 * Merivale Face lift's List, which no S1 to S5 beat scripts):
 *
 * - `fixedPriceNoTimes`: a Merivale fixed price ("Facelift plus 1 add on")
 *   with no times, no RVG code and no modifiers. The form collapses (no times,
 *   modifiers or units; the code for reference only) and Mark complete passes
 *   with none of them.
 * - `needsPriceBooking`: No contract · Fixed price with no amount typed: the
 *   form shows "Needs a price" and Mark complete refuses on the price alone.
 *
 * Both are ACTIVE, not completed, with dedicated pinned patients (`PAT_21A`),
 * appended after every other seeded Booking and Procedure, RNG-free, so no id
 * or scripted figure moves.
 */

import type { Booking, Procedure } from '../types'
import { seedFallbackId } from '../billing/fallbacks'
import { MERIVALE_BOOKING_LIST_ID } from './pricedItemBookings'
import { PRICED_ITEM } from './pricedItems'
import { PAT_21A } from './patients'
import { seedText } from './procedureText'

export type CompletionBookingKey = 'fixedPriceNoTimes' | 'needsPriceBooking'

interface Spec {
  key: CompletionBookingKey
  patientId: string
  time: string
  text: string
  contractId: string
}

const SPECS: readonly Spec[] = [
  { key: 'fixedPriceNoTimes', patientId: PAT_21A.fixedPriceNoTimes, time: '14:45', text: 'Face lift and upper blepharoplasty', contractId: PRICED_ITEM.merFaceLift1 },
  { key: 'needsPriceBooking', patientId: PAT_21A.needsPrice, time: '16:00', text: 'Excision of skin lesion, cheek', contractId: seedFallbackId('patient-standard') },
]

export function seedCompletionBookings(next: { booking: number; procedure: number }): {
  bookings: Booking[]
  procedures: Procedure[]
  ids: Record<CompletionBookingKey, string>
  next: { booking: number; procedure: number }
} {
  const bookings: Booking[] = []
  const procedures: Procedure[] = []
  const ids = {} as Record<CompletionBookingKey, string>
  let b = next.booking
  let p = next.procedure
  for (const spec of SPECS) {
    const bookingId = `BK${String(b).padStart(4, '0')}`
    bookings.push({
      id: bookingId,
      listId: MERIVALE_BOOKING_LIST_ID,
      patientId: spec.patientId,
      scheduledTime: spec.time,
      completed: false,
      // The seed's source rule: St George's sends a feed, so its Bookings are hospital downloads.
      source: 'hospitalDownload',
      lastModifiedBy: 'Kirsty W.',
      lastModifiedAtISO: '2026-07-20T15:20:00',
    })
    procedures.push({
      id: `P${String(p).padStart(4, '0')}`,
      bookingId,
      payer: { kind: 'patient' },
      procedureText: seedText(spec.text),
      invoiceDescription: null,
      isPrimary: true,
      modifierClaims: [],
      removedModifierIds: [],
      governingContractId: spec.contractId,
    })
    ids[spec.key] = bookingId
    b += 1
    p += 1
  }
  return { bookings, procedures, ids, next: { booking: b, procedure: p } }
}

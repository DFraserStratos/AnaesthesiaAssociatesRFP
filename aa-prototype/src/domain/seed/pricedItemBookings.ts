/**
 * The one Booking catch-up Phase 19a adds (US-04.2.15's backdated-range demo,
 * US-04.2.11): an unedited Face lift on Merivale Plastic Surgery's
 * combination Contract, on Dr Souter's Mon 10 Aug PM List at St George's with
 * Ms G. Lim (a Merivale surgeon). Its price is derived from the range in force
 * on 10 Aug ($3,100 from 1 Jun 2026), so adding a range from a date before 10
 * Aug in the Contract editor re-prices it at once, on Admin, web and mobile.
 *
 * On the payer route (the patient, self funded after the procedure) until
 * Phases 20 and 21 choose and bill by the Contract. Its RVG code is filled
 * from the Contract's default (H3) by `fillFromContract`, as a pick would.
 * Appended after every other seeded Booking and Procedure (the next free
 * ids), RNG-free, on a List no S1 to S5 beat scripts; the canvas generator is
 * untouched. Phase 24 seeds the held Merivale Bookings beside it.
 */

import type { Booking, Procedure } from '../types'
import { projectedListId } from '../slots'
import { fillFromContract } from '../billing/startingValues'
import { ANAE } from './cast'
import { CONTRACTS } from './contracts'
import { PRICED_ITEM } from './pricedItems'
import { RVG_GROUPS } from './rvgGroups'
import { seedText } from './procedureText'

export const MERIVALE_BOOKING_LIST_ID = projectedListId(ANAE.souter, '2026-08-10', 'PM')
/** A generated patient with one past Booking, so no scripted patient gains another. */
export const MERIVALE_BOOKING_PATIENT_ID = 'PT0129'

export function seedPricedItemBookings(next: { booking: number; procedure: number }): {
  bookings: Booking[]
  procedures: Procedure[]
  next: { booking: number; procedure: number }
} {
  const bookingId = `BK${String(next.booking).padStart(4, '0')}`
  const booking: Booking = {
    id: bookingId,
    listId: MERIVALE_BOOKING_LIST_ID,
    patientId: MERIVALE_BOOKING_PATIENT_ID,
    scheduledTime: '13:30',
    completed: false,
    // The seed's source rule: St George's sends a feed, so its Bookings are hospital downloads.
    source: 'hospitalDownload',
    lastModifiedBy: 'Kirsty W.',
    lastModifiedAtISO: '2026-07-20T15:10:00',
  }
  const faceLift = CONTRACTS.find((c) => c.id === PRICED_ITEM.merFaceLift)
  const groups = Object.fromEntries(RVG_GROUPS.map((g) => [g.id, g]))
  const empty: Procedure = {
    id: `P${String(next.procedure).padStart(4, '0')}`,
    bookingId,
    payer: { kind: 'patient' },
    procedureText: seedText('Face lift'),
    invoiceDescription: null,
    isAdditional: false,
    modifierClaims: [],
    removedModifierIds: [],
    governingContractId: PRICED_ITEM.merFaceLift,
  }
  const procedure: Procedure = { ...empty, ...fillFromContract(empty, faceLift, groups) }
  return { bookings: [booking], procedures: [procedure], next: { booking: next.booking + 1, procedure: next.procedure + 1 } }
}

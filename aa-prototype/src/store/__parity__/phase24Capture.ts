/**
 * Catch-up Phase 24 parity capture (work item 1): every seeded Procedure's
 * price (its total, charged units, B, T and M, whether it needs a price, 21a's
 * price status and the computed price beside it), every Booking's total, every
 * seeded Booking's invoices and prepayment invoices as a run would build them
 * (Phase 23's capture: counterparty, subtotals, totals, each line's kind,
 * units, amount and wording) and the BCTI count per anaesthetist and month.
 *
 * Written once from the code as Phase 23 left it, BEFORE Phase 24 replaced the
 * price with one function, into `phase-24-baseline.json`, and compared after it
 * by `procedurePriceParity.test.ts`. The fixture is never regenerated (`-u`).
 * Imported only by tests.
 */

import type { AppState } from '../appStore'
import { bookingsForList, proceduresForBooking } from '../selectors'
import { reviewInputFor } from '../reviewSelectors'
import { priceStatusFor } from '../../domain/billing/priceStatus'
import { capturePhase23, type BctiRow23, type BookingRow23 } from './phase23Capture'
import { bookingFeeView } from './phase24Fees'
import type { AssignedList } from '../../domain/types'

export interface FeeRow24 {
  procedureId: string
  bookingId: string
  total: number
  billableUnits: number
  b: number
  t: number
  m: number
  needsPrice: boolean
  /** 21a's `priceStatusFor`: 'priced', 'needsPrice:<reason>' or null with no Contract. */
  priceStatus: string | null
  /** 21a's `computedPriceFor` as Review reads it; null where none. */
  computed: number | null
}

export interface BookingTotal24 {
  bookingId: string
  total: number
  needsPrice: boolean
}

export interface Phase24Baseline {
  fees: FeeRow24[]
  bookingTotals: BookingTotal24[]
  bookings: BookingRow23[]
  bctis: BctiRow23[]
}

export function capturePhase24(state: AppState): Phase24Baseline {
  const fees: FeeRow24[] = []
  const bookingTotals: BookingTotal24[] = []
  const lists = Object.values(state.schedule.lists)
    .filter((l): l is AssignedList => l.anaesthetistId !== undefined)
    .sort((a, b) => a.id.localeCompare(b.id))
  for (const list of lists) {
    for (const booking of bookingsForList(state, list.id)) {
      const procedures = proceduresForBooking(state, booking.id)
      const totals = bookingFeeView(state, list, booking)
      if (totals.structural === undefined) bookingTotals.push({ bookingId: booking.id, total: totals.total, needsPrice: totals.needsPrice })
      const review = reviewInputFor(state, booking)
      for (const procedure of procedures) {
        const fee = totals.views[procedure.id]?.fee
        if (fee === undefined) continue
        const contract = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
        const status = priceStatusFor(procedure, contract, list.dateISO)
        const computed = review?.procedures.find((r) => r.procedure.id === procedure.id)?.computedPrice
        fees.push({
          procedureId: procedure.id,
          bookingId: booking.id,
          total: fee.total,
          billableUnits: fee.billableUnits,
          b: fee.btm.base.units,
          t: fee.btm.time.units,
          m: fee.btm.modifiers.units,
          needsPrice: fee.needsPrice,
          priceStatus: status === undefined ? null : status.status === 'priced' ? 'priced' : `needsPrice:${status.reason}`,
          computed: computed ?? null,
        })
      }
    }
  }
  const p23 = capturePhase23(state, { held: true })
  fees.sort((a, b) => a.procedureId.localeCompare(b.procedureId))
  bookingTotals.sort((a, b) => a.bookingId.localeCompare(b.bookingId))
  return { fees, bookingTotals, bookings: p23.bookings, bctis: p23.bctis }
}

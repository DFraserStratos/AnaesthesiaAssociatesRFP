/**
 * One Procedure's price as the screens show it (catch-up Phase 24): the price
 * ladder's answer from the fee engine, the computed price beside it (21a's
 * `computedPriceFor`), and the Contract. The office's Change price sheet and
 * the anaesthetist's price line read it; nothing here prices anything itself.
 * Call it in `useMemo` over the records it reads (a fresh object each call).
 */

import type { AppState } from './appStore'
import type { Contract, Procedure } from '../domain/types'
import type { FeeResult } from '../domain/billing/fee'
import type { PriceResult } from '../domain/billing/procedurePrice'
import { bookingFeesFor, feeContextFor } from '../domain/billing/validateBookingForBilling'
import { computedPriceFor } from '../domain/billing/priceStatus'
import { billingContextForBooking, proceduresForBooking } from './selectors'

export type PriceViewState = {
  masters: AppState['masters']
  schedule: Pick<AppState['schedule'], 'lists' | 'bookings' | 'procedures' | 'billingLines'>
  billing: Pick<AppState['billing'], 'invoices' | 'invoiceLines'>
}

export interface ProcedurePriceView {
  procedure: Procedure
  contract?: Contract
  fee: FeeResult
  price: PriceResult
  /** The price with nothing typed or held (none on an open price or with no price in force). */
  computed?: number
}

export function procedurePriceViewFor(state: PriceViewState, procedureId: string): ProcedurePriceView | undefined {
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return undefined
  const booking = state.schedule.bookings[procedure.bookingId]
  if (booking === undefined) return undefined
  const ctx = billingContextForBooking(state, booking)
  if (ctx === undefined) return undefined
  const procedures = proceduresForBooking(state, booking.id)
  const priced = bookingFeesFor(procedures, ctx)
  if (priced.kind !== 'ok') return undefined
  const fee = priced.fees[procedureId]
  if (fee === undefined) return undefined
  const feeCtx = feeContextFor(procedure, ctx)
  const contract = feeCtx.contract
  const computed = computedPriceFor(procedure, contract, { ...feeCtx, allocation: fee.allocation, bookingProcedureCount: procedures.length })
  return {
    procedure,
    ...(contract !== undefined ? { contract } : {}),
    fee,
    price: fee.price,
    ...(computed !== undefined ? { computed } : {}),
  }
}

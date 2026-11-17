/**
 * The Booking-level fee engine (catch-up Phase 23; FT-05.3, US-05.3.1, RV-08):
 * the one entry point every fee in the app goes through. It prices a whole
 * Booking under the multi-procedure rule (`multiProcedure.ts`) over 19's
 * resolver, 19a's fee path and 19b's modifiers (`fee.ts`), so no caller prices
 * a Procedure alone or reads a Procedure's position.
 *
 *   Pass 1: each Procedure's context (its Contract, the range in force on the
 *           procedure date, its RVG group: `ctxFor`), whether it is RVG-priced
 *           (from its Contract's pricing kind alone), and the Booking's
 *           modifier total from the primary (19b's `resolveModifiers`).
 *   Pass 2: `allocateBooking`, then `feeFor` for each Procedure.
 *
 * Prepayment is never read (D57): every Procedure is ranked, prepaid or not.
 */

import type { Contract, Procedure, ProcedureId } from '../types'
import { feeFor, modifierInputsOf, resolveBtm, type FeeContext, type FeeResult } from './fee'
import { allocateBooking, inDisplayOrder, primaryOf, type ProcedureAllocation } from './multiProcedure'
import { roundToCents } from './money'
import { isRvgKind } from './contracts'

/** One Procedure's fee context before the rule places it: what `ctxFor` returns. */
export type ProcedureFeeContext = Omit<FeeContext, 'allocation' | 'bookingProcedureCount'>

/**
 * Priced from RVG units: No contract · RVG, or a Contract with a rate or a
 * discount (and a Procedure with no Contract yet, which the fee path prices at
 * the anaesthetist's unit value until the office sets one). A fixed or open
 * price is not, whatever a typed price says.
 */
export function isRvgPricedContract(contract: Pick<Contract, 'pricing'> | undefined): boolean {
  const kind = contract?.pricing.kind
  return kind === undefined || isRvgKind(kind)
}

export type BookingFeeResult =
  | {
      kind: 'ok'
      /** Undefined only for a Booking with no Procedures. */
      primaryId: ProcedureId | undefined
      /** The Procedure ids in display order (`inDisplayOrder`): the primary first. */
      order: ProcedureId[]
      allocations: Record<ProcedureId, ProcedureAllocation>
      fees: Record<ProcedureId, FeeResult>
      /** The units under the rule, summed. */
      units: number
      total: number
      /** Some Procedure has no price on the List's date. */
      needsPrice: boolean
    }
  | { kind: 'structural'; reason: 'noPrimary' | 'severalPrimaries' }

/** The one sentence for a Booking without exactly one primary (the validator's failure, the run's exception). */
export const NO_PRIMARY_MESSAGE = 'This Booking needs exactly one primary procedure'

/** Price every Procedure of one Booking (`procedures` in Booking order). */
export function bookingFeeFor(procedures: readonly Procedure[], ctxFor: (procedure: Procedure) => ProcedureFeeContext): BookingFeeResult {
  if (procedures.length === 0) {
    return { kind: 'ok', primaryId: undefined, order: [], allocations: {}, fees: {}, units: 0, total: 0, needsPrice: false }
  }
  const primary = primaryOf(procedures)
  if (primary.kind !== 'ok') return { kind: 'structural', reason: primary.kind }

  // Pass 1.
  const contexts = new Map<ProcedureId, ProcedureFeeContext>()
  for (const p of procedures) contexts.set(p.id, ctxFor(p))
  const primaryCtx = contexts.get(primary.primary.id) as ProcedureFeeContext
  const bookingModifierUnits = resolveBtm(primary.primary, primaryCtx.rvgGroup, primaryCtx.timeRule, modifierInputsOf(primaryCtx)).modifiers.units

  // Pass 2.
  const allocations = allocateBooking(procedures, (p) => isRvgPricedContract(contexts.get(p.id)?.contract), bookingModifierUnits)
  const fees: Record<ProcedureId, FeeResult> = {}
  let units = 0
  let total = 0
  let needsPrice = false
  for (const p of procedures) {
    const fee = feeFor(p, { ...(contexts.get(p.id) as ProcedureFeeContext), allocation: allocations[p.id] as ProcedureAllocation, bookingProcedureCount: procedures.length })
    fees[p.id] = fee
    units += fee.billableUnits
    total += fee.total
    needsPrice ||= fee.needsPrice
  }
  return {
    kind: 'ok',
    primaryId: primary.primary.id,
    order: inDisplayOrder(procedures).map((p) => p.id),
    allocations,
    fees,
    units,
    total: roundToCents(total),
    needsPrice,
  }
}

/** One Procedure's fee from its Booking's result, or undefined when the Booking is structurally broken. */
export function feeIn(result: BookingFeeResult, procedureId: ProcedureId): FeeResult | undefined {
  return result.kind === 'ok' ? result.fees[procedureId] : undefined
}

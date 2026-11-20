/**
 * Fee assembly for the capture UI — plain functions over the store's stable
 * records (components subscribe to the records and call these in useMemo;
 * deriving inside a zustand selector would return fresh references every
 * snapshot). All maths comes from the Phase 01 calculator; this module only
 * gathers its inputs:
 *   - the governing contract is the procedure's STORED-EXPLICIT
 *     `governingContractId`, whatever its status (a Disabled Contract still
 *     prices a Procedure already on it),
 *   - the List's date picks a fixed price's range in force, and the RVG time
 *     rule is the masters' (catch-up Phase 19a),
 *   - the patient's date of birth and the modifier master feed the age and
 *     included modifiers (catch-up Phase 19b), as in every other assembler.
 */

import type { AssignedList, Contract, Procedure, ProcedureId, RvgGroup } from '../../domain/types'
import type { FeeResult } from '../../domain/billing/fee'
import type { HeldPrices } from '../../domain/billing/procedurePrice'
import { bookingFeeFor, type ProcedureFeeContext } from '../../domain/billing/bookingFee'
import type { ProcedureAllocation } from '../../domain/billing/multiProcedure'
import { groupOf } from '../../domain/billing/rvgGroups'
import { priceBookingFromLock, type BookingLock } from '../../domain/billing/lock'
import type { AppState } from '../../store'

export interface BookingFeeArgs {
  /** The Booking's Procedures, in Booking order. */
  procedures: readonly Procedure[]
  /** The List's anaesthetist prices the fee, so only an assigned List (a Draft List has none yet). */
  list: AssignedList
  masters: AppState['masters']
  /** The Booking's patient: the age modifier reads their date of birth (catch-up Phase 19b). */
  patientId: string | undefined
  /**
   * The price ladder's held amounts per Procedure (catch-up Phase 24): the
   * store's `heldPricesForBooking`, as `billingContextForBooking` reads them
   * for the run. Absent: nothing holds a price.
   */
  held?: Readonly<Record<ProcedureId, HeldPrices>>
  /**
   * The Booking's pricing snapshot, once its List is AUTHORISED (catch-up
   * Phase 25): every fee, unit, rate and the Contract then come from the lock,
   * never from masters, so an edit after authorise moves no locked figure
   * (US-15.0.3's one exception). Absent: the live price.
   */
  lock?: BookingLock
}

export interface ProcedureFeeView {
  fee: FeeResult
  /** Its place in the Booking under the multi-procedure rule (catch-up Phase 23). */
  allocation: ProcedureAllocation
  /** The Procedure's RVG group row (catch-up Phase 19), for display. */
  rvgGroup?: RvgGroup
  contract?: Contract
}

export interface BookingFeeTotals {
  /** The units under the multi-procedure rule, summed. */
  units: number
  total: number
  /** Some Procedure has no price on the List's date ("Needs a price", catch-up Phase 19a). */
  needsPrice: boolean
  /** The Procedure ids, the primary first (`inDisplayOrder`). */
  order: ProcedureId[]
  primaryId: ProcedureId | undefined
  views: Record<ProcedureId, ProcedureFeeView>
  /** Set when the Booking has no primary or several (the store never leaves one so): no fee is shown. */
  structural?: 'noPrimary' | 'severalPrimaries'
}

/**
 * The one UI assembler (catch-up Phase 23): the whole Booking priced through
 * `bookingFeeFor`, with each Procedure's context gathered as `feeContextFor`
 * gathers it for the run (kept in step with it). The capture blocks, the
 * Booking total, Review and the list rows read its views; none prices a
 * Procedure alone.
 */
export function bookingFee({ procedures, list, masters, patientId, held, lock }: BookingFeeArgs): BookingFeeTotals {
  const locked = lock !== undefined ? lockedFeeTotals(lock) : undefined
  if (locked !== undefined) return locked
  const anaesthetist = masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) {
    throw new Error(`list ${list.id} has no anaesthetist ${list.anaesthetistId}`)
  }
  const patientDobISO = patientId !== undefined ? masters.patients[patientId]?.dobISO : undefined
  const extras = new Map<ProcedureId, { rvgGroup?: RvgGroup; contract?: Contract }>()
  const result = bookingFeeFor(procedures, (procedure) => {
    const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
    const rvgGroup = groupOf(masters.rvgGroups, procedure.rvgGroupId)
    extras.set(procedure.id, { ...(rvgGroup !== undefined ? { rvgGroup } : {}), ...(contract !== undefined ? { contract } : {}) })
    const ctx: ProcedureFeeContext = {
      anaesthetist,
      dateISO: list.dateISO,
      timeRule: masters.rvgTimeRule,
      patientDobISO,
      modifiers: masters.modifiers,
    }
    if (contract !== undefined) ctx.contract = contract
    if (rvgGroup !== undefined) ctx.rvgGroup = rvgGroup
    const heldHere = held?.[procedure.id]
    if (heldHere !== undefined) ctx.held = heldHere
    return ctx
  })
  if (result.kind === 'structural') {
    return { units: 0, total: 0, needsPrice: false, order: procedures.map((p) => p.id), primaryId: undefined, views: {}, structural: result.reason }
  }
  const views: Record<ProcedureId, ProcedureFeeView> = {}
  for (const id of result.order) {
    const fee = result.fees[id]!
    views[id] = { fee, allocation: fee.allocation, ...extras.get(id)! }
  }
  return { units: result.units, total: result.total, needsPrice: result.needsPrice, order: result.order, primaryId: result.primaryId, views }
}

/**
 * A locked Booking's figures from its snapshot alone (catch-up Phase 25): the
 * fee, allocation, Contract and RVG group as locked. Undefined when the lock
 * holds no fee for some Procedure (a migrated history Booking that could not
 * be priced at seed time): the caller then prices live with the held amounts.
 */
function lockedFeeTotals(lock: BookingLock): BookingFeeTotals | undefined {
  if (lock.state !== 'locked' || lock.procedures.length === 0 || lock.procedures.some((s) => s.fee === undefined)) return undefined
  const views: Record<ProcedureId, ProcedureFeeView> = {}
  for (const s of lock.procedures) {
    views[s.procedureId] = { fee: s.fee!, allocation: s.fee!.allocation, ...(s.rvgGroup !== undefined ? { rvgGroup: s.rvgGroup } : {}), ...(s.contract !== undefined ? { contract: s.contract } : {}) }
  }
  const price = priceBookingFromLock(lock)
  return {
    units: price.units,
    total: price.total,
    needsPrice: false,
    order: lock.procedures.map((s) => s.procedureId),
    primaryId: lock.procedures.find((s) => s.procedure.isPrimary)?.procedureId ?? lock.procedures[0]?.procedureId,
    views,
  }
}

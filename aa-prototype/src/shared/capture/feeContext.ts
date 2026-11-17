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
 *   - nonRvgLines are this procedure's stored non-rvg lines (rvg-basis stored
 *     lines are never fee inputs),
 *   - the patient's date of birth and the modifier master feed the age and
 *     included modifiers (catch-up Phase 19b), as in every other assembler.
 */

import type { AssignedList, BillingLine, Contract, Procedure, ProcedureId, RvgGroup } from '../../domain/types'
import type { FeeResult } from '../../domain/billing/fee'
import type { HeldPrices } from '../../domain/billing/procedurePrice'
import { bookingFeeFor, type ProcedureFeeContext } from '../../domain/billing/bookingFee'
import type { ProcedureAllocation } from '../../domain/billing/multiProcedure'
import { groupOf } from '../../domain/billing/rvgGroups'
import type { AppState } from '../../store'

export interface BookingFeeArgs {
  /** The Booking's Procedures, in Booking order. */
  procedures: readonly Procedure[]
  /** The List's anaesthetist prices the fee, so only an assigned List (a Draft List has none yet). */
  list: AssignedList
  masters: AppState['masters']
  billingLines: Record<string, BillingLine>
  /** The Booking's patient: the age modifier reads their date of birth (catch-up Phase 19b). */
  patientId: string | undefined
  /**
   * The price ladder's held amounts per Procedure (catch-up Phase 24): the
   * store's `heldPricesForBooking`, as `billingContextForBooking` reads them
   * for the run. Absent: nothing holds a price.
   */
  held?: Readonly<Record<ProcedureId, HeldPrices>>
}

export interface ProcedureFeeView {
  fee: FeeResult
  /** Its place in the Booking under the multi-procedure rule (catch-up Phase 23). */
  allocation: ProcedureAllocation
  /** The Procedure's RVG group row (catch-up Phase 19), for display. */
  rvgGroup?: RvgGroup
  contract?: Contract
  nonRvgLines: BillingLine[]
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
export function bookingFee({ procedures, list, masters, billingLines, patientId, held }: BookingFeeArgs): BookingFeeTotals {
  const anaesthetist = masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) {
    throw new Error(`list ${list.id} has no anaesthetist ${list.anaesthetistId}`)
  }
  const patientDobISO = patientId !== undefined ? masters.patients[patientId]?.dobISO : undefined
  const extras = new Map<ProcedureId, { rvgGroup?: RvgGroup; contract?: Contract; nonRvgLines: BillingLine[] }>()
  const result = bookingFeeFor(procedures, (procedure) => {
    const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
    const rvgGroup = groupOf(masters.rvgGroups, procedure.rvgGroupId)
    const nonRvgLines = Object.values(billingLines).filter((l) => l.procedureId === procedure.id && l.chargeBasis !== 'rvg')
    extras.set(procedure.id, { ...(rvgGroup !== undefined ? { rvgGroup } : {}), ...(contract !== undefined ? { contract } : {}), nonRvgLines })
    const ctx: ProcedureFeeContext = {
      anaesthetist,
      dateISO: list.dateISO,
      timeRule: masters.rvgTimeRule,
      patientDobISO,
      modifiers: masters.modifiers,
      nonRvgLines,
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

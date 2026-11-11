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

import type { AssignedList, BillingLine, Contract, Procedure, RvgGroup } from '../../domain/types'
import { feeFor, type FeeContext, type FeeResult } from '../../domain/billing/fee'
import { groupOf } from '../../domain/billing/rvgGroups'
import type { AppState } from '../../store'

export interface ProcedureFeeArgs {
  procedure: Procedure
  /** The List's anaesthetist prices the fee, so only an assigned List (a Draft List has none yet). */
  list: AssignedList
  masters: AppState['masters']
  billingLines: Record<string, BillingLine>
  /** The Booking's patient: the age modifier reads their date of birth (catch-up Phase 19b). */
  patientId: string | undefined
}

export interface ProcedureFeeView {
  fee: FeeResult
  /** The Procedure's RVG group row (catch-up Phase 19), for display. */
  rvgGroup?: RvgGroup
  contract?: Contract
  nonRvgLines: BillingLine[]
}

export function procedureFee({ procedure, list, masters, billingLines, patientId }: ProcedureFeeArgs): ProcedureFeeView {
  const anaesthetist = masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) {
    throw new Error(`list ${list.id} has no anaesthetist ${list.anaesthetistId}`)
  }
  const contract =
    procedure.governingContractId !== undefined
      ? masters.contracts[procedure.governingContractId]
      : undefined
  const rvgGroup = groupOf(masters.rvgGroups, procedure.rvgGroupId)
  const nonRvgLines = Object.values(billingLines).filter(
    (l) => l.procedureId === procedure.id && l.chargeBasis !== 'rvg',
  )

  const ctx: FeeContext = {
    anaesthetist,
    dateISO: list.dateISO,
    timeRule: masters.rvgTimeRule,
    patientDobISO: patientId !== undefined ? masters.patients[patientId]?.dobISO : undefined,
    modifiers: masters.modifiers,
    nonRvgLines,
  }
  if (contract !== undefined) ctx.contract = contract
  if (rvgGroup !== undefined) ctx.rvgGroup = rvgGroup

  const view: ProcedureFeeView = { fee: feeFor(procedure, ctx), nonRvgLines }
  if (rvgGroup !== undefined) view.rvgGroup = rvgGroup
  if (contract !== undefined) view.contract = contract
  return view
}

export interface BookingFeeTotals {
  units: number
  total: number
  /** Some Procedure has no price on the List's date ("Needs a price", catch-up Phase 19a). */
  needsPrice: boolean
}

/** Booking-level totals (the CompleteBar / completion overlay figures): summed
 *  billable units and fee across the Booking's procedures in Booking order. */
export function bookingFee(
  procedures: readonly Procedure[],
  list: AssignedList,
  masters: AppState['masters'],
  billingLines: Record<string, BillingLine>,
  patientId: string | undefined,
): BookingFeeTotals {
  let units = 0
  let total = 0
  let needsPrice = false
  procedures.forEach((procedure) => {
    const { fee } = procedureFee({ procedure, list, masters, billingLines, patientId })
    units += fee.billableUnits
    total += fee.total
    needsPrice ||= fee.needsPrice
  })
  return { units, total: Math.round(total * 100) / 100, needsPrice }
}

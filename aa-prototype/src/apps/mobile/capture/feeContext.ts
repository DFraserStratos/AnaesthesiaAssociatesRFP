/**
 * Fee assembly for the capture UI — plain functions over the store's stable
 * records (components subscribe to the records and call these in useMemo;
 * deriving inside a zustand selector would return fresh references every
 * snapshot). All maths comes from the Phase 01 calculator; this module only
 * gathers its inputs:
 *   - the governing contract is the procedure's STORED-EXPLICIT
 *     `governingContractId` (never `selectContract` — that is the office's
 *     auto-suggest path, not the pricing path),
 *   - the procedure ordinal is its 1-based position in Card order (Type 3
 *     second-procedure pricing depends on it),
 *   - nonRvgLines are this procedure's stored non-rvg lines (rvg-basis stored
 *     lines are never fee inputs).
 */

import type { BillingLine, Contract, List, Procedure, RvgCode } from '../../../domain/types'
import { feeFor, type FeeContext, type FeeResult } from '../../../domain/billing/fee'
import type { AppState } from '../../../store'

export interface ProcedureFeeArgs {
  procedure: Procedure
  list: List
  /** 1-based position of the procedure on its Card. */
  ordinal: number
  masters: AppState['masters']
  billingLines: Record<string, BillingLine>
}

export interface ProcedureFeeView {
  fee: FeeResult
  baseCode?: RvgCode
  contract?: Contract
  nonRvgLines: BillingLine[]
}

export function procedureFee({ procedure, list, ordinal, masters, billingLines }: ProcedureFeeArgs): ProcedureFeeView {
  const anaesthetist = masters.anaesthetists[list.anaesthetistId]
  if (anaesthetist === undefined) {
    throw new Error(`list ${list.id} has no anaesthetist ${list.anaesthetistId}`)
  }
  const contract =
    procedure.governingContractId !== undefined
      ? masters.contracts[procedure.governingContractId]
      : undefined
  const baseCode =
    procedure.rvgBaseCode !== undefined ? masters.rvgCodes[procedure.rvgBaseCode] : undefined
  const nonRvgLines = Object.values(billingLines).filter(
    (l) => l.procedureId === procedure.id && l.chargeBasis !== 'rvg',
  )

  const ctx: FeeContext = {
    anaesthetist,
    contractPrices: Object.values(masters.contractPrices),
    procedureOrdinal: ordinal,
    nonRvgLines,
  }
  if (contract !== undefined) ctx.contract = contract
  if (baseCode !== undefined) ctx.baseCode = baseCode
  if (list.surgeonId !== undefined) ctx.surgeonId = list.surgeonId

  const view: ProcedureFeeView = { fee: feeFor(procedure, ctx), nonRvgLines }
  if (baseCode !== undefined) view.baseCode = baseCode
  if (contract !== undefined) view.contract = contract
  return view
}

export interface CardFeeTotals {
  units: number
  total: number
}

/** Card-level totals (the CompleteBar / completion overlay figures): summed
 *  billable units and fee across the Card's procedures in Card order. */
export function cardFee(
  procedures: readonly Procedure[],
  list: List,
  masters: AppState['masters'],
  billingLines: Record<string, BillingLine>,
): CardFeeTotals {
  let units = 0
  let total = 0
  procedures.forEach((procedure, index) => {
    const { fee } = procedureFee({ procedure, list, ordinal: index + 1, masters, billingLines })
    units += fee.billableUnits
    total += fee.total
  })
  return { units, total: Math.round(total * 100) / 100 }
}

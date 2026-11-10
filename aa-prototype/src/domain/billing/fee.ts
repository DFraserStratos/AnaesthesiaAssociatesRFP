/**
 * The fee calculator — the BTM path, contract pricing (by pricing kind), non-RVG
 * billing lines (fixed + rate x time) and typed price overrides, composed into
 * a structured `FeeResult` the UI only formats (PROGRESS convention 9).
 */

import type {
  Anaesthetist,
  BillingLine,
  ChargeBasis,
  Contract,
  ContractPrice,
  CounterpartyRef,
  PriceOverride,
  Procedure,
  UnitProvenance,
} from '../types'
import { matchContractPrice } from './contracts'
import { roundToCents } from './money'
import { modifierUnits, type RefusedModifier } from './modifierUnits'
import { baseUnitsFor, type BaseUnitsSource, type GuideValue, type RvgGroup } from './rvgGroups'
import { timeUnitsFromMinutes } from './timeUnits'

// ---------------------------------------------------------------------------
// B/T/M resolution
// ---------------------------------------------------------------------------

export interface ResolvedUnits {
  units: number
  source: UnitProvenance
}

export interface BtmBreakdown {
  base: ResolvedUnits
  /** Where the base units came from (catch-up Phase 19; `baseUnitsFor`). */
  baseSource: BaseUnitsSource
  /** The RVG group's guide value (absent with no RVG code). */
  baseGuide?: GuideValue
  /** A recorded base value that differs from the starting value and lies outside the guide (D3: never blocks). */
  baseOutsideGuide: boolean
  time: ResolvedUnits
  modifiers: ResolvedUnits
  /** Modifiers zeroed with a reason (absorbed by the base, or unknown). */
  refusedModifiers: RefusedModifier[]
  /** base + time + modifiers (before the isAdditional split rule). */
  totalUnits: number
}

/** Elapsed minutes between the captured anaesthetic start and handover (0 when absent/inverted). */
function capturedMinutes(procedure: Procedure): number {
  if (procedure.anaestheticStartISO === undefined || procedure.handoverISO === undefined) return 0
  const span =
    (Date.parse(procedure.handoverISO) - Date.parse(procedure.anaestheticStartISO)) / 60000
  return Number.isFinite(span) ? span : 0
}

/**
 * Resolve B/T/M from the procedure's CAPTURED inputs (RFP principle 10 — the
 * inputs are data): seeded values are recomputed from the inputs; a captured
 * value with `overridden` provenance wins over the computation. Base comes
 * from the one starting-units answer (`baseUnitsFor`, catch-up Phase 19): the
 * typed override, else the chosen value on a ranged RVG group, else the
 * group's starting figure, else 0 with no RVG code. Any value is accepted (D3).
 * The group's modifier units (0 by default) join M; Phase 19b decides how
 * itemised modifiers combine with them.
 */
export function resolveBtm(procedure: Procedure, group?: RvgGroup): BtmBreakdown {
  // Base
  const resolvedBase = baseUnitsFor({ procedure, ...(group !== undefined ? { group } : {}) })
  const base: ResolvedUnits = {
    units: resolvedBase.units,
    source: resolvedBase.source === 'overridden' ? 'overridden' : 'seeded',
  }

  // Time
  let time: ResolvedUnits
  if (procedure.timeUnitsCaptured?.source === 'overridden') {
    time = { units: procedure.timeUnitsCaptured.units, source: 'overridden' }
  } else {
    time = { units: timeUnitsFromMinutes(capturedMinutes(procedure)), source: 'seeded' }
  }

  // Modifiers — the captured ASA class seeds its AS code even when the chip
  // selection doesn't repeat it (never double-counted when it does).
  const selected =
    procedure.asaClass !== undefined && !procedure.selectedModifierCodes.includes(procedure.asaClass)
      ? [...procedure.selectedModifierCodes, procedure.asaClass]
      : procedure.selectedModifierCodes
  const computed = modifierUnits(selected, group)
  let modifiers: ResolvedUnits
  if (procedure.modifierUnitsCaptured?.source === 'overridden') {
    modifiers = { units: procedure.modifierUnitsCaptured.units, source: 'overridden' }
  } else {
    modifiers = { units: computed.units + (group?.modifierUnits ?? 0), source: 'seeded' }
  }

  return {
    base,
    baseSource: resolvedBase.source,
    ...(resolvedBase.guide !== undefined ? { baseGuide: resolvedBase.guide } : {}),
    baseOutsideGuide: resolvedBase.outsideGuide,
    time,
    modifiers,
    refusedModifiers: computed.refused,
    totalUnits: base.units + time.units + modifiers.units,
  }
}

/**
 * The RFP's split-billing rule: an additional procedure (added with Add
 * another procedure) yields TIME UNITS ONLY; base and modifiers charge on the first
 * procedure alone.
 */
export function splitBillingUnits(procedure: Procedure, btm: BtmBreakdown): number {
  return procedure.isAdditional ? btm.time.units : btm.totalUnits
}

// ---------------------------------------------------------------------------
// Fee composition
// ---------------------------------------------------------------------------

export interface FeeContext {
  anaesthetist: Anaesthetist
  /** The governing Contract (the stored one, or the one the billing resolver chose). */
  contract?: Contract
  /** Fixed-price rows (any contract's — filtered by `matchContractPrice`). */
  contractPrices?: readonly ContractPrice[]
  /** The RVG group row for `procedure.rvgGroupId` (catch-up Phase 19). */
  rvgGroup?: RvgGroup
  /** For fixed-price row matching. */
  surgeonId?: string
  /** 1-based position of the procedure on its Booking (2nd-procedure rules). */
  procedureOrdinal?: number
  /**
   * The procedure's captured NON-RVG billing lines (fixed / rate x time).
   * RVG-basis lines are never inputs — the calculator produces the RVG amount
   * itself from the captured BTM data.
   */
  nonRvgLines?: readonly BillingLine[]
}

export interface FeeLine {
  chargeBasis: ChargeBasis
  description: string
  amount: number
  units?: number
  /** $ per unit ('rvg') or $ per hour ('rateTime'). */
  rate?: number
  hours?: number
  funderOverride?: CounterpartyRef
}

export interface AppliedOverride {
  override: PriceOverride
  /** Subtotal before the override. */
  before: number
  /** Total after the override. */
  after: number
}

export interface FeeResult {
  btm: BtmBreakdown
  /** Units actually charged (after the isAdditional time-only rule). */
  billableUnits: number
  /** Basis of the primary component; 'mixed' when lines span bases. */
  chargeBasis: ChargeBasis | 'mixed'
  /** $ per unit applied on the RVG path (null when a fixed price applied). */
  unitRate: number | null
  lines: FeeLine[]
  /** Sum of all lines, before any price override. */
  subtotal: number
  override: AppliedOverride | null
  total: number
}

/**
 * Compute a procedure's fee.
 *
 * Contract pricing by pricing kind (catch-up Phase 18; AR-58 2.3): RVG at the
 * anaesthetist's rate charges units x their own unit value; RVG at the
 * Contract's rate charges units x its rate; RVG less a discount charges units
 * x the anaesthetist's unit value less the discount; a fixed price looks up the
 * interim ContractPrice rows (most-specific match, including 2nd-procedure
 * ordinals) and FALLS BACK to the BTM path when no row matches (Decisions log
 * 2026-07-22; time-only still applies if `isAdditional`). Open price, and no
 * Contract, price as RVG at the anaesthetist's rate (the amount is typed as
 * an override). The resolver and validator own "No price in force".
 */
export function feeFor(procedure: Procedure, ctx: FeeContext): FeeResult {
  const btm = resolveBtm(procedure, ctx.rvgGroup)
  const billableUnits = splitBillingUnits(procedure, btm)
  const lines: FeeLine[] = []

  // --- the RVG / fixed-price component ---
  const contract = ctx.contract
  let unitRate: number | null = ctx.anaesthetist.unitValue
  const pricing = contract?.pricing
  if (pricing?.kind === 'rvgContractRate') {
    unitRate = pricing.unitRate
  } else if (pricing?.kind === 'rvgDiscount') {
    // A per-unit dollar rate is money: the derived discount rate rounds to
    // cents HERE so the charged amount and any displayed/snapshotted "$x.xx
    // per unit" can never disagree (8th review; reproducibility principle 10).
    unitRate = roundToCents(ctx.anaesthetist.unitValue * (1 - pricing.discountPct / 100))
  }

  let fixedPrice: ContractPrice | undefined
  if (contract !== undefined && pricing?.kind === 'fixed') {
    fixedPrice = matchContractPrice(ctx.contractPrices ?? [], {
      contractId: contract.id,
      rvgGroupId: procedure.rvgGroupId,
      surgeonId: ctx.surgeonId,
      procedureOrdinal: ctx.procedureOrdinal,
    })
    // Split-billing hard rule vs fixed pricing (8th review): an ADDITIONAL
    // procedure takes a fixed price only when the contract explicitly priced
    // its ordinal (e.g. the bariatric second-procedure row). A row with no
    // ordinal key priced the code AS A PRIMARY, and charging it in full for an
    // add-on would re-claim the base component — fall to the BTM path instead,
    // where the time-only rule applies (Decisions log 2026-07-22 fallback).
    if (fixedPrice !== undefined && procedure.isAdditional && fixedPrice.procedureOrdinal === undefined) {
      fixedPrice = undefined
    }
  }

  if (fixedPrice !== undefined) {
    unitRate = null
    lines.push({
      chargeBasis: 'fixed',
      description: 'Contract price',
      amount: roundToCents(fixedPrice.price),
    })
  } else if (procedure.rvgGroupId !== undefined) {
    lines.push({
      chargeBasis: 'rvg',
      description: procedure.isAdditional
        ? 'Anaesthesia, additional procedure (time units only)'
        : 'Anaesthesia (B + T + M units)',
      amount: roundToCents(billableUnits * (unitRate ?? 0)),
      units: billableUnits,
      rate: unitRate ?? undefined,
    })
  }

  // --- captured non-RVG lines (fixed / rate x time) ---
  for (const line of ctx.nonRvgLines ?? []) {
    if (line.chargeBasis === 'rvg') continue
    const amount =
      line.chargeBasis === 'rateTime' && line.hours !== undefined && line.rate !== undefined
        ? roundToCents(line.hours * line.rate)
        : roundToCents(line.amount)
    const fee: FeeLine = { chargeBasis: line.chargeBasis, description: line.description, amount }
    if (line.chargeBasis === 'rateTime') {
      fee.hours = line.hours
      fee.rate = line.rate
    }
    if (line.funderOverride !== undefined) fee.funderOverride = line.funderOverride
    lines.push(fee)
  }

  const subtotal = roundToCents(lines.reduce((sum, l) => sum + l.amount, 0))

  // --- typed price override: fixed replaces, $ adjusts, % scales ---
  let total = subtotal
  let applied: AppliedOverride | null = null
  const override = procedure.priceOverride
  if (override !== undefined) {
    if (override.kind === 'fixedFee') {
      total = roundToCents(override.amount)
    } else if (override.kind === 'dollarAdjustment') {
      total = roundToCents(subtotal + override.amount)
    } else {
      total = roundToCents(subtotal * (1 + override.percent / 100))
    }
    applied = { override, before: subtotal, after: total }
  }

  const bases = new Set(lines.map((l) => l.chargeBasis))
  const chargeBasis: ChargeBasis | 'mixed' =
    bases.size > 1 ? 'mixed' : (lines[0]?.chargeBasis ?? 'rvg')

  return { btm, billableUnits, chargeBasis, unitRate, lines, subtotal, override: applied, total }
}

/**
 * The fee calculator — the BTM path, contract pricing (Types 1/2/3), non-RVG
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
  RvgCode,
  UnitProvenance,
} from '../types'
import { matchContractPrice } from './contracts'
import { roundToCents } from './money'
import { modifierUnits, type RefusedModifier } from './modifierUnits'
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
 * value with `overridden` provenance wins over the computation. Base is capped
 * at one code (`rvgBaseCode` is scalar); a range base uses `baseUnitsSelected`
 * (the validator flags a missing/out-of-range selection — here it counts 0).
 */
export function resolveBtm(procedure: Procedure, baseCode?: RvgCode): BtmBreakdown {
  // Base
  let base: ResolvedUnits
  if (procedure.baseUnitsCaptured?.source === 'overridden') {
    base = { units: procedure.baseUnitsCaptured.units, source: 'overridden' }
  } else if (baseCode === undefined) {
    base = { units: 0, source: 'seeded' }
  } else if (baseCode.baseUnits.kind === 'single') {
    base = { units: baseCode.baseUnits.units, source: 'seeded' }
  } else {
    base = { units: procedure.baseUnitsSelected ?? 0, source: 'seeded' }
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
  const computed = modifierUnits(selected, baseCode)
  let modifiers: ResolvedUnits
  if (procedure.modifierUnitsCaptured?.source === 'overridden') {
    modifiers = { units: procedure.modifierUnitsCaptured.units, source: 'overridden' }
  } else {
    modifiers = { units: computed.units, source: 'seeded' }
  }

  return {
    base,
    time,
    modifiers,
    refusedModifiers: computed.refused,
    totalUnits: base.units + time.units + modifiers.units,
  }
}

/**
 * The RFP's split-billing rule: an additional procedure (e.g. on a copied
 * Card) yields TIME UNITS ONLY; base and modifiers charge on the first
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
  /** The governing contract (resolved by the caller, e.g. via `selectContract`). */
  contract?: Contract
  /** Type 3 price list rows (any contract's — filtered by `matchContractPrice`). */
  contractPrices?: readonly ContractPrice[]
  /** The resolved RVG master row for `procedure.rvgBaseCode`. */
  baseCode?: RvgCode
  /** For Type 3 price matching. */
  surgeonId?: string
  /** 1-based position of the procedure on its Card (2nd-procedure rules). */
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
  /** $ per unit applied on the RVG path (null when a Type 3 fixed price applied). */
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
 * Contract pricing: Type 1 charges units x the anaesthetist's own unit value;
 * Type 2 charges units x an agreed unit rate, or applies a % discount to the
 * anaesthetist's unit value; Type 3 looks up a fixed price (most-specific
 * ContractPrice match, including 2nd-procedure ordinals) and FALLS BACK to the
 * BTM path when no row matches (Decisions log 2026-07-22 — a demo reading of
 * the RFP's "various rules apply"; time-only still applies if `isAdditional`).
 * No contract behaves as Type 1 (the validator owns route/contract complaints).
 */
export function feeFor(procedure: Procedure, ctx: FeeContext): FeeResult {
  const btm = resolveBtm(procedure, ctx.baseCode)
  const billableUnits = splitBillingUnits(procedure, btm)
  const lines: FeeLine[] = []

  // --- the RVG / fixed-price component ---
  const contract = ctx.contract
  let unitRate: number | null = ctx.anaesthetist.unitValue
  if (contract?.type === 2 && contract.type2Detail !== undefined) {
    unitRate =
      contract.type2Detail.basis === 'agreedUnitRate'
        ? contract.type2Detail.unitRate
        : ctx.anaesthetist.unitValue * (1 - contract.type2Detail.percent / 100)
  }

  let fixedPrice: ContractPrice | undefined
  if (contract?.type === 3) {
    fixedPrice = matchContractPrice(ctx.contractPrices ?? [], {
      contractId: contract.id,
      rvgBaseCode: procedure.rvgBaseCode,
      surgeonId: ctx.surgeonId,
      procedureOrdinal: ctx.procedureOrdinal,
    })
  }

  if (fixedPrice !== undefined) {
    unitRate = null
    lines.push({
      chargeBasis: 'fixed',
      description: 'Contract price',
      amount: roundToCents(fixedPrice.price),
    })
  } else if (procedure.rvgBaseCode !== undefined) {
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

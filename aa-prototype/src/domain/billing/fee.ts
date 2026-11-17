/**
 * The fee calculator: the BTM path, contract pricing (by pricing kind), non-RVG
 * billing lines (fixed + rate x time) and typed price overrides, composed into
 * a structured `FeeResult` the UI only formats (PROGRESS convention 9).
 *
 * Since catch-up Phase 23 every Procedure is priced from its place in its
 * Booking (`FeeContext.allocation`, from `multiProcedure.ts`): `bookingFeeFor`
 * (`bookingFee.ts`) is the one entry point that allocates a Booking and calls
 * `feeFor` for each of its Procedures.
 */

import type {
  Anaesthetist,
  BillingLine,
  ChargeBasis,
  Contract,
  PriceOverride,
  Procedure,
  UnitProvenance,
} from '../types'
import { roundToCents } from './money'
import { rangeInForce } from './priceRanges'
import { procedureModifiers, type Modifier, type ModifierId, type ProcedureModifier } from './modifiers'
import { baseUnitsFor, resolveStartingUnits, type BaseUnitsSource, type GuideValue, type RvgGroup } from './rvgGroups'
import { timeUnitsFromMinutes, type RvgTimeRule } from './timeUnits'
import type { ProcedureAllocation } from './multiProcedure'

// ---------------------------------------------------------------------------
// B/T/M resolution
// ---------------------------------------------------------------------------

export interface ResolvedUnits {
  units: number
  source: UnitProvenance
}

export interface BtmBreakdown {
  /** Base units: 0 on an additional Procedure (source `'additional'`), whatever its RVG group (catch-up Phase 23). */
  base: ResolvedUnits
  /** Where the base units came from (catch-up Phase 19; `baseUnitsFor`), or `'additional'`. */
  baseSource: BaseUnitsSource
  /** The RVG group's guide value (absent with no RVG code). */
  baseGuide?: GuideValue
  /** A recorded base value that differs from the starting value and lies outside the guide (D3: never blocks). */
  baseOutsideGuide: boolean
  time: ResolvedUnits
  /**
   * The modifier units: on the primary, the Booking's total (recorded there
   * once, catch-up Phase 23); on an additional Procedure, its share of that
   * total under the multi-procedure rule.
   */
  modifiers: ResolvedUnits
  /**
   * The itemised modifiers (catch-up Phase 19b): the pre-applied age and
   * included rows, then the claims, each with its origin and units; a refused
   * duplicate is listed with its reason and adds nothing. The UI, the units
   * caption, the multi-procedure split and Phase 25's snapshot read this one
   * answer. On an additional Procedure only its own included rows (0 units,
   * US-05.1.4 per Procedure): the Booking's modifiers are the primary's.
   */
  modifierItems: ProcedureModifier[]
  /** base + time + modifiers, as recorded on this Procedure. */
  totalUnits: number
}

/** Elapsed minutes between the captured anaesthetic start and finish (0 when absent/inverted). */
function capturedMinutes(procedure: Procedure): number {
  if (procedure.anaestheticStartISO === undefined || procedure.handoverISO === undefined) return 0
  const span =
    (Date.parse(procedure.handoverISO) - Date.parse(procedure.anaestheticStartISO)) / 60000
  return Number.isFinite(span) ? span : 0
}

/**
 * What the modifier rules need beyond the Procedure (catch-up Phase 19b): the
 * patient's date of birth and the procedure date (the List's) for the age
 * modifier, and the modifier master. Every fee-context assembler passes the
 * same inputs.
 */
export interface ModifierInputs {
  patientDobISO?: string
  procedureDateISO?: string
  modifiers: Readonly<Record<ModifierId, Modifier>>
}

/** A Procedure's place in the multi-procedure rule, as `resolveBtm` reads it (none: priced as the primary). */
export type BtmRole = Pick<ProcedureAllocation, 'role' | 'modifierShare'> & Partial<Pick<ProcedureAllocation, 'baseCharged'>>

/**
 * Resolve B/T/M from the procedure's CAPTURED inputs (RFP principle 10 — the
 * inputs are data): seeded values are recomputed from the inputs; a captured
 * value with `overridden` provenance wins over the computation. Base comes
 * from the one starting-units answer (`baseUnitsFor`, catch-up Phase 19): the
 * typed override, else the chosen value on a ranged RVG group, else the
 * group's starting figure, else 0 with no RVG code. Any value is accepted (D3).
 * M is the group's starting modifier units (0 by default) plus the itemised
 * modifiers from the one rule module (`modifiers.ts`, catch-up Phase 19b): the
 * pre-applied age and included rows and the claims. Time units follow the RVG time rule
 * held as data (`masters.rvgTimeRule`, catch-up Phase 19a), from the start
 * and finish stamps only.
 *
 * `role` (catch-up Phase 23): on an additional Procedure base is 0 with source
 * `'additional'` (unless `baseOn` placed the base there, `baseCharged`),
 * whatever its group, range choice or stored capture, and M is
 * its share of the Booking's modifiers (its own claims and starting figure
 * ignored, so nothing counts twice and the age modifier counts once for the
 * Booking). With no role (or the primary) B and M are the Procedure's own.
 */
export function resolveBtm(
  procedure: Procedure,
  group: RvgGroup | undefined,
  timeRule: RvgTimeRule,
  modifierInputs: ModifierInputs,
  role?: BtmRole,
): BtmBreakdown {
  const additional = role?.role === 'additional'
  // Base: where `baseOn` puts it (the allocation's `baseCharged`), else 0 on an additional Procedure.
  const noBase = additional && role?.baseCharged !== true
  const resolvedBase = baseUnitsFor({ procedure, ...(group !== undefined ? { group } : {}) })
  const base: ResolvedUnits = noBase
    ? { units: 0, source: 'seeded' }
    : { units: resolvedBase.units, source: resolvedBase.source === 'overridden' ? 'overridden' : 'seeded' }

  // Time
  let time: ResolvedUnits
  if (procedure.timeUnitsCaptured?.source === 'overridden') {
    time = { units: procedure.timeUnitsCaptured.units, source: 'overridden' }
  } else {
    time = { units: timeUnitsFromMinutes(capturedMinutes(procedure), timeRule), source: 'seeded' }
  }

  // Modifiers: the starting value plus the itemised list (the manual
  // adjustment, `modifierUnitsCaptured` overridden, still wins on the total).
  const computed = procedureModifiers(procedure, {
    ...(modifierInputs.patientDobISO !== undefined ? { patientDobISO: modifierInputs.patientDobISO } : {}),
    ...(modifierInputs.procedureDateISO !== undefined ? { procedureDateISO: modifierInputs.procedureDateISO } : {}),
    ...(group !== undefined ? { group } : {}),
    modifiers: modifierInputs.modifiers,
    start: group !== undefined ? resolveStartingUnits({ group }).modifier.units : 0,
  })
  let modifiers: ResolvedUnits
  if (additional) {
    modifiers = { units: role?.modifierShare ?? 0, source: 'seeded' }
  } else if (procedure.modifierUnitsCaptured?.source === 'overridden') {
    modifiers = { units: procedure.modifierUnitsCaptured.units, source: 'overridden' }
  } else {
    modifiers = { units: computed.units, source: 'seeded' }
  }

  return {
    base,
    baseSource: noBase ? 'additional' : resolvedBase.source,
    ...(resolvedBase.guide !== undefined ? { baseGuide: resolvedBase.guide } : {}),
    baseOutsideGuide: !noBase && resolvedBase.outsideGuide,
    time,
    modifiers,
    modifierItems: additional ? computed.items.filter((i) => i.origin === 'included') : computed.items,
    totalUnits: base.units + time.units + modifiers.units,
  }
}

/**
 * The units a Procedure earns under the multi-procedure rule (catch-up Phase
 * 23): base on the primary (`baseOn`'s Procedure), time on every Procedure,
 * and its share of the Booking's modifiers. On an RVG-priced Procedure these
 * are the units charged at a rate; on a fixed or open price they are recorded
 * for reference and the price stands.
 */
export function unitsUnderRule(btm: BtmBreakdown, allocation: ProcedureAllocation): number {
  // Base where `baseOn` puts it (`baseCharged`); a fixed or open price primary records its own for reference.
  const base = allocation.baseCharged || allocation.role === 'primary' ? btm.base.units : 0
  return base + btm.time.units + allocation.modifierShare
}

// ---------------------------------------------------------------------------
// Fee composition
// ---------------------------------------------------------------------------

export interface FeeContext {
  anaesthetist: Anaesthetist
  /** The governing Contract (the stored one, or the one the billing resolver chose). */
  contract?: Contract
  /** The RVG group row for `procedure.rvgGroupId` (catch-up Phase 19). */
  rvgGroup?: RvgGroup
  /**
   * The procedure date (the List's date, catch-up Phase 19a): it picks the
   * fixed price's range in force (`rangeInForce`).
   */
  dateISO: string
  /** The RVG time rule held as data (`masters.rvgTimeRule`, catch-up Phase 19a). */
  timeRule: RvgTimeRule
  /**
   * The patient's date of birth (catch-up Phase 19b): the age modifier is
   * pre-applied from it on `dateISO`. Undefined when no patient is known.
   */
  patientDobISO: string | undefined
  /** The modifier master (`masters.modifiers`, catch-up Phase 19b). */
  modifiers: Readonly<Record<ModifierId, Modifier>>
  /**
   * This Procedure's place in its Booking under the multi-procedure rule
   * (catch-up Phase 23): from `bookingFeeFor`, the one entry point, or
   * `soleAllocation` for the Booking's only Procedure.
   */
  allocation: ProcedureAllocation
  /** How many Procedures the Booking has: the line descriptions name the role only with two or more. */
  bookingProcedureCount?: number
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
  /**
   * The units under the multi-procedure rule (`unitsUnderRule`), charged at a
   * rate, on an RVG-priced Procedure; on a fixed or open price, its own units
   * (B + T + M, unadjusted by the rule), for reference.
   */
  billableUnits: number
  /** The allocation this fee was priced from (catch-up Phase 23), echoed. */
  allocation: ProcedureAllocation
  /** Basis of the primary component; 'mixed' when lines span bases. */
  chargeBasis: ChargeBasis | 'mixed'
  /** $ per unit applied on the RVG path (null when a fixed price applied). */
  unitRate: number | null
  lines: FeeLine[]
  /** Sum of all lines, before any price override. */
  subtotal: number
  override: AppliedOverride | null
  total: number
  /**
   * True when the Procedure has no price: a fixed-price Contract with no range
   * in force on the procedure date (catch-up Phase 19a). There is then no
   * price line and no amount to show: every money surface reads "Needs a
   * price" instead of the figure, and the validator and billing resolver
   * refuse it. An office fixed-fee override is a typed price and clears it.
   */
  needsPrice: boolean
}

/** The modifier inputs a fee context carries (the procedure date is the List's). */
export function modifierInputsOf(ctx: Pick<FeeContext, 'patientDobISO' | 'dateISO' | 'modifiers'>): ModifierInputs {
  return {
    ...(ctx.patientDobISO !== undefined ? { patientDobISO: ctx.patientDobISO } : {}),
    procedureDateISO: ctx.dateISO,
    modifiers: ctx.modifiers,
  }
}

/**
 * Compute a procedure's fee.
 *
 * Contract pricing by pricing kind (catch-up Phase 18; AR-58 2.3): RVG at the
 * anaesthetist's rate charges units x their own unit value; RVG at the
 * Contract's rate charges units x its rate; RVG less a discount charges units
 * x the anaesthetist's unit value less the discount. A fixed price (catch-up
 * Phase 19a) is the price of the range in force on the procedure date, the
 * whole price on any Procedure, primary or additional (BTM still computed for
 * reference); with no range in force the result `needsPrice`, with no amount
 * and never a fallback to RVG. An open price is the amount typed on the
 * Procedure (`enteredPrice`, catch-up Phase 20); with none it `needsPrice`
 * (its RVG figure is working only). The resolver and validator own the refusal.
 */
export function feeFor(procedure: Procedure, ctx: FeeContext): FeeResult {
  const { allocation } = ctx
  // The rule adjusts RVG-priced Procedures only (US-05.3.1, A19): a fixed or open price keeps its
  // own units, unadjusted, for reference, and its price stands. A fixed or open price primary
  // counts the Booking's modifiers under the rule (its share), so a split is never counted twice.
  const btm = resolveBtm(procedure, ctx.rvgGroup, ctx.timeRule, modifierInputsOf(ctx), allocation.rvgPriced ? allocation : undefined)
  const billableUnits = allocation.rvgPriced || allocation.role === 'primary' ? unitsUnderRule(btm, allocation) : btm.totalUnits
  const several = (ctx.bookingProcedureCount ?? 1) > 1
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

  const isFixed = contract !== undefined && pricing?.kind === 'fixed'
  const range = isFixed ? rangeInForce(contract, ctx.dateISO) : null
  // An open price has no price of its own: the amount typed on the Procedure
  // is its price (catch-up Phase 20, US-04.3.9, US-05.2.5; INTERIM
  // `enteredPrice` until Phase 24). With none typed, the RVG figure below is
  // working only, never shown as its price (catch-up Phase 19a).
  const typedOpenPrice = pricing?.kind === 'open' ? procedure.enteredPrice : undefined
  let needsPrice = (isFixed && range === null) || (pricing?.kind === 'open' && typedOpenPrice === undefined)

  if (typedOpenPrice !== undefined) {
    unitRate = null
    lines.push({ chargeBasis: 'fixed', description: 'Typed price', amount: roundToCents(typedOpenPrice) })
  } else if (isFixed) {
    unitRate = null
    if (range !== null) {
      lines.push({
        chargeBasis: 'fixed',
        description: several ? `Contract price, ${allocation.role} procedure` : 'Contract price',
        amount: roundToCents(range.price),
      })
    }
  } else if (procedure.rvgGroupId !== undefined) {
    lines.push({
      chargeBasis: 'rvg',
      description: several ? rvgLineDescription(btm, allocation) : 'Anaesthesia (B + T + M units)',
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
    // A typed fixed fee is a price a person set; an adjustment of nothing is not.
    if (override.kind === 'fixedFee') needsPrice = false
  }

  const bases = new Set(lines.map((l) => l.chargeBasis))
  const chargeBasis: ChargeBasis | 'mixed' =
    bases.size > 1 ? 'mixed' : (lines[0]?.chargeBasis ?? (isFixed || typedOpenPrice !== undefined ? 'fixed' : 'rvg'))

  return { btm, billableUnits, allocation, chargeBasis, unitRate, lines, subtotal, override: applied, total, needsPrice }
}

/**
 * The RVG line on a Booking with two or more Procedures (catch-up Phase 23):
 * "Anaesthesia, primary procedure (B 6 + T 6 + M 3 of 7 units)" or
 * "Anaesthesia, additional procedure (T 2 + M 2 of 7 units)", "of n" only
 * when the modifiers split, and an additional Procedure with no share reads
 * its time units alone. No dashes (app copy).
 */
export function rvgLineDescription(btm: BtmBreakdown, allocation: ProcedureAllocation): string {
  const share = allocation.modifierShare
  const m = allocation.splitAcross > 1 ? `M ${share} of ${allocation.bookingModifierUnits}` : `M ${share}`
  if (allocation.role === 'primary') {
    const parts = [...(allocation.baseCharged ? [`B ${btm.base.units}`] : []), `T ${btm.time.units}`, m]
    return `Anaesthesia, primary procedure (${parts.join(' + ')} units)`
  }
  const parts = [`T ${btm.time.units}`, ...(share > 0 ? [m] : [])]
  return `Anaesthesia, additional procedure (${parts.join(' + ')} units)`
}

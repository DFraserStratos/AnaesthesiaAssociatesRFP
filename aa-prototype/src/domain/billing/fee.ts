/**
 * The fee calculator: the BTM path, the price from the one price function
 * (`procedurePrice.ts`, catch-up Phase 24) and the non-RVG billing lines
 * (fixed amounts), composed into a structured `FeeResult` the UI only
 * formats (PROGRESS convention 9).
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
  Procedure,
  UnitProvenance,
} from '../types'
import { roundToCents } from './money'
import { isRvgKind } from './contracts'
import { priceFor, type HeldPrices, type PriceResult } from './procedurePrice'
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
   * The procedure's captured NON-RVG billing lines (fixed amounts, until 39b).
   * RVG-basis lines are never inputs — the calculator produces the RVG amount
   * itself from the captured BTM data.
   */
  nonRvgLines?: readonly BillingLine[]
  /**
   * The held amounts the price ladder reads ahead of a typed price (catch-up
   * Phase 24, `procedurePrice.ts`): the AUTHORISED and prepaid rungs, from the
   * store's `heldPricesFor`. Absent: nothing holds the price.
   */
  held?: HeldPrices
}

export interface FeeLine {
  chargeBasis: ChargeBasis
  description: string
  amount: number
  units?: number
  /** $ per unit ('rvg'). */
  rate?: number
  /**
   * `discount`: the Contract's discount on RVG less the Contract's discount,
   * its own negative line after the fee line at the gross (catch-up Phase 24,
   * US-05.4.3). Absent on every other line.
   */
  role?: 'discount'
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
  /** $ per unit the computed price charges on an RVG kind (the gross rate on a discount Contract); null otherwise. */
  unitRate: number | null
  lines: FeeLine[]
  /** Sum of all lines: the price. */
  subtotal: number
  /**
   * The price ladder's answer (catch-up Phase 24, `priceFor`): what the price
   * is, what holds it, and the computed figure beside it.
   */
  price: PriceResult
  total: number
  /**
   * True when the Procedure has no price (`price.status === 'needsPrice'`): an
   * open price with no amount typed, or a fixed price with no range in force
   * on the procedure date. There is then no price line: every money surface
   * reads "Needs a price" instead of the figure, and completion, the
   * validator and the billing resolver refuse it.
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
 * Compute a procedure's fee: its price from the one price function
 * (`priceFor`, catch-up Phase 24) and the lines an invoice prints for it.
 *
 * The units are the multi-procedure rule's (catch-up Phase 23). On an RVG kind
 * the computed price is units x the rate (the Contract's, else the
 * anaesthetist's unit value), less the Contract's discount as its own line; a
 * fixed price is the range in force on the procedure date (BTM computed for
 * reference); an open price has none of its own. A held or typed price prints
 * as one line at the price. With no price, `needsPrice` and no price line.
 * Captured fixed billing lines (until 39b) are part of the computed price; a
 * typed or held price is the whole price.
 */
export function feeFor(procedure: Procedure, ctx: FeeContext): FeeResult {
  const { allocation } = ctx
  // The rule adjusts RVG-priced Procedures only (US-05.3.1, A19): a fixed or open price keeps its
  // own units, unadjusted, for reference, and its price stands. A fixed or open price primary
  // counts the Booking's modifiers under the rule (its share), so a split is never counted twice.
  const btm = resolveBtm(procedure, ctx.rvgGroup, ctx.timeRule, modifierInputsOf(ctx), allocation.rvgPriced ? allocation : undefined)
  const billableUnits = allocation.rvgPriced || allocation.role === 'primary' ? unitsUnderRule(btm, allocation) : btm.totalUnits
  const several = (ctx.bookingProcedureCount ?? 1) > 1
  const contract = ctx.contract
  const kind = contract?.pricing.kind ?? 'rvgAnaesthetistRate'
  const rvgKind = isRvgKind(kind)

  // --- captured fixed billing lines, until 39b ---
  const addOnLines: FeeLine[] = []
  for (const line of ctx.nonRvgLines ?? []) {
    if (line.chargeBasis === 'rvg') continue
    addOnLines.push({ chargeBasis: line.chargeBasis, description: line.description, amount: roundToCents(line.amount) })
  }
  const addOns = roundToCents(addOnLines.reduce((sum, l) => sum + l.amount, 0))

  // An RVG kind charges units only once an RVG code is recorded (no code: no RVG line, as before).
  const units = rvgKind && procedure.rvgGroupId !== undefined ? billableUnits : 0
  const price = priceFor({
    contract,
    dateISO: ctx.dateISO,
    enteredPrice: procedure.enteredPrice,
    units,
    unitValue: ctx.anaesthetist.unitValue,
    ...(ctx.held !== undefined ? { held: ctx.held } : {}),
    addOns,
  })

  const fixedDescription = several ? `Contract price, ${allocation.role} procedure` : 'Contract price'
  const rvgDescription = several ? rvgLineDescription(btm, allocation) : 'Anaesthesia (B + T + M units)'
  const lines: FeeLine[] = []
  let unitRate: number | null = null
  if (price.status === 'priced' && price.heldBy !== null) {
    // A held or typed amount is the whole price (billing lines included): one line at the price. On an
    // RVG kind it stays the RVG line with its units, for reference (US-03.5.2), with no rate to multiply.
    const description = kind === 'open' ? 'Typed price' : rvgKind ? rvgDescription : fixedDescription
    lines.push({ chargeBasis: rvgKind ? 'rvg' : 'fixed', description, amount: price.price, ...(rvgKind ? { units: billableUnits } : {}) })
  } else if (price.status === 'priced') {
    const computed = price.computed!
    if (computed.kind === 'fixed') {
      lines.push({ chargeBasis: 'fixed', description: fixedDescription, amount: computed.gross })
    } else if (procedure.rvgGroupId !== undefined) {
      lines.push({ chargeBasis: 'rvg', description: rvgDescription, amount: computed.gross, units: billableUnits, ...(computed.rate !== undefined ? { rate: computed.rate } : {}) })
      if (computed.discountAmount !== 0) {
        lines.push({ chargeBasis: 'rvg', role: 'discount', description: `Discount ${computed.discountPercent}%`, amount: -computed.discountAmount })
      }
    }
    if (rvgKind) unitRate = computed.rate ?? null
    lines.push(...addOnLines)
  } else {
    lines.push(...addOnLines)
  }

  const subtotal = roundToCents(lines.reduce((sum, l) => sum + l.amount, 0))
  const total = price.status === 'priced' ? price.price : subtotal
  const bases = new Set(lines.filter((l) => l.role === undefined).map((l) => l.chargeBasis))
  const chargeBasis: ChargeBasis | 'mixed' = bases.size > 1 ? 'mixed' : (lines[0]?.chargeBasis ?? (rvgKind ? 'rvg' : 'fixed'))

  return { btm, billableUnits, allocation, chargeBasis, unitRate, lines, subtotal, price, total, needsPrice: price.status === 'needsPrice' }
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

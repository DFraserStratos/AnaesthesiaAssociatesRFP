/**
 * A Procedure's price, one function (catch-up Phase 24; US-05.2.8, FT-05.2,
 * US-04.2.2, DM-50; AR-58 2.3 and 5.7 to 5.8). The five pricing kinds, the
 * price ladder and who may change the price live here and nowhere else: the
 * fee engine (`fee.ts`), 21a's price status (`priceStatus.ts`), completion,
 * the review flags, the invoice build and every screen read it.
 *
 * The price at any moment is the first that applies:
 *   1. the AUTHORISED price (INTERIM: the amount invoiced; Phase 25's snapshot);
 *   2. the prepaid amount once its prepayment invoice is raised (INTERIM: the
 *      amount on that invoice; Phase 27's `prepaidAmountFor`);
 *   3. a typed price (`Procedure.enteredPrice`, 0 allowed);
 *   4. computed from the kind: units x the rate (the Contract's, else the
 *      anaesthetist's unit value), less the Contract's discount as its own
 *      amount; or the fixed price's range in force on the procedure date;
 *   5. else "Needs a price" (an open price with no amount, a fixed price with
 *      no range in force).
 *
 * Unedited prices are derived, never stored, so they follow a new range or an
 * edited rate or discount. Nothing here raises a difference invoice or credit.
 */

import { isRvgKind, type Contract, type PricingKind } from './contracts'
import type { ListState, Procedure } from '../types'
import { roundToCents } from './money'
import { rangeInForce } from './priceRanges'

// ---------------------------------------------------------------------------
// The price function
// ---------------------------------------------------------------------------

/** What the kind works out with nothing typed or held (`computed` beside a held price, so it is never lost; US-05.4.1). */
export interface ComputedPrice {
  kind: PricingKind
  /** The units charged at the rate (RVG kinds). */
  units?: number
  /** $ a unit: the Contract's rate, else the anaesthetist's unit value (RVG kinds). */
  rate?: number
  /** units x rate on an RVG kind, or the range's price on a fixed price; rounded to cents once. */
  gross: number
  /** The Contract's discount, a percent (RVG less the Contract's discount only). */
  discountPercent?: number
  /** round(gross x discount); 0 on every other kind. */
  discountAmount: number
  /** gross - discountAmount. */
  total: number
  /** A fixed price: the day the range in force started. */
  rangeStartISO?: string
}

export type PriceHeldBy = 'authorised' | 'prepaid' | 'typed'

export type NeedsPriceReason = 'noRangeInForce' | 'openPrice'

export type PriceResult =
  | {
      status: 'priced'
      /** The Procedure's whole price, ex GST: a held or typed amount, or the computed price with any captured fixed billing lines. */
      price: number
      /** What holds the price; null when it is computed (and so follows its Contract). */
      heldBy: PriceHeldBy | null
      /** The kind's own figure, beside a held price too; absent on an open price. */
      computed?: ComputedPrice
      /**
       * What the price would be with nothing typed or held: the kind's figure
       * plus the captured fixed billing lines. The one "computed" figure every
       * screen shows beside a typed or held price. Absent when the kind has none.
       */
      computedTotal?: number
    }
  | { status: 'needsPrice'; reason: NeedsPriceReason }

/** The two held amounts the ladder reads ahead of a typed price (each INTERIM: see below). */
export interface HeldPrices {
  authorised?: number
  prepaid?: number
}

export interface PriceInput {
  /** The Procedure's Contract; none yet prices at the anaesthetist's unit value, as No contract · RVG does. */
  contract: Pick<Contract, 'pricing'> | undefined
  /** The procedure date (the List's): it picks a fixed price's range in force. */
  dateISO: string
  /** The one typed price (`Procedure.enteredPrice`). */
  enteredPrice: number | undefined
  /** The billable units after the multi-procedure rule (23's `unitsUnderRule`), as recorded so far. */
  units: number
  /** The anaesthetist's unit value in force. */
  unitValue: number
  held?: HeldPrices
  /**
   * The captured fixed billing lines' total (until 39b removes them): part of
   * the computed price. A typed or held amount is the whole price, so it
   * replaces them, as the office's fixed fee always did.
   */
  addOns?: number
}

/** The kind's own figure, or undefined when the kind has none (an open price, a fixed price with no range in force). */
export function computedPriceOf(input: Pick<PriceInput, 'contract' | 'dateISO' | 'units' | 'unitValue'>): ComputedPrice | undefined {
  const pricing = input.contract?.pricing ?? { kind: 'rvgAnaesthetistRate' as const }
  switch (pricing.kind) {
    case 'rvgAnaesthetistRate': {
      const gross = roundToCents(input.units * input.unitValue)
      return { kind: pricing.kind, units: input.units, rate: input.unitValue, gross, discountAmount: 0, total: gross }
    }
    case 'rvgContractRate': {
      const gross = roundToCents(input.units * pricing.unitRate)
      return { kind: pricing.kind, units: input.units, rate: pricing.unitRate, gross, discountAmount: 0, total: gross }
    }
    case 'rvgDiscount': {
      const gross = roundToCents(input.units * input.unitValue)
      const discountAmount = roundToCents((gross * pricing.discountPct) / 100)
      return {
        kind: pricing.kind,
        units: input.units,
        rate: input.unitValue,
        gross,
        discountPercent: pricing.discountPct,
        discountAmount,
        total: roundToCents(gross - discountAmount),
      }
    }
    case 'fixed': {
      // `rangeInForce` reads only `pricing`; the Contract's other fields are never consulted.
      const range = rangeInForce(input.contract as Contract, input.dateISO)
      if (range === null) return undefined
      const gross = roundToCents(range.price)
      return { kind: 'fixed', gross, discountAmount: 0, total: gross, rangeStartISO: range.startISO }
    }
    case 'open':
      return undefined
  }
}

/** A Procedure's price: the first rung of the ladder that applies (see the module comment). */
export function priceFor(input: PriceInput): PriceResult {
  const computed = computedPriceOf(input)
  const withComputed = computed !== undefined ? { computed } : {}
  const computedTotal = computed !== undefined ? roundToCents(computed.total + (input.addOns ?? 0)) : undefined
  const beside = { ...withComputed, ...(computedTotal !== undefined ? { computedTotal } : {}) }
  if (input.held?.authorised !== undefined) return { status: 'priced', price: roundToCents(input.held.authorised), heldBy: 'authorised', ...beside }
  if (input.held?.prepaid !== undefined) return { status: 'priced', price: roundToCents(input.held.prepaid), heldBy: 'prepaid', ...beside }
  if (input.enteredPrice !== undefined) return { status: 'priced', price: roundToCents(input.enteredPrice), heldBy: 'typed', ...beside }
  if (computedTotal !== undefined) return { status: 'priced', price: computedTotal, heldBy: null, ...beside }
  return { status: 'needsPrice', reason: input.contract?.pricing.kind === 'open' ? 'openPrice' : 'noRangeInForce' }
}

/**
 * Whether a Procedure on this Contract has no price on its procedure date:
 * nothing held, no typed price and nothing its kind works out (an open price,
 * or a fixed price with no range in force). The validator, the billing
 * resolver and 21a's price status all ask it, with the held amounts where the
 * caller has them, so the ladder's order holds everywhere.
 */
export function procedureNeedsPrice(contract: Contract, dateISO: string, procedure: Pick<Procedure, 'enteredPrice'>, held?: HeldPrices): boolean {
  return priceFor({ contract, dateISO, enteredPrice: procedure.enteredPrice, units: 0, unitValue: 0, ...(held !== undefined ? { held } : {}) }).status === 'needsPrice'
}

// ---------------------------------------------------------------------------
// The interim held amounts
// ---------------------------------------------------------------------------

/** An invoice line as the interim reads see it. */
export interface HeldInvoiceLine {
  procedureId?: string
  kind?: 'fee' | 'discount' | 'adjustment'
  description: string
  amount: number
}

/** The prepayment deduction a final invoice nets off (27 removes the netting); never part of the Procedure's price. */
export const PREPAYMENT_DEDUCTION_DESCRIPTION = 'Less pre-payment deposit already invoiced'
/** A split prepayment's deposit line (INTERIM `prepaymentDetail`, 27 removes it): a part of the price, never the price. */
export const PREPAYMENT_DEPOSIT_DESCRIPTION = 'Pre-payment deposit'

/** Whether a prepayment invoice line holds the Procedure's price: the full prepayment does, a deposit does not. */
export function holdsPrepaidPrice(line: Pick<HeldInvoiceLine, 'description'>): boolean {
  return line.description !== PREPAYMENT_DEPOSIT_DESCRIPTION
}

/**
 * INTERIM until Phase 25 (its snapshot replaces it): the AUTHORISED rung reads
 * the amount the run invoiced for the Procedure, its fee, discount and price
 * lines on the List's standard invoices (a split's shares summed), less
 * nothing for a prepayment deduction. Undefined until the List is AUTHORISED
 * and an invoice line names the Procedure. A reading, logged.
 */
export function authorisedPriceFor(procedureId: string, listState: ListState, standardInvoiceLines: readonly HeldInvoiceLine[]): number | undefined {
  if (listState !== 'AUTHORISED') return undefined
  let found = false
  let sum = 0
  for (const line of standardInvoiceLines) {
    if (line.procedureId !== procedureId || line.description === PREPAYMENT_DEDUCTION_DESCRIPTION) continue
    found = true
    sum += line.amount
  }
  return found ? roundToCents(sum) : undefined
}

/**
 * INTERIM until Phase 27 (`prepaidAmountFor` replaces it): the prepaid rung
 * reads the amount on a raised prepayment invoice for the Procedure, its full
 * prepayment (a split's deposit is a part of the price, not the price).
 * Undefined when none is raised. A reading, logged.
 */
export function prepaidHeldPriceFor(procedureId: string, prepaymentInvoiceLines: readonly HeldInvoiceLine[]): number | undefined {
  let found = false
  let sum = 0
  for (const line of prepaymentInvoiceLines) {
    if (line.procedureId !== procedureId || !holdsPrepaidPrice(line)) continue
    found = true
    sum += line.amount
  }
  return found ? roundToCents(sum) : undefined
}

// ---------------------------------------------------------------------------
// Who may change the price
// ---------------------------------------------------------------------------

export type AnaesthetistPriceRight =
  | { may: true; mode: 'override' | 'amount' }
  | { may: false; reason: 'notAllowed' | 'fixed' | 'prepaid' | 'office' }

/**
 * Whether the anaesthetist may type this Procedure's price (US-03.5.1,
 * US-05.4.1; OQ-107 (D50), OQ-117 (D65), OQ-96 (D30), A37):
 * - an RVG kind whose override setting is on: `override` (the computed price
 *   and the RVG detail stay recorded beside it); off: `notAllowed`;
 * - No contract · Fixed price (the open-price fallback that bills the patient,
 *   not prepaid): `amount`, she types it;
 * - a fixed price, her own price list included: `fixed`, never;
 * - a prepaid Contract: `prepaid`, never (18 refuses the setting there anyway);
 * - any other open-price fallback, or no Contract: `office` types it, so a
 *   hospital or insurer is never billed a figure the anaesthetist typed.
 */
export function anaesthetistMayTypePrice(
  contract: Pick<Contract, 'pricing' | 'prepaid' | 'anaesthetistMayOverridePrice' | 'billsTo' | 'systemRole'> | undefined,
): AnaesthetistPriceRight {
  if (contract === undefined) return { may: false, reason: 'office' }
  if (contract.prepaid) return { may: false, reason: 'prepaid' }
  const kind = contract.pricing.kind
  if (isRvgKind(kind)) {
    return contract.anaesthetistMayOverridePrice ? { may: true, mode: 'override' } : { may: false, reason: 'notAllowed' }
  }
  if (kind === 'fixed') return { may: false, reason: 'fixed' }
  if (contract.systemRole === 'openPriceFallback' && contract.billsTo === 'payer') return { may: true, mode: 'amount' }
  return { may: false, reason: 'office' }
}

/** An integration never changes a price (it has no rights here). */
export const INTEGRATION_PRICE_MESSAGE = 'An integration cannot change a price.'

/** The office's one limit beyond the edit window (A16, our reading of OQ-96 as narrowed, D30). */
export const PREPAID_PRICE_RAISED_MESSAGE = 'This price is on a raised prepayment invoice. Use a credit or an additional invoice.'

/**
 * Whether the office may change this Procedure's price (US-05.4.2): on any
 * Contract, the override setting, the kind and the fixed test ignored, except
 * a prepaid price once its prepayment invoice is raised (A16, D30 narrowed).
 * The edit window (until AUTHORISED, D63) is the store's.
 */
export function officeMayChangePrice(context: { prepaymentRaised: boolean }): { may: true } | { may: false; message: string } {
  return context.prepaymentRaised ? { may: false, message: PREPAID_PRICE_RAISED_MESSAGE } : { may: true }
}

/**
 * A Booking whose price is $0.00 because a person or a held amount made it so
 * (catch-up Phase 24; US-03.5.1): every Procedure priced, every one held or
 * typed, and the whole at $0.00. A $0 that is only missing RVG detail (an RVG
 * Procedure with no units yet) is not "no charge". Review's pill reads it; the
 * invoice build's own test is the group's subtotal (a reading, logged).
 */
export function isNoChargeBooking(prices: readonly PriceResult[]): boolean {
  return prices.length > 0 && prices.every((p) => p.status === 'priced' && p.heldBy !== null && p.price === 0)
}

/**
 * The read-only price line's caption where the anaesthetist may not change the
 * price (US-03.3.10, US-03.5.1): the Contract that sets it and what to do.
 */
export function anaesthetistPriceCaption(contractName: string, reason: 'notAllowed' | 'fixed' | 'prepaid'): string {
  return reason === 'prepaid'
    ? `Set by ${contractName}. To use a different price, alert the office.`
    : `Set by ${contractName}. To use a different price, change the Contract or alert the office.`
}

/**
 * The anaesthetist's refusal sentence where her gate says no (US-03.5.1). On a
 * prepaid Contract she cannot change the Contract either (A17), so only the
 * office is offered.
 */
export function anaesthetistPriceRefusalMessage(contractName: string | undefined, reason?: 'notAllowed' | 'fixed' | 'prepaid' | 'office'): string {
  const who = contractName ?? 'The office'
  return reason === 'prepaid' ? `${who} sets this price. Alert the office.` : `${who} sets this price. Change the Contract or alert the office.`
}

/** A typed price is dollars to the cent, 0 or more. */
export function typedPriceProblem(amount: number | null | undefined): string | null {
  if (amount === null || amount === undefined) return null
  if (!Number.isFinite(amount) || amount < 0 || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6) {
    return 'Type the price in dollars and cents, 0 or more.'
  }
  return null
}

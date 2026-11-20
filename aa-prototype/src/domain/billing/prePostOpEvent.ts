/**
 * Pre-op and post-op events (catch-up Phase 39b; FT-03.7, US-03.7.1,
 * US-03.7.2, US-05.5.2, OQ-63 (D13), OQ-12): the type table, validation,
 * pricing and the invoice line. Pure. Nowhere else is a pre-op or post-op
 * event validated, priced or described as an invoice line; the routing and
 * party rules stay in 38b's `procedureEvent.ts` (`EVENT_KINDS`,
 * `eventInvoicing`, `resolveEventParty`).
 *
 * An event takes no modifiers and no base units (US-03.7.1 AC 2): nothing on
 * its record, and nothing in `PricePrePostOpContext`, is a modifier, ASA,
 * base-unit or RVG group. Its own date places it on no List or schedule
 * (FT-03.7) and picks no price: a Contract's rates and discounts are undated
 * (AR-58 5.7), so the date is used only by the date rule.
 */

import type { ContractPricing, PricingKind } from './contracts'
import { eventFeeFor, type ContractEventFee } from './contractEventFees'
import { roundToCents } from './money'
import { timedRateFor } from './timedRate'
import { timeUnitsFromMinutes, type RvgTimeRule } from './timeUnits'
import { plainDate } from '../dateText'

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------

/** The types of pre-op and post-op event (constants until Phase 42 says otherwise). */
export type PrePostOpEventType = 'postOpWardReview' | 'hduReview' | 'painConsult' | 'accPreOpAssessment' | 'otherPreOp' | 'otherPostOp'

/** What was recorded: a time, or a fixed fee (the Contract's for this type, or typed). Never a modifier or unit. */
export type EventRecording =
  | { kind: 'time'; minutes: number }
  | { kind: 'fixedFee'; source: 'contractEventFee'; contractId: string; eventFeeId: string }
  | { kind: 'fixedFee'; source: 'typed'; amount: number }

/**
 * An event's price, written by the office's review (approval) and frozen with
 * the invoice, so 25's Regenerate reproduces it and a later Contract edit
 * never moves it. Amounts ex GST in dollars to the cent; `amount` is signed (a
 * credit billing event is negative). `contractId` and `pricingKind` record the
 * Contract and the kind the price was read under (flat: no version, no line).
 */
export interface EventPricing {
  basis: 'time' | 'contractEventFee' | 'typedFixedFee' | 'billingEvent' | 'officePrice'
  minutes?: number
  timeUnits?: number
  rate?: number
  rateOrigin?: 'contractRate' | 'unitValue'
  discountPercent?: number
  contractId?: string
  pricingKind?: PricingKind
  eventFeeId?: string
  holderCode?: string
  /** A time a Contract event fee replaced. */
  replacedMinutes?: number
  amount: number
  /** The office's reason for a price it set at review (`basis: 'officePrice'`). */
  officeReason?: string
}

export type PrePostOpKind = 'preOp' | 'postOp'

/** Per type: its kind, and what it may record. */
export const EVENT_TYPES: Readonly<Record<PrePostOpEventType, { kind: PrePostOpKind; records: 'timeOrFixedFee' }>> = {
  accPreOpAssessment: { kind: 'preOp', records: 'timeOrFixedFee' },
  otherPreOp: { kind: 'preOp', records: 'timeOrFixedFee' },
  postOpWardReview: { kind: 'postOp', records: 'timeOrFixedFee' },
  hduReview: { kind: 'postOp', records: 'timeOrFixedFee' },
  painConsult: { kind: 'postOp', records: 'timeOrFixedFee' },
  otherPostOp: { kind: 'postOp', records: 'timeOrFixedFee' },
}

/** The types of one kind, in table order. */
export function eventTypesOf(kind: PrePostOpKind): PrePostOpEventType[] {
  return (Object.keys(EVENT_TYPES) as PrePostOpEventType[]).filter((t) => EVENT_TYPES[t].kind === kind)
}

/**
 * The preconfigured ACC pre-op assessments (US-05.5.2): a code and a label,
 * no price (the RVG guide lists codes, not prices; OQ-12 part 2 answered, no
 * fixed-fee Contract). The one home of the codes. PROVISIONAL (OQ-12 part 1,
 * with AA's accountant): if the codes are confirmed or changed, change this
 * list only and drop the caption.
 */
export const ACC_PREOP_PRESETS: readonly { code: string; label: string }[] = [
  { code: 'CS250', label: 'ACC pre-op assessment' },
  { code: 'CS260', label: 'ACC pre-op assessment' },
  { code: 'CS70', label: 'ACC pre-op assessment' },
]

// ---------------------------------------------------------------------------
// The date rule (every kind; `validateEventBase` calls it)
// ---------------------------------------------------------------------------

export type EventDateRule = 'onOrBeforeList' | 'onOrAfterList'

/**
 * An event's date against its Procedure's List date: a pre-op event on or
 * before it, every other kind on or after it; none after the later of today
 * and the List date (a List dated after the demo's today may use its own
 * date). Null when the date is fine.
 */
export function eventDateRefusal(
  rule: EventDateRule,
  occurredOnISO: string,
  ctx: { listDateISO: string; todayISO: string },
): { code: 'dateInvalid' | 'dateBeforeProcedure' | 'dateAfterProcedure' | 'dateInFuture'; message: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOnISO)) return { code: 'dateInvalid', message: 'Give the date.' }
  const latest = ctx.todayISO > ctx.listDateISO ? ctx.todayISO : ctx.listDateISO
  if (rule === 'onOrBeforeList' && occurredOnISO > ctx.listDateISO) {
    return { code: 'dateAfterProcedure', message: 'A pre-op event is dated on or before the procedure.' }
  }
  if (rule === 'onOrAfterList' && occurredOnISO < ctx.listDateISO) {
    return { code: 'dateBeforeProcedure', message: 'This cannot be dated before the procedure.' }
  }
  if (occurredOnISO > latest) return { code: 'dateInFuture', message: 'An event cannot be dated in the future.' }
  return null
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface PrePostOpInput {
  kind: PrePostOpKind
  type: PrePostOpEventType
  occurredOnISO: string
  startTime?: string
  recording: EventRecording
  /** An ACC preset's code (US-05.5.2), on the ACC pre-op type only. */
  code?: string
}

export type PrePostOpRefusalCode =
  | 'typeNotOfKind'
  | 'timeInvalid'
  | 'startTimeInvalid'
  | 'minutesInvalid'
  | 'amountInvalid'
  | 'feeMissing'
  | 'codeInvalid'
  | 'dateInvalid'
  | 'dateBeforeProcedure'
  | 'dateAfterProcedure'
  | 'dateInFuture'

export interface PrePostOpRefusal {
  code: PrePostOpRefusalCode
  message: string
  field: 'type' | 'occurredOnISO' | 'startTime' | 'minutes' | 'amount' | 'code'
}

/** The largest typed amount on an event, ex GST (below $100,000.00). */
export const EVENT_AMOUNT_LIMIT = 100000

/** A typed amount: above zero, to the cent, below $100,000.00. */
export function typedAmountProblem(amount: number): boolean {
  return !Number.isFinite(amount) || amount <= 0 || amount >= EVENT_AMOUNT_LIMIT || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6
}

/**
 * The kind's own checks: the type belongs to the kind, the date rule, a start
 * time as HH:MM, a time of whole minutes from 1 to 720, a typed fee above zero
 * to the cent, an ACC preset only on the ACC type. The party, the actor and
 * the Procedure's state are 38b's `validateEventBase`. Null when valid.
 */
export function validatePrePostOpEvent(input: PrePostOpInput, ctx: { listDateISO: string; todayISO: string }): PrePostOpRefusal | null {
  const meta = EVENT_TYPES[input.type]
  if (meta === undefined || meta.kind !== input.kind) {
    return { code: 'typeNotOfKind', message: input.kind === 'preOp' ? 'Pick a pre-op type.' : 'Pick a post-op type.', field: 'type' }
  }
  const date = eventDateRefusal(input.kind === 'preOp' ? 'onOrBeforeList' : 'onOrAfterList', input.occurredOnISO, ctx)
  if (date !== null) {
    const message = date.code === 'dateBeforeProcedure' ? 'A post-op event cannot be dated before the procedure.' : date.message
    return { code: date.code, message, field: 'occurredOnISO' }
  }
  if (input.startTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime)) {
    return { code: 'startTimeInvalid', message: 'Give the start time as HH:MM.', field: 'startTime' }
  }
  if (input.code !== undefined && (input.type !== 'accPreOpAssessment' || !ACC_PREOP_PRESETS.some((p) => p.code === input.code))) {
    return { code: 'codeInvalid', message: 'Pick one of the ACC pre-op codes.', field: 'code' }
  }
  const r = input.recording
  if (r.kind === 'time') {
    if (!Number.isInteger(r.minutes) || r.minutes < 1 || r.minutes > 720) {
      return { code: 'minutesInvalid', message: 'Record the time in whole minutes, 1 to 720.', field: 'minutes' }
    }
  } else if (r.source === 'typed') {
    if (typedAmountProblem(r.amount)) {
      return { code: 'amountInvalid', message: 'Type the fee in dollars and cents, above $0.00 and under $100,000.00.', field: 'amount' }
    }
  } else if (r.contractId === '' || r.eventFeeId === '') {
    return { code: 'feeMissing', message: "Pick the Contract's fee or type one.", field: 'amount' }
  }
  return null
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export interface PricePrePostOpContext {
  /** The Procedure's Contract as it stands (flat: no version, no line); undefined prices as No contract · RVG. */
  contract: { id: string; pricing: ContractPricing } | undefined
  eventFees: Readonly<Record<string, ContractEventFee>>
  /** The anaesthetist's own unit value (26's profile). */
  unitValue: number
  timeRule: RvgTimeRule
}

export type PrePostOpPricingResult =
  | { kind: 'priced'; pricing: EventPricing }
  | { kind: 'refused'; code: 'notInvoiced' | 'noEventRate' | 'eventFeeGone'; message: string }

export const NO_EVENT_RATE_MESSAGE = 'This procedure has a fixed price, so a timed event is not calculated. Set a price in review.'

/**
 * An event's price, read live when the office reviews it (never the Booking's
 * lock): a Contract event fee for the type replaces a time (US-03.7.2); a
 * time is RVG time units (19a's rule, rounded up, D25) at the rate the
 * Contract's pricing kind sets (`timedRateFor`, 24's own helper), less its
 * discount, rounded to the cent; a fixed or open price calculates nothing
 * (`noEventRate`, US-05.2.5); a typed fee as typed. The anaesthetist's own
 * typed price or adjustment on the Procedure (24) is never applied to an
 * event (our reading: it is on the Procedure's price).
 */
export function pricePrePostOpEvent(
  event: { billable: boolean; type: PrePostOpEventType; recording: EventRecording },
  ctx: PricePrePostOpContext,
): PrePostOpPricingResult {
  if (!event.billable) return { kind: 'refused', code: 'notInvoiced', message: 'This event is not invoiced, so it has no price.' }
  const contract = ctx.contract
  const traced = contract !== undefined ? { contractId: contract.id, pricingKind: contract.pricing.kind } : {}
  const r = event.recording
  if (r.kind === 'fixedFee' && r.source === 'typed') {
    return { kind: 'priced', pricing: { basis: 'typedFixedFee', amount: roundToCents(r.amount), ...traced } }
  }
  const fee = eventFeeFor({ eventFees: ctx.eventFees, contractId: contract?.id, type: event.type })
  if (fee !== undefined) {
    return {
      kind: 'priced',
      pricing: {
        basis: 'contractEventFee',
        amount: roundToCents(fee.fixedPrice),
        eventFeeId: fee.id,
        ...(fee.holderCode !== undefined ? { holderCode: fee.holderCode } : {}),
        ...(r.kind === 'time' ? { replacedMinutes: r.minutes } : {}),
        ...traced,
      },
    }
  }
  if (r.kind === 'fixedFee') {
    return { kind: 'refused', code: 'eventFeeGone', message: "The Contract no longer has a fee for this event. Set a price in review." }
  }
  const rate = timedRateFor(contract?.pricing, ctx.unitValue)
  if (rate.kind === 'none') return { kind: 'refused', code: 'noEventRate', message: NO_EVENT_RATE_MESSAGE }
  const units = timeUnitsFromMinutes(r.minutes, ctx.timeRule)
  const gross = roundToCents(units * rate.rate)
  const discount = roundToCents((gross * rate.discountPercent) / 100)
  return {
    kind: 'priced',
    pricing: {
      basis: 'time',
      minutes: r.minutes,
      timeUnits: units,
      rate: rate.rate,
      rateOrigin: rate.rateOrigin,
      ...(rate.discountPercent > 0 ? { discountPercent: rate.discountPercent } : {}),
      amount: roundToCents(gross - discount),
      ...traced,
    },
  }
}

/** The office's own price at review (required on `noEventRate`; replaces the computed price otherwise). */
export function officePricing(amount: number, reason: string, contract: { id: string; pricing: ContractPricing } | undefined, signed: 1 | -1 = 1): EventPricing {
  return {
    basis: 'officePrice',
    amount: roundToCents(signed * amount),
    officeReason: reason.trim(),
    ...(contract !== undefined ? { contractId: contract.id, pricingKind: contract.pricing.kind } : {}),
  }
}

// ---------------------------------------------------------------------------
// The invoice line
// ---------------------------------------------------------------------------

/** What `eventInvoiceLine` writes: one line, quantity 1, the amount ex GST (GST at the invoice foot, 22). */
export interface EventInvoiceLineDraft {
  procedureId: string
  eventId: string
  serviceDateISO: string
  description: string
  quantity: 1
  unitAmount: number
  amount: number
  kind: 'fee' | 'adjustment'
}

/** How the pricing reads after the date: "40 min, Contract fee", "45 min", "Fixed fee". */
export function pricingNote(pricing: EventPricing): string | undefined {
  switch (pricing.basis) {
    case 'contractEventFee':
      return pricing.replacedMinutes !== undefined ? `${pricing.replacedMinutes} min, Contract fee` : 'Contract fee'
    case 'time':
      return pricing.minutes !== undefined ? `${pricing.minutes} min` : undefined
    case 'typedFixedFee':
      return 'Fixed fee'
    case 'officePrice':
    case 'billingEvent':
      return undefined
  }
}

/**
 * One invoice line for an event, for every kind: "Post-op event · Pain consult
 * · 18 Jul 2026 · 40 min, Contract fee", "Pre-op event · ACC pre-op assessment
 * · CS250 · 13 Jul 2026", "Billing event · Nerve catheter · 18 Jul 2026", a
 * credit "Credit · Goodwill adjustment · 18 Jul 2026" at a negative amount.
 * The words come from the caller (the copy map), the shape from here.
 */
export function eventInvoiceLine(
  event: { id: string; procedureId: string; occurredOnISO: string },
  pricing: EventPricing,
  words: { lead: string; subject: string; code?: string },
): EventInvoiceLineDraft {
  const parts = [words.lead, words.subject, ...(words.code !== undefined ? [words.code] : []), plainDate(event.occurredOnISO)]
  const note = pricingNote(pricing)
  if (note !== undefined) parts.push(note)
  const amount = roundToCents(pricing.amount)
  return {
    procedureId: event.procedureId,
    eventId: event.id,
    serviceDateISO: event.occurredOnISO,
    description: parts.join(' · '),
    quantity: 1,
    unitAmount: amount,
    amount,
    kind: amount < 0 ? 'adjustment' : 'fee',
  }
}

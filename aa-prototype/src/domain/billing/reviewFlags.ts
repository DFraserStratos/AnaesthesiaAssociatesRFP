/**
 * The review-flag list, in one place (catch-up Phase 21a; US-07.2.2,
 * US-04.3.11, US-03.4.1). What the office checks on Review before it
 * authorises, as an ordered list of small pure rules. The flags are our
 * reading of AR-58 A49 (and A41 for the moved Booking): **they never block**.
 * Nothing here reaches `authoriseBlockersFor` (the store's empty seam) or
 * completion; 15a's warnings stay derived by `warningFactsFor`, never repeated
 * here.
 *
 * Replaces Phase 07's `apps/admin/reviewFlags.ts`. Kept from it: "Not marked
 * completed", 21's payer-contact flag and the manual B/T/M override note.
 * Dropped: "No billing reference" (the holder's references are not built,
 * D82, OQ-136); the route and ACC flags were already gone (18, RV-37).
 *
 * D81 (OQ-135, still open, our default): a Procedure already on a Disabled
 * Contract bills as normal and raises no flag. If OQ-135 is answered "flag
 * it", add one rule to `REVIEW_FLAG_RULES`.
 */

import type { Booking, ContractApproval, ContractId, Patient, Procedure, RvgGroup, RvgTimeRule } from '../types'
import { resolveBtm, type BtmBreakdown, type FeeResult, type ModifierInputs } from './fee'
import { PAYER_CONTACT_NEEDED, payerContactMissing } from './whoIsBilled'
import { contractAllowedOn, type RailContext, type RailMasters } from './contractRail'
import { priceStatusFor } from './priceStatus'
import { asksRvgDetail } from './rvgDetail'
import { NEEDS_PRICE_LABEL } from './priceRanges'
import { formatMoney } from './money'
import type { PrepaymentStatus } from './prepayment'

export type FlagTone = 'neutral' | 'warn'

export type ReviewFlagRule =
  | 'contractChanged'
  | 'contractNoLongerFits'
  | 'needsInvoiceDestination'
  | 'needsPrice'
  | 'typedPrice'
  | 'notCompleted'
  | 'payerContactMissing'
  | 'btmOverride'
  | 'prepayment'

export interface ReviewFlag {
  tone: FlagTone
  text: string
  bookingId: string
  procedureId?: string
  rule: ReviewFlagRule
  /** A `data-shot` hook for the capture recipes. */
  shot: string
}

/**
 * The anaesthetist's change of a Procedure's Contract, as the store reads it
 * from the audit (20's change record): pending until the office approves it,
 * re-picks it or authorises the List; a later change by the anaesthetist opens
 * it again.
 */
export interface ContractChangeRecord {
  status: 'pending' | 'approved'
  /** Who changed it, as Review prints them ("Dr Souter"). */
  by: string
  /** The Contract the office last saw, before the anaesthetist's change. */
  wasContractId?: ContractId
  atISO: string
  /** How and when the office approved it, once approved. */
  approval?: ContractApproval
}

export interface ReviewProcedureInput {
  procedure: Procedure
  /** The computed fee (from `procedureFee`): its `btm` provenance drives the override note. */
  fee: FeeResult
  /** The Procedure's RVG group, for the natural B/T/M to diff an override against. */
  rvgGroup?: RvgGroup
  /** The anaesthetist's Contract change, if there is one. */
  contractChange?: ContractChangeRecord
  /** `computedPriceFor`: the price with nothing typed, shown beside a typed one (Admin only). */
  computedPrice?: number
  /** The Procedure's prepayment status, when it has a raised prepayment invoice (catch-up Phase 27). */
  prepayment?: { status: PrepaymentStatus; issued: boolean }
}

export interface ReviewBookingInput {
  booking: Booking
  procedures: readonly ReviewProcedureInput[]
  /** The candidates query's masters and the Booking's List as its context (date, hospital, surgeon, anaesthetist). */
  rail: { masters: RailMasters; ctx: RailContext }
  /** The Booking's patient: the payer when the "different payer" tick is clear (catch-up Phase 21). */
  patient?: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'>
  timeRule: RvgTimeRule
  modifierInputs: ModifierInputs
}

type Rule = (input: ReviewBookingInput) => ReviewFlag[]

const perProcedure =
  (rule: ReviewFlagRule, fn: (p: ReviewProcedureInput, input: ReviewBookingInput) => Omit<ReviewFlag, 'bookingId' | 'procedureId' | 'rule'>[] | Omit<ReviewFlag, 'bookingId' | 'procedureId' | 'rule'> | null): Rule =>
  (input) =>
    input.procedures.flatMap((p) => {
      const out = fn(p, input)
      const list = out === null ? [] : Array.isArray(out) ? out : [out]
      return list.map((f) => ({ ...f, bookingId: input.booking.id, procedureId: p.procedure.id, rule }))
    })

const contractOf = (p: Procedure, input: ReviewBookingInput) =>
  p.governingContractId !== undefined ? input.rail.masters.contracts[p.governingContractId] : undefined

/** "Changed by Dr Souter: was Southern Cross Standard" (warn); ends once approved. */
const contractChanged: Rule = perProcedure('contractChanged', ({ contractChange }, input) => {
  if (contractChange === undefined || contractChange.status !== 'pending') return null
  const was = contractChange.wasContractId !== undefined ? input.rail.masters.contracts[contractChange.wasContractId]?.name : undefined
  return { tone: 'warn', text: `Changed by ${contractChange.by}: was ${was ?? 'no Contract'}`, shot: 'review-flag' }
})

/**
 * The Procedure's Contract is not offered on its Booking's List (our reading,
 * A41): 20's candidates rule with the status test off (D81) and the range test
 * on. Derived, never stored, so it clears when the Booking moves back.
 */
const contractNoLongerFits: Rule = perProcedure('contractNoLongerFits', ({ procedure }, input) => {
  if (procedure.governingContractId === undefined || contractOf(procedure, input) === undefined) return null
  if (contractAllowedOn(input.rail.masters, input.rail.ctx, procedure.governingContractId, { anyStatus: true })) return null
  return { tone: 'warn', text: 'Contract not offered on this List', shot: 'review-flag' }
})

/** No Contract (US-04.3.8). Likely unreachable at review (it blocks completion and submit); kept because US-07.2.2 names it. */
const needsInvoiceDestination: Rule = perProcedure('needsInvoiceDestination', ({ procedure }, input) =>
  contractOf(procedure, input) === undefined ? { tone: 'warn', text: 'Needs an invoice destination', shot: 'review-flag' } : null,
)

/** `priceStatusFor` reads "Needs a price" (A48). */
const needsPrice: Rule = perProcedure('needsPrice', ({ procedure }, input) =>
  priceStatusFor(procedure, contractOf(procedure, input), input.rail.ctx.listDateISO)?.status === 'needsPrice'
    ? { tone: 'warn', text: NEEDS_PRICE_LABEL, shot: 'review-flag' }
    : null,
)

/**
 * A typed price (`enteredPrice`) on a Contract that is not open price, whoever
 * typed it, beside the computed price (A49). A typed price on an open price is
 * the price itself: no flag.
 */
const typedPrice: Rule = perProcedure('typedPrice', ({ procedure, computedPrice }, input) => {
  const contract = contractOf(procedure, input)
  if (contract === undefined || contract.pricing.kind === 'open') return null
  const typed = procedure.enteredPrice
  if (typed === undefined) return null
  const computed = computedPrice !== undefined ? ` (computed ${formatMoney(computedPrice)})` : ''
  return { tone: 'neutral', text: `Price typed: ${formatMoney(typed)}${computed}`, shot: 'review-flag' }
})

/** "An operation not completed properly" (US-07.2.2). */
const notCompleted: Rule = ({ booking }) =>
  booking.completed ? [] : [{ tone: 'neutral', text: 'Not marked completed', bookingId: booking.id, rule: 'notCompleted', shot: 'review-flag' }]

/** A billed payer with neither an email nor a postal address, on each Procedure billed to its payer (US-11.2.3; catch-up Phases 21, 22a). */
const payerContact: Rule = perProcedure('payerContactMissing', ({ procedure }, input) =>
  payerContactMissing(procedure, input.patient, contractOf(procedure, input)) ? { tone: 'neutral', text: PAYER_CONTACT_NEEDED, shot: 'review-payer-contact' } : null,
)

/** The natural (non-overridden) B/T/M, to diff a manual override against. */
function naturalBtm(procedure: Procedure, rvgGroup: RvgGroup | undefined, timeRule: RvgTimeRule, modifierInputs: ModifierInputs): BtmBreakdown {
  const stripped: Procedure = { ...procedure }
  delete stripped.baseUnitsCaptured
  delete stripped.timeUnitsCaptured
  delete stripped.modifierUnitsCaptured
  return resolveBtm(stripped, rvgGroup, timeRule, modifierInputs)
}

/** A manual B/T/M override with its delta from the natural value ("T adjusted +1 manually"). */
const btmOverride: Rule = perProcedure('btmOverride', ({ procedure, fee, rvgGroup }, input) => {
  // Units only count on an RVG price (`rvgDetail.ts`): a kept override under a fixed or open price is not shown or billed.
  if (!asksRvgDetail(contractOf(procedure, input))) return []
  const nat = naturalBtm(procedure, rvgGroup, input.timeRule, input.modifierInputs)
  const parts = [
    { label: 'B', units: fee.btm.base.units, source: fee.btm.base.source, natural: nat.base.units },
    { label: 'T', units: fee.btm.time.units, source: fee.btm.time.source, natural: nat.time.units },
    { label: 'M', units: fee.btm.modifiers.units, source: fee.btm.modifiers.source, natural: nat.modifiers.units },
  ]
  return parts
    .filter((c) => c.source === 'overridden')
    .map((c) => {
      const delta = c.units - c.natural
      const text = delta === 0 ? `${c.label} set manually` : `${c.label} adjusted ${delta > 0 ? '+' : ''}${delta} manually`
      return { tone: 'neutral' as const, text, shot: 'review-flag' }
    })
})

/**
 * A raised prepayment (catch-up Phase 27; US-08.2.2, US-06.3.7): "Prepaid, left
 * off" on a Procedure the run leaves off the final invoice (neutral); "Pre-payment
 * sent, no longer needed" and "Pre-payment sent before a change" (warn) when the
 * Procedure changed after its invoice was sent, which 41 settles. Never blocks.
 */
const prepayment: Rule = perProcedure('prepayment', ({ prepayment: p }) => {
  if (p === undefined || !p.issued) return null
  if (p.status === 'notNeeded') return { tone: 'warn', text: 'Pre-payment sent, no longer needed', shot: 'review-flag-prepayment' }
  if (p.status === 'changedAfterSending') return { tone: 'warn', text: 'Pre-payment sent before a change', shot: 'review-flag-prepayment' }
  return { tone: 'neutral', text: 'Prepaid, left off', shot: 'review-flag-prepayment' }
})

/** The rules, in the order Review lists them. */
export const REVIEW_FLAG_RULES: readonly { rule: ReviewFlagRule; flags: Rule }[] = [
  { rule: 'contractChanged', flags: contractChanged },
  { rule: 'contractNoLongerFits', flags: contractNoLongerFits },
  { rule: 'needsInvoiceDestination', flags: needsInvoiceDestination },
  { rule: 'needsPrice', flags: needsPrice },
  { rule: 'typedPrice', flags: typedPrice },
  { rule: 'notCompleted', flags: notCompleted },
  { rule: 'payerContactMissing', flags: payerContact },
  { rule: 'btmOverride', flags: btmOverride },
  { rule: 'prepayment', flags: prepayment },
]

/** Flags for one Booking, in rule order. A cancelled Booking yields none (excluded from review). */
export function reviewFlagsForBooking(input: ReviewBookingInput): ReviewFlag[] {
  if (input.booking.cancellation !== undefined) return []
  return REVIEW_FLAG_RULES.flatMap((r) => r.flags(input))
}

/** All flags across a List's Bookings (cancelled Bookings excluded). Review's Flags tile counts these. */
export function reviewFlagsForList(bookings: readonly ReviewBookingInput[]): ReviewFlag[] {
  return bookings.flatMap((b) => reviewFlagsForBooking(b))
}

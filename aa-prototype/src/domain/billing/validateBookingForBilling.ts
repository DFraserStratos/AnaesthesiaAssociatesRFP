/**
 * The billing run's pre-flight (catch-up Phase 21a; DM-59, RV-21). Returns
 * structured field-level failures, written as user-facing copy (no dashes);
 * an empty array means the run may build the Booking's invoices. Cancelled
 * Bookings are excluded entirely (7th review B23).
 *
 * Completion is no longer read from here: it is `completionFailuresFor`
 * (`completion.ts`: a Contract, the RVG detail on RVG kinds, a price). The
 * branches completion superseded are gone (the RVG code and times checks, the
 * modifier explanation check, the split prepayment deposit, the Contract
 * checks). What stays is the run's own: a Contract's holder must exist, no
 * price can be worked out (Phase 24's) and a split that no longer fits
 * (Phase 22's). The rate x time line and its gate are gone (Phase 24, RV-03). A typed
 * price needs no reason and is never below $0 (catch-up Phase 24).
 */

import type {
  Anaesthetist,
  BillingLine,
  Booking,
  Contract,
  Modifier,
  ModifierId,
  Party,
  Patient,
  Procedure,
  ProcedureId,
  RvgGroup,
  RvgGroupId,
} from '../types'
import { bookingFeeFor, NO_PRIMARY_MESSAGE, type BookingFeeResult, type ProcedureFeeContext } from './bookingFee'
import { groupOf } from './rvgGroups'
import { PARTY_GONE_REASON, resolveSplit, splitDoesNotFitMessage } from './splitShare'
import { splitPartiesOn } from './partyOptions'
import { procedureNeedsPrice, type HeldPrices } from './procedurePrice'
import { HOLDER_MISSING_MESSAGE, holderBilledFor } from './whoIsBilled'
import { needsPriceMessage } from './priceRanges'
import type { RvgTimeRule } from './timeUnits'

export interface BillingValidationFailure {
  /** Absent for Booking-level failures. */
  procedureId?: string
  /** The offending field, for UI anchoring. */
  field: string
  /** Rendered verbatim in the UI. */
  message: string
}


export interface BookingBillingContext {
  anaesthetist: Anaesthetist
  /** The RVG groups, keyed by their hidden id (catch-up Phase 19). */
  rvgGroups: Readonly<Record<RvgGroupId, RvgGroup>>
  /** Contract master, keyed by id (for `governingContractId`). */
  contracts: Readonly<Record<string, Contract>>
  /** The Party master (catch-up Phase 18): the Contracts' holders. */
  parties: Readonly<Record<string, Party>>
  /** ALL stored billing lines; filtered per procedure by `procedureId`. */
  billingLines: readonly BillingLine[]
  /** The List's billing hospital (absent at AA's rooms). */
  listHospitalId?: string
  /** The List's date: the procedure date that picks a fixed price's range in force (catch-up Phase 19a). */
  listDateISO: string
  /** The RVG time rule held as data (`masters.rvgTimeRule`, catch-up Phase 19a). */
  timeRule: RvgTimeRule
  /**
   * The Booking's patient's date of birth (catch-up Phase 19b): the age
   * modifier is pre-applied from it on the List's date.
   */
  patientDobISO: string | undefined
  /** The modifier master (`masters.modifiers`, catch-up Phase 19b). */
  modifiers: Readonly<Record<ModifierId, Modifier>>
  /**
   * The patient record, for the `billedTo` snapshot of a payer-billed invoice
   * (catch-up Phase 21). Optional: without it the snapshot carries only what
   * the Booking holds. Never read by a fee or a validation rule.
   */
  patient?: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'>
  /**
   * The price ladder's held amounts per Procedure (catch-up Phase 24): the
   * store's `heldPricesForBooking`. Absent: nothing holds a price.
   */
  held?: Readonly<Record<ProcedureId, HeldPrices>>
}

/**
 * Assemble one procedure's fee context (before the multi-procedure rule places
 * it) from a booking billing context. Single-sourced so the run, the
 * pre-flight, the split's checks and the warnings compute the procedure fee
 * identically, always through `bookingFeesFor`.
 */
export function feeContextFor(
  procedure: Procedure,
  ctx: BookingBillingContext,
): ProcedureFeeContext {
  const storedLines = ctx.billingLines.filter((l) => l.procedureId === procedure.id)
  const nonRvgLines = storedLines.filter((l) => l.chargeBasis !== 'rvg')
  const rvgGroup = groupOf(ctx.rvgGroups, procedure.rvgGroupId)
  const contract =
    procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined
  const feeCtx: ProcedureFeeContext = {
    anaesthetist: ctx.anaesthetist,
    dateISO: ctx.listDateISO,
    timeRule: ctx.timeRule,
    patientDobISO: ctx.patientDobISO,
    modifiers: ctx.modifiers,
    nonRvgLines,
  }
  if (contract !== undefined) feeCtx.contract = contract
  if (rvgGroup !== undefined) feeCtx.rvgGroup = rvgGroup
  const held = ctx.held?.[procedure.id]
  if (held !== undefined) feeCtx.held = held
  return feeCtx
}

/**
 * Price a whole Booking from a booking billing context (catch-up Phase 23):
 * `bookingFeeFor` over `feeContextFor`, the one way the run, the pre-flight,
 * Review, the warnings and the split's checks price a Procedure.
 * `contractFor` lets the run inject each Procedure's resolved Contract.
 */
export function bookingFeesFor(
  procedures: readonly Procedure[],
  ctx: BookingBillingContext,
  contractFor?: (procedure: Procedure) => Contract | undefined,
): BookingFeeResult {
  return bookingFeeFor(procedures, (procedure) => {
    const feeCtx = feeContextFor(procedure, ctx)
    if (contractFor === undefined) return feeCtx
    const contract = contractFor(procedure)
    if (contract !== undefined) feeCtx.contract = contract
    else delete feeCtx.contract
    return feeCtx
  })
}

/**
 * Validate a Booking's procedures for billing. `procedures` is the Booking's
 * Procedures in Booking order; they are priced together under the
 * multi-procedure rule, so a Booking without exactly one primary fails.
 */
export function validateBookingForBilling(
  booking: Booking,
  procedures: readonly Procedure[],
  ctx: BookingBillingContext,
): BillingValidationFailure[] {
  // Cancelled Bookings are retained but excluded from validation and billing.
  if (booking.cancellation !== undefined) return []

  const failures: BillingValidationFailure[] = []
  const fail = (procedureId: string, field: string, message: string) => {
    failures.push({ procedureId, field, message })
  }

  // The Booking is priced once, under the multi-procedure rule (catch-up Phase 23).
  const priced = bookingFeesFor(procedures, ctx)
  if (priced.kind === 'structural') failures.push({ field: 'isPrimary', message: NO_PRIMARY_MESSAGE })
  const feeOf = (procedure: Procedure) => (priced.kind === 'ok' ? priced.fees[procedure.id] : undefined)

  procedures.forEach((procedure) => {
    const id = procedure.id
    const contract =
      procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined

    // A Contract that bills its holder needs that Party to exist (the run's
    // own sentence); one that bills the payer always has the payer on the
    // Booking (catch-up Phase 21).
    if (contract?.billsTo === 'holder' && holderBilledFor(contract, ctx.parties) === undefined) {
      fail(id, 'governingContractId', HOLDER_MISSING_MESSAGE)
    }

    // "Needs a price" (catch-up Phase 24, `procedurePrice.ts`): a fixed price with
    // no range in force on the List's date, or an open price with no amount
    // typed. The run's per-Booking pre-flight failure, completion's sentence.
    if (contract !== undefined && procedureNeedsPrice(contract, ctx.listDateISO, procedure, ctx.held?.[procedure.id])) {
      fail(id, contract.pricing.kind === 'open' ? 'enteredPrice' : 'governingContractId', needsPriceMessage(contract, ctx.listDateISO))
    }

    // A split that no longer fits the fee (catch-up Phase 22; US-08.2.3):
    // the fee changed under a typed $ share, so the run fails the Booking for
    // review rather than billing a guess.
    const splitFee = feeOf(procedure)
    if (procedure.split !== undefined && splitFee !== undefined) {
      const fee = splitFee
      const resolved = resolveSplit(fee.total, procedure.split.shares)
      if (!splitPartiesOn(procedure, booking.patientId, procedure.split.shares, ctx.parties)) fail(id, 'split', splitDoesNotFitMessage(fee.total, PARTY_GONE_REASON))
      else if (!resolved.ok) fail(id, 'split', splitDoesNotFitMessage(fee.total, resolved.reason))
    }
  })

  return failures
}

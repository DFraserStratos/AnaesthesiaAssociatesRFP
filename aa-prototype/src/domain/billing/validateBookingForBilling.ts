/**
 * Minimum-data validation for billing a Booking. Returns STRUCTURED field-level
 * failures — the mobile UI renders the messages verbatim (so they are written
 * as user-facing copy, no dashes). An empty array means the Booking is billable.
 *
 * Completion is validation-gated; submission is completion-gated (1st review
 * #1) — this function is the validation half. Cancelled Bookings are excluded
 * from validation entirely (7th review B23).
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
  RvgGroup,
  RvgGroupId,
} from '../types'
import { feeFor } from './fee'
import { groupOf } from './rvgGroups'
import { claimCompletionProblems, preAppliedModifiersFor } from './modifiers'
import { formatMoney, toCents } from './money'
import { isRvgKind, procedureNeedsPrice } from './contracts'
import { HOLDER_MISSING_MESSAGE, holderBilledFor } from './whoIsBilled'
import { rvgCodeToFill } from './contractRail'
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

/**
 * The Method 3 gate sentence, single-sourced (5th review #1): the validator,
 * the store's addBillingLine guard and the mobile capture UI's disabled
 * rate x time option all show these exact words.
 */
export const INDIVIDUAL_ARRANGEMENT_MESSAGE =
  'A rate and time billing line needs a governing contract that permits an individually arranged fee structure.'

/** Completion's sentences for the Contract (catch-up Phase 20; US-04.3.4, US-04.3.9, US-03.3.1). */
export const NEEDS_DESTINATION_FAILURE = 'This procedure needs an invoice destination.'
export const CONTRACT_GONE_FAILURE = 'The selected Contract no longer exists. Choose another.'
export const TYPE_THE_PRICE_FAILURE = 'Type the price for this procedure.'
export const ADD_RVG_CODE_FAILURE = 'Add the RVG code for this procedure.'

/** Who gives a contract reference when billed: a hospital, a surgeon or a surgeons' organisation (by billing identity). */
const REFERENCE_COUNTERPARTY_KINDS: ReadonlySet<string> = new Set(['hospital', 'surgeon', 'organisation'])
/** The same, for a holder Party billed as itself (catch-up Phase 21): a hospital, a surgeon or a surgeon group. */
const REFERENCE_PARTY_KINDS: ReadonlySet<string> = new Set(['hospital', 'surgeon', 'surgeonGroup'])

/**
 * A4's "reference completeness" check, single-sourced (6th review #6): the
 * holder's contract or approval reference is expected when the Procedure's
 * Contract bills a hospital or a surgeon holder (keyed on who is billed,
 * `holderBilledFor`); an insurer's Contract, a Contract billing the payer, an
 * open-price fallback and No contract · RVG expect none. True when it is
 * expected and absent or blank. The office billing setup and the
 * authorisation-review flags read this one predicate. Catch-up Phase 21 builds
 * no other holder reference (OQ-136, D82); 21a settles this flag with Review.
 */
export function billingReferenceMissing(
  procedure: Pick<Procedure, 'billingReference' | 'governingContractId'>,
  contracts: Readonly<Record<string, Contract>>,
  parties: Readonly<Record<string, Party>>,
): boolean {
  const contract = procedure.governingContractId !== undefined ? contracts[procedure.governingContractId] : undefined
  if (contract === undefined || contract.systemRole !== undefined) return false
  const billed = holderBilledFor(contract, parties)
  if (billed === undefined) return false
  // A holder Party billed as itself (no older identity, e.g. Unisports) is judged by its Party kind.
  const expects = billed.kind === 'party' ? REFERENCE_PARTY_KINDS.has(parties[billed.id]?.kind ?? '') : REFERENCE_COUNTERPARTY_KINDS.has(billed.kind)
  if (!expects) return false
  return procedure.billingReference === undefined || procedure.billingReference.trim() === ''
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
}

/**
 * Assemble the `feeFor` context for one procedure from a booking billing
 * context. Single-sourced so the completion validator's
 * conservation check and the office's per-line allocation guard (Phase 06's
 * `setBillingLineAllocation`) compute the procedure fee identically.
 */
export function feeContextFor(
  procedure: Procedure,
  ctx: BookingBillingContext,
): Parameters<typeof feeFor>[1] {
  const storedLines = ctx.billingLines.filter((l) => l.procedureId === procedure.id)
  const nonRvgLines = storedLines.filter((l) => l.chargeBasis !== 'rvg')
  const rvgGroup = groupOf(ctx.rvgGroups, procedure.rvgGroupId)
  const contract =
    procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined
  const feeCtx: Parameters<typeof feeFor>[1] = {
    anaesthetist: ctx.anaesthetist,
    dateISO: ctx.listDateISO,
    timeRule: ctx.timeRule,
    patientDobISO: ctx.patientDobISO,
    modifiers: ctx.modifiers,
    nonRvgLines,
  }
  if (contract !== undefined) feeCtx.contract = contract
  if (rvgGroup !== undefined) feeCtx.rvgGroup = rvgGroup
  return feeCtx
}

/**
 * Validate a Booking's procedures for billing. `procedures` must be in Booking
 * order — a procedure's ordinal (2nd-procedure contract pricing) is its
 * 1-based position in this array.
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

  procedures.forEach((procedure) => {
    const id = procedure.id
    const storedLines = ctx.billingLines.filter((l) => l.procedureId === id)
    const rvgGroup = groupOf(ctx.rvgGroups, procedure.rvgGroupId)

    // Each claimed modifier needs its short explanation (and its units where the
    // RVG value is not a plain number): US-03.6.1's backstop, finished by Phase
    // 21. Pre-applied modifiers need none; a Procedure with no modifier passes.
    const preApplied = preAppliedModifiersFor({
      ...(ctx.patientDobISO !== undefined ? { patientDobISO: ctx.patientDobISO } : {}),
      procedureDateISO: ctx.listDateISO,
      ...(rvgGroup !== undefined ? { group: rvgGroup } : {}),
      modifiers: ctx.modifiers,
      removedModifierIds: procedure.removedModifierIds,
    })
    for (const problem of claimCompletionProblems(procedure.modifierClaims, ctx.modifiers, preApplied)) {
      fail(id, 'modifierClaims', problem.message)
    }

    const contract =
      procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined

    // Exactly one Contract (US-04.3.1, US-04.3.4): none is "Needs an invoice
    // destination"; a dangling id must be chosen again.
    if (procedure.governingContractId === undefined) {
      fail(id, 'governingContractId', NEEDS_DESTINATION_FAILURE)
    } else if (contract === undefined) {
      fail(id, 'governingContractId', CONTRACT_GONE_FAILURE)
    }

    // The RVG code is required on a Contract priced from RVG units, No
    // contract · RVG included, and optional, for reference, on a fixed or open
    // price (US-03.3.1; D12, D33): the one derived rule, `rvgCodeToFill`.
    // Phase 21a splits completion out.
    // A Procedure billed by its own rate x time line (Method 3) is priced
    // without one.
    if (contract !== undefined && rvgCodeToFill({ contracts: ctx.contracts }, procedure, storedLines)) {
      fail(id, 'rvgGroupId', ADD_RVG_CODE_FAILURE)
    }

    // A code that is set must still point at a row.
    if (procedure.rvgGroupId !== undefined) {
      if (rvgGroup === undefined) {
        fail(id, 'rvgGroupId', 'The RVG code on this Procedure is no longer in the RVG groups. Choose it again.')
      }

      // Times are captured data whenever the RVG path is billed (RFP principle 10).
      // On a fixed or open price the RVG code is for reference only and no
      // units are asked (catch-up Phase 19a; 21a collapses the form), so
      // missing times are not demanded there; recorded ones must still be in order.
      const priceWithoutUnits = contract !== undefined && !isRvgKind(contract.pricing.kind)
      const start = procedure.anaestheticStartISO
      const handover = procedure.handoverISO
      if (start === undefined && !priceWithoutUnits) {
        fail(id, 'anaestheticStartISO', 'Record the anaesthetic start time.')
      }
      if (handover === undefined && !priceWithoutUnits) {
        fail(id, 'handoverISO', 'Record the handover time.')
      }
      if (start !== undefined && handover !== undefined && Date.parse(handover) <= Date.parse(start)) {
        fail(id, 'handoverISO', 'Handover must be after the anaesthetic start.')
      }

      // Any base-unit value is accepted (D3, RV-10): an out-of-range one raises
      // the after-procedure `baseUnitsOutsideGuide` warning, never a refusal.
    }


    // A split prepayment on a prepaid Contract needs its deposit (7th review
    // B6; INTERIM `prepaymentDetail` until Phase 27). No gate (D5).
    if (
      contract?.prepaid === true &&
      procedure.prepaymentDetail?.type === 'split' &&
      (procedure.prepaymentDetail.depositAmount === undefined || procedure.prepaymentDetail.depositAmount <= 0)
    ) {
      fail(id, 'prepaymentDetail', 'Enter the first payment amount for a split prepayment.')
    }

    // Method 3 gate (5th review #1): a rate x time line needs a governing
    // Contract that permits it (`permitsRateTime`, INTERIM until Phase 24).
    if (storedLines.some((l) => l.chargeBasis === 'rateTime')) {
      if (contract === undefined || !contract.permitsRateTime) {
        fail(id, 'billingLines', INDIVIDUAL_ARRANGEMENT_MESSAGE)
      }
    }

    // A Contract that bills its holder needs that Party to exist (the run's
    // own sentence); one that bills the payer always has the payer on the
    // Booking (catch-up Phase 21).
    if (contract?.billsTo === 'holder' && holderBilledFor(contract, ctx.parties) === undefined) {
      fail(id, 'governingContractId', HOLDER_MISSING_MESSAGE)
    }

    // A fixed price with no range in force on the List's date: "Needs a price"
    // (catch-up Phase 19a). An open price with no amount typed asks for it
    // (US-04.3.9; Phase 24's "Needs a price" replaces the sentence).
    if (contract !== undefined && procedureNeedsPrice(contract, ctx.listDateISO, procedure)) {
      if (contract.pricing.kind === 'open') fail(id, 'enteredPrice', TYPE_THE_PRICE_FAILURE)
      else fail(id, 'governingContractId', needsPriceMessage(contract, ctx.listDateISO))
    }

    // Price override always carries a reason (7th review A6/B5), and may not
    // drive the fee negative (8th review): a negative invoice is a credit
    // note, which this system never raises.
    if (procedure.priceOverride !== undefined) {
      if (procedure.priceOverride.reason.trim() === '') {
        fail(id, 'priceOverride', 'Give a reason for the price override.')
      }
      const fee = feeFor(procedure, feeContextFor(procedure, ctx))
      if (fee.total < 0) {
        fail(id, 'priceOverride', `The price override makes the fee negative (${formatMoney(fee.total)}). Adjust the override.`)
      }
    }

    // Conservation (5th review #4): once any line carries a funder override,
    // the stored lines are the explicit allocation of the WHOLE fee — their
    // amounts must sum, to the cent, to the computed fee.
    if (storedLines.some((l) => l.funderOverride !== undefined)) {
      const fee = feeFor(procedure, feeContextFor(procedure, ctx))
      const allocated = storedLines.reduce((sum, l) => sum + l.amount, 0)
      if (toCents(allocated) !== toCents(fee.total)) {
        fail(
          id,
          'billingLines',
          `Billing line amounts must add up to the procedure fee of ${formatMoney(fee.total)} (they add up to ${formatMoney(allocated)}).`,
        )
      }
    }
  })

  return failures
}

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
  BillableParty,
  BillingLine,
  Booking,
  Contract,
  Modifier,
  ModifierId,
  Party,
  Procedure,
  RvgGroup,
  RvgGroupId,
} from '../types'
import { feeFor } from './fee'
import { groupOf } from './rvgGroups'
import { claimCompletionProblems, preAppliedModifiersFor } from './modifiers'
import { toCents } from './money'
import { INSURER_PARTY_MISSING_MESSAGE, hospitalPartyFor, insurerPartyFor, noRouteCounterpartyMessage, routeCounterpartyForParty } from './parties'
import { interimRouteContract, isRvgKind, noRouteContractMessage, procedureNeedsPrice } from './contracts'
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

/**
 * A4's "reference completeness" check, single-sourced (6th review #6): the
 * hospital's contract/approval reference is expected on the contract-holder
 * (`hospital`) route. True when it is absent/blank there. The office billing
 * setup and the Phase 07 authorisation-review FLAGS both read this one
 * predicate so they never drift.
 */
export function billingReferenceMissing(procedure: Procedure): boolean {
  return (
    procedure.billingRoute === 'hospital' &&
    (procedure.billingReference === undefined || procedure.billingReference.trim() === '')
  )
}

export interface BookingBillingContext {
  anaesthetist: Anaesthetist
  /** The RVG groups, keyed by their hidden id (catch-up Phase 19). */
  rvgGroups: Readonly<Record<RvgGroupId, RvgGroup>>
  /** Contract master, keyed by id (for `governingContractId`). */
  contracts: Readonly<Record<string, Contract>>
  /** The Party master (catch-up Phase 18): holders, and the insurer Parties the Insurer route needs. */
  parties: Readonly<Record<string, Party>>
  billableParties: Readonly<Record<string, BillableParty>>
  /** ALL stored billing lines; filtered per procedure by `procedureId`. */
  billingLines: readonly BillingLine[]
  /**
   * The List's hospital (absent at AA's rooms): the hospital route's Party
   * when no Contract is stored (INTERIM until Phase 20).
   */
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

    // Route must be explicitly set.
    if (procedure.billingRoute === undefined) {
      fail(id, 'billingRoute', 'Set a billing route for this procedure.')
    }

    // The RVG code is optional (catch-up Phase 19; completion rules are Phase
    // 21's). One that is set must still point at a row.
    if (procedure.rvgGroupId !== undefined) {
      if (rvgGroup === undefined) {
        fail(id, 'rvgGroupId', 'The RVG code on this Procedure is no longer in the RVG groups. Choose it again.')
      }

      // Times are captured data whenever the RVG path is billed (RFP principle 10).
      // On a fixed or open price the RVG code is for reference only and no
      // units are asked (catch-up Phase 19a; 21a collapses the form), so
      // missing times are not demanded there; recorded ones must still be in order.
      const chosen = procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined
      const priceWithoutUnits = chosen !== undefined && !isRvgKind(chosen.pricing.kind)
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

    // Insurer route: the insurer is named and has an insurer Party (RV-39: no
    // insurer master and no direct-claims flag, catch-up Phase 18).
    if (procedure.billingRoute === 'insurer') {
      if (procedure.insurerId === undefined) {
        fail(id, 'insurerId', 'Select the insurer for the Insurer route.')
      } else if (insurerPartyFor(ctx.parties, procedure.insurerId) === undefined) {
        fail(id, 'insurerId', INSURER_PARTY_MISSING_MESSAGE)
      }
    }

    // Billable Party route: category required; payer defaults to the PATIENT,
    // so no override record is demanded (7th review A1/A2/B15). The typed
    // override must resolve when present.
    if (procedure.billingRoute === 'billableParty') {
      if (procedure.patientPaymentCategory === undefined) {
        fail(
          id,
          'patientPaymentCategory',
          'Select a patient payment category for the Billable Party route.',
        )
      }
      if (
        procedure.billablePartyId !== undefined &&
        ctx.billableParties[procedure.billablePartyId] === undefined
      ) {
        fail(id, 'billablePartyId', 'The billable party on this procedure could not be found.')
      }
    }

    // Pre-payment typing (7th review B6): detail required, deposit when split.
    if (procedure.patientPaymentCategory === 'selfFundedPrepayment') {
      if (procedure.prepaymentDetail === undefined) {
        fail(
          id,
          'prepaymentDetail',
          'Choose full or split pre-payment for the self funded pre-payment category.',
        )
      } else if (
        procedure.prepaymentDetail.type === 'split' &&
        (procedure.prepaymentDetail.depositAmount === undefined ||
          procedure.prepaymentDetail.depositAmount <= 0)
      ) {
        fail(id, 'prepaymentDetail', 'Enter the deposit amount for a split pre-payment.')
      }
    }

    const contract =
      procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined

    // Method 3 gate (5th review #1): a rate x time line needs a governing
    // Contract that permits it (`permitsRateTime`, INTERIM until Phase 24).
    if (storedLines.some((l) => l.chargeBasis === 'rateTime')) {
      if (contract === undefined || !contract.permitsRateTime) {
        fail(id, 'billingLines', INDIVIDUAL_ARRANGEMENT_MESSAGE)
      }
    }

    // What today's route needs to invoice (INTERIM until Phases 20 and 21), the
    // billing resolver's own sentences: on the hospital route a stored
    // Contract's holder needs a billing record; with nothing stored, the
    // hospital's or insurer's Party needs a plain RVG Contract.
    if (procedure.billingRoute === 'hospital' && contract !== undefined) {
      if (routeCounterpartyForParty(ctx.parties[contract.holderId]) === undefined) {
        fail(id, 'governingContractId', noRouteCounterpartyMessage(contract.name))
      }
    }
    if ((procedure.billingRoute === 'hospital' || procedure.billingRoute === 'insurer') && procedure.governingContractId === undefined) {
      const party =
        procedure.billingRoute === 'hospital'
          ? ctx.listHospitalId !== undefined ? hospitalPartyFor(ctx.parties, ctx.listHospitalId) : undefined
          : procedure.insurerId !== undefined ? insurerPartyFor(ctx.parties, procedure.insurerId) : undefined
      if (party !== undefined && interimRouteContract(ctx.contracts, party.id) === undefined) {
        fail(id, 'governingContractId', noRouteContractMessage(party.name))
      }
    }

    // Any Procedure on a fixed-price Contract with no range in force on the
    // List's date, or on an open price: "Needs a price" (catch-up Phase 19a;
    // Phase 24 turns it into a price state on the ladder).
    if (contract !== undefined && procedureNeedsPrice(contract, ctx.listDateISO, procedure)) {
      fail(id, 'governingContractId', needsPriceMessage(contract, ctx.listDateISO))
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
        fail(id, 'priceOverride', `The price override makes the fee negative ($${fee.total.toFixed(2)}). Adjust the override.`)
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
          `Billing line amounts must add up to the procedure fee of $${fee.total.toFixed(2)} (they add up to $${allocated.toFixed(2)}).`,
        )
      }
    }
  })

  return failures
}

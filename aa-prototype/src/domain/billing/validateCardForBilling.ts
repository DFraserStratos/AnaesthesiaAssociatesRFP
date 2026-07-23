/**
 * Minimum-data validation for billing a Card. Returns STRUCTURED field-level
 * failures — the mobile UI renders the messages verbatim (so they are written
 * as user-facing copy, no dashes). An empty array means the Card is billable.
 *
 * Completion is validation-gated; submission is completion-gated (1st review
 * #1) — this function is the validation half. Cancelled Cards are excluded
 * from validation entirely (7th review B23).
 */

import type {
  Anaesthetist,
  BillableParty,
  BillingLine,
  Card,
  Contract,
  ContractPrice,
  Insurer,
  Procedure,
  RvgCode,
} from '../types'
import { feeFor } from './fee'
import { toCents } from './money'

export interface BillingValidationFailure {
  /** Absent for Card-level failures. */
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

export interface CardBillingContext {
  anaesthetist: Anaesthetist
  /** RVG master, keyed by code. */
  rvgCodes: Readonly<Record<string, RvgCode>>
  /** Contract master, keyed by id (for `governingContractId`). */
  contracts: Readonly<Record<string, Contract>>
  contractPrices: readonly ContractPrice[]
  insurers: Readonly<Record<string, Insurer>>
  billableParties: Readonly<Record<string, BillableParty>>
  /** ALL stored billing lines; filtered per procedure by `procedureId`. */
  billingLines: readonly BillingLine[]
  /** The List's surgeon (Type 3 price matching). */
  surgeonId?: string
}

/**
 * Assemble the `feeFor` context for one procedure from a card billing context
 * and its 1-based ordinal. Single-sourced so the completion validator's
 * conservation check and the office's per-line allocation guard (Phase 06's
 * `setBillingLineAllocation`) compute the procedure fee identically.
 */
export function feeContextFor(
  procedure: Procedure,
  procedureOrdinal: number,
  ctx: CardBillingContext,
): Parameters<typeof feeFor>[1] {
  const storedLines = ctx.billingLines.filter((l) => l.procedureId === procedure.id)
  const nonRvgLines = storedLines.filter((l) => l.chargeBasis !== 'rvg')
  const baseCode = procedure.rvgBaseCode !== undefined ? ctx.rvgCodes[procedure.rvgBaseCode] : undefined
  const contract =
    procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined
  const feeCtx: Parameters<typeof feeFor>[1] = {
    anaesthetist: ctx.anaesthetist,
    contractPrices: ctx.contractPrices,
    procedureOrdinal,
    nonRvgLines,
  }
  if (contract !== undefined) feeCtx.contract = contract
  if (baseCode !== undefined) feeCtx.baseCode = baseCode
  if (ctx.surgeonId !== undefined) feeCtx.surgeonId = ctx.surgeonId
  return feeCtx
}

/**
 * Validate a Card's procedures for billing. `procedures` must be in Card
 * order — a procedure's ordinal (2nd-procedure contract pricing) is its
 * 1-based position in this array.
 */
export function validateCardForBilling(
  card: Card,
  procedures: readonly Procedure[],
  ctx: CardBillingContext,
): BillingValidationFailure[] {
  // Cancelled Cards are retained but excluded from validation and billing.
  if (card.cancellation !== undefined) return []

  const failures: BillingValidationFailure[] = []
  const fail = (procedureId: string, field: string, message: string) => {
    failures.push({ procedureId, field, message })
  }

  procedures.forEach((procedure, index) => {
    const id = procedure.id
    const storedLines = ctx.billingLines.filter((l) => l.procedureId === id)
    const nonRvgLines = storedLines.filter((l) => l.chargeBasis !== 'rvg')
    const baseCode =
      procedure.rvgBaseCode !== undefined ? ctx.rvgCodes[procedure.rvgBaseCode] : undefined

    // Route must be explicitly set.
    if (procedure.billingRoute === undefined) {
      fail(id, 'billingRoute', 'Set a billing route for this procedure.')
    }

    // Something to charge: an RVG base code or at least one non-RVG line.
    if (procedure.rvgBaseCode === undefined && nonRvgLines.length === 0) {
      fail(id, 'rvgBaseCode', 'Add an RVG base code or at least one billing line.')
    }

    if (procedure.rvgBaseCode !== undefined) {
      if (baseCode === undefined) {
        fail(id, 'rvgBaseCode', `RVG code ${procedure.rvgBaseCode} is not in the RVG master.`)
      }

      // Times are captured data whenever the RVG path is billed (RFP principle 10).
      const start = procedure.anaestheticStartISO
      const handover = procedure.handoverISO
      if (start === undefined) {
        fail(id, 'anaestheticStartISO', 'Record the anaesthetic start time.')
      }
      if (handover === undefined) {
        fail(id, 'handoverISO', 'Record the handover time.')
      }
      if (start !== undefined && handover !== undefined && Date.parse(handover) <= Date.parse(start)) {
        fail(id, 'handoverISO', 'Handover must be after the anaesthetic start.')
      }

      // A range base code needs an in-range selected value.
      if (baseCode !== undefined && baseCode.baseUnits.kind === 'range') {
        const { min, max } = baseCode.baseUnits
        const selected = procedure.baseUnitsSelected
        if (selected === undefined || selected < min || selected > max) {
          fail(
            id,
            'baseUnitsSelected',
            `Base code ${baseCode.code} needs a selected unit value between ${min} and ${max}.`,
          )
        }
      }
    }

    // Insurer route: insurer present and accepting direct claims (6th review #2).
    if (procedure.billingRoute === 'insurer') {
      if (procedure.insurerId === undefined) {
        fail(id, 'insurerId', 'Select the insurer for the Insurer route.')
      } else {
        const insurer = ctx.insurers[procedure.insurerId]
        if (insurer === undefined) {
          fail(id, 'insurerId', 'The selected insurer could not be found.')
        } else if (!insurer.acceptsDirectClaims) {
          fail(
            id,
            'insurerId',
            `${insurer.name} does not accept direct claims from AA. Use the Billable Party route with the insured reimbursement category instead.`,
          )
        }
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

    // Method 3 gate (5th review #1): a rate x time line needs a governing
    // contract that permits an individually arranged structure.
    if (storedLines.some((l) => l.chargeBasis === 'rateTime')) {
      const contract =
        procedure.governingContractId !== undefined
          ? ctx.contracts[procedure.governingContractId]
          : undefined
      if (contract === undefined || !contract.permitsIndividualArrangement) {
        fail(id, 'billingLines', INDIVIDUAL_ARRANGEMENT_MESSAGE)
      }
    }

    // Price override always carries a reason (7th review A6/B5).
    if (procedure.priceOverride !== undefined && procedure.priceOverride.reason.trim() === '') {
      fail(id, 'priceOverride', 'Give a reason for the price override.')
    }

    // Conservation (5th review #4): once any line carries a funder override,
    // the stored lines are the explicit allocation of the WHOLE fee — their
    // amounts must sum, to the cent, to the computed fee.
    if (storedLines.some((l) => l.funderOverride !== undefined)) {
      const fee = feeFor(procedure, feeContextFor(procedure, index + 1, ctx))
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

/**
 * Completion, one pure rule (catch-up Phase 21a; US-03.6.1, US-03.3.3,
 * US-03.3.9, DM-59, RV-21). A Booking can be marked complete once every
 * Procedure in it has exactly:
 *
 * 1. a Contract;
 * 2. on a Contract priced from RVG units (`asksRvgDetail`), the RVG detail:
 *    the RVG code, the start and finish times and a completed modifiers step
 *    (`modifiersConfirmed`, our reading of AR-58 A20; each claimed modifier
 *    with its short explanation, 19b's check, moved here from the billing
 *    validator);
 * 3. a price, not "Needs a price" (`priceStatusFor`; our reading, AR-58 A48).
 *
 * Nothing else is a condition: not the approval number, the payer's contact,
 * the base-unit range (19's warning), the insurer or any reference. Warnings
 * never appear here. Split from `validateBookingForBilling`, which stays the
 * billing run's pre-flight only.
 */

import type { Booking, Modifier, ModifierId, Party, Procedure, RvgGroup, RvgGroupId } from '../types'
import type { Contract } from './contracts'
import { claimCompletionProblems, preAppliedModifiersFor } from './modifiers'
import { groupOf } from './rvgGroups'
import { asksRvgDetail, rvgCodeToFill } from './rvgDetail'
import { priceStatusFor } from './priceStatus'
import { needsPriceMessage } from './priceRanges'
import { mayTypeEnteredPrice } from './contractRail'

export type CompletionFailureCode =
  | 'noContract'
  | 'contractGone'
  | 'rvgCode'
  | 'startTime'
  | 'finishTime'
  | 'modifiersStep'
  | 'modifierExplanation'
  | 'needsPrice'

export interface CompletionFailure {
  procedureId: string
  code: CompletionFailureCode
  /** Rendered verbatim on mobile, web and Admin. */
  message: string
  /** The Procedure field the form anchors (`data-validation-fields`). */
  field: string
  /** Who can put it right: an office-fixable failure offers 32b's "Alert the office" (US-03.6.3). */
  fixableBy: 'anaesthetist' | 'office'
}

/** Everything the rule reads, built once by the store's `completionContextFor` (the Booking detail calls the same). */
export interface CompletionContext {
  contracts: Readonly<Record<string, Contract>>
  parties: Readonly<Record<string, Party>>
  rvgGroups: Readonly<Record<RvgGroupId, RvgGroup>>
  modifiers: Readonly<Record<ModifierId, Modifier>>
  /** The List's date: the procedure date for the range in force and the age modifier. */
  listDateISO: string
  patientDobISO: string | undefined
}

export const NO_CONTRACT_MESSAGE = 'This procedure needs an invoice destination.'
export const CONTRACT_GONE_MESSAGE = 'The selected Contract no longer exists. Choose another.'
export const ADD_RVG_CODE_MESSAGE = 'Add the RVG code for this procedure.'
export const RVG_CODE_GONE_MESSAGE = 'The RVG code on this Procedure is no longer in the RVG groups. Choose it again.'
export const ADD_START_MESSAGE = 'Add the start time.'
export const ADD_FINISH_MESSAGE = 'Add the finish time.'
export const FINISH_ORDER_MESSAGE = 'The finish time must be after the start.'
export const MODIFIERS_STEP_MESSAGE = 'Add any modifiers that apply, or choose None apply.'

/**
 * Each Procedure's outstanding conditions, in Procedure order then condition
 * order. Empty means the Booking can be marked complete. A cancelled Booking
 * has none.
 */
export function completionFailuresFor(
  booking: Pick<Booking, 'cancellation'>,
  procedures: readonly Procedure[],
  ctx: CompletionContext,
): CompletionFailure[] {
  if (booking.cancellation !== undefined) return []
  const out: CompletionFailure[] = []
  for (const procedure of procedures) {
    const fail = (code: CompletionFailureCode, field: string, message: string, fixableBy: CompletionFailure['fixableBy']) =>
      out.push({ procedureId: procedure.id, code, field, message, fixableBy })

    // 1. A Contract (US-04.3.8: "Needs an invoice destination", never "Needs a contract").
    if (procedure.governingContractId === undefined) {
      fail('noContract', 'governingContractId', NO_CONTRACT_MESSAGE, 'office')
      continue
    }
    const contract = ctx.contracts[procedure.governingContractId]
    if (contract === undefined) {
      fail('contractGone', 'governingContractId', CONTRACT_GONE_MESSAGE, 'office')
      continue
    }

    // 2. On an RVG kind, the RVG detail.
    if (asksRvgDetail(contract)) {
      if (rvgCodeToFill({ contracts: ctx.contracts }, procedure)) {
        fail('rvgCode', 'rvgGroupId', ADD_RVG_CODE_MESSAGE, 'anaesthetist')
      } else if (procedure.rvgGroupId !== undefined && groupOf(ctx.rvgGroups, procedure.rvgGroupId) === undefined) {
        fail('rvgCode', 'rvgGroupId', RVG_CODE_GONE_MESSAGE, 'anaesthetist')
      }
      const start = procedure.anaestheticStartISO
      const finish = procedure.handoverISO
      if (start === undefined) fail('startTime', 'anaestheticStartISO', ADD_START_MESSAGE, 'anaesthetist')
      if (finish === undefined) fail('finishTime', 'handoverISO', ADD_FINISH_MESSAGE, 'anaesthetist')
      else if (start !== undefined && Date.parse(finish) <= Date.parse(start)) {
        fail('finishTime', 'handoverISO', FINISH_ORDER_MESSAGE, 'anaesthetist')
      }
      // The modifiers step belongs to the primary: the Booking's modifiers are recorded there once (catch-up Phase 23).
      if (procedure.isPrimary) {
        if (!modifiersStepAnswered(procedure)) {
          fail('modifiersStep', 'modifierClaims', MODIFIERS_STEP_MESSAGE, 'anaesthetist')
        }
        const group = groupOf(ctx.rvgGroups, procedure.rvgGroupId)
        const preApplied = preAppliedModifiersFor({
          ...(ctx.patientDobISO !== undefined ? { patientDobISO: ctx.patientDobISO } : {}),
          procedureDateISO: ctx.listDateISO,
          ...(group !== undefined ? { group } : {}),
          modifiers: ctx.modifiers,
          removedModifierIds: procedure.removedModifierIds,
        })
        for (const problem of claimCompletionProblems(procedure.modifierClaims, ctx.modifiers, preApplied)) {
          fail('modifierExplanation', 'modifierClaims', problem.message, 'anaesthetist')
        }
      }
    }

    // 3. A price.
    const price = priceStatusFor(procedure, contract, ctx.listDateISO)
    if (price?.status === 'needsPrice') {
      fail(
        'needsPrice',
        price.reason === 'openPrice' ? 'enteredPrice' : 'governingContractId',
        needsPriceMessage(contract, ctx.listDateISO),
        price.reason === 'openPrice' && mayTypeEnteredPrice('anaesthetist', contract) ? 'anaesthetist' : 'office',
      )
    }
  }
  return out
}

/**
 * The RVG detail a Contract change newly asks for (catch-up Phase 21a, our
 * reading): moving a completed Procedure from a fixed or open price to an RVG
 * kind re-opens its Booking; the reverse never does.
 */
export function contractChangeAsksRvgDetail(before: Contract | undefined, after: Contract | undefined): boolean {
  return !asksRvgDetail(before) && before !== undefined && asksRvgDetail(after)
}

export const REOPENED_FOR_RVG_DETAIL_MESSAGE = 'Add the RVG detail for the new Contract.'

/**
 * The modifiers step is answered (our reading of AR-58 A20): "None apply"
 * (`modifiersConfirmed`) or a claimed modifier. Pre-applied age and included
 * modifiers never answer it. The capture form and completion both read this.
 */
export function modifiersStepAnswered(procedure: Pick<Procedure, 'modifiersConfirmed' | 'modifierClaims'>): boolean {
  return procedure.modifiersConfirmed === true || procedure.modifierClaims.length > 0
}

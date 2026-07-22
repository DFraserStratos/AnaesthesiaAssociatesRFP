/**
 * Billing line guards (Phase 04) — the mobile capture path for the RFP's
 * parallel billing methods: ancillary fixed-amount lines on any card, and
 * rate x time (Method 3) lines gated by a governing contract that permits an
 * individually arranged fee structure (5th review #1). 'rvg' lines are
 * unrepresentable here by design: capture never stores rvg-basis lines (the
 * calculator produces the RVG amount from the captured BTM data), and the
 * office's per-funder allocation editor is Phase 06.
 */

import type { BillingLine } from '../domain/types'
import { INDIVIDUAL_ARRANGEMENT_MESSAGE } from '../domain/billing/validateCardForBilling'
import { roundToCents } from '../domain/billing/money'
import {
  allocateId,
  mutate,
  ok,
  refuse,
  type Actor,
  type MutationMeta,
  type Outcome,
} from './mutate'
import type { AppStoreApi } from './appStore'
import { editRefusal, getCard } from './lifecycle'

export interface AddBillingLineInput {
  chargeBasis: 'fixed' | 'rateTime'
  description: string
  /** 'fixed' only. */
  amount?: number
  /** 'rateTime' only. */
  hours?: number
  /** $ per hour ('rateTime' only). */
  rate?: number
}

/**
 * Add a captured non-RVG billing line to a Procedure. The rate x time basis is
 * refused unless the procedure's governing contract carries
 * `permitsIndividualArrangement` — the same sentence the validator and the UI
 * show. Amounts land rounded to cents (hours x rate for rateTime). Audited
 * `billingLine.add`; the parent Card is stamped by the wrapper.
 */
export function addBillingLine(
  api: AppStoreApi,
  actor: Actor,
  procedureId: string,
  input: AddBillingLineInput,
): Outcome<{ billingLineId: string }> {
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return refuse('notFound', 'Procedure not found.')
  const found = getCard(state, procedure.cardId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Card.')
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights

  if (input.description.trim() === '') {
    return refuse('descriptionRequired', 'A billing line needs a description.')
  }
  if (input.chargeBasis === 'fixed') {
    if (input.amount === undefined || input.amount <= 0) {
      return refuse('amountRequired', 'Enter an amount greater than zero.')
    }
  } else {
    if (input.hours === undefined || input.hours <= 0) {
      return refuse('hoursRequired', 'Enter the hours worked, greater than zero.')
    }
    if (input.rate === undefined || input.rate <= 0) {
      return refuse('rateRequired', 'Enter an hourly rate greater than zero.')
    }
    // The Method 3 store gate (defence in depth: the UI disables the option
    // with the same words, and the validator re-checks at completion).
    const contract =
      procedure.governingContractId !== undefined
        ? state.masters.contracts[procedure.governingContractId]
        : undefined
    if (contract === undefined || !contract.permitsIndividualArrangement) {
      return refuse('individualArrangementNotPermitted', INDIVIDUAL_ARRANGEMENT_MESSAGE)
    }
  }

  let billingLineId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'billingLine')
    billingLineId = alloc.id

    const line: BillingLine = {
      id: billingLineId,
      procedureId,
      chargeBasis: input.chargeBasis,
      description: input.description.trim(),
      amount:
        input.chargeBasis === 'rateTime'
          ? roundToCents((input.hours ?? 0) * (input.rate ?? 0))
          : roundToCents(input.amount ?? 0),
    }
    if (input.chargeBasis === 'rateTime') {
      line.hours = input.hours
      line.rate = input.rate
    }

    metas.push({
      entityType: 'billingLine',
      entityId: billingLineId,
      action: 'billingLine.add',
      after: { procedureId, chargeBasis: line.chargeBasis, amount: line.amount, description: line.description },
    })
    return {
      schedule: { ...s.schedule, billingLines: { ...s.schedule.billingLines, [billingLineId]: line } },
      counters: alloc.counters,
    }
  })

  return ok({ billingLineId })
}

/**
 * Remove a stored billing line. A line carrying a funder override is office
 * knowledge (the RFP's two-funder split — 5th review #4): the anaesthetist may
 * not remove it; the office may. The meta carries an explicit `stampCardId`
 * because the post-recipe stamp derivation cannot find a deleted line, and
 * `before` carries the full line so the audit trail can reconstruct it.
 */
export function removeBillingLine(api: AppStoreApi, actor: Actor, billingLineId: string): Outcome {
  const state = api.getState()
  const line = state.schedule.billingLines[billingLineId]
  if (line === undefined) return refuse('notFound', 'Billing line not found.')
  const procedure = state.schedule.procedures[line.procedureId]
  if (procedure === undefined) return refuse('notFound', 'The billing line has no procedure.')
  const found = getCard(state, procedure.cardId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Card.')
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights

  if (line.funderOverride !== undefined && actor.role === 'anaesthetist') {
    return refuse(
      'funderAllocationOfficeOnly',
      'This line carries a funder allocation set by the office. Only the office can remove it.',
    )
  }

  mutate(
    api,
    actor,
    {
      entityType: 'billingLine',
      entityId: billingLineId,
      action: 'billingLine.remove',
      before: line,
      stampCardId: procedure.cardId,
    },
    (s) => {
      const billingLines = { ...s.schedule.billingLines }
      delete billingLines[billingLineId]
      return { schedule: { ...s.schedule, billingLines } }
    },
  )
  return ok(undefined)
}

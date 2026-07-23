/**
 * Billing line guards (Phase 04) — the mobile capture path for the RFP's
 * parallel billing methods: ancillary fixed-amount lines on any card, and
 * rate x time (Method 3) lines gated by a governing contract that permits an
 * individually arranged fee structure (5th review #1). 'rvg' lines are
 * unrepresentable here by design: capture never stores rvg-basis lines (the
 * calculator produces the RVG amount from the captured BTM data), and the
 * office's per-funder allocation editor is Phase 06.
 */

import type { BillingLine, CounterpartyRef } from '../domain/types'
import { INDIVIDUAL_ARRANGEMENT_MESSAGE, feeContextFor } from '../domain/billing/validateCardForBilling'
import { feeFor } from '../domain/billing/fee'
import { roundToCents, toCents } from '../domain/billing/money'
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
import { billingContextForCard, proceduresForCard } from './selectors'

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

/** Office edit of a billing line's per-funder allocation (Phase 06). */
export interface BillingLineAllocationPatch {
  /** Set the counterparty this line bills to; `null` clears the override. */
  funderOverride?: CounterpartyRef | null
  /** Set the line's dollar amount (rounded to cents). */
  amount?: number
}

/**
 * Set a billing line's per-funder allocation — the office capture side of the
 * RFP's one-procedure-two-funders split (5th review #4; 7th review A4/B4).
 * Office-only (the anaesthetist is refused, mirroring `removeBillingLine`).
 * CONSERVATION GUARD: after applying the edit, if any of the procedure's lines
 * carries a funder override the stored amounts must still sum, to the cent, to
 * the computed procedure fee — otherwise `allocationNotConserved` (the same
 * rule the completion validator enforces). Audited `billingLine.update`.
 */
export function setBillingLineAllocation(
  api: AppStoreApi,
  actor: Actor,
  billingLineId: string,
  patch: BillingLineAllocationPatch,
): Outcome {
  const state = api.getState()
  const line = state.schedule.billingLines[billingLineId]
  if (line === undefined) return refuse('notFound', 'Billing line not found.')
  const procedure = state.schedule.procedures[line.procedureId]
  if (procedure === undefined) return refuse('notFound', 'The billing line has no procedure.')
  const found = getCard(state, procedure.cardId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Card.')

  if (actor.role === 'anaesthetist') {
    return refuse(
      'funderAllocationOfficeOnly',
      'Per funder billing allocation is set by the office, not the anaesthetist.',
    )
  }
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights

  const nextLine: BillingLine = { ...line }
  if (patch.amount !== undefined) nextLine.amount = roundToCents(patch.amount)
  if (patch.funderOverride !== undefined) {
    if (patch.funderOverride === null) delete nextLine.funderOverride
    else nextLine.funderOverride = patch.funderOverride
  }

  // Conservation: recompute the procedure fee with the edited line in place.
  const ctx = billingContextForCard(state, found.card)
  if (ctx === undefined) return refuse('missingContext', 'This Card is missing its List or anaesthetist.')
  const editedLines = ctx.billingLines.map((l) => (l.id === billingLineId ? nextLine : l))
  const procedureLines = editedLines.filter((l) => l.procedureId === procedure.id)
  if (procedureLines.some((l) => l.funderOverride !== undefined)) {
    const ordinal = proceduresForCard(state, procedure.cardId).findIndex((p) => p.id === procedure.id) + 1
    const fee = feeFor(procedure, feeContextFor(procedure, ordinal, { ...ctx, billingLines: editedLines }))
    const allocated = procedureLines.reduce((sum, l) => sum + l.amount, 0)
    if (toCents(allocated) !== toCents(fee.total)) {
      return refuse(
        'allocationNotConserved',
        `Billing line amounts must add up to the procedure fee of $${fee.total.toFixed(2)} (they add up to $${allocated.toFixed(2)}).`,
      )
    }
  }

  mutate(
    api,
    actor,
    {
      entityType: 'billingLine',
      entityId: billingLineId,
      action: 'billingLine.update',
      before: { amount: line.amount, funderOverride: line.funderOverride },
      after: patch,
      stampCardId: procedure.cardId,
    },
    (s) => ({
      schedule: { ...s.schedule, billingLines: { ...s.schedule.billingLines, [billingLineId]: nextLine } },
    }),
  )
  return ok(undefined)
}

/** One line's target allocation in a batch (`setProcedureFunderAllocation`). */
export interface FunderAllocationEntry {
  billingLineId: string
  funderOverride?: CounterpartyRef | null
  amount?: number
}

/**
 * Apply a whole procedure's per-line funder allocation in ONE audited commit —
 * so a genuine two-line re-split (move dollars from line A to line B, total
 * unchanged) conserves and saves, which a sequence of single-line
 * `setBillingLineAllocation` calls cannot (each intermediate state would fail
 * conservation). Office-only; conservation is checked once on the final set.
 * Each changed line audits `billingLine.update`.
 */
export function setProcedureFunderAllocation(
  api: AppStoreApi,
  actor: Actor,
  procedureId: string,
  entries: readonly FunderAllocationEntry[],
): Outcome {
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return refuse('notFound', 'Procedure not found.')
  const found = getCard(state, procedure.cardId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Card.')

  if (actor.role === 'anaesthetist') {
    return refuse(
      'funderAllocationOfficeOnly',
      'Per funder billing allocation is set by the office, not the anaesthetist.',
    )
  }
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights

  const ctx = billingContextForCard(state, found.card)
  if (ctx === undefined) return refuse('missingContext', 'This Card is missing its List or anaesthetist.')

  const byId = new Map(entries.map((e) => [e.billingLineId, e]))
  const nextById: Record<string, BillingLine> = {}
  const editedLines = ctx.billingLines.map((line) => {
    const entry = byId.get(line.id)
    if (entry === undefined || line.procedureId !== procedureId) return line
    const next: BillingLine = { ...line }
    if (entry.amount !== undefined) next.amount = roundToCents(entry.amount)
    if (entry.funderOverride !== undefined) {
      if (entry.funderOverride === null) delete next.funderOverride
      else next.funderOverride = entry.funderOverride
    }
    nextById[line.id] = next
    return next
  })

  const procedureLines = editedLines.filter((l) => l.procedureId === procedureId)
  if (procedureLines.some((l) => l.funderOverride !== undefined)) {
    const ordinal = proceduresForCard(state, procedure.cardId).findIndex((p) => p.id === procedureId) + 1
    const fee = feeFor(procedure, feeContextFor(procedure, ordinal, { ...ctx, billingLines: editedLines }))
    const allocated = procedureLines.reduce((sum, l) => sum + l.amount, 0)
    if (toCents(allocated) !== toCents(fee.total)) {
      return refuse(
        'allocationNotConserved',
        `Billing line amounts must add up to the procedure fee of $${fee.total.toFixed(2)} (they add up to $${allocated.toFixed(2)}).`,
      )
    }
  }

  const changedIds = Object.keys(nextById)
  if (changedIds.length === 0) return ok(undefined)

  const metas: MutationMeta[] = changedIds.map((id) => {
    const before = state.schedule.billingLines[id]!
    const next = nextById[id]!
    return {
      entityType: 'billingLine',
      entityId: id,
      action: 'billingLine.update',
      before: { amount: before.amount, funderOverride: before.funderOverride },
      after: { amount: next.amount, funderOverride: next.funderOverride },
      stampCardId: procedure.cardId,
    }
  })
  mutate(api, actor, metas, (s) => {
    const billingLines = { ...s.schedule.billingLines }
    for (const id of changedIds) billingLines[id] = nextById[id]!
    return { schedule: { ...s.schedule, billingLines } }
  })
  return ok(undefined)
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

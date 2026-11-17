/**
 * Billing line guards (Phase 04): ancillary fixed-amount lines on any Booking
 * (until 39b replaces them with billing events). The rate x time line and its
 * Contract gate are gone (catch-up Phase 24, RV-03). 'rvg' lines are
 * unrepresentable here by design: capture never stores rvg-basis lines (the
 * calculator produces the RVG amount from the captured BTM data). Who pays a
 * Procedure is its Contract, or its split (catch-up Phase 22), never a line.
 */

import type { BillingLine } from '../domain/types'
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
import { editRefusal, getBooking } from './lifecycle'

export interface AddBillingLineInput {
  chargeBasis: 'fixed'
  description: string
  amount?: number
}

/**
 * Add a captured fixed billing line to a Procedure, its amount rounded to
 * cents. Audited
 * `billingLine.add`; the parent Booking is stamped by the wrapper.
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
  const found = getBooking(state, procedure.bookingId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Booking.')
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights

  if (input.description.trim() === '') {
    return refuse('descriptionRequired', 'A billing line needs a description.')
  }
  if (input.chargeBasis !== 'fixed') return refuse('fixedOnly', 'A billing line is a fixed amount.')
  if (input.amount === undefined || input.amount <= 0) {
    return refuse('amountRequired', 'Enter an amount greater than zero.')
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
      amount: roundToCents(input.amount ?? 0),
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
 * Remove a stored billing line. The meta carries an explicit `stampBookingId`
 * because the post-recipe stamp derivation cannot find a deleted line, and
 * `before` carries the full line so the audit trail can reconstruct it.
 */
export function removeBillingLine(api: AppStoreApi, actor: Actor, billingLineId: string): Outcome {
  const state = api.getState()
  const line = state.schedule.billingLines[billingLineId]
  if (line === undefined) return refuse('notFound', 'Billing line not found.')
  const procedure = state.schedule.procedures[line.procedureId]
  if (procedure === undefined) return refuse('notFound', 'The billing line has no procedure.')
  const found = getBooking(state, procedure.bookingId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Booking.')
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights

  mutate(
    api,
    actor,
    {
      entityType: 'billingLine',
      entityId: billingLineId,
      action: 'billingLine.remove',
      before: line,
      stampBookingId: procedure.bookingId,
    },
    (s) => {
      const billingLines = { ...s.schedule.billingLines }
      delete billingLines[billingLineId]
      return { schedule: { ...s.schedule, billingLines } }
    },
  )
  return ok(undefined)
}

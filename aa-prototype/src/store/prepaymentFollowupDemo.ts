/**
 * Demo staging for the prepayment follow-up (catch-up Phase 41; US-06.4.1):
 * "Stage longer prepaid procedure" lengthens a sent prepaid Procedure's
 * anaesthetic time on a submitted List through the office's guarded edit, so
 * the presenter can authorise and show that nothing further is billed for the
 * difference. Deterministic and idempotent: the Procedure is set to
 * `STAGE_LONGER_DURATION_MIN` from its start, once.
 */

import { addMinutesISO } from '../domain/xero/queue'
import { bookingFeesFor } from '../domain/billing/validateBookingForBilling'
import type { AppState, AppStoreApi } from './appStore'
import { editProcedure } from './lifecycle'
import { ok, refuse, type Actor, type Outcome } from './mutate'
import { billingContextForBooking, bookingsForList, patientNameFor, proceduresForBooking } from './selectors'
import { prepaidSettlementFor, prepaymentStatusFor } from './prepaymentSelectors'

export const STAGE_LONGER_DURATION_MIN = 240

export const LONGER_PREPAID_COPY = {
  submitFirst: 'Submit this List first',
  noSentPrepayment: 'No sent prepayment on this List',
  alreadyStaged: 'Already staged',
  staged: (units: number) =>
    `Recorded BTM now ${units} units, for reference only. Authorise bills nothing more for the prepaid procedure; raise an additional invoice by hand if one is needed.`,
} as const

type DemoState = Pick<AppState, 'schedule' | 'billing' | 'masters'>

/** The prepaid Procedure on a Booking whose prepayment invoice was sent and stands. */
function sentPrepaidProcedure(state: DemoState, bookingId: string): string | undefined {
  const sent = prepaymentStatusFor(state, bookingId).groups.some((g) => g.invoiceId !== undefined && g.status !== 'notNeeded' && g.status !== 'changedAfterSending')
  if (!sent) return undefined
  return proceduresForBooking(state, bookingId).find((p) => prepaidSettlementFor(state, p.id)?.prepaymentInvoice.status !== 'credited' && prepaidSettlementFor(state, p.id) !== undefined)?.id
}

function isStaged(state: DemoState, procedureId: string): boolean {
  const p = state.schedule.procedures[procedureId]
  return p?.anaestheticStartISO !== undefined && p.handoverISO === addMinutesISO(p.anaestheticStartISO, STAGE_LONGER_DURATION_MIN)
}

/** The List's Bookings with a sent prepayment, as the trigger's choices. */
export function longerPrepaidChoices(state: DemoState, listId: string): { id: string; label: string }[] {
  return bookingsForList(state, listId)
    .filter((b) => b.cancellation === undefined && sentPrepaidProcedure(state, b.id) !== undefined)
    .map((b) => ({ id: b.id, label: patientNameFor(state, b.patientId) }))
}

/** Why the trigger is disabled on this List, or null. */
export function stageLongerRefusal(state: DemoState, listId: string | undefined): string | null {
  const list = listId !== undefined ? state.schedule.lists[listId] : undefined
  if (list === undefined || list.state !== 'SUBMITTED') return LONGER_PREPAID_COPY.submitFirst
  const choices = longerPrepaidChoices(state, list.id)
  if (choices.length === 0) return LONGER_PREPAID_COPY.noSentPrepayment
  if (choices.every((c) => isStaged(state, sentPrepaidProcedure(state, c.id)!))) return LONGER_PREPAID_COPY.alreadyStaged
  return null
}

/** Lengthen the prepaid Procedure's anaesthetic time to 240 minutes as the office (the guarded edit), and report its recorded units. */
export function stageLongerPrepaidProcedure(api: AppStoreApi, actor: Actor, listId: string, bookingId?: string): Outcome<{ units: number; procedureId: string }> {
  const state = api.getState()
  const refusal = stageLongerRefusal(state, listId)
  if (refusal !== null) return refuse('notStageable', refusal)
  const choices = longerPrepaidChoices(state, listId)
  const chosen = bookingId ?? choices.find((c) => !isStaged(state, sentPrepaidProcedure(state, c.id)!))?.id
  const procedureId = chosen !== undefined ? sentPrepaidProcedure(state, chosen) : undefined
  if (chosen === undefined || procedureId === undefined) return refuse('notStageable', LONGER_PREPAID_COPY.noSentPrepayment)
  const procedure = state.schedule.procedures[procedureId]!
  const startISO = procedure.anaestheticStartISO ?? `${state.schedule.lists[listId]!.dateISO}T08:00:00`
  const edited = editProcedure(api, actor, procedureId, { anaestheticStartISO: startISO, handoverISO: addMinutesISO(startISO, STAGE_LONGER_DURATION_MIN) })
  if (!edited.ok) return edited
  const now = api.getState()
  const booking = now.schedule.bookings[chosen]!
  const ctx = billingContextForBooking(now, booking)
  const fees = ctx !== undefined ? bookingFeesFor(proceduresForBooking(now, chosen), ctx) : undefined
  const units = fees !== undefined && fees.kind !== 'structural' ? (fees.fees[procedureId]?.billableUnits ?? 0) : 0
  return ok({ units, procedureId })
}

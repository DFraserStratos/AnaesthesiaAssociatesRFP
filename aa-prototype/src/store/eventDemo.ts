/**
 * Demo trigger bodies for events on a Procedure (catch-up Phase 38b), in the
 * store so the PWA build reaches them (`pwaPurity`).
 *
 * - The next billing run: `runEventInvoicing` as the simulated office, standing
 *   in for the real system's scheduled run (`EVENT_RULES.nextRun`).
 * - The PWA stand-in "Office reviews this additional invoice": the office
 *   approves the oldest event awaiting review on this Booking and the next run
 *   invoices it (narrowed to that event).
 */

import { approveProcedureEvent, approvedEventsAwaitingRun, eventsAwaitingReview, runEventInvoicing } from './procedureEventActions'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { ok, refuse, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { EVENT_MESSAGES } from '../shared/procedureEventCopy'

export const NO_EVENT_AWAITING_ON_BOOKING = 'No additional invoice on this Booking is awaiting review'

/** Why the next billing run has nothing to do, or null. */
export function nextRunRefusal(state: Pick<AppState, 'schedule'>): string | null {
  return approvedEventsAwaitingRun(state).length === 0 ? EVENT_MESSAGES.nothingToRun : null
}

/** The next billing run for events, as the simulated office: the new invoices' numbers. */
export function runNextBillingRun(api: AppStoreApi): Outcome<{ numbers: string[]; skipped: { eventId: string; message: string }[] }> {
  const out = runEventInvoicing(api, OFFICE_SIMULATION_ACTOR)
  if (!out.ok) return out
  const invoices = api.getState().billing.invoices
  return ok({ numbers: out.value.invoiceIds.map((id) => invoices[id]?.invoiceNumber ?? id), skipped: out.value.skipped })
}

/** The oldest event awaiting review on a Booking. */
function oldestAwaitingOn(state: Pick<AppState, 'schedule'>, bookingId: string): string | undefined {
  return eventsAwaitingReview(state).find((e) => e.bookingId === bookingId)?.id
}

export function officeReviewRefusal(state: Pick<AppState, 'schedule'>, bookingId: string): string | null {
  return oldestAwaitingOn(state, bookingId) === undefined ? NO_EVENT_AWAITING_ON_BOOKING : null
}

/** The PWA's office stand-in: approve the oldest event awaiting review on this Booking, then invoice it in the next run. */
export function officeReviewsAdditionalInvoice(api: AppStoreApi, bookingId: string): Outcome<{ number: string }> {
  const eventId = oldestAwaitingOn(api.getState(), bookingId)
  if (eventId === undefined) return refuse('nothingAwaiting', NO_EVENT_AWAITING_ON_BOOKING)
  const approved = approveProcedureEvent(api, OFFICE_SIMULATION_ACTOR, eventId)
  if (!approved.ok) return approved
  const run = runEventInvoicing(api, OFFICE_SIMULATION_ACTOR, { eventIds: [eventId] })
  // Approved but the run could not invoice it: say so, rather than a bare refusal.
  if (!run.ok) return refuse(run.code, `Approved by the office, not yet invoiced: ${run.message}`)
  const id = run.value.invoiceIds[0]!
  return ok({ number: api.getState().billing.invoices[id]?.invoiceNumber ?? id })
}

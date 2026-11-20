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
import { OFFICE_ACTOR, OFFICE_SIMULATION_ACTOR } from './demoActors'
import { ok, refuse, type Actor, type Outcome } from './mutate'
import type { Booking } from '../domain/types'
import { slotIdFor } from '../domain/slots'
import { ANAE, HOSP, PAT, SURG } from '../domain/seed'
import { CONTRACT } from '../domain/seed/contracts'
import { rvgGroupIdForLegacyCode } from '../domain/seed/rvgGroups'
import { listInSlot } from './selectors'
import { assignListToSlot } from './slotActions'
import { eventPriceNow, isPricedKind } from './eventKindActions'
import { createBooking } from './bookingActions'
import { cancelBooking, completeBooking, editProcedure, submitList } from './lifecycle'
import { confirmNoModifiers } from './modifierActions'
import type { AppState, AppStoreApi } from './appStore'
import { EVENT_MESSAGES } from '../shared/procedureEventCopy'

export const NO_EVENT_AWAITING_ON_BOOKING = 'No event awaiting review or the next run on this Booking'

// ---------------------------------------------------------------------------
// Stage post-op scenario, Dr Souter's half (catch-up Phase 39b)
// ---------------------------------------------------------------------------

/**
 * The staged Procedure for pre-op and post-op events: Dr Souter's Wed 15 Jul
 * PM session (the doc's Thu 16 Jul AM is a public-hospital session in the
 * seed, so its fallback rule takes her nearest earlier free weekday session),
 * St George's with Mr Hale, Coral Bennett, an ACL reconstruction under St
 * George's ACC (`CT-STG-ACC`), 08:05 to 09:40 recorded, no optional modifier,
 * no claim or holder reference (D82), left SUBMITTED.
 */
export const SOUTER_POST_OP = {
  slotId: slotIdFor(ANAE.souter, '2026-07-15', 'PM'),
  dateISO: '2026-07-15',
  hospitalId: HOSP.stg,
  surgeonId: SURG.hale,
  patientId: PAT.bennett,
  contractId: CONTRACT.stgAcc,
  rvgLegacyCode: '49561',
  procedureText: 'ACL reconstruction, ACC',
  start: '13:05',
  handover: '14:40',
} as const

/** The staged Booking, once staged: on the session's List, Coral Bennett's, not cancelled. */
export function stagedSouterBooking(state: Pick<AppState, 'schedule'>): Booking | undefined {
  const list = listInSlot(state as AppState, SOUTER_POST_OP.slotId)
  if (list === undefined) return undefined
  return Object.values(state.schedule.bookings).find((b) => b.listId === list.id && b.patientId === SOUTER_POST_OP.patientId && b.cancellation === undefined)
}

/**
 * Stage Dr Souter's half through the ordinary actions and actors (never a
 * direct state write): the office assigns the List and books it (each
 * Procedure's payer from the patient, 22a), then Dr Souter records the times,
 * answers the modifiers step with none, completes and submits (15a: no
 * confirm step). Idempotent: a staged Booking is left as it is.
 */
export function stagePostOpForSouter(api: AppStoreApi): Outcome<{ bookingId: string; listId: string; staged: boolean }> {
  const existing = stagedSouterBooking(api.getState())
  if (existing !== undefined) return ok({ bookingId: existing.id, listId: existing.listId, staged: false })
  const state = api.getState()
  const patient = state.masters.patients[SOUTER_POST_OP.patientId]
  if (patient === undefined) return refuse('notFound', 'Coral Bennett is not in this seed.')
  const souter: Actor = { who: state.masters.anaesthetists[ANAE.souter]?.name ?? 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
  const placed = listInSlot(state, SOUTER_POST_OP.slotId) ?? undefined
  let listId = placed?.id
  if (listId === undefined) {
    const assigned = assignListToSlot(api, OFFICE_ACTOR, SOUTER_POST_OP.slotId, { hospitalId: SOUTER_POST_OP.hospitalId, surgeonId: SOUTER_POST_OP.surgeonId, kind: 'private' })
    if (!assigned.ok) return assigned
    listId = assigned.value.listId
  }
  const made = createBooking(api, OFFICE_ACTOR, listId, {
    patient: { nhi: patient.nhi, name: patient.name, dobISO: patient.dobISO },
    sourceText: { text: SOUTER_POST_OP.procedureText, source: 'email' },
    rvgGroupId: rvgGroupIdForLegacyCode(SOUTER_POST_OP.rvgLegacyCode),
    governingContractId: SOUTER_POST_OP.contractId,
    scheduledTime: '13:00',
  })
  if (!made.ok) return made
  const { bookingId } = made.value
  const procedure = Object.values(api.getState().schedule.procedures).find((p) => p.bookingId === bookingId)!
  const steps: (() => Outcome<unknown>)[] = [
    () => editProcedure(api, souter, procedure.id, { anaestheticStartISO: `${SOUTER_POST_OP.dateISO}T${SOUTER_POST_OP.start}:00`, handoverISO: `${SOUTER_POST_OP.dateISO}T${SOUTER_POST_OP.handover}:00` }),
    () => confirmNoModifiers(api, souter, procedure.id),
    () => completeBooking(api, souter, bookingId),
    () => submitList(api, souter, listId!),
  ]
  for (const step of steps) {
    const out = step()
    if (!out.ok) {
      cancelBooking(api, OFFICE_ACTOR, bookingId, 'Demo staging did not complete')
      return refuse(out.code, `Refused: ${out.message}`)
    }
  }
  return ok({ bookingId, listId, staged: true })
}

/** Why the next billing run has nothing to do, or null. */
export function nextRunRefusal(state: Pick<AppState, 'schedule'>): string | null {
  return approvedEventsAwaitingRun(state).length === 0 ? EVENT_MESSAGES.nothingToRun : null
}

/** The next billing run for events, as the simulated office: the new invoices' numbers, and the credit notes' (catch-up Phase 39). */
export function runNextBillingRun(api: AppStoreApi): Outcome<{ numbers: string[]; creditNoteNumbers: string[]; skipped: { eventId: string; message: string }[] }> {
  const out = runEventInvoicing(api, OFFICE_SIMULATION_ACTOR)
  if (!out.ok) return out
  const { invoices, creditNotes } = api.getState().billing
  return ok({
    numbers: out.value.invoiceIds.map((id) => invoices[id]?.invoiceNumber ?? id),
    creditNoteNumbers: out.value.creditNoteIds.map((id) => creditNotes[id]?.creditNoteNumber ?? id),
    skipped: out.value.skipped,
  })
}

/**
 * The oldest additional invoice awaiting review on a Booking. A credit and a
 * replacement are skipped (catch-up Phase 39): a replacement is issued only
 * through its credit, which has its own stand-in, "Office reviews this credit".
 */
function oldestAwaitingOn(state: Pick<AppState, 'schedule'>, bookingId: string): string | undefined {
  return eventsAwaitingReview(state).find((e) => e.bookingId === bookingId && e.kind !== 'credit' && e.replaces === undefined)?.id
}

/** Catch-up Phase 39b: with none awaiting review, the oldest approved event on the Booking still waiting for the run. */
function oldestApprovedOn(state: Pick<AppState, 'schedule'>, bookingId: string): string | undefined {
  return approvedEventsAwaitingRun(state).find((e) => e.bookingId === bookingId && e.kind !== 'credit' && e.replaces === undefined)?.id
}

export const NEEDS_OFFICE_PRICE = 'Needs a price from the office: review it in Admin'

export function officeReviewRefusal(state: Pick<AppState, 'schedule' | 'billing' | 'masters'>, bookingId: string): string | null {
  const awaiting = oldestAwaitingOn(state, bookingId)
  if (awaiting === undefined) return oldestApprovedOn(state, bookingId) === undefined ? NO_EVENT_AWAITING_ON_BOOKING : null
  // A timed event on a fixed or open price (noEventRate) needs the office's own price: the stand-in sets none.
  const event = state.schedule.procedureEvents[awaiting]!
  return isPricedKind(event.kind) && eventPriceNow(state, event).kind === 'refused' ? NEEDS_OFFICE_PRICE : null
}

/**
 * The PWA's office stand-in, "Office reviews this event" (catch-up Phase 39b
 * widened 38b's): approve the oldest event awaiting review on this Booking
 * (any kind but a credit, any List state) with its default party and no
 * office price, or, with none awaiting, take the oldest approved one, then
 * invoice it in the next run (narrowed to that event).
 */
export function officeReviewsAdditionalInvoice(api: AppStoreApi, bookingId: string): Outcome<{ number: string }> {
  const refusal = officeReviewRefusal(api.getState(), bookingId)
  if (refusal !== null) return refuse('nothingAwaiting', refusal)
  const awaiting = oldestAwaitingOn(api.getState(), bookingId)
  const eventId = awaiting ?? oldestApprovedOn(api.getState(), bookingId)!
  if (awaiting !== undefined) {
    const approved = approveProcedureEvent(api, OFFICE_SIMULATION_ACTOR, eventId)
    if (!approved.ok) return approved
  }
  const run = runEventInvoicing(api, OFFICE_SIMULATION_ACTOR, { eventIds: [eventId] })
  // Approved but the run could not invoice it: say so, rather than a bare refusal.
  if (!run.ok) return refuse(run.code, `Approved by the office, not yet invoiced: ${run.message}`)
  const id = run.value.invoiceIds[0]
  // A credit sent back to review (catch-up Phase 39b) raises nothing: say why.
  if (id === undefined) return refuse('notInvoiced', `Approved by the office, not yet invoiced: ${run.value.skipped[0]?.message ?? ''}`)
  return ok({ number: api.getState().billing.invoices[id]?.invoiceNumber ?? id })
}

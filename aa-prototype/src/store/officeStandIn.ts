/**
 * The office stand-in (catch-up Phase 14): authorise and bill one SUBMITTED
 * List as the simulated office. Lifted from the PWA's `playTheOffice` so the
 * per-List "Office authorises this List" demo trigger and the "Play the office"
 * timer share one body.
 *
 * It is a demo stand-in, NOT the proposed flow: a real submission goes to the
 * office review queue (US-07.2.2, US-07.3.1). It exists for the installed PWA,
 * which has no Admin app to play the office from.
 */

import type { AppState, AppStoreApi } from './appStore'
import { handoffListCases, runBillingForList } from './billingRun'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { authoriseBlockersFor, authoriseList, incompleteBookingsOn } from './lifecycle'
import { ok, refuse, type Outcome } from './mutate'
import { isListBilled, isOpenSlotView, scheduleHorizon, slotViewsForAnaesthetist, waitingDraftLists } from './selectors'
import { assignDraftList, createDraftList, draftListFitsAnaesthetist, surgeonFitsAnaesthetist } from './draftListActions'
import { CANNED_DRAFT_LIST_REQUESTS } from '../domain/seed'
import { assignListToSlot } from './slotActions'
import { approvePrepayment, PREPAYMENT_ALREADY_SENT, PREPAYMENT_NOT_NEEDED } from './prepaymentActions'
import { prepaymentStatusFor } from './prepaymentSelectors'
import { TYPE_AN_AMOUNT_FIRST } from '../domain/billing/prepayment'
import { formatMoney } from '../domain/billing/money'
import type { Slot } from '../domain/types'
import { OUT_OF_HOURS, compareSessions } from '../domain/outOfHours'
import { isAssignedList } from '../domain/draftLists'
import { slotIdFor } from '../domain/slots'
import { closeOutOfHoursSession, openOutOfHoursSession } from './outOfHoursActions'

/**
 * The stand-in's refusal while a Booking on the SUBMITTED List is incomplete
 * (catch-up Phase 38a: the anaesthetist can reopen or add one after submit, and
 * authorise is completion-gated). The automatic "Play the office" job waits on it.
 */
export const STAND_IN_INCOMPLETE = 'A Booking on this List is not complete'

/** Why the stand-in cannot act on `listId` now, or null: the demo trigger's disabled reason and this guard's refusal. */
export function officeStandInRefusal(state: AppState, listId: string): string | null {
  const list = state.schedule.lists[listId]
  if (list === undefined) return 'This List is not in the current demo data'
  if (list.state === 'ACTIVE') return 'Submit the List first'
  if (list.state !== 'SUBMITTED') return 'Already authorised'
  // A Procedure that needs a price blocks the lock (catch-up Phase 25), named as the office's Review names it.
  const blocker = authoriseBlockersFor(state, listId)[0]
  if (blocker !== undefined) return blocker.message
  if (incompleteBookingsOn(state, listId).length > 0) return STAND_IN_INCOMPLETE
  return null
}

export function authoriseAsSimulatedOffice(api: AppStoreApi, listId: string): Outcome<{ billed: boolean }> {
  const refusal = officeStandInRefusal(api.getState(), listId)
  const list = api.getState().schedule.lists[listId]
  if (refusal !== null || list === undefined) return refuse('officeStandIn', refusal ?? 'This List is not in the current demo data')

  const authorised = authoriseList(api, OFFICE_SIMULATION_ACTOR, listId)
  if (!authorised.ok) return authorised

  // `authoriseList` emits `listAuthorised` inside that call. Where the host
  // also wired `wireBillingRun` (both entries do) the run and the Xero handoff
  // have already completed synchronously and the List is stamped billed by the
  // time we get here. The explicit run is the fallback for a host that did not;
  // `runBillingForList` refuses `alreadyBilled` anyway, so the two paths
  // together can never bill a List twice.
  const after = api.getState().schedule.lists[listId] ?? list
  if (isListBilled(after)) return ok({ billed: true })
  const run = runBillingForList(api, listId)
  if (!run.ok) return ok({ billed: false })
  handoffListCases(api, listId)
  return ok({ billed: isListBilled(api.getState().schedule.lists[listId] ?? after) })
}

/**
 * The office stand-in approves and sends a prepayment invoice (catch-up Phase
 * 27; US-06.3.1): the installed PWA has no Invoices screen, so this plays
 * Approve and send on one of this Booking's ready payer groups, as the
 * simulated office. Choices name each payer where there are two.
 */
export function prepaymentApprovalChoices(state: AppState, bookingId: string): { id: string; label: string }[] {
  return prepaymentStatusFor(state, bookingId)
    .groups.filter((g) => g.status === 'awaitingApproval')
    .map((g) => ({ id: g.payerKey, label: `${g.payerName}${g.amount !== null ? ` · ${formatMoney(g.amount)}` : ''}` }))
}

/** Why the stand-in cannot approve a prepayment on this Booking (or this payer), or null. */
export function prepaymentStandInRefusal(state: AppState, bookingId: string, payerKey?: string): string | null {
  const status = prepaymentStatusFor(state, bookingId)
  if (status.groups.length === 0) return PREPAYMENT_NOT_NEEDED
  const pending = status.groups.filter((g) => g.status === 'awaitingApproval' && (payerKey === undefined || g.payerKey === payerKey))
  if (pending.length === 0) return PREPAYMENT_ALREADY_SENT
  if (!pending.some((g) => g.ready)) return pending[0]!.notReadyReason ?? TYPE_AN_AMOUNT_FIRST
  return null
}

export function approvePrepaymentAsSimulatedOffice(api: AppStoreApi, bookingId: string, payerKey?: string): Outcome<{ invoiceNumber: string; amount: number }> {
  const state = api.getState()
  const refusal = prepaymentStandInRefusal(state, bookingId, payerKey)
  if (refusal !== null) return refuse('officeStandIn', refusal)
  const group = prepaymentStatusFor(state, bookingId).groups.find((g) => g.status === 'awaitingApproval' && g.ready && (payerKey === undefined || g.payerKey === payerKey))!
  const approved = approvePrepayment(api, OFFICE_SIMULATION_ACTOR, bookingId, group.payerKey)
  if (!approved.ok) return approved
  const invoice = api.getState().billing.invoices[approved.value.invoiceId]
  return ok({ invoiceNumber: invoice?.invoiceNumber ?? '', amount: invoice?.total ?? 0 })
}

// ---------------------------------------------------------------------------
// "Office assigns a List to my next free session" (catch-up Phase 28)
// ---------------------------------------------------------------------------

/**
 * The stand-in's three fixed pairings (hospital and surgeon). A seed test
 * outside the PWA closure pins that none is a not-preferred pairing with the
 * PWA persona (Dr Souter), so this body never needs to read a preference: it
 * is in the PWA closure, where the office-private slice may not be named.
 */
export const STAND_IN_ASSIGN_CHOICES = [
  { id: 'stg-hale', hospitalId: 'H-STG', surgeonId: 'S-HALE' },
  { id: 'sx-patel', hospitalId: 'H-SX', surgeonId: 'S-PATEL' },
  { id: 'forte-okafor', hospitalId: 'H-FORTE', surgeonId: 'S-OKAFOR' },
] as const

/** The anaesthetist's earliest open session from the demo clock's today to the horizon end, in date then session order. */
export function nextOpenSlotFor(state: AppState, anaesthetistId: string): Slot | undefined {
  const horizon = scheduleHorizon(state)
  return slotViewsForAnaesthetist(state, anaesthetistId, state.clock.todayISO, horizon.endISO).find(isOpenSlotView)?.slot
}

/**
 * Stands in for the office on the PWA (which has no Admin app): assigns a
 * private List to the anaesthetist's next open session, acting as
 * `OFFICE_SIMULATION_ACTOR` through `assignListToSlot` (which runs its own
 * office checks). "Today" is the demo clock's today, never the wall clock.
 */
export function assignNextFreeSlotAsSimulatedOffice(
  api: AppStoreApi,
  anaesthetistId: string,
  choiceId?: string,
): Outcome<{ listId: string; slot: Slot; hospitalId: string; surgeonId: string }> {
  const choice = STAND_IN_ASSIGN_CHOICES.find((c) => c.id === choiceId) ?? STAND_IN_ASSIGN_CHOICES[0]
  const slot = nextOpenSlotFor(api.getState(), anaesthetistId)
  if (slot === undefined) return refuse('noOpenSession', 'No free session before the schedule horizon ends')
  const out = assignListToSlot(api, OFFICE_SIMULATION_ACTOR, slot.id, { hospitalId: choice.hospitalId, surgeonId: choice.surgeonId, kind: 'private' })
  if (!out.ok) return out
  return ok({ listId: out.value.listId, slot, hospitalId: choice.hospitalId, surgeonId: choice.surgeonId })
}

/**
 * "Office assigns a Draft List to me" (catch-up Phase 31; PWA parity for the
 * office's assignment, US-01.6.3): stands in for the office, acting as
 * `OFFICE_SIMULATION_ACTOR` through `assignDraftList`, so the List becomes
 * ACTIVE in the anaesthetist's session and the audit is the office's. It
 * walks the anaesthetist's open sessions from today (the same scan as
 * `nextOpenSlotFor`) and takes, on the first session some waiting request fits,
 * the first in the one order; it skips a not-preferred pairing through a
 * boolean, never reading or naming a preference or a tier (D44). With none,
 * it logs a request for the next open session from the canned set and
 * assigns that, so the handset beat never dead-ends.
 */
export function assignDraftListAsSimulatedOffice(
  api: AppStoreApi,
  anaesthetistId: string,
): Outcome<{ listId: string; slot: Slot; logged: boolean; hospitalId: string; surgeonId: string; bookings: number }> {
  const state = api.getState()
  const horizon = scheduleHorizon(state)
  const open = slotViewsForAnaesthetist(state, anaesthetistId, state.clock.todayISO, horizon.endISO).filter(isOpenSlotView)
  if (open.length === 0) return refuse('noOpenSession', 'No free session in the schedule')
  const waiting = waitingDraftLists(state)
  for (const v of open) {
    const fit = waiting.find((l) => l.dateISO === v.slot.dateISO && l.session === v.slot.session && draftListFitsAnaesthetist(state, l.id, anaesthetistId))
    if (fit === undefined) continue
    const out = assignDraftList(api, OFFICE_SIMULATION_ACTOR, fit.id, { anaesthetistId })
    if (!out.ok) return out
    const bookings = Object.values(api.getState().schedule.bookings).filter((b) => b.listId === fit.id && b.cancellation === undefined).length
    return ok({ listId: fit.id, slot: v.slot, logged: false, hospitalId: fit.hospitalId, surgeonId: fit.surgeonId, bookings })
  }
  // None fits: log a request for the next open session, from a canned pairing that fits, and assign it.
  const slot = open[0]!.slot
  const choice = CANNED_DRAFT_LIST_REQUESTS.find((c) => surgeonFitsAnaesthetist(state, anaesthetistId, c.surgeonId))
  if (choice === undefined) return refuse('noOpenSession', 'No free session in the schedule')
  const created = createDraftList(api, OFFICE_SIMULATION_ACTOR, { hospitalId: choice.hospitalId, surgeonId: choice.surgeonId, dateISO: slot.dateISO, session: slot.session, kind: 'private', source: choice.source })
  if (!created.ok) return created
  const out = assignDraftList(api, OFFICE_SIMULATION_ACTOR, created.value.listId, { anaesthetistId })
  if (!out.ok) return out
  return ok({ listId: created.value.listId, slot, logged: true, hospitalId: choice.hospitalId, surgeonId: choice.surgeonId, bookings: 0 })
}

/**
 * Why the office stand-in cannot open tonight's out-of-hours session and put a
 * List in it, or null (catch-up Phase 32c): one is already open tonight, or
 * the anaesthetist has no List yet to take the hospital and surgeon from.
 */
export function outOfHoursStandInRefusal(state: AppState, anaesthetistId: string): string | null {
  if (state.schedule.slots[slotIdFor(anaesthetistId, state.clock.todayISO, OUT_OF_HOURS)] !== undefined) return 'An out-of-hours session is already open tonight'
  if (latestListOf(state, anaesthetistId) === undefined) return 'No List yet to take the hospital and surgeon from'
  return null
}

/** The anaesthetist's latest List on or before today (by day, then session). */
function latestListOf(state: AppState, anaesthetistId: string) {
  return Object.values(state.schedule.lists)
    .filter(isAssignedList)
    .filter((l) => l.anaesthetistId === anaesthetistId && l.dateISO <= state.clock.todayISO && l.removedAtISO === undefined)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO) || compareSessions(b, a) || b.id.localeCompare(a.id))[0]
}

/**
 * "The office adds an out-of-hours List for me tonight" (catch-up Phase 32c;
 * PWA parity for US-01.1.6): stands in for the office, acting as
 * `OFFICE_SIMULATION_ACTOR`. It opens today's out-of-hours session at its
 * default times and assigns a List into it, at the hospital and with the
 * surgeon of the anaesthetist's latest List, through the same store actions
 * the office uses on Admin Day.
 */
export function addOutOfHoursListAsSimulatedOffice(api: AppStoreApi, anaesthetistId: string): Outcome<{ listId: string; startTime: string }> {
  const state = api.getState()
  const reason = outOfHoursStandInRefusal(state, anaesthetistId)
  if (reason !== null) return refuse('notEligible', reason)
  const latest = latestListOf(state, anaesthetistId)!
  const opened = openOutOfHoursSession(api, OFFICE_SIMULATION_ACTOR, anaesthetistId, state.clock.todayISO)
  if (!opened.ok) return opened
  const assigned = assignListToSlot(api, OFFICE_SIMULATION_ACTOR, opened.value.slotId, { hospitalId: latest.hospitalId, surgeonId: latest.surgeonId, kind: latest.kind })
  if (!assigned.ok) {
    // Leave nothing half done: close the session it just opened.
    closeOutOfHoursSession(api, OFFICE_SIMULATION_ACTOR, opened.value.slotId)
    return assigned
  }
  return ok({ listId: assigned.value.listId, startTime: api.getState().appSettings.schedule.defaultTimes.OOH.startTime })
}

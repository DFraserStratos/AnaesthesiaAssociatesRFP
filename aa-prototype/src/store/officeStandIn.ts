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
import { authoriseList } from './lifecycle'
import { ok, refuse, type Outcome } from './mutate'
import { isListBilled, isOpenSlotView, scheduleHorizon, slotViewsForAnaesthetist, waitingDraftLists } from './selectors'
import { assignDraftList, createDraftList, draftListFitsAnaesthetist, surgeonFitsAnaesthetist } from './draftListActions'
import { CANNED_DRAFT_LIST_REQUESTS } from '../domain/seed'
import { assignListToSlot } from './slotActions'
import type { Slot } from '../domain/types'

/** Why the stand-in cannot act on `listId` now, or null: the demo trigger's disabled reason and this guard's refusal. */
export function officeStandInRefusal(state: Pick<AppState, 'schedule'>, listId: string): string | null {
  const list = state.schedule.lists[listId]
  if (list === undefined) return 'This List is not in the current demo data'
  if (list.state === 'ACTIVE') return 'Submit the List first'
  if (list.state !== 'SUBMITTED') return 'Already authorised'
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

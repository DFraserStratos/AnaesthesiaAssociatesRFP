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
import { isListBilled, isOpenSlotView, scheduleHorizon, slotViewsForAnaesthetist } from './selectors'
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

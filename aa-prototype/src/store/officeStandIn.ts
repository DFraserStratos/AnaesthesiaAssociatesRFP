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
import { isListBilled } from './selectors'

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

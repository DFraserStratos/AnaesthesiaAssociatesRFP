/**
 * The office simulation (PWA only) — a stand-in for the half of the workflow
 * that lives in an app the phone does not have.
 *
 * WHY IT EXISTS. The installed PWA mounts the Anaesthetist Mobile App and
 * nothing else. It does not render `AppShell`, so it has none of the demo
 * harness: no `DemoClockMenu`, no `DemoResetButton`, no `AppSwitcher` and,
 * decisively, NO ADMIN APP. In the framed prototype the presenter plays both
 * parts — the anaesthetist submits a List on the phone, then the presenter
 * switches to the Admin Web App, authorises it, and the billing run raises the
 * invoices. On a real phone there is nobody to play the office, so a submitted
 * List simply stops there: the Done tab fills and never empties, Balances never
 * moves, and the second half of the story is unreachable. This job plays the
 * office so the phone can tell the whole story on its own.
 *
 * IT IS A SIMULATION, AND IT IS EXPLICITLY NOT THE RFP FLOW. Nothing in the RFP
 * authorises a List off the back of the anaesthetist's own submit, and this must
 * never be presented as proposed behaviour. A real submission goes to the
 * OFFICE REVIEW QUEUE, where a person checks it (missing billing references,
 * pre-payment gates, cancelled cards, phone notes) and authorises it
 * deliberately — that separation is the whole point of the SUBMITTED state, and
 * the Admin Review screen is where the prototype demonstrates it. What this job
 * simulates is only the PASSAGE OF TIME and the presence of that person. It is
 * off-switchable from the PWA demo panel precisely so a presenter can show the
 * honest behaviour (a submitted List that waits) whenever the question comes up,
 * and switching it back on hands that same waiting List to the office rather
 * than orphaning it, so the story can carry on from where the question left it.
 *
 * It is PWA-ONLY. `src/main.tsx` never wires it: in the prototype the Admin app
 * is right there behind the app switcher, and auto-authorising would sabotage
 * the scripted S3 review beat. Only the PWA entry calls `wireOfficeSimulation`.
 *
 * THE CHAIN IT COMPLETES. A few seconds after a List transitions DRAFT ->
 * SUBMITTED it authorises that List as the office, through the ordinary
 * `authoriseList` guard with an office-shaped Actor. That commits the
 * SUBMITTED -> AUTHORISED transition, locks the Cards, and emits
 * `listAuthorised`; `wireBillingRun` (wired by the PWA entry exactly as
 * `main.tsx` wires it) consumes the event, runs the billing run, raises the
 * Invoices and their BillingCases, stamps `billedAtISO`, and hands the cases off
 * to the Xero mirror as ACCREC/ACCPAY pairs. The billed List then drops out of
 * the anaesthetist's Done tab and its money appears in Balances — which is the
 * whole reason this exists. Should a host ever wire this job WITHOUT the billing
 * run, the explicit run below finishes the chain itself; the `alreadyBilled`
 * guard makes running both paths harmless.
 *
 * Everything here is UI-layer: a `window.setTimeout` for the delay and a
 * localStorage flag for the toggle. Every domain write goes through the
 * sanctioned, audited store actions, so the lifecycle guards apply in full and
 * the audit trail names the simulation as the actor.
 */

import {
  authoriseList,
  handoffListCases,
  isListBilled,
  runBillingForList,
  type Actor,
  type BoundAppStore,
} from '../store'

// ---------------------------------------------------------------------------
// The toggle (presenter setting, persisted outside the store)
// ---------------------------------------------------------------------------

/** localStorage key for the toggle. Sits with `aa-phone-scale` / `aa-gradient-lab`. */
export const OFFICE_SIM_STORAGE_KEY = 'aa-office-simulation'

const STORED_ON = 'on'
const STORED_OFF = 'off'

/**
 * The single description of what the toggle does. Exported so the demo panel's
 * label and this module's behaviour cannot drift apart.
 */
export const OFFICE_SIM_COPY = 'Submitted lists are authorised and billed automatically, as the office would.'

/**
 * How long the office "takes" to pick a submitted List up. Long enough that the
 * authorise reads as a separate event happening elsewhere rather than part of
 * the submit (the submit overlay itself clears at ~1s, so the presenter is back
 * on the Lists screen and watching by the time this lands), short enough that
 * nobody on stage is left waiting for it.
 */
export const OFFICE_SIM_DELAY_MS = 4_000

/**
 * The office, simulated. Office-shaped exactly as the Admin Web App builds its
 * actor (`role: 'office'`, `source: 'office'`) because this performs a genuine
 * office action and must pass the same `officeOnly` guards, but the `who` says
 * plainly what it is: nobody reading the audit log in a workshop should come
 * away thinking a real person authorised this List.
 */
const OFFICE_SIMULATION_ACTOR: Actor = { who: 'AA office (simulated)', role: 'office', source: 'office' }

/**
 * Current setting. Defaults to TRUE when nothing is stored — the phone is
 * useless as a demo without it. Anything other than the stored "off" reads as
 * on, so a corrupted value degrades to the useful default rather than a dead
 * app. Guarded, like `readStoredScale`: storage throws outright in private mode
 * and under some enterprise policies.
 */
export function isOfficeSimulationEnabled(): boolean {
  try {
    return window.localStorage.getItem(OFFICE_SIM_STORAGE_KEY) !== STORED_OFF
  } catch {
    return true
  }
}

/**
 * Persist the setting. Read when the office timer fires rather than when the job
 * was wired, so a flip takes effect with no reload and in both directions: OFF
 * leaves a submitted List waiting, and ON hands over any List that has been
 * waiting within one more delay (the timer re-arms while the toggle is off).
 */
export function setOfficeSimulationEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(OFFICE_SIM_STORAGE_KEY, on ? STORED_ON : STORED_OFF)
  } catch {
    /* ignore storage failures (private mode etc.) */
  }
}

// ---------------------------------------------------------------------------
// The job
// ---------------------------------------------------------------------------

/**
 * Authorise and bill one List as the office. Every exit is silent: this runs
 * from a timer with no user waiting on it, and a refusal here is a legitimate
 * outcome (the presenter reset the demo, or an Admin session elsewhere already
 * authorised the List) rather than an error to report.
 *
 * WHEN is not this function's business: the caller below owns the toggle, so
 * there is one place that decides whether the office is playing, and reaching
 * here means it is.
 */
function playTheOffice(api: BoundAppStore, listId: string): void {
  try {
    const list = api.getState().schedule.lists[listId]
    // Gone (a demo reset reseeded the schedule) or already moved on.
    if (list === undefined || list.state !== 'SUBMITTED') return

    const authorised = authoriseList(api, OFFICE_SIMULATION_ACTOR, listId)
    if (!authorised.ok) return

    // `authoriseList` emits `listAuthorised` inside that call. Where the host
    // also wired `wireBillingRun` — the PWA entry does — the run and the Xero
    // handoff have already completed synchronously and the List is stamped
    // billed by the time we get here. The explicit run is the fallback for a
    // host that did not; `runBillingForList` refuses `alreadyBilled` anyway, so
    // the two paths together can never bill a List twice.
    if (isListBilled(api.getState().schedule.lists[listId] ?? list)) return
    const run = runBillingForList(api, listId)
    if (run.ok) handoffListCases(api, listId)
  } catch (error) {
    // A demo convenience must never take the app down. Same reasoning as
    // `emitAppEvent`'s listener guard: log it and swallow it.
    console.error('office simulation failed', listId, error)
  }
}

/**
 * Stores already wired, so a double `wireOfficeSimulation` cannot install two
 * subscriptions and schedule two runs per submit. Weak so a discarded test store
 * is not pinned in memory; the teardown removes its own entry, so a store can be
 * unwired and wired again.
 */
const WIRED = new WeakMap<BoundAppStore, () => void>()

/**
 * Subscribe the job to the store. Returns an unsubscribe, which also cancels
 * any run still waiting on its timer.
 *
 * The trigger is a STORE SUBSCRIPTION watching for the DRAFT -> SUBMITTED
 * transition, not an app event: `events.ts` emits only `listAuthorised` and
 * `dayAdvanced`, and there is no `listSubmitted` to hang off. Watching the
 * transition rather than scanning for SUBMITTED Lists is what keeps the seeded
 * review queue intact — the seed ships six Lists already SUBMITTED for the Admin
 * app's Review screen, and only a List submitted live, in this session, is the
 * office's to pick up.
 */
export function wireOfficeSimulation(api: BoundAppStore): () => void {
  const already = WIRED.get(api)
  if (already !== undefined) return already

  /** listId -> the armed timer handle (replaced on each re-arm), so teardown can cancel it. */
  const pending = new Map<string, number>()

  const unsubscribe = api.subscribe((state, previous) => {
    const lists = state.schedule.lists
    const before = previous.schedule.lists
    // `mutate()` re-uses the same `schedule` object whenever a recipe returns no
    // schedule patch, so audit-only, billing and Xero commits leave here at once.
    if (lists === before) return
    for (const [listId, list] of Object.entries(lists)) {
      // DRAFT -> SUBMITTED is the only legal way into SUBMITTED, so requiring
      // the previous state to be DRAFT is the transition, exactly.
      if (list.state !== 'SUBMITTED' || before[listId]?.state !== 'DRAFT') continue
      if (pending.has(listId)) continue
      // The visit RE-ARMS rather than gives up when the toggle is off, and that
      // is the whole reason it is a named function. Getting into `pending` needs
      // a live DRAFT -> SUBMITTED transition, which happens exactly once (a
      // SUBMITTED List only ever flows forward), so dropping the entry here
      // would strand that List for the rest of the session: the presenter who
      // switched the toggle off to answer "what really happens?" could never
      // switch it back on and carry the story forward. Waiting instead costs one
      // idle timer per List and keeps the seeded review queue untouched, because
      // nothing but a live submit ever enters the map. `teardown` cancels
      // whatever is armed, re-arm included.
      const visit = () => {
        if (!isOfficeSimulationEnabled()) {
          pending.set(listId, window.setTimeout(visit, OFFICE_SIM_DELAY_MS))
          return
        }
        pending.delete(listId)
        playTheOffice(api, listId)
      }
      pending.set(listId, window.setTimeout(visit, OFFICE_SIM_DELAY_MS))
    }
  })

  const teardown = () => {
    for (const handle of pending.values()) window.clearTimeout(handle)
    pending.clear()
    unsubscribe()
    WIRED.delete(api)
  }
  WIRED.set(api, teardown)
  return teardown
}

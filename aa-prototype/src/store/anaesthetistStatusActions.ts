/**
 * Making an anaesthetist inactive from a last day (build plan Phase 52;
 * US-12.1.6, US-13.5.3, US-01.1.1, US-04.1.2's Inactive anaesthetist, DM-05
 * to DM-07, D103). Office-only, each an audited change through `mutate()`:
 *
 * - `makeAnaesthetistInactive`: a last day (today or later) and a reason,
 *   refused while they hold a List after it; their Slots after it go.
 * - `clearLastDay`: before the day comes; their Slots after it come back, so
 *   nothing about them has changed.
 * - `makeAnaesthetistActive`: after the day; Slots from today, and the
 *   Contracts the rule disabled that the office ticks are enabled again.
 *
 * The rule itself lives in `domain/anaesthetistStatus.ts` (`isActiveOn`).
 * Contracts change only through `disableContract` and `enableContract`.
 */
import { format, parseISO } from 'date-fns'
import {
  INACTIVE_CONTRACTS_RULE_WHO,
  INACTIVE_REASON_LABELS,
  contractsToOfferBack,
  dayAfterISO,
  isActiveOn,
  listsAfterLastDay,
  ownContracts,
  statusOn,
} from '../domain/anaesthetistStatus'
import { ANAE, seriesPaintedCount } from '../domain/seed'
import type { Anaesthetist, InactiveReason, List } from '../domain/types'
import type { AppState, AppStoreApi } from './appStore'
import { disableContract, enableContract } from './contractActions'
import { drName } from './conflictReconcile'
import { onAppEvent } from './events'
import { mutate, ok, refuse, withChangeSet, type Actor, type MutationMeta, type Outcome } from './mutate'
import { anaesthetistCanvasDelta, applyGenerated } from './slotActions'
import { recordAnaesthetistSignIn } from './authDemoActions'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * The system as it disables an inactive anaesthetist's own Contracts.
 * Office-shaped, because `disableContract` is an office action, with
 * `source: 'system'` and a `who` that says what it is.
 */
export const INACTIVE_CONTRACTS_ACTOR: Actor = { who: INACTIVE_CONTRACTS_RULE_WHO, role: 'office', source: 'system' }

/** What a sign-in refusal after a last day says, in the audit and on the screen. */
export const NO_LONGER_ACTIVE = 'No longer active'

function dayLabel(dateISO: string): string {
  return format(parseISO(dateISO), 'd MMM')
}

function officeOnly(actor: Actor): Outcome | null {
  return actor.role === 'office' ? null : refuse('officeOnly', 'Only the AA office can make an anaesthetist active or inactive.')
}

type Delta = ReturnType<typeof anaesthetistCanvasDelta>

/** The canvas metas for a delta: `canvas.generate` for Slots gained, `canvas.trim` for Slots removed. */
function canvasMetas(id: string, delta: Delta, fromISO: string): MutationMeta[] {
  const metas: MutationMeta[] = []
  if (delta.add.slots.length > 0) {
    const series = seriesPaintedCount(delta.add)
    metas.push({
      entityType: 'canvas',
      entityId: id,
      action: 'canvas.generate',
      after: {
        slots: delta.add.slots.length,
        lists: delta.add.lists.length,
        fromISO: delta.add.slots[0]?.dateISO,
        toISO: delta.add.slots.at(-1)?.dateISO,
        ...(series > 0 ? { seriesSessions: series } : {}),
      },
      stampBookingId: null,
    })
  }
  if (delta.removeSlotIds.length > 0) {
    metas.push({ entityType: 'canvas', entityId: id, action: 'canvas.trim', after: { slots: delta.removeSlotIds.length, fromISO }, stampBookingId: null })
  }
  return metas
}

/** Write the anaesthetist and apply the canvas delta in one commit. */
function commit(api: AppStoreApi, actor: Actor, next: Anaesthetist, delta: Delta, metas: MutationMeta[]): void {
  mutate(api, actor, metas, (s) => {
    const applied = applyGenerated(s, delta.add, actor.who, metas)
    let schedule = applied.schedule
    if (delta.removeSlotIds.length > 0) {
      const slots = { ...schedule.slots }
      for (const id of delta.removeSlotIds) delete slots[id]
      schedule = { ...schedule, slots }
    }
    return {
      masters: { ...s.masters, anaesthetists: { ...s.masters.anaesthetists, [next.registrationNumber]: next } },
      schedule,
      counters: applied.counters,
    }
  })
}

/** The refusal's details: the Lists after the last day, for the sheet to list and link. */
export interface ListsAfterLastDayDetails {
  lists: List[]
}

/**
 * Make an anaesthetist inactive from `lastDayISO` (today or later, not before
 * their start date) with a reason. Refused (`listsAfterLastDay`, its details
 * the Lists) while they hold a List after the day: the office reassigns them
 * first. On success one `anaesthetist.makeInactive` change, with the
 * `canvas.trim` of their Slots after the day. A new last day clears any
 * earlier "active again" day; the audit keeps the earlier spell. To change a
 * last day the office clears it and sets it again.
 */
export function makeAnaesthetistInactive(
  api: AppStoreApi,
  actor: Actor,
  anaesthetistId: string,
  lastDayISO: string,
  reason: InactiveReason,
): Outcome {
  const office = officeOnly(actor)
  if (office !== null) return office
  const state = api.getState()
  const a = state.masters.anaesthetists[anaesthetistId]
  if (a === undefined) return refuse('notFound', 'Anaesthetist not found.')
  if (!(reason in INACTIVE_REASON_LABELS)) return refuse('noReason', 'Choose a reason.')
  if (!ISO_DATE.test(lastDayISO)) return refuse('invalidLastDay', 'Choose a last day.')
  const todayISO = state.clock.todayISO
  const status = statusOn(a, todayISO)
  if (status.kind === 'leaving') return refuse('alreadyLeaving', `${drName(state.masters, anaesthetistId)} already has a last day. Clear it first.`)
  if (status.kind === 'inactive') return refuse('alreadyInactive', `${drName(state.masters, anaesthetistId)} is already inactive.`)
  if (lastDayISO < todayISO) return refuse('lastDayPassed', 'Choose today or a later day.')
  if (lastDayISO < a.startDateISO) return refuse('beforeStart', `Choose a day on or after their start date, ${dayLabel(a.startDateISO)}.`)

  const held = listsAfterLastDay(Object.values(state.schedule.lists), anaesthetistId, lastDayISO)
  const next: Anaesthetist = { ...a, lastDayISO, inactiveReason: reason, activeAgainISO: null }
  const fromISO = dayAfterISO(lastDayISO)
  const delta = anaesthetistCanvasDelta(state, next, fromISO)
  // A List in a Slot after the day refuses too (the canvas never deletes a List).
  const lists = [...new Map([...held, ...delta.listsInRemoved].map((l) => [l.id, l])).values()].sort(
    (x, y) => x.dateISO.localeCompare(y.dateISO) || x.session.localeCompare(y.session),
  )
  if (lists.length > 0) {
    const n = lists.length
    const details: ListsAfterLastDayDetails = { lists }
    return refuse(
      'listsAfterLastDay',
      `${drName(state.masters, anaesthetistId)} has ${n} ${n === 1 ? 'List' : 'Lists'} after ${dayLabel(lastDayISO)}. Reassign ${n === 1 ? 'it' : 'them'} first.`,
      details,
    )
  }
  const metas: MutationMeta[] = [
    {
      entityType: 'anaesthetist',
      entityId: anaesthetistId,
      action: 'anaesthetist.makeInactive',
      before: { lastDayISO: '' },
      after: { lastDayISO, reason: INACTIVE_REASON_LABELS[reason] },
      stampBookingId: null,
    },
    ...canvasMetas(anaesthetistId, delta, fromISO),
  ]
  commit(api, actor, next, delta, metas)
  return ok(undefined)
}

/**
 * Clear a last day before it comes (today included): their Slots after it
 * come back, so nothing about them has changed. `anaesthetist.clearLastDay`.
 */
export function clearLastDay(api: AppStoreApi, actor: Actor, anaesthetistId: string): Outcome {
  const office = officeOnly(actor)
  if (office !== null) return office
  const state = api.getState()
  const a = state.masters.anaesthetists[anaesthetistId]
  if (a === undefined) return refuse('notFound', 'Anaesthetist not found.')
  const status = statusOn(a, state.clock.todayISO)
  if (status.kind === 'active') return refuse('noLastDay', `${drName(state.masters, anaesthetistId)} has no last day to clear.`)
  if (status.kind === 'inactive') return refuse('lastDayPassed', 'The last day has passed. Make them active again instead.')
  const next: Anaesthetist = { ...a, lastDayISO: null, inactiveReason: null, activeAgainISO: null }
  const fromISO = dayAfterISO(status.lastDayISO)
  const delta = anaesthetistCanvasDelta(state, next, fromISO)
  const metas: MutationMeta[] = [
    {
      entityType: 'anaesthetist',
      entityId: anaesthetistId,
      action: 'anaesthetist.clearLastDay',
      before: { lastDayISO: status.lastDayISO, reason: status.reason !== null ? INACTIVE_REASON_LABELS[status.reason] : '' },
      after: { lastDayISO: '' },
      stampBookingId: null,
    },
    ...canvasMetas(anaesthetistId, delta, fromISO),
  ]
  commit(api, actor, next, delta, metas)
  return ok(undefined)
}

/**
 * Make an inactive anaesthetist active again from today: Slots from today
 * (`activeAgainISO`), and each of `enableContractIds` that the rule disabled
 * (`contractsToOfferBack`) enabled through `enableContract`. One change set.
 * Any other id is refused: only the rule's disables are offered back.
 */
export function makeAnaesthetistActive(
  api: AppStoreApi,
  actor: Actor,
  anaesthetistId: string,
  enableContractIds: readonly string[] = [],
): Outcome {
  const office = officeOnly(actor)
  if (office !== null) return office
  const state = api.getState()
  const a = state.masters.anaesthetists[anaesthetistId]
  if (a === undefined) return refuse('notFound', 'Anaesthetist not found.')
  const todayISO = state.clock.todayISO
  const status = statusOn(a, todayISO)
  if (status.kind !== 'inactive') return refuse('notInactive', `${drName(state.masters, anaesthetistId)} is not inactive.`)
  const offered = new Set(offerBackFor(state, anaesthetistId).map((c) => c.id))
  const stray = enableContractIds.find((id) => !offered.has(id))
  if (stray !== undefined) return refuse('notOffered', 'Only the Contracts disabled with them can be made active again here.')

  const next: Anaesthetist = { ...a, activeAgainISO: todayISO }
  const delta = anaesthetistCanvasDelta(state, next, todayISO)
  const metas: MutationMeta[] = [
    {
      entityType: 'anaesthetist',
      entityId: anaesthetistId,
      action: 'anaesthetist.makeActive',
      before: { lastDayISO: status.lastDayISO },
      after: { activeFromISO: todayISO, contracts: enableContractIds.length },
      stampBookingId: null,
    },
    ...canvasMetas(anaesthetistId, delta, todayISO),
  ]
  return withChangeSet(api, 'save', () => {
    commit(api, actor, next, delta, metas)
    for (const id of enableContractIds) {
      const enabled = enableContract(api, actor, id)
      if (!enabled.ok) return enabled
    }
    return ok(undefined)
  })
}

/** The Contracts to offer back to an inactive anaesthetist (empty while they have no last day). */
export function offerBackFor(state: Pick<AppState, 'masters' | 'audit'>, anaesthetistId: string) {
  const a = state.masters.anaesthetists[anaesthetistId]
  if (a === undefined || a.lastDayISO === null) return []
  return contractsToOfferBack(Object.values(state.masters.contracts), state.audit, anaesthetistId, a.lastDayISO)
}

/** The own Contracts that will be disabled after the last day (Active today), for the make-inactive sheet. */
export function ownActiveContracts(state: Pick<AppState, 'masters'>, anaesthetistId: string) {
  return ownContracts(Object.values(state.masters.contracts), state.masters.parties, anaesthetistId).filter((c) => c.status === 'active')
}

// ---------------------------------------------------------------------------
// The Contract rule (DM-06): run when the demo clock passes a last day
// ---------------------------------------------------------------------------

/**
 * Disable, as `INACTIVE_CONTRACTS_ACTOR`, every Active own Contract of each
 * anaesthetist whose last day has passed (and who has not been made active
 * again), one audited `contract.disable` each through `disableContract`. A
 * Contract the rule already disabled this spell (the office may have enabled
 * it by hand since) is left alone, so a second run adds nothing.
 */
export function runInactiveContractsJob(api: AppStoreApi): { disabled: string[] } {
  const state = api.getState()
  const todayISO = state.clock.todayISO
  const disabled: string[] = []
  const ruleDisabledOn = new Map<string, string>()
  for (const e of state.audit) {
    if (e.entityType === 'contract' && e.action === 'contract.disable' && e.who === INACTIVE_CONTRACTS_RULE_WHO) ruleDisabledOn.set(e.entityId, e.atISO.slice(0, 10))
  }
  for (const a of Object.values(state.masters.anaesthetists)) {
    if (a.lastDayISO === null || a.activeAgainISO !== null || todayISO <= a.lastDayISO) continue
    for (const c of ownActiveContracts(api.getState(), a.registrationNumber)) {
      const already = ruleDisabledOn.get(c.id)
      if (already !== undefined && already > a.lastDayISO) continue
      if (disableContract(api, INACTIVE_CONTRACTS_ACTOR, c.id).ok) disabled.push(c.id)
    }
  }
  return { disabled }
}

/** Subscribe the Contract rule to `dayAdvanced` (wired in `main.tsx` after the archive job). */
export function wireInactiveContracts(api: AppStoreApi): () => void {
  return onAppEvent((event) => {
    if (event.type === 'dayAdvanced') runInactiveContractsJob(api)
  })
}

// ---------------------------------------------------------------------------
// Sign-in (DM-07, US-13.5.3)
// ---------------------------------------------------------------------------

/** "No longer active" once the anaesthetist's last day has passed (and they are not active again), else null. */
export function signInRefusal(state: Pick<AppState, 'masters' | 'clock'>, anaesthetistId: string): string | null {
  const a = state.masters.anaesthetists[anaesthetistId]
  if (a === undefined) return null
  return statusOn(a, state.clock.todayISO).kind === 'inactive' ? NO_LONGER_ACTIVE : null
}

/**
 * Who the "try signing in after the last day" trigger tries: the anaesthetist
 * whose last day passed most recently, never Dr Souter (the demo account).
 */
export function inactiveSignInCandidate(state: Pick<AppState, 'masters' | 'clock'>): Anaesthetist | undefined {
  const todayISO = state.clock.todayISO
  return Object.values(state.masters.anaesthetists)
    .filter((a) => a.registrationNumber !== ANAE.souter && statusOn(a, todayISO).kind === 'inactive')
    .sort((x, y) => (y.lastDayISO ?? '').localeCompare(x.lastDayISO ?? '') || x.registrationNumber.localeCompare(y.registrationNumber))[0]
}

/**
 * The sign-in screen's refusal: the newest `account` row, when it is a sign-in
 * refused as no longer active (a later sign-in or sign-out hides it).
 */
export function latestNoLongerActiveRefusal(state: Pick<AppState, 'audit'>): { anaesthetistId: string; who: string; atISO: string } | null {
  for (let i = state.audit.length - 1; i >= 0; i--) {
    const e = state.audit[i]!
    if (e.entityType !== 'account') continue
    const reason = (e.after as { reason?: unknown } | undefined)?.reason
    return e.action === 'auth.signInFailed' && reason === NO_LONGER_ACTIVE ? { anaesthetistId: e.entityId, who: e.who, atISO: e.atISO } : null
  }
  return null
}

/**
 * The "Demo: try signing in after the last day" trigger: the sign-in of
 * `inactiveSignInCandidate`, refused and audited as no longer active. Writes
 * nothing to anyone's record; never Dr Souter.
 */
export function tryInactiveSignIn(api: AppStoreApi): Outcome<{ name: string }> {
  const who = inactiveSignInCandidate(api.getState())
  if (who === undefined) return refuse('noneInactive', "No anaesthetist's last day has passed.")
  recordAnaesthetistSignIn(api, 'refused', { anaesthetistId: who.registrationNumber, reason: NO_LONGER_ACTIVE })
  return ok({ name: who.name })
}

/** True when the anaesthetist works on the demo clock's today. */
export function isActiveToday(state: Pick<AppState, 'masters' | 'clock'>, anaesthetistId: string): boolean {
  const a = state.masters.anaesthetists[anaesthetistId]
  return a !== undefined && isActiveOn(a, state.clock.todayISO)
}

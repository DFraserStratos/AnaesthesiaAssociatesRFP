/**
 * An anaesthetist moves her own List (catch-up Phase 32; US-01.4.3, US-01.4.5,
 * US-01.5.5, US-13.8.2; D7, D14, D15, D44, D20 as answered).
 *
 * - AT ONCE (D7): each action is one `mutate()` commit. There is no request
 *   record, no pending state, no acceptance and no office confirmation.
 * - ONE MOVE, ONE PLACE: all three actions run `ownMoveCore`, which runs Phase
 *   28's `moveListToSlotCore` for a hand-on or Phase 31's `detachListToDraft`
 *   for a return, writes exactly one `list.ownerMove` event (no `list.reassign`)
 *   and posts exactly one notification (`postNotification`) in the same commit.
 * - OWNER ONLY, ENFORCED HERE: only the List's anaesthetist, only an ACTIVE List
 *   dated today or later (`ownMoveRefusal`). The office keeps its own Reassign.
 * - NO PREFERENCE (US-01.4.5, US-13.6.3, D44): nothing here reads, checks or
 *   logs a pairing preference or a tier, and nothing imports the office's
 *   private slice or the pairing helper. A move to a colleague with a
 *   not-preferred pairing is exactly like any other move.
 * - NO MONEY (US-06.3.5 AC2, US-06.5.4, D20, an honour system): no prepayment
 *   re-check, no invoice generated, withdrawn, sent or amended, no billing
 *   case, ledger or Xero write.
 */

import { isClosedKey, isOpenForBooking, statusFor } from '../domain/slotStatus'
import { ownMoveRefusal, VACATED_SESSION_DEFAULT } from '../domain/listMoves'
import type { AssignedList, OwnMoveCause, OwnMoveRoute, SlotStatusKey } from '../domain/types'
import { clockISO, mutate, ok, refuse, type Actor, type DomainPatch, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { detachListToDraft, moveListToSlotCore, vacateSlot } from './slotActions'
import { replacedStatusRefusal, statusRefusal } from './availabilityActions'
import { listInSlot, moveInputOf } from './selectors'
import { postNotification } from './notifications'

export interface OwnMoveResult {
  listId: string
  route: OwnMoveRoute
  notificationId: string
  /** Route `colleague` only. */
  toAnaesthetistId?: string
  /** What the vacated session became. */
  vacatedStatus: SlotStatusKey
}

interface OwnMoveCoreOptions {
  toSlotId?: string
  vacatedStatus: SlotStatusKey
  cause: OwnMoveCause
  message?: string
}

/** Anaesthetist actors only: the office has Reassign and its Draft List tools; a feed never moves a List. */
function actorRefusal<T>(actor: Actor): Outcome<T> | null {
  if (actor.role !== 'anaesthetist' || actor.source === 'integration' || actor.anaesthetistId === undefined) {
    return refuse('ownerOnly', "Only the List's anaesthetist moves it this way. The office uses Reassign.")
  }
  return null
}

/** The vacated status an anaesthetist may choose: in use and one she may set. */
function vacatedRefusal<T>(state: Pick<AppState, 'masters'>, key: SlotStatusKey): Outcome<T> | null {
  const status = statusFor(state.masters.slotStatuses, key)
  if (status === undefined || status.retiredAtISO !== undefined || !status.anaesthetistCanSet) {
    return refuse('invalidVacatedStatus', 'Choose what your session becomes.')
  }
  return null
}

/**
 * The vacated session's status on a plain move: her choice (Free by default,
 * OQ-84). A session already closed (say the office recorded her sick on it)
 * stays as it is: a move never reopens it.
 */
function effectiveVacated(state: Pick<AppState, 'schedule' | 'masters'>, list: AssignedList, chosen: SlotStatusKey | undefined): SlotStatusKey {
  const from = state.schedule.slots[list.slotId]
  if (from !== undefined && !isOpenForBooking(statusFor(state.masters.slotStatuses, from.status))) return from.status
  return chosen ?? VACATED_SESSION_DEFAULT
}

/**
 * The one own-move core, draft level: the move itself, the vacated session,
 * one `list.ownerMove` meta and the pool post. Returns the recipe's patch and
 * metas; the caller commits them in its single `mutate()`.
 */
function ownMoveCore(
  state: AppState,
  actor: Actor,
  listId: string,
  route: OwnMoveRoute,
  options: OwnMoveCoreOptions,
): Outcome<{ patch: DomainPatch; metas: MutationMeta[]; result: OwnMoveResult }> {
  const list = state.schedule.lists[listId]
  if (list === undefined || list.state === 'DRAFT') return refuse('notFound', 'List not found.')
  const atISO = clockISO(state.clock)
  const from = state.schedule.slots[list.slotId]
  if (from === undefined) return refuse('notFound', "This List's session is outside the schedule.")

  let schedule: AppState['schedule']
  let vacatedMeta: MutationMeta | undefined
  let toAnaesthetistId: string | undefined
  let after: Record<string, unknown>
  if (route === 'colleague') {
    if (options.toSlotId === undefined) return refuse('noTarget', 'Choose a colleague.')
    const core = moveListToSlotCore(state, listId, options.toSlotId, { vacatedStatus: options.vacatedStatus, requireOpen: true })
    if (!core.ok) return core
    schedule = core.value.schedule
    vacatedMeta = core.value.vacatedMeta
    toAnaesthetistId = core.value.to.anaesthetistId
    after = { slotId: core.value.to.id, anaesthetistId: toAnaesthetistId, state: 'ACTIVE' }
  } else {
    const detached = detachListToDraft(state.schedule, listId, {
      origin: options.cause === 'unavailable' ? 'unavailableReturn' : 'movedToOffice',
      by: actor.who,
      atISO,
      fromAnaesthetistId: list.anaesthetistId,
    })
    if (!detached.ok) return detached
    const vacated = vacateSlot(detached.value.schedule, { ...(detached.value.schedule.slots[from.id] ?? from), status: from.status }, options.vacatedStatus)
    schedule = {
      ...detached.value.schedule,
      slots: { ...detached.value.schedule.slots, [from.id]: vacated.slot },
      ...(vacated.availabilitySeries !== undefined ? { availabilitySeries: vacated.availabilitySeries } : {}),
    }
    vacatedMeta = vacated.meta
    after = { slotId: null, anaesthetistId: null, state: 'DRAFT' }
  }

  // The pool post, inside the same commit; the record is a snapshot of the List as it moved.
  const post = postNotification(state, {
    atISO,
    byActor: actor.who,
    listId,
    route,
    cause: options.cause,
    fromAnaesthetistId: list.anaesthetistId,
    ...(toAnaesthetistId !== undefined ? { toAnaesthetistId } : {}),
    dateISO: list.dateISO,
    session: list.session,
    hospitalId: list.hospitalId,
    surgeonId: list.surgeonId,
    ...(options.message !== undefined ? { message: options.message } : {}),
  })

  // The one from/to/by/when event of the move. PHASE 41 SEAM: the payable's
  // payee repoint for a moved prepaid Booking (OQ-80's default, D38) hangs here.
  const ownerMove: MutationMeta = {
    entityType: 'list',
    entityId: listId,
    action: 'list.ownerMove',
    before: { slotId: from.id, anaesthetistId: list.anaesthetistId, state: 'ACTIVE' },
    after: { ...after, route, cause: options.cause, notificationId: post.id },
    stampBookingId: null,
  }
  return ok({
    patch: { schedule, notifications: post.notifications, counters: post.counters },
    metas: [ownerMove, ...(vacatedMeta !== undefined ? [vacatedMeta] : [])],
    result: {
      listId,
      route,
      notificationId: post.id,
      ...(toAnaesthetistId !== undefined ? { toAnaesthetistId } : {}),
      vacatedStatus: options.vacatedStatus,
    },
  })
}

function commit(api: AppStoreApi, actor: Actor, listId: string, route: OwnMoveRoute, options: OwnMoveCoreOptions): Outcome<OwnMoveResult> {
  const preflight = ownMoveCore(api.getState(), actor, listId, route, options)
  if (!preflight.ok) return preflight
  let result = preflight.value.result
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const core = ownMoveCore(s, actor, listId, route, options)
    if (!core.ok) throw new Error(`ownMoveCore: ${core.message}`)
    metas.push(...core.value.metas)
    result = core.value.result
    return core.value.patch
  })
  return ok(result)
}

export interface OwnMoveInput {
  /** What her session becomes (OQ-84: Free by default). Ignored when the session is already closed. */
  vacatedStatus?: SlotStatusKey
  /** A message for the office and the colleague, kept on the notification. */
  message?: string
}

/** A plain move's shared checks: her own movable List, and a vacated status she may choose. */
function plainMovePreflight(api: AppStoreApi, actor: Actor, listId: string, input: OwnMoveInput): Outcome<{ vacatedStatus: SlotStatusKey }> {
  const who = actorRefusal<{ vacatedStatus: SlotStatusKey }>(actor)
  if (who !== null) return who
  const state = api.getState()
  const refusal = ownMoveRefusal(moveInputOf(state), listId, actor.anaesthetistId, state.clock.todayISO)
  if (refusal !== null) return refuse(refusal.code, refusal.message)
  const list = state.schedule.lists[listId] as AssignedList
  const vacatedStatus = effectiveVacated(state, list, input.vacatedStatus)
  // Keeping the session's own status (a closed one a move never reopens) needs no choice.
  const bad = vacatedStatus === state.schedule.slots[list.slotId]?.status ? null : vacatedRefusal<{ vacatedStatus: SlotStatusKey }>(state, vacatedStatus)
  if (bad !== null) return bad
  return ok({ vacatedStatus })
}

/**
 * Return one of her own Lists to the office (US-01.4.3, first bullet; also how
 * she withdraws; US-13.8.2 "Returned to the office"): it goes back from ACTIVE
 * to DRAFT as a Draft List with its id, hospital, surgeon, Bookings, notes and
 * history (Phase 31's conversion, origin `movedToOffice`), for the office to
 * assign. Her session takes `vacatedStatus`.
 */
export function moveListToOffice(api: AppStoreApi, actor: Actor, listId: string, input: OwnMoveInput = {}): Outcome<OwnMoveResult> {
  const pre = plainMovePreflight(api, actor, listId, input)
  if (!pre.ok) return pre
  const { vacatedStatus } = pre.value
  return commit(api, actor, listId, 'office', { vacatedStatus, cause: 'move', ...(input.message !== undefined ? { message: input.message } : {}) })
}

/**
 * Hand one of her own Lists on to a colleague, into the colleague's free
 * session that day (US-01.4.3, second bullet; US-01.4.5; US-13.8.2 "Moved to a
 * colleague"). The session must pass the one receive rule with `requireOpen`
 * (so it is one of `pushTargets`; `targetNotOpen` otherwise). The List moves
 * intact and stays ACTIVE, exactly as the office's reassignment moves it.
 */
export function pushListToSlot(api: AppStoreApi, actor: Actor, listId: string, toSlotId: string, input: OwnMoveInput = {}): Outcome<OwnMoveResult> {
  const pre = plainMovePreflight(api, actor, listId, input)
  if (!pre.ok) return pre
  const { vacatedStatus } = pre.value
  return commit(api, actor, listId, 'colleague', { toSlotId, vacatedStatus, cause: 'move', ...(input.message !== undefined ? { message: input.message } : {}) })
}

export type UnavailableChoice = { route: 'office' } | { route: 'colleague'; toSlotId: string }

/**
 * Mark a session she holds a List in as not available, and say where the List
 * goes (US-01.5.5; RV-30): in ONE commit the List leaves first (to the office
 * as a Draft List, origin `unavailableReturn`, or into a colleague's free
 * session) and the session takes the closed status, so a List is never left
 * with an anaesthetist who will not be there. The pool post and "no preference
 * warning" apply as on a plain move (US-01.5.5's note; an assumed reading).
 * One List per call: a range or series resolves List by List.
 */
export function markUnavailableAndMoveList(
  api: AppStoreApi,
  actor: Actor,
  slotId: string,
  statusKey: SlotStatusKey,
  choice: UnavailableChoice,
  message?: string,
): Outcome<OwnMoveResult> {
  const who = actorRefusal<OwnMoveResult>(actor)
  if (who !== null) return who
  const state = api.getState()
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return refuse('notFound', 'Session not found.')
  if (slot.anaesthetistId !== actor.anaesthetistId) return refuse('notOwnList', 'You can only change your own sessions.')
  // The availability actions' own status guards, so the codes and words agree.
  const bad = statusRefusal<OwnMoveResult>(state.masters.slotStatuses, actor, statusKey) ?? replacedStatusRefusal<OwnMoveResult>(state.masters.slotStatuses, actor, [slot])
  if (bad !== null) return bad
  if (!isClosedKey(state.masters.slotStatuses, statusKey)) {
    return refuse('notClosedStatus', `${statusFor(state.masters.slotStatuses, statusKey)?.label ?? 'That status'} keeps the session open. Choose a status that marks you not available.`)
  }
  const list = listInSlot(state, slotId)
  if (list === undefined) return refuse('noList', 'This session has no List to move.')
  const refusal = ownMoveRefusal(moveInputOf(state), list.id, actor.anaesthetistId, state.clock.todayISO)
  if (refusal !== null) return refuse(refusal.code, refusal.message)
  return commit(api, actor, list.id, choice.route, {
    ...(choice.route === 'colleague' ? { toSlotId: choice.toSlotId } : {}),
    vacatedStatus: statusKey,
    cause: 'unavailable',
    ...(message !== undefined ? { message } : {}),
  })
}

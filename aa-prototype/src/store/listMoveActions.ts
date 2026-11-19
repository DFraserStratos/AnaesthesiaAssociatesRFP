/**
 * Moving a List out of its session: an anaesthetist moves her own List
 * (catch-up Phase 32; US-01.4.3, US-01.4.5, US-01.5.5, US-13.8.2; D7, D14, D15,
 * D44, D20 as answered), and anyone, the office included, marks a session that
 * holds a List not available (catch-up Phase 32b; US-01.5.5, US-01.5.4; D59).
 *
 * - AT ONCE (D7): each action is one `mutate()` commit. There is no request
 *   record, no pending state, no acceptance and no office confirmation.
 * - ONE MOVE, ONE PLACE: every action runs `moveOutCore`, which runs Phase
 *   28's `moveListToSlotCore` for a hand-on or Phase 31's `detachListToDraft`
 *   for a return, then gives the vacated session the mover's choice (D60).
 * - THE ANAESTHETIST'S MOVES: only the List's anaesthetist, only an ACTIVE List
 *   dated today or later (`ownMoveRefusal`); one `list.ownerMove` event and one
 *   pool notice (`postNotification`) in the same commit. Nothing on her path
 *   reads, checks or logs a pairing preference or a tier (US-01.4.5, D44, D54).
 * - THE OFFICE MARKING A SESSION NOT AVAILABLE (D59): a sickness phoned in
 *   never leaves the List in place. The office returns it (a Draft List,
 *   origin `unavailableReturn`) or hands it to an open colleague, with Phase
 *   17's acknowledgement for a not-preferred pairing (asked of `slotActions.ts`,
 *   so this file never names the office's private slice). It posts no notice:
 *   the pool is the anaesthetists' moves and alerts. A SUBMITTED List can only
 *   be handed on; an AUTHORISED List refuses.
 * - NO MONEY (US-06.3.5 AC2, US-06.5.4, D20, an honour system): no prepayment
 *   re-check, no invoice generated, withdrawn, sent or amended, no billing
 *   case, ledger or Xero write.
 */

import { isClosedKey, statusFor } from '../domain/slotStatus'
import { defaultVacated, ownMoveRefusal, vacatedChoices } from '../domain/listMoves'
import { bookingMoveRefusal, bookingPlacement } from '../domain/bookingMoves'
import { surnameCommaInitial } from '../domain/names'
import type { AssignedList, OwnMoveCause, OwnMoveRoute, SlotStatusKey } from '../domain/types'
import { clockISO, mutate, ok, refuse, type Actor, type DomainPatch, type MutationMeta, type Outcome, withChangeSet } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { detachListToDraft, moveListToSlotCore, officePairingAckMeta, placeListOnSlot, vacatedStatusRefusal, vacateSlot } from './slotActions'
import { reassignBookingCore } from './lifecycle'
import { replacedStatusRefusal, statusRefusal } from './availabilityActions'
import { bookingMoveInputOf, listInSlot, moveInputOf } from './selectors'
import { postNotification } from './notifications'
import { originForNewList } from '../domain/lists/listOrigin'

export interface OwnMoveResult {
  listId: string
  route: OwnMoveRoute
  /** The pool notice (an anaesthetist's move only; the office posts none). */
  notificationId?: string
  /** Route `colleague` only. */
  toAnaesthetistId?: string
  /** What the vacated session became. */
  vacatedStatus: SlotStatusKey
}

interface MoveOutOptions {
  toSlotId?: string
  vacatedStatus: SlotStatusKey
  cause: OwnMoveCause
  message?: string
  /** The note the session takes with its new status (the mark-unavailable path). */
  note?: string
}

const isAnaesthetistActor = (actor: Actor): boolean => actor.role === 'anaesthetist' && actor.source !== 'integration' && actor.anaesthetistId !== undefined
const isOfficeActor = (actor: Actor): boolean => actor.role === 'office' && actor.source !== 'integration'

/** Anaesthetist actors only: the office has Reassign and its Draft List tools; a feed never moves a List. */
function actorRefusal<T>(actor: Actor): Outcome<T> | null {
  if (!isAnaesthetistActor(actor)) return refuse('ownerOnly', "Only the List's anaesthetist moves it this way. The office uses Reassign.")
  return null
}

/**
 * The one move-out core, draft level: the move itself, the vacated session
 * (with its note on the mark-unavailable path), and the actor's events: for an
 * anaesthetist one `list.ownerMove` and the pool post; for the office the
 * `draftList.detach` or `list.reassign` event (plus 17's acknowledgement) and
 * no notice. Returns the recipe's patch and metas; the caller commits them in
 * its single `mutate()`.
 */
function moveOutCore(
  state: AppState,
  actor: Actor,
  listId: string,
  route: OwnMoveRoute,
  options: MoveOutOptions,
): Outcome<{ patch: DomainPatch; metas: MutationMeta[]; result: OwnMoveResult }> {
  const list = state.schedule.lists[listId]
  if (list === undefined || list.state === 'DRAFT') return refuse('notFound', 'List not found.')
  const atISO = clockISO(state.clock)
  const from = state.schedule.slots[list.slotId]
  if (from === undefined) return refuse('notFound', "This List's session is outside the schedule.")
  const office = !isAnaesthetistActor(actor)

  let schedule: AppState['schedule']
  let toAnaesthetistId: string | undefined
  let after: Record<string, unknown>
  const metas: MutationMeta[] = []
  if (route === 'colleague') {
    if (options.toSlotId === undefined) return refuse('noTarget', 'Choose a colleague.')
    const core = moveListToSlotCore(state, listId, options.toSlotId, { vacatedStatus: options.vacatedStatus })
    if (!core.ok) return core
    schedule = core.value.schedule
    toAnaesthetistId = core.value.to.anaesthetistId
    after = { slotId: core.value.to.id, anaesthetistId: toAnaesthetistId, state: list.state }
    if (office) {
      metas.push({
        entityType: 'list',
        entityId: listId,
        action: 'list.reassign',
        before: { slotId: from.id, anaesthetistId: from.anaesthetistId },
        after: { slotId: core.value.to.id, anaesthetistId: toAnaesthetistId, cause: options.cause },
        stampBookingId: null,
      })
      const ack = officePairingAckMeta(state, listId, toAnaesthetistId)
      if (ack !== null) metas.push(ack)
    }
  } else {
    const detached = detachListToDraft(state.schedule, listId, {
      origin: options.cause === 'unavailable' ? 'unavailableReturn' : 'movedToOffice',
      by: actor.who,
      atISO,
      fromAnaesthetistId: list.anaesthetistId,
    })
    if (!detached.ok) return detached
    schedule = detached.value.schedule
    after = { slotId: null, anaesthetistId: null, state: 'DRAFT' }
    if (office) metas.push(detached.value.meta)
  }

  // The vacated session: the mover's choice (D60), with the note when it is being marked.
  const vacatedFrom = { ...(schedule.slots[from.id] ?? from), status: from.status }
  const vacated = vacateSlot(schedule, vacatedFrom, options.vacatedStatus, options.note)
  schedule = {
    ...schedule,
    slots: { ...schedule.slots, [from.id]: vacated.slot },
    ...(vacated.availabilitySeries !== undefined ? { availabilitySeries: vacated.availabilitySeries } : {}),
  }

  if (office) {
    if (vacated.meta !== undefined) metas.push(vacated.meta)
    return ok({
      patch: { schedule },
      metas,
      result: { listId, route, ...(toAnaesthetistId !== undefined ? { toAnaesthetistId } : {}), vacatedStatus: options.vacatedStatus },
    })
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

  // The one from/to/by/when event of the move. Nothing hangs on it for money:
  // a prepaid Booking's payable is the AA Holding account, so a move changes
  // nothing in the ledger and nothing is repointed (D38, OQ-80; Phase 32a).
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
    metas: [ownerMove, ...(vacated.meta !== undefined ? [vacated.meta] : [])],
    result: {
      listId,
      route,
      notificationId: post.id,
      ...(toAnaesthetistId !== undefined ? { toAnaesthetistId } : {}),
      vacatedStatus: options.vacatedStatus,
    },
  })
}

type MoveCore<R> = (state: AppState) => Outcome<{ patch: DomainPatch; metas: MutationMeta[]; result: R }>

/** Run a move core as a preflight (refusals leave the store untouched), then once inside one `mutate()` commit. */
function commitCore<R>(api: AppStoreApi, actor: Actor, label: string, core: MoveCore<R>): Outcome<R> {
  const preflight = core(api.getState())
  if (!preflight.ok) return preflight
  let result = preflight.value.result
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const run = core(s)
    if (!run.ok) throw new Error(`${label}: ${run.message}`)
    metas.push(...run.value.metas)
    result = run.value.result
    return run.value.patch
  })
  return ok(result)
}

function commit(api: AppStoreApi, actor: Actor, listId: string, route: OwnMoveRoute, options: MoveOutOptions): Outcome<OwnMoveResult> {
  return commitCore(api, actor, 'moveOutCore', (s) => moveOutCore(s, actor, listId, route, options))
}

export interface OwnMoveInput {
  /** What her session becomes (D60): Free unless she chooses Unavailable. */
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
  const vacatedStatus = input.vacatedStatus ?? defaultVacated()
  const bad = vacatedStatusRefusal<{ vacatedStatus: SlotStatusKey }>(state.masters.slotStatuses, actor, vacatedStatus, vacatedChoices())
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
function moveListToOfficeUnscoped(api: AppStoreApi, actor: Actor, listId: string, input: OwnMoveInput = {}): Outcome<OwnMoveResult> {
  const pre = plainMovePreflight(api, actor, listId, input)
  if (!pre.ok) return pre
  const { vacatedStatus } = pre.value
  return commit(api, actor, listId, 'office', { vacatedStatus, cause: 'move', ...(input.message !== undefined ? { message: input.message } : {}) })
}

/**
 * Hand one of her own Lists on to a colleague, into the colleague's free
 * session that day (US-01.4.3, second bullet; US-01.4.5; US-13.8.2 "Moved to a
 * colleague"). The session must pass the one receive rule (so it is one of
 * `pushTargets`; `targetNotOpen` otherwise). The List moves intact and stays
 * ACTIVE, exactly as the office's reassignment moves it.
 */
function pushListToSlotUnscoped(api: AppStoreApi, actor: Actor, listId: string, toSlotId: string, input: OwnMoveInput = {}): Outcome<OwnMoveResult> {
  const pre = plainMovePreflight(api, actor, listId, input)
  if (!pre.ok) return pre
  const { vacatedStatus } = pre.value
  return commit(api, actor, listId, 'colleague', { toSlotId, vacatedStatus, cause: 'move', ...(input.message !== undefined ? { message: input.message } : {}) })
}

export type UnavailableChoice = { route: 'office' } | { route: 'colleague'; toSlotId: string }

export interface MarkUnavailableOptions {
  /**
   * What the session becomes once its List has left (D60): the status being
   * set by default, or Free (`vacatedChoices(statusKey)`).
   */
  vacatedStatus?: SlotStatusKey
  /** The session's note, kept with its status ("Unwell, short notice"). */
  note?: string
  /** An anaesthetist's message for the office and the colleague, kept on the notice. */
  message?: string
}

/**
 * Mark a session that holds a List not available, and say where the List goes
 * (US-01.5.5, US-01.5.4; D59; RV-25, RV-30): in ONE commit the List leaves
 * first (to the office as a Draft List, origin `unavailableReturn`, or into a
 * colleague's open session) and the session takes the closed status (or Free,
 * if the mover chose it), so a List is never left with an anaesthetist who
 * will not be there. Unavailability is never a conflict.
 *
 * - An anaesthetist: her own session and her own movable List; the pool post
 *   and "no preference warning" apply as on a plain move.
 * - The office (a sickness phoned in): any anaesthetist's session. An ACTIVE
 *   List goes back or on; a SUBMITTED List can only be handed on (only an
 *   ACTIVE List becomes a Draft List); an AUTHORISED List refuses. No notice.
 *
 * One List per call: a range or series resolves List by List.
 */
function markUnavailableAndMoveListUnscoped(
  api: AppStoreApi,
  actor: Actor,
  slotId: string,
  statusKey: SlotStatusKey,
  choice: UnavailableChoice,
  options: MarkUnavailableOptions = {},
): Outcome<OwnMoveResult> {
  const anaesthetist = isAnaesthetistActor(actor)
  if (!anaesthetist && !isOfficeActor(actor)) return refuse('notAllowed', 'Only the anaesthetist or the office can mark a session not available.')
  const state = api.getState()
  const slot = state.schedule.slots[slotId]
  if (slot === undefined) return refuse('notFound', 'Session not found.')
  if (anaesthetist && slot.anaesthetistId !== actor.anaesthetistId) return refuse('notOwnList', 'You can only change your own sessions.')
  // The availability actions' own status guards, so the codes and words agree.
  const bad = statusRefusal<OwnMoveResult>(state.masters.slotStatuses, actor, statusKey) ?? replacedStatusRefusal<OwnMoveResult>(state.masters.slotStatuses, actor, [slot])
  if (bad !== null) return bad
  if (!isClosedKey(state.masters.slotStatuses, statusKey)) {
    return refuse('notClosedStatus', `${statusFor(state.masters.slotStatuses, statusKey)?.label ?? 'That status'} keeps the session open. Choose a status that marks the session not available.`)
  }
  const list = listInSlot(state, slotId)
  if (list === undefined) return refuse('noList', 'This session has no List to move.')
  if (anaesthetist) {
    const refusal = ownMoveRefusal(moveInputOf(state), list.id, actor.anaesthetistId, state.clock.todayISO)
    if (refusal !== null) return refuse(refusal.code, refusal.message)
  } else {
    if (list.state === 'AUTHORISED') return refuse('listAuthorised', 'This List is authorised and locked, so its session cannot be marked not available.')
    // A past List stays where it was: a returned one could never be assigned again (its day has gone).
    if (list.dateISO < state.clock.todayISO) return refuse('pastDate', "This List's day has passed, so its session cannot be marked not available.")
    if (list.state === 'SUBMITTED' && choice.route === 'office') {
      return refuse('submittedHandOnOnly', 'This List has been submitted, so it can only be handed on to a colleague.')
    }
  }
  const vacatedStatus = options.vacatedStatus ?? defaultVacated(statusKey)
  const badVacated = vacatedStatusRefusal<OwnMoveResult>(state.masters.slotStatuses, actor, vacatedStatus, vacatedChoices(statusKey))
  if (badVacated !== null) return badVacated
  const message = options.message?.trim() ?? ''
  // The note goes with the closed status; a session left Free takes none (it would read as a sickness).
  const noteApplies = options.note !== undefined && isClosedKey(state.masters.slotStatuses, vacatedStatus)
  return commit(api, actor, list.id, choice.route, {
    ...(choice.route === 'colleague' ? { toSlotId: choice.toSlotId } : {}),
    vacatedStatus,
    cause: 'unavailable',
    ...(anaesthetist && message !== '' ? { message } : {}),
    ...(noteApplies ? { note: options.note } : {}),
  })
}

// ---------------------------------------------------------------------------
// A single Booking (catch-up Phase 32a; US-01.4.7, US-01.4.6, DM-42; OQ-85
// answered, D61; D7, D38, D44, D54, D58)
// ---------------------------------------------------------------------------

export interface BookingMoveOptions {
  /** Optional words for the colleague and the office (kept on the move's audit event). */
  message?: string
  /** "Tell the office": post one row to the shared pool (off by default; D58's optional source). */
  tellOffice?: boolean
}

export interface BookingMoveResult {
  /** The List the Booking left (it stays, even if now empty). */
  listId: string
  /** The new List created for it in the receiver's session. */
  createdListId: string
  toAnaesthetistId: string
  /** Only when the mover ticked "Tell the office". */
  notificationId?: string
}

/**
 * An anaesthetist hands one Booking to a colleague free in its day and session
 * (US-01.4.7). It is also the doer rule (US-01.4.6): whoever submits a List did
 * every procedure on it, so a Booking a colleague does is moved to them first.
 * There is no second "move to the one who did it" path.
 *
 * - AT ONCE (D7): one `mutate()` commit; no acceptance, no confirmation.
 * - ALWAYS A NEW LIST (D61): Phase 28's `placeListOnSlot` creates it in the
 *   receiver's free, empty session, copying the source List's hospital, surgeon
 *   and kind, even for one Booking. Never into an existing List. The source
 *   List stays, even if empty.
 * - ONE EVENT: the List's own `list.create`, and one
 *   `booking.movedToAnaesthetist` (no `booking.reassign`).
 * - OPTIONAL NOTICE (D58): one pool row only when `tellOffice`. The receiver's
 *   notice reads the audit event, so it shows either way.
 * - NO PREFERENCE (D44, D54): nothing read, warned or acknowledged.
 * - NO MONEY (D38, US-06.3.5, US-06.5.4): the payable follows by derivation
 *   (the List's owner); no payee or price is written; no prepayment re-check,
 *   invoice, ledger pair or Xero record is read or touched. A prepaid
 *   Booking's payable is the AA Holding account: nothing moves, and the new
 *   anaesthetist claims the prepaid amount. No hook.
 */
function moveBookingToAnaesthetistUnscoped(
  api: AppStoreApi,
  actor: Actor,
  bookingId: string,
  toAnaesthetistId: string,
  options: BookingMoveOptions = {},
): Outcome<BookingMoveResult> {
  return commitCore(api, actor, 'bookingMoveCore', (s) => bookingMoveCore(s, actor, bookingId, toAnaesthetistId, options))
}

function bookingMoveCore(
  state: AppState,
  actor: Actor,
  bookingId: string,
  toAnaesthetistId: string,
  options: BookingMoveOptions,
): Outcome<{ patch: DomainPatch; metas: MutationMeta[]; result: BookingMoveResult }> {
  if (actor.role !== 'anaesthetist' || actor.source === 'integration' || actor.anaesthetistId === undefined) {
    return refuse('ownerOnly', "Only the Booking's anaesthetist moves it this way. The office uses Move on the Booking in Admin.")
  }
  const input = bookingMoveInputOf(state)
  const refusal = bookingMoveRefusal(input, bookingId, actor.anaesthetistId, state.clock.todayISO)
  if (refusal !== null) return refuse(refusal.code, refusal.message)
  const placement = bookingPlacement(input, bookingId, toAnaesthetistId)
  if (!placement.ok) return refuse(placement.code, placement.message)

  const booking = state.schedule.bookings[bookingId]!
  const source = state.schedule.lists[booking.listId] as AssignedList
  const slot = state.schedule.slots[placement.slotId]!
  const atISO = clockISO(state.clock)

  const placed = placeListOnSlot(state.counters, slot, { kind: source.kind, hospitalId: source.hospitalId, surgeonId: source.surgeonId, origin: originForNewList({ kind: 'derived', from: source }) })
  const listsWithNew = { ...state.schedule.lists, [placed.list.id]: placed.list }
  const schedule = reassignBookingCore({ ...state.schedule, lists: listsWithNew }, bookingId, placed.list.id)

  const message = options.message?.trim() ?? ''
  let notifications = state.notifications
  let counters = placed.counters
  let notificationId: string | undefined
  if (options.tellOffice === true) {
    const patient = state.masters.patients[booking.patientId]
    const post = postNotification(
      { notifications, counters },
      {
        kind: 'bookingMoved',
        atISO,
        byActor: actor.who,
        listId: placed.list.id,
        bookingId,
        ...(patient !== undefined ? { patientName: surnameCommaInitial(patient.name) } : {}),
        route: 'colleague',
        cause: 'move',
        fromAnaesthetistId: source.anaesthetistId,
        toAnaesthetistId,
        dateISO: source.dateISO,
        session: source.session,
        hospitalId: source.hospitalId,
        surgeonId: source.surgeonId,
        ...(message !== '' ? { message } : {}),
      },
    )
    notifications = post.notifications
    counters = post.counters
    notificationId = post.id
  }

  // The one from/to/by/when event of the move. D38: a prepaid Booking's payable
  // is the AA Holding account, so nothing here touches money and no hook runs.
  const moved: MutationMeta = {
    entityType: 'booking',
    entityId: bookingId,
    action: 'booking.movedToAnaesthetist',
    before: { listId: source.id, anaesthetistId: source.anaesthetistId },
    after: {
      listId: placed.list.id,
      anaesthetistId: toAnaesthetistId,
      createdListId: placed.list.id,
      ...(message !== '' ? { message } : {}),
      ...(notificationId !== undefined ? { notificationId } : {}),
    },
  }
  return ok({
    patch: { schedule, counters, ...(notificationId !== undefined ? { notifications } : {}) },
    metas: [placed.meta, moved],
    result: { listId: source.id, createdListId: placed.list.id, toAnaesthetistId, ...(notificationId !== undefined ? { notificationId } : {}) },
  })
}

/** `moveListToOfficeUnscoped` as one change set (`listReassign`), whichever app calls it (catch-up Phase 35; DM-35). */
export function moveListToOffice(...args: Parameters<typeof moveListToOfficeUnscoped>): ReturnType<typeof moveListToOfficeUnscoped> {
  return withChangeSet(args[0], 'listReassign', () => moveListToOfficeUnscoped(...args))
}

/** `pushListToSlotUnscoped` as one change set (`listReassign`), whichever app calls it (catch-up Phase 35; DM-35). */
export function pushListToSlot(...args: Parameters<typeof pushListToSlotUnscoped>): ReturnType<typeof pushListToSlotUnscoped> {
  return withChangeSet(args[0], 'listReassign', () => pushListToSlotUnscoped(...args))
}

/** `markUnavailableAndMoveListUnscoped` as one change set (`listReassign`), whichever app calls it (catch-up Phase 35; DM-35). */
export function markUnavailableAndMoveList(...args: Parameters<typeof markUnavailableAndMoveListUnscoped>): ReturnType<typeof markUnavailableAndMoveListUnscoped> {
  return withChangeSet(args[0], 'listReassign', () => markUnavailableAndMoveListUnscoped(...args))
}

/** `moveBookingToAnaesthetistUnscoped` as one change set (`move`), whichever app calls it (catch-up Phase 35; DM-35). */
export function moveBookingToAnaesthetist(...args: Parameters<typeof moveBookingToAnaesthetistUnscoped>): ReturnType<typeof moveBookingToAnaesthetistUnscoped> {
  return withChangeSet(args[0], 'move', () => moveBookingToAnaesthetistUnscoped(...args))
}

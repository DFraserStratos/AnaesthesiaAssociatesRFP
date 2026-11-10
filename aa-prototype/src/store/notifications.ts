/**
 * The Admin App's shared notification pool (catch-up Phase 32; FT-13.8,
 * US-13.8.1, US-13.8.2, US-13.8.3, DM-41; D15, D58). PWA-safe: pure selectors,
 * the one draft-level creator and the one updater.
 *
 * - `postNotification` is the ONLY creator. It runs inside its action's own
 *   `mutate()` recipe (a move, an alert), so the record and the action are one
 *   commit. Nothing deletes a notification.
 * - `resolveNotification` is the ONLY updater (catch-up Phase 32b, D58): an
 *   admin ticks a notice resolved, which writes `resolvedAt` and `resolvedBy`
 *   once, audited `notification.resolve`. It hides the notice for every admin;
 *   "Show resolved" brings it back with who and when. Nothing expires; there
 *   is no un-tick.
 * - The selectors take NO user: every admin sees the same pool (AC "Shared").
 *   There is no read or per-user state.
 * - The colleague's own "Moved to you" notice (`movedToMe`) ignores the
 *   office's tick: it is her notice, not the office's.
 * - A notification is not a to-do and not a Warning: nothing here feeds 15a's
 *   to-do list.
 */

import { compareNewestFirst, inMovedToMeWindow, isActive, NOTIFICATION_POOL_RULE, notificationText, pageOf, type NotificationMasters } from '../domain/notifications'
import type { Notification } from '../domain/types'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

export type NotificationInput = Omit<Notification, 'id' | 'kind' | 'resolvedAt' | 'resolvedBy'> & { kind?: Notification['kind'] }

/**
 * Append one notification, inside a mutate recipe (draft level: it returns the
 * new slice and counters for the recipe's patch). The record is a snapshot.
 */
export function postNotification(
  s: Pick<AppState, 'notifications' | 'counters'>,
  input: NotificationInput,
): { notifications: AppState['notifications']; counters: Record<string, number>; id: string } {
  const alloc = allocateId(s.counters, 'notification')
  const message = input.message?.trim() ?? ''
  const record: Notification = {
    id: alloc.id,
    atISO: input.atISO,
    kind: input.kind ?? 'listMoved',
    byActor: input.byActor,
    listId: input.listId,
    ...(input.route !== undefined ? { route: input.route } : {}),
    ...(input.cause !== undefined ? { cause: input.cause } : {}),
    fromAnaesthetistId: input.fromAnaesthetistId,
    ...(input.toAnaesthetistId !== undefined ? { toAnaesthetistId: input.toAnaesthetistId } : {}),
    dateISO: input.dateISO,
    session: input.session,
    hospitalId: input.hospitalId,
    surgeonId: input.surgeonId,
    ...(message !== '' ? { message } : {}),
    ...(input.bookingId !== undefined ? { bookingId: input.bookingId } : {}),
    ...(input.patientName !== undefined ? { patientName: input.patientName } : {}),
  }
  // A notice is born active: only `resolveNotification` resolves it.
  if (s.notifications[record.id] !== undefined) throw new Error(`postNotification would overwrite ${record.id}`)
  return { notifications: { ...s.notifications, [record.id]: record }, counters: alloc.counters, id: record.id }
}

/** What the pool's rows read: the records, the masters' names, and where each List is now. */
export type PoolState = Pick<AppState, 'notifications'> & { masters: NotificationMasters; schedule: Pick<AppState['schedule'], 'lists' | 'bookings'> }

/**
 * Where a row opens: the List in its Day drawer, the Draft List page when the
 * List is a Draft List now, or (a single Booking moved, Phase 32a) the
 * Booking's detail on the day it now sits on.
 */
export type NotificationTarget =
  | { kind: 'list'; listId: string; dateISO: string }
  | { kind: 'draftList'; listId: string }
  | { kind: 'booking'; bookingId: string; dateISO: string }
  | { kind: 'gone' }

export interface NotificationRow {
  notification: Notification
  /** The one sentence (`notificationText`). */
  text: string
  atISO: string
  /** The anaesthetist who moved it or raised the alert (the record's actor). */
  by: string
  target: NotificationTarget
  /** Ticked resolved by an admin (shown only with "Show resolved"). */
  resolved: boolean
}

function targetFor(state: { schedule: Pick<AppState['schedule'], 'lists'> }, listId: string): NotificationTarget {
  const list = state.schedule.lists[listId]
  if (list === undefined || list.removedAtISO !== undefined) return { kind: 'gone' }
  if (list.state === 'DRAFT') return { kind: 'draftList', listId }
  return { kind: 'list', listId, dateISO: list.dateISO }
}

function bookingTargetFor(state: { schedule: Pick<AppState['schedule'], 'lists' | 'bookings'> }, bookingId: string): NotificationTarget {
  const booking = state.schedule.bookings[bookingId]
  const list = booking === undefined ? undefined : state.schedule.lists[booking.listId]
  if (booking === undefined || list === undefined || list.removedAtISO !== undefined) return { kind: 'gone' }
  return { kind: 'booking', bookingId, dateISO: list.dateISO }
}

function rowOf(state: PoolState, n: Notification): NotificationRow {
  // A single Booking moved, or an alert on a Booking, opens that Booking.
  const target = n.bookingId !== undefined && (n.kind === 'bookingMoved' || n.kind === 'officeAlert') ? bookingTargetFor(state, n.bookingId) : targetFor(state, n.listId)
  return { notification: n, text: notificationText(n, state.masters), atISO: n.atISO, by: n.byActor, target, resolved: !isActive(n) }
}

/** Every notification the rule keeps (D58: List moves, the optional Booking move, alerts; no expiry). */
function kept(state: Pick<AppState, 'notifications'>): Notification[] {
  const sources: readonly string[] = NOTIFICATION_POOL_RULE.sources
  return Object.values(state.notifications).filter((n) => sources.includes(n.kind))
}

/**
 * The pool, newest first, one page (`NOTIFICATION_POOL_RULE.pageSize`): the
 * active notices, or with `showResolved` every notice, resolved ones marked.
 * The same for every admin: it takes no user.
 */
export function notificationPool(
  state: PoolState,
  options: { page: number; showResolved?: boolean },
): { rows: NotificationRow[]; page: number; pageCount: number; total: number } {
  const shown = options.showResolved === true ? kept(state) : kept(state).filter(isActive)
  const page = pageOf(shown, options.page, NOTIFICATION_POOL_RULE.pageSize)
  return { rows: page.rows.map((n) => rowOf(state, n)), page: page.page, pageCount: page.pageCount, total: page.total }
}

/** The newest `n` active notifications (the Admin Day rail card). */
export function latestNotifications(state: PoolState, n: number): NotificationRow[] {
  return kept(state).filter(isActive).sort(compareNewestFirst).slice(0, n).map((x) => rowOf(state, x))
}

/** How many notices are active (US-13.8.1 "Count"): the rail card and the page heading. */
export function activeNotificationCount(state: Pick<AppState, 'notifications'>): number {
  return kept(state).filter(isActive).length
}

/**
 * An admin ticks a notice resolved (catch-up Phase 32b; US-13.8.3, D58): the
 * only updater of a notification. Office only (never an anaesthetist or a
 * feed); refuses an unknown id and one already resolved. One `mutate()`
 * writing `resolvedAt` (the demo clock) and `resolvedBy` once, audited
 * `notification.resolve` with before and after. It hides the notice for every
 * admin; the colleague's own "Moved to you" notice is unaffected.
 */
export function resolveNotification(api: AppStoreApi, actor: Actor, id: string): Outcome<{ id: string; resolvedAt: string }> {
  if (actor.role !== 'office' || actor.source === 'integration') return refuse('officeOnly', 'Only the office resolves a notice.')
  const state = api.getState()
  const n = state.notifications[id]
  if (n === undefined) return refuse('notFound', 'Notice not found.')
  if (!isActive(n)) return refuse('alreadyResolved', `${n.resolvedBy ?? 'Someone'} already resolved this notice.`)
  const resolvedAt = clockISO(state.clock)
  mutate(
    api,
    actor,
    {
      entityType: 'notification',
      entityId: id,
      action: 'notification.resolve',
      before: { resolvedAt: null, resolvedBy: null },
      after: { resolvedAt, resolvedBy: actor.who, kind: n.kind, listId: n.listId, ...(n.bookingId !== undefined ? { bookingId: n.bookingId } : {}) },
      stampBookingId: null,
    },
    (s) => {
      const current = s.notifications[id]
      if (current === undefined || !isActive(current)) throw new Error(`resolveNotification: ${id} is not active`)
      return { notifications: { ...s.notifications, [id]: { ...current, resolvedAt, resolvedBy: actor.who } } }
    },
  )
  return ok({ id, resolvedAt })
}

/**
 * The alerts (kind `officeAlert`) about a List, or about a Booking, newest
 * first. A Booking's alert follows the Booking (matched by its id alone), so a
 * Booking moved to another List keeps its alert; a List's alert is one with no
 * Booking on that List.
 */
function alertsFor(state: Pick<AppState, 'notifications'>, target: { listId: string; bookingId?: string }): Notification[] {
  return Object.values(state.notifications)
    .filter((n) => n.kind === 'officeAlert' && (target.bookingId !== undefined ? n.bookingId === target.bookingId : n.listId === target.listId && n.bookingId === undefined))
    .sort(compareNewestFirst)
}

/** The active alert on this List (no `bookingId`) or this Booking, if any: one at a time (US-03.6.3). */
export function activeAlertFor(state: Pick<AppState, 'notifications'>, target: { listId: string; bookingId?: string }): Notification | undefined {
  return alertsFor(state, target).find(isActive)
}

/** The newest alert on this target, active or resolved (the anaesthetist's "dealt with" line). */
export function latestAlertFor(state: Pick<AppState, 'notifications'>, target: { listId: string; bookingId?: string }): Notification | undefined {
  return alertsFor(state, target)[0]
}

/** The newest notification about a List's own move (the drawer's "Moved here by" line), or undefined. A single Booking's notice is not one. */
export function latestNotificationForList(state: Pick<AppState, 'notifications'>, listId: string): Notification | undefined {
  return Object.values(state.notifications)
    .filter((n) => n.kind === 'listMoved' && n.listId === listId)
    .sort(compareNewestFirst)[0]
}

/**
 * Lists moved TO this anaesthetist by a colleague in the last
 * `MOVED_TO_ME_DAYS` demo days, newest first (US-01.4.3 AC2: the colleague
 * sees it with a notice). A display window: the records stay. A return to the
 * office names no colleague, so it never shows here.
 */
export function movedToMe(state: Pick<AppState, 'notifications'>, anaesthetistId: string, todayISO: string): Notification[] {
  return Object.values(state.notifications)
    .filter((n) => n.kind === 'listMoved' && n.route === 'colleague' && n.toAnaesthetistId === anaesthetistId && inMovedToMeWindow(n.atISO, todayISO))
    .sort(compareNewestFirst)
}

/** The notice for one List the persona received, if it is in the window (List detail's "Moved to you by" line, Forward Lists' "New"). */
export function movedToMeForList(state: Pick<AppState, 'notifications'>, anaesthetistId: string, listId: string, todayISO: string): Notification | undefined {
  return movedToMe(state, anaesthetistId, todayISO).find((n) => n.listId === listId)
}

// ---------------------------------------------------------------------------
// A single Booking moved to a colleague (catch-up Phase 32a). Read from the
// move's audit event, not the pool, so the receiver's notice and the office's
// drawer line show whether or not the mover ticked "Tell the office".
// ---------------------------------------------------------------------------

/** One single-Booking move, as its `booking.movedToAnaesthetist` audit event records it. */
export interface BookingMove {
  auditId: string
  atISO: string
  bookingId: string
  fromListId: string
  fromAnaesthetistId: string
  /** The new List created in the receiver's session. */
  listId: string
  toAnaesthetistId: string
  message?: string
}

function bookingMoveOf(entry: AppState['audit'][number]): BookingMove | undefined {
  if (entry.action !== 'booking.movedToAnaesthetist') return undefined
  const before = entry.before as { listId?: unknown; anaesthetistId?: unknown } | undefined
  const after = entry.after as { createdListId?: unknown; anaesthetistId?: unknown; message?: unknown } | undefined
  if (typeof before?.listId !== 'string' || typeof before.anaesthetistId !== 'string') return undefined
  if (typeof after?.createdListId !== 'string' || typeof after.anaesthetistId !== 'string') return undefined
  return {
    auditId: entry.id,
    atISO: entry.atISO,
    bookingId: entry.entityId,
    fromListId: before.listId,
    fromAnaesthetistId: before.anaesthetistId,
    listId: after.createdListId,
    toAnaesthetistId: after.anaesthetistId,
    ...(typeof after.message === 'string' ? { message: after.message } : {}),
  }
}

function newestMoveFirst(a: BookingMove, b: BookingMove): number {
  return b.atISO.localeCompare(a.atISO) || b.auditId.localeCompare(a.auditId)
}

/**
 * Bookings moved TO this anaesthetist by a colleague in the last
 * `MOVED_TO_ME_DAYS` demo days, newest first (US-01.4.7: the receiver's
 * "Moved to you" notice). A display window: the audit stays.
 */
export function bookingsMovedToMe(state: Pick<AppState, 'audit'>, anaesthetistId: string, todayISO: string): BookingMove[] {
  const out: BookingMove[] = []
  for (const entry of state.audit) {
    const move = bookingMoveOf(entry)
    if (move !== undefined && move.toAnaesthetistId === anaesthetistId && inMovedToMeWindow(move.atISO, todayISO)) out.push(move)
  }
  return out.sort(newestMoveFirst)
}

/** The received Booking's "Moved to you by" notice: the move that put it on her List, still there, inside the window. */
export function bookingMovedToMe(
  state: Pick<AppState, 'audit'> & { schedule: Pick<AppState['schedule'], 'bookings'> },
  bookingId: string,
  anaesthetistId: string,
  todayISO: string,
): BookingMove | undefined {
  const move = bookingMoveFor(state, bookingId)
  return move !== undefined && move.toAnaesthetistId === anaesthetistId && inMovedToMeWindow(move.atISO, todayISO) ? move : undefined
}

/** The audit's single-Booking move events only (a subscription that changes only when a move lands, not on every write). */
export function bookingMoveEntries(state: Pick<AppState, 'audit'>): AppState['audit'] {
  return state.audit.filter((e) => e.action === 'booking.movedToAnaesthetist')
}

/** The newest single-Booking move that put this Booking where it is, if it is still on that List (the received Booking's "Moved to you by" line). */
export function bookingMoveFor(state: Pick<AppState, 'audit'> & { schedule: Pick<AppState['schedule'], 'bookings'> }, bookingId: string): BookingMove | undefined {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return undefined
  let latest: BookingMove | undefined
  for (const entry of state.audit) {
    if (entry.entityId !== bookingId) continue
    const move = bookingMoveOf(entry)
    if (move !== undefined && (latest === undefined || newestMoveFirst(move, latest) < 0)) latest = move
  }
  return latest !== undefined && latest.listId === booking.listId ? latest : undefined
}

/** The single-Booking moves onto this List whose Booking is still on it, newest first (the Admin drawer's "Booking moved here by" line). */
export function bookingMovesOntoList(state: Pick<AppState, 'audit'> & { schedule: Pick<AppState['schedule'], 'bookings'> }, listId: string): BookingMove[] {
  const out: BookingMove[] = []
  for (const entry of state.audit) {
    const move = bookingMoveOf(entry)
    if (move !== undefined && move.listId === listId && state.schedule.bookings[move.bookingId]?.listId === listId) out.push(move)
  }
  return out.sort(newestMoveFirst)
}

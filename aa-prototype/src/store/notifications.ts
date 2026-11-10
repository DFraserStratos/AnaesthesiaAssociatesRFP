/**
 * The Admin App's shared notification pool (catch-up Phase 32; FT-13.8,
 * US-13.8.1, US-13.8.2, DM-41; D15, Vanessa agreed the shared pool
 * 2026-10-07). PWA-safe: pure selectors plus the one draft-level writer.
 *
 * - `postNotification` is the ONLY writer of `notifications`. It runs inside a
 *   move's own `mutate()` recipe, so the record and the move are one commit.
 *   Nothing updates or deletes a notification.
 * - The selectors take NO user: every admin sees the same pool (AC "Shared").
 *   There is no read, actioned or per-user state (OQ-79's recommendation).
 * - A notification is not a to-do and not a Warning: nothing here feeds 15a's
 *   to-do list.
 */

import { compareNewestFirst, MOVED_TO_ME_DAYS, NOTIFICATION_POOL_RULE, notificationText, pageOf, type NotificationMasters } from '../domain/notifications'
import { addDaysISO } from '../domain/clock'
import type { Notification } from '../domain/types'
import { allocateId } from './mutate'
import type { AppState } from './appStore'

export type NotificationInput = Omit<Notification, 'id' | 'kind'> & { kind?: Notification['kind'] }

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
    route: input.route,
    cause: input.cause,
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
  /** The anaesthetist who moved it (the record's actor). */
  by: string
  target: NotificationTarget
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
  const target = n.kind === 'bookingMoved' && n.bookingId !== undefined ? bookingTargetFor(state, n.bookingId) : targetFor(state, n.listId)
  return { notification: n, text: notificationText(n, state.masters), atISO: n.atISO, by: n.byActor, target }
}

/** Every notification the rule keeps (OQ-79: List moves, no expiry). */
function kept(state: Pick<AppState, 'notifications'>): Notification[] {
  const sources: readonly string[] = NOTIFICATION_POOL_RULE.sources
  return Object.values(state.notifications).filter((n) => sources.includes(n.kind))
}

/** The pool, newest first, one page (`NOTIFICATION_POOL_RULE.pageSize`). The same for every admin: it takes no user. */
export function notificationPool(state: PoolState, options: { page: number }): { rows: NotificationRow[]; page: number; pageCount: number; total: number } {
  const page = pageOf(kept(state), options.page, NOTIFICATION_POOL_RULE.pageSize)
  return { rows: page.rows.map((n) => rowOf(state, n)), page: page.page, pageCount: page.pageCount, total: page.total }
}

/** The newest `n` notifications (the Admin Day rail card). */
export function latestNotifications(state: PoolState, n: number): NotificationRow[] {
  return kept(state).sort(compareNewestFirst).slice(0, n).map((x) => rowOf(state, x))
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
  const fromISO = addDaysISO(todayISO, -(MOVED_TO_ME_DAYS - 1))
  return Object.values(state.notifications)
    .filter((n) => n.kind === 'listMoved' && n.route === 'colleague' && n.toAnaesthetistId === anaesthetistId && n.atISO.slice(0, 10) >= fromISO && n.atISO.slice(0, 10) <= todayISO)
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
  const fromISO = addDaysISO(todayISO, -(MOVED_TO_ME_DAYS - 1))
  const out: BookingMove[] = []
  for (const entry of state.audit) {
    const move = bookingMoveOf(entry)
    if (move === undefined || move.toAnaesthetistId !== anaesthetistId) continue
    const day = move.atISO.slice(0, 10)
    if (day >= fromISO && day <= todayISO) out.push(move)
  }
  return out.sort(newestMoveFirst)
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

/** The single-Booking moves onto this List, newest first (the Admin drawer's "Booking moved here by" line). */
export function bookingMovesOntoList(state: Pick<AppState, 'audit'>, listId: string): BookingMove[] {
  const out: BookingMove[] = []
  for (const entry of state.audit) {
    const move = bookingMoveOf(entry)
    if (move !== undefined && move.listId === listId) out.push(move)
  }
  return out.sort(newestMoveFirst)
}

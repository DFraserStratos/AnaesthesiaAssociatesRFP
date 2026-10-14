/**
 * The Admin App's shared notification pool (catch-up Phase 32; FT-13.8,
 * US-13.8.1, US-13.8.2, DM-41; D15). Pure: no React, no store, no shared.
 *
 * One pool for the whole admin team (Vanessa agreed the shared pool on
 * 2026-10-07): nothing here takes a user. A notification is not a to-do and
 * not a Warning; it carries no pairing preference.
 */

import { shortDateLabel } from './slotStatus'
import { titledSurname } from './names'
import type { Anaesthetist, Hospital, Notification, Surgeon } from './types'

/**
 * What posts to the pool and how long a notice lasts (OQ-79, OPEN: the
 * recommendation is built and labelled provisional on the Notifications page).
 * List moves only; every notice is kept (no expiry); no read or actioned state;
 * newest first, paged. If OQ-79 is answered, change only this rule and the
 * selectors behind it: an expiry becomes a filter on `atISO` against the demo
 * clock (the records stay); "mark as seen" is new scope (per-user state the
 * pool deliberately does not have).
 */
export const NOTIFICATION_POOL_RULE = {
  sources: ['listMoved'],
  expiresAfterDays: null,
  actionable: false,
  pageSize: 6,
} as const satisfies {
  sources: readonly Notification['kind'][]
  expiresAfterDays: number | null
  actionable: boolean
  pageSize: number
}

/** How many demo days the receiving colleague's "Moved to you" panel looks back (a display window; the records stay). */
export const MOVED_TO_ME_DAYS = 7

export interface NotificationMasters {
  anaesthetists: Readonly<Record<string, Anaesthetist>>
  hospitals: Readonly<Record<string, Hospital>>
  surgeons: Readonly<Record<string, Surgeon>>
}

function anaesthetistShort(masters: NotificationMasters, id: string | undefined): string {
  const a = id === undefined ? undefined : masters.anaesthetists[id]
  return a === undefined ? 'An anaesthetist' : titledSurname(a.name)
}

/** "Thu 23 Jul AM (St George's, Ms A. Reid)": the List as it was when it moved (the record's snapshot). */
export function notificationListLine(n: Notification, masters: NotificationMasters): string {
  const hospital = masters.hospitals[n.hospitalId]?.name ?? 'Hospital not set'
  const surgeon = masters.surgeons[n.surgeonId]?.name
  return `${shortDateLabel(n.dateISO)} ${n.session} (${surgeon !== undefined ? `${hospital}, ${surgeon}` : hospital})`
}

/**
 * The one sentence a notification reads as on the Admin card and the
 * Notifications page (the colleague's own notice addresses her, "... to
 * you", in `shared/flows/MovedToYouPanel.tsx`): "Dr Hughes moved Thu 23 Jul AM (St George's, Ms A.
 * Reid) to Dr Sharma", "Dr Hughes returned ... to the office", plus "when
 * marking the session not available" for a hand-on from the unavailable prompt.
 */
export function notificationText(n: Notification, masters: NotificationMasters): string {
  const by = anaesthetistShort(masters, n.fromAnaesthetistId)
  const what = notificationListLine(n, masters)
  const tail = n.cause === 'unavailable' ? ' when marking the session not available' : ''
  if (n.route === 'office') return `${by} returned ${what} to the office${tail}`
  return `${by} moved ${what} to ${anaesthetistShort(masters, n.toAnaesthetistId)}${tail}`
}

/** Newest first: by `atISO`, then id descending (ids are allocated in order). */
export function compareNewestFirst(a: Pick<Notification, 'atISO' | 'id'>, b: Pick<Notification, 'atISO' | 'id'>): number {
  return b.atISO.localeCompare(a.atISO) || b.id.localeCompare(a.id)
}

export interface NotificationPage<T> {
  rows: T[]
  /** 1-based, clamped into range. */
  page: number
  pageCount: number
  total: number
}

/** One page of the pool, newest first. Page numbers start at 1 and are clamped; an empty pool has one empty page. */
export function pageOf<T extends Pick<Notification, 'atISO' | 'id'>>(notifications: readonly T[], page: number, pageSize: number): NotificationPage<T> {
  const sorted = [...notifications].sort(compareNewestFirst)
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(Math.max(1, Math.floor(page)), pageCount)
  return { rows: sorted.slice((current - 1) * pageSize, current * pageSize), page: current, pageCount, total: sorted.length }
}

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
import { addDaysISO } from './clock'
import type { Anaesthetist, Hospital, Notification, Surgeon } from './types'
import { sessionText } from './outOfHours'

/**
 * What posts to the pool and how a notice ends (OQ-79 answered 19 October,
 * D58; catch-up Phase 32b): an anaesthetist's List move, a single-Booking move
 * when she ticks "Tell the office", and an "alert the office" with a note
 * (US-03.6.3). A notice is active until an admin ticks it resolved
 * (`actionable`), which hides it for every admin; nothing expires; newest
 * first, paged.
 */
export const NOTIFICATION_POOL_RULE = {
  sources: ['listMoved', 'bookingMoved', 'officeAlert'],
  expiresAfterDays: null,
  actionable: true,
  pageSize: 6,
} as const satisfies {
  sources: readonly Notification['kind'][]
  expiresAfterDays: number | null
  actionable: boolean
  pageSize: number
}

/** A notice nobody has ticked yet (US-13.8.3: active until resolved; nothing expires). */
export function isActive(n: Pick<Notification, 'resolvedAt'>): boolean {
  return n.resolvedAt === undefined
}

/** How many notices are active (US-13.8.1 "Count"). */
export function activeCount(notifications: readonly Pick<Notification, 'resolvedAt'>[]): number {
  return notifications.filter(isActive).length
}

/** How many demo days the receiving colleague's "Moved to you" panel looks back (a display window; the records stay). */
export const MOVED_TO_ME_DAYS = 7

/** Whether a move at `atISO` is inside the "Moved to you" window ending today: the one window rule for List and Booking notices. */
export function inMovedToMeWindow(atISO: string, todayISO: string): boolean {
  const day = atISO.slice(0, 10)
  return day >= addDaysISO(todayISO, -(MOVED_TO_ME_DAYS - 1)) && day <= todayISO
}

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
  return `${shortDateLabel(n.dateISO)} ${sessionText(n.session)} (${surgeon !== undefined ? `${hospital}, ${surgeon}` : hospital})`
}

/**
 * The one sentence a notification reads as on the Admin card and the
 * Notifications page (the colleague's own notice addresses her, "... to
 * you", in `shared/flows/MovedToYouPanel.tsx`): "Dr Hughes moved Thu 23 Jul AM (St George's, Ms A.
 * Reid) to Dr Sharma", "Dr Hughes returned ... to the office", plus "when
 * marking the session not available" for a hand-on from the unavailable prompt.
 * A single Booking (Phase 32a): "Dr Souter moved a Booking (Riley, A., Thu 23
 * Jul AM, St George's) to Dr Hughes. A new List was created." An alert (Phase
 * 32b): "Dr Souter asked the office to check Thu 23 Jul AM (St George's, Ms A.
 * Reid)", its note shown beneath by the panel.
 */
export function notificationText(n: Notification, masters: NotificationMasters): string {
  const by = anaesthetistShort(masters, n.fromAnaesthetistId)
  if (n.kind === 'officeAlert') {
    // "Dr Souter asked the office to check Thu 23 Jul AM (St George's, Ms A. Reid)", or
    // "... to check a Booking (Walker, H., Thu 23 Jul AM, St George's)". The note shows beneath.
    if (n.bookingId !== undefined) {
      const hospital = masters.hospitals[n.hospitalId]?.name ?? 'Hospital not set'
      const parts = [n.patientName, `${shortDateLabel(n.dateISO)} ${sessionText(n.session)}`, hospital].filter((p): p is string => p !== undefined && p !== '')
      return `${by} asked the office to check a Booking (${parts.join(', ')})`
    }
    return `${by} asked the office to check ${notificationListLine(n, masters)}`
  }
  if (n.kind === 'bookingMoved') {
    // "Dr Souter moved a Booking (Riley, A., Thu 23 Jul AM, St George's) to Dr Hughes. A new List was created."
    const hospital = masters.hospitals[n.hospitalId]?.name ?? 'Hospital not set'
    const parts = [n.patientName, `${shortDateLabel(n.dateISO)} ${sessionText(n.session)}`, hospital].filter((p): p is string => p !== undefined && p !== '')
    return `${by} moved a Booking (${parts.join(', ')}) to ${anaesthetistShort(masters, n.toAnaesthetistId)}. A new List was created.`
  }
  const what = notificationListLine(n, masters)
  const tail = n.cause === 'unavailable' ? ' when marking the session not available' : ''
  if (n.route === 'office') return `${by} returned ${what} to the office${tail}`
  return `${by} moved ${what} to ${anaesthetistShort(masters, n.toAnaesthetistId)}${tail}`
}

/**
 * A notice's short headline on the Notifications page's feed, who did what and to whom, with the List or
 * Booking's details on a line of their own (`notificationDetail`): "Dr Murray asked the office to check a
 * List", "Dr Tamihana returned a List to the office", "Dr Campbell handed a List on to Dr Stewart", "Dr Wong
 * moved a Booking to Dr Gupta". A hand-on from the unavailable prompt adds ", marking the session not
 * available". The Day rail keeps the one-sentence `notificationText`.
 */
export function notificationHeadline(n: Notification, masters: NotificationMasters): string {
  const by = anaesthetistShort(masters, n.fromAnaesthetistId)
  if (n.kind === 'officeAlert') return `${by} asked the office to check ${n.bookingId !== undefined ? 'a Booking' : 'a List'}`
  const to = anaesthetistShort(masters, n.toAnaesthetistId)
  if (n.kind === 'bookingMoved') return `${by} moved a Booking to ${to}`
  const tail = n.cause === 'unavailable' ? ', marking the session not available' : ''
  if (n.route === 'office') return `${by} returned a List to the office${tail}`
  return `${by} handed a List on to ${to}${tail}`
}

/**
 * The List or Booking a notice is about, as it was when posted: "Wed 2 Dec AM · Christchurch Eye Surgery ·
 * Mr D. Kwan" for a List, "Herewini, H. · Fri 27 Nov AM · Southern Cross" for a Booking.
 */
export function notificationDetail(n: Notification, masters: NotificationMasters): string {
  const hospital = masters.hospitals[n.hospitalId]?.name ?? 'Hospital not set'
  const when = `${shortDateLabel(n.dateISO)} ${sessionText(n.session)}`
  if (n.bookingId !== undefined && (n.kind === 'bookingMoved' || n.kind === 'officeAlert')) {
    return [n.patientName, when, hospital].filter((p): p is string => p !== undefined && p !== '').join(' · ')
  }
  const surgeon = masters.surgeons[n.surgeonId]?.name
  return [when, hospital, surgeon].filter((p): p is string => p !== undefined && p !== '').join(' · ')
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

/**
 * The out-of-hours session (catch-up Phase 32c; US-01.1.6, DM-66; D84 as the
 * owner decided it on 2026-11-10). A third kind of Slot after the PM session.
 * It is never generated: the office opens one for an anaesthetist on a day
 * (any day from today, a day the anaesthetist is on the schedule), at most one
 * a day. Once open it is a session like AM and PM: it starts Free, the
 * anaesthetist marks it available or not, the finders offer it while free, and
 * the office puts any List into it, a new one or a Draft List for that
 * evening. The office closes one that holds no List.
 *
 * Its Bookings are captured, submitted, authorised and billed as on any List
 * (no after-hours pricing). Pure: no React, store or real clock.
 */

import type { ActorRole, AuditSource, List, Session, WallTime } from './types'

/** The out-of-hours session's value in `Session`. */
export const OUT_OF_HOURS: Session = 'OOH'

/**
 * The out-of-hours session's settings. Its default times seed the schedule
 * settings (US-01.1.4: the office can change the default, and a session can
 * have its own times). Who may open one when the office is closed is still
 * open with AA (US-01.1.6).
 */
export const OUT_OF_HOURS_DESIGN = {
  defaultStart: '18:00',
  defaultEnd: '21:00',
  /** Per anaesthetist per day. */
  maxPerDay: 1,
} as const

export const OUT_OF_HOURS_DEFAULT_START: WallTime = OUT_OF_HOURS_DESIGN.defaultStart
export const OUT_OF_HOURS_DEFAULT_END: WallTime = OUT_OF_HOURS_DESIGN.defaultEnd

/** What the out-of-hours session reads as wherever AM or PM would. */
export const OUT_OF_HOURS_LABEL = 'Out-of-hours'

/** True for the out-of-hours session, or a Slot or List in it. */
export function isOutOfHours(entry: { session: Session } | undefined): boolean {
  return entry !== undefined && entry.session === OUT_OF_HOURS
}

/** A session as text: AM, PM or Out-of-hours. */
export function sessionText(entry: { session: string } | string): string {
  const session = typeof entry === 'string' ? entry : entry.session
  return session === OUT_OF_HOURS ? OUT_OF_HOURS_LABEL : session
}

/** The sessions of a day in order: AM, PM, then out-of-hours. */
export const SESSIONS_IN_ORDER: readonly Session[] = ['AM', 'PM', 'OOH']

/** Where a session sits in a day (sort by this, never by the session's text). */
export function sessionRank(session: Session): number {
  return session === 'AM' ? 0 : session === 'PM' ? 1 : 2
}

/** Sorts sessions, or anything with a session, in day order. */
export function compareSessions(a: { session: Session } | Session, b: { session: Session } | Session): number {
  return sessionRank(typeof a === 'string' ? a : a.session) - sessionRank(typeof b === 'string' ? b : b.session)
}

/**
 * THE answer to "which Lists are on this anaesthetist's day, in order": AM,
 * PM, then out-of-hours. Draft and removed Lists are never on anyone's day.
 */
export function listsOnDay<L extends List>(lists: Readonly<Record<string, L>> | readonly L[], anaesthetistId: string, dateISO: string): L[] {
  const out: L[] = []
  for (const l of Array.isArray(lists) ? lists : Object.values(lists)) {
    if (l.state === 'DRAFT' || l.removedAtISO !== undefined) continue
    if (l.anaesthetistId !== anaesthetistId || l.dateISO !== dateISO) continue
    out.push(l)
  }
  return out.sort((a, b) => compareSessions(a, b) || a.id.localeCompare(b.id))
}

export interface OpenOutOfHoursRefusal {
  code: 'officeOnly' | 'pastDate' | 'noRow' | 'alreadyOpen'
  message: string
}

/**
 * Why the office cannot open an out-of-hours session for this anaesthetist on
 * this day, or null: the office only (never a feed or the anaesthetist), today
 * or later, a day the anaesthetist is on the schedule (their AM and PM
 * sessions exist), and not already open.
 */
export function openOutOfHoursRefusal(input: {
  actor: { role: ActorRole; source: AuditSource }
  dateISO: string
  todayISO: string
  hasRow: boolean
  alreadyOpen: boolean
}): OpenOutOfHoursRefusal | null {
  if (input.actor.role !== 'office' || input.actor.source === 'integration') {
    return { code: 'officeOnly', message: 'Only the office opens an out-of-hours session.' }
  }
  if (input.dateISO < input.todayISO) return { code: 'pastDate', message: 'That day has passed: an out-of-hours session is for today or later.' }
  if (!input.hasRow) return { code: 'noRow', message: 'This anaesthetist is not on the schedule that day.' }
  if (input.alreadyOpen) return { code: 'alreadyOpen', message: 'This anaesthetist already has an out-of-hours session that day.' }
  return null
}

/**
 * Why an out-of-hours session's times are refused, or null: the start before
 * the end, and the start no earlier than the anaesthetist's PM session ends
 * that day (it is the session after PM).
 */
export function outOfHoursTimesRefusal(times: { startTime: WallTime; endTime: WallTime }, pmEnd: WallTime | undefined): string | null {
  if (!(times.startTime < times.endTime)) return 'The start time must be before the end time.'
  if (pmEnd !== undefined && times.startTime < pmEnd) return `Start the out-of-hours session at or after the PM session ends (${pmEnd}).`
  return null
}

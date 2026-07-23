/**
 * Small pure helpers for the admin day view (Phase 06). Time parsing for the
 * proportional grid, name reshaping ("Dr Melanie Souter" -> "Souter, Melanie"),
 * and the day-grid block geometry (the mockup's left=(start-7)/11 formula).
 */

import type { List, Session } from '../../domain/types'

/** Grid ruler bounds (07:00 to 18:00 = 11 hours), matching Admin Day.dc.html. */
export const RULER_START = 7
export const RULER_HOURS = 11

/** Decimal hours for a `HH:mm` wall time. */
export function hoursOf(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) + (m ?? 0) / 60
}

/** Default session span when a List carries no office-overridden times. */
export function defaultSpan(session: Session): { start: number; end: number } {
  return session === 'AM' ? { start: 7.5, end: 12.5 } : { start: 13, end: 17.5 }
}

/** A List's [start,end] in decimal hours (office times win; else session default). */
export function listSpan(list: List): { start: number; end: number } {
  const span = defaultSpan(list.session)
  const start = list.startTime !== undefined ? hoursOf(list.startTime) : span.start
  const end = list.endTime !== undefined ? hoursOf(list.endTime) : span.end
  return { start, end: end > start ? end : start + 0.5 }
}

/** Proportional left/width percentages for a [start,end] hour span. */
export function blockGeometry(start: number, end: number): { left: string; width: string } {
  const clampedStart = Math.max(RULER_START, Math.min(RULER_START + RULER_HOURS, start))
  const clampedEnd = Math.max(clampedStart, Math.min(RULER_START + RULER_HOURS, end))
  return {
    left: `${(((clampedStart - RULER_START) / RULER_HOURS) * 100).toFixed(2)}%`,
    width: `${(((clampedEnd - clampedStart) / RULER_HOURS) * 100).toFixed(2)}%`,
  }
}

/** "Dr Melanie Souter" -> "Souter, Melanie" (grid row label). */
export function surnameFirst(name: string): string {
  const parts = name.replace(/^Dr\.?\s+/i, '').trim().split(/\s+/)
  if (parts.length < 2) return parts[0] ?? name
  const surname = parts[parts.length - 1]
  const rest = parts.slice(0, -1).join(' ')
  return `${surname}, ${rest}`
}

/** Just the surname (A-Z sort key). */
export function surnameOf(name: string): string {
  const parts = name.replace(/^Dr\.?\s+/i, '').trim().split(/\s+/)
  return parts[parts.length - 1] ?? name
}

const BOOKED = new Set(['private', 'public', 'preop'])

/** True for a status carrying booking context (private / public / pre-op). */
export function isBooked(statusKey: string): boolean {
  return BOOKED.has(statusKey)
}

/**
 * Why a List block needs the amber attention flag: any reconciliation conflict,
 * or a PRIVATE List with no surgeon assigned yet (the Fitzgerald TBC case).
 * Public / pre-op sessions (acute theatre, clinics) legitimately carry no named
 * surgeon, so they never flag on that basis. An empty array means no flag.
 */
export function attentionReasons(list: List): string[] {
  const reasons = list.conflicts.map((c) => c.message)
  if (list.statusKey === 'private' && list.surgeonId === undefined) {
    reasons.push('Surgeon not yet assigned')
  }
  return reasons
}

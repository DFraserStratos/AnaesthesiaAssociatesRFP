/**
 * Shared formatting + date helpers. Pure string/date formatting only (no store,
 * no domain logic). Every range renders with the word "to", never an en/em dash
 * (CLAUDE.md copy rule); micro-caps and mono-date shapes match the mockups.
 *
 * Moved from `apps/mobile/format.ts` in Phase 05 so the web lists / dashboard /
 * detail read the same helpers (in particular `sessionTimeRange`, which surfaces
 * each List's ACTUAL office-overridable start/end times — never session
 * defaults). The Monday-anchored week helpers are new for the web dashboard's
 * week strip.
 */

import { addDays, differenceInYears, format, parseISO, startOfWeek } from 'date-fns'
import { validateNhi } from '../domain/nhi'
import type { AuditEntry, BillingRoute, List } from '../domain/types'

/** "TUE 21 JUL" — the micro-cap day header used on the Lists home. */
export function dayMicroCap(dateISO: string): string {
  return format(parseISO(dateISO), 'EEE d MMM').toUpperCase()
}

/** The "HH:MM" slice of a local-naive ISO datetime ("" when absent/short). */
export function hhmm(iso: string | undefined): string {
  return iso !== undefined && iso.length >= 16 ? iso.slice(11, 16) : ''
}

/**
 * RFP billing-route labels for the office surfaces (the authorisation review +
 * office billing setup), single-sourced so the two agree. The mobile capture
 * context (`BtmCaptureBlock`) keeps its own richer wording for the anaesthetist.
 */
export const ROUTE_LABELS: Record<BillingRoute, string> = {
  hospital: 'Contract holder',
  billableParty: 'Billable party',
  insurer: 'Insurer',
}

export function routeLabel(route: BillingRoute | undefined): string {
  return route !== undefined ? ROUTE_LABELS[route] : 'Not set'
}

/** Render an audit entry's captured value ("" when absent). */
function auditValue(value: unknown): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

/** The "before to after" change string for an audit entry (history + audit viewer). */
export function formatAuditChange(entry: AuditEntry): string {
  const before = auditValue(entry.before)
  const after = auditValue(entry.after)
  if (before !== '' && after !== '') return `${before} to ${after}`
  return after !== '' ? after : before
}

/** Day-section heading: prefixes "TODAY · " when the date is the demo today. */
export function dayHeading(dateISO: string, todayISO: string): string {
  const cap = dayMicroCap(dateISO)
  return dateISO === todayISO ? `TODAY · ${cap}` : cap
}

/** "14 MAR 1954" — the mono DOB line. */
export function formatDob(dobISO: string): string {
  return format(parseISO(dobISO), 'd MMM yyyy').toUpperCase()
}

/** Whole years between a DOB and the demo clock's today. */
export function ageYears(dobISO: string, todayISO: string): number {
  return differenceInYears(parseISO(todayISO), parseISO(dobISO))
}

/** A List's session time range, e.g. "13:00 to 17:30", or a session fallback. */
export function sessionTimeRange(list: List): string {
  if (list.startTime !== undefined && list.endTime !== undefined) {
    return `${list.startTime} to ${list.endTime}`
  }
  if (list.startTime !== undefined) return list.startTime
  return list.session === 'AM' ? 'Morning' : 'Afternoon'
}

/** Just the start time (mono), or the session word. */
export function sessionStart(list: List): string {
  return list.startTime ?? (list.session === 'AM' ? 'AM' : 'PM')
}

export interface NhiBadge {
  /** "NHI ABC1234" or "NHI pending". */
  text: string
  /** Format label for the small chip, or null when pending/unknown. */
  formatLabel: string | null
}

/** Render an NHI plus a format badge, or the provisional "NHI pending" state. */
export function nhiBadge(nhi: string | undefined): NhiBadge {
  if (nhi === undefined || nhi.trim() === '') {
    return { text: 'NHI pending', formatLabel: null }
  }
  const v = validateNhi(nhi)
  const formatLabel = v.format === 'current' ? 'Current format' : v.format === 'new' ? 'New format' : null
  return { text: `NHI ${v.normalised}`, formatLabel }
}

// ---------------------------------------------------------------------------
// Week helpers (web dashboard week strip — Monday-anchored)
// ---------------------------------------------------------------------------

/** ISO date of the Monday of the week containing `dateISO`. */
export function mondayOf(dateISO: string): string {
  return format(startOfWeek(parseISO(dateISO), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

/** The seven ISO dates Monday..Sunday for the week containing `dateISO`. */
export function weekDays(dateISO: string): string[] {
  const monday = parseISO(mondayOf(dateISO))
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'))
}

/** Shift a date by whole weeks, returned as an ISO date. */
export function shiftWeeks(dateISO: string, weeks: number): string {
  return format(addDays(parseISO(dateISO), weeks * 7), 'yyyy-MM-dd')
}

/** NZ dollars, always two decimals (one currency format across the web app). */
export function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

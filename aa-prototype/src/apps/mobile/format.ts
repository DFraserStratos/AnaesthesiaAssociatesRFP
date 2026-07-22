/**
 * Mobile-local formatting helpers. Pure string/date formatting only (no store,
 * no domain logic). Every range renders with the word "to", never an en/em dash
 * (CLAUDE.md copy rule); micro-caps and mono-date shapes match the mockups.
 */

import { differenceInYears, format, parseISO } from 'date-fns'
import { validateNhi } from '../../domain/nhi'
import type { List } from '../../domain/types'

/** "TUE 21 JUL" — the micro-cap day header used on the Lists home. */
export function dayMicroCap(dateISO: string): string {
  return format(parseISO(dateISO), 'EEE d MMM').toUpperCase()
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

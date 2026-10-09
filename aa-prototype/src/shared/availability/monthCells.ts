/**
 * A month as a Monday-first grid of dates (catch-up Phase 29): leading and
 * trailing nulls pad whole weeks. Pure; the mobile and web calendars share it.
 */

import { addMonths, format, getDay, getDaysInMonth, parseISO } from 'date-fns'
import { WEEKDAY_NAMES, WEEKDAYS } from '../../domain/availabilitySeries'

export function monthCells(monthISO: string): (string | null)[] {
  const first = parseISO(`${monthISO}-01`)
  const leading = (getDay(first) + 6) % 7
  const days = getDaysInMonth(first)
  const cells: (string | null)[] = [...Array<null>(leading).fill(null)]
  for (let d = 1; d <= days; d++) cells.push(`${monthISO}-${String(d).padStart(2, '0')}`)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** `yyyy-MM` of a date. */
export function monthOf(dateISO: string): string {
  return dateISO.slice(0, 7)
}

/** The month `delta` months from `monthISO`. */
export function shiftMonth(monthISO: string, delta: number): string {
  return format(addMonths(parseISO(`${monthISO}-01`), delta), 'yyyy-MM')
}

/** Monday-first weekday initials and short names for the calendar headers. */
export const WEEKDAY_INITIALS = WEEKDAYS.map((d) => WEEKDAY_NAMES[d].initial)
export const WEEKDAY_SHORT_NAMES = WEEKDAYS.map((d) => WEEKDAY_NAMES[d].short)

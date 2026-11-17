import { useEffect, useRef, type KeyboardEvent } from 'react'
import { addDays, addMonths, addYears, format, getDay, parseISO } from 'date-fns'
import { monthOf } from '../availability/monthCells'

/**
 * The one month-calendar keyboard model (UI unification U4, group U33; from
 * Phase 38a's MonthGrid, which the admin mini calendar had copied case for
 * case): one roving tab stop kept inside the visible month; arrows move by day
 * and week, Home and End within the week, Page Up and Page Down by month (with
 * Shift, by year). With `bounds` a move clamps to them and stops at a bound
 * (the 38a fix: the focus flag stays down, so a later month click never pulls
 * focus back into the grid). Without bounds (the admin calendar) a move runs
 * on, so paging past the horizon still reaches Admin Day's "Beyond the
 * schedule horizon".
 */

export const CALENDAR_KEYS = 'ArrowLeft ArrowRight ArrowUp ArrowDown Home End PageUp PageDown Shift+PageUp Shift+PageDown'

export interface CalendarBounds {
  firstISO: string
  lastISO: string
}

export function clampToBounds(dateISO: string, bounds: CalendarBounds | undefined): string {
  if (bounds === undefined) return dateISO
  return dateISO < bounds.firstISO ? bounds.firstISO : dateISO > bounds.lastISO ? bounds.lastISO : dateISO
}

/** The date a calendar key moves to from `dateISO`, or null for any other key. */
export function calendarKeyTarget(key: string, shiftKey: boolean, dateISO: string): string | null {
  const date = parseISO(dateISO)
  const mondayIndex = (getDay(date) + 6) % 7
  let next: Date
  switch (key) {
    case 'ArrowLeft': next = addDays(date, -1); break
    case 'ArrowRight': next = addDays(date, 1); break
    case 'ArrowUp': next = addDays(date, -7); break
    case 'ArrowDown': next = addDays(date, 7); break
    case 'Home': next = addDays(date, -mondayIndex); break
    case 'End': next = addDays(date, 6 - mondayIndex); break
    case 'PageUp': next = shiftKey ? addYears(date, -1) : addMonths(date, -1); break
    case 'PageDown': next = shiftKey ? addYears(date, 1) : addMonths(date, 1); break
    default: return null
  }
  return format(next, 'yyyy-MM-dd')
}

export function useCalendarKeys({
  monthISO,
  bounds,
  focusISO,
  onFocusMove,
  onMonthChange,
}: {
  /** The visible month, `yyyy-MM`. */
  monthISO: string
  bounds?: CalendarBounds
  /** The day holding the roving tab stop (the caller's state). */
  focusISO: string
  onFocusMove: (dateISO: string) => void
  /** A key moved past the visible month: show this month (`yyyy-MM`). */
  onMonthChange: (monthISO: string) => void
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const restoreFocus = useRef(false)

  // Keep the tab stop inside the visible month.
  const focusInMonth = monthOf(focusISO) === monthISO ? focusISO : clampToBounds(`${monthISO}-01`, bounds)

  useEffect(() => {
    if (!restoreFocus.current) return
    refs.current[focusInMonth]?.focus()
    restoreFocus.current = false
  }, [focusInMonth, monthISO])

  function moveFocus(next: string) {
    const target = clampToBounds(next, bounds)
    // At a bound the key goes nowhere: leave the flag down.
    if (target === focusInMonth) return
    restoreFocus.current = true
    onFocusMove(target)
    if (monthOf(target) !== monthISO) onMonthChange(monthOf(target))
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, dateISO: string) {
    const target = calendarKeyTarget(event.key, event.shiftKey, dateISO)
    if (target === null) return
    event.preventDefault()
    moveFocus(target)
  }

  /** Spread on each day's button. */
  function dayProps(dateISO: string) {
    return {
      ref: (el: HTMLButtonElement | null) => {
        refs.current[dateISO] = el
      },
      tabIndex: dateISO === focusInMonth ? 0 : -1,
      'aria-keyshortcuts': CALENDAR_KEYS,
      onFocus: () => onFocusMove(dateISO),
      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => onKeyDown(e, dateISO),
    }
  }

  return { focusInMonth, dayProps }
}

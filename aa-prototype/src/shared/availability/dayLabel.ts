/**
 * A calendar day as a screen reader hears it (catch-up Phase 29): the date,
 * then each session's status or List, repeating and flagged marks. Pure.
 */

import { format, parseISO } from 'date-fns'
import type { CalendarDay } from '../../store'
import { SESSIONS_IN_ORDER, sessionText } from '../../domain/outOfHours'

export function describeDayForScreenReaders(
  dateISO: string,
  day: CalendarDay | undefined,
  labelOf: (key: string) => string,
  past: boolean,
): string {
  const parts = [format(parseISO(dateISO), 'EEEE d MMMM')]
  for (const session of SESSIONS_IN_ORDER) {
    const s = day?.[session]
    if (s === undefined) continue
    const what = s.list !== undefined ? `${labelOf(s.displayKey)} List${s.list.hospitalName !== undefined ? ` at ${s.list.hospitalName}` : ''}` : labelOf(s.statusKey)
    parts.push(`${sessionText(session)} ${what}${s.series !== undefined ? ', repeating' : ''}${s.conflict ? ', with a conflict for the office to resolve' : ''}`)
  }
  if (past) parts.push('past')
  return parts.join(', ')
}

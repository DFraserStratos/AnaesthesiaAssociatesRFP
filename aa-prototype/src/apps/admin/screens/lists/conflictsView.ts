/**
 * Lists › Conflicts, the pure part (US-01.5.4, US-01.5.2): the tab's URL filters and their defaults,
 * the date range a When choice covers, and the rows grouped one per day, each day naming its closures
 * ("Forte Health closed · Theatre refit", "Public holiday · Boxing Day"). A conflict is a hospital
 * closure and nothing else, so every row here is a List at a hospital closed that day.
 */

import { conflictFromCause } from '../../../../domain/conflicts'
import { addDaysISO } from '../../../../domain/clock'
import type { AppState, ConflictRow } from '../../../../store'

export type ConflictsWhen = 'today' | 'twoWeeks' | 'canvas' | 'past'

export const CONFLICTS_WHEN_OPTIONS: readonly { value: ConflictsWhen; label: string }[] = [
  { value: 'today', label: 'From today' },
  { value: 'twoWeeks', label: 'Next 2 weeks' },
  { value: 'canvas', label: 'Whole canvas' },
  { value: 'past', label: 'Include past' },
]

/** The tab's URL state and its defaults (a default leaves the URL). `cleared` is '1' to show cleared rows. */
export const CONFLICTS_DEFAULTS = { when: 'today', hospital: '', anaesthetist: '', cleared: '' } as const

/** A When from the URL; anything unknown (a hand-typed URL) reads as the default, From today. */
export function parseConflictsWhen(value: string): ConflictsWhen {
  return CONFLICTS_WHEN_OPTIONS.some((o) => o.value === value) ? (value as ConflictsWhen) : 'today'
}

/** The dates a When covers: from today to the horizon's end, the next 14 days, the whole canvas, or every date. */
export function conflictsRange(when: ConflictsWhen, todayISO: string, horizon: { startISO: string; endISO: string }): { fromISO?: string; toISO?: string } {
  switch (when) {
    case 'twoWeeks':
      return { fromISO: todayISO, toISO: addDaysISO(todayISO, 13) }
    case 'canvas':
      return { fromISO: horizon.startISO, toISO: horizon.endISO }
    case 'past':
      return {}
    default:
      return { fromISO: todayISO, toISO: horizon.endISO }
  }
}

type ClosureMasters = Pick<AppState['masters'], 'holidays' | 'publicHolidays' | 'hospitals'>

const trimStop = (s: string) => s.trim().replace(/[.!?]$/, '')

/** What closed the hospital, in a few words: "Forte Health closed · Theatre refit" or "Public holiday · Boxing Day". */
export function closureLabel(row: Pick<ConflictRow, 'cause' | 'hospitalId'>, masters: ClosureMasters): string {
  const c = conflictFromCause(row.cause)
  if (c?.publicHolidayId !== undefined) {
    const ph = masters.publicHolidays[c.publicHolidayId]
    return ph !== undefined ? `Public holiday · ${trimStop(ph.name)}` : 'Public holiday'
  }
  const holiday = c?.holidayId !== undefined ? masters.holidays[c.holidayId] : undefined
  const hospitalId = holiday?.hospitalId ?? row.hospitalId
  const hospital = masters.hospitals[hospitalId]?.name ?? 'The hospital'
  return holiday !== undefined && trimStop(holiday.name) !== '' ? `${hospital} closed · ${trimStop(holiday.name)}` : `${hospital} closed`
}

export interface ConflictDay {
  dateISO: string
  rows: ConflictRow[]
  /** Rows not cleared. */
  open: number
  cleared: number
  /** Each distinct closure that day, in row order. */
  closures: string[]
}

/** The rows (already in date, session and roster order) as one group per day, each naming its closures. */
export function groupConflictsByDay(rows: readonly ConflictRow[], masters: ClosureMasters): ConflictDay[] {
  const days: ConflictDay[] = []
  for (const r of rows) {
    let day = days.at(-1)
    if (day === undefined || day.dateISO !== r.dateISO) {
      day = { dateISO: r.dateISO, rows: [], open: 0, cleared: 0, closures: [] }
      days.push(day)
    }
    day.rows.push(r)
    if (r.clear === undefined) day.open += 1
    else day.cleared += 1
    const label = closureLabel(r, masters)
    if (!day.closures.includes(label)) day.closures.push(label)
  }
  return days
}

/** How many distinct Lists the rows hold, open and cleared (a List with two closures counts once). */
export function conflictListCounts(rows: readonly ConflictRow[]): { open: number; cleared: number } {
  const open = new Set(rows.filter((r) => r.clear === undefined).map((r) => r.listId))
  const cleared = new Set(rows.filter((r) => r.clear !== undefined && !open.has(r.listId)).map((r) => r.listId))
  return { open: open.size, cleared: cleared.size }
}

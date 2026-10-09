/**
 * Repeating days off (catch-up Phase 29; US-01.5.3: "they can create a series
 * (recurring days off are a rule on the calendar); they can edit or delete one
 * instance of a series"). Pure: no React, no store, no clock reads; dates are
 * the demo clock's ISO dates passed in.
 *
 * A series is a rule (a status on chosen weekdays and sessions, every 1 to 4
 * weeks, from a start date, optionally until a date) plus exceptions (an
 * instance edited or deleted on its own). It WRITES its status onto the Slots;
 * nothing reads availability from it, only from Slots. A series fills only
 * sessions still at the default status and in no other series, so it never
 * silently overwrites an earlier choice.
 */

import { addDays, differenceInCalendarDays, format, getISODay, parseISO } from 'date-fns'
import { enumerateDatesISO } from './clock'
import { slotIdFor } from './slots'
import {
  defaultSlotStatusKey,
  displayStatusLabel,
  sessionsOf,
  shortDateLabel,
  statusFor,
  type SlotStatusRecords,
} from './slotStatus'
import type { AvailabilitySeries, Session, Slot, SlotStatusKey, Weekday } from './types'

export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7]
/** The one home for weekday names (Monday first): the calendars, the form and the series line read it. */
export const WEEKDAY_NAMES: Record<Weekday, { initial: string; short: string; long: string }> = {
  1: { initial: 'M', short: 'Mon', long: 'Monday' },
  2: { initial: 'T', short: 'Tue', long: 'Tuesday' },
  3: { initial: 'W', short: 'Wed', long: 'Wednesday' },
  4: { initial: 'T', short: 'Thu', long: 'Thursday' },
  5: { initial: 'F', short: 'Fri', long: 'Friday' },
  6: { initial: 'S', short: 'Sat', long: 'Saturday' },
  7: { initial: 'S', short: 'Sun', long: 'Sunday' },
}

/** ISO weekday (1 = Monday) of a date. */
export function weekdayOf(dateISO: string): Weekday {
  return getISODay(parseISO(dateISO)) as Weekday
}

/** The exception key of one instance. */
export function instanceKey(dateISO: string, session: Session): string {
  return `${dateISO}-${session}`
}

/** What a draft series carries before the store gives it an id and a creation time. */
export type AvailabilitySeriesDraft = Pick<
  AvailabilitySeries,
  'anaesthetistId' | 'statusKey' | 'sessions' | 'note' | 'weekdays' | 'everyWeeks' | 'startISO' | 'untilISO'
>

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Plain-language issues with a series draft. Empty means valid. */
export function validateSeriesDraft(
  draft: AvailabilitySeriesDraft,
  ctx: { todayISO: string; horizonEndISO: string; statuses: SlotStatusRecords; requireSettable?: boolean },
): string[] {
  const issues: string[] = []
  if (draft.weekdays.length === 0) issues.push('Choose at least one day of the week.')
  if (draft.weekdays.some((d) => !WEEKDAYS.includes(d))) issues.push('Choose days from Monday to Sunday.')
  if (![1, 2, 3, 4].includes(draft.everyWeeks)) issues.push('Repeat every 1 to 4 weeks.')
  if (!['AM', 'PM', 'both'].includes(draft.sessions)) issues.push('Choose AM, PM or both.')
  if (!ISO_DATE.test(draft.startISO)) issues.push('Choose the start date.')
  else {
    if (draft.startISO < ctx.todayISO) issues.push('Start the series today or later.')
    if (draft.startISO > ctx.horizonEndISO) {
      issues.push(`The schedule runs to ${shortDateLabel(ctx.horizonEndISO)}. Start the series by then.`)
    }
  }
  if (draft.untilISO !== undefined) {
    if (!ISO_DATE.test(draft.untilISO)) issues.push('Choose the end date, or no end date.')
    else if (ISO_DATE.test(draft.startISO) && draft.untilISO < draft.startISO) issues.push('The end date is before the start date.')
  }
  const status = statusFor(ctx.statuses, draft.statusKey)
  if (status === undefined || status.retiredAtISO !== undefined) issues.push('Choose an availability status.')
  else if ((ctx.requireSettable ?? true) && !status.anaesthetistCanSet) issues.push(`${status.label} is set by the office.`)
  else if (status.bookable) issues.push(`Repeating days off need a status that is not open for bookings, not ${status.label}.`)
  return issues
}

/** Monday of a date's week. */
function mondayOf(dateISO: string): Date {
  const d = parseISO(dateISO)
  return addDays(d, 1 - getISODay(d))
}

/** True when a date falls in one of the series' weeks (whole weeks since the start's week divisible by `everyWeeks`). */
function inSeriesWeek(series: Pick<AvailabilitySeries, 'startISO' | 'everyWeeks'>, dateISO: string): boolean {
  const weeks = Math.round(differenceInCalendarDays(mondayOf(dateISO), mondayOf(series.startISO)) / 7)
  return weeks >= 0 && weeks % series.everyWeeks === 0
}

export interface SeriesOccurrence {
  dateISO: string
  session: Session
}

/**
 * Every `{dateISO, session}` the rule produces from `fromISO` to `toISO`
 * (inclusive, clipped to the series' start and until), before exceptions.
 */
export function seriesOccurrences(
  series: Pick<AvailabilitySeries, 'startISO' | 'untilISO' | 'weekdays' | 'everyWeeks' | 'sessions'>,
  fromISO: string,
  toISO: string,
): SeriesOccurrence[] {
  const from = fromISO > series.startISO ? fromISO : series.startISO
  const to = series.untilISO !== undefined && series.untilISO < toISO ? series.untilISO : toISO
  if (to < from) return []
  const days = new Set(series.weekdays)
  return enumerateDatesISO(from, to)
    .filter((d) => days.has(weekdayOf(d)) && inSeriesWeek(series, d))
    .flatMap((dateISO) => sessionsOf(series.sessions).map((session) => ({ dateISO, session })))
}

export interface SeriesInstance extends SeriesOccurrence {
  statusKey: SlotStatusKey
  note?: string
  /** True when this instance was changed on its own. */
  edited: boolean
}

/** The occurrences with exceptions applied: a deleted instance is dropped, an edited one carries its own status and note. */
export function seriesInstances(series: AvailabilitySeries, fromISO: string, toISO: string): SeriesInstance[] {
  const out: SeriesInstance[] = []
  for (const occ of seriesOccurrences(series, fromISO, toISO)) {
    const exception = series.exceptions[instanceKey(occ.dateISO, occ.session)]
    if (exception?.kind === 'deleted') continue
    if (exception?.kind === 'edited') {
      out.push({ ...occ, statusKey: exception.statusKey, ...(exception.note !== undefined ? { note: exception.note } : {}), edited: true })
    } else {
      out.push({ ...occ, statusKey: series.statusKey, ...(series.note !== undefined ? { note: series.note } : {}), edited: false })
    }
  }
  return out
}

export interface PlannedSeriesWrite {
  /** Sessions the series sets. */
  set: (SeriesInstance & { slotId: string })[]
  /** Sessions already set to something else (a one-off day off, seeded leave, another series): left as they are. */
  leftAsIs: string[]
  /** Occurrences with no session (before the start date, past the horizon). */
  skipped: number
}

/**
 * Which Slots a series write sets, and which it leaves (US-01.5.3). A series
 * fills only a Slot at the default status and in no other series; anything the
 * anaesthetist already set is counted and left as it is.
 */
export function planSeriesWrite(
  series: AvailabilitySeries,
  slots: Readonly<Record<string, Pick<Slot, 'id' | 'status' | 'seriesId'>>>,
  window: { fromISO: string; toISO: string },
  statuses: SlotStatusRecords,
): PlannedSeriesWrite {
  const defaultKey = defaultSlotStatusKey(statuses)
  const plan: PlannedSeriesWrite = { set: [], leftAsIs: [], skipped: 0 }
  for (const instance of seriesInstances(series, window.fromISO, window.toISO)) {
    const slotId = slotIdFor(series.anaesthetistId, instance.dateISO, instance.session)
    const slot = slots[slotId]
    if (slot === undefined) {
      plan.skipped += 1
      continue
    }
    const ownedElsewhere = slot.seriesId !== undefined && slot.seriesId !== series.id
    if (slot.status !== defaultKey || ownedElsewhere) {
      if (slot.seriesId !== series.id) plan.leftAsIs.push(slotId)
      continue
    }
    plan.set.push({ ...instance, slotId })
  }
  return plan
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

/**
 * One line for the UI, for example "Unavailable, Friday PM, every 2 weeks,
 * until 25 Sep". No dashes, no "slot".
 */
export function describeSeries(
  series: Pick<AvailabilitySeries, 'weekdays' | 'everyWeeks' | 'sessions' | 'untilISO'>,
  statusLabel: string,
): string {
  const days = [...series.weekdays].sort((a, b) => a - b)
  const first = days[0]
  const dayText = days.length === 1 && first !== undefined ? WEEKDAY_NAMES[first].long : joinWords(days.map((d) => WEEKDAY_NAMES[d].short))
  const when = series.sessions === 'both' ? `${dayText}, all day` : `${dayText} ${series.sessions}`
  const every = series.everyWeeks === 1 ? 'every week' : `every ${series.everyWeeks} weeks`
  const until = series.untilISO === undefined ? 'no end date' : `until ${format(parseISO(series.untilISO), 'd MMM')}`
  return `${statusLabel}, ${when}, ${every}, ${until}`
}

/** A series' line with its status's long label from the master ("Unknown status" for an unknown ID): the one wording every screen and the audit use. */
export function seriesLine(
  series: Pick<AvailabilitySeries, 'weekdays' | 'everyWeeks' | 'sessions' | 'untilISO' | 'statusKey'>,
  statuses: SlotStatusRecords,
): string {
  return describeSeries(series, displayStatusLabel(series.statusKey, statuses, true))
}

/** A series still running on `todayISO`: not deleted, and not past its until date. */
export function isSeriesActive(series: Pick<AvailabilitySeries, 'endedAtISO' | 'untilISO'>, todayISO: string): boolean {
  return series.endedAtISO === undefined && (series.untilISO === undefined || series.untilISO >= todayISO)
}

/** The active series using a status (its own or an edited instance's), for the retire guard. */
export function activeSeriesUsing(series: Readonly<Record<string, AvailabilitySeries>>, statusKey: SlotStatusKey, todayISO: string): number {
  return Object.values(series).filter(
    (s) =>
      isSeriesActive(s, todayISO) &&
      (s.statusKey === statusKey || Object.values(s.exceptions).some((e) => e.kind === 'edited' && e.statusKey === statusKey)),
  ).length
}

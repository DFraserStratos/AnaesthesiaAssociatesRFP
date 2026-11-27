/**
 * A person's usual week (the profile pages' "Usual week" card;
 * `docs/explorations/profile-ideas.html` tab 3): their live recurring bookings
 * laid on a Monday to Friday by AM and PM grid, any weekend ones beside it,
 * and the retired or ended ones for the list. On the anaesthetist page it also
 * carries their weekly Public sessions, which since catch-up Phase 32d (D86)
 * are not recurring bookings but a Public series on their availability
 * (`availabilitySeries.ts`, `seed/publicSessions.ts`).
 *
 * Pure: no React, no store, no clock reads; today's date is passed in.
 */

import { format, parseISO } from 'date-fns'
import { isSeriesActive, WEEKDAY_NAMES } from './availabilitySeries'
import { shortDay } from './dateText'
import { SEED_STATUS } from './slotStatus'
import type { AvailabilitySeries, IsoDate, RecurringBooking, Session, SlotStatusKey, Weekday } from './types'

export type UsualWeekPerspective = 'anaesthetist' | 'surgeon'

/** The five grid days, Monday first, in `RecurringBooking.dayOfWeek` numbering (1 = Monday). */
export const USUAL_WEEK_DAYS = [1, 2, 3, 4, 5] as const
export type UsualWeekDay = (typeof USUAL_WEEK_DAYS)[number]
export type UsualWeekSession = 'AM' | 'PM'
export const USUAL_WEEK_SESSIONS: readonly UsualWeekSession[] = ['AM', 'PM']

/** One half-day of an anaesthetist's weekly Public series. */
export interface UsualWeekPublicSession {
  seriesId: string
  /** `RecurringBooking.dayOfWeek` numbering (0 = Sunday ... 6 = Saturday), so it sits beside the recurring bookings. */
  dayOfWeek: RecurringBooking['dayOfWeek']
  session: Session
  statusKey: SlotStatusKey
  note?: string
  everyWeeks: AvailabilitySeries['everyWeeks']
}

export interface UsualWeekCell {
  dayOfWeek: UsualWeekDay
  session: UsualWeekSession
  /** The live recurring bookings on this half-day (a surgeon's can hold several, one per anaesthetist). */
  recurringBookings: RecurringBooking[]
  /** The anaesthetist's Public session on this half-day, if any (never on the surgeon perspective). */
  publicSession?: UsualWeekPublicSession
}

export interface UsualWeek {
  /** Rows AM then PM, each Monday to Friday. */
  grid: Record<UsualWeekSession, UsualWeekCell[]>
  /** Live recurring bookings off the grid: on a Saturday or Sunday (or out of hours), Monday first. */
  offGrid: RecurringBooking[]
  /** Public sessions off the grid (anaesthetist only). */
  offGridPublic: UsualWeekPublicSession[]
  /** Every live recurring booking (not retired, not past its end date), Monday first. */
  live: RecurringBooking[]
  /** Retired, or past their end date: the list's dimmed foot rows, Monday first. */
  ended: RecurringBooking[]
  /** Every Public session half-day (anaesthetist only), Monday first. */
  publicSessions: UsualWeekPublicSession[]
  /** The distinct other people across the live recurring bookings (surgeons for an anaesthetist, anaesthetists for a surgeon). */
  otherPeople: number
}

/** A recurring booking still running on `todayISO`: not retired, and not past its end date. A future start is live. */
export function isRecurringBookingLive(rb: Pick<RecurringBooking, 'retiredAtISO' | 'effectiveToISO'>, todayISO: IsoDate): boolean {
  return rb.retiredAtISO === undefined && (rb.effectiveToISO === undefined || rb.effectiveToISO >= todayISO)
}

/** Monday = 0 ... Sunday = 6, for sorting a week Monday first. */
function mondayFirst(dayOfWeek: number): number {
  return (dayOfWeek + 6) % 7
}

const SESSION_ORDER: Record<Session, number> = { AM: 0, PM: 1, OOH: 2 }

function byWeekPosition(a: Pick<RecurringBooking, 'dayOfWeek' | 'session' | 'id'>, b: Pick<RecurringBooking, 'dayOfWeek' | 'session' | 'id'>): number {
  return mondayFirst(a.dayOfWeek) - mondayFirst(b.dayOfWeek) || SESSION_ORDER[a.session] - SESSION_ORDER[b.session] || a.id.localeCompare(b.id)
}

/** ISO weekday (1 = Monday ... 7 = Sunday) to `RecurringBooking.dayOfWeek` (0 = Sunday). */
function fromIsoWeekday(day: Weekday): RecurringBooking['dayOfWeek'] {
  return (day % 7) as RecurringBooking['dayOfWeek']
}

function onGrid(entry: { dayOfWeek: number; session: Session }): boolean {
  return entry.dayOfWeek >= 1 && entry.dayOfWeek <= 5 && (entry.session === 'AM' || entry.session === 'PM')
}

/**
 * The anaesthetist's weekly Public sessions: every half-day of their active
 * series whose status is Public, one entry per weekday and session.
 */
export function publicSessionsOf(
  series: Readonly<Record<string, AvailabilitySeries>>,
  anaesthetistId: string,
  todayISO: IsoDate,
): UsualWeekPublicSession[] {
  const out: UsualWeekPublicSession[] = []
  for (const s of Object.values(series)) {
    if (s.anaesthetistId !== anaesthetistId || s.statusKey !== SEED_STATUS.publicHospital || !isSeriesActive(s, todayISO)) continue
    const sessions: Session[] = s.sessions === 'both' ? ['AM', 'PM'] : [s.sessions]
    for (const day of s.weekdays) {
      for (const session of sessions) {
        out.push({
          seriesId: s.id,
          dayOfWeek: fromIsoWeekday(day),
          session,
          statusKey: s.statusKey,
          ...(s.note !== undefined ? { note: s.note } : {}),
          everyWeeks: s.everyWeeks,
        })
      }
    }
  }
  return out.sort((a, b) => byWeekPosition({ ...a, id: a.seriesId }, { ...b, id: b.seriesId }))
}

export function usualWeek(input: {
  recurringBookings: Readonly<Record<string, RecurringBooking>>
  /** The availability series, read for an anaesthetist's Public sessions; ignored for a surgeon. */
  availabilitySeries?: Readonly<Record<string, AvailabilitySeries>>
  perspective: UsualWeekPerspective
  subjectId: string
  todayISO: IsoDate
}): UsualWeek {
  const { perspective, subjectId, todayISO } = input
  const mine = Object.values(input.recurringBookings)
    .filter((rb) => (perspective === 'anaesthetist' ? rb.anaesthetistId : rb.surgeonId) === subjectId)
    .sort(byWeekPosition)
  const live = mine.filter((rb) => isRecurringBookingLive(rb, todayISO))
  const ended = mine.filter((rb) => !isRecurringBookingLive(rb, todayISO))
  const publicSessions = perspective === 'anaesthetist' && input.availabilitySeries !== undefined
    ? publicSessionsOf(input.availabilitySeries, subjectId, todayISO)
    : []

  const row = (session: UsualWeekSession): UsualWeekCell[] =>
    USUAL_WEEK_DAYS.map((dayOfWeek) => {
      const pub = publicSessions.find((p) => p.dayOfWeek === dayOfWeek && p.session === session)
      return {
        dayOfWeek,
        session,
        recurringBookings: live.filter((rb) => rb.dayOfWeek === dayOfWeek && rb.session === session),
        ...(pub !== undefined ? { publicSession: pub } : {}),
      }
    })

  const other = (rb: RecurringBooking) => (perspective === 'anaesthetist' ? rb.surgeonId : rb.anaesthetistId)
  return {
    grid: { AM: row('AM'), PM: row('PM') },
    offGrid: live.filter((rb) => !onGrid(rb)),
    offGridPublic: publicSessions.filter((p) => !onGrid(p)),
    live,
    ended,
    publicSessions,
    otherPeople: new Set(live.map(other)).size,
  }
}

// ---------------------------------------------------------------------------
// Words (one home, so the grid and the list agree)
// ---------------------------------------------------------------------------

/** ISO weekday names, re-keyed to `RecurringBooking.dayOfWeek`. */
function dayNames(dayOfWeek: number) {
  return WEEKDAY_NAMES[(dayOfWeek === 0 ? 7 : dayOfWeek) as Weekday]
}

/** "Mon". */
export function weekdayShort(dayOfWeek: number): string {
  return dayNames(dayOfWeek).short
}

/** "Mondays": the list's Day column. */
export function weekdayPlural(dayOfWeek: number): string {
  return `${dayNames(dayOfWeek).long}s`
}

/**
 * The note a live recurring booking's cell carries about when it runs:
 * "Until Tue 15 Dec", "From Mon 7 Dec", both joined, or undefined when it is
 * simply ongoing.
 */
export function runsNote(rb: Pick<RecurringBooking, 'effectiveFromISO' | 'effectiveToISO'>, todayISO: IsoDate): string | undefined {
  const from = rb.effectiveFromISO !== undefined && rb.effectiveFromISO > todayISO ? `From ${shortDay(rb.effectiveFromISO)}` : undefined
  const until = rb.effectiveToISO !== undefined ? shortDay(rb.effectiveToISO) : undefined
  if (from !== undefined && until !== undefined) return `${from} until ${until}`
  if (from !== undefined) return from
  if (until !== undefined) return `Until ${until}`
  return undefined
}

/** The list's Runs column: "Ongoing", "Until Tue 15 Dec", "Retired 2 Nov", "Ended Tue 10 Nov". */
export function runsText(rb: Pick<RecurringBooking, 'effectiveFromISO' | 'effectiveToISO' | 'retiredAtISO'>, todayISO: IsoDate): string {
  if (rb.retiredAtISO !== undefined) return `Retired ${format(parseISO(rb.retiredAtISO.slice(0, 10)), 'd MMM')}`
  if (rb.effectiveToISO !== undefined && rb.effectiveToISO < todayISO) return `Ended ${shortDay(rb.effectiveToISO)}`
  return runsNote(rb, todayISO) ?? 'Ongoing'
}

/** "13:00 to 17:00" when the recurring booking sets its own times. */
export function timesText(rb: Pick<RecurringBooking, 'startTime' | 'endTime'>): string | undefined {
  return rb.startTime !== undefined && rb.endTime !== undefined ? `${rb.startTime} to ${rb.endTime}` : undefined
}

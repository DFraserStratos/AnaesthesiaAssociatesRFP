/**
 * Date, time and count text: one home (UI unification U1, README group U28,
 * question 24). Pure: it imports `date-fns` and nothing from the app, so the
 * domain-purity test allows it and the PWA ships it. `shared/format.ts`
 * re-exports every helper here, so screens keep importing from there.
 *
 * Shapes (question 24): a range in the apps reads "Tue 21 Jul to Fri 24 Jul";
 * a range for money and contracts reads "1 Oct 2026 to 1 Nov 2026"; a
 * timestamp reads "Tue 21 Jul, 08:00". Every range uses the word "to", never
 * an en or em dash (CLAUDE.md copy rule); micro-caps and mono-date shapes
 * match the mockups.
 */

import { addDays, format, parseISO, startOfWeek } from 'date-fns'

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

/** "TUE 21 JUL": the micro-cap day header used on the Lists home. */
export function dayMicroCap(dateISO: string): string {
  return format(parseISO(dateISO), 'EEE d MMM').toUpperCase()
}

/** "Fri 13 Mar 2026": a day with its year, for past work (catch-up Phase 38a). */
export function dayWithYear(dateISO: string): string {
  return format(parseISO(dateISO.slice(0, 10)), 'EEE d MMM yyyy')
}

/** "Friday 13 March 2026": the spoken form, for accessible labels. */
export function longDay(dateISO: string): string {
  return format(parseISO(dateISO.slice(0, 10)), 'EEEE d MMMM yyyy')
}

/** "Tuesday 21 July": the spoken day without its year, for headings and labels inside the current year. */
export function longDayNoYear(dateISO: string): string {
  return format(parseISO(dateISO.slice(0, 10)), 'EEEE d MMMM')
}

/** "Tue 21 Jul": the short day used beside warnings, drawers and clearances. */
export function shortDay(dateISO: string): string {
  return format(parseISO(dateISO.slice(0, 10)), 'EEE d MMM')
}

/** "1 Oct 2026": a plain date with its year, for money and contracts. */
export function plainDate(dateISO: string): string {
  return format(parseISO(dateISO.slice(0, 10)), 'd MMM yyyy')
}

/** Day-section heading: prefixes "TODAY · " when the date is the demo today. */
export function dayHeading(dateISO: string, todayISO: string): string {
  const cap = dayMicroCap(dateISO)
  return dateISO === todayISO ? `TODAY · ${cap}` : cap
}

/** "14 MAR 1954": the mono DOB line. */
export function formatDob(dobISO: string): string {
  // A record made from a row with no date of birth (a rooms' PDF, HL7) holds '' (catch-up Phase 40).
  if (dobISO.trim() === '') return DOB_NOT_SUPPLIED
  return format(parseISO(dobISO), 'd MMM yyyy').toUpperCase()
}

/** What a missing date of birth reads as. */
export const DOB_NOT_SUPPLIED = 'Not supplied'

/** A received text's day, as its meta line shows it ("Mon 20 Jul"). */
export function receivedDay(iso: string): string {
  return shortDay(iso.slice(0, 10))
}

/**
 * Two days as one range (question 24): "Tue 21 Jul to Fri 24 Jul" in the apps,
 * or with `{ withYear: true }` "1 Oct 2026 to 1 Nov 2026" for money and
 * contracts. The same day on both ends reads as that one day.
 */
export function dateRange(fromISO: string, toISO: string, options: { withYear?: boolean } = {}): string {
  const day = options.withYear === true ? plainDate : shortDay
  return fromISO.slice(0, 10) === toISO.slice(0, 10) ? day(fromISO) : `${day(fromISO)} to ${day(toISO)}`
}

// ---------------------------------------------------------------------------
// Times
// ---------------------------------------------------------------------------

/**
 * "HH:MM". From a local-naive ISO datetime, its time slice ("" when absent or
 * short); from whole minutes since midnight, zero-padded ("08:05" for 485).
 * The status bar's unpadded "h:mm" is its own (`store/selectors.ts`).
 */
export function hhmm(isoOrMinutes: string | number | undefined): string {
  if (typeof isoOrMinutes === 'number') {
    const m = Math.floor(isoOrMinutes)
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  }
  return isoOrMinutes !== undefined && isoOrMinutes.length >= 16 ? isoOrMinutes.slice(11, 16) : ''
}

/** "TUE 21 JUL · 08:00" for a local-naive ISO datetime ("·" when absent). */
export function dateTimeMicroCap(iso: string | undefined): string {
  return iso !== undefined && iso.length >= 16 ? `${dayMicroCap(iso.slice(0, 10))} · ${hhmm(iso)}` : '·'
}

/**
 * A timestamp (question 24): "Tue 21 Jul, 08:00", or "21 Jul, 08:00" with
 * `{ weekday: false }`. A date with no time reads as the day alone.
 */
export function stampText(iso: string, options: { weekday?: boolean } = {}): string {
  const day = format(parseISO(iso.slice(0, 10)), options.weekday === false ? 'd MMM' : 'EEE d MMM')
  const time = hhmm(iso)
  return time === '' ? day : `${day}, ${time}`
}

/**
 * A session's time range, e.g. "13:00 to 17:30" (catch-up Phase 28: the times
 * are the Slot's, from `effectiveSlotTimes`; the default comes from the
 * schedule settings, never a fallback here).
 */
export function slotTimeRange(times: { startTime: string; endTime: string }): string {
  return `${times.startTime} to ${times.endTime}`
}

// ---------------------------------------------------------------------------
// Week helpers (web dashboard week strip, Monday-anchored)
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

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

/** The word for a count: `one` for exactly 1, else `many` (default `one` + "s"). */
export function pluralWord(n: number, one: string, many: string = `${one}s`): string {
  return n === 1 ? one : many
}

/** A count with its word: "1 session", "3 sessions", "2 Lists". */
export function plural(n: number, one: string, many?: string): string {
  return `${n} ${pluralWord(n, one, many)}`
}

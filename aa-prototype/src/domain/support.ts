/**
 * Support: the help line for app users and product support for AA (catch-up
 * Phase 43b; US-15.0.8, US-15.0.9; OQ-137 answered as D83, OQ-141 open as D87).
 *
 * The one place for Stratos' standard support terms: the hours, the phone
 * line, which public holidays close the line, the Christmas window and both
 * response tables. The panel, the response table, the request form, the store
 * and the demo triggers read `SUPPORT_CONFIG`; no hour is typed anywhere else.
 *
 * Every rule is pure over explicit values: the demo clock's date and minutes
 * and 42's master public-holiday calendar come in as arguments. No React, no
 * store, no `Date.now()` or `new Date()`; date arithmetic is on ISO strings.
 */

import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { addDaysISO } from './clock'
import { weekdayOf } from './availabilitySeries'
import type { PublicHoliday, SupportChannel, SupportCover, SupportPriority, SupportTicket, SupportTicketKind } from './types'

/** A time of day as `HH:MM`, 24-hour. */
type HourMinute = `${number}:${number}`

export interface SupportHoursRule {
  /** ISO weekdays the line is staffed (1 Monday to 7 Sunday). */
  days: readonly number[]
  open: HourMinute
  close: HourMinute
}

/** How a priority's response time is counted (business time unless it says otherwise). */
export type ResponseRule =
  | { kind: 'businessMinutes'; minutes: number; label: string }
  | { kind: 'sameBusinessDay'; label: string }
  | { kind: 'businessDays'; days: number; label: string }
  | { kind: 'agreed'; label: string }

/**
 * Stratos' standard hours for supported bespoke systems (OQ-137, D83):
 * 8:30am to 5:00pm NZT, Monday to Friday. Both channels read this one value.
 */
const STRATOS_HOURS: SupportHoursRule = { days: [1, 2, 3, 4, 5], open: '08:30', close: '17:00' }

export const SUPPORT_CONFIG = {
  /** A fictional 0800 number: the real line is the real service's. */
  phone: '0800 787 286',
  /**
   * One value per channel, both reading `STRATOS_HOURS` (OQ-141, D87 default):
   * an 8:00am start on one channel is a one-line change here.
   */
  hours: {
    helpLine: { ...STRATOS_HOURS },
    productSupport: { ...STRATOS_HOURS },
  } satisfies Record<SupportChannel, SupportHoursRule>,
  /** Which of 42's public holidays close the line: the national ones (a regional anniversary is a working day). */
  holidayKinds: ['national'] as readonly PublicHoliday['kind'][],
  /** Christmas and New Year: limited, best-effort cover, product support only. Month-day, inclusive. */
  christmas: { from: '12-24', to: '01-06', channels: ['productSupport'] as readonly SupportChannel[] },
  /** The two response tables, in the stories' words. Never crossed: help-line P3 is 4 hours, product support's 3 business days. */
  response: {
    helpLine: {
      P1: { kind: 'businessMinutes', minutes: 60, label: '1 hour' },
      P2: { kind: 'sameBusinessDay', label: 'Same business day' },
      P3: { kind: 'businessMinutes', minutes: 240, label: '4 hours' },
      P4: { kind: 'agreed', label: 'Scheduled at a mutually agreed time' },
    },
    productSupport: {
      P1: { kind: 'businessMinutes', minutes: 60, label: '1 hour' },
      P2: { kind: 'sameBusinessDay', label: 'Same business day' },
      P3: { kind: 'businessDays', days: 3, label: '3 business days' },
      P4: { kind: 'agreed', label: 'Scheduled at a mutually agreed time' },
    },
  } satisfies Record<SupportChannel, Record<SupportPriority, ResponseRule>>,
  /** After an out-of-hours security breach or platform outage: due within the hour on the plain clock. */
  afterHoursUrgentMinutes: 60,
} as const

/** What each priority means, from the stories' tables (shared by both channels). */
export const PRIORITY_MEANING: Readonly<Record<SupportPriority, string>> = {
  P1: 'System down with widespread business impact',
  P2: 'High-priority issue significantly affecting business operations, with no viable workaround',
  P3: 'Standard issue or request with limited business impact, or a reasonable workaround',
  P4: 'Low-priority issue, cosmetic defect, minor enhancement or planned task',
}

export const SUPPORT_PRIORITIES: readonly SupportPriority[] = ['P1', 'P2', 'P3', 'P4']

/** Product support's ticket kinds; a help-line ticket is a `request`. */
export const PRODUCT_KINDS: readonly SupportTicketKind[] = ['incident', 'fix', 'change', 'newFeature']

/** Product support's cover outside business hours (US-15.0.9), in the story's words. */
export const PRODUCT_SUPPORT_OUT_OF_HOURS: readonly { when: string; cover: string }[] = [
  { when: 'After hours', cover: 'Best effort, not guaranteed' },
  { when: 'Public holidays', cover: "Call-out only, with AA's approval" },
  { when: 'Christmas and New Year', cover: 'Limited, best-effort cover' },
]

/**
 * Our readings of the terms, to confirm with AA (Before you start item 4 of
 * the phase doc). Shown once in the panel under one caption.
 */
export const SUPPORT_READINGS_CAPTION = 'Our reading, to confirm with AA'

/** The readings, worded from `SUPPORT_CONFIG`, so a config change (OQ-141's 8:00am start) changes them too. */
export function supportReadings(): string[] {
  const open = timeOfDayText(toMinutes(SUPPORT_CONFIG.hours.helpLine.open))
  const productOpen = timeOfDayText(toMinutes(SUPPORT_CONFIG.hours.productSupport.open))
  const opens = open === productOpen ? `Both channels open at ${open}` : `The help line opens at ${open} and product support at ${productOpen}`
  const p3 = SUPPORT_CONFIG.response.productSupport.P3
  const p3Days = p3.kind === 'businessDays' ? p3.days : 0
  const { from, to } = SUPPORT_CONFIG.christmas
  return [
    `${opens}; whether AA needs cover from 8:00am is still to be agreed.`,
    "New Zealand public holidays are the national ones in AA's holiday calendar; a regional anniversary day is a working day.",
    `Response times run in business hours and roll into the next business day: P1 and the help line's P3 in business hours, P2 by the close of that business day, product support's P3 at the same time ${p3Days} business days on, and P4 with no set time.`,
    `Out of hours on the help line, a security breach or the platform offline is P1, due within ${SUPPORT_CONFIG.afterHoursUrgentMinutes} minutes on the plain clock; anything else is logged and picked up at the next opening, with no respond-by time.`,
    `Christmas and New Year cover runs ${monthDayText(from)} to ${monthDayText(to)}, on product support; a response that would fall inside it is best effort, with no set time.`,
  ]
}

// ---------------------------------------------------------------------------
// Clock arithmetic on ISO strings
// ---------------------------------------------------------------------------

function toMinutes(hm: HourMinute): number {
  const [h, m] = hm.split(':').map(Number) as [number, number]
  return h * 60 + m
}

/** `YYYY-MM-DDTHH:MM:00` from a date and minutes since midnight. */
export function supportISO(dateISO: string, minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${dateISO}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

/** The date and minutes since midnight of a `YYYY-MM-DDTHH:MM` stamp. */
export function splitISO(iso: string): { dateISO: string; minutes: number } {
  const dateISO = iso.slice(0, 10)
  const minutes = Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16))
  return { dateISO, minutes }
}

/** A public holiday of a kind that closes the support line (the national ones). The demo triggers read it too. */
export function closesSupport(holiday: Pick<PublicHoliday, 'kind'>): boolean {
  return SUPPORT_CONFIG.holidayKinds.includes(holiday.kind)
}

function isClosingHoliday(dateISO: string, publicHolidays: readonly PublicHoliday[]): PublicHoliday | undefined {
  return publicHolidays.find((p) => p.dateISO === dateISO && closesSupport(p))
}

/** A business day for a channel: a staffed weekday that is not a closing public holiday. */
function isBusinessDay(channel: SupportChannel, dateISO: string, publicHolidays: readonly PublicHoliday[]): boolean {
  return SUPPORT_CONFIG.hours[channel].days.includes(weekdayOf(dateISO)) && isClosingHoliday(dateISO, publicHolidays) === undefined
}

function inChristmasWindow(dateISO: string): boolean {
  const md = dateISO.slice(5)
  const { from, to } = SUPPORT_CONFIG.christmas
  // The window wraps the year end (24 December to 6 January); a window inside one year compares plainly.
  return from <= to ? md >= from && md <= to : md >= from || md <= to
}

// ---------------------------------------------------------------------------
// Cover
// ---------------------------------------------------------------------------

export interface CoverAt {
  kind: SupportCover
  /** True when an ordinary request raised now is answered within its priority's time. */
  answered: boolean
  /** The public holiday closing the line, when `kind` is `publicHoliday`. */
  holidayName?: string
}

/**
 * The cover a channel gives at a moment. A closing public holiday wins over
 * everything; then a business hour inside the Christmas window, on a channel
 * that has limited cover, reads `christmas`; otherwise in or after hours.
 */
export function coverAt(channel: SupportChannel, dateISO: string, minutes: number, publicHolidays: readonly PublicHoliday[]): CoverAt {
  const holiday = isClosingHoliday(dateISO, publicHolidays)
  if (holiday !== undefined) return { kind: 'publicHoliday', answered: false, holidayName: holiday.name }
  const hours = SUPPORT_CONFIG.hours[channel]
  const inHours = hours.days.includes(weekdayOf(dateISO)) && minutes >= toMinutes(hours.open) && minutes < toMinutes(hours.close)
  if (!inHours) return { kind: 'afterHours', answered: false }
  if (SUPPORT_CONFIG.christmas.channels.includes(channel) && inChristmasWindow(dateISO)) return { kind: 'christmas', answered: false }
  return { kind: 'inHours', answered: true }
}

/** The line is staffed (in hours, or a limited Christmas business hour). */
export function isOpen(cover: CoverAt): boolean {
  return cover.kind === 'inHours' || cover.kind === 'christmas'
}

/**
 * The next time a channel opens after a moment it is closed: the opening hour
 * of the next business day (today's, when before it). Null when open now.
 */
export function nextOpening(
  channel: SupportChannel,
  dateISO: string,
  minutes: number,
  publicHolidays: readonly PublicHoliday[],
): { dateISO: string; minutes: number } | null {
  if (isOpen(coverAt(channel, dateISO, minutes, publicHolidays))) return null
  const open = toMinutes(SUPPORT_CONFIG.hours[channel].open)
  let day = dateISO
  if (!(isBusinessDay(channel, day, publicHolidays) && minutes < open)) day = addDaysISO(day, 1)
  for (let i = 0; i < 60 && !isBusinessDay(channel, day, publicHolidays); i++) day = addDaysISO(day, 1)
  return { dateISO: day, minutes: open }
}

// ---------------------------------------------------------------------------
// Response times
// ---------------------------------------------------------------------------

/** Add business minutes from a moment inside business hours, rolling into the next business day. */
function addBusinessMinutes(channel: SupportChannel, dateISO: string, minutes: number, add: number, publicHolidays: readonly PublicHoliday[]): string {
  const open = toMinutes(SUPPORT_CONFIG.hours[channel].open)
  const close = toMinutes(SUPPORT_CONFIG.hours[channel].close)
  let day = dateISO
  let at = minutes
  let left = add
  for (let i = 0; i < 400; i++) {
    const room = close - at
    if (left <= room) return supportISO(day, at + left)
    left -= room
    day = addDaysISO(day, 1)
    while (!isBusinessDay(channel, day, publicHolidays)) day = addDaysISO(day, 1)
    at = open
  }
  return supportISO(day, at)
}

/**
 * When a ticket must be responded to, or null where none is guaranteed (P4, a
 * ticket raised out of hours, a limited Christmas hour, a public-holiday
 * call-out). A help-line ticket out of hours for a security breach or the
 * platform offline is P1 and due within the hour on the plain clock.
 */
export function respondBy(
  channel: SupportChannel,
  priority: SupportPriority,
  raisedAtISO: string,
  publicHolidays: readonly PublicHoliday[],
  reason?: SupportTicket['reason'],
): string | null {
  const { dateISO, minutes } = splitISO(raisedAtISO)
  const cover = coverAt(channel, dateISO, minutes, publicHolidays)
  if (cover.kind !== 'inHours') {
    if (channel === 'helpLine' && reason !== undefined) {
      const due = minutes + SUPPORT_CONFIG.afterHoursUrgentMinutes
      return due < 24 * 60 ? supportISO(dateISO, due) : supportISO(addDaysISO(dateISO, 1), due - 24 * 60)
    }
    return null
  }
  const due = inHoursDue(channel, priority, dateISO, minutes, publicHolidays)
  // A response that would fall inside the limited Christmas cover is best effort, with no set time.
  if (due !== null && SUPPORT_CONFIG.christmas.channels.includes(channel) && inChristmasWindow(due.slice(0, 10))) return null
  return due
}

function inHoursDue(channel: SupportChannel, priority: SupportPriority, dateISO: string, minutes: number, publicHolidays: readonly PublicHoliday[]): string | null {
  const rule: ResponseRule = SUPPORT_CONFIG.response[channel][priority]
  switch (rule.kind) {
    case 'businessMinutes':
      return addBusinessMinutes(channel, dateISO, minutes, rule.minutes, publicHolidays)
    case 'sameBusinessDay':
      return supportISO(dateISO, toMinutes(SUPPORT_CONFIG.hours[channel].close))
    case 'businessDays': {
      let day = dateISO
      for (let n = 0; n < rule.days; n++) {
        day = addDaysISO(day, 1)
        while (!isBusinessDay(channel, day, publicHolidays)) day = addDaysISO(day, 1)
      }
      return supportISO(day, minutes)
    }
    case 'agreed':
      return null
  }
}

/** A Logged ticket past its respond-by time. Derived, never stored. */
export function isOverdue(ticket: Pick<SupportTicket, 'status' | 'respondByISO'>, clockISO: string): boolean {
  return ticket.status === 'logged' && ticket.respondByISO !== undefined && clockISO > ticket.respondByISO
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

const WEEKDAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

/** `24 December` from a month-day `12-24`. */
function monthDayText(md: string): string {
  return format(parseISO(`2026-${md}`), 'd MMMM')
}

/** `8:30am`, `5:00pm`. */
export function timeOfDayText(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

function dayRangeText(days: readonly number[]): string {
  const sorted = [...days].sort((a, b) => a - b)
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1]! + 1)
  if (contiguous && sorted.length > 1) return `${WEEKDAY_NAMES[sorted[0]!]} to ${WEEKDAY_NAMES[sorted[sorted.length - 1]!]}`
  return sorted.map((d) => WEEKDAY_NAMES[d]).join(', ')
}

/** "8:30am to 5:00pm NZT, Monday to Friday, excluding New Zealand public holidays", from the config. */
export function hoursText(channel: SupportChannel): string {
  const h = SUPPORT_CONFIG.hours[channel]
  return `${timeOfDayText(toMinutes(h.open))} to ${timeOfDayText(toMinutes(h.close))} NZT, ${dayRangeText(h.days)}, excluding New Zealand public holidays`
}

/** "8:30am today", "8:30am Wednesday", "8:30am Monday 2 November" (more than a week on). */
function openingText(at: { dateISO: string; minutes: number }, todayISO: string): string {
  const time = timeOfDayText(at.minutes)
  if (at.dateISO === todayISO) return time
  const days = differenceInCalendarDays(parseISO(at.dateISO), parseISO(todayISO))
  if (days === 1) return `${time} tomorrow`
  if (days < 7) return `${time} ${format(parseISO(at.dateISO), 'EEEE')}`
  return `${time} ${format(parseISO(at.dateISO), 'EEEE d MMMM')}`
}

/** The panel's status line: "Open now", "Open now, limited Christmas cover" or "Closed, opens 8:30am Wednesday". */
export function statusText(channel: SupportChannel, dateISO: string, minutes: number, publicHolidays: readonly PublicHoliday[]): { open: boolean; text: string } {
  const cover = coverAt(channel, dateISO, minutes, publicHolidays)
  if (cover.kind === 'inHours') return { open: true, text: 'Open now' }
  if (cover.kind === 'christmas') return { open: true, text: 'Open now, limited Christmas cover' }
  const next = nextOpening(channel, dateISO, minutes, publicHolidays)!
  const prefix = cover.kind === 'publicHoliday' ? `Closed for ${cover.holidayName}` : 'Closed'
  return { open: false, text: `${prefix}, opens ${openingText(next, dateISO)}` }
}

/** `Tue 21 Jul, 9:00am`: a support stamp (a respond-by, the clock in a trigger's message), in the panel's 12-hour form. */
export function supportStampText(iso: string): string {
  const { dateISO, minutes } = splitISO(iso)
  return `${format(parseISO(dateISO), 'EEE d MMM')}, ${timeOfDayText(minutes)}`
}

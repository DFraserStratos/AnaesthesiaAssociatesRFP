/**
 * Shared formatting + date helpers. Pure string/date formatting only (no store,
 * no domain logic). Every range renders with the word "to", never an en/em dash
 * (CLAUDE.md copy rule); micro-caps and mono-date shapes match the mockups.
 *
 * Moved from `apps/mobile/format.ts` in Phase 05 so the web lists / dashboard /
 * detail read the same helpers (in particular `slotTimeRange`, which renders
 * a session's effective times: its own where the office set them, else the
 * schedule settings' default). The Monday-anchored week helpers are new for
 * the web dashboard's week strip.
 */

import { addDays, differenceInYears, format, parseISO, startOfWeek } from 'date-fns'
import { validateNhi } from '../domain/nhi'
import type { BillingRoute, BookingSource, ListState } from '../domain/types'

/** "TUE 21 JUL" — the micro-cap day header used on the Lists home. */
export function dayMicroCap(dateISO: string): string {
  return format(parseISO(dateISO), 'EEE d MMM').toUpperCase()
}

/** "Tue 21 Jul": the short day used beside warnings, drawers and clearances. */
export function shortDay(dateISO: string): string {
  return format(parseISO(dateISO.slice(0, 10)), 'EEE d MMM')
}

/** The "HH:MM" slice of a local-naive ISO datetime ("" when absent/short). */
export function hhmm(iso: string | undefined): string {
  return iso !== undefined && iso.length >= 16 ? iso.slice(11, 16) : ''
}

/** "TUE 21 JUL · 08:00" for a local-naive ISO datetime ("·" when absent). */
export function dateTimeMicroCap(iso: string | undefined): string {
  return iso !== undefined && iso.length >= 16 ? `${dayMicroCap(iso.slice(0, 10))} · ${hhmm(iso)}` : '·'
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

// The audit change string used to live here as `formatAuditChange`, rendering
// `JSON.stringify(patch)` at clinicians. It is replaced by `src/shared/audit/`
// — field labels, human values and the change ledger, with Vitest coverage.

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

/**
 * A session's time range, e.g. "13:00 to 17:30" (catch-up Phase 28: the times
 * are the Slot's, from `effectiveSlotTimes`; the default comes from the
 * schedule settings, never a fallback here).
 */
export function slotTimeRange(times: { startTime: string; endTime: string }): string {
  return `${times.startTime} to ${times.endTime}`
}

export interface NhiBadge {
  /** "NHI ABC1234" or "NHI pending". */
  text: string
}

/** Render a normalised NHI, or the provisional "NHI pending" state. */
export function nhiBadge(nhi: string | undefined): NhiBadge {
  if (nhi === undefined || nhi.trim() === '') {
    return { text: 'NHI pending' }
  }
  const v = validateNhi(nhi)
  return { text: `NHI ${v.normalised}` }
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

// ---------------------------------------------------------------------------
// Person names — ONE short form across all three apps
// ---------------------------------------------------------------------------
//
// An anaesthetist is stored under one full name ("Dr Melanie Souter"). Three
// display shapes derive from it, and each has exactly one home here so the apps
// can never drift apart on the same person:
//
//   full name   nav bar, More/profile card, availability rows, sheet headers
//   `drSurname` greetings, who's-free cover chips, cover-request copy
//   `initialsOf` avatars and grid initials
//
// The mockups' two greetings ("Kia ora, Dr Souter", mobile and web alike) and
// the web dashboard's cover chips ("Dr Strand") set the short form. The mobile
// cover sheet's mockup reached for a first name instead ("Ask Dr Melanie…");
// that is the one place the design contradicted itself, and the surname wins.

/** Drop a leading title: "Dr Melanie Souter" -> "Melanie Souter". */
export function nameWithoutTitle(name: string): string {
  return name.replace(/^Dr\.?\s+/i, '').trim()
}

/** "Dr Melanie Souter" -> "Souter" (A-Z sort key, admin row labels). */
export function surnameOf(name: string): string {
  const parts = nameWithoutTitle(name).split(/\s+/).filter((p) => p !== '')
  return parts[parts.length - 1] ?? name
}

/** "Dr Melanie Souter" -> "Dr Souter": the short form the apps address people by. */
export function drSurname(name: string): string {
  const surname = surnameOf(name)
  return surname === '' ? name : `Dr ${surname}`
}

/**
 * Keep the leading title and the surname: "Ms A. Reid" -> "Ms Reid",
 * "Dr Priya Sharma" -> "Dr Sharma". Surgeons carry Mr / Ms titles, so the
 * Dr-only short form would mislabel them (Phase 17 pairing group headings).
 * A name with no title stays whole ("Jane Smith"): no title is invented.
 */
export function titledSurname(name: string): string {
  const match = /^(Dr|Mr|Ms|Mrs|Miss|Prof)\.?\s+/i.exec(name.trim())
  if (match === null) return name.trim()
  const parts = name.trim().slice(match[0].length).split(/\s+/).filter((p) => p !== '')
  const surname = parts[parts.length - 1]
  return surname === undefined ? name : `${match[1]} ${surname}`
}

/** "Dr Melanie Souter" -> "MS" (avatar / grid initials, at most two letters). */
export function initialsOf(name: string): string {
  return nameWithoutTitle(name)
    .split(/\s+/)
    .filter((p) => p !== '')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

/**
 * A List's lifecycle state as the screens print it: the catalogue's names
 * (EP-07, FT-07.1), upper case. One home, so Phase 31 adds DRAFT (a Draft List)
 * in one place. An empty session is a Slot with no List, so it has no state to
 * print (catch-up Phase 28).
 */
export const LIST_STATE_LABELS: Record<ListState, string> = {
  ACTIVE: 'ACTIVE',
  SUBMITTED: 'SUBMITTED',
  AUTHORISED: 'AUTHORISED',
}

/**
 * How a Booking entered the system, as shown on the Booking (DM-39; catch-up
 * Phase 15). Display-only: the Booking detail shows one quiet line when a
 * source is recorded and nothing when it is not.
 */
export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  hospitalDownload: 'Hospital download',
  surgeonPdf: 'Surgeon PDF',
  admin: 'Office entry',
  anaesthetistAdHoc: 'Added by anaesthetist',
}

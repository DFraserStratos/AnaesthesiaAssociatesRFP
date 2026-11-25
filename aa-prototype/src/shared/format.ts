/**
 * Shared formatting helpers: the one import screens use for display text.
 * Pure string formatting only (no store, no domain logic).
 *
 * Formatting has one home per kind (UI unification U1):
 *  - money through `formatMoney` (`domain/billing/money.ts`), re-exported here
 *    as `formatCurrency` too: "$3,100.00" everywhere (question 21);
 *  - dates, timestamps, times and counts through `domain/dateText.ts`
 *    (`shortDay`, `dateRange`, `stampText`, `hhmm`, `plural` ...), re-exported
 *    here (question 24); every range reads "to", never an en or em dash;
 *  - person names through `drSurname` and friends below.
 * No `toFixed(2)` money or `format(..., 'EEE d MMM')` in a component.
 */

import { ageInCompletedYears } from '../domain/billing/modifiers'
import { validateNhi } from '../domain/nhi'
import { nameWithoutTitle } from '../domain/names'
import { shortDay as shortDayOf } from '../domain/dateText'
import type { AnaesthetistStatus } from '../domain/anaesthetistStatus'
import { normaliseHpiCpn } from '../domain/surgeons'
import type { BookingSource, Hospital, List, ProcedureTextSource, Surgeon } from '../domain/types'

export {
  dateRange,
  dateTimeMicroCap,
  dayHeading,
  dayMicroCap,
  dayWithYear,
  formatDob,
  DOB_NOT_SUPPLIED,
  hhmm,
  longDay,
  longDayNoYear,
  mondayOf,
  plainDate,
  plural,
  pluralWord,
  receivedDay,
  shiftWeeks,
  shortDay,
  slotTimeRange,
  stampText,
  weekDays,
} from '../domain/dateText'

/** NZ dollars: "$3,100.00", a negative "-$34.45" (`formatCurrency` is the name the screens already call). Typed money: `parseAmount`. */
export { formatMoney, formatMoney as formatCurrency, parseAmount, parseAmountOrNaN } from '../domain/billing/money'

export type { MoneyFormat } from '../domain/billing/money'

/** A whole count with thousands separators: 28114 → "28,114" (catch-up Phase 43's scale figures). Locale-independent. */
export function formatCount(n: number): string {
  const rounded = Math.round(n)
  const sign = rounded < 0 ? '-' : ''
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// The audit change string used to live here as `formatAuditChange`, rendering
// `JSON.stringify(patch)` at clinicians. It is replaced by `src/shared/audit/`
// — field labels, human values and the change ledger, with Vitest coverage.

/** Whole years between a DOB and the demo clock's today: the one age rule (`ageInCompletedYears`, 19b), never its own maths. */
export function ageYears(dobISO: string, todayISO: string): number {
  return ageInCompletedYears(dobISO, todayISO) ?? 0
}

export interface NhiBadge {
  /** "NHI ABC1234"; empty only when no patient is found. */
  text: string
}

/**
 * Render a normalised NHI. The NHI is mandatory (catch-up Phase 40; D11,
 * US-03.1.5): every patient has one, so there is no "pending" or "missing"
 * label; a missing patient renders nothing.
 */
export function nhiBadge(nhi: string | undefined): NhiBadge {
  if (nhi === undefined || nhi.trim() === '') {
    return { text: '' }
  }
  const v = validateNhi(nhi)
  return { text: `NHI ${v.normalised}` }
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

// `nameWithoutTitle` lives in `domain/names.ts` (the seed's bank account names use it too, Phase 26).
export { nameWithoutTitle }

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

/** The titled short form ("Ms Reid", "Dr Sharma"): one home in the domain, so the pool's sentence agrees. */
export { matchesNameQuery, titledSurname } from '../domain/names'

/**
 * The one label for a practitioner's identifier (catch-up Phase 40a; FT-14.4,
 * OQ-52): the Health Provider Index Common Person Number.
 */
export const HPI_CPN_LABEL = 'HPI CPN'

/** "10soum " -> "HPI CPN 10SOUM"; null when blank (a surgeon may hold none, 17b). Shape-checked elsewhere, never check-character validated. */
export function formatHpiCpn(value?: string): string | null {
  const id = normaliseHpiCpn(value ?? '')
  return id === '' ? null : `${HPI_CPN_LABEL} ${id}`
}

/** "Dr Melanie Souter (HPI CPN 10SOUM)", or the name alone when no HPI CPN is held. */
export function practitionerWithHpiCpn(name: string, hpiId?: string): string {
  const cpn = formatHpiCpn(hpiId)
  return cpn === null ? name : `${name} (${cpn})`
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

/** A List's lifecycle state as the screens print it (its home is `domain/types.ts`). */
export { LIST_STATE_LABELS } from '../domain/types'

/**
 * How long a Draft List has waited, from whole minutes (catch-up Phase 31;
 * US-01.6.2): "45 min" under an hour, "16 h" under a day, then "3 d 22 h"
 * (dropping "0 h"). The one formatter for every waiting time.
 */
export function waitingLabel(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes))
  if (m < 60) return `${m} min`
  const hours = Math.floor(m / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  const rest = hours % 24
  return rest === 0 ? `${days} d` : `${days} d ${rest} h`
}

/**
 * A List's location by name (catch-up Phase 31): the hospital, or "AA rooms"
 * for the pre-op clinic's location record. Every List has one, so there is no
 * fallback wording; an id missing from the master reads as the id.
 */
export function locationName(hospitalId: string, hospitals: Readonly<Record<string, Pick<Hospital, 'name'>>>): string {
  return hospitals[hospitalId]?.name ?? hospitalId
}

/** "Forte Health · Mr V. Nand": a List's location and surgeon. */
export function pairingLine(
  list: Pick<List, 'hospitalId' | 'surgeonId'>,
  masters: { hospitals: Readonly<Record<string, Pick<Hospital, 'name'>>>; surgeons: Readonly<Record<string, Pick<Surgeon, 'name'>>> },
): string {
  return `${locationName(list.hospitalId, masters.hospitals)} · ${masters.surgeons[list.surgeonId]?.name ?? list.surgeonId}`
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
  rebook: 'Rebooked by the office',
}

// ---------------------------------------------------------------------------
// The procedure stack's words (catch-up Phase 20a; US-03.1.9, US-08.4.6)
// ---------------------------------------------------------------------------

/** Where a procedure text came from, as the Booking's meta line says it. */
export const PROCEDURE_TEXT_SOURCE_LABELS: Record<ProcedureTextSource, string> = {
  surgeonPdf: "Surgeon's rooms PDF",
  email: 'Email',
  hospitalDownload: 'Hospital download',
  hospitalFeed: 'Hospital feed',
  hospitalSheet: 'Hospital sheet',
  phone: 'Phone',
  anaesthetist: 'Anaesthetist',
  unrecorded: 'Source not recorded',
}

/**
 * An anaesthetist's status as the record, its header and the Anaesthetists list
 * show it (build plan Phase 52; US-12.1.6): "Active", "Inactive from Thu 31 Dec"
 * while a last day is ahead, "Inactive" after it.
 */
export function anaesthetistStatusLabel(status: AnaesthetistStatus): string {
  if (status.kind === 'leaving') return `Inactive from ${shortDayOf(status.lastDayISO)}`
  return status.kind === 'inactive' ? 'Inactive' : 'Active'
}

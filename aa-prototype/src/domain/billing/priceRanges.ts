/**
 * Price ranges on a fixed-price Contract (catch-up Phase 19a; US-04.2.15,
 * DM-09; AR-58 sections 2.4 and 5.6, AR-61 `#price-range`).
 *
 * A fixed-price Contract holds one or more ranges, each a start date and a
 * price ex GST. Starts are unique and may be in the past (D6); a range ends
 * the day before the next one starts, so ranges never overlap or leave a gap
 * after the first start; the last runs on with no end. The range in force on
 * a date is the one with the latest start on or before it; before the first
 * start there is no price ("Needs a price"). Changing a price from a date is
 * adding a range; correcting a mistake is editing or deleting one, never the
 * last. Rates and discounts stay undated (Phase 18).
 *
 * Prices are derived, not stored on the Procedure, so a new or backdated range
 * re-prices every Procedure on the Contract that nothing holds (AR-58 5.7,
 * A13); an issued invoice never changes. No list of the Procedures affected is
 * built (OQ-133, D79's default).
 *
 * Every rule about ranges lives here, behind the types the UI reads; the
 * store applies `validatePriceRanges` through the Contract save guard.
 */

import type { Contract } from './contracts'
import { addDaysISO } from '../clock'
import { roundToCents } from './money'

export interface PriceRange {
  /** ISO date the price starts; may be in the past; unique within the Contract. */
  startISO: string
  /** Ex GST, 0 or more (0 is a no-charge invoice); above 0 on a prepaid Contract. */
  price: number
}

/** The ranges in start order (a new array; the input is untouched). */
export function sortRanges(ranges: readonly PriceRange[]): PriceRange[] {
  return [...ranges].sort((a, b) => a.startISO.localeCompare(b.startISO))
}

/** A fixed-price Contract's ranges in start order, or none for any other kind. */
export function rangesOf(contract: Contract): PriceRange[] {
  return contract.pricing.kind === 'fixed' ? sortRanges(contract.pricing.ranges) : []
}

/**
 * The range in force on a date (the procedure date: the List's): the latest
 * start on or before it. Null before the first start, and on any kind that is
 * not a fixed price.
 */
export function rangeInForce(contract: Contract, dateISO: string): PriceRange | null {
  let found: PriceRange | null = null
  for (const r of rangesOf(contract)) {
    if (r.startISO <= dateISO.slice(0, 10)) found = r
  }
  return found
}

/** The last day of the range at `index` (the day before the next start), or null for the last range. */
export function rangeEnd(ranges: readonly PriceRange[], index: number): string | null {
  const sorted = sortRanges(ranges)
  const next = sorted[index + 1]
  return next === undefined ? null : addDaysISO(next.startISO, -1)
}

// ---------------------------------------------------------------------------
// Pure edits (each returns sorted ranges; the store validates and audits)
// ---------------------------------------------------------------------------

export function addRange(ranges: readonly PriceRange[], range: PriceRange): PriceRange[] {
  return sortRanges([...ranges, { startISO: range.startISO, price: range.price }])
}

/** Replace the range starting on `startISO` (its start may move). */
export function editRange(ranges: readonly PriceRange[], startISO: string, next: PriceRange): PriceRange[] {
  return sortRanges(ranges.map((r) => (r.startISO === startISO ? { startISO: next.startISO, price: next.price } : r)))
}

export function deleteRange(ranges: readonly PriceRange[], startISO: string): PriceRange[] {
  return ranges.filter((r) => r.startISO !== startISO)
}

// ---------------------------------------------------------------------------
// Guards (AR-58 5.10 item 2 and 5.6)
// ---------------------------------------------------------------------------

export type PriceRangeRefusalCode =
  | 'notFixedPrice'
  | 'noRange'
  | 'lastRange'
  | 'rangeMissing'
  | 'startRequired'
  | 'duplicateStart'
  | 'negativePrice'
  | 'prepaidPriceNotAboveZero'

export interface PriceRangeRefusal {
  code: PriceRangeRefusalCode
  message: string
}

const STATIC_MESSAGES: Record<Exclude<PriceRangeRefusalCode, 'duplicateStart'>, string> = {
  notFixedPrice: 'Only a fixed-price Contract has price ranges.',
  noRange: 'A fixed-price Contract needs at least one price range.',
  lastRange: 'A Contract keeps at least one price range.',
  rangeMissing: 'That price range could not be found.',
  startRequired: 'A price range needs a start date.',
  negativePrice: 'A price must be a number of 0 or more.',
  prepaidPriceNotAboveZero: "A prepaid Contract's price must be above zero.",
}

export function priceRangeRefusal(code: PriceRangeRefusalCode, startISO?: string): PriceRangeRefusal {
  if (code === 'duplicateStart') {
    return { code, message: `Another price range already starts on ${formatRangeDate(startISO ?? '')}.` }
  }
  return { code, message: STATIC_MESSAGES[code] }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** A real calendar day written as YYYY-MM-DD (never 30 Feb). */
function isCalendarDate(dateISO: string): boolean {
  if (!ISO_DATE.test(dateISO)) return false
  const [y, m, d] = dateISO.split('-').map(Number) as [number, number, number]
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
  return days !== undefined && d >= 1 && d <= days
}

/**
 * The first rule a fixed price's ranges break, or null: at least one; each
 * with a start date; starts unique; every price a number of 0 or more, and
 * above 0 on a prepaid Contract (OQ-92, D30).
 */
export function validatePriceRanges(ranges: readonly PriceRange[], opts: { prepaid: boolean }): PriceRangeRefusal | null {
  if (ranges.length === 0) return priceRangeRefusal('noRange')
  const seen = new Set<string>()
  for (const r of ranges) {
    if (!isCalendarDate(r.startISO)) return priceRangeRefusal('startRequired')
    if (seen.has(r.startISO)) return priceRangeRefusal('duplicateStart', r.startISO)
    seen.add(r.startISO)
    if (typeof r.price !== 'number' || !Number.isFinite(r.price) || r.price < 0) {
      return priceRangeRefusal(opts.prepaid ? 'prepaidPriceNotAboveZero' : 'negativePrice')
    }
    // Checked as stored: to the cent, so $0.004 is $0.00 on a prepaid Contract.
    if (opts.prepaid && !(roundToCents(r.price) > 0)) return priceRangeRefusal('prepaidPriceNotAboveZero')
  }
  return null
}

/** Correcting a range: it must exist (the rules on the result are `validatePriceRanges`'). */
export function editRangeRefusal(ranges: readonly PriceRange[], startISO: string): PriceRangeRefusal | null {
  return ranges.some((r) => r.startISO === startISO) ? null : priceRangeRefusal('rangeMissing')
}

/**
 * A price as the office types it ("$3,200", "3200.00"), or NaN when blank or
 * not a number: the guard then refuses it in its own words.
 */
export function parsePriceText(text: string): number {
  const t = text.replace(/[$,\s]/g, '')
  return t === '' ? Number.NaN : Number(t)
}

/** Ranges equal start for start and price for price (a save that changes nothing). */
export function sameRanges(a: readonly PriceRange[], b: readonly PriceRange[]): boolean {
  const x = sortRanges(a)
  const y = sortRanges(b)
  return x.length === y.length && x.every((r, i) => r.startISO === y[i]!.startISO && r.price === y[i]!.price)
}

/**
 * Deleting a range: never the last one (US-04.2.15 "Never the last"), and
 * only one that exists.
 */
export function deleteRangeRefusal(ranges: readonly PriceRange[], startISO: string): PriceRangeRefusal | null {
  if (!ranges.some((r) => r.startISO === startISO)) return priceRangeRefusal('rangeMissing')
  if (ranges.length <= 1) return priceRangeRefusal('lastRange')
  return null
}

/** Ranges as cents-rounded prices (what a save stores). */
export function normaliseRanges(ranges: readonly PriceRange[]): PriceRange[] {
  return sortRanges(ranges.map((r) => ({ startISO: r.startISO, price: roundToCents(r.price) })))
}

// ---------------------------------------------------------------------------
// Words (audit copy and the Contracts list's summary)
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** "1 Oct 2026". */
export function formatRangeDate(dateISO: string): string {
  const [y, m, d] = dateISO.slice(0, 10).split('-').map(Number)
  if (y === undefined || m === undefined || d === undefined || Number.isNaN(y + m + d)) return dateISO
  return `${d} ${MONTHS[m - 1] ?? ''} ${y}`
}

/** "$3,200.00". */
export function formatRangePrice(price: number): string {
  const [whole, cents] = roundToCents(price).toFixed(2).split('.')
  return `$${(whole ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents ?? '00'}`
}

/** "From 1 Oct 2026, $3,200.00": one range, as the audit trail narrates it. */
export function describeRange(range: PriceRange): string {
  return `From ${formatRangeDate(range.startISO)}, ${formatRangePrice(range.price)}`
}

/** "Face lift: price range from 1 Oct 2026, $3,200.00". */
export function describePriceRange(contractName: string, range: PriceRange): string {
  return `${contractName}: price range from ${formatRangeDate(range.startISO)}, ${formatRangePrice(range.price)}`
}

/** "1 Jun 2026 to 30 Sep 2026", or "From 1 Oct 2026" for the last range. */
export function rangeSpanText(ranges: readonly PriceRange[], index: number): string {
  const sorted = sortRanges(ranges)
  const r = sorted[index]
  if (r === undefined) return ''
  const end = rangeEnd(sorted, index)
  return end === null ? `From ${formatRangeDate(r.startISO)}` : `${formatRangeDate(r.startISO)} to ${formatRangeDate(end)}`
}

export type RangeSummary =
  | { kind: 'inForce'; range: PriceRange }
  | { kind: 'notYet'; firstStartISO: string }
  | { kind: 'none' }

/** What a fixed-price Contract charges on a date, for the Contracts list. */
export function rangeSummary(contract: Contract, todayISO: string): RangeSummary {
  const inForce = rangeInForce(contract, todayISO)
  if (inForce !== null) return { kind: 'inForce', range: inForce }
  const first = rangesOf(contract)[0]
  return first === undefined ? { kind: 'none' } : { kind: 'notYet', firstStartISO: first.startISO }
}

/** "$3,100.00 from 1 Jun 2026" or "Not in force until 1 Aug 2026". */
export function rangeSummaryText(summary: RangeSummary): string {
  if (summary.kind === 'inForce') return `${formatRangePrice(summary.range.price)} from ${formatRangeDate(summary.range.startISO)}`
  if (summary.kind === 'notYet') return `Not in force until ${formatRangeDate(summary.firstStartISO)}`
  return 'No price range'
}

/** The words every money surface shows in place of an amount when there is no price (catch-up Phase 19a). */
export const NEEDS_PRICE_LABEL = 'Needs a price'

/**
 * The one "Needs a price" sentence for a fixed price with no range in force
 * on the procedure date: the validator's names the date (the Booking shows
 * which Contract), the billing resolver's adds the Contract, since the
 * billing monitor lists Bookings without it.
 */
export function needsPriceMessage(contract: Pick<Contract, 'name' | 'pricing'>, dateISO: string, opts: { named?: boolean } = {}): string {
  // An open price has no ranges: it has no price of its own until one is typed (Phase 20).
  if (contract.pricing.kind === 'open') return `${NEEDS_PRICE_LABEL}: ${contract.name} has no price of its own.`
  const under = opts.named === true ? ` under ${contract.name}` : ''
  return `${NEEDS_PRICE_LABEL}: no price range in force on ${formatRangeDate(dateISO)}${under}.`
}

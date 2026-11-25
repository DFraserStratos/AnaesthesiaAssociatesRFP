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
import type { Booking, List, Procedure } from '../types'
import type { BookingLock } from './lock'
import { addDaysISO } from '../clock'
import { formatMoney, parseAmountOrNaN, roundToCents } from './money'
import { plainDate } from '../dateText'

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
 * A price as the office types it ("$3,200", "3200.00"), read by the one
 * `parseAmount` (U1), or NaN when it is no amount (blank, negative, not a
 * number, past the cent): the guard then refuses it in its own words.
 */
export function parsePriceText(text: string): number {
  return parseAmountOrNaN(text)
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

/** "1 Oct 2026" (`plainDate`, question 24's money and contracts shape); anything that is not a real calendar day reads as typed. */
export function formatRangeDate(dateISO: string): string {
  return isCalendarDate(dateISO.slice(0, 10)) ? plainDate(dateISO) : dateISO
}

/** "3,200.00": a range's price in its edit field, read back by `parsePriceText`. */
export function priceInputText(price: number): string {
  return formatMoney(price).replace('$', '')
}

/** "$3,200.00": a range's price as all money prints (`formatMoney`, U1). */
export function formatRangePrice(price: number): string {
  return formatMoney(price)
}

/** "From 1 Oct 2026, $3,200.00": one range, as the audit trail narrates it. */
export function describeRange(range: PriceRange): string {
  return `From ${formatRangeDate(range.startISO)}, ${formatRangePrice(range.price)}`
}

/** "Face lift: price range from 1 Oct 2026, $3,200.00". */
export function describePriceRange(contractName: string, range: PriceRange): string {
  return `${contractName}: price range from ${formatRangeDate(range.startISO)}, ${formatRangePrice(range.price)}`
}

/**
 * The change of a range's price on the range before it, as a fraction (0.032 for +3.2%), or null
 * for the oldest range ("First") and a range after a $0 price (no base to compare with). Pure;
 * `rangeChangeText` words it.
 */
export function rangeChange(prev: PriceRange | undefined, next: PriceRange): number | null {
  if (prev === undefined || prev.price === 0) return null
  return (next.price - prev.price) / prev.price
}

/** "+3.2%", "-1.0%", "0.0%", or "First" on the oldest range. */
export function rangeChangeText(prev: PriceRange | undefined, next: PriceRange): string {
  if (prev === undefined) return 'First'
  const change = rangeChange(prev, next)
  if (change === null) return 'New'
  const pct = Math.round(change * 1000) / 10
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
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

// ---------------------------------------------------------------------------
// Procedures priced by each range (build plan Phase 45; US-04.2.15 "Table")
// ---------------------------------------------------------------------------

/** What `proceduresPerRange` reads: the schedule's Procedures, Bookings and Lists, and the locks. */
export interface ProceduresPerRangeInput {
  procedures: Readonly<Record<string, Pick<Procedure, 'id' | 'bookingId' | 'governingContractId' | 'enteredPrice'>>>
  bookings: Readonly<Record<string, Pick<Booking, 'id' | 'listId' | 'cancellation'>>>
  lists: Readonly<Record<string, Pick<List, 'dateISO' | 'state'>>>
  locks: Readonly<Record<string, Pick<BookingLock, 'bookingId' | 'state' | 'pricingDateISO' | 'procedures' | 'settledByPrepayment'>>>
  /** The not-yet-authorised Procedures whose price a raised prepayment holds (the price ladder's `prepaid` rung). */
  prepaidHeld?: ReadonlySet<string>
}

/**
 * How many Procedures each of a fixed price's ranges priced, by range start. A Procedure counts
 * under a range when it is on the Contract, not cancelled, its procedure date (the List's; the
 * lock's pricing date once authorised) falls in the range's span (its start to `rangeEnd`), and
 * its price came from that range:
 *
 * - not yet authorised (its List is not AUTHORISED): it has no typed price (`enteredPrice`) and no
 *   raised prepayment holds it (`prepaidHeld`), so it follows the range in force;
 * - authorised: its Booking's lock snapshot was not typed, not settled by a prepayment, and the
 *   range it was locked at starts on this range's start; its date is the lock's pricing date.
 *
 * A typed or prepaid price is held by something else, and an authorised price kept from an
 * earlier range (a range added or corrected since) is not this range's: none is counted. An
 * AUTHORISED List with no lock for the Booking counts nowhere. Pure.
 */
export function proceduresPerRange(contract: Contract, input: ProceduresPerRangeInput): Record<string, number> {
  const ranges = rangesOf(contract)
  const counts: Record<string, number> = Object.fromEntries(ranges.map((r) => [r.startISO, 0]))
  if (ranges.length === 0) return counts
  const spans = ranges.map((r, i) => ({ startISO: r.startISO, endISO: rangeEnd(ranges, i) }))
  const spanOf = (dateISO: string) => spans.find((s) => s.startISO <= dateISO && (s.endISO === null || dateISO <= s.endISO))
  const lockByBooking = new Map(Object.values(input.locks).map((l) => [l.bookingId, l]))
  for (const p of Object.values(input.procedures)) {
    if (p.governingContractId !== contract.id) continue
    const booking = input.bookings[p.bookingId]
    if (booking === undefined || booking.cancellation !== undefined) continue
    const list = input.lists[booking.listId]
    if (list === undefined) continue
    if (list.state === 'AUTHORISED') {
      const lock = lockByBooking.get(booking.id)
      if (lock === undefined || lock.state !== 'locked' || lock.settledByPrepayment?.[p.id] !== undefined) continue
      const snap = lock.procedures.find((s) => s.procedureId === p.id)
      if (snap === undefined || snap.typed || snap.contract?.id !== contract.id) continue
      const lockedStart = snap.contract.pricing.kind === 'fixed' ? snap.contract.pricing.ranges[0]?.startISO : undefined
      const span = spanOf(lock.pricingDateISO.slice(0, 10))
      if (span !== undefined && lockedStart === span.startISO) counts[span.startISO] = (counts[span.startISO] ?? 0) + 1
      continue
    }
    if (p.enteredPrice !== undefined || input.prepaidHeld?.has(p.id) === true) continue
    const span = spanOf(list.dateISO)
    if (span !== undefined) counts[span.startISO] = (counts[span.startISO] ?? 0) + 1
  }
  return counts
}

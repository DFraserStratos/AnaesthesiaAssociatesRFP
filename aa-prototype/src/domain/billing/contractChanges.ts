/**
 * What a change to a Contract leaves behind (catch-up Phase 25a; US-04.1.2,
 * US-04.2.15, DM-69, D79). Two pure lists the Contract panel warns with;
 * nothing here moves or re-prices a Procedure.
 *
 * - `proceduresStillOnContract`: after a dated change (a new Contract that
 *   replaces this one from a date) or a disable, every Procedure dated on or
 *   after that day still on the old Contract, so the office can open each and
 *   move it. Only Procedures that can still move are listed: a Booking on an
 *   AUTHORISED List is locked (25) and is left off, as is a cancelled Booking;
 *   a Draft List keeps its day, so its Procedures are listed.
 * - `authorisedKeptPrice`: after a price range is added or corrected, the
 *   authorised Procedures inside its span that kept their locked price (the
 *   lock holds the price they were authorised at), read only from the locks.
 *   A typed price is the Procedure's own and is never listed; the Procedures
 *   that re-priced are never listed either (US-04.2.15 "No list of re-priced").
 */

import type { Booking, ContractId, List, Patient, PriceRange, Procedure, ProcedureId } from '../types'
import type { BookingLock } from './lock'
import { rangeEnd, sortRanges } from './priceRanges'

/** One Procedure still on the old Contract. */
export interface StillOnRow {
  procedureId: ProcedureId
  bookingId: string
  listId: string
  dateISO: string
  scheduledTime?: string
  patientName: string
  /** The Procedure's text as received, when it has one. */
  procedureText: string | null
}

export interface StillOnInput {
  procedures: Readonly<Record<string, Procedure>>
  bookings: Readonly<Record<string, Booking>>
  lists: Readonly<Record<string, Pick<List, 'dateISO' | 'state'>>>
  patients: Readonly<Record<string, Pick<Patient, 'name'>>>
}

/** The Procedures on `contractId` dated on or after `fromISO` that can still move, by date then time. */
export function proceduresStillOnContract(input: StillOnInput, contractId: ContractId, fromISO: string): StillOnRow[] {
  const rows: StillOnRow[] = []
  for (const p of Object.values(input.procedures)) {
    if (p.governingContractId !== contractId) continue
    const booking = input.bookings[p.bookingId]
    if (booking === undefined || booking.cancellation !== undefined) continue
    const list = input.lists[booking.listId]
    if (list === undefined || list.state === 'AUTHORISED' || list.dateISO < fromISO) continue
    rows.push({
      procedureId: p.id,
      bookingId: booking.id,
      listId: booking.listId,
      dateISO: list.dateISO,
      ...(booking.scheduledTime !== undefined ? { scheduledTime: booking.scheduledTime } : {}),
      patientName: input.patients[booking.patientId]?.name ?? booking.patientId,
      procedureText: p.procedureText?.text ?? null,
    })
  }
  return rows.sort(
    (a, b) => a.dateISO.localeCompare(b.dateISO) || (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '') || a.procedureId.localeCompare(b.procedureId),
  )
}

/** One authorised Procedure that kept its locked price under a new or corrected range. */
export interface KeptPriceRow {
  procedureId: ProcedureId
  bookingId: string
  listId: string
  dateISO: string
  patientName: string
  /** The range price it was authorised at (its locked range), ex GST. */
  lockedPrice: number
  /** The range's price, ex GST. */
  rangePrice: number
}

/**
 * The locked Procedures on `contractId` dated inside `range`'s span (its start
 * to `rangeEnd` within `ranges`, the Contract's ranges after the change) whose
 * locked price differs from the range's and was not typed, by date.
 */
export function authorisedKeptPrice(
  locks: Readonly<Record<string, BookingLock>>,
  contractId: ContractId,
  ranges: readonly PriceRange[],
  range: PriceRange,
): KeptPriceRow[] {
  const sorted = sortRanges(ranges)
  const index = sorted.findIndex((r) => r.startISO === range.startISO)
  // A range that is not the Contract's (stale or deleted) has no span: nothing to list.
  if (index === -1) return []
  const end = rangeEnd(sorted, index)
  const rows: KeptPriceRow[] = []
  for (const lock of Object.values(locks)) {
    if (lock.state !== 'locked') continue
    const dateISO = lock.pricingDateISO
    if (dateISO < range.startISO || (end !== null && dateISO > end)) continue
    for (const s of lock.procedures) {
      if (s.contract?.id !== contractId || s.typed) continue
      // The range price the lock was cut to (`contractAsLocked`), never the whole locked fee: a fixed
      // billing line or a held amount is part of the Procedure's price, not of the range it kept.
      const lockedRange = s.contract.pricing.kind === 'fixed' ? s.contract.pricing.ranges[0]?.price : undefined
      if (lockedRange === undefined || lockedRange === range.price) continue
      rows.push({
        procedureId: s.procedureId,
        bookingId: lock.bookingId,
        listId: lock.listId,
        dateISO,
        patientName: lock.patient.name,
        lockedPrice: lockedRange,
        rangePrice: range.price,
      })
    }
  }
  return rows.sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.procedureId.localeCompare(b.procedureId))
}

/**
 * Every authorised Procedure on the Contract left at a locked price that is not
 * its range's today: `authorisedKeptPrice` over each range (their spans never
 * overlap, so no Procedure is listed twice). The ranges section shows it after
 * any range change, the panel's own or the demo trigger's.
 */
export function keptPriceOnContract(locks: Readonly<Record<string, BookingLock>>, contractId: ContractId, ranges: readonly PriceRange[]): KeptPriceRow[] {
  return sortRanges(ranges)
    .flatMap((r) => authorisedKeptPrice(locks, contractId, ranges, r))
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.procedureId.localeCompare(b.procedureId))
}

/** "1 authorised Procedure kept its old price" (the warning's title and the demo trigger's result). */
export function keptPriceTitle(n: number): string {
  return `${n} authorised ${n === 1 ? 'Procedure' : 'Procedures'} kept ${n === 1 ? 'its' : 'their'} old price`
}

/** "2 Procedures dated on or after Sat 1 Aug are still on Face lift." */
export function stillOnTitle(n: number, dayText: string, contractName: string): string {
  return `${n} ${n === 1 ? 'Procedure' : 'Procedures'} dated on or after ${dayText} ${n === 1 ? 'is' : 'are'} still on ${contractName}.`
}

/** The second sentence the dated-change and disable warnings share. */
export const NOTHING_MOVES = 'Nothing moves by itself: open each to move it.'

/**
 * Closures: the one place a hospital's closed days are read (catch-up Phase
 * 42; DM-38, US-01.5.1, US-13.4.1).
 *
 * A hospital is closed on a date when it has a hospital holiday of its own
 * that day (30's `masters.holidays`), or when a master public holiday falls
 * that day and the hospital is not listed open on it
 * (`PublicHoliday.openHospitalIds`). AA rooms is a location row like any
 * other: a public holiday closes it too unless it is listed open. Retired
 * hospitals are still covered, so a past List there still reads its closure.
 *
 * Every reader of holidays (the conflict rule, its reconcile inside
 * `mutate()`, the conflict preview, the hospital calendar) goes through
 * `closuresFor` or `closuresIndex`, never `masters.holidays` alone, so a
 * public holiday is never silently lost. Pure: no React, no store.
 */

import type { HospitalHoliday, PublicHoliday } from './types'

/** One reason a hospital is closed on a date. */
export type Closure =
  | { source: 'hospital'; holidayId: string; name: string }
  | { source: 'public'; publicHolidayId: string; name: string }

type Rows<T> = Readonly<Record<string, T>> | readonly T[]

function rowsOf<T>(rows: Rows<T> | undefined): readonly T[] {
  if (rows === undefined) return []
  return Array.isArray(rows) ? (rows as readonly T[]) : Object.values(rows as Record<string, T>)
}

/** The two calendars a closure is read from. */
export interface ClosureSources {
  hospitalHolidays: Rows<HospitalHoliday>
  publicHolidays: Rows<PublicHoliday>
}

export const closureKey = (dateISO: string, hospitalId: string): string => `${dateISO}|${hospitalId}`

/**
 * Both calendars indexed for lookup: hospital closures by date and hospital,
 * public holidays by date (they apply to every hospital not listed open, so
 * they are resolved per lookup). Each bucket is sorted by id, so equal input
 * gives an equal index.
 */
export interface ClosureIndex {
  readonly hospital: ReadonlyMap<string, readonly HospitalHoliday[]>
  readonly publicByDate: ReadonlyMap<string, readonly PublicHoliday[]>
}

export function closuresIndex(sources: ClosureSources): ClosureIndex {
  const hospital = new Map<string, HospitalHoliday[]>()
  for (const h of rowsOf(sources.hospitalHolidays)) {
    const key = closureKey(h.dateISO, h.hospitalId)
    const bucket = hospital.get(key)
    if (bucket === undefined) hospital.set(key, [h])
    else bucket.push(h)
  }
  const publicByDate = new Map<string, PublicHoliday[]>()
  for (const p of rowsOf(sources.publicHolidays)) {
    const bucket = publicByDate.get(p.dateISO)
    if (bucket === undefined) publicByDate.set(p.dateISO, [p])
    else bucket.push(p)
  }
  for (const bucket of hospital.values()) bucket.sort((x, y) => x.id.localeCompare(y.id))
  for (const bucket of publicByDate.values()) bucket.sort((x, y) => x.id.localeCompare(y.id))
  return { hospital, publicByDate }
}

/** The closures at one hospital on one date, from an index: its own first, then public holidays, each by id. */
export function closuresAt(index: ClosureIndex, dateISO: string, hospitalId: string): Closure[] {
  const out: Closure[] = []
  for (const h of index.hospital.get(closureKey(dateISO, hospitalId)) ?? []) {
    out.push({ source: 'hospital', holidayId: h.id, name: h.name })
  }
  for (const p of index.publicByDate.get(dateISO) ?? []) {
    if (p.openHospitalIds.includes(hospitalId)) continue
    out.push({ source: 'public', publicHolidayId: p.id, name: p.name })
  }
  return out
}

/**
 * Does a master public holiday close this hospital on this date? A recurring
 * booking projects no List on such a day (owner, 24 Nov 2026): the office's
 * standing Lists skip public holidays, so they never stand as conflicts. A
 * hospital's own closure is not skipped unless it is a planned shutdown
 * (`HospitalHoliday.shutdown`, the Christmas break): a one-off closure's
 * Lists are made and flagged (US-01.5.2), and a List that already holds
 * Bookings is never removed.
 */
export function publicHolidayClosesAt(index: ClosureIndex, dateISO: string, hospitalId: string): boolean {
  return closuresAt(index, dateISO, hospitalId).some((c) => c.source === 'public')
}

/** Is this hospital in a planned shutdown on this date (a hospital closure marked `shutdown`)? */
export function shutdownAt(index: ClosureIndex, dateISO: string, hospitalId: string): boolean {
  return (index.hospital.get(closureKey(dateISO, hospitalId)) ?? []).some((h) => h.shutdown === true)
}

/** The recurring projection's skip rule: a public holiday closing the hospital, or its planned shutdown. */
export function recurringSkipFor(sources: ClosureSources): (recurring: { hospitalId: string }, dateISO: string) => boolean {
  const index = closuresIndex(sources)
  return (recurring, dateISO) =>
    publicHolidayClosesAt(index, dateISO, recurring.hospitalId) || shutdownAt(index, dateISO, recurring.hospitalId)
}

/** The closures at one hospital on one date (a one-off lookup; build an index for many). */
export function closuresFor(dateISO: string, hospitalId: string, sources: ClosureSources): Closure[] {
  return closuresAt(closuresIndex(sources), dateISO, hospitalId)
}

/** The closure sources of a masters record (the store's and the seed's shape). */
export function closureSourcesOf(masters: {
  holidays: Rows<HospitalHoliday>
  publicHolidays?: Rows<PublicHoliday>
}): ClosureSources {
  return { hospitalHolidays: masters.holidays, publicHolidays: masters.publicHolidays ?? [] }
}

/** "Labour Day (public holiday)" or the hospital closure's own name: how a closure reads in a sentence. */
export function closureLabel(closure: Closure): string {
  return closure.source === 'public' ? `${closure.name} (public holiday)` : closure.name
}

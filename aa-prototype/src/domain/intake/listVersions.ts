/**
 * A List's versions (build plan Phase 68; DM-12): a List keeps its origin and its change history across both
 * sources. Pure: it reads the List's origin, the intake records and which List each Booking is on, never the store.
 *
 * The first version is the origin (a rooms' PDF, a hospital's feed, made by hand, a recurring booking). Then one
 * version per arrival with a decided row on this List, in the order the arrivals came: a row is on this List when
 * its decision names the List (`listId`), when the Booking it matched is on the List, or when it is a removal of a
 * Booking on the List. Each version counts what its decided rows did. The last version is the current one.
 */

import type { ChangeType, ImportBatch, ImportRow, ListOrigin } from '../types'

export type ListVersionSource = 'hospital' | 'rooms' | 'office' | 'recurring'

export interface ListVersionCounts {
  added: number
  changed: number
  cancelled: number
  removed: number
  unchanged: number
}

export interface ListVersion {
  atISO: string
  kind: 'origin' | 'arrival'
  source: ListVersionSource
  /** In words: "Rooms PDF from leanne.pa@avonsidesurgical.example", "St George's feed", "Made by hand". */
  label: string
  /** The arrival (absent for the origin). */
  batchId?: string
  /** The arrival's decided rows on this List, in the arrival's order (none for the origin). */
  rowIds: string[]
  counts: ListVersionCounts
  /** The latest version. */
  current: boolean
}

/** Words for the labels: the hospitals by id (an id with no name is shown as given). */
export interface ListVersionNames {
  hospitals: Readonly<Record<string, string>>
}

/** What the versions read: the intake's arrivals and rows. */
export interface ListVersionIntake {
  batches: Readonly<Record<string, ImportBatch>>
  rows: Readonly<Record<string, ImportRow>>
}

const NO_COUNTS: ListVersionCounts = { added: 0, changed: 0, cancelled: 0, removed: 0, unchanged: 0 }

function hospitalName(id: string, names: ListVersionNames | undefined): string {
  return names?.hospitals[id] ?? id
}

/** The origin's source and words (the wording of `listOriginText`, shortened for a version line). */
function originVersionOf(origin: ListOrigin, names: ListVersionNames | undefined): { source: ListVersionSource; label: string } {
  switch (origin.kind) {
    case 'pdf':
      return { source: 'rooms', label: `Rooms PDF from ${origin.senderEmail}` }
    case 'hospital':
      return { source: 'hospital', label: `${hospitalName(origin.hospitalId, names)} feed` }
    case 'manual':
      return { source: 'office', label: 'Made by hand' }
    case 'recurring':
      return { source: 'recurring', label: 'Recurring' }
  }
}

/** An arrival's source and words. */
function arrivalVersionOf(batch: ImportBatch, names: ListVersionNames | undefined): { source: ListVersionSource; label: string } {
  const from = batch.arrivalSource
  switch (from.kind) {
    case 'hospitalFeed':
      return { source: 'hospital', label: `${hospitalName(from.hospitalId, names)} feed` }
    case 'mailbox':
      return { source: 'rooms', label: `Rooms PDF from ${from.senderEmail}` }
    case 'byHand':
      return { source: 'rooms', label: `Rooms PDF from ${from.senderEmail} · added by hand` }
  }
}

/** The List a decided row landed on or spoke about, if any. */
function listOfRow(row: ImportRow, bookingListIds: Readonly<Record<string, string>>): string | undefined {
  if (row.removalOfBookingId !== undefined) return bookingListIds[row.removalOfBookingId]
  const d = row.decision
  if (d === undefined) return undefined
  switch (d.kind) {
    case 'match':
      return d.listId ?? bookingListIds[d.bookingId]
    case 'createBooking':
    case 'createList':
    case 'createDraft':
      return d.listId
    case 'reject':
    case 'leftOut':
      return undefined
  }
}

const MATCH_COUNT_KEY: Record<ChangeType, keyof ListVersionCounts> = {
  new: 'added',
  modification: 'changed',
  cancellation: 'cancelled',
  noChange: 'unchanged',
}

/** What one decided row did to the List: a create is added, a match by its change type, a confirmed removal removed. */
function countKey(row: ImportRow): keyof ListVersionCounts {
  if (row.removalOfBookingId !== undefined) return row.status === 'applied' ? 'removed' : 'unchanged'
  const d = row.decision
  if (d === undefined || row.status !== 'applied') return 'unchanged'
  switch (d.kind) {
    case 'createBooking':
    case 'createList':
    case 'createDraft':
      return 'added'
    case 'match':
      return MATCH_COUNT_KEY[d.changeType]
    case 'reject':
    case 'leftOut':
      return 'unchanged'
  }
}

/**
 * A List's versions: its origin, then one per arrival with a decided row on it (by received time, then id), the
 * last marked current. `bookingListIds` maps each Booking to its List.
 */
export function listVersions(
  list: { id: string; origin: ListOrigin; createdAtISO?: string },
  intake: ListVersionIntake,
  bookingListIds: Readonly<Record<string, string>>,
  names?: ListVersionNames,
): ListVersion[] {
  const byBatch = new Map<string, ImportRow[]>()
  for (const row of Object.values(intake.rows)) {
    if (row.status === 'open') continue
    if (listOfRow(row, bookingListIds) !== list.id) continue
    const rows = byBatch.get(row.batchId) ?? []
    rows.push(row)
    byBatch.set(row.batchId, rows)
  }

  const arrivals: ListVersion[] = []
  for (const [batchId, rows] of byBatch) {
    const batch = intake.batches[batchId]
    if (batch === undefined) continue
    const order = new Map(batch.rowIds.map((id, i) => [id, i]))
    rows.sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id))
    const counts = { ...NO_COUNTS }
    for (const row of rows) counts[countKey(row)] += 1
    arrivals.push({ atISO: batch.receivedAtISO, kind: 'arrival', ...arrivalVersionOf(batch, names), batchId, rowIds: rows.map((r) => r.id), counts, current: false })
  }
  arrivals.sort((a, b) => a.atISO.localeCompare(b.atISO) || (a.batchId ?? '').localeCompare(b.batchId ?? ''))

  const origin: ListVersion = {
    atISO: list.createdAtISO ?? arrivals[0]?.atISO ?? '',
    kind: 'origin',
    ...originVersionOf(list.origin, names),
    rowIds: [],
    counts: { ...NO_COUNTS },
    current: false,
  }
  const versions = [origin, ...arrivals]
  versions[versions.length - 1]!.current = true
  return versions
}

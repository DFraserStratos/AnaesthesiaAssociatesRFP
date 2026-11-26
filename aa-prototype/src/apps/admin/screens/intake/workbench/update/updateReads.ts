/**
 * The update bench's header reads (build plan Phase 69, Work item 3): a held List's versions, an arrival's match
 * basis and its rows that match a waiting stub. Hooks over `useAppStore` slices, derived with `useMemo` so a render
 * with no store change returns the same object (as `store/intakeSelectors.ts` does). Every rule lives in the read
 * models (`domain/intake/listVersions.ts`, `matchBasis.ts`, `stubMatch.ts`); `versionStops` only lays the versions
 * out as the track draws them.
 */

import { useMemo } from 'react'
import { arrivalSourceMark, type ArrivalItem, type ArrivalSourceMark } from '../../../../../../domain/intake/arrivals'
import { listVersions, type ListVersion } from '../../../../../../domain/intake/listVersions'
import { matchBasisFor, type ArrivalMatchBasis } from '../../../../../../domain/intake/matchBasis'
import { stubMatchesForItem } from '../../../../../../domain/intake/stubMatch'
import type { ImportBatch, List } from '../../../../../../domain/types'
import { useAppStore } from '../../../../../../store/appStore'
import { matchingView } from '../../../../../../store/matchingSelectors'

const NO_VERSIONS: ListVersion[] = []

/** A held List by id (removed Lists read as missing). */
export function useHeldList(listId: string | undefined): List | undefined {
  const list = useAppStore((s) => (listId === undefined ? undefined : s.schedule.lists[listId]))
  return list !== undefined && list.removedAtISO === undefined ? list : undefined
}

/** A List's versions, its origin first and the current one last (`listVersions`), with hospitals named from the masters. */
export function useListVersions(listId: string | undefined): ListVersion[] {
  const lists = useAppStore((s) => s.schedule.lists)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const intake = useAppStore((s) => s.intake)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  return useMemo(() => {
    const list = listId === undefined ? undefined : lists[listId]
    if (list === undefined) return NO_VERSIONS
    const bookingListIds: Record<string, string> = {}
    for (const b of Object.values(bookings)) bookingListIds[b.id] = b.listId
    const names = { hospitals: Object.fromEntries(Object.values(hospitals).map((h) => [h.id, h.name])) }
    return listVersions(list, intake, bookingListIds, names)
  }, [listId, lists, bookings, intake, hospitals])
}

/** Which rows of an arrival are rows of the arriving List (a removal row stands for a Booking the sender left off). */
function listRowIds(arrival: ArrivalItem, rows: Readonly<Record<string, { removalOfBookingId?: string }>>): string[] {
  return arrival.rowIds.filter((id) => rows[id] !== undefined && rows[id]!.removalOfBookingId === undefined)
}

/**
 * Why the arrival matched its held List (`matchBasisFor`), over the arriving List's own rows: a removal row names a
 * Booking the sender left off, so it is never counted as a patient found. Undefined for an arrival with no held List.
 */
export function useMatchBasis(arrival: ArrivalItem): ArrivalMatchBasis | undefined {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)
  return useMemo(() => {
    if (arrival.heldListId === undefined) return undefined
    const view = matchingView({ masters, schedule, intake })
    return matchBasisFor(view, intake, { ...arrival, rowIds: listRowIds(arrival, intake.rows) })
  }, [arrival, masters, schedule, intake])
}

/** How many of the arrival's patients are on the List (its rows that are not removals). */
export function usePatientRowCount(arrival: ArrivalItem): number {
  const rows = useAppStore((s) => s.intake.rows)
  return useMemo(() => listRowIds(arrival, rows).length, [arrival, rows])
}

/** How many of the arrival's open rows carry the NHI a waiting stub needs (`stubMatchesForItem`). */
export function useStubMatchCount(arrival: ArrivalItem): number {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)
  return useMemo(() => stubMatchesForItem(matchingView({ masters, schedule, intake }), intake, arrival).length, [arrival, masters, schedule, intake])
}

// ---------------------------------------------------------------------------
// The version track's stops
// ---------------------------------------------------------------------------

/** Where a stop came from: a source mark (hospital or rooms), or the office's own words for a List made by hand or recurring. */
export type VersionStopSource = { kind: 'mark'; mark: ArrivalSourceMark } | { kind: 'office'; label: string; recurring: boolean }

export interface VersionStop {
  key: string
  kind: 'origin' | 'arrival' | 'proposed'
  source: VersionStopSource
  atISO: string
  /** A later version from the rooms after an earlier one: "Re-sent". */
  resent: boolean
  /** The arrival on the bench. */
  proposed: boolean
  /** Still waiting for the office's decision (the proposed stop reads "now"). */
  pending: boolean
  /** The List as AA holds it now. */
  current: boolean
}

function originSource(origin: List['origin'], hospitals: Readonly<Record<string, { name: string }>>, label: string): VersionStopSource {
  switch (origin.kind) {
    case 'pdf':
      return { kind: 'mark', mark: { kind: 'rooms', label: 'Rooms PDF', senderEmail: origin.senderEmail } }
    case 'hospital':
      return { kind: 'mark', mark: { kind: 'hospital', hospitalId: origin.hospitalId, label: hospitals[origin.hospitalId]?.name ?? origin.hospitalId } }
    case 'manual':
      return { kind: 'office', label, recurring: false }
    case 'recurring':
      return { kind: 'office', label, recurring: true }
  }
}

/**
 * The arrival that made the List, when `listVersions` lists it beside the origin it made (a List placed from the
 * rooms' PDF reads as the origin and then that PDF's arrival): the same version twice, so the track shows it once.
 */
function madeTheList(origin: List['origin'], version: ListVersion, batch: Pick<ImportBatch, 'arrivalSource' | 'pdfListId'> | undefined): boolean {
  if (batch === undefined || version.kind !== 'arrival') return false
  if (origin.kind === 'pdf') return origin.pdfListId !== undefined && batch.pdfListId === origin.pdfListId
  if (origin.kind === 'hospital') return batch.arrivalSource.kind === 'hospitalFeed' && batch.arrivalSource.hospitalId === origin.hospitalId && version.counts.added > 0
  return false
}

/**
 * The versions as the track draws them: each with its source mark, the proposed one marked (the arrival on the bench:
 * appended while it waits, else the version its rows made), "Re-sent" on a rooms' version after an earlier one.
 */
export function versionStops(
  versions: readonly ListVersion[],
  arrival: Pick<ArrivalItem, 'batchId' | 'source' | 'receivedAtISO' | 'decided'>,
  list: Pick<List, 'origin'>,
  batches: Readonly<Record<string, Pick<ImportBatch, 'arrivalSource' | 'pdfListId'>>>,
  hospitals: Readonly<Record<string, { id: string; name: string }>>,
): VersionStop[] {
  const first = versions[1]
  const folded = versions[0]?.kind === 'origin' && first !== undefined && madeTheList(list.origin, first, first.batchId !== undefined ? batches[first.batchId] : undefined)
  const shown = folded ? versions.slice(1) : versions
  const stops: VersionStop[] = shown.map((v, i) => {
    const batch = v.batchId !== undefined ? batches[v.batchId] : undefined
    const source: VersionStopSource =
      v.kind === 'origin' || batch === undefined
        ? originSource(list.origin, hospitals, v.label)
        : { kind: 'mark', mark: arrivalSourceMark(batch, hospitals) }
    const proposed = v.batchId !== undefined && v.batchId === arrival.batchId
    const kind = folded && i === 0 ? 'origin' : v.kind
    return { key: v.batchId ?? `origin-${i}`, kind, source, atISO: v.atISO, resent: false, proposed, pending: proposed && !arrival.decided, current: v.current }
  })
  const onTrack = stops.some((s) => s.proposed)
  if (!arrival.decided && !onTrack) {
    stops.push({ key: arrival.batchId, kind: 'proposed', source: { kind: 'mark', mark: arrival.source }, atISO: arrival.receivedAtISO, resent: false, proposed: true, pending: true, current: false })
  }
  let roomsBefore = false
  return stops.map((s) => {
    const rooms = s.source.kind === 'mark' && s.source.mark.kind === 'rooms'
    const resent = rooms && roomsBefore
    if (rooms) roomsBefore = true
    return resent ? { ...s, resent } : s
  })
}

const NO_STOPS: VersionStop[] = []

/** The version track's stops for a held List and the arrival on the bench. */
export function useVersionStops(listId: string | undefined, arrival: ArrivalItem): VersionStop[] {
  const versions = useListVersions(listId)
  const list = useHeldList(listId)
  const batches = useAppStore((s) => s.intake.batches)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  return useMemo(() => (list === undefined ? NO_STOPS : versionStops(versions, arrival, list, batches, hospitals)), [versions, arrival, list, batches, hospitals])
}

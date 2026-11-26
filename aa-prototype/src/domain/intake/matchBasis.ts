/**
 * Why an arriving List matched the List AA holds (build plan Phase 68; US-02.1.3, US-02.1.4): each of the four keys
 * (surgeon, hospital, day, session) agreed or not, and how many of its patients were found on that List by NHI.
 * Never a score. Pure.
 */

import { effectiveIncoming, validNhiOf, type MatchingView } from './matching'
import type { ArrivalIntake, ArrivalItem } from './arrivals'

export type MatchKeyId = 'surgeon' | 'hospital' | 'day' | 'session'

export const MATCH_KEY_LABELS: Record<MatchKeyId, string> = {
  surgeon: 'Surgeon',
  hospital: 'Hospital',
  day: 'Day',
  session: 'Session',
}

export interface ArrivalMatchBasis {
  keys: { key: MatchKeyId; label: string; agreed: boolean }[]
  /** Rows with a valid NHI (`of`), and those whose patient has a Booking on the held List that is not cancelled (`found`). */
  patientsByNhi: { found: number; of: number }
}

/** The match basis of an item against its held List; undefined when it holds none (a new List). */
export function matchBasisFor(view: MatchingView, intake: Pick<ArrivalIntake, 'rows'>, item: ArrivalItem): ArrivalMatchBasis | undefined {
  if (item.heldListId === undefined) return undefined
  const list = view.lists[item.heldListId]
  if (list === undefined) return undefined
  const agreed: Record<MatchKeyId, boolean> = {
    surgeon: item.surgeonId !== undefined && list.surgeonId === item.surgeonId,
    hospital: list.hospitalId === item.hospitalId,
    day: item.dateISO !== undefined && list.dateISO === item.dateISO,
    session: item.session !== undefined && list.session === item.session,
  }
  const keys = (Object.keys(MATCH_KEY_LABELS) as MatchKeyId[]).map((key) => ({ key, label: MATCH_KEY_LABELS[key], agreed: agreed[key] }))
  const onList = new Set(
    Object.values(view.bookings)
      .filter((b) => b.listId === list.id && !b.cancelled && b.patient.nhi !== undefined)
      .map((b) => b.patient.nhi!),
  )
  let of = 0
  let found = 0
  for (const id of item.rowIds) {
    const row = intake.rows[id]
    if (row === undefined) continue
    const nhi = validNhiOf(effectiveIncoming(row))
    if (nhi === undefined) continue
    of += 1
    if (onList.has(nhi)) found += 1
  }
  return { keys, patientsByNhi: { found, of } }
}

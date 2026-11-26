/**
 * An arriving row that carries a waiting row's NHI (build plan Phase 68; US-02.1.4 "Stub on the List", FT-02.6): a
 * standing stub on the List the arriving row lands on, whose waiting row names the same patient (name and date of
 * birth), while the arriving row carries a valid NHI. The bench offers to take the NHI from it. Pure; reads `stubs.ts`.
 */

import type { ImportRow, Stub } from '../types'
import { effectiveIncoming, normaliseName, validNhiOf, type MatchingView } from './matching'
import { stubsOnList } from './stubs'
import { assessArrivalRow, type ArrivalIntake, type ArrivalItem } from './arrivals'

export interface StubMatch {
  stubId: string
  waitingRowId: string
  /** The arriving row's NHI, normalised. */
  nhi: string
}

type StubIntake = ArrivalIntake & { stubs: Readonly<Record<string, Stub>> }

/** The standing stub an arriving row could resolve, if any (the first by time, then id). */
export function stubMatchFor(view: MatchingView, intake: StubIntake, row: ImportRow): StubMatch | undefined {
  const fields = effectiveIncoming(row)
  const nhi = validNhiOf(fields)
  const dob = fields.patient.dobISO
  if (nhi === undefined || dob === undefined || dob === '') return undefined
  const name = normaliseName(fields.patient.name)
  if (name === '') return undefined
  const a = assessArrivalRow(view, row)
  const listIds = [a.targetListId, a.match !== undefined ? a.match.listId : undefined].filter((id, i, all): id is string => id !== undefined && all.indexOf(id) === i)
  for (const listId of listIds) {
    for (const stub of stubsOnList(intake.stubs, listId)) {
      if (stub.importRowId === row.id) continue
      const waiting = intake.rows[stub.importRowId]
      if (waiting === undefined) continue
      const wf = effectiveIncoming(waiting)
      if (normaliseName(wf.patient.name) === name && wf.patient.dobISO === dob) return { stubId: stub.id, waitingRowId: waiting.id, nhi }
    }
  }
  return undefined
}

/** Each open row of an item that matches a standing stub. */
export function stubMatchesForItem(view: MatchingView, intake: StubIntake, item: ArrivalItem): (StubMatch & { rowId: string })[] {
  return item.rowIds.flatMap((id) => {
    const row = intake.rows[id]
    if (row === undefined || row.status !== 'open') return []
    const match = stubMatchFor(view, intake, row)
    return match === undefined ? [] : [{ rowId: id, ...match }]
  })
}

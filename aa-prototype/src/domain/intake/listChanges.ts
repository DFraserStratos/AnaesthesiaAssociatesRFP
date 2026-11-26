/**
 * What an arriving List does, row by row (build plan Phase 68; US-02.1.4, DM-11): each row added, changed, cancelled,
 * unchanged, removed or waiting for an NHI, with the Booking it touches, its field differences and its own flags.
 * Pure: it reads the matcher's view and the intake records, and reuses the matcher and the arrivals' row reading.
 */

import type { ImportRow, IsoDate, WallTime } from '../types'
import { effectiveIncoming, type FieldDiff, type MatchingView } from './matching'
import {
  arrivalCounts,
  arrivalRowOrder,
  assessArrivalRow,
  rowArrivalFlags,
  rowChangeOf,
  type ArrivalCounts,
  type ArrivalExtras,
  type ArrivalFlag,
  type ArrivalIntake,
  type RowChange,
} from './arrivals'

/** One row of an arriving List as the Workbench shows it. */
export interface ListChangeRow {
  rowId: string
  change: RowChange
  status: ImportRow['status']
  patientName: string
  nhi?: string
  dobISO?: IsoDate
  scheduledTime?: WallTime
  /** The wording as sent, never corrected. */
  procedureText?: string
  /** The Booking the row touches: its decision's, the matcher's match, or the Booking a removal would cancel. */
  bookingId?: string
  diffs: FieldDiff[]
  flags: ArrivalFlag[]
}

function bookingOf(view: MatchingView, row: ImportRow, change: RowChange): string | undefined {
  const d = row.decision
  if (d !== undefined && d.kind !== 'reject' && d.kind !== 'leftOut') return d.bookingId
  if (row.removalOfBookingId !== undefined) return row.removalOfBookingId
  if (change === 'waiting') return undefined
  return assessArrivalRow(view, row).match?.bookingId
}

/**
 * The rows of an arriving List (by time, then patient name) with what each does, and the List's counts. The feed
 * item's counts come from the same row reading (`rowChangeOf`, `arrivalCounts`).
 */
export function listChangeSummary(
  view: MatchingView,
  intake: ArrivalIntake,
  rowIds: readonly string[],
  extras: ArrivalExtras,
): { rows: ListChangeRow[]; counts: Omit<ArrivalCounts, 'rows' | 'open'> } {
  const rows = rowIds.flatMap((id) => {
    const row = intake.rows[id]
    return row === undefined ? [] : [row]
  })
  rows.sort(arrivalRowOrder)
  const reads = rows.map((row) => ({ row, change: rowChangeOf(view, row) }))
  const out: ListChangeRow[] = reads.map(({ row, change }) => {
    const f = effectiveIncoming(row)
    const bookingId = bookingOf(view, row, change)
    const nhi = f.patient.nhi?.trim()
    const text = row.incoming.procedure?.text
    return {
      rowId: row.id,
      change,
      status: row.status,
      patientName: f.patient.name,
      ...(nhi !== undefined && nhi !== '' ? { nhi } : {}),
      ...(f.patient.dobISO !== undefined && f.patient.dobISO !== '' ? { dobISO: f.patient.dobISO } : {}),
      ...(f.scheduledTime !== undefined ? { scheduledTime: f.scheduledTime } : {}),
      ...(text !== undefined ? { procedureText: text } : {}),
      ...(bookingId !== undefined ? { bookingId } : {}),
      diffs: change === 'waiting' || change === 'removed' ? [] : assessArrivalRow(view, row).diffs,
      flags: rowArrivalFlags(intake, extras, row, change),
    }
  })
  const { rows: _rows, open: _open, ...counts } = arrivalCounts(reads)
  return { rows: out, counts }
}

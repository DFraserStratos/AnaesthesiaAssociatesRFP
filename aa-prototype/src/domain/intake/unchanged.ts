/**
 * Lists that match exactly (build plan Phase 68; DM-21, D125): an arriving List whose every row changes nothing.
 * Every row is staged and shown, identical ones included, never skipped; an identical re-arrival whose earlier rows
 * are all decided is an unchanged List waiting for a person's confirm. Pure.
 */

import type { ImportRow, IncomingBookingFields } from '../types'
import type { ArrivalIntake, ArrivalItem } from './arrivals'

/** An item whose every row changes nothing. */
export function isUnchangedList(item: ArrivalItem): boolean {
  return item.kind === 'matchesExactly'
}

/** The undecided Lists that match exactly, in feed order (confirmed together). */
export function unchangedLists(items: readonly ArrivalItem[]): ArrivalItem[] {
  return items.filter((i) => isUnchangedList(i) && !i.decided)
}

/** A row's content as sent, keys sorted, so two identical rows give one key (the store's `incomingKey`, here in the domain). */
export function incomingFieldsKey(fields: IncomingBookingFields): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : typeof v === 'object' && v !== null
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, sort((v as Record<string, unknown>)[k])]),
          )
        : v
  return JSON.stringify(sort(fields))
}

function earlier(a: ImportRow, b: ImportRow): boolean {
  return a.receivedAtISO < b.receivedAtISO || (a.receivedAtISO === b.receivedAtISO && a.id.localeCompare(b.id) < 0)
}

/** Every row of the item is identical, as sent, to an earlier row of another arrival that is already decided. */
export function identicalReArrival(intake: Pick<ArrivalIntake, 'rows'>, item: ArrivalItem): boolean {
  if (item.rowIds.length === 0) return false
  const rows = item.rowIds.map((id) => intake.rows[id])
  if (rows.some((r) => r === undefined)) return false
  const decidedByKey = new Map<string, ImportRow[]>()
  for (const r of Object.values(intake.rows)) {
    if (r.status === 'open') continue
    const key = incomingFieldsKey(r.incoming)
    const list = decidedByKey.get(key)
    if (list === undefined) decidedByKey.set(key, [r])
    else list.push(r)
  }
  return (rows as ImportRow[]).every((row) =>
    (decidedByKey.get(incomingFieldsKey(row.incoming)) ?? []).some((e) => e.id !== row.id && e.batchId !== row.batchId && earlier(e, row)),
  )
}

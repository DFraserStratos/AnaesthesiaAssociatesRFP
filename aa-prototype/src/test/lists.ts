/**
 * Test helpers for the List union (catch-up Phase 31): a List is an
 * AssignedList (ACTIVE, SUBMITTED or AUTHORISED, with an anaesthetist and a
 * Slot) or a DraftList (DRAFT, neither). Tests that read a seeded assigned
 * List's anaesthetist or Slot narrow through these, so a wrong pick fails
 * loudly instead of compiling to `undefined`.
 */

import type { AssignedList, DraftList, List } from '../domain/types'

export function assigned(list: List | undefined, label = 'list'): AssignedList {
  if (list === undefined) throw new Error(`${label}: no List`)
  if (list.state === 'DRAFT') throw new Error(`${label}: ${list.id} is a Draft List`)
  return list
}

export function draft(list: List | undefined, label = 'list'): DraftList {
  if (list === undefined) throw new Error(`${label}: no List`)
  if (list.state !== 'DRAFT') throw new Error(`${label}: ${list.id} is not a Draft List`)
  return list
}

/** Every assigned List in a record (the backdrop history included). */
export function assignedLists(lists: Readonly<Record<string, List>>): AssignedList[] {
  return Object.values(lists).filter((l): l is AssignedList => l.state !== 'DRAFT')
}

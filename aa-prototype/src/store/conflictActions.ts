/**
 * The office clearing a conflict, and flagging it again (catch-up Phase 30;
 * US-01.5.4 "the conflict clears once the List is covered or the clash is
 * removed"; OQ-09 answered: a plain soft warning, so no reason is required).
 *
 * A clear is held as a `ConflictClear` on the List, keyed on the conflict's
 * cause. It holds only while that cause stands: the reconcile in `mutate()`
 * drops it the moment the cause goes, so a clash that goes and comes back
 * flags again. Neither action writes `List.conflicts`: the reconcile hides a
 * cleared conflict and shows it again when the clear is removed.
 */

import { CONFLICT_REASONS, conflictFactsFor, describeConflict, expectedConflicts, holidayIndex, liveClears } from '../domain/conflicts'
import type { ConflictClear, List } from '../domain/types'
import { clockISO, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { conflictLookups } from './conflictReconcile'

function expectedFor(state: AppState, list: List) {
  return expectedConflicts(
    list,
    conflictFactsFor(list, { slots: state.schedule.slots, statuses: state.masters.slotStatuses, holidays: holidayIndex(state.masters.holidays) }),
  )
}

/** Clear one live conflict on a List (office only). The note is optional. */
export function clearListConflict(api: AppStoreApi, actor: Actor, listId: string, cause: string, note?: string): Outcome<{ listId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can clear a conflict.')
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  const expected = expectedFor(state, list)
  const conflict = expected.find((c) => c.cause === cause)
  if (liveClears(list, expected).some((c) => c.cause === cause)) return refuse('alreadyCleared', 'That conflict is already cleared.')
  if (conflict === undefined) return refuse('conflictNotFound', 'That conflict is no longer on the List.')

  const trimmed = note?.trim() ?? ''
  const clear: ConflictClear = { cause, by: actor.who, role: actor.role, atISO: clockISO(state.clock), ...(trimmed !== '' ? { note: trimmed } : {}) }
  const { detail } = describeConflict(conflict, list, conflictLookups(state))
  mutate(
    api,
    actor,
    {
      entityType: 'list',
      entityId: listId,
      action: 'list.conflictCleared',
      after: { cause, kind: conflict.kind, reason: CONFLICT_REASONS[conflict.kind], detail, ...(trimmed !== '' ? { note: trimmed } : {}) },
      stampBookingId: null,
    },
    (s) => {
      const current = s.schedule.lists[listId]!
      return {
        schedule: {
          ...s.schedule,
          lists: { ...s.schedule.lists, [listId]: { ...current, conflictClears: [...(current.conflictClears ?? []), clear] } },
        },
      }
    },
  )
  return ok({ listId })
}

/** "Flag again": remove the office's clear so the conflict shows again (office only). */
export function restoreListConflict(api: AppStoreApi, actor: Actor, listId: string, cause: string): Outcome<{ listId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can flag a conflict again.')
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  const clear = (list.conflictClears ?? []).find((c) => c.cause === cause)
  if (clear === undefined) return refuse('notCleared', 'That conflict is not cleared.')
  const conflict = expectedFor(state, list).find((c) => c.cause === cause)
  mutate(
    api,
    actor,
    {
      entityType: 'list',
      entityId: listId,
      action: 'list.conflictRestored',
      before: { cause, by: clear.by, atISO: clear.atISO, ...(clear.note !== undefined ? { note: clear.note } : {}) },
      after: { cause, ...(conflict !== undefined ? { reason: CONFLICT_REASONS[conflict.kind] } : {}) },
      stampBookingId: null,
    },
    (s) => {
      const current = s.schedule.lists[listId]!
      const remaining = (current.conflictClears ?? []).filter((c) => c.cause !== cause)
      const next: List = { ...current }
      if (remaining.length > 0) next.conflictClears = remaining
      else delete next.conflictClears
      return { schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: next } } }
    },
  )
  return ok({ listId })
}

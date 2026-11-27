/**
 * The Lists section's numbers (US-13.1.3; OQ-151): the one home for its tab counts and its side-nav
 * badge. A tab's number counts only what needs doing there (Finances' rule), and is hidden at zero:
 * waiting Draft Lists, open conflicts from the demo day on, Lists with Procedures still needing a
 * Contract (every date), and submitted Lists. The badge counts each List once however many tabs it is
 * on; in Urgent mode only Lists dated up to a week after the demo day, everything earlier included.
 * Pure over state slices; the demo clock's day, never the machine's.
 */

import { addDaysISO } from '../../../../domain/clock'
import type { AssignedList } from '../../../../domain/types'
import type { AppState } from '../../../../store/appStore'
import {
  conflictRows,
  listsNeedingContracts as storeListsNeedingContracts,
  scheduleHorizon,
  waitingDraftLists,
  type ConflictRow,
  type ListNeedingContractsRow,
} from '../../../../store'
import type { ListsTab } from './listsPaths'

/** The slices the counts read. */
export type ListsCountsState = Pick<AppState, 'schedule' | 'masters' | 'clock' | 'appSettings'>

export type { ListNeedingContractsRow }

/** How the side-nav badge counts: every List that needs something, or only the next week's and anything earlier. */
export type ListsBadgeMode = 'all' | 'urgent'

/** Days after the demo day an Urgent badge still counts. */
export const URGENT_DAYS = 7

/**
 * Contracts to set (US-04.3.12): one row per List, any date, whose Procedures still need a Contract,
 * with `set` and `total` counts and the Procedures to set; past-dated Lists first (they hold up
 * submission), then soonest first. Draft Lists (no anaesthetist) and authorised Lists never appear.
 * The Day rail's Contracts tab reads the same rows (`useListsNeedingContracts`).
 */
export function listsNeedingContracts(state: Pick<AppState, 'masters' | 'schedule' | 'clock'>): ListNeedingContractsRow[] {
  return storeListsNeedingContracts(state)
}

/** Open (uncleared) conflicts from the demo day to the far end of the horizon: what the Conflicts tab counts. */
export function openConflictRows(state: ListsCountsState): ConflictRow[] {
  return conflictRows(state, { fromISO: state.clock.todayISO, toISO: scheduleHorizon(state).endISO })
}

/** Submitted Lists waiting for the office to authorise them, oldest List date first. */
export function listsToAuthorise(state: { schedule: Pick<AppState['schedule'], 'lists'> }): AssignedList[] {
  return Object.values(state.schedule.lists)
    .filter((l): l is AssignedList => l.state === 'SUBMITTED' && l.removedAtISO === undefined)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.anaesthetistId.localeCompare(b.anaesthetistId) || a.id.localeCompare(b.id))
}

/** Each tab's List ids that need doing, with their dates (the badge's input). */
function listsByTab(state: ListsCountsState): Record<ListsTab, { id: string; dateISO: string }[]> {
  const conflicts = new Map<string, string>()
  for (const r of openConflictRows(state)) conflicts.set(r.listId, r.dateISO)
  return {
    'draft-lists': waitingDraftLists(state).map((l) => ({ id: l.id, dateISO: l.dateISO })),
    conflicts: [...conflicts].map(([id, dateISO]) => ({ id, dateISO })),
    'contracts-to-set': listsNeedingContracts(state).map((r) => ({ id: r.listId, dateISO: r.dateISO })),
    'to-authorise': listsToAuthorise(state).map((l) => ({ id: l.id, dateISO: l.dateISO })),
  }
}

/**
 * The tab strip's numbers: what needs doing on each tab (zero is hidden), each counting Lists. A List
 * at a hospital closed twice that day (its own closure and a public holiday) counts once on
 * Conflicts, as the tab's own count line does (`conflictListCounts`).
 */
export function listsTabCounts(state: ListsCountsState): Record<ListsTab, number> {
  return {
    'draft-lists': waitingDraftLists(state).length,
    conflicts: new Set(openConflictRows(state).map((r) => r.listId)).size,
    'contracts-to-set': listsNeedingContracts(state).length,
    'to-authorise': listsToAuthorise(state).length,
  }
}

/** The last day an Urgent badge counts: the demo day plus `URGENT_DAYS`. */
export function urgentUntilISO(state: Pick<AppState, 'clock'>): string {
  return addDaysISO(state.clock.todayISO, URGENT_DAYS)
}

/**
 * The Lists side-nav badge (OQ-151): distinct Lists across the four tabs, a List counted once however
 * many tabs it is on. `urgent` counts only Lists dated up to `URGENT_DAYS` after the demo day,
 * everything earlier included.
 */
export function listsBadge(state: ListsCountsState, mode: ListsBadgeMode): number {
  const until = mode === 'urgent' ? urgentUntilISO(state) : undefined
  const ids = new Set<string>()
  for (const rows of Object.values(listsByTab(state))) {
    for (const r of rows) if (until === undefined || r.dateISO <= until) ids.add(r.id)
  }
  return ids.size
}

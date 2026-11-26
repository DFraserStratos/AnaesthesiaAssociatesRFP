/**
 * Intake's read side (build plan Phase 68; US-02.1.4, D117, D125): the arrivals feed for a filter and search, one
 * arrival by key, the counts per filter, an arrival's rows, and the sources. The pure read models live in
 * `domain/intake/arrivals.ts` and `listChanges.ts`; this file hands them the store's slices, memoised on the identity
 * of `masters`, `schedule` and `intake` (as `matchingView` is), and wraps them in hooks with stable results.
 */

import { useMemo } from 'react'
import type { IntakeSource } from '../domain/types'
import {
  arrivalItems,
  feedFilterCounts,
  feedGroups,
  matchesFeedFilter,
  type ArrivalExtras,
  type ArrivalGroup,
  type ArrivalItem,
  type FeedFilter,
} from '../domain/intake/arrivals'
import { inboxItems, type InboxQuery } from '../domain/intake/inbox'
import { listChangeSummary, type ListChangeRow } from '../domain/intake/listChanges'
import { useAppStore, type AppState } from './appStore'
import { matchingView } from './matchingSelectors'
import { dataQualityItems } from './selectors'

export type IntakeViewState = Pick<AppState, 'masters' | 'schedule' | 'intake'>

export interface ArrivalFeedCounts {
  toDecide: number
  needsNhi: number
  roomsPdfs: number
  decided: number
  byHospital: Record<string, number>
}

interface ArrivalsCache {
  masters: IntakeViewState['masters']
  schedule: IntakeViewState['schedule']
  intake: IntakeViewState['intake']
  extras: ArrivalExtras
  items: ArrivalItem[]
  byKey: Map<string, ArrivalItem>
  /** Each row's arriving List item (never a `needsNhi` item). */
  listKeyByRow: Map<string, string>
  counts: ArrivalFeedCounts
}

let last: ArrivalsCache | undefined

function extrasOf(state: IntakeViewState): ArrivalExtras {
  const dataQualityNhis = new Set(dataQualityItems(state).flatMap((i) => (i.nhi !== undefined ? [i.nhi] : [])))
  const anaesthetists = Object.fromEntries(
    Object.entries(state.masters.anaesthetists).map(([id, a]) => [id, { name: a.name, ...(a.hpiId !== undefined ? { hpiId: a.hpiId } : {}) }]),
  )
  return { dataQualityNhis, anaesthetists }
}

function cacheOf(state: IntakeViewState): ArrivalsCache {
  const { masters, schedule, intake } = state
  if (last !== undefined && last.masters === masters && last.schedule === schedule && last.intake === intake) return last
  const extras = extrasOf(state)
  const items = arrivalItems(matchingView(state), intake, extras)
  const byKey = new Map(items.map((i) => [i.key, i]))
  const listKeyByRow = new Map<string, string>()
  for (const item of items) {
    if (item.kind === 'needsNhi') continue
    for (const rowId of item.rowIds) listKeyByRow.set(rowId, item.key)
  }
  last = { masters, schedule, intake, extras, items, byKey, listKeyByRow, counts: feedFilterCounts(items) }
  return last
}

/** Every feed item, in feed order. */
export function arrivalItemsOf(state: IntakeViewState): ArrivalItem[] {
  return cacheOf(state).items
}

/** The feed's groups for a filter and search. */
export function arrivalFeed(state: IntakeViewState, filter: FeedFilter, q: string): ArrivalGroup[] {
  return feedGroups(cacheOf(state).items, filter, q, state.intake)
}

/** The inbox's rows for a query, in its order (`domain/intake/inbox.ts`). */
export function inboxItemsOf(state: IntakeViewState, query: InboxQuery, todayISO: string): ArrivalItem[] {
  return inboxItems(cacheOf(state).items, query, todayISO, state.intake)
}

/** One feed item by its key. */
export function arrivalByKey(state: IntakeViewState, key: string): ArrivalItem | undefined {
  return cacheOf(state).byKey.get(key)
}

/**
 * The item a row is shown under: its arriving List, or, when that List is not under To decide because the row waits
 * for an NHI, the row's own Needs NHI item.
 */
export function arrivalKeyForRow(state: IntakeViewState, rowId: string): string | undefined {
  const cache = cacheOf(state)
  const listKey = cache.listKeyByRow.get(rowId)
  if (listKey === undefined) return undefined
  const item = cache.byKey.get(listKey)
  const nhiKey = `nhi~${rowId}`
  if (item !== undefined && !matchesFeedFilter(item, { kind: 'toDecide' }) && cache.byKey.has(nhiKey)) return nhiKey
  return listKey
}

/** How many items each filter shows. */
export function arrivalFeedCounts(state: IntakeViewState): ArrivalFeedCounts {
  return cacheOf(state).counts
}

/** An item's rows with what each does (none for an unknown key, an unreadable PDF or a held message). */
export function arrivalRows(state: IntakeViewState, key: string): ListChangeRow[] {
  const cache = cacheOf(state)
  const item = cache.byKey.get(key)
  if (item === undefined || item.rowIds.length === 0) return []
  return listChangeSummary(matchingView(state), state.intake, item.rowIds, cache.extras).rows
}

/** The hospitals whose feed is receiving (the feed's hospital filters), by name. */
export function connectedHospitals(state: Pick<AppState, 'intake' | 'masters'>): { hospitalId: string; name: string }[] {
  return Object.values(state.intake.sources)
    .flatMap((s) =>
      s.kind === 'hospitalFeed' && s.state === 'receiving' && s.hospitalId !== undefined
        ? [{ hospitalId: s.hospitalId, name: state.masters.hospitals[s.hospitalId]?.name ?? s.name }]
        : [],
    )
    .sort((a, b) => a.name.localeCompare(b.name) || a.hospitalId.localeCompare(b.hospitalId))
}

function sourceRank(s: IntakeSource): number {
  if (s.kind === 'hospitalFeed' && s.state === 'receiving') return 0
  if (s.kind === 'mailbox') return 1
  return 2
}

/** Every source: the hospital feeds receiving, the mailbox, then the hospitals not connected; each by name. */
export function intakeSources(state: Pick<AppState, 'intake'>): IntakeSource[] {
  return Object.values(state.intake.sources).sort((a, b) => sourceRank(a) - sourceRank(b) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
}

// ---------------------------------------------------------------------------
// Hooks (stable results: slices from the store, derived with useMemo)
// ---------------------------------------------------------------------------

function useIntakeViewState(): IntakeViewState {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)
  return useMemo(() => ({ masters, schedule, intake }), [masters, schedule, intake])
}

/** The feed's groups; a fresh filter object per render does not recompute (memoised on its value). */
export function useArrivalFeed(filter: FeedFilter, q: string): ArrivalGroup[] {
  const state = useIntakeViewState()
  const filterKey = JSON.stringify(filter)
  return useMemo(() => arrivalFeed(state, JSON.parse(filterKey) as FeedFilter, q), [state, filterKey, q])
}

/** The inbox's rows; a fresh query object per render does not recompute (memoised on its value). */
export function useInboxItems(query: InboxQuery, todayISO: string): ArrivalItem[] {
  const state = useIntakeViewState()
  const queryKey = JSON.stringify(query)
  return useMemo(() => inboxItemsOf(state, JSON.parse(queryKey) as InboxQuery, todayISO), [state, queryKey, todayISO])
}

export function useArrival(key: string | undefined): ArrivalItem | undefined {
  const state = useIntakeViewState()
  return useMemo(() => (key === undefined ? undefined : arrivalByKey(state, key)), [state, key])
}

export function useArrivalFeedCounts(): ArrivalFeedCounts {
  const state = useIntakeViewState()
  return useMemo(() => arrivalFeedCounts(state), [state])
}

const NO_ROWS: ListChangeRow[] = []

export function useArrivalRows(key: string | undefined): ListChangeRow[] {
  const state = useIntakeViewState()
  return useMemo(() => (key === undefined ? NO_ROWS : arrivalRows(state, key)), [state, key])
}

export function useConnectedHospitals(): { hospitalId: string; name: string }[] {
  const intake = useAppStore((s) => s.intake)
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => connectedHospitals({ intake, masters }), [intake, masters])
}

export function useIntakeSources(): IntakeSource[] {
  const intake = useAppStore((s) => s.intake)
  return useMemo(() => intakeSources({ intake }), [intake])
}

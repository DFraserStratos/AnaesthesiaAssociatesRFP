/**
 * Stub selectors and hooks (catch-up Phase 33a; DM-58). A stub is read only
 * here and by the stub components: no Booking selector, count, fee,
 * completion, billing, BCTI, search or warning path reads the intake slice's
 * stubs (`stubIsolation.test.ts`).
 */

import { useMemo } from 'react'
import type { Stub } from '../domain/types'
import { listHeldByStub, stubsOnList } from '../domain/intake/stubs'
import type { AppState } from './appStore'
import { useAppStore } from './appStore'
import { bookingsForList } from './selectors'

type Lists = AppState['schedule']['lists']

/** A stub is shown only while its List is live: a List removed or deleted by any path hides it (its row still waits). */
function onLiveList(lists: Lists, s: Stub): boolean {
  const list = lists[s.listId]
  return list !== undefined && list.removedAtISO === undefined
}

/** A List's standing stubs, time-ordered (none on a removed or missing List). */
export function stubsForList(state: Pick<AppState, 'intake' | 'schedule'>, listId: string): Stub[] {
  return stubsOnList(state.intake.stubs, listId).filter((s) => onLiveList(state.schedule.lists, s))
}

/** The standing stub of a row, if any. */
export function stubForRow(state: Pick<AppState, 'intake'>, rowId: string): Stub | undefined {
  return Object.values(state.intake.stubs).find((s) => s.importRowId === rowId && s.status === 'standing')
}

/** The stub a row's Booking took the place of, if any (the Matching banner). */
export function resolvedStubForRow(state: Pick<AppState, 'intake'>, rowId: string): Stub | undefined {
  return Object.values(state.intake.stubs).find((s) => s.importRowId === rowId && s.status === 'resolved')
}

/** Every standing stub. */
export function standingStubCount(state: Pick<AppState, 'intake'>): number {
  return Object.values(state.intake.stubs).filter((s) => s.status === 'standing').length
}

/** Standing stub counts by List id (one pass, for grids and List rows). */
export function standingStubCountsByList(stubs: Readonly<Record<string, Stub>>, lists: Lists): Map<string, number> {
  const out = new Map<string, number>()
  for (const s of Object.values(stubs)) {
    if (s.status === 'standing' && onLiveList(lists, s)) out.set(s.listId, (out.get(s.listId) ?? 0) + 1)
  }
  return out
}

export function useListStubs(listId: string | undefined): Stub[] {
  const stubs = useAppStore((s) => s.intake.stubs)
  const list = useAppStore((s) => (listId === undefined ? undefined : s.schedule.lists[listId]))
  return useMemo(() => (listId === undefined || list === undefined || list.removedAtISO !== undefined ? [] : stubsOnList(stubs, listId)), [stubs, listId, list])
}

export function useStubCountsByList(): Map<string, number> {
  const stubs = useAppStore((s) => s.intake.stubs)
  const lists = useAppStore((s) => s.schedule.lists)
  return useMemo(() => standingStubCountsByList(stubs, lists), [stubs, lists])
}

/**
 * The stub guard (US-02.6.4, DM-18): the List has a standing stub and no
 * Booking that is not cancelled. Read live, never stored: resolving or
 * rejecting the stub, or the List gaining a Booking, lifts it. The one reader
 * `lifecycle.ts`'s guard and the apps' readings share.
 */
export function listHeldByStubOf(state: Pick<AppState, 'intake' | 'schedule'>, listId: string): boolean {
  const standing = stubsForList(state, listId).length
  if (standing === 0) return false
  const active = bookingsForList(state, listId).filter((b) => b.cancellation === undefined).length
  return listHeldByStub(active, standing)
}

export function useListHeldByStub(listId: string | undefined): boolean {
  return useAppStore((s) => (listId === undefined ? false : listHeldByStubOf(s, listId)))
}

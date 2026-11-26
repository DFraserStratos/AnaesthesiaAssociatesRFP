/**
 * The Needs NHI bench's reads (build plan Phase 72; US-11.1.5): the arrival's waiting row from `waitingNhiRows` (one
 * read model, never a second query), the List's anaesthetist in the short form ("Dr Souter's"), the Day view link that
 * opens a List's drawer, and "N days to go" in words.
 */

import { useMemo } from 'react'
import { useAppStore, waitingNhiRows, type AppState, type WaitingNhiRow } from '../../../../../../store'
import { drSurname, plural } from '../../../../../../shared/format'

/** The arrival's row still waiting for an NHI; undefined once its NHI is added (the row leaves Needs NHI). */
export function useWaitingNhiRow(rowIds: readonly string[]): WaitingNhiRow | undefined {
  const intake = useAppStore((s) => s.intake)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const clock = useAppStore((s) => s.clock)
  const audit = useAppStore((s) => s.audit)
  const key = rowIds.join('|')
  return useMemo(() => {
    const ids = new Set(key.split('|'))
    return waitingNhiRows({ intake, masters, schedule, clock, audit }).find((r) => ids.has(r.rowId))
  }, [intake, masters, schedule, clock, audit, key])
}

/** "Dr Souter's" for an assigned List; undefined for a Draft List or an unknown one. */
export function listOwnerOf(state: Pick<AppState, 'schedule' | 'masters'>, listId: string | undefined): string | undefined {
  if (listId === undefined) return undefined
  const list = state.schedule.lists[listId]
  if (list === undefined || list.anaesthetistId === undefined) return undefined
  const name = state.masters.anaesthetists[list.anaesthetistId]?.name
  return name !== undefined ? `${drSurname(name)}'s` : undefined
}

export function useListOwner(listId: string | undefined): string | undefined {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => listOwnerOf({ schedule, masters }, listId), [schedule, masters, listId])
}

/** The Day view on the List's day with its drawer open (the shell reads `openListId` from the navigation state). */
export function useListDayLink(listId: string | undefined): { to: string; state: { openListId: string } } | undefined {
  const dateISO = useAppStore((s) => (listId !== undefined ? s.schedule.lists[listId]?.dateISO : undefined))
  if (listId === undefined || dateISO === undefined) return undefined
  return { to: `/admin/day/${dateISO}`, state: { openListId: listId } }
}

/** Add NHI resolved: "Mere Tipene is now on Dr Souter's List." */
export function addedLine(patientName: string, owner: string | undefined): string {
  return `${patientName} is now on ${owner ?? 'its'} List.`
}

/** "14 days to go", "Today", or "Passed". */
export function daysToGoText(daysToGo: number): string {
  if (daysToGo < 0) return 'Passed'
  if (daysToGo === 0) return 'Today'
  return `${plural(daysToGo, 'day')} to go`
}

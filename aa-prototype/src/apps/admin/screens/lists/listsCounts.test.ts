import { describe, expect, it } from 'vitest'
import { freshAppState, waitingDraftLists, type AppState } from '../../../../store'
import { listsBadge, listsNeedingContracts, listsTabCounts, listsToAuthorise, openConflictRows, urgentUntilISO } from './listsCounts'

/** Every List id each tab counts, from the selectors the counts read. */
function tabIds(state: AppState): Record<string, Map<string, string>> {
  return {
    draft: new Map(waitingDraftLists(state).map((l) => [l.id, l.dateISO])),
    conflicts: new Map(openConflictRows(state).map((r) => [r.listId, r.dateISO])),
    contracts: new Map(listsNeedingContracts(state).map((r) => [r.listId, r.dateISO])),
    authorise: new Map(listsToAuthorise(state).map((l) => [l.id, l.dateISO])),
  }
}

/** A submitted List made to need a Contract too: one of its Procedures loses its Contract. */
function submittedNeedingContract(state: AppState): { state: AppState; listId: string } {
  const list = listsToAuthorise(state).find((l) => Object.values(state.schedule.bookings).some((b) => b.listId === l.id && b.cancellation === undefined))!
  const booking = Object.values(state.schedule.bookings).find((b) => b.listId === list.id && b.cancellation === undefined)!
  const procedure = Object.values(state.schedule.procedures).find((p) => p.bookingId === booking.id)!
  const { governingContractId: _dropped, ...rest } = procedure
  return {
    listId: list.id,
    state: { ...state, schedule: { ...state.schedule, procedures: { ...state.schedule.procedures, [procedure.id]: rest } } },
  }
}

describe('listsNeedingContracts (US-04.3.12)', () => {
  it('lists every date, past first then soonest, never a Draft List or an authorised List', () => {
    const state = freshAppState()
    const rows = listsNeedingContracts(state)
    expect(rows.length).toBeGreaterThan(0)
    const dates = rows.map((r) => r.dateISO)
    expect(dates).toEqual([...dates].sort())
    for (const r of rows) {
      const list = state.schedule.lists[r.listId]!
      expect(list.state).not.toBe('AUTHORISED')
      expect(list.state).not.toBe('DRAFT')
      expect(r.set).toBeLessThan(r.total)
      expect(r.total - r.set).toBe(r.toSet.length)
      expect(r.past).toBe(r.dateISO < state.clock.todayISO)
    }
  })
})

describe('listsTabCounts', () => {
  it('counts what needs doing on each tab', () => {
    const state = freshAppState()
    const counts = listsTabCounts(state)
    expect(counts['draft-lists']).toBe(waitingDraftLists(state).length)
    expect(counts.conflicts).toBe(openConflictRows(state).length)
    expect(counts['contracts-to-set']).toBe(listsNeedingContracts(state).length)
    expect(counts['to-authorise']).toBe(Object.values(state.schedule.lists).filter((l) => l.state === 'SUBMITTED').length)
  })

  it('counts open conflicts only, from the demo day on', () => {
    const state = freshAppState()
    for (const r of openConflictRows(state)) {
      expect(r.clear).toBeUndefined()
      expect(r.dateISO >= state.clock.todayISO).toBe(true)
    }
  })
})

describe('listsBadge (OQ-151)', () => {
  it('All counts every List that needs something, each once', () => {
    const state = freshAppState()
    const union = new Set(Object.values(tabIds(state)).flatMap((m) => [...m.keys()]))
    expect(listsBadge(state, 'all')).toBe(union.size)
  })

  it('a List on two tabs counts once', () => {
    const base = freshAppState()
    const { state, listId } = submittedNeedingContract(base)
    const ids = tabIds(state)
    expect(ids.authorise!.has(listId)).toBe(true)
    expect(ids.contracts!.has(listId)).toBe(true)
    // It was already counted as submitted, so needing a Contract too adds nothing.
    expect(tabIds(base).authorise!.has(listId)).toBe(true)
    expect(listsBadge(state, 'all')).toBe(listsBadge(base, 'all'))
  })

  it('Urgent counts only Lists dated up to a week after the demo day, everything earlier included', () => {
    const state = freshAppState()
    const until = urgentUntilISO(state)
    expect(until).toBe('2026-12-01')
    const union = new Map<string, string>()
    for (const m of Object.values(tabIds(state))) for (const [id, d] of m) union.set(id, d)
    const urgent = [...union.values()].filter((d) => d <= until).length
    expect(listsBadge(state, 'urgent')).toBe(urgent)
    expect(listsBadge(state, 'urgent')).toBeLessThanOrEqual(listsBadge(state, 'all'))
    // Every submitted List is dated before the demo day, so all of them count as urgent.
    for (const d of tabIds(state).authorise!.values()) expect(d <= until).toBe(true)
  })

  it('reads the demo clock: moving the day moves the window', () => {
    const state = freshAppState()
    const later: AppState = { ...state, clock: { ...state.clock, todayISO: '2027-06-01' } }
    expect(urgentUntilISO(later)).toBe('2027-06-08')
  })
})

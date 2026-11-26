/**
 * The office's Contracts tab (US-04.3.12): one row per List with Procedures still needing a
 * Contract, how many are set, how far each of the rest has got, oldest day first.
 */

import { describe, expect, it } from 'vitest'
import { freshAppState } from './appStore'
import { bookingsForList, listsNeedingContracts, proceduresForBooking } from './selectors'
import { SEED_MARKERS } from '../domain/seed'
import type { AppState } from './appStore'

const NO_CONTRACT = SEED_MARKERS['needsInvoiceDestinationBooking']!.entityId

function seededRow(state: AppState) {
  return listsNeedingContracts(state).find((r) => r.toSet.some((p) => p.bookingId === NO_CONTRACT))
}

/** A copy of the state with one Procedure replaced (never edits the seed in place). */
function withProcedure(state: AppState, id: string, patch: Partial<AppState['schedule']['procedures'][string]>): AppState {
  const p = state.schedule.procedures[id]!
  return { ...state, schedule: { ...state.schedule, procedures: { ...state.schedule.procedures, [id]: { ...p, ...patch } } } }
}

describe('listsNeedingContracts', () => {
  it('holds the seeded Booking with no Contract on one row for its List, counting set and total', () => {
    const state = freshAppState()
    const row = seededRow(state)!
    expect(row).toBeDefined()
    const procs = bookingsForList(state, row.listId)
      .filter((b) => b.cancellation === undefined)
      .flatMap((b) => proceduresForBooking(state, b.id))
    expect(row.total).toBe(procs.length)
    expect(row.set).toBe(procs.filter((p) => p.governingContractId !== undefined).length)
    expect(row.toSet.every((p) => state.schedule.procedures[p.procedureId]!.governingContractId === undefined)).toBe(true)
    expect(listsNeedingContracts(state).filter((r) => r.listId === row.listId)).toHaveLength(1)
  })

  it('orders by day then session, so Lists whose day has passed lead and are marked past', () => {
    const state = freshAppState()
    const rows = listsNeedingContracts(state)
    const days = rows.map((r) => r.dateISO)
    expect(days).toEqual([...days].sort())
    const row = seededRow(state)!
    const later = { ...state, clock: { ...state.clock, todayISO: '2099-01-01' } }
    expect(seededRow(later)!.past).toBe(true)
    const earlier = { ...state, clock: { ...state.clock, todayISO: row.dateISO } }
    expect(seededRow(earlier)!.past).toBe(false)
  })

  it('tells a Procedure part way (where the invoice goes chosen) from one with nothing chosen', () => {
    const state = freshAppState()
    const proc = seededRow(state)!.toSet.find((p) => p.bookingId === NO_CONTRACT)!
    const blank = withProcedure(state, proc.procedureId, { railAnswers: undefined })
    expect(seededRow(blank)!.toSet.find((p) => p.procedureId === proc.procedureId)!.started).toBe(false)
    const partWay = withProcedure(state, proc.procedureId, { railAnswers: { destination: 'patient', narrow: 'standard' } })
    const shown = seededRow(partWay)!.toSet.find((p) => p.procedureId === proc.procedureId)!
    expect(shown.started).toBe(true)
    expect(shown.answersText).toBe('Patient › Standard')
  })

  it('a List leaves once every Procedure on it has a Contract', () => {
    let state = freshAppState()
    const row = seededRow(state)!
    const anyContract = Object.values(state.schedule.procedures).find((p) => p.governingContractId !== undefined)!.governingContractId!
    for (const p of row.toSet) state = withProcedure(state, p.procedureId, { governingContractId: anyContract })
    expect(listsNeedingContracts(state).some((r) => r.listId === row.listId)).toBe(false)
  })
})

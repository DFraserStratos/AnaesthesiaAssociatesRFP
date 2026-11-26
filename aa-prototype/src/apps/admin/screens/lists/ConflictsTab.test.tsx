/**
 * Lists › Conflicts (US-01.5.4, US-01.5.2; US-13.1.3): every List at a hospital closed that day, one
 * group per day naming the closure; the row's actions (Reassign, or Assign for a Draft List; Clear;
 * Flag again once cleared; Open; Day); the filters in the URL; Show cleared; the empty state. The pure
 * part (range, closure label, grouping) is tested beside it.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearListConflict, conflictRows, createDraftList, freshAppState, scheduleHorizon, useAppStore, type ConflictRow } from '../../../../store'
import { TEST_OFFICE } from '../../../../test/approvePrepayments'
import { listsRoutes } from '../../../../test/adminRoutes'
import { AdminApp } from '../../AdminApp'
import { openConflictRows } from './listsCounts'
import { listsPath } from './listsPaths'
import { closureLabel, conflictListCounts, conflictsRange, groupConflictsByDay, parseConflictsWhen } from './conflictsView'

function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        <Route path="day/:dateISO" element={<div data-testid="day" />} />
        {listsRoutes()}
      </Route>,
    ),
    { initialEntries: [url] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const search = (router: ReturnType<typeof mountAt>) => router.state.location.search
const table = () => document.querySelector('[data-shot="conflicts-table"]') as HTMLElement
const rowEls = () => [...document.querySelectorAll('tr[data-conflict-row]')] as HTMLElement[]
const groupEls = () => [...document.querySelectorAll('tr[data-conflict-date]')] as HTMLElement[]
const select = (shot: string) => document.querySelector(`select[data-shot="${shot}"]`) as HTMLSelectElement

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

afterEach(() => cleanup())

function openRows(): ConflictRow[] {
  return openConflictRows(useAppStore.getState())
}

describe('Conflicts tab: rows and groups', () => {
  it('lists every open conflict from today, one group row per day naming its closure', () => {
    const rows = openRows()
    expect(rows.length).toBeGreaterThan(0)
    mountAt(listsPath('conflicts'))
    expect(table()).not.toBeNull()
    expect(rowEls().map((r) => r.getAttribute('data-conflict-row'))).toEqual(rows.map((r) => r.listId))
    const dates = [...new Set(rows.map((r) => r.dateISO))]
    expect(groupEls().map((g) => g.getAttribute('data-conflict-date'))).toEqual(dates)
    // Each day names its closure: a hospital's own ("<hospital> closed · <name>") or a public holiday.
    for (const g of groupEls()) {
      const closures = [...g.querySelectorAll('[data-conflict-closure]')].map((c) => c.textContent ?? '')
      expect(closures.length).toBeGreaterThan(0)
      for (const c of closures) expect(c).toMatch(/ closed( · .+)?$|^Public holiday/)
    }
    // Columns are about the List; the reason sits on the group row, never "conflict" for a pairing.
    const heads = [...table().querySelectorAll('thead th')].map((th) => th.textContent)
    expect(heads).toEqual(['Session', 'Anaesthetist', 'Hospital', 'Surgeon', 'Bookings', ''])
    expect(document.querySelector('[data-shot="conflicts-count"]')!.textContent).toMatch(/^\d+ Lists? at a closed hospital$/)
  })

  it('gives an open row Reassign, Clear, Open and Day; a Draft List shows its pill and Assign', () => {
    const first = openRows()[0]!
    const made = createDraftList(useAppStore, TEST_OFFICE, { hospitalId: first.hospitalId, surgeonId: first.surgeonId, dateISO: first.dateISO, session: first.session === 'AM' ? 'PM' : 'AM', source: 'phone' })
    if (!made.ok) throw new Error(made.message)
    mountAt(listsPath('conflicts'))

    const assigned = document.querySelector(`tr[data-conflict-row="${first.listId}"]`) as HTMLElement
    for (const name of [/^Reassign, /, /^Clear conflict, /, /^Open the List, /, /^Open the day, /]) expect(within(assigned).getByRole('button', { name })).toBeInTheDocument()
    expect(within(assigned).queryByRole('button', { name: /^Assign / })).toBeNull()

    const draft = document.querySelector(`tr[data-conflict-row="${made.value.listId}"]`) as HTMLElement
    expect(draft).not.toBeNull()
    expect(draft.querySelector('[data-draft-list-pill]')).toHaveTextContent('Draft List')
    expect(within(draft).getByRole('button', { name: /^Assign Draft List, Draft List / })).toBeInTheDocument()
    expect(within(draft).queryByRole('button', { name: /^Reassign/ })).toBeNull()
    expect(within(draft).getByRole('button', { name: /^Clear conflict, / })).toBeInTheDocument()

    // Assign opens the Draft List picker.
    fireEvent.click(within(draft).getByRole('button', { name: /^Assign Draft List/ }))
    expect(document.querySelector('[data-shot="draft-list-candidates"]')).not.toBeNull()
  })

  it('Clear opens the sheet with its optional note', () => {
    const first = openRows()[0]!
    mountAt(listsPath('conflicts'))
    const row = document.querySelector(`tr[data-conflict-row="${first.listId}"]`) as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: /^Clear conflict, / }))
    expect(document.querySelector('[data-shot="conflict-clear-sheet"]')).not.toBeNull()
  })

  it('Day goes to that day', () => {
    const first = openRows()[0]!
    const router = mountAt(listsPath('conflicts'))
    const row = document.querySelector(`tr[data-conflict-row="${first.listId}"]`) as HTMLElement
    act(() => {
      fireEvent.click(within(row).getByRole('button', { name: /^Open the day, / }))
    })
    expect(router.state.location.pathname).toBe(`/admin/day/${first.dateISO}`)
  })
})

describe('Conflicts tab: filters in the URL', () => {
  it('writes When, Hospital and Anaesthetist to the URL and narrows the rows', () => {
    const first = openRows()[0]!
    const router = mountAt(listsPath('conflicts'))
    act(() => {
      fireEvent.change(select('conflicts-hospital'), { target: { value: first.hospitalId } })
    })
    expect(new URLSearchParams(search(router)).get('hospital')).toBe(first.hospitalId)
    expect(rowEls().length).toBe(openRows().filter((r) => r.hospitalId === first.hospitalId).length)

    act(() => {
      fireEvent.change(select('conflicts-when'), { target: { value: 'past' } })
    })
    expect(new URLSearchParams(search(router)).get('when')).toBe('past')

    act(() => {
      fireEvent.change(select('conflicts-when'), { target: { value: 'today' } })
    })
    expect(new URLSearchParams(search(router)).has('when')).toBe(false)
  })

  it('reads its filters from the URL, and an unknown When falls back to From today', () => {
    const first = openRows()[0]!
    mountAt(`${listsPath('conflicts')}?when=nonsense&anaesthetist=${first.anaesthetistId ?? ''}`)
    expect(select('conflicts-when').value).toBe('today')
    expect(select('conflicts-anaesthetist').value).toBe(first.anaesthetistId)
    for (const r of rowEls()) expect(openRows().find((o) => o.listId === r.getAttribute('data-conflict-row'))?.anaesthetistId).toBe(first.anaesthetistId)
  })

  it('shows a calm empty state when nothing matches, with a way back', () => {
    const closedHospitals = new Set(openRows().map((r) => r.hospitalId))
    const open = Object.keys(useAppStore.getState().masters.hospitals).find((id) => !closedHospitals.has(id))!
    const router = mountAt(`${listsPath('conflicts')}?hospital=${open}`)
    const empty = document.querySelector('[data-shot="conflicts-empty"]') as HTMLElement
    expect(empty).toHaveTextContent('No Lists at a closed hospital')
    fireEvent.click(within(empty).getByRole('button', { name: 'Show every hospital from today' }))
    expect(search(router)).toBe('')
    expect(rowEls().length).toBe(openRows().length)
  })
})

describe('Conflicts tab: Show cleared', () => {
  it('hides a cleared conflict until Show cleared, then offers Flag again, which restores it', () => {
    const first = openRows()[0]!
    const res = clearListConflict(useAppStore, TEST_OFFICE, first.listId, first.cause, 'Theatre confirmed running')
    if (!res.ok) throw new Error(res.message)
    const router = mountAt(listsPath('conflicts'))
    expect(document.querySelector(`tr[data-conflict-row="${first.listId}"][data-conflict-cleared]`)).toBeNull()

    act(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Show cleared' }))
    })
    expect(new URLSearchParams(search(router)).get('cleared')).toBe('1')
    const cleared = document.querySelector(`tr[data-conflict-row="${first.listId}"][data-conflict-cleared="true"]`) as HTMLElement
    expect(cleared).not.toBeNull()
    expect(cleared.querySelector('[data-conflict-cleared-by]')).toHaveTextContent(/Cleared by .+: Theatre confirmed running/)
    expect(within(cleared).queryByRole('button', { name: /^Reassign/ })).toBeNull()
    act(() => {
      fireEvent.click(within(cleared).getByRole('button', { name: /^Flag again, / }))
    })
    expect(document.querySelector(`tr[data-conflict-row="${first.listId}"]:not([data-conflict-cleared])`)).not.toBeNull()
  })
})

describe('conflictsView', () => {
  it('parses When and turns it into a range', () => {
    expect(parseConflictsWhen('twoWeeks')).toBe('twoWeeks')
    expect(parseConflictsWhen('')).toBe('today')
    expect(parseConflictsWhen('soon')).toBe('today')
    const horizon = { startISO: '2026-11-01', endISO: '2027-05-31' }
    expect(conflictsRange('today', '2026-11-24', horizon)).toEqual({ fromISO: '2026-11-24', toISO: '2027-05-31' })
    expect(conflictsRange('twoWeeks', '2026-11-24', horizon)).toEqual({ fromISO: '2026-11-24', toISO: '2026-12-07' })
    expect(conflictsRange('canvas', '2026-11-24', horizon)).toEqual({ fromISO: '2026-11-01', toISO: '2027-05-31' })
    expect(conflictsRange('past', '2026-11-24', horizon)).toEqual({})
  })

  it('names a hospital closure and a public holiday', () => {
    const masters = {
      hospitals: { H1: { id: 'H1', name: 'Forte Health' } },
      holidays: { HH1: { id: 'HH1', hospitalId: 'H1', dateISO: '2026-12-04', name: 'Theatre refit.' } },
      publicHolidays: { PH1: { id: 'PH1', dateISO: '2026-12-28', name: 'Boxing Day (observed)', kind: 'national', openHospitalIds: [] } },
    } as unknown as Parameters<typeof closureLabel>[1]
    expect(closureLabel({ cause: 'holiday:HH1', hospitalId: 'H1' }, masters)).toBe('Forte Health closed · Theatre refit')
    expect(closureLabel({ cause: 'publicHoliday:PH1', hospitalId: 'H1' }, masters)).toBe('Public holiday · Boxing Day (observed)')
    expect(closureLabel({ cause: 'holiday:gone', hospitalId: 'H1' }, masters)).toBe('Forte Health closed')
  })

  it('groups rows one per day, counting open and cleared, closures listed once', () => {
    const state = useAppStore.getState()
    const rows = conflictRows(state, { fromISO: state.clock.todayISO, toISO: scheduleHorizon(state).endISO })
    const days = groupConflictsByDay(rows, state.masters)
    expect(days.map((d) => d.dateISO)).toEqual([...new Set(rows.map((r) => r.dateISO))])
    expect(days.flatMap((d) => d.rows)).toEqual(rows)
    for (const d of days) {
      expect(d.open + d.cleared).toBe(d.rows.length)
      expect(new Set(d.closures).size).toBe(d.closures.length)
    }
    expect(conflictListCounts(rows).open).toBe(new Set(rows.map((r) => r.listId)).size)
  })
})

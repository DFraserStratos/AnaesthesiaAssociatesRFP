/**
 * Lists › Draft Lists (US-01.6.2; US-13.1.3): the rows open their drawer by mouse and by keyboard
 * (UI unification U6, bug 3), one group row per day with today's labelled, the filters in the URL,
 * History as a toolbar pill, the "Hospital closed" and "Day passed" flags, the assigned result line
 * and paging at 50.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Outlet, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, useAppStore, waitingDraftLists, type Actor } from '../../../../store'
import { SurfaceProvider } from '../../../../shared'
import type { DraftList } from '../../../../domain/types'
import type { AdminOutletContext } from '../../outlet'
import { DraftListsTab } from './DraftListsTab'
import { DRAFT_LISTS_PAGE_SIZE } from './draftListsRows'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const BASE = '/admin/lists/draft-lists'

function mount(url = BASE) {
  const onOpenDraftList = vi.fn()
  const onOpenList = vi.fn()
  const context = { actor: OFFICE, onOpenDraftList, onOpenList } as unknown as AdminOutletContext
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route element={<SurfaceProvider variant="web"><Outlet context={context} /></SurfaceProvider>}>
        <Route path={BASE} element={<DraftListsTab />} />
      </Route>,
    ),
    { initialEntries: [url] },
  )
  render(<RouterProvider router={router} />)
  return { router, onOpenDraftList, onOpenList }
}

const search = (router: ReturnType<typeof mount>['router']) => router.state.location.search
const rowOf = (id: string) => document.querySelector(`tr[data-draft-list-row="${id}"]`) as HTMLElement | null
const rowIds = () => Array.from(document.querySelectorAll('tr[data-draft-list-row]')).map((r) => r.getAttribute('data-draft-list-row'))

/** Put extra Draft Lists in the store: copies of a seeded one, never the record itself. */
function addDraftLists(lists: DraftList[]) {
  const s = useAppStore.getState()
  useAppStore.setState({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, ...Object.fromEntries(lists.map((l) => [l.id, l])) } } })
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

afterEach(() => cleanup())

describe('Draft Lists rows (U6, bug 3)', () => {
  it('every row has one keyboard handle that opens its Draft List drawer, past the rail\'s first five too', () => {
    const waiting = waitingDraftLists(useAppStore.getState())
    expect(waiting.length).toBeGreaterThan(5)
    const { onOpenDraftList } = mount()
    const handles = screen.getAllByRole('button', { name: /^Open Draft List / })
    expect(handles).toHaveLength(waiting.length)
    const sixth = waiting[5]!
    const handle = rowOf(sixth.id)!.querySelector('button[aria-label^="Open Draft List"]') as HTMLButtonElement
    handle.focus()
    expect(document.activeElement).toBe(handle)
    fireEvent.click(handle)
    expect(onOpenDraftList).toHaveBeenCalledTimes(1)
    expect(onOpenDraftList).toHaveBeenCalledWith(sixth.id)
  })

  it('a row click opens the drawer; the row is clickable, never focusable', () => {
    const first = waitingDraftLists(useAppStore.getState())[0]!
    const { onOpenDraftList } = mount()
    const row = rowOf(first.id)!
    expect(row).toHaveClass('aa-clickable-table-row')
    expect(row).not.toHaveAttribute('tabindex')
    fireEvent.click(row.querySelector('td')!)
    expect(onOpenDraftList).toHaveBeenCalledWith(first.id)
  })

  it('an inner action (Assign, Change date) does its own job and does not open the drawer', () => {
    const first = waitingDraftLists(useAppStore.getState())[0]!
    const { onOpenDraftList } = mount()
    fireEvent.click(within(rowOf(first.id)!).getByRole('button', { name: 'Change date' }))
    const assign = screen.getAllByRole('button', { name: /^Assign Draft List/ }).find((b) => !(b as HTMLButtonElement).disabled)!
    fireEvent.click(assign)
    expect(onOpenDraftList).not.toHaveBeenCalled()
  })
})

describe('Draft Lists tab (US-01.6.2)', () => {
  it('Sorting: soonest first under one group row per day, today\'s labelled as today', () => {
    const waiting = waitingDraftLists(useAppStore.getState())
    mount()
    expect(rowIds()).toEqual(waiting.map((l) => l.id))
    const days = Array.from(document.querySelectorAll('tr[data-draft-day]')).map((r) => r.getAttribute('data-draft-day'))
    expect(days).toEqual([...new Set(waiting.map((l) => l.dateISO))])
    expect(document.querySelector('tr[data-draft-day="2026-11-24"]')).toHaveTextContent('Today, Tue 24 Nov')
    expect(screen.getByText('Why it has no anaesthetist')).toBeInTheDocument()
    expect(document.querySelector('[data-shot="draft-lists-count"]')).toHaveTextContent(`${waiting.length} Draft Lists`)
  })

  it('Filtered: the hospital filter keeps only that hospital\'s Draft Lists and lives in the URL', () => {
    const waiting = waitingDraftLists(useAppStore.getState())
    const one = waiting[0]!.hospitalId
    expect(waiting.some((l) => l.hospitalId !== one)).toBe(true)
    const { router } = mount()
    fireEvent.change(screen.getByRole('combobox', { name: 'Hospital' }), { target: { value: one } })
    expect(search(router)).toBe(`?hospital=${one}`)
    expect(rowIds()).toEqual(waiting.filter((l) => l.hospitalId === one).map((l) => l.id))
  })

  it('reads its filters from the URL: Why and the search', () => {
    const waiting = waitingDraftLists(useAppStore.getState())
    mount(`${BASE}?why=request`)
    expect(rowIds()).toEqual(waiting.filter((l) => l.draft.origin === 'request').map((l) => l.id))
    cleanup()
    const noted = waiting.find((l) => (l.notes ?? '') !== '')!
    mount(`${BASE}?q=${encodeURIComponent(noted.notes!)}`)
    expect(rowIds()).toContain(noted.id)
    cleanup()
    mount(`${BASE}?q=zzzz`)
    expect(screen.getByText('No Draft Lists match.')).toBeInTheDocument()
  })

  it('a List at a closed hospital carries the Hospital closed pill', () => {
    const closed = waitingDraftLists(useAppStore.getState()).find((l) => l.conflicts.length > 0)!
    mount()
    expect(rowOf(closed.id)!.querySelector('[data-holiday-flag]')).toHaveTextContent('Hospital closed')
  })

  it('When: past Draft Lists wait behind Show past and keep their Day passed flag, with Assign off', () => {
    const seed = waitingDraftLists(useAppStore.getState())[0]!
    addDraftLists([{ ...seed, id: 'LD-PAST-TEST', dateISO: '2026-11-20', conflicts: [] }])
    const { router } = mount()
    expect(rowOf('LD-PAST-TEST')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show 1 past' }))
    expect(search(router)).toBe('?when=all')
    const row = rowOf('LD-PAST-TEST')!
    expect(row.querySelector('[data-day-passed]')).toHaveTextContent('Day passed')
    expect(within(row).getByRole('button', { name: /^Assign Draft List/ })).toBeDisabled()
    expect(rowIds()[0]).toBe('LD-PAST-TEST')
  })

  it('History is a toolbar pill (?view=history), not a second row of tabs', () => {
    const { router } = mount()
    const view = screen.getByRole('group', { name: 'Draft Lists view' })
    fireEvent.click(within(view).getByRole('button', { name: /^History/ }))
    expect(search(router)).toBe('?view=history')
    expect(screen.getByText(/appear here once they are assigned or removed/)).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'When' })).toBeNull()
    fireEvent.click(within(view).getByRole('button', { name: /^Waiting/ }))
    expect(search(router)).toBe('')
  })

  it('after an assignment, ?assigned= shows the result line with Open List', () => {
    const seed = waitingDraftLists(useAppStore.getState())[0]!
    const anaesthetistId = Object.keys(useAppStore.getState().masters.anaesthetists)[0]!
    addDraftLists([{ ...seed, id: 'LD-ASSIGNED-TEST', state: 'ACTIVE', anaesthetistId } as unknown as DraftList])
    const { onOpenList, router } = mount(`${BASE}?assigned=LD-ASSIGNED-TEST`)
    expect(document.querySelector('[data-shot="draft-lists-assigned"]')).toHaveTextContent(/Draft List assigned to .*It is now an active List\./)
    fireEvent.click(screen.getByRole('button', { name: 'Open List' }))
    expect(onOpenList).toHaveBeenCalledWith('LD-ASSIGNED-TEST')
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(search(router)).toBe('')
  })

  it('Paging: 50 a page, the page in the URL, back to page 1 on a filter change', async () => {
    const seed = waitingDraftLists(useAppStore.getState())[0]!
    addDraftLists(Array.from({ length: 55 }, (_, i) => ({ ...seed, id: `LD-PAGE-${String(i).padStart(2, '0')}`, dateISO: '2026-12-01', conflicts: [] })))
    const total = waitingDraftLists(useAppStore.getState()).length
    const { router } = mount()
    expect(rowIds()).toHaveLength(DRAFT_LISTS_PAGE_SIZE)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    })
    expect(search(router)).toBe('?page=2')
    expect(rowIds()).toHaveLength(total - DRAFT_LISTS_PAGE_SIZE)
    fireEvent.change(screen.getByRole('combobox', { name: 'When' }), { target: { value: 'fortnight' } })
    expect(search(router)).toBe('?when=fortnight')
  })

  it('keeps New Draft List as the page action', () => {
    mount()
    expect(screen.getByRole('button', { name: /New Draft List/ })).toBeInTheDocument()
  })
})

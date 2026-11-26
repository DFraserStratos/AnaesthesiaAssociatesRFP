/**
 * The Lists section (US-13.1.3; OQ-151): one side-nav entry with one amber badge in place of Draft
 * Lists, Conflicts and the Review queue; four routed tabs opening on Draft Lists, each its own address;
 * a number on a tab only where something needs doing; the badge counting each List once, All or
 * Urgent by the harness bar's demo switch; every old address landing on its new one with a replace,
 * its query and state kept; and an unknown review id falling back to To authorise.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore } from '../../../../store'
import { useListsBadgeMode } from '../../../../shell/listsBadgeMode'
import { ListsBadgeModeToggle } from '../../../../shell/ListsBadgeModeToggle'
import { financesRoutes, listsLegacyRoutes, listsRoutes } from '../../../../test/adminRoutes'
import { AdminApp } from '../../AdminApp'
import { listsBadge, listsTabCounts, listsToAuthorise } from './listsCounts'
import { listsPath, reviewPath, type ListsTab } from './listsPaths'
import { LISTS_TABS } from './listsTabs'

const DAY = '/admin/day/2026-11-24'

/** The Admin app (side nav and all) at `url`, one entry after the Day view so Back has somewhere to go. */
function mountAt(url: string | { pathname: string; search?: string; state?: unknown }) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        <Route path="day/:dateISO" element={<div data-testid="day" />} />
        {listsRoutes()}
        {listsLegacyRoutes()}
        {financesRoutes()}
      </Route>,
    ),
    { initialEntries: [DAY, url], initialIndex: 1 },
  )
  render(<RouterProvider router={router} />)
  return router
}

const here = (router: ReturnType<typeof mountAt>) => router.state.location.pathname + router.state.location.search
const nav = () => document.querySelector('nav[aria-label="Admin"]') as HTMLElement
const strip = () => document.querySelector('[data-shot="lists-tabs"]') as HTMLElement
const tabLink = (tab: ListsTab) => strip().querySelector(`a[data-lists-tab="${tab}"]`) as HTMLElement
const navBadge = () => document.querySelector('[data-shot="nav-badge-lists"]')

beforeEach(() => {
  useAppStore.setState(freshAppState())
  useListsBadgeMode.setState({ mode: 'all' })
})

afterEach(() => {
  useListsBadgeMode.setState({ mode: 'all' })
})

describe('the side nav (US-13.1.3)', () => {
  it('has one Lists entry, after Intake, in place of Draft Lists, Conflicts and Review queue: 9 items', () => {
    mountAt(listsPath('conflicts'))
    const labels = within(nav())
      .getAllByRole('button')
      .map((b) => b.firstElementChild?.textContent)
    expect(labels).toEqual(['Day view', 'Intake', 'Lists', 'Notifications', 'Finances', 'People', 'Contracts', 'Master data', 'Audit'])
    for (const gone of ['Draft Lists', 'Conflicts', 'Review queue']) expect(labels).not.toContain(gone)
    expect(within(nav()).getByRole('button', { name: /^Lists/ })).toHaveAttribute('aria-current', 'page')
  })

  it('opens Lists on Draft Lists', async () => {
    const router = mountAt(DAY)
    await act(async () => {
      within(nav()).getByRole('button', { name: /^Lists/ }).click()
    })
    expect(here(router)).toBe(listsPath('draft-lists'))
  })

  it('its amber badge counts each List once: All by default, Urgent from the harness switch', () => {
    const state = useAppStore.getState()
    const all = listsBadge(state, 'all')
    const urgent = listsBadge(state, 'urgent')
    expect(all).toBeGreaterThan(0)
    expect(urgent).toBeLessThanOrEqual(all)
    mountAt(listsPath('draft-lists'))
    expect(navBadge()).toHaveTextContent(String(all))
    act(() => useListsBadgeMode.getState().setMode('urgent'))
    if (urgent === 0) expect(navBadge()).toBeNull()
    else expect(navBadge()).toHaveTextContent(String(urgent))
  })

  it('the harness switch reads "Lists badge" with All and Urgent, All pressed by default', () => {
    render(<ListsBadgeModeToggle />)
    const group = screen.getByRole('group', { name: 'Lists badge' })
    expect(within(group).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(group).getByRole('button', { name: 'Urgent' }))
    expect(useListsBadgeMode.getState().mode).toBe('urgent')
    expect(within(group).getByRole('button', { name: 'Urgent' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('the tabs', () => {
  it('lands /admin/lists on Draft Lists, with its New Draft List action', () => {
    const router = mountAt('/admin/lists')
    expect(here(router)).toBe(listsPath('draft-lists'))
    expect(document.querySelector('[data-lists-page="draft-lists"]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Lists' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New Draft List/ })).toBeInTheDocument()
  })

  it('shows the four tabs in order, each its own address with its one-line sub', () => {
    for (const t of LISTS_TABS) {
      const router = mountAt(t.path)
      expect(here(router)).toBe(t.path)
      expect([...strip().querySelectorAll('a')].map((a) => a.getAttribute('data-lists-tab'))).toEqual(['draft-lists', 'conflicts', 'contracts-to-set', 'to-authorise'])
      expect(tabLink(t.tab)).toHaveAttribute('aria-current', 'page')
      expect(document.querySelector(`[data-lists-page="${t.tab}"]`)).not.toBeNull()
      expect(screen.getByText(t.sub)).toBeInTheDocument()
      cleanup()
    }
  })

  it('numbers a tab only where something needs doing, hidden at zero', () => {
    const counts = listsTabCounts(useAppStore.getState())
    mountAt(listsPath('draft-lists'))
    for (const t of LISTS_TABS) {
      const n = counts[t.tab]
      expect(tabLink(t.tab).textContent).toBe(n > 0 ? `${t.label}${n}` : t.label)
    }
    cleanup()
    // Every submitted List authorised: To authorise shows no number.
    const lists = { ...useAppStore.getState().schedule.lists }
    for (const l of listsToAuthorise(useAppStore.getState())) lists[l.id] = { ...l, state: 'AUTHORISED' }
    useAppStore.setState((s) => ({ schedule: { ...s.schedule, lists } }))
    mountAt(listsPath('draft-lists'))
    expect(tabLink('to-authorise').textContent).toBe('To authorise')
  })
})

describe('old addresses (replace, query and state kept)', () => {
  it('Draft Lists, with ?open= opening the drawer and History read as view=history', async () => {
    const waitingId = Object.values(useAppStore.getState().schedule.lists).find((l) => l.state === 'DRAFT' && l.removedAtISO === undefined)!.id
    const router = mountAt(`/admin/draft-lists?open=${waitingId}`)
    expect(here(router)).toBe(listsPath('draft-lists', { open: waitingId }))
    cleanup()
    const history = mountAt('/admin/draft-lists?tab=history')
    expect(here(history)).toBe(listsPath('draft-lists', { view: 'history' }))
    // A replace: Back goes to the Day view, not the old address.
    await act(async () => {
      await history.navigate(-1)
    })
    expect(here(history)).toBe(DAY)
  })

  it('Conflicts with its filters', () => {
    const router = mountAt('/admin/conflicts?when=past&cleared=1')
    expect(here(router)).toBe('/admin/lists/conflicts?when=past&cleared=1')
  })

  it('the Review queue to To authorise, its Events tab to Finances › Payments', () => {
    const router = mountAt('/admin/review')
    expect(here(router)).toBe(listsPath('to-authorise'))
    cleanup()
    const events = mountAt('/admin/review?tab=events')
    expect(here(events)).toBe('/admin/finances/payments')
  })

  it('a review page keeps its id and its router state', () => {
    const listId = listsToAuthorise(useAppStore.getState())[0]!.id
    const state = { from: 'billing', search: '?show=all' }
    const router = mountAt({ pathname: `/admin/review/${listId}`, state })
    expect(router.state.location.pathname).toBe(reviewPath(listId))
    expect(router.state.location.state).toEqual(state)
    expect(screen.getByRole('button', { name: 'Billing' })).toBeInTheDocument()
  })

  it('an unknown review id falls back to To authorise', () => {
    const router = mountAt(reviewPath('NOPE'))
    expect(here(router)).toBe(listsPath('to-authorise'))
    cleanup()
    const legacy = mountAt('/admin/review/NOPE')
    expect(here(legacy)).toBe(listsPath('to-authorise'))
  })

  it('a review page opened from To authorise goes back to To authorise', async () => {
    const listId = listsToAuthorise(useAppStore.getState())[0]!.id
    const router = mountAt(reviewPath(listId))
    await act(async () => {
      screen.getByRole('button', { name: 'To authorise' }).click()
    })
    expect(here(router)).toBe(listsPath('to-authorise'))
  })
})

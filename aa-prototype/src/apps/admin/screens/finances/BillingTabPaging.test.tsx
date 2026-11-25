/**
 * The Billing tab at practice scale (build plan Phase 60; US-13.3.1, US-15.0.4):
 * the pager counts Lists, 20 to a page, across the anaesthetist groups; `?list=`
 * lands on the page holding the List and shows every Booking on it; a filter
 * returns to page 1.
 */

import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Outlet, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore, type Actor, type AppState } from '../../../../store'
import { buildFullScaleDataset } from '../../../../domain/seed/fullScale'
import { SurfaceProvider } from '../../../../shared'
import { formatCount } from '../../../../shared/format'
import { financesRoutes } from '../../../../test/adminRoutes'
import { billingStatusesFor } from './financeCounts'
import { BILLING_PAGE_SIZE, billingParamsFrom, billingTabView } from './billingTabState'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
let full: AppState

/** The tab under a bare layout (the actor only): the side nav's practice-scale counts are not under test here. */
function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route
        path="/admin"
        element={
          <SurfaceProvider variant="web">
            <Outlet context={{ actor: OFFICE }} />
          </SurfaceProvider>
        }
      >
        {financesRoutes()}
      </Route>,
    ),
    { initialEntries: [url] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const pager = () => document.querySelector('[data-shot="billing-pager"]') as HTMLElement | null
const headings = () => Array.from(document.querySelectorAll('tr[data-list-id]')).map((el) => el.getAttribute('data-list-id'))

beforeAll(() => {
  full = buildFullScaleDataset(freshAppState(), { todayISO: '2026-11-24' }).state
  useAppStore.setState(full)
}, 180_000)

afterEach(cleanup)

describe('the Billing tab pages by List at practice scale', () => {
  it('pages every List at 20, the pager counting Lists', () => {
    const view = billingTabView(billingStatusesFor(full), billingParamsFrom(new URLSearchParams('show=all')))
    expect(view.totalLists).toBeGreaterThan(BILLING_PAGE_SIZE * 3)
    mountAt('/admin/finances/billing?show=all')
    expect(pager()?.getAttribute('data-pages')).toBe(String(Math.ceil(view.totalLists / BILLING_PAGE_SIZE)))
    expect(pager()?.getAttribute('data-page')).toBe('1')
    expect(within(pager()!).getByText(`Lists 1 to 20 of ${formatCount(view.totalLists)}`)).toBeInTheDocument()
    expect(headings()).toHaveLength(BILLING_PAGE_SIZE)

    fireEvent.click(within(pager()!).getByRole('button', { name: 'Next page' }))
    expect(pager()?.getAttribute('data-page')).toBe('2')
    expect(headings()).toHaveLength(BILLING_PAGE_SIZE)
  }, 60_000)

  it('?list= lands on the page holding the List and shows all its Bookings', () => {
    // Every List in the tab's order (one page holding them all), then one well past page 1 with several Bookings.
    const all = billingTabView(billingStatusesFor(full), billingParamsFrom(new URLSearchParams('show=all')), { pageSize: Number.MAX_SAFE_INTEGER })
    const ordered = all.groups.flatMap((g) => g.lists)
    const index = ordered.findIndex((l, i) => i >= BILLING_PAGE_SIZE * 3 && l.bookingCount > 1)
    expect(index).toBeGreaterThan(0)
    const target = ordered[index]!.list
    const router = mountAt(`/admin/finances/billing?list=${target.listId}`)
    expect(pager()?.getAttribute('data-page')).toBe(String(Math.floor(index / BILLING_PAGE_SIZE) + 1))
    const heading = document.querySelector(`[data-shot="billing-list-${target.listId}"]`)
    expect(heading).not.toBeNull()
    for (const b of target.bookings) expect(document.querySelector(`tr[data-booking-id="${b.bookingId}"]`)).not.toBeNull()
    expect(router.state.location.search).toBe(`?list=${target.listId}`)
  }, 60_000)

  it('a filter returns to page 1', () => {
    const router = mountAt('/admin/finances/billing?show=all&page=3')
    expect(pager()?.getAttribute('data-page')).toBe('3')
    fireEvent.click(within(document.querySelector('[role="group"][aria-label="Which Bookings"]') as HTMLElement).getByRole('button', { name: 'In progress' }))
    const params = new URLSearchParams(router.state.location.search)
    expect(params.get('show')).toBe('in-progress')
    expect(params.has('page')).toBe(false)
    const p = pager()
    if (p !== null) expect(p.getAttribute('data-page')).toBe('1')
  }, 60_000)
})

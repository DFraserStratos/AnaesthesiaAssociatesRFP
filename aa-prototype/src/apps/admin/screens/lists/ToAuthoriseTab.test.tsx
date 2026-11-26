/**
 * Lists › To authorise (US-07.2.4, US-07.3.1): submitted Lists oldest submitted first, each saying
 * what needs a look; the search, List date and Needs a look filters in the URL; a row opening the
 * List's review page, whose Back returns to the tab and whose Previous and Next follow the tab's
 * order; authorising takes a List off the tab; the rail pointing to Billing and to Payments.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { editBooking, freshAppState, useAppStore, type Actor } from '../../../../store'
import { ANAE, SEED_LIST_IDS } from '../../../../domain/seed'
import type { AssignedList } from '../../../../domain/types'
import { financesRoutes, listsRoutes } from '../../../../test/adminRoutes'
import { AdminApp } from '../../AdminApp'
import { listsPath, reviewPath } from './listsPaths'
import { toAuthoriseOrder, toAuthoriseRows } from './toAuthoriseRows'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const FLAGGED = 'L-45178-2026-11-17-AM'
const TAB = listsPath('to-authorise')

function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        {listsRoutes()}
        {financesRoutes()}
      </Route>,
    ),
    { initialEntries: [url] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const here = (router: ReturnType<typeof mountAt>) => router.state.location.pathname + router.state.location.search
const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement | null
const rowIds = () => [...document.querySelectorAll<HTMLElement>('[data-shot="to-authorise-rows"] tr[data-list-id]')].map((tr) => tr.getAttribute('data-list-id'))
const filters = () => within(screen.getByRole('group', { name: 'Which Lists' }))

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('the To authorise tab', () => {
  it('lists every submitted List, oldest submitted first, with when it was submitted and what needs a look', () => {
    mountAt(TAB)
    const order = toAuthoriseOrder(useAppStore.getState())
    expect(order.length).toBeGreaterThan(1)
    expect(rowIds()).toEqual(order)
    expect(shot('to-authorise-count')!.textContent).toContain('oldest submitted first')
    const flagged = document.querySelector(`tr[data-list-id="${FLAGGED}"]`) as HTMLElement
    expect(flagged.getAttribute('data-needs-a-look')).toBe('true')
    expect(flagged.querySelector('[data-shot="to-authorise-needs-price"]')?.textContent).toBe('1 needs a price')
    expect(flagged.querySelector('[data-shot="to-authorise-contract-changes"]')?.textContent).toBe('1 Contract change to approve')
  })

  it('Needs a look shows only the Lists that need a closer look, its count on the pill, in the URL', () => {
    const router = mountAt(TAB)
    const look = toAuthoriseRows(useAppStore.getState()).filter((r) => r.needsALook)
    expect(look.length).toBeGreaterThan(0)
    const pill = filters().getByRole('button', { name: /Needs a look/ })
    expect(pill.textContent).toContain(String(look.length))
    fireEvent.click(pill)
    expect(here(router)).toBe(`${TAB}?look=1`)
    expect(pill).toHaveAttribute('aria-pressed', 'true')
    expect(rowIds()).toEqual(look.map((r) => r.list.id))
    fireEvent.click(filters().getByRole('button', { name: /All/ }))
    expect(here(router)).toBe(TAB)
  })

  it('a List the anaesthetist changed after submitting shows under Needs a look', () => {
    const pm = SEED_LIST_IDS.souterMon20Pm
    const booking = Object.values(useAppStore.getState().schedule.bookings).find((b) => b.listId === pm && b.cancellation === undefined)!
    act(() => {
      editBooking(useAppStore, SOUTER, booking.id, { notes: 'next-day fix' })
    })
    mountAt(`${TAB}?look=1`)
    expect(rowIds()).toContain(pm)
    const row = document.querySelector(`tr[data-list-id="${pm}"]`) as HTMLElement
    expect(row.querySelector('[data-shot="review-changed-since-submitted"]')?.textContent).toContain('Changed since submitted · 1')
    expect(document.querySelectorAll('[data-shot="review-changed-since-submitted"]')).toHaveLength(1)
  })

  it('the search narrows by anaesthetist, surgeon or hospital, and the date to one List date', () => {
    const router = mountAt(TAB)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search by anaesthetist, surgeon or hospital' }), { target: { value: 'Souter' } })
    expect(here(router)).toBe(`${TAB}?q=Souter`)
    const lists = useAppStore.getState().schedule.lists
    expect(rowIds().length).toBeGreaterThan(0)
    for (const id of rowIds()) expect((lists[id!] as AssignedList).anaesthetistId).toBe(ANAE.souter)

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search by anaesthetist, surgeon or hospital' }), { target: { value: 'nobody here' } })
    expect(shot('to-authorise-none-match')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show every List' }))
    expect(here(router)).toBe(TAB)

    const dateISO = (lists[rowIds()[0]!] as AssignedList).dateISO
    fireEvent.change(shot('to-authorise-date') as HTMLSelectElement, { target: { value: dateISO } })
    expect(here(router)).toBe(`${TAB}?date=${dateISO}`)
    for (const id of rowIds()) expect((lists[id!] as AssignedList).dateISO).toBe(dateISO)
  })

  it('a row opens the review page, whose Back returns to the tab', async () => {
    const router = mountAt(TAB)
    const first = toAuthoriseOrder(useAppStore.getState())[0]!
    fireEvent.click(within(document.querySelector(`tr[data-list-id="${first}"]`) as HTMLElement).getByRole('button', { name: /^Review / }))
    expect(here(router)).toBe(reviewPath(first))
    await act(async () => {
      screen.getByRole('button', { name: 'To authorise' }).click()
    })
    expect(here(router)).toBe(TAB)
  })

  it("the review page's Previous and Next follow the tab's order", async () => {
    const order = toAuthoriseOrder(useAppStore.getState())
    const router = mountAt(reviewPath(order[1]!))
    await act(async () => {
      screen.getByRole('button', { name: 'Next in queue' }).click()
    })
    expect(here(router)).toBe(reviewPath(order[2]!))
    await act(async () => {
      screen.getByRole('button', { name: 'Previous in queue' }).click()
    })
    expect(here(router)).toBe(reviewPath(order[1]!))
  })

  it('a List leaves the tab once authorised, and the empty tab says so', () => {
    const ids = toAuthoriseOrder(useAppStore.getState())
    useAppStore.setState((s) => ({
      schedule: { ...s.schedule, lists: { ...s.schedule.lists, [ids[0]!]: { ...(s.schedule.lists[ids[0]!] as AssignedList), state: 'AUTHORISED' } } },
    }))
    mountAt(TAB)
    expect(rowIds()).toEqual(ids.slice(1))
    cleanup()
    useAppStore.setState((s) => ({
      schedule: { ...s.schedule, lists: Object.fromEntries(Object.entries(s.schedule.lists).filter(([, l]) => l.state !== 'SUBMITTED')) },
    }))
    mountAt(TAB)
    expect(shot('to-authorise-empty')!.textContent).toContain('Nothing waiting to be authorised')
  })

  it('the rail links to Finances › Billing and to the events awaiting approval on Payments', () => {
    mountAt(TAB)
    expect(shot('to-authorise-open-billing')!.getAttribute('href')).toBe('/admin/finances/billing')
    const payments = shot('to-authorise-open-payments')!
    expect(payments.getAttribute('href')).toBe('/admin/finances/payments')
    // The seeded EV0001 waits for approval.
    expect(payments.textContent).toContain('1 in Payments')
  })
})

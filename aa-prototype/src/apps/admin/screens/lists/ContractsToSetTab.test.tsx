/**
 * Lists › Contracts to set (US-04.3.12; US-13.1.3): one row per List with "n of N", every date, past
 * Lists first in their own strongly marked group, each Procedure still to set and how far it has got
 * behind the row's chevron, Set Contracts opening the Booking on its day, and the toolbar's search,
 * When and Hospital kept in the URL with the result count.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addDaysISO } from '../../../../domain/clock'
import { freshAppState, useAppStore } from '../../../../store'
import { listsRoutes } from '../../../../test/adminRoutes'
import { AdminApp } from '../../AdminApp'
import { contractsToSetCountText, contractsToSetItems } from './contractsToSetView'
import { listsPath } from './listsPaths'

function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        <Route path="day/:dateISO" element={<div data-testid="day" />} />
        <Route path="day/:dateISO/bookings/:bookingId" element={<div data-testid="booking" />} />
        {listsRoutes()}
      </Route>,
    ),
    { initialEntries: [url] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const table = () => document.querySelector('[data-shot="contracts-to-set-table"]') as HTMLElement
const listRows = () => [...table().querySelectorAll('tr[data-list-id]')] as HTMLElement[]
const count = () => document.querySelector('[data-shot="contracts-to-set-count"]')?.textContent
const items = () => contractsToSetItems(useAppStore.getState())

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

afterEach(cleanup)

describe('Contracts to set', () => {
  it('shows one row per List with how many are set, and counts Lists and Procedures', () => {
    mountAt(listsPath('contracts-to-set'))
    const all = items()
    expect(all.length).toBeGreaterThan(0)
    expect(listRows().map((r) => r.getAttribute('data-list-id'))).toEqual(all.map((i) => i.listId))
    const first = all[0]!
    expect(within(listRows()[0]!).getByText(`${first.set} of ${first.total}`)).toBeTruthy()
    expect(within(listRows()[0]!).getByRole('progressbar', { name: 'Contracts set' }).getAttribute('aria-valuenow')).toBe(String(first.set))
    expect(count()).toBe(contractsToSetCountText(all))
  })

  it('puts past Lists first, in a group marked strongly', () => {
    const today = addDaysISO(items()[0]!.dateISO, 1)
    act(() => useAppStore.setState((s) => ({ clock: { ...s.clock, todayISO: today } })))
    mountAt(listsPath('contracts-to-set'))
    const groups = [...table().querySelectorAll('[data-contracts-group]')].map((g) => g.getAttribute('data-contracts-group'))
    expect(groups[0]).toBe('past')
    expect(table().querySelector('[data-contracts-group="past"]')?.textContent).toContain('Past, holding up submission')
    const firstRow = listRows()[0]!
    expect(firstRow.getAttribute('data-past')).toBe('true')
    expect(within(firstRow).getByText("Can't be submitted until set")).toBeTruthy()
  })

  it("opens a row to show each Procedure still to set and how far it has got, with no RVG detail", () => {
    const first = items()[0]!
    mountAt(listsPath('contracts-to-set'))
    expect(table().querySelectorAll(`tr[data-procedure-list="${first.listId}"]`)).toHaveLength(0)
    fireEvent.click(within(listRows()[0]!).getByRole('button', { name: /^Show the Procedures to set on/ }))
    const lines = [...table().querySelectorAll(`tr[data-procedure-list="${first.listId}"]`)] as HTMLElement[]
    expect(lines).toHaveLength(first.procedures.length)
    first.procedures.forEach((p, n) => {
      expect(lines[n]!.textContent).toContain(p.patientName)
      expect(lines[n]!.textContent).toContain(p.progressText)
      expect(lines[n]!.getAttribute('data-stage')).toBe(p.stage)
    })
    expect(table().textContent).not.toMatch(/RVG|modifier/i)
  })

  it('Set Contracts opens the first Procedure’s Booking on its day', () => {
    const first = items()[0]!
    const router = mountAt(listsPath('contracts-to-set'))
    fireEvent.click(within(listRows()[0]!).getByRole('button', { name: /^Set Contracts, / }))
    expect(router.state.location.pathname).toBe(`/admin/day/${first.dateISO}/bookings/${first.procedures[0]!.bookingId}`)
  })

  it('searches by patient and keeps the search in the URL', () => {
    const target = items()[items().length - 1]!
    const patient = target.procedures[0]!.patientName
    const router = mountAt(listsPath('contracts-to-set'))
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search by anaesthetist, surgeon, hospital or patient' }), { target: { value: patient } })
    expect(new URLSearchParams(router.state.location.search).get('q')).toBe(patient)
    expect(listRows().map((r) => r.getAttribute('data-list-id'))).toContain(target.listId)
    expect(listRows().length).toBeLessThanOrEqual(items().length)
  })

  it('reads When and Hospital from the URL, and says when nothing matches', () => {
    const one = items()[0]!
    mountAt(`${listsPath('contracts-to-set')}?hospital=${one.hospitalId}`)
    expect(listRows().every((r) => items().find((i) => i.listId === r.getAttribute('data-list-id'))!.hospitalId === one.hospitalId)).toBe(true)
    cleanup()
    mountAt(`${listsPath('contracts-to-set')}?when=past`)
    expect(items().some((i) => i.past)).toBe(false)
    expect(screen.getByText('No Lists match.')).toBeTruthy()
    expect(count()).toBe('0 Lists, 0 Procedures')
  })
})

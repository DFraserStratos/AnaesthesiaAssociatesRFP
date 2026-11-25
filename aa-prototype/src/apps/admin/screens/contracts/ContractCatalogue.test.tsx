/**
 * The grouped Contract catalogue (build plan Phase 47; US-04.1.2 Grouped, Two surgeons, Active
 * filter; D96): the index follows the search, Group by writes the URL and the office user's memory,
 * `?holder=` becomes the holder grouping, and the back link returns to the same view.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CONTRACT, PARTY, SURG, TAG } from '../../../../domain/seed'
import { freshAppState, useAppStore, type Actor } from '../../../../store'
import { resetDemo } from '../../../../store/clockActions'
import { SurfaceProvider } from '../../../../shared'
import { AdminContractRoute, AdminContractsRoute, AdminMastersRoute } from '../../routes'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

let location = ''
function LocationProbe() {
  const l = useLocation()
  location = `${l.pathname}${l.search}`
  return null
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <SurfaceProvider variant="web">
        <LocationProbe />
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: useAppStore.getState().clock.todayISO }} />}>
            <Route path="contracts">
              <Route element={<AdminContractsRoute />}>
                <Route index element={null} />
                <Route path="new" element={null} />
              </Route>
              <Route path=":contractId" element={<AdminContractRoute />} />
            </Route>
            <Route path="masters" element={<AdminMastersRoute />} />
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement
const index = () => shot('contract-group-index')
const indexItems = () => [...index().querySelectorAll('button[data-group-key]')].map((b) => ({ key: b.getAttribute('data-group-key'), text: b.textContent ?? '', current: b.getAttribute('aria-current') === 'true' }))
const countOf = (key: string) => Number((indexItems().find((i) => i.key === key)?.text.match(/([\d,]+)$/)?.[1] ?? '0').replace(/,/g, ''))
const rowIds = () => [...document.querySelectorAll('tr[data-contract]')].map((r) => r.getAttribute('data-contract'))
const groupBy = (value: string) => fireEvent.change(within(shot('contract-group-by')).getByLabelText('Group by'), { target: { value } })
const search = (value: string) => fireEvent.change(screen.getByLabelText('Search by name, code or AA code'), { target: { value } })
const status = (name: string) => fireEvent.click(within(shot('contract-status-filter')).getByRole('button', { name }))

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('the grouped Contract catalogue (Phase 47)', () => {
  it('opens on Kind: All first, then AA, the hospitals and the other kinds, with every group in the table', () => {
    renderAt('/admin/contracts')
    expect(within(shot('contract-group-by')).getByLabelText('Group by')).toHaveValue('kind')
    const keys = indexItems().map((i) => i.key)
    expect(keys.slice(0, 3)).toEqual(['', 'aa', 'hospital'])
    expect(indexItems()[0]!.current).toBe(true)
    expect(indexItems()[1]!.text).toMatch(/^Anaesthesia Associates/)
    expect(document.querySelectorAll('tr[data-contract-group]').length).toBeGreaterThan(0)
    expect(shot('contract-result-count')).toHaveTextContent('Grouped by kind.')
    expect(location).toBe('/admin/contracts')
  })

  it('Group by changes the index and the URL, remembers it for the office user, and picking a group adds ?in=', () => {
    renderAt('/admin/contracts')
    groupBy('tag')
    expect(location).toBe('/admin/contracts?group=tag')
    expect(useAppStore.getState().shell.contractGrouping).toEqual({ kirsty: 'tag' })
    const keys = indexItems().map((i) => i.key)
    expect(keys[keys.length - 1]).toBe('none')
    fireEvent.click(within(index()).getByRole('button', { name: /^SXAP/ }))
    expect(location).toBe(`/admin/contracts?group=tag&in=${TAG.sxap}`)
    // Every row is SXAP, under holder sub-headings; the index count equals the rows.
    const contracts = useAppStore.getState().masters.contracts
    expect(rowIds().every((id) => contracts[id!]!.fundingTagId === TAG.sxap)).toBe(true)
    expect(rowIds()).toHaveLength(countOf(TAG.sxap))
    expect(document.querySelectorAll('tr[data-group-level="sub"]').length).toBeGreaterThan(0)
    // Changing the grouping drops the group.
    groupBy('pricing')
    expect(location).toBe('/admin/contracts?group=pricing')
  })

  it('shows a Contract linked to two surgeons under both, with the note, and counts it once in All', () => {
    renderAt('/admin/contracts?group=surgeon')
    expect(index()).toHaveTextContent('A Contract linked to two surgeons shows under both.')
    const sum = indexItems().slice(1).reduce((n, i) => n + countOf(i.key!), 0)
    expect(sum).toBeGreaterThan(countOf(''))
    expect(indexItems()[indexItems().length - 1]!.text).toMatch(/^Not linked to a surgeon/)
    for (const surgeon of [SURG.lim, SURG.okafor]) {
      fireEvent.click(index().querySelector(`button[data-group-key="${surgeon}"]`)!)
      expect(rowIds()).toContain(CONTRACT.ariaContractRate)
    }
    groupBy('kind')
    expect(index()).not.toHaveTextContent('shows under both')
  })

  it('the index counts follow the search, and a picked group with no match shows the empty state', () => {
    renderAt(`/admin/contracts?group=tag&in=${TAG.sxap}`)
    const before = countOf('')
    search('CAT')
    expect(countOf('')).toBeLessThan(before)
    expect(countOf('')).toBeGreaterThan(0)
    // No SXAP Contract is a gastric bypass: the group stays picked and the empty state offers to search all.
    search('Gastric bypass')
    expect(countOf('')).toBeGreaterThan(0)
    expect(location).toBe(`/admin/contracts?group=tag&in=${TAG.sxap}`)
    expect(shot('contract-catalogue')).toHaveTextContent('No Contracts match.')
    fireEvent.click(screen.getByRole('button', { name: 'Search all Contracts' }))
    expect(screen.getByLabelText('Search by name, code or AA code')).toHaveValue('')
    expect(location).toBe('/admin/contracts?group=tag')
    expect(rowIds().length).toBeGreaterThan(0)
  })

  it('Active by default, Disabled or All when asked', () => {
    renderAt('/admin/contracts')
    expect(rowIds()).not.toContain(CONTRACT.cesOldRate)
    status('Disabled')
    expect(rowIds()).toEqual([CONTRACT.cesOldRate])
    status('All')
    search('2025 rate')
    expect(rowIds()).toContain(CONTRACT.cesOldRate)
  })

  it('rewrites ?holder= to the holder grouping; an unknown Party reads as All; a holder with only Disabled Contracts opens on All', () => {
    renderAt(`/admin/contracts?holder=${PARTY.ces}`)
    expect(location).toBe(`/admin/contracts?group=holder&in=${PARTY.ces}`)
    expect(indexItems().find((i) => i.key === PARTY.ces)!.current).toBe(true)
    cleanup()
    renderAt('/admin/contracts?holder=PY-NOT-THERE')
    expect(location).toBe('/admin/contracts')
    expect(indexItems()[0]!.current).toBe(true)
    cleanup()
    // The old Master data link lands on the holder grouping too (D93).
    renderAt(`/admin/masters?view=contracts&holder=${PARTY.ces}`)
    expect(location).toBe(`/admin/contracts?group=holder&in=${PARTY.ces}`)
    cleanup()
    const s = useAppStore.getState()
    useAppStore.setState({ masters: { ...s.masters, contracts: { ...s.masters.contracts, [CONTRACT.unisports]: { ...s.masters.contracts[CONTRACT.unisports]!, status: 'disabled' } } } })
    renderAt(`/admin/contracts?holder=${PARTY.unisports}`)
    expect(within(shot('contract-status-filter')).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    expect(rowIds()).toContain(CONTRACT.unisports)
  })

  it('a bare URL opens on the office user’s remembered grouping; ?group= wins; Reset clears it', () => {
    useAppStore.getState().setContractGrouping('kirsty', 'pricing')
    useAppStore.getState().setContractGrouping('sam', 'surgeon')
    renderAt('/admin/contracts')
    expect(within(shot('contract-group-by')).getByLabelText('Group by')).toHaveValue('pricing')
    cleanup()
    useAppStore.getState().setOfficeUser('sam')
    renderAt('/admin/contracts')
    expect(within(shot('contract-group-by')).getByLabelText('Group by')).toHaveValue('surgeon')
    cleanup()
    renderAt('/admin/contracts?group=destination')
    expect(within(shot('contract-group-by')).getByLabelText('Group by')).toHaveValue('destination')
    expect(useAppStore.getState().shell.contractGrouping?.sam).toBe('surgeon')
    cleanup()
    resetDemo(useAppStore)
    renderAt('/admin/contracts')
    expect(within(shot('contract-group-by')).getByLabelText('Group by')).toHaveValue('kind')
  })

  it('a row opens the Contract at its id, and Back returns to the same grouping, group and search', () => {
    renderAt(`/admin/contracts?group=tag&in=${TAG.acc}`)
    search('ACC')
    const row = document.querySelector(`tr[data-contract="${CONTRACT.stgAcc}"]`) as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: /^Open / }))
    expect(location).toBe(`/admin/contracts/${CONTRACT.stgAcc}`)
    fireEvent.click(screen.getByRole('link', { name: 'Contracts' }))
    expect(location).toBe(`/admin/contracts?group=tag&in=${TAG.acc}`)
    expect(screen.getByLabelText('Search by name, code or AA code')).toHaveValue('ACC')
  })

  it('pages the list at 50 and repeats a group heading at a page break with its full count', () => {
    renderAt('/admin/contracts?group=holder')
    const all = countOf('')
    expect(all).toBeGreaterThan(50)
    expect(rowIds()).toHaveLength(50)
    expect(shot('contract-pager')).toHaveTextContent('Showing 1 to 50 of')
    fireEvent.click(within(shot('contract-pager')).getByRole('button', { name: /next/i }))
    expect(location).toContain('page=2')
    const firstHeading = document.querySelector('tr[data-contract-group]')!
    const key = firstHeading.getAttribute('data-contract-group')!
    expect(firstHeading).toHaveTextContent(String(countOf(key)))
  })
})

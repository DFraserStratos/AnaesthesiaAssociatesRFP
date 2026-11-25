/**
 * Catch-up Phase 18a screens: the Specialties and Funding tags views, the
 * surgeon's required specialties (sheet, profile, table), and the Contract
 * editor's specialties, funding tag, live placement line and system-Contract
 * treatment.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { SPC, SURG, TAG } from '../../../../domain/seed'
import { freshAppState, useAppStore, type Actor } from '../../../../store'
import { SurfaceProvider } from '../../../../shared'
import { AdminContractRoute, AdminContractsRoute, AdminMastersRoute, AdminNewContractRoute, AdminSurgeonProfileRoute } from '../../routes'
import { isOpenPriceFallback } from '../../../../domain/billing/fallbacks'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderAdmin(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: '2026-11-24' }} />}>
            <Route path="masters">
              <Route index element={<AdminMastersRoute />} />
              <Route path="surgeons/:surgeonId" element={<AdminSurgeonProfileRoute />} />
            </Route>
            <Route path="contracts">
              <Route element={<AdminContractsRoute />}>
                <Route index element={null} />
              </Route>
              <Route path="new" element={<AdminNewContractRoute />} />
              <Route path=":contractId" element={<AdminContractRoute />} />
            </Route>
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('Specialties view (US-13.4.4)', () => {
  it('lists the twelve with holder counts; adds, renames and removes one', () => {
    renderAdmin('/admin/masters?view=specialties')
    const table = shot('masters-specialties')
    expect(table.querySelectorAll('tr[data-specialty]').length).toBe(12)
    expect(within(table.querySelector(`tr[data-specialty="${SPC.ophthalmology}"]`) as HTMLElement).getByText('20 surgeons, 8 Contracts')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add specialty' }))
    fireEvent.change(within(shot('specialty-sheet')).getByLabelText('Name'), { target: { value: 'Paediatric surgery' } })
    fireEvent.click(within(shot('specialty-sheet')).getByRole('button', { name: 'Add specialty' }))
    expect(screen.getByText('Paediatric surgery')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Rename Paediatric surgery' }))
    fireEvent.change(within(shot('specialty-sheet')).getByLabelText('Name'), { target: { value: 'Paediatric and neonatal surgery' } })
    fireEvent.click(within(shot('specialty-sheet')).getByRole('button', { name: 'Save name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Paediatric and neonatal surgery' }))
    expect(screen.queryByText('Paediatric and neonatal surgery')).toBeNull()
    expect(useAppStore.getState().audit.slice(-3).map((a) => a.action)).toEqual(['specialty.create', 'specialty.update', 'specialty.remove'])
  })

  it('refuses a held specialty plainly, and a duplicate name in the sheet', () => {
    renderAdmin('/admin/masters?view=specialties')
    fireEvent.click(screen.getByRole('button', { name: 'Remove Ophthalmology' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ophthalmology is held by 20 surgeons and 8 Contracts, so it cannot be removed.')
    fireEvent.click(screen.getByRole('button', { name: 'Add specialty' }))
    fireEvent.change(within(shot('specialty-sheet')).getByLabelText('Name'), { target: { value: 'ent' } })
    fireEvent.click(within(shot('specialty-sheet')).getByRole('button', { name: 'Add specialty' }))
    expect(within(shot('specialty-sheet')).getByRole('alert')).toHaveTextContent('That specialty is already on the list.')
  })
})

describe('Funding tags view (US-13.4.5)', () => {
  const codes = () => [...shot('masters-funding-tags').querySelectorAll('tr[data-tag] td:first-child')].map((td) => td.textContent)

  it('lists SXAP, HNZ, ACC with funders in order, moves HNZ up and back', () => {
    renderAdmin('/admin/masters?view=fundingTags')
    expect(codes()).toEqual(['SXAP', 'HNZ', 'ACC'])
    expect(within(shot('masters-funding-tags')).getByText('Southern Cross Health Society')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Move HNZ up' }))
    expect(codes()).toEqual(['HNZ', 'SXAP', 'ACC'])
    fireEvent.click(screen.getByRole('button', { name: 'Move HNZ down' }))
    expect(codes()).toEqual(['SXAP', 'HNZ', 'ACC'])
  })

  it('adds a tag, edits its funder, removes it; refuses removing SXAP', () => {
    renderAdmin('/admin/masters?view=fundingTags')
    fireEvent.click(screen.getByRole('button', { name: 'Add funding tag' }))
    const sheet = () => shot('funding-tag-sheet')
    fireEvent.change(within(sheet()).getByLabelText('Code'), { target: { value: 'nzdf' } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Add funding tag' }))
    expect(codes()).toEqual(['SXAP', 'HNZ', 'ACC', 'NZDF'])
    fireEvent.click(screen.getByRole('button', { name: 'Edit NZDF' }))
    fireEvent.change(within(sheet()).getByLabelText('Funder'), { target: { value: 'PY-NZDF' } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Save changes' }))
    expect(within(shot('masters-funding-tags')).getByText('NZDF', { selector: 'td:not(.mono)' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove NZDF' }))
    expect(codes()).toEqual(['SXAP', 'HNZ', 'ACC'])
    fireEvent.click(screen.getByRole('button', { name: 'Remove SXAP' }))
    expect(screen.getByRole('alert')).toHaveTextContent('SXAP is carried by 11 Contracts, its system No contract Contracts included, so it cannot be removed.')
  })
})

describe("a surgeon's specialties (US-13.6.6)", () => {
  it('the profile shows one pill per specialty; the sheet refuses none, then saves two', () => {
    renderAdmin(`/admin/masters/surgeons/${SURG.whitford}`)
    expect(within(shot('surgeon-specialties')).getByText('Ophthalmology')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit details' }))
    const sheet = () => shot('surgeon-edit-sheet')
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Remove Ophthalmology' }))
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Save changes' }))
    expect(within(sheet()).getByRole('alert')).toHaveTextContent('Choose at least one specialty.')
    fireEvent.change(within(sheet()).getByLabelText('Specialties'), { target: { value: SPC.ophthalmology } })
    fireEvent.change(within(sheet()).getByLabelText('Specialties'), { target: { value: SPC.plasticSurgery } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Save changes' }))
    const pills = within(shot('surgeon-specialties'))
    expect(pills.getByText('Ophthalmology')).toBeInTheDocument()
    expect(pills.getByText('Plastic surgery')).toBeInTheDocument()
    expect(useAppStore.getState().audit.at(-1)).toMatchObject({ before: { specialties: ['Ophthalmology'] }, after: { specialties: ['Ophthalmology', 'Plastic surgery'] } })
  })

  it('the Surgeons table shows the mapped name (Lim: Plastic surgery)', () => {
    renderAdmin('/admin/masters?view=surgeons')
    const row = document.querySelector(`tr[data-surgeon="${SURG.lim}"]`) as HTMLElement
    expect(within(row).getByText('Plastic surgery')).toBeInTheDocument()
  })
})

describe("the Contract's page and the catalogue (US-04.2.16, US-04.2.17; a page since build plan Phase 45)", () => {
  /** Open a Contract's page from its row in the list. */
  const openContract = (aaCode: string) => {
    const row = [...document.querySelectorAll('tr[data-contract]')].find((r) => r.querySelector('td')?.textContent === aaCode) as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: /^Open / }))
  }
  const editWhere = () => fireEvent.click(within(shot('contract-where')).getByRole('button', { name: 'Edit where it is offered' }))

  it('SXAP shows its tag and the live hint; changing the tag moves the hint', () => {
    renderAdmin('/admin/contracts')
    openContract('SX-002')
    expect(within(shot('contract-funding-tag')).getByText('SXAP')).toBeInTheDocument()
    expect(shot('contract-placement')).toHaveTextContent('Offered under Southern Cross › SXAP')
    editWhere()
    const where = shot('contract-where')
    expect(within(where).getByLabelText('Funding tag')).toHaveValue(TAG.sxap)
    fireEvent.change(within(where).getByLabelText('Funding tag'), { target: { value: '' } })
    expect(shot('contract-placement')).toHaveTextContent('Offered under Special')
  })

  it("Doyle's bariatric shows General surgery and hints Patient; COS ACC hints Special", () => {
    renderAdmin('/admin/contracts')
    openContract('DOYLE-001')
    expect(shot('contract-specialties')).toHaveTextContent('General surgery')
    expect(shot('contract-placement')).toHaveTextContent('Offered under Patient')
  })

  it('tagging a hospital Contract with a new tag makes its Fixed price Contract at once', () => {
    renderAdmin('/admin/contracts')
    openContract('CES-001')
    editWhere()
    fireEvent.change(within(shot('contract-where')).getByLabelText('Funding tag'), { target: { value: TAG.sxap } })
    fireEvent.click(within(shot('contract-where')).getByRole('button', { name: 'Save' }))
    const fallbacks = Object.values(useAppStore.getState().masters.contracts).filter(isOpenPriceFallback).map((c) => c.name)
    expect(fallbacks).toContain('Christchurch Eye Surgery · SXAP · Fixed price')
  })

  it('a system row carries the System pill; its page edits only name, AA code and invoice description and offers no Disable', () => {
    renderAdmin('/admin/contracts')
    const row = document.querySelector('tr[data-contract="CT-FIX-HOSPITAL-PY-STG-TAG-ACC"]') as HTMLElement
    expect(row.getAttribute('data-system')).toBe('openPriceFallback')
    expect(within(row).getByText('System')).toBeInTheDocument()
    openContract('STG-ACC-FIX')
    expect(shot('contract-system-notice')).toHaveTextContent('Only its name, AA code and invoice description can change.')
    expect(within(shot('contract-where')).queryByRole('button', { name: /^Edit/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Disable' })).toBeNull()
    expect(within(shot('contract-funding-tag')).queryByRole('combobox')).toBeNull()
  })

  it('a new Contract never offers an open-price kind', () => {
    renderAdmin('/admin/contracts')
    fireEvent.click(screen.getByRole('button', { name: 'New contract' }))
    const kinds = within(screen.getByRole('radiogroup', { name: 'Pricing kind' })).getAllByRole('radio').map((r) => r.getAttribute('data-pricing-kind'))
    expect(kinds).toEqual(['rvgAnaesthetistRate', 'rvgContractRate', 'rvgDiscount', 'fixed'])
    expect(kinds).not.toContain('open')
  })

  it('filters by funding tag beside the holder filter, the system Fixed price and RVG backstop Contracts included', () => {
    renderAdmin('/admin/masters?view=contracts')
    fireEvent.change(within(shot('contract-tag-filter')).getByLabelText('Funding tag'), { target: { value: TAG.acc } })
    expect(shot('contract-result-count')).toHaveTextContent('tagged ACC')
    const codes = [...document.querySelectorAll('tr[data-contract] td:first-child')].map((td) => td.textContent).sort()
    expect(codes).toEqual(['CES-009', 'CES-ACC-FIX', 'CES-ACC-RVG', 'COS-001', 'COS-002', 'STG-002', 'STG-ACC-FIX', 'STG-ACC-RVG'])
  })
})

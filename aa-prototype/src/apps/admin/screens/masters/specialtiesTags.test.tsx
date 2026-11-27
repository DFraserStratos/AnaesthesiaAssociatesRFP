/**
 * Catch-up Phase 18a screens: the Specialties and Funding tags views, the
 * surgeon's required specialties (sheet, profile, table), and the Contract
 * editor's specialties, funding tag, live placement line and system-Contract
 * treatment.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { SPC, SURG, TAG } from '../../../../domain/seed'
import { freshAppState, useAppStore, type Actor } from '../../../../store'
import { SurfaceProvider } from '../../../../shared'
import { AdminContractRoute, AdminContractsRoute, AdminNewContractRoute, AdminPartiesRoute, AdminPartyRoute, AdminFundingTagsRoute } from '../../routes'
import { mastersAndLegacyRoutes, peopleRoutes } from '../../../../test/adminRoutes'
import { isOpenPriceFallback } from '../../../../domain/billing/fallbacks'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderAdmin(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: '2026-11-24' }} />}>
            {peopleRoutes()}
            {mastersAndLegacyRoutes()}
            <Route path="contracts">
              <Route element={<AdminContractsRoute />}>
                <Route index element={null} />
              </Route>
              <Route path="new" element={<AdminNewContractRoute />} />
              <Route path="parties">
                <Route index element={<AdminPartiesRoute />} />
                <Route path=":partyId" element={<AdminPartyRoute />} />
              </Route>
              <Route path="tags" element={<AdminFundingTagsRoute />} />
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

describe('Specialties tab and the specialty page (US-13.4.4; the page since build plan Phase 56)', () => {
  const ophthalmologyContract = () =>
    Object.values(useAppStore.getState().masters.contracts).find((c) => c.specialtyIds.includes(SPC.ophthalmology) && c.status === 'active')!

  it('lists the twelve with holder counts and no row actions; a row opens the page; Add lands on the new page', () => {
    renderAdmin('/admin/people/specialties')
    const table = shot('masters-specialties')
    expect(table.querySelectorAll('tr[data-specialty]').length).toBe(12)
    expect(within(table.querySelector(`tr[data-specialty="${SPC.ophthalmology}"]`) as HTMLElement).getByText('20 surgeons, 8 Contracts')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^(Rename|Remove|History of) / })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Add specialty' }))
    fireEvent.change(within(shot('specialty-sheet')).getByLabelText('Name'), { target: { value: 'Paediatric surgery' } })
    fireEvent.click(within(shot('specialty-sheet').closest('[role="dialog"]') as HTMLElement).getByRole('button', { name: 'Add specialty' }))
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('specialty.create')
    expect(shot('specialty-page')).not.toBeNull()
    expect(within(shot('specialty-name')).getByText('Paediatric surgery')).toBeInTheDocument()
    expect(within(shot('specialty-surgeons')).getByText('No surgeon holds this specialty yet.')).toBeInTheDocument()
    expect(within(shot('specialty-contracts')).getByText('No Contract is limited to this specialty.')).toBeInTheDocument()
    // Unheld: Remove confirms, audits specialty.remove and lands on the tab.
    fireEvent.click(screen.getByRole('button', { name: 'Remove Paediatric surgery' }))
    fireEvent.click(within(shot('specialty-remove-confirm').closest('[role="dialog"]') as HTMLElement).getByRole('button', { name: 'Remove specialty' }))
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('specialty.remove')
    expect(shot('masters-specialties')).not.toBeNull()
    expect(screen.queryByText('Paediatric surgery')).toBeNull()
  })

  it('Ophthalmology lists exactly its holders; rows open the surgeon and the Contract pages', () => {
    renderAdmin(`/admin/people/specialties/${SPC.ophthalmology}`)
    expect(shot('specialty-page')).toHaveTextContent('Held by 20 surgeons and 8 Contracts')
    expect(shot('specialty-surgeons').querySelectorAll('tr[data-surgeon]').length).toBe(20)
    expect(shot('specialty-contracts').querySelectorAll('tr[data-contract]').length).toBe(8)
    fireEvent.click(within(shot('specialty-surgeons').querySelector(`tr[data-surgeon="${SURG.reid}"]`) as HTMLElement).getByRole('link'))
    expect(shot('surgeon-profile')).not.toBeNull()
    cleanup()
    renderAdmin(`/admin/people/specialties/${SPC.ophthalmology}`)
    const c = ophthalmologyContract()
    fireEvent.click(within(shot('specialty-contracts').querySelector(`tr[data-contract="${c.id}"]`) as HTMLElement).getByRole('link'))
    expect(shot('contract-specialties')).toHaveTextContent('Ophthalmology')
  })

  it('a rename is one specialty.update reaching the list, a surgeon and a Contract by id; a duplicate is refused in place; Cancel restores', () => {
    renderAdmin(`/admin/people/specialties/${SPC.ophthalmology}`)
    const card = () => shot('specialty-name')
    fireEvent.click(within(card()).getByRole('button', { name: 'Edit name' }))
    fireEvent.change(within(card()).getByLabelText('Name'), { target: { value: 'ent' } })
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }))
    expect(within(card()).getByRole('alert')).toHaveTextContent('That specialty is already on the list.')
    fireEvent.click(within(card()).getByRole('button', { name: 'Cancel' }))
    expect(within(card()).getByText('Ophthalmology')).toBeInTheDocument()
    fireEvent.click(within(card()).getByRole('button', { name: 'Edit name' }))
    fireEvent.change(within(card()).getByLabelText('Name'), { target: { value: 'Eye surgery' } })
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }))
    expect(useAppStore.getState().audit.at(-1)).toMatchObject({ action: 'specialty.update', before: { name: 'Ophthalmology' }, after: { name: 'Eye surgery' } })
    expect(useAppStore.getState().masters.surgeons[SURG.reid]!.specialtyIds).toContain(SPC.ophthalmology)
    cleanup()
    renderAdmin('/admin/people/specialties')
    expect(within(shot('masters-specialties')).getByText('Eye surgery')).toBeInTheDocument()
    cleanup()
    renderAdmin(`/admin/people/surgeons/${SURG.reid}`)
    expect(within(shot('surgeon-specialties')).getByText('Eye surgery')).toBeInTheDocument()
    cleanup()
    renderAdmin(`/admin/contracts/${ophthalmologyContract().id}`)
    expect(shot('contract-specialties')).toHaveTextContent('Eye surgery')
  })

  it('Remove on a held specialty shows the store sentence in the rail and removes nothing; an unknown id lands on the tab', () => {
    renderAdmin(`/admin/people/specialties/${SPC.ophthalmology}`)
    fireEvent.click(screen.getByRole('button', { name: 'Remove Ophthalmology' }))
    expect(within(shot('specialty-rail')).getByRole('alert')).toHaveTextContent('Ophthalmology is held by 20 surgeons and 8 Contracts, so it cannot be removed.')
    expect(useAppStore.getState().masters.specialties[SPC.ophthalmology]).toBeDefined()
    expect(shot('specialty-remove-confirm')).toBeNull()
    cleanup()
    renderAdmin('/admin/people/specialties/xyz')
    expect(shot('masters-specialties')).not.toBeNull()
  })
})

describe('Funding tags tab (US-13.4.5; moved to the Contracts section by build plan Phase 48)', () => {
  const codes = () => [...shot('masters-funding-tags').querySelectorAll('tr[data-tag] td:first-child')].map((td) => td.textContent)

  it('lists SXAP, HNZ, ACC with funders in order, moves HNZ up and back', () => {
    renderAdmin('/admin/contracts/tags')
    expect(codes()).toEqual(['SXAP', 'HNZ', 'ACC'])
    expect(within(shot('masters-funding-tags')).getByText('Southern Cross Health Society')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Move HNZ up' }))
    expect(codes()).toEqual(['HNZ', 'SXAP', 'ACC'])
    fireEvent.click(screen.getByRole('button', { name: 'Move HNZ down' }))
    expect(codes()).toEqual(['SXAP', 'HNZ', 'ACC'])
  })

  it('adds a tag, edits its funder, removes it; refuses removing SXAP', () => {
    renderAdmin('/admin/contracts/tags')
    fireEvent.click(screen.getByRole('button', { name: 'Add funding tag' }))
    const sheet = () => shot('funding-tag-sheet').closest('[role="dialog"]') as HTMLElement
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
  it('the page shows one pill per specialty; the Specialties card refuses none, then saves two', () => {
    renderAdmin(`/admin/people/surgeons/${SURG.whitford}`)
    expect(within(shot('surgeon-specialties')).getByText('Ophthalmology')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit specialties' }))
    const sheet = () => shot('surgeon-specialties')
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Remove Ophthalmology' }))
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Save' }))
    expect(within(sheet()).getByRole('alert')).toHaveTextContent('Choose at least one specialty.')
    fireEvent.change(within(sheet()).getByLabelText('Specialties'), { target: { value: SPC.ophthalmology } })
    fireEvent.change(within(sheet()).getByLabelText('Specialties'), { target: { value: SPC.plasticSurgery } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Save' }))
    const pills = within(shot('surgeon-specialties'))
    expect(pills.getByText('Ophthalmology')).toBeInTheDocument()
    expect(pills.getByText('Plastic surgery')).toBeInTheDocument()
    expect(useAppStore.getState().audit.at(-1)).toMatchObject({ before: { specialties: ['Ophthalmology'] }, after: { specialties: ['Ophthalmology', 'Plastic surgery'] } })
  })

  it('the Surgeons table shows the mapped name (Lim: Plastic surgery)', () => {
    renderAdmin('/admin/people/surgeons?q=Lim')
    const row = document.querySelector(`tr[data-surgeon="${SURG.lim}"]`) as HTMLElement
    expect(within(row).getByText('Plastic surgery')).toBeInTheDocument()
  })
})

describe("the Contract's page and the catalogue (US-04.2.16, US-04.2.17; a page since build plan Phase 45)", () => {
  /** Open a Contract's page from its row in the list. */
  const openContract = (aaCode: string) => {
    // The catalogue pages at 50 (Phase 47): search for the code so its row is on the page.
    fireEvent.change(screen.getByLabelText('Search by name, code or AA code'), { target: { value: aaCode } })
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

  it('groups by funding tag (Phase 47): ACC lists the ACC Contracts under their holders, the system Fixed price and RVG backstop Contracts included', () => {
    renderAdmin('/admin/contracts')
    fireEvent.change(within(shot('contract-group-by')).getByLabelText('Group by'), { target: { value: 'tag' } })
    fireEvent.click(within(shot('contract-group-index')).getByRole('button', { name: /^ACC/ }))
    expect(shot('contract-result-count')).toHaveTextContent('in ACC')
    expect(shot('contract-result-count')).toHaveTextContent('Grouped by funding tag.')
    const codes = [...document.querySelectorAll('tr[data-contract] td:first-child')].map((td) => td.textContent).sort()
    expect(codes).toEqual(['CES-009', 'CES-ACC-FIX', 'CES-ACC-RVG', 'COS-001', 'COS-002', 'STG-002', 'STG-ACC-FIX', 'STG-ACC-RVG'])
    // The same view from its URL.
    cleanup()
    renderAdmin(`/admin/contracts?group=tag&in=${TAG.acc}`)
    expect(shot('contract-result-count')).toHaveTextContent('in ACC')
    expect(document.querySelectorAll('tr[data-contract]')).toHaveLength(8)
  })
})

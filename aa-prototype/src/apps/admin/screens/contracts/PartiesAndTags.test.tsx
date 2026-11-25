/**
 * The Parties and Funding tags tabs of the Contracts section, a Party's page,
 * and Master data without them (build plan Phase 48; US-04.1.5, US-13.4.1,
 * US-13.4.5, D92, D93).
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PARTY_REFUSAL_MESSAGES } from '../../../../domain/billing/parties'
import { freshAppState, useAppStore, type Actor } from '../../../../store'
import { SurfaceProvider } from '../../../../shared'
import {
  AdminContractRoute,
  AdminContractsRoute,
  AdminFundingTagsRoute,
  AdminMastersRoute,
  AdminNewContractRoute,
  AdminPartiesRoute,
  AdminPartyRoute,
} from '../../routes'
import { mastersRedirect } from '../../mastersRedirect'
import { contractsCatalogueLink, fundingTagsPath, partyPath } from '../../contractsPaths'
import { AA_PARTY_SENTENCE } from './PartyPage'

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
              </Route>
              <Route path="new" element={<AdminNewContractRoute />} />
              <Route path="parties">
                <Route index element={<AdminPartiesRoute />} />
                <Route path=":partyId" element={<AdminPartyRoute />} />
              </Route>
              <Route path="tags" element={<AdminFundingTagsRoute />} />
              <Route path=":contractId" element={<AdminContractRoute />} />
            </Route>
            <Route path="masters" element={<AdminMastersRoute />} />
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const card = (shot: string) => document.querySelector(`[data-shot="${shot}"]`) as HTMLElement
const catalogueRows = () => document.querySelectorAll('[data-shot="contract-catalogue"] tr[data-contract]').length

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('old Master data links (D93)', () => {
  it('sends every old Parties and Funding tags form to its tab or page', () => {
    const { masters } = useAppStore.getState()
    const at = (q: string) => mastersRedirect(new URLSearchParams(q), masters)
    expect(at('view=parties')).toBe('/admin/contracts/parties')
    expect(at('view=insurers')).toBe('/admin/contracts/parties')
    expect(at('view=organisations')).toBe('/admin/contracts/parties')
    expect(at('view=parties&party=PY-CES')).toBe('/admin/contracts/parties/PY-CES')
    expect(at('view=parties&party=PY-NOT-THERE')).toBe('/admin/contracts/parties')
    expect(at('view=fundingTags')).toBe('/admin/contracts/tags')
    expect(at('view=contracts')).toBe('/admin/contracts')
    expect(at('view=rvgGroups')).toBeNull()
  })

  it('lands on the Party page from an old link', () => {
    renderAt('/admin/masters?view=parties&party=PY-CES')
    expect(location).toBe('/admin/contracts/parties/PY-CES')
    expect(card('party-page')).not.toBeNull()
  })

  it('Master data lists no Contracts, Parties or Funding tags and points across', () => {
    renderAt('/admin/masters?view=rvgGroups')
    for (const gone of ['contracts', 'parties', 'fundingTags']) expect(document.querySelector(`[data-masters-view="${gone}"]`)).toBeNull()
    const billing = document.querySelector('[data-masters-group="Billing"]') as HTMLElement
    expect([...billing.querySelectorAll('[data-masters-view]')].map((b) => b.getAttribute('data-masters-view'))).toEqual(['rvgGroups', 'modifiers'])
    const note = card('masters-moved-note')
    expect(note).toHaveTextContent('Contracts, Parties and Funding tags are now in Contracts.')
    expect(within(note).getByRole('link', { name: 'Contracts' })).toHaveAttribute('href', '/admin/contracts')
  })
})

describe('the Parties tab (US-04.1.5)', () => {
  it('groups Parties by kind, Contract-less ones included, with the tab strip and counts', () => {
    renderAt('/admin/contracts/parties')
    const groups = [...card('parties').querySelectorAll('tr[data-party-group]')].map((r) => r.getAttribute('data-party-group'))
    expect(groups).toEqual(['aa', 'hospital', 'insurer', 'funder', 'surgeonGroup', 'people'])
    const aia = card('parties').querySelector('tr[data-party="PY-AIA"]') as HTMLElement
    expect(within(aia).getByText('None')).toBeInTheDocument()
    expect(card('contracts-tabs').querySelector('[data-contracts-tab="parties"]')).toHaveAttribute('aria-current', 'page')
  })

  it('opens a Party\'s Contracts in the catalogue with as many rows as its count', () => {
    renderAt('/admin/contracts/parties')
    const ces = card('parties').querySelector('tr[data-party="PY-CES"]') as HTMLElement
    const link = within(ces).getByRole('link', { name: /Show the 9 active Contracts/ })
    expect(link).toHaveAttribute('href', contractsCatalogueLink({ holderId: 'PY-CES' }))
    fireEvent.click(link)
    expect(catalogueRows()).toBe(9)
  })

  it('a row opens the Party\'s page; New party saves and lands on the new page', () => {
    renderAt('/admin/contracts/parties')
    fireEvent.click(within(card('parties')).getByRole('button', { name: 'Open nib' }))
    expect(location).toBe(partyPath('PY-NIB'))
    cleanup()
    renderAt('/admin/contracts/parties')
    fireEvent.click(screen.getByRole('button', { name: 'New party' }))
    const panel = () => card('party-panel')
    fireEvent.click(within(panel()).getByRole('button', { name: 'Add Party' }))
    expect(within(panel()).getByRole('alert')).toHaveTextContent(PARTY_REFUSAL_MESSAGES.nameRequired)
    fireEvent.change(within(panel()).getByLabelText('Name'), { target: { value: 'Partners Life' } })
    fireEvent.click(within(panel()).getByRole('button', { name: 'Add Party' }))
    const made = Object.values(useAppStore.getState().masters.parties).find((p) => p.name === 'Partners Life')!
    expect(location).toBe(partyPath(made.id))
    expect(screen.getByRole('heading', { level: 1, name: 'Partners Life' })).toBeInTheDocument()
  })
})

describe('a Party\'s page (US-04.1.5)', () => {
  it('counts its Contracts by tag in step rail order, No tag last, then Disabled, each opening that many', () => {
    renderAt('/admin/contracts/parties/PY-CES')
    const byTag = card('party-contracts-by-tag')
    const rows = [...byTag.querySelectorAll('tr[data-party-tag]')]
    expect(rows.map((r) => r.getAttribute('data-party-tag'))).toEqual(['TAG-SXAP', 'TAG-HNZ', 'TAG-ACC', 'none', 'disabled'])
    expect(rows.map((r) => r.querySelector('td:nth-child(3)')!.textContent)).toEqual(['6', '1', '1', '1', '1'])
    expect(within(rows[0] as HTMLElement).getByText('Southern Cross Health Society')).toBeInTheDocument()
    fireEvent.click(within(rows[0] as HTMLElement).getByRole('link', { name: /View the 6 SXAP/ }))
    expect(location).toBe('/admin/contracts?group=holder&in=PY-CES&tag=TAG-SXAP&own=1')
    expect(catalogueRows()).toBe(6)
  })

  it('opens the Disabled count on the Disabled Contracts', () => {
    renderAt('/admin/contracts/parties/PY-CES')
    const disabled = card('party-contracts-by-tag').querySelector('tr[data-party-tag="disabled"]') as HTMLElement
    fireEvent.click(within(disabled).getByRole('link'))
    expect(catalogueRows()).toBe(1)
    expect(card('contract-result-count')).toHaveTextContent('1 Contract disabled in Christchurch Eye Surgery')
  })

  it('shows where its Contracts sit on the step rail', () => {
    renderAt('/admin/contracts/parties/PY-CES')
    const places = [...card('party-step-rail').querySelectorAll('[data-step-rail-place]')].map((li) => li.firstElementChild!.textContent)
    expect(places).toEqual(['Christchurch Eye Surgery › SXAP', 'Christchurch Eye Surgery › HNZ', 'Christchurch Eye Surgery › ACC', 'Special › Christchurch Eye Surgery'])
  })

  it('edits its details in place: Save audits party.update, a refusal shows on the card, Cancel restores', () => {
    renderAt('/admin/contracts/parties/PY-CES')
    const details = () => card('party-details')
    fireEvent.click(within(details()).getByRole('button', { name: /Edit the details/ }))
    expect(within(details()).getByLabelText('Kind')).toBeDisabled()
    expect(within(details()).getByText(PARTY_REFUSAL_MESSAGES.kindFixedWhileHolding)).toBeInTheDocument()
    fireEvent.change(within(details()).getByLabelText('Name'), { target: { value: '' } })
    fireEvent.click(within(details()).getByRole('button', { name: 'Save' }))
    expect(within(details()).getByRole('alert')).toHaveTextContent(PARTY_REFUSAL_MESSAGES.nameRequired)
    expect(useAppStore.getState().masters.parties['PY-CES']!.name).toBe('Christchurch Eye Surgery')
    fireEvent.click(within(details()).getByRole('button', { name: 'Cancel' }))
    expect(within(details()).getByText('Christchurch Eye Surgery Limited')).toBeInTheDocument()
    fireEvent.click(within(details()).getByRole('button', { name: /Edit the details/ }))
    fireEvent.change(within(details()).getByLabelText('Billing name'), { target: { value: 'CES Holdings Limited' } })
    fireEvent.click(within(details()).getByRole('button', { name: 'Save' }))
    expect(within(details()).getByText('CES Holdings Limited')).toBeInTheDocument()
    const last = useAppStore.getState().audit.at(-1)!
    expect(last.action).toBe('party.update')
    expect(last).toMatchObject({ entityId: 'PY-CES' })
  })

  it('Anaesthesia Associates reads the same page with no Edit', () => {
    renderAt('/admin/contracts/parties/PY-AA')
    expect(within(card('party-details')).getByText(AA_PARTY_SENTENCE)).toBeInTheDocument()
    expect(within(card('party-details')).queryByRole('button', { name: /Edit/ })).toBeNull()
  })

  it('New contract for this party opens the New contract page with the holder set; an unknown id falls back to Parties', () => {
    renderAt('/admin/contracts/parties/PY-CES')
    fireEvent.click(screen.getByRole('button', { name: 'New contract for this party' }))
    expect(location).toBe('/admin/contracts/new?holder=PY-CES')
    cleanup()
    renderAt('/admin/contracts/parties/PY-NOT-THERE')
    expect(location).toBe('/admin/contracts/parties')
  })
})

describe('the Funding tags tab (US-13.4.5)', () => {
  it('picks the first tag by default and lists its Contracts by hospital, each opening that many', () => {
    renderAt(fundingTagsPath())
    expect(card('masters-funding-tags').querySelector('tr[data-tag="TAG-SXAP"]')).toHaveAttribute('aria-selected', 'true')
    const under = card('tag-contracts')
    const rows = [...under.querySelectorAll('tr[data-hospital]')]
    expect(rows.map((r) => r.getAttribute('data-hospital'))).toEqual(['PY-CES', 'PY-SX', 'none'])
    expect(within(rows[0] as HTMLElement).getByText('Christchurch Eye Surgery › SXAP')).toBeInTheDocument()
    fireEvent.click(within(rows[0] as HTMLElement).getByRole('link', { name: /View the 6 SXAP Contracts/ }))
    expect(catalogueRows()).toBe(6)
  })

  it('picking a tag keeps it in the URL and shows "Not under a hospital"', () => {
    renderAt(fundingTagsPath())
    fireEvent.click(within(card('masters-funding-tags')).getByRole('button', { name: 'Show the Contracts under ACC' }))
    expect(location).toBe('/admin/contracts/tags?tag=TAG-ACC')
    const none = card('tag-contracts').querySelector('tr[data-hospital="none"]') as HTMLElement
    expect(none.querySelector('td:nth-child(2)')!.textContent).toBe('2')
    expect(card('masters-funding-tags').querySelector('tr[data-tag="TAG-ACC"] td:nth-child(3)')!.textContent).toBe('4')
  })

  it('a new tag no Contract carries says so', () => {
    renderAt(fundingTagsPath())
    fireEvent.click(screen.getByRole('button', { name: 'Add funding tag' }))
    fireEvent.change(within(card('funding-tag-sheet')).getByLabelText('Code'), { target: { value: 'nzdf' } })
    fireEvent.click(within(card('funding-tag-sheet')).getByRole('button', { name: 'Add funding tag' }))
    fireEvent.click(within(card('masters-funding-tags')).getByRole('button', { name: 'Show the Contracts under NZDF' }))
    expect(card('tag-contracts')).toHaveTextContent('No Contract carries this tag yet.')
  })
})

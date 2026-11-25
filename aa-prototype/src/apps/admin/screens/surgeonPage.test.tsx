/**
 * The surgeon's page (build plan Phase 55; US-13.6.2 "One card at a time", "Side panel", "No HPI CPN
 * yet", "Unique HPI CPN"; US-13.4.1 "One card, one change"; D105): each card saves only its own
 * fields as one audited change, refusals stay on their card, Cancel writes nothing, and the side
 * panel shows a few of the surgeon's pairings, linked Contracts and next Lists with See all.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { PARTY, SURG } from '../../../domain/seed'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { peopleRoutes } from '../../../test/adminRoutes'
import { FIXTURE_SURGEON, withSurgeonSidePanel } from '../../../test/surgeonSidePanelFixture'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
}

function renderAdmin(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: '2026-11-24' }} />}>
            {peopleRoutes()}
          </Route>
        </Routes>
        <LocationProbe />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement
const audit = () => useAppStore.getState().audit
const surgeon = (id: string) => useAppStore.getState().masters.surgeons[id]!

describe("the surgeon's page: one card, one change", () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('shows the five cards and the Status card; no Groups card and no all-fields edit', () => {
    renderAdmin(`/admin/people/surgeons/${SURG.hale}`)
    for (const card of ['surgeon-name-card', 'surgeon-registration-card', 'surgeon-identifiers', 'surgeon-specialties', 'surgeon-contacts', 'surgeon-status-card']) {
      expect(shot(card), card).not.toBeNull()
    }
    expect(shot('surgeon-groups')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Edit details' })).toBeNull()
    expect(within(shot('surgeon-status-card')).getByText('Active')).toBeInTheDocument()
  })

  it("Contacts: changing an office contact's phone saves only the contacts, as one surgeon.update", () => {
    renderAdmin(`/admin/people/surgeons/${SURG.reid}`)
    const before = surgeon(SURG.reid)
    const audited = audit().length
    fireEvent.click(screen.getByRole('button', { name: 'Edit contacts' }))
    fireEvent.change(within(shot('surgeon-contacts')).getByRole('textbox', { name: 'Office contact 1 phone' }), { target: { value: '03 555 9999' } })
    fireEvent.click(within(shot('surgeon-contacts')).getByRole('button', { name: 'Save' }))
    const after = surgeon(SURG.reid)
    expect(after.officeContacts[0]!.phone).toBe('03 555 9999')
    expect({ ...after, officeContacts: before.officeContacts }).toEqual(before)
    expect(audit().length).toBe(audited + 1)
    const entry = audit().at(-1)!
    expect(entry.action).toBe('surgeon.update')
    expect(Object.keys(entry.after as object)).toEqual(['officeContacts'])
    expect(shot('office-first-pill')).not.toBeNull()
  })

  it('Specialties and HPI CPN each audit only their own field', () => {
    renderAdmin(`/admin/people/surgeons/${SURG.whitford}`)
    fireEvent.click(screen.getByRole('button', { name: 'Edit specialties' }))
    fireEvent.change(within(shot('surgeon-specialties')).getByLabelText('Specialties'), { target: { value: 'SPC-PLASTIC' } })
    fireEvent.click(within(shot('surgeon-specialties')).getByRole('button', { name: 'Save' }))
    expect(Object.keys(audit().at(-1)!.after as object)).toEqual(['specialties'])
    fireEvent.click(screen.getByRole('button', { name: 'Edit HPI CPN' }))
    fireEvent.change(within(shot('surgeon-identifiers')).getByLabelText('HPI CPN (optional)'), { target: { value: '' } })
    fireEvent.click(within(shot('surgeon-identifiers')).getByRole('button', { name: 'Save' }))
    expect(audit().at(-1)).toMatchObject({ action: 'surgeon.update', after: { hpiId: 'None' } })
    expect(Object.keys(audit().at(-1)!.after as object)).toEqual(['hpiId'])
    expect(within(shot('surgeon-identifiers')).getByText('No HPI CPN yet')).toBeInTheDocument()
  })

  it("a duplicate HPI CPN is refused on its card in the rule's words, and writes nothing", () => {
    renderAdmin(`/admin/people/surgeons/${SURG.hale}`)
    const audited = audit().length
    fireEvent.click(screen.getByRole('button', { name: 'Edit HPI CPN' }))
    fireEvent.change(within(shot('surgeon-identifiers')).getByLabelText('HPI CPN (optional)'), { target: { value: '47REIA' } })
    fireEvent.click(within(shot('surgeon-identifiers')).getByRole('button', { name: 'Save' }))
    expect(within(shot('surgeon-identifiers')).getByRole('alert')).toHaveTextContent('That HPI CPN already belongs to Ms A. Reid.')
    expect(within(shot('surgeon-identifiers')).getByLabelText('HPI CPN (optional)')).toBeInTheDocument()
    fireEvent.change(within(shot('surgeon-identifiers')).getByLabelText('HPI CPN (optional)'), { target: { value: 'nope' } })
    fireEvent.click(within(shot('surgeon-identifiers')).getByRole('button', { name: 'Save' }))
    expect(within(shot('surgeon-identifiers')).getByRole('alert')).toBeInTheDocument()
    expect(audit().length).toBe(audited)
  })

  it('a blank name is refused on its card; Cancel writes nothing and restores the card', () => {
    renderAdmin(`/admin/people/surgeons/${SURG.hale}`)
    const audited = audit().length
    fireEvent.click(screen.getByRole('button', { name: 'Edit name and practice' }))
    fireEvent.change(within(shot('surgeon-name-card')).getByLabelText('Name'), { target: { value: ' ' } })
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Save' }))
    expect(within(shot('surgeon-name-card')).getByRole('alert')).toHaveTextContent('A surgeon name is required.')
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Cancel' }))
    expect(audit().length).toBe(audited)
    expect(within(shot('surgeon-name-card')).getByText('Mr T. Hale')).toBeInTheDocument()
  })

  it('renaming Mr P. Doyle carries his surgeon Party, both entries in one change set', () => {
    renderAdmin(`/admin/people/surgeons/${SURG.doyle}`)
    fireEvent.click(screen.getByRole('button', { name: 'Edit name and practice' }))
    fireEvent.change(within(shot('surgeon-name-card')).getByLabelText('Name'), { target: { value: 'Mr Peter Doyle' } })
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Save' }))
    expect(useAppStore.getState().masters.parties[PARTY.doyle]!.name).toBe('Mr Peter Doyle')
    const [a, b] = audit().slice(-2)
    expect([a!.action, b!.action]).toEqual(['surgeon.update', 'party.update'])
    expect(a!.changeSetId).toBeDefined()
    expect(b!.changeSetId).toBe(a!.changeSetId)
    expect(Object.keys(a!.after as object)).toEqual(['name'])
  })

  it('Retire and Reinstate from the Status card audit as before', () => {
    renderAdmin(`/admin/people/surgeons/${FIXTURE_SURGEON}`)
    const card = () => shot('surgeon-status-card')
    fireEvent.change(within(card()).getByLabelText('Why it is being retired'), { target: { value: 'Moved to Auckland' } })
    fireEvent.click(within(card()).getByRole('button', { name: 'Retire surgeon' }))
    expect(audit().at(-1)?.action).toBe('surgeon.retire')
    expect(card().getAttribute('data-retired')).toBe('true')
    expect(within(card()).getAllByText('Retired').length).toBeGreaterThan(0)
    fireEvent.click(within(card()).getByRole('button', { name: 'Reinstate surgeon' }))
    expect(audit().at(-1)?.action).toBe('surgeon.reinstate')
    expect(within(card()).getByText('Active')).toBeInTheDocument()
  })

  it('Add surgeon on the Surgeons tab opens the create-only sheet and lands on the new page', () => {
    renderAdmin('/admin/people/surgeons')
    fireEvent.click(screen.getByRole('button', { name: 'Add surgeon' }))
    const sheet = shot('surgeon-edit-sheet')
    expect(within(sheet).getByText('Add a surgeon')).toBeInTheDocument()
    expect(within(sheet).queryByText(/Retire this surgeon/)).toBeNull()
    fireEvent.change(within(sheet).getByRole('textbox', { name: 'Name' }), { target: { value: 'Ms K. Fenwick' } })
    fireEvent.change(within(sheet).getByLabelText('Specialties'), { target: { value: 'SPC-ENT' } })
    fireEvent.click(within(sheet).getByRole('button', { name: 'Add surgeon' }))
    const id = Object.values(useAppStore.getState().masters.surgeons).find((s) => s.name === 'Ms K. Fenwick')!.id
    expect(screen.getByTestId('location').textContent).toBe(`/admin/people/surgeons/${id}`)
    expect(shot('surgeon-profile')).not.toBeNull()
  })
})

describe("the surgeon's page: the side panel", () => {
  it("Mr Hale's Contracts: COS's two and Unisports Ortho, each naming its holder and opening its page", () => {
    useAppStore.setState(freshAppState())
    renderAdmin(`/admin/people/surgeons/${SURG.hale}`)
    const section = shot('surgeon-side-contracts')
    const rows = Array.from(section.querySelectorAll('[data-contract]')) as HTMLElement[]
    expect(rows.map((r) => r.getAttribute('data-contract')).sort()).toEqual(['CT-COS-ACC', 'CT-COS-FIXED', 'CT-UNISPORTS'])
    const uni = rows.find((r) => r.getAttribute('data-contract') === 'CT-UNISPORTS')!
    expect(uni).toHaveTextContent('Unisports Ortho')
    expect(within(uni).getByRole('link').getAttribute('href')).toBe('/admin/contracts/CT-UNISPORTS')
    expect(rows.filter((r) => r.textContent?.includes('Canterbury Orthopaedic Surgeons'))).toHaveLength(2)
  })

  it('the example: a few of each kind, and See all shows every one', () => {
    useAppStore.setState(withSurgeonSidePanel(freshAppState()))
    renderAdmin(`/admin/people/surgeons/${FIXTURE_SURGEON}`)
    const pairings = () => shot('pairing-section')
    expect(pairings().querySelectorAll('[data-pairing]')).toHaveLength(3)
    fireEvent.click(within(pairings()).getByRole('button', { name: 'See all 4' }))
    expect(pairings().querySelectorAll('[data-pairing]')).toHaveLength(4)

    const contracts = shot('surgeon-side-contracts')
    expect(contracts.querySelectorAll('[data-contract]')).toHaveLength(2)
    expect(contracts).toHaveTextContent('Disabled')

    const lists = () => shot('surgeon-side-lists')
    expect(lists().querySelectorAll('[data-list]')).toHaveLength(5)
    expect(lists().querySelector('[data-list="L-FX-PAST"]')).toBeNull()
    expect(lists().querySelector('[data-list="L-FX-GONE"]')).toBeNull()
    const first = lists().querySelector('[data-list]') as HTMLElement
    expect(first.getAttribute('data-list')).toBe('L-FX-6')
    expect(within(first).getByRole('link').getAttribute('href')).toBe(`/admin/day/${useAppStore.getState().schedule.lists['L-FX-6']!.dateISO}`)
    fireEvent.click(within(lists()).getByRole('button', { name: 'See all 6' }))
    expect(lists().querySelectorAll('[data-list]')).toHaveLength(6)
    fireEvent.click(within(lists()).getByRole('button', { name: 'Show fewer' }))
    expect(lists().querySelectorAll('[data-list]')).toHaveLength(5)
  })

  it('a surgeon on nothing shows each section empty', () => {
    useAppStore.setState(freshAppState())
    renderAdmin(`/admin/people/surgeons/${FIXTURE_SURGEON}`)
    expect(shot('surgeon-side-contracts')).toHaveTextContent('No Contract links this surgeon.')
    expect(shot('surgeon-side-lists')).toHaveTextContent('No upcoming List.')
  })
})

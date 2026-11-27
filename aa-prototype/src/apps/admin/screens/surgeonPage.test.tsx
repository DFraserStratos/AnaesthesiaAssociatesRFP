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

  it('lays Identity on the left and Specialties over Contacts on the right; no Status, Groups card or all-fields edit', () => {
    const { container } = renderAdmin(`/admin/people/surgeons/${SURG.hale}`)
    const columns = [...container.querySelectorAll('[data-profile-cards] > div')].map((col) => [...col.querySelectorAll(':scope > section[data-shot]')].map((el) => el.getAttribute('data-shot')))
    expect(columns).toEqual([['surgeon-name-card'], ['surgeon-specialties', 'surgeon-contacts']])
    expect(shot('surgeon-status-card')).toBeNull()
    // Identity holds the registration number and HPI CPN rows, with their hints.
    expect(within(shot('surgeon-name-card')).getByText("Unique index on the Health Provider Index. Not the patient's NHI.")).toBeInTheDocument()
    expect(shot('surgeon-name-card').contains(shot('surgeon-registration-card'))).toBe(true)
    expect(shot('surgeon-name-card').contains(shot('surgeon-identifiers'))).toBe(true)
    expect(shot('surgeon-groups')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Edit details' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'History' })).toBeNull()
    expect(shot('surgeon-status').querySelector('[data-status-word]')?.textContent).toBe('Active')
  })

  it("the header: the avatar, 'Surgeon · NZ medical registration', the strip's facts, the office's phone and email, Retire", () => {
    renderAdmin(`/admin/people/surgeons/${SURG.patel}`)
    const s = surgeon(SURG.patel)
    const hero = document.querySelector('[data-profile-hero]') as HTMLElement
    expect(within(hero).getByRole('heading', { level: 1 })).toHaveTextContent(s.name)
    expect(hero).toHaveTextContent(`Surgeon · NZ medical registration ${s.medicalRegistrationNumber!}`)
    expect(within(hero).getByRole('button', { name: 'Retire' })).toBeInTheDocument()
    const facts = [...shot('profile-facts').querySelectorAll('[data-fact]')].map((el) => el.getAttribute('data-fact'))
    expect(facts).toEqual(['Status', 'HPI CPN', 'Specialties', 'Practice'])
    expect(shot('surgeon-hpi-chip')).toHaveTextContent(s.hpiId!)
    const office = s.officeContacts[0]!
    expect(shot('profile-facts-phone').getAttribute('href')).toBe(`tel:${office.phone!.replace(/\s+/g, '')}`)
    expect(shot('profile-facts-email').getAttribute('href')).toBe(`mailto:${office.email!}`)
    expect(shot('profile-facts-email')).toHaveTextContent('Email the office')
  })

  it('orders the side panel Pairings, Next Lists, Contracts, History', () => {
    renderAdmin(`/admin/people/surgeons/${SURG.patel}`)
    const rail = document.querySelector('[data-page-rail]') as HTMLElement
    expect([...rail.children].map((el) => el.getAttribute('data-shot'))).toEqual(['pairing-section', 'surgeon-side-lists', 'surgeon-side-contracts', 'surgeon-history'])
  })

  it("Specialties reads as chips with what they decide; the strip says Not recorded for a blank HPI CPN and practice", () => {
    renderAdmin(`/admin/people/surgeons/${SURG.patel}`)
    const card = shot('surgeon-specialties')
    expect(card).toHaveTextContent("Decides which Contracts are offered on this surgeon's Lists.")
    expect(card.querySelectorAll('[data-specialty-chips] > *').length).toBe(surgeon(SURG.patel).specialtyIds.length)
    fireEvent.click(screen.getByRole('button', { name: 'Edit identity' }))
    fireEvent.change(within(shot('surgeon-name-card')).getByLabelText('Practice (optional)'), { target: { value: '' } })
    fireEvent.change(within(shot('surgeon-name-card')).getByLabelText('HPI CPN (optional)'), { target: { value: '' } })
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Save' }))
    expect(shot('surgeon-hpi-chip')).toHaveTextContent('Not recorded')
    expect(shot('profile-facts').querySelector('[data-fact="Practice"]')).toHaveTextContent('Not recorded')
  })

  it('shows History in the side panel, opening the record and its pairings in the History sheet', () => {
    renderAdmin(`/admin/people/surgeons/${SURG.hale}`)
    const card = () => shot('surgeon-history')
    // With nothing recorded there is nothing to open, as on a Party's page.
    expect(card()).toHaveTextContent('0 changes recorded')
    expect(within(card()).queryByRole('button', { name: 'See history' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Edit identity' }))
    fireEvent.change(within(shot('surgeon-name-card')).getByLabelText('Practice (optional)'), { target: { value: 'Hale Surgical' } })
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Save' }))
    expect(card()).toHaveTextContent('1 change recorded')
    fireEvent.click(within(card()).getByRole('button', { name: 'See history' }))
    expect(within(screen.getByRole('dialog')).getByText('History · Mr T. Hale')).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole('button', { name: 'Edit identity' }))
    fireEvent.change(within(shot('surgeon-name-card')).getByLabelText('HPI CPN (optional)'), { target: { value: '' } })
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Save' }))
    expect(audit().at(-1)).toMatchObject({ action: 'surgeon.update', after: { hpiId: 'None' } })
    expect(Object.keys(audit().at(-1)!.after as object)).toEqual(['hpiId'])
    expect(within(shot('surgeon-identifiers')).getByText('No HPI CPN yet')).toBeInTheDocument()
  })

  it("a duplicate HPI CPN is refused on its card in the rule's words, and writes nothing", () => {
    renderAdmin(`/admin/people/surgeons/${SURG.hale}`)
    const audited = audit().length
    fireEvent.click(screen.getByRole('button', { name: 'Edit identity' }))
    fireEvent.change(within(shot('surgeon-name-card')).getByLabelText('HPI CPN (optional)'), { target: { value: '47REIA' } })
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Save' }))
    expect(within(shot('surgeon-name-card')).getByRole('alert')).toHaveTextContent('That HPI CPN already belongs to Ms A. Reid.')
    expect(within(shot('surgeon-name-card')).getByLabelText('HPI CPN (optional)')).toBeInTheDocument()
    fireEvent.change(within(shot('surgeon-name-card')).getByLabelText('HPI CPN (optional)'), { target: { value: 'nope' } })
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Save' }))
    expect(within(shot('surgeon-name-card')).getByRole('alert')).toBeInTheDocument()
    expect(audit().length).toBe(audited)
  })

  it('a blank name is refused on its card; Cancel writes nothing and restores the card', () => {
    renderAdmin(`/admin/people/surgeons/${SURG.hale}`)
    const audited = audit().length
    fireEvent.click(screen.getByRole('button', { name: 'Edit identity' }))
    fireEvent.change(within(shot('surgeon-name-card')).getByLabelText('Name'), { target: { value: ' ' } })
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Save' }))
    expect(within(shot('surgeon-name-card')).getByRole('alert')).toHaveTextContent('A surgeon name is required.')
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Cancel' }))
    expect(audit().length).toBe(audited)
    expect(within(shot('surgeon-name-card')).getByText('Mr T. Hale')).toBeInTheDocument()
  })

  it('renaming Mr P. Doyle carries his surgeon Party, both entries in one change set', () => {
    renderAdmin(`/admin/people/surgeons/${SURG.doyle}`)
    fireEvent.click(screen.getByRole('button', { name: 'Edit identity' }))
    fireEvent.change(within(shot('surgeon-name-card')).getByLabelText('Name'), { target: { value: 'Mr Peter Doyle' } })
    fireEvent.click(within(shot('surgeon-name-card')).getByRole('button', { name: 'Save' }))
    expect(useAppStore.getState().masters.parties[PARTY.doyle]!.name).toBe('Mr Peter Doyle')
    const [a, b] = audit().slice(-2)
    expect([a!.action, b!.action]).toEqual(['surgeon.update', 'party.update'])
    expect(a!.changeSetId).toBeDefined()
    expect(b!.changeSetId).toBe(a!.changeSetId)
    expect(Object.keys(a!.after as object)).toEqual(['name'])
  })

  it('Retire and Reinstate from the header open the surgeon retire in a sheet and audit as before', () => {
    renderAdmin(`/admin/people/surgeons/${FIXTURE_SURGEON}`)
    const status = () => shot('surgeon-status')
    const sheet = () => shot('surgeon-retire-sheet')
    fireEvent.click(shot('surgeon-retire'))
    fireEvent.change(within(sheet()).getByLabelText('Why it is being retired'), { target: { value: 'Moved to Auckland' } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Retire surgeon' }))
    expect(audit().at(-1)?.action).toBe('surgeon.retire')
    expect(sheet()).toBeNull()
    expect(status().getAttribute('data-retired')).toBe('true')
    expect(status().querySelector('[data-status-word]')?.textContent).toMatch(/^Retired since \d{1,2} [A-Z][a-z]{2} \d{4}$/)
    fireEvent.click(shot('surgeon-reinstate'))
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Reinstate surgeon' }))
    expect(audit().at(-1)?.action).toBe('surgeon.reinstate')
    expect(status().querySelector('[data-status-word]')?.textContent).toBe('Active')
  })

  it('Add surgeon on the Surgeons tab opens the create-only sheet and lands on the new page', () => {
    renderAdmin('/admin/people/surgeons')
    fireEvent.click(screen.getByRole('button', { name: 'Add surgeon' }))
    const sheet = shot('surgeon-edit-sheet').closest('[role="dialog"]') as HTMLElement
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

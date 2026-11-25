/**
 * Master data views, the surgeon profile and the Admin anaesthetist record
 * (catch-up Phase 17, work items 10 to 13): the `?view=` param, the Tier
 * column, the rows that open a page, the pairing section on both profiles,
 * the add sheet's same-side rule, ending, the rate and tier card (build plan
 * Phase 50) and the list's tier filter, the masters
 * sheets and the cross-links.
 */

import { assigned } from '../../../../test/lists'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE, HOSP, SURG } from '../../../../domain/seed'
import { activePairings } from '../../../../domain/pairingPreferences'
import { freshAppState, useAppStore, type Actor } from '../../../../store'
import { selectPriorityTier } from '../../../../store/officePrivate'
import { SurfaceProvider } from '../../../../shared'
import { mastersAndLegacyRoutes, peopleRoutes } from '../../../../test/adminRoutes'
import { SlotDrawer } from '../../components/SlotDrawer'
import { parseMastersView } from './view'
import { projectedListId } from '../../../../domain/slots'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderAdmin(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: '2026-11-24' }} />}>
            {peopleRoutes()}
            {mastersAndLegacyRoutes()}
          </Route>
        </Routes>
        <LocationProbe />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const location = () => screen.getByTestId('location').textContent

describe('Master data views', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('reads the view from ?view=, falling back to Hospitals (the People views redirect first)', () => {
    expect(parseMastersView('publicHolidays')).toBe('publicHolidays')
    expect(parseMastersView('surgeons')).toBe('hospitals')
    expect(parseMastersView('nope')).toBe('hospitals')
    expect(parseMastersView(null)).toBe('hospitals')
  })

  it('the Surgeons tab lists the surgeons, and no Surgeon groups list or tab remains', () => {
    renderAdmin('/admin/people/surgeons?q=Reid')
    expect(screen.getByRole('link', { name: /^Surgeons/ })).toHaveAttribute('aria-current', 'page')
    const reid = document.querySelector(`tr[data-surgeon="${SURG.reid}"]`) as HTMLElement
    expect(within(reid).getByText('47REIA')).toBeInTheDocument()
    expect(within(reid).getByText('1 Not preferred')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Surgeon groups' })).toBeNull()
    expect(screen.queryByRole('link', { name: /Surgeon groups/ })).toBeNull()
    expect(screen.queryByRole('button', { name: "Surgeons' rooms" })).toBeNull()
  })

  it('an unknown Master data view opens Hospitals; the Anaesthetists tab has the Tier column, and no entry reads Tier 4', () => {
    renderAdmin('/admin/masters?view=bogus')
    expect(screen.getByRole('heading', { name: 'Hospitals & holidays' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Places' })).toBeInTheDocument()
    renderAdmin('/admin/people/anaesthetists')
    const ropata = document.querySelector(`tr[data-anaesthetist="${ANAE.ropata}"]`) as HTMLElement
    expect(within(ropata).getByText('Tier 4')).toBeInTheDocument()
    const souter = document.querySelector(`tr[data-anaesthetist="${ANAE.souter}"]`) as HTMLElement
    expect(within(souter).getByText('Tier 1')).toBeInTheDocument()
  })

  it('a row opens the record, and has no Edit of its own (build plan Phase 54)', () => {
    renderAdmin('/admin/people/anaesthetists')
    const souter = document.querySelector(`tr[data-anaesthetist="${ANAE.souter}"]`) as HTMLElement
    expect(within(souter).queryByRole('button', { name: 'Edit' })).toBeNull()
    fireEvent.click(within(souter).getByRole('link', { name: 'Dr Melanie Souter' }))
    expect(location()).toBe(`/admin/people/anaesthetists/${ANAE.souter}`)

    const sharma = renderAdmin('/admin/people/anaesthetists')
    const row = sharma.container.querySelector(`tr[data-anaesthetist="${ANAE.sharma}"] td`) as HTMLElement
    fireEvent.click(row)
    expect(within(sharma.container).getByTestId('location').textContent).toBe(`/admin/people/anaesthetists/${ANAE.sharma}`)
  })

  it('a surgeon row opens the profile', () => {
    renderAdmin('/admin/people/surgeons?q=Whitford')
    fireEvent.click(document.querySelector(`tr[data-surgeon="${SURG.whitford}"] td:nth-child(2)`) as HTMLElement)
    expect(location()).toBe(`/admin/people/surgeons/${SURG.whitford}`)
  })

  it('an unknown surgeon id falls back to the Surgeons tab', () => {
    renderAdmin('/admin/people/surgeons/S-NOPE')
    expect(location()).toBe('/admin/people/surgeons')
  })

  it('adds a surgeon with a lower-case HPI CPN (stored upper-case) and refuses one Dr Sharma holds', () => {
    renderAdmin('/admin/people/surgeons')
    fireEvent.click(screen.getByRole('button', { name: 'Add surgeon' }))
    const sheet = () => document.querySelector('[data-shot="surgeon-edit-sheet"]') as HTMLElement
    fireEvent.change(within(sheet()).getAllByLabelText('Name')[0]!, { target: { value: 'Ms R. Tester' } })
    fireEvent.change(within(sheet()).getByLabelText('Practice (optional)'), { target: { value: 'Merivale Eye Rooms' } })
    fireEvent.change(screen.getByLabelText('HPI CPN (optional)'), { target: { value: '12shap' } })
    // Catch-up Phase 18a: a surgeon needs at least one specialty (US-13.6.6).
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Add surgeon' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose at least one specialty.')
    fireEvent.change(within(sheet()).getByLabelText('Specialties'), { target: { value: 'SPC-OPHTH' } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Add surgeon' }))
    expect(screen.getByRole('alert')).toHaveTextContent('That HPI CPN already belongs to Dr Priya Sharma.')
    fireEvent.change(screen.getByLabelText('HPI CPN (optional)'), { target: { value: ' 50test ' } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Add surgeon' }))
    const added = Object.values(useAppStore.getState().masters.surgeons).find((s) => s.name === 'Ms R. Tester')
    // The personal contact's Name followed the surgeon's Name; the empty office set was dropped.
    expect(added).toMatchObject({ hpiId: '50TEST', practiceName: 'Merivale Eye Rooms', specialtyIds: ['SPC-OPHTH'], personalContact: { name: 'Ms R. Tester' }, officeContacts: [] })
  })

  it('edits a hospital contact email, and shows "No contact email" when there is none', () => {
    renderAdmin('/admin/masters?view=hospitals')
    const card = document.querySelector(`[data-hospital="${HOSP.stg}"]`) as HTMLElement
    expect(within(card).getByText('bookings@stgeorges.example')).toBeInTheDocument()
    fireEvent.click(within(card).getByRole('button', { name: "Edit St George's" }))
    fireEvent.change(screen.getByLabelText('Contact email'), { target: { value: 'not an email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByRole('alert')).toHaveTextContent('does not look right')
    fireEvent.change(screen.getByLabelText('Contact email'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(useAppStore.getState().masters.hospitals[HOSP.stg]?.contactEmail).toBeUndefined()
    expect(within(card).getByText('No contact email')).toBeInTheDocument()
  })
})

describe('the surgeon profile and the anaesthetist record', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it("Ms Reid's profile: HPI CPN, practice and contacts, no Groups card, the not-preferred entry and the ended one", () => {
    renderAdmin(`/admin/people/surgeons/${SURG.reid}`)
    expect(screen.getByText("Unique index on the Health Provider Index. Not the patient's NHI.")).toBeInTheDocument()
    expect(screen.getByText('For information')).toBeInTheDocument()
    const contacts = document.querySelector('[data-shot="surgeon-contacts"]') as HTMLElement
    expect(within(contacts).getByText('bookings@merivaleeye.example')).toBeInTheDocument()
    expect(within(contacts).getByText('a.reid@surgeons.example')).toBeInTheDocument()
    expect(document.querySelector('[data-shot="surgeon-groups"]')).toBeNull()
    const section = document.querySelector('[data-shot="pairing-section"]') as HTMLElement
    expect(within(section).getByText('Private to the office. Anaesthetists never see these.')).toBeInTheDocument()
    const notPreferred = section.querySelector('[data-pairing-group="NOT_PREFERRED"]') as HTMLElement
    expect(within(notPreferred).getByText('Ms A. Reid prefers not to work with Dr Priya Sharma')).toBeInTheDocument()
    // The side panel's pairings (Phase 54's panel layout, on the surgeon page since Phase 55): no empty Preferred group.
    expect(section.getAttribute('data-pairing-layout')).toBe('panel')
    expect(section.querySelector('[data-pairing-group="PREFERRED"]')).toBeNull()
    const ended = section.querySelector('[data-shot="pairing-ended"]') as HTMLElement
    expect(within(ended).getByText('Dr Rawiri Hughes prefers not to work with Ms A. Reid')).toBeInTheDocument()
    expect(within(ended).getByText(/Resolved with the surgeon's rooms/)).toBeInTheDocument()
  })

  it('the add sheet disables Dr Sharma for "Ms A. Reid asked" only; adding the other side shows on both profiles', () => {
    const view = renderAdmin(`/admin/people/surgeons/${SURG.reid}`)
    fireEvent.click(screen.getByRole('button', { name: 'Add pairing' }))
    const select = document.querySelector('select[data-shot="pairing-counterpart"]') as HTMLSelectElement
    const sharmaOption = () => select.querySelector(`option[value="${ANAE.sharma}"]`) as HTMLOptionElement
    expect(sharmaOption().disabled).toBe(true)
    expect(sharmaOption().textContent).toBe('Dr Priya Sharma · already not preferred on this side')
    expect(screen.getByRole('radio', { name: 'Ms A. Reid asked' })).toBeChecked()

    fireEvent.click(screen.getByRole('radio', { name: 'The anaesthetist asked' }))
    expect(sharmaOption().disabled).toBe(false)
    fireEvent.change(select, { target: { value: ANAE.sharma } })
    expect(screen.getByText('Dr Priya Sharma prefers not to work with Ms A. Reid')).toBeInTheDocument()
    const sheet = document.querySelector('[data-shot="pairing-add-sheet"]') as HTMLElement
    fireEvent.click(within(sheet).getByRole('button', { name: 'Add pairing' }))

    const active = activePairings(useAppStore.getState().officePrivate.pairingPreferences)
      .filter((e) => e.anaesthetistId === ANAE.sharma && e.surgeonId === SURG.reid)
    expect(active.map((e) => e.raisedBy)).toEqual(['SURGEON', 'ANAESTHETIST'])
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('pairing.add')
    view.unmount()

    renderAdmin(`/admin/people/anaesthetists/${ANAE.sharma}`)
    const notPreferred = document.querySelector('[data-pairing-group="NOT_PREFERRED"]') as HTMLElement
    expect(within(notPreferred).getByText('Dr Priya Sharma prefers not to work with Ms A. Reid')).toBeInTheDocument()
    expect(within(notPreferred).getByText('Ms A. Reid prefers not to work with Dr Priya Sharma')).toBeInTheDocument()
  })

  it('ending an entry keeps it, under Ended entries, with its reason; the sheet is audited', () => {
    renderAdmin(`/admin/people/anaesthetists/${ANAE.sharma}`)
    const preferred = document.querySelector('[data-pairing-group="PREFERRED"]') as HTMLElement
    fireEvent.click(within(preferred).getByRole('button', { name: /^End / }))
    fireEvent.change(screen.getByLabelText('Why it ended (optional)'), { target: { value: 'Rooms moved' } })
    fireEvent.click(screen.getByRole('button', { name: 'End pairing' }))
    // The side panel shows only the groups that hold an active entry (build plan Phase 54).
    expect(document.querySelector('[data-pairing-group="PREFERRED"]')).toBeNull()
    const ended = document.querySelector('[data-shot="pairing-ended"]') as HTMLElement
    expect(within(ended).getByText('Mr J. Whitford prefers to work with Dr Priya Sharma')).toBeInTheDocument()
    expect(within(ended).getByText(/Rooms moved/)).toBeInTheDocument()
    const last = useAppStore.getState().audit.at(-1)
    expect(last?.action).toBe('pairing.end')
    expect(Object.keys(useAppStore.getState().officePrivate.pairingPreferences)).toContain('PP-003')
  })

  it('the record History merges the record and its pairings, each pairing row labelled by its sentence', () => {
    renderAdmin(`/admin/people/anaesthetists/${ANAE.sharma}`)
    const card = document.querySelector('[data-shot="rate-tier-card"]') as HTMLElement
    fireEvent.click(within(card).getByRole('button', { name: 'Edit rate and tier' }))
    fireEvent.click(within(card).getByRole('button', { name: 'Tier 1' }))
    fireEvent.click(within(card).getByRole('button', { name: 'Save' }))
    const preferred = document.querySelector('[data-pairing-group="PREFERRED"]') as HTMLElement
    fireEvent.click(within(preferred).getByRole('button', { name: /^End / }))
    fireEvent.click(screen.getByRole('button', { name: 'End pairing' }))
    fireEvent.click(screen.getByRole('button', { name: 'See history' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Priority tier changed')).toBeInTheDocument()
    expect(within(dialog).getByText('Pairing preference ended')).toBeInTheDocument()
    expect(within(dialog).getAllByText(/Mr J\. Whitford prefers to work with Dr Priya Sharma/).length).toBeGreaterThan(0)
  })

  it('the rate and tier card sets the tier on Save, says it is office only, and no other card lists the rate', () => {
    renderAdmin(`/admin/people/anaesthetists/${ANAE.sharma}`)
    expect(document.querySelector('[data-shot="tier-card"]')).toBeNull()
    const card = document.querySelector('[data-shot="rate-tier-card"]') as HTMLElement
    expect(within(card).getByText('· office only')).toBeInTheDocument()
    for (const other of ['anaesthetist-identity', 'anaesthetist-contact', 'anaesthetist-bank']) {
      expect(within(document.querySelector(`[data-shot="${other}"]`) as HTMLElement).queryByText(/Rate per unit/)).toBeNull()
    }
    fireEvent.click(within(card).getByRole('button', { name: 'Edit rate and tier' }))
    expect(within(card).getByText('Orders suggestions when the office assigns or moves a List. Never shown to anaesthetists.')).toBeInTheDocument()
    // OQ-102 answered (D36): no provisional line (catch-up Phase 25a).
    expect(within(card).queryByText('Tier names are provisional.')).toBeNull()
    fireEvent.click(within(card).getByRole('button', { name: 'Tier 1' }))
    expect(selectPriorityTier(useAppStore.getState(), ANAE.sharma)).not.toBe(1)
    fireEvent.click(within(card).getByRole('button', { name: 'Save' }))
    expect(selectPriorityTier(useAppStore.getState(), ANAE.sharma)).toBe(1)
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('anaesthetist.tierSet')
  })

  it('the list filters by tier: a tier narrows the rows, All restores them, an empty tier says so', () => {
    renderAdmin('/admin/people/anaesthetists')
    const all = document.querySelectorAll('tr[data-anaesthetist]').length
    const filter = screen.getByRole('group', { name: 'Filter by tier' })
    fireEvent.click(within(filter).getByRole('button', { name: 'Tier 1' }))
    const tier1 = [...document.querySelectorAll<HTMLElement>('tr[data-anaesthetist]')]
    expect(tier1.length).toBeGreaterThan(0)
    expect(tier1.length).toBeLessThan(all)
    for (const row of tier1) expect(within(row).getByText('Tier 1')).toBeInTheDocument()
    expect(document.querySelector(`tr[data-anaesthetist="${ANAE.souter}"]`)).not.toBeNull()
    expect(document.querySelector(`tr[data-anaesthetist="${ANAE.ropata}"]`)).toBeNull()
    fireEvent.click(within(filter).getByRole('button', { name: 'All tiers' }))
    expect(document.querySelectorAll('tr[data-anaesthetist]').length).toBe(all)
    // Nobody in a tier: the empty line.
    useAppStore.setState((s) => ({ officePrivate: { ...s.officePrivate, priorityTiers: {} } }))
    fireEvent.click(within(filter).getByRole('button', { name: 'Tier 2' }))
    expect(screen.getByText('No anaesthetists match.')).toBeInTheDocument()
  })

  it('the Contact card has no rate field, and saving it leaves the rate as it was (build plan Phase 54)', () => {
    renderAdmin(`/admin/people/anaesthetists/${ANAE.ropata}`)
    const before = useAppStore.getState().masters.anaesthetists[ANAE.ropata]!.unitValue
    const card = document.querySelector('[data-shot="anaesthetist-contact"]') as HTMLElement
    fireEvent.click(within(card).getByRole('button', { name: 'Edit contact' }))
    expect(within(card).queryByLabelText(/Rate per unit/)).toBeNull()
    fireEvent.change(within(card).getByLabelText('Phone'), { target: { value: '021 555 0101' } })
    fireEvent.click(within(card).getByRole('button', { name: 'Save' }))
    const after = useAppStore.getState().masters.anaesthetists[ANAE.ropata]!
    expect(after.phone).toBe('021 555 0101')
    expect(after.unitValue).toBe(before)
    expect(useAppStore.getState().audit.at(-1)?.after).not.toHaveProperty('unitValue')
  })

  it('the Identity card edits the HPI CPN (normalised), and a save with no change sends no HPI CPN', () => {
    renderAdmin(`/admin/people/anaesthetists/${ANAE.ropata}`)
    const card = () => document.querySelector('[data-shot="anaesthetist-identity"]') as HTMLElement
    const auditBefore = useAppStore.getState().audit.length
    fireEvent.click(within(card()).getByRole('button', { name: 'Edit identity' }))
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }))
    expect(useAppStore.getState().audit.length).toBe(auditBefore)

    fireEvent.click(within(card()).getByRole('button', { name: 'Edit identity' }))
    fireEvent.change(within(card()).getByLabelText('HPI CPN (required)'), { target: { value: '47reia' } })
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }))
    expect(within(card()).getByRole('alert')).toHaveTextContent('Ms A. Reid')
    fireEvent.change(within(card()).getByLabelText('HPI CPN (required)'), { target: { value: '60ropx' } })
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }))
    expect(useAppStore.getState().masters.anaesthetists[ANAE.ropata]?.hpiId).toBe('60ROPX')
  })
})

describe('cross-links', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it("the List drawer's surgeon opens the profile and closes the drawer", () => {
    const listId = projectedListId(ANAE.chen, '2026-11-24', 'PM')
    const onClose = vi.fn()
    render(
      <MemoryRouter initialEntries={['/admin/day/2026-11-24']}>
        <SurfaceProvider variant="web">
          <SlotDrawer slotId={assigned(useAppStore.getState().schedule.lists[listId]).slotId} actor={OFFICE} onClose={onClose} onOpenBooking={vi.fn()} />
          <LocationProbe />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'Ms A. Reid' }))
    expect(onClose).toHaveBeenCalled()
    expect(location()).toBe(`/admin/people/surgeons/${SURG.reid}`)
  })
})

describe('catch-up Phase 17b: no surgeons\' rooms, contacts on the surgeon, the HPI CPN optional', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  // The surgeon page edits contacts on its Contacts card (build plan Phase 55: one card, one change).
  const sheet = () => document.querySelector('[data-shot="surgeon-contacts"]') as HTMLElement
  const sets = () => Array.from(sheet().querySelectorAll('[data-office-contact]')) as HTMLElement[]
  const editContacts = () => fireEvent.click(screen.getByRole('button', { name: 'Edit contacts' }))
  const nameIn = (set: HTMLElement) => within(set).getByLabelText(/ name$/)

  it('the Surgeons table shows Practice, Office contact and HPI CPN, and "No HPI CPN yet" for a blank one', () => {
    // The list pages at 50 (build plan Phase 53): find each surgeon by name, as the office would.
    const first = renderAdmin('/admin/people/surgeons?q=Wainwright')
    const table = first.container.querySelector('[data-shot="masters-surgeons"]') as HTMLElement
    for (const head of ['Practice', 'Office contact', 'HPI CPN']) expect(within(table).getByRole('columnheader', { name: head })).toBeInTheDocument()
    const wainwright = first.container.querySelector('tr[data-surgeon="S-WAINWRIGHT"]') as HTMLElement
    expect(wainwright.getAttribute('data-practice')).toBe('Upper GI Partners and Hillsborough Colorectal Specialists')
    expect(within(wainwright).getByText('info@uppergi.example')).toBeInTheDocument()
    expect(within(first.container).getByText("AA's address book of surgeons. Open a surgeon for their contacts, pairing preferences, Contracts and next Lists.")).toBeInTheDocument()
    first.unmount()
    for (const [id, q] of [['S-WHAANGA', 'Whaanga'], ['S-OSEI', 'Osei'], ['S-SELWYN', 'Selwyn']] as const) {
      const view = renderAdmin(`/admin/people/surgeons?q=${q}`)
      const row = view.container.querySelector(`tr[data-surgeon="${id}"]`) as HTMLElement
      expect(row.getAttribute('data-hpi'), id).toBe('')
      expect(within(row).getByText('No HPI CPN yet')).toBeInTheDocument()
      view.unmount()
    }
  })

  it('a surgeon with no office contact gets one empty set with no minus; plus adds sets and focuses each new Name; minus removes a set whole', () => {
    // Dr Whaanga holds the practice inbox only; Mr Achterberg two. Start from a surgeon with none.
    const state = useAppStore.getState()
    const whaanga = state.masters.surgeons['S-WHAANGA']!
    useAppStore.setState({ masters: { ...state.masters, surgeons: { ...state.masters.surgeons, 'S-WHAANGA': { ...whaanga, officeContacts: [] } } } })
    renderAdmin('/admin/people/surgeons/S-WHAANGA')
    editContacts()
    expect(sets()).toHaveLength(1)
    expect(within(sheet()).queryByRole('button', { name: /Remove office contact/ })).toBeNull()
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Add office contact' }))
    expect(sets()).toHaveLength(2)
    expect(nameIn(sets()[1]!)).toHaveFocus()
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Add office contact' }))
    expect(sets()).toHaveLength(3)
    expect(nameIn(sets()[2]!)).toHaveFocus()
    fireEvent.change(nameIn(sets()[2]!), { target: { value: 'Third' } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Remove office contact 3' }))
    expect(sets()).toHaveLength(2)
    expect(nameIn(sets()[1]!)).toHaveFocus()
    expect(sheet().textContent).not.toContain('Third')
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Remove office contact 2' }))
    expect(sets()).toHaveLength(1)
    expect(within(sheet()).queryByRole('button', { name: /Remove office contact/ })).toBeNull()
  })

  it('minus on a middle set removes it whole and moves the set below up with its values; each input has its own name', () => {
    renderAdmin('/admin/people/surgeons/S-FORSYTHE')
    editContacts()
    expect(sets()).toHaveLength(3)
    expect(within(sheet()).getByRole('textbox', { name: 'Office contact 3 phone' })).toHaveValue('03 555 1037')
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Remove office contact 2' }))
    expect(sets()).toHaveLength(2)
    expect(within(sheet()).getByRole('textbox', { name: 'Office contact 1 name' })).toHaveValue('Maree')
    expect(within(sheet()).getByRole('textbox', { name: 'Office contact 2 name' })).toHaveValue('Burnside ENT Surgeons')
    expect(within(sheet()).getByRole('textbox', { name: 'Office contact 2 phone' })).toHaveValue('03 555 1037')
    expect(nameIn(sets()[0]!)).toHaveFocus()
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Save' }))
    expect(useAppStore.getState().masters.surgeons['S-FORSYTHE']!.officeContacts.map((c) => c.name)).toEqual(['Maree', 'Burnside ENT Surgeons'])
  })

  it('an empty extra set is dropped on save; a bad email in office contact 2 is refused under it and nothing is saved', () => {
    renderAdmin('/admin/people/surgeons/S-DALGETY')
    const before = useAppStore.getState().masters.surgeons['S-DALGETY']!.officeContacts
    editContacts()
    fireEvent.change(within(sets()[1]!).getByLabelText('Email'), { target: { value: 'not an email' } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Save' }))
    expect(within(sets()[1]!).getByRole('alert')).toHaveTextContent('Office contact 2: that email does not look right.')
    expect(useAppStore.getState().masters.surgeons['S-DALGETY']!.officeContacts).toEqual(before)
    fireEvent.change(within(sets()[1]!).getByLabelText('Email'), { target: { value: 'info@avonheadent.example' } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Add office contact' }))
    const audited = useAppStore.getState().audit.length
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Save' }))
    expect(useAppStore.getState().masters.surgeons['S-DALGETY']!.officeContacts).toEqual(before)
    // Nothing changed once the empty set is dropped: Save closes the card and writes nothing.
    expect(useAppStore.getState().audit.length).toBe(audited)
    expect(document.querySelector('[data-shot="surgeon-contacts-save"]')).toBeNull()
  })

  it('clearing an HPI CPN saves; the chip, the HPI CPN card and History read it; a held one and an anaesthetist\'s are refused on the card', () => {
    renderAdmin(`/admin/people/surgeons/${SURG.reid}`)
    const card = () => document.querySelector('[data-shot="surgeon-name-card"]') as HTMLElement
    fireEvent.click(within(card()).getByRole('button', { name: 'Edit identity' }))
    fireEvent.change(within(card()).getByLabelText('HPI CPN (optional)'), { target: { value: '42whij' } })
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }))
    expect(within(card()).getByRole('alert')).toHaveTextContent('That HPI CPN already belongs to Mr J. Whitford.')
    fireEvent.change(within(card()).getByLabelText('HPI CPN (optional)'), { target: { value: '12shap' } })
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }))
    expect(within(card()).getByRole('alert')).toHaveTextContent('Dr Priya Sharma')
    fireEvent.change(within(card()).getByLabelText('HPI CPN (optional)'), { target: { value: '' } })
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }))
    expect(useAppStore.getState().masters.surgeons[SURG.reid]).not.toHaveProperty('hpiId')
    expect(useAppStore.getState().audit.at(-1)).toMatchObject({ action: 'surgeon.update', before: { hpiId: '47REIA' }, after: { hpiId: 'None' } })
    expect(within(document.querySelector('[data-shot="surgeon-hpi-chip"]') as HTMLElement).getByText('No HPI CPN yet')).toBeInTheDocument()
    expect(within(card()).getByText('No HPI CPN yet')).toBeInTheDocument()
  })

  it("Mr Wainwright's profile: the practice name, the personal contact, an office contact per practice, the first marked; no room card, nothing provisional", () => {
    renderAdmin('/admin/people/surgeons/S-WAINWRIGHT')
    expect(within(document.querySelector('[data-shot="surgeon-name-card"]') as HTMLElement).getByText('Upper GI Partners and Hillsborough Colorectal Specialists')).toBeInTheDocument()
    const card = document.querySelector('[data-shot="surgeon-contacts"]') as HTMLElement
    const office = Array.from(card.querySelectorAll('[data-office-contact]')) as HTMLElement[]
    expect(office.map((o) => o.getAttribute('data-office-contact'))).toEqual(['1', '2'])
    expect(within(office[0]!).getByText('info@uppergi.example')).toBeInTheDocument()
    expect(within(office[0]!).getByText('Office emails go here first')).toBeInTheDocument()
    expect(within(office[1]!).getByText('info@hillsboroughcolorectal.example')).toBeInTheDocument()
    expect(within(office[1]!).queryByText('Office emails go here first')).toBeNull()
    expect(document.querySelector('[data-shot="surgeon-room-card"]')).toBeNull()
    expect(document.body.textContent).not.toMatch(/provisional|to be confirmed/i)
  })
})

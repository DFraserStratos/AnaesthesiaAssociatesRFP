/**
 * Master data views, the surgeon profile and the Admin anaesthetist record
 * (catch-up Phase 17, work items 10 to 13): the `?view=` param, the Tier
 * column, the rows that open a page, the pairing section on both profiles,
 * the add sheet's same-side rule, ending, the tier control, the masters
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
import { AdminAnaesthetistRecordRoute, AdminMastersRoute, AdminSurgeonProfileRoute } from '../../routes'
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
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: '2026-07-21' }} />}>
            <Route path="masters">
              <Route index element={<AdminMastersRoute />} />
              <Route path="surgeons/:surgeonId" element={<AdminSurgeonProfileRoute />} />
              <Route path="anaesthetists/:anaesthetistId" element={<AdminAnaesthetistRecordRoute />} />
            </Route>
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

  it('reads the view from ?view=, falling back to Anaesthetists', () => {
    expect(parseMastersView('surgeons')).toBe('surgeons')
    expect(parseMastersView('surgeonRooms')).toBe('surgeonRooms')
    expect(parseMastersView('nope')).toBe('anaesthetists')
    expect(parseMastersView(null)).toBe('anaesthetists')
  })

  it('opens the view the URL names and writes the tab clicked back to it', () => {
    renderAdmin('/admin/masters?view=surgeons')
    expect(screen.getByRole('heading', { name: 'Surgeons' })).toBeInTheDocument()
    const reid = document.querySelector(`tr[data-surgeon="${SURG.reid}"]`) as HTMLElement
    expect(within(reid).getByText('47REIA')).toBeInTheDocument()
    expect(within(reid).getByText('1 Not preferred')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: "Surgeons' rooms" }))
    expect(location()).toBe('/admin/masters?view=surgeonRooms')
    expect(screen.getByRole('heading', { name: "Surgeons' rooms" })).toBeInTheDocument()
  })

  it('an unknown view shows Anaesthetists with the Tier column; no entry reads Tier 4', () => {
    renderAdmin('/admin/masters?view=bogus')
    expect(screen.getByRole('heading', { name: 'Anaesthetists' })).toBeInTheDocument()
    const ropata = document.querySelector(`tr[data-anaesthetist="${ANAE.ropata}"]`) as HTMLElement
    expect(within(ropata).getByText('Tier 4')).toBeInTheDocument()
    const souter = document.querySelector(`tr[data-anaesthetist="${ANAE.souter}"]`) as HTMLElement
    expect(within(souter).getByText('Tier 1')).toBeInTheDocument()
  })

  it('a row opens the record; its Edit link opens the sheet instead', () => {
    renderAdmin('/admin/masters')
    const souter = document.querySelector(`tr[data-anaesthetist="${ANAE.souter}"]`) as HTMLElement
    fireEvent.click(within(souter).getByRole('button', { name: 'Edit' }))
    expect(location()).toBe('/admin/masters')
    expect(screen.getByRole('link', { name: 'Open record' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Open record' }))
    expect(location()).toBe(`/admin/masters/anaesthetists/${ANAE.souter}`)

    const sharma = renderAdmin('/admin/masters')
    const row = sharma.container.querySelector(`tr[data-anaesthetist="${ANAE.sharma}"] td`) as HTMLElement
    fireEvent.click(row)
    expect(within(sharma.container).getByTestId('location').textContent).toBe(`/admin/masters/anaesthetists/${ANAE.sharma}`)
  })

  it('a surgeon row opens the profile, and an unknown id falls back to Master data', () => {
    renderAdmin('/admin/masters?view=surgeons')
    fireEvent.click(document.querySelector(`tr[data-surgeon="${SURG.whitford}"] td:nth-child(2)`) as HTMLElement)
    expect(location()).toBe(`/admin/masters/surgeons/${SURG.whitford}`)
  })

  it('an unknown surgeon id redirects to /admin/masters', () => {
    renderAdmin('/admin/masters/surgeons/S-NOPE')
    expect(location()).toBe('/admin/masters')
  })

  it('adds a surgeon with a lower-case HPI CPN (stored upper-case) and refuses one Dr Sharma holds', () => {
    renderAdmin('/admin/masters?view=surgeons')
    fireEvent.click(screen.getByRole('button', { name: 'Add surgeon' }))
    const sheet = () => document.querySelector('[data-shot="surgeon-edit-sheet"]') as HTMLElement
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ms R. Tester' } })
    fireEvent.change(within(sheet()).getByRole('combobox'), { target: { value: 'RM-MERI' } })
    fireEvent.change(screen.getByLabelText('HPI CPN (required)'), { target: { value: '12shap' } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Add surgeon' }))
    expect(screen.getByRole('alert')).toHaveTextContent('That HPI CPN already belongs to Dr Priya Sharma.')
    fireEvent.change(screen.getByLabelText('HPI CPN (required)'), { target: { value: ' 50test ' } })
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Add surgeon' }))
    const added = Object.values(useAppStore.getState().masters.surgeons).find((s) => s.name === 'Ms R. Tester')
    expect(added).toMatchObject({ hpiId: '50TEST', roomId: 'RM-MERI' })
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

  it("Ms Reid's profile: HPI CPN, room colleague, group, the not-preferred entry and the ended one", () => {
    renderAdmin(`/admin/masters/surgeons/${SURG.reid}`)
    expect(screen.getByText("Unique index on the Health Provider Index. Not the patient's NHI.")).toBeInTheDocument()
    expect(screen.getByText('For information')).toBeInTheDocument()
    const room = document.querySelector('[data-shot="surgeon-room-card"]') as HTMLElement
    expect(within(room).getByText('Mr J. Whitford')).toBeInTheDocument()
    expect(screen.getByText('Christchurch Eye Surgeons')).toBeInTheDocument()
    const section = document.querySelector('[data-shot="pairing-section"]') as HTMLElement
    expect(within(section).getByText('Private to the office. Anaesthetists never see these.')).toBeInTheDocument()
    const notPreferred = section.querySelector('[data-pairing-group="NOT_PREFERRED"]') as HTMLElement
    expect(within(notPreferred).getByText('Ms A. Reid prefers not to work with Dr Priya Sharma')).toBeInTheDocument()
    expect(within(notPreferred).getByText("Surgeon's preference")).toBeInTheDocument()
    expect(within(notPreferred).getByText('Added by Kirsty W. on 10 Mar 2026')).toBeInTheDocument()
    expect(within(section).getByText('None recorded.')).toBeInTheDocument()
    const ended = section.querySelector('[data-shot="pairing-ended"]') as HTMLElement
    expect(within(ended).getByText('Dr Rawiri Hughes prefers not to work with Ms A. Reid')).toBeInTheDocument()
    expect(within(ended).getByText(/Resolved with the surgeon's rooms/)).toBeInTheDocument()
  })

  it('the add sheet disables Dr Sharma for "Ms A. Reid asked" only; adding the other side shows on both profiles', () => {
    const view = renderAdmin(`/admin/masters/surgeons/${SURG.reid}`)
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

    renderAdmin(`/admin/masters/anaesthetists/${ANAE.sharma}`)
    const notPreferred = document.querySelector('[data-pairing-group="NOT_PREFERRED"]') as HTMLElement
    expect(within(notPreferred).getByText('Dr Priya Sharma prefers not to work with Ms A. Reid')).toBeInTheDocument()
    expect(within(notPreferred).getByText('Ms A. Reid prefers not to work with Dr Priya Sharma')).toBeInTheDocument()
  })

  it('ending an entry keeps it, under Ended entries, with its reason; the sheet is audited', () => {
    renderAdmin(`/admin/masters/anaesthetists/${ANAE.sharma}`)
    const preferred = document.querySelector('[data-pairing-group="PREFERRED"]') as HTMLElement
    fireEvent.click(within(preferred).getByRole('button', { name: /^End / }))
    fireEvent.change(screen.getByLabelText('Why it ended (optional)'), { target: { value: 'Rooms moved' } })
    fireEvent.click(screen.getByRole('button', { name: 'End pairing' }))
    expect(screen.getByText('None recorded.')).toBeInTheDocument()
    const ended = document.querySelector('[data-shot="pairing-ended"]') as HTMLElement
    expect(within(ended).getByText('Mr J. Whitford prefers to work with Dr Priya Sharma')).toBeInTheDocument()
    expect(within(ended).getByText(/Rooms moved/)).toBeInTheDocument()
    const last = useAppStore.getState().audit.at(-1)
    expect(last?.action).toBe('pairing.end')
    expect(Object.keys(useAppStore.getState().officePrivate.pairingPreferences)).toContain('PP-003')
  })

  it('the record History merges the record and its pairings, each pairing row labelled by its sentence', () => {
    renderAdmin(`/admin/masters/anaesthetists/${ANAE.sharma}`)
    const card = document.querySelector('[data-shot="tier-card"]') as HTMLElement
    fireEvent.click(within(card).getByRole('button', { name: 'Tier 1' }))
    const preferred = document.querySelector('[data-pairing-group="PREFERRED"]') as HTMLElement
    fireEvent.click(within(preferred).getByRole('button', { name: /^End / }))
    fireEvent.click(screen.getByRole('button', { name: 'End pairing' }))
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Priority tier changed')).toBeInTheDocument()
    expect(within(dialog).getByText('Pairing preference ended')).toBeInTheDocument()
    expect(within(dialog).getAllByText(/Mr J\. Whitford prefers to work with Dr Priya Sharma/).length).toBeGreaterThan(0)
  })

  it('the tier card sets the tier, says it is office only and provisional', () => {
    renderAdmin(`/admin/masters/anaesthetists/${ANAE.sharma}`)
    const card = document.querySelector('[data-shot="tier-card"]') as HTMLElement
    expect(within(card).getByText('Only the office sees this. It orders the suggestions when you assign or move a List.')).toBeInTheDocument()
    expect(within(card).getByText('Tier names are provisional.')).toBeInTheDocument()
    fireEvent.click(within(card).getByRole('button', { name: 'Tier 1' }))
    expect(selectPriorityTier(useAppStore.getState(), ANAE.sharma)).toBe(1)
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('anaesthetist.tierSet')
  })

  it("Edit details edits the HPI CPN (normalised), and an unrelated save sends no HPI CPN", () => {
    renderAdmin(`/admin/masters/anaesthetists/${ANAE.ropata}`)
    fireEvent.click(screen.getByRole('button', { name: 'Edit details' }))
    expect(screen.queryByRole('link', { name: 'Open record' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(useAppStore.getState().audit.at(-1)?.after).not.toHaveProperty('hpiId')

    fireEvent.click(screen.getByRole('button', { name: 'Edit details' }))
    fireEvent.change(screen.getByLabelText('HPI CPN (optional)'), { target: { value: '47reia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Ms A. Reid')
    fireEvent.change(screen.getByLabelText('HPI CPN (optional)'), { target: { value: '60ropx' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(useAppStore.getState().masters.anaesthetists[ANAE.ropata]?.hpiId).toBe('60ROPX')
  })
})

describe('cross-links', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it("the List drawer's surgeon opens the profile and closes the drawer", () => {
    const listId = projectedListId(ANAE.chen, '2026-07-21', 'PM')
    const onClose = vi.fn()
    render(
      <MemoryRouter initialEntries={['/admin/day/2026-07-21']}>
        <SurfaceProvider variant="web">
          <SlotDrawer slotId={assigned(useAppStore.getState().schedule.lists[listId]).slotId} actor={OFFICE} onClose={onClose} onOpenBooking={vi.fn()} />
          <LocationProbe />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'Ms A. Reid' }))
    expect(onClose).toHaveBeenCalled()
    expect(location()).toBe(`/admin/masters/surgeons/${SURG.reid}`)
  })
})

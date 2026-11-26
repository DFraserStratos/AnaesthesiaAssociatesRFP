/**
 * The People section (build plan Phase 53; US-13.4.1, D99, D100): every old
 * Master data, profile and Patients link lands on its People page with a
 * replace (Back never loops), an unknown id falls back to its tab, and each
 * list is searched, filtered and paged with its state in the URL.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Outlet, Route, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ANAE, SURG } from '../../../../domain/seed'
import { freshAppState, OFFICE_ACTOR, useAppStore } from '../../../../store'
import { SurfaceProvider } from '../../../../shared/surface'
import { mastersAndLegacyRoutes, peopleRoutes } from '../../../../test/adminRoutes'
import type { Surgeon } from '../../../../domain/types'

const noop = () => undefined

function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<Outlet context={{ actor: OFFICE_ACTOR, todayISO: '2026-11-24', onOpenList: noop }} />}>
        <Route path="day/:dateISO" element={<div data-testid="day" />} />
        <Route path="intake/waiting" element={<div data-testid="waiting" />} />
        {peopleRoutes()}
        {mastersAndLegacyRoutes()}
      </Route>,
    ),
    { initialEntries: ['/admin/day/2026-11-24', url], initialIndex: 1 },
  )
  render(
    <SurfaceProvider variant="web">
      <RouterProvider router={router} />
    </SurfaceProvider>,
  )
  return router
}

const here = (router: ReturnType<typeof mountAt>) => router.state.location.pathname + router.state.location.search

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('old links redirect to People and stay (D100)', () => {
  it.each([
    ['/admin/masters?view=anaesthetists', '/admin/people/anaesthetists'],
    ['/admin/masters?view=surgeons', '/admin/people/surgeons'],
    ['/admin/masters?view=specialties', '/admin/people/specialties'],
    ['/admin/masters?view=surgeonGroups', '/admin/people/surgeons'],
    ['/admin/masters?view=surgeonRooms', '/admin/people/surgeons'],
    [`/admin/masters/anaesthetists/${ANAE.sharma}`, `/admin/people/anaesthetists/${ANAE.sharma}`],
    [`/admin/masters/surgeons/${SURG.reid}`, `/admin/people/surgeons/${SURG.reid}`],
    ['/admin/patients', '/admin/people/patients'],
    ['/admin/patients/follow-up', '/admin/people/patients?filter=follow-up'],
    ['/admin/patients/CQY9304', '/admin/people/patients/CQY9304'],
    ['/admin/patients/waiting', '/admin/intake?filter=needs-nhi'],
    ['/admin/people', '/admin/people/anaesthetists'],
  ])('%s lands on %s, replacing the old entry so Back does not loop', async (from, to) => {
    const router = mountAt(from)
    expect(here(router)).toBe(to)
    expect(router.state.historyAction).toBe('REPLACE')
    await act(async () => {
      await router.navigate(-1)
    })
    expect(router.state.location.pathname).toBe('/admin/day/2026-11-24')
  })

  it.each([
    ['/admin/masters/anaesthetists/99999', '/admin/people/anaesthetists'],
    ['/admin/masters/surgeons/S-NOPE', '/admin/people/surgeons'],
    ['/admin/patients/NOPE999', '/admin/people/patients'],
    ['/admin/people/anaesthetists/99999', '/admin/people/anaesthetists'],
    ['/admin/people/patients/NOPE999', '/admin/people/patients'],
  ])('an unknown id (%s) falls back to its tab', (from, to) => {
    const router = mountAt(from)
    expect(here(router)).toBe(to)
  })

  it('Master data keeps its other views: no redirect for Hospitals', () => {
    const router = mountAt('/admin/masters?view=hospitals')
    expect(here(router)).toBe('/admin/masters?view=hospitals')
    expect(screen.getByText(/Anaesthetists, surgeons and specialties are in/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'People' })).toHaveAttribute('href', '/admin/people/anaesthetists')
  })
})

describe('the People tabs', () => {
  it('shows the four tabs in order, each list tab with its count, Patients with none', () => {
    mountAt('/admin/people/anaesthetists')
    const tabs = document.querySelector('[data-shot="people-tabs"]') as HTMLElement
    const links = [...tabs.querySelectorAll('a')]
    expect(links.map((a) => a.getAttribute('data-people-tab'))).toEqual(['anaesthetists', 'surgeons', 'specialties', 'patients'])
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/admin/people/anaesthetists', '/admin/people/surgeons', '/admin/people/specialties', '/admin/people/patients'])
    const state = useAppStore.getState()
    expect(links[0]!.textContent).toBe(`Anaesthetists${Object.keys(state.masters.anaesthetists).length}`)
    expect(links[2]!.textContent).toBe(`Specialties${Object.keys(state.masters.specialties).length}`)
    expect(links[3]!.textContent).toBe('Patients')
    expect(links[0]).toHaveAttribute('aria-current', 'page')
  })

  it('a record page goes back to its tab', () => {
    mountAt(`/admin/people/anaesthetists/${ANAE.sharma}`)
    expect(screen.getByRole('link', { name: /Anaesthetists/ })).toHaveAttribute('href', '/admin/people/anaesthetists')
  })
})

describe('Anaesthetists: search, status and tier, in the URL', () => {
  const rows = () => [...document.querySelectorAll<HTMLElement>('tr[data-anaesthetist]')].map((r) => r.getAttribute('data-anaesthetist'))

  it('searches by surname, registration number and HPI CPN, with the search kept in the URL', () => {
    const router = mountAt('/admin/people/anaesthetists')
    const box = screen.getByLabelText('Search by name, registration or HPI CPN')
    fireEvent.change(box, { target: { value: 'sharma' } })
    expect(rows()).toEqual([ANAE.sharma])
    expect(here(router)).toBe('/admin/people/anaesthetists?q=sharma')
    expect(router.state.historyAction).toBe('REPLACE')
    fireEvent.change(box, { target: { value: ANAE.ropata } })
    expect(rows()).toEqual([ANAE.ropata])
    const hpi = useAppStore.getState().masters.anaesthetists[ANAE.chen]!.hpiId
    fireEvent.change(box, { target: { value: hpi.toLowerCase() } })
    expect(rows()).toEqual([ANAE.chen])
  })

  it('reads its state from the URL (a reload keeps it) and lists in surname order', () => {
    mountAt('/admin/people/anaesthetists?q=a&tier=1')
    expect((screen.getByLabelText('Search by name, registration or HPI CPN') as HTMLInputElement).value).toBe('a')
    const tier = screen.getByRole('group', { name: 'Filter by tier' })
    expect(within(tier).getByRole('button', { name: 'Tier 1' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('Active by default; Inactive and All read isActiveOn on the demo day', () => {
    const s = useAppStore.getState()
    const ngata = s.masters.anaesthetists[ANAE.ngata]!
    useAppStore.setState({ masters: { ...s.masters, anaesthetists: { ...s.masters.anaesthetists, [ANAE.ngata]: { ...ngata, lastDayISO: '2026-11-01' } } } })
    mountAt('/admin/people/anaesthetists')
    expect(rows()).not.toContain(ANAE.ngata)
    const status = screen.getByRole('group', { name: 'Status' })
    fireEvent.click(within(status).getByRole('button', { name: 'Inactive' }))
    expect(rows()).toEqual([ANAE.ngata])
    fireEvent.click(within(status).getByRole('button', { name: 'All' }))
    expect(rows()).toContain(ANAE.ngata)
    expect(rows()).toHaveLength(Object.keys(s.masters.anaesthetists).length)
  })
})

describe('Surgeons: Find a person (US-13.4.1)', () => {
  const rows = () => [...document.querySelectorAll<HTMLElement>('tr[data-surgeon]')].map((r) => r.getAttribute('data-surgeon'))

  it('a name search with a specialty filter shows only the matching surgeons', () => {
    const router = mountAt('/admin/people/surgeons')
    fireEvent.change(screen.getByLabelText('Search by name, practice or HPI CPN'), { target: { value: 'reid' } })
    expect(rows()).toContain(SURG.reid)
    const reid = useAppStore.getState().masters.surgeons[SURG.reid]!
    fireEvent.change(screen.getByLabelText('Specialty'), { target: { value: reid.specialtyIds[0] } })
    const shown = rows()
    expect(shown).toContain(SURG.reid)
    const surgeons = useAppStore.getState().masters.surgeons
    for (const id of shown) {
      expect(surgeons[id!]!.name.toLowerCase()).toContain('reid')
      expect(surgeons[id!]!.specialtyIds).toContain(reid.specialtyIds[0])
    }
    expect(here(router)).toBe(`/admin/people/surgeons?q=reid&specialty=${reid.specialtyIds[0]}`)
  })

  it('Retired and All replace Show retired', () => {
    const s = useAppStore.getState()
    const lim = s.masters.surgeons[SURG.lim]!
    useAppStore.setState({ masters: { ...s.masters, surgeons: { ...s.masters.surgeons, [SURG.lim]: { ...lim, retiredAtISO: '2026-10-01', retiredReason: 'Retired' } } } })
    mountAt('/admin/people/surgeons?q=lim')
    expect(rows()).not.toContain(SURG.lim)
    expect(screen.queryByRole('checkbox', { name: /Show retired/ })).toBeNull()
    fireEvent.click(within(screen.getByRole('group', { name: 'Status' })).getByRole('button', { name: 'Retired' }))
    expect(rows()).toEqual([SURG.lim])
  })

  it('pages at 50, and any filter change goes back to page 1', () => {
    const s = useAppStore.getState()
    const template = s.masters.surgeons[SURG.reid]!
    const extra: Record<string, Surgeon> = {}
    for (let i = 0; i < 60; i += 1) {
      const id = `S-PAGE${String(i).padStart(2, '0')}`
      extra[id] = { ...template, id, name: `Mr P. Pager${String(i).padStart(2, '0')}` }
      delete (extra[id] as Partial<Surgeon>).hpiId
    }
    useAppStore.setState({ masters: { ...s.masters, surgeons: { ...s.masters.surgeons, ...extra } } })
    const router = mountAt('/admin/people/surgeons?q=pager')
    expect(rows()).toHaveLength(50)
    const pager = document.querySelector('[data-shot="people-pager"]') as HTMLElement
    fireEvent.click(within(pager).getByRole('button', { name: 'Next page' }))
    expect(rows()).toHaveLength(10)
    expect(here(router)).toBe('/admin/people/surgeons?q=pager&page=2')
    fireEvent.click(within(screen.getByRole('group', { name: 'Status' })).getByRole('button', { name: 'All' }))
    expect(here(router)).toBe('/admin/people/surgeons?q=pager&status=all')
    expect(rows()).toHaveLength(50)
  })
})

describe('Specialties and Patients', () => {
  it('Specialties searches by name', () => {
    mountAt('/admin/people/specialties')
    fireEvent.change(screen.getByLabelText('Search specialties by name'), { target: { value: 'ophth' } })
    expect([...document.querySelectorAll('tr[data-specialty]')].map((r) => r.textContent)).toEqual([expect.stringContaining('Ophthalmology')])
  })

  it("Patients' filter shows Needs follow-up in the URL, and a row opens the patient's page", () => {
    const router = mountAt('/admin/people/patients?filter=all')
    fireEvent.change(screen.getByLabelText('Search patients'), { target: { value: 'CQY9304' } })
    fireEvent.click(document.querySelector('tr[data-patient-nhi="CQY9304"] td') as HTMLElement)
    expect(here(router)).toBe('/admin/people/patients/CQY9304')
    const followUp = mountAt('/admin/people/patients')
    fireEvent.click(within(screen.getAllByRole('group', { name: 'Show' }).at(-1)!).getByRole('button', { name: /^Needs follow-up/ }))
    expect(here(followUp)).toBe('/admin/people/patients?filter=follow-up')
    expect(document.querySelector('[data-shot="patients-needs-office"]')).not.toBeNull()
  })
})

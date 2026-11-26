/**
 * Intake · Waiting for NHI (moved from Patients in Phase 51; catch-up Phases
 * 40 and 40a): the waiting row, the Add NHI sheet and its register check.
 */

import type { ReactNode } from 'react'
import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, MemoryRouter, Outlet, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, importHospitalDownload, OFFICE_ACTOR, useAppStore, waitingNhiRows } from '../../../store'
import { NO_NHI_LIST, NO_NHI_RETURNING_NHI } from '../../../domain/intake/hospitalDownloads'
import { SurfaceProvider } from '../../../shared/surface'
import { HUB_TIMING } from '../../../shared/nhiHub'
import { WaitingNhiTab } from './WaitingNhiTab'
import { REGISTER_DIFFERS_LINE } from './AddNhiSheet'
import { intakeRoutes, mastersAndLegacyRoutes } from '../../../test/adminRoutes'

const noop = () => undefined

function inAdmin(node: ReactNode, path = '/admin/intake/waiting') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">{node}</SurfaceProvider>
    </MemoryRouter>,
  )
}

function receiveMissingNhiList() {
  const res = importHospitalDownload(useAppStore, OFFICE_ACTOR, NO_NHI_LIST.id)
  if (!res.ok) throw new Error(res.message)
}

function waitingRow(container: HTMLElement, name: string): HTMLElement {
  const rows = [...container.querySelectorAll<HTMLElement>('[data-shot="waiting-nhi-row"]')]
  const row = rows.find((r) => r.textContent?.includes(name))
  if (row === undefined) throw new Error(`no waiting row for ${name}`)
  return row
}

function openAddNhi(name: string): HTMLElement {
  receiveMissingNhiList()
  const { container } = inAdmin(<WaitingNhiTab actor={OFFICE_ACTOR} onOpenList={noop} />)
  fireEvent.click(within(waitingRow(container, name)).getByRole('button', { name: 'Add NHI' }))
  return document.querySelector('[data-shot="add-nhi-sheet"]') as HTMLElement
}

const answer = () =>
  act(() => {
    vi.advanceTimersByTime(HUB_TIMING.answerMs)
  })

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('Waiting for NHI', () => {
  it('a row shows the address to chase, the Urgent pill on a close row, and Add NHI', () => {
    receiveMissingNhiList()
    const { container } = inAdmin(<WaitingNhiTab actor={OFFICE_ACTOR} onOpenList={noop} />)
    const rows = waitingNhiRows(useAppStore.getState())
    const aroha = rows.find((r) => r.patientName === 'Aroha Ngata')!
    const row = waitingRow(container, 'Aroha Ngata')
    expect(row.getAttribute('data-urgent')).toBe('true')
    expect(within(row).getByText('Urgent')).toBeInTheDocument()
    expect(aroha.chase.to).not.toBe('')
    expect(row.querySelector('[data-shot="waiting-nhi-chase"]')?.textContent).toContain(aroha.chase.to)
    expect(within(row).getByRole('button', { name: 'Add NHI' })).toBeInTheDocument()
    // Email for the NHI is a real mailto link.
    expect(row.querySelector('a[data-shot="waiting-nhi-email"]')?.getAttribute('href')).toMatch(/^mailto:/)
    const tuilagi = waitingRow(container, 'Losa Tuilagi')
    expect(tuilagi.getAttribute('data-urgent')).toBe('false')
    expect(within(tuilagi).queryByText('Urgent')).toBeNull()
  })

  it('Email for the NHI audits the request and the row reads Requested', () => {
    receiveMissingNhiList()
    const { container } = inAdmin(<WaitingNhiTab actor={OFFICE_ACTOR} onOpenList={noop} />)
    const row = waitingRow(container, 'Losa Tuilagi')
    expect(row.textContent).toContain('Not yet')
    fireEvent.click(row.querySelector('a[data-shot="waiting-nhi-email"]')!)
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('importRow.nhiRequested')
    expect(waitingRow(container, 'Losa Tuilagi').textContent).not.toContain('Not yet')
  })

  it('the Add NHI sheet shows the existing record and adds the NHI through addNhiToWaitingRow', () => {
    receiveMissingNhiList()
    const { container } = inAdmin(<WaitingNhiTab actor={OFFICE_ACTOR} onOpenList={noop} />)
    const before = Object.keys(useAppStore.getState().masters.patients).length
    fireEvent.click(within(waitingRow(container, 'Losa Tuilagi')).getByRole('button', { name: 'Add NHI' }))
    const sheet = document.querySelector('[data-shot="add-nhi-sheet"]') as HTMLElement
    expect(sheet).not.toBeNull()
    const save = within(sheet).getByRole('button', { name: 'Add NHI' })
    expect(save).toBeDisabled()
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: NO_NHI_RETURNING_NHI } })
    expect(sheet.querySelector('[data-shot="add-nhi-preview"]')?.textContent).toMatch(/^Matches Losa Tuilagi, born 1 JUN 1992, \d+ earlier Bookings?\. The row uses this record; no second one is made\.$/)
    fireEvent.click(within(sheet).getByRole('button', { name: 'Add NHI' }))
    expect(waitingNhiRows(useAppStore.getState()).some((r) => r.patientName === 'Losa Tuilagi')).toBe(false)
    expect(Object.keys(useAppStore.getState().masters.patients).length).toBe(before)
    expect(document.querySelector('[data-shot="add-nhi-done"]')?.textContent).toContain('Added. The Booking is on')
  })

  it('an invalid NHI shows its reason and keeps Add NHI disabled', () => {
    receiveMissingNhiList()
    const { container } = inAdmin(<WaitingNhiTab actor={OFFICE_ACTOR} onOpenList={noop} />)
    fireEvent.click(within(waitingRow(container, 'Aroha Ngata')).getByRole('button', { name: 'Add NHI' }))
    const sheet = document.querySelector('[data-shot="add-nhi-sheet"]') as HTMLElement
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: 'ZAE0311' } })
    expect(sheet.textContent).toContain('The check digit does not match.')
    expect(within(sheet).getByRole('button', { name: 'Add NHI' })).toBeDisabled()
  })
})

describe('Add NHI on a waiting row (catch-up Phase 40a)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('ZAA0068 shows the check-digit reason as typed; ZAA0067 clears it', () => {
    const sheet = openAddNhi('Aroha Ngata')
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: 'ZAA0068' } })
    expect(sheet.textContent).toContain('The check digit does not match.')
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: 'ZAA0067' } })
    expect(sheet.textContent).not.toContain('The check digit does not match.')
    expect(sheet.textContent).toContain('Valid NHI')
  })

  it("a valid NHI is looked up on the register with the AA office's purpose note; the row's own patient shows no caution", () => {
    const sheet = openAddNhi('Losa Tuilagi')
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: NO_NHI_RETURNING_NHI } })
    expect(sheet.querySelector('[data-shot="nhi-lookup-status"]')?.textContent).toBe('Checking the NHI register')
    answer()
    expect(sheet.querySelector('[data-shot="nhi-lookup-status"]')?.textContent).toBe('On the NHI register: Losa Tuilagi, 1 JUN 1992.')
    expect(sheet.querySelector('[data-shot="add-nhi-register-differs"]')).toBeNull()
    expect(sheet.querySelector('[data-shot="nhi-purpose"]')?.textContent).toContain('Looked up on behalf of the AA office,')
    expect(within(sheet).getByRole('button', { name: 'Add NHI' })).toBeEnabled()
  })

  it("the register's different name is a mild caution, never a block", () => {
    const sheet = openAddNhi('Aroha Ngata')
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: NO_NHI_RETURNING_NHI } })
    answer()
    expect(sheet.querySelector('[data-shot="add-nhi-register-differs"]')?.textContent).toBe(REGISTER_DIFFERS_LINE)
    expect(within(sheet).getByRole('button', { name: 'Add NHI' })).toBeEnabled()
  })
})

describe('The old Patients and Intake waiting links land on Needs NHI (Phase 51, re-pointed by Phase 68; D99, D100, D117)', () => {
  function mountAt(url: string) {
    const router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/admin" element={<Outlet context={{ actor: OFFICE_ACTOR, onOpenList: noop }} />}>
          <Route path="day/:dateISO" element={<div data-testid="day" />} />
          {intakeRoutes()}
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

  for (const url of ['/admin/patients/waiting', '/admin/intake/waiting']) {
    it(`${url} lands on Arrivals under Needs NHI, replacing the old entry so Back does not loop`, async () => {
      const router = mountAt(url)
      expect(router.state.location.pathname).toBe('/admin/intake')
      expect(router.state.location.search).toBe('?filter=needs-nhi')
      expect(router.state.historyAction).toBe('REPLACE')
      expect(document.querySelector('[data-shot="intake-arrivals"]')).not.toBeNull()
      await act(async () => {
        await router.navigate(-1)
      })
      expect(router.state.location.pathname).toBe('/admin/day/2026-11-24')
    })
  }
})

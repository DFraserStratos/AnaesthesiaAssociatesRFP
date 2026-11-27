/**
 * Replace from a date on a Contract's page (build plan Phase 49; US-04.1.8):
 * the header button (Active, non-system only), the sheet's preview, ticking,
 * the rate notice, the fixed-price pointer, save landing on the new page with
 * its result, the old page's lines and the late disable listing from the
 * change date.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CONTRACT } from '../../../domain/seed/contracts'
import { advanceClockToDate, disableContract, freshAppState, replaceContract, setProcedureContract, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { AdminContractRoute } from '../routes'
import { contractPath } from '../contractsPaths'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const UNI = CONTRACT.unisports
const TICKED = ['P0069', 'P0070', 'P0071']

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
            <Route path="contracts/:contractId" element={<AdminContractRoute />} />
            <Route path="*" element={<div data-testid="elsewhere" />} />
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement | null
const inputOf = (name: string) => { const el = shot(name)!; return (el.tagName === 'INPUT' ? el : el.querySelector('input')!) as HTMLInputElement }

beforeEach(() => {
  useAppStore.setState(freshAppState())
  for (const id of TICKED) expect(setProcedureContract(useAppStore, OFFICE, id, UNI).ok).toBe(true)
})
afterEach(cleanup)

describe('Replace from a date (US-04.1.8)', () => {
  it('sits beside Disable on an Active Contract; not on a system or Disabled one', () => {
    renderAt(contractPath(UNI))
    expect(shot('contract-replace')).not.toBeNull()
    cleanup()
    const system = Object.values(useAppStore.getState().masters.contracts).find((c) => c.systemRole !== undefined)!
    renderAt(contractPath(system.id))
    expect(shot('contract-replace')).toBeNull()
    cleanup()
    disableContract(useAppStore, OFFICE, UNI)
    renderAt(contractPath(UNI))
    expect(shot('contract-replace')).toBeNull()
  })

  it('previews the code, lists the Procedures ticked, says the rate is offered from today, and saves', () => {
    renderAt(contractPath(UNI))
    fireEvent.click(screen.getByRole('button', { name: 'Replace from a date' }))
    const sheet = shot('contract-replace-sheet')!
    expect(within(sheet).getByRole('heading', { name: 'Replace Unisports Ortho from a date' })).toBeInTheDocument()
    fireEvent.change(within(sheet).getByLabelText('Change date'), { target: { value: '2026-12-01' } })
    fireEvent.change(within(sheet).getByLabelText('New Contract'), { target: { value: '97' } })
    expect(inputOf('contract-replace-now').value).toBe('RVG at $93.47 per unit')
    expect(inputOf('contract-replace-new-price').value).toBe('97')
    expect(shot('contract-replace-aa-code')!.textContent).toContain('AA code UNI-002 is assigned on save.')
    expect(shot('contract-replace-rate-notice')!.textContent).toBe('A rate has no dates, so UNI-002 is offered from today, not from 1 Dec 2026. Until UNI-001 is disabled, both are offered.')
    const rows = sheet.querySelectorAll('[data-shot="contract-replace-row"]')
    expect([...rows].map((r) => r.getAttribute('data-procedure-id'))).toEqual(TICKED)
    expect(within(sheet).getByRole('button', { name: 'Create UNI-002 and move 3' })).toBeInTheDocument()
    // Untick one.
    fireEvent.click(within(rows[1] as HTMLElement).getByRole('checkbox'))
    fireEvent.click(within(sheet).getByRole('button', { name: 'Create UNI-002 and move 2' }))
    const created = Object.values(useAppStore.getState().masters.contracts).find((c) => c.aaCode === 'UNI-002')!
    expect(location).toBe(contractPath(created.id))
    expect(shot('contract-replaced-result')!.textContent).toContain('Replaced UNI-001. 2 Procedures moved.')
    const p = useAppStore.getState().schedule.procedures
    expect(p.P0069!.governingContractId).toBe(created.id)
    expect(p.P0070!.governingContractId).toBe(UNI)
    expect(p.P0071!.governingContractId).toBe(created.id)
    expect(useAppStore.getState().masters.contracts[UNI]!.status).toBe('active')
    expect(shot('contract-replaces-line')!.textContent).toContain('Replaces UNI-001 from 1 Dec 2026.')
  })

  it('a refused create keeps the sheet open with its message, writing nothing', () => {
    renderAt(contractPath(UNI))
    fireEvent.click(screen.getByRole('button', { name: 'Replace from a date' }))
    const sheet = shot('contract-replace-sheet')!
    fireEvent.change(within(sheet).getByLabelText('New Contract'), { target: { value: '0' } })
    const audit = useAppStore.getState().audit.length
    fireEvent.click(within(sheet).getByRole('button', { name: /^Create UNI-002/ }))
    expect(shot('contract-replace-sheet')).not.toBeNull()
    expect(shot('contract-replace-error')!.textContent).toContain('The rate must be above zero.')
    expect(useAppStore.getState().audit.length).toBe(audit)
  })

  it('Escape closes the sheet with nothing written', () => {
    renderAt(contractPath(UNI))
    fireEvent.click(screen.getByRole('button', { name: 'Replace from a date' }))
    const audit = useAppStore.getState().audit.length
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(shot('contract-replace-sheet')).toBeNull()
    expect(useAppStore.getState().audit.length).toBe(audit)
  })

  it('a fixed price shows the price-range pointer, which opens the add-range row', () => {
    renderAt(contractPath('CT-MER-FACELIFT'))
    fireEvent.click(screen.getByRole('button', { name: 'Replace from a date' }))
    expect(shot('contract-replace-range-pointer')).not.toBeNull()
    expect(shot('contract-replace-rate-notice')).toBeNull()
    expect(inputOf('contract-replace-new-price').value).toMatch(/ from /)
    fireEvent.click(within(shot('contract-replace-range-pointer')!).getByRole('button', { name: 'Add a price range' }))
    expect(shot('contract-replace-sheet')).toBeNull()
    expect(location).toBe(`${contractPath('CT-MER-FACELIFT')}?add=range`)
    expect(shot('price-range-add')).not.toBeNull()
  })

  it('the old page: a quiet line before the date; from the date the to-do notice, whose Disable lists from the change date', () => {
    const r = replaceContract(useAppStore, OFFICE, UNI, { patch: {}, fromISO: '2026-12-01', moveProcedureIds: [], disableNow: false })
    if (!r.ok) throw new Error(r.message)
    renderAt(contractPath(UNI))
    expect(shot('contract-replaced-line')!.textContent).toContain('Replaced by UNI-002 from 1 Dec 2026.')
    expect(shot('contract-replaced-todo')).toBeNull()
    cleanup()
    advanceClockToDate(useAppStore, '2026-12-03')
    renderAt(contractPath(UNI))
    expect(shot('contract-replaced-todo')!.textContent).toContain('Replaced by UNI-002 from 1 Dec 2026. Disable it so it is no longer offered.')
    fireEvent.click(within(shot('contract-replaced-todo')!).getByRole('button', { name: 'Disable' }))
    const dialog = shot('contract-disable-sheet')!.closest('[role="dialog"]') as HTMLElement
    expect(shot('contract-disable-from-change-date')!.textContent).toBe('Listed from Tue 1 Dec, the date it was replaced by UNI-002.')
    expect(dialog.querySelectorAll('[data-shot="contract-still-on-row"]')).toHaveLength(3)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Disable' }))
    expect(useAppStore.getState().masters.contracts[UNI]!.status).toBe('disabled')
    expect(shot('contract-replaced-todo')).toBeNull()
  })
})

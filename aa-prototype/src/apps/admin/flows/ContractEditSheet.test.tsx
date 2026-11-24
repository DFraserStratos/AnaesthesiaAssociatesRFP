/**
 * The Escape bug (UI unification U2, README section 4 bug 1): with the RVG
 * code picker open over the Contract panel, one Escape used to close both and
 * lose the form. One modal stack now closes only the top layer.
 */

import { fireEvent, render, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { AdminMastersRoute } from '../routes'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderContracts() {
  return render(
    <MemoryRouter initialEntries={['/admin/masters?view=contracts']}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: '2026-11-24' }} />}>
            <Route path="masters" element={<AdminMastersRoute />} />
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const panel = () => document.querySelector('[data-shot="contract-detail"]') as HTMLElement | null
const picker = () => document.querySelector('[data-shot="rvg-type-ahead"]') as HTMLElement | null

/** Escape on whatever has focus, as a keyboard would send it. */
function escape() {
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
}

function openContractAndEdit(aaCode: string) {
  const row = [...document.querySelectorAll('tr[data-contract]')].find((r) => r.querySelector('td')?.textContent === aaCode) as HTMLElement
  fireEvent.click(within(row).getByRole('button', { name: /^Edit / }))
  expect(panel()).not.toBeNull()
  const name = within(panel()!).getByLabelText('Name')
  fireEvent.change(name, { target: { value: 'Edited before the picker' } })
  // jsdom does not focus a clicked button; a keyboard user has it focused.
  const choose = within(panel()!).getByRole('button', { name: 'Choose the default RVG code' })
  choose.focus()
  fireEvent.click(choose)
  expect(picker()).not.toBeNull()
}

describe('the Contract panel and the RVG code picker (U2, bug 1)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('one Escape with the search empty closes the picker only; the panel and its edit stay', () => {
    renderContracts()
    openContractAndEdit('CES-001')
    // The search took focus (autoFocus) and is empty.
    expect(document.activeElement).toBe(within(picker()!).getByRole('searchbox'))
    escape()
    expect(picker()).toBeNull()
    expect(panel()).not.toBeNull()
    expect(within(panel()!).getByLabelText('Name')).toHaveValue('Edited before the picker')
    // Focus came back to the control that opened the picker.
    expect(document.activeElement).toBe(within(panel()!).getByRole('button', { name: 'Choose the default RVG code' }))
    // A second Escape then closes the panel.
    escape()
    expect(panel()).toBeNull()
  })

  it('the same with focus on a picker row', () => {
    renderContracts()
    openContractAndEdit('CES-001')
    const row = within(picker()!).getAllByRole('button')[0] as HTMLElement
    row.focus()
    escape()
    expect(picker()).toBeNull()
    expect(within(panel()!).getByLabelText('Name')).toHaveValue('Edited before the picker')
  })

  it('with text in the search, Escape clears it first, then closes the picker, then the panel', () => {
    renderContracts()
    openContractAndEdit('CES-001')
    const search = within(picker()!).getByRole('searchbox')
    fireEvent.change(search, { target: { value: 'H1' } })
    escape()
    expect(search).toHaveValue('')
    expect(picker()).not.toBeNull()
    escape()
    expect(picker()).toBeNull()
    expect(panel()).not.toBeNull()
    escape()
    expect(panel()).toBeNull()
  })

  it("the panel's form behind the picker is inert while the picker is open, and live again after", () => {
    renderContracts()
    openContractAndEdit('CES-001')
    const name = within(panel()!).getByLabelText('Name')
    expect(name.closest('[inert]')).not.toBeNull()
    expect(picker()!.closest('[inert]')).toBeNull()
    escape()
    expect(name.closest('[inert]')).toBeNull()
  })
})

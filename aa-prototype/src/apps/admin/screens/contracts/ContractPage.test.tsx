/**
 * The Contracts section and a Contract's page (build plan Phase 45; US-04.1.7,
 * US-04.2.15, US-04.1.2 "Disable confirmed", US-04.1.3 per card, DM-04, D92,
 * D93). Rewritten from the Contract panel's test (UI unification U2's Escape
 * cases now run on the page's invoice-and-codes card).
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CONTRACT_REFUSAL_MESSAGES } from '../../../../domain/billing/contracts'
import { formatMoney } from '../../../../domain/billing/money'
import { addDaysISO } from '../../../../domain/clock'
import { onContract, stillOnContract, freshAppState, useAppStore, type Actor } from '../../../../store'
import { SurfaceProvider } from '../../../../shared'
import { AdminContractRoute, AdminContractsRoute, AdminMastersRoute } from '../../routes'
import { mastersRedirect } from '../../mastersRedirect'
import { contractPath, contractsPath, newContractPath, partyPath } from '../../contractsPaths'

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
                <Route path="new" element={null} />
              </Route>
              <Route path=":contractId" element={<AdminContractRoute />} />
            </Route>
            <Route path="masters" element={<AdminMastersRoute />} />
            <Route path="*" element={<div data-testid="elsewhere" />} />
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const card = (shot: string) => document.querySelector(`[data-shot="${shot}"]`) as HTMLElement
const picker = () => document.querySelector('[data-shot="rvg-type-ahead"]') as HTMLElement | null
const contractUpdates = () => useAppStore.getState().audit.filter((e) => e.action === 'contract.update')

function escape() {
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('routes and the old Master data links (D92, D93)', () => {
  it('builds every section URL from one home, keyed by the Contract id', () => {
    expect(contractsPath()).toBe('/admin/contracts')
    expect(contractsPath({ holder: 'PY-CES' })).toBe('/admin/contracts?group=holder&in=PY-CES')
    expect(contractPath('CT-HNZ')).toBe('/admin/contracts/CT-HNZ')
    expect(contractPath('CT-HNZ', 'history')).toBe('/admin/contracts/CT-HNZ?tab=history')
    expect(newContractPath({ holder: 'PY-CES' })).toBe('/admin/contracts/new?holder=PY-CES')
    expect(partyPath('PY-CES')).toBe('/admin/masters?view=parties&party=PY-CES')
  })

  it('redirects the three old forms, and an unknown &contract= to the list', () => {
    const { masters } = useAppStore.getState()
    const at = (q: string) => mastersRedirect(new URLSearchParams(q), masters)
    expect(at('view=contracts')).toBe('/admin/contracts')
    expect(at('view=contracts&contract=CT-MER-FACELIFT')).toBe('/admin/contracts/CT-MER-FACELIFT')
    expect(at('view=contracts&holder=PY-CES')).toBe('/admin/contracts?group=holder&in=PY-CES')
    expect(at('view=contracts&contract=CT-NOT-THERE')).toBe('/admin/contracts')
    expect(at('view=contracts&holder=PY-NOT-THERE')).toBe('/admin/contracts')
    expect(at('view=parties')).toBeNull()
  })

  it('lands an old link on the page, and an unknown id falls back to the list', () => {
    renderAt('/admin/masters?view=contracts&contract=CT-MER-FACELIFT')
    expect(location).toBe('/admin/contracts/CT-MER-FACELIFT')
    expect(card('contract-detail')).not.toBeNull()
    cleanup()
    renderAt('/admin/contracts/CT-NOT-THERE')
    expect(location).toBe('/admin/contracts')
    expect(card('contracts-section')).not.toBeNull()
  })

  it('opens a row at its id, and the URL still works after the AA code changes', () => {
    renderAt('/admin/contracts')
    fireEvent.click(screen.getByRole('button', { name: 'Open Health NZ agreed rate' }))
    expect(location).toBe('/admin/contracts/CT-HNZ')
    fireEvent.click(within(card('contract-codes')).getByRole('button', { name: 'Edit invoice and codes' }))
    fireEvent.change(within(card('contract-codes')).getByLabelText('AA code'), { target: { value: 'HNZ-RENAMED' } })
    fireEvent.click(within(card('contract-codes')).getByRole('button', { name: 'Save' }))
    expect(useAppStore.getState().masters.contracts['CT-HNZ']!.aaCode).toBe('HNZ-RENAMED')
    cleanup()
    renderAt('/admin/contracts/CT-HNZ')
    expect(screen.getByRole('heading', { level: 1, name: 'Health NZ agreed rate' })).toBeInTheDocument()
  })
})

describe("a Contract's cards, each saved on its own (US-04.1.7, US-04.1.3)", () => {
  it('One card at a time: saving where it is offered writes one contract.update with only those settings, in one change set', () => {
    renderAt('/admin/contracts/CT-SXAP')
    const before = contractUpdates().length
    const where = card('contract-where')
    fireEvent.click(within(where).getByRole('button', { name: 'Edit where it is offered' }))
    expect(card('contract-where').hasAttribute('data-editing')).toBe(true)
    fireEvent.change(within(card('contract-where')).getByLabelText('Funding tag'), { target: { value: '' } })
    fireEvent.click(within(card('contract-where')).getByRole('button', { name: 'Save' }))
    const updates = contractUpdates()
    expect(updates).toHaveLength(before + 1)
    const entry = updates[updates.length - 1]!
    expect(Object.keys(entry.after as object)).toEqual(['fundingTag'])
    expect(entry.changeSetId).toBeDefined()
    expect(useAppStore.getState().audit.filter((e) => e.changeSetId === entry.changeSetId && e.action === 'contract.update')).toHaveLength(1)
    expect(card('contract-where').hasAttribute('data-editing')).toBe(false)
  })

  it("several cards in edit at once each save alone: saving one leaves the other card's draft out of the change", () => {
    renderAt('/admin/contracts/CT-SXAP')
    fireEvent.click(within(card('contract-codes')).getByRole('button', { name: 'Edit invoice and codes' }))
    fireEvent.change(within(card('contract-codes')).getByLabelText('Name'), { target: { value: 'Not saved yet' } })
    fireEvent.click(within(card('contract-where')).getByRole('button', { name: 'Edit where it is offered' }))
    fireEvent.change(within(card('contract-where')).getByLabelText('Funding tag'), { target: { value: '' } })
    fireEvent.click(within(card('contract-where')).getByRole('button', { name: 'Save' }))
    const entry = contractUpdates().at(-1)!
    expect(Object.keys(entry.after as object)).toEqual(['fundingTag'])
    const saved = useAppStore.getState().masters.contracts['CT-SXAP']!
    expect(saved.name).toBe('Southern Cross Affiliated Provider')
    expect(saved.fundingTagId).toBeUndefined()
    // The codes card is still in edit with its own draft.
    expect(card('contract-codes').hasAttribute('data-editing')).toBe(true)
    expect(within(card('contract-codes')).getByLabelText('Name')).toHaveValue('Not saved yet')
  })

  it('Cancel discards the draft', () => {
    renderAt('/admin/contracts/CT-HNZ')
    const before = useAppStore.getState().audit.length
    fireEvent.click(within(card('contract-codes')).getByRole('button', { name: 'Edit invoice and codes' }))
    fireEvent.change(within(card('contract-codes')).getByLabelText('Name'), { target: { value: 'Thrown away' } })
    fireEvent.click(within(card('contract-codes')).getByRole('button', { name: 'Cancel' }))
    expect(useAppStore.getState().audit.length).toBe(before)
    expect(within(card('contract-codes')).getByText('Health NZ agreed rate')).toBeInTheDocument()
  })

  it('Refused in place: billing a holder Party with no billing details is refused on the card, and nothing changes', () => {
    const doyle = useAppStore.getState().masters.contracts['CT-DOYLE-BAR']!
    expect(useAppStore.getState().masters.parties[doyle.holderId]?.billingName).toBeUndefined()
    renderAt('/admin/contracts/CT-DOYLE-BAR')
    const before = useAppStore.getState().audit.length
    fireEvent.click(within(card('contract-bills')).getByRole('button', { name: 'Edit who it bills' }))
    fireEvent.click(within(card('contract-bills')).getByRole('button', { name: 'Holder' }))
    fireEvent.click(within(card('contract-bills')).getByRole('button', { name: 'Save' }))
    expect(within(card('contract-bills')).getByRole('alert')).toHaveTextContent(CONTRACT_REFUSAL_MESSAGES.holderBillingDetails)
    expect(card('contract-bills').hasAttribute('data-editing')).toBe(true)
    expect(useAppStore.getState().masters.contracts['CT-DOYLE-BAR']!.billsTo).toBe('payer')
    expect(useAppStore.getState().audit.length).toBe(before)
  })

  it("Party details read-only: a Contract billing Christchurch Eye Surgery shows its billing name and email, and opens the Party", () => {
    renderAt('/admin/contracts/CT-CES-D1')
    const bills = card('contract-bills')
    expect(within(bills).getByText('Christchurch Eye Surgery Limited')).toBeInTheDocument()
    expect(within(bills).getByText(/accounts@chcheyesurgery\.example/)).toBeInTheDocument()
    expect(within(bills).queryByLabelText('Billing name')).toBeNull()
    const open = within(bills).getByRole('link', { name: 'Open the Party' })
    expect(open).toHaveAttribute('href', partyPath('PY-CES'))
    fireEvent.click(open)
    // Master data's Parties view opens the Party's panel, then drops `&party=`.
    expect(location.startsWith('/admin/masters?view=parties')).toBe(true)
  })

  it('Fixed settings: the holder, pricing kind and prepaid show and offer no Edit', () => {
    renderAt('/admin/contracts/CT-MER-FACELIFT')
    const fixed = card('contract-fixed')
    expect(within(fixed).getByText('Merivale Plastic Surgery')).toBeInTheDocument()
    expect(within(fixed).getByText('Fixed price')).toBeInTheDocument()
    expect(within(fixed).getByText('Prepaid').nextElementSibling).toHaveTextContent('No')
    expect(within(fixed).queryByRole('button', { name: /Edit/ })).toBeNull()
  })

  it('System Contract: No contract · RVG edits only its name, AA code and invoice description, and offers no Disable', () => {
    renderAt('/admin/contracts/CT-NO-CONTRACT')
    expect(card('contract-system-notice')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Disable' })).toBeNull()
    for (const shot of ['contract-price', 'contract-where', 'contract-bills', 'contract-fixed']) {
      expect(within(card(shot)).queryByRole('button', { name: /^Edit/ }), shot).toBeNull()
    }
    fireEvent.click(within(card('contract-codes')).getByRole('button', { name: 'Edit invoice and codes' }))
    const codes = card('contract-codes')
    expect(within(codes).getByLabelText('Name')).toBeInTheDocument()
    expect(within(codes).getByLabelText('AA code')).toBeInTheDocument()
    expect(within(codes).getByLabelText('Invoice description')).toBeInTheDocument()
    expect(within(codes).queryByLabelText('Holder reference')).toBeNull()
    expect(within(codes).queryByRole('button', { name: 'Choose the default RVG code' })).toBeNull()
    fireEvent.change(within(codes).getByLabelText('Invoice description'), { target: { value: 'Anaesthesia services' } })
    fireEvent.click(within(codes).getByRole('button', { name: 'Save' }))
    const entry = contractUpdates().at(-1)!
    expect(entry.entityId).toBe('CT-NO-CONTRACT')
    expect(Object.keys(entry.after as object)).toEqual(['invoiceDescription'])
  })
})

describe('who a Contract touches (US-04.1.7 "Who it touches")', () => {
  it('lists the Procedures not yet authorised, then the authorised ones at their locked price', () => {
    const state = useAppStore.getState()
    const id = Object.keys(state.masters.contracts).find((c) => {
      const t = onContract(state, c)
      return t.open.length >= 3 && t.authorised.length >= 1
    })!
    expect(id).toBeDefined()
    const touches = onContract(state, id)
    // The locked price is the lock's own figure for this Contract's Procedures.
    const lock = state.billing.locks[touches.authorised[0]!.bookingId]!
    const fromLock = lock.procedures.filter((p) => p.contract?.id === id).reduce((sum, p) => sum + p.price, 0)
    expect(touches.authorised[0]!.lockedPrice).toBeCloseTo(fromLock, 2)
    renderAt(contractPath(id, 'bookings'))
    const table = card('contract-bookings')
    expect(table.querySelectorAll('[data-on-contract="open"]')).toHaveLength(touches.open.length)
    const locked = table.querySelectorAll('[data-on-contract="authorised"]')
    expect(locked).toHaveLength(touches.authorised.length)
    expect(locked[0]!.textContent).toContain(formatMoney(touches.authorised[0]!.lockedPrice))
    expect(touches.authorised[0]!.lockedPrice).toBeGreaterThan(0)
    cleanup()
    renderAt(contractPath(id))
    expect(card('contract-on-this').textContent).toContain(String(touches.open.length + touches.authorised.length))
  })
})

describe('Disable, confirmed (US-04.1.2, DM-04)', () => {
  it('lists the Procedures from today before the change; confirming disables it and the Procedures keep it; Make active undoes it', () => {
    const state = useAppStore.getState()
    const today = state.clock.todayISO
    const id = Object.values(state.masters.contracts).find((c) => c.systemRole === undefined && c.status === 'active' && stillOnContract(state, c.id, today).length > 0)!.id
    const rows = stillOnContract(state, id, today)
    // Among them a Procedure dated in the next week.
    const nextWeek = rows.find((r) => r.dateISO > today && r.dateISO <= addDaysISO(today, 7))!
    expect(nextWeek).toBeDefined()
    renderAt(contractPath(id))
    fireEvent.click(screen.getByRole('button', { name: 'Disable' }))
    const sheet = card('contract-disable-sheet')
    expect(sheet.querySelectorAll('[data-shot="contract-still-on-row"]')).toHaveLength(rows.length)
    expect(sheet.querySelector(`[data-shot="contract-still-on-row"][data-booking-id="${nextWeek.bookingId}"]`)).not.toBeNull()
    // Keep it active changes nothing.
    fireEvent.click(within(sheet).getByRole('button', { name: 'Keep it active' }))
    expect(useAppStore.getState().masters.contracts[id]!.status).toBe('active')
    fireEvent.click(screen.getByRole('button', { name: 'Disable' }))
    fireEvent.click(within(card('contract-disable-sheet')).getByRole('button', { name: 'Disable' }))
    expect(useAppStore.getState().masters.contracts[id]!.status).toBe('disabled')
    expect(useAppStore.getState().schedule.procedures[nextWeek.procedureId]!.governingContractId).toBe(id)
    expect(card('contract-disabled-note')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Make active' }))
    expect(useAppStore.getState().masters.contracts[id]!.status).toBe('active')
  })
})

describe('the default RVG code picker over the invoice-and-codes card (U2, bug 1)', () => {
  function editAndOpenPicker() {
    renderAt('/admin/contracts/CT-CES-D1')
    fireEvent.click(within(card('contract-codes')).getByRole('button', { name: 'Edit invoice and codes' }))
    fireEvent.change(within(card('contract-codes')).getByLabelText('Name'), { target: { value: 'Edited before the picker' } })
    const choose = within(card('contract-codes')).getByRole('button', { name: 'Choose the default RVG code' })
    choose.focus()
    fireEvent.click(choose)
    expect(picker()).not.toBeNull()
  }

  it('one Escape closes the picker only; the card keeps its draft and focus returns', () => {
    editAndOpenPicker()
    escape()
    expect(picker()).toBeNull()
    expect(within(card('contract-codes')).getByLabelText('Name')).toHaveValue('Edited before the picker')
    expect(document.activeElement).toBe(within(card('contract-codes')).getByRole('button', { name: 'Choose the default RVG code' }))
  })

  it('with text in the search, Escape clears it first, then closes the picker', () => {
    editAndOpenPicker()
    const search = within(picker()!).getByRole('searchbox')
    fireEvent.change(search, { target: { value: 'H1' } })
    escape()
    expect(search).toHaveValue('')
    expect(picker()).not.toBeNull()
    escape()
    expect(picker()).toBeNull()
    expect(card('contract-codes').hasAttribute('data-editing')).toBe(true)
  })
})

describe('New contract, the create panel until 46', () => {
  it('opens from the list with the holder carried, and closing returns to the list', () => {
    renderAt('/admin/contracts?holder=PY-CES')
    fireEvent.click(screen.getByRole('button', { name: 'New contract' }))
    expect(location).toBe('/admin/contracts/new?holder=PY-CES')
    const panel = card('contract-detail')
    expect(within(panel).getByRole('heading', { name: 'New contract' })).toBeInTheDocument()
    expect(within(panel).getByLabelText('Holder')).toHaveValue('PY-CES')
    expect(within(panel).queryByRole('button', { name: 'Disable' })).toBeNull()
    act(() => escape())
    expect(location).toBe('/admin/contracts?group=holder&in=PY-CES')
  })

  it("keeps the list's search behind the panel", () => {
    renderAt('/admin/contracts')
    fireEvent.change(screen.getByLabelText('Search by name, code or AA code'), { target: { value: 'Face lift' } })
    fireEvent.click(screen.getByRole('button', { name: 'New contract' }))
    act(() => escape())
    expect(location).toBe('/admin/contracts')
    expect(screen.getByLabelText('Search by name, code or AA code')).toHaveValue('Face lift')
  })
})

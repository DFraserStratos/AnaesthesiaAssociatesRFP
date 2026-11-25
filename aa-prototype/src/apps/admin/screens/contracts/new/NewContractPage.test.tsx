/**
 * New contract (build plan Phase 46; US-04.1.2 New contract order and Similar
 * name): the page at `/admin/contracts/new`, filled in rule order, its live
 * rail, and Create landing on the new Contract's page by its id.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { CONTRACT_REFUSAL_MESSAGES, nextAaCode } from '../../../../../domain/billing/contracts'
import { PARTY } from '../../../../../domain/seed/parties'
import { TAG } from '../../../../../domain/seed'
import { SurfaceProvider } from '../../../../../shared'
import { createContract, freshAppState, OFFICE_ACTOR, useAppStore, type Actor } from '../../../../../store'
import { AdminContractRoute, AdminContractsRoute, AdminNewContractRoute } from '../../../routes'
import { PREPAID_BILLS_PAYER_HELPER } from './NewContractPage'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function Where() {
  const { pathname, search } = useLocation()
  return <div data-testid="where">{`${pathname}${search}`}</div>
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: '2026-11-24' }} />}>
            <Route path="contracts">
              <Route element={<AdminContractsRoute />}>
                <Route index element={null} />
              </Route>
              <Route path="new" element={<AdminNewContractRoute />} />
              <Route path=":contractId" element={<AdminContractRoute />} />
            </Route>
          </Route>
        </Routes>
        <Where />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement
const bills = () => within(screen.getByRole('group', { name: 'Bills' }))
const pressed = (group: ReturnType<typeof bills>) => group.getAllByRole('button').find((b) => b.getAttribute('aria-pressed') === 'true')?.textContent
const pickHolder = (id: string) => fireEvent.change(screen.getByLabelText('Holder'), { target: { value: id } })
const firstAnaesthetist = () => {
  const select = screen.getByLabelText('Linked anaesthetist') as HTMLSelectElement
  fireEvent.change(select, { target: { value: select.options[1]!.value } })
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('New contract page', () => {
  it('renders at /admin/contracts/new with four numbered steps and the three rail cards', () => {
    renderAt('/admin/contracts/new')
    expect(screen.getByRole('heading', { level: 1, name: 'New contract' })).toBeInTheDocument()
    expect(screen.getByText('Start with the holder')).toBeInTheDocument()
    const steps = [...document.querySelectorAll('[data-card-step]')].map((el) => el.getAttribute('data-card-step'))
    expect(steps).toEqual(['1', '2', '3', '4'])
    for (const name of ['Holder and who it bills', 'Pricing', 'Where it is offered', 'Name, codes and invoice wording', 'Where it will show', 'Already held', 'On save']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
    // Nothing is placed until a holder is chosen.
    expect(shot('contract-placement')).toBeNull()
  })

  it('?holder= prefills the holder; one that is not a Party is ignored', () => {
    const { unmount } = renderAt(`/admin/contracts/new?holder=${PARTY.merivale}`)
    expect(screen.getByLabelText('Holder')).toHaveValue(PARTY.merivale)
    expect(screen.getByText('For Merivale Plastic Surgery')).toBeInTheDocument()
    unmount()
    renderAt('/admin/contracts/new?holder=PY-NOPE')
    expect(screen.getByLabelText('Holder')).toHaveValue('')
    expect(screen.getByText('Start with the holder')).toBeInTheDocument()
  })

  it('an anaesthetist holder fixes Bills to the payer before Pricing is touched (New contract order)', () => {
    renderAt('/admin/contracts/new')
    pickHolder(PARTY.souter)
    expect(pressed(bills())).toBe('The payer')
    for (const b of bills().getAllByRole('button')) expect(b).toBeDisabled()
    expect(screen.getByText(CONTRACT_REFUSAL_MESSAGES.holderBillsPayer)).toBeInTheDocument()
    // Step 2 untouched: the first kind is still the one checked.
    expect(screen.getByRole('radio', { checked: true })).toHaveAttribute('data-pricing-kind', 'rvgAnaesthetistRate')
  })

  it('a hospital holder shows no link fields; a surgeon group may bill either', () => {
    renderAt('/admin/contracts/new')
    pickHolder(PARTY.stg)
    expect(screen.queryByLabelText('Linked anaesthetist')).toBeNull()
    expect(screen.getByText(CONTRACT_REFUSAL_MESSAGES.noLinksOnHospital)).toBeInTheDocument()
    pickHolder(PARTY.merivale)
    expect(screen.getByLabelText('Linked anaesthetist')).toBeInTheDocument()
    for (const b of bills().getAllByRole('button')) expect(b).toBeEnabled()
  })

  it('prepaid moves the kind to Fixed price, shows D23 under Bills and marks the RVG kinds', () => {
    renderAt(`/admin/contracts/new?holder=${PARTY.merivale}`)
    fireEvent.click(within(screen.getByRole('group', { name: 'Prepaid' })).getByRole('button', { name: 'Yes' }))
    expect(screen.getByRole('radio', { checked: true })).toHaveAttribute('data-pricing-kind', 'fixed')
    expect(screen.getByText(PREPAID_BILLS_PAYER_HELPER)).toBeInTheDocument()
    const rvg = document.querySelector('[data-pricing-kind="rvgDiscount"]')!
    expect(rvg).toHaveAttribute('aria-disabled', 'true')
    expect(rvg).toHaveTextContent(CONTRACT_REFUSAL_MESSAGES.prepaidNotRvg)
    // The override shows only on RVG kinds.
    expect(screen.queryByRole('group', { name: 'Anaesthetist may change the price' })).toBeNull()
    expect(screen.getByLabelText('Anaesthetist may change the price')).toHaveValue('Not on a fixed price')
  })

  it('Where it will show follows holder, Bills, prepaid and funding tag (D91: untagged hospital under Special)', () => {
    renderAt('/admin/contracts/new')
    pickHolder(PARTY.stg)
    expect(shot('contract-placement')).toHaveTextContent('Offered under Special')
    fireEvent.change(screen.getByLabelText('Funding tag'), { target: { value: TAG.acc } })
    expect(shot('contract-placement')).toHaveTextContent("Offered under St George's › ACC")
    fireEvent.click(bills().getByRole('button', { name: 'The payer' }))
    expect(shot('contract-placement')).toHaveTextContent('Offered under Patient')
    fireEvent.click(within(screen.getByRole('group', { name: 'Prepaid' })).getByRole('button', { name: 'Yes' }))
    expect(shot('contract-placement')).toHaveTextContent('Offered under Patient › Prepaid')
  })

  it('the criterion: a similar name is listed under Already held, and Create still lands on the new page with the next AA code', () => {
    const anaesthetistId = Object.keys(useAppStore.getState().masters.anaesthetists)[0]!
    const made = createContract(useAppStore, OFFICE_ACTOR, {
      name: 'Abdominoplasty, simple',
      holderId: PARTY.merivale,
      billsTo: 'payer',
      pricing: { kind: 'rvgAnaesthetistRate' },
      prepaid: false,
      anaesthetistMayOverridePrice: false,
      linkedSurgeonIds: [],
      linkedAnaesthetistId: anaesthetistId,
    })
    expect(made.ok).toBe(true)

    renderAt(`/admin/contracts/new?holder=${PARTY.merivale}`)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Abdominoplasty with liposuction' } })
    const held = shot('new-contract-held')
    const similar = held.querySelector('[data-similar]') as HTMLElement
    expect(similar).toHaveTextContent('Abdominoplasty, simple')
    expect(within(similar).getByText('Similar name')).toBeInTheDocument()

    // "Face lift" shows no pill.
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Face lift' } })
    expect([...held.querySelectorAll('[data-similar]')].some((el) => el.textContent?.includes('Abdominoplasty'))).toBe(false)
    expect(held).toHaveTextContent('Abdominoplasty, simple')
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Abdominoplasty with liposuction' } })

    fireEvent.click(bills().getByRole('button', { name: 'The payer' }))
    firstAnaesthetist()
    const expected = nextAaCode('MER', Object.values(useAppStore.getState().masters.contracts).map((c) => c.aaCode))
    expect(shot('new-contract-aa-code')).toHaveTextContent(expected)
    const before = useAppStore.getState().audit.filter((a) => a.action === 'contract.create').length
    fireEvent.click(screen.getByRole('button', { name: 'Create contract' }))

    const created = Object.values(useAppStore.getState().masters.contracts).find((c) => c.name === 'Abdominoplasty with liposuction')!
    expect(created.aaCode).toBe(expected)
    expect(useAppStore.getState().audit.filter((a) => a.action === 'contract.create').length).toBe(before + 1)
    expect(screen.getByTestId('where')).toHaveTextContent(`/admin/contracts/${created.id}`)
    expect(screen.getByRole('heading', { level: 1, name: /Abdominoplasty with liposuction/ })).toBeInTheDocument()
  })

  it('a refusal from the guard shows in place, in the store words (a missing name)', () => {
    renderAt(`/admin/contracts/new?holder=${PARTY.merivale}`)
    fireEvent.click(bills().getByRole('button', { name: 'The payer' }))
    firstAnaesthetist()
    fireEvent.click(screen.getByRole('button', { name: 'Create contract' }))
    expect(screen.getByRole('alert')).toHaveTextContent(CONTRACT_REFUSAL_MESSAGES.nameRequired)
    expect(screen.getByTestId('where')).toHaveTextContent('/admin/contracts/new')
  })
})

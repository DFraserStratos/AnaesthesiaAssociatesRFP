import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, resetDomainState, useAppStore, type Actor } from '../../../store'
import { AaFeesScreen } from './AaFeesScreen'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderTab(tab: 'invoices' | 'settings') {
  render(
    <MemoryRouter>
      <AaFeesScreen actor={OFFICE} tab={tab} />
    </MemoryRouter>,
  )
}

describe('AA fee invoices screen (catch-up Phase 16)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('previews every active anaesthetist for the month and a run adds their invoices', () => {
    renderTab('invoices')
    const active = Object.values(useAppStore.getState().masters.anaesthetists).filter((a) => a.active).length
    const preview = screen.getByTestId('aa-fee-preview')
    expect(within(preview).getAllByTestId(/^aa-fee-preview-/)).toHaveLength(active)
    expect(screen.getAllByTestId(/^aa-fee-row-/)).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Run monthly fee invoices' }))
    expect(screen.getByRole('status')).toHaveTextContent(`Raised ${active} fee invoices for July 2026`)
    expect(screen.getAllByTestId(/^aa-fee-row-/)).toHaveLength(2 + active)
    expect(screen.getByRole('button', { name: 'Run monthly fee invoices' })).toBeDisabled()
    expect(screen.getByText('Every active anaesthetist already has a fee invoice for July 2026.')).toBeInTheDocument()
  })

  it('shows the seeded fee history paid and unpaid, and expands a row to its counted BCTIs', () => {
    renderTab('invoices')
    expect(screen.getByTestId('aa-fee-row-AA-FEE-2026-H01')).toHaveTextContent('Paid 5 Jun 2026')
    expect(screen.getByTestId('aa-fee-row-AA-FEE-2026-H02')).toHaveTextContent('Unpaid')
    fireEvent.click(screen.getByRole('button', { name: 'Show AA-FEE-2026-H01 details' }))
    const detail = screen.getByTestId('aa-fee-detail-AA-FEE-2026-H01')
    expect(detail).toHaveTextContent('Counted BCTIs (2)')
    expect(detail).toHaveTextContent('BCTIs paid in May 2026: 2 x $5.00')
  })

  it('steps months back but never past the demo month', () => {
    renderTab('invoices')
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByTestId('aa-fee-month')).toHaveTextContent('June 2026')
    // Dr Souter already has June's fee invoice.
    expect(screen.getByTestId('aa-fee-preview-34821')).toHaveTextContent('AA-FEE-2026-H02')
  })
})

describe('AA fee settings screen (catch-up Phase 16)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('adds and removes an item, refuses an invalid amount, and saves audited', () => {
    renderTab('settings')
    expect(screen.getByTestId('aa-fee-example')).toHaveTextContent('$500.00 + $5.00 x 40 = $700.00')
    fireEvent.click(screen.getByRole('button', { name: /Add item/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Fixed item 3 needs a description.')
    fireEvent.change(screen.getByLabelText('Fixed item 3 description'), { target: { value: 'Software licence' } })
    fireEvent.change(screen.getByLabelText('Fixed item 3 amount'), { target: { value: '-4' } })
    expect(screen.getByRole('alert')).toHaveTextContent('zero or more')
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Fixed item 3 amount'), { target: { value: '25' } })
    expect(screen.getByTestId('aa-fee-example')).toHaveTextContent('$525.00 + $5.00 x 40 = $725.00')

    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(screen.getByRole('status')).toHaveTextContent('Fee settings saved')
    expect(useAppStore.getState().appSettings.aaFee.fixedItems).toHaveLength(3)
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('aaFee.settingsChanged')

    fireEvent.click(screen.getByRole('button', { name: 'Remove Software licence' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(useAppStore.getState().appSettings.aaFee.fixedItems).toHaveLength(2)
  })

  it('re-syncs the form when the stored settings change, for example after a Reset', () => {
    renderTab('settings')
    fireEvent.change(screen.getByLabelText('Charge per BCTI paid that month (ex GST)'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(screen.getByLabelText('Charge per BCTI paid that month (ex GST)')).toHaveValue('9.00')
    act(() => resetDomainState(useAppStore))
    expect(screen.getByLabelText('Charge per BCTI paid that month (ex GST)')).toHaveValue('5.00')
    expect(screen.getByTestId('aa-fee-example')).toHaveTextContent('= $700.00')
  })
})

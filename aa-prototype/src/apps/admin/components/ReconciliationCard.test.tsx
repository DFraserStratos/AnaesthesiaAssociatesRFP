import { act, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { advanceClockDays, freshAppState, receiveBulkRemittance, useAppStore } from '../../../store'
import { injectUnmatchedReceipt } from '../../../store/ledgerDemo'
import { ReconciliationCard } from './ReconciliationCard'

function renderCard() {
  render(
    <MemoryRouter>
      <ReconciliationCard />
    </MemoryRouter>,
  )
  return () => document.querySelector('[data-shot="dashboard-reconciliation"]') as HTMLElement
}

describe('Reconciliation card (catch-up Phase 37; US-13.2.4)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('reads Books square from reset, with the Proposed caption', () => {
    const card = renderCard()
    expect(within(card()).getByRole('status')).toHaveTextContent('Books square')
    expect(card()).toHaveAttribute('data-status', 'square')
    expect(card()).toHaveTextContent('Proposed')
    expect(card().querySelectorAll('[data-shot="reconciliation-item"]')).toHaveLength(0)
  })

  it('an injected receipt puts it out of balance with one item whose age grows with the clock; it links to the Ledger', () => {
    const card = renderCard()
    act(() => {
      injectUnmatchedReceipt(useAppStore, 'souter')
    })
    expect(within(card()).getByRole('status')).toHaveTextContent('Out of balance')
    expect(card()).toHaveTextContent('Ledger')
    expect(card()).toHaveTextContent('off by $120.00')
    const item = () => card().querySelector('[data-shot="reconciliation-item"]') as HTMLElement
    expect(item()).toHaveTextContent('0 days')
    expect(item()).toHaveAttribute('href', '/admin/ledger')
    act(() => {
      advanceClockDays(useAppStore, 1)
    })
    expect(item()).toHaveTextContent('1 day')
  })

  it("lists the remittance's unmatched Xero bank line, linking to Bank reconciliation", () => {
    const card = renderCard()
    act(() => {
      receiveBulkRemittance(useAppStore)
    })
    const items = card().querySelectorAll('[data-shot="reconciliation-item"]')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('$980.00')
    expect(items[0]).toHaveAttribute('href', '/demo/xero/bank')
    expect(screen.getByText('Xero bank lines')).toBeInTheDocument()
  })
})

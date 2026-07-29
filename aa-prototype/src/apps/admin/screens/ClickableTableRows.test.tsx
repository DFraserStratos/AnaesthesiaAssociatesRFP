import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, isBackdropInvoice, useAppStore, type Actor } from '../../../store'
import { InvoicesScreen } from './InvoicesScreen'
import { ReviewQueue } from './ReviewQueue'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

describe('admin clickable table rows', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('opens a review when the review queue row is clicked', () => {
    const onOpen = vi.fn()
    render(<ReviewQueue onOpen={onOpen} onViewInvoices={vi.fn()} />)

    const row = screen.getByTestId('review-queue-table-shell').querySelector('tbody tr')
    expect(row).toHaveClass('aa-clickable-table-row')
    expect(row?.querySelector('td')).toHaveStyle({ verticalAlign: 'middle' })

    fireEvent.click(row!)
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('opens an invoice when its row is clicked', () => {
    const onSelect = vi.fn()
    const invoice = Object.values(useAppStore.getState().billing.invoices)
      .filter((candidate) => !isBackdropInvoice(candidate))
      .sort((a, b) => b.id.localeCompare(a.id))[0]!

    render(
      <MemoryRouter>
        <InvoicesScreen actor={OFFICE} selectedInvoiceId={null} onSelect={onSelect} />
      </MemoryRouter>,
    )

    const row = screen.getByTestId('invoice-list-table-shell').querySelector('tbody tr')
    expect(row).toHaveClass('aa-clickable-table-row')

    fireEvent.click(row!)
    expect(onSelect).toHaveBeenCalledWith(invoice.id)
  })

  it('leaves the invoice row list link in charge of its own navigation', () => {
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
        <InvoicesScreen actor={OFFICE} selectedInvoiceId={null} onSelect={onSelect} />
      </MemoryRouter>,
    )

    const row = screen.getByTestId('invoice-list-table-shell').querySelector('tbody tr')!
    fireEvent.click(row.querySelector('a')!)

    expect(onSelect).not.toHaveBeenCalled()
  })
})

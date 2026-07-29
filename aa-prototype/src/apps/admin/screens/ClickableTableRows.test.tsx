import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, isBackdropInvoice, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { AdminCardDetailRoute } from '../routes'
import { InvoicesScreen } from './InvoicesScreen'
import { ReviewQueue } from './ReviewQueue'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function LocationProbe() {
  const location = useLocation()
  const fromInvoiceId =
    typeof location.state === 'object' &&
    location.state !== null &&
    'fromInvoiceId' in location.state &&
    typeof location.state.fromInvoiceId === 'string'
      ? location.state.fromInvoiceId
      : ''
  return <output data-testid="location-probe" data-from-invoice-id={fromInvoiceId}>{location.pathname}</output>
}

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

  it('links the patient and card to the underlying card without opening the invoice row', () => {
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
        <InvoicesScreen actor={OFFICE} selectedInvoiceId={null} onSelect={onSelect} />
        <LocationProbe />
      </MemoryRouter>,
    )

    const row = screen.getByTestId('invoice-list-table-shell').querySelector('tbody tr')!
    const invoice = Object.values(useAppStore.getState().billing.invoices)
      .filter((candidate) => !isBackdropInvoice(candidate))
      .sort((a, b) => b.id.localeCompare(a.id))[0]!
    const card = useAppStore.getState().schedule.cards[invoice.cardId]!
    const list = useAppStore.getState().schedule.lists[card.listId]!
    const patientLink = row.querySelectorAll('a')[0]!

    fireEvent.click(patientLink)

    expect(screen.getByTestId('location-probe')).toHaveTextContent(`/admin/day/${list.dateISO}/cards/${card.id}`)
    expect(screen.getByTestId('location-probe')).toHaveAttribute('data-from-invoice-id', invoice.id)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('renders the list as a compact neutral entity link', () => {
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
        <InvoicesScreen actor={OFFICE} selectedInvoiceId={null} onSelect={onSelect} />
      </MemoryRouter>,
    )

    const row = screen.getByTestId('invoice-list-table-shell').querySelector('tbody tr')!
    const listLink = row.querySelectorAll('a')[1]!

    expect(listLink).toHaveClass('aa-table-entity-link')
    expect(listLink).not.toHaveAttribute('style')
    fireEvent.click(listLink)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('returns an invoice-origin card to that exact invoice', () => {
    const invoice = Object.values(useAppStore.getState().billing.invoices)
      .filter((candidate) => !isBackdropInvoice(candidate))[0]!
    const card = useAppStore.getState().schedule.cards[invoice.cardId]!
    const list = useAppStore.getState().schedule.lists[card.listId]!

    render(
      <MemoryRouter
        initialEntries={[{
          pathname: `/admin/day/${list.dateISO}/cards/${card.id}`,
          state: { fromInvoiceId: invoice.id },
        }]}
      >
        <SurfaceProvider variant="web">
          <Routes>
            <Route
              path="/admin"
              element={<Outlet context={{ actor: OFFICE, todayISO: '2026-07-21' }} />}
            >
              <Route path="day/:dateISO/cards/:cardId" element={<AdminCardDetailRoute />} />
              <Route path="invoices/:invoiceId" element={<div>Returned to invoice</div>} />
            </Route>
          </Routes>
        </SurfaceProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: `Invoice ${invoice.invoiceNumber}` }))
    expect(screen.getByText('Returned to invoice')).toBeInTheDocument()
  })
})

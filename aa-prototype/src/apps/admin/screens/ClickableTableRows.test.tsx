import { fireEvent, render, screen } from '@testing-library/react'
import { SEED_STUB } from '../../../domain/seed/intakeSeed'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assessImportRow, decideImportRow, freshAppState, importHospitalDownload, isBackdropInvoice, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { AdminBookingDetailRoute } from '../routes'
import { InvoicesScreen } from './InvoicesScreen'
import { MatchingScreen } from './MatchingScreen'
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
    render(<MemoryRouter><ReviewQueue onOpen={onOpen} onViewInvoices={vi.fn()} /></MemoryRouter>)

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

  it('links the patient and booking to the underlying booking without opening the invoice row', () => {
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
    const booking = useAppStore.getState().schedule.bookings[invoice.bookingId]!
    const list = useAppStore.getState().schedule.lists[booking.listId]!
    const patientLink = row.querySelectorAll('a')[0]!

    fireEvent.click(patientLink)

    expect(screen.getByTestId('location-probe')).toHaveTextContent(`/admin/day/${list.dateISO}/bookings/${booking.id}`)
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

  it('returns an invoice-origin booking to that exact invoice', () => {
    const invoice = Object.values(useAppStore.getState().billing.invoices)
      .filter((candidate) => !isBackdropInvoice(candidate))[0]!
    const booking = useAppStore.getState().schedule.bookings[invoice.bookingId]!
    const list = useAppStore.getState().schedule.lists[booking.listId]!

    render(
      <MemoryRouter
        initialEntries={[{
          pathname: `/admin/day/${list.dateISO}/bookings/${booking.id}`,
          state: { fromInvoiceId: invoice.id },
        }]}
      >
        <SurfaceProvider variant="web">
          <Routes>
            <Route
              path="/admin"
              element={<Outlet context={{ actor: OFFICE, todayISO: '2026-11-24' }} />}
            >
              <Route path="day/:dateISO/bookings/:bookingId" element={<AdminBookingDetailRoute />} />
              <Route path="invoices/:invoiceId" element={<div>Returned to invoice</div>} />
            </Route>
          </Routes>
        </SurfaceProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: `Invoice ${invoice.invoiceNumber}` }))
    expect(screen.getByText('Returned to invoice')).toBeInTheDocument()
  })

  it('opens a hospital row on Matching when its row is clicked (catch-up Phase 33)', () => {
    importHospitalDownload(useAppStore, OFFICE, 'SAMPLE_STG')
    render(
      <MemoryRouter>
        <SurfaceProvider variant="web">
          <MatchingScreen actor={OFFICE} todayISO="2026-11-24" onOpenBooking={vi.fn()} />
        </SurfaceProvider>
      </MemoryRouter>,
    )

    const row = screen.getByTestId('matching-table-shell').querySelector('tbody tr')!
    expect(row).toHaveClass('aa-clickable-table-row')
    fireEvent.click(row)
    expect(screen.getByTestId('matching-panel')).toHaveAttribute('data-import-row-id', row.getAttribute('data-import-row-id'))
  })

  it("links a Booking made from a hospital row back to that row on Matching (catch-up Phase 33)", () => {
    importHospitalDownload(useAppStore, OFFICE, 'SAMPLE_STG')
    const rowId = useAppStore.getState().intake.batches[Object.keys(useAppStore.getState().intake.batches).find((id) => id !== SEED_STUB.batchId)!]!.rowIds[0]!
    const suggestion = assessImportRow(useAppStore.getState(), rowId)?.suggestion
    const listId = suggestion?.kind === 'createBooking' ? suggestion.listId : ''
    const out = decideImportRow(useAppStore, OFFICE, rowId, { kind: 'createBooking', listId })
    expect(out.ok).toBe(true)
    const bookingId = out.ok ? out.value.bookingId! : ''

    render(
      <MemoryRouter initialEntries={[`/admin/day/2026-12-01/bookings/${bookingId}`]}>
        <SurfaceProvider variant="web">
          <Routes>
            <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: '2026-11-24' }} />}>
              <Route path="day/:dateISO/bookings/:bookingId" element={<AdminBookingDetailRoute />} />
            </Route>
          </Routes>
          <LocationProbe />
          <SelectRowProbe />
        </SurfaceProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: `From hospital row ${rowId}` }))
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/admin/intake/matching')
    expect(screen.getByTestId('select-row-probe')).toHaveTextContent(rowId)
  })
})

function SelectRowProbe() {
  const { state } = useLocation()
  const id = typeof state === 'object' && state !== null && 'selectRowId' in state ? String(state.selectRowId) : ''
  return <output data-testid="select-row-probe">{id}</output>
}

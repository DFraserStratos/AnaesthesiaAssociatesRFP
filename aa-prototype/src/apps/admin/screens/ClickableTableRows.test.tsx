import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, MemoryRouter, Outlet, Route, RouterProvider, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { assessImportRow, decideImportRow, freshAppState, isBackdropInvoice, useAppStore, type Actor } from '../../../store'
import { receiveSample } from '../../../test/intakeSamples'
import { SAMPLE_STG } from '../../../domain/intake/hospitalDownloads'
import { SurfaceProvider } from '../../../shared'
import { arrivalKeyForRow } from '../../../store/intakeSelectors'
import { AdminApp } from '../AdminApp'
import { AdminBookingDetailRoute } from '../routes'
import { listsRoutes } from '../../../test/adminRoutes'
import { InvoicesScreen } from './InvoicesScreen'
import { listsPath, reviewPath } from './lists/listsPaths'
import { invoicePath } from './finances/financePaths'
import { allInvoiceRows, bookingDayLine, invoiceList } from './invoiceListRows'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

/** The Invoices tab's first row as it opens: the oldest unpaid invoice. */
function firstUnpaidRow() {
  const state = useAppStore.getState()
  return invoiceList(allInvoiceRows(state, state.clock.todayISO), { show: 'unpaid' })[0]!
}

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

  it("opens a List's review when its To authorise row is clicked", () => {
    const router = createMemoryRouter(
      createRoutesFromElements(
        <Route path="/admin" element={<AdminApp />}>
          {listsRoutes()}
        </Route>,
      ),
      { initialEntries: [listsPath('to-authorise')] },
    )
    render(<RouterProvider router={router} />)

    const row = screen.getByTestId('review-queue-table-shell').querySelector('tbody tr')
    expect(row).toHaveClass('aa-clickable-table-row')
    expect(row?.querySelector('td')).toHaveStyle({ verticalAlign: 'middle' })

    const listId = row!.getAttribute('data-list-id')!
    fireEvent.click(row!)
    expect(router.state.location.pathname).toBe(reviewPath(listId))
  })

  it('opens an invoice on its own page when its row is clicked', () => {
    // The tab opens on Unpaid, oldest first.
    const invoice = firstUnpaidRow()

    render(
      <MemoryRouter initialEntries={['/admin/finances/invoices']}>
        <InvoicesScreen actor={OFFICE} />
        <LocationProbe />
      </MemoryRouter>,
    )

    const row = screen.getByTestId('invoice-list-table-shell').querySelector('tbody tr')
    expect(row).toHaveClass('aa-clickable-table-row')
    expect(row).toHaveAttribute('data-invoice-id', invoice.id)

    fireEvent.click(row!)
    expect(screen.getByTestId('location-probe')).toHaveTextContent(invoicePath(invoice.id))
  })

  it('links the patient and booking to the underlying booking without opening the invoice row', () => {
    render(
      <MemoryRouter initialEntries={['/admin/finances/invoices']}>
        <InvoicesScreen actor={OFFICE} />
        <LocationProbe />
      </MemoryRouter>,
    )

    const row = screen.getByTestId('invoice-list-table-shell').querySelector('tbody tr')!
    const invoice = firstUnpaidRow()
    const booking = useAppStore.getState().schedule.bookings[invoice.bookingId]!
    const list = useAppStore.getState().schedule.lists[booking.listId]!
    const patientLink = row.querySelectorAll('a')[0]!

    fireEvent.click(patientLink)

    expect(screen.getByTestId('location-probe')).toHaveTextContent(`/admin/day/${list.dateISO}/bookings/${booking.id}`)
    expect(screen.getByTestId('location-probe')).toHaveAttribute('data-from-invoice-id', invoice.id)
    expect(screen.getByTestId('location-probe')).not.toHaveTextContent(invoicePath(invoice.id))
  })

  it("renders the Booking link as the row's only compact neutral entity link", () => {
    render(
      <MemoryRouter initialEntries={['/admin/finances/invoices']}>
        <InvoicesScreen actor={OFFICE} />
        <LocationProbe />
      </MemoryRouter>,
    )

    const row = screen.getByTestId('invoice-list-table-shell').querySelector('tbody tr')!
    const invoice = firstUnpaidRow()
    // The number is a button (the row's keyboard handle); the List column and its link are gone.
    const links = row.querySelectorAll('a')
    expect(links).toHaveLength(1)
    const bookingLink = links[0]!
    expect(bookingLink).toHaveClass('aa-table-entity-link')
    expect(bookingLink).not.toHaveAttribute('style')
    expect(bookingLink).toHaveAttribute('aria-label', `View booking for ${invoice.patientName}, ${bookingDayLine(invoice)}`)
    expect(row.querySelector('button')).toHaveAccessibleName(`View invoice ${invoice.number}`)
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
              <Route path="finances/invoices/:invoiceId" element={<div>Returned to invoice</div>} />
            </Route>
          </Routes>
        </SurfaceProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: `Invoice ${invoice.invoiceNumber}` }))
    expect(screen.getByText('Returned to invoice')).toBeInTheDocument()
  })

  it("links a Booking made from a hospital row back to that row's arrival at Intake (catch-up Phase 33; Phase 68)", () => {
    const rowId = receiveSample(useAppStore, SAMPLE_STG).rowIds[0]!
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
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/admin/intake')
    expect(screen.getByTestId('select-row-probe')).toHaveTextContent(arrivalKeyForRow(useAppStore.getState(), rowId)!)
  })
})

/** The Intake link's query (Phase 68): the filter and the selected arrival. */
function SelectRowProbe() {
  const { pathname } = useLocation()
  const opened = pathname.match(/^\/admin\/intake\/arrival\/(.+)$/)
  return <output data-testid="select-row-probe">{opened !== null ? decodeURIComponent(opened[1]!) : ''}</output>
}

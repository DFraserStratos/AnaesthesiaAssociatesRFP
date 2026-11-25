/**
 * Invoices and Audit at full scale (catch-up Phase 43, build plan Phase 62; US-15.0.4, US-08.4.7):
 * Invoices pages at 50 rows (credit notes count as rows) over the default Unpaid filter, and its
 * search filters before paging; Audit pages at 100 and a filter returns to page 1; neither shows a
 * pager at demo scale.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, describe, expect, it } from 'vitest'
import { freshAppState, isBackdropInvoice, useAppStore, type Actor, type AppState } from '../../../store'
import type { CreditNote } from '../../../domain/types'
import { buildFullScaleDataset } from '../../../domain/seed/fullScale'
import { formatCount } from '../../../shared/format'
import { InvoicesScreen } from './InvoicesScreen'
import { allInvoiceRows, invoiceList } from './invoiceListRows'
import { AuditViewer } from './AuditViewer'
import { SurfaceProvider } from '../../../shared'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
let full: AppState

beforeAll(() => {
  full = buildFullScaleDataset(freshAppState(), { todayISO: '2026-11-24' }).state
}, 120_000)

function invoices(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/admin/finances/invoices${search}`]}>
      <SurfaceProvider variant="web">
        <InvoicesScreen actor={OFFICE} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const range = (root: ParentNode) => root.querySelector('[data-shot="invoices-pager"] [data-pager-range]')?.textContent ?? ''

describe('Invoices pages and searches', () => {
  it('no pager at demo scale', () => {
    useAppStore.setState(freshAppState())
    const { container } = invoices()
    expect(container.querySelector('[data-shot="invoices-pager"]')).toBeNull()
  })

  it('pages the Unpaid rows 50 at a time, and a search by number pins its rows before paging', () => {
    useAppStore.setState(full)
    const all = allInvoiceRows(full, full.clock.todayISO)
    const unpaid = invoiceList(all, { show: 'unpaid' })
    expect(unpaid.length).toBeGreaterThan(1000)
    const { container } = invoices()
    const table = screen.getByTestId('invoice-list-table-shell')
    expect(within(table).getAllByRole('row').length).toBe(51)
    expect(range(container)).toBe(`Showing 1 to 50 of ${formatCount(unpaid.length)}`)
    fireEvent.click(screen.getAllByLabelText('Next page')[0]!)
    expect(range(container)).toBe(`Showing 51 to 100 of ${formatCount(unpaid.length)}`)

    // A number off page 2 finds its invoice (its -P payable number shares the key), back on page 1 with no pager.
    const target = unpaid[60]!
    const pinned = invoiceList(all, { show: 'unpaid', q: target.number! })
    expect(pinned.map((r) => r.id)).toContain(target.id)
    expect(pinned.length).toBeLessThan(50)
    fireEvent.change(screen.getByLabelText('Search invoices'), { target: { value: target.number! } })
    const rows = within(screen.getByTestId('invoice-list-table-shell')).getAllByRole('row').slice(1)
    expect(rows.map((r) => r.getAttribute('data-invoice-id'))).toEqual(pinned.map((r) => r.id))
    expect(container.querySelector('[data-shot="invoices-pager"]')).toBeNull()
  }, 60_000)

  it('under All a credit note is a row of its own the pager counts, directly above the invoice it credits: a search pins the two', () => {
    // The full-scale credit notes are all seeded history: credit one live invoice (a copy; the state is shared).
    const invoice = Object.values(full.billing.invoices).find((i) => !isBackdropInvoice(i) && i.kind === 'standard')!
    const seeded = Object.values(full.billing.creditNotes)[0]!
    const note: CreditNote = { ...seeded, id: 'CRN-FS1', creditNoteNumber: 'CN-2026-F001', originalInvoiceId: invoice.id, bookingId: invoice.bookingId, counterparty: invoice.counterparty }
    const state: AppState = { ...full, billing: { ...full.billing, creditNotes: { ...full.billing.creditNotes, [note.id]: note } } }
    useAppStore.setState(state)
    const all = allInvoiceRows(state, state.clock.todayISO)
    const everything = invoiceList(all, { show: 'all' })
    expect(everything.map((r) => r.id)).toContain('CRN-FS1')
    expect(everything.length).toBe(invoiceList(allInvoiceRows(full, full.clock.todayISO), { show: 'all' }).length + 1)
    const { container } = invoices('?show=all')
    expect(range(container)).toBe(`Showing 1 to 50 of ${formatCount(everything.length)}`)
    fireEvent.change(screen.getByLabelText('Search invoices'), { target: { value: 'CN-2026-F001' } })
    const rows = within(screen.getByTestId('invoice-list-table-shell')).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveAttribute('data-credit-note-id', 'CRN-FS1')
    expect(rows[1]).toHaveAttribute('data-invoice-id', invoice.id)
    expect(container.querySelector('[data-shot="invoices-pager"]')).toBeNull()
  }, 60_000)
})

describe('Audit pages', () => {
  it('pages of 100 over tens of thousands; the newest entry is the load; a filter returns to page 1', () => {
    useAppStore.setState(full)
    const { container } = render(
      <MemoryRouter>
        <AuditViewer />
      </MemoryRouter>,
    )
    const range = () => container.querySelector('[data-shot="audit-pager"] [data-pager-range]')?.textContent ?? ''
    expect(range()).toMatch(/^Showing 1 to 100 of 1\d\d,\d{3}$/)
    expect(screen.getAllByText('Full-scale data loaded').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(range()).toMatch(/^Showing 101 to 200/)
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'office' } })
    expect(range()).toMatch(/^Showing 1 to 100 of/)
  }, 60_000)
})

/**
 * The Invoices tab's filters and search (build plan Phase 62; US-08.4.7): it opens on Unpaid,
 * `?view=approval` opens Awaiting approval, a filter pill changes the list and the URL. Search
 * finds an invoice or a credit note by its own number, and a credit note rides directly above the
 * invoice it credits. A credit note of an invoice the list leaves out lists under All only, while
 * it matches.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, isBackdropInvoice, useAppStore, type Actor, type AppState } from '../../../store'
import type { CreditNote } from '../../../domain/types'
import { InvoicesScreen } from './InvoicesScreen'
import { allInvoiceRows, invoiceList } from './invoiceListRows'
import { SurfaceProvider } from '../../../shared'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

/** The pristine seed plus a credit note on a live invoice (the seed's only one credits Dr Sharma's history). */
function withLiveCreditNote(): { state: AppState; invoiceNumber: string; seeded: CreditNote } {
  // A copy: the starting state is shared (and frozen under test).
  const start = freshAppState()
  const state: AppState = { ...start, billing: { ...start.billing } }
  const seeded = Object.values(state.billing.creditNotes)[0]!
  const invoice = Object.values(state.billing.invoices).filter((i) => !isBackdropInvoice(i)).sort((a, b) => a.id.localeCompare(b.id))[0]!
  const note: CreditNote = { ...seeded, id: 'CRN-T1', creditNoteNumber: 'CN-2026-T001', originalInvoiceId: invoice.id, bookingId: invoice.bookingId, counterparty: invoice.counterparty }
  state.billing.creditNotes = { ...state.billing.creditNotes, [note.id]: note }
  return { state, invoiceNumber: invoice.invoiceNumber, seeded }
}

function SearchProbe() {
  return <output data-testid="search-probe">{useLocation().search}</output>
}

function renderInvoices(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/admin/finances/invoices${search}`]}>
      <SurfaceProvider variant="web">
        <InvoicesScreen actor={OFFICE} />
        <SearchProbe />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const search = (value: string) => fireEvent.change(screen.getByLabelText('Search invoices'), { target: { value } })
const table = () => screen.getByTestId('invoice-list-table-shell')
const bodyRows = () => within(table()).getAllByRole('row').slice(1)
const tabs = (root: ParentNode) => root.querySelector<HTMLElement>('[data-shot="invoices-tabs"]')!
const pill = (root: ParentNode, view: string) => tabs(root).querySelector(`[data-view="${view}"]`)!.closest('button')!
const today = () => useAppStore.getState().clock.todayISO

describe('the Invoices tab opens on Unpaid, and its filters', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('opens on Unpaid with no URL key: still owing only, oldest first', () => {
    const all = allInvoiceRows(useAppStore.getState(), today())
    // The seed has paid invoices for the default to leave out.
    expect(all.some((r) => r.kind !== 'creditNote' && r.state === 'paid')).toBe(true)
    const { container } = renderInvoices()
    expect(tabs(container)).toHaveAttribute('data-invoices-view', 'unpaid')
    expect(pill(container, 'unpaid')).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('[data-shot="invoice-list-state"][data-state="paid"]')).toBeNull()
    expect(container.querySelector('tr[data-credit-note-id]')).toBeNull()
    const expected = invoiceList(all, { show: 'unpaid' }).map((r) => r.id)
    expect(expected.length).toBeGreaterThan(0)
    expect(bodyRows().map((r) => r.getAttribute('data-invoice-id'))).toEqual(expected.slice(0, bodyRows().length))
    for (const row of bodyRows()) expect(row.querySelector('[data-shot="invoice-list-state"]')?.getAttribute('data-state')).toMatch(/^(unpaid|partPaid)$/)
  })

  it('opens Awaiting approval from ?view=approval', () => {
    const { container } = renderInvoices('?view=approval')
    expect(tabs(container)).toHaveAttribute('data-invoices-view', 'approval')
    expect(container.querySelector('[data-shot="invoices-awaiting-approval"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-shot="awaiting-approval-row"]').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('invoice-list-table-shell')).toBeNull()
  })

  it('a filter pill changes the list and the URL; Unpaid writes no key', () => {
    const { container } = renderInvoices()
    fireEvent.click(pill(container, 'paid'))
    expect(tabs(container)).toHaveAttribute('data-invoices-view', 'paid')
    expect(screen.getByTestId('search-probe')).toHaveTextContent('?show=paid')
    const states = [...container.querySelectorAll('[data-shot="invoice-list-state"]')].map((el) => el.getAttribute('data-state'))
    expect(states.length).toBeGreaterThan(0)
    expect(new Set(states)).toEqual(new Set(['paid']))

    fireEvent.click(pill(container, 'approval'))
    expect(container.querySelector('[data-shot="invoices-awaiting-approval"]')).not.toBeNull()
    expect(screen.getByTestId('search-probe')).toHaveTextContent('?show=approval')

    fireEvent.click(pill(container, 'unpaid'))
    expect(tabs(container)).toHaveAttribute('data-invoices-view', 'unpaid')
    expect(screen.getByTestId('search-probe').textContent).toBe('')
  })
})

describe('Invoices search and credit notes', () => {
  beforeEach(() => {
    useAppStore.setState(withLiveCreditNote().state)
  })

  it('finds a credited invoice by its number under All, its credit note directly above it', () => {
    const { invoiceNumber } = withLiveCreditNote()
    renderInvoices('?show=all')
    search(invoiceNumber)
    const rows = bodyRows()
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveAttribute('data-credit-note-id', 'CRN-T1')
    expect(rows[1]).toHaveTextContent(invoiceNumber)
    expect(screen.getByTestId('search-probe')).toHaveTextContent(`q=${invoiceNumber}`)
  })

  it('finds a credit note by its own number under Paid, shown above the invoice it credits', () => {
    const { invoiceNumber } = withLiveCreditNote()
    const { container } = renderInvoices('?show=paid')
    search('CN-2026-T001')
    const rows = bodyRows()
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveAttribute('data-credit-note-id', 'CRN-T1')
    expect(rows[1]).toHaveTextContent(invoiceNumber)
    expect(rows[1]!.querySelector('[data-shot="invoice-list-state"]')).toHaveAttribute('data-state', 'paid')
    expect(container.textContent).not.toContain('No invoice matches')
  })

  it('a credited invoice is not under the default Unpaid', () => {
    const { container } = renderInvoices()
    search('CN-2026-T001')
    expect(container.querySelector('[data-credit-note-id="CRN-T1"]')).toBeNull()
    expect(container.textContent).toContain('No invoice matches')
  })

  it('lists a credit note of an invoice the list leaves out under All only, while it matches the search', () => {
    const { seeded } = withLiveCreditNote()
    // the seeded history's credit note is a backdrop one: give it a live id so it lists loose
    const loose: CreditNote = { ...seeded, id: 'CRN-T2', creditNoteNumber: 'CN-2026-T002' }
    useAppStore.setState((s) => ({ billing: { ...s.billing, creditNotes: { ...s.billing.creditNotes, [loose.id]: loose } } }))

    // Not under the default Unpaid, nor under Paid.
    const first = renderInvoices()
    expect(first.container.querySelector('[data-credit-note-id="CRN-T2"]')).toBeNull()
    first.unmount()
    const paid = renderInvoices('?show=paid')
    expect(paid.container.querySelector('[data-credit-note-id="CRN-T2"]')).toBeNull()
    paid.unmount()

    // Under All, at the top.
    const { container } = renderInvoices('?show=all')
    expect(bodyRows()[0]).toHaveAttribute('data-credit-note-id', 'CRN-T2')
    search('CN-2026-T002')
    expect(bodyRows().map((r) => r.getAttribute('data-credit-note-id'))).toEqual(['CRN-T2'])
    search('CN-2026-T001')
    expect(container.querySelector('[data-credit-note-id="CRN-T2"]')).toBeNull()
  })
})

/**
 * Invoices search finds a credit note by its own number (it lists above the
 * invoice it credits), and a credit note of an invoice the table leaves out
 * lists once, on the first page, only while it matches.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, isBackdropInvoice, useAppStore, type Actor, type AppState } from '../../../store'
import type { CreditNote } from '../../../domain/types'
import { InvoicesScreen } from './InvoicesScreen'
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

function renderInvoices() {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant="web">
        <InvoicesScreen actor={OFFICE} selectedInvoiceId={null} onSelect={() => {}} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const search = (value: string) => fireEvent.change(screen.getByLabelText('Find by invoice number or payer'), { target: { value } })
const table = () => screen.getByTestId('invoice-list-table-shell')

describe('Invoices search and credit notes', () => {
  beforeEach(() => {
    useAppStore.setState(withLiveCreditNote().state)
  })

  it('finds a credit note by its own number, shown above the invoice it credits', () => {
    const { invoiceNumber } = withLiveCreditNote()
    const { container } = renderInvoices()
    search('CN-2026-T001')
    const rows = within(table()).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveAttribute('data-credit-note-id', 'CRN-T1')
    expect(rows[1]).toHaveTextContent(invoiceNumber)
    expect(container.textContent).not.toContain('No invoice matches')
  })

  it("lists a credit note of an invoice the table leaves out only while it matches the search", () => {
    const { seeded } = withLiveCreditNote()
    // the seeded history's credit note is a backdrop one: give it a live id so it lists loose
    const loose: CreditNote = { ...seeded, id: 'CRN-T2', creditNoteNumber: 'CN-2026-T002' }
    useAppStore.setState((s) => ({ billing: { ...s.billing, creditNotes: { ...s.billing.creditNotes, [loose.id]: loose } } }))
    const { container } = renderInvoices()
    expect(container.querySelector('[data-credit-note-id="CRN-T2"]')).not.toBeNull()
    search('CN-2026-T002')
    const rows = within(table()).getAllByRole('row').slice(1)
    expect(rows.map((r) => r.getAttribute('data-credit-note-id'))).toEqual(['CRN-T2'])
    search('CN-2026-T001')
    expect(container.querySelector('[data-credit-note-id="CRN-T2"]')).toBeNull()
  })
})

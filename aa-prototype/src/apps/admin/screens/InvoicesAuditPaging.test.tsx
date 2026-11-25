/**
 * Invoices and Audit at full scale (catch-up Phase 43; US-15.0.4): Invoices
 * pages at 50 and its search filters before paging; Audit pages at 100 and a
 * filter returns to page 1; neither shows a pager at demo scale.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore, type Actor, type AppState } from '../../../store'
import { buildFullScaleDataset } from '../../../domain/seed/fullScale'
import { InvoicesScreen } from './InvoicesScreen'
import { AuditViewer } from './AuditViewer'
import { SurfaceProvider } from '../../../shared'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
let full: AppState

beforeAll(() => {
  full = buildFullScaleDataset(freshAppState(), { todayISO: '2026-11-24' }).state
}, 120_000)

function invoices() {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant="web">
        <InvoicesScreen actor={OFFICE} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

describe('Invoices pages and searches', () => {
  it('no pager at demo scale', () => {
    useAppStore.setState(freshAppState())
    const { container } = invoices()
    expect(container.querySelector('[data-shot="invoices-pager"]')).toBeNull()
  })

  it('shows 50 a page of about 28,000, and a search by number finds one before paging', () => {
    useAppStore.setState(full)
    const { container } = invoices()
    const table = screen.getByTestId('invoice-list-table-shell')
    expect(within(table).getAllByRole('row').length).toBe(51)
    expect(container.querySelector('[data-shot="invoices-pager"] [data-pager-range]')?.textContent).toMatch(/^Showing 1 to 50 of 2\d,\d{3}$/)
    fireEvent.click(screen.getAllByLabelText('Next page')[0]!)
    expect(container.querySelector('[data-shot="invoices-pager"] [data-pager-range]')?.textContent).toMatch(/^Showing 51 to 100 of/)
    fireEvent.change(screen.getByLabelText('Find by invoice number or payer'), { target: { value: 'AA-S-000123' } })
    expect(within(screen.getByTestId('invoice-list-table-shell')).getAllByRole('row').length).toBe(2)
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

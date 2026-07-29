import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore } from '../../store'
import { DemoXero } from './DemoXero'

function renderInvoices() {
  render(
    <MemoryRouter initialEntries={['/demo/xero/invoices']}>
      <Routes>
        <Route path="/demo/xero/invoices" element={<DemoXero />} />
        <Route path="/demo/xero/invoices/:accRecId" element={<DemoXero />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DemoXero invoice table', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('opens an invoice pair when its row is clicked', () => {
    renderInvoices()

    const row = screen.getAllByTestId(/^xero-invoice-row-/)[0]!
    expect(row).toHaveClass('aa-clickable-table-row')

    fireEvent.click(row)

    expect(screen.getByTestId('xero-pair-detail')).toBeInTheDocument()
  })

  it('uses a fixed six-column table without a forced minimum width', () => {
    renderInvoices()

    expect(screen.getByTestId('xero-invoice-table')).toHaveStyle({
      tableLayout: 'fixed',
      width: '100%',
    })
    expect(screen.getAllByRole('columnheader')).toHaveLength(6)
    expect(screen.getByTestId('xero-invoice-table-shell').firstElementChild).toHaveStyle({
      minWidth: '0',
    })
  })
})

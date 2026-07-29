import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  authoriseList,
  freshAppState,
  useAppStore,
  wireBillingRun,
  type Actor,
} from '../../store'
import { SEED_LIST_IDS } from '../../domain/seed'
import { DemoXero } from './DemoXero'
import { xeroInvoicePairViews } from './xeroPairView'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderInvoices(initialEntry = '/demo/xero/invoices') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
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
    expect(screen.getByTestId('xero-money-flow-grid')).toHaveTextContent('Anaesthesia Associates')
    expect(screen.getByTestId('xero-money-flow-grid')).toHaveTextContent('MONEY INTO AA')
    expect(screen.getByTestId('xero-money-flow-grid')).toHaveTextContent('MONEY OUT OF AA')
    expect(screen.getByTestId('aa-service-fee')).toHaveTextContent('Illustrative AA service fee')
    expect(screen.getByTestId('aa-service-fee')).toHaveTextContent('Net payable to anaesthetist')
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

  it('settles one invoice and links to its persistent Web payment history row', () => {
    const unwire = wireBillingRun(useAppStore)
    try {
      expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.souterMon20Am).ok).toBe(true)
      expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.souterMon20Pm).ok).toBe(true)
      const state = useAppStore.getState()
      const target = xeroInvoicePairViews(state).find(
        (pair) => pair.accRec.invoiceNumber === 'AA-2026-0005',
      )
      if (target === undefined || target.accPay === undefined) {
        throw new Error('expected the S3 nib invoice pair')
      }

      renderInvoices(`/demo/xero/invoices/${target.accRec.id}`)
      fireEvent.click(screen.getByRole('button', { name: 'Simulate payment and payout' }))

      expect(useAppStore.getState().xero.accRecs[target.accRec.id]?.status).toBe('paid')
      expect(useAppStore.getState().xero.accPays[target.accPay.id]?.status).toBe('paid')
      expect(screen.getByRole('button', { name: 'Payment and payout complete' })).toBeDisabled()
      expect(screen.getByRole('link', { name: /View in Dr Souter's account/ })).toHaveAttribute(
        'href',
        '/web/accounts/payments?invoice=AA-2026-0005',
      )
      expect(screen.getByRole('status')).toHaveTextContent('$144.76')
    } finally {
      unwire()
    }
  })
})

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ANAE, SEED_LIST_IDS } from '../../../domain/seed'
import {
  authoriseList,
  disbursePayable,
  freshAppState,
  receivePayment,
  useAppStore,
  wireBillingRun,
  type Actor,
} from '../../../store'
import { xeroInvoicePairViews } from '../../demo/xeroPairView'
import { AccountsScreen } from './AccountsScreen'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

describe('Accounts payment history', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('keeps the paid S3 invoice visible with what was received, released and paid to you', () => {
    const unwire = wireBillingRun(useAppStore)
    try {
      expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.souterMon20Am).ok).toBe(true)
      expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.souterMon20Pm).ok).toBe(true)
    } finally {
      unwire()
    }

    const state = useAppStore.getState()
    const pair = xeroInvoicePairViews(state).find(
      (candidate) => candidate.accRec.invoiceNumber === 'AA-2026-0005',
    )
    if (pair === undefined || pair.accPay === undefined) {
      throw new Error('expected the S3 nib invoice pair')
    }
    expect(receivePayment(useAppStore, {
      accRecId: pair.accRec.id,
      amount: pair.accRec.balance,
      idempotencyKey: 'ACCOUNTS-S3',
      source: 'webhook',
    }).ok).toBe(true)
    expect(disbursePayable(useAppStore, OFFICE, pair.accPay.id).ok).toBe(true)

    render(
      <AccountsScreen
        anaesthetistId={ANAE.souter}
        subTab="payments"
        onSubTab={() => undefined}
        focusInvoiceNumber="AA-2026-0005"
      />,
    )

    const row = screen.getByTestId('payment-history-row-AA-2026-0005')
    expect(within(row).getByText('AA-2026-0005')).toBeInTheDocument()
    // Received by AA, released to you and paid to you are all the gross amount.
    expect(within(row).getAllByText('$152.38')).toHaveLength(3)
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Date received', 'Invoice', 'Patient', 'Payer', 'Received by AA', 'Released to you', 'Paid to you', 'Status',
    ])
    expect(within(row).getByText('Paid to you')).toBeInTheDocument()
  })

  it('lists AA fee invoices paid or unpaid on the AA fees tab, with the focused row highlighted', () => {
    render(
      <AccountsScreen anaesthetistId={ANAE.souter} subTab="fees" onSubTab={() => undefined} focusInvoiceNumber="AA-FEE-2026-H02" />,
    )
    expect(screen.getByTestId('aa-fee-history-row-AA-FEE-2026-H01')).toHaveTextContent('Paid 5 Jun 2026')
    const h02 = screen.getByTestId('aa-fee-history-row-AA-FEE-2026-H02')
    expect(h02).toHaveTextContent('Unpaid')
    expect(h02).toHaveTextContent('$505.00')
    expect(h02).toHaveStyle({ boxShadow: expect.stringContaining('inset 3px 0 0') })
    expect(screen.getByText(/never deducted from your payments/)).toBeInTheDocument()
  })

  it('links the Payments caption to the AA fees tab', () => {
    const tabs: string[] = []
    render(<AccountsScreen anaesthetistId={ANAE.souter} subTab="payments" onSubTab={(t) => tabs.push(t)} />)
    fireEvent.click(screen.getByRole('button', { name: 'invoiced to you monthly' }))
    expect(tabs).toEqual(['fees'])
  })
})

import { render, screen, within } from '@testing-library/react'
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

  it('keeps the paid S3 invoice visible with its fee, net amount and payout status', () => {
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
    expect(within(row).getByText('$152.38')).toBeInTheDocument()
    expect(within(row).getByText('−$7.62')).toBeInTheDocument()
    expect(within(row).getAllByText('$144.76')).toHaveLength(2)
    expect(within(row).getByText('Paid to you')).toBeInTheDocument()
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEMO_TRIGGER_ACTOR,
  XERO_PAYABLES_ACTOR,
  XERO_STAFF_ACTOR,
  amendAccRecInXero,
  authoriseList,
  cancelBooking,
  deliverPaymentWebhook,
  freshAppState,
  payBillsInXero,
  receiveBulkRemittance,
  runReconciliationPoll,
  setXeroOutage,
  stagePairRun,
  useAppStore,
  voidAccRecInXero,
  wireBillingRun,
  type Actor,
} from '../../store'
import { SEED_LIST_IDS, SEED_PREPAID_BOOKING_ID } from '../../domain/seed'
import { DemoXero } from './DemoXero'
import { xeroInvoicePairViews } from './xeroPairView'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderInvoices(initialEntry = '/demo/xero/invoices') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/demo/xero" element={<DemoXero />} />
        <Route path="/demo/xero/bank" element={<DemoXero />} />
        <Route path="/demo/xero/invoices" element={<DemoXero />} />
        <Route path="/demo/xero/invoices/:accRecId" element={<DemoXero />} />
      </Routes>
    </MemoryRouter>,
  )
}

/** Authorise Dr Souter's Mon 20 lists and return the S3 nib pair (unpaid, its ACCPAY a draft). */
function stageNibPair() {
  const unwire = wireBillingRun(useAppStore)
  try {
    expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.souterMon20Am).ok).toBe(true)
    expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.souterMon20Pm).ok).toBe(true)
  } finally {
    unwire()
  }
  const target = xeroInvoicePairViews(useAppStore.getState()).find((pair) => pair.accRec.invoiceNumber === 'AA-2026-0005')
  if (target === undefined || target.accPay === undefined) throw new Error('expected the S3 nib invoice pair')
  return { accRecId: target.accRec.id, accPayId: target.accPay.id, balance: target.accRec.balance }
}

function shot(name: string): HTMLElement | null {
  return document.querySelector(`[data-shot="${name}"]`)
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
    // No fee box: the payable is the gross amount (catch-up Phase 16).
    expect(screen.queryByTestId('aa-service-fee')).toBeNull()
    // The first pair is Nair's prepayment (catch-up Phase 27): its payable credits the AA Holding account, never the anaesthetist.
    expect(screen.getByTestId('xero-money-flow-grid')).toHaveTextContent('Simulated payable crediting the AA Holding account')
    // Both records show their stored InvoiceNumber and Reference (US-09.1.1).
    expect(screen.getAllByText('InvoiceNumber')).toHaveLength(2)
    expect(screen.getAllByText('Reference')).toHaveLength(2)
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
      expect(screen.getByRole('status')).toHaveTextContent('$152.38')
      expect(screen.getByRole('status')).not.toHaveTextContent('$144.76')
      // The two Xero events and the bill-paid webhook, named (catch-up Phase 37).
      expect(screen.getByRole('status')).toHaveTextContent("nib's payment of $152.38 landed in Xero and the webhook told the engine")
      expect(screen.getByRole('status')).toHaveTextContent("Xero's payables run paid Dr Melanie Souter $152.38 and the bill-paid webhook recorded the disbursement")
      expect(shot('xero-accpay-paid-in-xero')).toHaveTextContent('$152.38')
      expect(shot('xero-accpay-engine-detection')).toHaveTextContent(/Billing Engine: disbursement recorded \d\d:\d\d by webhook/)
    } finally {
      unwire()
    }
  })

  it('shows an AA fee pair with no payable, and Record fee payment in place of payment and payout', () => {
    const fee = Object.values(useAppStore.getState().billing.aaFeeInvoices).find((f) => f.invoiceNumber === 'AA-FEE-2026-H02')!
    // (catch-up Phase 36: the fee's ACCREC id and paid date live on its `aaFee` ledger pair.)
    const feeAccRecId = useAppStore.getState().billing.ledger[fee.ledgerPairId]!.receivable.xeroAccRecId!
    renderInvoices(`/demo/xero/invoices/${feeAccRecId}`)
    expect(screen.queryByRole('button', { name: 'Simulate payment and payout' })).toBeNull()
    expect(screen.getByTestId('xero-aa-fee-no-payable')).toHaveTextContent('never netted')
    expect(screen.getByTestId('xero-money-flow-grid')).toHaveTextContent("Anaesthesia Associates (AA's own account)")
    fireEvent.click(screen.getByRole('button', { name: 'Record fee payment' }))
    expect(screen.getByRole('status')).toHaveTextContent('AA-FEE-2026-H02 paid')
    expect(useAppStore.getState().billing.ledger[fee.ledgerPairId]?.receivable.paidInAtISO).toBeDefined()
    expect(screen.getByRole('link', { name: /View in Dr Souter's account/ })).toHaveAttribute(
      'href',
      '/web/accounts/fees?invoice=AA-FEE-2026-H02',
    )
  })
})

describe('a no-charge pair (catch-up Phase 44 QA)', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))

  it('reads as complete with no payable: no warning, no payout button, a No charge chip', () => {
    const unwire = wireBillingRun(useAppStore)
    try {
      expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.multiProcedure).ok).toBe(true)
    } finally {
      unwire()
    }
    const pair = xeroInvoicePairViews(useAppStore.getState()).find((p) => p.noCharge === true)!
    renderInvoices(`/demo/xero/invoices/${pair.accRec.id}`)
    expect(screen.queryByText('Incomplete simulated pair')).toBeNull()
    expect(screen.queryByText('ACCPAY unavailable')).toBeNull()
    expect(screen.getAllByText('No charge').length).toBeGreaterThan(0)
    expect(screen.getByTestId('xero-money-flow-grid')).toHaveTextContent('No payable: a no-charge invoice has nothing to pay out and no BCTI.')
    expect(screen.queryByRole('button', { name: /Pay .* now|Simulate payment/ })).toBeNull()
  })
})

describe('DemoXero mirror resilience (catch-up Phase 37)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('shows the outage banner on every tab only while Xero is unavailable', () => {
    const before = renderInvoices()
    expect(screen.getByTestId('xero-invoice-table')).toBeInTheDocument()
    expect(shot('xero-outage-banner')).toBeNull()
    before.unmount()

    expect(setXeroOutage(useAppStore, DEMO_TRIGGER_ACTOR, true).ok).toBe(true)
    for (const path of ['/demo/xero', '/demo/xero/invoices', '/demo/xero/bank']) {
      const view = renderInvoices(path)
      expect(shot('xero-outage-banner')).toHaveTextContent('Xero API unavailable to the Billing Engine (simulated).')
      expect(shot('xero-outage-banner')).toHaveTextContent("Payments and bill payments still land here; the engine's calls wait in its queue.")
      view.unmount()
    }

    expect(setXeroOutage(useAppStore, DEMO_TRIGGER_ACTOR, false).ok).toBe(true)
    renderInvoices()
    expect(shot('xero-outage-banner')).toBeNull()
  })

  it('separates Paid in Xero from the engine: a missed webhook is not yet detected until the poll records it', () => {
    const nib = stageNibPair()
    expect(deliverPaymentWebhook(useAppStore, { accRecId: nib.accRecId, amount: nib.balance, idempotencyKey: 'TEST-NIB-PAY' }).ok).toBe(true)
    // (catch-up Phase 39a: Xero pays only a run's lines; stage a one-line approved run for this pair first.)
    const pair = Object.values(useAppStore.getState().billing.ledger).find((p) => p.kind !== 'aaFee' && p.payable?.xeroAccPayId === nib.accPayId)!
    const staged = stagePairRun(useAppStore, OFFICE, pair.id)
    if (!staged.ok) throw new Error(staged.message)
    const paid = payBillsInXero(useAppStore, XERO_PAYABLES_ACTOR, [{ accPayId: nib.accPayId }], { webhook: 'missed', runId: staged.value.runId })
    if (!paid.ok) throw new Error(paid.message)
    expect(paid.value.paid).toHaveLength(1)
    const billPaymentId = paid.value.paid[0]!.xeroDisbursementId

    const view = renderInvoices(`/demo/xero/invoices/${nib.accRecId}`)
    expect(shot('xero-accpay-card')).not.toBeNull()
    expect(shot('xero-accpay-paid-in-xero')).toHaveTextContent(billPaymentId)
    expect(shot('xero-accpay-paid-in-xero')).toHaveTextContent('$152.38')
    expect(shot('xero-accpay-engine-detection')).toHaveTextContent('Billing Engine: not yet detected; the next poll picks it up.')
    view.unmount()

    expect(runReconciliationPoll(useAppStore).disbursements).toBe(1)
    renderInvoices(`/demo/xero/invoices/${nib.accRecId}`)
    expect(shot('xero-accpay-engine-detection')).toHaveTextContent(/Billing Engine: disbursement recorded \d\d:\d\d by the poll\./)
  })

  it('shows the engine recording the disbursement when the bill-paid webhook is delivered', () => {
    const nib = stageNibPair()
    expect(deliverPaymentWebhook(useAppStore, { accRecId: nib.accRecId, amount: nib.balance, idempotencyKey: 'TEST-NIB-PAY' }).ok).toBe(true)
    // "Pay Dr ... now": the payout-only state, through Xero's payables run with the webhook delivered.
    renderInvoices(`/demo/xero/invoices/${nib.accRecId}`)
    fireEvent.click(screen.getByRole('button', { name: 'Pay Dr Melanie Souter now' }))
    expect(screen.getByRole('status')).toHaveTextContent("Xero's payables run paid Dr Melanie Souter $152.38 and the bill-paid webhook recorded the disbursement.")
    expect(screen.getByRole('status')).not.toHaveTextContent('landed in Xero')
    expect(shot('xero-accpay-engine-detection')).toHaveTextContent(/Billing Engine: disbursement recorded \d\d:\d\d by webhook\./)
    expect(Object.values(useAppStore.getState().billing.disbursements).filter((d) => d.detectedBy === 'webhook' && d.amount === 152.38)).toHaveLength(1)
  })

  it('renders a voided invoice as Voided with its time, and hides Simulate payment and payout', () => {
    const nib = stageNibPair()
    expect(voidAccRecInXero(useAppStore, XERO_STAFF_ACTOR, nib.accRecId).ok).toBe(true)
    renderInvoices(`/demo/xero/invoices/${nib.accRecId}`)
    expect(screen.queryByRole('button', { name: 'Simulate payment and payout' })).toBeNull()
    expect(shot('xero-accrec-voided')).toHaveTextContent('Voided in Xero')
    expect(shot('xero-accrec-voided')).toHaveTextContent(/\d\d:\d\d/)
    expect(shot('xero-accrec-card')).toHaveTextContent('Voided')
  })

  it('shows an amended invoice\'s new total beside "Amended in Xero" and its time', () => {
    const nib = stageNibPair()
    expect(amendAccRecInXero(useAppStore, XERO_STAFF_ACTOR, nib.accRecId).ok).toBe(true)
    renderInvoices(`/demo/xero/invoices/${nib.accRecId}`)
    expect(shot('xero-accrec-amended')).toHaveTextContent(/Amended in Xero \d\d:\d\d/)
    expect(shot('xero-accrec-amended')).toHaveTextContent('$132.38')
    expect(shot('xero-accrec-card')).toHaveTextContent('Issued total')
    expect(screen.getByRole('button', { name: 'Simulate payment and payout' })).toBeInTheDocument()
  })

  it('shows an empty Bank reconciliation until the remittance arrives', () => {
    renderInvoices('/demo/xero/bank')
    expect(screen.getByRole('link', { name: 'Bank reconciliation (0 unmatched)' })).toHaveAttribute('aria-current', 'page')
    expect(shot('xero-bank-scope')).toHaveTextContent('The Billing Engine does not match bulk remittances.')
    expect(shot('xero-bank-empty')).toHaveTextContent('Simulate bulk hospital remittance')
    expect(shot('xero-bank-unmatched')).toBeNull()
  })

  it('lists the remittance and matches its unmatched line to XRH04 in Xero', () => {
    expect(receiveBulkRemittance(useAppStore).ok).toBe(true)
    renderInvoices('/demo/xero/bank')

    expect(screen.getByRole('link', { name: 'Bank reconciliation (1 unmatched)' })).toBeInTheDocument()
    const bank = shot('xero-bank-reconciliation')!
    expect(bank.querySelectorAll('[data-line-status="matchedByAddOn"]')).toHaveLength(2)
    const unmatchedRows = bank.querySelectorAll('[data-line-status="unmatched"]')
    expect(unmatchedRows).toHaveLength(1)
    expect(unmatchedRows[0]).toHaveTextContent('AA-2026-H40')
    expect(unmatchedRows[0]).toHaveTextContent('$980.00')
    expect(bank).toHaveTextContent('Matched by the remittance add-on')
    expect(bank).toHaveTextContent('AA-2026-H01')
    expect(shot('xero-bank-unmatched')).toHaveTextContent('Unmatched items · for office staff, handled in Xero')
    expect(shot('xero-bank-unmatched')).toHaveTextContent('$980.00')

    // No choice yet: the refusal shows as a form error and nothing is paid.
    fireEvent.click(screen.getByRole('button', { name: 'Match in Xero' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an invoice')

    fireEvent.change(screen.getByRole('combobox', { name: 'Invoice to match AA-2026-H40 to' }), { target: { value: 'XRH04' } })
    fireEvent.click(screen.getByRole('button', { name: 'Match in Xero' }))

    const receipts = Object.values(useAppStore.getState().billing.receipts).filter((r) => r.accRecId === 'XRH04')
    expect(receipts).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Match in Xero' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Bank reconciliation (0 unmatched)' })).toBeInTheDocument()
    expect(bank.querySelectorAll('[data-line-status="matchedByOffice"]')).toHaveLength(1)
    expect(bank).toHaveTextContent('Matched by the office')
    expect(shot('xero-bank-match-result')).toHaveTextContent('Matched in Xero: $980.00 paid AA-2026-H04')
  })

  it('points the duplicate-invoice-number callout to the Bank reconciliation tab', () => {
    renderInvoices()
    const callout = shot('xero-duplicate-number-policy')!
    expect(callout.querySelector('a[href="/demo/xero/bank"]')).not.toBeNull()
  })
})

describe('DemoXero refund on a cancelled prepayment (catch-up Phase 41; US-06.5.2, D53)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it("shows the refund paid from the AA trust account on the credit note panel", () => {
    const unwire = wireBillingRun(useAppStore)
    try {
      expect(cancelBooking(useAppStore, OFFICE, SEED_PREPAID_BOOKING_ID, 'Patient withdrew').ok).toBe(true)
    } finally {
      unwire()
    }
    const state = useAppStore.getState()
    const note = Object.values(state.billing.creditNotes).find((c) => c.cause === 'prepaymentCancelled')!
    const pair = xeroInvoicePairViews(state).find((p) => p.ledger.billingInvoiceId === note.originalInvoiceId)!
    renderInvoices(`/demo/xero/invoices/${pair.accRec.id}`)
    const refund = shot('xero-prepayment-refund')!
    expect(refund).toHaveTextContent('Refund paid from AA trust account · $1,380.00 · Paid 24 Nov')
    expect(refund).toHaveTextContent(note.creditNoteNumber)
    expect(refund.querySelectorAll('[data-shot="xero-prepayment-refund-row"]')).toHaveLength(1)
  })
})

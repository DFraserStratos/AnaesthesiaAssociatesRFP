import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE, SEED_LIST_IDS } from '../../../domain/seed'
import {
  anaesthetistLedgerPosition,
  approveAndPayPairForDemo,
  authoriseList,
  freshAppState,
  receivePayment,
  useAppStore,
  wireBillingRun,
  type Actor,
} from '../../../store'
import { formatCurrency } from '../../../shared/format'
import * as download from '../../../shared/download'
import { xeroInvoicePairViews } from '../../demo/xeroPairView'
import { AccountsScreen } from './AccountsScreen'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderIn(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

/** S3: both Mon 20 Lists authorised (the wired billing run raises AA-2026-0005). */
function s3() {
  const unwire = wireBillingRun(useAppStore)
  try {
    expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.souterMon20Am).ok).toBe(true)
    expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.souterMon20Pm).ok).toBe(true)
  } finally {
    unwire()
  }
  const pair = xeroInvoicePairViews(useAppStore.getState()).find((candidate) => candidate.accRec.invoiceNumber === 'AA-2026-0005')
  if (pair === undefined || pair.accPay === undefined) throw new Error('expected the S3 nib invoice pair')
  return pair
}

function payInFull(pair: ReturnType<typeof s3>) {
  expect(receivePayment(useAppStore, { accRecId: pair.accRec.id, amount: pair.accRec.balance, idempotencyKey: 'ACCOUNTS-S3', source: 'webhook' }).ok).toBe(true)
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(() => vi.restoreAllMocks())

describe('Accounts sub-tabs (catch-up Phase 38)', () => {
  it('reads Outstanding, Payments, GST report and AA fees, as links', () => {
    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="outstanding" onSubTab={() => undefined} />)
    const tabs = within(screen.getByRole('navigation', { name: 'Accounts' })).getAllByRole('link')
    expect(tabs.map((t) => t.textContent)).toEqual(['Outstanding', 'Payments', 'GST report', 'AA fees'])
    expect(tabs[0]).toHaveAttribute('href', '/web/accounts/outstanding')
    expect(tabs[0]).toHaveAttribute('aria-current', 'page')
  })
})

describe('Outstanding: a flat list of unpaid payables (US-12.2.1, D8)', () => {
  it('lists one row per unpaid payable oldest first, a stage word each, one total equal to Owed to you, and no buckets', () => {
    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="outstanding" onSubTab={() => undefined} />)
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Invoice date', 'Invoice', 'Patient', 'Billable party', 'Stage', 'ACC', 'Outstanding to you',
    ])
    expect(screen.queryByText(/31 to 60|61 to 90|90 \+|Current/)).toBeNull()
    const rows = screen.getAllByTestId(/^outstanding-row-/)
    expect(rows.length).toBeGreaterThan(1)
    const owed = anaesthetistLedgerPosition(useAppStore.getState(), ANAE.souter).owedToThem
    expect(screen.getByTestId('outstanding-total')).toHaveTextContent(formatCurrency(owed))
    expect(screen.getByText(/A row stays until AA pays you\. For a question about a line, contact the office\./)).toBeInTheDocument()
  })

  it('keeps a paid-in row as "Paid in, due to you"', () => {
    const pair = s3()
    payInFull(pair)
    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="outstanding" onSubTab={() => undefined} />)
    expect(screen.getByTestId('outstanding-row-AA-2026-0005')).toHaveTextContent('Paid in, due to you')
    expect(screen.getByTestId('outstanding-row-AA-2026-0005')).toHaveTextContent('$152.38')
  })

  it('opens the Booking of a row', () => {
    const pair = s3()
    const opened: string[] = []
    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="outstanding" onSubTab={() => undefined} onOpenBooking={(listId, bookingId) => opened.push(`${listId}/${bookingId}`)} />)
    const row = screen.getByTestId('outstanding-row-AA-2026-0005')
    fireEvent.click(within(row).getByRole('button', { name: /Open the Booking for AA-2026-0005/ }))
    const bookingId = row.getAttribute('data-booking-id')!
    const listId = useAppStore.getState().schedule.bookings[bookingId]!.listId
    expect(opened).toEqual([`${listId}/${bookingId}`])
    expect(pair.accRec.invoiceNumber).toBe('AA-2026-0005')
  })
})

describe('Accounts payment history', () => {
  it('keeps the paid S3 invoice visible with what was received, released and paid to you', () => {
    const pair = s3()
    payInFull(pair)
    // Paid out by its ledger pair (catch-up Phase 36: the payable is the pair's leg), as an approved one-line run (39a).
    expect(approveAndPayPairForDemo(useAppStore, OFFICE, pair.ledger.pairId ?? '').ok).toBe(true)

    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="payments" onSubTab={() => undefined} focusInvoiceNumber="AA-2026-0005" />)

    const row = screen.getByTestId('payment-history-row-AA-2026-0005')
    expect(within(row).getByText('AA-2026-0005')).toBeInTheDocument()
    // Received by AA, released to you and paid to you are all the gross amount.
    expect(within(row).getAllByText('$152.38')).toHaveLength(3)
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Date received', 'Invoice', 'Patient', 'Billable party', 'Received by AA', 'Released to you', 'Paid to you', 'Status',
    ])
    expect(within(row).getByText('Paid to you')).toBeInTheDocument()
  })

  it('lists AA fee invoices paid or unpaid on the AA fees tab, with the focused row highlighted', () => {
    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="fees" onSubTab={() => undefined} focusInvoiceNumber="AA-FEE-2026-H02" />)
    expect(screen.getByTestId('aa-fee-history-row-AA-FEE-2026-H01')).toHaveTextContent('Paid 5 Jun 2026')
    const h02 = screen.getByTestId('aa-fee-history-row-AA-FEE-2026-H02')
    expect(h02).toHaveTextContent('Unpaid')
    expect(h02).toHaveTextContent('$505.00')
    expect(h02).toHaveStyle({ boxShadow: expect.stringContaining('inset 3px 0 0') })
    expect(screen.getByText(/never deducted from your payments/)).toBeInTheDocument()
  })

  it('links the Payments caption to the AA fees tab', () => {
    const tabs: string[] = []
    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="payments" onSubTab={(t) => tabs.push(t)} />)
    fireEvent.click(screen.getByRole('button', { name: 'invoiced to you monthly' }))
    expect(tabs).toEqual(['fees'])
  })
})

describe('the monthly GST report (US-12.2.2, cash basis)', () => {
  it('defaults to the demo month, has no View by or period control, and the picker changes the rows and totals', () => {
    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="gst" onSubTab={() => undefined} />)
    const picker = screen.getByLabelText('Month') as HTMLSelectElement
    expect(picker.value).toBe('2026-07')
    expect(within(picker).getAllByRole('option').map((o) => o.textContent)).toContain('June 2026')
    expect(screen.queryByText(/View by|Six-monthly|Bi-monthly|GST period|GST activity/)).toBeNull()
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.getByText('Month total')).toBeInTheDocument()
    fireEvent.change(picker, { target: { value: '2026-06' } })
    expect(screen.getByText(/^June 2026 · GST on a cash basis/)).toBeInTheDocument()
    expect(screen.queryAllByTestId(/^gst-report-row-/).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Date paid', 'Invoice', 'Billable party', 'Paid to you (incl GST)', 'GST component', 'Paid ex GST',
    ])
  })

  it('adds no row for a receipt alone, and says what is collected but not yet paid', () => {
    const pair = s3()
    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="gst" onSubTab={() => undefined} />)
    const before = screen.queryAllByTestId(/^gst-report-row-/).length
    act(() => payInFull(pair))
    expect(screen.queryAllByTestId(/^gst-report-row-/).length).toBe(before)
    expect(document.querySelector('[data-shot="web-gst-not-yet-paid"]')).toHaveTextContent(/collected by AA is not yet paid to you\. It falls into the month AA pays it in\./)
    act(() => { expect(approveAndPayPairForDemo(useAppStore, OFFICE, pair.ledger.pairId ?? '').ok).toBe(true) })
    expect(screen.getByTestId('gst-report-row-AA-2026-0005')).toHaveTextContent('$152.38')
  })

  it('downloads the CSV, prints and confirms Email to me with the anaesthetist\'s email', () => {
    const spy = vi.spyOn(download, 'downloadTextFile').mockImplementation(() => undefined)
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="gst" onSubTab={() => undefined} />)
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2026-06' } })
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0]![0]).toBe('gst-report-2026-06.csv')
    expect(spy.mock.calls[0]![1]).toMatch(/^Date paid,Invoice,Billable party,/)
    fireEvent.click(screen.getByRole('button', { name: 'Print' }))
    expect(print).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Email to me' }))
    const email = useAppStore.getState().masters.anaesthetists[ANAE.souter]!.email
    expect(screen.getByRole('status')).toHaveTextContent(`Sent to ${email}: the GST report for June 2026.`)
  })

  it('disables the three actions on a month with no payments', () => {
    // A store with no payouts at all: the demo month is empty.
    useAppStore.setState((s) => ({ billing: { ...s.billing, disbursements: {} } }))
    renderIn(<AccountsScreen anaesthetistId={ANAE.souter} subTab="gst" onSubTab={() => undefined} />)
    expect(screen.getByText('AA has not passed you any payments in this month.')).toBeInTheDocument()
    for (const name of ['Download', 'Print', 'Email to me']) expect(screen.getByRole('button', { name })).toBeDisabled()
  })
})

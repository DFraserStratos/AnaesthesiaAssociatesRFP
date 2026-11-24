import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ANAE, SEED_LIST_IDS } from '../../../domain/seed'
import { authoriseList, freshAppState, outstandingPayableRowsFor, outstandingTotalFor, receivePayment, useAppStore, wireBillingRun, type Actor } from '../../../store'
import { formatCurrency } from '../../../shared/format'
import { xeroInvoicePairViews } from '../../demo/xeroPairView'
import { BalancesScreen } from './BalancesScreen'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('mobile Balances (catch-up Phase 38; US-12.2.1, US-12.2.2)', () => {
  it('is a flat list with the invoice date on each card, no age chips, and the web total', () => {
    render(<BalancesScreen initials="MS" anaesthetistId={ANAE.souter} />)
    const s = useAppStore.getState()
    const rows = outstandingPayableRowsFor(s, ANAE.souter)
    expect(screen.getAllByTestId(/^balances-outstanding-/)).toHaveLength(rows.length)
    for (const card of screen.getAllByTestId(/^balances-outstanding-/)) expect(card).toHaveTextContent(/Invoice date \d{1,2} [A-Z][a-z]{2}/)
    expect(screen.queryByText(/^\d+d$/)).toBeNull()
    expect(screen.getByText(formatCurrency(outstandingTotalFor(rows)))).toBeInTheDocument()
    expect(screen.getByText('A row stays until AA pays you. For a question about a line, contact the office.')).toBeInTheDocument()
  })

  it('opens the Booking of a card', () => {
    const opened: string[] = []
    render(<BalancesScreen initials="MS" anaesthetistId={ANAE.souter} onOpenBooking={(listId, bookingId) => opened.push(`${listId}/${bookingId}`)} />)
    const card = screen.getAllByTestId(/^balances-outstanding-/)[0]!
    fireEvent.click(within(card).getByRole('button'))
    const bookingId = card.getAttribute('data-booking-id')!
    expect(opened).toEqual([`${useAppStore.getState().schedule.bookings[bookingId]!.listId}/${bookingId}`])
  })

  it('peeks at GST this month, and a payment received adds no GST row', () => {
    const unwire = wireBillingRun(useAppStore)
    try {
      expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.souterMon20Am).ok).toBe(true)
      expect(authoriseList(useAppStore, OFFICE, SEED_LIST_IDS.souterMon20Pm).ok).toBe(true)
    } finally {
      unwire()
    }
    render(<BalancesScreen initials="MS" anaesthetistId={ANAE.souter} />)
    fireEvent.click(screen.getByText('GST this month'))
    expect(screen.getByText('November 2026 · paid to you')).toBeInTheDocument()
    expect(screen.getByText('Open the web app for past months, download, print or email.')).toBeInTheDocument()
    const before = screen.queryAllByTestId(/^balances-gst-row-/).length
    const pair = xeroInvoicePairViews(useAppStore.getState()).find((p) => p.accRec.invoiceNumber === 'AA-2026-0005')!
    act(() => { expect(receivePayment(useAppStore, { accRecId: pair.accRec.id, amount: pair.accRec.balance, idempotencyKey: 'BAL', source: 'webhook' }).ok).toBe(true) })
    expect(screen.queryAllByTestId(/^balances-gst-row-/)).toHaveLength(before)
  })
})

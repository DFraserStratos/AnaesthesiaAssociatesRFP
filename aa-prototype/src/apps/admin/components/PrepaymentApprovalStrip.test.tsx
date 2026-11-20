/**
 * Approve and send with the prepayment letter (catch-up Phase 41, work item 9;
 * US-06.3.6): the strip's Approve and send opens a short dialog naming the
 * default letter, previews it, and sending attaches the letter to the invoice;
 * the invoice document shows it as a cover and names it in its rail; the Admin
 * Day rail card says when a row was reminded.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { SurfaceProvider } from '../../../shared'
import { approvePrepayment, freshAppState, prepaymentStatusFor, useAppStore, type Actor } from '../../../store'
import { sendPrepaymentReminder } from '../../../store/prepaymentActions'
import { SEED_MARKERS } from '../../../domain/seed'
import { PrepaymentApprovalStrip } from './PrepaymentApprovalStrip'
import { PrepaymentsRailCard } from './PrepaymentsRailCard'
import { InvoiceDocument } from '../screens/InvoiceDocument'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function rileyBookingId(): string {
  return SEED_MARKERS.prepaymentBooking!.entityId
}

function shot(name: string, root: ParentNode = document): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-shot="${name}"]`)
}

function renderStrip() {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant="web">
        <PrepaymentApprovalStrip actor={OFFICE} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

describe('Approve and send with the prepayment letter', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('opens the letter dialog, previews it and sends the invoice with the letter', () => {
    renderStrip()
    const bookingId = rileyBookingId()
    const row = document.querySelector<HTMLElement>(`[data-shot="awaiting-approval-row"][data-booking-id="${bookingId}"]`)!
    expect(row).not.toBeNull()
    fireEvent.click(within(row).getByRole('button', { name: /Approve and send/ }))

    const picker = shot('prepayment-letter-picker')!
    expect(picker).not.toBeNull()
    expect(within(picker).getByText('Standard prepayment letter')).toBeTruthy()
    // One active request template: named, never a select.
    expect(picker.querySelector('select')).toBeNull()

    fireEvent.click(within(picker).getByRole('button', { name: 'Preview letter' }))
    const preview = shot('prepayment-letter-preview')!
    expect(preview.textContent).toContain('(allocated when sent)')

    fireEvent.click(shot('prepayment-letter-send')!)
    expect(shot('prepayment-letter-picker')).toBeNull()
    const invoice = Object.values(useAppStore.getState().billing.invoices).find((i) => i.bookingId === bookingId && i.kind === 'prePayment')!
    expect(invoice.letter?.templateName).toBe('Standard prepayment letter')
    expect(invoice.letter?.body).toContain(invoice.invoiceNumber)
    expect(shot('approve-and-send-result')?.textContent).toContain(invoice.invoiceNumber)
  })

  it('names the letter when switching approval off sends the waiting invoices', () => {
    renderStrip()
    fireEvent.click(shot('prepayment-approval-switch')!)
    fireEvent.click(shot('prepayment-approval-off-confirm')!)
    expect(shot('approve-and-send-result')?.textContent).toContain('Sent with the Standard prepayment letter.')
  })
})

describe('the letter on the invoice and the rail', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('prints the letter above the masthead and lists the reminders in the rail', () => {
    const bookingId = rileyBookingId()
    const approved = approvePrepayment(useAppStore, OFFICE, bookingId, firstPendingPayerKey(bookingId))
    expect(approved.ok).toBe(true)
    if (!approved.ok) return
    const reminded = sendPrepaymentReminder(useAppStore, OFFICE, bookingId)
    render(
      <MemoryRouter>
        <SurfaceProvider variant="web">
          <InvoiceDocument invoiceId={approved.value.invoiceId} actor={OFFICE} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    const letter = shot('prepayment-letter')!
    expect(letter).not.toBeNull()
    expect(letter.textContent).toContain('Prepayment letter')
    // The cover comes before the masthead on the same paper.
    const supplier = shot('invoice-supplier')!
    expect(letter.compareDocumentPosition(supplier) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(shot('invoice-letter-line')?.textContent).toBe('Letter: Standard prepayment letter · sent with this invoice')
    expect(reminded.ok).toBe(true)
    expect(shot('invoice-reminder-line')?.textContent).toMatch(/^Reminder · \d{1,2} \w{3} \d{2}:\d{2} · \$[\d,]+\.\d{2} outstanding$/)
  })

  it('says when a rail row was reminded', () => {
    const bookingId = rileyBookingId()
    expect(approvePrepayment(useAppStore, OFFICE, bookingId, firstPendingPayerKey(bookingId)).ok).toBe(true)
    const reminded = sendPrepaymentReminder(useAppStore, OFFICE, bookingId)
    render(
      <MemoryRouter>
        <PrepaymentsRailCard onOpenBooking={() => undefined} />
      </MemoryRouter>,
    )
    // The rail shows five rows until expanded.
    const more = screen.queryByRole('button', { name: /Show all/ })
    if (more !== null) fireEvent.click(more)
    const row = document.querySelector<HTMLElement>(`[data-shot="rail-prepayment-row"][data-booking-id="${bookingId}"]`)!
    expect(row).not.toBeNull()
    expect(reminded.ok).toBe(true)
    expect(shot('rail-prepayment-reminded', row)?.textContent).toMatch(/^Reminded \d{1,2} \w{3}$/)
  })
})

function firstPendingPayerKey(bookingId: string): string {
  return prepaymentStatusFor(useAppStore.getState(), bookingId).groups.find((g) => g.status === 'awaitingApproval')!.payerKey
}

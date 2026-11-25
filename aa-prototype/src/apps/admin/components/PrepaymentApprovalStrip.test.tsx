/**
 * Prepayment approval on the Invoices tab (catch-up Phase 41, work item 9, build plan Phase 62;
 * US-06.3.1, US-06.3.6). The Awaiting approval list's Approve and send opens a short dialog naming
 * the default letter, previews it, and sending attaches the letter to the invoice and takes the row
 * off the list; the rail's switch card asks before switching approval off, sends what waits and
 * reports the line to the tab, and its "Show them" opens the filter. The invoice document shows the
 * letter as a cover and names it in its rail; the Admin Day rail card says when a row was reminded.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SurfaceProvider } from '../../../shared'
import { approvePrepayment, freshAppState, prepaymentStatusFor, readyPendingPrepaymentCount, useAppStore, usePendingPrepayments, type Actor } from '../../../store'
import { sendPrepaymentReminder } from '../../../store/prepaymentActions'
import { SEED_MARKERS } from '../../../domain/seed'
import { PrepaymentApprovalList, PrepaymentApprovalStrip, PrepaymentApprovalSwitchCard } from './PrepaymentApprovalStrip'
import { PrepaymentsRailCard } from './PrepaymentsRailCard'
import { InvoiceDocument } from '../screens/InvoiceDocument'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function rileyBookingId(): string {
  return SEED_MARKERS.prepaymentBooking!.entityId
}

function shot(name: string, root: ParentNode = document): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-shot="${name}"]`)
}

function inWeb(node: React.ReactNode) {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant="web">{node}</SurfaceProvider>
    </MemoryRouter>,
  )
}

/** The tab's Awaiting approval list over the store's pending rows, as the screen feeds it. */
function ListHarness({ onDone }: { onDone: (line: string) => void }) {
  const rows = usePendingPrepayments()
  return <PrepaymentApprovalList actor={OFFICE} rows={rows} onDone={onDone} onError={() => undefined} />
}

const rileyRow = () => document.querySelector<HTMLElement>(`[data-shot="awaiting-approval-row"][data-booking-id="${rileyBookingId()}"]`)

describe('Approve and send with the prepayment letter', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('opens the letter dialog, previews it, sends the invoice with the letter and takes the row off the list', () => {
    const onDone = vi.fn()
    inWeb(<ListHarness onDone={onDone} />)
    const bookingId = rileyBookingId()
    const row = rileyRow()!
    expect(row).not.toBeNull()
    expect(shot('invoices-awaiting-approval')).not.toBeNull()
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
    // The line goes to the tab, which shows it; the row has left the list.
    expect(onDone).toHaveBeenCalledOnce()
    expect(onDone.mock.calls[0]![0]).toContain(invoice.invoiceNumber)
    const payerKeys = prepaymentStatusFor(useAppStore.getState(), bookingId).groups.filter((g) => g.status === 'awaitingApproval').map((g) => g.payerKey)
    const left = [...document.querySelectorAll<HTMLElement>(`[data-shot="awaiting-approval-row"][data-booking-id="${bookingId}"]`)].map((r) => r.getAttribute('data-payer-key'))
    expect(left).toEqual(payerKeys)
  })

  it('the stacked strip shows the line itself', () => {
    inWeb(<PrepaymentApprovalStrip actor={OFFICE} />)
    fireEvent.click(within(rileyRow()!).getByRole('button', { name: /Approve and send/ }))
    fireEvent.click(shot('prepayment-letter-send')!)
    const invoice = Object.values(useAppStore.getState().billing.invoices).find((i) => i.bookingId === rileyBookingId() && i.kind === 'prePayment')!
    expect(shot('approve-and-send-result')?.textContent).toContain(invoice.invoiceNumber)
  })
})

describe('the approval switch card', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('asks before switching off, then sends what waits with its letter and reports the line', () => {
    const onDone = vi.fn()
    const ready = readyPendingPrepaymentCount(useAppStore.getState())
    expect(ready).toBeGreaterThan(0)
    inWeb(<PrepaymentApprovalSwitchCard actor={OFFICE} count={ready} onDone={onDone} onError={() => undefined} />)
    const card = shot('prepayment-approval-card')!
    expect(card.textContent).toContain('Prepayments to approve')

    fireEvent.click(shot('prepayment-approval-switch', card)!)
    // Nothing changes until the confirm.
    expect(useAppStore.getState().appSettings.prepayment.approvalRequired).toBe(true)
    expect(onDone).not.toHaveBeenCalled()
    fireEvent.click(shot('prepayment-approval-off-confirm')!)

    expect(useAppStore.getState().appSettings.prepayment.approvalRequired).toBe(false)
    expect(readyPendingPrepaymentCount(useAppStore.getState())).toBe(0)
    expect(onDone).toHaveBeenCalledOnce()
    const line = onDone.mock.calls[0]![0] as string
    expect(line).toMatch(/^Prepayment approval is off\. /)
    expect(line).toContain('Sent with the Standard prepayment letter.')
  })

  it('"Show them" opens the filter; it is not offered when none waits or nothing opens it', () => {
    const onShow = vi.fn()
    const { unmount } = inWeb(<PrepaymentApprovalSwitchCard actor={OFFICE} count={2} onShow={onShow} onDone={() => undefined} onError={() => undefined} />)
    fireEvent.click(shot('prepayments-show-them')!)
    expect(onShow).toHaveBeenCalledOnce()
    unmount()

    const none = inWeb(<PrepaymentApprovalSwitchCard actor={OFFICE} count={0} onShow={onShow} onDone={() => undefined} onError={() => undefined} />)
    expect(shot('prepayments-show-them')).toBeNull()
    none.unmount()

    inWeb(<PrepaymentApprovalSwitchCard actor={OFFICE} count={2} onDone={() => undefined} onError={() => undefined} />)
    expect(shot('prepayments-show-them')).toBeNull()
    expect(screen.getByText(/Prepayments to approve/)).toBeTruthy()
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

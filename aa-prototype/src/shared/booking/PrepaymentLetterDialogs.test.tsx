/**
 * Send prepayment reminder on the Booking's prepayment panel (catch-up Phase
 * 41, work item 9; US-06.3.6): the office's surface offers it on a sent,
 * unpaid group and shows the sent line after; the anaesthetist sees the line
 * and that the office sends the letter, never the action; with no invoice
 * email the dialog refuses and cannot send.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SurfaceProvider } from '../surface'
import { approvePrepayment, freshAppState, prepaymentStatusFor, useAppStore, type Actor } from '../../store'
import { REMINDER_MESSAGES } from '../../store/prepaymentActions'
import { SEED_MARKERS } from '../../domain/seed'
import { PrepaymentPanel, type PrepaymentOfficeLinks } from './PrepaymentPanel'
import { OFFICE_SENDS_LETTER, SEND_REMINDER_LABEL } from './prepaymentText'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const LINKS: PrepaymentOfficeLinks = { onOpenInvoices: () => undefined, onOpenInvoice: () => undefined }

function shot(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-shot="${name}"]`)
}

/** Riley's Booking with its prepayment invoice sent (unpaid). */
function sentRiley(): { bookingId: string; invoiceId: string } {
  const bookingId = SEED_MARKERS.prepaymentBooking!.entityId
  const payerKey = prepaymentStatusFor(useAppStore.getState(), bookingId).groups.find((g) => g.status === 'awaitingApproval')!.payerKey
  const out = approvePrepayment(useAppStore, OFFICE, bookingId, payerKey)
  if (!out.ok) throw new Error(out.message)
  return { bookingId, invoiceId: out.value.invoiceId }
}

function anaesthetistOf(bookingId: string): Actor {
  const s = useAppStore.getState()
  const list = s.schedule.lists[s.schedule.bookings[bookingId]!.listId]!
  return { who: s.masters.anaesthetists[list.anaesthetistId!]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: list.anaesthetistId! }
}

describe('Send prepayment reminder', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('offers the reminder to the office on an unpaid group, sends it and shows the sent line', () => {
    const { bookingId, invoiceId } = sentRiley()
    render(
      <SurfaceProvider variant="web">
        <PrepaymentPanel bookingId={bookingId} actor={OFFICE} links={LINKS} />
      </SurfaceProvider>,
    )
    expect(shot('prepayment-reminder-sent')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: SEND_REMINDER_LABEL }))
    const dialog = shot('prepayment-reminder-dialog')!
    expect(dialog).not.toBeNull()
    expect(within(dialog).getByText('Prepayment reminder')).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Preview letter' }))
    expect(shot('prepayment-reminder-preview')?.textContent).toContain('still to pay')

    fireEvent.click(shot('prepayment-reminder-send')!)
    expect(shot('prepayment-reminder-dialog')).toBeNull()
    const reminders = useAppStore.getState().billing.invoices[invoiceId]!.prepaymentReminders ?? []
    expect(reminders).toHaveLength(1)
    const line = shot('prepayment-reminder-sent')!
    expect(line.textContent).toMatch(/^Reminder sent \d{1,2} \w{3} \d{2}:\d{2} to \S+@\S+$/)
    expect(line.textContent).toContain(reminders[0]!.to)
  })

  it('shows the anaesthetist the sent line and who sends the letter, never the action', () => {
    const { bookingId } = sentRiley()
    render(
      <SurfaceProvider variant="mobile">
        <PrepaymentPanel bookingId={bookingId} actor={anaesthetistOf(bookingId)} />
      </SurfaceProvider>,
    )
    expect(screen.queryByRole('button', { name: SEND_REMINDER_LABEL })).toBeNull()
    expect(shot('prepayment-letter-by-office')?.textContent).toBe(OFFICE_SENDS_LETTER)
  })

  it('refuses without an invoice email and cannot send', () => {
    const { bookingId, invoiceId } = sentRiley()
    const s = useAppStore.getState()
    const inv = s.billing.invoices[invoiceId]!
    const { email: _email, ...billedTo } = inv.billedTo ?? { name: 'Payer' }
    void _email
    const { delivery: _delivery, ...rest } = inv
    void _delivery
    useAppStore.setState({ billing: { ...s.billing, invoices: { ...s.billing.invoices, [invoiceId]: { ...rest, billedTo } } } })
    render(
      <SurfaceProvider variant="web">
        <PrepaymentPanel bookingId={bookingId} actor={OFFICE} links={LINKS} />
      </SurfaceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: SEND_REMINDER_LABEL }))
    expect(shot('prepayment-reminder-no-address')?.textContent).toBe(REMINDER_MESSAGES.noInvoiceEmail)
    expect((shot('prepayment-reminder-send') as HTMLButtonElement).disabled).toBe(true)
  })
})

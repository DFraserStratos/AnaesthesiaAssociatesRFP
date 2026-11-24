/**
 * Catch-up Phase 41 session 2 surfaces (US-06.5.2, US-06.3.7): the cancel
 * sheet's prepayment note (paid and unpaid, the same for office and
 * anaesthetist), and the Booking's prepayment panel once a cancellation or a
 * Contract change settled it (the credit, the refund, a late payment).
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { approvePrepayment, cancelBooking, freshAppState, prepaymentStatusFor, useAppStore, wireBillingRun, type Actor } from '../../store'
import { OFFICE_ACTOR, SOUTER_ACTOR } from '../../store/demoActors'
import { stageLatePrepaymentPayment, stagePrepaidContractChange } from '../../store/prepaymentSettlementDemo'
import { SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../../domain/seed'
import { SurfaceProvider } from '../surface'
import { CancelBookingSheet } from '../flows/CancelBookingSheet'
import { PrepaymentPanel } from './PrepaymentPanel'
import { prepaidContractChangeText } from './prepaymentText'

const RILEY = SEED_MARKERS.prepaymentBooking!.entityId
const NAIR = SEED_PREPAID_BOOKING_ID

let unwire: () => void
beforeEach(() => {
  useAppStore.setState(freshAppState())
  unwire = wireBillingRun(useAppStore)
})
afterEach(() => {
  cleanup()
  unwire()
})

function approveRiley(): string {
  const group = prepaymentStatusFor(useAppStore.getState(), RILEY).groups[0]!
  const out = approvePrepayment(useAppStore, OFFICE_ACTOR, RILEY, group.payerKey)
  if (!out.ok) throw new Error(out.message)
  return out.value.invoiceId
}

function wrap(node: React.ReactNode, variant: 'web' | 'mobile' = 'web') {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant={variant}>{node}</SurfaceProvider>
    </MemoryRouter>,
  )
}

const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`)

describe('the cancel sheet names what happens to the prepayment', () => {
  for (const [who, actor] of [['office', OFFICE_ACTOR], ['anaesthetist', SOUTER_ACTOR]] as const) {
    it(`${who}: paid, it is refunded in full and credited; the primary stays Cancel booking`, () => {
      const number = useAppStore.getState().billing.invoices['INV0001']!.invoiceNumber
      wrap(<CancelBookingSheet open bookingId={NAIR} actor={actor as Actor} onClose={() => {}} onCancelled={() => {}} />, who === 'office' ? 'web' : 'mobile')
      expect(shot('cancel-prepayment')).toHaveTextContent(`Prepayment received · $1,380.00 on ${number}. Cancelling refunds it in full to the payer from the AA Holding account and credits the invoice.`)
      expect(screen.getByRole('button', { name: 'Cancel booking' })).toBeInTheDocument()
    })
  }

  it('unpaid: credited in full, so the patient is not chased; none on a Booking with no prepayment invoice', () => {
    wrap(<CancelBookingSheet open bookingId={RILEY} actor={OFFICE_ACTOR} onClose={() => {}} onCancelled={() => {}} />)
    expect(shot('cancel-prepayment')).toBeNull()
    cleanup()
    const invoiceId = approveRiley()
    const number = useAppStore.getState().billing.invoices[invoiceId]!.invoiceNumber
    wrap(<CancelBookingSheet open bookingId={RILEY} actor={OFFICE_ACTOR} onClose={() => {}} onCancelled={() => {}} />)
    expect(shot('cancel-prepayment')).toHaveTextContent(`Prepayment invoice ${number} is unpaid. Cancelling credits it in full, so the patient is not chased.`)
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Surgery postponed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }))
    expect(useAppStore.getState().schedule.bookings[RILEY]!.cancellation).toBeDefined()
  })
})

describe('the prepayment panel on a settled Booking', () => {
  it('cancelled and paid: credited (the number opens the credit note on Admin) and refunded from the AA Holding account', () => {
    expect(cancelBooking(useAppStore, OFFICE_ACTOR, NAIR, 'Patient withdrew').ok).toBe(true)
    const note = Object.values(useAppStore.getState().billing.creditNotes).find((c) => c.cause === 'prepaymentCancelled')!
    let opened: string | undefined
    wrap(<PrepaymentPanel bookingId={NAIR} actor={OFFICE_ACTOR} links={{ onOpenInvoices: () => {}, onOpenInvoice: () => {}, onOpenCreditNote: (id) => (opened = id) }} />)
    const settled = shot('prepayment-settled')!
    expect(settled).toHaveTextContent(`Credited · ${note.creditNoteNumber}`)
    expect(settled).toHaveTextContent('Refunded to the payer from the AA Holding account · $1,380.00 on 24 Nov')
    fireEvent.click(screen.getByRole('button', { name: note.creditNoteNumber }))
    expect(opened).toBe(note.id)
  })

  it('cancelled unpaid, then a late payment: credited, then "Late payment of $1,380.00 refunded on 24 Nov"; plain number for the anaesthetist', () => {
    approveRiley()
    expect(cancelBooking(useAppStore, SOUTER_ACTOR, RILEY, 'Surgery postponed').ok).toBe(true)
    wrap(<PrepaymentPanel bookingId={RILEY} actor={SOUTER_ACTOR} />, 'mobile')
    expect(shot('prepayment-settled')).toHaveTextContent('Credited · CN-')
    expect(document.querySelectorAll('[data-shot="prepayment-settled-refund"]')).toHaveLength(0)
    expect(screen.queryByRole('button')).toBeNull()
    cleanup()
    const late = stageLatePrepaymentPayment(useAppStore, RILEY)
    if (!late.ok) throw new Error(late.message)
    wrap(<PrepaymentPanel bookingId={RILEY} actor={SOUTER_ACTOR} />, 'mobile')
    expect(shot('prepayment-settled')).toHaveTextContent(/Late payment of \$[\d,.]+ refunded on 24 Nov/)
  })

  it('Contract changed off prepaid: "Credited · CN-… · Contract changed off prepaid" and its refund', () => {
    const out = stagePrepaidContractChange(useAppStore, OFFICE_ACTOR, NAIR)
    if (!out.ok) throw new Error(out.message)
    wrap(<PrepaymentPanel bookingId={NAIR} actor={OFFICE_ACTOR} />)
    const settled = shot('prepayment-settled')!
    expect(settled).toHaveTextContent(`Credited · ${out.value.creditNoteNumber} · Contract changed off prepaid`)
    expect(settled).toHaveTextContent('Refunded to the payer from the AA Holding account · $1,380.00 on 24 Nov')
  })

  it('the Contract-change line names the invoice, plainly', () => {
    expect(prepaidContractChangeText('AA-2026-0002')).toBe(
      'Prepayment invoice AA-2026-0002 was sent. Changing the Contract credits it (and refunds what was paid), then bills this procedure after it under the new Contract.',
    )
  })
})

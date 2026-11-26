/**
 * The AA Holding account card's Credited and Refunded rows (catch-up Phase 41;
 * US-06.5.2): the credit number, the patient by name (never the NHI), the
 * amount and the cause, read-only.
 */

import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cancelBooking, freshAppState, useAppStore, wireBillingRun } from '../../../store'
import { OFFICE_ACTOR } from '../../../store/demoActors'
import { SEED_PREPAID_BOOKING_ID } from '../../../domain/seed'
import { HoldingAccountPanel } from './HoldingAccountPanel'

let unwire: () => void
beforeEach(() => {
  useAppStore.setState(freshAppState())
  unwire = wireBillingRun(useAppStore)
})
afterEach(() => {
  cleanup()
  unwire()
})

describe('HoldingAccountPanel: credited and refunded rows', () => {
  it('a cancelled, paid prepayment adds a Credited and a Refunded row, each with its credit number and "Cancelled"', () => {
    expect(cancelBooking(useAppStore, OFFICE_ACTOR, SEED_PREPAID_BOOKING_ID, 'Patient withdrew').ok).toBe(true)
    render(
      <MemoryRouter>
        <HoldingAccountPanel />
      </MemoryRouter>,
    )
    const card = document.querySelector('[data-shot="billing-prepay-holding"]')!
    const note = Object.values(useAppStore.getState().billing.creditNotes).find((c) => c.cause === 'prepaymentCancelled')!
    for (const kind of ['credited', 'refunded']) {
      const row = card.querySelector(`[data-shot="holding-entry"][data-entry-kind="${kind}"]`)!
      expect(row, kind).not.toBeNull()
      expect(row).toHaveTextContent(note.creditNoteNumber)
      expect(row).toHaveTextContent('Cancelled')
      expect(row).toHaveTextContent('$1,380.00')
    }
    const state = useAppStore.getState()
    const patient = state.masters.patients[state.schedule.bookings[SEED_PREPAID_BOOKING_ID]!.patientId]!
    expect(card).toHaveTextContent(patient.name)
    expect(card.textContent).not.toContain(patient.nhi!)
    expect(card.querySelector('[data-holding-balance]')!.getAttribute('data-holding-balance')).toBe('0')
  })

  it('bare (the Ledger tab view) keeps every hook without the outer card', () => {
    render(
      <MemoryRouter>
        <HoldingAccountPanel bare />
      </MemoryRouter>,
    )
    const panel = document.querySelector('[data-shot="billing-prepay-holding"]')!
    expect(panel.getAttribute('data-holding-bare')).toBe('true')
    expect(panel).toHaveTextContent('AA Holding account')
    expect(panel).toHaveTextContent('to confirm with AA (OQ-125)')
    expect(panel).toHaveTextContent('Held for 1 prepaid Booking')
    expect(panel.querySelector('[data-holding-balance]')!.getAttribute('data-holding-balance')).toBe('1380')
    const entry = panel.querySelector(`[data-shot="holding-entry"][data-booking-id="${SEED_PREPAID_BOOKING_ID}"]`)!
    expect(entry).not.toBeNull()
    expect(entry.getAttribute('data-entry-kind')).toBe('received')
  })
})

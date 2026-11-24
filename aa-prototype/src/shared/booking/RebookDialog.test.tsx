/**
 * Rebook with another anaesthetist (catch-up Phase 41, work item 18; US-06.5.3):
 * the dialog lists the colleagues (the original excluded) and their ACTIVE
 * Lists, previews the new prepayment at the chosen anaesthetist's own price,
 * rebooks with the teal primary and shows a refusal in its own words.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SurfaceProvider } from '../surface'
import { cancelBooking, freshAppState, REBOOK_MESSAGES, useAppStore, type Actor } from '../../store'
import { ANAE, SEED_PREPAID_BOOKING_ID } from '../../domain/seed'
import { RebookDialog } from './RebookDialog'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const NAIR = SEED_PREPAID_BOOKING_ID
/** Dr Beaumont's Tue 4 Aug PM List at Forte Health with Mr V. Nand (ENT): her prepaid Rhinoplasty is offered there. */
const BEAUMONT_ENT_LIST = 'L-31902-2026-12-08-PM'
/** Her Mon 27 Jul AM List at St George's with Mr T. Hale (orthopaedics): it is not. */
const BEAUMONT_ORTHO_LIST = 'L-31902-2026-11-30-AM'

function shot(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-shot="${name}"]`)
}

function renderDialog(onRebooked = vi.fn()) {
  render(
    <SurfaceProvider variant="web">
      <RebookDialog bookingId={NAIR} actor={OFFICE} onClose={() => undefined} onRebooked={onRebooked} />
    </SurfaceProvider>,
  )
  return onRebooked
}

function chooseBeaumont() {
  fireEvent.change(shot('rebook-anaesthetist')!, { target: { value: ANAE.beaumont } })
}

function pickList(listId: string) {
  fireEvent.click(document.querySelector(`[data-shot="rebook-list"][data-list-id="${listId}"]`)!)
}

describe('RebookDialog', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('offers every colleague but the original, rebooks with Dr Beaumont at her own price and hands back the new Booking', () => {
    const cancelled = cancelBooking(useAppStore, OFFICE, NAIR, 'Patient asked for another anaesthetist')
    expect(cancelled.ok).toBe(true)
    const onRebooked = renderDialog()
    const dialog = shot('rebook-dialog')!
    expect(within(dialog).getByText('Rebook with another anaesthetist')).toBeTruthy()
    const options = [...(shot('rebook-anaesthetist') as HTMLSelectElement).options].map((o) => o.value)
    expect(options).not.toContain(ANAE.souter)
    expect(options).toContain(ANAE.beaumont)

    chooseBeaumont()
    // Her ACTIVE Lists from today: the date in mono, the session, the hospital and the surgeon.
    const card = document.querySelector<HTMLElement>(`[data-shot="rebook-list"][data-list-id="${BEAUMONT_ENT_LIST}"]`)!
    expect(card.textContent).toContain('Tue 8 Dec · PM')
    expect(card.textContent).toContain('Forte Health · Mr V. Nand')
    expect(card.querySelector('.mono')?.textContent).toBe('Tue 8 Dec')

    pickList(BEAUMONT_ENT_LIST)
    const price = shot('rebook-price')!
    expect(price.textContent).toBe("New prepayment at Dr Beaumont's own price: $1,350.00 ex GST")
    expect(price.querySelector('.mono')?.textContent).toBe('$1,350.00')

    fireEvent.click(shot('rebook-submit')!)
    expect(onRebooked).toHaveBeenCalledTimes(1)
    const newId = onRebooked.mock.calls[0]![0] as string
    expect(useAppStore.getState().schedule.bookings[newId]).toMatchObject({ listId: BEAUMONT_ENT_LIST, rebookedFromBookingId: NAIR, source: 'rebook' })
  })

  it('says so when the chosen List offers no price of hers', () => {
    cancelBooking(useAppStore, OFFICE, NAIR, 'Patient asked for another anaesthetist')
    renderDialog()
    chooseBeaumont()
    pickList(BEAUMONT_ORTHO_LIST)
    expect(shot('rebook-price')?.textContent).toBe('Dr Beaumont has no price for this procedure; the office adds it to their price list.')
  })

  it('shows a refusal in its own words and stays open', () => {
    // Not cancelled: the store refuses.
    const onRebooked = renderDialog()
    chooseBeaumont()
    pickList(BEAUMONT_ENT_LIST)
    fireEvent.click(screen.getByRole('button', { name: 'Rebook' }))
    expect(onRebooked).not.toHaveBeenCalled()
    expect(shot('rebook-refusal')?.textContent).toBe(REBOOK_MESSAGES.notCancelled)
    expect(shot('rebook-dialog')).not.toBeNull()
  })
})

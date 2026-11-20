/**
 * The prepayment history block (catch-up Phase 41, work item 18; US-06.5.3):
 * shown on a rebooked chain only, the earlier prepayment with how it was
 * settled and this one, amounts in mono, ex GST.
 */

import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SurfaceProvider } from '../surface'
import { cancelBooking, freshAppState, rebookWithAnotherAnaesthetist, useAppStore, type Actor } from '../../store'
import { SEED_PREPAID_BOOKING_ID } from '../../domain/seed'
import { PrepaymentHistory } from './PrepaymentHistory'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const NAIR = SEED_PREPAID_BOOKING_ID
const BEAUMONT_ENT_LIST = 'L-31902-2026-08-04-PM'

function rows(): string[] {
  return [...document.querySelectorAll<HTMLElement>('[data-shot="prepayment-history-row"]')].map((r) => r.textContent ?? '')
}

function renderHistory(bookingId: string) {
  return render(
    <SurfaceProvider variant="web">
      <PrepaymentHistory bookingId={bookingId} />
    </SurfaceProvider>,
  )
}

describe('PrepaymentHistory', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('shows nothing on a Booking never rebooked', () => {
    renderHistory(NAIR)
    expect(document.querySelector('[data-shot="prepayment-history"]')).toBeNull()
  })

  it('on the new Booking: the earlier prepayment refunded, then this one; from the cancelled one, the later one', () => {
    expect(cancelBooking(useAppStore, OFFICE, NAIR, 'Patient asked for another anaesthetist').ok).toBe(true)
    const out = rebookWithAnotherAnaesthetist(useAppStore, OFFICE, NAIR, BEAUMONT_ENT_LIST)
    if (!out.ok) throw new Error(out.message)

    const view = renderHistory(out.value.bookingId)
    expect(rows()).toEqual(['Earlier prepayment · Dr Souter · $1,200.00 ex GST · refunded', 'This prepayment · Dr Beaumont · $1,350.00 ex GST'])
    expect([...document.querySelectorAll('[data-shot="prepayment-history"] .mono')].map((m) => m.textContent)).toEqual(['$1,200.00', '$1,350.00'])
    view.unmount()

    renderHistory(NAIR)
    expect(rows()).toEqual(['This prepayment · Dr Souter · $1,200.00 ex GST · refunded', 'Later prepayment · Dr Beaumont · $1,350.00 ex GST'])
  })
})

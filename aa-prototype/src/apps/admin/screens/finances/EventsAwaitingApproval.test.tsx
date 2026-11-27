/**
 * Events awaiting approval on Finances › Payments (US-03.7.2, US-13.3.3): every event on a
 * Procedure waiting for the office's review, a credit as one row with its new invoices nested;
 * a row opens the review sheet, whose Approve for billing moves the event to the events awaiting
 * the run beside it. The Payments tab's number and the Finances badge count the events awaiting
 * approval (`financeCounts.ts`); with none waiting the tab shows no number.
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, submitCredit, useAppStore, type Actor, type CreditInput } from '../../../../store'
import { SEED_EVENT_ID } from '../../../../domain/seed/procedureEvents'
import { financesRoutes } from '../../../../test/adminRoutes'
import { AdminApp } from '../../AdminApp'
import { eventsAwaitingApprovalCount, financeBadge } from './financeCounts'
import { financePath } from './financePaths'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function mountPayments() {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        {financesRoutes()}
      </Route>,
    ),
    { initialEntries: [financePath('payments')] },
  )
  render(<RouterProvider router={router} />)
  return router
}

/** A credit of the seeded AA-2026-H03 with `replacements` new invoices, awaiting approval. */
function submitCreditWith(replacements: number): string {
  const input: CreditInput = {
    invoiceId: 'HINV03',
    reason: 'Wrong amount',
    cause: 'correction',
    replacements: Array.from({ length: replacements }, (_, i) => ({
      occurredOnISO: useAppStore.getState().clock.todayISO,
      party: { sameAs: true },
      lines: [{ description: `Corrected fee ${i + 1}`, quantity: 1, unitAmount: 200 }],
    })),
  }
  const out = submitCredit(useAppStore, OFFICE, input)
  if (!out.ok) throw new Error(out.message)
  return out.value.creditEventId
}

const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement | null

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('events awaiting approval on the Payments tab', () => {
  it('lists the seeded event above the payment cycle, with its review', () => {
    mountPayments()
    const card = shot('events-awaiting-approval')!
    expect(card.textContent).toContain('Events awaiting approval')
    const rows = card.querySelectorAll('tbody[data-shot="admin-events-queue"] tr[data-event-id]')
    expect([...rows].map((r) => r.getAttribute('data-event-id'))).toEqual([SEED_EVENT_ID])
    // It sits above the cycle: approving events comes first.
    expect(card.compareDocumentPosition(shot('payment-cycle')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // The Payments tab counts it.
    expect(document.querySelector('[data-finances-tab="payments"]')?.textContent).toBe('Payments1')
  })

  it('shows a credit as one row with its new invoices nested, and counts it once', () => {
    submitCreditWith(2)
    mountPayments()
    const creditRows = document.querySelectorAll('tr[data-kind="credit"]')
    expect(creditRows).toHaveLength(1)
    expect(creditRows[0]!.textContent).toContain('Credit AA-2026-H03 in full, 2 new invoices')
    expect(document.querySelectorAll('[data-shot="review-credit-replacement"]')).toHaveLength(2)
    // The seeded EV0001 and the credit: two to review, not four.
    expect(eventsAwaitingApprovalCount(useAppStore.getState())).toBe(2)
    expect(shot('events-awaiting-approval')!.querySelector('h2')?.textContent).toContain('2')
  })

  it('two events awaiting approval: the Payments tab shows 2 and they add 2 to the Finances badge', () => {
    const { [SEED_EVENT_ID]: _seeded, ...rest } = useAppStore.getState().schedule.procedureEvents
    useAppStore.setState({ schedule: { ...useAppStore.getState().schedule, procedureEvents: rest } })
    const without = financeBadge(useAppStore.getState())
    useAppStore.setState(freshAppState())
    submitCreditWith(1)
    mountPayments()
    expect(document.querySelector('[data-finances-tab="payments"]')?.textContent).toBe('Payments2')
    expect(financeBadge(useAppStore.getState())).toBe(without + 2)
    expect(shot('nav-badge-finances')?.textContent).toBe(String(without + 2))
  })

  it('a row opens the review sheet; Approve for billing moves the event to the events awaiting the run', async () => {
    mountPayments()
    expect(shot('events-awaiting-run')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Review the .* for / }))
    expect(shot('event-review-sheet')).not.toBeNull()
    await act(async () => {
      fireEvent.click(shot('event-review-approve')!)
    })
    expect(shot('event-review-sheet')!.textContent).toContain('Approved. Invoiced in the next billing run.')
    expect(shot('events-awaiting-approval')).toBeNull()
    expect(shot('events-awaiting-run')!.querySelector(`[data-event-id="${SEED_EVENT_ID}"]`)).not.toBeNull()
    expect(eventsAwaitingApprovalCount(useAppStore.getState())).toBe(0)
    // Nothing waits and nothing in the payment cycle is due: no number on the Payments tab.
    expect(document.querySelector('[data-finances-tab="payments"]')?.textContent).toBe('Payments')
  })
})

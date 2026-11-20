import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, useAppStore, type Actor } from '../../store'
import { SurfaceProvider } from '../surface'
import { CreditForm, creditMoneySentences } from './CreditForm'
import { CREDIT_LABELS, CREDIT_MESSAGES } from '../procedureEventCopy'

/**
 * Catch-up Phase 39, work item 7: the office's credit form on the seeded
 * AA-2026-H03 (David Chen's HP03, St George's, unpaid, in Xero; Dr Souter's).
 */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderForm(mode: 'credit' | 'rebill' = 'credit', onDone = vi.fn()) {
  const onClose = vi.fn()
  const utils = render(
    <MemoryRouter>
      <SurfaceProvider variant="web">
        <CreditForm invoiceId="HINV03" actor={OFFICE} mode={mode} onClose={onClose} onDone={onDone} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
  return { ...utils, onClose, onDone }
}

const credits = () => Object.values(useAppStore.getState().schedule.procedureEvents).filter((e) => e.kind === 'credit')

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('CreditForm, the office variant', () => {
  it("shows the original's number, party and total, with the credit going to the original's party by default", () => {
    const { container } = renderForm()
    const original = container.querySelector('[data-shot="credit-original"]')!
    expect(original.textContent).toContain('AA-2026-H03')
    expect(original.textContent).toContain('$520.50')
    const party = container.querySelector('[data-shot="credit-party"]')!
    const tick = within(party as HTMLElement).getByRole('checkbox')
    expect(tick).toBeChecked()
    expect(party.textContent).toContain('Same as the original invoice')
  })

  it('states the money in plain words and that a credit note is not a refund', () => {
    const { container } = renderForm()
    const money = container.querySelector('[data-shot="credit-money-state"]')!
    expect(money.textContent).toContain('Unpaid: nothing held.')
    expect(money.textContent).toContain("Dr Souter's payment is reversed: a negative invoice for $520.50, offset against the unpaid payable.")
    expect(container.querySelector('[data-shot="credit-not-refund"]')?.textContent).toContain(CREDIT_LABELS.notARefund)
  })

  it('has no amount to type for the credit: Credit note opens with no new invoice, Credit in full and rebill with one', () => {
    renderForm('credit')
    expect(screen.queryAllByLabelText('Amount')).toHaveLength(0)
    expect(document.querySelectorAll('[data-shot="credit-replacement"]')).toHaveLength(0)
    cleanup()
    renderForm('rebill')
    const cards = document.querySelectorAll('[data-shot="credit-replacement"]')
    expect(cards).toHaveLength(1)
    // The one amount field is the new invoice's line, never the credit's.
    expect(within(cards[0] as HTMLElement).getAllByLabelText('Amount')).toHaveLength(1)
    expect(screen.getAllByLabelText('Amount')).toHaveLength(1)
  })

  it('requires a reason, then submits the credit for review', () => {
    const { container, onDone, onClose } = renderForm()
    fireEvent.click(screen.getByRole('button', { name: CREDIT_LABELS.submit }))
    expect(screen.getByText(CREDIT_MESSAGES.reasonRequired)).toBeTruthy()
    expect(credits()).toHaveLength(0)
    const chip = within(container.querySelector('[data-shot="credit-reason"]') as HTMLElement).getByRole('button', { name: 'Wrong amount' })
    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: CREDIT_LABELS.submit }))
    expect(credits()).toHaveLength(1)
    expect(credits()[0]!.review.state).toBe('awaitingReview')
    expect(onDone).toHaveBeenCalledWith(credits()[0]!.id)
    expect(onClose).toHaveBeenCalled()
  })

  it('words the paid-out cases', () => {
    const base = { receivableCredited: 100, negativeInvoiceTotal: 100, releaseCancelled: 0 }
    expect(creditMoneySentences({ ...base, heldForPayer: 100, offsetAgainstPayable: 0, recoveryDue: 100 }, 'Southern Cross', 'Dr Sharma')).toEqual([
      'Paid $100.00: $100.00 will be held for Southern Cross.',
      'Dr Sharma was paid $100.00: a negative invoice for $100.00 nets in their next payment run.',
    ])
    expect(creditMoneySentences({ ...base, heldForPayer: 0, offsetAgainstPayable: 60, recoveryDue: 40 }, 'X', 'Dr Sharma')[1]).toBe(
      'Dr Sharma was paid $40.00: a negative invoice for $100.00, $60.00 offset against the unpaid payable and $40.00 netted in their next payment run.',
    )
  })
})

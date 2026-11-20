import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { creditDetailOf } from '../../domain/billing/procedureEvent'
import { freshAppState, invoiceLinesFor, SOUTER_ACTOR, useAppStore, type Actor } from '../../store'
import { SurfaceProvider } from '../surface'
import { CreditForm, putRestOn } from './CreditForm'
import { CreditNoteButton } from './CreditNoteButton'
import { SplitCombinedButton } from './SplitCombinedButton'
import { CREDIT_LABELS, SPLIT_MESSAGES } from '../procedureEventCopy'
import { formatCurrency } from '../format'

/**
 * Catch-up Phase 39, session 2 (work items 9 to 11) on the seeded AA-2026-H03
 * (David Chen's HP03, Dr Souter's, unpaid, in Xero): the office's rebill from
 * a copy and its split, and the anaesthetist's credit form, which has no copy,
 * no split and no ledger figures.
 */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const ORIGINAL = 'HINV03'
const PROCEDURE = 'HP03'

function renderForm(props: { mode?: 'credit' | 'rebill' | 'split'; actor?: Actor }, surface: 'web' | 'mobile' = 'web') {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant={surface}>
        <CreditForm invoiceId={ORIGINAL} actor={props.actor ?? OFFICE} {...(props.mode !== undefined ? { mode: props.mode } : {})} onClose={() => undefined} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const credits = () => Object.values(useAppStore.getState().schedule.procedureEvents).filter((e) => e.kind === 'credit')
const original = () => useAppStore.getState().billing.invoices[ORIGINAL]!
const amounts = (card: Element) => [...card.querySelectorAll<HTMLInputElement>('input[data-shot="line-amount"]')].map((i) => i.value)
const descriptions = (card: Element) => [...card.querySelectorAll<HTMLInputElement>('input[data-shot="line-description"]')].map((i) => i.value)

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('the rebill from a copy (US-08.6.6), the office only', () => {
  it("Credit in full and rebill opens with one card holding the original's lines, totalling the original", () => {
    const { container } = renderForm({ mode: 'rebill' })
    const cards = container.querySelectorAll('[data-shot="credit-replacement"]')
    expect(cards).toHaveLength(1)
    const lines = invoiceLinesFor(useAppStore.getState(), ORIGINAL).filter((l) => l.amount !== 0)
    expect(descriptions(cards[0]!)).toEqual(lines.filter((l) => l.amount > 0).map((l) => l.description.trim()).slice(0, descriptions(cards[0]!).length))
    expect(cards[0]!.querySelector('[data-shot="credit-replacement-totals"]')?.textContent).toContain(formatCurrency(original().total))
  })

  it("Credit note offers \"Start from a copy of the original's lines\" on a card it adds", () => {
    const { container } = renderForm({ mode: 'credit' })
    expect(container.querySelectorAll('[data-shot="credit-copy-lines"]')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: CREDIT_LABELS.addInvoice }))
    const card = container.querySelector('[data-shot="credit-replacement"]')!
    expect(amounts(card)).toEqual([''])
    fireEvent.click(within(card as HTMLElement).getByRole('button', { name: CREDIT_LABELS.copyLines }))
    expect(card.querySelector('[data-shot="credit-replacement-totals"]')?.textContent).toContain(formatCurrency(original().total))
  })

  it('an edited copy submits as its own lines; the credit is a correction, not a split', () => {
    const { container } = renderForm({ mode: 'rebill' })
    const card = container.querySelector('[data-shot="credit-replacement"]')!
    const amount = card.querySelector<HTMLInputElement>('input[data-shot="line-amount"]')!
    fireEvent.change(amount, { target: { value: '400' } })
    fireEvent.click(within(container.querySelector('[data-shot="credit-reason"]') as HTMLElement).getByRole('button', { name: 'Wrong amount' }))
    fireEvent.click(screen.getByRole('button', { name: CREDIT_LABELS.submit }))
    expect(credits()).toHaveLength(1)
    expect(creditDetailOf(credits()[0])?.cause).toBe('correction')
    expect(creditDetailOf(credits()[0])?.replacementEventIds).toHaveLength(1)
  })
})

describe('the split (US-08.6.4, OQ-77 part 1), the office only', () => {
  it('opens with two blank components, Left to allocate at the credited amount and Submit disabled', () => {
    const { container } = renderForm({ mode: 'split' })
    expect(container.querySelectorAll('[data-shot="split-component"]')).toHaveLength(2)
    // Two is the floor: no remove until a third is added.
    expect(container.querySelectorAll('[data-shot="credit-replacement-remove"]')).toHaveLength(0)
    const left = container.querySelector('[data-shot="split-left-to-allocate"]')!
    expect(left.textContent).toContain(formatCurrency(original().subtotal))
    expect(left.getAttribute('data-done')).toBe('false')
    expect(screen.getByRole('button', { name: CREDIT_LABELS.submitSplit(2) })).toBeDisabled()
    expect(container.textContent).toContain(CREDIT_LABELS.splitMustAddUp)
    expect(container.textContent).toContain(CREDIT_LABELS.splitDescription)
    // A component is typed freely: no copy of the original's lines.
    expect(container.querySelectorAll('[data-shot="credit-copy-lines"]')).toHaveLength(0)
  })

  it('a mismatch keeps Submit disabled; "Put the rest on this invoice" brings Left to allocate to $0.00 and the split submits', () => {
    const { container } = renderForm({ mode: 'split' })
    const [first, second] = [...container.querySelectorAll('[data-shot="split-component"]')]
    fireEvent.change(first!.querySelector('input[data-shot="line-description"]')!, { target: { value: 'Facelift' } })
    fireEvent.change(first!.querySelector('input[data-shot="line-amount"]')!, { target: { value: '300' } })
    fireEvent.change(second!.querySelector('input[data-shot="line-description"]')!, { target: { value: 'Blepharoplasty' } })
    fireEvent.change(second!.querySelector('input[data-shot="line-amount"]')!, { target: { value: '100' } })
    const left = () => container.querySelector('[data-shot="split-left-to-allocate"]')!
    expect(left().getAttribute('data-left')).toBe((original().subtotal - 400).toFixed(2))
    expect(screen.getByRole('button', { name: CREDIT_LABELS.submitSplit(2) })).toBeDisabled()
    fireEvent.click(within(second as HTMLElement).getByRole('button', { name: CREDIT_LABELS.putTheRest }))
    expect(left().getAttribute('data-done')).toBe('true')
    expect(left().textContent).toContain('$0.00')
    const submit = screen.getByRole('button', { name: CREDIT_LABELS.submitSplit(2) })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)
    expect(credits()).toHaveLength(1)
    expect(creditDetailOf(credits()[0])?.cause).toBe('split')
    expect(creditDetailOf(credits()[0])?.replacementEventIds).toHaveLength(2)
  })

  it('putRestOn adds to the last quantity-1 line, appends a line for a positive rest it cannot take, and refuses what would go to zero', () => {
    const lines = [{ description: 'A', quantity: '1', amount: '100.00' }]
    expect(putRestOn(lines, 25.5)).toEqual([{ description: 'A', quantity: '1', amount: '125.50' }])
    expect(putRestOn(lines, -40)).toEqual([{ description: 'A', quantity: '1', amount: '60.00' }])
    expect(putRestOn(lines, -100)).toBeNull()
    expect(putRestOn(lines, 0)).toBeNull()
    expect(putRestOn([{ description: 'B', quantity: '2', amount: '10' }], 5)).toEqual([
      { description: 'B', quantity: '2', amount: '10' },
      { description: CREDIT_LABELS.restLine, quantity: '1', amount: '5.00' },
    ])
    expect(putRestOn([{ description: '', quantity: '1', amount: '' }], 99.99)).toEqual([{ description: CREDIT_LABELS.restLine, quantity: '1', amount: '99.99' }])
  })
})

describe("the anaesthetist's credit form (US-08.6.5): no copy, no split, no ledger figures", () => {
  for (const surface of ['web', 'mobile'] as const) {
    it(`on ${surface}: the original's number and total ex GST, the reversal sentence, its chips, and nothing of the office's`, () => {
      const { container } = renderForm({ actor: SOUTER_ACTOR, mode: 'rebill' }, surface)
      const form = container.querySelector('[data-shot="credit-form"]')!
      expect(form.getAttribute('data-variant')).toBe('anaesthetist')
      // A rebill or a split asked of the anaesthetist's form opens as a plain credit note.
      expect(form.getAttribute('data-mode')).toBe('credit')
      expect(container.querySelectorAll('[data-shot="credit-replacement"]')).toHaveLength(0)
      expect(container.querySelector('[data-shot="credit-original"]')?.textContent).toContain('AA-2026-H03')
      expect(container.querySelector('[data-shot="credit-original-total"]')?.textContent).toBe(formatCurrency(original().subtotal))
      expect(container.textContent).toContain(CREDIT_LABELS.yourPaymentReversed)
      expect(container.textContent).toContain(CREDIT_LABELS.notARefund)
      expect(container.textContent).toContain(CREDIT_LABELS.anaesthetistSubmitNote)
      const chips = within(container.querySelector('[data-shot="credit-reason"]') as HTMLElement).getAllByRole('button').map((b) => b.textContent)
      expect(chips).toEqual([...CREDIT_LABELS.anaesthetistReasons])
      // No ledger figures, offsets or amounts to net; no trail; no copy; no split.
      for (const shot of ['credit-money-state', 'credit-trail', 'credit-copy-lines', 'split-left-to-allocate', 'split-component', 'split-put-rest']) {
        expect(container.querySelectorAll(`[data-shot="${shot}"]`)).toHaveLength(0)
      }
      expect(container.textContent).not.toContain('negative invoice')
      expect(container.textContent).not.toContain('offset')
      expect(container.textContent).not.toContain('nets in')
      // Add an invoice: typed lines, no copy, no equal-total rule.
      fireEvent.click(screen.getByRole('button', { name: CREDIT_LABELS.addInvoice }))
      expect(container.querySelectorAll('[data-shot="credit-replacement"]')).toHaveLength(1)
      expect(container.querySelectorAll('[data-shot="credit-copy-lines"]')).toHaveLength(0)
      expect(screen.getByRole('button', { name: CREDIT_LABELS.submit })).toBeEnabled()
    })
  }

  it('submits for review as the anaesthetist', () => {
    const { container } = renderForm({ actor: SOUTER_ACTOR })
    fireEvent.click(within(container.querySelector('[data-shot="credit-reason"]') as HTMLElement).getByRole('button', { name: 'Less work than expected' }))
    fireEvent.click(screen.getByRole('button', { name: CREDIT_LABELS.submit }))
    expect(credits()).toHaveLength(1)
    expect(credits()[0]!.addedBy.anaesthetistId).toBe(SOUTER_ACTOR.anaesthetistId)
    expect(credits()[0]!.review.state).toBe('awaitingReview')
  })
})

describe('the Credit note entry on a Procedure', () => {
  const button = (actor: Actor) =>
    render(
      <MemoryRouter>
        <SurfaceProvider variant="mobile">
          <CreditNoteButton procedureId={PROCEDURE} actor={actor} />
        </SurfaceProvider>
      </MemoryRouter>,
    )

  it("shows to the anaesthetist on their own invoiced Procedure, and is hidden on a colleague's", () => {
    const own = button(SOUTER_ACTOR)
    expect(own.container.querySelector('[data-shot="anaesthetist-credit-note-button"]')).toBeEnabled()
    expect(own.container.querySelector('[data-shot="procedure-credit-note-button"]')).toBeNull()
    cleanup()
    const colleague = button({ ...SOUTER_ACTOR, who: 'Dr Sharma', anaesthetistId: 'COLLEAGUE-NOT-THE-OWNER' })
    expect(colleague.container.innerHTML).toBe('')
  })

  it('is disabled with its sentence while a credit is waiting for review', () => {
    const { container } = renderForm({ actor: SOUTER_ACTOR })
    fireEvent.click(within(container.querySelector('[data-shot="credit-reason"]') as HTMLElement).getByRole('button', { name: 'Paid twice' }))
    fireEvent.click(screen.getByRole('button', { name: CREDIT_LABELS.submit }))
    cleanup()
    const own = button(SOUTER_ACTOR)
    const entry = own.container.querySelector('[data-shot="anaesthetist-credit-note-button"]')!
    expect(entry).toBeDisabled()
    expect(own.container.textContent).toContain('A credit for this invoice is waiting for review.')
  })
})

describe('Split into additional invoices on a Procedure (US-08.6.4)', () => {
  const split = (procedureId: string, actor: Actor = OFFICE) =>
    render(
      <MemoryRouter>
        <SurfaceProvider variant="web">
          <SplitCombinedButton procedureId={procedureId} actor={actor} />
        </SurfaceProvider>
      </MemoryRouter>,
    )

  it("is the office's on an invoiced Procedure, and never rendered for the anaesthetist", () => {
    expect(split(PROCEDURE).container.querySelector('[data-shot="split-combined-button"]')).toBeEnabled()
    cleanup()
    expect(split(PROCEDURE, SOUTER_ACTOR).container.innerHTML).toBe('')
  })

  it('is disabled with the edit sentence before the invoice exists (OQ-77 part 3)', () => {
    const s = useAppStore.getState()
    const notInvoiced = Object.values(s.schedule.procedures).find((p) => {
      const b = s.schedule.bookings[p.bookingId]
      const l = b !== undefined ? s.schedule.lists[b.listId] : undefined
      return l !== undefined && l.state !== 'AUTHORISED' && b?.cancellation === undefined && !Object.values(s.billing.invoices).some((i) => (i.procedureIds ?? []).includes(p.id))
    })!
    const { container } = split(notInvoiced.id)
    expect(container.querySelector('[data-shot="split-combined-button"]')).toBeDisabled()
    expect(container.textContent).toContain(SPLIT_MESSAGES.notYetInvoiced)
  })
})


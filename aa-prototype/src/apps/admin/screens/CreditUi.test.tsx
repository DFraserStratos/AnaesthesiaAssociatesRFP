import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { approveCreditUnit, creditNoteForInvoice, freshAppState, pairForInvoice, submitCredit, useAppStore, type Actor, type CreditInput } from '../../../store'
import { runNextBillingRun } from '../../../store/eventDemo'
import { SurfaceProvider } from '../../../shared/surface'
import { ProcedureEventsList } from '../../../shared/booking/ProcedureEventsList'
import { paymentDisabledReason } from '../../../shared/demoTriggers/registry'
import { InvoiceDocument, CreditNoteDocument } from './InvoiceDocument'
import { InvoicesScreen } from './InvoicesScreen'
import { ReviewQueue } from './ReviewQueue'

/**
 * Catch-up Phase 39, work item 7: the Admin side of a credit on the seeded
 * AA-2026-H03 (David Chen's HP03, St George's, $520.50, unpaid, in Xero):
 * the review queue's one row per correction, the credited original and its
 * banner, the credit note document, the events list's credit row and the
 * Invoices screen.
 */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const ORIGINAL = 'HINV03'

function input(replacements: number): CreditInput {
  return {
    invoiceId: ORIGINAL,
    reason: 'Wrong amount',
    cause: 'correction',
    replacements: Array.from({ length: replacements }, (_, i) => ({
      occurredOnISO: useAppStore.getState().clock.todayISO,
      party: { sameAs: true },
      lines: [{ description: `Corrected fee ${i + 1}`, quantity: 1, unitAmount: 200 }],
    })),
  }
}

function submit(replacements: number): string {
  const out = submitCredit(useAppStore, OFFICE, input(replacements))
  if (!out.ok) throw new Error(out.message)
  return out.value.creditEventId
}

function issue(replacements: number): string {
  const id = submit(replacements)
  const approved = approveCreditUnit(useAppStore, OFFICE, id)
  if (!approved.ok) throw new Error(approved.message)
  const run = runNextBillingRun(useAppStore)
  if (!run.ok) throw new Error(run.message)
  return id
}

function inAdmin(node: React.ReactNode, path = '/admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">{node}</SurfaceProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('Admin Review, Events tab', () => {
  it('shows a credit as one row with its new invoices nested, and counts it once', () => {
    submit(2)
    const { container } = inAdmin(<ReviewQueue onOpen={() => undefined} onViewInvoices={() => undefined} actor={OFFICE} />, '/admin/review?tab=events')
    const creditRows = container.querySelectorAll('tr[data-kind="credit"]')
    expect(creditRows).toHaveLength(1)
    expect(creditRows[0]!.textContent).toContain('Credit AA-2026-H03 in full, 2 new invoices')
    expect(container.querySelectorAll('[data-shot="review-credit-replacement"]')).toHaveLength(2)
    // The seeded EV0001 and the credit: two to review, not four.
    expect(screen.getByRole('link', { name: /Events/ }).textContent).toContain('2')
  })
})

describe('the credited original', () => {
  it('shows the pending pill while the credit waits, and disables its correction', () => {
    submit(0)
    const { container } = inAdmin(<InvoiceDocument invoiceId={ORIGINAL} actor={OFFICE} />)
    expect(container.querySelector('[data-shot="invoice-standing"]')?.textContent).toBe('Credit waiting for review')
    expect(container.querySelector('[data-shot="credit-note-button"]')).toBeDisabled()
    expect(container.querySelector('[data-shot="invoice-correct-refusal"]')?.textContent).toBe('A credit for this invoice is waiting for review.')
  })

  it('reads Credited with the banner naming the credit note and the rebill, all links; a payment shows Invoice credited', () => {
    issue(1)
    const cn = creditNoteForInvoice(useAppStore.getState(), ORIGINAL)!
    const { container } = inAdmin(<InvoiceDocument invoiceId={ORIGINAL} actor={OFFICE} />)
    expect(container.querySelector('[data-shot="invoice-standing"]')?.textContent).toBe('Credited')
    const banner = container.querySelector('[data-shot="invoice-credited-banner"]') as HTMLElement
    expect(banner.textContent).toMatch(new RegExp(`^Credited in full by ${cn.creditNoteNumber} on .+ · rebilled as AA-2026-\\d{4}$`))
    const links = within(banner).getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', `/admin/finances/invoices/credit-notes/${cn.id}`)
    expect(links[1]).toHaveAttribute('href', `/admin/finances/invoices/${cn.replacementInvoiceIds[0]}`)
    const accRecId = pairForInvoice(useAppStore.getState(), ORIGINAL)!.receivable.xeroAccRecId
    expect(paymentDisabledReason(useAppStore.getState(), accRecId)).toBe('Invoice credited')
  })

  it('the replacement names what it rebills', () => {
    issue(1)
    const cn = creditNoteForInvoice(useAppStore.getState(), ORIGINAL)!
    const { container } = inAdmin(<InvoiceDocument invoiceId={cn.replacementInvoiceIds[0]!} actor={OFFICE} />)
    expect(container.querySelector('[data-shot="invoice-rebill-of"]')?.textContent).toBe(`Rebills AA-2026-H03 (credited by ${cn.creditNoteNumber})`)
  })
})

describe('the credit note document', () => {
  it('heads CREDIT NOTE, credits the original in full with the reason, and shows the negative invoice and the new invoices', () => {
    issue(1)
    const cn = creditNoteForInvoice(useAppStore.getState(), ORIGINAL)!
    const { container } = inAdmin(<CreditNoteDocument creditNoteId={cn.id} />)
    const doc = container.querySelector('[data-shot="credit-note-document"]')!
    expect(doc.textContent).toContain('CREDIT NOTE')
    expect(doc.textContent).toContain('Credits AA-2026-H03 in full')
    expect(doc.textContent).toContain('Wrong amount')
    expect(doc.textContent).toContain('Total credited')
    expect(doc.textContent).not.toMatch(/NHI/)
    expect(container.querySelector('[data-shot="negative-invoice-card"]')?.textContent).toMatch(new RegExp(`^${cn.creditNoteNumber}-P to Dr Souter · \\$520\\.50 · offset against the unpaid payable$`))
    expect(container.querySelector('[data-shot="credit-note-new-invoices"]')?.querySelectorAll('a')).toHaveLength(1)
    expect(container.querySelector('[data-shot="delivery-caption"]')?.textContent).toBe('Xero does not send credit notes; the engine sends it.')
  })
})

describe('the events list and the Invoices screen', () => {
  it("lists the credit with the credited invoice's total, Issued and the credit note's link; its new invoice reads as its rebill", () => {
    issue(1)
    const { container } = inAdmin(<ProcedureEventsList procedureId="HP03" actor={OFFICE} onReview={() => undefined} onOpenInvoice={() => undefined} onOpenCreditNote={() => undefined} />)
    const row = container.querySelector('[data-shot="procedure-credit-event"]')!
    expect(row.textContent).toContain('Credits AA-2026-H03 in full · Wrong amount')
    expect(row.textContent).toContain('$452.61')
    expect(row.querySelector('[data-shot="procedure-event-status"]')?.textContent).toBe('Issued')
    expect(row.querySelector('[data-shot="procedure-event-credit-note"]')?.textContent).toMatch(/^CN-2026-\d{4}$/)
    expect(container.querySelector('[data-shot="procedure-event-rebill-of"]')?.textContent).toContain('Rebill of AA-2026-H03')
  })

  it('lists the credit note as its own row, and the replacement says what it rebills', () => {
    issue(1)
    const cn = creditNoteForInvoice(useAppStore.getState(), ORIGINAL)!
    const { container } = inAdmin(<InvoicesScreen actor={OFFICE} />)
    const cnRow = container.querySelector(`tr[data-credit-note-id="${cn.id}"]`)!
    expect(cnRow.querySelector('[data-shot="invoice-list-kind"]')?.textContent).toBe('Credit note')
    expect(cnRow.textContent).toContain('Credits AA-2026-H03')
    const rebill = container.querySelector(`tr[data-invoice-id="${cn.replacementInvoiceIds[0]}"]`)!
    expect(rebill.querySelector('[data-shot="invoice-list-rebills"]')?.textContent).toBe('Rebills AA-2026-H03')
  })
})

/**
 * An invoice's page and a credit note's page under Finances' Invoices tab (build plan Phase 63; D107,
 * D108, US-13.3.3's Record page): the record pattern's header (the number, the payable's ID chip, the
 * state or the standing, a summary line, never the NHI), the rail on shared Cards from Delivery to
 * History, Resend and its refusal in place, the way back to the Invoices tab, and the credit note's
 * page with its negative invoice, what replaced the original and the link back to it.
 */

import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EMAIL_PROBLEM, NO_INVOICE_ADDRESS } from '../../../../domain/billing'
import type { InvoiceDelivery } from '../../../../domain/types'
import { approveCreditUnit, creditNoteForInvoice, freshAppState, pairForInvoice, submitCredit, useAppStore, type Actor, type CreditInput } from '../../../../store'
import { runNextBillingRun } from '../../../../store/eventDemo'
import { CREDIT_LABELS, CREDIT_MESSAGES } from '../../../../shared/procedureEventCopy'
import { financesRoutes } from '../../../../test/adminRoutes'
import { AdminApp } from '../../AdminApp'
import { creditNotePath, financePath, invoicePath } from './financePaths'
import { INVOICES_LIST_STATE_KEY } from './InvoicePage'

const DAY = '/admin/day/2026-11-24'
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
/** AA-2026-S2402: raised Thu 15 Oct, emailed to St George's, unpaid 40 days on the demo day. */
const AGED = 'INV-S24-02'
/** AA-2026-0001: a prepayment invoice, paid. */
const PAID = 'INV0001'
/** AA-2026-H03: a backdrop invoice, unpaid and in Xero, the one the credit tests credit. */
const CREDITABLE = 'HINV03'

function mountAt(url: string | { pathname: string; search?: string; state?: unknown }) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        <Route path="day/:dateISO" element={<div data-testid="day" />} />
        {financesRoutes()}
      </Route>,
    ),
    { initialEntries: [DAY, url], initialIndex: 1 },
  )
  render(<RouterProvider router={router} />)
  return router
}

const q = (shot: string) => document.querySelector(`[data-shot="${shot}"]`) as HTMLElement | null
const page = () => document.querySelector('[data-testid="invoice-detail-screen"]') as HTMLElement
const rail = () => document.querySelector('[data-testid="invoice-info-rail"]') as HTMLElement
/** The rail's cards' headings, in order (a RailSection's heading carries its count after the words). */
const railHeadings = (root: HTMLElement) => [...root.children].map((card) => card.querySelector('h2')?.textContent ?? '')

function setDelivery(invoiceId: string, delivery: InvoiceDelivery) {
  const s = useAppStore.getState()
  useAppStore.setState({ billing: { ...s.billing, invoices: { ...s.billing.invoices, [invoiceId]: { ...s.billing.invoices[invoiceId]!, delivery } } } })
}

function creditInput(replacements: number): CreditInput {
  return {
    invoiceId: CREDITABLE,
    reason: 'Wrong amount',
    cause: 'correction',
    replacements: Array.from({ length: replacements }, (_, i) => ({
      occurredOnISO: useAppStore.getState().clock.todayISO,
      party: { sameAs: true },
      lines: [{ description: `Corrected fee ${i + 1}`, quantity: 1, unitAmount: 200 }],
    })),
  }
}

function submitCreditFor(replacements: number): string {
  const out = submitCredit(useAppStore, OFFICE, creditInput(replacements))
  if (!out.ok) throw new Error(out.message)
  return out.value.creditEventId
}

function issueCredit(replacements: number) {
  const id = submitCreditFor(replacements)
  const approved = approveCreditUnit(useAppStore, OFFICE, id)
  if (!approved.ok) throw new Error(approved.message)
  const run = runNextBillingRun(useAppStore)
  if (!run.ok) throw new Error(run.message)
  return creditNoteForInvoice(useAppStore.getState(), CREDITABLE)!
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(() => cleanup())

describe("an invoice's header (the record pattern)", () => {
  it('shows the number, the payable chip, Unpaid with its age and the summary line', () => {
    mountAt(invoicePath(AGED))
    const s = useAppStore.getState()
    const invoice = s.billing.invoices[AGED]!
    expect(within(page()).getByRole('heading', { level: 1 }).textContent).toBe('AA-2026-S2402')
    const payable = pairForInvoice(s, AGED)!.payable!.number
    expect(q('invoice-payable-chip')?.textContent).toBe(`Payable${payable}`)
    const state = q('invoice-header-state')!
    expect(state.textContent).toBe('Unpaid · 40 days')
    expect(state).toHaveAttribute('data-state', 'unpaid')
    expect(q('invoice-header-standing')).toBeNull()
    const patient = s.masters.patients[s.schedule.bookings[invoice.bookingId]!.patientId]!
    const summary = q('invoice-summary')!.textContent!
    expect(summary).toContain(patient.name)
    expect(summary.split(' · ').length).toBeGreaterThanOrEqual(3)
  })

  it('reads Paid on a paid invoice', () => {
    mountAt(invoicePath(PAID))
    expect(within(page()).getByRole('heading', { level: 1 }).textContent).toBe('AA-2026-0001')
    expect(q('invoice-header-state')?.textContent).toBe('Paid')
    expect(q('invoice-header-state')).toHaveAttribute('data-state', 'paid')
  })

  it('never shows the NHI: not in the header, the rail or the paper', () => {
    for (const id of [AGED, PAID]) {
      mountAt(invoicePath(id))
      const s = useAppStore.getState()
      const nhi = s.masters.patients[s.schedule.bookings[s.billing.invoices[id]!.bookingId]!.patientId]!.nhi
      expect(page().textContent, id).not.toContain(nhi)
      cleanup()
    }
  })
})

describe("an invoice's rail", () => {
  it('runs Delivery, Ledger, Correct this invoice first and ends at History', () => {
    mountAt(invoicePath(AGED))
    const headings = railHeadings(rail())
    expect(headings.slice(0, 3)).toEqual(['Delivery', 'Ledger', CREDIT_LABELS.correctCard])
    expect(headings[headings.length - 1]).toBe('History')
    expect(rail().lastElementChild).toBe(q('invoice-history'))
    expect(q('invoice-ledger-card')).not.toBeNull()
    expect(q('invoice-ledger-owing')).not.toBeNull()
  })

  it('Resend sends again to the last address, audited on the invoice', () => {
    mountAt(invoicePath(AGED))
    const before = useAppStore.getState().audit.length
    act(() => {
      within(rail()).getByRole('button', { name: /Resend/ }).click()
    })
    const s = useAppStore.getState()
    const delivery = s.billing.invoices[AGED]!.delivery
    expect(delivery?.status).toBe('sent')
    expect(delivery?.status === 'sent' ? delivery.sends.map((x) => x.to) : []).toEqual(['accounts@stgeorges.example', 'accounts@stgeorges.example'])
    expect(s.audit.slice(before).some((a) => a.action === 'invoice.resend' && a.entityId === AGED)).toBe(true)
    expect(document.querySelector('[data-testid="invoice-send-history"]')?.querySelectorAll('li')).toHaveLength(2)
  })

  it('a Resend the store refuses shows its reason in place and changes nothing', () => {
    setDelivery(AGED, { method: 'email', status: 'sent', sends: [] })
    mountAt(invoicePath(AGED))
    const before = useAppStore.getState().audit.length
    act(() => {
      within(rail()).getByRole('button', { name: /Resend/ }).click()
    })
    expect(within(rail()).getByText('Type an email address to send this invoice to.')).toBeInTheDocument()
    expect(useAppStore.getState().audit.length).toBe(before)
    expect(document.querySelector('[data-testid="invoice-detail-screen"]')).not.toBeNull()
  })

  it('an invoice with no address reads so, and offers an email field and Send', () => {
    setDelivery(AGED, { method: 'email', status: 'noAddress' })
    mountAt(invoicePath(AGED))
    const delivery = q('invoice-delivery')!
    expect(delivery).toHaveAttribute('data-delivery', 'noAddress')
    expect(delivery.textContent).toContain(NO_INVOICE_ADDRESS)
    expect(within(delivery).getByRole('button', { name: /Send/ })).toBeDisabled()
    const field = within(delivery).getByLabelText('Email address')
    fireEvent.change(field, { target: { value: 'not-an-email' } })
    act(() => {
      within(delivery).getByRole('button', { name: /Send/ }).click()
    })
    // The store's own refusal, in place; nothing sent.
    expect(useAppStore.getState().billing.invoices[AGED]!.delivery?.status).toBe('noAddress')
    expect(within(rail()).getAllByText(EMAIL_PROBLEM).length).toBeGreaterThan(0)
  })
})

describe('a credited invoice', () => {
  it('while the credit waits: the standing in the header, no state pill', () => {
    submitCreditFor(0)
    mountAt(invoicePath(CREDITABLE))
    const standing = q('invoice-header-standing')!
    expect(standing).toHaveAttribute('data-standing', 'creditPending')
    expect(standing.textContent).toBe(CREDIT_LABELS.pendingPill)
    expect(q('invoice-header-state')).toBeNull()
  })

  it('once issued: Credited in the header, and Resend is off with its reason', () => {
    issueCredit(1)
    mountAt(invoicePath(CREDITABLE))
    const standing = q('invoice-header-standing')!
    expect(standing).toHaveAttribute('data-standing', 'credited')
    expect(standing.textContent).toBe(CREDIT_LABELS.credited)
    expect(q('invoice-header-state')).toBeNull()
    expect(within(rail()).getByRole('button', { name: /Resend/ })).toBeDisabled()
    expect(q('invoice-send-disabled')?.textContent).toBe(CREDIT_MESSAGES.alreadyCredited)
  })
})

describe("an invoice's way back", () => {
  it('goes to the Invoices tab', () => {
    const router = mountAt(invoicePath(AGED))
    const back = q('invoice-back')!
    expect(back).toHaveAttribute('href', financePath('invoices'))
    expect(back.textContent).toBe('Invoices')
    act(() => {
      back.click()
    })
    expect(router.state.location.pathname).toBe(financePath('invoices'))
  })

  it('returns to the filter the tab handed over', () => {
    const list = `${financePath('invoices')}?show=all`
    mountAt({ pathname: invoicePath(AGED), state: { [INVOICES_LIST_STATE_KEY]: list } })
    expect(q('invoice-back')).toHaveAttribute('href', list)
  })

  it('ignores a handed-over address outside the tab', () => {
    mountAt({ pathname: invoicePath(AGED), state: { [INVOICES_LIST_STATE_KEY]: DAY } })
    expect(q('invoice-back')).toHaveAttribute('href', financePath('invoices'))
  })
})

describe("a credit note's page", () => {
  it('shows the number, Credited in full, the negative invoice, what replaced the original, and History last', () => {
    const cn = issueCredit(1)
    const router = mountAt(creditNotePath(cn.id))
    const screen = document.querySelector('[data-testid="credit-note-detail-screen"]') as HTMLElement
    expect(within(screen).getByRole('heading', { level: 1 }).textContent).toBe(cn.creditNoteNumber)
    expect(q('credit-note-status')?.textContent).toBe('Credited in full')
    expect(q('credit-note-back')).toHaveAttribute('href', financePath('invoices'))
    expect(q('negative-invoice-card')).not.toBeNull()
    const cnRail = document.querySelector('[data-testid="credit-note-info-rail"]') as HTMLElement
    const headings = railHeadings(cnRail)
    expect(headings[0]).toBe(CREDIT_LABELS.negativeInvoiceCard)
    expect(headings[1]).toMatch(/^Replaced by/)
    expect(headings[headings.length - 1]).toBe('History')
    expect(cnRail.lastElementChild).toBe(q('credit-note-history'))
    expect(q('credit-note-xero')).not.toBeNull()
    const replacedBy = q('credit-note-new-invoices')!
    const row = replacedBy.querySelector(`[data-invoice-id="${cn.replacementInvoiceIds[0]}"]`)!
    const link = within(row as HTMLElement).getByRole('link')
    expect(link).toHaveAttribute('href', invoicePath(cn.replacementInvoiceIds[0]!))
    act(() => {
      link.click()
    })
    expect(router.state.location.pathname).toBe(invoicePath(cn.replacementInvoiceIds[0]!))
    expect(page()).not.toBeNull()
  })

  it("its summary links the original, which opens that invoice's page and keeps the way back", () => {
    const cn = issueCredit(1)
    const list = `${financePath('invoices')}?show=all`
    const router = mountAt({ pathname: creditNotePath(cn.id), state: { [INVOICES_LIST_STATE_KEY]: list } })
    const summary = q('credit-note-summary')!
    expect(summary.textContent).toMatch(/^Credits AA-2026-H03 · /)
    const original = q('credit-note-original-link')!
    expect(original.textContent).toBe('AA-2026-H03')
    act(() => {
      original.click()
    })
    expect(router.state.location.pathname).toBe(invoicePath(CREDITABLE))
    expect(within(page()).getByRole('heading', { level: 1 }).textContent).toBe('AA-2026-H03')
    expect(q('invoice-back')).toHaveAttribute('href', list)
  })

  it('never shows the NHI', () => {
    const cn = issueCredit(1)
    mountAt(creditNotePath(cn.id))
    const s = useAppStore.getState()
    const nhi = s.masters.patients[s.schedule.bookings[cn.bookingId]!.patientId]!.nhi
    expect((document.querySelector('[data-testid="credit-note-detail-screen"]') as HTMLElement).textContent).not.toContain(nhi)
  })
})

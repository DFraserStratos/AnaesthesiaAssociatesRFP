/**
 * The anaesthetist's account page under the Ledger tab (build plan Phase 65; US-13.2.1, US-08.3.5,
 * D107, D114, D115): Dr Souter's two money cards, her invoice pairs, payment runs and credit trails,
 * the Back link to the Ledger and Open in People; an injected receipt naming her puts the page out of
 * balance; an unknown anaesthetist goes back to the Ledger tab; the page and her Ledger row agree.
 */

import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  anaesthetistLedgerPosition,
  anaesthetistLedgerRowsOf,
  approveCreditUnit,
  freshAppState,
  negativeInvoicesFor,
  runsForAnaesthetist,
  SOUTER_ACTOR,
  submitCredit,
  useAppStore,
  type Actor,
} from '../../../../store'
import { injectUnmatchedReceipt, UNMATCHED_RECEIPT_DEMO } from '../../../../store/ledgerDemo'
import { runNextBillingRun } from '../../../../store/eventDemo'
import { formatCurrency } from '../../../../shared/format'
import { AdminApp } from '../../AdminApp'
import { financesRoutes } from '../../../../test/adminRoutes'
import { anaesthetistRecordPath } from '../../peoplePaths'
import { anaesthetistAccountPath, financePath } from './financePaths'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER = SOUTER_ACTOR.anaesthetistId!

function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        {financesRoutes()}
      </Route>,
    ),
    { initialEntries: [url] },
  )
  render(<RouterProvider router={router} />)
  return router
}

/** The office credits the seeded AA-2026-H03 (Dr Souter's, unpaid) with one replacement, as `LedgerCredit.test.tsx` does. */
function issueCredit() {
  const submitted = submitCredit(useAppStore, OFFICE, {
    invoiceId: 'HINV03',
    reason: 'Wrong amount',
    cause: 'correction',
    replacements: [{ occurredOnISO: useAppStore.getState().clock.todayISO, party: { sameAs: true }, lines: [{ description: 'Corrected fee', quantity: 1, unitAmount: 400 }] }],
  })
  if (!submitted.ok) throw new Error(submitted.message)
  if (!approveCreditUnit(useAppStore, OFFICE, submitted.value.creditEventId).ok) throw new Error('approve')
  if (!runNextBillingRun(useAppStore).ok) throw new Error('run')
}

const q = (sel: string) => document.querySelector(sel) as HTMLElement | null
const status = () => q('[data-shot="ledger-account-status"]')!
const runRows = () => document.querySelectorAll('[data-shot="ledger-payment-runs"] li[data-run-id]')

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe("Dr Souter's account page", () => {
  it('shows both cards, her pairs, her payment runs and the Back link to the Ledger', () => {
    mountAt(anaesthetistAccountPath(SOUTER))
    expect(q('[data-shot="ledger-account"]')).not.toBeNull()
    const pos = anaesthetistLedgerPosition(useAppStore.getState(), SOUTER)
    expect(status().getAttribute('data-in-balance')).toBe('true')
    expect(status().textContent).toContain('Square')
    expect(q('[data-shot="ledger-balance"]')).toBeNull()

    const aaOwes = q('[data-shot="ledger-aa-owes"]')!
    expect(aaOwes.textContent).toContain(formatCurrency(pos.dueNow))
    expect(aaOwes.textContent).toContain(formatCurrency(pos.awaitingCollection))
    expect(aaOwes.textContent).toContain(formatCurrency(pos.owedToThem))
    expect(aaOwes.textContent).toContain(formatCurrency(pos.collected))
    expect(aaOwes.textContent).toContain(formatCurrency(pos.paidOut))
    expect(q('[data-shot="ledger-owes-aa"]')!.textContent).toContain(formatCurrency(pos.theyOweAa))
    expect(q('[data-shot="ledger-tiles"]')!.contains(aaOwes)).toBe(true)

    expect(q('[data-shot="ledger-pairs-card"]')).not.toBeNull()
    expect(document.querySelectorAll('[data-shot="ledger-pairs"] [data-pair-id]').length).toBeGreaterThan(0)

    const runs = runsForAnaesthetist(useAppStore.getState(), SOUTER)
    expect(runs.length).toBeGreaterThan(0)
    expect(runRows()).toHaveLength(Math.min(3, runs.length))
    expect(runRows()[0]!.getAttribute('data-run-id')).toBe(runs[0]!.id)

    const back = within(q('[data-shot="ledger-account"]')!).getByText('Ledger').closest('a')!
    expect(back.getAttribute('href')).toBe(financePath('ledger'))
  })

  it('lists her credit trails, one rail row per credit note', () => {
    // The seed gives her no credits, so the office issues one.
    expect(negativeInvoicesFor(useAppStore.getState(), SOUTER)).toHaveLength(0)
    issueCredit()
    mountAt(anaesthetistAccountPath(SOUTER))
    const negatives = negativeInvoicesFor(useAppStore.getState(), SOUTER)
    expect(negatives).toHaveLength(1)
    const rows = document.querySelectorAll('[data-shot="ledger-credit-trail"] li[data-negative-invoice-id]')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.getAttribute('data-negative-invoice-id')).toBe(negatives[0]!.id)
  })

  it('an injected receipt naming her puts the page out of balance, the notice naming it', () => {
    mountAt(anaesthetistAccountPath(SOUTER))
    act(() => {
      const out = injectUnmatchedReceipt(useAppStore, UNMATCHED_RECEIPT_DEMO.namesSouter.id)
      if (!out.ok) throw new Error(out.message)
    })
    expect(status().getAttribute('data-in-balance')).toBe('false')
    expect(status().textContent).toContain(`Out by ${formatCurrency(UNMATCHED_RECEIPT_DEMO.amount)}`)
    const notice = q('[data-shot="ledger-balance"]')!
    expect(notice.getAttribute('data-in-balance')).toBe('false')
    expect(notice.textContent).toContain(`Dr Souter's account is out by ${formatCurrency(UNMATCHED_RECEIPT_DEMO.amount)}`)
    expect(notice.querySelectorAll('li[data-check="unmatchedReceiptHeld"]')).toHaveLength(1)
    expect(q('[data-shot="ledger-account-see-ledger"]')!.getAttribute('href')).toBe(financePath('ledger'))
  })

  it('See all on payment runs expands to every run', () => {
    const runs = runsForAnaesthetist(useAppStore.getState(), SOUTER)
    // The seed pays her in more than three runs, so the rail shows three with See all.
    expect(runs.length).toBeGreaterThan(3)
    mountAt(anaesthetistAccountPath(SOUTER))
    expect(runRows()).toHaveLength(3)
    expect(q('[data-shot="ledger-payment-runs-all"]')!.textContent).toBe(`See all ${runs.length}`)
    fireEvent.click(q('[data-shot="ledger-payment-runs-all"]')!)
    expect(runRows()).toHaveLength(runs.length)
  })

  it('an unknown anaesthetist lands on the Ledger tab', () => {
    const router = mountAt(anaesthetistAccountPath('NO-SUCH-ANAESTHETIST'))
    expect(router.state.location.pathname).toBe(financePath('ledger'))
    expect(q('[data-shot="ledger-account"]')).toBeNull()
  })

  it('Open in People links to her People record', () => {
    mountAt(anaesthetistAccountPath(SOUTER))
    expect(q('[data-shot="ledger-account-open-people"]')!.getAttribute('href')).toBe(anaesthetistRecordPath(SOUTER))
  })

  it("the page's figures agree with her row on the Ledger tab", () => {
    mountAt(anaesthetistAccountPath(SOUTER))
    const row = anaesthetistLedgerRowsOf(useAppStore.getState()).find((r) => r.anaesthetistId === SOUTER)!
    const pos = anaesthetistLedgerPosition(useAppStore.getState(), SOUTER)
    expect(row.aaOwesThem).toBe(pos.owedToThem)
    expect(row.theyOweAa).toBe(pos.theyOweAa)
    const total = within(q('[data-shot="ledger-aa-owes"]')!).getByText('Total').parentElement!
    expect(total.textContent).toContain(formatCurrency(row.aaOwesThem))
    expect(q('[data-shot="ledger-owes-aa"]')!.textContent).toContain(formatCurrency(row.theyOweAa))
    expect(row.inBalance).toBe(status().getAttribute('data-in-balance') === 'true')
  })
})

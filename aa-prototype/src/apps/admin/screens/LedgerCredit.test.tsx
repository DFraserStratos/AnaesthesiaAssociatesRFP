import { cleanup, render } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { approveCreditUnit, freshAppState, negativeInvoicesFor, SOUTER_ACTOR, submitCredit, useAppStore, type Actor } from '../../../store'
import { runNextBillingRun } from '../../../store/eventDemo'
import { CREDIT_LABELS } from '../../../shared/procedureEventCopy'
import { AdminApp } from '../AdminApp'
import { financesRoutes } from '../../../test/adminRoutes'
import { anaesthetistAccountPath } from './finances/financePaths'

/**
 * Catch-up Phase 39, work item 12: the ledger's credit terms and one
 * anaesthetist's credit trail, after the office credits the seeded
 * AA-2026-H03 (Dr Souter's, unpaid) with one new invoice. Since build plan
 * Phase 65 the trail is the account page's rail: one row per credit note,
 * its netting note in the sub line.
 */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER = SOUTER_ACTOR.anaesthetistId!

function issueCredit() {
  const submitted = submitCredit(useAppStore, OFFICE, {
    invoiceId: 'HINV03',
    reason: 'Wrong amount',
    cause: 'correction',
    replacements: [{ occurredOnISO: useAppStore.getState().clock.todayISO, party: { sameAs: true }, lines: [{ description: 'Corrected fee', quantity: 1, unitAmount: 400 }] }],
  })
  if (!submitted.ok) throw new Error(submitted.message)
  const approved = approveCreditUnit(useAppStore, OFFICE, submitted.value.creditEventId)
  if (!approved.ok) throw new Error(approved.message)
  const run = runNextBillingRun(useAppStore)
  if (!run.ok) throw new Error(run.message)
}

/** One anaesthetist's account page at its route (build plan Phase 65; the whole ledger is the Ledger tab, `finances/LedgerTab.test.tsx`). */
function renderAccount(anaesthetistId: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        {financesRoutes()}
      </Route>,
    ),
    { initialEntries: [anaesthetistAccountPath(anaesthetistId)] },
  )
  return render(<RouterProvider router={router} />)
}

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('the ledger after a credit', () => {
  it("one anaesthetist's account stays in balance after the credit", () => {
    issueCredit()
    const { container } = renderAccount(SOUTER)
    expect(container.querySelector('[data-shot="ledger-account-status"]')!.getAttribute('data-in-balance')).toBe('true')
    expect(container.querySelector('[data-shot="ledger-balance"]')).toBeNull()
  })

  it("one anaesthetist's rail lists the credit note with what became of its contra", () => {
    issueCredit()
    const negatives = negativeInvoicesFor(useAppStore.getState(), SOUTER)
    expect(negatives).toHaveLength(1)
    const fresh = negatives[0]!
    expect(fresh.originalInvoiceId).toBe('HINV03')
    const { container } = renderAccount(SOUTER)
    const row = container.querySelector(`[data-shot="ledger-credit-trail"] li[data-negative-invoice-id="${fresh.id}"]`)!
    expect(row).not.toBeNull()
    const cn = useAppStore.getState().billing.creditNotes[fresh.creditNoteId]!
    expect(row.querySelector('a')!.textContent).toBe(cn.creditNoteNumber)
    // Nothing was paid out on AA-2026-H03, so the negative invoice is offset, with nothing to net.
    expect(row.textContent).toContain(CREDIT_LABELS.offsetDone)
  })

  it('shows no credit trail for an anaesthetist with no credits', () => {
    expect(negativeInvoicesFor(useAppStore.getState(), SOUTER)).toHaveLength(0)
    const { container } = renderAccount(SOUTER)
    expect(container.querySelector('[data-shot="ledger-credit-trail"]')).toBeNull()
  })
})

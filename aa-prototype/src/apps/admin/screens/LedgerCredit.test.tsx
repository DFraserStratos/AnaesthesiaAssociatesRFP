import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { approveCreditUnit, freshAppState, SOUTER_ACTOR, submitCredit, useAppStore, type Actor } from '../../../store'
import { runNextBillingRun } from '../../../store/eventDemo'
import { SurfaceProvider } from '../../../shared/surface'
import { CREDIT_LABELS } from '../../../shared/procedureEventCopy'
import { LedgerScreen } from './LedgerScreen'

/**
 * Catch-up Phase 39, work item 12: the ledger's credit terms and one
 * anaesthetist's credit trail, after the office credits the seeded
 * AA-2026-H03 (Dr Souter's, unpaid) with one new invoice.
 */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

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

function renderLedger(anaesthetistId?: string) {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant="web">
        <LedgerScreen actor={OFFICE} {...(anaesthetistId !== undefined ? { anaesthetistId } : {})} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('the ledger after a credit', () => {
  it('the whole view shows Credits held for payers and Negative invoices to net, with the equation extended, still in balance', () => {
    issueCredit()
    const { container } = renderLedger()
    const tiles = container.querySelector('[data-shot="ledger-credit-tiles"]')!
    expect(tiles.textContent).toContain(CREDIT_LABELS.creditsHeldForPayers)
    expect(tiles.textContent).toContain(CREDIT_LABELS.negativeToNet)
    const balance = container.querySelector('[data-shot="ledger-balance"]')!
    expect(balance.getAttribute('data-in-balance')).toBe('true')
    expect(balance.textContent).toContain('credits held for payers')
    expect(balance.textContent).toContain('plus negative invoices to net')
  })

  it("one anaesthetist's view lists the trail in order: debit, credit, contra, new debit", () => {
    issueCredit()
    const { container } = renderLedger(SOUTER_ACTOR.anaesthetistId)
    const rows = [...container.querySelectorAll('[data-shot="ledger-credit-trail"] tbody tr')]
    expect(rows.map((r) => r.getAttribute('data-trail-kind'))).toEqual(['debit', 'credit', 'contra', 'newDebit'])
    expect(rows[0]!.textContent).toContain('AA-2026-H03')
    expect(rows[2]!.textContent).toContain('-P')
    // Nothing was paid out on AA-2026-H03, so the negative invoice is offset, with nothing to net.
    expect(rows[2]!.textContent).toContain(CREDIT_LABELS.offsetDone)
  })

  it('shows no credit trail for an anaesthetist with no credits', () => {
    const { container } = renderLedger(SOUTER_ACTOR.anaesthetistId)
    expect(container.querySelector('[data-shot="ledger-credit-trail"]')).toBeNull()
  })
})

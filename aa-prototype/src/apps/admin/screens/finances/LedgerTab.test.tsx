/**
 * The Ledger tab (build plan Phase 64; US-13.2.1's tab half, D106, D107, D115): one sentence read
 * from the Day view's reconciliation status, four figures, the receipts to place with Allocate and
 * Mark refunded, and one list at a time (anaesthetists, invoice pairs, the AA Holding account), its
 * state in the URL.
 */

import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { anaesthetistLedgerRowsOf, approveCreditUnit, freshAppState, ledgerPositionOf, SOUTER_ACTOR, submitCredit, useAppStore, type Actor } from '../../../../store'
import { injectUnmatchedReceipt } from '../../../../store/ledgerDemo'
import { runNextBillingRun } from '../../../../store/eventDemo'
import { formatCurrency } from '../../../../shared/format'
import { AdminApp } from '../../AdminApp'
import { financesRoutes } from '../../../../test/adminRoutes'
import { anaesthetistAccountPath, financePath, ledgerPairPath } from './financePaths'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

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

const q = (sel: string) => document.querySelector(sel) as HTMLElement | null
const sentence = () => q('[data-shot="ledger-balance"]')!
const tile = (key: string) => q(`[data-ledger-tile="${key}"]`)!
const receipts = () => document.querySelectorAll('[data-shot="ledger-unmatched"] [data-unmatched-id]')

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('the Ledger tab', () => {
  it('from a reset: square, four figures, nothing to place, every anaesthetist listed, no Whole / One switch', () => {
    mountAt(financePath('ledger'))
    expect(sentence().getAttribute('data-in-balance')).toBe('true')
    expect(sentence().textContent).toContain('The books are square')
    const tiles = q('[data-shot="ledger-tiles"]')!
    expect(tiles.querySelectorAll('[data-ledger-tile]')).toHaveLength(4)
    const pos = ledgerPositionOf(useAppStore.getState())
    expect(tile('owed-to-aa').textContent).toContain(formatCurrency(pos.receivablesOutstanding))
    expect(tile('owed-to-anaesthetists').textContent).toContain(formatCurrency(pos.payablesDue))
    expect(tile('holding').textContent).toContain(formatCurrency(pos.holdingBalance))
    expect(tile('receipts-to-place').textContent).toContain(formatCurrency(0))
    expect(tiles.textContent).not.toContain('Receipts held')
    expect(receipts()).toHaveLength(0)
    const rows = document.querySelectorAll('[data-shot="ledger-anaesthetists"] [data-anaesthetist-id]')
    expect(rows.length).toBe(anaesthetistLedgerRowsOf(useAppStore.getState()).length)
    expect(document.body.textContent).not.toContain('Whole ledger')
    expect(q('[data-shot="ledger-anaesthetist-select"]')).toBeNull()
  })

  it('an injected receipt turns the sentence, counts in Receipts to place, puts Dr Souter out; Allocate puts it right', () => {
    mountAt(financePath('ledger'))
    act(() => {
      const out = injectUnmatchedReceipt(useAppStore, undefined)
      if (!out.ok) throw new Error(out.message)
    })
    expect(sentence().getAttribute('data-in-balance')).toBe('false')
    expect(sentence().textContent).toContain('1 receipt that matches no invoice')
    expect(document.querySelectorAll('li[data-check="unmatchedReceiptHeld"]')).toHaveLength(1)
    expect(tile('receipts-to-place').textContent).toContain('1 receipt')
    expect(receipts()).toHaveLength(1)
    const souter = q(`[data-anaesthetist-id="${SOUTER_ACTOR.anaesthetistId}"]`)!
    expect(souter.textContent).toContain('Out by')

    fireEvent.click(within(q('[data-shot="ledger-unmatched"]')!).getByText('Allocate'))
    const option = q('[data-shot="ledger-allocate-dialog"] [data-allocate-pair]')!
    fireEvent.click(option)
    expect(receipts()).toHaveLength(0)
    expect(sentence().getAttribute('data-in-balance')).toBe('true')
    expect(tile('receipts-to-place').textContent).toContain(formatCurrency(0))
  })

  it('Mark refunded takes the receipt off the rail and squares the books', () => {
    mountAt(financePath('ledger'))
    act(() => {
      const out = injectUnmatchedReceipt(useAppStore, undefined)
      if (!out.ok) throw new Error(out.message)
    })
    fireEvent.click(within(q('[data-shot="ledger-unmatched"]')!).getByText('Mark refunded'))
    const dialog = q('[data-shot="ledger-refund-dialog"]')!
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'Back to the payer' } })
    fireEvent.click(q('[data-shot="ledger-refund-confirm"]')!)
    expect(receipts()).toHaveLength(0)
    expect(sentence().getAttribute('data-in-balance')).toBe('true')
  })

  it('the list control switches between the three lists, keeping its state in the URL', () => {
    const router = mountAt(financePath('ledger'))
    expect(q('[data-shot="ledger-anaesthetists"]')).not.toBeNull()
    fireEvent.click(document.querySelector('[role="radiogroup"][aria-label="Which list"] [role="radio"]:nth-child(2)') ?? within(document.body).getByText('Invoice pairs'))
    expect(router.state.location.search).toContain('list=pairs')
    expect(q('[data-shot="ledger-pairs"]')).not.toBeNull()
    fireEvent.click(within(document.body).getByText('AA Holding account', { selector: 'button, button *, [role="radio"], [role="radio"] *, [role="tab"], [role="tab"] *' }))
    expect(router.state.location.search).toContain('list=holding')
    expect(q('[data-shot="billing-prepay-holding"]')).not.toBeNull()
    expect(document.body.textContent).toContain('to confirm with AA (OQ-125)')
  })

  it('a row opens the anaesthetist account', () => {
    const router = mountAt(financePath('ledger'))
    fireEvent.click(q(`[data-anaesthetist-id="${SOUTER_ACTOR.anaesthetistId}"]`)!)
    expect(router.state.location.pathname).toBe(anaesthetistAccountPath(SOUTER_ACTOR.anaesthetistId!))
  })

  it('?pair= lands on Invoice pairs, All, with the pair tinted', () => {
    const pairId = Object.keys(useAppStore.getState().billing.ledger)[0]!
    mountAt(ledgerPairPath(pairId))
    expect(q('[data-shot="ledger-pairs"]')).not.toBeNull()
    expect(q(`[data-pair-id="${pairId}"]`)!.getAttribute('data-highlighted')).toBe('true')
  })

  it('after a credit the books stay square', () => {
    const submitted = submitCredit(useAppStore, OFFICE, {
      invoiceId: 'HINV03',
      reason: 'Wrong amount',
      cause: 'correction',
      replacements: [{ occurredOnISO: useAppStore.getState().clock.todayISO, party: { sameAs: true }, lines: [{ description: 'Corrected fee', quantity: 1, unitAmount: 400 }] }],
    })
    if (!submitted.ok) throw new Error(submitted.message)
    if (!approveCreditUnit(useAppStore, OFFICE, submitted.value.creditEventId).ok) throw new Error('approve')
    if (!runNextBillingRun(useAppStore).ok) throw new Error('run')
    mountAt(financePath('ledger'))
    expect(sentence().getAttribute('data-in-balance')).toBe('true')
  })
})

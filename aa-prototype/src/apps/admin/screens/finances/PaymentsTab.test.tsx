/**
 * The Payments tab (build plan Phase 66; US-10.2.7, D107, D115): the weekly payment cycle card with
 * its four steps, the payment runs table (paged, each row opening the run's page) and the approved
 * events waiting for the next billing run in the rail.
 */

import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  approveAndPayPairForDemo,
  approveProcedureEvent,
  DEMO_TRIGGER_ACTOR,
  freshAppState,
  OFFICE_SIMULATION_ACTOR,
  openCycleDraft,
  paymentCycleSettingsOf,
  runsNewestFirst,
  stagePaymentWeek,
  useAppStore,
  type Actor,
} from '../../../../store'
import { runNextBillingRun } from '../../../../store/eventDemo'
import { cycleFor, plannedDayLabel } from '../../../../domain/billing/paymentCycle'
import type { PayablesRun } from '../../../../domain/types'
import { AdminApp } from '../../AdminApp'
import { financesRoutes } from '../../../../test/adminRoutes'
import { financePath, paymentRunPath } from './financePaths'

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
const runRows = () => [...document.querySelectorAll<HTMLElement>('[data-shot="payables-runs"] tbody tr')]

function staged(): void {
  const out = stagePaymentWeek(useAppStore, DEMO_TRIGGER_ACTOR, 'bctis')
  if (!out.ok) throw new Error(out.message)
}

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('the Payments tab', () => {
  it("shows Week 48's cycle with its four steps and planned days, and no Open the ledger", () => {
    mountAt(financePath('payments'))
    const card = q('[data-shot="payment-cycle"]')!
    expect(card.textContent).toContain('Payment cycle · Week 48')
    const cycle = cycleFor('2026-11-24', paymentCycleSettingsOf(useAppStore.getState()))
    const step = (n: number) => q(`[data-shot="payment-cycle-step-${n}"]`)!.textContent
    expect(step(1)).toContain('Close the week')
    expect(step(1)).toContain(`Planned ${plannedDayLabel(cycle.closeDateISO)}`)
    expect(step(2)).toContain('Monday checks')
    expect(step(2)).toContain(`Planned ${plannedDayLabel(cycle.checkDateISO)}`)
    expect(step(3)).toContain('Approve BCTIs')
    expect(step(3)).toContain('After the checks')
    expect(step(4)).toContain('Send payment schedule')
    expect(step(4)).toContain(`Planned ${plannedDayLabel(cycle.scheduleDateISO)}`)
    // Simulated Xero badges the one Xero step; the ledger is a tab away.
    expect(within(q('[data-shot="billing-payables-run"]')!).getByText('Simulated Xero')).toBeTruthy()
    expect(q('[data-shot="billing-open-ledger"]')).toBeNull()
    // Nothing waits for a billing run on a fresh seed, so the rail is not drawn.
    expect(q('[data-page-rail]')).toBeNull()
  })

  it('Close the week closes it; a line held out of this run rolls into next week', () => {
    act(staged)
    mountAt(financePath('payments'))
    expect(q('[data-shot="payment-cycle-status"]')).toBeNull()
    fireEvent.click(q('[data-shot="payment-cycle-close"]')!)
    expect(q('[data-shot="payment-cycle-status"]')!.textContent).toBe('Closed')
    expect(q('[data-shot="billing-payables-result"]')!.textContent).toContain('Week 48 closed.')
    const checks = q('[data-shot="payment-cycle-anomalies"]')!
    expect(within(checks).getByRole('heading', { name: 'Checks before payment' })).toBeTruthy()

    // Open the anaesthetist's lines, then hold the first out with a reason.
    fireEvent.click(within(checks).getAllByRole('button', { expanded: false })[0]!)
    fireEvent.click(checks.querySelector('[data-shot="payment-cycle-hold-open"]')!)
    fireEvent.change(within(checks).getByLabelText('Why hold it out'), { target: { value: 'Query from the surgeon' } })
    fireEvent.click(checks.querySelector('[data-shot="payment-cycle-hold-line"]')!)
    const held = q('[data-shot="payment-cycle-held"]')!
    expect(held.textContent).toContain('Rolls into Week 49')
    expect(held.textContent).toContain('Query from the surgeon')
    expect(held.querySelectorAll('[data-held-pair-id]')).toHaveLength(1)
  })

  it('lists the runs with the new columns, newest first, and a row opens its page', () => {
    const router = mountAt(financePath('payments'))
    const runs = runsNewestFirst(useAppStore.getState())
    const table = q('[data-shot="payables-runs"]')!
    expect(within(table).getByRole('heading').textContent).toContain(String(runs.length))
    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent)
    expect(headers).toEqual(['Run', 'Dates', 'Anaesthetists', 'BCTIs', 'Negatives netted', 'Paid out', 'Status', 'Paid on'])
    expect(runRows().map((r) => r.getAttribute('data-run-id'))).toEqual(runs.map((r) => r.id))
    const first = runRows()[0]!
    expect(first.getAttribute('data-run-status')).toBe('paid')
    expect(first.textContent).toContain('Week 47')
    expect(first.textContent).toContain('Paid')
    expect(q('[data-shot="payables-runs-pager"]')).toBeNull()
    fireEvent.click(first.querySelectorAll('td')[2]!)
    expect(router.state.location.pathname).toBe(paymentRunPath(runs[0]!.id))
  })

  it('pages the runs at 20', () => {
    // Older weeks copied from the seed's first run, enough for a second page.
    const base = runsNewestFirst(useAppStore.getState()).at(-1)!
    const extra: Record<string, PayablesRun> = {}
    for (let i = 0; i < 12; i++) {
      const id = `PRX${String(i).padStart(2, '0')}`
      extra[id] = { ...base, id, cycleId: `2025-W${String(30 + i).padStart(2, '0')}`, isoWeek: 30 + i, closedAtISO: `2025-0${1 + (i % 9)}-01T09:00:00` }
    }
    act(() => useAppStore.setState((s) => ({ billing: { ...s.billing, payablesRuns: { ...s.billing.payablesRuns, ...extra } } })))
    mountAt(financePath('payments'))
    const total = Object.keys(useAppStore.getState().billing.payablesRuns).length
    expect(total).toBeGreaterThan(20)
    expect(runRows()).toHaveLength(20)
    const pager = q('[data-shot="payables-runs-pager"]')!
    expect(pager.textContent).toContain(`Showing 1 to 20 of ${total}`)
    fireEvent.click(within(pager).getByRole('button', { name: 'Next page' }))
    expect(runRows()).toHaveLength(total - 20)
  })

  it("a staged run comes first with its Staged pill", () => {
    act(() => {
      staged()
      const pairId = openCycleDraft(useAppStore.getState()).lines[0]!.pairId
      const out = approveAndPayPairForDemo(useAppStore, OFFICE_SIMULATION_ACTOR, pairId)
      if (!out.ok) throw new Error(out.message)
    })
    mountAt(financePath('payments'))
    const first = runRows()[0]!
    expect(first.textContent).toContain('Week 48')
    expect(within(first).getByText('Staged')).toBeTruthy()
    expect(first.getAttribute('data-run-status')).toBe('paid')
  })

  it('an approved event waits in the rail and leaves it after the billing run', () => {
    act(() => {
      const out = approveProcedureEvent(useAppStore, OFFICE, 'EV0001')
      if (!out.ok) throw new Error(out.message)
    })
    mountAt(financePath('payments'))
    const rail = q('[data-shot="events-awaiting-run"]')!
    expect(rail.closest('[data-page-rail]')).not.toBeNull()
    expect(within(rail).getByRole('heading').textContent).toContain('Events awaiting the run')
    const row = rail.querySelector('[data-event-id="EV0001"]')!
    expect(row.getAttribute('data-kind')).toBeTruthy()
    expect(row.textContent).toContain('ex GST')
    expect(row.querySelector('a')!.getAttribute('href')).toMatch(/^\/admin\/day\/\d{4}-\d{2}-\d{2}\/bookings\//)

    act(() => {
      const out = runNextBillingRun(useAppStore)
      if (!out.ok) throw new Error(out.message)
    })
    expect(q('[data-shot="events-awaiting-run"]')).toBeNull()
    expect(q('[data-page-rail]')).toBeNull()
  })
})

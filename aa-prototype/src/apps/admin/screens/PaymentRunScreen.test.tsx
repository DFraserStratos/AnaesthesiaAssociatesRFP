/**
 * A payment run's page on the record pattern (build plan Phase 66; US-10.2.7, D107, D114, D115): the
 * Back link to Payments, the week and its status pill, the summary line, the cycle's StepRail with its
 * stamps, Download schedule once the BCTIs are approved, one totals row per anaesthetist with a
 * Remittance link that opens the advice, and the advice's Back link returning to the run.
 */

import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, runsNewestFirst, useAppStore } from '../../../store'
import { formatCurrency, plural, shortDay } from '../../../shared/format'
import { cycleLabel } from '../../../domain/billing/paymentCycle'
import { AdminApp } from '../AdminApp'
import { financesRoutes } from '../../../test/adminRoutes'
import { financePath, paymentRunPath, remittancePath } from './finances/financePaths'

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

/** The newest seeded run that was paid out to someone. */
function paidRun() {
  const run = runsNewestFirst(useAppStore.getState()).find((r) => r.status === 'paid' && r.paidAtISO !== undefined && r.byAnaesthetist.length > 0)
  if (run === undefined) throw new Error('no paid run in the seed')
  return run
}

const q = (sel: string) => document.querySelector(sel) as HTMLElement | null

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('the payment run page', () => {
  it('shows the week, its status, the summary line, the steps and Download schedule', () => {
    const run = paidRun()
    mountAt(paymentRunPath(run.id))
    const page = q('[data-shot="payment-run-page"]')!
    expect(page).not.toBeNull()
    expect(q('[data-testid="payment-run-screen"]')).not.toBeNull()

    const back = within(page).getByText('Payments').closest('a')!
    expect(back.getAttribute('href')).toBe(financePath('payments'))

    expect(within(page).getByRole('heading', { level: 1 }).textContent).toBe(cycleLabel(run))
    expect(q('[data-shot="payables-run-status"]')!.textContent).toBe('Paid')
    expect(q('[data-shot="payables-run-id"]')!.textContent).toContain(run.id)

    const total = run.byAnaesthetist.reduce((n, t) => n + Math.round(t.net * 100), 0) / 100
    const summary = q('[data-shot="payables-run-summary"]')!.textContent!
    expect(summary).toContain(`paid ${shortDay(run.paidAtISO!)}`)
    expect(summary).toContain(plural(run.byAnaesthetist.length, 'anaesthetist'))
    expect(summary).toContain(formatCurrency(total))

    expect(q('[data-shot="payables-run-step-1"]')!.textContent).toContain(`Closed ${shortDay(run.closedAtISO)}`)
    expect(document.querySelectorAll('[data-shot^="payables-run-step-"]')).toHaveLength(4)

    expect(q('[data-shot="payment-schedule-print"]')!.textContent).toBe('Download schedule')
    const schedule = q('[data-shot="payment-schedule"]')!
    expect(schedule.textContent).toContain(`PAYMENT SCHEDULE · ${cycleLabel(run)}`)
    expect(schedule.querySelector('[data-shot="payment-schedule-print"]')).toBeNull()

    expect(q('[data-shot="payables-run-detail"]')!.textContent).toContain(run.id)
    expect(q('[data-shot="payables-run-snapshot"]')).not.toBeNull()
    expect(q('[data-shot="payables-run-history"]')).not.toBeNull()
  })

  it('lists one row per anaesthetist (20 a page), each Remittance link opening the advice, whose Back returns to the run', async () => {
    const run = paidRun()
    const router = mountAt(paymentRunPath(run.id))
    const rows = document.querySelectorAll('[data-shot="payables-run-totals"] tbody tr[data-anaesthetist-id]')
    expect(rows).toHaveLength(Math.min(20, run.byAnaesthetist.length))
    expect(rows[0]!.getAttribute('data-anaesthetist-id')).toBe(run.byAnaesthetist[0]!.anaesthetistId)
    expect(q('[data-shot="payables-run-totals-pager"]') !== null).toBe(run.byAnaesthetist.length > 20)

    const first = run.byAnaesthetist[0]!.anaesthetistId
    const link = rows[0]!.querySelector('[data-shot="payables-run-remittance-link"]') as HTMLElement
    expect(link.getAttribute('href')).toBe(remittancePath(run.id, first))
    await act(async () => {
      fireEvent.click(link)
    })
    expect(router.state.location.pathname).toBe(remittancePath(run.id, first))
    const advice = q('[data-testid="remittance-advice-screen"]')!
    expect(advice).not.toBeNull()

    const back = within(advice).getByText(`Payment run · ${cycleLabel(run)}`).closest('a')!
    expect(back.getAttribute('href')).toBe(paymentRunPath(run.id))
    await act(async () => {
      fireEvent.click(back)
    })
    expect(router.state.location.pathname).toBe(paymentRunPath(run.id))
    expect(q('[data-shot="payment-run-page"]')).not.toBeNull()
  })
})

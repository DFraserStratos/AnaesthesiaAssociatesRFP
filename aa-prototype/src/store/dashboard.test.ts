/**
 * Anaesthetist money views (Phase 05 productivity/leave + Phase 10 billing-mirror
 * receivables / GST). Productivity + leave are seeded demo figures; receivables
 * aging, the flat outstanding ACCPAY list and the GST activity report all derive
 * from the seeded historical billing mirror (`seed/history.ts`), read through the
 * `billing` slice only (convention 9). Uses isolated, non-persisted stores.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import {
  dashboardFiguresFor,
  gstActivityFor,
  outstandingAccpayInvoicesFor,
  receivablesAgingFor,
} from './selectors'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList, handoffListCases } from './billingRun'
import { advanceClockDays } from './clockActions'
import { deriveDashboardFigures, ANAESTHETIST_DASHBOARD, ANAE, SEED_LIST_IDS } from '../domain/seed'
import type { Actor } from './mutate'

const SOUTER = ANAE.souter
const DEMO_TODAY = '2026-07-21'
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function store(): BoundAppStore {
  return createAppStore()
}
function mirror(api: BoundAppStore) {
  const s = api.getState()
  return { billing: s.billing, schedule: s.schedule, masters: s.masters }
}

describe('deriveDashboardFigures (productivity + leave)', () => {
  it('returns the seeded productivity and leave, deterministically', () => {
    const seed = ANAESTHETIST_DASHBOARD[SOUTER]!
    const f = deriveDashboardFigures(seed)
    expect(f.productivity.units).toBe(274)
    expect(f.leave.some((l) => l.status === 'pending')).toBe(true)
    expect(deriveDashboardFigures(seed)).toEqual(f)
  })
})

describe('dashboardFiguresFor (store selector, view-scoped)', () => {
  it('returns Souter’s seeded figures', () => {
    const f = dashboardFiguresFor(store().getState(), SOUTER)
    expect(f?.productivity.units).toBe(274)
    expect(f?.leave.length).toBe(2)
  })
  it('is honest-empty for anaesthetists with no seeded figures', () => {
    expect(dashboardFiguresFor(store().getState(), ANAE.rutherford)).toBeUndefined()
  })
})

describe('receivables aging (billing mirror)', () => {
  it('buckets the seeded outstanding ACCPAY invoices against today', () => {
    const { aging, accountsOver60 } = receivablesAgingFor(mirror(store()), SOUTER, DEMO_TODAY)
    expect(aging.current).toBe(2605.5)
    expect(aging.d31_60).toBe(2390)
    expect(aging.d61_90).toBe(1930)
    expect(aging.d90plus).toBe(860)
    expect(aging.total).toBe(7785.5)
    expect(accountsOver60).toBe(3)
  })

  it('is honest-empty (zeroed) for an anaesthetist with no billed work', () => {
    const { aging, rows } = receivablesAgingFor(mirror(store()), ANAE.rutherford, DEMO_TODAY)
    expect(rows).toHaveLength(0)
    expect(aging.total).toBe(0)
  })

  it('ages forward as today advances (accountsOver60 grows)', () => {
    const api = store()
    const before = receivablesAgingFor(mirror(api), SOUTER, DEMO_TODAY).accountsOver60
    advanceClockDays(api, 60)
    const after = receivablesAgingFor(mirror(api), SOUTER, api.getState().clock.todayISO).accountsOver60
    expect(after).toBeGreaterThan(before)
  })
})

describe('outstanding ACCPAY invoices (flat, no rollup)', () => {
  it('lists one row per unpaid ACCPAY invoice, oldest first', () => {
    const rows = outstandingAccpayInvoicesFor(mirror(store()), SOUTER, DEMO_TODAY)
    expect(rows).toHaveLength(8)
    const dates = rows.map((r) => r.raisedAtISO)
    expect(dates).toEqual([...dates].sort())
    // Every row is its own ACCPAY invoice — no aggregation.
    expect(new Set(rows.map((r) => r.invoiceId)).size).toBe(rows.length)
  })
})

describe('GST activity report', () => {
  it('lists amounts received in the period with their GST component; totals reconcile', () => {
    // July window: the two seeded July receipts + the seeded pre-payment (Jul 14).
    const activity = gstActivityFor(store().getState(), SOUTER, '2026-07-01', '2026-07-21')
    expect(activity.rows.length).toBeGreaterThanOrEqual(2)
    const gross = activity.rows.reduce((s, r) => s + r.grossAmount, 0)
    const gst = activity.rows.reduce((s, r) => s + r.gstAmount, 0)
    expect(activity.totalGross).toBeCloseTo(gross, 2)
    expect(activity.totalGst).toBeCloseTo(gst, 2)
    // GST is 3/23 of the gross on each row.
    for (const r of activity.rows) expect(r.gstAmount).toBeCloseTo((r.grossAmount * 0.15) / 1.15, 2)
  })

  it('widening the window from July to six months includes more receipts', () => {
    const api = store()
    const july = gstActivityFor(api.getState(), SOUTER, '2026-07-01', '2026-07-21').rows.length
    const sixMonths = gstActivityFor(api.getState(), SOUTER, '2026-02-01', '2026-07-21').rows.length
    expect(sixMonths).toBeGreaterThan(july)
  })
})

describe('next-day visibility (RFP handover)', () => {
  it('a freshly-billed invoice is hidden until the next day', () => {
    const api = store()
    const before = outstandingAccpayInvoicesFor(mirror(api), SOUTER, api.getState().clock.todayISO).length

    // Bill Souter's design-day AM list today.
    const listId = SEED_LIST_IDS.souterAm21
    expect(submitList(api, OFFICE, listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    handoffListCases(api, listId)

    // Raised today → not yet visible.
    const sameDay = outstandingAccpayInvoicesFor(mirror(api), SOUTER, api.getState().clock.todayISO).length
    expect(sameDay).toBe(before)

    // Advance a day → the new invoices appear.
    advanceClockDays(api, 1)
    const nextDay = outstandingAccpayInvoicesFor(mirror(api), SOUTER, api.getState().clock.todayISO).length
    expect(nextDay).toBeGreaterThan(before)
  })
})

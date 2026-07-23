/**
 * Phase 05 — seeded anaesthetist-dashboard figures + the receivables/aging
 * derivation (W1/W4). The derivation is pure over a seed + a today; the
 * selector wraps it with the demo clock. Uses isolated, non-persisted stores.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { dashboardFiguresFor } from './selectors'
import { advanceClockDays } from './clockActions'
import { ANAESTHETIST_DASHBOARD, deriveDashboardFigures } from '../domain/seed'
import { ANAE } from '../domain/seed'

const SOUTER = ANAE.souter
const DEMO_TODAY = '2026-07-21'

describe('deriveDashboardFigures (pure aging derivation)', () => {
  const seed = ANAESTHETIST_DASHBOARD[SOUTER]!

  it('buckets each outstanding account against today and sums the bars', () => {
    const f = deriveDashboardFigures(seed, DEMO_TODAY)
    expect(f.aging.current).toBe(2605.5)
    expect(f.aging.d31_60).toBe(2390)
    expect(f.aging.d61_90).toBe(1930)
    expect(f.aging.d90plus).toBe(860)
    expect(f.aging.total).toBe(7785.5)
  })

  it('counts exactly the accounts more than 60 days old', () => {
    expect(deriveDashboardFigures(seed, DEMO_TODAY).accountsOver60).toBe(3)
  })

  it('orders outstanding accounts by first-account date (flat, no rollup)', () => {
    const dates = deriveDashboardFigures(seed, DEMO_TODAY).outstanding.map((o) => o.firstAccountDateISO)
    expect(dates).toEqual([...dates].sort())
    // Every outstanding row is its own account — no aggregation.
    expect(deriveDashboardFigures(seed, DEMO_TODAY).outstanding.length).toBe(seed.outstanding.length)
  })

  it('is deterministic (two calls deep-equal)', () => {
    expect(deriveDashboardFigures(seed, DEMO_TODAY)).toEqual(deriveDashboardFigures(seed, DEMO_TODAY))
  })

  it('ages forward as today advances (bars shift into older buckets)', () => {
    const early = deriveDashboardFigures(seed, '2026-03-19') // one day after the oldest account
    // With an early today almost everything is Current and nothing is 90d+.
    expect(early.aging.d90plus).toBe(0)
    expect(early.accountsOver60).toBe(0)
    const later = deriveDashboardFigures(seed, '2026-10-01')
    expect(later.accountsOver60).toBeGreaterThan(deriveDashboardFigures(seed, DEMO_TODAY).accountsOver60)
  })
})

describe('dashboardFiguresFor (store selector, view-scoped)', () => {
  it('returns Souter’s seeded figures aged against the demo clock', () => {
    const store = createAppStore()
    const f = dashboardFiguresFor(store.getState(), SOUTER)
    expect(f).toBeDefined()
    expect(f?.aging.total).toBe(7785.5)
    expect(f?.productivity.units).toBe(274)
    expect(f?.leave.some((l) => l.status === 'pending')).toBe(true)
  })

  it('is honest-empty for anaesthetists with no seeded figures', () => {
    const store = createAppStore()
    expect(dashboardFiguresFor(store.getState(), ANAE.rutherford)).toBeUndefined()
    expect(dashboardFiguresFor(store.getState(), '00000')).toBeUndefined()
  })

  it('re-ages when the demo clock advances', () => {
    const store = createAppStore()
    const before = dashboardFiguresFor(store.getState(), SOUTER)!.accountsOver60
    advanceClockDays(store, 40)
    const after = dashboardFiguresFor(store.getState(), SOUTER)!.accountsOver60
    expect(after).toBeGreaterThanOrEqual(before)
  })
})

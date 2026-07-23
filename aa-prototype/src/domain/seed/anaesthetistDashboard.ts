/**
 * Seeded anaesthetist-dashboard figures (Phase 05; W1).
 *
 * PRODUCTIVITY and LEAVE stay seeded demo figures: W1 wants "6 months vs prior
 * years", which the 4-month demo canvas cannot produce, and leave has no master.
 *
 * RECEIVABLES / OVERDUE / GST have moved to billing-mirror derivation over the
 * real Invoice / BillingCase / receipt data (Phase 10; see `store/selectors.ts`
 * `outstandingAccpayInvoicesFor` / `receivablesAgingFor` / `gstActivityFor`, fed
 * by the seeded historical rows in `seed/history.ts`). This module no longer
 * carries the outstanding accounts.
 */

import { ANAE } from './cast'

/** Productivity tiles (W1). All seeded demo figures. */
export interface ProductivitySeed {
  periodLabel: string
  units: number
  unitsChangePct: number
  lists: number
  avgUnitsPerList: number
  feesInvoiced: number
  /** W1's "6 months vs prior years" comparison. */
  sixMonthUnits: number
  sixMonthPriorYearUnits: number
}

/** A leave booking row (W1). Status is a seed fact (the master has no status field). */
export interface LeaveSeed {
  fromISO: string
  toISO: string
  label: string
  status: 'approved' | 'pending'
}

export interface AnaesthetistDashboardSeed {
  productivity: ProductivitySeed
  leave: LeaveSeed[]
}

/**
 * Seeded figures keyed by anaesthetist registration number. Only the demo
 * persona (Dr Souter, 34821) carries a set; the others are honest-empty.
 */
export const ANAESTHETIST_DASHBOARD: Readonly<Record<string, AnaesthetistDashboardSeed>> = {
  [ANAE.souter]: {
    productivity: {
      periodLabel: 'July so far',
      units: 274,
      unitsChangePct: 8,
      lists: 21,
      avgUnitsPerList: 13.0,
      feesInvoiced: 7261,
      sixMonthUnits: 1542,
      sixMonthPriorYearUnits: 1455,
    },
    leave: [
      { fromISO: '2026-07-24', toISO: '2026-07-26', label: 'Annual leave', status: 'approved' },
      { fromISO: '2026-09-14', toISO: '2026-09-16', label: 'NZSA conference', status: 'pending' },
    ],
  },
}

// ---------------------------------------------------------------------------
// Derivation (kept for the productivity/leave figures; the receivables aging
// now lives in the billing-mirror selectors)
// ---------------------------------------------------------------------------

export interface DashboardFigures {
  productivity: ProductivitySeed
  leave: LeaveSeed[]
}

/** The seeded productivity + leave figures for an anaesthetist. Pure. */
export function deriveDashboardFigures(seed: AnaesthetistDashboardSeed): DashboardFigures {
  return { productivity: seed.productivity, leave: seed.leave }
}

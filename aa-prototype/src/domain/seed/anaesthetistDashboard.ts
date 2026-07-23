/**
 * Seeded anaesthetist-dashboard figures (Phase 05).
 *
 * These are LABELLED DEMO FIGURES so the Web Dashboard's five panels (W1) and
 * the Overdue accounts table (W4) are demoable before any real billing data
 * exists. They reference real seeded patients / surgeons / contracts, and the
 * receivables aging bars are DERIVED from the outstanding rows so the
 * dashboard -> overdue path is coherent.
 *
 * Productivity MUST be seeded — W1 wants "6 months vs prior years", which the
 * 4-month demo canvas cannot produce. Receivables/overdue are seeded so both
 * requirements demo; the GST activity report is honest-empty (received money is
 * a Phase 10 output).
 *
 * PHASE 10 REPLACES receivables / overdue with billing-mirror derivation over
 * the real Invoice / PaymentIn data (see the billing slice). Until then this
 * module is the single home for the figures — never hardcode them in components.
 */

import { CONTRACT } from './contracts'
import { PAT } from './patients'
import { SURG, ANAE } from './cast'

export type AgingBucketKey = 'current' | 'd31_60' | 'd61_90' | 'd90plus'

/** One outstanding ACCPAY-style account (W4: flat, no rollup). */
export interface OutstandingAccount {
  id: string
  /** Real seeded patient (hidden internal id). */
  patientId: string
  /** Real seeded contract governing the billed work. */
  contractId: string
  /** Real seeded surgeon on the list. */
  surgeonId: string
  /** Date of the first account raised for this episode. */
  firstAccountDateISO: string
  amount: number
  /** ACC-related work (drives W4's ACC column). */
  accRelated: boolean
}

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
  outstanding: OutstandingAccount[]
}

/**
 * Seeded figures keyed by anaesthetist registration number. Only the demo
 * persona (Dr Souter, 34821) carries a full set; the empty default keeps the
 * other 13 honest-empty until Phase 10.
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
    // Dates chosen relative to DEMO_TODAY (2026-07-21) so the derived buckets
    // are: 3 accounts over 60 days (matching the dashboard mockup's footer).
    outstanding: [
      { id: 'OA-01', patientId: PAT.tane, contractId: CONTRACT.stgDefault, surgeonId: SURG.hale, firstAccountDateISO: '2026-07-02', amount: 845.0, accRelated: false },
      { id: 'OA-02', patientId: PAT.marsh, contractId: CONTRACT.sxap, surgeonId: SURG.patel, firstAccountDateISO: '2026-07-08', amount: 1240.0, accRelated: false },
      { id: 'OA-03', patientId: PAT.chen, contractId: CONTRACT.stgDefault, surgeonId: SURG.hale, firstAccountDateISO: '2026-06-29', amount: 520.5, accRelated: false },
      { id: 'OA-04', patientId: PAT.prentice, contractId: CONTRACT.stgAcc, surgeonId: SURG.doyle, firstAccountDateISO: '2026-06-04', amount: 980.0, accRelated: true },
      { id: 'OA-05', patientId: PAT.holt, contractId: CONTRACT.healthNz, surgeonId: SURG.tan, firstAccountDateISO: '2026-05-27', amount: 1410.0, accRelated: false },
      { id: 'OA-06', patientId: PAT.foster, contractId: CONTRACT.cosAcc, surgeonId: SURG.okafor, firstAccountDateISO: '2026-05-06', amount: 1930.0, accRelated: true },
      { id: 'OA-07', patientId: PAT.mitchell, contractId: CONTRACT.stgDefault, surgeonId: SURG.hale, firstAccountDateISO: '2026-04-14', amount: 610.0, accRelated: false },
      { id: 'OA-08', patientId: PAT.walker, contractId: CONTRACT.sxap, surgeonId: SURG.patel, firstAccountDateISO: '2026-03-18', amount: 250.0, accRelated: false },
    ],
  },
}

// ---------------------------------------------------------------------------
// Derivation (pure — the store selector wraps it with the demo clock's today)
// ---------------------------------------------------------------------------

export interface AgingBuckets {
  current: number
  d31_60: number
  d61_90: number
  d90plus: number
  total: number
}

export interface DerivedOutstanding extends OutstandingAccount {
  agingDays: number
  bucket: AgingBucketKey
}

export interface DashboardFigures {
  productivity: ProductivitySeed
  leave: LeaveSeed[]
  /** Outstanding accounts, aged and ordered by first-account date (W4: flat, by date). */
  outstanding: DerivedOutstanding[]
  aging: AgingBuckets
  /** Count of accounts more than 60 days old (the dashboard footer link). */
  accountsOver60: number
}

/** Whole days from an ISO date to another (UTC-midnight based; deterministic). */
function epochDay(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Math.floor(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000)
}

export function bucketForAgingDays(days: number): AgingBucketKey {
  if (days <= 30) return 'current'
  if (days <= 60) return 'd31_60'
  if (days <= 90) return 'd61_90'
  return 'd90plus'
}

/**
 * Derive the dashboard view from a seed + the demo clock's today: age every
 * outstanding row, bucket it, sum the aging bars, and count the over-60s. Pure
 * and deterministic — the receivables/aging derivation the Phase 05 tests pin.
 */
export function deriveDashboardFigures(seed: AnaesthetistDashboardSeed, todayISO: string): DashboardFigures {
  const outstanding: DerivedOutstanding[] = seed.outstanding
    .map((o) => {
      const agingDays = epochDay(todayISO) - epochDay(o.firstAccountDateISO)
      return { ...o, agingDays, bucket: bucketForAgingDays(agingDays) }
    })
    .sort((a, b) => a.firstAccountDateISO.localeCompare(b.firstAccountDateISO))

  const aging: AgingBuckets = { current: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 }
  for (const o of outstanding) {
    aging[o.bucket] = Math.round((aging[o.bucket] + o.amount) * 100) / 100
    aging.total = Math.round((aging.total + o.amount) * 100) / 100
  }
  const accountsOver60 = outstanding.filter((o) => o.agingDays > 60).length
  return { productivity: seed.productivity, leave: seed.leave, outstanding, aging, accountsOver60 }
}

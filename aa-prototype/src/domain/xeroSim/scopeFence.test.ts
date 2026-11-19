/**
 * The scope fence for bulk remittance (catch-up Phase 37; US-10.2.4): bulk
 * matching stays in Xero, so nothing in the Billing Engine imports the Xero
 * simulation's own logic. Only `store/xeroSimActions.ts` (the Xero-side
 * simulated actions) and the Xero simulator UI under `apps/demo/` may import
 * `domain/xeroSim/`. A source scan, in the idiom of `pwaPurity.test.ts`.
 */

import { describe, expect, it } from 'vitest'

const SOURCES = import.meta.glob('../../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** Any import or re-export whose specifier reaches the xeroSim folder. */
const IMPORTS_XERO_SIM = /(?:from\s+|import\s*\(\s*)['"][^'"]*\/xeroSim(?:\/[^'"]*)?['"]/

function allowed(path: string): boolean {
  return path === '../../store/xeroSimActions.ts' || path.startsWith('../../apps/demo/') || path.startsWith('./')
}

describe('the bulk-remittance scope fence (US-10.2.4)', () => {
  const files = Object.entries(SOURCES).filter(([p]) => !/\.test\.tsx?$/.test(p))

  it('scans the engine', () => {
    for (const engine of ['../../store/xeroHandoff.ts', '../../store/paymentActions.ts', '../../store/payablesActions.ts', '../../store/reconciliationPoll.ts', '../../store/billingRun.ts', '../../store/ledgerSelectors.ts', '../billing/ledger.ts']) {
      expect(SOURCES[engine], engine).toBeDefined()
    }
  })

  it('only the Xero-side actions and the simulator import domain/xeroSim', () => {
    const offenders = files.filter(([p, src]) => !allowed(p) && IMPORTS_XERO_SIM.test(src)).map(([p]) => p)
    expect(offenders).toEqual([])
  })

  it('the domain barrel never re-exports it', () => {
    expect(SOURCES['../index.ts']).toBeDefined()
    expect(IMPORTS_XERO_SIM.test(SOURCES['../index.ts']!)).toBe(false)
    expect(/['"]\.\/xeroSim['"]/.test(SOURCES['../index.ts']!)).toBe(false)
  })
})

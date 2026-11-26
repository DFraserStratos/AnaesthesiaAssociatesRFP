/**
 * Mechanical enforcement of US-08.3.2 (catch-up Phase 36; PROGRESS convention
 * 9 / 2nd-review #9): every app money view reads the LEDGER, AA's system of
 * record, never the Xero simulation's slice. A greppable source scan: no file
 * under `src/apps/mobile`, `src/apps/web`, `src/apps/admin` or `src/shared`
 * may reference `.xero`, except the named allow-list below (each a Xero
 * administration or demo surface, never a money figure). The demo Xero
 * simulation itself (`src/apps/demo`) is not scanned: it IS the Xero view.
 * The store's money selectors read `billing` only; the ledger tests exercise
 * them (`payablesDue` is proved the same with or without `xero`).
 */

import { describe, expect, it } from 'vitest'

const MOBILE = import.meta.glob('./mobile/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const WEB = import.meta.glob('./web/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const ADMIN = import.meta.glob('./admin/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const SHARED = import.meta.glob('../shared/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const SOURCES = { ...MOBILE, ...WEB, ...ADMIN, ...SHARED }

/** The reads of Xero allowed outside the simulation, with why. */
const ALLOWED: Record<string, string> = {
  './admin/screens/masters/ReferenceViews.tsx': 'Xero contact archiving (a Xero administration view, not a money view)',
  '../shared/demoTriggers/registry.ts': "the demo triggers pick ACCRECs through openAccRecs (Phase 14's demo-surface exemption)",
  './admin/screens/InvoiceDocument.tsx': "the Ledger card's Xero identifiers beside the ledger's numbers (no money figure)",
  './admin/screens/finances/LedgerLists.tsx': "the Ledger tab's Invoice pairs, moved from LedgerScreen (build plan Phase 64): the same Xero column note (no money figure)",
  './admin/screens/finances/AccountPairs.tsx': "the account page's invoice pairs, moved from LedgerScreen (build plan Phase 65): hands the Xero slice to ledgerRows for its archived-contact flag (no money figure)",
  './admin/screens/PaymentRunScreen.tsx': "the remittance advice's Xero batch payment and credit allocation, read through remittanceAdviceFor as before (build plan Phase 66 narrowed its whole-store read to slices)",
  './admin/components/ReconciliationCard.tsx': 'the reconciliation status compares the ledger against the Xero mirror and its bank lines (US-13.2.4, catch-up Phase 37); it is a check of agreement, not a money view',
  './admin/components/PaymentCyclePanel.tsx': "Run payables in Xero (badged Simulated Xero) needs which scheduled run still has bills Xero has not been sent (catch-up Phase 39a); every figure the panel shows is the ledger's",
}

/** Strip block + line comments so a comment mentioning `state.xero` never trips the scan. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe('money-view purity (apps read the ledger, not Xero)', () => {
  const files = Object.keys(SOURCES).filter((f) => !/\.test\.tsx?$/.test(f))

  it('finds the mobile, web, admin and shared sources', () => {
    expect(files.length).toBeGreaterThan(100)
    expect(files.some((f) => f.startsWith('./admin/'))).toBe(true)
    expect(files.some((f) => f.startsWith('../shared/'))).toBe(true)
  })

  it('never reads the Xero slice outside the named allow-list', () => {
    for (const file of files) {
      if (ALLOWED[file] !== undefined) continue
      const code = stripComments(SOURCES[file] ?? '')
      expect(/\.xero\b/.test(code), `${file} must not read state.xero: money views read the ledger (US-08.3.2)`).toBe(false)
    }
  })

  it('every allow-list entry still exists and still needs its exemption', () => {
    for (const file of Object.keys(ALLOWED)) {
      expect(SOURCES[file], file).toBeDefined()
      expect(/\.xero\b/.test(stripComments(SOURCES[file] ?? '')), `${file} no longer reads Xero: drop it from the allow-list`).toBe(true)
    }
  })
})

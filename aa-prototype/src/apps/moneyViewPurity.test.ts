/**
 * Mechanical enforcement of PROGRESS convention 9 / 2nd-review #9: the
 * anaesthetist apps (mobile + web) read the Billing Engine's MIRROR only, NEVER
 * the Xero-sim slice. A greppable source-scan: no file under `src/apps/mobile`
 * or `src/apps/web` may reference `state.xero` / `s.xero` / `.xero.`.
 *
 * The Admin app (the office / billing-engine surface) and the demo Xero sim are
 * exempt — they legitimately drive Xero (payables, archiving, the sim itself).
 * The store's money-view selectors are written to read `billing` only; that is
 * asserted by the money-view tests (dashboard.test), which exercise them.
 */

import { describe, expect, it } from 'vitest'

const MOBILE = import.meta.glob('./mobile/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const WEB = import.meta.glob('./web/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const SOURCES = { ...MOBILE, ...WEB }

/** Strip block + line comments so a comment mentioning `state.xero` never trips the scan. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe('money-view purity (apps read the billing mirror, not Xero)', () => {
  const files = Object.keys(SOURCES)

  it('finds the mobile + web sources', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('never reads the Xero slice from a mobile or web app file', () => {
    for (const file of files) {
      const code = stripComments(SOURCES[file] ?? '')
      expect(/\.xero\b/.test(code), `${file} must not read state.xero (convention 9)`).toBe(false)
    }
  })
})

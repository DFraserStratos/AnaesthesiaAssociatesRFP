/**
 * Catch-up Phase 39b (work item 5, DM-46): the billing line entity is gone,
 * replaced by the billing event. This scan keeps it gone: no source file under
 * `src/` names the old entity, its schedule slice, its charge basis or its
 * audit actions outside a comment line. The frozen parity captures and
 * fixtures (`__parity__`, `__fixtures__`) are historical and excluded, as is
 * this file.
 */

import { describe, expect, it } from 'vitest'

// Every source under src/, as raw text, resolved by Vite at transform time.
const SOURCES = import.meta.glob('../../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const SELF = './billingLineRemoved.test.ts'
// Test files may name the old shape on purpose (the v70 migrate test builds a stale persisted store holding it).
const EXCLUDED = /\/(__parity__|__fixtures__)\/|\.test\.tsx?$/
const FORBIDDEN = /BillingLine|billingLines|chargeBasis|billingLine\./

/** A line that is only a comment (`//`, `/*`, or a block comment's `*` line). */
function isCommentLine(line: string): boolean {
  const t = line.trim()
  return t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')
}

describe('the billing line entity is gone (catch-up Phase 39b, DM-46)', () => {
  it('scans a meaningful number of files', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(200)
  })

  it('no source names BillingLine, billingLines, chargeBasis or a billingLine.* action outside a comment', () => {
    const hits: string[] = []
    for (const [path, source] of Object.entries(SOURCES)) {
      if (path.endsWith(SELF.slice(1)) || EXCLUDED.test(path)) continue
      source.split('\n').forEach((line, index) => {
        if (FORBIDDEN.test(line) && !isCommentLine(line)) hits.push(`${path}:${index + 1}: ${line.trim()}`)
      })
    }
    expect(hits).toEqual([])
  })
})

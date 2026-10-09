/**
 * "Slot" never reaches the UI (catch-up Phase 28; OQ-64, EP-01: "the word
 * 'slot' is never shown in the UI"). It stays a code and planning word. This
 * scans what a user can read: the audit action and field labels, the audit
 * codes and entity types the Audit viewer prints beside them, and every
 * quoted string and JSX text in the three apps, the demo screens and the
 * shared surfaces. (Playwright's copy check covers the rendered screens.)
 */

import { describe, expect, it } from 'vitest'
import { ACTION_LABELS } from '../shared/audit/actionLabels'
import { FIELD_LABELS } from '../shared/audit/fieldLabels'

const SLOT = /\bslots?\b/i

const UI = import.meta.glob(['./**/*.tsx', '../shared/**/*.tsx', '../shell/**/*.tsx', '../../pwa/**/*.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const STORE = import.meta.glob('../store/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** Single- and double-quoted strings and JSX text: what renders. Template literals interpolate code, so they are left to the rendered check. */
function readableStrings(raw: string): string[] {
  // Comments are not copy (block comments, JSX comments, line comments).
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const out: string[] = []
  for (const m of source.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)) out.push(m[1] ?? m[2] ?? '')
  for (const m of source.matchAll(/>([^<>{}\n]+)</g)) out.push(m[1] ?? '')
  return out
}

describe('no "slot" in app copy (OQ-64)', () => {
  it('in the audit action and field labels', () => {
    expect(Object.values(ACTION_LABELS).filter((l) => SLOT.test(l))).toEqual([])
    expect(Object.values(FIELD_LABELS).filter((l) => SLOT.test(l))).toEqual([])
  })

  it('in the audit codes and entity types the store writes (the Audit viewer prints them)', () => {
    const hits: string[] = []
    for (const [file, source] of Object.entries(STORE)) {
      if (file.endsWith('.test.ts')) continue
      for (const m of source.matchAll(/(?:action|entityType): '([^']+)'/g)) if (SLOT.test(m[1]!)) hits.push(`${file}: ${m[1]}`)
    }
    expect(hits).toEqual([])
  })

  it('in the quoted strings and JSX text of every screen and shared surface', () => {
    const hits: string[] = []
    for (const [file, source] of Object.entries(UI)) {
      if (file.includes('.test.')) continue
      for (const s of readableStrings(source)) {
        // Module paths, attribute names and test hooks are not copy.
        if (/^[./]/.test(s) || /^(data-|admin-|mobile-|web-)/.test(s)) continue
        if (SLOT.test(s)) hits.push(`${file}: ${s}`)
      }
    }
    expect(hits).toEqual([])
  })
})

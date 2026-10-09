/**
 * The Draft List words (catch-up Phase 31; OQ-64 answered, D14): one module,
 * so the three apps cannot drift and the "slot" check has one place to look.
 */

import { describe, expect, it } from 'vitest'
import { LIST_STATE_LABELS } from '../domain/types'
import { DRAFT_LIST, DRAFT_LISTS, DRAFT_STATE, ORIGIN_LABELS, ORIGIN_SHORT_LABELS, SOURCE_LABELS, UNASSIGNED, draftListCount } from './scheduleTerms'

const SOURCES = import.meta.glob(['../apps/**/*.{ts,tsx}', './**/*.{ts,tsx}', '../shell/**/*.{ts,tsx}', '../pwa/**/*.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Quoted strings and JSX text, comments stripped (as `noSlotCopy.test.ts` reads copy). */
function readableStrings(raw: string): string[] {
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const out: string[] = []
  for (const m of source.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) out.push(m[1] ?? m[2] ?? m[3] ?? '')
  for (const m of source.matchAll(/>([^<>{}\n]+)</g)) out.push(m[1] ?? '')
  return out
}

const ALL_WORDS = [DRAFT_LIST, DRAFT_LISTS, UNASSIGNED, DRAFT_STATE, ...Object.values(ORIGIN_LABELS), ...Object.values(ORIGIN_SHORT_LABELS), ...Object.values(SOURCE_LABELS)]

describe('the terms module', () => {
  it('the DRAFT chip reads the one state label home', () => {
    expect(DRAFT_STATE).toBe(LIST_STATE_LABELS.DRAFT)
    expect(DRAFT_LIST).toBe('Draft List')
    expect(UNASSIGNED).toBe('Unassigned')
    expect(draftListCount(1)).toBe('1 Draft List')
    expect(draftListCount(15)).toBe('15 Draft Lists')
  })

  it('never says "slot", never uses a dash, and never says "being prepared"', () => {
    for (const w of ALL_WORDS) {
      expect(w).not.toMatch(/\bslots?\b/i)
      expect(w).not.toMatch(/[–—]/)
      expect(w).not.toMatch(/being prepared/i)
    }
  })

  it('every "Draft List" and "Unassigned" in app copy comes from this module (no stray literal)', () => {
    const hits: string[] = []
    for (const [file, source] of Object.entries(SOURCES)) {
      if (file.includes('.test.') || file.endsWith('scheduleTerms.ts')) continue
      for (const s of readableStrings(source)) {
        if (/\bDraft Lists?\b/.test(s) || /\bUnassigned\b/.test(s)) hits.push(`${file}: ${s}`)
      }
    }
    expect(hits).toEqual([])
  })
})

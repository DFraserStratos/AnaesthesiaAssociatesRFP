/**
 * Support's words and one place (catch-up Phase 43b). The catalogue says
 * "help line", never "help desk"; the support hours and response times live
 * only in `SUPPORT_CONFIG` (`domain/support.ts`), so no other non-test source
 * retypes them; the panel imports nothing from the Admin or web apps.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FORMAT_CHECKS_ETHNICITY_LABEL,
  FORMAT_CHECKS_ETHNICITY_LINES,
  FORMAT_CHECKS_NHI_LABEL,
  FORMAT_CHECKS_NHI_LINES,
  FORMAT_CHECKS_TITLE,
} from './supportCopy'

const SRC = resolve(__dirname, '../..')

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

const stripComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

describe('support copy and the one place (catch-up Phase 43b)', () => {
  const files = sources(SRC).map((path) => ({ rel: relative(SRC, path), code: stripComments(readFileSync(path, 'utf8')) }))

  it('says "help line", never "help desk"', () => {
    expect(files.filter((f) => /help ?desk/i.test(f.code)).map((f) => f.rel)).toEqual([])
  })

  it('no source but the config types the support hours or the response times', () => {
    const RETYPED = /8:30am to|5:00pm NZT|\b4 hours\b|3 business days|Same business day/
    expect(files.filter((f) => f.rel !== join('domain', 'support.ts') && RETYPED.test(f.code)).map((f) => f.rel)).toEqual([])
  })

  it('the panel and the rules import nothing from the Admin or web apps', () => {
    const shared = files.filter((f) => f.rel.startsWith(join('shared', 'support')) || f.rel === join('domain', 'support.ts'))
    expect(shared.length).toBeGreaterThan(5)
    expect(shared.filter((f) => /from '[./]*apps\/(admin|web)\//.test(f.code)).map((f) => f.rel)).toEqual([])
  })

  it('the NHI and ethnicity format words say the facts, with no dash, vendor or phase number', () => {
    const all = [FORMAT_CHECKS_TITLE, FORMAT_CHECKS_NHI_LABEL, ...FORMAT_CHECKS_NHI_LINES, FORMAT_CHECKS_ETHNICITY_LABEL, ...FORMAT_CHECKS_ETHNICITY_LINES].join(' ')
    expect(all).toMatch(/AAANNNC.*mod-11 check digit/)
    expect(all).toMatch(/AAANNAX.*mod-23 check letter/)
    expect(all).toContain('4 November 2027')
    expect(all).toContain('"Modulus 24"')
    expect(all).toContain('for AA to confirm')
    expect(all).toContain('NZHIS Level 4')
    expect(all).toContain("outside this demo's subset, never as invalid")
    expect(all).not.toMatch(/[–—]|Stratos|[Pp]hase \d/)
  })
})

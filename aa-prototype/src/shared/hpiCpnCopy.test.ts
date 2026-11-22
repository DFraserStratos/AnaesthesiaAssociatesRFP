/**
 * HPI CPN is the one name for a practitioner's identifier (catch-up Phase
 * 40a; FT-14.4, OQ-52). This scan reads every non-test source file's string
 * literals and JSX text (comments stripped; identifiers such as `HPI_SYSTEM`
 * and URLs are not text) and refuses "HPI id", "HPI number", "HPI identifier"
 * or a bare "HPI" not followed by " CPN".
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatHpiCpn, HPI_CPN_LABEL, practitionerWithHpiCpn } from './format'

const SRC = resolve(__dirname, '..')

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

/** The text a person could read: string literals and JSX text. */
function visibleTexts(code: string): string[] {
  const body = stripComments(code)
  const out: string[] = []
  for (const m of body.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) out.push(m[1] ?? m[2] ?? m[3] ?? '')
  // JSX text, split at expressions: "<span>HPI {id}</span>" yields "HPI ".
  for (const m of body.matchAll(/(?:>|\})([^<>{}]+)(?=<|\{)/g)) out.push(m[1] ?? '')
  return out
}

// Upper case only: lower-case `hpi` is a key, a hook or a variable, never copy.
const BAD = /\bHPI (?:[Ii][Dd]|[Nn]umber|[Ii]dentifier)\b|\bHPI\b(?! CPN)/

function offenders(text: string): boolean {
  if (/https?:\/\//.test(text)) return false
  return BAD.test(text.replace(/hpi-person-id/gi, ''))
}

describe('HPI CPN copy (catch-up Phase 40a)', () => {
  it('the scanner finds what it should (not trivially passing)', () => {
    const sample = "const a = 'Provider HPI id'\nconst b = <span>HPI number</span>\n// HPI in a comment\nconst c = 'HPI CPN 10SOUM'\nconst d = HPI_SYSTEM\nconst e = <span>HPI {id}</span>"
    const found = visibleTexts(sample).filter(offenders).map((t) => t.trim())
    expect(found).toEqual(['Provider HPI id', 'HPI number', 'HPI'])
  })

  it('no source shows a practitioner identifier under any other name', () => {
    const files = sources(SRC)
    expect(files.length).toBeGreaterThan(500)
    const hits: string[] = []
    let labels = 0
    for (const file of files) {
      for (const text of visibleTexts(readFileSync(file, 'utf8'))) {
        if (text.includes('HPI CPN')) labels++
        if (offenders(text)) hits.push(`${relative(SRC, file)}: ${text.trim().slice(0, 80)}`)
      }
    }
    expect(hits).toEqual([])
    expect(labels).toBeGreaterThan(10)
    // A whole-source scan: slow beside the full suite (as the Wave 5 join's retired-names scan).
  }, 30_000)

  it('one label and one formatter', () => {
    expect(HPI_CPN_LABEL).toBe('HPI CPN')
    expect(formatHpiCpn(' 10soum ')).toBe('HPI CPN 10SOUM')
    expect(formatHpiCpn('')).toBeNull()
    expect(formatHpiCpn(undefined)).toBeNull()
    expect(practitionerWithHpiCpn('Dr Melanie Souter', '10SOUM')).toBe('Dr Melanie Souter (HPI CPN 10SOUM)')
    expect(practitionerWithHpiCpn('Dr New Surgeon', undefined)).toBe('Dr New Surgeon')
  })
})

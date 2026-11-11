/**
 * Drift guard for the generated RVG modifier table (catch-up Phase 19b,
 * US-05.1.5, RV-38). The checked-in `rvgModifiers.generated.ts` must equal the
 * one parse of the catalogue's AR-34 files; a changed source file fails here
 * until `npm run rvg:modifiers` is re-run. No modifier row is hand-typed.
 */

/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import generatedSource from './rvgModifiers.generated.ts?raw'
import { parseIncludedModifiers, parseModifierTable, renderGenerated } from '../../../scripts/rvgModifiersParse.mjs'
import { RVG_INCLUDED_MODIFIERS, RVG_MODIFIER_ROWS } from './rvgModifiers.generated'

// Read with node:fs: the catalogue sits outside Vite's allowed folder. Paths are
// relative to the aa-prototype root, where Vitest runs.
const FILES = '../requirements-board/requirements/artifacts/files'
const markdown = readFileSync(`${FILES}/NZSA RVG 2021 modifiers.md`, 'utf8')
const csv = readFileSync(`${FILES}/NZSA RVG 2021 included modifiers.csv`, 'utf8')

describe('the generated RVG modifier table', () => {
  const rows = parseModifierTable(markdown)
  const included = parseIncludedModifiers(csv)

  it('equals the parse of the catalogue files (re-run npm run rvg:modifiers if this fails)', () => {
    expect(RVG_MODIFIER_ROWS).toEqual(rows)
    expect(RVG_INCLUDED_MODIFIERS).toEqual(included)
    expect(generatedSource).toBe(renderGenerated(rows, included))
  })

  it('holds the 30 printed codes in table order, and the 20 included-modifier rows', () => {
    expect(RVG_MODIFIER_ROWS).toHaveLength(30)
    expect(RVG_MODIFIER_ROWS.map((r) => r.code)).toEqual([
      'PA1', 'PA2', 'PA3', 'PA4', 'PA5', 'A1', 'A2', 'AS1', 'AS3', 'AS4', 'ASE', 'OB1', 'OB2', 'OB3', 'OB4',
      'AI1', 'P1', 'VM1', 'TTE1', 'TTE2', 'PACU1', 'EAA1', 'POC 1', 'POC2a', 'POC2b', 'POC2c', 'POC3a', 'POC3b',
      'NC1', 'NC2',
    ])
    expect(RVG_INCLUDED_MODIFIERS).toHaveLength(20)
  })

  it('names only table codes as included modifiers (P1), and marks only age as automatic', () => {
    const codes = new Set(RVG_MODIFIER_ROWS.map((r) => r.code))
    for (const row of RVG_INCLUDED_MODIFIERS) expect(codes.has(row.includedModifier)).toBe(true)
    expect(new Set(RVG_INCLUDED_MODIFIERS.map((r) => r.includedModifier))).toEqual(new Set(['P1']))
    expect(RVG_MODIFIER_ROWS.filter((r) => r.automatic).map((r) => r.code)).toEqual(['A1', 'A2'])
  })

  it('gives every row a distinct hidden id', () => {
    const ids = RVG_MODIFIER_ROWS.map((r) => r.code.replace(/\s+/g, ''))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps values as printed and carries no en or em dash', () => {
    const units = Object.fromEntries(RVG_MODIFIER_ROWS.map((r) => [r.code, r.unitsAsPrinted]))
    expect(units).toMatchObject({ PA3: '2 + Time', PA5: '2 [Max]', AS3: '2', POC2a: '4-6', POC2b: '1 [Per Call]', PACU1: 'As Per T1/T2' })
    expect(generatedSource).not.toMatch(/[–—]/)
  })
})

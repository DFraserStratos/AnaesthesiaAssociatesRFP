/** Build plan Phase 68: the simulated PDF reader (D120, DM-16, US-02.2.1). The layouts' boxes: `pdfFacsimile.test.ts`. */
import { describe, expect, it } from 'vitest'
import type { PdfBox, PdfListRow } from '../types'
import {
  PDF_CHECK_THRESHOLD,
  PDF_DERIVED_FACTOR,
  PDF_HEADER_ROW,
  PDF_ROW_READ_FIELDS,
  UNREADABLE_REASONS,
  isUnsure,
  pdfPageCount,
  pdfValueKey,
  readConfidence,
  readValuesOfRow,
  simulateRead,
  toCheckCount,
  unsureFieldsOfRow,
  unsureValues,
  type PdfReadSpot,
} from './pdfRead'
import { PDF_LIST_SAMPLES } from './pdfLists'

const box = (page: number, y: number): PdfBox => ({ page, x: 40, y, width: 80, height: 12 })

describe('the reader', () => {
  it('keeps the threshold and the unsure helpers', () => {
    expect(PDF_CHECK_THRESHOLD).toBe(0.8)
    expect(isUnsure({ confidence: 0.79 })).toBe(true)
    expect(isUnsure({ confidence: 0.8 })).toBe(false)
    expect(unsureValues(undefined)).toEqual([])
  })

  it('never reads an ethnicity: no rooms PDF prints one', () => {
    expect(PDF_ROW_READ_FIELDS).toEqual(['nhi', 'name', 'procedureText', 'scheduledTime', 'dobISO'])
    expect(readValuesOfRow({ name: 'A', procedureText: 'p', ethnicityCode: '11111' })).not.toHaveProperty('ethnicityCode')
  })

  it('keys a value by its row and field', () => {
    expect(pdfValueKey('R2', 'nhi')).toBe('R2:nhi')
    expect(pdfValueKey(PDF_HEADER_ROW, 'surgeon')).toBe('header:surgeon')
  })

  it('counts pages at twenty rows a page when nothing better is known', () => {
    expect(pdfPageCount(0)).toBe(1)
    expect(pdfPageCount(20)).toBe(1)
    expect(pdfPageCount(21)).toBe(2)
    expect(pdfPageCount(7, 3)).toBe(3)
  })
})

describe('simulateRead', () => {
  const sample = PDF_LIST_SAMPLES[0]!
  const rows = sample.rows.map((r) => ({ id: r.id, values: readValuesOfRow(r) }))
  const header = { surgeon: sample.surgeonName, hospital: sample.hospitalName, date: 'Wednesday 9 December 2026', session: 'AM' }
  // Every value printed, each on its own line: the layout's spots.
  const spots = new Map<string, PdfReadSpot>()
  let y = 40
  for (const f of ['surgeon', 'hospital', 'date', 'session'] as const) spots.set(pdfValueKey(PDF_HEADER_ROW, f), { box: box(1, (y += 14)) })
  for (const r of sample.rows) for (const f of PDF_ROW_READ_FIELDS) spots.set(pdfValueKey(r.id, f), { box: box(1, (y += 14)), ...(f === 'scheduledTime' ? { derived: true } : {}) })
  const input = { header, rows, spots }

  it('reads every present value at the clean confidence, each with the box its layout gave it', () => {
    const read = simulateRead(input)
    expect(read.headerRead.map((v) => v.field)).toEqual(['surgeon', 'hospital', 'date', 'session'])
    expect(read.headerRead.every((v) => v.confidence === 0.97)).toBe(true)
    expect(read.headerRead[0]!.box).toEqual(spots.get('header:surgeon')!.box)
    expect(read.rows).toHaveLength(3)
    const second = read.rows[1]!
    expect(second.id).toBe('R2')
    expect(second.read.map((v) => v.field)).toEqual(['nhi', 'name', 'procedureText', 'scheduledTime', 'dobISO'])
    expect(second.read.find((v) => v.field === 'nhi')).toMatchObject({ value: 'ZAA0068', box: spots.get('R2:nhi')!.box })
    expect(unsureValues(second.read)).toEqual([])
  })

  it('reads a worked-out value (a time from the start and the durations) a little lower, still sure when clean', () => {
    const time = simulateRead(input).rows[0]!.read.find((v) => v.field === 'scheduledTime')!
    expect(PDF_DERIVED_FACTOR).toBe(0.93)
    expect(time.confidence).toBe(0.9)
    expect(isUnsure(time)).toBe(false)
    expect(readConfidence(undefined, true, true)).toBe(0.73)
    expect(readConfidence(0.99, true, true)).toBe(0.75)
  })

  it('does not read a value its layout did not print', () => {
    const partial = new Map(spots)
    partial.delete('R1:dobISO')
    partial.delete('header:session')
    const read = simulateRead({ ...input, spots: partial })
    expect(read.headerRead.map((v) => v.field)).not.toContain('session')
    expect(read.rows[0]!.read.map((v) => v.field)).not.toContain('dobISO')
  })

  it('does not read a blank value', () => {
    const read = simulateRead({ header: { surgeon: 'Mr J. Whitford', anaesthetist: ' ' }, rows: [{ id: 'R3', values: { name: 'Joan Pickering', nhi: '', procedureText: 'phaco + IOL R' } }] })
    expect(read.headerRead.map((v) => v.field)).toEqual(['surgeon'])
    expect(read.rows[0]!.read.map((v) => v.field)).toEqual(['name', 'procedureText'])
  })

  it('respects an override, header and row', () => {
    const read = simulateRead({
      header: { surgeon: 'Mr C. Okafor' },
      headerConfidence: { surgeon: 0.6 },
      rows: [{ id: 'R1', values: { nhi: 'ZAF4434', name: 'Brian Holt' }, confidence: { nhi: 0.55 } }],
    })
    expect(read.headerRead[0]!.confidence).toBe(0.6)
    expect(read.rows[0]!.read.find((v) => v.field === 'nhi')!.confidence).toBe(0.55)
    expect(read.rows[0]!.read.find((v) => v.field === 'name')!.confidence).toBe(0.97)
  })

  it('reads a scan lower: a value with no override falls below the threshold, one overridden high stays sure', () => {
    const read = simulateRead({
      header,
      scanned: true,
      rows: [{ id: 'R1', values: { nhi: 'ZAF4434', name: 'Brian Holt' }, confidence: { name: 1 } }],
    })
    expect(read.headerRead.every((v) => v.confidence === 0.79 && isUnsure(v))).toBe(true)
    const row = read.rows[0]!.read
    expect(row.find((v) => v.field === 'nhi')!.confidence).toBe(0.79)
    expect(row.find((v) => v.field === 'name')!.confidence).toBe(0.82)
    expect(unsureFieldsOfRow({ read: row })).toEqual(['nhi'])
  })

  it('lowers an override on a scan too, floored to hundredths', () => {
    expect(readConfidence(0.98, true)).toBe(0.8)
    expect(readConfidence(0.5, true)).toBe(0.41)
    expect(readConfidence(undefined, false)).toBe(0.97)
    expect(readConfidence(1.4, false)).toBe(1)
  })

  it('is deterministic', () => {
    expect(simulateRead({ ...input, scanned: true })).toEqual(simulateRead({ ...input, scanned: true }))
  })
})

describe('what to check', () => {
  const v = (field: 'nhi' | 'name' | 'surgeon', confidence: number) => ({ field, value: 'x', confidence, box: box(1, 0) })

  it('counts the unsure values of the header and every row', () => {
    const rows: PdfListRow[] = [
      { id: 'R1', asRead: { name: 'A', procedureText: 'p' }, corrections: [], read: [v('nhi', 0.5), v('name', 0.9)] },
      { id: 'R2', asRead: { name: 'B', procedureText: 'p' }, corrections: [], read: [v('nhi', 0.79), v('name', 0.2)] },
      { id: 'R3', asRead: { name: 'C', procedureText: 'p' }, corrections: [] },
    ]
    expect(toCheckCount({ rows, headerRead: [v('surgeon', 0.6), v('surgeon', 0.95)] })).toBe(4)
    expect(toCheckCount({ rows: [] })).toBe(0)
  })

  it('names the unsure fields of a row once each, in read order', () => {
    expect(unsureFieldsOfRow({ read: [v('name', 0.3), v('nhi', 0.9), v('name', 0.4)] })).toEqual(['name'])
    expect(unsureFieldsOfRow({})).toEqual([])
  })

  it('gives each unreadable reason in plain words, with no dashes', () => {
    expect(Object.keys(UNREADABLE_REASONS)).toEqual(['notAList', 'tooFaint', 'noSurgeon'])
    for (const text of Object.values(UNREADABLE_REASONS)) expect(text).not.toMatch(/[–—]/)
  })
})

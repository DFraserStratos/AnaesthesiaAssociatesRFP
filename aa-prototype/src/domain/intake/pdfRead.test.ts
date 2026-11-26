/** Build plan Phase 68: the simulated PDF reader (D120, DM-16, US-02.2.1). */
import { describe, expect, it } from 'vitest'
import type { PdfBox, PdfListRow } from '../types'
import {
  PDF_CHECK_THRESHOLD,
  PDF_HEADER_FIELDS,
  PDF_LAYOUT,
  PDF_PAGE,
  PDF_ROWS_PER_PAGE,
  PDF_ROW_READ_FIELDS,
  UNREADABLE_REASONS,
  headerBoxes,
  isUnsure,
  pdfPageHeight,
  readConfidence,
  readValuesOfRow,
  rowBox,
  simulateRead,
  toCheckCount,
  unsureFieldsOfRow,
  unsureValues,
} from './pdfRead'
import { PDF_LIST_SAMPLES } from './pdfLists'

const overlaps = (a: PdfBox, b: PdfBox) =>
  a.page === b.page && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

const inPage = (b: PdfBox) => b.x >= 0 && b.y >= 0 && b.x + b.width <= PDF_PAGE.width && b.y + b.height <= PDF_PAGE.height

describe('the page geometry', () => {
  it('keeps the threshold and the unsure helpers', () => {
    expect(PDF_CHECK_THRESHOLD).toBe(0.8)
    expect(isUnsure({ confidence: 0.79 })).toBe(true)
    expect(isUnsure({ confidence: 0.8 })).toBe(false)
    expect(unsureValues(undefined)).toEqual([])
  })

  it('gives stable boxes: the same call, the same box', () => {
    expect(headerBoxes()).toEqual(headerBoxes())
    expect(rowBox(3, 'nhi')).toEqual(rowBox(3, 'nhi'))
  })

  it("places the values the facsimile prints at its own x and baseline", () => {
    // buildFacsimile: hospital at (24, 44) 18pt, surgeon line at (24, 66) 12pt; rows at y = 150 + i * 30 + 6.
    expect(headerBoxes().hospital).toMatchObject({ page: 1, x: 24, y: 44 - 18 })
    expect(headerBoxes().surgeon).toMatchObject({ x: 24, y: 66 - 12 })
    const baseline = (i: number) => 150 + i * 30 + 6
    expect(rowBox(0, 'nhi')).toMatchObject({ x: 24, y: baseline(0) - 12 })
    expect(rowBox(2, 'name')).toMatchObject({ x: 120, y: baseline(2) - 12 })
    expect(rowBox(1, 'procedureText')).toMatchObject({ x: 270, y: baseline(1) - 11 })
    expect(rowBox(3, 'scheduledTime')).toMatchObject({ x: 410, y: baseline(3) - 12 })
  })

  it('never overlaps two header boxes, and every header box sits above the first row', () => {
    const boxes = PDF_HEADER_FIELDS.map((f) => headerBoxes()[f])
    for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) expect(overlaps(boxes[a]!, boxes[b]!)).toBe(false)
    for (const b of boxes) {
      expect(inPage(b)).toBe(true)
      expect(b.y + b.height).toBeLessThanOrEqual(PDF_LAYOUT.columnLabelBaseline - 10)
    }
  })

  it('never overlaps two boxes in a row, nor a box of one row with the next', () => {
    for (const i of [0, 1, 7]) {
      const row = PDF_ROW_READ_FIELDS.map((f) => rowBox(i, f))
      const next = PDF_ROW_READ_FIELDS.map((f) => rowBox(i + 1, f))
      for (let a = 0; a < row.length; a++) {
        expect(inPage(row[a]!)).toBe(true)
        for (let b = a + 1; b < row.length; b++) expect(overlaps(row[a]!, row[b]!)).toBe(false)
        for (const n of next) expect(overlaps(row[a]!, n)).toBe(false)
      }
    }
  })

  it('runs a long List onto the next page at the first row height', () => {
    expect(rowBox(PDF_ROWS_PER_PAGE - 1, 'nhi').page).toBe(1)
    const overflow = rowBox(PDF_ROWS_PER_PAGE, 'nhi')
    expect(overflow.page).toBe(2)
    expect(overflow.y).toBe(rowBox(0, 'nhi').y)
    expect(inPage(rowBox(PDF_ROWS_PER_PAGE - 1, 'ethnicityCode'))).toBe(true)
  })

  it("gives today's compact page height for a short List", () => {
    expect(pdfPageHeight(3)).toBe(150 + 3 * 30 + 60)
    expect(pdfPageHeight(500)).toBeLessThanOrEqual(PDF_PAGE.height)
  })
})

describe('simulateRead', () => {
  const sample = PDF_LIST_SAMPLES[0]!
  const input = {
    header: { surgeon: sample.surgeonName, hospital: sample.hospitalName, date: 'Wed 9 Dec', session: 'AM' },
    rows: sample.rows.map((r) => ({ id: r.id, values: readValuesOfRow(r) })),
  }

  it('reads every present value at the clean confidence, each with its box', () => {
    const read = simulateRead(input)
    expect(read.headerRead.map((v) => v.field)).toEqual(['surgeon', 'hospital', 'date', 'session'])
    expect(read.headerRead.every((v) => v.confidence === 0.97)).toBe(true)
    expect(read.headerRead[0]!.box).toEqual(headerBoxes().surgeon)
    expect(read.rows).toHaveLength(3)
    const second = read.rows[1]!
    expect(second.id).toBe('R2')
    expect(second.read.map((v) => v.field)).toEqual(['nhi', 'name', 'procedureText', 'scheduledTime', 'dobISO', 'ethnicityCode'])
    expect(second.read.find((v) => v.field === 'nhi')).toMatchObject({ value: 'ZAA0068', box: rowBox(1, 'nhi') })
    expect(unsureValues(second.read)).toEqual([])
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
      ...input,
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
  const v = (field: 'nhi' | 'name' | 'surgeon', confidence: number) => ({ field, value: 'x', confidence, box: rowBox(0, 'nhi') })

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

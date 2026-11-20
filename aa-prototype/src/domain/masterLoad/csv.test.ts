import { describe, expect, it } from 'vitest'
import { csvLine, parseCsv } from './csv'
import { parseDateCell, parseOptionalNumber, parseListCell } from './validate'

describe('parseCsv (catch-up Phase 42)', () => {
  it('reads the header as row 1 and data rows from row 2', () => {
    expect(parseCsv('Name,Email\nA,a@x.example\nB,b@x.example')).toEqual({
      header: ['Name', 'Email'],
      rows: [
        { rowNumber: 2, cells: ['A', 'a@x.example'] },
        { rowNumber: 3, cells: ['B', 'b@x.example'] },
      ],
    })
  })
  it('handles quoted cells with embedded commas, quotes and line breaks', () => {
    const p = parseCsv('Name,Note\n"Smith, J","He said ""hi"""\n"Two\nlines",x')
    expect(p.rows[0]!.cells).toEqual(['Smith, J', 'He said "hi"'])
    expect(p.rows[1]!.cells).toEqual(['Two\nlines', 'x'])
  })
  it('handles CRLF, a leading BOM and blank trailing lines', () => {
    const p = parseCsv('﻿Name,Email\r\nA,a@x.example\r\n\r\n\r\n')
    expect(p.header).toEqual(['Name', 'Email'])
    expect(p.rows).toEqual([{ rowNumber: 2, cells: ['A', 'a@x.example'] }])
  })
  it('keeps a blank middle row out but counts it in the row numbers', () => {
    expect(parseCsv('Name\nA\n\nB').rows.map((r) => r.rowNumber)).toEqual([2, 4])
  })
  it('an empty text has no header and no rows', () => {
    expect(parseCsv('')).toEqual({ header: [], rows: [] })
  })
  it('csvLine quotes only what needs it, and round-trips', () => {
    const line = csvLine(['a', 'b, c', 'd "e"'])
    expect(line).toBe('a,"b, c","d ""e"""')
    expect(parseCsv(`X,Y,Z\n${line}`).rows[0]!.cells).toEqual(['a', 'b, c', 'd "e"'])
  })
})

describe('cells', () => {
  it('a blank optional number is not set and 0 is zero', () => {
    expect(parseOptionalNumber('')).toBeNull()
    expect(parseOptionalNumber(' ')).toBeNull()
    expect(parseOptionalNumber('0')).toBe(0)
    expect(parseOptionalNumber('0.0')).toBe(0)
    expect(parseOptionalNumber('-1')).toBe(-1)
    expect(parseOptionalNumber('$1,250.50')).toBe(1250.5)
    expect(parseOptionalNumber('ten')).toBeNaN()
  })
  it('dates are ISO or d/m/yyyy, real calendar dates only', () => {
    expect(parseDateCell('2026-12-25')).toBe('2026-12-25')
    expect(parseDateCell('25/12/2026')).toBe('2026-12-25')
    expect(parseDateCell('1/2/2027')).toBe('2027-02-01')
    expect(parseDateCell('31/02/2027')).toBeNull()
    expect(parseDateCell('2027-13-01')).toBeNull()
    expect(parseDateCell('Christmas')).toBeNull()
  })
  it('a list cell splits on ";"', () => {
    expect(parseListCell(' General surgery ; ;Urology ')).toEqual(['General surgery', 'Urology'])
  })
})

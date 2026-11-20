/**
 * The seed load's sheet check (catch-up Phase 42; US-13.4.3 AC1). Pure.
 *
 * A missing required column rejects the whole sheet and no row is valid. A
 * row with the wrong cell count is rejected. Otherwise each row is parsed by
 * its spec (a cell that is not a number or a date, a name that resolves to
 * nothing), checked for a duplicate key in the sheet ("Duplicate of row 4")
 * and against master data ("Already in master data: edit it there": a load
 * adds and never overwrites), and every reason is collected. A row with none
 * is then put through the master's own create rules by `tryCreate`, which the
 * store supplies as the master's planner folded over a working copy: so its
 * reason is word for word the manual refusal, and a row may name a record an
 * earlier row or sheet of the same load made.
 */

import type { ParsedCsv } from './csv'
import type { LoadContext, LoaderSpec, RowResult } from './types'

export const ALREADY_IN_MASTER = 'Already in master data: edit it there.'

/** What the check reads beside the sheet. */
export interface SheetCheckInput<F, M> {
  /** The masters as they stood before this sheet (for "already in master data"). */
  masters: M
  /** The working masters the row resolves names against (earlier rows and sheets included). */
  working: () => M
  ctx: LoadContext
  /** The master's own create rules over the working copy: null when made (and folded in), else its refusal. */
  tryCreate: (fields: F, rowNumber: number) => string | null
}

export interface SheetCheck<F> {
  headerErrors: string[]
  rows: RowResult<F>[]
}

export function validateSheet<F, M>(spec: LoaderSpec<F, M>, parsed: ParsedCsv, input: SheetCheckInput<F, M>): SheetCheck<F> {
  const headerErrors = spec.columns
    .filter((c) => c.required && !parsed.header.includes(c.header))
    .map((c) => `Missing column: ${c.header}`)
  const width = parsed.header.length
  const seen = new Map<string, number>()
  const rows: RowResult<F>[] = []
  for (const { rowNumber, cells } of parsed.rows) {
    const reject = (reasons: string[], key = ''): void => {
      rows.push({ rowNumber, cells, status: 'rejected', reasons, notes: [], key })
    }
    if (headerErrors.length > 0) {
      reject(['The sheet is missing a column, so no row is loaded.'])
      continue
    }
    if (cells.length !== width) {
      reject([`Row has ${cells.length} ${cells.length === 1 ? 'cell' : 'cells'}; the sheet has ${width} ${width === 1 ? 'column' : 'columns'}.`])
      continue
    }
    const byHeader: Record<string, string> = {}
    parsed.header.forEach((h, i) => {
      byHeader[h] = (cells[i] ?? '').trim()
    })
    const parsedRow = spec.parseRow(byHeader, input.working(), input.ctx)
    if ('reasons' in parsedRow) {
      reject(parsedRow.reasons)
      continue
    }
    const key = spec.keyOf(parsedRow.fields)
    const reasons: string[] = []
    const earlier = seen.get(key)
    if (earlier !== undefined) reasons.push(`Duplicate of row ${earlier}.`)
    else seen.set(key, rowNumber)
    if (spec.existing(parsedRow.fields, input.masters)) reasons.push(ALREADY_IN_MASTER)
    if (reasons.length === 0) {
      const refused = input.tryCreate(parsedRow.fields, rowNumber)
      if (refused !== null) reasons.push(refused)
    }
    if (reasons.length > 0) {
      reject(reasons, key)
      continue
    }
    rows.push({ rowNumber, cells, status: 'valid', reasons: [], notes: parsedRow.notes ?? [], key, fields: parsedRow.fields })
  }
  return { headerErrors, rows }
}

// ---------------------------------------------------------------------------
// Cells: the one helper per kind every spec uses
// ---------------------------------------------------------------------------

/**
 * An optional number cell. A row is the complete record, not a patch: a blank
 * cell is "not set" (null) and `0` is zero, which the master's own rule then
 * accepts or refuses. A cell that is not a number is NaN, which the spec
 * reports.
 */
export function parseOptionalNumber(cell: string): number | null {
  const t = cell.trim().replace(/^\$/, '').replace(/,/g, '')
  if (t === '') return null
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : Number.NaN
}

export const DATE_INVALID = 'Date must be a real date, for example 2026-12-25.'

/** A date cell as ISO: `YYYY-MM-DD` or `d/m/yyyy`, a real calendar date; anything else null. */
export function parseDateCell(cell: string): string | null {
  const t = cell.trim()
  let y: number, m: number, d: number
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  const nz = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t)
  if (iso !== null) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
  else if (nz !== null) [y, m, d] = [Number(nz[3]), Number(nz[2]), Number(nz[1])]
  else return null
  if (m < 1 || m > 12 || d < 1) return null
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]!
  if (d > days) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** A ";"-separated list cell, trimmed, blanks dropped, in order. */
export function parseListCell(cell: string): string[] {
  return cell
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s !== '')
}

/** A Yes or No cell; blank is the default given; anything else null. */
export function parseYesNo(cell: string, blank: boolean): boolean | null {
  const t = cell.trim().toLowerCase()
  if (t === '') return blank
  if (t === 'yes' || t === 'y' || t === 'true') return true
  if (t === 'no' || t === 'n' || t === 'false') return false
  return null
}

/** Names compared the way a person reads them: case, spacing and punctuation folded. */
export function foldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

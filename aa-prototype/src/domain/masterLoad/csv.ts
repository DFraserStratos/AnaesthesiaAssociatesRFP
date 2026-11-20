/**
 * CSV for the seed load (catch-up Phase 42; US-13.4.3). AA's controlled
 * spreadsheets are saved as CSV (no `.xlsx` parsing: logged), and the
 * template's headers are the contract. Handles quoted cells, embedded commas,
 * quotes and line breaks, CRLF, a leading BOM and blank trailing lines. Pure.
 */

export interface ParsedCsv {
  header: string[]
  /** `rowNumber` is the spreadsheet row, the header being row 1. */
  rows: { rowNumber: number; cells: string[] }[]
}

/** Split CSV text into records of cells (RFC 4180, lenient about a stray quote inside a bare cell). */
function records(text: string): string[][] {
  const out: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let i = 0
  while (i < text.length) {
    const ch = text[i]!
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        quoted = false
        i += 1
        continue
      }
      cell += ch
      i += 1
      continue
    }
    if (ch === '"' && cell === '') {
      quoted = true
      i += 1
      continue
    }
    if (ch === ',') {
      row.push(cell)
      cell = ''
      i += 1
      continue
    }
    if (ch === '\r' || ch === '\n') {
      row.push(cell)
      out.push(row)
      row = []
      cell = ''
      i += ch === '\r' && text[i + 1] === '\n' ? 2 : 1
      continue
    }
    cell += ch
    i += 1
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    out.push(row)
  }
  return out
}

const isBlankRecord = (r: string[]): boolean => r.every((c) => c.trim() === '')

/** Parse a sheet: its header (trimmed) and its data rows, blank rows dropped but counted. */
export function parseCsv(text: string): ParsedCsv {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const all = records(clean)
  if (all.length === 0) return { header: [], rows: [] }
  const header = all[0]!.map((h) => h.trim())
  const rows: ParsedCsv['rows'] = []
  for (let i = 1; i < all.length; i += 1) {
    if (isBlankRecord(all[i]!)) continue
    rows.push({ rowNumber: i + 1, cells: all[i]! })
  }
  return { header, rows }
}

/** One CSV line for a template or a sample (a cell with a comma, quote or line break is quoted). */
export function csvLine(cells: readonly string[]): string {
  return cells.map((c) => (/[",\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')
}

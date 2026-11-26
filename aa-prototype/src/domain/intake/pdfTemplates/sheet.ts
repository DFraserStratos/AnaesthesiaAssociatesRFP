/**
 * `sheet`: a Google Sheets surgery list exported to PDF, landscape A4, Arial, faint grey gridlines on every cell
 * (spacer rows included), the used range sitting at the top left of the page. Label and value cells for the surgeon,
 * anaesthetist, hospital, date and session; two empty rows; a bold heading row (Order, the run-on patient heading,
 * Procedure, Dual Procedure, Appointment Length, the SXAP and insurer approval columns); then one row per patient with
 * an empty row between. Cells are bottom-aligned and wrap. The rooms mark what changed in red: a changed patient's
 * report time and insurer, and a CANCELLED row after the list. The sheet prints no time per patient, only each
 * appointment's length, so the reader works each time out from the start (read as derived, on the length cell).
 */

import type { PdfTemplate } from './index'
import { PageBuilder, type PageLayout, type Run, type TextStyle } from './engine'
import { fmtDate, type DocRow, type PdfDoc } from './doc'

const INK = '#000'
const RED = '#FF0000'
const GRID = '#D9D9D9'
/** Column edges: Order, Patient, Procedure, Dual Procedure, Appointment Length, SXAP, Private Insurer. */
const C = [50.5, 124, 370.5, 545, 604.5, 658.5, 719, 793.5] as const
const TOP = 53.5
const PAD_X = 2.2
const PAD_B = 2.6
const BODY = 6.2
const LEAD = 7.6
const HEAD = 7.2
const HEAD_LEAD = 8.6
const ROW = 10.8
const SPACER = 9.4

const opt = (key: string | undefined) => (key !== undefined ? { key } : {})

/** "6.30am": the sheet's own way of writing a report time. */
function sheetTime(min: number): string {
  const h24 = Math.floor(min / 60) % 24
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h}.${String(min % 60).padStart(2, '0')}${h24 < 12 ? 'am' : 'pm'}`
}

/** A cell: its column, the runs it holds and their style. */
interface Cell {
  col: number
  runs: Run[]
  over?: Partial<TextStyle>
  leading?: number
}

/** One sheet row: its height and the cells drawn bottom-aligned in it. */
interface SheetRow {
  height: number
  cells: Cell[]
}

const cellWidth = (col: number) => C[col + 1]! - C[col]! - PAD_X * 2

function heightOf(b: PageBuilder, cells: Cell[], min: number): number {
  const lines = cells.map((c) => b.lineCount(cellWidth(c.col), c.runs, c.over) * (c.leading ?? LEAD))
  return Math.max(min, ...lines.map((h) => h + 2.4))
}

function headerRows(doc: PdfDoc): SheetRow[] {
  const s = { size: HEAD, bold: true }
  const pair = (label: string, value: string, key: string | undefined): SheetRow => ({
    height: ROW,
    cells: [
      { col: 1, runs: [{ text: label }], over: s },
      { col: 2, runs: value !== '' ? [{ text: value, ...opt(key) }] : [], over: s },
    ],
  })
  const rows = [pair('Surgeon :', doc.surgeonName, doc.headerKey('surgeon'))]
  rows.push(pair('Anaesthetist :', doc.anaesthetistName ?? '', doc.anaesthetistName !== undefined ? doc.headerKey('anaesthetist') : undefined))
  rows.push(pair('Hospital :', doc.hospitalName, doc.headerKey('hospital')))
  rows.push(pair('Date :', fmtDate(doc.dateISO, 'dd/MM/yyyy'), doc.headerKey('date')))
  rows.push(pair('Session :', doc.session, doc.headerKey('session')))
  rows.push({ height: ROW, cells: [] }, { height: ROW, cells: [] })
  return rows
}

function headingRow(b: PageBuilder): SheetRow {
  const s = { size: HEAD, bold: true }
  const cells: Cell[] = [
    'Order',
    'Patient Name: NHI: Dob: Email: Address: Mobile:',
    'Procedure',
    'Dual Procedure',
    'Appointment Length',
    'SXAP Approval and Application No:',
    'Private Insurer Approval Number',
  ].map((text, col) => ({ col, runs: [{ text }], over: s, leading: HEAD_LEAD }))
  return { height: heightOf(b, cells, 30), cells }
}

function patientRow(b: PageBuilder, doc: PdfDoc, row: DocRow): SheetRow {
  const s = { size: BODY }
  const red = row.changed ? { fill: RED } : {}
  const stay = row.p.dayStay ? 'Day Stay' : 'One Night Stay'
  const order: Cell = row.changed
    ? { col: 0, runs: [{ text: `Change to Report Time: ${sheetTime(row.reportMin)} ${stay}` }], over: { ...s, bold: true, fill: RED } }
    : { col: 0, runs: [{ text: `Report Time: ${sheetTime(row.reportMin)}\n${stay}` }], over: { ...s, bold: true } }
  const p = row.p
  const patient: Cell = {
    col: 1,
    over: s,
    runs: [
      { text: `${row.order}. `, style: { bold: true, ...red } },
      { text: row.name, style: { bold: true, ...red }, ...opt(doc.key(row.id, 'name')) },
      { text: ':', style: { bold: true, ...red } },
      { text: ' NHI: ' },
      ...(row.nhi !== undefined ? [{ text: row.nhi, ...opt(doc.key(row.id, 'nhi')) }] : []),
      { text: ' Dob: ' },
      ...(row.dobISO !== undefined ? [{ text: fmtDate(row.dobISO, 'dd/MM/yyyy'), ...opt(doc.key(row.id, 'dobISO')) }] : []),
      { text: ` Email: ${p.email} Address: ${p.street}, ${p.suburb}, ${p.city} ${p.postcode} Mobile: ${p.mobile.replace(/ /g, '')}` },
    ],
  }
  const procedure: Cell = { col: 2, over: s, runs: [{ text: 'Core: ', style: { bold: true } }, { text: row.procedureText, ...opt(doc.key(row.id, 'procedureText')), breakable: true }] }
  const length: Cell = { col: 4, over: s, runs: [{ text: `${row.durationMin} minutes`, ...opt(doc.key(row.id, 'scheduledTime')), derived: true }] }
  const f = p.funder
  const cells: Cell[] = [order, patient, procedure, { col: 3, over: s, runs: [{ text: 'N/A' }] }, length]
  if (f.kind === 'insurer' && f.short === 'Southern Cross') cells.push({ col: 5, over: s, runs: [{ text: `Southern Cross\n${f.approval ?? ''}` }] })
  else if (f.kind === 'insurer') cells.push({ col: 6, over: row.changed ? { ...s, bold: true, fill: RED } : s, runs: [{ text: `${f.short} Insurance ${f.approval ?? ''}` }] })
  else if (f.kind === 'acc') cells.push({ col: 6, over: s, runs: [{ text: `ACC ${f.approval ?? ''}` }] })
  return { height: heightOf(b, cells, ROW), cells }
}

/** A row the rooms struck off on a re-send: red CANCELLED, the name in red, nothing read. */
function cancelledRow(b: PageBuilder, row: DocRow): SheetRow {
  const s = { size: BODY }
  const p = row.p
  const cells: Cell[] = [
    { col: 0, over: { ...s, bold: true, fill: RED }, runs: [{ text: 'CANCELLED' }] },
    {
      col: 1,
      over: s,
      runs: [
        { text: `${row.name}:`, style: { bold: true, fill: RED } },
        { text: ` NHI: ${row.nhi ?? ''} Dob: ${row.dobISO !== undefined ? fmtDate(row.dobISO, 'dd/MM/yyyy') : ''} Email: ${p.email} Address: ${p.street}, ${p.suburb} ${p.postcode} Mobile: ${p.mobile.replace(/ /g, '')}` },
      ],
    },
    { col: 2, over: s, runs: [{ text: 'Core: ', style: { bold: true } }, { text: row.procedureText }] },
    { col: 3, over: s, runs: [{ text: 'N/A' }] },
    { col: 4, over: s, runs: [{ text: `${row.durationMin} minutes` }] },
  ]
  if (p.funder.kind === 'insurer') cells.push({ col: 6, over: { ...s, fill: RED }, runs: [{ text: `${p.funder.short} declined` }] })
  return { height: heightOf(b, cells, ROW), cells }
}

/** Draws the rows from the top with a gridline round every cell; returns nothing (the page is done). */
function drawSheet(b: PageBuilder, rows: SheetRow[]): void {
  let y = TOP
  const edges = [y]
  for (const r of rows) {
    const bottom = y + r.height
    for (const c of r.cells) {
      if (c.runs.length === 0) continue
      const leading = c.leading ?? LEAD
      const n = b.lineCount(cellWidth(c.col), c.runs, c.over)
      b.flow(C[c.col]! + PAD_X, bottom - PAD_B - (n - 1) * leading, cellWidth(c.col), c.runs, { over: c.over, leading })
    }
    y = bottom
    edges.push(y)
  }
  for (const e of edges) b.line(C[0], e, C[C.length - 1]!, e, GRID, 0.5)
  for (const x of C) b.line(x, TOP, x, y, GRID, 0.5)
}

export const sheet: PdfTemplate = {
  id: 'sheet',
  name: 'Spreadsheet export',
  format: () => ({ paper: 'a4', orientation: 'landscape' }),
  layout(doc, size): PageLayout[] {
    const pages: PageLayout[] = []
    const fresh = () => new PageBuilder(size.width, size.height, { size: BODY, font: 'arial', fill: INK })
    const bottom = size.height - 42
    let b = fresh()
    let rows: SheetRow[] = [...headerRows(doc), headingRow(b)]
    let used = rows.reduce((h, r) => h + r.height, TOP)
    let onPage = 0
    // The cancelled rows ride with the last patient, so the last page always holds a patient.
    const struck = doc.cancelled.map((row) => cancelledRow(b, row))
    const tail = struck.reduce((h, r) => h + SPACER + r.height, 0)
    const place = (row: SheetRow, after = 0) => {
      if (used + SPACER + row.height + after > bottom && onPage > 0) {
        drawSheet(b, rows)
        pages.push(b.page())
        b = fresh()
        rows = [headingRow(b)]
        used = rows.reduce((h, r) => h + r.height, TOP)
        onPage = 0
      }
      rows.push({ height: SPACER, cells: [] }, row)
      used += SPACER + row.height
      onPage += 1
    }
    doc.rows.forEach((row, i) => place(patientRow(b, doc, row), i === doc.rows.length - 1 ? tail : 0))
    for (const row of struck) {
      rows.push({ height: SPACER, cells: [] }, row)
      used += SPACER + row.height
    }
    drawSheet(b, rows)
    pages.push(b.page())
    return pages
  },
}

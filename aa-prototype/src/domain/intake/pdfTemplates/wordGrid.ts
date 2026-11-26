/**
 * `wordGrid`: a theatre list typed up in Word as one big table, saved to PDF. Landscape A4, Calibri. A small
 * "Checked by / Date / Time" page header at the top right; a bold date line (superscript ordinal, the session after
 * it), the hospital, the surgeon on the left and the anaesthetist on the right; then a full black single-line grid
 * whose bold, light grey heading row repeats on every page, its body cells centred in tall rows, about six to a page.
 * A bare page number sits bottom left. The rooms added a Time column first, so each patient's time is printed and read.
 *
 * The `logo` variant is another practice's Word template: its logo (a round mark and the practice's name as a
 * wordmark) at the top left on every page, a "Theatre List" title, a two-column key and value table (Date, Time,
 * Surgeon, Anaesthetist, Hospital) in light grey rules, and the patient grid ruled in light grey with no outer sides.
 */

import type { PdfTemplate } from './index'
import { PageBuilder, type PageLayout, type Run, type TextStyle } from './engine'
import { clock12, fmtDate, ordinal, type DocRow, type PdfDoc } from './doc'

const INK = '#000'
const LINK = '#0563C1'
const HEAD_FILL = '#E7E6E6'
const GREY_RULE = '#BFBFBF'
const BODY = 9
const LEAD = 12.2
const PAD = 5
const TABLE_LEFT = 29
const TABLE_RIGHT = 814
const BOTTOM = 549

const opt = (key: string | undefined) => (key !== undefined ? { key } : {})

/** The columns: heading lines and width (they sum to the table's width). */
const COLUMNS: readonly { head: string; width: number }[] = [
  { head: 'Time', width: 44 },
  { head: 'Payment\n/insurer', width: 84 },
  { head: 'Patient\nName', width: 98 },
  { head: 'DOB', width: 58 },
  { head: 'NHI', width: 54 },
  { head: 'Telephone\nCell phone\nplease', width: 70 },
  { head: 'Address & email contact', width: 150 },
  { head: 'Alert\nAllergies', width: 62 },
  { head: 'Operation', width: 100 },
  { head: 'Anaesthetic\ntype', width: 65 },
]
const EDGES = COLUMNS.reduce<number[]>((xs, c) => [...xs, xs[xs.length - 1]! + c.width], [TABLE_LEFT])

const sessionWord = (doc: PdfDoc) => (doc.session === 'OOH' ? 'After hours' : doc.session)

/** "8.00am": the time a Word list prints. */
const wordTime = (min: number) => clock12(min, { space: false }).replace(':', '.')

function payment(row: DocRow): string {
  const f = row.p.funder
  if (f.kind === 'acc') return 'ACC'
  if (f.kind === 'self') return 'Self funding'
  if (f.kind === 'public') return 'HNZ'
  const short = f.short === 'Southern Cross' ? 'SX' : f.short === 'nib' ? 'NIB' : f.short
  const approval = f.approval ?? ''
  const pending = approval === '' || Number(approval.slice(-1)) % 3 === 0
  return `${short} Pre-approval # ${pending ? 'to come' : approval}`
}

const allergy = (row: DocRow) => (/^(NKDA|Nil known|Nil)$/i.test(row.p.allergies) ? 'N/A' : row.p.allergies)
const anaesType = (row: DocRow) => (row.p.anaesthetic.startsWith('LA') ? 'LA' : 'GA')

/** A row's cells as runs, column by column. */
function cells(doc: PdfDoc, row: DocRow): Run[][] {
  const k = (f: Parameters<PdfDoc['key']>[1]) => opt(doc.key(row.id, f))
  return [
    [{ text: wordTime(row.startMin), ...k('scheduledTime') }],
    [{ text: payment(row) }],
    [{ text: row.name, ...k('name'), breakable: true }],
    [{ text: row.dobISO !== undefined ? fmtDate(row.dobISO, 'dd/MM/yyyy') : '', ...k('dobISO') }],
    [{ text: row.nhi ?? '', ...k('nhi') }],
    [{ text: row.p.mobile.replace(/ /g, '') }],
    [{ text: `${row.p.street}, ${row.p.city === row.p.suburb ? row.p.city : `${row.p.suburb}, ${row.p.city}`}` }, { text: '\n' }, { text: row.p.email, style: { fill: LINK, underline: true } }],
    [{ text: allergy(row) }],
    [{ text: row.procedureText, ...k('procedureText'), breakable: true }],
    [{ text: anaesType(row) }],
  ]
}

/** The lines a row's tallest cell takes. */
function rowLines(b: PageBuilder, cs: readonly Run[][]): number {
  return Math.max(...cs.map((c, i) => (c.every((r) => r.text === '') ? 1 : b.lineCount(COLUMNS[i]!.width - 2 * PAD, c))))
}

const rowHeight = (lines: number) => Math.max(61, lines * LEAD + 24)
const HEAD_HEIGHT = 41

interface Look {
  logo: boolean
  rule: string
}

/** The heading row at `top`; returns its bottom. */
function headRow(b: PageBuilder, look: Look, top: number): number {
  if (!look.logo) b.rect(TABLE_LEFT, top, TABLE_RIGHT - TABLE_LEFT, HEAD_HEIGHT, { fill: HEAD_FILL })
  const h: Partial<TextStyle> = { size: BODY + 0.5, bold: true }
  COLUMNS.forEach((c, i) => {
    const lines = c.head.split('\n')
    lines.forEach((line, j) => {
      if (look.logo) b.text(EDGES[i]! + c.width / 2, top + 13 + j * 12, line, h, { anchor: 'middle' })
      else b.text(EDGES[i]! + PAD, top + 13 + j * 12.5, line, h)
    })
  })
  return top + HEAD_HEIGHT
}

function bodyRow(b: PageBuilder, cs: readonly Run[][], top: number): void {
  cs.forEach((c, i) => {
    if (c.every((r) => r.text === '')) return
    b.flow(EDGES[i]! + PAD, top + 17, COLUMNS[i]!.width - 2 * PAD, c, { leading: LEAD, align: 'middle' })
  })
}

/** The grid's rules: a line at each row edge, a column rule from the table's top to its bottom. */
function grid(b: PageBuilder, look: Look, rows: readonly number[]): void {
  const top = rows[0]!
  const bottom = rows[rows.length - 1]!
  const w = 0.75
  for (const y of rows) b.line(TABLE_LEFT, y, TABLE_RIGHT, y, look.rule, w)
  EDGES.forEach((x, i) => {
    if (look.logo && (i === 0 || i === EDGES.length - 1)) return
    b.line(x, top, x, bottom, look.rule, w)
  })
}

/** The plain Word list's top: the page header, and on page 1 the date, hospital, surgeon and anaesthetist. */
function plainHeader(b: PageBuilder, doc: PdfDoc, first: boolean): number {
  const small = { size: 7 }
  b.text(609, 33, 'Checked by:', small)
  b.text(683, 33, 'Date:', small)
  b.text(741, 33, 'Time:', small)
  if (!first) return 52
  const big: Partial<TextStyle> = { size: 12.5, bold: true }
  const date = doc.headerKey('date')
  const day = Number(fmtDate(doc.dateISO, 'd'))
  b.runs(36, 52, [
    { text: 'Date: ' },
    { text: `${fmtDate(doc.dateISO, 'EEEE')} ${day}`, ...opt(date) },
    { text: ordinal(day), style: { size: 8.2, rise: 4.6 }, ...opt(date) },
    { text: ` ${fmtDate(doc.dateISO, 'MMMM yyyy')}`, ...opt(date) },
    { text: '  -  ' },
    { text: sessionWord(doc), ...opt(doc.headerKey('session')) },
  ], big)
  b.runs(36, 72, [{ text: 'Hospital: ' }, { text: doc.hospitalName, ...opt(doc.headerKey('hospital')) }], big)
  b.runs(36, 92, [{ text: 'Surgeon: ' }, { text: doc.surgeonName, ...opt(doc.headerKey('surgeon')) }], big)
  if (doc.anaesthetistName !== undefined) b.runs(445, 92, [{ text: 'Anaesthetist: ' }, { text: doc.anaesthetistName, ...opt(doc.headerKey('anaesthetist')) }], big)
  else b.text(445, 92, 'Anaesthetist:', big)
  return 116
}

/** The practice's logo: a round mark with three white petals, and its name as a wordmark beside it. */
function logo(b: PageBuilder, doc: PdfDoc): void {
  const cx = 66
  const cy = 58
  const r = 29
  const rose = '#C9969E'
  const petal = (rot: number) =>
    `<path d="M ${cx} ${cy + 16} C ${cx - 11} ${cy + 4}, ${cx - 8} ${cy - 10}, ${cx} ${cy - 17} C ${cx + 8} ${cy - 10}, ${cx + 11} ${cy + 4}, ${cx} ${cy + 16} Z" fill="#fff" transform="rotate(${rot} ${cx} ${cy + 16})"/>`
  b.raw(
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${rose}"/>${petal(-48)}${petal(48)}${petal(0)}` +
      `<path d="M ${cx - 22} ${cy + 18} Q ${cx} ${cy + 26} ${cx + 22} ${cy + 18}" stroke="#fff" stroke-width="2.2" fill="none"/>`,
  )
  const words = doc.practice.split(/\s+/)
  const lead = words[0] ?? ''
  const rest = words.slice(1).join(' ')
  const base: Partial<TextStyle> = { size: 30, fill: '#7FC4BD', font: 'calibri' }
  const room = 470 - 106
  const total = b.measure(lead, { ...base, bold: true }) + b.measure(rest === '' ? '' : ` ${rest}`, base)
  const size = total > room ? Math.floor((30 * room) / total * 10) / 10 : 30
  b.runs(106, 72, [{ text: lead, style: { bold: true } }, ...(rest !== '' ? [{ text: ` ${rest}` }] : [])], { ...base, size })
}

/** The logo variant's top: the logo on every page, the title and key and value table on page 1. */
function logoHeader(b: PageBuilder, doc: PdfDoc, first: boolean): number {
  logo(b, doc)
  if (!first) return 108
  b.text(36, 105, 'Theatre List', { size: 13, bold: true })
  const rows: [string, string, string | undefined][] = [
    ['Date', fmtDate(doc.dateISO, 'EEEE, d MMMM yyyy'), doc.headerKey('date')],
    ['Time', `${sessionWord(doc)}  ${wordTime(doc.startMin)} - ${wordTime(doc.endMin)}`, doc.headerKey('session')],
    ['Surgeon', doc.surgeonName, doc.headerKey('surgeon')],
    ['Anaesthetist', doc.anaesthetistName ?? '', doc.headerKey('anaesthetist')],
    ['Hospital', doc.hospitalName, doc.headerKey('hospital')],
  ]
  const top = 116
  const h = 18.6
  rows.forEach(([label, value, key], i) => {
    const y = top + i * h
    b.text(41, y + 13, label, { size: BODY })
    b.text(112, y + 13, value, { size: BODY }, opt(key))
    if (i < rows.length - 1) b.line(36, y + h, 426, y + h, GREY_RULE, 0.6)
  })
  b.line(106, top, 106, top + rows.length * h, GREY_RULE, 0.6)
  return top + rows.length * h + 22
}

function footer(b: PageBuilder, page: number): void {
  b.text(36, 563, String(page), { size: BODY })
}

export const wordGrid: PdfTemplate = {
  id: 'wordGrid',
  name: 'Word table',
  format: () => ({ paper: 'a4', orientation: 'landscape' }),
  layout(doc, size): PageLayout[] {
    const look: Look = doc.variant === 'logo' ? { logo: true, rule: GREY_RULE } : { logo: false, rule: INK }
    const pages: PageLayout[] = []
    const fresh = () => new PageBuilder(size.width, size.height, { size: BODY, font: 'calibri', fill: INK })
    let b = fresh()
    let edges: number[] = []
    let y = 0
    const start = (first: boolean) => {
      const top = look.logo ? logoHeader(b, doc, first) : plainHeader(b, doc, first)
      edges = [top]
      y = headRow(b, look, top)
      edges.push(y)
    }
    const finish = () => {
      grid(b, look, edges)
      footer(b, pages.length + 1)
      pages.push(b.page())
    }
    start(true)
    for (const row of doc.rows) {
      const cs = cells(doc, row)
      const h = rowHeight(rowLines(b, cs))
      if (y + h > BOTTOM && edges.length > 2) {
        finish()
        b = fresh()
        start(false)
      }
      bodyRow(b, cs, y)
      y += h
      edges.push(y)
    }
    finish()
    return pages
  },
}

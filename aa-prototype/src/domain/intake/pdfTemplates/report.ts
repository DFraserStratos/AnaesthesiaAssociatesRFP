/**
 * `report`: a practice database's report (an Access-style "Operation List"), portrait A4, Calibri, grey labels and
 * bold values. A square lime logo mark with the practice's initials and a large grey title with the date; a light
 * grey band holding the surgeon, anaesthetist, the session's start time and the hospital; then one block per patient
 * (the name underlined, the procedure in bold with its minutes, two columns of labelled details, notes and allergies
 * at the right, "SXAP" large when Southern Cross funds it), a grey rule between patients; a footer with a dictation
 * line, the printed date, the surgeon and "Page n of N". The report prints only each patient's minutes, so the
 * reader works each time out from the start (read as derived, on the minutes).
 *
 * The `letter` variant is a practice's booking form on landscape US letter, Arial: a centred bold title naming the
 * practice, the hospital under it, a SURGEON / ANAESTHETIST / DATE row with the session after the date, then a boxed
 * grid of nine columns with double rules between rows (time and duration, patient and NHI, DOB and age, phone and
 * address, procedure, side, comments, admission, contract), its right edge running past the page edge; a boxed
 * footer for the hospital's approval with the page count. It prints each patient's time, read as printed.
 */

import type { PdfTemplate } from './index'
import { PageBuilder, type PageLayout, type Run } from './engine'
import { clock12, fmtDate, type DocRow, type PdfDoc } from './doc'

const opt = (key: string | undefined) => (key !== undefined ? { key } : {})

// ---------------------------------------------------------------------------
// The report (portrait A4)
// ---------------------------------------------------------------------------

const GREY = '#7F7F7F'
const LABEL = '#808080'
const VALUE = '#262626'
const LIME = '#8DC63F'
const BAND = '#EDEDED'
const RULE = '#7F7F7F'
const L = 20
const R = 559
const SIZE = 10
const ROW = 18.7
const VAL_X = 68
const NOTES_X = 244.6
const PROC_LEADING = 15

/** The practice's initials for its logo mark ("Fendalton Specialist Rooms" -> "fs"). */
function initials(practice: string): string {
  const words = practice.split(/\s+/).filter((w) => w !== '' && !/^(the|and|&|of|ltd|limited)$/i.test(w))
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toLowerCase())
    .join('')
}

function reportHeader(b: PageBuilder, doc: PdfDoc, first: boolean): void {
  const k = (key: string | undefined) => (first ? key : undefined)
  // The logo mark: a lime square with the initials in white.
  b.rect(44.6, 21.6, 41.5, 41.5, { fill: LIME })
  b.text(44.6 + 41.5 / 2, 54, initials(doc.practice), { size: 30, bold: true, fill: '#FFFFFF', letterSpacing: -0.5 }, { anchor: 'middle' })
  const title = { size: 24, fill: GREY }
  const end = b.text(105.8, 51, 'Operation List -  ', title)
  b.text(end, 51, fmtDate(doc.dateISO, 'd MMM yyyy'), title, opt(k(doc.headerKey('date'))))
  // The grey band.
  b.rect(18, 63.5, R + 3 - 18, 74, { fill: BAND })
  const rows: [string, string, string | undefined][] = [
    ['Surgeon:', doc.surgeonName, doc.headerKey('surgeon')],
    ['Anaesthetist:', doc.anaesthetistName ?? '', doc.headerKey('anaesthetist')],
    ['Start Time:', clock12(doc.startMin), doc.headerKey('session')],
    ['Hospital:', doc.hospitalName, doc.headerKey('hospital')],
  ]
  rows.forEach(([label, value, key], i) => {
    const y = 76.3 + i * ROW
    b.text(L, y, label, { size: SIZE, fill: LABEL })
    b.text(103, y, value, { size: SIZE, bold: true, fill: VALUE }, opt(k(key)))
  })
}

function phoneOf(s: string): string {
  return s.replace(/\s+/g, '')
}

function addressLines(row: DocRow): string[] {
  const p = row.p
  return p.suburb === p.city ? [p.street, `${p.city}  ${p.postcode}`] : [p.street, p.suburb, `${p.city}  ${p.postcode}`]
}

function notesOf(row: DocRow): string {
  if (row.p.dayStay) return 'Day Stay'
  const n = Number(/x (\d+)/.exec(row.p.admission)?.[1] ?? '1')
  return n === 1 ? '1 night' : `${n} nights`
}

const isSxap = (row: DocRow) => row.p.funder.short === 'Southern Cross'

/** A patient's block from the name's baseline; returns the y of the rule under it. */
function reportPatient(b: PageBuilder, doc: PdfDoc, row: DocRow, top: number): number {
  const lab = { size: SIZE, fill: LABEL }
  const val = { size: SIZE, fill: VALUE }
  b.text(L, top, 'Name:', lab)
  b.text(VAL_X, top, row.name, { size: SIZE, bold: true, underline: true, fill: VALUE }, opt(doc.key(row.id, 'name')))
  const runs: Run[] = [
    { text: row.procedureText, ...opt(doc.key(row.id, 'procedureText')), breakable: true },
    { text: ' - ' },
    { text: `${row.durationMin} mins`, ...opt(doc.key(row.id, 'scheduledTime')), derived: true },
  ]
  const proc = b.flow(L, top + 18, 455, runs, { over: { size: SIZE, bold: true, fill: VALUE }, leading: PROC_LEADING })
  if (isSxap(row)) b.text(540, top + 30, 'SXAP', { size: 22, fill: GREY }, { anchor: 'end' })
  let y = Math.max(top + 55.5, proc.baseline + 37.5)
  const f = row.p.funder
  const left: [string, string[], string | undefined][] = [
    ['DOB:', [row.dobISO !== undefined ? fmtDate(row.dobISO, 'd/MM/yyyy') : ''], doc.key(row.id, 'dobISO')],
    ['NHI:', [row.nhi ?? ''], doc.key(row.id, 'nhi')],
    ['Phone:', [phoneOf(row.p.home ?? row.p.mobile)], undefined],
    ['Mobile:', [phoneOf(row.p.mobile)], undefined],
    ['ACC #:', [f.kind === 'acc' ? (f.approval ?? '') : ''], undefined],
    ['Address:', addressLines(row), undefined],
    ['SXAP:', [isSxap(row) ? 'Yes' : 'No'], undefined],
  ]
  const first = y
  for (const [label, values, key] of left) {
    b.text(L, y, label, lab)
    values.forEach((v, i) => {
      b.text(VAL_X, y, v, val, i === 0 ? opt(key) : {})
      if (i < values.length - 1) y += ROW
    })
    y += ROW
  }
  // Notes and allergies at the right.
  b.text(NOTES_X, first, 'Notes:', { ...lab, italic: true })
  b.text(NOTES_X, first + ROW, notesOf(row), val)
  b.text(NOTES_X, first + 4 * ROW, 'Allergies:', { ...lab, italic: true })
  const allergies = /^(NKDA|Nil known)$/i.test(row.p.allergies) ? '' : row.p.allergies.toLowerCase()
  if (allergies !== '') b.flow(NOTES_X, first + 5 * ROW, R - NOTES_X - 20, [{ text: allergies }], { over: val, leading: ROW })
  return y - ROW + 18.6
}

function reportFooter(b: PageBuilder, doc: PdfDoc, page: number, pages: number): void {
  const s = { size: SIZE, bold: true, fill: '#000' }
  b.text(L, 795, 'Phone Dictation 0800 555 0142', s)
  b.text(R - 2, 795, 'Press 31 to mark as Priority, #1 to end job', s, { anchor: 'end' })
  b.text(L, 812, `Printed on: ${fmtDate(doc.printed.dateISO, 'dd-MMM-yy')}`, s)
  b.text(b.width / 2, 812, doc.surgeonName, s, { anchor: 'middle' })
  b.text(R - 2, 812, `Page ${page} of ${pages}`, s, { anchor: 'end' })
}

function reportLayout(doc: PdfDoc, size: { width: number; height: number }): PageLayout[] {
  const fresh = (first: boolean) => {
    const b = new PageBuilder(size.width, size.height, { size: SIZE, font: 'calibri', fill: VALUE })
    reportHeader(b, doc, first)
    return b
  }
  const START = 151
  const BOTTOM = 772
  const builders: PageBuilder[] = []
  let b = fresh(true)
  let y = START
  for (const row of doc.rows) {
    // Measure the block on a scratch page first: a patient never splits across pages.
    const scratch = new PageBuilder(size.width, size.height, b.base)
    const height = reportPatient(scratch, doc, row, y) - y
    if (y + height > BOTTOM && y > START) {
      builders.push(b)
      b = fresh(false)
      y = START
    }
    const ruleY = reportPatient(b, doc, row, y)
    b.line(18, ruleY, R, ruleY, RULE, 0.75)
    y = ruleY + 18.5
  }
  builders.push(b)
  builders.forEach((pb, i) => reportFooter(pb, doc, i + 1, builders.length))
  return builders.map((pb) => pb.page())
}

// ---------------------------------------------------------------------------
// The `letter` variant: a booking form on landscape US letter
// ---------------------------------------------------------------------------

const INK = '#000'
const COLS = [26.6, 112.3, 198, 282.2, 366.4, 452.8, 537.8, 623.4, 708.4, 800]
const HEADINGS: string[][] = [
  ['Procedure Time &', 'Duration'],
  ['Patient Name/NHI'],
  ['DOB/Age'],
  ['Phone/Address'],
  ['Procedure'],
  ['Procedure Side'],
  ['Procedure', 'Comments'],
  ['Admission Type &', 'Length of Stay'],
  ['Contract'],
]
const CELL = 8
const LEAD = 9.4
const PAD = 3
const GRID_TOP = 88.5
const HEAD_BOTTOM = 128
const GRID_BOTTOM = 524

function letterHeader(b: PageBuilder, doc: PdfDoc, first: boolean): void {
  const k = (key: string | undefined) => (first ? key : undefined)
  b.text(384, 31.7, `${doc.practice.toUpperCase()} BOOKING  FORM  FOR`, { size: 16.5, bold: true }, { anchor: 'middle' })
  b.text(380, 55.4, doc.hospitalName, { size: 16 }, { anchor: 'middle', ...opt(k(doc.headerKey('hospital'))) })
  const lab = { size: 10, bold: true }
  const val = { size: 10 }
  let x = b.text(31, 74, 'SURGEON: ', lab)
  b.text(x, 74, doc.surgeonName, val, opt(k(doc.headerKey('surgeon'))))
  x = b.text(295, 74, 'ANAESTHETIST: ', lab)
  b.text(x, 74, doc.anaesthetistName ?? '', val, opt(k(doc.headerKey('anaesthetist'))))
  x = b.text(625, 74, 'DATE: ', lab)
  b.runs(x, 75, [
    { text: fmtDate(doc.dateISO, 'd MMM yyyy'), ...opt(k(doc.headerKey('date'))) },
    { text: '  ' },
    { text: doc.session, ...opt(k(doc.headerKey('session'))) },
  ], val)
  // The heading row.
  b.line(COLS[0]!, GRID_TOP, COLS[COLS.length - 1]!, GRID_TOP, INK, 1)
  HEADINGS.forEach((lines, i) => lines.forEach((t, j) => b.text(COLS[i]! + PAD, 102 + j * 11, t, { size: 9, bold: true })))
  b.line(COLS[0]!, HEAD_BOTTOM, COLS[COLS.length - 1]!, HEAD_BOTTOM, INK, 1)
}

function cellsOf(doc: PdfDoc, row: DocRow): Run[][] {
  const p = row.p
  const f = p.funder
  const nights = Number(/x (\d+)/.exec(p.admission)?.[1] ?? '0')
  const phones = [`MPh-${p.mobile}`, ...(p.home !== undefined ? [`HPh-${p.home}`] : [])]
  const address = p.suburb === p.city ? [p.street, p.city, p.postcode] : [p.street, p.suburb, p.postcode]
  const comments = [
    ...(f.kind === 'acc' ? ['ACC'] : []),
    p.anaesthetic,
    p.dayStay ? 'Daystay' : 'Inpatient',
    ...(/^(NKDA|Nil known)$/i.test(p.allergies) ? [] : [`Allergy ${p.allergies}`]),
  ].join(', ')
  const contract =
    f.kind === 'acc' ? 'ACC contract case' : f.kind === 'insurer' ? `${f.short} Insurance` : f.kind === 'self' ? 'Self funded' : 'Health NZ contract'
  const line = (t: string): Run[] => [{ text: t }, { text: '\n' }]
  return [
    [{ text: clock12(row.startMin, { pad: true, upper: true }), ...opt(doc.key(row.id, 'scheduledTime')) }, { text: '\n' }, { text: `${row.durationMin}Min` }],
    [], // the patient cell is drawn on its own (the NHI sits a line clear of the name)
    [{ text: row.dobISO !== undefined ? fmtDate(row.dobISO, 'dd/MM/yyyy') : '', ...opt(doc.key(row.id, 'dobISO')) }, { text: '\n' }, { text: row.age !== undefined ? `${row.age} yrs` : '' }],
    [...address.flatMap(line), ...phones.flatMap(line)].slice(0, -1),
    [{ text: row.procedureText, ...opt(doc.key(row.id, 'procedureText')), breakable: true }],
    [{ text: p.side ?? '' }],
    [{ text: comments }],
    [{ text: `${p.dayStay ? 'Daystay' : 'Inpatient'}-${p.anaesthetic.split(/[ /]/)[0]}` }, { text: '\n' }, { text: `${p.dayStay ? 0 : nights}days` }],
    [{ text: contract }],
  ]
}

/** One booking row from its top rule; returns the y of its bottom (the first of the double rule). */
function letterRow(b: PageBuilder, doc: PdfDoc, row: DocRow, top: number): number {
  const s = { size: CELL }
  const base = top + 13.8
  let lines = 1
  cellsOf(doc, row).forEach((runs, i) => {
    if (runs.length === 0) return
    const r = b.flow(COLS[i]! + PAD, base, COLS[i + 1]! - COLS[i]! - 2 * PAD, runs, { over: s, leading: LEAD })
    lines = Math.max(lines, r.lines)
  })
  // The patient: title and name (wrapping in the cell), the NHI on the line below, clear of the name's box.
  const title = row.p.title !== undefined ? (row.p.title === 'Miss' ? 'Mis' : row.p.title) : ''
  const name = b.flow(COLS[1]! + PAD, base, COLS[2]! - COLS[1]! - 2 * PAD - 1, [...(title !== '' ? [{ text: `${title} ` }] : []), { text: row.name, ...opt(doc.key(row.id, 'name')), breakable: true }], {
    over: s,
    leading: LEAD,
  })
  const nhiBase = name.baseline + 12.8
  if (row.nhi !== undefined) b.text(COLS[1]! + PAD, nhiBase, row.nhi, s, opt(doc.key(row.id, 'nhi')))
  const last = Math.max(base + (lines - 1) * LEAD, row.nhi !== undefined ? nhiBase : name.baseline)
  return Math.max(top + 48, last + 6)
}

function letterFrame(b: PageBuilder, rowLines: number[], bottom: number): void {
  // Column rules from the grid's top to its bottom; a double rule under each row.
  for (const x of COLS) b.line(x, GRID_TOP, x, bottom, INK, x === COLS[0] ? 1.2 : 1)
  for (const y of rowLines) {
    b.line(COLS[0]!, y, COLS[COLS.length - 1]!, y, INK, 0.9)
    b.line(COLS[0]!, y + 2.6, COLS[COLS.length - 1]!, y + 2.6, INK, 0.9)
  }
}

function letterFooter(b: PageBuilder, doc: PdfDoc, page: number, pages: number): void {
  b.rect(25.2, 531, 800 - 25.2, 46, { stroke: INK, strokeWidth: 0.9 })
  b.text(32, 547, doc.hospitalName, { size: 10 })
  b.text(29, 560, 'Approved:', { size: 10 })
  b.text(29, 572, 'Date Approved:', { size: 10 })
  b.text(781, 572, `Page ${page} of ${pages}`, { size: 10 }, { anchor: 'end' })
}

function letterLayout(doc: PdfDoc, size: { width: number; height: number }): PageLayout[] {
  const fresh = (first: boolean) => {
    const b = new PageBuilder(size.width, size.height, { size: CELL, font: 'arial', fill: INK })
    letterHeader(b, doc, first)
    return b
  }
  const pages: { b: PageBuilder; rules: number[] }[] = []
  let cur = { b: fresh(true), rules: [] as number[] }
  let y = HEAD_BOTTOM
  for (const row of doc.rows) {
    const scratch = new PageBuilder(size.width, size.height, cur.b.base)
    const height = letterRow(scratch, doc, row, y) - y
    if (y + height > GRID_BOTTOM && y > HEAD_BOTTOM) {
      letterFrame(cur.b, cur.rules, y)
      pages.push(cur)
      cur = { b: fresh(false), rules: [] }
      y = HEAD_BOTTOM
    }
    const bottom = letterRow(cur.b, doc, row, y)
    cur.rules.push(bottom)
    y = bottom + 2.6
  }
  letterFrame(cur.b, cur.rules, y)
  pages.push(cur)
  pages.forEach((p, i) => letterFooter(p.b, doc, i + 1, pages.length))
  return pages.map((p) => p.b.page())
}

export const report: PdfTemplate = {
  id: 'report',
  name: 'Database report',
  format: (variant) => (variant === 'letter' ? { paper: 'letter', orientation: 'landscape' } : { paper: 'a4', orientation: 'portrait' }),
  layout: (doc, size) => (doc.variant === 'letter' ? letterLayout(doc, size) : reportLayout(doc, size)),
}

/**
 * `oplist`: the older operation list export of the same practice system as `oplistx`, landscape A4, Helvetica, black
 * only, no column headings. A small bold initials line over "Surgeon / Anaesthetist"; the hospital and session as a
 * bold centred title ("ST GEORGE'S PM"); a printed stamp over a big bold day heading at the right; a thin rule. Then
 * one block per patient in four zones: the time and minutes, the patient (name, address, date of birth, then a small
 * grid of policy, insurer, GP, referrer, ACC and purchase numbers) with an NHI and mobile sub-column, the procedure
 * under an upper-case category word, and the report time, funding and admission at the right; a thin rule after each
 * patient. A ruled footer: OPLIST, the page, the version. Each patient's time is printed, so it is read as printed.
 */

import type { PdfTemplate } from './index'
import { PageBuilder, type PageLayout, type TextStyle } from './engine'
import { clock12, fmtDate, type DocRow, type PdfDoc } from './doc'

const INK = '#000'
const BODY = 8.4
const LINE = 11.4
const RULE = { left: 8, right: 814, width: 0.6 }
const COL = { timeRight: 52, patient: 58, grid: 166, nhi: 276, procedure: 363, procedureWidth: 214, admin: 702 }
const FIRST_TOP = 64

const opt = (key: string | undefined) => (key !== undefined ? { key } : {})

/** The initials a practice system prints before the surgeon's name ("DK"), titles left out. */
function initialsOf(name: string): string {
  const words = name
    .replace(/[.,]/g, ' ')
    .split(/\s+/)
    .filter((w) => w !== '' && !/^(dr|mr|mrs|ms|miss|prof|professor|assoc)$/i.test(w))
  return words.map((w) => w[0]!.toUpperCase()).join('')
}

const CATEGORIES: readonly [RegExp, string][] = [
  [/hernia/i, 'HERNIA'],
  [/phaco|IOL|cataract/i, 'CATARACT'],
  [/carpal/i, 'CARPAL TUNNEL'],
  [/chole|gall/i, 'GALLBLADDER'],
  [/bleph/i, 'EYELID'],
  [/dupuytren|trigger finger|ganglion/i, 'HAND'],
  [/knee/i, 'KNEE'],
  [/hip/i, 'HIP'],
  [/shoulder|rotator|subacromial/i, 'SHOULDER'],
  [/lumbar|spin|disc|fusion/i, 'SPINE'],
  [/gastro|colon|scope/i, 'ENDOSCOPY'],
  [/ORIF|fracture|radius/i, 'FRACTURE'],
]

/** The upper-case category the practice files a procedure under, worked out from the procedure's own words. */
function categoryOf(text: string): string {
  for (const [re, word] of CATEGORIES) if (re.test(text)) return word
  const words = text.split(/\s+/).map((w) => w.replace(/[^A-Za-z']/g, ''))
  const word = words.find((w) => w.length >= 4 && !/^(left|right|with|and)$/i.test(w)) ?? words.find((w) => w !== '') ?? ''
  return word.toUpperCase()
}

/** A text cut to fit a width, as the export cuts a narrow field ("Methven Medical Ce"). */
function fit(b: PageBuilder, text: string, width: number, over?: Partial<TextStyle>): string {
  let out = text
  while (out.length > 1 && b.measure(out, over) > width) out = out.slice(0, -1)
  return out.trimEnd()
}

function minutesOf(hhmm: string): number | undefined {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  return m === null ? undefined : Number(m[1]) * 60 + Number(m[2])
}

function header(b: PageBuilder, doc: PdfDoc, first: boolean): void {
  const k = (key: string | undefined) => (first ? key : undefined)
  b.text(RULE.left, 37, `${initialsOf(doc.surgeonName)}: ${doc.surgeonName}`, { size: 7.4, bold: true })
  const names = { size: 11, bold: true }
  const anaesthetist = doc.anaesthetistName ?? ''
  b.runs(
    RULE.left,
    51,
    [
      { text: doc.surgeonName, ...opt(k(doc.headerKey('surgeon'))) },
      { text: ' / ' },
      ...(anaesthetist !== '' ? [{ text: anaesthetist, ...opt(k(doc.headerKey('anaesthetist'))) }] : []),
    ],
    names,
  )
  b.runs(
    410,
    50.5,
    [
      { text: doc.hospitalName.toUpperCase(), ...opt(k(doc.headerKey('hospital'))) },
      { text: ' ' },
      { text: doc.session, ...opt(k(doc.headerKey('session'))) },
    ],
    names,
    'middle',
  )
  const printed = `${String(doc.printed.hour).padStart(2, '0')}:${String(doc.printed.minute).padStart(2, '0')}`
  const stamp = { size: 7.4, bold: true }
  const day = fmtDate(doc.printed.dateISO, 'dd.MM.yy')
  b.text(RULE.right - 3, 32, day, stamp, { anchor: 'end' })
  b.text(RULE.right - 3 - b.measure(day, stamp) - 9, 32, `Printed: ${printed}`, stamp, { anchor: 'end' })
  b.text(RULE.right - 38, 49, fmtDate(doc.dateISO, 'EEEE d MMMM yyyy'), { size: 12.4, bold: true }, { anchor: 'end', ...opt(k(doc.headerKey('date'))) })
  b.line(RULE.left, 54.5, RULE.right, 54.5, INK, RULE.width)
}

/** The lines a patient's block takes: six for the patient, more when the procedure wraps further. */
function blockLines(b: PageBuilder, row: DocRow): number {
  const runs = [{ text: `${categoryOf(row.procedureText)} ` }, { text: row.procedureText, breakable: true }]
  return Math.max(6, b.lineCount(COL.procedureWidth, runs, { size: BODY }))
}

/** The funder's two grid lines (left and right cells), as the export prints them. */
function funderGrid(row: DocRow): { top: [string, string]; bottom: [string, string] } {
  const f = row.p.funder
  const gp: [string, string] = [`GP: ${row.p.gp.name}`, `Ref:  ${row.p.gp.practice}`]
  if (f.kind === 'insurer') return { top: [`Policy #: ${f.policy ?? ''}`, `Insurance: ${f.long}`], bottom: gp }
  if (f.kind === 'acc') return { top: gp, bottom: [`ACC: ${f.approval ?? ''}`, `Purchase#: ${row.p.patientNo.slice(0, 2)}${(f.approval ?? '').slice(-6)}`] }
  if (f.kind === 'public') return { top: gp, bottom: [`HNZ: ${f.approval ?? ''}`, `Purchase#: ${row.p.patientNo}`] }
  return { top: ['', 'Insurance: Self funding'], bottom: gp }
}

/** A patient's block from its first baseline; returns the y of the rule under it. */
function patient(b: PageBuilder, doc: PdfDoc, row: DocRow, top: number): number {
  const s = { size: BODY }
  const bold = { size: BODY, bold: true }
  const at = (i: number) => top + i * LINE
  const minutes = row.time !== undefined ? (minutesOf(row.time) ?? row.startMin) : row.startMin
  b.text(COL.timeRight, at(0), clock12(minutes, { pad: true }), bold, { anchor: 'end', ...opt(doc.key(row.id, 'scheduledTime')) })
  b.text(COL.timeRight, at(1), `(${row.durationMin} min)`, s, { anchor: 'end' })

  const title = row.p.title !== undefined ? `${row.p.title} ` : ''
  b.runs(COL.patient, at(0), [{ text: `${row.surname.toUpperCase()}, ${title}${row.given}`, ...opt(doc.key(row.id, 'name')) }, { text: row.age !== undefined ? ` (age ${row.age})` : '' }], bold)
  b.text(COL.patient, at(1), `${row.p.street}, ${row.p.suburb.toUpperCase()} ${row.p.postcode}`, s)
  b.runs(COL.patient, at(2), [{ text: 'Dob: ' }, { text: row.dobISO !== undefined ? fmtDate(row.dobISO, 'dd.MM.yy') : '', ...opt(doc.key(row.id, 'dobISO')) }], s)
  const grid = funderGrid(row)
  const cell = COL.grid - COL.patient - 4
  const wide = COL.procedure - COL.grid - 8
  b.text(COL.patient, at(4), fit(b, grid.top[0], cell, s), s)
  b.text(COL.grid, at(4), fit(b, grid.top[1], wide, s), s)
  b.text(COL.patient, at(5), fit(b, grid.bottom[0], cell, s), s)
  b.text(COL.grid, at(5), fit(b, grid.bottom[1], COL.nhi - COL.grid - 6, s), s)

  b.runs(COL.nhi, at(2), [{ text: 'NHI: ' }, { text: row.nhi ?? '', ...opt(doc.key(row.id, 'nhi')) }], s)
  b.text(COL.nhi, at(3), `PhM: ${row.p.mobile}`, s)

  const proc = b.flow(
    COL.procedure,
    at(0),
    COL.procedureWidth,
    [{ text: `${categoryOf(row.procedureText)} ` }, { text: row.procedureText, ...opt(doc.key(row.id, 'procedureText')), breakable: true }],
    { over: s, leading: LINE },
  )

  b.text(COL.admin, at(0), `Report time: ${clock12(row.reportMin, { pad: true })}`, s)
  b.text(COL.admin, at(1), row.p.funder.kind === 'insurer' || row.p.funder.kind === 'self' ? 'Private' : 'Contract', s)
  b.text(COL.admin, at(2), row.p.admission, s)

  return Math.max(at(5), proc.baseline) + 12.5
}

function footer(b: PageBuilder, page: number): void {
  const y = b.height - 36
  b.line(RULE.left, y, RULE.right, y, INK, RULE.width)
  b.text(RULE.left + 1, y + 13, 'OPLIST', { size: BODY })
  b.runs(410, y + 12, [{ text: 'Page ' }, { text: String(page), style: { bold: true } }], { size: BODY }, 'middle')
  b.text(715, y + 10, 'v115', { size: BODY })
}

export const oplist: PdfTemplate = {
  id: 'oplist',
  name: 'Operation list (older export)',
  format: () => ({ paper: 'a4', orientation: 'landscape' }),
  layout(doc, size): PageLayout[] {
    const pages: PageLayout[] = []
    const fresh = (first: boolean) => {
      const b = new PageBuilder(size.width, size.height, { size: BODY, font: 'helvetica', fill: INK })
      header(b, doc, first)
      return b
    }
    let b = fresh(true)
    let top = FIRST_TOP
    const bottom = size.height - 48
    for (const row of doc.rows) {
      const height = (blockLines(b, row) - 1) * LINE + 12.5
      if (top + height > bottom && top > FIRST_TOP) {
        footer(b, pages.length + 1)
        pages.push(b.page())
        b = fresh(false)
        top = FIRST_TOP
      }
      const rule = patient(b, doc, row, top)
      b.line(RULE.left, rule, RULE.right, rule, INK, RULE.width)
      top = rule + 13.5
    }
    footer(b, pages.length + 1)
    pages.push(b.page())
    return pages
  },
}

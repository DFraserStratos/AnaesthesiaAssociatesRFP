/**
 * `oplistx`: a practice system's operation list export, landscape A4, Helvetica, black only. A printed stamp at the
 * top right; the list's name centred with the session's hours under it; surgeon and date on the left, anaesthetist
 * and assistant on the right; a heading row between two rules (Order, Patient, Procedure, Anaesthetic, Admission
 * Information); then one block per patient with no rules between, about three to a page; a ruled footer naming the
 * export, the practice, its version and the page. The export prints no time per patient: only the order, each
 * patient's minutes and the start, so the reader works each time out (read as derived, on the order cell).
 */

import type { PdfTemplate } from './index'
import { PageBuilder, type PageLayout } from './engine'
import { clock12, clock24, fmtDate, type DocRow, type PdfDoc } from './doc'

const INK = '#000'
const M = 33
const COL = { orderRight: 80, patient: 91, procedure: 328, anaesthetic: 587, admission: 666 }
const LINE = 11.2
const BODY = 8.6

function header(b: PageBuilder, doc: PdfDoc, first: boolean, right: number): void {
  const k = <T extends string | undefined>(key: T) => (first ? key : undefined)
  const stamp = `${fmtDate(doc.printed.dateISO, 'dd.MM.yyyy')}, ${clock12(doc.printed.hour * 60 + doc.printed.minute)}`
  b.text(right, 22, stamp, { size: 7.6 }, { anchor: 'end' })
  b.text(b.width / 2, 50, doc.hospitalName.toUpperCase(), { size: 13.5 }, { anchor: 'middle', ...opt(k(doc.headerKey('hospital'))) })
  b.text(b.width / 2, 64.5, `${clock24(doc.startMin, false)} - ${clock24(doc.endMin, false)}`, { size: 10.5 }, { anchor: 'middle', ...opt(k(doc.headerKey('session'))) })
  b.text(51, 64.5, 'Surgeon:', { size: 11 })
  b.text(51 + b.measure('Surgeon:   ', { size: 11 }), 64.5, doc.surgeonName, { size: 11 }, opt(k(doc.headerKey('surgeon'))))
  const anaesthetist = doc.anaesthetistName ?? ''
  const aw = b.measure(anaesthetist, { size: 11 })
  if (anaesthetist !== '') b.text(right, 64.5, anaesthetist, { size: 11 }, { anchor: 'end', ...opt(k(doc.headerKey('anaesthetist'))) })
  b.text(right - aw - (anaesthetist !== '' ? 8 : 0), 64.5, 'Anaesthetist:', { size: 11 }, { anchor: 'end' })
  b.text(51, 93, 'Date:', { size: 11 })
  b.text(51 + b.measure('Date:   ', { size: 11 }), 93, fmtDate(doc.dateISO, 'EEEE dd.MM.yyyy'), { size: 11 }, opt(k(doc.headerKey('date'))))
  b.text(right, 93, 'Assistant:', { size: 11 }, { anchor: 'end' })
  b.line(M, 111, right, 111, INK, 0.75)
  const h = { size: BODY }
  b.text(COL.orderRight, 122, 'Order', h, { anchor: 'end' })
  b.text(COL.patient, 122, 'Patient', h)
  b.text(COL.procedure, 122, 'Procedure', h)
  b.text(COL.anaesthetic, 122, 'Anaesthetic', h)
  b.text(COL.admission, 122, 'Admission Information', h)
  b.line(M, 126, right, 126, INK, 0.75)
}

const opt = (key: string | undefined) => (key !== undefined ? { key } : {})

function nameLine(row: DocRow): { name: string; age: string } {
  const title = row.p.title !== undefined ? `${row.p.title} ` : ''
  return { name: `${row.surname.toUpperCase()}, ${title}${row.given}`, age: row.age !== undefined ? ` (age ${row.age})` : '' }
}

/** A patient's block: returns the baseline below it. */
function patient(b: PageBuilder, doc: PdfDoc, row: DocRow, top: number): number {
  const s = { size: BODY }
  const time = doc.key(row.id, 'scheduledTime')
  b.text(COL.orderRight, top, `${row.order}.`, s, { anchor: 'end', ...opt(time), derived: true })
  b.text(COL.orderRight, top + LINE, `(${row.durationMin} mins)`, s, { anchor: 'end', ...opt(time), derived: true })
  b.text(COL.orderRight, top + 2 * LINE, row.p.patientNo, s, { anchor: 'end' })
  const { name, age } = nameLine(row)
  b.runs(COL.patient, top, [{ text: name, ...opt(doc.key(row.id, 'name')) }, { text: age }], s)
  b.text(COL.patient, top + LINE, row.p.street, s)
  b.text(COL.patient, top + 2 * LINE, `${row.p.suburb.toUpperCase()} ${row.p.postcode}`, s)
  b.runs(
    COL.patient,
    top + 3 * LINE,
    [
      { text: 'DOB: ' },
      { text: row.dobISO !== undefined ? fmtDate(row.dobISO, 'dd.MM.yy') : '', ...opt(doc.key(row.id, 'dobISO')) },
      { text: ' NHI: ' },
      { text: row.nhi ?? '', ...opt(doc.key(row.id, 'nhi')) },
    ],
    s,
  )
  b.text(COL.patient, top + 4 * LINE, `PhM: ${row.p.mobile.replace(/ /g, '')}`, s)
  b.text(COL.patient, top + 5 * LINE, `Email: ${row.p.email}`, s)
  b.text(COL.patient, top + 6 * LINE, `GP: ${row.p.gp.name} (${row.p.gp.practice})`, s)
  const f = row.p.funder
  const ins = f.kind === 'insurer' ? `Ins: ${f.long}, #: ${f.policy ?? ''}` : f.kind === 'acc' ? `ACC: ${f.approval ?? ''}` : f.kind === 'self' ? 'Ins: Self funding' : 'Ins: Health NZ contract'
  b.text(COL.patient, top + 7 * LINE, ins, s)
  const proc = b.flow(COL.procedure, top, COL.anaesthetic - COL.procedure - 10, [{ text: 'Operation ' }, { text: row.procedureText, ...opt(doc.key(row.id, 'procedureText')), breakable: true }], {
    over: s,
    leading: LINE,
  })
  b.text(COL.anaesthetic, top, row.p.anaesthetic, s)
  b.text(COL.admission, top, row.p.dayStay ? 'Day case' : 'Inpatient / bed booked', s)
  b.text(COL.admission, top + LINE, `Report time: ${clock12(row.reportMin, { pad: true })}`, s)
  return Math.max(top + 8 * LINE, proc.baseline + LINE) + LINE * 0.9
}

function footer(b: PageBuilder, doc: PdfDoc, page: number, right: number): void {
  const y = b.height - 59
  b.line(M, y, right, y, INK, 0.75)
  b.text(51, y + 13, 'OPLISTX', { size: BODY })
  b.text(b.width / 2, y + 13, doc.practice, { size: BODY }, { anchor: 'middle' })
  b.text(727, y + 13, 'v119', { size: BODY })
  b.text(right, y + 13, `Page: ${page}`, { size: BODY }, { anchor: 'end' })
}

export const oplistx: PdfTemplate = {
  id: 'oplistx',
  name: 'Operation list export',
  format: () => ({ paper: 'a4', orientation: 'landscape' }),
  layout(doc, size): PageLayout[] {
    const right = size.width - 28
    const pages: PageLayout[] = []
    const fresh = (first: boolean) => {
      const b = new PageBuilder(size.width, size.height, { size: BODY, font: 'helvetica', fill: INK })
      header(b, doc, first, right)
      return b
    }
    let b = fresh(true)
    let y = 137
    const bottom = size.height - 70
    const blockHeight = 9.4 * LINE
    for (const row of doc.rows) {
      if (y + blockHeight > bottom && y > 137) {
        footer(b, doc, pages.length + 1, right)
        pages.push(b.page())
        b = fresh(false)
        y = 137
      }
      y = patient(b, doc, row, y)
    }
    footer(b, doc, pages.length + 1, right)
    pages.push(b.page())
    return pages
  },
}

/**
 * `agenda`: a practice calendar's day agenda printed from the browser, portrait A4, Arial. Page 1 opens with the
 * surgeon's name and "<Hospital> - Operating Theatre - dd/MM/yyyy" centred in bold; then a timeline, each entry's
 * time in a left column and its length "(105 mins)" in grey on the right, grey rules between entries. The day starts
 * with a task row ("Task - <surgeon>", "PM list sent dd/MM": the session is read there) and a clinic booking naming
 * the anaesthetist. Each patient: the name in bold capitals, the NHI with a barcode under it, the contact details
 * beside them, a coloured appointment-type banner, the practice's custom fields in two underlined columns, the
 * surgery as typed and a few short lines, and a pink allergies box when the patient has one. About two patients to a
 * page, never split; later pages carry on with no header or footer, as a browser print does. The time printed is the
 * appointment's own, so it is read, not worked out.
 */

import type { PdfTemplate } from './index'
import { barcodeSvg, PageBuilder, type PageLayout, type Run } from './engine'
import { clock12, fmtDate, seededSequence, type DocRow, type PdfDoc } from './doc'

const INK = '#000'
const GREY = '#444'
const RULE = '#C8C8C8'
const BODY = 8
const LINE = 9.7
const COL = { time: 27, main: 84, fields: 205, right: 568, refer: 326 }
const TOP_LATER = 44
const BOTTOM_GAP = 34

const opt = (key: string | undefined) => (key !== undefined ? { key } : {})
const bold = { bold: true }

/** "7:30am", "12:00pm": the calendar's own time format. */
const ampm = (min: number) => clock12(min, { space: false })
/** "6am", "6:30am": a time a practice types into a custom field. */
const shortTime = (min: number) => ampm(min).replace(':00', '')

/** The banner each appointment type prints in (one per practice's calendar, from the document's seed). */
function bannerOf(doc: PdfDoc): { fill: string; label: (doc: PdfDoc) => string } {
  const next = seededSequence(`agenda-banner|${doc.practice}|${doc.seed}`)
  return next() < 0.55
    ? { fill: '#2196F3', label: (d) => `Surgery - ${d.hospitalName}` }
    : { fill: '#D84315', label: () => 'Operation' }
}

function sessionWord(doc: PdfDoc): string {
  return doc.session === 'OOH' ? 'After hours' : doc.session
}

function header(b: PageBuilder, doc: PdfDoc): number {
  const h = { size: 12.5, bold: true }
  b.text(b.width / 2, 40, doc.surgeonName, h, { anchor: 'middle', ...opt(doc.headerKey('surgeon')) })
  b.runs(
    b.width / 2,
    68,
    [
      { text: doc.hospitalName, ...opt(doc.headerKey('hospital')) },
      { text: ' - Operating Theatre - ' },
      { text: fmtDate(doc.dateISO, 'dd/MM/yyyy'), ...opt(doc.headerKey('date')) },
    ],
    h,
    'middle',
  )
  return 95
}

/** A grey rule under an entry; returns the next entry's first baseline. */
function rule(b: PageBuilder, y: number): number {
  b.line(COL.time - 1, y, COL.right + 1, y, RULE, 1.5)
  return y + 15
}

/** The day's opening rows: the rooms' task (sent date and session) and the clinic booking naming the anaesthetist. */
function openingRows(b: PageBuilder, doc: PdfDoc, top: number): number {
  const s = { size: BODY }
  const taskStart = doc.startMin - 15
  b.text(COL.time, top, ampm(taskStart), s)
  b.text(COL.main, top, `Task - ${doc.surgeonName}`, { ...s, ...bold })
  b.text(COL.right, top, `(${Math.max(15, doc.endMin - taskStart)} mins)`, { ...s, fill: GREY }, { anchor: 'end' })
  b.runs(COL.main, top + LINE, [{ text: sessionWord(doc), ...opt(doc.headerKey('session')) }, { text: ` list sent ${fmtDate(doc.printed.dateISO, 'dd/MM')}` }], s)
  let y = rule(b, top + LINE + 16)
  b.text(COL.time, y, ampm(doc.startMin), s)
  b.runs(COL.main, y, [{ text: '[Clinic Booking]', style: bold }, { text: ' @' }], s)
  let last = y
  if (doc.anaesthetistName !== undefined && doc.anaesthetistName !== '') {
    last = y + 2 * LINE
    b.runs(COL.main, last, [{ text: 'Anaesthetist: ' }, { text: doc.anaesthetistName, ...opt(doc.headerKey('anaesthetist')) }], s)
  }
  y = rule(b, last + 16)
  return y
}

/** A bold label and its value, as the calendar prints a field. */
const field = (label: string, value: string): Run[] => [{ text: `${label}: `, style: bold }, { text: value }]

function patientFields(row: DocRow): Run[][] {
  const out: Run[][] = [field('Allergies', /^(NKDA|Nil known)$/.test(row.p.allergies) ? 'Nil known drug allergies' : row.p.allergies)]
  if (row.p.funder.kind === 'insurer') out.push(field('Insurance', `${row.p.funder.short} ${row.p.funder.policy ?? ''}`.trim()))
  return out
}

function referralFields(row: DocRow): Run[][] {
  const f = row.p.funder
  const out: Run[][] = []
  if (f.kind === 'acc') {
    out.push(field('ACC Claim Number', f.approval ?? ''), field('ACC Cover Status', 'Accept'), field('Funding', 'ACC'))
  } else {
    out.push(field('Funder', f.kind === 'self' ? 'Self Funding' : f.kind === 'public' ? 'Health NZ' : f.long))
  }
  if (row.p.side !== undefined) out.push(field('Side', row.p.side))
  if (f.kind !== 'acc') out.push(field('Surgery Approval Number', f.kind === 'self' ? 'Self funding' : (f.approval ?? 'TBC')))
  out.push(field('Surgery LOS', row.p.dayStay ? 'Day stay' : row.p.admission.replace('Overnight x ', '') + (row.p.admission.endsWith('x 1') ? ' night' : ' nights')))
  const food = row.reportMin < 12 * 60 ? 'Midnight' : shortTime(row.reportMin - 6 * 60)
  out.push(field('Surgery FOOD fasting time', food), field('Surgery CLEAR FLUIDS fasting time', shortTime(row.reportMin - 60)))
  out.push(field('Surgery admission time', shortTime(row.reportMin)))
  return out
}

function shortLines(row: DocRow): string[] {
  const ga = row.p.anaesthetic === 'GA'
  return [
    `Anaesthetic: ${ga ? 'General Anaesthetic.' : row.p.anaesthetic === 'LA + sedation' ? 'Local with sedation.' : 'Local Anaesthetic.'}`,
    `HDU bed required? No`,
    `Length of Stay: ${row.p.dayStay ? 'Day case' : 'Overnight stay'}`,
  ]
}

/** One patient entry from its first baseline; returns the baseline the rule under it sits on. */
function patient(b: PageBuilder, doc: PdfDoc, row: DocRow, top: number, banner: ReturnType<typeof bannerOf>): number {
  const s = { size: BODY }
  b.text(COL.time, top, ampm(row.startMin), s, opt(doc.key(row.id, 'scheduledTime')))
  b.text(COL.right, top, `(${row.durationMin} mins)`, { ...s, fill: GREY }, { anchor: 'end' })

  // Name (wrapping in its column), NHI and barcode.
  const name = b.flow(COL.main, top, COL.fields - COL.main - 6, [{ text: `${row.surname.toUpperCase()}, ${row.given.toUpperCase()}`, ...opt(doc.key(row.id, 'name')), breakable: true }], {
    over: { ...s, ...bold },
    leading: LINE,
  })
  const nhiY = name.baseline + 12.2
  b.runs(COL.main, nhiY, [{ text: 'NHI: ' }, { text: row.nhi ?? '', ...opt(doc.key(row.id, 'nhi')) }], s)
  const barTop = nhiY + 4.5
  b.raw(barcodeSvg(COL.main, barTop, 114, 28, row.nhi ?? row.p.patientNo))
  const leftBottom = barTop + 28

  // Contact details.
  const dob = row.dobISO !== undefined ? fmtDate(row.dobISO, 'dd/MM/yyyy') : ''
  b.runs(
    COL.fields,
    top,
    [
      ...(row.age !== undefined ? [{ text: 'Age: ', style: bold }, { text: `${row.age}     ` }] : []),
      { text: 'DOB: ', style: bold },
      { text: dob, ...opt(doc.key(row.id, 'dobISO')) },
      { text: '     Dr: ', style: bold },
      { text: doc.surgeonName },
    ],
    s,
  )
  b.runs(COL.fields, top + LINE, field('Address', `${row.p.street}, ${row.p.suburb}${row.p.city !== row.p.suburb ? `, ${row.p.city}` : ''}, ${row.p.postcode}`), s)
  b.runs(COL.fields, top + 2 * LINE, field('Phone', `+64 ${row.p.mobile.slice(1)}`), s)
  b.runs(COL.fields, top + 4 * LINE, field('GP', `${row.p.gp.name.replace(/^(\w+), (Dr \w)$/, '$2 $1')}, ${row.p.gp.practice}`), s)
  b.runs(COL.fields, top + 5 * LINE, field('Email', row.p.email), s)
  const detailsBottom = top + 5 * LINE + 3

  // The appointment type's banner.
  const bannerTop = Math.max(leftBottom, detailsBottom) + 4
  b.rect(COL.main, bannerTop, COL.right - COL.main, 20, { fill: banner.fill })
  b.text(COL.main + 6, bannerTop + 13.3, banner.label(doc), { ...s, ...bold, fill: '#FFF' })

  // Custom fields in two columns.
  let y = bannerTop + 20 + 16
  const pf = patientFields(row)
  const rf = referralFields(row)
  b.text(COL.main, y, 'Patient Custom Fields', { ...s, ...bold, underline: true })
  b.text(COL.refer, y, 'Referral Custom Fields', { ...s, ...bold, underline: true })
  pf.forEach((runs, i) => b.runs(COL.main, y + (i + 1) * LINE, runs, s))
  rf.forEach((runs, i) => b.runs(COL.refer, y + (i + 1) * LINE, runs, s))
  y += Math.max(pf.length, rf.length) * LINE + LINE + 2.5

  // The surgery as typed, then the practice's short lines.
  const proc = b.flow(COL.main, y, COL.right - COL.main, [{ text: 'Surgery: ' }, { text: row.procedureText, ...opt(doc.key(row.id, 'procedureText')), breakable: true }], { over: s, leading: LINE })
  y = proc.baseline
  for (const line of shortLines(row)) {
    y += 2 * LINE
    b.text(COL.main, y, line, s)
  }

  // A pink box for a patient with an allergy.
  if (!/^(NKDA|Nil known)$/.test(row.p.allergies)) {
    const boxTop = y + 12
    b.rect(COL.main, boxTop, COL.right - COL.main, 30, { fill: '#F7C9CC' })
    b.text(COL.main + 12, boxTop + 12, 'Patient Allergies', { ...s, underline: true })
    b.text(COL.main + 12, boxTop + 12 + LINE, row.p.allergies, s)
    y = boxTop + 30 - 4
  }
  return y + 15
}

export const agenda: PdfTemplate = {
  id: 'agenda',
  name: 'Practice calendar agenda',
  format: () => ({ paper: 'a4', orientation: 'portrait' }),
  layout(doc, size): PageLayout[] {
    const base = { size: BODY, font: 'arial' as const, fill: INK }
    const banner = bannerOf(doc)
    const pages: PageLayout[] = []
    let b = new PageBuilder(size.width, size.height, base)
    let y = openingRows(b, doc, header(b, doc))
    const bottom = size.height - BOTTOM_GAP
    for (const row of doc.rows) {
      // Measure the entry on a scratch page first: an entry never splits across pages.
      const height = patient(new PageBuilder(size.width, size.height, base), doc, row, 0, banner) + 6
      if (y + height > bottom && y > TOP_LATER) {
        pages.push(b.page())
        b = new PageBuilder(size.width, size.height, base)
        y = TOP_LATER
      }
      const end = patient(b, doc, row, y, banner)
      y = rule(b, end)
    }
    pages.push(b.page())
    return pages
  },
}

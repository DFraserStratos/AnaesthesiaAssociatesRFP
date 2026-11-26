/**
 * `hospitalLetter`: a surgeon's rooms' day-surgery letter to the hospital, typed in Word, portrait A4, Arial. A small
 * preamble names the hospital's day surgery and its fax; a bold date with a superscript ordinal, the start time on a
 * yellow highlight, the anaesthetist, and the surgeon with a ticked box. Then a two-column boxed table, one tall cell
 * pair per patient: the patient's details on the left (NHI, ordinal and name, cell, email, address, DOB, the funder
 * on a magenta or cyan highlight, consent ticked, a support person), the procedure, its minutes, day stay or
 * overnight and a label grid of medical history on the right. Later pages carry the table alone; the sign-off sits
 * at the foot of every page, as the Word footer does. The letter prints no time per patient: the reader works each
 * time out from the start time and each patient's minutes (read as derived, on "Procedure time"). The session is read
 * from the start time.
 */

import type { PdfTemplate } from './index'
import { PageBuilder, type PageLayout, type Run } from './engine'
import { clock12, fmtDate, ordinal, seededSequence, type DocRow, type PdfDoc } from './doc'

const INK = '#000'
const YELLOW = '#FFFF00'
const MAGENTA = '#FF00FF'
const CYAN = '#00FFFF'
const LINK = '#0563C1'
const TICK = '☑'

const LEFT = 72
const TABLE = { x0: 66, mid: 263, x1: 534 }
const PAD = 6
const BODY = 10
const RIGHT_X = TABLE.mid + PAD
const GRID_VALUE_X = RIGHT_X + 111
const GRID_ROW = 17.3
const PROC_LEADING = 12
const FIRST_TOP = 152
const LATER_TOP = 50
const FOOTER_BASELINE = 788
const BOTTOM = 772

const opt = (key: string | undefined) => (key !== undefined ? { key } : {})

/** The surgeon's specialty as the letter names it, from what the List's procedures are. */
function specialtyOf(doc: PdfDoc): string {
  const kinds: [string, RegExp][] = [
    ['Oral and Maxillofacial', /wisdom|teeth|tooth|dental|maxill|mandib|jaw|orthognath|third molar/i],
    ['Orthopaedic', /knee|hip|shoulder|arthroscop|\bACL\b|carpal|bunion|hallux|ORIF|menisc|rotator|ankle|\b[RL]?T[KH]J?R?\b|\bRTK\b|\bLTK\b|trigger finger|dupuytren/i],
    ['Ophthalmic', /phaco|cataract|\bIOL\b|vitrect|squint|bleph/i],
    ['ENT', /tonsil|adenoid|grommet|septo|sinus|\bFESS\b|turbinate/i],
    ['Urological', /cysto|TURP|prostat|ureter|vasectomy|circumcis/i],
    ['Gynaecological', /hysterect|hysteroscop|\bD ?& ?C\b|ovar|endometri/i],
    ['Plastic', /abdominoplast|rhinoplast|breast|skin lesion|excision of lesion|BCC|SCC/i],
    ['General', /hernia|chole|appendic|colonoscop|gastroscop|haemorrhoid|bowel|lap\b/i],
  ]
  const counts = new Map<string, number>()
  for (const row of doc.rows) {
    const hit = kinds.find(([, re]) => re.test(row.procedureText))
    if (hit !== undefined) counts.set(hit[0], (counts.get(hit[0]) ?? 0) + 1)
  }
  let best = 'General'
  let most = 0
  for (const [name, n] of counts) if (n > most) [best, most] = [name, n]
  return best
}

const PREVIOUS = ['Nil', 'Nil previous GA', 'Appendicectomy (GA no adverse reactions)', 'Tonsillectomy as a child', 'Knee arthroscopy (GA no adverse reactions)', 'Caesarean section', 'Nil', 'Wrist surgery (GA no adverse reactions)']
const SUPPORT = ['daughter', 'son', 'partner', 'husband', 'wife', 'mother', 'friend']

interface Extras {
  previous: string
  support?: string
  xray?: string
}

function extrasOf(row: DocRow, specialty: string): Extras {
  const next = seededSequence(`hospitalLetter|${row.name}|${row.nhi ?? ''}|${row.dobISO ?? ''}`)
  const previous = PREVIOUS[Math.floor(next() * PREVIOUS.length) % PREVIOUS.length]!
  const rel = SUPPORT[Math.floor(next() * SUPPORT.length) % SUPPORT.length]!
  const prefix = ['021', '022', '027'][Math.floor(next() * 3) % 3]!
  const num = String(Math.floor(next() * 1000)).padStart(3, '0')
  const support = next() < 0.6 ? `${rel}, ${prefix} 555 0${num}` : undefined
  const roll = next()
  const xray =
    specialty === 'Oral and Maxillofacial' ? (roll < 0.6 ? 'ICAT FLX' : 'OPG') : specialty === 'Orthopaedic' ? (roll < 0.7 ? 'on PACS' : undefined) : undefined
  return { previous, ...(support !== undefined ? { support } : {}), ...(xray !== undefined ? { xray } : {}) }
}

function header(b: PageBuilder, doc: PdfDoc, specialty: string): void {
  const s = { size: 9 }
  const hospital = doc.hospitalName
  const full = /hospital$/i.test(hospital) ? hospital : `${hospital} Hospital`
  const extra = full.slice(hospital.length)
  const fax = seededSequence(`fax|${doc.practice}|${hospital}`)
  let digits = ''
  for (let i = 0; i < 4; i++) digits += String(Math.floor(fax() * 10) % 10)
  b.runs(LEFT, 50, [{ text: `${full} Day Surgery, ` }, { text: hospital, ...opt(doc.headerKey('hospital')) }, { text: `${extra}, Christchurch` }], s)
  b.text(LEFT, 61, `Fax:  03 555 ${digits}`, s)
  b.text(LEFT, 72, `Please find listed those patients for Day Surgery ${hospital} General Anaesthetic list on:`, s)

  const h = { size: 11, bold: true }
  const dateKey = doc.headerKey('date')
  b.text(LEFT, 107, 'Date:', h)
  const day = Number(fmtDate(doc.dateISO, 'd'))
  b.runs(
    144,
    107,
    [
      { text: fmtDate(doc.dateISO, 'EEEE dd'), ...opt(dateKey) },
      { text: ordinal(day), style: { size: 7, rise: 4 }, ...opt(dateKey) },
      { text: ` ${fmtDate(doc.dateISO, 'MMMM yyyy')}`, ...opt(dateKey) },
    ],
    h,
  )
  // Start time: label and value on one yellow highlight.
  const start = clock12(doc.startMin, { pad: true, upper: true, space: false })
  const startX = 326
  const valueX = startX + b.measure('Start time:', h) + 14
  const endX = valueX + b.measure(start, h)
  b.rect(startX - 1, 107 - 11 * 0.8 - 1, endX - startX + 2, 11 * 1.04 + 2, { fill: YELLOW })
  b.text(startX, 107, 'Start time:', h)
  b.text(valueX, 107, start, h, opt(doc.headerKey('session')))

  b.text(LEFT, 122, 'Anaesthetist:', h)
  if (doc.anaesthetistName !== undefined && doc.anaesthetistName !== '') b.text(180, 122, doc.anaesthetistName, { size: 11 }, opt(doc.headerKey('anaesthetist')))

  const label = `${specialty} Surgeon:`
  const labelEnd = b.text(LEFT, 139, label, h)
  const nameX = Math.max(252, labelEnd + 16)
  const nameEnd = b.text(nameX, 139, doc.surgeonName, h, opt(doc.headerKey('surgeon')))
  b.text(nameEnd + 12, 140, TICK, { size: 14 })
}

function footer(b: PageBuilder, doc: PdfDoc, specialty: string): void {
  b.runs(LEFT, FOOTER_BASELINE, [{ text: `Yours sincerely, ${doc.surgeonName}, `, style: { size: 9 } }, { text: `${specialty.replace(' and ', ' & ')} Surgeon`, style: { size: 10 } }])
}

interface Plan {
  procRuns: Run[]
  procLines: number
  grid: { label: string; value: string; lines: number }[]
  supportY: number
  height: number
}

function procRunsOf(doc: PdfDoc, row: DocRow): Run[] {
  return [{ text: 'Procedure: ' }, { text: row.procedureText, ...opt(doc.key(row.id, 'procedureText')), breakable: true }]
}

function planOf(b: PageBuilder, doc: PdfDoc, row: DocRow, ex: Extras): Plan {
  const bold = { size: BODY, bold: true }
  const procRuns = procRunsOf(doc, row)
  const procLines = b.lineCount(TABLE.x1 - PAD - RIGHT_X, procRuns, bold)
  const width = TABLE.x1 - PAD - GRID_VALUE_X
  const grid = [
    { label: 'ALLERGIES:', value: row.p.allergies },
    { label: 'OTHER CONDITIONS:', value: row.p.conditions },
    { label: 'PREVIOUS SURGERY:', value: ex.previous },
    { label: 'SMOKER:', value: row.p.smoker },
    { label: 'MEDS:', value: row.p.meds },
  ].map((g) => ({ ...g, lines: b.lineCount(width, [{ text: g.value }], { size: BODY }) }))
  const procEnd = 12 + (procLines - 1) * PROC_LEADING
  const gridStart = procEnd + 22 + 23 + 34
  const gridEnd = gridStart + grid.reduce((n, g) => n + g.lines, 0) * GRID_ROW - GRID_ROW
  const supportY = Math.max(225, gridEnd + 36)
  return { procRuns, procLines, grid, supportY, height: supportY + 8 }
}

function patient(b: PageBuilder, doc: PdfDoc, row: DocRow, top: number, plan: Plan, ex: Extras): void {
  b.rect(TABLE.x0, top, TABLE.x1 - TABLE.x0, plan.height, { stroke: INK, strokeWidth: 0.75 })
  b.line(TABLE.mid, top, TABLE.mid, top + plan.height, INK, 0.75)
  const s = { size: BODY }
  const bold = { size: BODY, bold: true }
  const x = LEFT

  // Left: the patient.
  b.runs(x, top + 12, [{ text: 'NHI: ' }, { text: row.nhi ?? '', ...opt(doc.key(row.id, 'nhi')) }], bold)
  b.runs(x, top + 27, [{ text: String(row.order) }, { text: ordinal(row.order), style: { size: 6.5, rise: 3.5 } }, { text: ' ' }, { text: row.name, ...opt(doc.key(row.id, 'name')) }], bold)
  b.runs(x, top + 39.5, [{ text: 'Cell: ' }, { text: row.p.mobile, style: { size: 11 } }], s)
  // A long address is set a little smaller to stay in its cell.
  const room = TABLE.mid - PAD - x - b.measure('Email: ', s)
  const emailSize = Math.min(BODY, (BODY * room) / b.measure(row.p.email, s))
  b.runs(x, top + 51.5, [{ text: 'Email: ' }, { text: row.p.email, style: { fill: LINK, underline: true, size: emailSize } }], s)
  b.text(x, top + 63.5, `Add: ${row.p.street}`, s)
  b.runs(x, top + 75.5, [{ text: 'DOB: ' }, { text: row.dobISO !== undefined ? fmtDate(row.dobISO, 'dd/MM/yyyy') : '', ...opt(doc.key(row.id, 'dobISO')) }], bold)
  const f = row.p.funder
  if (f.kind === 'insurer') b.text(x, top + 106, `INS: ${f.short} - Approved`, { ...bold, highlight: MAGENTA })
  else if (f.kind === 'acc') b.text(x, top + 106, `ACC: ${f.approval ?? ''} - Approved`, { ...bold, highlight: MAGENTA })
  else if (f.kind === 'self') b.text(x, top + 106, 'Self-funding', { ...bold, highlight: CYAN })
  else b.text(x, top + 106, 'Health NZ outsourced', { ...bold, highlight: CYAN })
  const consentEnd = b.text(x, top + 143, 'Consent scanned + verified', bold)
  b.text(consentEnd + 9, top + 144, TICK, { size: 14 })
  b.runs(x, top + plan.supportY, [{ text: 'Support Person: ', style: { bold: true, italic: true } }, { text: ex.support ?? '', style: { italic: true } }], s)

  // Right: the procedure and the medical history.
  const proc = b.flow(RIGHT_X, top + 12, TABLE.x1 - PAD - RIGHT_X, plan.procRuns, { over: bold, leading: PROC_LEADING })
  let y = proc.baseline + 22
  b.runs(RIGHT_X, y, [{ text: 'Procedure time: ' }, { text: `${row.durationMin}min`, ...opt(doc.key(row.id, 'scheduledTime')), derived: true }], bold)
  y += 23
  const stay = row.p.dayStay
  b.runs(
    RIGHT_X,
    y,
    [
      { text: 'Overnight', style: !stay ? { bold: true, highlight: YELLOW } : {} },
      { text: ' / ' },
      { text: 'Day stay', style: stay ? { bold: true, highlight: YELLOW } : {} },
    ],
    s,
  )
  y += 34
  for (const g of plan.grid) {
    b.text(RIGHT_X, y, g.label, bold)
    b.flow(GRID_VALUE_X, y, TABLE.x1 - PAD - GRID_VALUE_X, [{ text: g.value }], { over: s, leading: GRID_ROW })
    y += g.lines * GRID_ROW
  }
  if (ex.xray !== undefined) {
    const end = b.runs(RIGHT_X, top + plan.supportY, [{ text: 'Xray', style: { bold: true } }, { text: `: ${ex.xray}` }], s)
    b.text(end + 3, top + plan.supportY + 1, TICK, { size: 14 })
  }
}

export const hospitalLetter: PdfTemplate = {
  id: 'hospitalLetter',
  name: 'Day-surgery letter to the hospital',
  format: () => ({ paper: 'a4', orientation: 'portrait' }),
  layout(doc, size): PageLayout[] {
    const specialty = specialtyOf(doc)
    const pages: PageLayout[] = []
    const fresh = () => new PageBuilder(size.width, size.height, { size: BODY, font: 'arial', fill: INK })
    let b = fresh()
    header(b, doc, specialty)
    let top = FIRST_TOP
    let onPage = 0
    for (const row of doc.rows) {
      const ex = extrasOf(row, specialty)
      const plan = planOf(b, doc, row, ex)
      if (top + plan.height > BOTTOM && onPage > 0) {
        footer(b, doc, specialty)
        pages.push(b.page())
        b = fresh()
        top = LATER_TOP
        onPage = 0
      }
      patient(b, doc, row, top, plan, ex)
      top += plan.height
      onPage++
    }
    footer(b, doc, specialty)
    pages.push(b.page())
    return pages
  },
}

/**
 * The rooms' PDF lists (catch-up Phase 34; FT-02.2, US-02.2.1, DM-61). Pure,
 * no React.
 *
 * Surgeons' rooms email the office their List as a PDF, and re-send the whole
 * List whenever it changes. The office uploads each one with the address it
 * arrived from (the reading is simulated: these samples are what a reading
 * would give; no OCR and no mailbox), corrects a row's fields beside the
 * facsimile, and sends the list to the matching screen, where its rows wait
 * for the office's decision like any hospital row, with the rooms as their
 * source and their wording as the rooms' procedure text.
 *
 * The samples' wording is AI-made, not from AA (AR-35, "Illustrative source
 * wording"). Their patients are synthetic or the seed's own.
 */

import type {
  IncomingBookingFields,
  PdfListRow,
  PdfReadField,
  PdfRowAsRead,
  PdfRowField,
  SurgeonPdfList,
  Session,
} from '../types'
import { validateNhi } from '../nhi'
import { longDay } from '../dateText'
import { addDaysISO } from '../clock'
import { ANAE, ANAESTHETISTS, HOSP, SURG } from '../seed/cast'
import {
  PDF_HEADER_FIELDS,
  PDF_LAYOUT,
  PDF_PAGE,
  PDF_ROW_READ_FIELDS,
  PDF_ROWS_PER_PAGE,
  pdfPageCount,
  pdfPageHeight,
  readValuesOfRow,
  type PdfHeaderField,
} from './pdfRead'

// ---------------------------------------------------------------------------
// The sample library
// ---------------------------------------------------------------------------

export interface PdfListSampleRow extends PdfRowAsRead {
  id: string
}

/** A PDF list the presenter can upload (the reading simulated). */
export interface PdfListSample {
  id: string
  fileName: string
  surgeonId: string
  /** As printed on the letterhead. */
  surgeonName: string
  hospitalId: string
  hospitalName: string
  subject: string
  /** The "Sent from" address prefilled in the upload picker (editable there). */
  defaultSender: string
  /** The List it suggests. */
  target: { anaesthetistId: string; dateISO: string; session: Session }
  rows: readonly PdfListSampleRow[]
  /** A re-sent version only: the sample it re-sends. */
  resendOf?: string
  /** What the presenter should notice (shown in the picker). */
  note?: string
}

const OKAFOR_TARGET = { anaesthetistId: ANAE.rutherford, dateISO: '2026-12-09', session: 'AM' as const }
const WHITFORD_TARGET = { anaesthetistId: ANAE.strand, dateISO: '2026-12-16', session: 'PM' as const }

/**
 * The uploadable lists. Mr Okafor's targets a session in Dr Rutherford's
 * schedule that holds no List (Wed 5 Aug AM), so its first decision creates
 * the List; it arrives from the practice PA's own address, not Mr Okafor's
 * first office contact, and prints one NHI wrongly. Mr Whitford's targets Dr
 * Strand's existing Wed 12 Aug PM List, arrives from the practice inbox (his
 * first office contact) and has one row with no NHI. Neither touches a
 * scripted beat's List.
 */
export const PDF_LIST_SAMPLES: readonly PdfListSample[] = [
  {
    id: 'PDF-OKAFOR-0805',
    fileName: 'Okafor theatre list Wed 9 Dec AM.pdf',
    surgeonId: SURG.okafor,
    surgeonName: 'Mr C. Okafor',
    hospitalId: HOSP.forte,
    hospitalName: 'Forte Health',
    subject: 'Operating list · Wednesday 9 December (AM)',
    defaultSender: 'leanne.pa@avonsidesurgical.example',
    target: OKAFOR_TARGET,
    note: 'One NHI is printed wrongly: ZAA0068 fails its check digit; the correct NHI is ZAA0067.',
    rows: [
      { id: 'R1', nhi: 'ZAF4434', name: 'Brian Holt', dobISO: '1972-04-22', scheduledTime: '08:00', ethnicityCode: '61118', procedureText: 'R inguinal hernia mesh' },
      { id: 'R2', nhi: 'ZAA0068', name: 'Margaret Ellison', dobISO: '1954-07-18', scheduledTime: '09:15', ethnicityCode: '11111', procedureText: 'lap chole +/- IOC' },
      { id: 'R3', nhi: 'ZQB1003', name: 'Hemi Parata', dobISO: '1979-09-25', scheduledTime: '10:30', ethnicityCode: '21111', procedureText: 'gastro/colon' },
    ],
  },
  {
    id: 'PDF-WHITFORD-0812',
    fileName: 'Whitford cataract list Wed 16 Dec PM.pdf',
    surgeonId: SURG.whitford,
    surgeonName: 'Mr J. Whitford',
    hospitalId: HOSP.ces,
    hospitalName: 'Christchurch Eye Surgery',
    subject: 'Cataract list · Wednesday 16 December (PM)',
    defaultSender: 'bookings@merivaleeye.example',
    target: WHITFORD_TARGET,
    note: 'One row has no NHI: it waits at intake, with a stub on the List.',
    rows: [
      { id: 'R1', nhi: 'ZAG5541', name: 'Coral Bennett', dobISO: '1985-08-06', scheduledTime: '13:00', ethnicityCode: '11111', procedureText: 'phaco + IOL L' },
      { id: 'R2', nhi: 'ZAL9972', name: 'Annette Riley', dobISO: '1990-05-12', scheduledTime: '13:40', ethnicityCode: '52111', procedureText: 'blephs' },
      { id: 'R3', name: 'Joan Pickering', dobISO: '1949-03-09', scheduledTime: '14:20', ethnicityCode: '11111', procedureText: 'phaco + IOL R' },
    ],
  },
]

/**
 * One re-sent version of each sample (the rooms re-send the whole List on
 * every change): one changed time and one new patient. Mr Okafor's arrives
 * from the practice inbox, a different address in the same practice, so the
 * List's sender changes when one of its rows is decided (US-02.2.4's
 * later-address rule, `listOrigin.ts`).
 */
export const PDF_RESEND_SAMPLES: readonly PdfListSample[] = [
  {
    ...PDF_LIST_SAMPLES[0]!,
    id: 'PDF-OKAFOR-0805-R2',
    fileName: 'Okafor theatre list Wed 9 Dec AM (updated).pdf',
    subject: 'Operating list · Wednesday 9 December (AM) · updated',
    defaultSender: 'admin@avonsidesurgical.example',
    resendOf: 'PDF-OKAFOR-0805',
    note: 'Re-sent from the practice inbox: Margaret Ellison moved to 09:45, and Ruth Calder added.',
    rows: [
      { id: 'R1', nhi: 'ZAF4434', name: 'Brian Holt', dobISO: '1972-04-22', scheduledTime: '08:00', ethnicityCode: '61118', procedureText: 'R inguinal hernia mesh' },
      { id: 'R2', nhi: 'ZAA0067', name: 'Margaret Ellison', dobISO: '1954-07-18', scheduledTime: '09:45', ethnicityCode: '11111', procedureText: 'lap chole +/- IOC' },
      { id: 'R3', nhi: 'ZQB1003', name: 'Hemi Parata', dobISO: '1979-09-25', scheduledTime: '10:30', ethnicityCode: '21111', procedureText: 'gastro/colon' },
      { id: 'R4', nhi: 'ZQC1009', name: 'Ruth Calder', dobISO: '1967-02-03', scheduledTime: '11:30', ethnicityCode: '11111', procedureText: 'lap chole' },
    ],
  },
  {
    ...PDF_LIST_SAMPLES[1]!,
    id: 'PDF-WHITFORD-0812-R2',
    fileName: 'Whitford cataract list Wed 16 Dec PM (updated).pdf',
    subject: 'Cataract list · Wednesday 16 December (PM) · updated',
    resendOf: 'PDF-WHITFORD-0812',
    note: 'Re-sent: Coral Bennett moved to 13:15, and Peter Lusk added.',
    rows: [
      { id: 'R1', nhi: 'ZAG5541', name: 'Coral Bennett', dobISO: '1985-08-06', scheduledTime: '13:15', ethnicityCode: '11111', procedureText: 'phaco + IOL L' },
      { id: 'R2', nhi: 'ZAL9972', name: 'Annette Riley', dobISO: '1990-05-12', scheduledTime: '13:40', ethnicityCode: '52111', procedureText: 'blephs' },
      { id: 'R3', name: 'Joan Pickering', dobISO: '1949-03-09', scheduledTime: '14:20', ethnicityCode: '11111', procedureText: 'phaco + IOL R' },
      { id: 'R4', nhi: 'ZQD1004', name: 'Peter Lusk', dobISO: '1952-06-16', scheduledTime: '15:00', ethnicityCode: '11111', procedureText: 'phaco + IOL R' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Facsimile (an SVG data URL built from the rows, so it stays in step)
// ---------------------------------------------------------------------------

/** The row id a header value is keyed under (`pdfValueKey(PDF_HEADER_ROW, 'surgeon')`). */
export const PDF_HEADER_ROW = 'header'

/** One read value's key on the page and in the values table: `${rowId}:${field}` (`PDF_HEADER_ROW` for the header). */
export function pdfValueKey(rowId: string, field: PdfReadField): string {
  return `${rowId}:${field}`
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * What a facsimile is drawn from: a sample of the old upload library (`PdfListSample`, its day and session in
 * `target`) or a rooms' mailbox PDF (`MailboxPdfSample`, `hospitalDownloads.ts`: `dateISO`, `session`, a named
 * `anaesthetist`, `scanned`). Either carries what its header prints; `anaesthetistName` names the anaesthetist outright.
 */
export interface FacsimileSource {
  id?: string
  hospitalName: string
  surgeonName: string
  subject: string
  rows: readonly PdfListSampleRow[]
  dateISO?: string
  session?: Session
  /** The old library's suggested List; its anaesthetist is printed when the source names none. */
  target?: { dateISO: string; session: Session; anaesthetistId?: string }
  anaesthetistName?: string
  anaesthetist?: { name: string }
  /** The address the PDF came from (a mailbox PDF's), or the old library's prefilled sender: names the letterhead's practice. */
  senderEmail?: string
  defaultSender?: string
  /** Drawn with a scan's look (a grey wash, a skewed page, grain, greyer ink). */
  scanned?: boolean
}

function anaesthetistNameOf(src: FacsimileSource): string | undefined {
  if (src.anaesthetistName !== undefined) return src.anaesthetistName
  if (src.anaesthetist !== undefined) return src.anaesthetist.name
  const id = src.target?.anaesthetistId
  return id !== undefined && id !== '' ? ANAESTHETISTS.find((a) => a.registrationNumber === id)?.name : undefined
}

/**
 * The header values a facsimile prints, each the same string the reader is given for it (a mailbox PDF's are
 * `mailboxPdfHeaderValues`): surgeon, hospital, the day in full, the session, and the anaesthetist when one is named.
 */
export function facsimileHeaderValues(src: FacsimileSource): Partial<Record<PdfHeaderField, string>> {
  const dateISO = src.dateISO ?? src.target?.dateISO
  const session = src.session ?? src.target?.session
  const anaesthetist = anaesthetistNameOf(src)
  return {
    surgeon: src.surgeonName,
    hospital: src.hospitalName,
    ...(dateISO !== undefined ? { date: longDay(dateISO) } : {}),
    ...(session !== undefined ? { session } : {}),
    ...(anaesthetist !== undefined ? { anaesthetist } : {}),
  }
}

/** One value the facsimile prints: its key (`pdfValueKey`), its text origin (x and baseline) and what is printed. */
export interface FacsimileTextSpot {
  key: string
  rowId: string
  field: PdfReadField
  x: number
  baseline: number
  /** As printed (a long value is cut to its column). */
  text: string
  fontSize: number
  mono: boolean
}

const MONO_FIELDS: ReadonlySet<PdfReadField> = new Set<PdfReadField>(['nhi', 'scheduledTime', 'dobISO', 'ethnicityCode'])

/** Cut text to the width its column gives it (an average glyph is about 0.6 of the size in mono, 0.52 otherwise). */
function fitText(text: string, width: number, fontSize: number, mono: boolean): string {
  const max = Math.max(1, Math.floor(width / (fontSize * (mono ? 0.6 : 0.52))))
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`
}

/**
 * Where the facsimile prints each value, from the reader's layout (`PDF_LAYOUT`): a header value at its spot's x and
 * baseline, row `i`'s values at their column's x and `rowTop + i * rowPitch + rowBaselineOffset`, so each read value's
 * box (`headerBoxes`, `rowBox`) encloses its text. Only the first page's rows are printed. `buildFacsimile` draws these.
 */
export function facsimileTextSpots(src: FacsimileSource): FacsimileTextSpot[] {
  const out: FacsimileTextSpot[] = []
  const header = facsimileHeaderValues(src)
  for (const field of PDF_HEADER_FIELDS) {
    const value = header[field]
    if (value === undefined || value.trim() === '') continue
    const spot = PDF_LAYOUT.header[field]
    out.push({ key: pdfValueKey(PDF_HEADER_ROW, field), rowId: PDF_HEADER_ROW, field, x: spot.x, baseline: spot.baseline, text: fitText(value, spot.width, spot.fontSize, false), fontSize: spot.fontSize, mono: false })
  }
  src.rows.slice(0, PDF_ROWS_PER_PAGE).forEach((row, i) => {
    const values = readValuesOfRow(row)
    const baseline = PDF_LAYOUT.rowTop + i * PDF_LAYOUT.rowPitch + PDF_LAYOUT.rowBaselineOffset
    for (const field of PDF_ROW_READ_FIELDS) {
      const value = values[field]
      if (value === undefined || value.trim() === '') continue
      const col = PDF_LAYOUT.columns[field]
      const mono = MONO_FIELDS.has(field)
      out.push({ key: pdfValueKey(row.id, field), rowId: row.id, field, x: col.x, baseline, text: fitText(value, col.width, col.fontSize, mono), fontSize: col.fontSize, mono })
    }
  })
  return out
}

/** A small deterministic hash (FNV-1a) and a generator seeded from it: a scan's grain is the same on every draw. */
function seededSequence(seed: string): () => number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  let state = h || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/** A scan's paper: a grey wash, the page slightly skewed on the glass, grain and a few specks. Pure. */
function scanPaper(width: number, height: number, seed: string): string {
  const next = seededSequence(seed)
  const specks = Array.from({ length: 36 }, () => {
    const x = (next() * width).toFixed(1)
    const y = (next() * height).toFixed(1)
    const r = (0.4 + next() * 0.9).toFixed(2)
    const o = (0.12 + next() * 0.25).toFixed(2)
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#55595A" fill-opacity="${o}"/>`
  }).join('')
  const turn = (-0.4 - next() * 0.5).toFixed(2)
  const grainSeed = Math.floor(next() * 1000)
  return `
    <defs>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${grainSeed}"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.10"/></feComponentTransfer>
      </filter>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#C9CBC7" stop-opacity="0.55"/>
        <stop offset="0.04" stop-color="#C9CBC7" stop-opacity="0"/>
        <stop offset="0.96" stop-color="#C9CBC7" stop-opacity="0"/>
        <stop offset="1" stop-color="#C9CBC7" stop-opacity="0.45"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#E7E8E4"/>
    <rect x="3" y="3" width="${width - 6}" height="${height - 6}" fill="#F6F6F2" stroke="#D9DAD5" stroke-width="1" transform="rotate(${turn} ${width / 2} ${height / 2})"/>
    <rect width="${width}" height="${height}" fill="url(#glass)"/>
    <rect width="${width}" height="${height}" filter="url(#grain)"/>
    ${specks}`
}

/** The colours of a printed page, and of the same page scanned (greyer ink). A paper facsimile, not app UI. */
function inkOf(scanned: boolean) {
  return scanned
    ? { ink: '#3A3F3D', soft: '#5F6663', faint: '#8E9491', rule: '#C4C8C3', strong: '#6C7370', band: '#E3E5E0', panel: '#ECEDE8', brand: '#4B5552', paper: '#F6F6F2' }
    : { ink: '#172320', soft: '#4F5A56', faint: '#86908C', rule: '#D9DFDC', strong: '#58635F', band: '#EEF1F0', panel: '#F5F7F6', brand: '#1F3B57', paper: '#FFFFFF' }
}

/** The rooms' letterhead: its practice name, a plain address and a phone line (made up and generic). */
export interface FacsimileLetterhead {
  practice: string
  address: string
  contact: string
}

/** The specialty words a rooms' email domain may end in, and the practice name each gives. */
const PRACTICE_KINDS: readonly { suffix: string; name: string }[] = [
  { suffix: 'colorectal', name: 'Colorectal' },
  { suffix: 'gynaecology', name: 'Gynaecology' },
  { suffix: 'surgical', name: 'Surgical Rooms' },
  { suffix: 'womens', name: "Women's Health" },
  { suffix: 'ortho', name: 'Orthopaedics' },
  { suffix: 'eye', name: 'Eye Clinic' },
  { suffix: 'ent', name: 'ENT' },
]

const STREETS = ['Rata Street', 'Kowhai Lane', 'Totara Avenue', 'Matai Road', 'Rimu Terrace', 'Miro Place']

const titleCase = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

/**
 * The letterhead a facsimile prints, from the address the PDF came from: "leanne.pa@avonsidesurgical.example" gives
 * "Avonside Surgical Rooms" in Avonside; an address that names no practice gives the surgeon's own rooms. The street
 * and phone number come from the seeded sequence, so the same source always prints the same letterhead.
 */
export function facsimileLetterhead(src: FacsimileSource): FacsimileLetterhead {
  const sender = src.senderEmail ?? src.defaultSender
  const stem = sender?.split('@')[1]?.split('.')[0]?.toLowerCase() ?? ''
  const kind = PRACTICE_KINDS.find((k) => stem.endsWith(k.suffix) && stem.length > k.suffix.length + 2)
  const place = kind !== undefined ? titleCase(stem.slice(0, -kind.suffix.length)) : undefined
  const surname = src.surgeonName.trim().split(/\s+/).pop() ?? 'Surgical'
  const practice = kind !== undefined && place !== undefined ? `${place} ${kind.name}` : `${surname} Surgical Rooms`
  const next = seededSequence(`letterhead|${practice}`)
  const level = 1 + Math.floor(next() * 3)
  const number = 10 + Math.floor(next() * 180)
  const street = STREETS[Math.floor(next() * STREETS.length)]!
  const phone = `03 555 0${100 + Math.floor(next() * 900)}`
  const fax = `03 555 0${100 + Math.floor(next() * 900)}`
  const suburb = place !== undefined ? `${place}, ` : ''
  return {
    practice,
    address: `Level ${level}, ${number} ${street}, ${suburb}Christchurch`,
    contact: `Phone ${phone} · Fax ${fax}${sender !== undefined ? ` · ${sender}` : ''}`,
  }
}

/** When the rooms printed the List: a weekday afternoon one to three days before it, from the seeded sequence. */
export function facsimilePrintedAt(src: FacsimileSource): string | undefined {
  const dateISO = src.dateISO ?? src.target?.dateISO
  if (dateISO === undefined) return undefined
  const next = seededSequence(`printed|${src.id ?? src.subject}`)
  const day = addDaysISO(dateISO, -(1 + Math.floor(next() * 3)))
  const [y, m, d] = day.split('-')
  const hour = 13 + Math.floor(next() * 4)
  const minute = Math.floor(next() * 60)
  return `${Number(d)}/${m}/${y} ${hour}:${String(minute).padStart(2, '0')}`
}

const HEADER_LABELS: Record<PdfHeaderField, string> = { surgeon: 'Surgeon', hospital: 'Hospital', date: 'Date', session: 'Session', anaesthetist: 'Anaesthetist' }

/**
 * The page a rooms' PDF shows (an SVG data URL), a full A4 page (`PDF_PAGE`) drawn from the reader's layout so each
 * value read sits where its box lands (`facsimileTextSpots`): the rooms' letterhead, a "Theatre list" title over the
 * email's subject, the meta block (each value after its label), a ruled table with column labels and one line per
 * patient (time, NHI, patient, date of birth, procedure, ethnicity code), and the footer at the foot of the page
 * (when it was printed, a "Checked by" line, the page number). Only the first page's rows are drawn. A scan is drawn
 * with a scan's look. Deterministic.
 */
export function buildFacsimile(sample: FacsimileSource): string {
  const width = PDF_PAGE.width
  const height = pdfPageHeight(sample.rows.length)
  const scanned = sample.scanned === true
  const c = inkOf(scanned)
  const L = PDF_LAYOUT
  const m = L.margin
  const right = width - m
  const spots = facsimileTextSpots(sample)
  const letterhead = facsimileLetterhead(sample)
  const rowsOnPage = Math.min(sample.rows.length, PDF_ROWS_PER_PAGE)
  const pages = pdfPageCount(sample.rows.length)
  const printed = facsimilePrintedAt(sample)

  const head = `
    <text x="${m}" y="${L.letterhead.nameBaseline}" font-size="20" font-weight="700" fill="${c.brand}" letter-spacing="0.2">${esc(fitText(letterhead.practice, right - m, 20, false))}</text>
    <text x="${m}" y="${L.letterhead.addressBaseline}" font-size="9" fill="${c.soft}">${esc(fitText(letterhead.address, right - m, 9, false))}</text>
    <text x="${m}" y="${L.letterhead.contactBaseline}" font-size="9" fill="${c.soft}">${esc(fitText(letterhead.contact, right - m, 9, false))}</text>
    <rect x="${m}" y="${L.letterhead.ruleY - 1}" width="${right - m}" height="2" fill="${c.brand}"${scanned ? ' fill-opacity="0.75"' : ''}/>
    <text x="${m}" y="${L.title.baseline}" font-size="18" font-weight="700" fill="${c.ink}">Theatre list</text>
    <text x="${m}" y="${L.title.subtitleBaseline}" font-size="10" fill="${c.soft}">${esc(fitText(sample.subject, right - m, 10, false))}</text>
    <rect x="${m}" y="${L.meta.top}" width="${right - m}" height="${L.meta.bottom - L.meta.top}" fill="${c.panel}" stroke="${c.rule}" stroke-width="0.75"/>`
  const headerLabels = PDF_HEADER_FIELDS.map((f) => {
    const spot = L.header[f]
    return `<text x="${L.headerLabelX[f]}" y="${spot.baseline}" font-size="9" font-weight="700" fill="${c.faint}">${HEADER_LABELS[f]}</text>`
  }).join('')

  const tableBottom = L.rowTop + Math.max(rowsOnPage, 1) * L.rowPitch
  const columnBand = `<rect x="${m}" y="${L.columnBandTop}" width="${right - m}" height="${L.rowTop - L.columnBandTop}" fill="${c.band}"/>
    <line x1="${m}" y1="${L.columnBandTop}" x2="${right}" y2="${L.columnBandTop}" stroke="${c.strong}" stroke-width="1"/>
    <line x1="${m}" y1="${L.rowTop}" x2="${right}" y2="${L.rowTop}" stroke="${c.strong}" stroke-width="0.75"/>`
  const columnLabels = Object.values(L.columns)
    .map((col) => `<text x="${col.x}" y="${L.columnLabelBaseline}" font-size="8" font-weight="700" fill="${c.soft}" letter-spacing="0.6">${col.label}</text>`)
    .join('')
  const rules = Array.from({ length: rowsOnPage }, (_, i) => {
    const y = L.rowTop + (i + 1) * L.rowPitch
    const last = i === rowsOnPage - 1
    return `<line x1="${m}" y1="${y}" x2="${right}" y2="${y}" stroke="${last ? c.strong : c.rule}" stroke-width="${last ? 1 : 0.75}"/>`
  }).join('')
  const empty = rowsOnPage === 0 ? `<text x="${m}" y="${L.rowTop + L.rowBaselineOffset}" font-size="10" fill="${c.faint}">No patients listed.</text><line x1="${m}" y1="${tableBottom}" x2="${right}" y2="${tableBottom}" stroke="${c.strong}" stroke-width="1"/>` : ''
  const values = spots
    .map((s) => {
      const weight = s.field === 'surgeon' ? ' font-weight="700"' : ''
      const family = s.mono ? ' font-family="ui-monospace, Menlo, monospace"' : ''
      const fill = s.field === 'procedureText' ? c.soft : c.ink
      return `<text x="${s.x}" y="${s.baseline}" font-size="${s.fontSize}"${weight}${family} fill="${fill}" data-key="${esc(s.key)}">${esc(s.text)}</text>`
    })
    .join('')
  const count = `<text x="${right}" y="${tableBottom + 16}" text-anchor="end" font-size="9" fill="${c.faint}">${sample.rows.length === 1 ? '1 patient' : `${sample.rows.length} patients`}</text>`

  const footRule = height - L.footerRuleFromBottom
  const footBase = height - L.footerBaselineFromBottom
  const footer = `
    <line x1="${m}" y1="${footRule}" x2="${right}" y2="${footRule}" stroke="${c.rule}" stroke-width="0.75"/>
    <text x="${m}" y="${footBase}" font-size="8.5" fill="${c.faint}">${printed !== undefined ? `Printed ${esc(printed)}` : 'Printed copy'}</text>
    <text x="${m + 170}" y="${footBase}" font-size="8.5" fill="${c.faint}">Checked by</text>
    <line x1="${m + 220}" y1="${footBase + 2}" x2="${m + 330}" y2="${footBase + 2}" stroke="${c.faint}" stroke-width="0.75"/>
    <text x="${right}" y="${footBase}" text-anchor="end" font-size="8.5" fill="${c.faint}">Page 1 of ${pages}</text>
    <text x="${m}" y="${footBase + 14}" font-size="7.5" fill="${c.faint}">${esc(fitText(`${letterhead.practice} · Confidential patient information`, right - m, 7.5, false))}</text>`

  const paper = scanned ? scanPaper(width, height, sample.id ?? `${sample.surgeonName}|${sample.subject}`) : `<rect width="${width}" height="${height}" fill="${c.paper}"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Helvetica, Arial, sans-serif">
    ${paper}
    ${head}
    ${headerLabels}
    ${columnBand}
    ${columnLabels}
    ${rules}
    ${empty}
    ${values}
    ${count}
    ${footer}
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * A page nothing can be read from (an unreadable PDF's facsimile): a full A4 page of a scan's paper with faint bars
 * where the letterhead, title, meta block, rows and footer would be, and no text. The same `seed`, the same page.
 */
export function buildUnreadableFacsimile(seed = 'unreadable'): string {
  const width = PDF_PAGE.width
  const height = pdfPageHeight()
  const L = PDF_LAYOUT
  const lines = 14
  const next = seededSequence(`faint|${seed}`)
  const bar = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x}" y="${y}" width="${Math.round(w)}" height="${h}" rx="2" fill="#B9BDB9" fill-opacity="${(0.16 + next() * 0.14).toFixed(2)}"/>`
  const m = L.margin
  const right = width - m
  const head = [
    bar(m, L.letterhead.nameBaseline - 16, 200 + next() * 80, 16),
    bar(m, L.letterhead.addressBaseline - 7, 220 + next() * 60, 7),
    bar(m, L.letterhead.contactBaseline - 7, 180 + next() * 80, 7),
    bar(m, L.letterhead.ruleY - 1, right - m, 2),
    bar(m, L.title.baseline - 14, 110 + next() * 20, 14),
    bar(m, L.title.subtitleBaseline - 8, 180 + next() * 80, 8),
    ...PDF_HEADER_FIELDS.map((f) => bar(L.header[f].x, L.header[f].baseline - 9, L.header[f].width * (0.4 + next() * 0.4), 9)),
    ...PDF_HEADER_FIELDS.map((f) => bar(L.headerLabelX[f], L.header[f].baseline - 8, 40 + next() * 20, 8)),
    bar(m, L.columnBandTop, right - m, L.rowTop - L.columnBandTop),
  ].join('')
  const rows = Array.from({ length: lines }, (_, i) => {
    const y = L.rowTop + i * L.rowPitch + L.rowBaselineOffset - 9
    return Object.values(L.columns)
      .filter(() => next() > 0.25)
      .map((col) => bar(col.x, y, col.width * (0.45 + next() * 0.45), 8))
      .join('')
  }).join('')
  const foot = [
    bar(m, height - L.footerRuleFromBottom, right - m, 1),
    bar(m, height - L.footerBaselineFromBottom - 7, 120 + next() * 40, 7),
    bar(right - 60, height - L.footerBaselineFromBottom - 7, 60, 7),
  ].join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${scanPaper(width, height, `faint|${seed}`)}
    ${head}
    ${rows}
    ${foot}
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** A facsimile's page size, from its data URL's `viewBox` (undefined when it carries none or cannot be decoded). */
export function facsimileSize(dataUrl: string): { width: number; height: number } | undefined {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return undefined
  let svg: string
  try {
    svg = decodeURIComponent(dataUrl.slice(comma + 1))
  } catch {
    return undefined
  }
  const match = /viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/.exec(svg)
  if (match === null) return undefined
  const width = Number(match[1])
  const height = Number(match[2])
  return width > 0 && height > 0 ? { width, height } : undefined
}


// ---------------------------------------------------------------------------
// Rows: as read, corrected, checked
// ---------------------------------------------------------------------------

export const PDF_ROW_FIELD_LABELS: Record<PdfRowField, string> = {
  nhi: 'NHI',
  name: 'Name',
  dobISO: 'Date of birth',
  scheduledTime: 'Time',
  ethnicityCode: 'Ethnicity',
}

/** The row as read with its corrections applied (the latest per field wins). The wording is never corrected. */
export function effectivePdfRow(row: Pick<PdfListRow, 'asRead' | 'corrections'>): PdfRowAsRead {
  const out: PdfRowAsRead = { ...row.asRead }
  for (const c of row.corrections) {
    const v = c.to.trim()
    if (c.field === 'name') out.name = v
    else if (v === '') delete out[c.field]
    else out[c.field] = v
  }
  return out
}

export type PdfRowIssueCode = 'nhiInvalid' | 'noNhi'

export interface PdfRowIssue {
  code: PdfRowIssueCode
  message: string
  /** True when the list cannot be sent until it is corrected. */
  blocksSend: boolean
}

export const NO_NHI_WAITS = 'No NHI: will wait at intake'

/** The one NHI check on a PDF row (US-11.1.2): an invalid NHI blocks the send; a blank one is allowed and waits at intake. */
export function pdfRowIssues(row: Pick<PdfListRow, 'asRead' | 'corrections'>): PdfRowIssue[] {
  const nhi = effectivePdfRow(row).nhi?.trim() ?? ''
  if (nhi === '') return [{ code: 'noNhi', message: NO_NHI_WAITS, blocksSend: false }]
  const v = validateNhi(nhi)
  if (!v.valid) return [{ code: 'nhiInvalid', message: `NHI ${nhi} is not valid: ${(v.reason ?? 'check it').replace(/\.$/, '')}. Correct it before sending.`, blocksSend: true }]
  return []
}

/** The rows the import stages: the effective row, the rooms' wording verbatim, the surgeon as the master holds them. */
export function pdfRowIncoming(
  list: Pick<SurgeonPdfList, 'hospitalId' | 'target'>,
  row: Pick<PdfListRow, 'asRead' | 'corrections'>,
  surgeon: { name: string; hpiId?: string } | undefined,
): IncomingBookingFields {
  const r = effectivePdfRow(row)
  const nhi = r.nhi?.trim() ?? ''
  const v = nhi !== '' ? validateNhi(nhi) : undefined
  return {
    hospitalId: list.hospitalId,
    dateISO: list.target.dateISO,
    session: list.target.session,
    ...(surgeon !== undefined ? { surgeon: { name: surgeon.name, ...(surgeon.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) } } : {}),
    ...(r.scheduledTime !== undefined ? { scheduledTime: r.scheduledTime } : {}),
    patient: {
      name: r.name,
      ...(nhi !== '' ? { nhi: v?.valid === true ? v.normalised : nhi } : {}),
      ...(r.dobISO !== undefined ? { dobISO: r.dobISO } : {}),
      ...(r.ethnicityCode !== undefined ? { ethnicityCode: r.ethnicityCode } : {}),
    },
    procedure: { text: r.procedureText },
    hospitalStatus: 'booked',
  }
}

// ---------------------------------------------------------------------------
// A re-sent List
// ---------------------------------------------------------------------------

/**
 * A re-sent List (**our reading**, DM-61; US-02.2.1 says a later PDF for the
 * same List is an update to merge, not how it is matched): the latest earlier
 * list, already sent to matching, for the same surgeon, hospital, date and
 * session, 33's matcher keys. A patient left off the re-sent List is not
 * detected (US-02.2.3, Future Work).
 */
export function resentPdfListOf(
  lists: Readonly<Record<string, SurgeonPdfList>> | readonly SurgeonPdfList[],
  candidate: Pick<SurgeonPdfList, 'surgeonId' | 'hospitalId' | 'target'> & { id?: string },
): SurgeonPdfList | undefined {
  const all = Array.isArray(lists) ? lists : Object.values(lists)
  return all
    .filter(
      (l) =>
        l.id !== candidate.id &&
        l.status === 'sent' &&
        l.surgeonId === candidate.surgeonId &&
        l.hospitalId === candidate.hospitalId &&
        l.target.dateISO === candidate.target.dateISO &&
        l.target.session === candidate.target.session,
    )
    .sort((a, b) => b.receivedAtISO.localeCompare(a.receivedAtISO) || b.id.localeCompare(a.id))[0]
}

/** The label each sent list's import batch carries: "Mr C. Okafor's PDF list · Wed 5 Aug AM". */
export function pdfListBatchLabel(surgeonName: string, sessionText: string): string {
  return `${surgeonName}'s PDF list · ${sessionText}`
}

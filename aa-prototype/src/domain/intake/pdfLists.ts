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
  PdfFile,
  PdfListRow,
  PdfOrientation,
  PdfPaper,
  PdfReadField,
  PdfReadValue,
  PdfRowAsRead,
  PdfRowField,
  PdfScan,
  PdfTemplateId,
  PdfTemplateVariant,
  SurgeonPdfList,
  Session,
} from '../types'
import { validateNhi } from '../nhi'
import { longDay } from '../dateText'
import { DEMO_TODAY } from '../clock'
import { ANAE, ANAESTHETISTS, HOSP, SURG } from '../seed/cast'
import { PDF_PAGE, readValuesOfRow, simulateRead, type PdfHeaderField } from './pdfRead'
import { layoutPdfDocument, renderPdfPages, seededSequence, type PdfDocumentLayout, type PdfDocumentSource, type PdfSourceRow } from './pdfTemplates'
import { PageBuilder } from './pdfTemplates/engine'
import { frameOf, renderPage } from './pdfTemplates/render'

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
  /** The layout the rooms print in (`pdfTemplates/`), and its second look. */
  template?: PdfTemplateId
  variant?: PdfTemplateVariant
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
    // The practice calendar's agenda, printed from the browser.
    template: 'agenda',
    note: 'One NHI is printed wrongly: ZAA0068 fails its check digit; the correct NHI is ZAA0067.',
    rows: [
      { id: 'R1', nhi: 'ZAF4434', name: 'Brian Holt', dobISO: '1972-04-22', scheduledTime: '08:00', procedureText: 'R inguinal hernia mesh' },
      { id: 'R2', nhi: 'ZAA0068', name: 'Margaret Ellison', dobISO: '1954-07-18', scheduledTime: '09:15', procedureText: 'lap chole +/- IOC' },
      { id: 'R3', nhi: 'ZQB1003', name: 'Hemi Parata', dobISO: '1979-09-25', scheduledTime: '10:30', procedureText: 'gastro/colon' },
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
    // The practice's Word table under its logo.
    template: 'wordGrid',
    variant: 'logo',
    note: 'One row has no NHI: it waits at intake, with a stub on the List.',
    rows: [
      { id: 'R1', nhi: 'ZAG5541', name: 'Coral Bennett', dobISO: '1985-08-06', scheduledTime: '13:00', procedureText: 'phaco + IOL L' },
      { id: 'R2', nhi: 'ZAL9972', name: 'Annette Riley', dobISO: '1990-05-12', scheduledTime: '13:40', procedureText: 'blephs' },
      { id: 'R3', name: 'Joan Pickering', dobISO: '1949-03-09', scheduledTime: '14:20', procedureText: 'phaco + IOL R' },
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
      { id: 'R1', nhi: 'ZAF4434', name: 'Brian Holt', dobISO: '1972-04-22', scheduledTime: '08:00', procedureText: 'R inguinal hernia mesh' },
      { id: 'R2', nhi: 'ZAA0067', name: 'Margaret Ellison', dobISO: '1954-07-18', scheduledTime: '09:45', procedureText: 'lap chole +/- IOC' },
      { id: 'R3', nhi: 'ZQB1003', name: 'Hemi Parata', dobISO: '1979-09-25', scheduledTime: '10:30', procedureText: 'gastro/colon' },
      { id: 'R4', nhi: 'ZQC1009', name: 'Ruth Calder', dobISO: '1967-02-03', scheduledTime: '11:30', procedureText: 'lap chole' },
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
      { id: 'R1', nhi: 'ZAG5541', name: 'Coral Bennett', dobISO: '1985-08-06', scheduledTime: '13:15', procedureText: 'phaco + IOL L' },
      { id: 'R2', nhi: 'ZAL9972', name: 'Annette Riley', dobISO: '1990-05-12', scheduledTime: '13:40', procedureText: 'blephs' },
      { id: 'R3', name: 'Joan Pickering', dobISO: '1949-03-09', scheduledTime: '14:20', procedureText: 'phaco + IOL R' },
      { id: 'R4', nhi: 'ZQD1004', name: 'Peter Lusk', dobISO: '1952-06-16', scheduledTime: '15:00', procedureText: 'phaco + IOL R' },
    ],
  },
]

// ---------------------------------------------------------------------------
// The PDF as drawn and read (one layout pass: `pdfTemplates/`)
// ---------------------------------------------------------------------------

export { PDF_HEADER_ROW, pdfValueKey } from './pdfRead'

/**
 * What a rooms' PDF is drawn from: a sample of the old upload library (`PdfListSample`, its day and session in
 * `target`) or a rooms' mailbox PDF (`MailboxPdfSample`, `hospitalDownloads.ts`: `dateISO`, `session`, a named
 * `anaesthetist`, `scanned`). Either carries what its header prints; `anaesthetistName` names the anaesthetist outright.
 * `template` (and `variant`) is the layout it is printed in, `scan` how a scan sits, `practice` the sending practice
 * as printed (else read from the address it came from).
 */
export interface FacsimileSource {
  id?: string
  hospitalName: string
  surgeonName: string
  subject: string
  rows: readonly (PdfListSampleRow & { changed?: boolean })[]
  dateISO?: string
  session?: Session
  /** The old library's suggested List; its anaesthetist is printed when the source names none. */
  target?: { dateISO: string; session: Session; anaesthetistId?: string }
  anaesthetistName?: string
  anaesthetist?: { name: string }
  /** The address the PDF came from (a mailbox PDF's), or the old library's prefilled sender: names the practice when `practice` is not given. */
  senderEmail?: string
  defaultSender?: string
  /** The practice as printed on the PDF ("Avonside Surgical Rooms"): the surgeon's own, from the masters. */
  practice?: string
  /** A scan (lower confidences, the scan's look). */
  scanned?: boolean
  scan?: PdfScan
  template?: PdfTemplateId
  variant?: PdfTemplateVariant
  /** Patients a re-sent List prints as cancelled (red on a spreadsheet), never read. */
  cancelledRows?: readonly PdfListSampleRow[]
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
 * "Avonside Surgical Rooms" in Avonside; an address that names no practice gives the surgeon's own rooms. `practice`,
 * when given, is printed as it is. The street and phone number come from the seeded sequence.
 */
export function facsimileLetterhead(src: FacsimileSource): FacsimileLetterhead {
  const sender = src.senderEmail ?? src.defaultSender
  const stem = sender?.split('@')[1]?.split('.')[0]?.toLowerCase() ?? ''
  const kind = PRACTICE_KINDS.find((k) => stem.endsWith(k.suffix) && stem.length > k.suffix.length + 2)
  const place = kind !== undefined ? titleCase(stem.slice(0, -kind.suffix.length)) : undefined
  const surname = src.surgeonName.trim().split(/\s+/).pop() ?? 'Surgical'
  const practice = src.practice ?? (kind !== undefined && place !== undefined ? `${place} ${kind.name}` : `${surname} Surgical Rooms`)
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
    contact: `Phone ${phone} · Fax ${fax}`,
  }
}

/**
 * The layout a practice prints in when a source names none: each practice keeps to one (picked from its name), so a
 * practice's PDFs always look alike.
 */
export function defaultTemplateFor(practice: string): { template: PdfTemplateId; variant?: PdfTemplateVariant } {
  const choices: readonly { template: PdfTemplateId; variant?: PdfTemplateVariant }[] = [
    { template: 'oplistx' },
    { template: 'agenda' },
    { template: 'wordGrid' },
    { template: 'report' },
    { template: 'sheet' },
    { template: 'wordGrid', variant: 'logo' },
    { template: 'oplist' },
    { template: 'hospitalLetter' },
    { template: 'report', variant: 'letter' },
  ]
  const next = seededSequence(`practice|${practice}`)
  return choices[Math.floor(next() * choices.length) % choices.length]!
}

/** A printed row's values (no ethnicity: a rooms' PDF never prints one). */
function sourceRowOf(r: PdfListSampleRow): PdfSourceRow {
  return {
    id: r.id,
    name: r.name,
    procedureText: r.procedureText,
    ...(r.nhi !== undefined ? { nhi: r.nhi } : {}),
    ...(r.dobISO !== undefined ? { dobISO: r.dobISO } : {}),
    ...(r.scheduledTime !== undefined ? { scheduledTime: r.scheduledTime } : {}),
  }
}

/** The layout source for a facsimile source: its practice, layout, header values and rows as printed. */
export function pdfDocumentSourceOf(src: FacsimileSource): PdfDocumentSource {
  const practice = facsimileLetterhead(src).practice
  const chosen = src.template !== undefined ? { template: src.template, ...(src.variant !== undefined ? { variant: src.variant } : {}) } : defaultTemplateFor(practice)
  const scanned = src.scanned === true || src.scan !== undefined
  const anaesthetist = anaesthetistNameOf(src)
  return {
    seed: src.id ?? `${src.surgeonName}|${src.subject}`,
    ...chosen,
    practice,
    surgeonName: src.surgeonName,
    hospitalName: src.hospitalName,
    dateISO: src.dateISO ?? src.target?.dateISO ?? DEMO_TODAY,
    session: src.session ?? src.target?.session ?? 'AM',
    ...(anaesthetist !== undefined ? { anaesthetistName: anaesthetist } : {}),
    rows: src.rows.map((r) => ({ ...sourceRowOf(r), ...(r.changed === true ? { changed: true } : {}) })),
    ...(src.cancelledRows !== undefined ? { cancelledRows: src.cancelledRows.map(sourceRowOf) } : {}),
    ...(scanned ? { scan: src.scan ?? {} } : {}),
    header: facsimileHeaderValues(src),
  }
}

/** A facsimile source laid out in its layout (`layoutPdfDocument`): the pages and every read value's box. */
export function layoutFacsimile(src: FacsimileSource): PdfDocumentLayout {
  return layoutPdfDocument(pdfDocumentSourceOf(src))
}

/** Every page of a rooms' PDF, each an SVG data URL in its own units. Deterministic. */
export function buildFacsimilePages(src: FacsimileSource): string[] {
  return renderPdfPages(layoutFacsimile(src))
}

/** The first page of a rooms' PDF (an SVG data URL). Deterministic. */
export function buildFacsimile(src: FacsimileSource): string {
  return buildFacsimilePages(src)[0]!
}

/** A row the reader is given, with the sample's confidence overrides. */
type ReadableRow = PdfListSampleRow & { confidence?: Partial<Record<PdfReadField, number>> }

/** A rooms' PDF read: its pages, the reading (values, confidences, boxes) and how it is printed. */
export interface RoomsPdfReading {
  file: PdfFile
  headerRead: PdfReadValue[]
  rows: { id: string; read: PdfReadValue[] }[]
  template: PdfTemplateId
  templateVariant?: PdfTemplateVariant
  paper: PdfPaper
  orientation: PdfOrientation
  scan?: PdfScan
  scanned: boolean
  practice: string
}

/**
 * Reads a rooms' PDF as the mailbox does (D120): lays it out once, draws its pages from that layout and reads every
 * value printed, its box where the layout put its text, its confidence from the sample (lower on a scan, and lower
 * still for a value worked out rather than read).
 */
export function readRoomsPdf(
  src: Omit<FacsimileSource, 'rows'> & { fileName: string; headerConfidence?: Partial<Record<PdfHeaderField, number>>; rows: readonly (ReadableRow & { changed?: boolean })[] },
): RoomsPdfReading {
  const docSrc = pdfDocumentSourceOf(src)
  const layout = layoutPdfDocument(docSrc)
  const pages = renderPdfPages(layout)
  const scanned = docSrc.scan !== undefined
  const read = simulateRead({
    header: docSrc.header,
    ...(src.headerConfidence !== undefined ? { headerConfidence: src.headerConfidence } : {}),
    rows: src.rows.map((r) => ({ id: r.id, values: readValuesOfRow(r), ...(r.confidence !== undefined ? { confidence: r.confidence } : {}) })),
    scanned,
    spots: layout.spots,
  })
  return {
    file: { name: src.fileName, facsimile: pages[0]!, pages },
    headerRead: read.headerRead,
    rows: read.rows,
    template: layout.template,
    ...(layout.variant !== undefined ? { templateVariant: layout.variant } : {}),
    paper: layout.paper,
    orientation: layout.orientation,
    ...(layout.scan !== undefined ? { scan: layout.scan } : {}),
    scanned,
    practice: docSrc.practice,
  }
}

/** The fields a `SurgeonPdfList` takes from its reading (file, layout, scan, practice and header values). */
export function pdfListFieldsOf(reading: RoomsPdfReading): Pick<SurgeonPdfList, 'file' | 'template' | 'templateVariant' | 'paper' | 'orientation' | 'scan' | 'scanned' | 'practice' | 'headerRead'> {
  return {
    file: reading.file,
    template: reading.template,
    ...(reading.templateVariant !== undefined ? { templateVariant: reading.templateVariant } : {}),
    paper: reading.paper,
    orientation: reading.orientation,
    ...(reading.scan !== undefined ? { scan: reading.scan } : {}),
    ...(reading.scanned ? { scanned: true } : {}),
    practice: reading.practice,
    headerRead: reading.headerRead,
  }
}

/**
 * A page nothing can be read from (an unreadable PDF's facsimile): a full A4 portrait page of scan paper, the ghost of
 * a theatre list too faint to make out (grey bars where a heading, a table and a footer would be), and no text. The
 * same `seed`, the same page.
 */
export function buildUnreadableFacsimile(seed = 'unreadable'): string {
  const width = PDF_PAGE.width
  const height = PDF_PAGE.height
  const next = seededSequence(`faint|${seed}`)
  const b = new PageBuilder(width, height, { size: 9 })
  const bar = (x: number, y: number, w: number, h: number) => b.rect(x, y, Math.round(w), h, { fill: `rgba(120,124,120,${(0.1 + next() * 0.12).toFixed(2)})`, rx: 1.5 })
  bar(170, 52, 250 + next() * 40, 13)
  bar(220, 74, 150, 8)
  bar(44, 104, 180 + next() * 60, 8)
  bar(360, 104, 150 + next() * 40, 8)
  bar(36, 128, 523, 1.2)
  const cols = [36, 96, 250, 330, 470]
  for (let i = 0; i < 16; i++) {
    const y = 146 + i * 34
    for (const [j, x] of cols.entries()) if (next() > 0.2) bar(x, y, (j === 2 ? 60 : 110) * (0.45 + next() * 0.5), 6)
    if (next() > 0.4) bar(96, y + 11, 90 + next() * 60, 5)
    bar(36, y + 22, 523, 0.6)
  }
  bar(36, height - 60, 523, 0.8)
  bar(44, height - 48, 70, 6)
  bar(510, height - 48, 44, 6)
  const frame = frameOf(width, height, { skewDeg: -(0.4 + next() * 0.5) })
  return renderPage(b.page(), frame, { scanned: true, seed: `faint|${seed}` })
}

/** A facsimile's page size, from its data URL's `viewBox` (undefined when it carries none or cannot be decoded). */
export function facsimileSize(dataUrl: string): { width: number; height: number } | undefined {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return undefined
  let svg: string
  try {
    svg = decodeURIComponent(dataUrl.slice(comma + 1, comma + 1 + 600))
  } catch {
    try {
      svg = decodeURIComponent(dataUrl.slice(comma + 1))
    } catch {
      return undefined
    }
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

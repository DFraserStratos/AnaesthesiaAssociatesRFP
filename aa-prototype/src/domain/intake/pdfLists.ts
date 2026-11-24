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
  PdfRowAsRead,
  PdfRowField,
  SurgeonPdfList,
  Session,
} from '../types'
import { validateNhi } from '../nhi'
import { ANAE, HOSP, SURG } from '../seed/cast'

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

/** The re-sent version of a first sample, if one exists. */
export function resendSampleFor(sampleId: string): PdfListSample | undefined {
  return PDF_RESEND_SAMPLES.find((s) => s.resendOf === sampleId)
}

// ---------------------------------------------------------------------------
// Facsimile (an SVG data URL built from the rows, so it stays in step)
// ---------------------------------------------------------------------------

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildFacsimile(sample: Pick<PdfListSample, 'hospitalName' | 'surgeonName' | 'subject' | 'rows'>): string {
  const width = 460
  const rowH = 30
  const top = 150
  const height = top + sample.rows.length * rowH + 60
  const headerRow = `
    <text x="24" y="${top - 12}" font-size="10" font-weight="700" fill="#8A9490" letter-spacing="1.2">NHI</text>
    <text x="120" y="${top - 12}" font-size="10" font-weight="700" fill="#8A9490" letter-spacing="1.2">PATIENT</text>
    <text x="270" y="${top - 12}" font-size="10" font-weight="700" fill="#8A9490" letter-spacing="1.2">PROCEDURE</text>
    <text x="410" y="${top - 12}" font-size="10" font-weight="700" fill="#8A9490" letter-spacing="1.2">TIME</text>`
  const bodyRows = sample.rows
    .map((r, i) => {
      const y = top + i * rowH + 6
      return `
        <text x="24" y="${y}" font-size="12" font-family="monospace" fill="#172320">${esc(r.nhi ?? '')}</text>
        <text x="120" y="${y}" font-size="12" fill="#172320">${esc(r.name)}</text>
        <text x="270" y="${y}" font-size="11" fill="#58635F">${esc(r.procedureText.slice(0, 22))}</text>
        <text x="410" y="${y}" font-size="12" font-family="monospace" fill="#172320">${esc(r.scheduledTime ?? '')}</text>
        <line x1="24" y1="${y + 10}" x2="${width - 24}" y2="${y + 10}" stroke="#E2E7E5" stroke-width="1"/>`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#FFFFFF"/>
    <rect x="0" y="0" width="${width}" height="6" fill="#58635F"/>
    <text x="24" y="44" font-size="18" font-weight="700" fill="#172320">${esc(sample.hospitalName)}</text>
    <text x="24" y="66" font-size="12" fill="#58635F">${esc(sample.surgeonName)} · Theatre list</text>
    <text x="24" y="104" font-size="13" font-weight="600" fill="#172320">${esc(sample.subject)}</text>
    <line x1="24" y1="120" x2="${width - 24}" y2="120" stroke="#C9D1CE" stroke-width="1"/>
    ${headerRow}
    ${bodyRows}
    <text x="24" y="${height - 24}" font-size="10" fill="#8A9490">Emailed to the AA booking office · sample for the prototype</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
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

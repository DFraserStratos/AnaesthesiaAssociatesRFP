/**
 * Canned surgeon-list PDFs (Phase 11) — the "emailed PDF" pathway. Each is a
 * facsimile (letterhead + patient table, an inline SVG data URL, self-contained
 * and persist-safe) plus the rows a simulated parse would extract. One row in
 * the first PDF is DELIBERATELY WRONG (a mistyped NHI check digit) so the
 * extraction-review screen can demo read/edit-before-ingest; one row matches a
 * patient already booked on the target List so ingest updates rather than
 * duplicates.
 *
 * Parsing is simulated (the §10 fence: no real OCR); the rows are the "parse".
 */

import { HOSP } from '../seed/cast'
import { ANAE } from '../seed/cast'

export interface PdfRow {
  id: string
  /** As printed on the PDF (may be mistyped — the review screen validates + lets the office fix it). */
  nhi: string
  name: string
  dobISO: string
  operation: string
  scheduledTime: string
  ethnicityCode?: string
  /** Set on the deliberately-wrong row: what a reviewer should notice + correct. */
  deliberateError?: string
  /** The corrected NHI the demo script types (for the wrong row). */
  correctedNhi?: string
}

export interface SurgeonPdf {
  id: string
  fromSurgeon: string
  hospitalId: string
  hospitalName: string
  receivedLabel: string
  subject: string
  /** SVG data URL facsimile. */
  facsimile: string
  /** Suggested target List (Souter) to ingest onto. */
  targetList: { anaesthetistId: string; dateISO: string; session: 'AM' | 'PM' }
  rows: PdfRow[]
}

// ---------------------------------------------------------------------------
// Facsimile rendering (SVG data URL, built from the rows so it stays in sync)
// ---------------------------------------------------------------------------

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildFacsimile(pdf: Omit<SurgeonPdf, 'facsimile'>): string {
  const width = 460
  const rowH = 30
  const top = 150
  const height = top + pdf.rows.length * rowH + 60
  const headerRow = `
    <text x="24" y="${top - 12}" font-size="10" font-weight="700" fill="#8A9490" letter-spacing="1.2">NHI</text>
    <text x="120" y="${top - 12}" font-size="10" font-weight="700" fill="#8A9490" letter-spacing="1.2">PATIENT</text>
    <text x="270" y="${top - 12}" font-size="10" font-weight="700" fill="#8A9490" letter-spacing="1.2">PROCEDURE</text>
    <text x="410" y="${top - 12}" font-size="10" font-weight="700" fill="#8A9490" letter-spacing="1.2">TIME</text>`
  const bodyRows = pdf.rows
    .map((r, i) => {
      const y = top + i * rowH + 6
      return `
        <text x="24" y="${y}" font-size="12" font-family="monospace" fill="#172320">${esc(r.nhi)}</text>
        <text x="120" y="${y}" font-size="12" fill="#172320">${esc(r.name)}</text>
        <text x="270" y="${y}" font-size="11" fill="#58635F">${esc(r.operation.slice(0, 22))}</text>
        <text x="410" y="${y}" font-size="12" font-family="monospace" fill="#172320">${esc(r.scheduledTime)}</text>
        <line x1="24" y1="${y + 10}" x2="${width - 24}" y2="${y + 10}" stroke="#E2E7E5" stroke-width="1"/>`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#FFFFFF"/>
    <rect x="0" y="0" width="${width}" height="6" fill="#0D6E63"/>
    <text x="24" y="44" font-size="18" font-weight="700" fill="#172320">${esc(pdf.hospitalName)}</text>
    <text x="24" y="66" font-size="12" fill="#58635F">${esc(pdf.fromSurgeon)} · Theatre list</text>
    <text x="24" y="104" font-size="13" font-weight="600" fill="#172320">${esc(pdf.subject)}</text>
    <line x1="24" y1="120" x2="${width - 24}" y2="120" stroke="#C9D1CE" stroke-width="1"/>
    ${headerRow}
    ${bodyRows}
    <text x="24" y="${height - 24}" font-size="10" fill="#8A9490">Emailed to AA booking office · facsimile for the prototype demo</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function withFacsimile(pdf: Omit<SurgeonPdf, 'facsimile'>): SurgeonPdf {
  return { ...pdf, facsimile: buildFacsimile(pdf) }
}

// ---------------------------------------------------------------------------
// The two canned PDFs
// ---------------------------------------------------------------------------

export const SURGEON_PDFS: readonly SurgeonPdf[] = [
  withFacsimile({
    id: 'PDF-OKAFOR-0729',
    fromSurgeon: 'Mr C. Okafor',
    hospitalId: HOSP.forte,
    hospitalName: 'Forte Health',
    receivedLabel: 'Emailed Fri 24 Jul',
    subject: 'Operating list · Monday 27 July (AM)',
    targetList: { anaesthetistId: ANAE.souter, dateISO: '2026-07-27', session: 'AM' },
    rows: [
      // Row 1 matches Sarah Mitchell (CQY9304), already booked on Souter's Mon 27 AM
      // list — ingest updates, does not duplicate.
      { id: 'R1', nhi: 'CQY9304', name: 'Sarah Mitchell', dobISO: '1988-04-12', operation: 'Laparoscopic cholecystectomy', scheduledTime: '08:00', ethnicityCode: '11111' },
      // Row 2 is a clean new patient.
      { id: 'R2', nhi: 'ZAF4434', name: 'Brian Holt', dobISO: '1971-12-18', operation: 'Inguinal hernia repair', scheduledTime: '09:00', ethnicityCode: '61118' },
      // Row 3 has a mistyped NHI (bad check digit) — the reviewer corrects it before ingest.
      {
        id: 'R3',
        nhi: 'ZAA0068',
        name: 'Margaret Ellison',
        dobISO: '1954-03-14',
        operation: 'Left total hip replacement',
        scheduledTime: '10:15',
        ethnicityCode: '11111',
        deliberateError: 'The printed NHI ZAA0068 fails its check digit; the correct NHI is ZAA0067.',
        correctedNhi: 'ZAA0067',
      },
    ],
  }),
  withFacsimile({
    id: 'PDF-WHITFORD-0729',
    fromSurgeon: 'Mr J. Whitford',
    hospitalId: HOSP.ces,
    hospitalName: 'Christchurch Eye Surgery',
    receivedLabel: 'Emailed Fri 24 Jul',
    subject: 'Cataract list · Wednesday 29 July (AM)',
    targetList: { anaesthetistId: ANAE.souter, dateISO: '2026-07-29', session: 'AM' },
    rows: [
      { id: 'R1', nhi: 'ZAG5541', name: 'Coral Bennett', dobISO: '1985-04-02', operation: 'Cataract, phaco left', scheduledTime: '08:00', ethnicityCode: '11111' },
      { id: 'R2', nhi: 'ZAL9972', name: 'Annette Riley', dobISO: '1990-01-06', operation: 'Cataract, phaco right', scheduledTime: '08:40', ethnicityCode: '52111' },
    ],
  }),
] as const

export const PDF_BY_ID: ReadonlyMap<string, SurgeonPdf> = new Map(SURGEON_PDFS.map((p) => [p.id, p]))

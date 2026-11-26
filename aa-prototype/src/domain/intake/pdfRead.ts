/**
 * The simulated PDF reader's output (build plan Phase 68; D120, DM-16, US-02.2.1). Each value read from a rooms' PDF
 * carries a confidence (0 to 1) and its box on the page, set by the sample data; a value below the check threshold is
 * unsure, marked for the office to check, and lit where it sits on the page. A scan is read with lower confidences. A
 * PDF that cannot be made into a List is an arrival with no rows and a reason. How a real system reads a PDF is the
 * development team's choice: nothing here names a vendor or product, and no confidence score is ever shown.
 */

import type { PdfBox, PdfListRow, PdfReadField, PdfReadValue, PdfRowAsRead, PdfRowField, SurgeonPdfList } from '../types'

/** Below this confidence a value is unsure and marked to check (D120). */
export const PDF_CHECK_THRESHOLD = 0.8

/** A value the office should check. */
export function isUnsure(value: Pick<PdfReadValue, 'confidence'>): boolean {
  return value.confidence < PDF_CHECK_THRESHOLD
}

/** The unsure values among those read, in their order. */
export function unsureValues(values: readonly PdfReadValue[] | undefined): PdfReadValue[] {
  return (values ?? []).filter(isUnsure)
}

// ---------------------------------------------------------------------------
// The page (the facsimile's geometry: the boxes are the source of truth)
// ---------------------------------------------------------------------------

/**
 * The page the facsimile draws, in its own units (SVG user units). `buildFacsimile` (`pdfLists.ts`) prints
 * positioned text on a fixed grid: a header block, a column-label line, then one line per row at a fixed pitch.
 * Every value it prints today sits exactly where its box below says (the hospital, the surgeon line, and each row's
 * NHI, patient, procedure and time: same x, same baseline). The values it does not print yet (the date, session and
 * named anaesthetist in the header's right-hand column; each row's date of birth and ethnicity code, two columns to
 * the right of the time) have their place reserved here, which is why the page is wider than today's 460: the
 * facsimile prints them where their boxes land once it is drawn from this layout (Phase 70 renders the page from
 * these boxes). A long List runs onto further pages, rows starting at the same height.
 */
export const PDF_PAGE = { width: 648, height: 842 } as const

/** A printed value's place: its left edge, text baseline, the width it may take and its font size. */
export interface PdfLayoutSpot {
  x: number
  baseline: number
  width: number
  fontSize: number
}

/** A List's header fields as the reader reads them (D120). */
export type PdfHeaderField = 'surgeon' | 'hospital' | 'date' | 'session' | 'anaesthetist'

/** A row's fields as the reader reads them: the correctable ones plus the rooms' wording. */
export type PdfRowReadField = PdfRowField | 'procedureText'

export const PDF_HEADER_FIELDS: readonly PdfHeaderField[] = ['surgeon', 'hospital', 'date', 'session', 'anaesthetist']
export const PDF_ROW_READ_FIELDS: readonly PdfRowReadField[] = ['nhi', 'name', 'procedureText', 'scheduledTime', 'dobISO', 'ethnicityCode']

/**
 * The grid. The header's left column is the facsimile's own (the hospital at baseline 44 in 18pt, the surgeon line
 * at 66 in 12pt); its right column holds the date, session and named anaesthetist. Rows: the first baseline is
 * `rowTop + rowBaselineOffset` (156), then one every `rowPitch` (30); the column labels sit at
 * `columnLabelBaseline` (`rowTop - 12`); each column's x is the facsimile's. A box covers its text from
 * `baseline - fontSize` to `baseline + 4` (descenders), so a renderer's baseline is `box.y + fontSize`.
 */
export const PDF_LAYOUT = {
  margin: 24,
  header: {
    hospital: { x: 24, baseline: 44, width: 360, fontSize: 18 },
    surgeon: { x: 24, baseline: 66, width: 220, fontSize: 12 },
    date: { x: 424, baseline: 44, width: 200, fontSize: 12 },
    session: { x: 424, baseline: 66, width: 200, fontSize: 12 },
    anaesthetist: { x: 424, baseline: 88, width: 200, fontSize: 12 },
  } satisfies Record<PdfHeaderField, PdfLayoutSpot>,
  /** The column-label line's baseline (10pt, letter-spaced). */
  columnLabelBaseline: 138,
  rowTop: 150,
  rowPitch: 30,
  /** A row value's baseline below the row's top. */
  rowBaselineOffset: 6,
  /** Space kept below the last row (the facsimile's footer line). */
  footer: 60,
  columns: {
    nhi: { x: 24, width: 88, fontSize: 12, label: 'NHI' },
    name: { x: 120, width: 142, fontSize: 12, label: 'PATIENT' },
    procedureText: { x: 270, width: 132, fontSize: 11, label: 'PROCEDURE' },
    scheduledTime: { x: 410, width: 42, fontSize: 12, label: 'TIME' },
    dobISO: { x: 460, width: 80, fontSize: 12, label: 'DOB' },
    ethnicityCode: { x: 552, width: 72, fontSize: 12, label: 'ETHNICITY' },
  } satisfies Record<PdfRowReadField, { x: number; width: number; fontSize: number; label: string }>,
} as const

/** Rows that fit on one page under the header and above the footer. */
export const PDF_ROWS_PER_PAGE = Math.floor((PDF_PAGE.height - PDF_LAYOUT.rowTop - PDF_LAYOUT.footer) / PDF_LAYOUT.rowPitch)

/** The page height the facsimile draws for a List of `rowCount` rows (today's compact page, capped at a full page). */
export function pdfPageHeight(rowCount: number): number {
  const rows = Math.min(Math.max(rowCount, 0), PDF_ROWS_PER_PAGE)
  return PDF_LAYOUT.rowTop + rows * PDF_LAYOUT.rowPitch + PDF_LAYOUT.footer
}

function boxAt(page: number, spot: { x: number; width: number; fontSize: number }, baseline: number): PdfBox {
  return { page, x: spot.x, y: baseline - spot.fontSize, width: spot.width, height: spot.fontSize + 4 }
}

/** Each header field's box, on page 1. */
export function headerBoxes(): Record<PdfHeaderField, PdfBox> {
  const h = PDF_LAYOUT.header
  const at = (s: PdfLayoutSpot) => boxAt(1, s, s.baseline)
  return { surgeon: at(h.surgeon), hospital: at(h.hospital), date: at(h.date), session: at(h.session), anaesthetist: at(h.anaesthetist) }
}

/** A row field's box at row index `rowIndex` (0-based, across pages). */
export function rowBox(rowIndex: number, field: PdfRowReadField): PdfBox {
  const i = Math.max(0, Math.floor(rowIndex))
  const page = 1 + Math.floor(i / PDF_ROWS_PER_PAGE)
  const onPage = i % PDF_ROWS_PER_PAGE
  const baseline = PDF_LAYOUT.rowTop + onPage * PDF_LAYOUT.rowPitch + PDF_LAYOUT.rowBaselineOffset
  return boxAt(page, PDF_LAYOUT.columns[field], baseline)
}

// ---------------------------------------------------------------------------
// The simulated reading
// ---------------------------------------------------------------------------

/** A value read cleanly, unless the sample says otherwise. */
export const PDF_READ_CONFIDENCE = 0.97

/** A scan reads every value at this fraction of its confidence. */
export const PDF_SCAN_FACTOR = 0.82

/**
 * A value's confidence: the sample's override, else `PDF_READ_CONFIDENCE`; on a scan, times `PDF_SCAN_FACTOR`,
 * floored to hundredths. So on a scan a value with no override is unsure (0.97 times 0.82 floors to 0.79), and a
 * sample keeps a scanned value sure only by overriding it at 0.98 or more. Deterministic: no randomness.
 */
export function readConfidence(override: number | undefined, scanned: boolean): number {
  const base = Math.min(1, Math.max(0, override ?? PDF_READ_CONFIDENCE))
  return scanned ? Math.floor(base * PDF_SCAN_FACTOR * 100 + 1e-9) / 100 : base
}

/** One sample row for the reader: its values as printed, and optional per-field confidence overrides. */
export interface ReadSampleRow {
  id: string
  values: Partial<Record<PdfRowReadField, string>>
  confidence?: Partial<Record<PdfReadField, number>>
}

export interface SimulateReadInput {
  header: Partial<Record<PdfHeaderField, string>>
  /** Per-field overrides for the header's values. */
  headerConfidence?: Partial<Record<PdfHeaderField, number>>
  rows: readonly ReadSampleRow[]
  scanned?: boolean
}

export interface SimulatedRead {
  headerRead: PdfReadValue[]
  rows: { id: string; read: PdfReadValue[] }[]
}

function present(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== ''
}

/**
 * What the reader gives for a PDF: every present value (a blank one is not read), in field order, with its
 * confidence and its box. Row `i` of the input is printed at row index `i`. Pure: the same input, the same reading.
 */
export function simulateRead(input: SimulateReadInput): SimulatedRead {
  const scanned = input.scanned === true
  const boxes = headerBoxes()
  const headerRead: PdfReadValue[] = []
  for (const field of PDF_HEADER_FIELDS) {
    const value = input.header[field]
    if (!present(value)) continue
    headerRead.push({ field, value, confidence: readConfidence(input.headerConfidence?.[field], scanned), box: boxes[field] })
  }
  const rows = input.rows.map((row, i) => {
    const read: PdfReadValue[] = []
    for (const field of PDF_ROW_READ_FIELDS) {
      const value = row.values[field]
      if (!present(value)) continue
      read.push({ field, value, confidence: readConfidence(row.confidence?.[field], scanned), box: rowBox(i, field) })
    }
    return { id: row.id, read }
  })
  return { headerRead, rows }
}

/** A sample or as-read row's values in the reader's shape. */
export function readValuesOfRow(row: PdfRowAsRead): Partial<Record<PdfRowReadField, string>> {
  const out: Partial<Record<PdfRowReadField, string>> = { name: row.name, procedureText: row.procedureText }
  if (row.nhi !== undefined) out.nhi = row.nhi
  if (row.dobISO !== undefined) out.dobISO = row.dobISO
  if (row.scheduledTime !== undefined) out.scheduledTime = row.scheduledTime
  if (row.ethnicityCode !== undefined) out.ethnicityCode = row.ethnicityCode
  return out
}

// ---------------------------------------------------------------------------
// What to check
// ---------------------------------------------------------------------------

/** The unsure values on a PDF: its header's and every row's (the item's "Values to check" flag). */
export function toCheckCount(list: Pick<SurgeonPdfList, 'rows' | 'headerRead'>): number {
  return unsureValues(list.headerRead).length + list.rows.reduce((n, r) => n + unsureValues(r.read).length, 0)
}

/** The fields of a row read unsure, in their read order, each once. */
export function unsureFieldsOfRow(row: Pick<PdfListRow, 'read'>): PdfReadField[] {
  const out: PdfReadField[] = []
  for (const v of unsureValues(row.read)) if (!out.includes(v.field)) out.push(v.field)
  return out
}

// ---------------------------------------------------------------------------
// A PDF that cannot be read
// ---------------------------------------------------------------------------

/** Why a PDF could not be made into a List, in plain words (the arrival's `unreadableReason`). */
export const UNREADABLE_REASONS = {
  notAList: 'This page is not a theatre List.',
  tooFaint: 'The scan is too faint to read.',
  noSurgeon: 'No surgeon or session could be read.',
} as const

export type UnreadableReason = keyof typeof UNREADABLE_REASONS

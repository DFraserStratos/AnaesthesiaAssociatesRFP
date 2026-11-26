/**
 * The simulated PDF reader's output (build plan Phase 68; D120, DM-16, US-02.2.1). Each value read from a rooms' PDF
 * carries a confidence (0 to 1) and its box on the page, the box from the same layout pass that draws the page
 * (`pdfTemplates/`), the confidence from the sample data; a value below the check threshold is
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
// The page (the layouts' geometry lives with each layout: `pdfTemplates/`)
// ---------------------------------------------------------------------------

/**
 * An A4 portrait page in points (595 x 842), the size a page is taken to be when its facsimile names none. Each
 * layout (`pdfTemplates/`) has its own paper and orientation: a landscape A4 page is 842 x 595, US letter landscape
 * 792 x 612. Every box is in its own page's units.
 */
export const PDF_PAGE = { width: 595, height: 842 } as const

/** A List's header fields as the reader reads them (D120). */
export type PdfHeaderField = 'surgeon' | 'hospital' | 'date' | 'session' | 'anaesthetist'

/** A row's fields as the reader reads them: the correctable ones plus the rooms' wording. */
export type PdfRowReadField = PdfRowField | 'procedureText'

export const PDF_HEADER_FIELDS: readonly PdfHeaderField[] = ['surgeon', 'hospital', 'date', 'session', 'anaesthetist']
/** The row values the reader reads. No ethnicity: the rooms' PDFs never print one (it comes from the patient record). */
export const PDF_ROW_READ_FIELDS: readonly PdfRowReadField[] = ['nhi', 'name', 'procedureText', 'scheduledTime', 'dobISO']

/** The row id a header value is keyed under (`pdfValueKey(PDF_HEADER_ROW, 'surgeon')`). */
export const PDF_HEADER_ROW = 'header'

/** One read value's key on the page and in the values table: `${rowId}:${field}` (`PDF_HEADER_ROW` for the header). */
export function pdfValueKey(rowId: string, field: PdfReadField): string {
  return `${rowId}:${field}`
}

/** The pages a List's rows print on when nothing better is known (20 rows a page). Prefer the PDF's own page count. */
export function pdfPageCount(rowCount: number, rowsPerPage = 20): number {
  return Math.max(1, Math.ceil(Math.max(rowCount, 0) / Math.max(1, rowsPerPage)))
}

/** Where a value was printed on its page, and whether the reader worked it out (a time from the start and durations). */
export interface PdfReadSpot {
  box: PdfBox
  derived?: boolean
}

/** A box for a value read with no page laid out (nothing to point at). */
const NO_BOX: PdfBox = { page: 1, x: 0, y: 0, width: 0, height: 0 }

// ---------------------------------------------------------------------------
// The simulated reading
// ---------------------------------------------------------------------------

/** A value read cleanly, unless the sample says otherwise. */
export const PDF_READ_CONFIDENCE = 0.97

/** A scan reads every value at this fraction of its confidence. */
export const PDF_SCAN_FACTOR = 0.82

/**
 * A value the reader works out rather than reads (a time from the List's start and each patient's minutes, on a
 * layout that prints no time per patient) is read at this fraction: clean, still sure (0.97 gives 0.90); on a scan,
 * unsure.
 */
export const PDF_DERIVED_FACTOR = 0.93

/**
 * A value's confidence: the sample's override, else `PDF_READ_CONFIDENCE`; on a scan, times `PDF_SCAN_FACTOR`,
 * floored to hundredths. So on a scan a value with no override is unsure (0.97 times 0.82 floors to 0.79), and a
 * sample keeps a scanned value sure only by overriding it at 0.98 or more. Deterministic: no randomness.
 */
export function readConfidence(override: number | undefined, scanned: boolean, derived = false): number {
  const base = Math.min(1, Math.max(0, override ?? PDF_READ_CONFIDENCE))
  const factor = (scanned ? PDF_SCAN_FACTOR : 1) * (derived ? PDF_DERIVED_FACTOR : 1)
  return factor === 1 ? base : Math.floor(base * factor * 100 + 1e-9) / 100
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
  /**
   * Where each value is printed, keyed by `pdfValueKey`, from the layout that draws the page
   * (`layoutPdfDocument`). A value with no spot is not on the page, so it is not read. Without spots every value is
   * read with an empty box (nothing laid out to point at).
   */
  spots?: ReadonlyMap<string, PdfReadSpot>
}

export interface SimulatedRead {
  headerRead: PdfReadValue[]
  rows: { id: string; read: PdfReadValue[] }[]
}

function present(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== ''
}

/**
 * What the reader gives for a PDF: every present value printed on the page (a blank one is not read), in field order,
 * with its confidence and its box from the layout's spots. Pure: the same input, the same reading.
 */
export function simulateRead(input: SimulateReadInput): SimulatedRead {
  const scanned = input.scanned === true
  const spotOf = (key: string): PdfReadSpot | undefined => (input.spots === undefined ? { box: NO_BOX } : input.spots.get(key))
  const headerRead: PdfReadValue[] = []
  for (const field of PDF_HEADER_FIELDS) {
    const value = input.header[field]
    if (!present(value)) continue
    const spot = spotOf(pdfValueKey(PDF_HEADER_ROW, field))
    if (spot === undefined) continue
    headerRead.push({ field, value, confidence: readConfidence(input.headerConfidence?.[field], scanned, spot.derived === true), box: spot.box })
  }
  const rows = input.rows.map((row) => {
    const read: PdfReadValue[] = []
    for (const field of PDF_ROW_READ_FIELDS) {
      const value = row.values[field]
      if (!present(value)) continue
      const spot = spotOf(pdfValueKey(row.id, field))
      if (spot === undefined) continue
      read.push({ field, value, confidence: readConfidence(row.confidence?.[field], scanned, spot.derived === true), box: spot.box })
    }
    return { id: row.id, read }
  })
  return { headerRead, rows }
}

/** A sample or as-read row's values in the reader's shape (never an ethnicity: no rooms' PDF prints one). */
export function readValuesOfRow(row: PdfRowAsRead): Partial<Record<PdfRowReadField, string>> {
  const out: Partial<Record<PdfRowReadField, string>> = { name: row.name, procedureText: row.procedureText }
  if (row.nhi !== undefined) out.nhi = row.nhi
  if (row.dobISO !== undefined) out.dobISO = row.dobISO
  if (row.scheduledTime !== undefined) out.scheduledTime = row.scheduledTime
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

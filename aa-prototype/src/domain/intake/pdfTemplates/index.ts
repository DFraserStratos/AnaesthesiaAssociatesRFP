/**
 * The rooms' PDF layouts (Intake's simulated PDFs), each modelled on a kind of theatre list real surgeons' rooms send:
 *
 * - `oplistx`: a practice system's landscape operation list export (Order, Patient, Procedure, Anaesthetic,
 *   Admission columns; Helvetica, black rules; times worked out from the start and each patient's minutes).
 * - `oplist`: the older export of the same system, no column headings, a big day heading, ruled between patients.
 * - `agenda`: a practice calendar printed from the browser: a timeline, a barcode per patient, a coloured banner.
 * - `wordGrid`: a Word table with a full grid; the `logo` variant has a practice logo and a key and value header.
 * - `report`: a database report, one patient block after another under a grey header band; the `letter` variant is
 *   a landscape booking form on US letter with a boxed grid and a cut right edge.
 * - `hospitalLetter`: a day-surgery letter to the hospital, a boxed two-column cell pair per patient, highlights.
 * - `sheet`: a spreadsheet exported to PDF, faint gridlines, run-on patient cells, red text for what changed.
 *
 * `layoutPdfDocument` lays a source out (pages of draw operations and each read value's box, from one pass);
 * `renderPdfPages` draws the pages. A scan is drawn and boxed through the same transform.
 */

import type { PdfBox, PdfOrientation, PdfPaper, PdfScan, PdfTemplateId, PdfTemplateVariant } from '../../types'
import type { PageLayout } from './engine'
import { docOf, type PdfDoc, type PdfDocumentSource } from './doc'
import { frameOf, pageBox, renderPage, type PageFrame } from './render'
import { oplistx } from './oplistx'
import { oplist } from './oplist'
import { agenda } from './agenda'
import { wordGrid } from './wordGrid'
import { report } from './report'
import { hospitalLetter } from './hospitalLetter'
import { sheet } from './sheet'

export type { PdfDocumentSource, PdfSourceRow, PdfDoc, DocRow, PatientDetails } from './doc'
export { seededSequence } from './doc'
export { textWidth, PageBuilder } from './engine'
export type { PageLayout, DrawOp, TextOp } from './engine'

/** A page size in points: A4 is 595 x 842, US letter 612 x 792 (landscape swaps them). */
export function paperSize(paper: PdfPaper, orientation: PdfOrientation): { width: number; height: number } {
  const [short, long] = paper === 'letter' ? [612, 792] : [595, 842]
  return orientation === 'portrait' ? { width: short, height: long } : { width: long, height: short }
}

/** One layout: its paper and orientation (per variant), and how it lays a document out on pages. */
export interface PdfTemplate {
  id: PdfTemplateId
  /** Its human name, for the code and tests. */
  name: string
  format: (variant?: PdfTemplateVariant) => { paper: PdfPaper; orientation: PdfOrientation }
  /** The pages, in content units of `paperSize(format)`. Header values are keyed on page 1 only. */
  layout: (doc: PdfDoc, size: { width: number; height: number }) => PageLayout[]
}

export const PDF_TEMPLATES: Readonly<Record<PdfTemplateId, PdfTemplate>> = { oplistx, oplist, agenda, wordGrid, report, hospitalLetter, sheet }
export const PDF_TEMPLATE_IDS = Object.keys(PDF_TEMPLATES) as PdfTemplateId[]

/** A read value's place on its page (page units), and whether the reader worked it out rather than read it. */
export interface PdfSpot {
  box: PdfBox
  derived: boolean
}

/** A source laid out: its format, the frame its pages are drawn in, the pages, and every read value's spot. */
export interface PdfDocumentLayout {
  template: PdfTemplateId
  variant?: PdfTemplateVariant
  paper: PdfPaper
  orientation: PdfOrientation
  scan?: PdfScan
  frame: PageFrame
  pages: PageLayout[]
  spots: Map<string, PdfSpot>
  seed: string
}

/** The scan a source asks for, filled in: a seeded skew of half a degree to a degree when none is given. */
function scanOf(src: PdfDocumentSource): PdfScan | undefined {
  if (src.scan === undefined) return undefined
  if (src.scan.skewDeg !== undefined) return src.scan
  let h = 0
  for (const ch of src.seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const skew = -(0.5 + (h % 50) / 100)
  return { ...src.scan, skewDeg: Math.round(skew * 100) / 100 }
}

/** Lays a source out in its template: one pass gives both what is drawn and where each read value sits. */
export function layoutPdfDocument(src: PdfDocumentSource): PdfDocumentLayout {
  const template = PDF_TEMPLATES[src.template]
  const { paper, orientation } = template.format(src.variant)
  const size = paperSize(paper, orientation)
  const scan = scanOf(src)
  const frame = frameOf(size.width, size.height, scan)
  const pages = template.layout(docOf(src), size)
  const spots = new Map<string, PdfSpot>()
  pages.forEach((page, i) => {
    for (const [key, spot] of page.spots) {
      if (spots.has(key)) continue
      spots.set(key, { box: pageBox(frame, i + 1, spot), derived: spot.derived })
    }
  })
  return {
    template: src.template,
    ...(src.variant !== undefined ? { variant: src.variant } : {}),
    paper,
    orientation,
    ...(scan !== undefined ? { scan } : {}),
    frame,
    pages,
    spots,
    seed: src.seed,
  }
}

/** Each page drawn as an SVG data URL in its own units (a rotated scan's pages are portrait). */
export function renderPdfPages(layout: PdfDocumentLayout): string[] {
  return layout.pages.map((page, i) => renderPage(page, layout.frame, { scanned: layout.scan !== undefined, seed: `${layout.seed}|${i + 1}` }))
}

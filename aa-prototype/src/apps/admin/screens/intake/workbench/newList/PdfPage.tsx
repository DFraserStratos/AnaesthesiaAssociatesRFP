/**
 * A rooms' PDF page with the reader's boxes laid over it (build plan Phase 70; US-02.2.1, D120): the generated
 * facsimile in a framed paper, a quiet bar above with the file name, the page ("Page 2 of 3") and previous and next
 * page buttons, and one box per value read on the page shown. A value to check is lit in the warning colour where it
 * sits on the page, with a small button that shows it in the values table; the rest have a quiet outline and do
 * nothing. The selected value's box is lit stronger and scrolled into view, and choosing a value on another page
 * turns to that page. Each page is drawn at its own size (a landscape page is wider than tall) at the column's width;
 * "Open full size" shows the page in the shared Dialog at 100% scale or larger, scrolling sideways when the page is
 * wider than the dialog, its boxes still drawn. "Rotate" turns the page a quarter turn clockwise at a time (a scan
 * fed in sideways), its boxes with it, in the column and full size alike. Intake's own, built from shared parts. No
 * confidence number is ever shown.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, FileText, Maximize2, RotateCw, Table2 } from 'lucide-react'
import type { PdfBox, PdfReadField, PdfReadValue, SurgeonPdfList } from '../../../../../../domain/types'
import { isUnsure, PDF_PAGE, type PdfHeaderField } from '../../../../../../domain/intake/pdfRead'
import { facsimileSize, PDF_HEADER_ROW, PDF_ROW_FIELD_LABELS, pdfValueKey } from '../../../../../../domain/intake/pdfLists'
import { IconButton, TextAction } from '../../../../../../shared/ui'
import { Dialog, OverlayHeader } from '../../../../../../shared/surface'
import { dataAttributesOf, type DataAttributes } from '../../../../../../shared/ui/Field'
import { motion } from '../../../../../../theme/motion'
import { elevation, neutral, radius, semantic, space, type as typeScale } from '../../../../../../theme/tokens'

/** One value's box on the page: its key (`pdfValueKey`), where it sits, whether it is to check, and its plain name. */
export interface PdfPageBox {
  key: string
  box: PdfBox
  unsure: boolean
  label: string
}

const HEADER_LABELS: Record<PdfHeaderField, string> = {
  surgeon: 'Surgeon',
  hospital: 'Hospital',
  date: 'Date',
  session: 'Session',
  anaesthetist: 'Anaesthetist',
}

function fieldLabel(field: PdfReadField): string {
  if (field === 'procedureText') return 'Procedure'
  if (field in PDF_ROW_FIELD_LABELS) return PDF_ROW_FIELD_LABELS[field as keyof typeof PDF_ROW_FIELD_LABELS]
  return HEADER_LABELS[field as PdfHeaderField]
}

/**
 * The boxes of a PDF's read values: the header's, then each row's (only the rows in `pdfRowIds` when given), keyed by
 * `pdfValueKey`, unsure by the reader's threshold (`isUnsure`), named in plain words ("NHI, row 2", "Date, header").
 */
export function pdfPageBoxes(list: Pick<SurgeonPdfList, 'rows' | 'headerRead'>, pdfRowIds?: ReadonlySet<string>): PdfPageBox[] {
  const of = (rowId: string, where: string) => (v: PdfReadValue): PdfPageBox => ({
    key: pdfValueKey(rowId, v.field),
    box: v.box,
    unsure: isUnsure(v),
    label: `${fieldLabel(v.field)}, ${where}`,
  })
  const header = (list.headerRead ?? []).map(of(PDF_HEADER_ROW, 'header'))
  const rows = list.rows.flatMap((row, i) => (pdfRowIds !== undefined && !pdfRowIds.has(row.id) ? [] : (row.read ?? []).map(of(row.id, `row ${i + 1}`))))
  return [...header, ...rows]
}

interface PdfPageProps extends DataAttributes {
  /** The first page's data URL (`buildFacsimile`, `buildUnreadableFacsimile`): shown alone when `pages` is not given. */
  facsimile: string
  /** Every page's data URL, in order (`SurgeonPdfList.file.pages`). */
  pages?: readonly string[]
  fileName: string
  boxes?: readonly PdfPageBox[]
  selectedKey?: string
  /** Called with a value's key when its "show in the table" button is used (unsure boxes only). */
  onSelect?: (key: string) => void
  /** The page's width in its own units; read from each page's facsimile when omitted (else `PDF_PAGE.width`). */
  pageWidth?: number
  /** How many pages the PDF has ("Page 1 of N"): the pages given, else this, else the furthest page a box sits on. */
  pageCount?: number
  /** Beside the page count in the bar above the page. */
  caption?: ReactNode
  shot?: string
}

/** A page shown upright (taller than wide) is capped at this width, so it is not drawn huge; a wide page fills the desk. */
const UPRIGHT_MAX_WIDTH = 820

/** A small breathing room around each box, in page units, so the outline clears the glyphs. */
const PAD = 2

const pct = (n: number, of: number) => `${(n / of) * 100}%`

export function PdfPage(props: PdfPageProps) {
  const { facsimile, fileName, boxes = [], selectedKey, onSelect, caption, shot = 'intake-pdf-page' } = props
  const images = props.pages !== undefined && props.pages.length > 0 ? props.pages : [facsimile]
  const pages = props.pages !== undefined && props.pages.length > 0 ? props.pages.length : (props.pageCount ?? Math.max(1, ...boxes.map((b) => b.box.page)))
  const [page, setPage] = useState(1)
  const [full, setFull] = useState(false)
  /** Quarter turns clockwise, 0 to 3. */
  const [turns, setTurns] = useState(0)
  // Only the pages there are images for can be shown.
  const shown = Math.min(Math.max(1, page), images.length)
  const image = images[shown - 1]!
  const read = facsimileSize(image)
  const width = props.pageWidth ?? read?.width ?? PDF_PAGE.width
  const height = read?.height ?? PDF_PAGE.height

  // Choosing a value on another page turns to it.
  const selectedPage = selectedKey !== undefined ? boxes.find((b) => b.key === selectedKey)?.box.page : undefined
  useEffect(() => {
    if (selectedPage !== undefined && selectedPage <= images.length) setPage(selectedPage)
  }, [selectedKey, selectedPage, images.length])

  const onPage = boxes.filter((b) => b.box.page === shown)
  const toCheck = onPage.filter((b) => b.unsure).length
  const alt = `${fileName}, page ${shown} of ${pages}${toCheck > 0 ? `, ${toCheck === 1 ? 'one value' : `${toCheck} values`} to check marked` : ''}`
  const sheet = { facsimile: image, alt, boxes: onPage, width, height, turns, ...(selectedKey !== undefined ? { selectedKey } : {}) }
  const turner = images.length > 1 ? <PageTurner page={shown} pages={images.length} onPage={setPage} shot={shot} /> : null

  return (
    <figure
      {...dataAttributesOf(props)}
      data-shot={shot}
      data-pdf-page={shown}
      style={{ margin: 0, minWidth: 0, border: `1px solid ${neutral.line}`, borderRadius: radius.card, background: neutral.sunken, overflow: 'hidden' }}
    >
      <figcaption
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: space[3],
          padding: `${space[2]}px ${space[3]}px`,
          background: neutral.surface,
          borderBottom: `1px solid ${neutral.line}`,
        }}
      >
        <FileText size={16} aria-hidden color={neutral.mist} style={{ flex: 'none' }} />
        <span
          title={fileName}
          style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: typeScale.label.size, fontWeight: typeScale.label.weight, color: neutral.ink }}
        >
          {fileName}
        </span>
        <span data-pdf-page-count={pages} style={{ flex: 'none', fontSize: typeScale.captionSm.size, fontWeight: typeScale.captionSm.weight, color: neutral.mist, fontVariantNumeric: 'tabular-nums' }}>
          Page {shown} of {pages}
        </span>
        {turner}
        <IconButton label="Rotate page" onClick={() => setTurns((t) => (t + 1) % 4)} size={32} tone="neutral" shot={`${shot}-rotate`} data-pdf-turns={turns}>
          <RotateCw size={15} aria-hidden />
        </IconButton>
        {caption !== undefined && <span style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: space[2] }}>{caption}</span>}
        <TextAction size="sm" flush onClick={() => setFull(true)} shot={`${shot}-open-full`} label={`Open ${fileName} full size`} style={{ flex: 'none' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: space[1] }}>
            <Maximize2 size={13} aria-hidden />
            Open full size
          </span>
        </TextAction>
      </figcaption>

      <div style={{ padding: space[4], ...((turns % 2 === 1 ? width > height : height > width) ? { maxWidth: UPRIGHT_MAX_WIDTH + 2 * space[4], margin: '0 auto' } : {}) }}>
        <PdfSheet {...sheet} {...(onSelect !== undefined ? { onSelect } : {})} scrollSelected={!full} />
      </div>

      <Dialog open={full} onClose={() => setFull(false)} size="wide">
        <OverlayHeader title={fileName} description={`Page ${shown} of ${pages} at full size.${toCheck > 0 ? ' Values to check are marked.' : ''}`} />
        {turner !== null && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: space[3] }}>{turner}</div>}
        {/* A landscape page is wider than the dialog: it keeps its full size and the frame scrolls sideways. */}
        <div data-shot={`${shot}-full`} style={{ marginTop: space[4], overflowX: 'auto', background: neutral.sunken, borderRadius: radius.card, padding: space[4] }}>
          <div style={{ width: '100%', minWidth: turns % 2 === 1 ? height : width, margin: '0 auto' }}>
            <PdfSheet
              {...sheet}
              {...(onSelect !== undefined
                ? {
                    onSelect: (key: string) => {
                      setFull(false)
                      onSelect(key)
                    },
                  }
                : {})}
              scrollSelected={full}
            />
          </div>
        </div>
      </Dialog>
    </figure>
  )
}

/** Previous and next page, for a PDF of more than one page. */
function PageTurner({ page, pages, onPage, shot }: { page: number; pages: number; onPage: (page: number) => void; shot: string }) {
  return (
    <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: space[1] }}>
      <IconButton label="Previous page" onClick={() => onPage(page - 1)} disabled={page <= 1} size={32} tone="neutral" shot={`${shot}-previous`}>
        <ChevronLeft size={16} aria-hidden />
      </IconButton>
      <IconButton label="Next page" onClick={() => onPage(page + 1)} disabled={page >= pages} size={32} tone="neutral" shot={`${shot}-next`}>
        <ChevronRight size={16} aria-hidden />
      </IconButton>
    </span>
  )
}

/** The page itself: the facsimile with each value's box laid over it, at whatever width its container gives it. */
function PdfSheet({
  facsimile,
  alt,
  boxes,
  width,
  height,
  turns,
  selectedKey,
  onSelect,
  scrollSelected,
}: {
  facsimile: string
  alt: string
  boxes: readonly PdfPageBox[]
  width: number
  height: number
  turns: number
  selectedKey?: string
  onSelect?: (key: string) => void
  scrollSelected: boolean
}) {
  const refs = useRef(new Map<string, HTMLDivElement>())
  useEffect(() => {
    if (!scrollSelected || selectedKey === undefined) return
    refs.current.get(selectedKey)?.scrollIntoView?.({ block: 'nearest' })
    // Again when the page turns to the selected value.
  }, [selectedKey, scrollSelected, facsimile])

  // A quarter turn swaps the page's sides: the frame takes the turned shape, and the page sits turned at its centre.
  const sideways = turns % 2 === 1
  const turned: CSSProperties | undefined =
    turns === 0
      ? undefined
      : sideways
        ? { position: 'absolute', left: '50%', top: '50%', width: pct(width, height), transform: `translate(-50%, -50%) rotate(${turns * 90}deg)` }
        : { transform: 'rotate(180deg)' }
  const sheet = (
    <div style={{ position: 'relative', background: neutral.surface, boxShadow: elevation.e2, borderRadius: radius.xs, ...turned }}>
      <img src={facsimile} alt={alt} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: radius.xs }} />
      {boxes.length > 0 && (
        <div data-pdf-boxes style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {boxes.map((b) => (
            <PageBox
              key={b.key}
              b={b}
              width={width}
              height={height}
              selected={b.key === selectedKey}
              onSelect={onSelect}
              setRef={(el) => {
                if (el === null) refs.current.delete(b.key)
                else refs.current.set(b.key, el)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
  return sideways ? <div style={{ position: 'relative', width: '100%', aspectRatio: `${height} / ${width}` }}>{sheet}</div> : sheet
}

function PageBox({
  b,
  width,
  height,
  selected,
  onSelect,
  setRef,
}: {
  b: PdfPageBox
  width: number
  height: number
  selected: boolean
  onSelect: ((key: string) => void) | undefined
  setRef: (el: HTMLDivElement | null) => void
}) {
  const warn = semantic.warning
  const frame: CSSProperties = b.unsure
    ? { outline: `${selected ? 2 : 1}px solid ${warn.solid}`, boxShadow: selected ? elevation.e2 : 'none' }
    : { outline: selected ? `2px solid ${neutral.ink}` : `1px solid ${neutral.line}` }
  const ease = `${motion.selectionSlide.duration}ms ${motion.selectionSlide.easing}`
  return (
    <div
      ref={setRef}
      data-pdf-box={b.key}
      data-unsure={b.unsure ? 'true' : 'false'}
      data-selected={selected ? 'true' : 'false'}
      title={b.label}
      style={{
        position: 'absolute',
        left: pct(b.box.x - PAD, width),
        top: pct(b.box.y - PAD, height),
        width: pct(b.box.width + 2 * PAD, width),
        height: pct(b.box.height + 2 * PAD, height),
        borderRadius: radius.xs / 2,
        transition: `outline-color ${ease}, box-shadow ${ease}`,
        ...frame,
      }}
    >
      {b.unsure && (
        // The tint multiplies over the page, so the value stays legible under it.
        <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: warn.tint, mixBlendMode: 'multiply' }} />
      )}
      {b.unsure && onSelect !== undefined && (
        <span style={{ position: 'absolute', top: '50%', right: 0, transform: 'translate(50%, -50%)', pointerEvents: 'auto' }}>
          <IconButton
            label={`Show ${b.label} in the table`}
            onClick={() => onSelect(b.key)}
            size={32}
            shape="round"
            data-pdf-box-pick={b.key}
            style={{ width: space[6], height: space[6], background: neutral.surface, border: `1px solid ${warn.solid}`, color: warn.onTint, boxShadow: elevation.e1 }}
          >
            <Table2 size={13} aria-hidden />
          </IconButton>
        </span>
      )}
    </div>
  )
}

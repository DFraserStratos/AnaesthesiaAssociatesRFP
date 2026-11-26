/**
 * A rooms' PDF page with the reader's boxes laid over it (build plan Phase 70; US-02.2.1, D120): the generated
 * facsimile in a framed paper, a quiet bar above with the file name and the page, and one box per value read. A value
 * to check is lit in the warning colour where it sits on the page, with a small button that shows it in the values
 * table; the rest have a quiet outline and do nothing. The selected value's box is lit stronger and scrolled into
 * view. The page is a full A4 page and is drawn at the column's width; "Open full size" shows it in the shared
 * Dialog at 100% scale or larger (595px wide at least, scrolling), its boxes still drawn. Intake's own, built from
 * shared parts. No confidence number is ever shown.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { FileText, Maximize2, Table2 } from 'lucide-react'
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
  /** The facsimile's data URL (`buildFacsimile`, `buildUnreadableFacsimile`). */
  facsimile: string
  fileName: string
  boxes?: readonly PdfPageBox[]
  selectedKey?: string
  /** Called with a value's key when its "show in the table" button is used (unsure boxes only). */
  onSelect?: (key: string) => void
  /** The page's width in its own units; read from the facsimile when omitted (else `PDF_PAGE.width`). */
  pageWidth?: number
  /** How many pages the PDF has ("Page 1 of N"); the furthest page a box sits on when omitted. */
  pageCount?: number
  /** Beside the page count in the bar above the page. */
  caption?: ReactNode
  shot?: string
}

/** A small breathing room around each box, in page units, so the outline clears the glyphs. */
const PAD = 2

const pct = (n: number, of: number) => `${(n / of) * 100}%`

export function PdfPage(props: PdfPageProps) {
  const { facsimile, fileName, boxes = [], selectedKey, onSelect, caption, shot = 'intake-pdf-page' } = props
  const read = facsimileSize(facsimile)
  const width = props.pageWidth ?? read?.width ?? PDF_PAGE.width
  const height = read?.height ?? PDF_PAGE.height
  const pages = props.pageCount ?? Math.max(1, ...boxes.map((b) => b.box.page))
  const [full, setFull] = useState(false)

  const onPage = boxes.filter((b) => b.box.page === 1)
  const toCheck = onPage.filter((b) => b.unsure).length
  const alt = `${fileName}, page 1 of ${pages}${toCheck > 0 ? `, ${toCheck === 1 ? 'one value' : `${toCheck} values`} to check marked` : ''}`
  const sheet = { facsimile, alt, boxes: onPage, width, height, ...(selectedKey !== undefined ? { selectedKey } : {}) }

  return (
    <figure
      {...dataAttributesOf(props)}
      data-shot={shot}
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
          Page 1 of {pages}
        </span>
        {caption !== undefined && <span style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: space[2] }}>{caption}</span>}
        <TextAction size="sm" flush onClick={() => setFull(true)} shot={`${shot}-open-full`} label={`Open ${fileName} full size`} style={{ flex: 'none' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: space[1] }}>
            <Maximize2 size={13} aria-hidden />
            Open full size
          </span>
        </TextAction>
      </figcaption>

      <div style={{ padding: space[4] }}>
        <PdfSheet {...sheet} {...(onSelect !== undefined ? { onSelect } : {})} scrollSelected={!full} />
      </div>

      <Dialog open={full} onClose={() => setFull(false)} size="wide">
        <OverlayHeader title={fileName} description={`Page 1 of ${pages} at full size.${toCheck > 0 ? ' Values to check are marked.' : ''}`} />
        <div data-shot={`${shot}-full`} style={{ marginTop: space[4], overflowX: 'auto', background: neutral.sunken, borderRadius: radius.card, padding: space[4] }}>
          <div style={{ width: '100%', minWidth: PDF_PAGE.width, margin: '0 auto' }}>
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

/** The page itself: the facsimile with each value's box laid over it, at whatever width its container gives it. */
function PdfSheet({
  facsimile,
  alt,
  boxes,
  width,
  height,
  selectedKey,
  onSelect,
  scrollSelected,
}: {
  facsimile: string
  alt: string
  boxes: readonly PdfPageBox[]
  width: number
  height: number
  selectedKey?: string
  onSelect?: (key: string) => void
  scrollSelected: boolean
}) {
  const refs = useRef(new Map<string, HTMLDivElement>())
  useEffect(() => {
    if (!scrollSelected || selectedKey === undefined) return
    refs.current.get(selectedKey)?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedKey, scrollSelected])

  return (
    <div style={{ position: 'relative', background: neutral.surface, boxShadow: elevation.e2, borderRadius: radius.xs }}>
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

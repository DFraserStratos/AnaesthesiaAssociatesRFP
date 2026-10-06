/**
 * A Markdown document (a transcript, a note) as a page on the chart paper: real text, so it
 * selects and copies, with links to cards working as in any sheet. A spot in it is a heading's
 * section, a line range (`L27-33`, as the notes cite transcripts) or a named region's passage,
 * boxed in red and scrolled to the middle of the view.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { inlinePlain, normText, padRect, parseAnchor, slugify } from '../../shared/artifacts.ts'
import { HIGHLIGHT } from '../../shared/highlight.ts'
import { linesOfRegionId, type Rect, type Region } from '../../shared/types.ts'
import { recordLinkComponents, remarkRecordIds } from '../components/Prose.tsx'
import { useCatalogue, useIndex } from '../store.ts'
import { boxStyle, type FindProps } from './CanvasViewer.tsx'
import { findRanges, lineRects } from './find.ts'
import { quoteRange, relativeTo, unionIn } from './regionsDom.ts'

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  position?: { start: { line: number }; end: { line: number } }
  children?: HastNode[]
}

const BLOCKS = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'table', 'tr', 'ul', 'ol', 'hr', 'dl', 'dt', 'dd'])

/** A rehype plugin: each block remembers the source lines it came from, so `L27-33` can find it. */
const rehypeLines = () => (tree: HastNode) => {
  const walk = (n: HastNode) => {
    if (n.type === 'element' && n.tagName && BLOCKS.has(n.tagName) && n.position) {
      n.properties = { ...n.properties, 'data-ls': n.position.start.line, 'data-le': n.position.end.line }
    }
    n.children?.forEach(walk)
  }
  walk(tree)
}

/** A heading and everything under it, up to the next heading at its level or above. */
function sectionOf(h: Element): Element[] {
  const depth = Number(h.tagName[1])
  const out = [h]
  for (let n = h.nextElementSibling; n; n = n.nextElementSibling) {
    if (/^H[1-6]$/.test(n.tagName) && Number(n.tagName[1]) <= depth) break
    out.push(n)
  }
  return out
}

/** The innermost blocks whose source lines meet `from` to `to`. */
function blocksForLines(sheet: Element, from: number, to: number): Element[] {
  const hit = [...sheet.querySelectorAll('[data-ls]')].filter((el) => Number(el.getAttribute('data-ls')) <= to && Number(el.getAttribute('data-le')) >= from)
  return hit.filter((el) => !hit.some((o) => o !== el && el.contains(o)))
}

export interface DocSpot {
  /** A named region, matched by its anchors. */
  region: Region | null
  /** An automatic spot: a heading slug or a line range. */
  auto: string | null
}

export function MarkdownReader({ text, spot, focusKey, label, onRegionFound, find }: { text: string; spot: DocSpot; focusKey?: string; label: string; onRegionFound?: (found: boolean) => void; find?: FindProps }) {
  const index = useIndex()
  const artifacts = useCatalogue((s) => s.artifacts)
  const remark = useMemo(() => [remarkGfm, remarkRecordIds(index, artifacts)], [index, artifacts])
  const components = useMemo(() => recordLinkComponents(index, artifacts), [index, artifacts])
  const frameRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const [box, setBox] = useState<Rect | null>(null)
  const [arrival, setArrival] = useState(0)

  // Headings take the slugs the server gave them (GitHub's rule), so `#section-name` finds them.
  useLayoutEffect(() => {
    const seen = new Map<string, number>()
    for (const h of sheetRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6') ?? []) {
      const base = slugify(inlinePlain(h.textContent ?? '')) || 'section'
      const n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      h.setAttribute('data-slug', n ? `${base}-${n}` : base)
    }
  }, [text])

  const key = `${spot.region?.id ?? ''}|${spot.auto ?? ''}|${focusKey ?? ''}`
  useLayoutEffect(() => {
    const sheet = sheetRef.current
    const frame = frameRef.current
    if (!sheet || !frame) return
    const find = (): Rect | null => {
      const parts: (Element | Range)[] = []
      if (spot.auto) {
        const lines = linesOfRegionId(spot.auto)
        if (lines) parts.push(...blocksForLines(sheet, lines.from, lines.to))
        else {
          const h = sheet.querySelector(`[data-slug="${CSS.escape(spot.auto)}"]`)
          if (h) parts.push(...sectionOf(h))
        }
      }
      for (const anchor of spot.region?.around ?? []) {
        const { kind, value } = parseAnchor(anchor)
        if (kind === 'quote') {
          const r = quoteRange(sheet, value)
          if (r) parts.push(r)
        } else if (kind === 'heading') {
          const h = [...sheet.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((x) => normText(x.textContent ?? '') === normText(value))
          if (h) parts.push(...sectionOf(h))
        }
      }
      const r = parts.length ? unionIn(sheet, parts) : null
      return r && padRect(r, spot.region?.pad ?? HIGHLIGHT.pad)
    }
    const r = find()
    setBox(r)
    if (spot.region || spot.auto) onRegionFound?.(!!r)
    if (r) {
      // Bring it to the middle of the view (or its top in view, if it is taller than the view).
      const top = r.y + sheet.offsetTop
      const y = r.h > frame.clientHeight - 80 ? top - 40 : top - (frame.clientHeight - r.h) / 2
      frame.scrollTo({ top: Math.max(0, y), behavior: reducedMotion() ? 'auto' : 'smooth' })
      setArrival((n) => n + 1)
    }
    let live = true
    void document.fonts?.ready.then(() => live && setBox(find()))
    const ro = new ResizeObserver(() => live && setBox(find()))
    ro.observe(sheet)
    return () => {
      live = false
      ro.disconnect()
    }
  }, [key, text])

  // Find: each match's line boxes, measured on the page (again whenever it reflows).
  const query = find?.query ?? ''
  const active = find?.active ?? 0
  const [hits, setHits] = useState<Rect[][]>([])
  useLayoutEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const measure = () => {
      const found = query.trim() ? findRanges(sheet, query, 'doc').map((r) => lineRects(r).map((x) => relativeTo(sheet, x))).filter((rs) => rs.length) : []
      setHits(found)
      return found.length
    }
    find?.onCount(measure())
    const ro = new ResizeObserver(() => measure())
    ro.observe(sheet)
    return () => ro.disconnect()
  }, [query, text])
  const current = hits.length ? Math.min(active, hits.length - 1) : -1
  useLayoutEffect(() => {
    const frame = frameRef.current
    const sheet = sheetRef.current
    const r = hits[current]?.[0]
    if (!frame || !sheet || !r) return
    frame.scrollTo({ top: Math.max(0, sheet.offsetTop + r.y - frame.clientHeight / 3), behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [current, query, hits.length])

  return (
    <div ref={frameRef} className="doc-frame" role="document" aria-label={label} tabIndex={0}>
      <article ref={sheetRef} className="doc-sheet prose">
        <Markdown remarkPlugins={remark} rehypePlugins={[rehypeLines]} components={components}>
          {text}
        </Markdown>
        {box && <div key={arrival} className="region-box" style={boxStyle(box)} aria-hidden />}
        {hits.map((rs, i) => rs.map((r, j) => <div key={`${i}.${j}`} className={`find-hit${i === current ? ' is-current' : ''}`} style={{ left: r.x - 2, top: r.y - 1, width: r.w + 4, height: r.h + 2 }} aria-hidden />))}
      </article>
    </div>
  )
}

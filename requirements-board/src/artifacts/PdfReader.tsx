/**
 * A PDF as pages on the chart paper, drawn by pdf.js (loaded only when a PDF is shown). Each page
 * carries pdf.js's text layer over its picture, so its text selects and copies. Pages draw as
 * they come near the view. A spot is a page (`p27`), or a named region on a page: a passage
 * (`quote=`) or a box in PDF points, boxed in red. The pages fit the width or show the page in
 * focus whole, or zoom freely about the pinch; a rail of thumbnails down the right goes to a page.
 */
import { Minus, MoveHorizontal, MoveVertical, PanelRight, Plus } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { padRect, parseAnchor } from '../../shared/artifacts.ts'
import { HIGHLIGHT } from '../../shared/highlight.ts'
import { pageOfRegionId, type Rect, type Region } from '../../shared/types.ts'
import { useArtifactView } from '../artifactIndex.ts'
import { GESTURE_GAP_MS, PINCH_RATE } from '../board/trackpad.ts'
import { boxStyle, type FindProps } from './CanvasViewer.tsx'
import { useLoaded } from './content.ts'
import { countIn, findRanges, lineRects, pdfPageText } from './find.ts'
import { quoteRange, relativeTo, unionIn } from './regionsDom.ts'

type PdfJs = typeof import('pdfjs-dist')
let pdfjs: Promise<PdfJs> | null = null

export function loadPdfJs(): Promise<PdfJs> {
  return (pdfjs ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default
    return lib
  }))
}

export interface LoadedPdf {
  lib: PdfJs
  doc: PDFDocumentProxy
  sizes: { w: number; h: number }[]
}

export async function loadPdf(url: string): Promise<LoadedPdf> {
  const lib = await loadPdfJs()
  const doc = await lib.getDocument({ url }).promise
  const sizes: { w: number; h: number }[] = []
  for (let n = 1; n <= doc.numPages; n++) {
    const vp = (await doc.getPage(n)).getViewport({ scale: 1 })
    sizes.push({ w: vp.width, h: vp.height })
  }
  return { lib, doc, sizes }
}

/** Every page's text, read once per document, so find can count matches on pages not drawn yet. */
const texts = new WeakMap<LoadedPdf, Promise<string[]>>()
function pageTexts(pdf: LoadedPdf): Promise<string[]> {
  let t = texts.get(pdf)
  if (!t) {
    t = Promise.all(pdf.sizes.map(async (_, i) => pdfPageText((await (await pdf.doc.getPage(i + 1)).getTextContent()).items as { str?: string; hasEOL?: boolean }[])))
    texts.set(pdf, t)
  }
  return t
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const GUTTER = 32
/** The room kept above and below a page fitted whole. */
const PAGE_MARGIN = 24
const MIN_ZOOM = 0.4
const MAX_ZOOM = 4
/** A zoom that comes to rest this close to a fit (a share of its scale) settles on that fit. */
const SNAP = 0.04
/** How long a zoom holds still before the pages are drawn again at it (till then they stretch). */
const REDRAW_MS = 160
const THUMB_W = 88
const GLIDE_MS = 320

/**
 * How the pages are sized: one page (the one in focus when the fit was asked for) filling the
 * frame's width or shown whole, or freely (pinched or stepped), as a multiple of the widest page's
 * width fit so that it keeps its proportion when the frame resizes.
 */
type Fit = { mode: 'width' | 'page'; page: number } | { mode: 'free'; zoom: number }

/** A point in the document (a page, and a place on it in PDF points) held at a point in the frame while the scale changes. */
interface Anchor {
  page: number
  ux: number
  uy: number
  ax: number
  ay: number
}

/** The page in focus: the one taking up the most of the view (the upper one on a tie). */
function pageInFocus(frame: HTMLElement): number {
  const top = frame.scrollTop
  const bottom = top + frame.clientHeight
  let best = 1
  let most = -1
  for (const el of frame.querySelectorAll<HTMLElement>('.pdf-page')) {
    const t = el.offsetTop
    const b = t + el.offsetHeight
    if (b <= top) continue
    if (t >= bottom) break
    const seen = Math.min(b, bottom) - Math.max(t, top)
    if (seen > most + 1) {
      best = Number(el.dataset.page)
      most = seen
    }
  }
  return best
}

/** The point of the document at (ax, ay) in the frame, its pages laid out at `scale`. */
function anchorAt(frame: HTMLElement, scale: number, ax: number, ay: number): Anchor | null {
  const y = frame.scrollTop + ay
  let el: HTMLElement | null = null
  for (const p of frame.querySelectorAll<HTMLElement>('.pdf-page')) {
    if (!el || p.offsetTop <= y) el = p
    else break
  }
  if (!el || !scale) return null
  return { page: Number(el.dataset.page), ux: (frame.scrollLeft + ax - el.offsetLeft) / scale, uy: (y - el.offsetTop) / scale, ax, ay }
}

const pageEl = (frame: HTMLElement, n: number) => frame.querySelector<HTMLElement>(`.pdf-page[data-page="${n}"]`)

/** The value once it has held still for `ms` (at once the first time it is set). */
function useSettled(v: number, ms: number): number {
  const [settled, setSettled] = useState(v)
  useEffect(() => {
    if (!settled) {
      setSettled(v)
      return
    }
    const t = setTimeout(() => setSettled(v), ms)
    return () => clearTimeout(t)
  }, [v])
  return settled
}

/**
 * Scroll a frame to a height, easing there when asked (never with reduced motion). It is the
 * reader's own glide, not the browser's smooth scroll, which runs on to its old mark over any
 * scroll set while it moves: a zoom or the reader's own scrolling stops this one where it is.
 */
function useGlide(frameRef: RefObject<HTMLElement | null>) {
  const raf = useRef(0)
  const stop = () => cancelAnimationFrame(raf.current)
  const glide = (top: number, smooth: boolean) => {
    stop()
    const f = frameRef.current
    if (!f) return
    const from = f.scrollTop
    const to = Math.min(Math.max(0, top), f.scrollHeight - f.clientHeight)
    if (!smooth || reducedMotion() || Math.abs(to - from) < 2) {
      f.scrollTop = to
      return
    }
    const t0 = performance.now()
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / GLIDE_MS)
      f.scrollTop = from + (to - from) * (1 - (1 - k) ** 3)
      if (k < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }
  useEffect(() => {
    const f = frameRef.current
    if (!f) return
    f.addEventListener('wheel', stop, { passive: true })
    f.addEventListener('pointerdown', stop)
    f.addEventListener('keydown', stop)
    return () => {
      stop()
      f.removeEventListener('wheel', stop)
      f.removeEventListener('pointerdown', stop)
      f.removeEventListener('keydown', stop)
    }
  }, [])
  return { glide, stop }
}

export interface PdfSpot {
  region: Region | null
  /** An automatic spot: `p<n>`. */
  auto: string | null
}

interface ReaderProps {
  spot: PdfSpot
  focusKey?: string
  label: string
  onRegionFound?: (found: boolean) => void
  find?: FindProps
}

export function PdfReader({ url, ...props }: ReaderProps & { url: string }) {
  const loaded = useLoaded(url, () => loadPdf(url))
  if (loaded.status === 'loading') return <div className="viewer-note">Opening the PDF</div>
  if (loaded.status === 'error') return <div className="viewer-note bad">The PDF could not be opened: {loaded.error}</div>
  return <PdfPages pdf={loaded.value} {...props} />
}

function PdfPages({ pdf, spot, focusKey, label, onRegionFound, find }: ReaderProps & { pdf: LoadedPdf }) {
  const shellRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 })
  const [fit, setFit] = useState<Fit>(() => ({ mode: 'width', page: spot.region?.page ?? (spot.auto ? (pageOfRegionId(spot.auto) ?? 1) : 1) }))
  const [current, setCurrent] = useState(1)
  const [rendered, setRendered] = useState<Record<number, number>>({})
  const [box, setBox] = useState<{ page: number; rect: Rect } | null>(null)
  const [arrival, setArrival] = useState(0)
  const pagesPref = useArtifactView((s) => s.pdfPages)
  const setPrefs = useArtifactView((s) => s.set)
  const many = pdf.sizes.length > 1
  const rail = pagesPref && many

  const widest = Math.max(...pdf.sizes.map((s) => s.w))
  const room = frameSize.w - 2 * GUTTER
  /** The scale free zoom is a multiple of: the widest page filling the width. */
  const base = frameSize.w ? Math.max(0.2, room / widest) : 0
  const widthFit = (n: number) => (frameSize.w ? Math.max(0.2, room / pdf.sizes[n - 1]!.w) : 0)
  const pageFit = (n: number) => {
    const s = pdf.sizes[n - 1]!
    return frameSize.w ? Math.max(0.1, Math.min((frameSize.h - 2 * PAGE_MARGIN) / s.h, room / s.w)) : 0
  }
  // Zooming out goes a little past the smallest whole-page fit, never further.
  const minZoom = base ? Math.min(MIN_ZOOM, (0.8 * Math.min(...pdf.sizes.map((_, i) => pageFit(i + 1)))) / base) : MIN_ZOOM
  const scale = fit.mode === 'free' ? base * fit.zoom : fit.mode === 'width' ? widthFit(fit.page) : pageFit(fit.page)
  // Pages stretch with a zoom at once and are drawn sharp again once it holds still.
  const drawScale = useSettled(scale, REDRAW_MS)
  const live = useRef({ fit, base, widthFit, pageFit, minZoom, scale })
  live.current = { fit, base, widthFit, pageFit, minZoom, scale }

  // Through every change of scale the view holds still at a point (the pinch, or the middle of the
  // view), or, fitting a page whole, centres that page. `drawn` is the scale the pages are laid out at.
  const { glide, stop } = useGlide(frameRef)
  const drawn = useRef(0)
  const pending = useRef<{ kind: 'anchor'; at: Anchor } | { kind: 'page'; page: number } | null>(null)
  const hold = (ax?: number, ay?: number) => {
    const f = frameRef.current
    if (!f || pending.current) return
    const at = anchorAt(f, drawn.current, ax ?? f.clientWidth / 2, ay ?? f.clientHeight / 2)
    if (at) pending.current = { kind: 'anchor', at }
  }
  useLayoutEffect(() => {
    const p = pending.current
    const was = drawn.current
    pending.current = null
    drawn.current = scale
    const f = frameRef.current
    if (!f || !p || !scale || (p.kind === 'anchor' && scale === was)) return
    stop()
    const el = pageEl(f, p.kind === 'page' ? p.page : p.at.page)
    if (!el) return
    // A fitted page sits square in the view across, whatever wider pages stick out beyond it.
    const fitted = fit.mode === 'free' ? null : pageEl(f, fit.page)
    const left = fitted ? fitted.offsetLeft - Math.max(GUTTER, (f.clientWidth - fitted.offsetWidth) / 2) : null
    if (p.kind === 'page') f.scrollTo({ top: el.offsetTop - Math.max(PAGE_MARGIN, (f.clientHeight - el.offsetHeight) / 2), left: left ?? 0, behavior: 'auto' })
    else f.scrollTo({ top: el.offsetTop + p.at.uy * scale - p.at.ay, left: left ?? el.offsetLeft + p.at.ux * scale - p.at.ax, behavior: 'auto' })
  })

  /** The fit a scale is close enough to settle on, if any. */
  const fitNear = (s: number): Fit | null => {
    const { widthFit, pageFit } = live.current
    const n = frameRef.current ? pageInFocus(frameRef.current) : 1
    if (Math.abs(s / widthFit(n) - 1) < SNAP) return { mode: 'width', page: n }
    return Math.abs(s / pageFit(n) - 1) < SNAP ? { mode: 'page', page: n } : null
  }
  /** Zoom by a factor about a point in the frame; a step (not a pinch, which settles when it ends) lands on a fit it comes close to. */
  const zoomBy = (factor: number, ax?: number, ay?: number, step = true) => {
    hold(ax, ay)
    setFit((f) => {
      const { base, widthFit, pageFit, minZoom } = live.current
      const z = f.mode === 'free' ? f.zoom : (f.mode === 'width' ? widthFit(f.page) : pageFit(f.page)) / base
      const zoom = Math.min(MAX_ZOOM, Math.max(minZoom, z * factor))
      return (step && fitNear(zoom * base)) || { mode: 'free', zoom }
    })
  }
  /** Fill the width with the page in focus, holding the view still at its middle. */
  const fitWidth = () => {
    const f = frameRef.current
    if (!f) return
    hold()
    setFit({ mode: 'width', page: pageInFocus(f) })
  }
  /** Show the page in focus whole, centred: the one filling most of the view, however far in. */
  const fitPage = () => {
    const f = frameRef.current
    if (!f) return
    const page = pageInFocus(f)
    pending.current = { kind: 'page', page }
    setFit({ mode: 'page', page })
  }

  useLayoutEffect(() => {
    const el = frameRef.current!
    const ro = new ResizeObserver(() => {
      hold()
      setFrameSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Pinch, or Ctrl and the wheel, zooms the pages about the pointer (never the page around them),
  // anywhere over the reader. The point it started on is held under the pointer for the whole
  // gesture (while a page is narrower than the view it stays centred, so that may take a moment).
  // When it ends close to a fit, it settles on that fit.
  useEffect(() => {
    const shell = shellRef.current!
    let settle = 0
    let gesture: Anchor | null = null
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const f = frameRef.current!
      const r = f.getBoundingClientRect()
      const ax = Math.min(Math.max(e.clientX - r.left, 0), f.clientWidth)
      const ay = Math.min(Math.max(e.clientY - r.top, 0), f.clientHeight)
      gesture ??= anchorAt(f, drawn.current, ax, ay)
      if (gesture) pending.current = { kind: 'anchor', at: { ...gesture, ax, ay } }
      zoomBy(2 ** (-e.deltaY * PINCH_RATE), ax, ay, false)
      clearTimeout(settle)
      settle = window.setTimeout(() => {
        gesture = null
        const { fit, scale } = live.current
        const near = fit.mode === 'free' ? fitNear(scale) : null
        if (!near) return
        hold(ax, ay)
        setFit(near)
      }, GESTURE_GAP_MS)
    }
    shell.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      shell.removeEventListener('wheel', onWheel)
      clearTimeout(settle)
    }
  }, [])

  // Which page is in focus, for the page counter and the thumbnails.
  useEffect(() => {
    const frame = frameRef.current!
    const onScroll = () => setCurrent(pageInFocus(frame))
    frame.addEventListener('scroll', onScroll, { passive: true })
    return () => frame.removeEventListener('scroll', onScroll)
  }, [])

  /** Bring a page into view (centred when it fits), at the zoom it is at. */
  const goToPage = (n: number) => {
    const f = frameRef.current
    const el = f && pageEl(f, n)
    if (!f || !el) return
    const top = Math.max(0, el.offsetTop - Math.max(PAGE_MARGIN, (f.clientHeight - el.offsetHeight) / 2))
    glide(top, Math.abs(top - f.scrollTop) <= 3 * f.clientHeight)
  }

  // The arrow keys go page by page, wherever the focus is on the artifact page (not while typing,
  // in the thumbnails, which walk themselves, or under a sheet): down brings the next page's top
  // to the top of the view, up the top of the page above (or of this one, when the view is part way
  // down it). Left and right do the same, unless the page in focus is wider than the view, when they pan.
  // Pressed again while the view is still gliding, a key goes on from where it is heading.
  const aim = useRef<{ top: number; at: number } | null>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const f = frameRef.current
      if (!f) return
      const shown = pageEl(f, pageInFocus(f))
      const across = !shown || (shown.offsetLeft >= f.scrollLeft && shown.offsetLeft + shown.offsetWidth <= f.scrollLeft + f.clientWidth)
      const d = e.key === 'ArrowDown' || (across && e.key === 'ArrowRight') ? 1 : e.key === 'ArrowUp' || (across && e.key === 'ArrowLeft') ? -1 : 0
      if (!d) return
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('.pdf-rail, [role="tablist"], [role="menu"], [role="listbox"]'))) return
      if (document.querySelector('.scrim')) return
      e.preventDefault()
      const now = performance.now()
      const from = aim.current && now - aim.current.at < GLIDE_MS + 120 ? aim.current.top : f.scrollTop
      const tops = [...f.querySelectorAll<HTMLElement>('.pdf-page')].map((el) => Math.max(0, el.offsetTop - PAGE_MARGIN))
      const to = d > 0 ? tops.find((y) => y > from + 8) : tops.filter((y) => y < from - 8).pop()
      if (to === undefined) return
      const top = Math.min(to, f.scrollHeight - f.clientHeight)
      aim.current = { top, at: now }
      glide(top, true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const page = spot.region?.page ?? (spot.auto ? pageOfRegionId(spot.auto) : null)
  const key = `${spot.region?.id ?? ''}|${spot.auto ?? ''}|${focusKey ?? ''}`

  // Find the spot once its page is drawn (its text layer is what a passage is matched in), then
  // bring it into view, once: a zoom afterwards moves the box with the page, not the view to it.
  const placed = useRef<string | null>(null)
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame || !scale || page === null) {
      setBox(null)
      return
    }
    const pageEl = frame.querySelector<HTMLElement>(`.pdf-page[data-page="${page}"]`)
    if (!pageEl) {
      onRegionFound?.(false)
      return
    }
    const scrollTo = (y: number) => glide(y, placed.current !== null)
    let rect: Rect | null = null
    if (!spot.region) rect = { x: 0, y: 0, w: pageEl.clientWidth, h: pageEl.clientHeight }
    else {
      if (!rendered[page]) {
        if (placed.current !== key) scrollTo(pageEl.offsetTop - 24) // draw it, then come back
        return
      }
      const pad = (spot.region.pad ?? HIGHLIGHT.pad) * scale
      const parts: Range[] = []
      const layer = pageEl.querySelector('.textLayer')
      for (const anchor of spot.region.around) {
        const { kind, value } = parseAnchor(anchor)
        const r = kind === 'quote' && layer ? quoteRange(layer, value) : null
        if (r) parts.push(r)
      }
      const found = parts.length ? unionIn(pageEl, parts) : null
      if (found) rect = padRect(found, pad)
      else if (spot.region.box && spot.region.box.every(Number.isFinite)) {
        const [x, y, w, h] = spot.region.box
        rect = { x: x * scale, y: y * scale, w: w * scale, h: h * scale }
      }
    }
    setBox(rect && { page, rect })
    onRegionFound?.(!!rect)
    if (rect && placed.current !== key) {
      const top = pageEl.offsetTop + rect.y
      scrollTo(rect.h > frame.clientHeight - 80 ? top - 24 : top - (frame.clientHeight - rect.h) / 2)
      placed.current = key
      setArrival((n) => n + 1)
    }
  }, [key, page, rendered[page ?? 0], scale])

  // Find: count on every page from its text; mark the matches on the pages that are drawn.
  const query = find?.query ?? ''
  const [counts, setCounts] = useState<number[]>([])
  useEffect(() => {
    let live = true
    if (!query.trim()) {
      setCounts([])
      find?.onCount(0)
      return
    }
    void pageTexts(pdf).then((ts) => {
      if (!live) return
      const c = ts.map((t) => countIn(t, query))
      setCounts(c)
      find?.onCount(c.reduce((a, b) => a + b, 0))
    })
    return () => {
      live = false
    }
  }, [query, pdf])
  const [hits, setHits] = useState<Record<number, Rect[][]>>({})
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame || !query.trim()) {
      setHits({})
      return
    }
    const next: Record<number, Rect[][]> = {}
    for (const n of Object.keys(rendered).map(Number)) {
      if (!counts[n - 1]) continue
      const pageEl = frame.querySelector<HTMLElement>(`.pdf-page[data-page="${n}"]`)
      const layer = pageEl?.querySelector('.textLayer')
      if (!pageEl || !layer) continue
      next[n] = findRanges(layer, query, 'pdf').map((r) => lineRects(r).map((x) => relativeTo(pageEl, x))).filter((rs) => rs.length)
    }
    setHits(next)
  }, [query, counts, rendered, scale])
  // The current match, as a page and its place on that page.
  const total = counts.reduce((a, b) => a + b, 0)
  const at = (() => {
    if (!total) return null
    let k = Math.min(find?.active ?? 0, total - 1)
    for (let i = 0; i < counts.length; i++) {
      if (k < counts[i]!) return { page: i + 1, index: k }
      k -= counts[i]!
    }
    return null
  })()
  const currentHit = at ? hits[at.page]?.[Math.min(at.index, (hits[at.page]?.length ?? 1) - 1)] : undefined
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame || !at) return
    const pageEl = frame.querySelector<HTMLElement>(`.pdf-page[data-page="${at.page}"]`)
    if (!pageEl) return
    const r = currentHit?.[0]
    // Not drawn yet: go to its page, which draws it; the match is placed once its text layer is in.
    if (!r) glide(pageEl.offsetTop - 24, false)
    else glide(pageEl.offsetTop + r.y - frame.clientHeight / 3, true)
  }, [at?.page, at?.index, !!currentHit, query])


  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === '+' || e.key === '=') zoomBy(1.25)
    else if (e.key === '-' || e.key === '_') zoomBy(0.8)
    else if (e.key === '0') fitWidth()
    else if (e.key === '9') fitPage()
    else return
    e.preventDefault()
  }

  return (
    <div ref={shellRef} className={`pdf-shell${rail ? ' has-rail' : ''}`}>
      <div ref={frameRef} className="doc-frame pdf-frame" role="document" aria-label={label} tabIndex={0} onKeyDown={onKeyDown}>
        {scale > 0 &&
          pdf.sizes.map((s, i) => (
            <PdfPage key={i + 1} pdf={pdf} n={i + 1} w={s.w} h={s.h} scale={scale} drawScale={drawScale} onRendered={(n) => setRendered((r) => ({ ...r, [n]: (r[n] ?? 0) + 1 }))}>
              {box?.page === i + 1 && <div key={arrival} className="region-box" style={boxStyle(box.rect)} aria-hidden />}
              {(hits[i + 1] ?? []).map((rs, h) =>
                rs.map((r, j) => (
                  <div key={`${h}.${j}`} className={`find-hit${at?.page === i + 1 && h === Math.min(at.index, (hits[i + 1]?.length ?? 1) - 1) ? ' is-current' : ''}`} style={{ left: r.x - 2, top: r.y - 1, width: r.w + 4, height: r.h + 2 }} aria-hidden />
                )),
              )}
            </PdfPage>
          ))}
      </div>
      {rail && <PageRail pdf={pdf} current={current} counts={counts} onGo={goToPage} />}
      <div className="view-dock doc-dock">
        <div className="view-bar" role="toolbar" aria-label="View">
          <span className="page-count mono" aria-live="polite">
            {current} / {pdf.sizes.length}
          </span>
          <span className="view-bar-rule" aria-hidden />
          <button className="btn icon ghost sm" onClick={() => zoomBy(0.8)} aria-label="Zoom out" title="Zoom out (minus)">
            <Minus size={14} />
          </button>
          <button className="btn icon ghost sm" onClick={() => zoomBy(1.25)} aria-label="Zoom in" title="Zoom in (plus)">
            <Plus size={14} />
          </button>
          <span className="view-bar-rule" aria-hidden />
          <button className="btn icon ghost sm" onClick={fitWidth} aria-label="Fit the page width" title="Fit the page width (0)" aria-pressed={fit.mode === 'width'}>
            <MoveHorizontal size={14} />
          </button>
          <button className="btn icon ghost sm" onClick={fitPage} aria-label="Fit the whole page" title="Fit the whole page (9)" aria-pressed={fit.mode === 'page'}>
            <MoveVertical size={14} />
          </button>
          {many && (
            <>
              <span className="view-bar-rule" aria-hidden />
              <button className="btn icon ghost sm" onClick={() => setPrefs({ pdfPages: !pagesPref })} aria-label="Page thumbnails" title={pagesPref ? 'Hide the page thumbnails' : 'Show the page thumbnails'} aria-pressed={pagesPref}>
                <PanelRight size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * One page: a placeholder of its size until it nears the view, then its picture and its text
 * layer. It is laid out at `scale` (the text layer follows through `--total-scale-factor`) and
 * drawn at `drawScale`, so a zoom stretches the picture at once and sharpens it when it settles.
 */
function PdfPage({ pdf, n, w, h, scale, drawScale, onRendered, children }: { pdf: LoadedPdf; n: number; w: number; h: number; scale: number; drawScale: number; onRendered: (n: number) => void; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const layers = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current!
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setNear(true), { root: el.closest('.doc-frame'), rootMargin: '900px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!near || !drawScale) return
    let cancelled = false
    let task: { cancel: () => void } | null = null
    let text: { cancel: () => void } | null = null
    void (async () => {
      const page = await pdf.doc.getPage(n)
      const viewport = page.getViewport({ scale: drawScale })
      const dpr = window.devicePixelRatio || 1
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      const render = page.render({ canvas, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined })
      task = render
      await render.promise
      if (cancelled) return
      const layer = document.createElement('div')
      layer.className = 'textLayer'
      const tl = new pdf.lib.TextLayer({ textContentSource: page.streamTextContent(), container: layer, viewport })
      text = tl
      await tl.render()
      if (cancelled) return
      layers.current?.replaceChildren(canvas, layer)
      onRendered(n)
    })().catch(() => undefined)
    return () => {
      cancelled = true
      task?.cancel()
      text?.cancel()
    }
  }, [near, drawScale, pdf, n])

  return (
    <div ref={ref} className="pdf-page" data-page={n} style={{ width: w * scale, height: h * scale, ['--total-scale-factor' as string]: scale }}>
      <div ref={layers} className="pdf-layers" />
      {children}
    </div>
  )
}

/** Each page in small, drawn once per document, so the rail can close and open again without redrawing. */
const thumbs = new WeakMap<LoadedPdf, Map<number, Promise<string>>>()
function thumbOf(pdf: LoadedPdf, n: number): Promise<string> {
  let made = thumbs.get(pdf)
  if (!made) thumbs.set(pdf, (made = new Map()))
  let t = made.get(n)
  if (!t) {
    t = (async () => {
      const page = await pdf.doc.getPage(n)
      const viewport = page.getViewport({ scale: (2 * THUMB_W) / pdf.sizes[n - 1]!.w })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      await page.render({ canvas, viewport }).promise
      return canvas.toDataURL('image/png')
    })()
    t.catch(() => made.delete(n))
    made.set(n, t)
  }
  return t
}

/**
 * Every page in small, down the right side: the page in focus ringed teal and kept in sight as
 * the pages scroll, a page with find matches carrying their count. Press one to go to it; the
 * arrow keys, Home and End walk them.
 */
function PageRail({ pdf, current, counts, onGo }: { pdf: LoadedPdf; current: number; counts: number[]; onGo: (n: number) => void }) {
  const ref = useRef<HTMLElement>(null)
  const first = useRef(true)
  useEffect(() => {
    const rail = ref.current
    const el = rail?.querySelector<HTMLElement>(`[data-thumb="${current}"]`)
    if (!rail || !el) return
    const top = el.offsetTop
    const inSight = top >= rail.scrollTop && top + el.offsetHeight <= rail.scrollTop + rail.clientHeight
    if (!inSight) rail.scrollTo({ top: top - (rail.clientHeight - el.offsetHeight) / 2, behavior: first.current || reducedMotion() ? 'auto' : 'smooth' })
    first.current = false
  }, [current])

  const onKeyDown = (e: ReactKeyboardEvent) => {
    const from = Number((e.target as HTMLElement).closest<HTMLElement>('[data-thumb]')?.dataset.thumb ?? current)
    const last = pdf.sizes.length
    const to = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? from + 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? from - 1 : e.key === 'Home' ? 1 : e.key === 'End' ? last : 0
    if (to < 1 || to > last) return
    e.preventDefault()
    onGo(to)
    ref.current?.querySelector<HTMLElement>(`[data-thumb="${to}"]`)?.focus({ preventScroll: true })
  }

  return (
    <nav ref={ref} className="pdf-rail" aria-label="Pages" onKeyDown={onKeyDown}>
      {pdf.sizes.map((s, i) => (
        <PageThumb key={i + 1} pdf={pdf} n={i + 1} h={Math.round((THUMB_W * s.h) / s.w)} current={current === i + 1} hits={counts[i] ?? 0} onGo={onGo} />
      ))}
    </nav>
  )
}

function PageThumb({ pdf, n, h, current, hits, onGo }: { pdf: LoadedPdf; n: number; h: number; current: boolean; hits: number; onGo: (n: number) => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [near, setNear] = useState(false)
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    const el = ref.current!
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setNear(true), { root: el.closest('.pdf-rail'), rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!near) return
    let live = true
    thumbOf(pdf, n).then((s) => live && setSrc(s), () => undefined)
    return () => {
      live = false
    }
  }, [near, pdf, n])
  return (
    <button ref={ref} type="button" className="pdf-thumb" data-thumb={n} tabIndex={current ? 0 : -1} aria-current={current ? 'page' : undefined} aria-label={`Page ${n}${hits ? `, ${hits} match${hits === 1 ? '' : 'es'}` : ''}`} onClick={() => onGo(n)}>
      <span className="pdf-thumb-page" style={{ width: THUMB_W, height: h }}>
        {src && <img src={src} alt="" draggable={false} />}
        {hits > 0 && <span className="pdf-thumb-hits mono">{hits}</span>}
      </span>
      <span className="pdf-thumb-n mono">{n}</span>
    </button>
  )
}

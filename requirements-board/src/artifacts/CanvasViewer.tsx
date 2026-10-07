/**
 * A drawing (SVG, image or mermaid diagram) on the chart paper, panned and zoomed by its own
 * `viewBox`, so it stays sharp at any zoom. It sits inline in a shadow root: its text is real
 * text that selects and copies, its IDs and styles stay inside it, and anchors find its elements.
 *
 * Plain drag never pans a drawing, so it is free to select text (an image, having none, pans).
 * Two fingers on a trackpad pan, a pinch or the wheel zooms, Space or the middle button and a
 * drag pans, and + - 0 zoom in, out and to fit. A region shows as the red box the screenshots
 * use; asked for, the view eases onto it and the box closes in.
 */
import { Crosshair, Map as MapIcon, Minus, Plus, Scan } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { HIGHLIGHT } from '../../shared/highlight.ts'
import type { Rect, Region } from '../../shared/types.ts'
import { GESTURE_GAP_MS, LINE_PX, PINCH_RATE, classifyWheel, type WheelKind } from '../board/trackpad.ts'
import { useHoverPin } from '../board/useHoverPin.ts'
import { unionRects } from '../../shared/artifacts.ts'
import { REGION_MAX_ZOOM, centredAt, fitRect, lerpCamera, limit, minZoom, viewOf, viewBoxOf, zoomAbout, type Camera, type Pane } from './camera.ts'
import type { CanvasContent } from './content.ts'
import { findRanges, lineRects } from './find.ts'
import { canvasRegionRect } from './regionsDom.ts'
import { linkFromEvent, linkRecordIds, type ResolveLink } from './svgLinks.ts'

/** What to find in an artifact, which match is the current one, and where to report how many there are. */
export interface FindProps {
  query: string
  active: number
  onCount: (n: number) => void
}

/** Inside the shadow root: the drawing fills the frame, and its text selects like text. */
const SHADOW_CSS = `
:host { display: block; }
svg { display: block; width: 100%; height: 100%; user-select: text; -webkit-user-select: text; }
text, tspan { cursor: text; }
image { -webkit-user-drag: none; user-select: none; }
a.record-id {
  cursor: pointer;
  -webkit-user-drag: none;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--teal) 50%, transparent);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
}
a.record-id:hover, a.record-id:focus-visible { fill: var(--teal); text-decoration-color: var(--teal); }
a.record-id:focus { outline: none; }
a.record-id:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }
a.record-id.retired { text-decoration-style: dotted; }
`

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const EASE_MS = 420
const easeOut = (t: number) => 1 - (1 - t) ** 3

export interface CanvasViewerProps {
  content: CanvasContent
  /** The region to box and fit to, or null for the whole drawing. */
  region: Region | null
  /** Changes when a region is asked for afresh (even the same one), so the view eases to it again. */
  focusKey?: string
  /** A region to preview with a dashed outline (hovered in the panel). */
  preview?: Region | null
  /** An image: no text to select, so a plain drag pans. */
  dragPans?: boolean
  /** View controls and minimap (off for a side-by-side comparison). */
  controls?: boolean
  label: string
  /** Told whether the region's anchors were found. */
  onRegionFound?: (found: boolean) => void
  find?: FindProps
  /** Record IDs drawn in the text become links: the record each names (null leaves it plain). */
  resolveLink?: ResolveLink
  /** A linked ID was clicked (or Enter pressed on it). */
  onLink?: (id: string) => void
}

/** A press that moves further than this is a text selection, not a click on a link. */
const CLICK_SLOP_PX = 4

export function CanvasViewer({ content, region, focusKey, preview = null, dragPans = false, controls = true, label, onRegionFound, find, resolveLink, onLink }: CanvasViewerProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [pane, setPane] = useState<Pane | null>(null)
  const paneRef = useRef<Pane | null>(null)
  const [cam, setCam] = useState<Camera | null>(null)
  const camRef = useRef<Camera | null>(null)
  const anim = useRef<number>(0)
  // Measured boxes, tagged with the region and drawing they were measured for, so a stale one is never used.
  const [measured, setMeasured] = useState<{ tag: string; box: Rect | null; preview: Rect | null } | null>(null)
  const [mounted, setMounted] = useState(0)
  const [arrival, setArrival] = useState(0)
  const bounds = content.bounds
  const [panning, setPanning] = useState(false)
  const [spaceDown, setSpaceDown] = useState(false)
  const spaceRef = useRef(false)
  const hoverRef = useRef(false)
  const onLinkRef = useRef(onLink)
  onLinkRef.current = onLink

  const apply = useCallback((c: Camera) => {
    camRef.current = c
    setCam(c)
  }, [])
  const bounded = useCallback((c: Camera) => (paneRef.current ? limit(c, bounds, paneRef.current) : c), [bounds])
  const lowest = () => (bounds && paneRef.current ? minZoom(bounds, paneRef.current) : 0.1)

  const ease = useCallback(
    (to: Camera, then?: () => void) => {
      cancelAnimationFrame(anim.current)
      const from = camRef.current
      const p = paneRef.current
      if (!from || !p || reducedMotion()) {
        apply(to)
        then?.()
        return
      }
      const t0 = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / EASE_MS)
        apply(lerpCamera(from, to, easeOut(t), p))
        if (t < 1) anim.current = requestAnimationFrame(step)
        else then?.()
      }
      anim.current = requestAnimationFrame(step)
    },
    [apply],
  )
  useEffect(() => () => cancelAnimationFrame(anim.current), [])

  // The drawing, cloned into the shadow root (one element can only be in one place).
  useLayoutEffect(() => {
    const host = hostRef.current!
    const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = SHADOW_CSS
    const svg = content.svg.cloneNode(true) as SVGSVGElement
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.setAttribute('preserveAspectRatio', 'xMinYMin meet')
    // Record IDs in the text become links here, on the copy shown: the file itself stays plain.
    if (resolveLink) linkRecordIds(svg, resolveLink)
    let down: { x: number; y: number } | null = null
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY }
    }
    const onClick = (e: MouseEvent) => {
      const a = linkFromEvent(e)
      if (!a) return
      // A modified click opens the link in a new tab, as any link would.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      e.preventDefault()
      // A drag that started on the ID selected text: not a click on the link.
      const moved = down && e.detail > 0 && Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP_PX
      down = null
      if (!moved) onLinkRef.current?.(a.getAttribute('data-record')!)
    }
    // The tooltip: SVG shows only a <title> child, which would add to the text, so the host carries it.
    const onOver = (e: PointerEvent) => {
      const tip = linkFromEvent(e)?.getAttribute('data-tip') ?? ''
      if (host.title !== tip) host.title = tip
    }
    const onLeave = () => (host.title = '')
    // A link reached with Tab is brought into view, as find brings a match.
    const onFocus = (e: FocusEvent) => {
      const a = linkFromEvent(e)
      if (a) revealRef.current(a)
    }
    svg.addEventListener('pointerdown', onDown)
    svg.addEventListener('click', onClick)
    svg.addEventListener('pointerover', onOver)
    svg.addEventListener('pointerleave', onLeave)
    svg.addEventListener('focusin', onFocus)
    root.replaceChildren(style, svg)
    svgRef.current = svg
    setMounted((n) => n + 1)
    return () => {
      svg.removeEventListener('pointerdown', onDown)
      svg.removeEventListener('click', onClick)
      svg.removeEventListener('pointerover', onOver)
      svg.removeEventListener('pointerleave', onLeave)
      svg.removeEventListener('focusin', onFocus)
      host.title = ''
      root.replaceChildren()
      svgRef.current = null
    }
  }, [content, resolveLink])

  // The frame's size: the viewBox is the frame at the camera's zoom.
  useLayoutEffect(() => {
    const el = frameRef.current!
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      const next = { w: Math.round(r.width), h: Math.round(r.height) }
      if (!next.w || !next.h) return
      const was = paneRef.current
      paneRef.current = next
      setPane(next)
      // Keep the same middle when the frame resizes (a panel dragged wider).
      if (was && camRef.current) {
        const c = camRef.current
        apply({ ...c, x: c.x + (next.w - was.w) / 2, y: c.y + (next.h - was.h) / 2 })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [apply])

  useLayoutEffect(() => {
    if (svgRef.current && cam && pane) svgRef.current.setAttribute('viewBox', viewBoxOf(cam, pane))
  }, [cam, pane, mounted])

  // The region's box, in the drawing's own units: measured once the drawing is in, and again once fonts load.
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const measure = () => {
      const r = region ? canvasRegionRect(svg, region) : null
      setMeasured({ tag: `${region?.id ?? ''}|${mounted}`, box: r, preview: preview ? canvasRegionRect(svg, preview) : null })
      return r
    }
    const r = measure()
    if (region) onRegionFound?.(!!r)
    let live = true
    void document.fonts?.ready.then(() => live && measure())
    return () => {
      live = false
    }
  }, [region, preview, mounted])
  const fresh = measured?.tag === `${region?.id ?? ''}|${mounted}` ? measured : null
  const box = fresh?.box ?? null
  const previewBox = fresh?.preview ?? null

  // Where the view starts, and where it goes when a region is asked for: fitted to the box, or the whole drawing.
  const fitWhole = useCallback(() => (bounds && paneRef.current ? bounded(fitRect(bounds, paneRef.current, { minZoom: minZoom(bounds, paneRef.current) })) : null), [bounds, bounded])
  const fitBox = useCallback((r: Rect) => (paneRef.current ? bounded(fitRect(r, paneRef.current, { margin: 0.14, maxZoom: REGION_MAX_ZOOM })) : null), [bounded])
  const placed = useRef<string | null>(null)
  useEffect(() => {
    if (!pane || !mounted) return
    const key = `${focusKey ?? ''}|${region?.id ?? ''}|${content.imageUrl}`
    if (placed.current === key) return
    if (region && !box) {
      // The anchors are not measured yet (or were not found): show the whole drawing meanwhile.
      if (!camRef.current) {
        const whole = fitWhole()
        if (whole) apply(whole)
      }
      return
    }
    const first = !camRef.current || placed.current?.split('|')[2] !== content.imageUrl
    placed.current = key
    const target = box ? fitBox(box) : fitWhole()
    if (!target) return
    if (first) {
      apply(target)
      setArrival((n) => n + 1)
    } else ease(target, () => setArrival((n) => n + 1))
  }, [pane, mounted, box, region, focusKey, content.imageUrl])

  // Wheel and pinch: a native listener, because React's is passive and could not stop the page from zooming.
  useEffect(() => {
    const el = frameRef.current!
    let kind: WheelKind | null = null
    let last = 0
    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top] as const
    }
    const onWheel = (e: WheelEvent) => {
      const c = camRef.current
      if (!c || (e.target instanceof Element && e.target.closest('.view-dock'))) return
      const fresh = classifyWheel(e)
      if (e.timeStamp - last > GESTURE_GAP_MS) kind = null
      last = e.timeStamp
      if (fresh === 'trackpad' || kind === null) kind = fresh
      e.preventDefault()
      cancelAnimationFrame(anim.current)
      const unit = e.deltaMode === 1 ? LINE_PX : 1
      const [px, py] = local(e)
      if (fresh === 'pinch') apply(bounded(zoomAbout(c, 2 ** (-e.deltaY * unit * PINCH_RATE), px, py, lowest())))
      else if (kind === 'trackpad') apply(bounded({ ...c, x: c.x - e.deltaX * unit, y: c.y - e.deltaY * unit }))
      else apply(bounded(zoomAbout(c, 2 ** (-e.deltaY * unit * 0.002), px, py, lowest())))
    }
    // Safari's pinch arrives as gesture events.
    let gestureZoom = 1
    const onGestureStart = (e: Event) => {
      e.preventDefault()
      gestureZoom = camRef.current?.zoom ?? 1
    }
    const onGestureChange = (e: Event) => {
      e.preventDefault()
      const g = e as Event & { scale: number; clientX: number; clientY: number }
      const c = camRef.current
      if (!c) return
      const [px, py] = local(g)
      apply(bounded(zoomAbout(c, (gestureZoom * g.scale) / c.zoom, px, py, lowest())))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onGestureStart)
    el.addEventListener('gesturechange', onGestureChange)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', onGestureStart)
      el.removeEventListener('gesturechange', onGestureChange)
    }
  }, [apply, bounded])

  // Space held over the drawing turns a drag into a pan.
  useEffect(() => {
    const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || typing(e.target) || !(hoverRef.current || frameRef.current?.contains(document.activeElement))) return
      e.preventDefault()
      if (!spaceRef.current) {
        spaceRef.current = true
        setSpaceDown(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      spaceRef.current = false
      setSpaceDown(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = e.button === 1 || (e.button === 0 && (spaceRef.current || dragPans))
    if (!pan || (e.target instanceof Element && e.target.closest('.view-dock'))) return
    e.preventDefault()
    cancelAnimationFrame(anim.current)
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    setPanning(true)
    let lx = e.clientX
    let ly = e.clientY
    const move = (ev: PointerEvent) => {
      const c = camRef.current
      if (c) apply(bounded({ ...c, x: c.x + ev.clientX - lx, y: c.y + ev.clientY - ly }))
      lx = ev.clientX
      ly = ev.clientY
    }
    const up = () => {
      setPanning(false)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }

  const zoomBy = (factor: number) => {
    const c = camRef.current
    const p = paneRef.current
    if (c && p) ease(bounded(zoomAbout(c, factor, p.w / 2, p.h / 2, lowest())))
  }
  const fit = () => {
    const whole = fitWhole()
    if (whole) ease(whole)
  }
  const toBox = () => {
    const t = box && fitBox(box)
    if (t) ease(t, () => setArrival((n) => n + 1))
  }

  // Find: each match's line boxes, in the drawing's own units, so they follow every pan and zoom.
  const [hits, setHits] = useState<Rect[][]>([])
  const query = find?.query ?? ''
  useLayoutEffect(() => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm || !query.trim()) {
      setHits([])
      find?.onCount(0)
      return
    }
    const inv = ctm.inverse()
    const toContent = (r: DOMRect): Rect => {
      const a = new DOMPoint(r.left, r.top).matrixTransform(inv)
      const b = new DOMPoint(r.right, r.bottom).matrixTransform(inv)
      return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) }
    }
    const found = findRanges(svg, query, 'svg')
      .map((r) => lineRects(r).map(toContent))
      .filter((rs) => rs.length)
    setHits(found)
    find?.onCount(found.length)
  }, [query, mounted])

  // The current match: brought to the middle of the view, close enough in to read.
  const active = find?.active ?? 0
  useEffect(() => {
    const p = paneRef.current
    const c = camRef.current
    const r = hits.length ? unionRects(hits[Math.min(active, hits.length - 1)]!) : null
    if (!r || !p || !c) return
    const zoom = Math.min(Math.max(c.zoom, 1), REGION_MAX_ZOOM)
    ease(bounded(centredAt({ x: r.x + r.w / 2, y: r.y + r.h / 2 }, zoom, p)))
  }, [hits, active])

  // A focused link outside the view: pan to it, close enough in to read.
  const revealRef = useRef<(el: Element) => void>(() => {})
  revealRef.current = (el) => {
    const p = paneRef.current
    const c = camRef.current
    const f = frameRef.current
    if (!p || !c || !f) return
    // Focus scrolls the clipped frame to the link; the camera does the moving here, so undo that first.
    f.scrollLeft = 0
    f.scrollTop = 0
    const frame = f.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const inView = r.left >= frame.left && r.right <= frame.right && r.top >= frame.top && r.bottom <= frame.bottom
    if (inView) return
    const mid = { x: (r.left + r.width / 2 - frame.left - c.x) / c.zoom, y: (r.top + r.height / 2 - frame.top - c.y) / c.zoom }
    ease(bounded(centredAt(mid, Math.min(Math.max(c.zoom, 1), REGION_MAX_ZOOM), p)))
  }

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === '+' || e.key === '=') zoomBy(1.25)
    else if (e.key === '-' || e.key === '_') zoomBy(0.8)
    else if (e.key === '0') fit()
    else return
    e.preventDefault()
  }

  const toScreen = (r: Rect | null) => (r && cam ? { x: r.x * cam.zoom + cam.x, y: r.y * cam.zoom + cam.y, w: r.w * cam.zoom, h: r.h * cam.zoom } : null)
  const sBox = toScreen(box)
  const sPreview = previewBox && previewBox !== box ? toScreen(previewBox) : null
  const sSheet = toScreen(bounds)

  return (
    <div
      ref={frameRef}
      className={`canvas-frame${panning ? ' panning' : spaceDown || dragPans ? ' can-pan' : ''}`}
      tabIndex={0}
      role="group"
      aria-label={label}
      aria-roledescription="drawing"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerEnter={() => (hoverRef.current = true)}
      onPointerLeave={() => (hoverRef.current = false)}
      // The frame clips the drawing and never scrolls (focus would scroll it to a link): the camera pans.
      onScroll={(e) => {
        e.currentTarget.scrollLeft = 0
        e.currentTarget.scrollTop = 0
      }}
    >
      {sSheet && <div className="canvas-sheet" style={rectStyle(sSheet)} aria-hidden />}
      <div ref={hostRef} className="canvas-host" />
      {sPreview && <div className="region-preview" style={rectStyle(outset(sPreview, 2))} aria-hidden />}
      {sBox && <div key={arrival} className="region-box" style={boxStyle(sBox)} data-region={region?.id} aria-hidden />}
      {cam &&
        hits.map((rs, i) =>
          rs.map((r, j) => <div key={`${i}.${j}`} className={`find-hit${i === Math.min(active, hits.length - 1) ? ' is-current' : ''}`} style={rectStyle(outset(toScreen(r)!, 2))} aria-hidden />),
        )}
      {controls && bounds && cam && pane && (
        <CanvasControls bounds={bounds} imageUrl={content.imageUrl} view={viewOf(cam, pane)} box={box} onCentre={(p, animate) => {
          const c = camRef.current!
          const next = bounded({ zoom: c.zoom, x: pane.w / 2 - p.x * c.zoom, y: pane.h / 2 - p.y * c.zoom })
          if (animate) ease(next)
          else apply(next)
        }} onZoom={zoomBy} onFit={fit} onBox={box ? toBox : null} />
      )}
    </div>
  )
}

const rectStyle = (r: Rect): CSSProperties => ({ left: r.x, top: r.y, width: r.w, height: r.h })
const outset = (r: Rect, n: number): Rect => ({ x: r.x - n, y: r.y - n, w: r.w + 2 * n, h: r.h + 2 * n })

/** The red box: the stroke sits outside the padded box, as `npm run capture` draws it. */
export function boxStyle(r: Rect): CSSProperties {
  const { width, colour, radius, glow } = HIGHLIGHT
  return { ...rectStyle(outset(r, width)), borderWidth: width, borderColor: colour, borderRadius: radius, boxShadow: glow }
}

/* ------------------------------------------------------------- controls */

const MAP_MAX_W = 300
const MAP_MAX_H = 180
const MAP_MIN_W = 160
const MAP_MIN_H = 64

interface ControlsProps {
  bounds: Rect
  imageUrl: string
  view: Rect
  box: Rect | null
  onCentre: (p: { x: number; y: number }, animate: boolean) => void
  onZoom: (factor: number) => void
  onFit: () => void
  /** Back to the region's box, when there is one. */
  onBox: (() => void) | null
}

/** Bottom right, beside the new-card plus, as on the board: the minimap button, zoom out and in, fit, and back to the highlight. */
function CanvasControls({ bounds, imageUrl, view, box, onCentre, onZoom, onFit, onBox }: ControlsProps) {
  const { open, pinned, togglePin, enterButton, enterMap, leaveZone } = useHoverPin()
  const svgRef = useRef<SVGSVGElement>(null)
  const frame = useMemo(() => {
    const pad = Math.max(bounds.w, bounds.h) * 0.03
    const bw = bounds.w + 2 * pad
    const bh = bounds.h + 2 * pad
    const s = Math.min(MAP_MAX_W / bw, MAP_MAX_H / bh)
    const w = Math.max(MAP_MIN_W, bw * s)
    const h = Math.max(MAP_MIN_H, bh * s)
    return { w, h, x: bounds.x + bounds.w / 2 - w / s / 2, y: bounds.y + bounds.h / 2 - h / s / 2, vw: w / s, vh: h / s }
  }, [bounds])
  const toContent = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: frame.x + ((e.clientX - r.left) / r.width) * frame.vw, y: frame.y + ((e.clientY - r.top) / r.height) * frame.vh }
  }
  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    onCentre(toContent(e), true)
    const move = (ev: PointerEvent) => onCentre(toContent(ev), false)
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }
  const v = view
  return (
    <div className="view-dock canvas-dock">
      <div className={`minimap-bridge${open ? ' is-open' : ''}`} onPointerEnter={enterMap} onPointerLeave={leaveZone}>
        <div className="minimap" style={{ width: frame.w, height: frame.h }}>
          <svg ref={svgRef} className="minimap-map" viewBox={`${frame.x} ${frame.y} ${frame.vw} ${frame.vh}`} role="img" aria-label="Minimap: press to move the view there" onPointerDown={onPointerDown}>
            <rect x={bounds.x} y={bounds.y} width={bounds.w} height={bounds.h} fill="#fff" />
            <image href={imageUrl} x={bounds.x} y={bounds.y} width={bounds.w} height={bounds.h} preserveAspectRatio="none" />
            {box && <rect className="minimap-region" x={box.x} y={box.y} width={box.w} height={box.h} vectorEffect="non-scaling-stroke" />}
            <path className="minimap-mask" fillRule="evenodd" d={`M${frame.x - frame.vw},${frame.y - frame.vh}h${frame.vw * 3}v${frame.vh * 3}h${-frame.vw * 3}z M${v.x},${v.y}h${v.w}v${v.h}h${-v.w}z`} />
            <rect className="minimap-view" x={v.x} y={v.y} width={v.w} height={v.h} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
      <div className="view-bar" role="toolbar" aria-label="View">
        <button className="btn icon ghost sm" aria-pressed={pinned} aria-expanded={open} onClick={togglePin} onPointerEnter={enterButton} onPointerLeave={leaveZone} aria-label="Minimap" title={pinned ? 'Unpin the minimap' : 'Minimap: press to pin it open'}>
          <MapIcon size={14} />
        </button>
        <span className="view-bar-rule" aria-hidden />
        <button className="btn icon ghost sm" onClick={() => onZoom(0.8)} aria-label="Zoom out" title="Zoom out (minus)">
          <Minus size={14} />
        </button>
        <button className="btn icon ghost sm" onClick={() => onZoom(1.25)} aria-label="Zoom in" title="Zoom in (plus)">
          <Plus size={14} />
        </button>
        <button className="btn icon ghost sm" onClick={onFit} aria-label="Fit the whole drawing" title="Fit the whole drawing (0)">
          <Scan size={14} />
        </button>
        {onBox && (
          <>
            <span className="view-bar-rule" aria-hidden />
            <button className="btn icon ghost sm region-go" onClick={onBox} aria-label="Back to the highlight" title="Back to the highlight">
              <Crosshair size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

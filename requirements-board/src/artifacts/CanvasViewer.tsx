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
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { HIGHLIGHT } from '../../shared/highlight.ts'
import type { Rect, Region, StepMove } from '../../shared/types.ts'
import { GESTURE_GAP_MS, LINE_PX, PINCH_RATE, classifyWheel, type WheelKind } from '../board/trackpad.ts'
import { useHoverPin } from '../board/useHoverPin.ts'
import { unionRects } from '../../shared/artifacts.ts'
import { REGION_MAX_ZOOM, centredAt, fitRect, frameStep, lerpCamera, limit, minZoom, viewOf, viewBoxOf, zoomAbout, type Camera, type Pane } from './camera.ts'
import type { CanvasContent } from './content.ts'
import { findRanges, lineRects } from './find.ts'
import { anchorsRect, canvasRegionRect } from './regionsDom.ts'
import { playFlights, type Flight } from './stepMoves.ts'
import { STEP_CSS, STEP_FADE, applyStepState, insideOff, type StepView } from './stepsDom.ts'
import { anchorFromEvent, fromUseCopy, isRecordLink, linkFromEvent, linkRecordIds, type ResolveLink } from './svgLinks.ts'

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
${STEP_CSS}`

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const EASE_MS = 420
/** Framing a followed step travels further than a nudge, so it takes a little longer; its moves fly once it settles. */
const STEP_EASE_MS = 560
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
  /** More buttons at the end of the view bar (the artifact page's full screen). */
  viewExtra?: ReactNode
  label: string
  /** Told whether the region's anchors were found. */
  onRegionFound?: (found: boolean) => void
  find?: FindProps
  /** Record IDs drawn in the text become links: the record each names (null leaves it plain). */
  resolveLink?: ResolveLink
  /** A linked ID was clicked (or Enter pressed on it). */
  onLink?: (id: string) => void
  /** A stepped diagram's state (`stepState` from `shared/steps.ts`): what is hidden and what is lit. Null or absent is the whole drawing. */
  stepState?: StepView | null
  /**
   * A stepped diagram's moves to fly, once per `key`: set when the reader steps forward onto a step
   * with moves (or asks to replay it). `before`: the state to start from (a replay), else the
   * drawing is already at the step. Present at the first paint, it never plays.
   */
  flight?: { key: string; moves: StepMove[]; before: StepView | null } | null
  /**
   * A stepped diagram whose view follows the steps (`step_view: follow`): the step's focus anchors
   * (`stepFocusAnchors`) and a key naming the step, '' for the whole drawing. On arriving at a step
   * the view frames its focus unless that is already in view (`frameStep`); back to the whole
   * drawing, it fits the whole. Null or absent: stepping leaves the view where it is.
   */
  follow?: { key: string; anchors: string[] } | null
}

/** A press that moves further than this is a text selection, not a click on a link. */
const CLICK_SLOP_PX = 4

/** The element a drawing's own link points at (`#id`, as `href` or XLink `href`), or null for any other link or a missing spot. */
function spotOf(svg: SVGSVGElement, a: Element): Element | null {
  const href = (a.getAttribute('href') ?? a.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? '').trim()
  if (!href.startsWith('#') || href.length < 2) return null
  let id = href.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch {
    // kept as written
  }
  return [...svg.querySelectorAll('[id]')].find((el) => el.id === id) ?? null
}

export function CanvasViewer({ content, region, focusKey, preview = null, dragPans = false, controls = true, viewExtra, label, onRegionFound, find, resolveLink, onLink, stepState = null, flight = null, follow = null }: CanvasViewerProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [pane, setPane] = useState<Pane | null>(null)
  const paneRef = useRef<Pane | null>(null)
  const [cam, setCam] = useState<Camera | null>(null)
  const camRef = useRef<Camera | null>(null)
  const anim = useRef<number>(0)
  // When the view's current ease ends: a followed step's moves wait for it, so the reader sees them fly.
  const settleAt = useRef(0)
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
  // The step's state, as a key that only changes when the state does (a fresh object every render would not do).
  const stepKey = stepState && (stepState.hidden.length || stepState.highlight.length) ? JSON.stringify(stepState) : ''
  const stepRef = useRef(stepState)
  stepRef.current = stepState
  // Moves in flight, and the flight asked for last (the one present at the first paint never plays).
  const flightRef = useRef<Flight | null>(null)
  const flownKey = useRef(flight?.key ?? null)
  const flightProp = useRef(flight)
  flightProp.current = flight
  // Counts flights landed, so find and the region box measure again once nothing is in the air.
  const [landed, setLanded] = useState(0)
  const ground = () => {
    flightRef.current?.cancel()
    flightRef.current = null
  }

  const apply = useCallback((c: Camera) => {
    camRef.current = c
    setCam(c)
  }, [])
  const bounded = useCallback((c: Camera) => (paneRef.current ? limit(c, bounds, paneRef.current) : c), [bounds])
  const lowest = () => (bounds && paneRef.current ? minZoom(bounds, paneRef.current) : 0.1)

  const ease = useCallback(
    (to: Camera, then?: () => void, ms = EASE_MS) => {
      cancelAnimationFrame(anim.current)
      const from = camRef.current
      const p = paneRef.current
      if (!from || !p || reducedMotion()) {
        apply(to)
        then?.()
        return
      }
      const t0 = performance.now()
      settleAt.current = t0 + ms
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms)
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
    // A link in a drawing never moves the board or opens anything: only the board's record links
    // do (a plain click opens the record, a modified one a new tab). A link to one of the drawing's
    // own spots (`#id`) brings that spot into view; any other does nothing.
    const onClick = (e: MouseEvent) => {
      const a = anchorFromEvent(e)
      if (!a) {
        if (fromUseCopy(e)) e.preventDefault()
        return
      }
      const record = isRecordLink(a)
      const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0
      // A modified click on a record link opens it in a new tab, as any link would.
      if (record && modified) return
      e.preventDefault()
      // A drag that started on the link selected text: not a click on it.
      const moved = down && e.detail > 0 && Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP_PX
      down = null
      if (moved || modified) return
      if (record) onLinkRef.current?.(a.getAttribute('data-record')!)
      else {
        const spot = spotOf(svg, a)
        if (spot) revealRef.current(spot)
      }
    }
    // A middle click opens a link in a new tab without a click event: only a record link may.
    const onAux = (e: MouseEvent) => {
      const a = anchorFromEvent(e)
      if (a ? !isRecordLink(a) : fromUseCopy(e)) e.preventDefault()
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
    svg.addEventListener('auxclick', onAux)
    svg.addEventListener('pointerover', onOver)
    svg.addEventListener('pointerleave', onLeave)
    svg.addEventListener('focusin', onFocus)
    // The step's state goes on before the copy is in, so a refresh never flashes the whole drawing.
    applyStepState(svg, stepRef.current)
    root.replaceChildren(style, svg)
    svgRef.current = svg
    setMounted((n) => n + 1)
    return () => {
      svg.removeEventListener('pointerdown', onDown)
      svg.removeEventListener('click', onClick)
      svg.removeEventListener('auxclick', onAux)
      svg.removeEventListener('pointerover', onOver)
      svg.removeEventListener('pointerleave', onLeave)
      svg.removeEventListener('focusin', onFocus)
      host.title = ''
      // A refresh mid-flight: the copy goes with the old drawing, and the new one is static.
      ground()
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

  // A stepped diagram's state, on every copy mounted and at every step.
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    ground()
    applyStepState(svg, stepRef.current)
  }, [mounted, stepKey])
  useEffect(() => ground, [])
  // The fade between steps starts only after the first paint, so a drawing opened at a step never fades in from the whole picture.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => svg.classList.add(STEP_FADE))))
    return () => cancelAnimationFrame(id)
  }, [mounted])

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
  }, [region, preview, mounted, stepKey, landed])
  const fresh = measured?.tag === `${region?.id ?? ''}|${mounted}` ? measured : null
  const box = fresh?.box ?? null
  const previewBox = fresh?.preview ?? null

  // Where the view starts, and where it goes when a region is asked for: fitted to the box, or the
  // whole drawing. A followed step frames its focus. A layout effect, so a drawing opened at a step
  // is framed before it is first seen, and so it runs before the flight below, which waits for it.
  const fitWhole = useCallback(() => (bounds && paneRef.current ? bounded(fitRect(bounds, paneRef.current, { minZoom: minZoom(bounds, paneRef.current) })) : null), [bounds, bounded])
  const fitBox = useCallback((r: Rect) => (paneRef.current ? bounded(fitRect(r, paneRef.current, { margin: 0.14, maxZoom: REGION_MAX_ZOOM })) : null), [bounded])
  const placed = useRef<string | null>(null)
  // '' when the view does not follow; 'f' the whole drawing and 'f<step>' a step when it does.
  const followKey = follow ? `f${follow.key}` : ''
  const followRef = useRef(follow)
  followRef.current = follow
  useLayoutEffect(() => {
    if (!pane || !mounted) return
    const key = `${focusKey ?? ''}|${region?.id ?? ''}|${content.imageUrl}|${followKey}`
    if (placed.current === key) return
    if (region && !box) {
      // The anchors are not measured yet (or were not found): show the whole drawing meanwhile.
      if (!camRef.current) {
        const whole = fitWhole()
        if (whole) apply(whole)
      }
      return
    }
    const prev = placed.current?.split('|')
    const first = !camRef.current || prev?.[2] !== content.imageUrl
    placed.current = key
    const whole = fitWhole()
    let target = box ? fitBox(box) : whole
    let ms = EASE_MS
    const f = followRef.current
    if (!box && f?.key) {
      // A followed step: framed when its focus is off screen, or on arriving from the whole drawing too small to read.
      const svg = svgRef.current
      const focus = svg && f.anchors.length ? anchorsRect(svg, f.anchors) : null
      const from = first ? whole : camRef.current
      const framed = focus && from ? frameStep(focus, from, pane, { enter: first || !(prev?.[3] ?? '').slice(1), minZoom: lowest() }) : null
      target = framed ? bounded(framed) : first ? whole : null
      ms = STEP_EASE_MS
    }
    if (!target) return
    if (first) {
      apply(target)
      setArrival((n) => n + 1)
    } else ease(target, () => setArrival((n) => n + 1), ms)
  }, [pane, mounted, box, region, focusKey, content.imageUrl, followKey])

  // A flight asked for: put the drawing at the step (from the step before, for a replay) and fly
  // its moves. A new step, a jump or a refresh cancels it first; reduced motion never flies.
  const flightKey = flight?.key ?? null
  useLayoutEffect(() => {
    if (flightKey === flownKey.current) return
    flownKey.current = flightKey
    ground()
    const svg = svgRef.current
    const f = flightProp.current
    if (!svg || !f || !flightKey || reducedMotion()) return
    if (f.before) {
      applyStepState(svg, f.before)
      svg.getBoundingClientRect() // the earlier state is drawn, so the step's reveal fades in again
      applyStepState(svg, stepRef.current)
    }
    // A followed step's view is still easing onto it: the moves set off once it settles.
    const wait = Math.max(0, settleAt.current - performance.now())
    flightRef.current = playFlights(svg, f.moves, () => {
      flightRef.current = null
      setLanded((n) => n + 1)
    }, wait)
  }, [flightKey])
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
    // Text a step has not revealed yet is not there to find.
    const found = findRanges(svg, query, 'svg', insideOff)
      .map((r) => lineRects(r).map(toContent))
      .filter((rs) => rs.length)
    // Unchanged by a step: keep the same hits, so the view is not brought back to the current match.
    setHits((was) => (JSON.stringify(was) === JSON.stringify(found) ? was : found))
    find?.onCount(found.length)
  }, [query, mounted, stepKey, landed])

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
        }} onZoom={zoomBy} onFit={fit} onBox={box ? toBox : null} extra={viewExtra} />
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
  extra?: ReactNode
}

/** Bottom right, as on the board: the minimap button, zoom out and in, fit, back to the highlight, and any extra (full screen). */
function CanvasControls({ bounds, imageUrl, view, box, onCentre, onZoom, onFit, onBox, extra }: ControlsProps) {
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
        {extra && (
          <>
            <span className="view-bar-rule" aria-hidden />
            {extra}
          </>
        )}
      </div>
    </div>
  )
}

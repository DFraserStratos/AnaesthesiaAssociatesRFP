/**
 * The board's view controls, bottom right beside the new-card plus: a bar of two buttons, the
 * minimap and one zoom toggle. The minimap opens to the left of the bar while the pointer is on
 * the map button, and stays open while it moves across onto the minimap (the two are one hover
 * zone, bridged so there is no gap to fall through); it closes a moment after the pointer leaves
 * both. Pressing the map button pins it open, or unpins it. The toggle zooms out to fit the whole
 * map; pressed again before the view moves, it zooms back in to where it was (or to 100% if it
 * was no closer in than the fit).
 *
 * The minimap shows the whole map, the part on screen outlined in teal. The frame is the map's
 * own bounds (`panLimits.ts`), never the map plus wherever the view has wandered, so it holds
 * still while panning. Press anywhere on it to jump the view there; keep holding and drag to
 * sweep along the map. Render inside <ReactFlow>.
 */
import { Panel, useReactFlow, useStore, type Node, type Viewport } from '@xyflow/react'
import { Map as MapIcon, ZoomIn, ZoomOut } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { CardData } from './cardData.ts'
import type { LaneBand } from './mappedLayout.ts'
import type { Bounds } from './panLimits.ts'

/** The frame's largest size and the smallest, in pixels. */
const MAX_W = 360
const MAX_H = 180
const MIN_W = 200
const MIN_H = 64
/** How long the pointer rests on the map button before the minimap opens, so sweeping past it doesn't flash it. */
const OPEN_MS = 90
/** How long the pointer may stray off the hover zone before the minimap closes, so a slip doesn't snap it shut. */
const CLOSE_MS = 280
/** A little paper round the map inside the frame, as a share of it. */
const INSET = 0.04
/** Blocks by type. SVG fills, not CSS, so these mirror the --ty-* tokens in styles.css. */
const TYPE_HEX = { epic: '#e06c00', feature: '#773b93', story: '#009ccc' } as const
const TYPE_OPACITY = { epic: 0.9, feature: 0.75, story: 0.45 } as const

const motion = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200)

interface Props {
  bounds: Bounds | null
  nodes: Node[]
  /** Mapped's lanes, drawn as faint rules. */
  lanes?: LaneBand[]
  selected: string | null
  /** Screen pixels the item panel covers on the left of the board. */
  dock: number
  minZoom: number
  maxZoom: number
  /** Pull a viewport back inside the board's limits. */
  limit: (vp: Viewport) => Viewport
  /** Fit the whole map; settles when the ease ends. */
  onFit: () => Promise<unknown>
}

export function BoardMinimap({ bounds, nodes, lanes, selected, dock, minZoom, maxZoom, limit, onFit }: Props) {
  const rf = useReactFlow()
  const [tx, ty, zoom] = useStore((s) => s.transform)
  const paneW = useStore((s) => s.width)
  const paneH = useStore((s) => s.height)
  const svgRef = useRef<SVGSVGElement>(null)
  // The zoom an ease is heading for: a press mid-ease builds on where it is going, not where it has got to.
  const aim = useRef({ x: 0, y: 0, zoom: 1, until: 0 })
  // Open while the pointer is in the hover zone (the map button and the minimap), or while pinned.
  // A drag on the minimap holds the pointer captured, so it stays open until let go.
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const timer = useRef<number>(undefined)
  const later = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(fn, ms)
  }
  const enterButton = () => (hover ? window.clearTimeout(timer.current) : later(() => setHover(true), OPEN_MS))
  const enterMap = () => window.clearTimeout(timer.current)
  const leaveZone = () => later(() => setHover(false), CLOSE_MS)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const open = hover || pinned
  // After a fit: the view it left and the view it fitted to. Pressing again while still on the fitted view zooms back.
  const [back, setBack] = useState<{ from: Viewport; fitted: Viewport } | null>(null)

  // The frame: the map's bounds with a little inset, scaled to fit, then widened or heightened to the minimum size.
  const frame = useMemo(() => {
    if (!bounds) return null
    const pad = Math.max(bounds.w, bounds.h) * INSET
    const bw = bounds.w + 2 * pad
    const bh = bounds.h + 2 * pad
    const s = Math.min(MAX_W / bw, MAX_H / bh)
    const w = Math.max(MIN_W, bw * s)
    const h = Math.max(MIN_H, bh * s)
    const vw = w / s
    const vh = h / s
    return { w, h, x: bounds.x + bounds.w / 2 - vw / 2, y: bounds.y + bounds.h / 2 - vh / 2, vw, vh }
  }, [bounds])

  // What is on screen, in flow coordinates: the board right of the panel.
  const visW = Math.max(0, paneW - dock)
  const view = { x: (dock - tx) / zoom, y: -ty / zoom, w: visW / zoom, h: paneH / zoom }

  const easing = () => performance.now() < aim.current.until
  const aimedZoom = () => (easing() ? aim.current.zoom : rf.getZoom())
  /** Centre the visible board on a flow point, at a zoom. Linear, so a jump never swoops out and back in as d3's default ease does. */
  const centreAt = (fx: number, fy: number, z: number, duration: number) => {
    aim.current = { x: fx, y: fy, zoom: z, until: performance.now() + duration }
    void rf.setViewport(limit({ x: dock + visW / 2 - fx * z, y: paneH / 2 - fy * z, zoom: z }), { duration, interpolate: 'linear' })
  }
  const toFlow = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: frame!.x + ((e.clientX - r.left) / r.width) * frame!.vw, y: frame!.y + ((e.clientY - r.top) / r.height) * frame!.vh }
  }
  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const p = toFlow(e)
    centreAt(p.x, p.y, aimedZoom(), motion())
    const move = (ev: PointerEvent) => {
      const q = toFlow(ev)
      centreAt(q.x, q.y, aimedZoom(), 0)
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }
  const same = (a: Viewport, b: Viewport) => Math.abs(a.zoom - b.zoom) < 1e-3 && Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1
  const fitted = !!back && same({ x: tx, y: ty, zoom }, back.fitted)
  const toggleZoom = () => {
    if (fitted) {
      setBack(null)
      // No closer in than the fit before it: zoom in to 100% about the middle instead.
      if (back.from.zoom <= back.fitted.zoom + 1e-3) centreAt(view.x + view.w / 2, view.y + view.h / 2, Math.min(maxZoom, Math.max(minZoom, 1)), motion())
      else void rf.setViewport(limit(back.from), { duration: motion() * 2 })
      return
    }
    const from = rf.getViewport()
    void onFit().then(() => setBack({ from, fitted: rf.getViewport() }))
  }

  return (
    <Panel position="bottom-right" className="view-dock">
      {frame && (
        // The bridge's transparent padding on the right joins it to the bar, so the pointer never crosses a gap.
        <div className={`minimap-bridge${open ? ' is-open' : ''}`} onPointerEnter={enterMap} onPointerLeave={leaveZone}>
          <div className="minimap" style={{ width: frame.w, height: frame.h }}>
            <svg
              ref={svgRef}
              className="minimap-map"
              viewBox={`${frame.x} ${frame.y} ${frame.vw} ${frame.vh}`}
              role="img"
              aria-label="Minimap: press to move the view there"
              onPointerDown={onPointerDown}
            >
              <MinimapContent nodes={nodes} lanes={lanes} selected={selected} left={bounds!.x} width={bounds!.w} />
              {/* The rest of the map, veiled; the view, clear and outlined. */}
              <path
                className="minimap-mask"
                fillRule="evenodd"
                d={`M${frame.x - frame.vw},${frame.y - frame.vh}h${frame.vw * 3}v${frame.vh * 3}h${-frame.vw * 3}z M${view.x},${view.y}h${view.w}v${view.h}h${-view.w}z`}
              />
              <rect className="minimap-view" x={view.x} y={view.y} width={view.w} height={view.h} vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      )}
      <div className="view-bar" role="toolbar" aria-label="View">
        <button
          className="btn icon ghost sm"
          aria-pressed={pinned}
          aria-expanded={open}
          onClick={() => setPinned((p) => !p)}
          onPointerEnter={enterButton}
          onPointerLeave={leaveZone}
          aria-label="Minimap"
          title={pinned ? 'Unpin the minimap' : 'Minimap: press to pin it open'}
        >
          <MapIcon size={14} />
        </button>
        <span className="view-bar-rule" aria-hidden />
        <button
          className="btn icon ghost sm"
          onClick={toggleZoom}
          aria-label={fitted ? 'Zoom back in' : 'Fit the whole map'}
          title={fitted ? 'Zoom back in' : 'Fit the whole map'}
        >
          {fitted ? <ZoomIn size={14} /> : <ZoomOut size={14} />}
        </button>
      </div>
    </Panel>
  )
}

/** The map itself: lane rules and a block per card. Redrawn when the cards change, not on every pan. */
const MinimapContent = memo(function MinimapContent({ nodes, lanes, selected, left, width }: { nodes: Node[]; lanes?: LaneBand[]; selected: string | null; left: number; width: number }) {
  const cards = nodes.filter((n) => n.type === 'card' && !n.hidden)
  // Epics first, then features, then stories on top, as on the board.
  const order = { epic: 0, feature: 1, story: 2 } as const
  cards.sort((a, b) => order[(a.data as CardData).item.type] - order[(b.data as CardData).item.type])
  const open = cards.find((n) => n.id === selected)
  return (
    <g>
      {lanes
        ?.filter((l) => l.head > 0)
        .map((l) => <line key={l.key ?? ''} className="minimap-lane" x1={left} x2={left + width} y1={l.y} y2={l.y} vectorEffect="non-scaling-stroke" />)}
      {cards.map((n) => {
        const d = n.data as CardData
        const t = d.item.type
        return (
          <rect
            key={n.id}
            x={n.position.x}
            y={n.position.y}
            width={d.w}
            height={d.h}
            rx={t === 'story' ? 4 : 6}
            fill={TYPE_HEX[t]}
            opacity={TYPE_OPACITY[t] * (d.tone === 'is-faded' ? 0.25 : 1)}
          />
        )
      })}
      {open && (
        <rect
          className="minimap-open"
          x={open.position.x}
          y={open.position.y}
          width={(open.data as CardData).w}
          height={(open.data as CardData).h}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  )
})

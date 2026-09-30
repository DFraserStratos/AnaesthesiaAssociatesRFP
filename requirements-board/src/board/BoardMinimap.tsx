/**
 * The board's minimap, bottom right: the whole map in one frame, the part on screen outlined in
 * teal. The frame is the map's own bounds (`panLimits.ts`), never the map plus wherever the view
 * has wandered, so it holds still while panning. Press anywhere on it to jump the view there;
 * keep holding and drag to sweep along the map. Under it, the zoom row: fit, out, the zoom (press
 * for 100%), in. Render inside <ReactFlow>.
 */
import { Panel, useReactFlow, useStore, type Node, type Viewport } from '@xyflow/react'
import { Maximize, Minus, Plus } from 'lucide-react'
import { memo, useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { CardData } from './cardData.ts'
import type { LaneBand } from './mappedLayout.ts'
import type { Bounds } from './panLimits.ts'

/** The frame's largest size and the smallest (so the zoom row always fits), in pixels. */
const MAX_W = 360
const MAX_H = 180
const MIN_W = 200
const MIN_H = 64
/** A little paper round the map inside the frame, as a share of it. */
const INSET = 0.04
/** Each press of zoom in or out. */
const ZOOM_STEP = 1.25
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
  onFit: () => void
}

export function BoardMinimap({ bounds, nodes, lanes, selected, dock, minZoom, maxZoom, limit, onFit }: Props) {
  const rf = useReactFlow()
  const [tx, ty, zoom] = useStore((s) => s.transform)
  const paneW = useStore((s) => s.width)
  const paneH = useStore((s) => s.height)
  const svgRef = useRef<SVGSVGElement>(null)
  // The zoom an ease is heading for: a press mid-ease builds on where it is going, not where it has got to.
  const aim = useRef({ x: 0, y: 0, zoom: 1, until: 0 })

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

  if (!frame) return null

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
    return { x: frame.x + ((e.clientX - r.left) / r.width) * frame.vw, y: frame.y + ((e.clientY - r.top) / r.height) * frame.vh }
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
  /** Zoom about the middle of the visible board (where an ease is heading, if one is under way). */
  const zoomBy = (factor: number | null) => {
    const from = aimedZoom()
    const next = Math.min(maxZoom, Math.max(minZoom, factor === null ? 1 : from * factor))
    const [x, y] = easing() ? [aim.current.x, aim.current.y] : [view.x + view.w / 2, view.y + view.h / 2]
    centreAt(x, y, next, motion())
  }
  const pct = Math.round(zoom * 100)

  return (
    <Panel position="bottom-right" className="minimap" style={{ width: frame.w }}>
      <svg
        ref={svgRef}
        className="minimap-map"
        width={frame.w}
        height={frame.h}
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
      <div className="minimap-zoom">
        <button className="btn icon ghost sm" onClick={onFit} aria-label="Fit the map" title="Fit the whole map">
          <Maximize size={14} />
        </button>
        <span className="gap" />
        <button className="btn icon ghost sm" onClick={() => zoomBy(1 / ZOOM_STEP)} disabled={zoom <= minZoom + 1e-3} aria-label="Zoom out" title="Zoom out">
          <Minus size={14} />
        </button>
        <button className="btn ghost sm minimap-pct" onClick={() => zoomBy(null)} aria-label={`Zoom ${pct}%, press for 100%`} title="Zoom to 100%">
          {pct}%
        </button>
        <button className="btn icon ghost sm" onClick={() => zoomBy(ZOOM_STEP)} disabled={zoom >= maxZoom - 1e-3} aria-label="Zoom in" title="Zoom in">
          <Plus size={14} />
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

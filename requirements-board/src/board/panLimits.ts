/**
 * The board is not an infinite whiteboard: it pans only so far past the map. The rule is that a
 * map edge can come in no further than the middle of the visible board (the pane, less the item
 * panel docked over its left). The padding is in screen pixels, so it is divided by the zoom to
 * give the extent in flow coordinates, and it is always less than the visible board, so some of
 * the map is on screen at every zoom, and zoomed right out it can still be nudged about rather
 * than locking dead centre. Pure, like the layouts, so the rule is unit-tested.
 */
import type { CoordinateExtent, Viewport } from '@xyflow/react'

export interface Bounds {
  x: number
  y: number
  w: number
  h: number
}

/** The screen the board is seen through: the pane's size and how much of its left the item panel covers. */
export interface Pane {
  w: number
  h: number
  dock: number
}

/** How far into the visible board a map edge can come, as a share of it. */
const REACH = 0.5

/** The union of some boxes (cards), or null when there are none. */
export function boundsOf(boxes: Iterable<Bounds>): Bounds | null {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const b of boxes) {
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.w)
    y1 = Math.max(y1, b.y + b.h)
  }
  return x0 === Infinity ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** The flow-coordinate box the whole pane must stay inside at this zoom (React Flow's `translateExtent`). */
export function panExtent(b: Bounds, zoom: number, pane: Pane): CoordinateExtent {
  const visW = Math.max(0, pane.w - pane.dock)
  return [
    [b.x - (pane.dock + REACH * visW) / zoom, b.y - (REACH * pane.h) / zoom],
    [b.x + b.w + (REACH * visW) / zoom, b.y + b.h + (REACH * pane.h) / zoom],
  ]
}

/** Keep one axis of the pane (flow start `v`, flow length `len`) inside [lo, hi]; centred when it cannot fit, as d3-zoom does. */
const clampAxis = (v: number, len: number, lo: number, hi: number) => (hi - lo < len ? (lo + hi - len) / 2 : Math.min(Math.max(v, lo), hi - len))

/**
 * A viewport pulled back inside the limits. React Flow's own drag and wheel honour the extent,
 * but `setViewport`, `setCenter` and `fitView` do not, so everything the board moves itself goes through here.
 */
export function clampViewport(vp: Viewport, b: Bounds | null, pane: Pane): Viewport {
  if (!b || !pane.w || !pane.h) return vp
  const { zoom } = vp
  const [[x0, y0], [x1, y1]] = panExtent(b, zoom, pane)
  const fx = clampAxis(-vp.x / zoom, pane.w / zoom, x0, x1)
  const fy = clampAxis(-vp.y / zoom, pane.h / zoom, y0, y1)
  const x = -fx * zoom
  const y = -fy * zoom
  return x === vp.x && y === vp.y ? vp : { x, y, zoom }
}

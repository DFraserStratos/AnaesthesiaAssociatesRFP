/**
 * The artifact viewer's camera, as React Flow keeps the board's: screen = content x zoom + (x, y).
 * The drawing's `viewBox` follows from it, so the vector stays sharp at every zoom. Pure, and
 * bounded by the same rule as the board (`panLimits.ts`): an edge comes no further in than the
 * middle of the view.
 */
import type { Rect } from '../../shared/types.ts'
import { clampViewport } from '../board/panLimits.ts'

export interface Camera {
  x: number
  y: number
  zoom: number
}

export interface Pane {
  w: number
  h: number
}

export const MAX_ZOOM = 8
/** Fitting to a region never zooms in further than this: a small spot still shows what is round it. */
export const REGION_MAX_ZOOM = 2

/** As far out as the whole drawing at half its fitted size, and never less than a tenth. */
export const minZoom = (bounds: Rect, pane: Pane) => Math.min(0.1, fitZoom(bounds, pane, 0) / 2)

function fitZoom(r: Rect, pane: Pane, margin: number) {
  return Math.min((pane.w * (1 - 2 * margin)) / r.w, (pane.h * (1 - 2 * margin)) / r.h)
}

/** The camera that centres `r` in the pane with `margin` (a share of the pane) all round. */
export function fitRect(r: Rect, pane: Pane, opts: { margin?: number; maxZoom?: number; minZoom?: number } = {}): Camera {
  const zoom = Math.max(opts.minZoom ?? 0, Math.min(opts.maxZoom ?? MAX_ZOOM, fitZoom(r, pane, opts.margin ?? 0.06)))
  return { zoom, x: pane.w / 2 - (r.x + r.w / 2) * zoom, y: pane.h / 2 - (r.y + r.h / 2) * zoom }
}

/** Zoom by `factor` about a point on screen (pane pixels), keeping what is under it still. */
export function zoomAbout(cam: Camera, factor: number, px: number, py: number, lo: number, hi = MAX_ZOOM): Camera {
  const zoom = Math.min(hi, Math.max(lo, cam.zoom * factor))
  const k = zoom / cam.zoom
  return { zoom, x: px - (px - cam.x) * k, y: py - (py - cam.y) * k }
}

/** What part of the drawing is on screen, in its own units. */
export const viewOf = (cam: Camera, pane: Pane): Rect => ({ x: -cam.x / cam.zoom, y: -cam.y / cam.zoom, w: pane.w / cam.zoom, h: pane.h / cam.zoom })

export const viewBoxOf = (cam: Camera, pane: Pane) => {
  const v = viewOf(cam, pane)
  return `${v.x} ${v.y} ${v.w} ${v.h}`
}

/** A camera pulled back inside the drawing's limits. */
export const limit = (cam: Camera, bounds: Rect | null, pane: Pane): Camera => clampViewport(cam, bounds, { ...pane, dock: 0 })

/** The drawing point at the middle of the screen, and a camera centred on a point. */
export const centreOf = (cam: Camera, pane: Pane) => ({ x: (pane.w / 2 - cam.x) / cam.zoom, y: (pane.h / 2 - cam.y) / cam.zoom })
export const centredAt = (p: { x: number; y: number }, zoom: number, pane: Pane): Camera => ({ zoom, x: pane.w / 2 - p.x * zoom, y: pane.h / 2 - p.y * zoom })

/** In-between camera for an ease: interpolate the zoom geometrically, so a zoom feels even. */
export function lerpCamera(a: Camera, b: Camera, t: number, pane: Pane): Camera {
  const ca = centreOf(a, pane)
  const cb = centreOf(b, pane)
  const zoom = a.zoom * (b.zoom / a.zoom) ** t
  return centredAt({ x: ca.x + (cb.x - ca.x) * t, y: ca.y + (cb.y - ca.y) * t }, zoom, pane)
}

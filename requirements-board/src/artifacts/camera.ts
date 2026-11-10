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

/** Clear space kept round what a step frames, in pane pixels: the find bar sits top right, the step bar and view bar along the bottom. */
export interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}
export const STEP_INSETS: Insets = { top: 64, right: 40, bottom: 80, left: 40 }
/** A followed step is never framed closer in than the drawing's own size: past that it is only bigger, not more readable. */
export const STEP_MAX_ZOOM = 1
/** Arriving from the whole drawing, a step already in view is still framed when the view is this much further out than its framing would be. */
export const STEP_READABLE_SHARE = 0.75

/**
 * Where the view goes on arriving at a step whose view follows the steps, or null to leave it
 * where it is. `box` is the step's focus (drawing units). Null when the box, inset, is already on
 * screen; arriving from the whole drawing (`enter`), it must also be near readable size there (at
 * least `STEP_READABLE_SHARE` of its framing zoom), or a wide drawing fitted whole would stay tiny.
 * Otherwise the box is centred in the inset pane at the current zoom if it fits there and is no
 * further out than the framing zoom, else at the zoom that fits it, never past `maxZoom` (the
 * drawing's own size) and never under `minZoom`.
 */
export function frameStep(box: Rect, cam: Camera, pane: Pane, opts: { enter?: boolean; insets?: Insets; maxZoom?: number; minZoom?: number } = {}): Camera | null {
  const ins = opts.insets ?? STEP_INSETS
  const area = { x: ins.left, y: ins.top, w: Math.max(1, pane.w - ins.left - ins.right), h: Math.max(1, pane.h - ins.top - ins.bottom) }
  const fits = Math.min(area.w / Math.max(box.w, 1e-6), area.h / Math.max(box.h, 1e-6))
  const framing = Math.max(opts.minZoom ?? 0, Math.min(fits, opts.maxZoom ?? STEP_MAX_ZOOM))
  const s = { x: box.x * cam.zoom + cam.x, y: box.y * cam.zoom + cam.y, w: box.w * cam.zoom, h: box.h * cam.zoom }
  const slack = 1
  const inView = s.x >= area.x - slack && s.y >= area.y - slack && s.x + s.w <= area.x + area.w + slack && s.y + s.h <= area.y + area.h + slack
  if (inView && (!opts.enter || cam.zoom >= framing * STEP_READABLE_SHARE)) return null
  // Closer in than the framing is kept while the box still fits; further out comes in to the framing.
  const zoom = Math.max(opts.minZoom ?? 0, Math.min(fits, Math.max(cam.zoom, framing)))
  return { zoom, x: area.x + area.w / 2 - (box.x + box.w / 2) * zoom, y: area.y + area.h / 2 - (box.y + box.h / 2) * zoom }
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

/** The artifact canvas's camera maths (`src/artifacts/camera.ts`): framing a followed step. */
import { describe, expect, it } from 'vitest'
import { STEP_READABLE_SHARE, frameStep, type Camera } from '../src/artifacts/camera.ts'

const pane = { w: 1000, h: 600 }
const insets = { top: 50, right: 50, bottom: 50, left: 50 }
/** The inset area: 900 by 500, its middle at (500, 300). */
const at = (cam: Camera, r: { x: number; y: number; w: number; h: number }) => ({ x: r.x * cam.zoom + cam.x, y: r.y * cam.zoom + cam.y, w: r.w * cam.zoom, h: r.h * cam.zoom })
const centre = (s: { x: number; y: number; w: number; h: number }) => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 })

describe('frameStep', () => {
  const box = { x: 2000, y: 100, w: 300, h: 200 }

  it('leaves the view where it is when the step is already in view', () => {
    // At 1:1 the box sits at screen 100..400 by 100..300: inside the inset area.
    expect(frameStep(box, { zoom: 1, x: -1900, y: 0 }, pane, { insets })).toBeNull()
    // Zoomed in or out by hand, still in view: still left alone.
    expect(frameStep(box, { zoom: 0.5, x: -900, y: 0 }, pane, { insets })).toBeNull()
    expect(frameStep(box, { zoom: 2, x: -3900, y: -100 }, pane, { insets })).toBeNull()
  })

  it('centres a step that is off screen in the inset area, at the drawing\'s own size', () => {
    const cam = frameStep(box, { zoom: 1, x: 0, y: 0 }, pane, { insets })!
    expect(cam.zoom).toBe(1)
    expect(centre(at(cam, box))).toEqual({ x: 500, y: 300 })
  })

  it('keeps a closer zoom the reader chose while the step still fits at it', () => {
    const cam = frameStep(box, { zoom: 1.5, x: 0, y: 0 }, pane, { insets })!
    expect(cam.zoom).toBe(1.5)
    expect(centre(at(cam, box))).toEqual({ x: 500, y: 300 })
  })

  it('zooms out only as far as fitting the step needs', () => {
    const wide = { x: 5000, y: 0, w: 1800, h: 100 }
    const cam = frameStep(wide, { zoom: 1, x: 0, y: 0 }, pane, { insets })!
    expect(cam.zoom).toBeCloseTo(0.5)
    const s = at(cam, wide)
    expect(s.x).toBeCloseTo(50)
    expect(s.x + s.w).toBeCloseTo(950)
  })

  it('comes in from far out to the framing, but never past the drawing\'s own size', () => {
    expect(frameStep(box, { zoom: 0.1, x: 0, y: 1000 }, pane, { insets })!.zoom).toBe(1)
    expect(frameStep(box, { zoom: 0.1, x: 0, y: 1000 }, pane, { insets, maxZoom: 0.8 })!.zoom).toBe(0.8)
  })

  it('from the whole drawing, frames a step in view but too small to read, and leaves one near readable', () => {
    // The whole strip fitted: the box is on screen at a tenth of its size.
    const whole = { zoom: 0.1, x: 0, y: 250 }
    expect(frameStep(box, whole, pane, { insets })).toBeNull()
    const cam = frameStep(box, whole, pane, { insets, enter: true })!
    expect(cam.zoom).toBe(1)
    expect(centre(at(cam, box))).toEqual({ x: 500, y: 300 })
    // Near enough its framing already (a drawing that fits one screen): no move.
    const near = { zoom: STEP_READABLE_SHARE, x: -2000 * STEP_READABLE_SHARE + 200, y: 0 }
    expect(frameStep(box, near, pane, { insets, enter: true })).toBeNull()
  })

  it('never zooms out past the canvas\'s lowest zoom', () => {
    const huge = { x: 0, y: 0, w: 90_000, h: 100 }
    expect(frameStep(huge, { zoom: 1, x: 5000, y: 0 }, pane, { insets, minZoom: 0.05 })!.zoom).toBe(0.05)
  })
})

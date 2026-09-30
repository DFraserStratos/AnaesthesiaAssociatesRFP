import { describe, expect, it } from 'vitest'
import { boundsOf, clampViewport, panExtent } from '../src/board/panLimits.ts'

const map = { x: 0, y: 0, w: 10_000, h: 2_000 }
const pane = { w: 1200, h: 800, dock: 0 }
/** Where the map's edges land on screen. */
const onScreen = (vp: { x: number; y: number; zoom: number }) => ({
  left: map.x * vp.zoom + vp.x,
  right: (map.x + map.w) * vp.zoom + vp.x,
  top: map.y * vp.zoom + vp.y,
  bottom: (map.y + map.h) * vp.zoom + vp.y,
})

describe('boundsOf', () => {
  it('unions boxes, and is null for none', () => {
    expect(boundsOf([])).toBeNull()
    expect(boundsOf([{ x: 10, y: 20, w: 5, h: 5 }, { x: -5, y: 0, w: 5, h: 100 }])).toEqual({ x: -5, y: 0, w: 20, h: 100 })
  })
})

describe('panExtent', () => {
  it('pads the map by half the visible board, in flow units at this zoom', () => {
    expect(panExtent(map, 1, pane)).toEqual([
      [-600, -400],
      [10_600, 2_400],
    ])
    expect(panExtent(map, 0.5, pane)).toEqual([
      [-1200, -800],
      [11_200, 2_800],
    ])
  })
  it('lets the map clear the docked panel on the left', () => {
    const [[x0], [x1]] = panExtent(map, 1, { ...pane, dock: 400 })
    expect(x0).toBe(-(400 + 400))
    expect(x1).toBe(10_000 + 400)
  })
})

describe('clampViewport', () => {
  it('leaves a viewport inside the limits alone', () => {
    const vp = { x: -3000, y: -500, zoom: 1 }
    expect(clampViewport(vp, map, pane)).toBe(vp)
  })
  it('stops the map edge at the middle of the board, however far it is pushed', () => {
    for (const zoom of [0.08, 0.3, 1, 1.8]) {
      const far = onScreen(clampViewport({ x: 1e7, y: 1e7, zoom }, map, pane))
      expect(far.left).toBeCloseTo(600)
      expect(far.top).toBeCloseTo(400)
      const back = onScreen(clampViewport({ x: -1e7, y: -1e7, zoom }, map, pane))
      expect(back.right).toBeCloseTo(600)
      expect(back.bottom).toBeCloseTo(400)
    }
  })
  it('measures the middle from the right of the docked panel', () => {
    const vp = clampViewport({ x: 1e7, y: 0, zoom: 1 }, map, { ...pane, dock: 400 })
    expect(onScreen(vp).left).toBeCloseTo(400 + 400)
  })
  it('zoomed right out, the map can still be moved about rather than locked', () => {
    const a = clampViewport({ x: 0, y: 0, zoom: 0.08 }, map, pane)
    const b = clampViewport({ x: 300, y: 0, zoom: 0.08 }, map, pane)
    expect(b.x - a.x).toBe(300)
  })
  it('is a no-op without a map or a measured pane', () => {
    const vp = { x: 1e7, y: 1e7, zoom: 1 }
    expect(clampViewport(vp, null, pane)).toBe(vp)
    expect(clampViewport(vp, map, { w: 0, h: 0, dock: 0 })).toBe(vp)
  })
})

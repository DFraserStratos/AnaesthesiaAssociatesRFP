import { describe, expect, it } from 'vitest'
import { viewportShortfall, type ViewportMetrics } from './viewportMetrics'

/**
 * The reading taken off the handset that exposed the bug: iPhone 16 Pro,
 * 402x874pt, installed app, `black-translucent` status bar. Every viewport
 * route says 812 while the screen is 874, and the 62px difference is exactly
 * the top inset. This object IS the bug report.
 */
const IPHONE_16_PRO_BUGGED: ViewportMetrics = {
  box: 812,
  icb: 812,
  inner: 812,
  visual: 812,
  screenWidth: 402,
  screenHeight: 874,
  insetTop: 62,
  insetBottom: 34,
  insetLeft: 0,
  insetRight: 0,
  standalone: true,
  webkit: true,
  devicePixelRatio: 3,
}

const at = (over: Partial<ViewportMetrics>): ViewportMetrics => ({ ...IPHONE_16_PRO_BUGGED, ...over })

describe('viewportShortfall', () => {
  it('recovers exactly the status bar height on the handset that showed the bug', () => {
    expect(viewportShortfall(IPHONE_16_PRO_BUGGED)).toBe(62)
  })

  it('is zero once WebKit reports the viewport honestly, with no code change', () => {
    // The whole point of measuring rather than hardcoding `env(safe-area-inset-top)`:
    // the day the bug is fixed, this must stop adding anything by itself.
    expect(viewportShortfall(at({ icb: 874, inner: 874, visual: 874, box: 874 }))).toBe(0)
  })

  it('leaves a browser tab alone, where the gap is the browser chrome', () => {
    expect(viewportShortfall(at({ standalone: false }))).toBe(0)
  })

  it('leaves non-WebKit alone, where the gap is the system bars', () => {
    // Android reports a comparable gap and is not suffering this bug; growing
    // the box there would push the nav off the bottom instead of fixing it.
    expect(viewportShortfall(at({ webkit: false, insetTop: 24, icb: 800, screenHeight: 872 }))).toBe(0)
  })

  it('never adds more than the top inset, however wrong the screen reading is', () => {
    // The clamp is the blast radius: the status bar is the known maximum error.
    expect(viewportShortfall(at({ screenHeight: 2000 }))).toBe(62)
  })

  it('never subtracts when the viewport is reported taller than the screen', () => {
    expect(viewportShortfall(at({ icb: 900 }))).toBe(0)
  })

  it('adds nothing on a device with no top inset at all', () => {
    // Desktop installed PWA: a real gap to `screen.height` (the OS chrome), but
    // no notch, so the clamp floors it at 0.
    expect(viewportShortfall(at({ insetTop: 0, icb: 900, screenHeight: 1080 }))).toBe(0)
  })
})

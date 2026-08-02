/**
 * What the installed app can actually measure about the space it has been given,
 * plus the one correction that has to be derived from it.
 *
 * WHY THIS EXISTS. Measured on an iPhone 16 Pro (402x874pt) running the
 * installed app, 2026-08-03, under `apple-mobile-web-app-status-bar-style:
 * black-translucent`:
 *
 *     screen.height                    874    <- the truth
 *     documentElement.clientHeight     812
 *     window.innerHeight               812
 *     visualViewport.height            812
 *     env(safe-area-inset-top)          62
 *
 * The web view really is full screen: the atmosphere reaches y=0 and the status
 * bar glyphs sit over it. But EVERY CSS and DOM route to the viewport height
 * reports `874 - 62 = 812`, for a box anchored at y=0. So a host sized from any
 * of them finishes exactly one status bar short at the foot, and the tab bar
 * pinned to `bottom: 0` floats above a dead band. `100dvh`, `100vh`,
 * `height: 100%` and `position: fixed` all inherit the same wrong number, which
 * is why the first two attempts at this changed nothing. Only `screen.height`
 * knows better.
 *
 * The insets are internally inconsistent with that box, which is what marks it
 * as a WebKit bug rather than a contract we have misread: a 34px bottom inset
 * measured up from y=812 protects y=778..812, while the home indicator is
 * actually at y=840..874.
 *
 * WHY THE CORRECTION IS MEASURED AND NOT A CONSTANT. `calc(100% +
 * env(safe-area-inset-top))` would be right today and silently 62px too TALL
 * the day WebKit fixes the underlying bug, which is the same broken screen
 * again with the nav hanging off the bottom instead of floating above it.
 * Deriving it from the live numbers makes the fix self-cancelling: the moment
 * `screen.height` and the layout viewport agree, the shortfall is 0 and nothing
 * is added.
 *
 * This module is pure measurement and pure arithmetic. `viewportShortfall` is
 * separated from `readViewportMetrics` precisely so the rule can be unit tested
 * against the real numbers above without a device (`viewportMetrics.test.ts`).
 */

/** One reading of the space the app has been given. All heights in CSS px. */
export interface ViewportMetrics {
  /** The host element's own rendered height, i.e. what the layout actually got. */
  box: number
  /** `documentElement.clientHeight` -- the initial containing block. */
  icb: number
  /** `window.innerHeight`. */
  inner: number
  /** `visualViewport.height`, or 0 where the API is absent. */
  visual: number
  /** `screen.width` / `screen.height` -- the only source that survives the bug. */
  screenWidth: number
  screenHeight: number
  insetTop: number
  insetBottom: number
  insetLeft: number
  insetRight: number
  /** Running as an installed app rather than in a browser tab. */
  standalone: boolean
  /** WebKit, which is the only engine known to report the short viewport. */
  webkit: boolean
  devicePixelRatio: number
}

/**
 * How much taller than the reported viewport the host must be, in CSS px.
 *
 * Pure, and deliberately conservative in three ways:
 *
 * 1. **Standalone only.** In a browser tab the gap between `screen.height` and
 *    the viewport is the browser's own chrome, which is not ours to reclaim.
 * 2. **WebKit only.** Android reports a comparable gap for the system bars and
 *    is not suffering this bug, so growing the box there would push the nav off
 *    the bottom of the screen.
 * 3. **Clamped to the top inset.** The status bar height is the known maximum
 *    error, so even a wrong reading somewhere exotic cannot do more damage than
 *    the bug it is correcting. A device that reports honestly yields 0.
 */
export function viewportShortfall(m: ViewportMetrics): number {
  if (!m.standalone || !m.webkit) return 0
  const gap = Math.round(m.screenHeight - m.icb)
  return Math.max(0, Math.min(gap, Math.round(m.insetTop)))
}

/** `true` when a media query matches, `false` when the API is unavailable. */
function media(query: string): boolean {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  } catch {
    return false
  }
}

/**
 * Resolve the four `env(safe-area-inset-*)` values to real pixels.
 *
 * They cannot be read back off the host: custom properties compute to an
 * unevaluated token stream, so `--aa-inset-top` comes back as the literal
 * `max(env(safe-area-inset-top, 0px), 12px)`. A throwaway probe whose PADDING
 * is the raw `env()` gets them evaluated, because padding computes to a length.
 */
function readInsets(): { top: number; bottom: number; left: number; right: number } {
  const zero = { top: 0, bottom: 0, left: 0, right: 0 }
  if (typeof document === 'undefined' || document.body === null) return zero

  const probe = document.createElement('div')
  probe.style.cssText = [
    'position:absolute',
    'top:0',
    'left:0',
    'width:0',
    'height:0',
    'visibility:hidden',
    'pointer-events:none',
    'padding-top:env(safe-area-inset-top,0px)',
    'padding-bottom:env(safe-area-inset-bottom,0px)',
    'padding-left:env(safe-area-inset-left,0px)',
    'padding-right:env(safe-area-inset-right,0px)',
  ].join(';')
  document.body.appendChild(probe)
  try {
    const cs = getComputedStyle(probe)
    const px = (v: string): number => Math.round(Number.parseFloat(v) || 0)
    return { top: px(cs.paddingTop), bottom: px(cs.paddingBottom), left: px(cs.paddingLeft), right: px(cs.paddingRight) }
  } catch {
    return zero
  } finally {
    probe.remove()
  }
}

/** The class the PWA host carries, and the only element `box` is read from. */
export const HOST_SELECTOR = '.aa-mobile-viewport'

/** Take one live reading. Safe to call in jsdom, where most values come back 0. */
export function readViewportMetrics(): ViewportMetrics {
  const insets = readInsets()
  const host = typeof document === 'undefined' ? null : document.querySelector(HOST_SELECTOR)
  return {
    box: host === null ? 0 : Math.round(host.getBoundingClientRect().height),
    icb: document?.documentElement?.clientHeight ?? 0,
    inner: window.innerHeight,
    visual: Math.round(window.visualViewport?.height ?? 0),
    screenWidth: window.screen?.width ?? 0,
    screenHeight: window.screen?.height ?? 0,
    insetTop: insets.top,
    insetBottom: insets.bottom,
    insetLeft: insets.left,
    insetRight: insets.right,
    standalone: media('(display-mode: standalone)'),
    // `-webkit-touch-callout` is a WebKit-only property, and the standard
    // engine test that needs no user-agent string.
    webkit: typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('-webkit-touch-callout', 'none'),
    devicePixelRatio: window.devicePixelRatio,
  }
}

/** The custom property `.aa-mobile-viewport` adds to its height. */
export const SHORTFALL_VAR = '--aa-viewport-shortfall'

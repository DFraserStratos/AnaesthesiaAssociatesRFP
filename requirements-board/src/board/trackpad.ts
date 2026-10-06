/**
 * Trackpad or mouse wheel? A trackpad's two-finger scroll pans the board and a pinch zooms it;
 * a mouse wheel zooms, as before. Browsers send both as `wheel` events, so tell them apart:
 *   - a pinch arrives with ctrlKey set (Chrome, Safari, Firefox on macOS): leave it to zoom;
 *   - a sideways component (without Shift) only comes from a trackpad;
 *   - where the legacy `wheelDeltaY` exists (Chrome, Safari), a trackpad reports about -3 x deltaY
 *     (rounded, so not exactly when deltaY is fractional), while a mouse notch is a whole multiple
 *     of 120; anything else is a trackpad;
 *   - elsewhere (Firefox), a mouse scrolls by lines (deltaMode 1), a trackpad by pixels (0).
 * A mouse never looks like a trackpad, but a trackpad can look like a mouse (a momentum event, a
 * big flick), so one trackpad-looking event makes the whole gesture a trackpad one, until the
 * events pause.
 */

export type WheelKind = 'pinch' | 'trackpad' | 'mouse'

type WheelLike = Pick<WheelEvent, 'ctrlKey' | 'shiftKey' | 'deltaX' | 'deltaY' | 'deltaMode'> & { wheelDeltaY?: number }

export function classifyWheel(e: WheelLike): WheelKind {
  if (e.ctrlKey) return 'pinch'
  if (e.deltaX !== 0 && !e.shiftKey) return 'trackpad'
  if (typeof e.wheelDeltaY === 'number' && e.wheelDeltaY !== 0) {
    if (Math.abs(e.wheelDeltaY + 3 * e.deltaY) <= 3) return 'trackpad'
    return e.wheelDeltaY % 120 === 0 ? 'mouse' : 'trackpad'
  }
  return e.deltaMode === 0 ? 'trackpad' : 'mouse'
}

/** A pause this long ends a gesture. */
export const GESTURE_GAP_MS = 250
export const LINE_PX = 16
/** Things over the board that take the wheel themselves. */
const OWN_SCROLL = '.toolbar, .popover, .lane-menu, .selection-bar, input, textarea, select'

/** How much one pixel of pinch zooms: d3-zoom's own rate (0.002 per pixel, x10 for a pinch), so both feel the same. */
export const PINCH_RATE = 0.02

/**
 * Pan the board on a trackpad scroll, before React Flow's own wheel handler (which would zoom)
 * sees it. A pinch over the canvas is left to React Flow; a pinch over anything else on the board
 * (lane headers, the toolbar) would zoom the whole page, so it zooms the board here instead.
 * Mouse wheels pass through untouched. Returns the listener to remove.
 */
export function wheelGestures(
  el: HTMLElement,
  on: { pan: (dx: number, dy: number) => void; zoom: (factor: number, clientX: number, clientY: number) => void },
): () => void {
  let kind: WheelKind | null = null
  let last = 0
  const onWheel = (e: WheelEvent) => {
    // Anywhere on the board (canvas, minimap, lane headers) except controls and popovers that scroll themselves.
    if (!(e.target instanceof Element)) return
    const fresh = classifyWheel(e)
    if (fresh === 'pinch' && !e.target.closest('.react-flow')) {
      e.preventDefault()
      on.zoom(2 ** (-e.deltaY * (e.deltaMode === 1 ? LINE_PX : 1) * PINCH_RATE), e.clientX, e.clientY)
      return
    }
    if (e.target.closest(OWN_SCROLL)) return
    if (e.timeStamp - last > GESTURE_GAP_MS) kind = null
    last = e.timeStamp
    // A pinch always zooms; otherwise any trackpad sign wins the gesture (see above).
    if (fresh === 'trackpad' || kind === null) kind = fresh
    if (kind !== 'trackpad' || fresh === 'pinch') return
    e.preventDefault()
    e.stopPropagation()
    const scale = e.deltaMode === 1 ? LINE_PX : 1
    on.pan(e.deltaX * scale, e.deltaY * scale)
  }
  el.addEventListener('wheel', onWheel, { capture: true, passive: false })
  return () => el.removeEventListener('wheel', onWheel, { capture: true })
}

/**
 * Never let a pinch zoom the page itself (the board and the artifact viewer zoom their own content
 * and cancel the event first, so this stands aside for them). Chrome turns an uncancelled ctrl+wheel (a trackpad
 * pinch) into a visual-viewport zoom: the whole page magnifies inside the window and a pan slides
 * it sideways, so everything pinned to the board's edge (the lane headers) ends up off screen,
 * and the toolbar with it. The board's own handlers cancel pinches over the board; this cancels
 * the rest (masthead, item panel, list views), after them. Safari pinches arrive as gesture
 * events, cancelled here too. Keyboard zoom (Cmd plus, Cmd minus) is left alone. Returns the
 * cleanup.
 */
export function blockPagePinch(win: Window): () => void {
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey && !e.defaultPrevented) e.preventDefault()
  }
  const onGesture = (e: Event) => e.preventDefault()
  win.addEventListener('wheel', onWheel, { passive: false })
  win.addEventListener('gesturestart', onGesture)
  win.addEventListener('gesturechange', onGesture)
  return () => {
    win.removeEventListener('wheel', onWheel)
    win.removeEventListener('gesturestart', onGesture)
    win.removeEventListener('gesturechange', onGesture)
  }
}

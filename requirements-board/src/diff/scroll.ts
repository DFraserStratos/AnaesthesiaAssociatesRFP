/**
 * Moving the Diff review to a card or a change: land it just under the sticky bar, then ring it for
 * a moment (`diff-flash` on a card, `diff-flash-row` on a row's cells; both 1.4s in diff.css).
 * One landing per page at a time: a new one cancels the one before, and so does the reader's own
 * wheel, touch, mouse press or scroll key, so a landing never pulls the page back once the reader
 * has moved it (FINDINGS R-32).
 */

const FLASH_MS = 1400
/** How far under the bar a target lands. */
const UNDER_BAR = 12
/** A jump is done when its target has held still this many frames (the cards round it laid out), or after the most. */
const STILL_FRAMES = 6
const MAX_FRAMES = 60
/** A glide's end is checked when the browser says it ended, or after this long if it never says (no `scrollend`). */
const GLIDE_MS = 900
/** Keys that scroll the page: the reader moving it by hand. */
const SCROLL_KEYS = new Set(['PageUp', 'PageDown', ' ', 'ArrowUp', 'ArrowDown', 'Home', 'End'])

/** The landing in progress on each page: calling it cancels it. */
const landing = new WeakMap<HTMLElement, () => void>()

/** Cancel the landing in progress on `page`, if any (a new landing, the reader's own scroll, leaving the tab). */
export function cancelLanding(page: HTMLElement) {
  landing.get(page)?.()
}

/** Where a scroll to `top` really ends: the page cannot scroll past its top or bottom. */
const clamp = (page: HTMLElement, top: number) => Math.max(0, Math.min(top, page.scrollHeight - page.clientHeight))

/**
 * Scroll `page` so `target` sits just under the bar (`barHeight()` high, read as it goes: the bar
 * folds on the way down). Cards far off are only estimates of their size until the browser lays
 * them out (content-visibility), a frame or two after they come into view, so a long way is a jump,
 * corrected frame by frame until the target has held still for a few frames, or a correction no
 * longer moves the page (the target is out of reach); a short way glides, and is set right once at
 * its end. Reduced motion always jumps. A landing that cannot move the page ends at once.
 */
export function land(page: HTMLElement, target: HTMLElement, barHeight: () => number): () => void {
  cancelLanding(page)
  const off = () => target.getBoundingClientRect().top - page.getBoundingClientRect().top - barHeight() - UNDER_BAR
  let frame = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let afterGlide: (() => void) | null = null
  const byHand = () => cancel()
  const onKey = (e: KeyboardEvent) => SCROLL_KEYS.has(e.key) && cancel()
  function cancel() {
    if (landing.get(page) === cancel) landing.delete(page)
    cancelAnimationFrame(frame)
    clearTimeout(timer)
    if (afterGlide) page.removeEventListener('scrollend', afterGlide)
    page.removeEventListener('wheel', byHand)
    page.removeEventListener('touchstart', byHand)
    page.removeEventListener('mousedown', byHand)
    window.removeEventListener('keydown', onKey)
  }
  landing.set(page, cancel)
  page.addEventListener('wheel', byHand, { passive: true })
  page.addEventListener('touchstart', byHand, { passive: true })
  page.addEventListener('mousedown', byHand)
  window.addEventListener('keydown', onKey)

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!still && Math.abs(off()) < page.clientHeight * 2) {
    const dest = clamp(page, page.scrollTop + off())
    // Already there, or out of reach: nothing to glide, and no `scrollend` would ever come.
    if (Math.abs(dest - page.scrollTop) <= 1) {
      cancel()
      return cancel
    }
    page.scrollTo({ top: dest, behavior: 'smooth' })
    afterGlide = () => {
      const fix = clamp(page, page.scrollTop + off())
      cancel()
      if (Math.abs(off()) > 4 && Math.abs(fix - page.scrollTop) > 1) page.scrollTo({ top: fix, behavior: 'smooth' })
    }
    page.addEventListener('scrollend', afterGlide, { once: true })
    timer = setTimeout(afterGlide, GLIDE_MS)
    return cancel
  }
  let calm = 0
  let tries = 0
  const step = () => {
    const d = off()
    calm = Math.abs(d) < 2 ? calm + 1 : 0
    if (calm >= STILL_FRAMES || tries++ > MAX_FRAMES) return cancel()
    if (Math.abs(d) >= 2) {
      const was = page.scrollTop
      page.scrollTop += d
      // The page did not move: the target is out of reach, and writing again would only fight the reader.
      if (Math.abs(page.scrollTop - was) < 1) return cancel()
    }
    frame = requestAnimationFrame(step)
  }
  step()
  return cancel
}

/** Ring each element for a moment: a card with its outer ring, a row's cells with an inset one. */
export function flash(els: HTMLElement[]) {
  for (const el of els) {
    const cls = el.classList.contains('diff-card') ? 'diff-flash' : 'diff-flash-row'
    el.classList.remove(cls)
    void el.offsetWidth
    el.classList.add(cls)
    setTimeout(() => el.classList.remove(cls), FLASH_MS)
  }
}

/**
 * Moving the Diff review to a card or a change: land it just under the sticky bar, then ring it for
 * a moment (`diff-flash` on a card, `diff-flash-row` on a row's cells; both 1.4s in diff.css).
 */

const FLASH_MS = 1400
/** How far under the bar a target lands. */
const UNDER_BAR = 12
/** A jump is done when its target has held still this many frames (the cards round it laid out), or after the most. */
const STILL_FRAMES = 6
const MAX_FRAMES = 60

/**
 * Scroll `page` so `target` sits just under the bar (`barHeight()` high, read as it goes: the bar
 * folds on the way down). Cards far off are only estimates of their size until the browser lays
 * them out (content-visibility), a frame or two after they come into view, so a long way is a jump,
 * corrected frame by frame until the target has held still for a few frames; a short way glides,
 * and is set right at its end. Reduced motion always jumps.
 */
export function land(page: HTMLElement, target: HTMLElement, barHeight: () => number) {
  const off = () => target.getBoundingClientRect().top - page.getBoundingClientRect().top - barHeight() - UNDER_BAR
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!still && Math.abs(off()) < page.clientHeight * 2) {
    page.scrollTo({ top: page.scrollTop + off(), behavior: 'smooth' })
    page.addEventListener('scrollend', () => Math.abs(off()) > 4 && page.scrollTo({ top: page.scrollTop + off(), behavior: 'smooth' }), { once: true })
    return
  }
  let calm = 0
  let tries = 0
  const step = () => {
    const d = off()
    calm = Math.abs(d) < 2 ? calm + 1 : 0
    if (calm >= STILL_FRAMES || tries++ > MAX_FRAMES) return
    if (Math.abs(d) >= 2) page.scrollTop += d
    requestAnimationFrame(step)
  }
  step()
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

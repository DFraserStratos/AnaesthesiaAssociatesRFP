/**
 * The Diff review's keys: j goes up to the previous change and k down to the next (each
 * `[data-hunk]`: a changed row, or a summary line), Shift J and Shift K up and down a card (n is the
 * board's new card), v ticks the card in view Viewed and goes on to the next one not yet viewed. Not while typing, or with a sheet,
 * picker, popover or dialog open over the page, or while a new comparison is being read.
 */
import { useEffect, useRef, type RefObject } from 'react'
import type { Entry } from '../../shared/diffModel.ts'
import { flash, land } from './scroll.ts'
import { isViewed, type Viewed } from './viewedStore.ts'

const TYPING = 'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, select, [contenteditable="true"]'
const OVER_PAGE = '.diff-pop, .new-card-pop, .scrim, .lightbox, [role=dialog], [aria-modal=true]'
/** Keys that scroll the page: the reader moving on by hand, so v reads the card at the line again. */
const SCROLL_KEYS = new Set(['PageUp', 'PageDown', ' ', 'ArrowUp', 'ArrowDown', 'Home', 'End'])
const KEYS = new Set(['j', 'k', 'J', 'K', 'v'])

interface DiffKeys {
  page: RefObject<HTMLElement>
  /** The visible bar's height: targets land just under it. */
  barHeight: () => number
  /** The keys do nothing now (a sheet open from the URL, a comparison being read). */
  paused: boolean
  /** The cards on the page, in order. */
  cards: Entry[]
  /** Draws a card (and the next two) whole before a key scrolls to it. */
  drawAround: (key: string) => void
  viewed: { now: () => Viewed; set: (e: Entry, on: boolean) => void }
}

export function useDiffKeys(opts: DiffKeys) {
  const latest = useRef(opts)
  latest.current = opts

  // The card v last brought in (or ticked with none after it): v acts on it while it is on screen
  // and the reader has not scrolled by hand since, not on whatever a card folding left at the line.
  const vCursor = useRef<string | null>(null)
  useEffect(() => {
    const el = opts.page.current
    if (!el) return
    const byHand = () => {
      vCursor.current = null
    }
    const onKey = (e: KeyboardEvent) => SCROLL_KEYS.has(e.key) && byHand()
    el.addEventListener('wheel', byHand, { passive: true })
    el.addEventListener('touchmove', byHand, { passive: true })
    el.addEventListener('mousedown', byHand)
    window.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('wheel', byHand)
      el.removeEventListener('touchmove', byHand)
      el.removeEventListener('mousedown', byHand)
      window.removeEventListener('keydown', onKey)
    }
  }, [opts.page])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || !KEYS.has(e.key)) return
      if ((e.target as HTMLElement).closest?.(TYPING) || document.querySelector(OVER_PAGE)) return
      const { page, barHeight, paused, cards, drawAround, viewed } = latest.current
      const el = page.current
      if (!el || paused) return
      e.preventDefault()
      const line = el.getBoundingClientRect().top + barHeight() + 12
      const top = (x: Element) => x.getBoundingClientRect().top
      const after = <T extends Element>(list: T[]) => list.find((x) => top(x) > line + 4)
      const before = <T extends Element>(list: T[]) => [...list].reverse().find((x) => top(x) < line - 4)
      const cardEl = (key: string) => document.getElementById(`diff-${key}`)
      const bring = (target: HTMLElement | null | undefined, ring: HTMLElement[] = target ? [target] : []) => {
        if (!target) return
        land(el, target, barHeight)
        flash(ring)
      }
      if (e.key === 'j' || e.key === 'k') {
        const h = (e.key === 'k' ? after : before)([...el.querySelectorAll<HTMLElement>('[data-hunk]')])
        // A row's two cells share its `data-row`, and are rung together.
        const row = h?.dataset.row ? [...el.querySelectorAll<HTMLElement>(`[data-row="${CSS.escape(h.dataset.row)}"]`)] : h ? [h] : []
        vCursor.current = null
        return bring(h, row)
      }
      const cardEls = [...el.querySelectorAll<HTMLElement>('.diff-card')]
      if (e.key === 'J' || e.key === 'K') {
        const key = (e.key === 'K' ? after(cardEls) : before(cardEls))?.id.replace(/^diff-/, '')
        if (!key) return
        vCursor.current = key
        drawAround(key)
        return bring(cardEl(key))
      }
      // v: the card v brought in while it is still on screen, else the card at the line.
      const view = el.getBoundingClientRect()
      const cursor = vCursor.current ? cardEl(vCursor.current) : null
      const onScreen = !!cursor && cursor.getBoundingClientRect().bottom > line && cursor.getBoundingClientRect().top < view.bottom
      const current = onScreen ? cursor : ([...cardEls].reverse().find((c) => top(c) <= line + 8) ?? cardEls[0])
      const i = cards.findIndex((x) => `diff-${x.key}` === current?.id)
      if (i < 0) return
      const entry = cards[i]!
      if (!isViewed(viewed.now(), entry)) viewed.set(entry, true)
      const next = cards.slice(i + 1).find((x) => !isViewed(viewed.now(), x))
      // None left after it: stay on this card, so the next v does not tick whatever the fold left at the line.
      vCursor.current = next?.key ?? entry.key
      if (!next) return
      drawAround(next.key)
      requestAnimationFrame(() => bring(cardEl(next.key)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

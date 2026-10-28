import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react'
import { findRanges } from '../artifacts/find.ts'

/** The CSS Custom Highlight API, where the browser has it: marks text without touching the DOM. */
const highlights = (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights
const HighlightCtor = (globalThis as { Highlight?: new (...r: Range[]) => unknown }).Highlight

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Find in the open card: Ctrl F (Cmd F on a Mac) opens a bar under the card's head while the card
 * is open, so the board's search only takes Ctrl F once the card is closed. Matches are tinted as
 * an artifact's find tints them; the arrows (or Enter and Shift Enter) step through them, Esc closes.
 * `root` is the card's scrolling body; `resetKey` changes when another card or view takes its place.
 */
export function CardFind({ root, resetKey, disabled = false }: { root: RefObject<HTMLElement>; resetKey: string; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [shown, setShown] = useState(false)
  const [query, setQuery] = useState('')
  const [ranges, setRanges] = useState<Range[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (disabled) return
    const onKey = (e: KeyboardEvent) => {
      if (!((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'f')) return
      // A modal sheet over a docked card keeps its own keys.
      if (root.current?.closest('.sheet.docked') && document.querySelector('.scrim')) return
      e.preventDefault()
      setShown(true)
      requestAnimationFrame(() => {
        input.current?.focus()
        input.current?.select()
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [disabled])

  // Each match as a range, found again whenever the card's text changes (an edit saved, a section opened).
  useLayoutEffect(() => {
    const el = root.current
    if (!el || disabled || !shown || !query.trim()) {
      setRanges([])
      return
    }
    const measure = () => setRanges(findRanges(el, query, 'doc'))
    measure()
    const mo = new MutationObserver(measure)
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    return () => mo.disconnect()
  }, [query, shown, disabled, resetKey])
  useEffect(() => setActive(0), [query, resetKey])

  const current = ranges.length ? Math.min(active, ranges.length - 1) : -1
  useEffect(() => {
    if (!highlights || !HighlightCtor) return
    highlights.set('card-find', new HighlightCtor(...ranges.filter((_, i) => i !== current)))
    highlights.set('card-find-current', new HighlightCtor(...(current >= 0 ? [ranges[current]!] : [])))
    return () => {
      highlights.delete('card-find')
      highlights.delete('card-find-current')
    }
  }, [ranges, current])
  // Bring the current match into view within the card's own scroll.
  useEffect(() => {
    const el = root.current
    const r = ranges[current]
    if (!el || !r) return
    // A modal card scrolls as a whole rather than in its body.
    if (el.scrollHeight <= el.clientHeight) {
      r.startContainer.parentElement?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' })
      return
    }
    const box = r.getBoundingClientRect()
    const frame = el.getBoundingClientRect()
    if (box.top >= frame.top + 8 && box.bottom <= frame.bottom - 8) return
    el.scrollTo({ top: Math.max(0, el.scrollTop + box.top - frame.top - el.clientHeight / 3), behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [current, ranges])

  const close = () => {
    setQuery('')
    setShown(false)
    root.current?.closest<HTMLElement>('.sheet')?.focus({ preventScroll: true })
  }
  const step = (d: 1 | -1) => ranges.length && setActive((i) => (Math.min(i, ranges.length - 1) + d + ranges.length) % ranges.length)
  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      step(e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey) ? -1 : 1)
    } else if (e.key === 'Escape') {
      // Esc closes the find, not the card.
      e.preventDefault()
      e.stopPropagation()
      close()
    }
  }

  if (disabled || !shown) return null
  const has = !!query.trim()
  return (
    <div className="card-find" role="search">
      <label className="search">
        <Search size={15} />
        <span className="sr-only">Find in this card</span>
        <input ref={input} className="input" placeholder="Find in this card" title="Find in this card (Ctrl F)" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} />
      </label>
      {has && (
        <span className="search-count" aria-live="polite">
          {ranges.length ? `${current + 1} of ${ranges.length}` : 'No matches'}
        </span>
      )}
      <button className="btn icon ghost sm" onClick={() => step(-1)} disabled={!ranges.length} aria-label="Previous match" title="Previous match (up arrow)">
        <ChevronUp size={14} />
      </button>
      <button className="btn icon ghost sm" onClick={() => step(1)} disabled={!ranges.length} aria-label="Next match" title="Next match (down arrow)">
        <ChevronDown size={14} />
      </button>
      <button className="btn icon ghost sm" onClick={close} aria-label="Close find" title="Close (Esc)">
        <X size={14} />
      </button>
    </div>
  )
}

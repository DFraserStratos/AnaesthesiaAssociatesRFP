import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react'
import { findRanges } from '../artifacts/find.ts'

/** The CSS Custom Highlight API, where the browser has it: marks text without touching the DOM. */
const highlights = (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights
const HighlightCtor = (globalThis as { Highlight?: new (...r: Range[]) => unknown }).Highlight

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Which of the matches found after a change inside the card is the current one: the same text at the
 * same place (`was` is a live range, so the DOM change has already moved it with its text), else the
 * first match at or after where it was, else the first.
 */
export function keptMatch(was: Range | undefined, now: Range[]): number {
  if (!was || !now.length) return 0
  try {
    const text = was.toString()
    const same = now.findIndex((r) => r.compareBoundaryPoints(Range.START_TO_START, was) === 0 && r.toString() === text)
    if (same >= 0) return same
    const after = now.findIndex((r) => r.compareBoundaryPoints(Range.START_TO_START, was) >= 0)
    return after >= 0 ? after : 0
  } catch {
    return 0 // the old match is no longer comparable (another document): start again
  }
}

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

  // The card is scrolled to the current match only when the reader asks: a new query (find opening
  // with one, another card taking this one's place) or a step. A change inside the card never does (R-33).
  const scrollAsked = useRef(false)
  const [asks, setAsks] = useState(0)
  /** The current match as last shown (a live range), kept while find is put away under Edit. */
  const seen = useRef<Range | undefined>(undefined)
  /** What the matches were last found for. */
  const asked = useRef({ query: '', resetKey: '', shown: false })

  // Each match as a range, found again whenever the card's text changes (an edit saved, a section opened).
  useLayoutEffect(() => {
    const el = root.current
    const was = asked.current
    if (!el || disabled || !shown || !query.trim()) {
      if (!shown) asked.current = { ...was, shown: false }
      setRanges([])
      return
    }
    // A new query, another card, or find opening asks for the first match and brings it into view.
    // Anything else (find back after Edit or a question over the card) finds the matches again and
    // keeps the match that was current, without scrolling.
    const fresh = !was.shown || was.query !== query || was.resetKey !== resetKey
    asked.current = { query, resetKey, shown: true }
    const next = findRanges(el, query, 'doc')
    if (fresh) {
      seen.current = undefined
      scrollAsked.current = true
      setActive(0)
    } else setActive(keptMatch(seen.current, next))
    setRanges(next)
    // A change inside the card: the same match stays current while its text is there (matches added
    // or removed above it included), else the next one after where it was; nothing scrolls.
    const remeasure = () => {
      const found = findRanges(el, query, 'doc')
      setActive(keptMatch(seen.current, found))
      setRanges(found)
    }
    const mo = new MutationObserver(remeasure)
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    return () => mo.disconnect()
  }, [query, shown, disabled, resetKey])

  const current = ranges.length ? Math.min(active, ranges.length - 1) : -1
  useLayoutEffect(() => {
    if (current >= 0) seen.current = ranges[current]
  })
  useEffect(() => {
    if (!highlights || !HighlightCtor) return
    highlights.set('card-find', new HighlightCtor(...ranges.filter((_, i) => i !== current)))
    highlights.set('card-find-current', new HighlightCtor(...(current >= 0 ? [ranges[current]!] : [])))
    return () => {
      highlights.delete('card-find')
      highlights.delete('card-find-current')
    }
  }, [ranges, current])
  // Bring the current match into view within the card's own scroll, when the reader asked (once).
  useEffect(() => {
    if (!scrollAsked.current) return
    scrollAsked.current = false
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
  }, [current, ranges, asks])

  const close = () => {
    setQuery('')
    setShown(false)
    root.current?.closest<HTMLElement>('.sheet')?.focus({ preventScroll: true })
  }
  const step = (d: 1 | -1) => {
    if (!ranges.length) return
    scrollAsked.current = true
    setAsks((n) => n + 1) // a step to the same match (there is one) still brings it back
    setActive((i) => (Math.min(i, ranges.length - 1) + d + ranges.length) % ranges.length)
  }
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

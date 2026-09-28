import { Search } from 'lucide-react'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import type { Item } from '../../shared/types.ts'
import { Highlight, StatusLabel, TypeIcon } from '../components/bits.tsx'
import { lineageTitles, matchContext } from '../itemSearch.ts'
import type { Index } from '../store.ts'
import { BASELINE_STATUS } from '../vocab.ts'

/** Rows shown at once: past this the list asks for another word rather than scrolling forever. */
const SHOWN = 50

/**
 * The board's search: the box, and under it the cards that match, best first.
 * Arrow keys walk the list and the board finds each card (`onPeek`) without opening it;
 * Enter or a click opens it; Esc takes the board back to where it was (`onCancel`).
 */
export function BoardSearch({
  inputRef,
  hits,
  index,
  query,
  onQuery,
  onPeek,
  onOpen,
  onCancel,
  onLeave,
  onActive,
  filtersOn,
  onClearFilters,
}: {
  inputRef: RefObject<HTMLInputElement>
  hits: Item[]
  index: Index
  query: string
  onQuery: (q: string) => void
  /** Find a card on the board (null lifts the mark); `clearLeft` is the list's right edge, in client pixels. */
  onPeek: (id: string | null, clearLeft: number) => void
  onOpen: (id: string) => void
  onCancel: () => void
  onLeave: () => void
  onActive: (n: number) => void
  filtersOn: boolean
  onClearFilters: () => void
}) {
  const listId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(-1)
  const shown = hits.slice(0, SHOWN)
  const open = focused && !!query.trim()

  // New hits, new list: nothing chosen until an arrow key says so. Keyed on the IDs, so a
  // catalogue refresh that leaves the same matches keeps your place.
  const hitKey = hits.map((h) => h.id).join('|')
  useEffect(() => {
    setActive(-1)
    onPeek(null, 0)
  }, [hitKey]) // only when the matches change
  useEffect(() => onActive(open ? active : -1), [active, open])

  const move = (dir: 1 | -1) => {
    if (!shown.length) return
    const n = active < 0 ? (dir > 0 ? 0 : shown.length - 1) : (active + dir + shown.length) % shown.length
    setActive(n)
    listRef.current?.querySelector(`[data-row="${n}"]`)?.scrollIntoView({ block: 'nearest' })
    onPeek(shown[n]!.id, listRef.current?.getBoundingClientRect().right ?? 0)
  }
  const pick = (it: Item | undefined) => {
    if (!it) return
    onOpen(it.id)
    inputRef.current?.blur()
  }

  return (
    <div className="board-search">
      <label className="search">
        <Search size={15} />
        <span className="sr-only">Search the board</span>
        <input
          ref={inputRef}
          className="input"
          placeholder="Search the board"
          title="Search the board (/ or Ctrl F)"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            onLeave()
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              move(e.key === 'ArrowDown' ? 1 : -1)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              pick(shown[Math.max(active, 0)])
            } else if (e.key === 'Escape') {
              e.preventDefault()
              onCancel()
              e.currentTarget.blur()
            }
          }}
        />
        {!query && <kbd>/</kbd>}
      </label>
      {open && (
        <div ref={listRef} className="search-results" role="listbox" id={listId} aria-label="Cards that match">
          {shown.map((it, i) => (
            <Row key={it.id} id={`${listId}-${i}`} n={i} item={it} index={index} query={query} active={i === active} onPick={() => pick(it)} />
          ))}
          {!hits.length && (
            <div className="search-empty">
              <p>Nothing on the board matches “{query.trim()}”.</p>
              {filtersOn && (
                <button className="btn sm" onMouseDown={(e) => e.preventDefault()} onClick={onClearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          )}
          {hits.length > 0 && (
            <p className="search-foot">
              {hits.length > SHOWN ? (
                <>
                  First {SHOWN} of {hits.length}. Add a word to narrow it.
                </>
              ) : (
                <>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> find on the board · <kbd>Enter</kbd> opens · <kbd>Esc</kbd> goes back
                </>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** One card: its name with the words found, then where it sits, or the line of text it was found in. */
function Row({ id, n, item, index, query, active, onPick }: { id: string; n: number; item: Item; index: Index; query: string; active: boolean; onPick: () => void }) {
  const context = matchContext(index, item, query)
  const lineage = lineageTitles(index, item)
  return (
    <button id={id} data-row={n} type="button" role="option" tabIndex={-1} aria-selected={active} className={`search-row${active ? ' active' : ''}`} title={item.id} onMouseDown={(e) => e.preventDefault()} onClick={onPick}>
      <TypeIcon type={item.type} />
      <span className="search-row-name">
        <Highlight text={item.title} query={query} />
      </span>
      {item.status !== BASELINE_STATUS ? <StatusLabel status={item.status} /> : <span />}
      {context ? (
        <span className="search-row-where">
          {context.label}: <Highlight text={context.text} query={query} />
        </span>
      ) : (
        lineage.length > 0 && (
          <span className="search-row-where">
            <Highlight text={lineage.join(' › ')} query={query} />
          </span>
        )
      )}
    </button>
  )
}

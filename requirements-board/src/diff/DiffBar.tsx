/**
 * The Diff review's sticky bar: the From and To pickers (commits that changed catalogue records,
 * each with its date and message; To also offers what is on disk now), the filters, and a list of
 * every change shown, to jump to one. Under it, the two column heads, level with the cards' columns.
 */
import { ArrowLeftRight, Check, ChevronDown, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { EMPTY_TREE, WORKTREE, type CatalogueCommit } from '../../shared/diff.ts'
import { GROUPS, type Change, type Counts, type Entry, type Filters, type Group } from '../../shared/diffModel.ts'
import { RecordMark } from '../components/bits.tsx'
import { dateTimeLabel } from '../dates.ts'
import { useConfig } from '../store.ts'
import { useDismiss } from '../useDismiss.ts'
import { markOf } from './DiffFields.tsx'

export type Density = 'comfortable' | 'compact'
export const DENSITIES: readonly Density[] = ['compact', 'comfortable']

const GROUP_LABEL: Record<Group, string> = { epic: 'Epics', feature: 'Features', story: 'Stories', question: 'Outstanding items', artifact: 'Artifacts' }

/**
 * The bar's place on the page, sticky at the top. It owns the fold, so folding redraws the bar and
 * never the cards. The full bar's height stays reserved in the page while it is folded (the
 * one-line bar drawn at the top of that space, the rest see-through), so folding moves nothing:
 * no jump under the reader, and no scroll anchoring pulling the page back over the fold line,
 * which would unfold it again and loop. `face` is the visible bar, for measuring what it covers.
 */
export function StickyBar({
  page,
  head,
  face,
  children,
}: {
  page: RefObject<HTMLDivElement>
  head: RefObject<HTMLDivElement>
  face: RefObject<HTMLDivElement>
  children: (slim: boolean, showAll: () => void) => ReactNode
}) {
  const slot = useRef<HTMLDivElement>(null)
  const [slim, setSlim] = useState(false)
  const slimRef = useRef(slim)
  slimRef.current = slim
  // Past the page's heading the bar folds to one line. "Change or filter" opens it again until
  // the reader scrolls on a good way, or back up to the heading.
  const openedAt = useRef<number | null>(null)
  useEffect(() => {
    const el = page.current
    if (!el) return
    const onScroll = () => {
      const past = el.scrollTop > (head.current ? head.current.offsetTop + head.current.offsetHeight : 120)
      if (openedAt.current !== null && past && Math.abs(el.scrollTop - openedAt.current) < 320) return setSlim(false)
      openedAt.current = null
      setSlim(past)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [page, head])
  const showAll = () => {
    openedAt.current = page.current?.scrollTop ?? 0
    setSlim(false)
  }
  // The full bar's height is kept as the slot's floor; the visible height goes to the cards
  // (scroll margins, the placeholders that keep pace), written only when it changes.
  useEffect(() => {
    const el = face.current
    if (!el) return
    let shown = -1
    const measure = () => {
      const h = el.offsetHeight
      if (!slimRef.current && slot.current) slot.current.style.minHeight = `${h}px`
      if (h !== shown) {
        shown = h
        page.current?.style.setProperty('--diff-bar-h', `${h}px`)
      }
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [page, face])
  return (
    <div className="diff-bar" ref={slot}>
      <div className="diff-bar-face" ref={face}>
        {children(slim, showAll)}
      </div>
    </div>
  )
}

/** A commit's date and time, in the project's locale. */
function useDateLabel() {
  const { locale } = useConfig().project
  return useCallback((iso: string) => dateTimeLabel(iso, locale), [locale])
}

/** What a ref is called: the commit's message, or what on disk / before any commit means. */
function refName(ref: string, commits: CatalogueCommit[]): { name: string; at: string | null; short: string | null } {
  if (ref === WORKTREE) return { name: 'Uncommitted', at: null, short: null }
  if (ref === EMPTY_TREE) return { name: 'Before the first commit', at: null, short: null }
  const c = commits.find((x) => x.sha === ref || x.sha.startsWith(ref))
  return c ? { name: c.subject, at: c.at, short: c.short } : { name: ref.slice(0, 8), at: null, short: ref.slice(0, 8) }
}

/**
 * A popup list's highlighted row, moved by the arrow keys in its search box and picked by Enter.
 * It starts on the first row that can be picked, and again whenever the search changes (`reset`).
 */
function useActiveRow(count: number, enabled: (i: number) => boolean, onPick: (i: number) => void) {
  const [active, setActive] = useState(-1)
  const list = useRef<HTMLUListElement>(null)
  let first = -1
  for (let i = 0; i < count && first < 0; i++) if (enabled(i)) first = i
  const current = active >= 0 && active < count && enabled(active) ? active : first
  useEffect(() => {
    list.current?.querySelector('.active')?.scrollIntoView?.({ block: 'nearest' })
  }, [current])
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (current >= 0) onPick(current)
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const step = e.key === 'ArrowDown' ? 1 : -1
    for (let i = current + step; i >= 0 && i < count; i += step) {
      if (enabled(i)) return setActive(i)
    }
  }
  return { active: current, list, onKeyDown, reset: () => setActive(-1) }
}

function CommitPicker({
  label,
  value,
  commits,
  worktree,
  isDisabled,
  onPick,
}: {
  label: string
  value: string
  commits: CatalogueCommit[]
  worktree: boolean
  isDisabled: (ref: string) => boolean
  onPick: (ref: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const anchor = useRef<HTMLButtonElement>(null)
  const ref = useDismiss<HTMLDivElement>(() => setOpen(false), anchor, open)
  const dateLabel = useDateLabel()
  const current = refName(value, commits)
  const q = query.trim().toLowerCase()
  const shown = commits.filter((c) => !q || c.subject.toLowerCase().includes(q) || c.sha.startsWith(q))
  const pick = (r: string) => {
    onPick(r)
    setOpen(false)
    setQuery('')
  }
  // The rows as drawn: what is on disk first (To only, with no search), then the commits.
  const rows = [...(worktree && !q ? [WORKTREE] : []), ...shown.map((c) => c.sha)]
  const keys = useActiveRow(rows.length, (i) => rows[i] === WORKTREE || !isDisabled(rows[i]!), (i) => pick(rows[i]!))
  return (
    <div className="diff-picker-wrap">
      <button ref={anchor} type="button" className="diff-picker" aria-expanded={open} aria-haspopup="listbox" onClick={() => {
          setOpen((v) => !v)
          keys.reset()
        }} title={current.short ? `${current.name} · ${current.short}` : current.name}>
        <span className="diff-picker-label">{label}</span>
        <span className="diff-picker-name">{current.name}</span>
        {current.at && <span className="diff-picker-date">{dateLabel(current.at)}</span>}
        <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div ref={ref} className="diff-pop diff-commits" role="dialog" aria-label={`${label}: pick a commit`}>
          <label className="diff-pop-search">
            <Search size={14} aria-hidden />
            <input
              className="input"
              autoFocus
              placeholder="Find a commit by its message"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                keys.reset()
              }}
              onKeyDown={keys.onKeyDown}
            />
          </label>
          <ul ref={keys.list} role="listbox" aria-label="Commits that changed the catalogue">
            {worktree && !q && (
              <li>
                <button type="button" role="option" aria-selected={value === WORKTREE} className={`diff-commit${rows[keys.active] === WORKTREE ? ' active' : ''}`} onClick={() => pick(WORKTREE)}>
                  <span className="diff-commit-date">On disk now</span>
                  <span className="diff-commit-subject">Uncommitted</span>
                  {value === WORKTREE ? <Check size={14} className="diff-commit-check" /> : <span />}
                </button>
              </li>
            )}
            {shown.map((c) => {
              const disabled = isDisabled(c.sha)
              return (
                <li key={c.sha}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === c.sha}
                    className={`diff-commit${rows[keys.active] === c.sha ? ' active' : ''}`}
                    disabled={disabled}
                    onClick={() => pick(c.sha)}
                    title={disabled ? `Pick a commit ${label === 'From' ? 'older' : 'newer'} than the other side` : `${c.short} · ${c.records} record${c.records === 1 ? '' : 's'} changed`}
                  >
                    <span className="diff-commit-date">{dateLabel(c.at)}</span>
                    <span className="diff-commit-subject">
                      {c.subject}
                      <span className="diff-commit-meta">
                        {c.records} record{c.records === 1 ? '' : 's'} · <span className="mono">{c.short}</span>
                      </span>
                    </span>
                    {value === c.sha ? <Check size={14} className="diff-commit-check" /> : <span />}
                  </button>
                </li>
              )
            })}
            {!shown.length && <li className="diff-pop-empty">No commit message matches.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

const CHANGE_WORD: Record<Change, string> = { added: 'Added', edited: 'Edited', removed: 'Removed' }

function JumpList({ entries, onJump }: { entries: Entry[]; onJump: (key: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const anchor = useRef<HTMLButtonElement>(null)
  const ref = useDismiss<HTMLDivElement>(() => setOpen(false), anchor, open)
  const q = query.trim().toLowerCase()
  const shown = entries.filter((e) => !q || e.title.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
  const jump = (key: string) => {
    onJump(key)
    setOpen(false)
  }
  const keys = useActiveRow(shown.length, () => true, (i) => jump(shown[i]!.key))
  return (
    <div className="diff-picker-wrap right">
      <button
        ref={anchor}
        type="button"
        className="btn sm"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v)
          keys.reset()
        }}
        disabled={!entries.length}>
        {entries.length} change{entries.length === 1 ? '' : 's'} <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div ref={ref} className="diff-pop diff-jump" role="dialog" aria-label="Jump to a change">
          <label className="diff-pop-search">
            <Search size={14} aria-hidden />
            <input
              className="input"
              autoFocus
              placeholder="Find a change by its title"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                keys.reset()
              }}
              onKeyDown={keys.onKeyDown}
            />
          </label>
          <ul ref={keys.list}>
            {shown.map((e, i) => (
              <li key={e.key}>
                <button type="button" className={`diff-jump-row change-${e.change}${i === keys.active ? ' active' : ''}`} title={e.id} onClick={() => jump(e.key)}>
                  <RecordMark mark={markOf(e)} />
                  <span className="diff-jump-title">{e.title}</span>
                  {e.change !== 'edited' && <span className={`diff-pill ${e.change === 'added' ? 'add' : 'del'}`}>{CHANGE_WORD[e.change]}</span>}
                </button>
              </li>
            ))}
            {!shown.length && <li className="diff-pop-empty">No change matches.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

export function DiffBar({
  from,
  to,
  commits,
  onPick,
  filters,
  setFilters,
  counts,
  shown,
  viewedCount,
  onJump,
  note,
  slim,
  onShowAll,
  density,
  setDensity,
}: {
  from: string
  to: string
  commits: CatalogueCommit[]
  onPick: (from: string, to: string) => void
  filters: Filters
  setFilters: (f: Filters) => void
  counts: Counts
  shown: Entry[]
  viewedCount: number
  onJump: (key: string) => void
  note: string | null
  /** Scrolled past the page's heading: the bar folds to one line. */
  slim: boolean
  onShowAll: () => void
  density: Density
  setDensity: (d: Density) => void
}) {
  const dateLabel = useDateLabel()
  const index = useMemo(() => new Map(commits.map((c, i) => [c.sha, i])), [commits])
  // Newest first: a lower index is newer. On disk is newer than any commit, before the first older than all.
  const age = (ref: string) => (ref === WORKTREE ? -1 : ref === EMPTY_TREE ? commits.length : (index.get(ref) ?? commits.length))
  const toggle = <T,>(set: Set<T>, v: T) => {
    const next = new Set(set)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    return next
  }
  const head = (ref: string, side: string) => {
    const r = refName(ref, commits)
    return (
      <>
        <span className="diff-colhead-side">{side}</span>
        <span className="diff-colhead-name">{r.name}</span>
        <span className="diff-colhead-date">{r.at ? dateLabel(r.at) : ref === WORKTREE ? 'On disk now' : ''}</span>
      </>
    )
  }
  const colheads = (
    <div className="diff-colheads" aria-hidden>
      <div className="diff-colhead before">{head(from, 'Before')}</div>
      <div />
      <div className="diff-colhead after">{head(to, 'After')}</div>
    </div>
  )
  if (slim) {
    return (
      <div className="diff-bar-inner slim">
        <div className="diff-bar-row">
          <span className="diff-slim-cmp" title={`${refName(from, commits).name} to ${refName(to, commits).name}`}>
            <span className="k">From</span>
            <span className="n">{refName(from, commits).name}</span>
            <span className="k">to</span>
            <span className="n">{refName(to, commits).name}</span>
          </span>
          <button type="button" className="diff-linkish" onClick={onShowAll}>
            Change or filter
          </button>
          <span className="diff-bar-spacer" />
          {shown.length > 0 && (
            <span className="diff-viewed-count">
              {viewedCount} of {shown.length} viewed
            </span>
          )}
          <JumpList entries={shown} onJump={onJump} />
        </div>
        {colheads}
      </div>
    )
  }
  return (
    <div className="diff-bar-inner">
      <div className="diff-bar-row">
        <CommitPicker label="From" value={from} commits={commits} worktree={false} isDisabled={(r) => age(r) <= age(to)} onPick={(r) => onPick(r, to)} />
        <button type="button" className="btn icon ghost" title="Swap From and To" aria-label="Swap From and To" disabled={to === WORKTREE} onClick={() => onPick(to, from)}>
          <ArrowLeftRight size={16} />
        </button>
        <CommitPicker label="To" value={to} commits={commits} worktree isDisabled={(r) => age(r) >= age(from)} onPick={(r) => onPick(from, r)} />
        <span className="diff-bar-spacer" />
        <span className="diff-keys" title="Keys: j and k go up to the previous change or down to the next, Shift J and Shift K up or down a card, v ticks the card Viewed and goes on">
          <kbd>j</kbd>
          <kbd>k</kbd> changes <kbd>⇧J</kbd>
          <kbd>⇧K</kbd> cards <kbd>v</kbd> viewed
        </span>
        {shown.length > 0 && (
          <span className="diff-viewed-count">
            {viewedCount} of {shown.length} viewed
          </span>
        )}
        <JumpList entries={shown} onJump={onJump} />
      </div>
      {note && <p className="diff-note-line">{note}</p>}
      <div className="diff-bar-row filters" role="group" aria-label="Filters">
        {GROUPS.map((g) => (
          <button key={g} type="button" className="diff-toggle" aria-pressed={filters.groups.has(g)} onClick={() => setFilters({ ...filters, groups: toggle(filters.groups, g) })}>
            {GROUP_LABEL[g]} <span className="count">{counts.byGroup[g]}</span>
          </button>
        ))}
        <span className="diff-bar-rule" aria-hidden />
        {(['added', 'edited', 'removed'] as Change[]).map((c) => (
          <button key={c} type="button" className={`diff-toggle change-${c}`} aria-pressed={filters.changes.has(c)} onClick={() => setFilters({ ...filters, changes: toggle(filters.changes, c) })}>
            {CHANGE_WORD[c]} <span className="count">{counts.byChange[c]}</span>
          </button>
        ))}
        <span className="diff-bar-rule" aria-hidden />
        <button type="button" className="diff-toggle" aria-pressed={filters.minor} onClick={() => setFilters({ ...filters, minor: !filters.minor })} title="Reorders, and text that differs only in its spacing">
          Show minor changes <span className="count">{counts.minor}</span>
        </button>
        <span className="diff-bar-spacer" />
        <div className="mode-switch" role="radiogroup" aria-label="Density">
          {(['comfortable', 'compact'] as Density[]).map((d) => (
            <button key={d} type="button" role="radio" aria-checked={density === d} onClick={() => setDensity(d)}>
              {d === 'compact' ? 'Compact' : 'Comfortable'}
            </button>
          ))}
        </div>
      </div>
      {colheads}
    </div>
  )
}

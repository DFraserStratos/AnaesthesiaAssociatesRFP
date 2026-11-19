import { ChevronDown, ChevronRight, ImageIcon, MessageCircleQuestion, Search } from 'lucide-react'
import { Fragment, useMemo, useState, type KeyboardEvent } from 'react'
import { compareIds } from '../../shared/ids.ts'
import { statusClasses } from '../../shared/statuses.ts'
import type { Item } from '../../shared/types.ts'
import { Glyph, Highlight, StatusLabel, TypeIcon } from '../components/bits.tsx'
import { useOpen } from '../nav.ts'
import { isString, readJson, writeJson } from '../storage.ts'
import { descendantsOf, matchesFilters, openQuestionsFor, useShownIndex, useView, type Index } from '../store.ts'
import { typeClass } from '../vocab.ts'

const COLLAPSE_KEY = 'requirements-board:outline-collapsed'
const FOLD_WHILE_SEARCHING = 'Search shows every match open; clear the search to fold rows'
/** Folded rows by card ID; a saved value that is not a list of IDs keeps only its IDs (`storage.ts`). */
export function readCollapsed(): Set<string> {
  return readJson(COLLAPSE_KEY, "Outline's folded rows", new Set<string>(), (raw, bad) => {
    if (!Array.isArray(raw)) {
      bad()
      return new Set<string>()
    }
    if (!raw.every(isString)) bad()
    return new Set(raw.filter(isString))
  })
}

export function OutlineView() {
  // As shown: with the Retired toggle off, retired cards and everything under them are out of the tree and its counts.
  const index = useShownIndex()
  const view = useView()
  const open = useOpen()
  const [collapsed, setCollapsedState] = useState(readCollapsed)
  const setCollapsed = (next: Set<string>) => {
    setCollapsedState(next)
    writeJson(COLLAPSE_KEY, [...next])
  }

  const query = view.search.trim()
  // While searching, show matches and their ancestors, fully expanded.
  const visible = useMemo(() => {
    if (!query) return null
    const keep = new Set<string>()
    for (const it of index.items) {
      if (!matchesFilters(it, { ...view, statuses: [], components: [], types: [], onlyWithQuestions: false }, index)) continue
      let cur: Item | undefined = it
      while (cur && !keep.has(cur.id)) {
        keep.add(cur.id)
        cur = cur.parent ? index.byId.get(cur.parent) : undefined
      }
    }
    return keep
  }, [query, index, view])

  const searching = !!visible
  const unplaced = useMemo(() => unplacedRoots(index), [index])
  const rows: { item: Item; depth: number; reason?: string }[] = []
  // Each card once, whatever parent cycles the data holds.
  const listed = new Set<string>()
  const walk = (list: Item[], depth: number) => {
    for (const it of list) {
      if (listed.has(it.id) || (visible && !visible.has(it.id))) continue
      listed.add(it.id)
      rows.push({ item: it, depth, reason: depth === 0 ? unplaced.reasons.get(it.id) : undefined })
      if (visible || !collapsed.has(it.id)) walk(index.children.get(it.id) ?? [], depth + 1)
    }
  }
  walk(index.epics, 0)
  // Cards no epic reaches (FINDINGS R-122): a final group, each root with its reason and the cards
  // under it beneath it as usual, so the header's counts and search cover every card.
  const groupStart = rows.length
  walk(unplaced.roots, 0)

  const toggle = (id: string) => {
    const next = new Set(collapsed)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCollapsed(next)
  }

  // Roving tabindex: the tree is one Tab stop; arrows move within it.
  const [focusId, setFocusId] = useState<string | null>(null)
  const tabStop = rows.some((r) => r.item.id === focusId) ? focusId : (rows[0]?.item.id ?? null)
  const focusRow = (n: number) => {
    const row = rows[Math.max(0, Math.min(n, rows.length - 1))]
    if (!row) return
    setFocusId(row.item.id)
    document.querySelector<HTMLElement>(`.tree-row[data-id="${row.item.id}"]`)?.focus()
  }
  const onRowKey = (e: KeyboardEvent<HTMLDivElement>, it: Item, i: number) => {
    const expandable = !visible && index.children.has(it.id) // while searching everything is expanded
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusRow(i + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusRow(i - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusRow(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusRow(rows.length - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (expandable && collapsed.has(it.id)) toggle(it.id)
      else if (rows[i + 1]?.item.parent === it.id) focusRow(i + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (expandable && !collapsed.has(it.id)) toggle(it.id)
      else if (it.parent && rows.some((r) => r.item.id === it.parent)) focusRow(rows.findIndex((r) => r.item.id === it.parent))
    } else if (e.key === 'Enter') open.item(it.id)
  }

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-head">
          <div>
            <h1>Outline</h1>
            <p>
              {index.epics.length} epics · {index.items.filter((i) => i.type === 'feature').length} features · {index.items.filter((i) => i.type === 'story').length} stories
            </p>
          </div>
        </div>
        <div className="page-tools">
          <label className="search">
            <Search size={15} />
            <span className="sr-only">Search the catalogue</span>
            <input className="input" placeholder="Search IDs, titles and text" value={view.search} onChange={(e) => view.set({ search: e.target.value })} />
          </label>
          {/* While searching every match shows open, so folding would change only what is hidden (B11-Q5). The
              buttons stay focusable (aria-disabled), and say why. */}
          {(
            [
              ['Expand all', () => new Set<string>()],
              ['Collapse to epics', () => new Set(index.items.filter((i) => i.type !== 'story').map((i) => i.id))],
              ['Features only', () => new Set(index.items.filter((i) => i.type === 'feature').map((i) => i.id))],
            ] as const
          ).map(([label, folds]) => (
            <button
              key={label}
              className="btn"
              aria-disabled={searching}
              aria-describedby={searching ? 'outline-fold-note' : undefined}
              title={searching ? FOLD_WHILE_SEARCHING : undefined}
              onClick={() => !searching && setCollapsed(folds())}
            >
              {label}
            </button>
          ))}
          {searching && (
            <span id="outline-fold-note" className="sr-only">
              {FOLD_WHILE_SEARCHING}
            </span>
          )}
          <button className="btn" aria-pressed={view.showRetired} onClick={() => view.set({ showRetired: !view.showRetired })}>
            Show retired
          </button>
        </div>
        <div className="tree" role="tree" aria-label="Catalogue outline">
          {rows.map(({ item, depth, reason }, i) => (
            <Fragment key={item.id}>
              {i === groupStart && (
                <div role="presentation" className="tree-group-head">
                  Not under an epic
                </div>
              )}
              <OutlineRow
                item={item}
                depth={depth}
                reason={reason}
                index={index}
                query={query}
                collapsed={!visible && collapsed.has(item.id)}
                searching={searching}
                tabbable={item.id === tabStop}
                onFocus={() => setFocusId(item.id)}
                onToggle={() => toggle(item.id)}
                onOpen={() => open.item(item.id)}
                onKey={(e) => onRowKey(e, item, i)}
              />
            </Fragment>
          ))}
        </div>
        {rows.length === 0 && <p className="empty">Nothing matches.</p>}
      </div>
    </div>
  )
}

/**
 * The cards the epic tree does not reach, as the roots of the Outline's final group, each with why:
 * a non-epic with no parent, a parent that does not exist, then members of a parent cycle (lowest
 * ID first, one per cycle; the rest of the cycle hangs under it). Cards under these follow them.
 */
export function unplacedRoots(index: Index): { roots: Item[]; reasons: Map<string, string> } {
  const reached = new Set<string>()
  const reach = (list: Item[]) => {
    for (const it of list) {
      if (reached.has(it.id)) continue
      reached.add(it.id)
      reach(index.children.get(it.id) ?? [])
    }
  }
  reach(index.epics)
  const roots: Item[] = []
  const reasons = new Map<string, string>()
  const left = index.items.filter((i) => !reached.has(i.id)).sort((a, b) => compareIds(a.id, b.id))
  for (const it of left) {
    if (it.parent && index.byId.has(it.parent)) continue
    roots.push(it)
    reasons.set(it.id, it.parent ? `parent ${it.parent} does not exist` : it.type === 'epic' ? 'not under an epic' : 'no parent')
    reach([it])
  }
  // What is left hangs, at some remove, from a parent cycle: root each cycle at its lowest ID; the
  // cards under it (a tail off the cycle included) follow it.
  for (const it of left) {
    if (reached.has(it.id)) continue
    const path: string[] = []
    let cur: Item | undefined = it
    while (cur && !path.includes(cur.id)) {
      path.push(cur.id)
      cur = cur.parent ? index.byId.get(cur.parent) : undefined
    }
    if (!cur) continue // cannot happen: everything left has a parent that exists
    const members = path.slice(path.indexOf(cur.id)).sort(compareIds)
    const root = index.byId.get(members[0]!)!
    roots.push(root)
    reasons.set(root.id, 'in a parent cycle')
    reach([root])
  }
  return { roots, reasons }
}

function OutlineRow({
  item,
  depth,
  reason,
  index,
  query,
  collapsed,
  searching,
  tabbable,
  onFocus,
  onToggle,
  onOpen,
  onKey,
}: {
  item: Item
  depth: number
  /** Why a card in the final group is not under an epic. */
  reason?: string
  index: Index
  query: string
  collapsed: boolean
  /** While searching every row shows open and the twisty folds nothing (FINDINGS R-126). */
  searching: boolean
  tabbable: boolean
  onFocus: () => void
  onToggle: () => void
  onOpen: () => void
  onKey: (e: KeyboardEvent<HTMLDivElement>) => void
}) {
  const hasKids = (index.children.get(item.id) ?? []).length > 0
  const oq = openQuestionsFor(index, item.id).length
  const count = hasKids && collapsed ? descendantsOf(index, item.id).length : 0
  return (
    <div
      role="treeitem"
      data-id={item.id}
      aria-level={depth + 1}
      aria-expanded={hasKids ? !collapsed : undefined}
      tabIndex={tabbable ? 0 : -1}
      onFocus={onFocus}
      className={`tree-row ${item.type} ${statusClasses(index.config, 'item', item.status)}`} style={{ ['--depth' as string]: depth }} onClick={onOpen} onKeyDown={onKey}>
      <span
        className={`twisty${searching ? ' inert' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          if (hasKids && !searching) onToggle()
        }}
        title={searching && hasKids ? FOLD_WHILE_SEARCHING : undefined}
        aria-hidden
      >
        {hasKids ? collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} /> : null}
      </span>
      <span className={`t-title ${typeClass(item.type)}`} title={item.id}>
        <TypeIcon type={item.type} size={item.type === 'epic' ? 16 : 14} />
        <Highlight text={item.title} query={query} />
        {count > 0 && <span className="mono" style={{ marginLeft: 8 }}>+{count}</span>}
        {reason && <span className="tree-reason">{reason}</span>}
      </span>
      <span className="tree-meta">
        {oq > 0 && (
          <span className="badge q" title={`${oq} open question${oq > 1 ? 's' : ''}`}>
            <MessageCircleQuestion size={12} /> {oq}
          </span>
        )}
        {item.images.length > 0 && (
          <span className="badge" title="Screenshots">
            <ImageIcon size={12} /> {item.images.length}
          </span>
        )}
        {item.components.map((c) => (
          <Glyph key={c} component={c} />
        ))}
      </span>
      <StatusLabel kind="item" status={item.status} />
    </div>
  )
}

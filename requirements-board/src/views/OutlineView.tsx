import { ChevronDown, ChevronRight, ImageIcon, MessageCircleQuestion, Search } from 'lucide-react'
import { useMemo, useState, type KeyboardEvent } from 'react'
import type { Item } from '../../shared/types.ts'
import { Glyph, Highlight, StatusLabel } from '../components/bits.tsx'
import { useOpen } from '../nav.ts'
import { descendantsOf, matchesFilters, openQuestionsFor, useIndex, useView, type Index } from '../store.ts'
import { statusClass } from '../vocab.ts'

const COLLAPSE_KEY = 'requirements-board:outline-collapsed'
function readCollapsed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function OutlineView() {
  const index = useIndex()
  const view = useView()
  const open = useOpen()
  const [collapsed, setCollapsedState] = useState(readCollapsed)
  const setCollapsed = (next: Set<string>) => {
    setCollapsedState(next)
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next]))
    } catch {
      /* not persisted */
    }
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

  const rows: { item: Item; depth: number }[] = []
  const walk = (list: Item[], depth: number) => {
    for (const it of list) {
      if (!view.showRetired && it.status === 'Retired') continue
      if (visible && !visible.has(it.id)) continue
      rows.push({ item: it, depth })
      if (visible || !collapsed.has(it.id)) walk(index.children.get(it.id) ?? [], depth + 1)
    }
  }
  walk(index.epics, 0)

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
      else if (it.parent) focusRow(rows.findIndex((r) => r.item.id === it.parent))
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
          <button className="btn" onClick={() => setCollapsed(new Set())}>
            Expand all
          </button>
          <button className="btn" onClick={() => setCollapsed(new Set(index.items.filter((i) => i.type !== 'story').map((i) => i.id)))}>
            Collapse to epics
          </button>
          <button className="btn" onClick={() => setCollapsed(new Set(index.items.filter((i) => i.type === 'feature').map((i) => i.id)))}>
            Features only
          </button>
          <button className="btn" aria-pressed={view.showRetired} onClick={() => view.set({ showRetired: !view.showRetired })}>
            Show retired
          </button>
        </div>
        <div className="tree" role="tree" aria-label="Catalogue outline">
          {rows.map(({ item, depth }, i) => (
            <OutlineRow
              key={item.id}
              item={item}
              depth={depth}
              index={index}
              query={query}
              collapsed={!visible && collapsed.has(item.id)}
              tabbable={item.id === tabStop}
              onFocus={() => setFocusId(item.id)}
              onToggle={() => toggle(item.id)}
              onOpen={() => open.item(item.id)}
              onKey={(e) => onRowKey(e, item, i)}
            />
          ))}
        </div>
        {rows.length === 0 && <p className="empty">Nothing matches.</p>}
      </div>
    </div>
  )
}

function OutlineRow({
  item,
  depth,
  index,
  query,
  collapsed,
  tabbable,
  onFocus,
  onToggle,
  onOpen,
  onKey,
}: {
  item: Item
  depth: number
  index: Index
  query: string
  collapsed: boolean
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
      className={`tree-row ${item.type} ${statusClass(item.status)}`} style={{ ['--depth' as string]: depth }} onClick={onOpen} onKeyDown={onKey}>
      <span
        className="twisty"
        onClick={(e) => {
          e.stopPropagation()
          if (hasKids) onToggle()
        }}
        aria-hidden
      >
        {hasKids ? collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} /> : null}
      </span>
      <span className="mono">{item.id}</span>
      <span className="t-title">
        <Highlight text={item.title} query={query} />
        {count > 0 && <span className="mono" style={{ marginLeft: 8 }}>+{count}</span>}
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
      <StatusLabel status={item.status} />
    </div>
  )
}

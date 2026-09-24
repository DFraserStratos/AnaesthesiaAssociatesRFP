import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type NodeChange,
  type Viewport,
} from '@xyflow/react'
import { ExternalLink, Filter, LayoutGrid, Map as MapIcon, Maximize, Search, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { COMPONENTS, ITEM_STATUSES, ITEM_TYPES, type Item } from '../../shared/types.ts'
import { autoLayout } from '../board/autoLayout.ts'
import { CardNode, type CardData, type CardNodeType } from '../board/CardNode.tsx'
import { Glyph } from '../components/bits.tsx'
import { useOpen } from '../nav.ts'
import { ancestorsOf, descendantsOf, filtersActive, matchesFilters, openQuestionsFor, useCatalogue, useIndex, useView, type Index } from '../store.ts'
import { STATUS_HELP, TYPE_LABEL, statusClass } from '../vocab.ts'

const nodeTypes = { card: CardNode }
const VIEWPORT_KEY = 'requirements-board:viewport'
/** Clear the floating toolbar and legend when fitting the whole map. */
const FIT = { padding: { top: '84px', bottom: '64px', left: '24px', right: '24px' }, maxZoom: 0.6 } as const
const STATUS_HEX: Record<string, string> = {
  Confirmed: '#2f7d4f',
  RFP: '#8a989e',
  Proposed: '#2f5fa8',
  Future: '#7a62a8',
  Open: '#c0851b',
  Retired: '#c9d1d4',
}

function readViewport(): Viewport | undefined {
  try {
    const raw = localStorage.getItem(VIEWPORT_KEY)
    return raw ? (JSON.parse(raw) as Viewport) : undefined
  } catch {
    return undefined
  }
}
/** Semantic zoom bands: overview (epic names, status blocks), far (ID + title), mid, near (excerpt). */
const zoomBand = (z: number) => (z < 0.3 ? 'zoom-far zoom-overview' : z < 0.5 ? 'zoom-far' : z >= 0.95 ? 'zoom-near' : 'zoom-mid')

export function BoardView() {
  return (
    <ReactFlowProvider>
      <Board />
    </ReactFlowProvider>
  )
}

function lineageOf(index: Index, id: string): Set<string> {
  return new Set([id, ...ancestorsOf(index, id).map((i) => i.id), ...descendantsOf(index, id).map((i) => i.id)])
}

function Board() {
  const index = useIndex()
  const positions = useCatalogue((s) => s.layout.positions)
  const setPositions = useCatalogue((s) => s.setPositions)
  const view = useView()
  const open = useOpen()
  const rf = useReactFlow<CardNodeType>()
  const [selected, setSelected] = useState<string | null>(null)
  const [initialViewport] = useState(readViewport)
  const [zoomClass, setZoomClass] = useState(() => zoomBand(initialViewport?.zoom ?? 0.4))
  const [showFilters, setShowFilters] = useState(false)
  const [hitCursor, setHitCursor] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const modalOpen = open.params.has('item') || open.params.has('question')

  const auto = useMemo(() => autoLayout(index.items), [index.items])
  const lineage = useMemo(() => (selected && index.byId.has(selected) ? lineageOf(index, selected) : null), [index, selected])
  const filtering = filtersActive(view)
  const matches = useMemo(() => new Set(index.items.filter((it) => matchesFilters(it, view, index)).map((i) => i.id)), [index, view])
  const hits = useMemo(
    () => (filtering ? Object.keys(auto).filter((id) => matches.has(id) && (view.showRetired || index.byId.get(id)?.status !== 'Retired')) : []),
    [filtering, auto, matches, view.showRetired, index],
  )

  // The hit list can shrink under the cursor (filters, Retired toggle, external edits).
  useEffect(() => setHitCursor(-1), [hits])

  const toneFor = useCallback(
    (id: string): CardData['tone'] => {
      if (filtering && !matches.has(id)) return 'is-faded'
      if (lineage) return id === selected ? 'is-selected' : lineage.has(id) ? 'is-lit' : 'is-dim'
      return ''
    },
    [filtering, matches, lineage, selected],
  )

  const descendantCounts = useMemo(() => {
    const counts = new Map<string, number>()
    const count = (id: string): number => {
      const cached = counts.get(id)
      if (cached !== undefined) return cached
      counts.set(id, 0) // cycle guard for bad data
      const n = (index.children.get(id) ?? []).reduce((sum, c) => sum + 1 + count(c.id), 0)
      counts.set(id, n)
      return n
    }
    for (const it of index.items) count(it.id)
    return counts
  }, [index])

  const computed = useMemo<CardNodeType[]>(
    () =>
      index.items
        .filter((it) => auto[it.id])
        .map((it) => {
          const a = auto[it.id]!
          const pos = positions[it.id] ?? { x: a.x, y: a.y }
          return {
            id: it.id,
            type: 'card' as const,
            position: pos,
            hidden: it.status === 'Retired' && !view.showRetired,
            zIndex: it.type === 'epic' ? 0 : it.type === 'feature' ? 1 : 2,
            data: {
              item: it,
              w: a.w,
              h: a.h,
              openQuestions: openQuestionsFor(index, it.id).length,
              childCount: descendantCounts.get(it.id) ?? 0,
              tone: toneFor(it.id),
            },
          }
        }),
    [index, auto, positions, view.showRetired, toneFor, descendantCounts],
  )

  // React Flow owns in-flight drag positions; the store owns everything else.
  const [nodes, setNodes] = useState<CardNodeType[]>(computed)
  useEffect(() => {
    // Carry React Flow's own per-node state across rebuilds: without `measured` every card
    // hides and re-measures on each click or keystroke; a card mid-drag keeps its live position.
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]))
      return computed.map((n) => {
        const p = byId.get(n.id)
        if (!p) return n
        return { ...n, measured: p.measured, selected: p.selected, dragging: p.dragging, position: p.dragging ? p.position : n.position }
      })
    })
  }, [computed])
  const onNodesChange = useCallback((changes: NodeChange<CardNodeType>[]) => setNodes((ns) => applyNodeChanges(changes, ns)), [])

  const edges = useMemo<Edge[]>(() => {
    const out: Edge[] = []
    for (const it of index.items) {
      if (!it.parent) continue
      const parent = index.byId.get(it.parent)
      if (!parent || !auto[it.id]) continue
      if (!view.showRetired && (it.status === 'Retired' || parent.status === 'Retired')) continue
      const lit = !!lineage && lineage.has(it.id) && lineage.has(parent.id)
      const dim = (!!lineage && !lit) || (filtering && (!matches.has(it.id) || !matches.has(parent.id)))
      const spine = it.type === 'story'
      out.push({
        id: `${parent.id}>${it.id}`,
        source: parent.id,
        target: it.id,
        sourceHandle: spine && parent.type === 'feature' ? 'ls' : undefined,
        targetHandle: spine ? 'l' : undefined,
        type: spine ? 'smoothstep' : 'default',
        pathOptions: spine ? { offset: 18, borderRadius: 10 } : undefined,
        className: lit ? 'lit' : dim ? 'dim' : '',
        focusable: false,
        selectable: false,
      } as Edge)
    }
    return out
  }, [index, auto, lineage, filtering, matches, view.showRetired])

  const centreOn = useCallback(
    (id: string, zoom?: number) => {
      const n = rf.getNode(id)
      if (!n) return
      const w = (n.data as CardData).w
      const h = (n.data as CardData).h
      void rf.setCenter(n.position.x + w / 2, n.position.y + h / 2, { zoom: zoom ?? Math.max(rf.getZoom(), 0.9), duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450 })
    },
    [rf],
  )

  // "Show on board" from a modal or another view lands here as ?focus=ID.
  const focusId = open.params.get('focus')
  useEffect(() => {
    if (!focusId) return
    const it = index.byId.get(focusId)
    if (it) {
      if (it.status === 'Retired' && !view.showRetired) view.set({ showRetired: true })
      setSelected(focusId)
      setTimeout(() => centreOn(focusId, 1), 60)
    }
    open.clearFocus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  // Keyboard: / search, Enter open, Esc clear, arrows walk the tree.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen) return
      const target = e.target instanceof HTMLElement ? e.target : null
      const typing = !!target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
        return
      }
      // Only walk the tree when focus is on the page or the canvas, never on a button or link
      // (Enter there must just press it).
      const onCanvas = !target || target === document.body || !!target.closest('.react-flow')
      if (typing || !onCanvas || !selected) return
      const it = index.byId.get(selected)
      if (!it) return
      const go = (next: Item | undefined) => {
        if (!next) return
        e.preventDefault()
        setSelected(next.id)
        centreOn(next.id)
      }
      const sibs = it.parent ? (index.children.get(it.parent) ?? []) : index.epics
      const at = sibs.findIndex((s) => s.id === it.id)
      if (e.key === 'Enter') open.item(it.id)
      else if (e.key === 'Escape') setSelected(null)
      else if (e.key === 'ArrowUp') go(it.type === 'story' && at > 0 ? sibs[at - 1] : it.parent ? index.byId.get(it.parent) : undefined)
      else if (e.key === 'ArrowDown') go(it.type === 'story' ? sibs[at + 1] : index.children.get(it.id)?.[0])
      else if (e.key === 'ArrowLeft') go(sibs[at - 1])
      else if (e.key === 'ArrowRight') go(sibs[at + 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, selected, index, open, centreOn])

  const nextHit = (dir: 1 | -1) => {
    if (!hits.length) return
    const n = (hitCursor + dir + hits.length) % hits.length
    setHitCursor(n)
    setSelected(hits[n]!)
    centreOn(hits[n]!)
  }

  const tidy = (ids: string[]) => setPositions(Object.fromEntries(ids.map((id) => [id, null])))
  const selectedItem = selected ? index.byId.get(selected) : undefined
  const epicOfSelected = selectedItem ? (selectedItem.type === 'epic' ? selectedItem : ancestorsOf(index, selectedItem.id)[0]) : undefined
  const moved = Object.keys(positions).length

  return (
    <div className={`board ${zoomClass}`}>
      <ReactFlow<CardNodeType>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={(_, n) => setSelected(n.id)}
        onNodeDoubleClick={(_, n) => open.item(n.id)}
        onPaneClick={() => setSelected(null)}
        onNodeDragStop={(_, _n, dragged) => setPositions(Object.fromEntries(dragged.map((d) => [d.id, d.position])))}
        onMove={(_, vp) => setZoomClass((z) => (zoomBand(vp.zoom) === z ? z : zoomBand(vp.zoom)))}
        onMoveEnd={(_, vp) => {
          try {
            localStorage.setItem(VIEWPORT_KEY, JSON.stringify(vp))
          } catch {
            /* not persisted */
          }
        }}
        defaultViewport={initialViewport}
        fitView={!initialViewport}
        fitViewOptions={FIT}
        minZoom={0.08}
        maxZoom={1.8}
        zoomOnDoubleClick={false}
        deleteKeyCode={null}
        disableKeyboardA11y
        nodesConnectable={false}
        edgesFocusable={false}
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
      >
        {/* The anaesthetic chart: fine minor grid, stronger major grid every fifth line. */}
        <Background id="minor" variant={BackgroundVariant.Lines} gap={16} color="#e0e9e5" lineWidth={1} />
        <Background id="major" variant={BackgroundVariant.Lines} gap={80} color="#d3dfda" lineWidth={1} />
        {view.showMinimap && <MiniMap pannable zoomable nodeColor={(n) => STATUS_HEX[(n.data as CardData).item.status] ?? '#8a989e'} nodeBorderRadius={2} maskColor="rgba(237,242,240,0.7)" />}
      </ReactFlow>

      <div className="toolbar">
        <div className="toolbar-group" style={{ position: 'relative' }}>
          <label className="search">
            <Search size={15} />
            <span className="sr-only">Search the board</span>
            <input
              ref={searchRef}
              className="input"
              placeholder="Search the board"
              value={view.search}
              onChange={(e) => {
                view.set({ search: e.target.value })
                setHitCursor(-1)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  nextHit(e.shiftKey ? -1 : 1)
                } else if (e.key === 'Escape') {
                  view.set({ search: '' })
                  e.currentTarget.blur()
                }
              }}
            />
            {!view.search && <kbd>/</kbd>}
          </label>
          {filtering && (
            <span className="search-count" aria-live="polite">
              {hitCursor >= 0 ? `${hitCursor + 1} of ${hits.length}` : `${hits.length} match${hits.length === 1 ? '' : 'es'}`}
            </span>
          )}
          <button className="btn" aria-pressed={showFilters || (filtering && !view.search)} aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
            <Filter size={15} /> Filters
          </button>
          {filtering && (
            <button className="btn icon ghost" onClick={view.clearFilters} aria-label="Clear search and filters" title="Clear search and filters">
              <X size={15} />
            </button>
          )}
          {showFilters && <FilterPopover />}
        </div>
        <span className="toolbar-spacer" />
        <div className="toolbar-group">
          <button className="btn ghost" aria-pressed={view.showRetired} onClick={() => view.set({ showRetired: !view.showRetired })}>
            Retired
          </button>
          <button
            className="btn ghost"
            disabled={!moved}
            title={moved ? `${moved} card${moved > 1 ? 's' : ''} moved from the story map` : 'Every card is in its story-map place'}
            onClick={() => {
              if (window.confirm(`Put all ${moved} moved card${moved > 1 ? 's' : ''} back in the story map?`)) tidy(Object.keys(positions))
            }}
          >
            <LayoutGrid size={15} /> Tidy all
          </button>
          <button className="btn icon ghost" onClick={() => void rf.fitView({ ...FIT, duration: 400 })} aria-label="Fit the whole map" title="Fit the whole map">
            <Maximize size={15} />
          </button>
          <button className="btn icon ghost" aria-pressed={view.showMinimap} onClick={() => view.set({ showMinimap: !view.showMinimap })} aria-label="Minimap" title="Minimap">
            <MapIcon size={15} />
          </button>
        </div>
      </div>

      {selectedItem ? (
        <div className="selection-bar" role="status">
          <div className="crumbs">
            {[...ancestorsOf(index, selectedItem.id), selectedItem].map((a, i, arr) => (
              <span key={a.id} style={{ display: 'contents' }}>
                <span className="mono">{a.id}</span>
                {i === arr.length - 1 && <span className="title">{a.title}</span>}
                {i < arr.length - 1 && <span className="sep">›</span>}
              </span>
            ))}
          </div>
          {epicOfSelected && (
            <button className="btn sm" onClick={() => tidy([epicOfSelected.id, ...descendantsOf(index, epicOfSelected.id).map((d) => d.id)])} title={`Put ${epicOfSelected.id} and everything under it back in the story map`}>
              <Sparkles size={14} /> Tidy this epic
            </button>
          )}
          <button className="btn sm primary" onClick={() => open.item(selectedItem.id)}>
            <ExternalLink size={14} /> Open <kbd style={{ background: 'transparent', color: '#cfe', borderColor: '#5fa39a' }}>↵</kbd>
          </button>
        </div>
      ) : (
        <div className="legend" aria-label="Legend">
          {ITEM_STATUSES.filter((s) => s !== 'Retired' || view.showRetired).map((s) => (
            <span key={s} className={`status ${statusClass(s)}`} title={STATUS_HELP[s]}>
              {s}
            </span>
          ))}
          <span>· click to trace, double-click to open</span>
        </div>
      )}
    </div>
  )
}

function FilterPopover() {
  const view = useView()
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  return (
    <div className="popover" role="dialog" aria-label="Filters">
      <h4>Status</h4>
      <div className="chip-row">
        {ITEM_STATUSES.map((s) => (
          <button key={s} className="chip toggle" aria-pressed={view.statuses.includes(s)} onClick={() => view.set({ statuses: toggle(view.statuses, s) })}>
            <span className={`status ${statusClass(s)}`}>{s}</span>
          </button>
        ))}
      </div>
      <h4>Type</h4>
      <div className="chip-row">
        {ITEM_TYPES.map((t) => (
          <button key={t} className="chip toggle" aria-pressed={view.types.includes(t)} onClick={() => view.set({ types: toggle(view.types, t) })}>
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      <h4>Component</h4>
      <div className="chip-row">
        {COMPONENTS.map((c) => (
          <button key={c} className="chip toggle" aria-pressed={view.components.includes(c)} onClick={() => view.set({ components: toggle(view.components, c) })}>
            <Glyph component={c} /> {c}
          </button>
        ))}
      </div>
      <h4>Questions</h4>
      <label className="check-row">
        <input type="checkbox" checked={view.onlyWithQuestions} onChange={(e) => view.set({ onlyWithQuestions: e.target.checked })} />
        Only items with open questions
      </label>
    </div>
  )
}

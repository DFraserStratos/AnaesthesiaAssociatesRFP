import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  type NodeChange,
  type Viewport,
} from '@xyflow/react'
import { Filter, LayoutGrid, Map as MapIcon, Maximize, Search, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { COMPONENTS, ITEM_STATUSES, ITEM_TYPES, TYPE_LABEL, type Item } from '../../shared/types.ts'
import { autoLayout } from '../board/autoLayout.ts'
import type { CardData, CardNodeType } from '../board/cardData.ts'
import { CardNode } from '../board/CardNode.tsx'
import { buildEdges, buildNodes, countDescendants, type GraphInput } from '../board/graph.ts'
import { Glyph, StatusLabel } from '../components/bits.tsx'
import { ItemModal } from '../components/ItemModal.tsx'
import { guarded, useOpen } from '../nav.ts'
import { ancestorsOf, descendantsOf, filtersActive, matchesFilters, useCatalogue, useIndex, useView, type Index } from '../store.ts'
import { useDismiss } from '../useDismiss.ts'

const nodeTypes = { card: CardNode }
const VIEWPORT_KEY = 'requirements-board:viewport'
/** The item panel's share of the width, in percent: a third by default, the board keeps two thirds. */
const PANEL_KEY = 'requirements-board:panel-width'
const PANEL_DEFAULT = 100 / 3
const PANEL_MIN = 25
const PANEL_MAX = 70
const clampPanel = (w: number) => Math.min(PANEL_MAX, Math.max(PANEL_MIN, w))
/** Clear the floating toolbar and legend when fitting the whole map. */
const FIT = { padding: { top: '84px', bottom: '64px', left: '24px', right: '24px' }, maxZoom: 0.6 } as const
/** Minimap blocks by type. The minimap paints SVG fills, not CSS, so these mirror the --ty-* tokens in styles.css. */
const TYPE_HEX = { epic: '#e06c00', feature: '#773b93', story: '#009ccc' } as const
/** How much of a wide card (an epic) must be on screen to count as in view. */
const CARD_PEEK = 240

function readViewport(): Viewport | undefined {
  try {
    const raw = localStorage.getItem(VIEWPORT_KEY)
    return raw ? (JSON.parse(raw) as Viewport) : undefined
  } catch {
    return undefined
  }
}
function readPanel(): number {
  try {
    const w = Number(localStorage.getItem(PANEL_KEY))
    return w ? clampPanel(w) : PANEL_DEFAULT
  } catch {
    return PANEL_DEFAULT
  }
}
/** Semantic zoom bands: overview (epic names, status blocks), far (titles only), mid, near (excerpt). */
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
  // The open card is the URL's `?item=`: clicking a card opens it in the side panel and lights its lineage.
  const selected = open.params.get('item')
  const [panelW, setPanelW] = useState(readPanel)
  const [initialViewport] = useState(readViewport)
  const [zoomClass, setZoomClass] = useState(() => zoomBand(initialViewport?.zoom ?? 0.4))
  const [showFilters, setShowFilters] = useState(false)
  const [askTidy, setAskTidy] = useState(false)
  const [hitCursor, setHitCursor] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const filtersRef = useRef<HTMLButtonElement>(null)
  const paneRef = useRef<HTMLDivElement>(null)
  const modalOpen = open.params.has('question')

  /** Open a card in the panel (or close it). Swapping cards replaces history, so Back doesn't replay every click. */
  const select = (id: string | null, after?: () => void) =>
    guarded(() => {
      if (id) open.item(id, { replace: !!selected })
      else open.close()
      after?.()
    })

  useEffect(() => {
    try {
      localStorage.setItem(PANEL_KEY, String(panelW))
    } catch {
      /* not persisted */
    }
  }, [panelW])

  const auto = useMemo(() => autoLayout(index.items), [index.items])
  const lineage = useMemo(() => (selected && index.byId.has(selected) ? lineageOf(index, selected) : null), [index, selected])
  const filtering = filtersActive(view)
  const matches = useMemo(() => new Set(index.items.filter((it) => matchesFilters(it, view, index)).map((i) => i.id)), [index, view])
  const hits = useMemo(
    () => (filtering ? Object.keys(auto).filter((id) => matches.has(id) && (view.showRetired || index.byId.get(id)?.status !== 'Retired')) : []),
    [filtering, auto, matches, view.showRetired, index],
  )
  const graph = useMemo<GraphInput>(
    () => ({ index, auto, positions, showRetired: view.showRetired, selected, lineage, filtering, matches }),
    [index, auto, positions, view.showRetired, selected, lineage, filtering, matches],
  )

  // The hit list can shrink under the cursor (filters, Retired toggle, external edits).
  useEffect(() => setHitCursor(-1), [hits])

  const descendantCounts = useMemo(() => countDescendants(index), [index])
  const computed = useMemo(() => buildNodes(graph, descendantCounts), [graph, descendantCounts])

  // React Flow owns in-flight drag positions; the store owns everything else.
  const [nodes, setNodes] = useState<CardNodeType[]>(computed)
  useEffect(() => {
    // Carry React Flow's own per-node state across rebuilds: without `measured` every card
    // hides and re-measures on each click or keystroke; a card mid-drag keeps its live position.
    // This copy of `measured` can lag React Flow's (a rebuild landing mid-measure), which once
    // stripped every card's handles for good; nodes now carry `handles`, so a lag only delays.
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

  const edges = useMemo(() => buildEdges(graph), [graph])

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

  /** Is the top left of a card on screen, clear of the toolbar? */
  const inView = useCallback(
    (id: string) => {
      const n = rf.getNode(id)
      const pane = paneRef.current
      if (!n || !pane) return true
      const { x, y, zoom } = rf.getViewport()
      const d = n.data as CardData
      const left = n.position.x * zoom + x
      const top = n.position.y * zoom + y
      return left >= 0 && top >= 64 && left + Math.min(d.w, CARD_PEEK) * zoom <= pane.clientWidth && top + d.h * zoom <= pane.clientHeight
    },
    [rf],
  )

  // "Show on board" from a sheet or another view lands here as ?focus=ID (with the item open).
  const focusId = open.params.get('focus')
  useEffect(() => {
    if (!focusId) return
    if (index.byId.has(focusId)) setTimeout(() => centreOn(focusId, 1), 60)
    open.clearFocus()
  }, [focusId]) // only when a new focus request arrives

  // The open card must be on show (graph.ts shows it even while retired cards are hidden), and
  // in view: pan to it when the panel's arrival (which narrows the board) or a panel link left it off screen.
  useEffect(() => {
    if (!selected || !index.byId.has(selected) || focusId) return
    const t = setTimeout(() => {
      if (!inView(selected)) centreOn(selected, rf.getZoom())
    }, 80)
    return () => clearTimeout(t)
  }, [selected]) // only when the selection changes, not on every catalogue event

  // Keyboard: / search, arrows walk the tree (each step opens that card), Enter moves into the panel.
  // Esc closes the panel; the panel itself handles that.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen) return
      if (e.key === 'Escape' && askTidy) {
        e.preventDefault()
        setAskTidy(false)
        return
      }
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
        select(next.id, () => centreOn(next.id))
      }
      const sibs = it.parent ? (index.children.get(it.parent) ?? []) : index.epics
      const at = sibs.findIndex((s) => s.id === it.id)
      if (e.key === 'Enter') {
        e.preventDefault()
        document.querySelector<HTMLElement>('.sheet.docked')?.focus()
      } else if (e.key === 'ArrowUp') go(it.type === 'story' && at > 0 ? sibs[at - 1] : it.parent ? index.byId.get(it.parent) : undefined)
      else if (e.key === 'ArrowDown') go(it.type === 'story' ? sibs[at + 1] : index.children.get(it.id)?.[0])
      else if (e.key === 'ArrowLeft') go(sibs[at - 1])
      else if (e.key === 'ArrowRight') go(sibs[at + 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const nextHit = (dir: 1 | -1) => {
    if (!hits.length) return
    const n = (hitCursor + dir + hits.length) % hits.length
    setHitCursor(n)
    select(hits[n]!, () => centreOn(hits[n]!))
  }

  const tidy = (ids: string[]) => setPositions(Object.fromEntries(ids.map((id) => [id, null])))
  const selectedItem = selected ? index.byId.get(selected) : undefined
  const epicOfSelected = selectedItem ? (selectedItem.type === 'epic' ? selectedItem : ancestorsOf(index, selectedItem.id)[0]) : undefined
  // Positions can outlive their card (a file renamed or removed on disk); only count cards that exist.
  const moved = Object.keys(positions).filter((id) => index.byId.has(id)).length
  const movedInEpic = epicOfSelected ? [epicOfSelected, ...descendantsOf(index, epicOfSelected.id)].filter((i) => positions[i.id]).length : 0

  return (
    <div className={`board-split${selected ? ' has-panel' : ''}`} style={{ '--panel-w': `${panelW}%` } as CSSProperties}>
      {selected && (
        <aside className="dock" aria-label="Item details">
          <ItemModal key={selected} id={selected} docked />
        </aside>
      )}
      {selected && <PanelResizer width={panelW} onChange={setPanelW} />}
      <div ref={paneRef} className={`board ${zoomClass}`}>
        <ReactFlow<CardNodeType>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          nodeDragThreshold={4}
          onNodeClick={(_, n) => n.id !== selected && select(n.id)}
          onPaneClick={() => selected && select(null)}
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
          {/* The anaesthetic chart's ruling: one faint grid (--grid), quiet enough to read cards over. */}
          <Background variant={BackgroundVariant.Lines} gap={80} color="#e3eae7" lineWidth={1} />
          {view.showMinimap && <MiniMap pannable zoomable nodeColor={(n) => TYPE_HEX[(n.data as CardData).item.type]} nodeBorderRadius={2} />}
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
            <button ref={filtersRef} className="btn" aria-pressed={showFilters || (filtering && !view.search)} aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
              <Filter size={15} /> Filters
            </button>
            {filtering && (
              <button className="btn icon ghost" onClick={view.clearFilters} aria-label="Clear search and filters" title="Clear search and filters">
                <X size={15} />
              </button>
            )}
            {showFilters && <FilterPopover anchor={filtersRef} onClose={() => setShowFilters(false)} />}
          </div>
          <span className="toolbar-spacer" />
          <div className="toolbar-group" style={{ position: 'relative' }}>
            <button className="btn ghost" aria-pressed={view.showRetired} onClick={() => view.set({ showRetired: !view.showRetired })}>
              Retired
            </button>
            <button
              className="btn ghost"
              disabled={!moved}
              aria-expanded={askTidy}
              title={moved ? `${moved} card${moved > 1 ? 's' : ''} moved from the story map` : 'Every card is in its story-map place'}
              onClick={() => setAskTidy((v) => !v)}
            >
              <LayoutGrid size={15} /> Tidy all
            </button>
            {askTidy && moved > 0 && (
              <TidyAsk
                moved={moved}
                onCancel={() => setAskTidy(false)}
                onConfirm={() => {
                  setAskTidy(false)
                  tidy(Object.keys(positions))
                }}
              />
            )}
            <button className="btn icon ghost" onClick={() => void rf.fitView({ ...FIT, duration: 400 })} aria-label="Fit the whole map" title="Fit the whole map">
              <Maximize size={15} />
            </button>
            <button className="btn icon ghost" aria-pressed={view.showMinimap} onClick={() => view.set({ showMinimap: !view.showMinimap })} aria-label="Minimap" title="Minimap">
              <MapIcon size={15} />
            </button>
          </div>
        </div>

        {/* Only worth showing when this epic has cards dragged out of the story map. */}
        {epicOfSelected && movedInEpic > 0 && (
          <div className="selection-bar" role="status">
            <span className="selection-note">
              {movedInEpic} card{movedInEpic > 1 ? 's' : ''} moved in {epicOfSelected.title}
            </span>
            <button className="btn sm" onClick={() => tidy([epicOfSelected.id, ...descendantsOf(index, epicOfSelected.id).map((d) => d.id)])} title={`Put ${epicOfSelected.title} and everything under it back in the story map`}>
              <Sparkles size={14} /> Tidy this epic
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** The divider between the item panel and the board: drag, arrow keys, or double-click to reset to a third. */
function PanelResizer({ width, onChange }: { width: number; onChange: (w: number) => void }) {
  const start = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const split = el.parentElement!.getBoundingClientRect()
    el.setPointerCapture(e.pointerId)
    el.classList.add('dragging')
    const move = (ev: PointerEvent) => onChange(clampPanel(((ev.clientX - split.left) / split.width) * 100))
    const up = () => {
      el.classList.remove('dragging')
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }
  return (
    <div
      className="dock-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the item panel"
      aria-valuenow={Math.round(width)}
      aria-valuemin={PANEL_MIN}
      aria-valuemax={PANEL_MAX}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={start}
      onDoubleClick={() => onChange(PANEL_DEFAULT)}
      onKeyDown={(e) => {
        const step = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0
        if (!step) return
        e.preventDefault()
        onChange(clampPanel(width + step))
      }}
    />
  )
}

/** The board asks in its own frame too: a popover under the button, not a browser dialog. */
function TidyAsk({ moved, onConfirm, onCancel }: { moved: number; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <div className="popover ask" role="dialog" aria-label="Tidy all moved cards">
      <p>
        Put {moved === 1 ? 'the moved card' : `all ${moved} moved cards`} back in the story map? Where you put them is not kept.
      </p>
      <div className="ask-actions">
        <button ref={ref} className="btn primary" onClick={onConfirm}>
          <LayoutGrid size={15} /> Tidy all
        </button>
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function FilterPopover({ anchor, onClose }: { anchor: RefObject<HTMLButtonElement | null>; onClose: () => void }) {
  const view = useView()
  const ref = useDismiss<HTMLDivElement>(onClose, anchor)
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  return (
    <div ref={ref} className="popover" role="dialog" aria-label="Filters">
      <h4>Status</h4>
      <div className="chip-row">
        {ITEM_STATUSES.map((s) => (
          <button key={s} className="status-toggle" aria-pressed={view.statuses.includes(s)} onClick={() => view.set({ statuses: toggle(view.statuses, s) })}>
            <StatusLabel status={s} />
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

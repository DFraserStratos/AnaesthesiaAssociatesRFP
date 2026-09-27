import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  useStore,
  type NodeChange,
  type Viewport,
} from '@xyflow/react'
import { Filter, LayoutGrid, Map as MapIcon, Maximize, Redo2, Search, Sparkles, Undo2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { applyMove, planMove, type Move } from '../../shared/move.ts'
import { COMPONENTS, ITEM_STATUSES, ITEM_TYPES, TYPE_LABEL, firstLaneName, type Item } from '../../shared/types.ts'
import { autoLayout, CARD, COL_GAP, EPIC_GAP, STACK_GAP } from '../board/autoLayout.ts'
import type { CardData, CardNodeType } from '../board/cardData.ts'
import { CardNode } from '../board/CardNode.tsx'
import { buildEdges, buildNodes, countDescendants, isShown, type GraphInput } from '../board/graph.ts'
import { LaneHeaders } from '../board/LaneHeaders.tsx'
import { RiseEdge } from '../board/RiseEdge.tsx'
import { wheelGestures } from '../board/trackpad.ts'
import { AddNode, LaneNode, MarkerNode, type AddNodeType, type LaneNodeType, type MarkerNodeType } from '../board/LaneNode.tsx'
import { dropTarget, LANE_MARGIN, laneKey, mappedLayout, type MappedLayout } from '../board/mappedLayout.ts'
import { Glyph, StatusLabel } from '../components/bits.tsx'
import { ItemModal } from '../components/ItemModal.tsx'
import { guarded, useOpen } from '../nav.ts'
import { ancestorsOf, descendantsOf, filtersActive, matchesFilters, shownIndex, useCatalogue, useIndex, useView, type BoardMode, type Index } from '../store.ts'
import { useDismiss } from '../useDismiss.ts'

const nodeTypes = { card: CardNode, lane: LaneNode, add: AddNode, marker: MarkerNode }
const edgeTypes = { rise: RiseEdge }
type BoardNode = CardNodeType | LaneNodeType | AddNodeType | MarkerNodeType
/** Each mode keeps its own view of the map: their geometry differs. */
const VIEWPORT_KEY: Record<BoardMode, string> = { freeform: 'requirements-board:viewport', mapped: 'requirements-board:viewport:mapped' }
const NO_POSITIONS = {}
const MIN_ZOOM = 0.08
const MAX_ZOOM = 1.8
/** How long cards keep easing into place after a Mapped drop. */
const SETTLE_MS = 240
/** The item panel's share of the width, in percent: a third by default, the board keeps two thirds. */
const PANEL_KEY = 'requirements-board:panel-width'
const PANEL_DEFAULT = 100 / 3
const PANEL_MIN = 25
const PANEL_MAX = 70
/** The panel never gets narrower than this (styles.css `.dock` min-width). */
const DOCK_MIN = 380
const clampPanel = (w: number) => Math.min(PANEL_MAX, Math.max(PANEL_MIN, w))
/** Clear the floating toolbar and legend when fitting the whole map. */
const FIT = { padding: { top: '84px', bottom: '64px', left: '24px', right: '24px' }, maxZoom: 0.6 } as const
/** Minimap blocks by type. The minimap paints SVG fills, not CSS, so these mirror the --ty-* tokens in styles.css. */
const TYPE_HEX = { epic: '#e06c00', feature: '#773b93', story: '#009ccc' } as const
/** The platform's undo modifier, for button titles. */
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'
/** How much of a wide card (an epic) must be on screen to count as in view. */
const CARD_PEEK = 240

function readViewport(mode: BoardMode): Viewport | undefined {
  try {
    const raw = localStorage.getItem(VIEWPORT_KEY[mode])
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
  // A fresh canvas per mode, so each opens on its own saved viewport.
  const mode = useView((v) => v.boardMode)
  return (
    <ReactFlowProvider key={mode}>
      <Board mode={mode} />
    </ReactFlowProvider>
  )
}

/** A Mapped drag in progress: the card, everything under it (which moves with it), and the map without them to hit-test against. */
interface MappedDrag {
  item: Item
  subtree: Set<string>
  rest: MappedLayout
  start: Map<string, { x: number; y: number }>
  origin: { x: number; y: number }
  target: Move | null
}

const sameTarget = (a: Move | null, b: Move | null) => (a && b ? a.parent === b.parent && a.index === b.index && a.swimlane === b.swimlane : a === b)

function lineageOf(index: Index, id: string): Set<string> {
  return new Set([id, ...ancestorsOf(index, id).map((i) => i.id), ...descendantsOf(index, id).map((i) => i.id)])
}

function Board({ mode }: { mode: BoardMode }) {
  const index = useIndex()
  const positions = useCatalogue((s) => s.layout.positions)
  const lanes = useCatalogue((s) => s.layout.lanes)
  const firstLane = useCatalogue((s) => firstLaneName(s.layout))
  const setPositions = useCatalogue((s) => s.setPositions)
  const moveItems = useCatalogue((s) => s.moveItems)
  const undoNext = useCatalogue((s) => s.past.at(-1))
  const redoNext = useCatalogue((s) => s.future.at(-1))
  const stepping = useCatalogue((s) => s.stepping)
  const view = useView()
  const open = useOpen()
  const rf = useReactFlow<BoardNode>()
  const mapped = mode === 'mapped'
  // The open card is the URL's `?item=`: clicking a card opens it in the side panel and lights its lineage.
  const selected = open.params.get('item')
  const [panelW, setPanelW] = useState(readPanel)
  const [initialViewport] = useState(() => readViewport(mode))
  const [zoomClass, setZoomClass] = useState(() => zoomBand(initialViewport?.zoom ?? 0.4))
  const [showFilters, setShowFilters] = useState(false)
  const [askTidy, setAskTidy] = useState(false)
  const [hitCursor, setHitCursor] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const filtersRef = useRef<HTMLButtonElement>(null)
  const paneRef = useRef<HTMLDivElement>(null)
  const modalOpen = open.params.has('question')
  // The panel floats over the left of the board rather than narrowing it, so opening or closing a
  // card never moves the map. What the board keeps clear of it is this many pixels from its left edge.
  const paneW = useStore((s) => s.width)
  const openDockPx = Math.min(paneW, Math.max(DOCK_MIN, (paneW * panelW) / 100))
  const dockPx = selected ? openDockPx : 0
  const dockRef = useRef(openDockPx)
  dockRef.current = openDockPx

  /** Open a card in the panel (or close it). Swapping cards replaces history, so Back doesn't replay every click. */
  const select = (id: string | null, after?: () => void) =>
    guarded(() => {
      if (id) open.item(id, { replace: !!selected })
      else open.close()
      after?.()
    })

  // Two fingers on a trackpad pan the board; pinching (or a mouse wheel) zooms it, never the page.
  useEffect(() => {
    const pane = paneRef.current
    if (!pane) return
    return wheelGestures(pane, {
      pan: (dx, dy) => {
        const vp = rf.getViewport()
        void rf.setViewport({ x: vp.x - dx, y: vp.y - dy, zoom: vp.zoom })
      },
      // Zoom about the pointer, within the canvas's own limits.
      zoom: (factor, cx, cy) => {
        const r = pane.getBoundingClientRect()
        const px = cx - r.left
        const py = cy - r.top
        const vp = rf.getViewport()
        const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, vp.zoom * factor))
        const s = zoom / vp.zoom
        void rf.setViewport({ x: px - (px - vp.x) * s, y: py - (py - vp.y) * s, zoom })
      },
    })
  }, [rf])

  useEffect(() => {
    try {
      localStorage.setItem(PANEL_KEY, String(panelW))
    } catch {
      /* not persisted */
    }
  }, [panelW])

  // Mapped: the drop slot under the pointer while dragging, previewed live so the other cards make room.
  const [target, setTarget] = useState<Move | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [resetTick, setResetTick] = useState(0)
  const dragRef = useRef<MappedDrag | null>(null)
  const collapsedLanes = useMemo(() => new Set(view.collapsedLanes), [view.collapsedLanes])
  const visible = useCallback((it: Item) => isShown(it, { index, showRetired: view.showRetired, selected }), [index, view.showRetired, selected])
  // The index as shown: retired cards (unless the toggle is on) are out of every count and every arrow-key step.
  const shown = useMemo(() => shownIndex(index, view.showRetired, selected), [index, view.showRetired, selected])
  const laneOpts = useMemo(() => ({ lanes, firstLane, collapsed: collapsedLanes, visible }), [lanes, firstLane, collapsedLanes, visible])
  const previewItems = useMemo(() => (target ? applyMove(index.items, target) : index.items), [index.items, target])
  const map = useMemo(() => (mapped ? mappedLayout(previewItems, laneOpts) : null), [mapped, previewItems, laneOpts])
  const freeform = useMemo(() => (mapped ? null : autoLayout(index.items)), [mapped, index.items])
  const auto = map?.placements ?? freeform!
  const lineage = useMemo(() => (selected && index.byId.has(selected) ? lineageOf(index, selected) : null), [index, selected])
  const filtering = filtersActive(view)
  const matches = useMemo(() => new Set(index.items.filter((it) => matchesFilters(it, view, index)).map((i) => i.id)), [index, view])
  const hits = useMemo(
    () => (filtering ? Object.keys(auto).filter((id) => matches.has(id) && !map?.collapsed.has(id) && visible(index.byId.get(id)!)) : []),
    [filtering, auto, map, matches, visible, index],
  )
  const graph = useMemo<GraphInput>(
    () => ({ index, auto, positions: mapped ? NO_POSITIONS : positions, collapsed: map?.collapsed, showRetired: view.showRetired, selected, lineage, filtering, matches }),
    [index, auto, mapped, positions, map, view.showRetired, selected, lineage, filtering, matches],
  )

  // The hit list can shrink under the cursor (filters, Retired toggle, external edits).
  useEffect(() => setHitCursor(-1), [hits])

  const descendantCounts = useMemo(() => countDescendants(shownIndex(index, view.showRetired)), [index, view.showRetired])
  const computed = useMemo<BoardNode[]>(() => {
    const cards: BoardNode[] = buildNodes(graph, descendantCounts)
    return map ? [...cards, ...mappedExtras(map, index, lanes.length > 0, target)] : cards
  }, [graph, descendantCounts, map, index, lanes.length, target, resetTick])

  // React Flow owns in-flight drag positions; the store owns everything else.
  const [nodes, setNodes] = useState<BoardNode[]>(computed)
  useEffect(() => {
    // Carry React Flow's own per-node state across rebuilds: without `measured` every card
    // hides and re-measures on each click or keystroke; a card mid-drag keeps its live position.
    // This copy of `measured` can lag React Flow's (a rebuild landing mid-measure), which once
    // stripped every card's handles for good; nodes now carry `handles`, so a lag only delays.
    // In Mapped, a dragged card carries everything under it, so that whole subtree holds its live position.
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]))
      const drag = dragRef.current
      return computed.map((n) => {
        const p = byId.get(n.id)
        if (!p) return n
        const held = drag ? drag.subtree.has(n.id) : !mapped && !!p.dragging
        return { ...n, measured: p.measured, selected: p.selected, dragging: p.dragging, position: held ? p.position : n.position, className: drag?.subtree.has(n.id) ? 'in-drag' : n.className } as BoardNode
      })
    })
  }, [computed])
  const onNodesChange = useCallback((changes: NodeChange<BoardNode>[]) => setNodes((ns) => applyNodeChanges(changes, ns)), [])

  const onNodeDragStart = (_: unknown, node: BoardNode) => {
    if (!mapped || node.type !== 'card') return
    const it = index.byId.get(node.id)
    if (!it) return
    const subtree = new Set([it.id, ...descendantsOf(index, it.id).map((d) => d.id)])
    dragRef.current = {
      item: it,
      subtree,
      rest: mappedLayout(
        index.items.filter((i) => !subtree.has(i.id)),
        laneOpts,
      ),
      start: new Map(nodes.filter((n) => subtree.has(n.id)).map((n) => [n.id, n.position])),
      origin: node.position,
      target: null,
    }
    setPreviewing(true)
  }
  const onNodeDrag = (e: MouseEvent | TouchEvent, node: BoardNode) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = node.position.x - drag.origin.x
    const dy = node.position.y - drag.origin.y
    setNodes((ns) =>
      ns.map((n) => {
        const s = n.id !== node.id ? drag.start.get(n.id) : undefined
        return s ? ({ ...n, position: { x: s.x + dx, y: s.y + dy }, className: 'in-drag' } as BoardNode) : n
      }),
    )
    const at = 'touches' in e ? e.touches[0] : e
    if (!at) return
    const t = dropTarget(drag.rest, rf.screenToFlowPosition({ x: at.clientX, y: at.clientY }), drag.item)
    if (!sameTarget(t, drag.target)) {
      drag.target = t
      setTarget(t)
    }
  }
  const onNodeDragStop = (_: unknown, _node: BoardNode, dragged: BoardNode[]) => {
    if (!mapped) {
      const one = dragged.length === 1 ? index.byId.get(dragged[0]!.id) : undefined
      setPositions(Object.fromEntries(dragged.map((d) => [d.id, d.position])), { label: one ? `Move ${one.title}` : `Move ${dragged.length} cards` })
      return
    }
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    // Anywhere invalid (a feature over a lane, a story over the backbone) snaps back.
    const changes = drag.target ? planMove(index.items, drag.target) : []
    if (changes.length) void moveItems(changes, { label: `Move ${drag.item.title}` })
    setTarget(null)
    setResetTick((n) => n + 1)
    setTimeout(() => setPreviewing(false), SETTLE_MS)
  }
  /** Undo or redo a card move; in Mapped the map eases back into place, as after a drop. */
  const step = (dir: 'undo' | 'redo') => {
    const s = useCatalogue.getState()
    if (dragRef.current || nodes.some((n) => n.dragging) || !(dir === 'undo' ? s.past : s.future).length) return
    if (mapped) {
      setPreviewing(true)
      setTimeout(() => setPreviewing(false), SETTLE_MS)
    }
    void (dir === 'undo' ? s.undo() : s.redo())
  }
  const toggleLane = (key: string) => view.set({ collapsedLanes: collapsedLanes.has(key) ? view.collapsedLanes.filter((k) => k !== key) : [...view.collapsedLanes, key] })

  // Mapped draws no connectors except the open card's lineage, and none mid-drag (the map is reflowing).
  const edges = useMemo(() => (!mapped ? buildEdges(graph) : lineage && !previewing ? buildEdges(graph, { mapped: true }) : []), [mapped, graph, lineage, previewing])

  const centreOn = useCallback(
    (id: string, zoom?: number) => {
      const n = rf.getNode(id)
      if (!n) return
      const w = (n.data as CardData).w
      const h = (n.data as CardData).h
      const z = zoom ?? Math.max(rf.getZoom(), 0.9)
      // Centre it in the part of the board the panel leaves visible (a card is always open when this runs).
      void rf.setCenter(n.position.x + w / 2 - dockRef.current / 2 / z, n.position.y + h / 2, { zoom: z, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450 })
    },
    [rf],
  )

  /** Is the top left of a card on screen, clear of the toolbar and the panel? */
  const inView = useCallback(
    (id: string) => {
      const n = rf.getNode(id)
      const pane = paneRef.current
      if (!n || !pane) return true
      const { x, y, zoom } = rf.getViewport()
      const d = n.data as CardData
      const left = n.position.x * zoom + x
      const top = n.position.y * zoom + y
      return left >= dockRef.current && top >= 64 && left + Math.min(d.w, CARD_PEEK) * zoom <= pane.clientWidth && top + d.h * zoom <= pane.clientHeight
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
  // in view: pan to it when the panel opened over it or a panel link left it off screen.
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
      // Undo / redo card moves, unless a field or the item panel has focus (they keep their own undo).
      const key = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (key === 'z' || (key === 'y' && e.ctrlKey && !e.shiftKey))) {
        if (typing || target?.isContentEditable || target?.closest('.sheet')) return
        e.preventDefault()
        step(key === 'z' && !e.shiftKey ? 'undo' : 'redo')
        return
      }
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
      const sibs = it.parent ? (shown.children.get(it.parent) ?? []) : shown.epics
      const at = sibs.findIndex((s) => s.id === it.id)
      if (e.key === 'Enter') {
        e.preventDefault()
        document.querySelector<HTMLElement>('.sheet.docked')?.focus()
      } else if (e.key === 'ArrowUp') go(it.type === 'story' && at > 0 ? sibs[at - 1] : it.parent ? index.byId.get(it.parent) : undefined)
      else if (e.key === 'ArrowDown') go(it.type === 'story' ? sibs[at + 1] : shown.children.get(it.id)?.[0])
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

  const tidy = (ids: string[], label: string) => setPositions(Object.fromEntries(ids.map((id) => [id, null])), { label })
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
      <div ref={paneRef} className={`board ${zoomClass}${mapped ? ' mapped' : ''}${previewing ? ' previewing' : ''}${target ? ' has-target' : ''}`}>
        <ReactFlow<BoardNode>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          nodeDragThreshold={4}
          // Mapped moves one card (and what hangs under it) at a time, so no multi-select there.
          selectionKeyCode={mapped ? null : undefined}
          multiSelectionKeyCode={mapped ? null : undefined}
          onNodeClick={(_, n) => n.type === 'card' && n.id !== selected && select(n.id)}
          onPaneClick={() => selected && select(null)}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onMove={(_, vp) => setZoomClass((z) => (zoomBand(vp.zoom) === z ? z : zoomBand(vp.zoom)))}
          onMoveEnd={(_, vp) => {
            try {
              localStorage.setItem(VIEWPORT_KEY[mode], JSON.stringify(vp))
            } catch {
              /* not persisted */
            }
          }}
          defaultViewport={initialViewport}
          fitView={!initialViewport}
          fitViewOptions={FIT}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          zoomOnDoubleClick={false}
          deleteKeyCode={null}
          disableKeyboardA11y
          nodesConnectable={false}
          edgesFocusable={false}
          onlyRenderVisibleElements
          proOptions={{ hideAttribution: true }}
        >
          {/* The anaesthetic chart's ruling: one faint grid (--grid), quiet enough to read cards over. Mapped has no ruling. */}
          {!mapped && <Background variant={BackgroundVariant.Lines} gap={80} color="#e3eae7" lineWidth={1} />}
          {view.showMinimap && <MiniMap pannable zoomable nodeColor={(n) => (n.type === 'card' ? TYPE_HEX[(n.data as CardData).item.type] : 'transparent')} nodeBorderRadius={2} />}
          {map && <LaneHeaders bands={map.lanes} collapsed={collapsedLanes} onToggle={toggleLane} inset={dockPx} />}
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
            <div className="mode-switch" role="radiogroup" aria-label="Board mode">
              {(['freeform', 'mapped'] as const).map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={mode === m}
                  title={m === 'freeform' ? 'Freeform: place cards anywhere' : 'Mapped: a story map with lanes; dragging reorders the catalogue'}
                  onClick={() => mode !== m && guarded(() => view.set({ boardMode: m }))}
                >
                  {m === 'freeform' ? 'Freeform' : 'Mapped'}
                </button>
              ))}
            </div>
            <button className="btn ghost" aria-pressed={view.showRetired} onClick={() => view.set({ showRetired: !view.showRetired })}>
              Retired
            </button>
            {!mapped && (
            <button
              className="btn ghost"
              disabled={!moved}
              aria-expanded={askTidy}
              title={moved ? `${moved} card${moved > 1 ? 's' : ''} moved from the story map` : 'Every card is in its story-map place'}
              onClick={() => setAskTidy((v) => !v)}
            >
              <LayoutGrid size={15} /> Tidy all
            </button>
            )}
            {!mapped && askTidy && moved > 0 && (
              <TidyAsk
                moved={moved}
                onCancel={() => setAskTidy(false)}
                onConfirm={() => {
                  setAskTidy(false)
                  tidy(Object.keys(positions), 'Tidy all')
                }}
              />
            )}
            <button
              className="btn icon ghost"
              disabled={!undoNext || stepping}
              onClick={() => step('undo')}
              aria-label={undoNext ? `Undo ${undoNext.label}` : 'Undo'}
              title={undoNext ? `Undo ${undoNext.label} (${MOD}Z)` : 'Nothing to undo'}
            >
              <Undo2 size={15} />
            </button>
            <button
              className="btn icon ghost"
              disabled={!redoNext || stepping}
              onClick={() => step('redo')}
              aria-label={redoNext ? `Redo ${redoNext.label}` : 'Redo'}
              title={redoNext ? `Redo ${redoNext.label} (${MOD}${MOD === '⌘' ? '⇧Z' : 'Y'})` : 'Nothing to redo'}
            >
              <Redo2 size={15} />
            </button>
            <button className="btn icon ghost" onClick={() => void rf.fitView({ ...FIT, padding: { ...FIT.padding, left: `${dockPx + 24}px` }, duration: 400 })} aria-label="Fit the whole map" title="Fit the whole map">
              <Maximize size={15} />
            </button>
            <button className="btn icon ghost" aria-pressed={view.showMinimap} onClick={() => view.set({ showMinimap: !view.showMinimap })} aria-label="Minimap" title="Minimap">
              <MapIcon size={15} />
            </button>
          </div>
        </div>

        {/* Only worth showing when this epic has cards dragged out of the story map. */}
        {!mapped && epicOfSelected && movedInEpic > 0 && (
          <div className="selection-bar" role="status">
            <span className="selection-note">
              {movedInEpic} card{movedInEpic > 1 ? 's' : ''} moved in {epicOfSelected.title}
            </span>
            <button className="btn sm" onClick={() => tidy([epicOfSelected.id, ...descendantsOf(index, epicOfSelected.id).map((d) => d.id)], `Tidy ${epicOfSelected.title}`)} title={`Put ${epicOfSelected.title} and everything under it back in the story map`}>
              <Sparkles size={14} /> Tidy this epic
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Mapped's non-card nodes: each lane's rule, the add button at the foot of every column in every lane, and the drop marker. */
function mappedExtras(map: MappedLayout, index: Index, named: boolean, target: Move | null): BoardNode[] {
  const out: BoardNode[] = []
  const fixed = { draggable: false, selectable: false, focusable: false } as const
  const w = map.width + 2 * LANE_MARGIN
  for (const lane of map.lanes) {
    if (!lane.head) continue // the only lane, unnamed: no rule, a plain map
    out.push({ id: `lane:${laneKey(lane.key)}`, type: 'lane', position: { x: -LANE_MARGIN, y: lane.y }, width: w, height: lane.h, data: { w, h: lane.h }, zIndex: -1, ...fixed })
  }
  for (const a of map.adds) {
    const where = index.byId.get(a.parent)?.title ?? a.parent
    const label = `Add a story to ${where}${named ? ` in ${a.swimlane ?? map.lanes[0]!.name}` : ''}`
    out.push({ id: `add:${a.parent}|${laneKey(a.swimlane)}`, type: 'add', position: { x: a.x, y: a.y }, data: { w: CARD.story.w, parent: a.parent, swimlane: a.swimlane, label }, zIndex: 1, ...fixed })
  }
  const slot = target && map.placements[target.id]
  const moving = target && index.byId.get(target.id)
  if (slot && moving) {
    const bar = 3
    const box =
      moving.type === 'story'
        ? { x: slot.x, y: slot.y - STACK_GAP / 2 - bar / 2, w: slot.w, h: bar }
        : { x: slot.x - (moving.type === 'epic' ? EPIC_GAP : COL_GAP) / 2 - bar / 2, y: slot.y, w: bar, h: slot.h }
    out.push({ id: 'drop-marker', type: 'marker', position: { x: box.x, y: box.y }, data: { w: box.w, h: box.h }, zIndex: 5, ...fixed })
  }
  return out
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
        Put {moved === 1 ? 'the moved card' : `all ${moved} moved cards`} back in the story map? Undo puts them back where they were.
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
        {/* Retired is offered only while retired cards are on show (or still picked, so it can be cleared). */}
        {ITEM_STATUSES.filter((s) => s !== 'Retired' || view.showRetired || view.statuses.includes(s)).map((s) => (
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

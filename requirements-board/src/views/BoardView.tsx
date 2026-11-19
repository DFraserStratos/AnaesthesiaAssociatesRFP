import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  useStore,
  useStoreApi,
  type NodeChange,
  type Viewport,
} from '@xyflow/react'
import { Filter, LayoutGrid, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { applyMove, planMove, type Move } from '../../shared/move.ts'
import { isRetiredStatus, retiredTest } from '../../shared/statuses.ts'
import { ITEM_TYPES, TYPE_LABEL, firstLaneName, type Item } from '../../shared/types.ts'
import { BoardMinimap } from '../board/BoardMinimap.tsx'
import { BoardSearch } from '../board/BoardSearch.tsx'
import { autoLayout, CARD, COL_GAP, EPIC_GAP, STACK_GAP } from '../board/autoLayout.ts'
import { cardInView, centreViewport, type Box } from '../board/camera.ts'
import type { CardNodeType } from '../board/cardData.ts'
import { CardNode } from '../board/CardNode.tsx'
import { buildEdges, buildNodes, countDescendants, isShown, type GraphInput } from '../board/graph.ts'
import { LaneHeaders } from '../board/LaneHeaders.tsx'
import { RiseEdge } from '../board/RiseEdge.tsx'
import { wheelGestures } from '../board/trackpad.ts'
import { AddNode, LaneNode, MarkerNode, type AddNodeType, type LaneNodeType, type MarkerNodeType } from '../board/LaneNode.tsx'
import { dragHold, dragLayout, dropTarget, LANE_HEAD, LANE_MARGIN, laneKey, mappedLayout, type MappedLayout, type MappedOptions } from '../board/mappedLayout.ts'
import { boundsOf, clampViewport, panExtent, type Bounds } from '../board/panLimits.ts'
import { walkStep, type WalkKey } from '../board/walk.ts'
import { Glyph, StatusLabel } from '../components/bits.tsx'
import { PanelResizer, readPanel, writePanel } from '../components/PanelResizer.tsx'
import { ItemModal } from '../components/ItemModal.tsx'
import { RegionBoundary } from '../components/RegionBoundary.tsx'
import { rankMatches } from '../itemSearch.ts'
import { guarded, useOpen } from '../nav.ts'
import { ancestorsOf, descendantsOf, filtersActive, matchesFilters, shownIndex, useCatalogue, useComponents, useConfig, useIndex, useView, type BoardMode, type Index } from '../store.ts'
import { isFiniteNumber, isRecord, readJson, writeJson } from '../storage.ts'
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
/** The panel never gets narrower than this (styles.css `.dock` min-width). */
const DOCK_MIN = 380
/** Clear the floating toolbar and legend when fitting the whole map. */
const FIT = { padding: { top: '84px', bottom: '64px', left: '24px', right: '24px' }, maxZoom: 0.6 } as const
/** The zoom an arrow-key step or an opened search hit lands at, or closer if the board is already closer in. */
const WALK_ZOOM = 0.9
/** What, inside the canvas, does its own job with Enter and the arrow keys: the board never walks from it (FINDINGS R-115). */
const CONTROLS = 'button, a[href], input, select, textarea, [contenteditable="true"], [role="menu"], [role="menuitem"], [role="toolbar"], [role="dialog"]'

/** A saved viewport, or none (the board fits the map) when it is not finite x, y and a positive zoom. */
export function readViewport(mode: BoardMode): Viewport | undefined {
  return readJson<Viewport | undefined>(VIEWPORT_KEY[mode], 'board position', undefined, (raw, bad) => {
    if (isRecord(raw) && isFiniteNumber(raw.x) && isFiniteNumber(raw.y) && isFiniteNumber(raw.zoom) && raw.zoom > 0) return { x: raw.x, y: raw.y, zoom: raw.zoom }
    bad()
    return undefined
  })
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
  const retired = useMemo(() => retiredTest(index.config), [index.config])
  const positions = useCatalogue((s) => s.layout.positions)
  const lanes = useCatalogue((s) => s.layout.lanes)
  const firstLane = useCatalogue((s) => firstLaneName(s.layout))
  const setPositions = useCatalogue((s) => s.setPositions)
  const moveItems = useCatalogue((s) => s.moveItems)
  const view = useView()
  const open = useOpen()
  /** What a Mapped drag holds still while it lasts (`dragHold`), in the hit-test map and the drawn preview alike. */
  const [hold, setHold] = useState<Pick<MappedOptions, 'keepDirect' | 'laneFloors'> | null>(null)
  const rf = useReactFlow<BoardNode>()
  const mapped = mode === 'mapped'
  // The open card is the URL's `?item=`: clicking a card opens it in the side panel and lights its lineage.
  const selected = open.params.get('item')
  const [panelW, setPanelW] = useState(() => readPanel(PANEL_KEY))
  const [initialViewport] = useState(() => readViewport(mode))
  const [zoomClass, setZoomClass] = useState(() => zoomBand(initialViewport?.zoom ?? 0.4))
  const [showFilters, setShowFilters] = useState(false)
  const [askTidy, setAskTidy] = useState(false)
  const [hitCursor, setHitCursor] = useState(-1)
  // The card the search list is pointing at: found on the board and ringed, not opened.
  const [peek, setPeek] = useState<string | null>(null)
  // Where the board was before the search list started moving it, so Esc can go back.
  const peekFrom = useRef<Viewport | null>(null)
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
  const store = useStoreApi<BoardNode>()
  // What the board's own moves (trackpad pan, centring, search) are held to; drags and wheel zoom get the same via React Flow's extent (PanLimits).
  const limitsRef = useRef<{ bounds: Bounds | null; dock: number }>({ bounds: null, dock: 0 })
  // `dock` overrides what is covered on the left: centring for a panel that is only now opening, or clear of the search list.
  const limit = useCallback(
    (vp: Viewport, dock = limitsRef.current.dock) => {
      const { width, height } = store.getState()
      return clampViewport(vp, limitsRef.current.bounds, { w: width, h: height, dock })
    },
    [store],
  )

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
        void rf.setViewport(limit({ x: vp.x - dx, y: vp.y - dy, zoom: vp.zoom }))
      },
      // Zoom about the pointer, within the canvas's own limits.
      zoom: (factor, cx, cy) => {
        const r = pane.getBoundingClientRect()
        const px = cx - r.left
        const py = cy - r.top
        const vp = rf.getViewport()
        const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, vp.zoom * factor))
        const s = zoom / vp.zoom
        void rf.setViewport(limit({ x: px - (px - vp.x) * s, y: py - (py - vp.y) * s, zoom }))
      },
    })
  }, [rf, limit])

  useEffect(() => writePanel(PANEL_KEY, panelW), [panelW])

  // Mapped: the drop slot under the pointer while dragging, previewed live so the other cards make room.
  const [target, setTarget] = useState<Move | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [resetTick, setResetTick] = useState(0)
  const dragRef = useRef<MappedDrag | null>(null)
  const collapsedLanes = useMemo(() => new Set(view.collapsedLanes), [view.collapsedLanes])
  const visible = useCallback((it: Item) => isShown(it, { index, showRetired: view.showRetired, selected }), [index, view.showRetired, selected])
  // The open card is drawn even in a collapsed lane, alone in its strip (B11-Q1).
  const baseLaneOpts = useMemo<MappedOptions>(() => ({ lanes, firstLane, collapsed: collapsedLanes, visible, retired, open: selected }), [lanes, firstLane, collapsedLanes, visible, retired, selected])
  const laneOpts = useMemo<MappedOptions>(() => (hold ? { ...baseLaneOpts, ...hold } : baseLaneOpts), [baseLaneOpts, hold])
  const previewItems = useMemo(() => (target ? applyMove(index.items, target, retired) : index.items), [index.items, target, retired])
  const map = useMemo(() => (mapped ? mappedLayout(previewItems, laneOpts) : null), [mapped, previewItems, laneOpts])
  const freeform = useMemo(() => (mapped ? null : autoLayout(index.items, retired)), [mapped, index.items, retired])
  const auto = map?.placements ?? freeform!
  const lineage = useMemo(() => (selected && index.byId.has(selected) ? lineageOf(index, selected) : null), [index, selected])
  const filtering = filtersActive(view)
  const matches = useMemo(() => new Set(index.items.filter((it) => matchesFilters(it, view, index)).map((i) => i.id)), [index, view])
  const hits = useMemo(
    () =>
      filtering
        ? rankMatches(
            index,
            Object.keys(auto).flatMap((id) => (matches.has(id) && !map?.collapsed.has(id) && visible(index.byId.get(id)!) ? [index.byId.get(id)!] : [])),
            view.search,
          )
        : [],
    [filtering, auto, map, matches, visible, index, view.search],
  )
  const graph = useMemo<GraphInput>(
    () => ({ index, auto, positions: mapped ? NO_POSITIONS : positions, collapsed: map?.collapsed, showRetired: view.showRetired, selected, lineage, filtering, matches }),
    [index, auto, mapped, positions, map, view.showRetired, selected, lineage, filtering, matches],
  )

  const descendantCounts = useMemo(() => countDescendants(shownIndex(index, view.showRetired)), [index, view.showRetired])
  // The last build's card nodes: a card nothing it draws has changed keeps its node (FINDINGS R-159).
  const lastCards = useRef<ReadonlyMap<string, CardNodeType>>(new Map())
  const computed = useMemo<BoardNode[]>(() => {
    const built = buildNodes(graph, descendantCounts, lastCards.current)
    lastCards.current = new Map(built.map((n) => [n.id, n]))
    const cards: BoardNode[] = built.map((n) => (n.id === peek ? { ...n, className: 'peek' } : n))
    return map ? [...cards, ...mappedExtras(map, index, lanes.length > 0, target)] : cards
  }, [graph, descendantCounts, map, index, lanes.length, target, resetTick, peek])

  // React Flow owns in-flight drag positions; the store owns everything else.
  const [nodes, setNodes] = useState<BoardNode[]>(computed)
  const lastComputed = useRef<ReadonlySet<BoardNode>>(new Set())
  useEffect(() => {
    const unchanged = lastComputed.current
    lastComputed.current = new Set(computed)
    // Carry React Flow's own per-node state across rebuilds: without `measured` every card
    // hides and re-measures on each click or keystroke; a card mid-drag keeps its live position.
    // This copy of `measured` can lag React Flow's (a rebuild landing mid-measure), which once
    // stripped every card's handles for good; nodes now carry `handles`, so a lag only delays.
    // In Mapped, a dragged card carries everything under it, so that whole subtree holds its live position.
    // A card whose built node is the one built last time, sitting where it was built, keeps the node
    // React Flow already holds, so it does not render again.
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]))
      const drag = dragRef.current
      return computed.map((n) => {
        const p = byId.get(n.id)
        if (!p) return n
        if (!drag && !p.dragging && unchanged.has(n) && p.position.x === n.position.x && p.position.y === n.position.y && p.className === n.className) return p
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
    // Worked out from the map as drawn without any earlier hold, so a drag that never saw its stop cannot compound.
    const held = dragHold(index.items, it, baseLaneOpts)
    setHold(held)
    dragRef.current = {
      item: it,
      subtree,
      rest: dragLayout(index.items, it, subtree, baseLaneOpts, held),
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
    // The lane under the pointer is read from the map as drawn now (`map`, the preview), its slot from `rest`.
    const t = dropTarget(drag.rest, rf.screenToFlowPosition({ x: at.clientX, y: at.clientY }), drag.item, map ?? undefined)
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
    const changes = drag.target ? planMove(index.items, drag.target, retired) : []
    if (changes.length) void moveItems(changes, { label: `Move ${drag.item.title}` })
    setTarget(null)
    setHold(null)
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

  // The map's extent, which the board never pans far past: Mapped's whole strip (lane rules and the add-lane row included), Freeform's cards.
  const bounds = useMemo<Bounds | null>(
    () =>
      map
        ? { x: -LANE_MARGIN, y: 0, w: map.width + 2 * LANE_MARGIN, h: map.height + LANE_HEAD }
        : boundsOf(nodes.flatMap((n) => (n.type === 'card' && !n.hidden ? [{ x: n.position.x, y: n.position.y, w: n.data.w, h: n.data.h }] : []))),
    [map, nodes],
  )
  limitsRef.current = { bounds, dock: dockPx }

  // Mapped draws no connectors except the open card's lineage, and none mid-drag (the map is reflowing).
  const edges = useMemo(() => (!mapped ? buildEdges(graph) : lineage && !previewing ? buildEdges(graph, { mapped: true }) : []), [mapped, graph, lineage, previewing])

  // Where each card is drawn, from the board's own layout of this render: a centring made in the same commit
  // as a selection sees the layout that selection draws (a collapsed lane's strip, a retired parent's column),
  // which React Flow's node store only catches up with later.
  const placeRef = useRef<(id: string) => Box | undefined>(() => undefined)
  placeRef.current = (id) => {
    const a = auto[id]
    const p = mapped ? undefined : positions[id]
    return a && p ? { ...a, x: p.x, y: p.y } : a
  }

  /** Bring a card into view right of `clearLeft` (the open panel by default) at `zoom` (default: at least WALK_ZOOM). */
  const centreOn = useCallback(
    (id: string, zoom?: number, clearLeft = dockRef.current) => {
      const card = placeRef.current(id)
      if (!card) return
      const { width, height } = store.getState()
      const vp = centreViewport(card, { w: width, h: height }, clearLeft, zoom ?? Math.max(rf.getZoom(), WALK_ZOOM))
      void rf.setViewport(limit(vp, clearLeft), { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450 })
    },
    [rf, store, limit],
  )

  /** Is the top left of a card on screen, clear of the toolbar and the panel? */
  const inView = useCallback(
    (id: string) => {
      const card = placeRef.current(id)
      const pane = paneRef.current
      if (!card || !pane) return true
      return cardInView(card, rf.getViewport(), { w: pane.clientWidth, h: pane.clientHeight }, dockRef.current)
    },
    [rf],
  )

  /**
   * A move the board makes to the open card (an arrow-key step, a search hit opened, "Show on board"): made
   * once, after the render that draws the selection, at its own zoom. While one is made, nothing else
   * re-targets it (FINDINGS R-116: the selection pan used to restart a walk's ease at the mid-ease zoom).
   */
  const aimRef = useRef<{ id: string; zoom?: number; clearLeft?: number; done?: boolean } | null>(null)
  const [aimTick, setAimTick] = useState(0)
  const aim = (id: string, opts: { zoom?: number; clearLeft?: number } = {}) => {
    aimRef.current = { id, ...opts }
    setAimTick((n) => n + 1)
  }

  // "Show on board" from a sheet or another view lands here as ?focus=ID (with the item open), at a zoom of 1.
  const focusId = open.params.get('focus')
  useEffect(() => {
    if (!focusId) return
    if (index.byId.has(focusId)) aim(focusId, { zoom: 1 })
    open.clearFocus()
  }, [focusId]) // only when a new focus request arrives

  // The open card must be on show (graph.ts shows it and its ancestors even while retired cards are hidden),
  // and in view: an aim brings it there; otherwise (a click, a panel link, Back) pan to it only when the
  // panel opened over it or a link left it off screen, at the zoom the board has.
  const lastSelected = useRef(selected)
  useEffect(() => {
    const moved = lastSelected.current !== selected
    lastSelected.current = selected
    const a = aimRef.current
    if (a && !a.done) {
      // The pane is measured a moment after the board mounts (Show on board from another view); a pane
      // never measured gets no move rather than one worked out for a zero-width board.
      let tries = 0
      let t: ReturnType<typeof setTimeout> | undefined
      const go = () => {
        if (!store.getState().width) {
          if (tries++ < 40) t = setTimeout(go, 25)
          return
        }
        a.done = true
        centreOn(a.id, a.zoom, a.clearLeft)
      }
      go()
      return () => clearTimeout(t)
    }
    // The run after an aim for this same selection (its own render, StrictMode's second run): the board
    // already brought the card into view. Any other selection change forgets the aim.
    if (a && a.id === selected && !moved) return
    aimRef.current = null
    if (!selected || !index.byId.has(selected) || focusId) return
    const t = setTimeout(() => {
      // Not while the search list is steering the board: it has somewhere else to be.
      if (!peekFrom.current && !inView(selected)) centreOn(selected, rf.getZoom())
    }, 80)
    return () => clearTimeout(t)
  }, [selected, aimTick]) // when the selection changes or the board aims, not on every catalogue event

  // Keyboard: / search, arrows walk the tree (each step opens that card), Enter moves into the panel.
  // Esc closes the panel; the panel itself handles that.
  // One listener for the board's life, reading the latest handler: re-subscribing on every render
  // would drop a key whose earlier listener (the panel closing on Esc) re-rendered mid-dispatch.
  const onKeyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKeyRef.current(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])
  onKeyRef.current = (e: KeyboardEvent) => {
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
    // Ctrl F (Cmd F on a Mac) finds on the board rather than in the page: most cards aren't in the page at all.
    // While a card is open it finds in that card instead (CardFind); / still searches the board.
    const find = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && key === 'f'
    if (find && selected) return
    if (find || (e.key === '/' && !typing)) {
      e.preventDefault()
      searchRef.current?.focus()
      searchRef.current?.select()
      return
    }
    // Esc also clears a search left standing (after Enter opened a match); the panel closes as usual.
    if (e.key === 'Escape' && !typing && view.search) view.set({ search: '' })
    // Only walk the tree when focus is on the page, the canvas or a card: never on a control inside the
    // canvas (a lane toggle, a lane name, its menu, Add lane, an add slot, the view bar), which keeps
    // Enter and the arrow keys for its own job (FINDINGS R-115).
    const onCanvas = !target || target === document.body || (!!target.closest('.react-flow') && !target.closest(CONTROLS))
    if (typing || !onCanvas || !selected || !index.byId.has(selected)) return
    if (e.key === 'Enter') {
      e.preventDefault()
      document.querySelector<HTMLElement>('.sheet.docked')?.focus()
    } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      // A modified arrow (Alt Left is the browser's Back) keeps its own job.
      // Step as the board draws the cards (FINDINGS R-118); each step opens that card and lands it in view.
      const next = walkStep(e.key as WalkKey, selected, { index, shown: visible, retired, map })
      if (!next) return
      e.preventDefault()
      select(next, () => aim(next))
    }
  }

  /** Find a search hit on the board, clear of the panel and the results list, without opening it. */
  const peekAt = (id: string | null, clearLeft: number) => {
    setPeek(id)
    const pane = paneRef.current
    if (!id || !pane) return
    peekFrom.current ??= rf.getViewport()
    centreOn(id, undefined, Math.max(dockPx, clearLeft - pane.getBoundingClientRect().left + 16))
  }
  const leaveSearch = (restore: boolean) => {
    setPeek(null)
    const from = peekFrom.current
    peekFrom.current = null
    if (restore && from) void rf.setViewport(limit(from), { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450 })
  }

  const fit = () => rf.fitView({ ...FIT, padding: { ...FIT.padding, left: `${dockPx + 24}px` }, duration: 400 })
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
          <RegionBoundary key={selected} region="dock:item" label="This card" frame="docked" closes="item">
            <ItemModal id={selected} docked />
          </RegionBoundary>
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
          onMoveEnd={(_, vp) => writeJson(VIEWPORT_KEY[mode], vp)}
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
          {/* The chart paper's ruling: one faint grid (--grid), quiet enough to read cards over. Mapped has no ruling. */}
          {!mapped && <Background variant={BackgroundVariant.Lines} gap={80} color="#e3eae7" lineWidth={1} />}
          <PanLimits bounds={bounds} dock={dockPx} limit={limit} />
          <BoardMinimap
            bounds={bounds}
            nodes={nodes}
            lanes={map?.lanes}
            selected={selected}
            dock={dockPx}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            limit={limit}
            onFit={fit}
          />
          {map && <LaneHeaders bands={map.lanes} collapsed={collapsedLanes} onToggle={toggleLane} inset={dockPx} />}
        </ReactFlow>

        <div className="toolbar">
          <div className="toolbar-group" style={{ position: 'relative' }}>
            <BoardSearch
              inputRef={searchRef}
              hits={hits}
              index={index}
              query={view.search}
              onQuery={(search) => view.set({ search })}
              onPeek={peekAt}
              onOpen={(id) => {
                leaveSearch(false)
                if (id === selected) aim(id)
                else select(id, () => aim(id, { clearLeft: openDockPx }))
              }}
              onCancel={() => {
                leaveSearch(true)
                view.set({ search: '' })
              }}
              onLeave={() => leaveSearch(false)}
              onActive={setHitCursor}
              filtersOn={view.statuses.length > 0 || view.components.length > 0 || view.types.length > 0 || view.onlyWithQuestions}
              onClearFilters={() => view.set({ statuses: [], components: [], types: [], onlyWithQuestions: false })}
            />
            {filtering && (
              <span className="search-count" aria-live="polite">
                {hitCursor >= 0 ? `${hitCursor + 1} of ${hits.length}` : `${hits.length} match${hits.length === 1 ? '' : 'es'}`}
              </span>
            )}
            <button
              ref={filtersRef}
              className="btn icon"
              aria-pressed={showFilters || (filtering && !view.search)}
              aria-expanded={showFilters}
              onClick={() => setShowFilters((v) => !v)}
              aria-label="Filters"
              title="Filters"
            >
              <Filter size={15} />
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
              {(['mapped', 'freeform'] as const).map((m) => (
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

/**
 * Hold React Flow's own pans and zooms (drag, mouse wheel, a drag's auto-pan) to the board's
 * limits. The extent's padding is in screen pixels, so it is reset as the zoom, the pane or the
 * panel changes; a component of its own so that doesn't re-render the board. Also pulls a saved
 * viewport from an earlier session back onto the map, once.
 */
function PanLimits({ bounds, dock, limit }: { bounds: Bounds | null; dock: number; limit: (vp: Viewport) => Viewport }) {
  const store = useStoreApi()
  const zoom = useStore((s) => s.transform[2])
  const w = useStore((s) => s.width)
  const h = useStore((s) => s.height)
  const panZoom = useStore((s) => s.panZoom)
  const settled = useRef(false)
  useEffect(() => {
    if (!panZoom || !w || !h) return
    store.getState().setTranslateExtent(bounds ? panExtent(bounds, zoom, { w, h, dock }) : UNBOUNDED)
  }, [store, panZoom, bounds, zoom, w, h, dock])
  useEffect(() => {
    if (settled.current || !panZoom || !w || !h || !bounds) return
    settled.current = true
    const [x, y, z] = store.getState().transform
    const vp = limit({ x, y, zoom: z })
    if (vp.x !== x || vp.y !== y) void panZoom.setViewport(vp)
  }, [store, panZoom, bounds, w, h, limit])
  return null
}
const UNBOUNDED: [[number, number], [number, number]] = [
  [-Infinity, -Infinity],
  [Infinity, Infinity],
]

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
  const components = useComponents()
  const config = useConfig()
  const ref = useDismiss<HTMLDivElement>(onClose, anchor)
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  return (
    <div ref={ref} className="popover" role="dialog" aria-label="Filters">
      <h4>Status</h4>
      <div className="chip-row">
        {/* Retired is offered only while retired cards are on show (or still picked, so it can be cleared). */}
        {config.statuses.map((d) => d.code).filter((s) => !isRetiredStatus(config, s) || view.showRetired || view.statuses.includes(s)).map((s) => (
          <button key={s} className="status-toggle" aria-pressed={view.statuses.includes(s)} onClick={() => view.set({ statuses: toggle(view.statuses, s) })}>
            <StatusLabel kind="item" status={s} />
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
        {components.map((c) => (
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

/**
 * The board's React Flow graph, derived from the catalogue: one card node per
 * placed item and one edge per parent link, each toned by the selection and
 * filters. Pure, so the rules (which cards show, which handles an edge uses)
 * are unit-tested rather than only seen in the browser.
 */
import type { Edge } from '@xyflow/react'
import type { Item, Layout } from '../../shared/types.ts'
import { isRetiredOrUnder, openQuestionsFor, type Index } from '../store.ts'
import type { Placement } from './autoLayout.ts'
import { cardHandles, type CardData, type CardNodeType } from './cardData.ts'

export interface GraphInput {
  index: Index
  /** Where each card sits: `autoLayout` (Freeform) or `mappedLayout` (Mapped). */
  auto: Record<string, Placement>
  /** Freeform's dragged positions, which override `auto`. Mapped passes none. */
  positions: Layout['positions']
  /** Cards placed but not drawn (Mapped: in a collapsed lane). */
  collapsed?: ReadonlySet<string>
  showRetired: boolean
  /** The card open in the panel. It always shows, even when retired cards are hidden. */
  selected: string | null
  /** The selected card with its ancestors and descendants, or null when nothing is selected. */
  lineage: Set<string> | null
  filtering: boolean
  matches: Set<string>
}

/**
 * Retired cards, and everything under one, are hidden unless the Retired toggle is on. The open card
 * and its ancestors always show, so a live story under a retired feature is drawn in its column (FINDINGS
 * R-113); the ancestors keep their retired look.
 */
export const isShown = (it: Item, g: Pick<GraphInput, 'index' | 'showRetired' | 'selected'>) =>
  g.showRetired || it.id === g.selected || !isRetiredOrUnder(g.index, it) || isAncestorOf(g.index, it.id, g.selected)

/** Is `id` above `of` in its parent chain? Safe on parent cycles. */
function isAncestorOf(index: Pick<Index, 'byId'>, id: string, of: string | null): boolean {
  const seen = new Set<string>()
  for (let cur = of ? index.byId.get(of)?.parent : undefined; cur && !seen.has(cur); cur = index.byId.get(cur)?.parent) {
    if (cur === id) return true
    seen.add(cur)
  }
  return false
}

export function toneFor(id: string, g: GraphInput): CardData['tone'] {
  if (g.filtering && !g.matches.has(id)) return 'is-faded'
  if (g.lineage) return id === g.selected ? 'is-selected' : g.lineage.has(id) ? 'is-lit' : 'is-dim'
  return ''
}

/** How many cards sit under each item, at any depth. Pass `shownIndex` to count only the cards on show. */
export function countDescendants(index: Index): Map<string, number> {
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
}

/**
 * The card nodes. With `prev` (the last build's nodes, by ID), a card nothing it draws has changed keeps
 * its `data` object, and a card that is also where it was keeps its whole node, so after a delivery that
 * changed one card only that card re-renders (FINDINGS R-159; `CardNode` is memoised on its props).
 */
export function buildNodes(g: GraphInput, descendantCounts: Map<string, number>, prev?: ReadonlyMap<string, CardNodeType>): CardNodeType[] {
  return g.index.items
    .filter((it) => g.auto[it.id])
    .map((it) => {
      const a = g.auto[it.id]!
      const data: CardData = {
        item: it,
        w: a.w,
        h: a.h,
        openQuestions: openQuestionsFor(g.index, it.id).length,
        childCount: descendantCounts.get(it.id) ?? 0,
        tone: toneFor(it.id, g),
      }
      const was = prev?.get(it.id)
      const node: CardNodeType = {
        id: it.id,
        type: 'card' as const,
        position: g.positions[it.id] ?? { x: a.x, y: a.y },
        // Handles come from the layout, not only from React Flow's DOM measurement, so a
        // rebuild can never leave a card without them (and the board without edges): cardHandles.
        handles: was && was.data.w === a.w && was.data.h === a.h ? was.handles : cardHandles(a.w, a.h),
        hidden: !isShown(it, g) || !!g.collapsed?.has(it.id),
        zIndex: it.type === 'epic' ? 0 : it.type === 'feature' ? 1 : 2,
        data: was && sameData(was.data, data) ? was.data : data,
      }
      return was && sameNode(was, node) ? was : node
    })
}

const sameData = (a: CardData, b: CardData) => a.item === b.item && a.w === b.w && a.h === b.h && a.openQuestions === b.openQuestions && a.childCount === b.childCount && a.tone === b.tone
const sameNode = (a: CardNodeType, b: CardNodeType) =>
  a.data === b.data && a.handles === b.handles && a.hidden === b.hidden && a.zIndex === b.zIndex && a.position.x === b.position.x && a.position.y === b.position.y

/**
 * `mapped`: only the open card's lineage is joined (position shows the rest of the hierarchy),
 * and a feature rises straight to its epic, which always spans it (`RiseEdge`).
 */
export function buildEdges(g: GraphInput, { mapped = false } = {}): Edge[] {
  const out: Edge[] = []
  for (const it of g.index.items) {
    if (!it.parent) continue
    const parent = g.index.byId.get(it.parent)
    if (!parent || !g.auto[it.id]) continue
    if (!isShown(it, g) || !isShown(parent, g)) continue
    const lit = !!g.lineage && g.lineage.has(it.id) && g.lineage.has(parent.id)
    if (mapped && !lit) continue
    const dim = (!!g.lineage && !lit) || (g.filtering && (!g.matches.has(it.id) || !g.matches.has(parent.id)))
    // Stories hang off a spine down their feature's left side; everything else joins top to bottom.
    const spine = it.type === 'story'
    out.push({
      id: `${parent.id}>${it.id}`,
      source: parent.id,
      target: it.id,
      sourceHandle: spine && parent.type === 'feature' ? 'ls' : undefined,
      targetHandle: spine ? 'l' : undefined,
      type: mapped && it.type === 'feature' ? 'rise' : 'smoothstep',
      // Mapped: beneath the lane rules (zIndex -1), so a lane still reads as one unbroken band.
      ...(mapped && { zIndex: -2 }),
      pathOptions: { offset: spine ? 18 : 12, borderRadius: 10 },
      className: lit ? 'lit' : dim ? 'dim' : '',
      focusable: false,
      selectable: false,
    } as Edge)
  }
  return out
}

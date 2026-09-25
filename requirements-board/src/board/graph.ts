/**
 * The board's React Flow graph, derived from the catalogue: one card node per
 * placed item and one edge per parent link, each toned by the selection and
 * filters. Pure, so the rules (which cards show, which handles an edge uses)
 * are unit-tested rather than only seen in the browser.
 */
import type { Edge } from '@xyflow/react'
import type { Item, Layout } from '../../shared/types.ts'
import { openQuestionsFor, type Index } from '../store.ts'
import type { Placement } from './autoLayout.ts'
import { cardHandles, type CardData, type CardNodeType } from './cardData.ts'

export interface GraphInput {
  index: Index
  auto: Record<string, Placement>
  positions: Layout['positions']
  showRetired: boolean
  /** The card open in the panel. It always shows, even when retired cards are hidden. */
  selected: string | null
  /** The selected card with its ancestors and descendants, or null when nothing is selected. */
  lineage: Set<string> | null
  filtering: boolean
  matches: Set<string>
}

export const isShown = (it: Item, g: Pick<GraphInput, 'showRetired' | 'selected'>) => it.status !== 'Retired' || g.showRetired || it.id === g.selected

export function toneFor(id: string, g: GraphInput): CardData['tone'] {
  if (g.filtering && !g.matches.has(id)) return 'is-faded'
  if (g.lineage) return id === g.selected ? 'is-selected' : g.lineage.has(id) ? 'is-lit' : 'is-dim'
  return ''
}

/** How many cards sit under each item, at any depth. */
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

export function buildNodes(g: GraphInput, descendantCounts: Map<string, number>): CardNodeType[] {
  return g.index.items
    .filter((it) => g.auto[it.id])
    .map((it) => {
      const a = g.auto[it.id]!
      return {
        id: it.id,
        type: 'card' as const,
        position: g.positions[it.id] ?? { x: a.x, y: a.y },
        // Handles come from the layout, not only from React Flow's DOM measurement, so a
        // rebuild can never leave a card without them (and the board without edges): cardHandles.
        handles: cardHandles(a.w, a.h),
        hidden: !isShown(it, g),
        zIndex: it.type === 'epic' ? 0 : it.type === 'feature' ? 1 : 2,
        data: {
          item: it,
          w: a.w,
          h: a.h,
          openQuestions: openQuestionsFor(g.index, it.id).length,
          childCount: descendantCounts.get(it.id) ?? 0,
          tone: toneFor(it.id, g),
        },
      }
    })
}

export function buildEdges(g: GraphInput): Edge[] {
  const out: Edge[] = []
  for (const it of g.index.items) {
    if (!it.parent) continue
    const parent = g.index.byId.get(it.parent)
    if (!parent || !g.auto[it.id]) continue
    if (!isShown(it, g) || !isShown(parent, g)) continue
    const lit = !!g.lineage && g.lineage.has(it.id) && g.lineage.has(parent.id)
    const dim = (!!g.lineage && !lit) || (g.filtering && (!g.matches.has(it.id) || !g.matches.has(parent.id)))
    // Stories hang off a spine down their feature's left side; everything else joins top to bottom.
    const spine = it.type === 'story'
    out.push({
      id: `${parent.id}>${it.id}`,
      source: parent.id,
      target: it.id,
      sourceHandle: spine && parent.type === 'feature' ? 'ls' : undefined,
      targetHandle: spine ? 'l' : undefined,
      type: 'smoothstep',
      pathOptions: { offset: spine ? 18 : 12, borderRadius: 10 },
      className: lit ? 'lit' : dim ? 'dim' : '',
      focusable: false,
      selectable: false,
    } as Edge)
  }
  return out
}

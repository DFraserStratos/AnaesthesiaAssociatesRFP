/**
 * The board's arrow-key walk, as a pure function: which card a key steps to from the open one, in the
 * order the current mode draws the cards (FINDINGS R-118; B11-Q3).
 *
 * - Left and Right step among cards of the same type under the same parent: epics among epics, an epic's
 *   features among its features, a column's stories among the stories of the same parent.
 * - Up and Down from a story step through the stories drawn in its column: in Mapped lane by lane, top to
 *   bottom, live first in each lane, skipping a collapsed lane (but the open card drawn there); in Freeform
 *   the stack order, live first, whatever the dragged positions. Up from the top story goes to its parent.
 * - Down from a feature goes to the first story drawn under it; from an epic to its first feature, else its
 *   first story. Up from a feature or an epic goes to its parent.
 * - Only cards on show are stepped onto.
 */
import { liveFirst, type RetiredTest } from '../../shared/move.ts'
import type { Item } from '../../shared/types.ts'
import type { Index } from '../store.ts'
import { stackKey, type MappedLayout } from './mappedLayout.ts'

export type WalkKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

export interface WalkContext {
  index: Index
  /** Is a card on show in this mode (retired cards hidden, the open card's lineage kept)? */
  shown: (it: Item) => boolean
  retired: RetiredTest
  /** Mapped: the map as drawn. Null in Freeform. */
  map: MappedLayout | null
}

export function walkStep(key: WalkKey, id: string, ctx: WalkContext): string | undefined {
  const it = ctx.index.byId.get(id)
  if (!it) return undefined
  const drawn = (c: Item | undefined): c is Item => !!c && ctx.shown(c) && (!ctx.map || (!!ctx.map.placements[c.id] && !ctx.map.collapsed.has(c.id)))
  const parent = it.parent ? ctx.index.byId.get(it.parent) : undefined
  const up = drawn(parent) ? parent.id : undefined
  const step = (list: string[], by: -1 | 1) => {
    const at = list.indexOf(id)
    return at < 0 ? undefined : list[at + by]
  }

  if (it.type === 'story') {
    const column = columnOf(it, ctx, drawn)
    if (key === 'ArrowUp') return step(column, -1) ?? (column[0] === id ? up : undefined)
    if (key === 'ArrowDown') return step(column, 1)
    const peers = column.filter((c) => ctx.index.byId.get(c)?.parent === it.parent)
    return step(peers, key === 'ArrowLeft' ? -1 : 1)
  }
  if (key === 'ArrowUp') return up
  if (key === 'ArrowDown') {
    const features = it.type === 'epic' ? kinds(it.id, 'feature', ctx, drawn) : []
    return features[0] ?? columnUnder(it.id, ctx, drawn)[0]
  }
  return step(kinds(it.parent, it.type, ctx, drawn), key === 'ArrowLeft' ? -1 : 1)
}

/** The cards of one type under one parent (null: top level), drawn, in drawing order. */
function kinds(parent: string | null, type: Item['type'], ctx: WalkContext, drawn: (c: Item | undefined) => c is Item): string[] {
  const under = parent === null ? ctx.index.items.filter((i) => !i.parent) : (ctx.index.children.get(parent) ?? [])
  return under.filter((c) => c.type === type && drawn(c)).sort(liveFirst(ctx.retired)).map((c) => c.id)
}

/** The stories under `parent`, drawn, top to bottom: its column, or (Mapped, a parent with no column) its stories in the orphan column. */
function columnUnder(parent: string, ctx: WalkContext, drawn: (c: Item | undefined) => c is Item): string[] {
  const map = ctx.map
  if (!map) return kinds(parent, 'story', ctx, drawn)
  if (map.columns.some((c) => c.parent === parent)) return inColumn(map, parent, ctx, drawn)
  return inColumn(map, null, ctx, drawn).filter((id) => {
    const it = ctx.index.byId.get(id)
    return it?.parent === parent && it.type === 'story'
  })
}

/** The cards drawn in one Mapped column (null: the orphan column), lane by lane, top to bottom. */
const inColumn = (map: MappedLayout, parent: string | null, ctx: WalkContext, drawn: (c: Item | undefined) => c is Item): string[] =>
  map.lanes.flatMap((l) => map.stacks.get(stackKey(parent, l.key)) ?? []).filter((c) => drawn(ctx.index.byId.get(c)))

/** The cards drawn in a story's own column, top to bottom: its parent's column, or (Mapped) the column of cards no epic reaches. */
function columnOf(it: Item, ctx: WalkContext, drawn: (c: Item | undefined) => c is Item): string[] {
  const map = ctx.map
  if (map && !(it.parent && map.columns.some((c) => c.parent === it.parent))) return inColumn(map, null, ctx, drawn)
  return it.parent ? columnUnder(it.parent, ctx, drawn) : kinds(null, 'story', ctx, drawn)
}

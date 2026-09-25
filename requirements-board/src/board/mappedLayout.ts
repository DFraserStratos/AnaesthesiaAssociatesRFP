/**
 * The Mapped board: a user story map read left to right in one strip. Epics
 * in `order` along the top, each spanning its feature columns (plus a headless
 * column for stories directly under the epic); features below them; then the
 * swim lanes, full-width bands in which every column stacks the stories it has
 * in that lane. Pure and deterministic, like `autoLayout`, and also the source
 * of the geometry a drag is hit-tested against (`dropTarget`).
 */
import { canParent, laneOf, liveFirst, type Move } from '../../shared/move.ts'
import { UNASSIGNED_LANE, type Item } from '../../shared/types.ts'
import { CARD, COL_GAP, COL_PITCH, EPIC_GAP, FEATURE_Y, ROW_GAP, STACK_GAP, type Placement } from './autoLayout.ts'

/** Where the lanes start when the only lane is the unnamed one (no header): the backbone's story row. */
const BACKBONE_BOTTOM = FEATURE_Y + CARD.feature.h
/** A named lane's header strip, above its cards. */
export const LANE_HEAD = 64
/** The quiet add button at the foot of each column in each lane. */
export const ADD_H = 30
const ADD_GAP = 10
const LANE_PAD = 28
/** How far a lane's rule runs past the map on either side. */
export const LANE_MARGIN = 160

export interface LaneBand {
  /** The lane's `swimlane` value: null for the unnamed first lane. */
  key: string | null
  /** What its header says. */
  name: string
  y: number
  h: number
  /** Header strip height; 0 while the unnamed lane is the only lane (no header). */
  head: number
  collapsed: boolean
  /** A `swimlane` value no lane in `board-layout.json` is called. */
  unknown: boolean
  /** Stories drawn in the lane (hidden ones excluded). */
  count: number
}

export interface Column {
  /** The parent a story dropped here gets: a feature, or the epic for its headless column. Null for the orphan column. */
  parent: string | null
  epic: string | null
  x: number
  /** The epic's own column (stories directly under it), not a feature's. */
  direct: boolean
}

export interface AddSlot {
  parent: string
  swimlane: string | null
  x: number
  y: number
}

export interface MappedLayout {
  placements: Record<string, Placement>
  /** Cards in a collapsed lane: placed, but not drawn. */
  collapsed: Set<string>
  lanes: LaneBand[]
  columns: Column[]
  epics: { id: string; x: number; w: number }[]
  adds: AddSlot[]
  /** Visible story IDs per column and lane, top to bottom: `stackKey(parent, lane)`. */
  stacks: Map<string, string[]>
  width: number
  height: number
}

export interface MappedOptions {
  /** Named lanes, top to bottom (`Layout.lanes`). */
  lanes: string[]
  /** What the first lane is called (`Layout.firstLane`). Defaults to Unassigned. */
  firstLane?: string
  /** Lane keys (`laneKey`) drawn as a header strip only. */
  collapsed?: ReadonlySet<string>
  /** Cards that take up room; the rest are placed at the foot of their stack. Defaults to all. */
  visible?: (it: Item) => boolean
}

export const laneKey = (lane: string | null) => lane ?? ''
export const stackKey = (parent: string | null, lane: string | null) => `${parent ?? ''}|${laneKey(lane)}`

export function mappedLayout(items: Item[], opts: MappedOptions): MappedLayout {
  const visible = opts.visible ?? (() => true)
  const byId = new Map(items.map((i) => [i.id, i]))
  const kids = new Map<string, Item[]>()
  const epics: Item[] = []
  const orphans: Item[] = []
  for (const it of items) {
    if (it.type === 'epic' && !it.parent) epics.push(it)
    else if (it.parent && byId.has(it.parent) && canParent(it, byId.get(it.parent)!)) {
      const list = kids.get(it.parent) ?? []
      list.push(it)
      kids.set(it.parent, list)
    } else orphans.push(it) // parent missing or of the wrong type (bad data): still drawn, in a column of their own
  }
  epics.sort(liveFirst)
  for (const list of kids.values()) list.sort(liveFirst)
  orphans.sort(liveFirst)

  const out: MappedLayout = { placements: {}, collapsed: new Set(), lanes: [], columns: [], epics: [], adds: [], stacks: new Map(), width: 0, height: 0 }

  // Backbone: epics across the top, each over its feature columns.
  let x = 0
  for (const epic of epics) {
    const children = kids.get(epic.id) ?? []
    const features = children.filter((c) => c.type === 'feature')
    const direct = children.filter((c) => c.type === 'story')
    const hasDirect = direct.length > 0 || features.length === 0
    const cols = features.length + (hasDirect ? 1 : 0)
    const w = cols * COL_PITCH - COL_GAP
    out.placements[epic.id] = { x, y: 0, w, h: CARD.epic.h }
    out.epics.push({ id: epic.id, x, w })
    let cx = x
    for (const f of features) {
      out.placements[f.id] = { x: cx, y: FEATURE_Y, w: CARD.feature.w, h: CARD.feature.h }
      out.columns.push({ parent: f.id, epic: epic.id, x: cx, direct: false })
      cx += COL_PITCH
    }
    if (hasDirect) out.columns.push({ parent: epic.id, epic: epic.id, x: cx, direct: true })
    x += w + EPIC_GAP
  }
  const storiesOf = (col: Column): Item[] => (col.parent ? (kids.get(col.parent) ?? []).filter((c) => c.type === 'story') : orphans)
  if (orphans.length) out.columns.push({ parent: null, epic: null, x, direct: false })
  const last = out.columns.at(-1)
  out.width = Math.max(last ? last.x + CARD.story.w : 0, ...out.epics.map((e) => e.x + e.w))

  // Lanes: the unnamed one first, then the named ones, then any a story names that no lane is called.
  const named = new Set(opts.lanes)
  const unknown = [...new Set(items.filter((i) => i.type === 'story' && i.swimlane !== null && !named.has(i.swimlane)).map((i) => i.swimlane!))].sort()
  const keys: (string | null)[] = [null, ...opts.lanes, ...unknown]
  const headless = keys.length === 1

  let y = headless ? BACKBONE_BOTTOM + ROW_GAP : BACKBONE_BOTTOM + ROW_GAP / 2
  for (const key of keys) {
    const collapsed = !headless && !!opts.collapsed?.has(laneKey(key))
    const head = headless ? 0 : LANE_HEAD
    const top = y + head
    let tallest = 0
    let count = 0
    for (const col of out.columns) {
      const inLane = storiesOf(col).filter((s) => laneOf(s) === key)
      const shown: string[] = []
      let sy = top
      const hidden: Item[] = []
      for (const s of inLane) {
        if (!visible(s)) {
          hidden.push(s)
          continue
        }
        out.placements[s.id] = { x: col.x, y: sy, w: CARD.story.w, h: CARD.story.h }
        if (collapsed) out.collapsed.add(s.id)
        shown.push(s.id)
        sy += CARD.story.h + STACK_GAP
      }
      // Hidden cards keep a place at the foot of the stack, so showing them never moves the rest.
      for (const s of hidden) {
        out.placements[s.id] = { x: col.x, y: sy, w: CARD.story.w, h: CARD.story.h }
        if (collapsed) out.collapsed.add(s.id)
        sy += CARD.story.h + STACK_GAP
      }
      out.stacks.set(stackKey(col.parent, key), shown)
      count += shown.length
      const stackH = shown.length ? shown.length * (CARD.story.h + STACK_GAP) - STACK_GAP : 0
      tallest = Math.max(tallest, stackH)
      if (!collapsed && col.parent) out.adds.push({ parent: col.parent, swimlane: key, x: col.x, y: top + stackH + (stackH ? ADD_GAP : 0) })
    }
    const body = collapsed ? 0 : Math.max(tallest + ADD_GAP + ADD_H, CARD.story.h) + LANE_PAD
    out.lanes.push({ key, name: key ?? (opts.firstLane || UNASSIGNED_LANE), y, h: head + body, head, collapsed, unknown: unknown.includes(key as string), count })
    y += head + body
  }
  out.height = y
  return out
}

/** Where a dragged card would land if dropped with the pointer at `point`, or null if nowhere valid. Hit-test against a layout without the dragged card (and what hangs under it). */
export function dropTarget(L: MappedLayout, point: { x: number; y: number }, dragged: Item): Move | null {
  const lanesTop = L.lanes[0]?.y ?? Infinity
  if (dragged.type === 'epic') {
    if (point.y >= lanesTop) return null
    return { id: dragged.id, parent: null, index: L.epics.filter((e) => e.x + e.w / 2 < point.x).length }
  }
  if (dragged.type === 'feature') {
    if (point.y >= lanesTop || !L.epics.length) return null
    // The epic under the pointer, else the nearest one.
    const dist = (e: { x: number; w: number }) => (point.x < e.x ? e.x - point.x : point.x > e.x + e.w ? point.x - e.x - e.w : 0)
    const epic = L.epics.reduce((best, e) => (dist(e) < dist(best) ? e : best))
    const features = L.columns.filter((c) => c.epic === epic.id && !c.direct)
    return { id: dragged.id, parent: epic.id, index: features.filter((c) => c.x + CARD.feature.w / 2 < point.x).length }
  }
  const lane = L.lanes.find((l) => point.y >= l.y && point.y < l.y + l.h)
  if (!lane) return null
  const cols = L.columns.filter((c) => c.parent !== null)
  if (!cols.length) return null
  const col = cols.reduce((best, c) => (Math.abs(c.x + CARD.story.w / 2 - point.x) < Math.abs(best.x + CARD.story.w / 2 - point.x) ? c : best))
  if (Math.abs(col.x + CARD.story.w / 2 - point.x) > COL_PITCH) return null // well past either end of the map
  const stack = L.stacks.get(stackKey(col.parent, lane.key)) ?? []
  const index = lane.collapsed ? stack.length : stack.filter((id) => L.placements[id]!.y + CARD.story.h / 2 < point.y).length
  return { id: dragged.id, parent: col.parent, index, swimlane: lane.key }
}

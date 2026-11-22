/**
 * Moves on the Mapped board, as pure functions: where a dragged card lands
 * (`Move`) in, the catalogue records that change (`Change[]`) out. A move only
 * ever rewrites `parent`, `order` and (stories) `swimlane`; IDs never change.
 *
 * `order` is a global sibling position, but a story's slot on the board is
 * counted among its lane-mates in one column, so the planner inserts the card
 * next to the lane-mate it was dropped beside, then renumbers the destination
 * siblings 1..n. The siblings it left keep their gaps (gaps are allowed). A card
 * already inside its new slot (a drop back in place, or a lane change that
 * needs no reorder) keeps its `order`, so no other file is rewritten.
 */
import { DEFAULT_CONFIG } from './config.ts'
import { revOf } from './files.ts'
import { compareSiblings } from './ids.ts'
import { retiredTest } from './statuses.ts'
import { firstLaneName, parentTypesOf, type Item } from './types.ts'

/** Is a card retired? The board passes its config's (`retiredTest(config)`); unset, the default config's. */
export type RetiredTest = (it: Item) => boolean
const DEFAULT_RETIRED: RetiredTest = retiredTest(DEFAULT_CONFIG)

export interface Move {
  id: string
  /** Null for an epic. */
  parent: string | null
  /** Slot among the card's peers at the destination: epics, the epic's features, or a column's stories in one lane. */
  index: number
  /** Stories only: the destination lane (null is the unnamed first lane). Omitted keeps the current lane. */
  swimlane?: string | null
}

/** The fields a move rewrites on one record. Only fields that actually change are present. */
export interface Change {
  id: string
  parent?: string | null
  order?: number
  swimlane?: string | null
}

/** Live cards first, retired ones at the end of each stack: the order the board draws them in. */
export const liveFirst =
  (retired: RetiredTest = DEFAULT_RETIRED) =>
  (a: Item, b: Item) =>
    Number(retired(a)) - Number(retired(b)) || compareSiblings(a, b)

/** The lane a card is drawn in. Only stories sit in lanes. */
export const laneOf = (it: Item): string | null => (it.type === 'story' ? it.swimlane : null)

/** Can `it` sit under `parent` (null: at the top, as an epic)? */
export function canParent(it: Item, parent: Item | null): boolean {
  if (it.type === 'epic') return parent === null
  return !!parent && parent.id !== it.id && parentTypesOf(it.type).includes(parent.type)
}

/** The cards a slot index counts among at the destination, in drawing order. */
function peersAt(items: Item[], it: Item, parent: string | null, lane: string | null, retired: RetiredTest): Item[] {
  return items
    .filter((o) => o.id !== it.id && o.parent === parent && (it.type === 'epic' ? o.type === 'epic' : it.type === 'feature' ? o.type === 'feature' : o.type === 'story' && o.swimlane === lane))
    .sort(liveFirst(retired))
}

export function planMove(items: Item[], move: Move, retired: RetiredTest = DEFAULT_RETIRED): Change[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const it = byId.get(move.id)
  if (!it) return []
  const parent = move.parent === null ? null : (byId.get(move.parent) ?? null)
  if (move.parent !== null && !parent) return []
  if (!canParent(it, parent)) return []
  const lane = it.type === 'story' ? (move.swimlane === undefined ? it.swimlane : move.swimlane) : it.swimlane

  // Everything else under the destination parent, in file order; the moved card goes in beside its peer.
  const siblings = items.filter((o) => o.id !== it.id && o.parent === move.parent && (move.parent !== null || o.type === 'epic')).sort(compareSiblings)
  // The board draws live cards first, then retired ones, so a card can only land among its own kind:
  // the slot is counted within that run of the drawn stack (FINDINGS R-86). Its neighbours are then in
  // file order too, so any position between them, whatever other cards sit there, looks the same.
  const peers = peersAt(items, it, move.parent, lane, retired)
  const live = peers.filter((p) => !retired(p))
  const own = retired(it) ? peers.filter((p) => retired(p)) : live
  const index = Math.max(0, Math.min(Math.floor(move.index) - (retired(it) ? live.length : 0), own.length))
  const lo = index > 0 ? siblings.indexOf(own[index - 1]!) + 1 : 0
  const hi = index < own.length ? siblings.indexOf(own[index]!) : siblings.length
  // Where the card sits now, if it stays under the same parent; kept when it is already in the slot, so nothing else is rewritten.
  const cur = it.parent === move.parent ? siblings.filter((o) => compareSiblings(o, it) < 0).length : -1
  const stays = cur >= lo && cur <= hi
  const at = stays ? cur : index > 0 ? lo : hi
  const moved: Change = { id: it.id }
  if (it.parent !== move.parent) moved.parent = move.parent
  if (lane !== it.swimlane) moved.swimlane = lane
  if (stays) return Object.keys(moved).length > 1 ? [moved] : []

  const next = [...siblings.slice(0, at), it, ...siblings.slice(at)]
  const out: Change[] = []
  next.forEach((o, i) => {
    const c: Change = o === it ? { ...moved } : { id: o.id }
    if (o.order !== i + 1) c.order = i + 1
    if (Object.keys(c).length > 1) out.push(c)
  })
  return out
}

/** The records with `changes` applied (unchanged records keep their identity). */
export function applyChanges(items: Item[], changes: Change[]): Item[] {
  if (!changes.length) return items
  const byId = new Map(changes.map((c) => [c.id, c]))
  return items.map((it) => {
    const c = byId.get(it.id)
    if (!c) return it
    const { id: _id, ...patch } = c
    return { ...it, ...patch }
  })
}

/** The changes that put back what `changes` would rewrite: each record's current value of every field it touches. */
export function invertChanges(items: Item[], changes: Change[]): Change[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  return changes.flatMap((c) => {
    const it = byId.get(c.id)
    if (!it) return []
    const back: Change = { id: c.id }
    if ('parent' in c) back.parent = it.parent
    if ('order' in c) back.order = it.order
    if ('swimlane' in c) back.swimlane = it.swimlane
    return [back]
  })
}

/** Does every record still hold the values `changes` sets? (The id of the first one that doesn't, else null.) */
export function driftFrom(items: Item[], changes: Change[]): string | null {
  const byId = new Map(items.map((i) => [i.id, i]))
  for (const c of changes) {
    const it = byId.get(c.id)
    if (!it) return c.id
    if (('parent' in c && it.parent !== c.parent) || ('order' in c && it.order !== c.order) || ('swimlane' in c && it.swimlane !== c.swimlane)) return c.id
  }
  return null
}

/** The catalogue as it would be after `move`: the board's live drag preview. */
export const applyMove = (items: Item[], move: Move, retired?: RetiredTest): Item[] => applyChanges(items, planMove(items, move, retired))

/* ------------------------------------------------------------------ lanes */

const MAX_LANE_NAME = 40

/**
 * Every reason a set of lane names (the first lane's name, then the named lanes) cannot be saved: a
 * blank or non-text name, spaces around a name, a name over 40 characters, a name that repeats another
 * regardless of case (the first lane's included, so a lane called "unassigned" clashes with the default).
 * One message per problem, so a write can tell a problem it adds from one already there.
 */
export function laneListProblems(lanes: unknown): string[] {
  if (!Array.isArray(lanes)) return ['lanes must be a list of names']
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of lanes) {
    if (typeof raw !== 'string' || !raw.trim()) {
      out.push('a lane needs a name')
      continue
    }
    const name = raw.trim()
    if (name !== raw) out.push(`lane "${raw}" has spaces around its name`)
    if (name.length > MAX_LANE_NAME) out.push(`lane "${name}" is longer than ${MAX_LANE_NAME} characters`)
    if (seen.has(name.toLowerCase())) out.push(`there is already a lane called "${name}"`)
    seen.add(name.toLowerCase())
  }
  return out
}

/**
 * The lane a rename of `from` to `to` merges into (FINDINGS R-119): a named lane other than `from` whose
 * name matches `to` in any case, or `null` for the first lane when `to` is its name in any case. Undefined
 * when the rename is no merge (a new name, or `from` itself in another case).
 */
export function laneMergeTarget(layout: { firstLane?: string; lanes: string[] }, from: string, to: string): string | null | undefined {
  const name = to.trim().toLowerCase()
  if (firstLaneName(layout).toLowerCase() === name) return null
  return layout.lanes.find((l) => l !== from && l.toLowerCase() === name)
}

/** The first reason a set of lane names cannot be saved, or null when it can (see `laneListProblems`). */
export const laneListProblem = (lanes: unknown): string | null => laneListProblems(lanes)[0] ?? null

/** The problems in `after` that `before` does not already have (a repeated message counts each time). */
export function addedProblems(before: string[], after: string[]): string[] {
  const left = new Map<string, number>()
  for (const p of before) left.set(p, (left.get(p) ?? 0) + 1)
  return after.filter((p) => {
    const n = left.get(p) ?? 0
    if (n) left.set(p, n - 1)
    return !n
  })
}

/** The lane list's revision (the first lane's name and the named lanes): a lane write sends the one it started from. */
export const lanesRevOf = (layout: { firstLane?: string; lanes: string[] }): string => revOf(JSON.stringify({ firstLane: layout.firstLane ?? null, lanes: layout.lanes }))

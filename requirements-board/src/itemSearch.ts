/**
 * Finding an item by what someone remembers of it: any words of its title,
 * its ID, or the title of the epic or feature it sits under. Kept free of
 * React so the node tests can import it.
 */
import { compareIds, compareSiblings } from '../shared/ids.ts'
import type { Item, ItemType } from '../shared/types.ts'

export interface SearchIndex {
  items: Item[]
  byId: Map<string, Item>
}

export interface SearchOptions {
  types?: readonly ItemType[]
  exclude?: Iterable<string>
  includeRetired?: boolean
  limit?: number
}

/** Epic, then feature, above an item: titles only, top down. */
export function lineageTitles(index: SearchIndex, item: Item): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  let cur = item.parent ? index.byId.get(item.parent) : undefined
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id)
    out.unshift(cur.title)
    cur = cur.parent ? index.byId.get(cur.parent) : undefined
  }
  return out
}

const words = (s: string) => s.toLowerCase().split(/\s+/).filter(Boolean)

/** Lower is better: the ID itself, then title starts with the query, word starts, substring, a lineage or ID match. */
function rank(item: Item, query: string, qWords: string[]): number {
  const title = item.title.toLowerCase()
  if (item.id.toLowerCase() === query) return 0
  if (title.startsWith(query)) return 1
  const titleWords = words(title)
  if (qWords.every((w) => titleWords.some((t) => t.startsWith(w)))) return 2
  if (qWords.every((w) => title.includes(w))) return 3
  return 4
}

/** Tree order: each epic, then what sits under it, by sibling order. */
function treeOrder(list: Item[], index: SearchIndex): Item[] {
  const epicOf = (it: Item): Item => {
    let cur = it
    const seen = new Set<string>()
    while (cur.parent && !seen.has(cur.id)) {
      seen.add(cur.id)
      const p = index.byId.get(cur.parent)
      if (!p) break
      cur = p
    }
    return cur
  }
  const depth = { epic: 0, feature: 1, story: 2 } as const
  return [...list].sort((a, b) => {
    const ea = epicOf(a)
    const eb = epicOf(b)
    if (ea.id !== eb.id) return compareSiblings(ea, eb)
    return depth[a.type] - depth[b.type] || compareSiblings(a, b)
  })
}

export function searchItems(index: SearchIndex, query: string, opts: SearchOptions = {}): Item[] {
  const { types, includeRetired = false, limit = 60 } = opts
  const exclude = new Set(opts.exclude ?? [])
  const pool = index.items.filter((it) => (!types || types.includes(it.type)) && !exclude.has(it.id) && (includeRetired || it.status !== 'Retired'))
  const q = query.trim().toLowerCase()
  if (!q) return treeOrder(pool, index).slice(0, limit)
  const qWords = words(q)
  return pool
    .flatMap((it) => {
      const hay = `${it.title} ${it.id} ${lineageTitles(index, it).join(' ')}`.toLowerCase()
      return qWords.every((w) => hay.includes(w)) ? [{ it, r: rank(it, q, qWords) }] : []
    })
    .sort((a, b) => a.r - b.r || compareIds(a.it.id, b.it.id))
    .slice(0, limit)
    .map((x) => x.it)
}

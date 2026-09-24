/**
 * Next-ID assignment. IDs follow the parent's numbering at creation time
 * (`FT-nn.m` under `EP-nn`, `US-nn.m.k` under `FT-nn.m`, `US-nn.0.k` directly
 * under an epic) and never change afterwards, even if the item is reparented.
 */
import type { Item, ItemType } from './types.ts'

const pad = (n: number) => String(n).padStart(2, '0')

/** Highest trailing number among IDs that start with `prefix`. */
function maxUnder(ids: Iterable<string>, prefix: string): number {
  let max = 0
  for (const id of ids) {
    if (!id.startsWith(prefix)) continue
    const rest = id.slice(prefix.length)
    if (!/^\d+$/.test(rest)) continue
    max = Math.max(max, Number(rest))
  }
  return max
}

/**
 * `taken` is every ID already in use, including files that failed to parse,
 * so a new item can never land on (and overwrite) an existing file.
 */
export function nextItemId(taken: Iterable<string>, type: ItemType, parent: Item | null): string {
  const ids = [...taken]
  if (type === 'epic') return `EP-${pad(maxUnder(ids, 'EP-') + 1)}`
  if (!parent) throw new Error(`a ${type} needs a parent`)
  if (type === 'feature') {
    if (parent.type !== 'epic') throw new Error('a feature goes under an epic')
    const nn = parent.id.slice(3)
    return `FT-${nn}.${maxUnder(ids, `FT-${nn}.`) + 1}`
  }
  if (parent.type === 'story') throw new Error('a story goes under a feature or an epic')
  const stem = parent.type === 'epic' ? `${parent.id.slice(3)}.0` : parent.id.slice(3)
  return `US-${stem}.${maxUnder(ids, `US-${stem}.`) + 1}`
}

export function nextQuestionId(taken: Iterable<string>): string {
  return `OQ-${pad(maxUnder(taken, 'OQ-') + 1)}`
}

/** Natural compare for catalogue IDs: FT-01.10 sorts after FT-01.9. */
export function compareIds(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true })
}

/** Sibling order: explicit `order`, then ID. */
export function compareSiblings(a: Item, b: Item): number {
  return a.order - b.order || compareIds(a.id, b.id)
}

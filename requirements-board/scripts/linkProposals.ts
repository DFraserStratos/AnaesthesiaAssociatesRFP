/**
 * Apply link proposals (from the `link-requirements` workflow, or written by hand) to catalogue
 * items: pure, so `apply-links.ts` and the tests share it. Each proposal is checked again here,
 * whatever the agents said, and skipped with a reason when it no longer fits the text.
 * An inline proposal's `occurrence` counts in the field as the agents read it: before any proposal of
 * the same run was applied, outside links and code. All of a field's links are placed on that text,
 * and an anchor overlapping one placed earlier in the run is skipped, never moved onto another word.
 */
import { codeRanges, maskCode } from '../shared/markdownCode.ts'
import { LINK_SOURCE, isQuestionId, isRecordId, itemLinkTargets } from '../shared/links.ts'
import { DEFAULT_CONFIG, type BoardConfig } from '../shared/config.ts'
import { isRetired } from '../shared/statuses.ts'
import type { Item, Question } from '../shared/types.ts'

export const LINK_FIELDS = ['description', 'acceptance', 'technical', 'notes'] as const
export type LinkField = (typeof LINK_FIELDS)[number]

export type Proposal =
  | { kind: 'inline'; item: string; field: LinkField; anchor: string; occurrence?: number; target: string; reason?: string }
  | { kind: 'related'; from: string; to: string; reason?: string }

export interface Outcome {
  proposal: Proposal
  /** Null when applied; otherwise why it was skipped. */
  skipped: string | null
}

/** Spans of `md` a new link must not overlap: code (the board's one rule, `shared/markdownCode.ts`) and existing links and images. */
function blockedRanges(md: string): [number, number][] {
  const out: [number, number][] = codeRanges(md).map(([s, e]): [number, number] => [s, e])
  // Links are found in the code-masked text, as the board finds them: brackets inside code are no link.
  for (const m of maskCode(md).matchAll(new RegExp(LINK_SOURCE, 'g'))) out.push([m.index, m.index + m[0].length])
  return out
}

const isWordChar = (c: string) => /[\p{L}\p{N}]/u.test(c)

/** Where `anchor` occurs as whole words outside links and code, in order. */
export function anchorPositions(md: string, anchor: string): number[] {
  if (!anchor) return []
  const blocked = blockedRanges(md)
  const out: number[] = []
  for (let at = md.indexOf(anchor); at >= 0; at = md.indexOf(anchor, at + 1)) {
    const end = at + anchor.length
    if (isWordChar(md.charAt(at - 1)) && isWordChar(anchor.charAt(0))) continue
    if (isWordChar(md.charAt(end)) && isWordChar(anchor.charAt(anchor.length - 1))) continue
    if (blocked.some(([f, t]) => at < t && end > f)) continue
    out.push(at)
  }
  return out
}

const linksTo = (md: string, id: string) => new RegExp(`\\]\\(\\s*${id.replace(/\./g, '\\.')}\\s*\\)`).test(md)

/** Apply every proposal it can, in order. Returns the changed items (copies) and what happened to each proposal. */
export function applyProposals(items: Item[], questions: Question[], proposals: Proposal[], config: BoardConfig = DEFAULT_CONFIG): { changed: Map<string, Item>; outcomes: Outcome[] } {
  const byId = new Map(items.map((i) => [i.id, i]))
  const qIds = new Set(questions.map((q) => q.id))
  const changed = new Map<string, Item>()
  const current = (id: string) => changed.get(id) ?? byId.get(id)
  const lineage = (id: string): Set<string> => {
    const out = new Set<string>()
    for (let p = byId.get(id)?.parent; p && !out.has(p); p = byId.get(p)?.parent) out.add(p)
    return out
  }
  const isFamily = (a: string, b: string) => lineage(a).has(b) || lineage(b).has(a)
  const liveItem = (id: string) => {
    const it = byId.get(id)
    return it && !isRetired(config, it) ? it : undefined
  }

  // The links this run places, per item and field, at offsets in the field's original text.
  const placed = new Map<string, { at: number; end: number; anchor: string; target: string }[]>()
  const outcomes: Outcome[] = []
  const skip = (proposal: Proposal, why: string) => outcomes.push({ proposal, skipped: why })

  for (const p of proposals) {
    if (p.kind === 'inline') {
      const it = current(p.item)
      if (!it || isRetired(config, it)) {
        skip(p, `${p.item} is not a live item`)
        continue
      }
      if (!LINK_FIELDS.includes(p.field)) {
        skip(p, `field "${p.field}" cannot hold links`)
        continue
      }
      if (!isRecordId(p.target) || (isQuestionId(p.target) ? !qIds.has(p.target) : !liveItem(p.target))) {
        skip(p, `target ${p.target} is not a live record`)
        continue
      }
      if (p.target === it.id || (!isQuestionId(p.target) && isFamily(it.id, p.target))) {
        skip(p, `target ${p.target} is the item itself, its lineage or one of its children`)
        continue
      }
      // Positions are found in the field as it was before this run, as the agents read it.
      const text = byId.get(it.id)![p.field]
      const key = `${it.id}\u0000${p.field}`
      const mine = placed.get(key) ?? []
      if (linksTo(text, p.target) || mine.some((x) => x.target === p.target)) {
        skip(p, `the ${p.field} already links to ${p.target}`)
        continue
      }
      const at = anchorPositions(text, p.anchor)[(p.occurrence ?? 1) - 1]
      if (at === undefined) {
        skip(p, `"${p.anchor}" (occurrence ${p.occurrence ?? 1}) is not in the ${p.field} outside links and code`)
        continue
      }
      const end = at + p.anchor.length
      const clash = mine.find((x) => at < x.end && end > x.at)
      if (clash) {
        skip(p, `"${p.anchor}" (occurrence ${p.occurrence ?? 1}) overlaps "${clash.anchor}", linked to ${clash.target} by an earlier proposal`)
        continue
      }
      mine.push({ at, end, anchor: p.anchor, target: p.target })
      placed.set(key, mine)
      // Splice every link of this field into the original text, from the end so earlier offsets hold.
      let next = text
      for (const x of [...mine].sort((a, b) => b.at - a.at)) next = next.slice(0, x.at) + `[${x.anchor}](${x.target})` + next.slice(x.end)
      changed.set(it.id, { ...current(it.id)!, [p.field]: next })
      outcomes.push({ proposal: p, skipped: null })
    } else {
      const from = current(p.from)
      if (!from || isRetired(config, from) || !liveItem(p.to)) {
        skip(p, `${p.from} and ${p.to} must both be live items`)
        continue
      }
      if (p.from === p.to || isFamily(p.from, p.to)) {
        skip(p, 'an item is not related to itself, its lineage or its children')
        continue
      }
      const other = current(p.to)!
      if (from.related.includes(p.to) || other.related.includes(p.from)) {
        skip(p, 'already related')
        continue
      }
      // The sheet already lists a card whose text links to this one, under Related.
      if (itemLinkTargets(from).includes(p.to) || itemLinkTargets(other).includes(p.from)) {
        skip(p, 'the text already links them')
        continue
      }
      changed.set(from.id, { ...from, related: [...from.related, p.to] })
      outcomes.push({ proposal: p, skipped: null })
    }
  }
  return { changed, outcomes }
}

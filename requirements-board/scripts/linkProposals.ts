/**
 * Apply link proposals (from the `link-requirements` workflow, or written by hand) to catalogue
 * items: pure, so `apply-links.ts` and the tests share it. Each proposal is checked again here,
 * whatever the agents said, and skipped with a reason when it no longer fits the text.
 */
import { isQuestionId, isRecordId, itemLinkTargets } from '../shared/links.ts'
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

/** Spans of `md` a new link must not overlap: existing links, code spans and fenced blocks. */
function blockedRanges(md: string): [number, number][] {
  const out: [number, number][] = []
  for (const re of [/^(```|~~~)[^\n]*\n[\s\S]*?(?:^\1[^\n]*$|(?![\s\S]))/gm, /(`+)[\s\S]*?\1/g, /!?\[[^\]]*\]\([^)]*\)/g]) {
    for (const m of md.matchAll(re)) out.push([m.index, m.index + m[0].length])
  }
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
export function applyProposals(items: Item[], questions: Question[], proposals: Proposal[]): { changed: Map<string, Item>; outcomes: Outcome[] } {
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
    return it && it.status !== 'Retired' ? it : undefined
  }

  const outcomes: Outcome[] = []
  const skip = (proposal: Proposal, why: string) => outcomes.push({ proposal, skipped: why })

  for (const p of proposals) {
    if (p.kind === 'inline') {
      const it = current(p.item)
      if (!it || it.status === 'Retired') {
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
      const text = it[p.field]
      if (linksTo(text, p.target)) {
        skip(p, `the ${p.field} already links to ${p.target}`)
        continue
      }
      const at = anchorPositions(text, p.anchor)[(p.occurrence ?? 1) - 1]
      if (at === undefined) {
        skip(p, `"${p.anchor}" (occurrence ${p.occurrence ?? 1}) is not in the ${p.field} outside links and code`)
        continue
      }
      const next = text.slice(0, at) + `[${p.anchor}](${p.target})` + text.slice(at + p.anchor.length)
      changed.set(it.id, { ...it, [p.field]: next })
      outcomes.push({ proposal: p, skipped: null })
    } else {
      const from = current(p.from)
      if (!from || from.status === 'Retired' || !liveItem(p.to)) {
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

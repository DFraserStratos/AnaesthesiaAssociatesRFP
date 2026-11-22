/**
 * Deleting an item (pure): what goes and what else has to change so nothing is left pointing at it.
 * Shared by the dev server, which applies the plan, and the item sheet, which shows it before asking.
 *
 * An item takes everything under it with it. Every other record keeps its place: a `related` or
 * `affects` entry naming a deleted item is dropped, and a `[text](ID)` link to one becomes its plain
 * text (links inside code never counted, so they are left alone). A bare ID in running text stays,
 * as history; the check warns about it rather than blocking.
 */
import { compareIds } from './ids.ts'
import { LINK_SOURCE } from './links.ts'
import { maskCode } from './markdownCode.ts'
import type { Item, Question } from './types.ts'

export interface DeletePlan {
  /** The item and everything under it, deepest first (the order the files are removed in). */
  doomed: Item[]
  /** Other items rewritten to drop their references to the doomed ones. */
  items: Item[]
  questions: Question[]
}

/** Every item under `id`, not including it. */
export function descendantsOf(items: Item[], id: string): Item[] {
  const kids = new Map<string, Item[]>()
  for (const it of items) if (it.parent) (kids.get(it.parent) ?? kids.set(it.parent, []).get(it.parent)!).push(it)
  const out: Item[] = []
  // Seeded with the start: in a parent cycle (a self-parent included) the walk comes back round to
  // it, and it must never count as its own descendant (FINDINGS R-53). A cycle is the check's to name.
  const seen = new Set([id])
  const walk = (at: string) => {
    for (const k of kids.get(at) ?? []) {
      if (seen.has(k.id)) continue
      seen.add(k.id)
      out.push(k)
      walk(k.id)
    }
  }
  walk(id)
  return out
}

const LINK = new RegExp(LINK_SOURCE, 'gd')

/**
 * `[text](ID)` becomes `text` for every ID in `gone`, outside code: links are found in the text with
 * its code masked (`maskCode`, the same rule and the same link pattern as `mentions`), then the
 * link's own words are kept as written, code and all. So whatever the check would count as a link to
 * a gone item is rewritten (FINDINGS R-60). An image is not a link and stays.
 */
export function unlink(md: string, gone: Set<string>): string {
  if (!md) return md
  let out = ''
  let at = 0
  for (const m of maskCode(md).matchAll(LINK)) {
    if (m[1] || !gone.has(m[3]!.trim())) continue
    const [from, to] = m.indices![2]!
    out += md.slice(at, m.index) + md.slice(from, to)
    at = m.index + m[0].length
  }
  return out + md.slice(at)
}

export function planDelete(items: Item[], questions: Question[], id: string): DeletePlan {
  const root = items.find((i) => i.id === id)
  if (!root) return { doomed: [], items: [], questions: [] }
  const doomed = [root, ...descendantsOf(items, id)]
  const gone = new Set(doomed.map((i) => i.id))
  const depth = (it: Item) => it.id.split('.').length
  doomed.sort((a, b) => depth(b) - depth(a) || compareIds(a.id, b.id))

  const rewritten: Item[] = []
  for (const it of items) {
    if (gone.has(it.id)) continue
    const next: Item = {
      ...it,
      related: it.related.filter((r) => !gone.has(r)),
      description: unlink(it.description, gone),
      acceptance: unlink(it.acceptance, gone),
      technical: unlink(it.technical, gone),
      notes: unlink(it.notes, gone),
    }
    if (JSON.stringify(next) !== JSON.stringify(it)) rewritten.push(next)
  }
  const qs: Question[] = []
  for (const q of questions) {
    const next: Question = { ...q, affects: q.affects.filter((a) => !gone.has(a)), question: unlink(q.question, gone), answer: unlink(q.answer, gone) }
    if (JSON.stringify(next) !== JSON.stringify(q)) qs.push(next)
  }
  return { doomed, items: rewritten, questions: qs }
}

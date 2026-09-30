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
  for (const it of items) if (it.parent) kids.set(it.parent, [...(kids.get(it.parent) ?? []), it])
  const out: Item[] = []
  const walk = (at: string) => {
    for (const k of kids.get(at) ?? []) {
      if (out.includes(k)) continue // a parent cycle is the check's problem, not a reason to loop
      out.push(k)
      walk(k.id)
    }
  }
  walk(id)
  return out
}

const LINK = /(!?)\[([^\]]*)\]\(\s*([^)\s]*)[^)]*\)/g
const CODE = /^(```|~~~)[^\n]*\n[\s\S]*?(?:^\1[^\n]*$|(?![\s\S]))|(`+)[\s\S]*?\2/gm

/** `[text](ID)` becomes `text` for every ID in `gone`, outside code. */
export function unlink(md: string, gone: Set<string>): string {
  if (!md) return md
  const out: string[] = []
  let at = 0
  const prose = (s: string) => s.replace(LINK, (whole, bang: string, text: string, href: string) => (!bang && gone.has(href.trim()) ? text : whole))
  for (const m of md.matchAll(CODE)) {
    out.push(prose(md.slice(at, m.index)), m[0])
    at = m.index + m[0].length
  }
  out.push(prose(md.slice(at)))
  return out.join('')
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

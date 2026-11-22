/**
 * Edit a record file in place: a save changes only the lines that hold the fields it changes.
 *
 * Every other byte stays as the author wrote it: other keys and their order, quoting, flow or block
 * style, comments, keys the board does not know, values it cannot read, and the body sections the
 * change does not touch (an artifact's `## Source` is never touched). A changed key is written as the
 * board writes it (a flow list stays a flow list); a new key goes after the nearest key that comes
 * before it in the board's own order; a changed body section is replaced whole, in the board's form.
 * On a file already in the board's canonical form the result is exactly `serialise(next)`.
 *
 * The edit is checked by reading it back: the record must read as intended and every key it did not
 * change must read exactly as before. A file the splice cannot handle (a flow-mapping frontmatter,
 * anchors and aliases, keys not at the start of a line) falls back to the canonical form, but only when
 * that loses nothing it did not mean to change; otherwise `LossyEditError` says what would be lost, and
 * nothing is written.
 */
import { Document, isAlias, isMap, isScalar, isSeq, parse as parseYaml, parseDocument, visit } from 'yaml'
import { sameValue as same } from './patch.ts'
import {
  ANSWER_HEADING,
  ITEM_SECTIONS,
  SOURCE_HEADING,
  YAML_OPTIONS,
  artifactMeta,
  isHeading,
  itemMeta,
  parseArtifact,
  parseItem,
  parseQuestion,
  questionMeta,
  serialiseArtifact,
  serialiseItem,
  serialiseQuestion,
  tidyText,
} from './files.ts'
import type { Artifact, Item, Question } from './types.ts'

/** A requested change that cannot be written without losing something the change did not touch. */
export class LossyEditError extends Error {}

/** The splice cannot handle this file (not an error by itself: the canonical form may still be safe). */
class CannotSplice extends Error {}

interface Section<T> {
  heading: string
  /** The section's text in a record; null for a section the board never edits (an artifact's Source). */
  text: ((r: T) => string) | null
}
interface Kind<T> {
  parse: (text: string) => T
  serialise: (r: T) => string
  meta: (r: T) => Record<string, unknown>
  lead: (r: T) => string
  sections: Section<T>[]
  /** The record's body fields, and whether a file read tidies them (`tidyText`). */
  body: readonly [string, boolean][]
}

const ITEM: Kind<Item> = {
  parse: parseItem,
  serialise: serialiseItem,
  meta: itemMeta,
  lead: (r) => r.description,
  sections: ITEM_SECTIONS.map((s) => ({ heading: s.heading, text: (r: Item) => r[s.field] })),
  body: [['description', true], ...ITEM_SECTIONS.map((s): [string, boolean] => [s.field, true])],
}
const QUESTION: Kind<Question> = {
  parse: parseQuestion,
  serialise: serialiseQuestion,
  meta: questionMeta,
  lead: (r) => r.question,
  sections: [{ heading: ANSWER_HEADING, text: (r) => r.answer }],
  body: [
    ['question', true],
    ['answer', true],
  ],
}
const ARTIFACT: Kind<Artifact> = {
  parse: parseArtifact,
  serialise: serialiseArtifact,
  meta: artifactMeta,
  lead: (r) => r.description,
  sections: [{ heading: SOURCE_HEADING, text: null }],
  body: [
    ['description', true],
    ['source', false],
  ],
}

export const editItemText = (text: string, next: Item) => editText(ITEM, text, next)
export const editQuestionText = (text: string, next: Question) => editText(QUESTION, text, next)
export const editArtifactText = (text: string, next: Artifact) => editText(ARTIFACT, text, next)

/**
 * What `next` reads as once written: its frontmatter as the board writes it, read back, and its body
 * text as `next` holds it (tidied as a file read tidies it). The body is taken as is, not read back
 * from the canonical form, because a body that form would read differently (a heading repeated inside a
 * section) must stay as the author wrote it.
 */
function yardstick<T>(kind: Kind<T>, next: T): T {
  const want = { ...kind.parse(kind.serialise(next)) } as Record<string, unknown>
  for (const [key, tidy] of kind.body) {
    const text = String((next as Record<string, unknown>)[key] ?? '')
    want[key] = tidy ? tidyText(text) : text
  }
  return want as T
}

/**
 * `text` (no byte-order mark: `writeAtomic` keeps a file's own) with `next` written into it. Returns
 * `text` itself when `next` reads exactly as the file already does. Throws a `ParseError` when the file
 * cannot be read (the caller decides what to do), `LossyEditError` when the change cannot be written
 * safely.
 */
function editText<T>(kind: Kind<T>, text: string, next: T): string {
  const old = kind.parse(text)
  const want = yardstick(kind, next)
  if (same(old, want)) return text
  const oldMeta = kind.meta(old)
  const newMeta = kind.meta(want)
  const changed = new Set([...Object.keys(oldMeta), ...Object.keys(newMeta)].filter((k) => !same(oldMeta[k], newMeta[k])))
  for (const s of kind.sections) {
    if (!s.text && !same(sectionOf(old, s), sectionOf(want, s))) {
      throw new LossyEditError(`the board never edits the ${s.heading.replace(/^#+\s*/, '')} section`)
    }
  }

  let edited: string | null = null
  try {
    edited = splice(kind, text, old, want, newMeta, changed)
    if (losses(kind, text, edited, want, changed, true).length) edited = null // the splice is wrong: try the canonical form
  } catch (e) {
    if (!(e instanceof CannotSplice)) throw e
  }
  if (edited !== null) return edited

  // The canonical form, only when it loses nothing the change did not mean to change.
  const canonical = kind.serialise(next)
  const lost = losses(kind, text, canonical, want, changed, false)
  if (lost.length) throw new LossyEditError(`this change cannot be saved without losing ${lost.join(', ')}; edit the file by hand`)
  return canonical
}

const sectionOf = <T>(r: T, s: Section<T>) => (s.text ? s.text(r) : (r as { source?: string }).source ?? '')

/* ------------------------------------------------------------- the splice */

interface Parts {
  /** The opening fence line, with its line ending. */
  open: string
  yaml: string
  /** The closing fence line, with its line ending (if any). */
  close: string
  body: string
  eol: string
}

function partsOf(text: string): Parts {
  const open = /^---\r?\n/.exec(text)
  if (!open) throw new CannotSplice('no opening fence')
  const end = text.indexOf('\n---', 3) // as `splitFrontmatter` finds it
  if (end < 0) throw new CannotSplice('no closing fence')
  const yaml = text.slice(open[0].length, end + 1)
  const lineEnd = text.indexOf('\n', end + 1)
  const close = lineEnd < 0 ? text.slice(end + 1) : text.slice(end + 1, lineEnd + 1)
  const body = lineEnd < 0 ? '' : text.slice(lineEnd + 1)
  const crlf = (text.match(/\r\n/g) ?? []).length
  const lf = (text.match(/\n/g) ?? []).length
  return { open: open[0], yaml, close, body, eol: crlf > lf - crlf ? '\r\n' : '\n' }
}

function splice<T>(kind: Kind<T>, text: string, old: T, want: T, newMeta: Record<string, unknown>, changed: Set<string>): string {
  const p = partsOf(text)
  const yaml = changed.size ? spliceYaml(p.yaml, newMeta, changed, p.eol) : p.yaml
  return p.open + yaml + p.close + spliceBody(kind, p.body, old, want, p.eol)
}

interface Span {
  key: string
  /** Where the key starts (always a line start). */
  start: number
  /** Where the value's text ends (before a same-line comment). */
  valueEnd: number
  /** The start of the line after the pair. */
  end: number
  /** A flow list the author wrote (`[a, b]`; an empty `[]` is how the board writes any empty list). */
  flowSeq: boolean
}

function spans(yaml: string): Span[] {
  const doc = parseDocument(yaml)
  if (doc.errors.length) throw new CannotSplice('the frontmatter does not parse')
  if (doc.contents === null) return []
  if (!isMap(doc.contents) || doc.contents.flow) throw new CannotSplice('the frontmatter is not a block mapping')
  let shared = false
  visit(doc, {
    Alias() {
      shared = true
    },
    Node(_, n) {
      if ((n as { anchor?: string }).anchor) shared = true
    },
  })
  if (shared) throw new CannotSplice('the frontmatter uses anchors or aliases')
  const lineEnd = (at: number) => {
    if (at > 0 && yaml[at - 1] === '\n') return at
    const nl = yaml.indexOf('\n', at)
    return nl < 0 ? yaml.length : nl + 1
  }
  return doc.contents.items.map((pair) => {
    const k = pair.key
    if (!isScalar(k) || !k.range || isAlias(k)) throw new CannotSplice('a key is not plain text')
    const start = k.range[0]
    if (start > 0 && yaml[start - 1] !== '\n') throw new CannotSplice('a key does not start its line')
    const v = pair.value as { range?: [number, number, number] } | null
    // An empty value (`parent:   # none`) ends at its colon, so a comment after it stays on the line.
    const empty = isScalar(pair.value) && pair.value.value === null && !pair.value.source
    const valueEnd = empty ? yaml.indexOf(':', k.range[1]) + 1 : v?.range ? v.range[1] : k.range[1]
    return { key: String(k.value), start, valueEnd, end: lineEnd(valueEnd), flowSeq: isSeq(pair.value) && !!pair.value.flow && pair.value.items.length > 0 }
  })
}

/** One key as the board writes it (`key: value`, block lists indented), with a trailing line ending. */
function render(key: string, value: unknown, flowSeq: boolean, eol: string): string {
  const doc = new Document({ [key]: value })
  const node = isMap(doc.contents) ? doc.contents.items[0]?.value : null
  if (flowSeq && isSeq(node) && node.items.every((i) => isScalar(i))) node.flow = true
  const out = doc.toString(YAML_OPTIONS)
  return eol === '\n' ? out : out.replace(/\n/g, eol)
}

function spliceYaml(yaml: string, newMeta: Record<string, unknown>, changed: Set<string>, eol: string): string {
  const found = spans(yaml)
  const at = new Map(found.map((s) => [s.key, s]))
  if (at.size !== found.length) throw new CannotSplice('a key appears twice')
  const edits: { from: number; to: number; text: string; order: number }[] = []
  const order = Object.keys(newMeta)
  for (const key of changed) {
    const span = at.get(key)
    if (!span) continue
    if (!(key in newMeta)) {
      edits.push({ from: span.start, to: span.end, text: '', order: 0 })
      continue
    }
    const text = render(key, newMeta[key], span.flowSeq, eol)
    const oneLine = !yaml.slice(span.start, span.valueEnd).includes('\n') && text.indexOf('\n') === text.length - 1
    // A one-line value keeps a comment after it on the same line.
    if (oneLine) edits.push({ from: span.start, to: span.valueEnd, text: text.replace(/\r?\n$/, ''), order: 0 })
    else edits.push({ from: span.start, to: span.end, text, order: 0 })
  }
  // New keys: after the nearest key that comes before them in the board's order (else first).
  order.forEach((key, i) => {
    if (!changed.has(key) || at.has(key)) return
    let pos = found.length ? found[0]!.start : yaml.length
    for (let j = i - 1; j >= 0; j--) {
      const before = at.get(order[j]!)
      if (before) {
        pos = before.end
        break
      }
    }
    let text = render(key, newMeta[key], false, eol)
    // A last line with no line ending (only at the very end of the frontmatter) needs one first.
    if (pos === yaml.length && yaml && !yaml.endsWith('\n')) text = eol + text
    edits.push({ from: pos, to: pos, text, order: i + 1 })
  })
  // Apply from the end. At one spot, a replacement goes first (an insert there lands before it), then
  // the inserts, last first, so they read in the board's order.
  const isInsert = (e: { from: number; to: number }) => (e.from === e.to ? 1 : 0)
  edits.sort((a, b) => b.from - a.from || isInsert(a) - isInsert(b) || b.order - a.order)
  let out = yaml
  for (const e of edits) out = out.slice(0, e.from) + e.text + out.slice(e.to)
  return out
}

interface Block {
  /** null for the lead (the text before the first known heading). */
  heading: string | null
  text: string
  /** Rewritten or new: written in the board's form. */
  fresh?: true
}

function spliceBody<T>(kind: Kind<T>, body: string, old: T, want: T, eol: string): string {
  const headings = kind.sections.map((s) => s.heading)
  const blocks = rebuildBlocks(body, headings)
  const wasLast = blocks.at(-1)!
  const leadNow = kind.lead(want)
  let touched = false
  if (kind.lead(old) !== leadNow) {
    blocks[0] = { heading: null, text: leadNow ? `${eol}${leadNow.replace(/\n/g, eol)}${eol}${eol}` : eol, fresh: true }
    touched = true
  }
  kind.sections.forEach((s, i) => {
    if (!s.text) return
    const was = s.text(old)
    const now = s.text(want)
    if (was === now) return
    touched = true
    const at = blocks.findIndex((b) => b.heading === s.heading)
    const fresh: Block = { heading: s.heading, text: `${s.heading}${eol}${eol}${now.replace(/\n/g, eol)}${eol}${eol}`, fresh: true }
    if (!now) {
      if (at >= 0) blocks.splice(at, 1)
      return
    }
    if (at >= 0) {
      blocks[at] = fresh
      return
    }
    // A new section goes after the nearest section that comes before it in the board's order.
    let pos = 1
    for (let j = i - 1; j >= 0; j--) {
      const before = blocks.findIndex((b) => b.heading === kind.sections[j]!.heading)
      if (before >= 0) {
        pos = before + 1
        break
      }
    }
    blocks.splice(pos, 0, fresh)
  })
  if (!touched) return body
  let out = ''
  for (const b of blocks) {
    // A rewritten or new block starts after a blank line.
    if (b.fresh && b.heading && out) {
      const trailing = /(?:\r?\n)*$/.exec(out)![0].split('\n').length - 1
      if (trailing < 2) out += eol.repeat(2 - trailing)
    }
    out += b.text
  }
  // The end changed: the file ends with exactly one line ending, as the board writes it.
  if (blocks.at(-1) !== wasLast || wasLast.fresh) out = out.replace(/(?:\r?\n)+$/, '') + eol
  return out
}

/** The body as blocks, each holding its own text (heading line included) up to the next known heading. */
function rebuildBlocks(body: string, headings: string[]): Block[] {
  const out: Block[] = [{ heading: null, text: '' }]
  const seen = new Set<string>()
  let pos = 0
  while (pos <= body.length) {
    const nl = body.indexOf('\n', pos)
    const end = nl < 0 ? body.length : nl + 1
    const line = body.slice(pos, nl < 0 ? body.length : nl)
    const h = headings.find((x) => isHeading(line, x) && !seen.has(x))
    if (h) {
      seen.add(h)
      out.push({ heading: h, text: '' })
    }
    out.at(-1)!.text += body.slice(pos, end)
    if (nl < 0) break
    pos = end
  }
  return out
}

/* ------------------------------------------------------- reading it back */

const rawMeta = (text: string): Record<string, unknown> => {
  try {
    const p = partsOf(text)
    const v = parseYaml(p.yaml.replace(/\r\n/g, '\n'))
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/**
 * What `after` lost or changed against `before` that the change did not mean to: it must read as `want`;
 * every key it did not change must read as before (`strict`: and no other key may appear; the canonical
 * form may add a key the board always writes, such as an empty `components`); a section the board never
 * edits must come through byte for byte.
 */
function losses<T>(kind: Kind<T>, before: string, after: string, want: T, changed: Set<string>, strict: boolean): string[] {
  const out: string[] = []
  try {
    if (!same(kind.parse(after), want)) out.push('the text as written')
  } catch {
    return ['the whole file']
  }
  const a = rawMeta(before)
  const b = rawMeta(after)
  for (const k of Object.keys(a)) if (!changed.has(k) && !same(a[k], b[k])) out.push(`"${k}"`)
  if (strict) for (const k of Object.keys(b)) if (!changed.has(k) && !(k in a)) out.push(`"${k}"`)
  for (const s of kind.sections.filter((x) => !x.text)) {
    const was = rebuildBlocks(partsOrEmpty(before), [s.heading]).find((x) => x.heading)?.text.replace(/(?:\r?\n)+$/, '')
    const now = rebuildBlocks(partsOrEmpty(after), [s.heading]).find((x) => x.heading)?.text.replace(/(?:\r?\n)+$/, '')
    if (was !== now) out.push(`the ${s.heading.replace(/^#+\s*/, '')} section as written`)
  }
  return out
}

const partsOrEmpty = (text: string) => {
  try {
    return partsOf(text).body
  } catch {
    return ''
  }
}

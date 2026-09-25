/**
 * Parse and serialise catalogue files: YAML frontmatter + Markdown body.
 *
 * Serialisation is deterministic (fixed key order, no line folding) so an edit
 * to one field produces a one-line diff, and parse(serialise(x)) === x for any
 * record that `roundTripProblems` passes.
 */
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { ImageApp, ImageRef, Item, ItemStatus, ItemType, Question, QuestionKind, QuestionStatus, Viewport } from './types.ts'

const FENCE = '---'
export const ITEM_KEYS = ['id', 'type', 'parent', 'title', 'status', 'components', 'sources', 'order', 'images']
export const QUESTION_KEYS = ['id', 'kind', 'title', 'status', 'owner', 'affects', 'sources']
export const NOTES_HEADING = '## Notes'
export const ANSWER_HEADING = '## Answer'

export class ParseError extends Error {}

function splitFrontmatter(text: string): { yamlText: string; meta: Record<string, unknown>; body: string } {
  const normalised = text.replace(/\r\n/g, '\n')
  if (!normalised.startsWith(FENCE + '\n')) throw new ParseError('file must start with a --- frontmatter fence')
  const end = normalised.indexOf('\n' + FENCE, FENCE.length)
  if (end < 0) throw new ParseError('frontmatter has no closing --- fence')
  const yamlText = normalised.slice(FENCE.length + 1, end + 1)
  const afterFence = normalised.slice(end + 1 + FENCE.length)
  let meta: unknown
  try {
    meta = parseYaml(yamlText)
  } catch (e) {
    throw new ParseError(`frontmatter is not valid YAML: ${(e as Error).message.split('\n')[0]}`)
  }
  if (meta === null || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new ParseError('frontmatter must be a YAML mapping')
  }
  return { yamlText, meta: meta as Record<string, unknown>, body: afterFence.replace(/^[^\n]*\n?/, '') }
}

/** Drop leading blank lines and trailing whitespace, but keep a first line's indent (code blocks). */
export const tidyText = (s: string) => s.replace(/^(?:[ \t]*\n)+/, '').trimEnd()

const isHeading = (line: string, heading: string) => line.trimEnd() === heading

/** Split a body at a level-2 heading: text before, text after. */
function splitSection(body: string, heading: string): [string, string] {
  const lines = body.split('\n')
  const at = lines.findIndex((l) => isHeading(l, heading))
  if (at < 0) return [tidyText(body), '']
  return [tidyText(lines.slice(0, at).join('\n')), tidyText(lines.slice(at + 1).join('\n'))]
}

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
const strList = (v: unknown): string[] => {
  if (v === null || v === undefined || v === '') return []
  return (Array.isArray(v) ? v : [v]).map(str).filter((s) => s.length > 0)
}
function pickExtra(meta: Record<string, unknown>, known: string[]): Record<string, unknown> {
  const extra: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(meta ?? {})) if (!known.includes(k)) extra[k] = v
  return extra
}

/** Images keep a mistyped viewport as-is, so `check` can flag it instead of it silently becoming desktop. */
function images(v: unknown): ImageRef[] {
  if (v === null || v === undefined || v === '') return []
  return (Array.isArray(v) ? v : [v]).map((raw) => {
    if (typeof raw === 'string') return { src: raw, viewport: 'desktop' as const }
    const o = (raw ?? {}) as Record<string, unknown>
    const img: ImageRef = { src: str(o.src), viewport: (o.viewport === undefined ? 'desktop' : str(o.viewport)) as Viewport }
    if (o.app) img.app = str(o.app) as ImageApp
    if (o.caption) img.caption = str(o.caption)
    return img
  })
}

/** Coerce any object (a parsed frontmatter mapping, or an API request body) into a well-formed Item. */
export function toItem(meta: Record<string, unknown>, description: unknown = '', notes: unknown = ''): Item {
  const order = Number(meta.order)
  return {
    id: str(meta.id),
    type: str(meta.type) as ItemType,
    parent: meta.parent ? str(meta.parent) : null,
    title: str(meta.title),
    status: str(meta.status) as ItemStatus,
    components: strList(meta.components),
    sources: strList(meta.sources),
    order: Number.isFinite(order) ? order : 0,
    images: images(meta.images),
    description: str(description),
    notes: str(notes),
    extra: pickExtra((meta.extra as Record<string, unknown>) ?? {}, ITEM_KEYS),
  }
}

export function toQuestion(meta: Record<string, unknown>, question: unknown = '', answer: unknown = ''): Question {
  return {
    id: str(meta.id),
    // A file with no kind is a plain question (every file written before kinds existed).
    kind: (str(meta.kind) || 'question') as QuestionKind,
    title: str(meta.title),
    status: str(meta.status) as QuestionStatus,
    owner: str(meta.owner),
    affects: strList(meta.affects),
    sources: strList(meta.sources),
    question: str(question),
    answer: str(answer),
    extra: pickExtra((meta.extra as Record<string, unknown>) ?? {}, QUESTION_KEYS),
  }
}

/** Normalise an untrusted record (e.g. a PUT body) through the same coercions a file read uses. */
export function normaliseItem(raw: unknown): Item {
  const o = (raw ?? {}) as Record<string, unknown>
  return toItem(o, o.description, o.notes)
}
export function normaliseQuestion(raw: unknown): Question {
  const o = (raw ?? {}) as Record<string, unknown>
  return toQuestion(o, o.question, o.answer)
}

export function parseItem(text: string): Item {
  const { meta, body } = splitFrontmatter(text)
  const [description, notes] = splitSection(body, NOTES_HEADING)
  return toItem({ ...meta, extra: pickExtra(meta, ITEM_KEYS) }, description, notes)
}

export function parseQuestion(text: string): Question {
  const { meta, body } = splitFrontmatter(text)
  const [question, answer] = splitSection(body, ANSWER_HEADING)
  return toQuestion({ ...meta, extra: pickExtra(meta, QUESTION_KEYS) }, question, answer)
}

/**
 * Frontmatter pitfalls that parse "successfully" but lose data: an unquoted
 * ` #` starts a YAML comment, and bare numbers or booleans get coerced
 * (`1.10` becomes 1.1). Returned as human-readable warnings.
 */
export function lintFrontmatter(text: string): string[] {
  let parts
  try {
    parts = splitFrontmatter(text)
  } catch {
    return []
  }
  const out: string[] = []
  for (const line of parts.yamlText.split('\n')) {
    const value = line.replace(/^\s*(?:-\s+|[\w-]+:\s*)/, '')
    if (/^["']/.test(value)) continue
    if (/(^|\s)#/.test(value)) out.push(`unquoted "#" in \`${line.trim()}\` starts a YAML comment, so the rest is dropped; quote the value`)
  }
  for (const key of ['title', 'owner']) {
    const v = parts.meta[key]
    if (v !== undefined && v !== null && typeof v !== 'string') out.push(`${key} was read as a ${typeof v} (${String(v)}); quote it to keep it exactly`)
  }
  for (const key of ['sources', 'affects', 'components']) {
    const v = parts.meta[key]
    if (Array.isArray(v) && v.some((x) => typeof x !== 'string')) out.push(`${key} has an entry read as a number or boolean; quote it`)
  }
  return out
}

function yamlBlock(meta: Record<string, unknown>): string {
  return stringifyYaml(meta, { lineWidth: 0, flowCollectionPadding: false })
}

function assemble(meta: Record<string, unknown>, sections: [string | null, string][]): string {
  const parts = [FENCE + '\n' + yamlBlock(meta) + FENCE, '']
  for (const [heading, text] of sections) {
    const t = tidyText(text)
    if (!t) continue
    if (heading !== null) parts.push(heading, '')
    parts.push(t, '')
  }
  return parts.join('\n')
}

/** Known keys always win: `extra` can add fields but never override one this tool validates. */
const withExtra = (meta: Record<string, unknown>, extra: Record<string, unknown>, known: string[]) => {
  for (const [k, v] of Object.entries(extra ?? {})) if (!known.includes(k)) meta[k] = v
  return meta
}

export function serialiseItem(item: Item): string {
  const meta: Record<string, unknown> = { id: item.id, type: item.type }
  if (item.parent) meta.parent = item.parent
  meta.title = item.title
  meta.status = item.status
  meta.components = item.components
  meta.sources = item.sources
  meta.order = item.order
  meta.images = item.images.map((i) => {
    const img: Record<string, unknown> = { src: i.src, viewport: i.viewport }
    if (i.app) img.app = i.app
    if (i.caption) img.caption = i.caption
    return img
  })
  withExtra(meta, item.extra, ITEM_KEYS)
  return assemble(meta, [
    [null, item.description],
    [NOTES_HEADING, item.notes],
  ])
}

export function serialiseQuestion(q: Question): string {
  const meta: Record<string, unknown> = {
    id: q.id,
    kind: q.kind,
    title: q.title,
    status: q.status,
    owner: q.owner,
    affects: q.affects,
    sources: q.sources,
  }
  withExtra(meta, q.extra, QUESTION_KEYS)
  return assemble(meta, [
    [null, q.question],
    [ANSWER_HEADING, q.answer],
  ])
}

/** Why a record would not survive being written and read back, or [] if it would. */
export function itemRoundTripProblems(item: Item): string[] {
  const out: string[] = []
  if (item.description.split('\n').some((l) => isHeading(l, NOTES_HEADING))) {
    out.push(`the description cannot contain a "${NOTES_HEADING}" line; that heading starts the Notes section`)
  }
  return out
}
export function questionRoundTripProblems(q: Question): string[] {
  const out: string[] = []
  if (q.question.split('\n').some((l) => isHeading(l, ANSWER_HEADING))) {
    out.push(`the question cannot contain a "${ANSWER_HEADING}" line; that heading starts the Answer section`)
  }
  return out
}

/** Short content hash used as a file revision. FNV-1a, so it runs in the browser and Node alike. */
export function revOf(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0') + '-' + text.length.toString(36)
}

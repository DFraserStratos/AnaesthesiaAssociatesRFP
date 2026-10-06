/**
 * Parse and serialise catalogue files: YAML frontmatter + Markdown body.
 *
 * Serialisation is deterministic (fixed key order, no line folding) so an edit
 * to one field produces a one-line diff, and parse(serialise(x)) === x for any
 * record that `roundTripProblems` passes.
 */
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { Artifact, ArtifactKind, ArtifactStatus, Box, ImageApp, ImageRef, Item, ItemStatus, ItemType, Question, QuestionKind, QuestionStatus, Region, Viewport } from './types.ts'

const FENCE = '---'
export const ITEM_KEYS = ['id', 'type', 'parent', 'title', 'status', 'components', 'sources', 'order', 'swimlane', 'related', 'artifacts', 'images']
export const QUESTION_KEYS = ['id', 'kind', 'title', 'status', 'owner', 'affects', 'sources']
export const ACCEPTANCE_HEADING = '## Acceptance criteria'
export const TECHNICAL_HEADING = '## Technical discussion'
export const NOTES_HEADING = '## Notes'
/** An item body's level-2 sections after the description, in the order they are written. */
const ITEM_SECTIONS = [
  { heading: ACCEPTANCE_HEADING, field: 'acceptance', label: 'Acceptance criteria' },
  { heading: TECHNICAL_HEADING, field: 'technical', label: 'Technical discussion' },
  { heading: NOTES_HEADING, field: 'notes', label: 'Notes' },
] as const
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

/**
 * Split a body at any of several level-2 headings: the text before the first
 * is the lead, and each heading's text runs to the next known heading. Headings
 * may appear in any order (hand edits); the first occurrence of each wins, so a
 * repeated heading stays inside the earlier section's text.
 */
function splitSections(body: string, headings: readonly string[]): { lead: string; sections: Record<string, string> } {
  const lines = body.split('\n')
  const sections: Record<string, string> = {}
  for (const h of headings) sections[h] = ''
  const seen = new Set<string>()
  let current: string | null = null
  let buf: string[] = []
  let lead = ''
  const flush = () => {
    if (current === null) lead = tidyText(buf.join('\n'))
    else sections[current] = tidyText(buf.join('\n'))
  }
  for (const line of lines) {
    const h = headings.find((x) => isHeading(line, x) && !seen.has(x))
    if (h) {
      flush()
      seen.add(h)
      current = h
      buf = []
    } else buf.push(line)
  }
  flush()
  return { lead, sections }
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
export function toItem(
  meta: Record<string, unknown>,
  description: unknown = '',
  acceptance: unknown = '',
  technical: unknown = '',
  notes: unknown = '',
): Item {
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
    swimlane: meta.swimlane === null || meta.swimlane === undefined || str(meta.swimlane).trim() === '' ? null : str(meta.swimlane).trim(),
    related: strList(meta.related).map((r) => r.trim()),
    artifacts: strList(meta.artifacts).map((r) => r.trim()),
    images: images(meta.images),
    description: str(description),
    acceptance: str(acceptance),
    technical: str(technical),
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
  return toItem(o, o.description, o.acceptance, o.technical, o.notes)
}
export function normaliseQuestion(raw: unknown): Question {
  const o = (raw ?? {}) as Record<string, unknown>
  return toQuestion(o, o.question, o.answer)
}

export function parseItem(text: string): Item {
  const { meta, body } = splitFrontmatter(text)
  const { lead, sections } = splitSections(body, ITEM_SECTIONS.map((s) => s.heading))
  return toItem(
    { ...meta, extra: pickExtra(meta, ITEM_KEYS) },
    lead,
    sections[ACCEPTANCE_HEADING],
    sections[TECHNICAL_HEADING],
    sections[NOTES_HEADING],
  )
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
  for (const key of ['title', 'owner', 'swimlane']) {
    const v = parts.meta[key]
    if (v !== undefined && v !== null && typeof v !== 'string') out.push(`${key} was read as a ${typeof v} (${String(v)}); quote it to keep it exactly`)
  }
  for (const key of ['sources', 'affects', 'components']) {
    const v = parts.meta[key]
    if (Array.isArray(v) && v.some((x) => typeof x !== 'string')) out.push(`${key} has an entry read as a number or boolean; quote it`)
  }
  return out
}

const IMAGE_KEYS = ['src', 'viewport', 'app', 'caption']

/**
 * Item-specific pitfalls: things that parse but that the board would change
 * or refuse on its next save. Reported as warnings so `npm run check` sees
 * them before a save does.
 */
export function lintItem(text: string, item: Item): string[] {
  let meta: Record<string, unknown>
  try {
    meta = splitFrontmatter(text).meta
  } catch {
    return []
  }
  const out: string[] = []
  if (!Number.isFinite(Number(meta.order)) || meta.order === null || meta.order === undefined || meta.order === '') {
    out.push(`order is missing or not a number (${String(meta.order)}); it sorts as 0, and 0 is written back on the next save`)
  }
  for (const raw of Array.isArray(meta.images) ? meta.images : []) {
    if (!raw || typeof raw !== 'object') continue
    const unknown = Object.keys(raw).filter((k) => !IMAGE_KEYS.includes(k))
    if (unknown.length) out.push(`image ${str((raw as Record<string, unknown>).src)} has keys the board does not keep (${unknown.join(', ')}); they are dropped on the next save`)
  }
  for (const p of itemRoundTripProblems(item)) out.push(`the board cannot save this item until it is fixed: ${p}`)
  return out
}

export function lintQuestion(_text: string, q: Question): string[] {
  return questionRoundTripProblems(q).map((p) => `the board cannot save this question until it is fixed: ${p}`)
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
  if (item.swimlane) meta.swimlane = item.swimlane
  if (item.related.length) meta.related = item.related
  if (item.artifacts?.length) meta.artifacts = item.artifacts
  meta.images = item.images.map((i) => {
    const img: Record<string, unknown> = { src: i.src, viewport: i.viewport }
    if (i.app) img.app = i.app
    if (i.caption) img.caption = i.caption
    return img
  })
  withExtra(meta, item.extra, ITEM_KEYS)
  return assemble(meta, [
    [null, item.description],
    ...ITEM_SECTIONS.map((s): [string, string] => [s.heading, item[s.field]]),
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
  const texts = [{ label: 'description', text: item.description }, ...ITEM_SECTIONS.map((s) => ({ label: s.label, text: item[s.field] }))]
  for (const { label, text } of texts) {
    const lines = text.split('\n')
    for (const s of ITEM_SECTIONS) {
      if (lines.some((l) => isHeading(l, s.heading))) {
        out.push(`the ${label} cannot contain a "${s.heading}" line; that heading starts the ${s.label} section`)
      }
    }
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

/* -------------------------------------------------------------- artifacts */

export const ARTIFACT_KEYS = ['id', 'title', 'kind', 'status', 'superseded_by', 'date', 'author', 'components', 'sources', 'file', 'regions']
export const REGION_KEYS = ['id', 'name', 'around', 'box', 'page', 'pad', 'note']
export const SOURCE_HEADING = '## Source'

const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

/** A box keeps whatever it was given as four numbers (NaN where unreadable), so `check` can say what is wrong. */
function toBox(v: unknown): Box | null {
  if (v === null || v === undefined || v === '') return null
  const list = Array.isArray(v) ? v : String(v).split(/[\s,]+/)
  const nums = list.map((x) => Number(x))
  return [nums[0] ?? NaN, nums[1] ?? NaN, nums[2] ?? NaN, nums[3] ?? NaN]
}

export function toRegion(raw: unknown): Region {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    id: str(o.id).trim(),
    name: str(o.name).trim(),
    around: strList(o.around),
    box: toBox(o.box),
    page: numOrNull(o.page),
    pad: numOrNull(o.pad),
    note: str(o.note).trim(),
  }
}

/** The first fenced block in the Source section: the mermaid diagram. */
function mermaidOf(section: string): string {
  const m = /^(```|~~~)\s*mermaid[^\n]*\n([\s\S]*?)^\1\s*$/m.exec(section)
  return m ? m[2]!.replace(/\n$/, '') : ''
}

/** A date as written: YAML may read `2026-10-01` as a Date and `2021` as a number, so both come back to the text. */
const dateString = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : str(v).trim())

export function toArtifact(meta: Record<string, unknown>, description: unknown = '', source: unknown = ''): Artifact {
  return {
    id: str(meta.id),
    title: str(meta.title),
    kind: str(meta.kind) as ArtifactKind,
    status: (str(meta.status) || 'Current') as ArtifactStatus,
    supersededBy: meta.superseded_by ? str(meta.superseded_by).trim() : null,
    date: meta.date === null || meta.date === undefined || str(meta.date).trim() === '' ? null : dateString(meta.date),
    author: str(meta.author),
    components: strList(meta.components),
    sources: strList(meta.sources),
    file: meta.file ? str(meta.file).trim() : null,
    regions: (Array.isArray(meta.regions) ? meta.regions : []).map(toRegion),
    description: str(description),
    source: str(source),
    extra: pickExtra((meta.extra as Record<string, unknown>) ?? {}, ARTIFACT_KEYS),
  }
}

export function parseArtifact(text: string): Artifact {
  const { meta, body } = splitFrontmatter(text)
  const [description, sourceSection] = splitSection(body, SOURCE_HEADING)
  return toArtifact({ ...meta, extra: pickExtra(meta, ARTIFACT_KEYS) }, description, mermaidOf(sourceSection))
}

export function serialiseArtifact(a: Artifact): string {
  const meta: Record<string, unknown> = { id: a.id, title: a.title, kind: a.kind, status: a.status }
  if (a.supersededBy) meta.superseded_by = a.supersededBy
  if (a.date) meta.date = a.date
  if (a.author) meta.author = a.author
  meta.components = a.components
  meta.sources = a.sources
  if (a.file) meta.file = a.file
  if (a.regions.length) {
    meta.regions = a.regions.map((r) => {
      const o: Record<string, unknown> = { id: r.id, name: r.name }
      if (r.around.length) o.around = r.around
      if (r.box) o.box = r.box
      if (r.page !== null) o.page = r.page
      if (r.pad !== null) o.pad = r.pad
      if (r.note) o.note = r.note
      return o
    })
  }
  withExtra(meta, a.extra, ARTIFACT_KEYS)
  return assemble(meta, [
    [null, a.description],
    [SOURCE_HEADING, a.source ? '```mermaid\n' + a.source + '\n```' : ''],
  ])
}

/**
 * The facts about an artifact the board may change: its name, kind, status, date, author, area,
 * sources and description. Never its file, its regions, its mermaid source or its ID: agents
 * write those, and the board never makes or edits the artifact itself.
 */
export const ARTIFACT_EDITABLE = ['title', 'kind', 'status', 'supersededBy', 'date', 'author', 'components', 'sources', 'description'] as const
export type ArtifactDetails = Pick<Artifact, (typeof ARTIFACT_EDITABLE)[number]>

/**
 * The artifact on disk with an untrusted edit's details laid over it: only the editable fields
 * are taken, everything else stays as the file has it. Values are tidied as a file read would
 * (trimmed, an empty date unset), and `superseded_by` only stays on a Superseded artifact.
 */
export function withArtifactDetails(current: Artifact, raw: unknown): Artifact {
  const o = (raw ?? {}) as Record<string, unknown>
  const has = (k: string) => Object.prototype.hasOwnProperty.call(o, k)
  const next: Artifact = { ...current }
  if (has('title')) next.title = str(o.title).trim()
  if (has('kind')) next.kind = str(o.kind).trim() as ArtifactKind
  if (has('status')) next.status = (str(o.status).trim() || 'Current') as ArtifactStatus
  if (has('supersededBy')) next.supersededBy = str(o.supersededBy).trim() || null
  if (has('date')) next.date = str(o.date).trim() || null
  if (has('author')) next.author = str(o.author).trim()
  if (has('components')) next.components = strList(o.components)
  if (has('sources')) next.sources = strList(o.sources).map((s) => s.trim()).filter(Boolean)
  if (has('description')) next.description = tidyText(str(o.description))
  if (next.status !== 'Superseded') next.supersededBy = null
  return next
}

/** Why an artifact would not survive being written and read back, or [] if it would. */
export function artifactRoundTripProblems(a: Artifact): string[] {
  return a.description.split('\n').some((l) => isHeading(l, SOURCE_HEADING))
    ? [`the description cannot contain a "${SOURCE_HEADING}" line; that heading starts the diagram source`]
    : []
}

/** Sidecar pitfalls that parse but read wrongly: region keys the board ignores, a Source section with no diagram. */
export function lintArtifact(text: string, a: Artifact): string[] {
  let parts
  try {
    parts = splitFrontmatter(text)
  } catch {
    return []
  }
  const out: string[] = []
  const regions = parts.meta.regions
  if (regions !== undefined && !Array.isArray(regions)) out.push('regions is not a list, so it is ignored')
  for (const raw of Array.isArray(regions) ? regions : []) {
    if (!raw || typeof raw !== 'object') {
      out.push('a region is not a mapping (id, name, around or box), so it is ignored')
      continue
    }
    const unknown = Object.keys(raw).filter((k) => !REGION_KEYS.includes(k))
    if (unknown.length) out.push(`region ${str((raw as Record<string, unknown>).id)} has keys the board ignores (${unknown.join(', ')})`)
  }
  if (parts.body.split('\n').some((l) => isHeading(l, SOURCE_HEADING)) && !a.source) out.push(`the "${SOURCE_HEADING}" section has no \`\`\`mermaid block`)
  return out
}

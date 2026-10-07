/**
 * Sources to artifact spots. An item, question or artifact cites its evidence in `sources:` as a
 * plain string ("RFP p.27 · Billing Engine › Contract holders", "Notes 2026-10-01 · AA meeting with
 * Greg #16", "Q&A 2026-09-24 #2 #3"). This works out, live, which artifact and which spot in it a
 * string means, so the board can open it and `check` can say when one points at nothing. Nothing is
 * written into the files: the mapping lives in the artifacts themselves.
 *
 * - A note in `notes/` answers to `Notes <date> · <words>` when the words slug to its file name
 *   (`notes/<date>-<slug>.md`), with no entry needed.
 * - Any other artifact lists the prefixes it answers to in its sidecar's `cited_as`.
 *
 * After the prefix a source may give a page (`p.27`), numbered points (`#2 #3`) or lines
 * (`L27-33`), then any words after ` · ` or in brackets, which are only for the reader.
 *
 * Pure, so the check (Node) and the board (browser) agree; each feeds in what it knows of the
 * files (`SpotFacts`), and with no facts every spot is taken to exist.
 */
import { slugify } from './artifacts.ts'
import { isQuestionId } from './links.ts'
import { artifactFormat, isCanvasFormat, type Artifact, type ArtifactMeta, type Citation, type Heading, type NotePoint } from './types.ts'

/** What a file holds that spots are resolved against. Null fields are unknown. */
export interface SpotFacts {
  /** A PDF's page count. */
  pages: number | null
  headings: Heading[] | null
  points: NotePoint[] | null
  /** A Markdown document's line count. */
  lines: number | null
}

export const spotFactsOfMeta = (m: ArtifactMeta): SpotFacts => ({ pages: m.pages?.length ?? null, headings: m.headings, points: m.points, lines: m.lines })

/** One spot a source opens: a region ID (or the whole artifact), named for the reader. */
export interface SourceSpot {
  region: string | null
  /** "Page 27" (as printed), "Point 16", "Lines 27 to 33", a heading or region name; null for the whole artifact. */
  label: string | null
  /** A point's title, or the PDF page when the printed page runs behind it. */
  detail: string | null
  /** Why the spot can't be opened (it isn't in the file), or null. */
  problem: string | null
}

export type SourceResolution =
  | { kind: 'artifact'; id: string; spots: SourceSpot[]; prefix: string }
  | { kind: 'question'; id: string }
  /** Looks like a citation (it starts the way citations do) but matches no artifact. */
  | { kind: 'unresolved'; reason: string }
  /** Not a citation of anything the catalogue holds: a typed decision, a sketch, an audit. */
  | { kind: 'plain' }

interface Entry {
  prefix: string
  artifact: Artifact
  c: Citation
}

export interface SourceIndex {
  entries: Entry[]
  /** `<date>|<slug>` to the note artifact at `notes/<date>-<slug>.md`. */
  notes: Map<string, Artifact>
  /** First words citations start with, so a source like them that matches nothing is flagged. */
  heads: Set<string>
  byId: Map<string, Artifact>
  facts: (id: string) => SpotFacts | null
  /** Prefixes claimed by more than one artifact. */
  clashes: { prefix: string; ids: string[] }[]
}

const NOTE_FILE = /^notes\/(\d{4}-\d{2}-\d{2})-(.+)\.md$/
const NOTES = /^Notes (\d{4}-\d{2}-\d{2}) · (.+)$/
const firstWord = (s: string) => s.trim().split(/[\s:,(]/)[0]!.toLowerCase()

export function buildSourceIndex(artifacts: Artifact[], facts: (id: string) => SpotFacts | null = () => null): SourceIndex {
  const entries: Entry[] = []
  const notes = new Map<string, Artifact>()
  const heads = new Set<string>(['notes'])
  const owners = new Map<string, string[]>()
  for (const a of artifacts) {
    const m = a.file ? NOTE_FILE.exec(a.file) : null
    if (m) notes.set(`${m[1]}|${m[2]}`, a)
    for (const c of a.citedAs) {
      if (!c.as) continue
      entries.push({ prefix: c.as, artifact: a, c })
      heads.add(firstWord(c.as))
      owners.set(c.as, [...(owners.get(c.as) ?? []), a.id])
    }
  }
  entries.sort((x, y) => y.prefix.length - x.prefix.length)
  const clashes = [...owners].filter(([, ids]) => ids.length > 1).map(([prefix, ids]) => ({ prefix, ids }))
  return { entries, notes, heads, byId: new Map(artifacts.map((a) => [a.id, a])), facts, clashes }
}

/** What follows a prefix: an optional spot, then optional words for the reader. Null when it isn't that shape. */
interface Rest {
  page: number | null
  points: number[]
  lines: string | null
}
function parseRest(rest: string): Rest | null {
  const m = /^(?: p\.(\d+)(?:-\d+)?| ((?:#\d+ ?)+)| (L\d+(?:-L?\d+)?)(?![\w-]))?(.*)$/.exec(rest)
  if (!m) return null
  const tail = m[4]!
  if (tail && !/^\s*(?:·|\(|,|$)/.test(tail)) return null
  return {
    page: m[1] ? Number(m[1]) : null,
    points: m[2] ? m[2].trim().split(/\s+/).map((p) => Number(p.slice(1))) : [],
    lines: m[3] ? m[3].replace(/-L/, '-') : null,
  }
}

/** The lines a heading's section covers (its heading line to the line before the next heading at its depth or above). */
function sectionLines(headings: Heading[], slug: string, lines: number | null): { from: number; to: number } | null {
  const i = headings.findIndex((h) => h.slug === slug)
  if (i < 0) return null
  const h = headings[i]!
  const next = headings.slice(i + 1).find((x) => x.depth <= h.depth)
  return { from: h.line, to: next ? next.line - 1 : (lines ?? Number.MAX_SAFE_INTEGER) }
}

const linesRegion = (from: number, to: number) => (from === to ? `L${from}` : `L${from}-${to}`)

function spotsFor(index: SourceIndex, a: Artifact, c: Citation, rest: Rest): SourceSpot[] {
  const f = index.facts(a.id)
  const scope = c.within && f?.headings ? sectionLines(f.headings, c.within, f.lines) : null
  const under = c.within && f?.headings ? f.headings.find((h) => h.slug === c.within)?.text : null
  if (rest.page !== null) {
    const page = rest.page + (c.pageOffset ?? 0)
    const problem = f?.pages != null && (page < 1 || page > f.pages) ? `${a.id} has no page ${page}` : null
    // Named as printed (the page's own footer, and the source's words); the PDF page is the detail.
    return [{ region: `p${page}`, label: `Page ${rest.page}`, detail: c.pageOffset ? `PDF page ${page}` : null, problem }]
  }
  if (rest.points.length) {
    return rest.points.map((n) => {
      if (!f?.points) return { region: null, label: `Point ${n}`, detail: null, problem: null }
      const found = f.points.filter((p) => p.n === n && (!scope || (p.from > scope.from && p.from <= scope.to)))
      const p = found[0]
      if (!p) return { region: null, label: `Point ${n}`, detail: null, problem: `${a.id} has no point ${n}${under ? ` under "${under}"` : ''}` }
      const problem = found.length > 1 ? `${a.id} has more than one point ${n}${under ? ` under "${under}"` : ''}; cite it within a section` : null
      return { region: linesRegion(p.from, p.to), label: `Point ${n}`, detail: p.title || null, problem }
    })
  }
  if (rest.lines) {
    const [from, to = from] = rest.lines.slice(1).split('-').map(Number) as [number, number?]
    const problem = f?.lines != null && to > f.lines ? `${a.id} has no line ${to}` : null
    return [{ region: linesRegion(from, to), label: from === to ? `Line ${from}` : `Lines ${from} to ${to}`, detail: null, problem }]
  }
  if (c.spot) {
    const r = a.regions.find((x) => x.id === c.spot)
    return [{ region: c.spot, label: r?.name ?? f?.headings?.find((h) => h.slug === c.spot)?.text ?? null, detail: null, problem: null }]
  }
  if (c.within) return [{ region: c.within, label: under ?? null, detail: null, problem: null }]
  return [{ region: null, label: null, detail: null, problem: null }]
}

/** Does the region exist on this artifact (named, or a page, heading or line range of its file)? Unknown facts count as yes. */
function hasRegion(index: SourceIndex, a: Artifact, region: string): boolean {
  if (a.regions.some((r) => r.id === region)) return true
  // A drawing's only spots are its named regions.
  if (isCanvasFormat(artifactFormat(a))) return false
  const f = index.facts(a.id)
  if (!f) return true
  if (/^p\d+$/.test(region)) return f.pages != null && Number(region.slice(1)) <= f.pages
  if (/^L\d/.test(region)) return f.lines != null
  return !!f.headings?.some((h) => h.slug === region)
}

/** Superseded artifacts hand on to their replacement, keeping each spot the replacement also has. */
function latest(index: SourceIndex, a: Artifact, spots: SourceSpot[]): { a: Artifact; spots: SourceSpot[] } {
  const seen = new Set([a.id])
  let cur = a
  while (cur.status === 'Superseded' && cur.supersededBy && !seen.has(cur.supersededBy)) {
    const next = index.byId.get(cur.supersededBy)
    if (!next) break
    seen.add(next.id)
    spots = spots.map((s) => (s.region === null || hasRegion(index, next, s.region) ? s : { region: null, label: null, detail: null, problem: null }))
    cur = next
  }
  return { a: cur, spots }
}

/**
 * Which artifact and spots a source string cites. `self` is the record the source sits on: an
 * artifact's own source that names the artifact itself (a transcript's "Recording ...") is plain.
 */
export function resolveSource(index: SourceIndex, source: string, self?: string): SourceResolution {
  const s = source.trim()
  if (isQuestionId(s)) return { kind: 'question', id: s }

  let hit: { a: Artifact; c: Citation; prefix: string; rest: Rest } | null = null
  const note = NOTES.exec(s)
  if (note) {
    const words = note[2]!.split(/ (?=#\d|L\d|p\.\d|· |\()/)[0]!
    const a = index.notes.get(`${note[1]}|${slugify(words)}`)
    const rest = parseRest(note[2]!.slice(words.length))
    if (a && rest) hit = { a, c: { as: '', pageOffset: null, within: null, spot: null }, prefix: `Notes ${note[1]} · ${words}`, rest }
  }
  if (!hit) {
    for (const e of index.entries) {
      if (!s.startsWith(e.prefix)) continue
      const rest = parseRest(s.slice(e.prefix.length))
      if (rest) {
        hit = { a: e.artifact, c: e.c, prefix: e.prefix, rest }
        break
      }
    }
  }
  if (!hit) {
    if (!index.heads.has(firstWord(s))) return { kind: 'plain' }
    return { kind: 'unresolved', reason: note ? `no note notes/${note[1]}-${slugify(note[2]!.split(/ (?=#\d|L\d|· |\()/)[0]!)}.md` : 'matches no artifact' }
  }
  const { a, spots } = latest(index, hit.a, spotsFor(index, hit.a, hit.c, hit.rest))
  if (self && a.id === self) return { kind: 'plain' }
  return { kind: 'artifact', id: a.id, spots, prefix: hit.prefix }
}

/** The problems with an artifact's `cited_as` entries, for the check (errors: the sidecar is wrong). */
export function citationProblems(a: Artifact, f: SpotFacts | null, isPdf: boolean): string[] {
  const out: string[] = []
  for (const c of a.citedAs) {
    if (!c.as) {
      out.push('a cited_as entry has no "as"')
      continue
    }
    if (/^Notes \d{4}-\d{2}-\d{2} · /.test(c.as)) out.push(`cited_as "${c.as}": a note is cited by its file name already; drop the entry`)
    if (c.pageOffset !== null && (!Number.isInteger(c.pageOffset) || !isPdf)) out.push(`cited_as "${c.as}": page_offset is a whole number, for a PDF`)
    if (c.within && f?.headings && !f.headings.some((h) => h.slug === c.within)) out.push(`cited_as "${c.as}": within "${c.within}" is not a heading in ${a.id}`)
    if (c.spot && !a.regions.some((r) => r.id === c.spot) && f && !f.headings?.some((h) => h.slug === c.spot)) out.push(`cited_as "${c.as}": spot "${c.spot}" is not a region of ${a.id}`)
  }
  return out
}

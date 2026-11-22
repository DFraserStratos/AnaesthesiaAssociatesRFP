/**
 * Sources to artifact spots. An item, question or artifact cites its evidence in `sources:` as a
 * plain string ("RFP p.27 · Pricing Engine › Price list holders", "Notes 2026-10-01 · Client meeting with
 * Sam #16", "Q&A 2026-09-24 #2 #3"). This works out, live, which artifact and which spot in it a
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
import { stepOf } from './steps.ts'
import { artifactFormat, isCanvasFormat, linesOfRegionId, pageOfRegionId, type Artifact, type ArtifactMeta, type Citation, type Heading, type NotePoint } from './types.ts'

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
  /** Prefixes an artifact lists more than once (counted once; not a clash with itself). */
  repeats: { id: string; prefix: string }[]
}

const NOTE_FILE = /^notes\/(\d{4}-\d{2}-\d{2})-(.+)\.md$/
const NOTES = /^Notes (\d{4}-\d{2}-\d{2}) · (.+)$/
/** A source naming an outstanding item: its ID (as written, so a typo still warns), then perhaps words for the reader ("OQ-01 · answered by Sam"). */
const QUESTION_SOURCE = /^(OQ-[^\s,(·]+)/
const firstWord = (s: string) => s.trim().split(/[\s:,(]/)[0]!.toLowerCase()

export function buildSourceIndex(artifacts: Artifact[], facts: (id: string) => SpotFacts | null = () => null): SourceIndex {
  const entries: Entry[] = []
  const notes = new Map<string, Artifact>()
  const heads = new Set<string>(['notes'])
  const owners = new Map<string, string[]>()
  const repeats: SourceIndex['repeats'] = []
  for (const a of artifacts) {
    const m = a.file ? NOTE_FILE.exec(a.file) : null
    if (m) notes.set(`${m[1]}|${m[2]}`, a)
    for (const c of a.citedAs) {
      if (!c.as) continue
      const ids = owners.get(c.as) ?? []
      if (ids.includes(a.id)) {
        repeats.push({ id: a.id, prefix: c.as })
        continue
      }
      entries.push({ prefix: c.as, artifact: a, c })
      heads.add(firstWord(c.as))
      owners.set(c.as, [...ids, a.id])
    }
  }
  entries.sort((x, y) => y.prefix.length - x.prefix.length)
  const clashes = [...owners].filter(([, ids]) => ids.length > 1).map(([prefix, ids]) => ({ prefix, ids }))
  return { entries, notes, heads, byId: new Map(artifacts.map((a) => [a.id, a])), facts, clashes, repeats }
}

/** What follows a prefix: an optional spot, then optional words for the reader. Null when it isn't that shape. */
interface Rest {
  page: number | null
  points: number[]
  lines: string | null
}
/**
 * A points list is `#2 #3`, `#2#3` or `#2, #3` (accepted decision 18): every number written is a
 * point, and a comma followed by anything but another point starts the reader's words.
 */
function parseRest(rest: string): Rest | null {
  const m = /^(?: p\.(\d+)(?:-\d+)?| (#\d+(?:(?:,\s*|\s*)#\d+)*)| (L\d+(?:-L?\d+)?)(?![\w-]))?(.*)$/.exec(rest)
  if (!m) return null
  const tail = m[4]!
  if (tail && !/^\s*(?:·|\(|,|$)/.test(tail)) return null
  return {
    page: m[1] ? Number(m[1]) : null,
    points: m[2] ? [...m[2].matchAll(/#(\d+)/g)].map((p) => Number(p[1])) : [],
    lines: m[3] ? m[3].replace(/-L/, '-') : null,
  }
}

/**
 * A note cite's words and the rest: `Notes <date> · <words> <spot or reader words>`. The words run
 * to the first spot (`#n`, `Ln`, `p.n`) or reader words (` · `, a bracket). One split, used to
 * resolve the note and to name it when it does not resolve (FINDINGS R-81).
 */
export function noteWords(afterDate: string): { words: string; rest: string } {
  const words = afterDate.split(/ (?=#\d|L\d|p\.\d|· |\()/)[0]!
  return { words, rest: afterDate.slice(words.length) }
}

/**
 * Does spot `spot` exist on artifact `a`, given what is known of its file (FINDINGS R-75, R-76)? The
 * one rule for the check, the source resolver, the hand-on to a replacement and `cited_as` spots.
 * Named regions and steps exist on any artifact; a drawing has no other spots; a page `pN` only on a
 * PDF with N pages or more; a line range `La-b` only on a Markdown document, 1 <= a <= b <= its lines
 * (`L0`, `L33-27` never); a heading slug only on a Markdown document that has it. With nothing known
 * of the file (the browser before its facts arrive), a spot is taken to exist.
 */
export function spotExists(a: Artifact, spot: string, f: SpotFacts | null): boolean {
  if (a.regions.some((r) => r.id === spot) || stepOf(a, spot)) return true
  if (isCanvasFormat(artifactFormat(a))) return false
  if (!f) return true
  const page = pageOfRegionId(spot)
  if (page !== null) return f.pages != null && page >= 1 && page <= f.pages
  if (/^L\d/.test(spot)) {
    const lines = linesOfRegionId(spot)
    return !!lines && f.lines != null && lines.to <= f.lines
  }
  return !!f.headings?.some((h) => h.slug === spot)
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
  const drawing = isCanvasFormat(artifactFormat(a))
  if (rest.page !== null) {
    const page = rest.page + (c.pageOffset ?? 0)
    const problem = spotExists(a, `p${page}`, f) ? null : (f?.pages ?? null) !== null ? `${a.id} has no page ${page}` : `${a.id} is not a PDF, so it has no page ${page}`
    // Named as printed (the page's own footer, and the source's words); the PDF page is the detail.
    return [{ region: `p${page}`, label: `Page ${rest.page}`, detail: c.pageOffset ? `PDF page ${page}` : null, problem }]
  }
  if (rest.points.length) {
    // Points are a Markdown document's numbered items: a drawing, or a file read with none, has none.
    const none = drawing || (f !== null && f.points === null)
    return rest.points.map((n) => {
      if (none) return { region: null, label: `Point ${n}`, detail: null, problem: `${a.id} has no numbered points, so it has no point ${n}` }
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
    const region = linesRegion(from, to)
    const problem = spotExists(a, region, f)
      ? null
      : !linesOfRegionId(region)
        ? `${a.id}: lines ${from} to ${to} is not a range of lines (it runs from line 1, first line first)`
        : (f?.lines ?? null) !== null
          ? `${a.id} has no line ${to}`
          : `${a.id} is not a Markdown document, so it has no line ${to}`
    return [{ region, label: from === to ? `Line ${from}` : `Lines ${from} to ${to}`, detail: null, problem }]
  }
  if (c.spot) {
    const r = a.regions.find((x) => x.id === c.spot) ?? stepOf(a, c.spot)
    const page = pageOfRegionId(c.spot)
    const lines = linesOfRegionId(c.spot)
    const label = r?.name ?? (page !== null ? `Page ${page}` : lines ? (lines.from === lines.to ? `Line ${lines.from}` : `Lines ${lines.from} to ${lines.to}`) : (f?.headings?.find((h) => h.slug === c.spot)?.text ?? null))
    return [{ region: c.spot, label, detail: null, problem: null }]
  }
  if (c.within) return [{ region: c.within, label: under ?? null, detail: null, problem: null }]
  return [{ region: null, label: null, detail: null, problem: null }]
}

/** The artifact a retired one hands on to: its replacement, followed to the end (a loop stops where it starts). */
function latest(index: SourceIndex, a: Artifact): Artifact {
  const seen = new Set([a.id])
  let cur = a
  while (cur.status === 'Retired' && cur.supersededBy && !seen.has(cur.supersededBy)) {
    const next = index.byId.get(cur.supersededBy)
    if (!next) break
    seen.add(next.id)
    cur = next
  }
  return cur
}

const WHOLE: SourceSpot = { region: null, label: null, detail: null, problem: null }

/**
 * Which artifact and spots a source string cites. `self` is the record the source sits on: an
 * artifact's own source that names the artifact itself (a transcript's "Recording ...") is plain.
 */
export function resolveSource(index: SourceIndex, source: string, self?: string): SourceResolution {
  const s = source.trim()
  const question = QUESTION_SOURCE.exec(s)
  if (question) return { kind: 'question', id: question[1]! }

  let hit: { a: Artifact; c: Citation; prefix: string; rest: Rest } | null = null
  const note = NOTES.exec(s)
  const split = note ? noteWords(note[2]!) : null
  const noteFile = note ? `notes/${note[1]}-${slugify(split!.words)}.md` : null
  const noteArtifact = note ? index.notes.get(`${note[1]}|${slugify(split!.words)}`) : undefined
  if (note && noteArtifact) {
    const rest = parseRest(split!.rest)
    if (rest) hit = { a: noteArtifact, c: { as: '', pageOffset: null, within: null, spot: null }, prefix: `Notes ${note[1]} · ${split!.words}`, rest }
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
    if (!note) return { kind: 'unresolved', reason: 'matches no artifact' }
    return {
      kind: 'unresolved',
      reason: noteArtifact ? `names the note ${noteFile}, but "${split!.rest.trim()}" after its words is not a spot (#n, Ln, p.n) or words after " · "` : `no note ${noteFile}`,
    }
  }
  // A retired artifact hands on first: spots, labels and problems are worked out on its replacement
  // (FINDINGS R-79), and a spot the replacement lacks opens the whole replacement.
  const a = latest(index, hit.a)
  let spots = spotsFor(index, a, hit.c, hit.rest)
  if (a !== hit.a) spots = spots.map((sp) => (sp.region === null || spotExists(a, sp.region, index.facts(a.id)) ? sp : WHOLE))
  if (self && a.id === self) return { kind: 'plain' }
  return { kind: 'artifact', id: a.id, spots, prefix: hit.prefix }
}

/**
 * The note a `Notes <date> · <words> ...` cite opens, exactly as `resolveSource` opens it (the
 * board's own rule, for agent tools: accepted decision 18): the note artifact's ID and file (under
 * `notes/`), or null when the cite resolves to no note (a cite whose words match no note is never "the first
 * note of that date").
 */
export function resolveNoteCite(index: SourceIndex, cite: string): { id: string; file: string } | null {
  const r = resolveSource(index, cite)
  if (r.kind !== 'artifact') return null
  const a = index.byId.get(r.id)!
  return a.file && NOTE_FILE.test(a.file) ? { id: a.id, file: a.file } : null
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
    // Any spot the one rule accepts: a region, a step, a page, a line range or a heading (FINDINGS R-75).
    if (c.spot && !spotExists(a, c.spot, f)) out.push(`cited_as "${c.as}": spot "${c.spot}" is not a spot in ${a.id} (a region, step, page, line range or heading)`)
  }
  return out
}

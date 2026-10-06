/**
 * Node-side access to the catalogue folder: load everything, write one record
 * atomically. Used by the dev-server API and the npm scripts.
 */
import { existsSync, linkSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkCatalogue } from '../shared/check.ts'
import { ParseError, lintArtifact, lintFrontmatter, lintItem, lintQuestion, parseArtifact, parseItem, parseQuestion, revOf, serialiseArtifact, serialiseItem, serialiseQuestion } from '../shared/files.ts'
import { compareIds } from '../shared/ids.ts'
import type { Artifact, ArtifactRec, CatalogueSnapshot, Issue, Item, Layout, Question, Rev } from '../shared/types.ts'
import { artifactInfo } from './artifactFiles.ts'

const here = dirname(fileURLToPath(import.meta.url))
export const REQUIREMENTS_DIR = resolve(here, '../../docs/discovery-reference/Updated Requirements')
export const CATALOGUE_DIR = process.env.CATALOGUE_DIR ? resolve(process.env.CATALOGUE_DIR) : join(REQUIREMENTS_DIR, 'catalogue')

export const itemsDir = (root = CATALOGUE_DIR) => join(root, 'requirements')
export const questionsDir = (root = CATALOGUE_DIR) => join(root, 'questions')
export const layoutPath = (root = CATALOGUE_DIR) => join(root, 'board-layout.json')
export const itemPath = (id: string, root = CATALOGUE_DIR) => join(itemsDir(root), `${id}.md`)
export const questionPath = (id: string, root = CATALOGUE_DIR) => join(questionsDir(root), `${id}.md`)
/** Artifact sidecars (`AR-nn.md`), and the files of artifacts drawn for the catalogue. */
export const artifactsDir = (root = CATALOGUE_DIR) => join(root, 'artifacts')
export const artifactSidecarPath = (id: string, root = CATALOGUE_DIR) => join(artifactsDir(root), `${id}.md`)

const ID_FILE = /^[A-Z]{2}-[\d.]+$/

export class FileExistsError extends Error {}

export interface LoadedFile<T> {
  file: string
  record?: Rev<T>
  error?: string
  /** Frontmatter pitfalls (unquoted #, coerced numbers) that parsed but may have lost data. */
  lint?: string[]
  missing?: boolean
}

export function readRecord<T>(file: string, parse: (text: string) => T, lint: (text: string, data: T) => string[] = () => []): LoadedFile<T> {
  let text: string
  try {
    text = readFileSync(file, 'utf8')
  } catch (e) {
    return { file, error: (e as Error).message, missing: (e as NodeJS.ErrnoException).code === 'ENOENT' }
  }
  try {
    const data = parse(text)
    return { file, record: { data, rev: revOf(text) }, lint: [...lintFrontmatter(text), ...lint(text, data)] }
  } catch (e) {
    return { file, error: e instanceof ParseError ? e.message : (e as Error).message }
  }
}

export const readItemFile = (file: string) => readRecord<Item>(file, parseItem, lintItem)
export const readQuestionFile = (file: string) => readRecord<Question>(file, parseQuestion, lintQuestion)
export const readArtifactFile = (file: string) => readRecord<Artifact>(file, parseArtifact, lintArtifact)

/** Sidecar records with what their files hold (format, size, pages, headings). */
export function withMeta(records: Record<string, Rev<Artifact>>, root = CATALOGUE_DIR): Record<string, ArtifactRec> {
  const out: Record<string, ArtifactRec> = {}
  for (const [id, r] of Object.entries(records)) out[id] = { ...r, meta: artifactInfo(r.data, root).meta }
  return out
}

function listMd(dir: string): string[] {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return [] // missing folder, or removed mid-read by a git checkout
  }
  return names
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => join(dir, f))
}

const baseId = (file: string) => file.slice(file.lastIndexOf(sep) + 1).replace(/\.md$/, '')

/** Every ID a file already claims, by file name, whether or not the file parses. */
export const takenIds = (dir: string) => listMd(dir).map(baseId)

export function readLayout(root = CATALOGUE_DIR): { layout: Layout; error?: string } {
  let text: string
  try {
    text = readFileSync(layoutPath(root), 'utf8')
  } catch {
    return { layout: { positions: {}, lanes: [] } } // no layout yet: every card is in its story-map place
  }
  try {
    const raw = JSON.parse(text) as Partial<Layout>
    const lanes = Array.isArray(raw.lanes) ? raw.lanes.filter((l): l is string => typeof l === 'string' && l.trim() !== '') : []
    const layout: Layout = { positions: raw.positions ?? {}, lanes }
    if (typeof raw.firstLane === 'string' && raw.firstLane.trim()) layout.firstLane = raw.firstLane.trim()
    return { layout }
  } catch (e) {
    return { layout: { positions: {}, lanes: [] }, error: `board-layout.json is not valid JSON (${(e as Error).message}); fix or delete it` }
  }
}

export function fileExistsIn(root: string) {
  return (rel: string) => {
    const abs = resolve(root, rel)
    return abs.startsWith(resolve(root) + sep) && existsSync(abs)
  }
}

/** Parse issues plus integrity rules, for a set of loaded records. */
export function issuesFor(
  items: Record<string, Rev<Item>>,
  questions: Record<string, Rev<Question>>,
  parseIssues: Issue[],
  root = CATALOGUE_DIR,
  lanes?: string[],
  artifacts: Record<string, Rev<Artifact>> = {},
): Issue[] {
  return [
    ...parseIssues,
    ...checkCatalogue({
      items: Object.values(items).map((r) => r.data),
      questions: Object.values(questions).map((r) => r.data),
      fileExists: fileExistsIn(root),
      lanes,
      ...artifactCheck(artifacts, root),
    }),
  ]
}

/** The artifact part of a check's input: the sidecars, and what their files hold. */
export const artifactCheck = (artifacts: Record<string, Rev<Artifact>>, root = CATALOGUE_DIR) => ({
  artifacts: Object.values(artifacts).map((r) => r.data),
  artifactFacts: (a: Artifact) => artifactInfo(a, root).facts,
})

export interface LoadResult extends CatalogueSnapshot {
  parseIssues: Issue[]
  /** False when board-layout.json exists but cannot be read; layout writes are refused until it is fixed. */
  layoutReadable: boolean
}

/**
 * Records are keyed by file name. A file whose `id:` disagrees with its name,
 * or that fails to parse, is left out (so the board cannot save over the wrong
 * file) and reported; its name still reserves the ID.
 */
function collect<T extends { id: string }>(files: string[], read: (f: string) => LoadedFile<T>, parseIssues: Issue[]) {
  const out: Record<string, Rev<T>> = {}
  for (const f of files) {
    const name = baseId(f)
    const r = read(f)
    if (!ID_FILE.test(name)) parseIssues.push({ severity: 'warning', id: name, message: `file ${name}.md is not named after an ID` })
    if (r.error || !r.record) {
      parseIssues.push({ severity: 'error', id: name, message: `${name}.md could not be read: ${r.error}` })
      continue
    }
    for (const msg of r.lint ?? []) parseIssues.push({ severity: 'warning', id: name, message: msg })
    if (r.record.data.id !== name) {
      parseIssues.push({ severity: 'error', id: name, message: `${name}.md holds id ${r.record.data.id || '(none)'}; the file name must match the id, so it is not loaded` })
      continue
    }
    out[name] = r.record
  }
  return out
}

export function loadCatalogue(root = CATALOGUE_DIR): LoadResult {
  const parseIssues: Issue[] = []
  const items = collect(listMd(itemsDir(root)), readItemFile, parseIssues)
  const questions = collect(listMd(questionsDir(root)), readQuestionFile, parseIssues)
  const artifacts = withMeta(collect(listMd(artifactsDir(root)), readArtifactFile, parseIssues), root)
  const { layout, error } = readLayout(root)
  if (error) parseIssues.push({ severity: 'error', id: 'layout', message: error })
  return { items, questions, artifacts, layout, layoutReadable: !error, parseIssues, issues: issuesFor(items, questions, parseIssues, root, layout.lanes, artifacts) }
}

/** Write via a temp file + rename so a reader (or the watcher) never sees half a file. */
export function writeAtomic(file: string, text: string) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, text, 'utf8')
  renameSync(tmp, file)
}

/** Like writeAtomic, but fails with FileExistsError instead of replacing an existing file. */
export function createAtomic(file: string, text: string) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, text, 'utf8')
  try {
    linkSync(tmp, file) // atomic, and refuses an existing target
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') throw new FileExistsError(`${file} already exists`)
    throw e
  } finally {
    unlinkSync(tmp)
  }
}

export function writeItem(item: Item, root = CATALOGUE_DIR, opts: { create?: boolean } = {}): Rev<Item> {
  const text = serialiseItem(item)
  ;(opts.create ? createAtomic : writeAtomic)(itemPath(item.id, root), text)
  return { data: parseItem(text), rev: revOf(text) }
}

export function writeQuestion(q: Question, root = CATALOGUE_DIR, opts: { create?: boolean } = {}): Rev<Question> {
  const text = serialiseQuestion(q)
  ;(opts.create ? createAtomic : writeAtomic)(questionPath(q.id, root), text)
  return { data: parseQuestion(text), rev: revOf(text) }
}

/** Rewrite an artifact's sidecar (its details, from the board). Its file is never touched. */
export function writeArtifact(a: Artifact, root = CATALOGUE_DIR): ArtifactRec {
  const text = serialiseArtifact(a)
  writeAtomic(artifactSidecarPath(a.id, root), text)
  const data = parseArtifact(text)
  return { data, rev: revOf(text), meta: artifactInfo(data, root).meta }
}

/** Remove a question's file. Items never point at questions, so nothing else needs rewriting. */
export function deleteQuestionFile(id: string, root = CATALOGUE_DIR) {
  unlinkSync(questionPath(id, root))
}

/** Remove an item's file. The caller has already rewritten everything that pointed at it. */
export function deleteItemFile(id: string, root = CATALOGUE_DIR) {
  unlinkSync(itemPath(id, root))
}

/** Remove an item's screenshot folder, `assets/<ID>/`, if it has one. */
export function deleteItemAssets(id: string, root = CATALOGUE_DIR) {
  if (!ID_FILE.test(id)) return
  rmSync(join(root, 'assets', id), { recursive: true, force: true })
}

export function serialiseLayout(layout: Layout): string {
  const ids = Object.keys(layout.positions).sort(compareIds)
  // One card per line keeps drag diffs to one line each.
  const body = ids
    .map((id) => {
      const p = layout.positions[id]!
      return `    ${JSON.stringify(id)}: ${JSON.stringify({ x: Math.round(p.x), y: Math.round(p.y) })}`
    })
    .join(',\n')
  // Lanes only once there are any, so a board that never used them keeps its old file.
  const first = layout.firstLane ? `,\n  "firstLane": ${JSON.stringify(layout.firstLane)}` : ''
  const lanes = layout.lanes?.length ? `,\n  "lanes": [\n${layout.lanes.map((l) => `    ${JSON.stringify(l)}`).join(',\n')}\n  ]` : ''
  return `{\n  "positions": {${ids.length ? `\n${body}\n  ` : ''}}${first}${lanes}\n}\n`
}

export function writeLayout(layout: Layout, root = CATALOGUE_DIR) {
  writeAtomic(layoutPath(root), serialiseLayout(layout))
}

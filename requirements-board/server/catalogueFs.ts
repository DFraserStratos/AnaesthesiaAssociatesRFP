/**
 * Node-side access to the catalogue folder: load everything, write one record
 * atomically. Used by the dev-server API and the npm scripts.
 */
import { existsSync, linkSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkCatalogue } from '../shared/check.ts'
import { ParseError, lintFrontmatter, parseItem, parseQuestion, revOf, serialiseItem, serialiseQuestion } from '../shared/files.ts'
import { compareIds } from '../shared/ids.ts'
import type { CatalogueSnapshot, Issue, Item, Layout, Question, Rev } from '../shared/types.ts'

const here = dirname(fileURLToPath(import.meta.url))
export const REQUIREMENTS_DIR = resolve(here, '../../docs/discovery-reference/Updated Requirements')
export const CATALOGUE_DIR = process.env.CATALOGUE_DIR ? resolve(process.env.CATALOGUE_DIR) : join(REQUIREMENTS_DIR, 'catalogue')

export const itemsDir = (root = CATALOGUE_DIR) => join(root, 'requirements')
export const questionsDir = (root = CATALOGUE_DIR) => join(root, 'questions')
export const layoutPath = (root = CATALOGUE_DIR) => join(root, 'board-layout.json')
export const itemPath = (id: string, root = CATALOGUE_DIR) => join(itemsDir(root), `${id}.md`)
export const questionPath = (id: string, root = CATALOGUE_DIR) => join(questionsDir(root), `${id}.md`)

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

export function readRecord<T>(file: string, parse: (text: string) => T): LoadedFile<T> {
  let text: string
  try {
    text = readFileSync(file, 'utf8')
  } catch (e) {
    return { file, error: (e as Error).message, missing: (e as NodeJS.ErrnoException).code === 'ENOENT' }
  }
  try {
    return { file, record: { data: parse(text), rev: revOf(text) }, lint: lintFrontmatter(text) }
  } catch (e) {
    return { file, error: e instanceof ParseError ? e.message : (e as Error).message }
  }
}

export const readItemFile = (file: string) => readRecord<Item>(file, parseItem)
export const readQuestionFile = (file: string) => readRecord<Question>(file, parseQuestion)

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
    return { layout: { positions: {} } } // no layout yet: every card is in its story-map place
  }
  try {
    const raw = JSON.parse(text) as Partial<Layout>
    return { layout: { positions: raw.positions ?? {} } }
  } catch (e) {
    return { layout: { positions: {} }, error: `board-layout.json is not valid JSON (${(e as Error).message}); fix or delete it` }
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
): Issue[] {
  return [
    ...parseIssues,
    ...checkCatalogue({
      items: Object.values(items).map((r) => r.data),
      questions: Object.values(questions).map((r) => r.data),
      fileExists: fileExistsIn(root),
    }),
  ]
}

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
  const { layout, error } = readLayout(root)
  if (error) parseIssues.push({ severity: 'error', id: 'layout', message: error })
  return { items, questions, layout, layoutReadable: !error, parseIssues, issues: issuesFor(items, questions, parseIssues, root) }
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

export function serialiseLayout(layout: Layout): string {
  const ids = Object.keys(layout.positions).sort(compareIds)
  // One card per line keeps drag diffs to one line each.
  const body = ids
    .map((id) => {
      const p = layout.positions[id]!
      return `    ${JSON.stringify(id)}: ${JSON.stringify({ x: Math.round(p.x), y: Math.round(p.y) })}`
    })
    .join(',\n')
  return `{\n  "positions": {${ids.length ? `\n${body}\n  ` : ''}}\n}\n`
}

export function writeLayout(layout: Layout, root = CATALOGUE_DIR) {
  writeAtomic(layoutPath(root), serialiseLayout(layout))
}

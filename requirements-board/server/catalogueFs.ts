/**
 * Node-side access to the requirements folder: load everything, write one record
 * atomically (in place, for a file that exists). Used by the dev-server API and the npm scripts.
 */
import { closeSync, existsSync, linkSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hasBom, stripBom } from '../shared/bom.ts'
import { checkCatalogue } from '../shared/check.ts'
import { ParseError, lintArtifact, lintFrontmatter, lintItem, lintQuestion, parseArtifact, parseItem, parseQuestion, revOf, serialiseArtifact, serialiseItem, serialiseQuestion } from '../shared/files.ts'
import { editArtifactText, editItemText, editQuestionText } from '../shared/inPlace.ts'
import { compareIds } from '../shared/ids.ts'
import { lanesRevOf } from '../shared/move.ts'
import { CONFIG_FILE, DEFAULT_CONFIG, parseConfig, type BoardConfig } from '../shared/config.ts'
import { RECODES_FILE, parseRecodes, type Recode } from '../shared/statuses.ts'
import type { Artifact, ArtifactRec, CatalogueSnapshot, Issue, Item, Layout, Question, Rev } from '../shared/types.ts'
import { artifactInfo, primePdfs } from './artifactFiles.ts'
import { linkOut as linkOutOf } from './realPaths.ts'

const here = dirname(fileURLToPath(import.meta.url))
/** The requirements folder: `REQUIREMENTS_DIR` from the environment, else `requirements/` beside the board's code. */
export const REQUIREMENTS_DIR = process.env.REQUIREMENTS_DIR ? resolve(process.env.REQUIREMENTS_DIR) : resolve(here, '../requirements')

/** The folders under the requirements folder that hold records, by record kind (the Diff review reads them in git too). */
export const RECORD_DIRS = { item: 'stories', question: 'questions', artifact: 'artifacts' } as const

export const storiesDir = (root = REQUIREMENTS_DIR) => join(root, RECORD_DIRS.item)
export const questionsDir = (root = REQUIREMENTS_DIR) => join(root, RECORD_DIRS.question)
export const layoutPath = (root = REQUIREMENTS_DIR) => join(root, 'board-layout.json')
export const configPath = (root = REQUIREMENTS_DIR) => join(root, CONFIG_FILE)
export const itemPath = (id: string, root = REQUIREMENTS_DIR) => join(storiesDir(root), `${id}.md`)
export const questionPath = (id: string, root = REQUIREMENTS_DIR) => join(questionsDir(root), `${id}.md`)
/** Artifact sidecars (`AR-nn.md`); the artifact files themselves are in its `files/`. */
export const artifactsDir = (root = REQUIREMENTS_DIR) => join(root, RECORD_DIRS.artifact)
export const artifactSidecarPath = (id: string, root = REQUIREMENTS_DIR) => join(artifactsDir(root), `${id}.md`)

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
    text = stripBom(readFileSync(file, 'utf8')) // a byte-order mark is no part of the record, nor of its revision
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

/**
 * Sidecar records with what their files hold (format, size, pages, headings). One artifact's file
 * never stops the rest loading: `artifactInfo` turns its own failures into the artifact's issue.
 */
export function withMeta(records: Record<string, Rev<Artifact>>, root = REQUIREMENTS_DIR): Record<string, ArtifactRec> {
  primePdfs(Object.values(records).map((r) => r.data), root) // every unread PDF in one extractor run
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
    .filter((f) => f.endsWith('.md') && !f.startsWith('.')) // `._X.md` (macOS), `.#X.md` (Emacs): never records
    .sort()
    .map((f) => join(dir, f))
}

const baseId = (file: string) => file.slice(file.lastIndexOf(sep) + 1).replace(/\.md$/, '')

/** Every ID a file already claims, by file name, whether or not the file parses. */
export const takenIds = (dir: string) => listMd(dir).map(baseId)

export interface LayoutRead {
  /** Only well-formed positions (finite `x` and `y`). */
  layout: Layout
  /** Set when the file exists but cannot be used at all; layout writes are refused until it is fixed. */
  error?: string
  /**
   * Set when some of `positions` was ignored: the card IDs whose entries are not `{ x, y }` numbers,
   * or `['positions']` when `positions` itself is not an object. The next layout write drops them
   * (accepted decision 17).
   */
  damaged?: string[]
  /** Entries of `lanes` that are not names (blank, or not text), by position from 1: ignored, and dropped by the next layout write. */
  droppedLanes?: number[]
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export function readLayout(root = REQUIREMENTS_DIR): LayoutRead {
  let text: string
  try {
    text = readFileSync(layoutPath(root), 'utf8')
  } catch {
    return { layout: { positions: {}, lanes: [], lanesRev: lanesRevOf({ lanes: [] }) } } // no layout yet: every card is in its story-map place
  }
  let raw: unknown
  try {
    raw = JSON.parse(stripBom(text))
  } catch (e) {
    return { layout: { positions: {}, lanes: [] }, error: `board-layout.json is not valid JSON (${(e as Error).message}); fix or delete it` }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { layout: { positions: {}, lanes: [] }, error: 'board-layout.json does not hold an object ({ "positions": ... }); fix or delete it' }
  }
  const r = raw as Record<string, unknown>
  const lanes: string[] = []
  const droppedLanes: number[] = []
  if (Array.isArray(r.lanes)) r.lanes.forEach((l, i) => (typeof l === 'string' && l.trim() !== '' ? lanes.push(l) : droppedLanes.push(i + 1)))
  const positions: Layout['positions'] = {}
  const damaged: string[] = []
  if (r.positions === undefined) {
    // none yet
  } else if (!r.positions || typeof r.positions !== 'object' || Array.isArray(r.positions)) {
    damaged.push('positions')
  } else {
    for (const [id, p] of Object.entries(r.positions as Record<string, unknown>)) {
      if (id === '__proto__') {
        damaged.push(id) // never set: it would change the object's prototype
        continue
      }
      const xy = p as { x?: unknown; y?: unknown } | null
      if (xy && typeof xy === 'object' && !Array.isArray(xy) && finite(xy.x) && finite(xy.y)) positions[id] = { x: xy.x, y: xy.y }
      else damaged.push(id)
    }
  }
  const layout: Layout = { positions, lanes }
  if (typeof r.firstLane === 'string' && r.firstLane.trim()) layout.firstLane = r.firstLane.trim()
  layout.lanesRev = lanesRevOf(layout)
  return { layout, ...(damaged.length ? { damaged } : {}), ...(droppedLanes.length ? { droppedLanes } : {}) }
}

/** The issue for lane entries that are not names (`readLayout`'s `droppedLanes`; FINDINGS R-55). */
export function droppedLanesIssue(at: number[]): Issue {
  return { severity: 'error', id: 'layout', message: `board-layout.json: lane entr${at.length === 1 ? 'y' : 'ies'} ${at.join(', ')} ${at.length === 1 ? 'is' : 'are'} not a name; ignored, and the next layout save drops ${at.length === 1 ? 'it' : 'them'}` }
}

/** The issue for ignored layout entries (`readLayout`'s `damaged`). */
export function layoutDamageIssue(damaged: string[]): Issue {
  const what = damaged[0] === 'positions' ? '"positions" is not an object' : `the positions of ${damaged.join(', ')} are not x and y numbers`
  return { severity: 'error', id: 'layout', message: `board-layout.json: ${what}; ignored, and the next card move drops them` }
}

/**
 * The project's vocabulary. No file: the neutral defaults. Problems are reported and their entries
 * left at the default, except the status lists, which are only ever the project's own (see
 * `shared/statuses.ts`). The recodes feed each status list's high-water mark.
 */
export function readConfig(root = REQUIREMENTS_DIR): { config: BoardConfig; problems: string[] } {
  let text: string
  const recodes = readRecodes(root)
  try {
    text = readFileSync(configPath(root), 'utf8')
  } catch {
    if (!recodes.length) return { config: DEFAULT_CONFIG, problems: [] }
    return parseConfig('{}', recodes)
  }
  return parseConfig(text, recodes)
}

/** The recorded status recodes (`status-recodes.json`); none when the file is absent. */
export function readRecodes(root = REQUIREMENTS_DIR): Recode[] {
  try {
    return parseRecodes(readFileSync(join(root, RECODES_FILE), 'utf8'))
  } catch {
    return []
  }
}

/**
 * JSON as the config file is laid out by hand: two-space indent, and any array or object that
 * fits on one line (within `width`) kept there, `{ "a": 1 }` style.
 */
export function formatJson(value: unknown, width = 160): string {
  const flat = (v: unknown): string =>
    Array.isArray(v) ? `[${v.map(flat).join(', ')}]` : v && typeof v === 'object' ? (Object.keys(v).length ? `{ ${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${flat(x)}`).join(', ')} }` : '{}') : JSON.stringify(v)
  const out = (v: unknown, ind: string, top: boolean): string => {
    if (!v || typeof v !== 'object') return JSON.stringify(v)
    const one = flat(v)
    if (!top && ind.length + one.length <= width) return one
    const inner = ind + '  '
    return Array.isArray(v)
      ? `[\n${v.map((x) => inner + out(x, inner, false)).join(',\n')}\n${ind}]`
      : `{\n${Object.entries(v).map(([k, x]) => `${inner}${JSON.stringify(k)}: ${out(x, inner, false)}`).join(',\n')}\n${ind}}`
  }
  return out(value, '', true) + '\n'
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
  root = REQUIREMENTS_DIR,
  lanes?: string[],
  artifacts: Record<string, Rev<Artifact>> = {},
  config: BoardConfig = DEFAULT_CONFIG,
  firstLane?: string,
): Issue[] {
  let checked: Issue[]
  try {
    checked = checkCatalogue({
      items: Object.values(items).map((r) => r.data),
      questions: Object.values(questions).map((r) => r.data),
      fileExists: fileExistsIn(root),
      linkOut: (rel) => linkOutOf(resolve(root, rel), resolve(root, 'assets')),
      lanes,
      firstLane,
      config,
      ...artifactCheck(artifacts, root),
    })
  } catch (e) {
    // A backstop: unexpected data must never stop the load. Say the check did not finish, and why.
    console.error('[catalogue] the check could not finish:', e)
    checked = [{ severity: 'error', id: 'check', message: `the check could not finish (${(e as Error)?.message ?? String(e)}); the other issues may be incomplete` }]
  }
  return [...parseIssues, ...checked]
}

/** The artifact part of a check's input: the sidecars, and what their files hold. */
export const artifactCheck = (artifacts: Record<string, Rev<Artifact>>, root = REQUIREMENTS_DIR) => ({
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

export function loadCatalogue(root = REQUIREMENTS_DIR): LoadResult {
  const parseIssues: Issue[] = []
  const items = collect(listMd(storiesDir(root)), readItemFile, parseIssues)
  const questions = collect(listMd(questionsDir(root)), readQuestionFile, parseIssues)
  const artifacts = withMeta(collect(listMd(artifactsDir(root)), readArtifactFile, parseIssues), root)
  const { layout, error, damaged, droppedLanes } = readLayout(root)
  if (error) parseIssues.push({ severity: 'error', id: 'layout', message: error })
  if (damaged) parseIssues.push(layoutDamageIssue(damaged))
  if (droppedLanes) parseIssues.push(droppedLanesIssue(droppedLanes))
  const { config, problems } = readConfig(root)
  for (const message of problems) parseIssues.push({ severity: 'error', id: 'config', message })
  return { items, questions, artifacts, layout, config, layoutReadable: !error, parseIssues, issues: issuesFor(items, questions, parseIssues, root, layout.lanes, artifacts, config, layout.firstLane) }
}

/**
 * Write via a temp file + rename so a reader (or the watcher) never sees half a file. A file that
 * starts with a byte-order mark keeps it, so a rewrite changes only what the writer changed.
 */
export function writeAtomic(file: string, text: string) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, !hasBom(text) && startsWithBom(file) ? '\uFEFF' + text : text, 'utf8')
  renameSync(tmp, file)
}

/** Errors a filesystem gives when it cannot make hard links (exFAT, FAT, some network mounts). */
const NO_HARD_LINKS = new Set(['EPERM', 'ENOTSUP', 'EOPNOTSUPP', 'EXDEV', 'ENOSYS'])

/**
 * Like writeAtomic, but fails with FileExistsError instead of replacing an existing file. A hard link
 * from a temp file makes it atomic and exclusive in one step. Where the filesystem has no hard links
 * (FINDINGS R-64), the name is claimed with an exclusive create (`wx`) and the temp file renamed over
 * that claim: still exclusive, but a reader can see an empty file for a moment, and a crash between the
 * two steps leaves an empty file, which `npm run check` reports (delete it). No temp file is left behind.
 * `link` is replaceable for tests.
 */
export function createAtomic(file: string, text: string, link: (from: string, to: string) => void = linkSync) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, text, 'utf8')
  try {
    try {
      link(tmp, file) // atomic, and refuses an existing target
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code ?? ''
      if (code === 'EEXIST') throw new FileExistsError(`${file} already exists`)
      if (!NO_HARD_LINKS.has(code)) throw e
      let fd: number
      try {
        fd = openSync(file, 'wx') // the claim: refuses an existing file
      } catch (e2) {
        if ((e2 as NodeJS.ErrnoException).code === 'EEXIST') throw new FileExistsError(`${file} already exists`)
        throw e2
      }
      closeSync(fd)
      try {
        renameSync(tmp, file)
      } catch (e3) {
        rmSync(file, { force: true }) // give the claim back
        throw e3
      }
    }
  } finally {
    rmSync(tmp, { force: true })
  }
}

/**
 * Create a record under the next free ID: `next` picks one not in `taken`, `write` creates it
 * exclusively. If another writer (the board, `artifact:new`, an agent) took that ID first, move on to
 * the next, up to `attempts` times; null when every attempt was taken. The board's create routes and
 * `artifact:new` both claim IDs this way.
 */
export function claimNext<T extends { id: string }>(taken: Set<string>, next: (taken: Set<string>) => T, write: (rec: T) => void, attempts = 5): T | null {
  for (let i = 0; i < attempts; i++) {
    const rec = next(taken)
    try {
      write(rec)
      return rec
    } catch (e) {
      if (!(e instanceof FileExistsError)) throw e
      taken.add(rec.id)
    }
  }
  return null
}

/**
 * Write a record to its file. A create is written whole, in the board's form, and never replaces a
 * file. A save to an existing file edits it in place (`shared/inPlace.ts`): only the changed fields'
 * lines change, and a save that changes nothing writes nothing (the rev comes back unchanged). A file
 * that cannot be read is replaced whole, as before; a change that cannot be written without losing data
 * throws `LossyEditError` and writes nothing.
 */
function writeRecordFile<T>(file: string, rec: T, serialise: (r: T) => string, edit: (text: string, r: T) => string, create: boolean): string {
  if (create) {
    const text = serialise(rec)
    createAtomic(file, text)
    return text
  }
  let current: string | null = null
  try {
    current = stripBom(readFileSync(file, 'utf8'))
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
  }
  let text: string
  if (current === null) text = serialise(rec)
  else {
    try {
      text = edit(current, rec)
    } catch (e) {
      if (!(e instanceof ParseError)) throw e
      text = serialise(rec) // unreadable: replaced whole, as before (the board refuses to save over an unreadable file before it gets here)
    }
  }
  if (text !== current) writeAtomic(file, text)
  return text
}

export function writeItem(item: Item, root = REQUIREMENTS_DIR, opts: { create?: boolean } = {}): Rev<Item> {
  const text = writeRecordFile(itemPath(item.id, root), item, serialiseItem, editItemText, !!opts.create)
  return { data: parseItem(text), rev: revOf(text) }
}

export function writeQuestion(q: Question, root = REQUIREMENTS_DIR, opts: { create?: boolean } = {}): Rev<Question> {
  const text = writeRecordFile(questionPath(q.id, root), q, serialiseQuestion, editQuestionText, !!opts.create)
  return { data: parseQuestion(text), rev: revOf(text) }
}

/** Write an artifact's sidecar (its details, from the board), in place. Its file is never touched. */
export function writeArtifact(a: Artifact, root = REQUIREMENTS_DIR): ArtifactRec {
  const text = writeRecordFile(artifactSidecarPath(a.id, root), a, serialiseArtifact, editArtifactText, false)
  const data = parseArtifact(text)
  return { data, rev: revOf(text), meta: artifactInfo(data, root).meta }
}

/** Remove a question's file. Items never point at questions, so nothing else needs rewriting. */
export function deleteQuestionFile(id: string, root = REQUIREMENTS_DIR) {
  unlinkSync(questionPath(id, root))
}

/** Remove an item's file (already gone is fine). The caller has already rewritten everything that pointed at it. */
export function deleteItemFile(id: string, root = REQUIREMENTS_DIR) {
  rmSync(itemPath(id, root), { force: true })
}

/** Whether an existing file starts with a UTF-8 byte-order mark (a missing or unreadable file does not). */
function startsWithBom(file: string): boolean {
  let fd: number | undefined
  try {
    fd = openSync(file, 'r')
    const head = Buffer.alloc(3)
    return readSync(fd, head, 0, 3, 0) === 3 && head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf
  } catch {
    return false
  } finally {
    if (fd !== undefined) closeSync(fd)
  }
}

/** Remove an item's screenshot folder, `assets/<ID>/`, if it has one. */
export function deleteItemAssets(id: string, root = REQUIREMENTS_DIR) {
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

export function writeLayout(layout: Layout, root = REQUIREMENTS_DIR) {
  writeAtomic(layoutPath(root), serialiseLayout(layout))
}

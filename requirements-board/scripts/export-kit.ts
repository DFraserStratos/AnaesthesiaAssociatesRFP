/**
 * Export the board as a clean, shareable kit: the board's code and agent skills, the starter
 * catalogue in place of this project's requirements, each skill's "This repo" section swapped for
 * its starter version, and `START-HERE.html`. It is one folder, `requirements-board/`: whoever
 * receives it opens START-HERE.html (a static page, no server needed), drops the folder into a repo
 * and follows it. Run it again after any change to the board; bump the version and commit first.
 *   npm run kit:export -- --to "<folder>" [--dry-run] [--uncommitted]
 *
 * What it is built from: the board's files as committed at HEAD, so a kit is one commit and nothing
 * uncommitted, untracked or ignored can ship. `--uncommitted` takes the tracked files as they are on
 * disk instead (still never an untracked or ignored file), to try out work before committing it, and
 * names every board file that differs from HEAD. The kit records its version and source in
 * `requirements-board/.kit-export.json`, with a hash of every file.
 *
 * Where it goes: `<folder>/requirements-board/`, with `--to` read from the folder the command was run
 * from. The export refuses, before it changes anything, when that is this board, a folder inside it
 * or one containing it, or when it already holds a `requirements-board/` that is not an untouched
 * earlier kit: no marker, or any file added, removed or changed since that export (a catalogue
 * edit, `.history/` from opening the board, a new `package-lock.json`). Only `node_modules/` is
 * exempt, and kept. There is no override: export into an empty folder instead. A re-export replaces
 * only `requirements-board/` and leaves everything else in the folder alone.
 *
 * Checks before anything is written: no line of the kit matches `starter/deny.txt` (this project's
 * words and people, and status numbers pinned as "N here"), and every `npm run <script>` and board
 * path its docs name exists in the kit. A failed check leaves the staged kit in the temp folder.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, extname, join, relative, sep } from 'node:path'
import { BOARD_DIR } from '../server/boardPaths.ts'
import { hasJunk } from '../server/junk.ts'
import { shown, userPath } from './userPath.ts'

const BOARD = 'requirements-board'
const MARKER = '.kit-export.json'
const argv = process.argv.slice(2)
const toArg = argv[argv.indexOf('--to') + 1]
const dryRun = argv.includes('--dry-run')
const uncommitted = argv.includes('--uncommitted')
if (!argv.includes('--to') || !toArg || toArg.startsWith('--')) fail('Pass --to "<folder>"')
const target = userPath(toArg)
const targetBoard = join(target, BOARD)

/** Left out of the kit: generated or local folders, this project's data, and the export's own tooling. */
const SKIP_TOP = new Set(['node_modules', 'dist', 'test-results', 'playwright-report', 'shots', 'requirements', 'starter'])
const SKIP_PATHS = new Set([
  'e2e/artifacts-real.spec.ts',
  'scripts/export-kit.ts',
  'tests/exportKit.test.ts',
  'tests/starter.test.ts',
  'agent/skills/svg-diagram/examples/procedure-and-contract-selection.py',
  'agent/skills/svg-diagram/examples/how-a-procedure-is-priced.py',
])
/** The one shared format file that comes from this project's catalogue: kept project-neutral. The folder guides ship from `starter/`. */
const SHARED_REQ = ['SCHEMA.md']
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.woff', '.woff2', '.ico', '.zip'])
/** Finder's and Explorer's droppings: never a reason to refuse a target. */
const OS_LITTER = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini'])

// 1. Where it goes: refused before anything is read or written.
const refusal = targetProblem()
if (refusal) fail(refusal)

// 2. What it is built from.
interface Entry {
  data: Buffer
  /** git's mode: 100644 a file, 100755 an executable, 120000 a symlink (data is its target). */
  mode: string
}
const git = (args: string[], cwd: string, input?: string) => execFileSync('git', args, { cwd, input, maxBuffer: 1 << 30, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } })
let top: string
try {
  top = realpathSync(git(['rev-parse', '--show-toplevel'], BOARD_DIR).toString().trim())
} catch {
  fail(`${BOARD_DIR} is not in a git repository: the kit is exported from the board's committed files.`)
}
const prefix = relative(top, realpathSync(BOARD_DIR)).split(sep).join('/')
const commit = git(['rev-parse', 'HEAD'], top).toString().trim()
const changed = git(['status', '--porcelain', '-z', '--no-renames', '--untracked-files=no', '--', prefix || '.'], top)
  .toString()
  .split('\0')
  .filter((l) => /^.. /.test(l))
  .map((l) => l.slice(3))
const source = readSource()

const pkgEntry = source.get('package.json') ?? fail('the board has no package.json at this source')
const pkg = JSON.parse(pkgEntry.data.toString('utf8')) as { version: string; scripts: Record<string, string> }
const version = pkg.version

// 3. The kit, in memory.
const kit = new Map<string, Entry>()
const text = (rel: string) => (source.get(rel) ?? fail(`${rel} is missing from the source`)).data.toString('utf8')
for (const [rel, e] of source) {
  if (SKIP_TOP.has(rel.split('/')[0]!) || SKIP_PATHS.has(rel) || hasJunk(rel)) continue
  kit.set(rel, e)
}
for (const [rel, e] of source) if (rel.startsWith('starter/requirements/')) kit.set(rel.slice('starter/'.length), e)
for (const f of SHARED_REQ) kit.set(`requirements/${f}`, { data: Buffer.from(text(`requirements/${f}`)), mode: '100644' })

const problems: string[] = []
const put = (rel: string, s: string) => kit.set(rel, { data: Buffer.from(s), mode: kit.get(rel)?.mode ?? '100644' })
// The kit's package.json has no export script (the kit has no starter folder to export from).
const kitPkg = JSON.parse(text('package.json')) as { scripts: Record<string, string> }
delete kitPkg.scripts['kit:export']
put('package.json', JSON.stringify(kitPkg, null, 2) + '\n')
// Passages about this source board only (exporting, the starter) are marked and left out of the kit.
for (const [rel, e] of kit) {
  if (extname(rel) !== '.md') continue
  const s = e.data.toString('utf8')
  if (s.includes('<!-- kit:omit -->')) put(rel, s.replace(/[ \t]*<!-- kit:omit -->[\s\S]*?<!-- \/kit:omit -->[ \t]*\n?/g, ''))
}
// Swap each skill's "This repo" section for its starter version.
for (const rel of [...kit.keys()].filter((r) => /^agent\/skills\/[^/]+\/SKILL\.md$/.test(r))) {
  const skill = rel.split('/')[2]!
  const s = kit.get(rel)!.data.toString('utf8')
  const start = s.search(/^## This repo\s*$/m)
  if (start < 0) continue
  const block = source.get(`starter/this-repo/${skill}.md`)
  if (!block) {
    problems.push(`${skill}: has a "This repo" section but no starter/this-repo/${skill}.md`)
    continue
  }
  const rest = s.slice(start + 1).search(/^## /m)
  const end = rest < 0 ? s.length : start + 1 + rest
  put(rel, s.slice(0, start) + block.data.toString('utf8').trimEnd() + '\n\n' + s.slice(end))
}
// The start-here page, with the version, the source and the loop diagram drawn in.
const loop = text('starter/requirements/artifacts/files/AR-01.svg').replace(/^<\?xml[^>]*>\s*/, '')
const from = uncommitted ? `${commit.slice(0, 12)} with uncommitted changes` : commit.slice(0, 12)
put('START-HERE.html', text('starter/START-HERE.html').replaceAll('{{version}}', version).replaceAll('{{commit}}', from).replace('{{loop-svg}}', () => loop))

// 4. Nothing of this project may ship.
const deny = text('starter/deny.txt')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => (l.startsWith('=') ? new RegExp(l.slice(1)) : new RegExp(l, 'i')))
for (const [rel, e] of kit) {
  if (BINARY.has(extname(rel).toLowerCase()) || e.mode === '120000') continue
  e.data
    .toString('utf8')
    .split('\n')
    .forEach((line, n) => {
      for (const re of deny) if (re.test(line)) problems.push(`${BOARD}/${rel}:${n + 1} matches ${re}: ${line.trim().slice(0, 100)}`)
    })
}
// 5. Every script and board file the kit's docs name ships in it.
problems.push(...referenceProblems())

const changelog = text('CHANGELOG.md')
if (!changelog.includes(`## ${version}`)) console.warn(`warn: CHANGELOG.md has no entry for ${version}; bump the version and add one`)
if (uncommitted) console.warn(`warn: built from the working tree (--uncommitted): ${changed.length ? `${changed.length} board file(s) differ from HEAD ${commit.slice(0, 12)}:\n  ${changed.join('\n  ')}` : `nothing differs from HEAD ${commit.slice(0, 12)}`}`)
else if (changed.length) console.warn(`warn: ${changed.length} board file(s) have uncommitted changes, which are not in the kit (it is HEAD ${commit.slice(0, 12)}; --uncommitted tries them):\n  ${changed.join('\n  ')}`)

// 6. Stage it, with the marker.
const stage = mkdtempSync(join(tmpdir(), 'board-kit-'))
const stageBoard = join(stage, BOARD)
for (const [rel, e] of kit) {
  const abs = join(stageBoard, ...rel.split('/'))
  mkdirSync(dirname(abs), { recursive: true })
  if (e.mode === '120000') symlinkSync(e.data.toString('utf8'), abs)
  else {
    writeFileSync(abs, e.data)
    if (e.mode === '100755') chmodSync(abs, 0o755)
  }
}
const marker = { kit: version, commit, source: uncommitted ? 'uncommitted' : 'HEAD', note: 'Written by kit:export. A later export replaces this folder only while every file matches this list.', files: hashes(stageBoard) }
writeFileSync(join(stageBoard, MARKER), JSON.stringify(marker, null, 2) + '\n')

if (problems.length) {
  for (const p of problems) console.error(`ERROR  ${p}`)
  console.error(`${problems.length} problem(s); nothing exported. The staged kit is in ${stage}`)
  process.exit(1)
}

console.log(`Kit ${version} (${uncommitted ? 'working tree' : 'HEAD'} ${commit.slice(0, 12)}) staged in ${stage}: ${kit.size} files`)
if (dryRun) process.exit(0)

// 7. Replace the board in the target, and nothing else there. Checked again, then swapped whole.
const again = targetProblem()
if (again) fail(again)
mkdirSync(target, { recursive: true })
const incoming = join(target, `.${BOARD}.incoming-${process.pid}`)
const old = join(target, `.${BOARD}.old-${process.pid}`)
const hadBoard = existsSync(targetBoard)
let movedAside = false
try {
  cpSync(stageBoard, incoming, { recursive: true, verbatimSymlinks: true })
  if (hadBoard) {
    renameSync(targetBoard, old)
    movedAside = true
  }
  renameSync(incoming, targetBoard)
} catch (e) {
  if (movedAside) renameSync(old, targetBoard)
  rmSync(incoming, { recursive: true, force: true })
  fail(`Could not put the kit in place (${(e as Error).message}); ${shown(target)} is as it was.`)
}
// An installed node_modules stays, so a re-export needs no fresh install.
if (hadBoard) {
  if (existsSync(join(old, 'node_modules'))) renameSync(join(old, 'node_modules'), join(targetBoard, 'node_modules'))
  rmSync(old, { recursive: true, force: true, maxRetries: 5 })
}
rmSync(stage, { recursive: true, force: true })
console.log(`Exported kit ${version} to ${shown(targetBoard)}`)

/** Why the target must not be written, or null. Real paths, so no symlink or `..` spelling slips past. */
function targetProblem(): string | null {
  // `.native`: the file system's own spelling, so a path typed in another case on macOS compares equal.
  const board = realpathSync.native(BOARD_DIR)
  const where = realish(targetBoard)
  const within = (a: string, b: string) => a === b || a.startsWith(b.endsWith(sep) ? b : b + sep)
  const what = `${shown(target)} (its ${BOARD}/ is ${where})`
  if (within(where, board)) return `Refused: ${what} is this board or inside it. Export to a folder outside the repository.`
  if (within(board, where)) return `Refused: ${what} contains this board. Export to a folder outside the repository.`
  if (!existsSync(target)) return null
  if (!lstatSync(target).isDirectory()) return `Refused: ${shown(target)} is not a folder.`
  if (!existsSync(targetBoard) && !isLink(targetBoard)) {
    // A swap folder left by an export that was killed mid-way is not someone's work.
    const others = readdirSync(target).filter((f) => !OS_LITTER.has(f) && !/^\.requirements-board\.(incoming|old)-\d+$/.test(f))
    return others.length ? `Refused: ${shown(target)} has other files and no ${BOARD}/. Export into an empty folder, or one that holds an earlier kit.` : null
  }
  if (isLink(targetBoard) || !lstatSync(targetBoard).isDirectory()) return `Refused: ${shown(targetBoard)} is a link or a file, not an earlier kit. Export into an empty folder.`
  let recorded: Record<string, string>
  try {
    recorded = (JSON.parse(readFileSync(join(targetBoard, MARKER), 'utf8')) as { files: Record<string, string> }).files
    if (!recorded || typeof recorded !== 'object') throw new Error('no file list')
  } catch {
    return `Refused: ${shown(targetBoard)} was not written by kit:export (no readable ${MARKER}), so it may be a live board. Export into an empty folder.`
  }
  const now = hashes(targetBoard)
  const diffs = [
    ...Object.keys(now).filter((f) => !(f in recorded)).map((f) => `added   ${f}`),
    ...Object.keys(recorded).filter((f) => !(f in now)).map((f) => `removed ${f}`),
    ...Object.keys(now).filter((f) => f in recorded && recorded[f] !== now[f]).map((f) => `changed ${f}`),
  ]
  if (!diffs.length) return null
  return `Refused: ${shown(targetBoard)} has changed since it was exported (${diffs.length} file(s)), so it may hold work:\n  ${diffs.slice(0, 12).join('\n  ')}${diffs.length > 12 ? '\n  ...' : ''}\nNothing was changed. Export into an empty folder instead.`
}

/** A SHA-256 per file under `dir`, by relative path; `node_modules/` at the top, the marker and OS litter left out. */
function hashes(dir: string): Record<string, string> {
  const out: Record<string, string> = {}
  const walk = (abs: string, rel: string) => {
    for (const d of readdirSync(abs, { withFileTypes: true })) {
      const r = rel ? `${rel}/${d.name}` : d.name
      if ((!rel && (d.name === 'node_modules' || d.name === MARKER)) || OS_LITTER.has(d.name)) continue
      const p = join(abs, d.name)
      if (d.isSymbolicLink()) out[r] = 'link:' + createHash('sha256').update(readlinkSync(p)).digest('hex')
      else if (d.isDirectory()) walk(p, r)
      else out[r] = createHash('sha256').update(readFileSync(p)).digest('hex')
    }
  }
  walk(dir, '')
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => (a < b ? -1 : 1)))
}

/** The board's files, by path relative to the board: as committed at HEAD, or (--uncommitted) the tracked files on disk. */
function readSource(): Map<string, Entry> {
  const out = new Map<string, Entry>()
  const under = prefix ? `${prefix}/` : ''
  if (uncommitted) {
    for (const path of git(['ls-files', '-z', '-s', '--', prefix || '.'], top).toString().split('\0').filter(Boolean)) {
      const [meta, file] = path.split('\t') as [string, string]
      const abs = join(top, ...file.split('/'))
      if (!existsSync(abs) && !isLink(abs)) continue // deleted on disk: not in the kit
      const mode = isLink(abs) ? '120000' : meta.split(' ')[0]!
      out.set(file.slice(under.length), { mode, data: mode === '120000' ? Buffer.from(readlinkSync(abs)) : readFileSync(abs) })
    }
    return out
  }
  const listed = git(['ls-tree', '-r', '-z', 'HEAD', '--', prefix || '.'], top)
    .toString()
    .split('\0')
    .filter(Boolean)
    .map((l) => {
      const [meta, file] = l.split('\t') as [string, string]
      const [mode, type, sha] = meta.split(' ') as [string, string, string]
      return { mode, type, sha, file }
    })
    .filter((e) => e.type === 'blob')
  const batch = git(['cat-file', '--batch'], top, listed.map((e) => e.sha).join('\n') + '\n')
  let at = 0
  for (const e of listed) {
    const nl = batch.indexOf(0x0a, at)
    const size = Number(batch.subarray(at, nl).toString().split(' ')[2])
    out.set(e.file.slice(under.length), { mode: e.mode, data: Buffer.from(batch.subarray(nl + 1, nl + 1 + size)) })
    at = nl + 1 + size + 1
  }
  return out
}

/**
 * Scripts and board paths named in the kit's docs that the kit lacks: every `npm run <script>` (with or
 * without `--prefix`) must be one of the kit's own scripts, and every board path in backticks
 * (`e2e/...`, `scripts/...`, `BOARD/tests/...`) a file or folder in the kit.
 */
function referenceProblems(): string[] {
  const found: string[] = []
  const scripts = new Set(Object.keys(kitPkg.scripts))
  const dirs = new Set([...kit.keys()].flatMap((r) => r.split('/').slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join('/'))))
  const exists = (p: string) => kit.has(p) || dirs.has(p.replace(/\/$/, ''))
  for (const [rel, e] of kit) {
    // CHANGELOG is history: it names files of the board it was written in.
    if ((!/\.(md|html)$/.test(rel) && rel !== 'playwright.config.ts') || rel === 'CHANGELOG.md') continue
    e.data
      .toString('utf8')
      .split('\n')
      .forEach((line, n) => {
        for (const m of line.matchAll(/npm (?:--prefix (?:\S+) )?run ([a-z][\w:-]*)/g)) {
          if (!scripts.has(m[1]!)) found.push(`${BOARD}/${rel}:${n + 1} names \`npm run ${m[1]}\`, which the kit does not have`)
        }
        for (const m of line.matchAll(/(?:`|\b)(?:BOARD\/|requirements-board\/)?((?:e2e|tests|scripts|server|shared|src|agent|starter)\/[\w.@/-]*[\w/])(?=`|['"\s),:;])/g)) {
          const p = m[1]!
          if (/[*<{]/.test(p)) continue
          if (!exists(p)) found.push(`${BOARD}/${rel}:${n + 1} names ${p}, which is not in the kit`)
        }
      })
  }
  return found
}

/** `p` with its longest existing ancestor replaced by that ancestor's real path. */
function realish(p: string): string {
  let head = p
  const rest: string[] = []
  while (!existsSync(head)) {
    const up = dirname(head)
    if (up === head) break
    rest.unshift(basename(head))
    head = up
  }
  return join(realpathSync.native(head), ...rest)
}

function isLink(p: string) {
  try {
    return lstatSync(p).isSymbolicLink()
  } catch {
    return false
  }
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

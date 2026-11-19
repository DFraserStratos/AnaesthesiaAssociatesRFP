/**
 * How the board talks to git, for every history reader (cards, sidecars, artifact files,
 * screenshots, the Diff review and the history-blob route). Read-only and asynchronous:
 *
 * - **Never takes a lock.** `GIT_OPTIONAL_LOCKS=0` on every call: `git status` would otherwise
 *   refresh the index under `index.lock`, and an agent's `git commit` in the same worktree could fail.
 * - **Any file name.** Paths go to git literally (`--literal-pathspecs`), come back NUL-separated
 *   (`-z`), and quoting is off, so accents, quotes, tabs and glob characters read as written.
 * - **Either hash width.** Object names are 40 or 64 hex; the repository's own format is asked, never
 *   assumed.
 * - **Bounded caches** (`Lru`), and identical reads in flight share one git run (`memo`).
 * - **This repository, as configured.** Variables that would point git elsewhere (`GIT_DIR`,
 *   `GIT_INDEX_FILE` and the like, set when the dev server starts from a hook) are dropped, and
 *   display settings that change output (`status.showUntrackedFiles`, `log.follow`) are pinned.
 *
 * Known limits: naming a changed file on disk runs the path's clean filter, as `git add` would (with
 * git-lfs that stores the object under `.git/lfs/objects`; never the index or refs). LFS smudging is
 * skipped (`GIT_LFS_SKIP_SMUDGE`), so a request never fetches from the network: an LFS version is
 * served as its pointer. A working name is cached by the file's size, time and inode, plus the
 * repository config, `info/attributes`, and the top and the file's own `.gitattributes`; a change to
 * global config or another folder's `.gitattributes` takes effect once the file is next written.
 */
import { execFile, execFileSync, spawn } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { isAbsolute, join, posix } from 'node:path'
import { promisify } from 'node:util'
import type { CommitInfo } from '../shared/history.ts'

const run = promisify(execFile)

/** The options every call carries, ahead of the command. */
export const PRE = [
  '--literal-pathspecs',
  '-c', 'core.quotePath=false',
  '-c', 'color.ui=false',
  '-c', 'log.showSignature=false',
  '-c', 'log.follow=false',
  '-c', 'i18n.logOutputEncoding=UTF-8',
  '-c', 'status.showUntrackedFiles=normal',
  '-c', 'status.renames=true',
]

/** Variables that would make git read another repository, index or object store than `cwd`'s. */
const ELSEWHERE = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_COMMON_DIR', 'GIT_NAMESPACE', 'GIT_PREFIX', 'GIT_CEILING_DIRECTORIES', 'GIT_LITERAL_PATHSPECS', 'GIT_GLOB_PATHSPECS', 'GIT_NOGLOB_PATHSPECS', 'GIT_ICASE_PATHSPECS']

/** The environment every git call runs in: the caller's, with optional locks off and nothing pointing elsewhere. */
export function gitEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_LFS_SKIP_SMUDGE: '1' }
  for (const k of ELSEWHERE) delete env[k]
  return env
}

/** git's text output, run in `cwd`. Rejects when git fails. */
export const git = async (cwd: string, args: string[]) => (await run('git', [...PRE, ...args], { cwd, encoding: 'utf8', env: gitEnv(), maxBuffer: 64 * 1024 * 1024 })).stdout

/** git's raw output (a blob's bytes), with `input` on its stdin. Rejects when git fails. */
export function gitBytes(cwd: string, args: string[], input?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const p = spawn('git', [...PRE, ...args], { cwd, env: gitEnv() })
    const chunks: Buffer[] = []
    p.stdout.on('data', (c: Buffer) => chunks.push(c))
    p.stderr.resume()
    p.on('error', reject)
    p.stdin.on('error', () => {}) // git may exit before reading all of its input
    p.on('close', (code) => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(`git ${args[0]} exited ${code}`))))
    p.stdin.end(input ?? '')
  })
}

/** A git object name: SHA-1 (40 hex) or SHA-256 (64 hex). */
export const OBJECT_SHA = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/

/* ------------------------------------------------------------------ caches */

/** A map that forgets its least recently used entries past `max`. */
export class Lru<V> {
  private map = new Map<string, V>()
  readonly max: number
  constructor(max: number) {
    this.max = max
  }
  get size() {
    return this.map.size
  }
  get(key: string): V | undefined {
    const v = this.map.get(key)
    if (v !== undefined) {
      this.map.delete(key)
      this.map.set(key, v)
    }
    return v
  }
  set(key: string, v: V) {
    this.map.delete(key)
    this.map.set(key, v)
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value!)
  }
  delete(key: string) {
    this.map.delete(key)
  }
}

/** A promise kept under `key` while it runs, and (unless it fails) after, so identical calls share one. */
export function memo<V>(cache: Lru<Promise<V>>, key: string, make: () => Promise<V>): Promise<V> {
  const hit = cache.get(key)
  if (hit) return hit
  const p = make()
  cache.set(key, p)
  p.catch(() => cache.delete(key))
  return p
}

/** A promise shared only while it runs: identical calls at the same moment get one, later calls start afresh. */
export function shared<V>(running: Map<string, Promise<V>>, key: string, make: () => Promise<V>): Promise<V> {
  const hit = running.get(key)
  if (hit) return hit
  const p = make().finally(() => running.delete(key))
  running.set(key, p)
  return p
}

/* ------------------------------------------------------------------ the repository */

const tops = new Lru<string>(64)

/**
 * The top of the git repository `dir` is in (symlinks resolved, as git reports it), or null outside
 * one or with no git. Remembered per folder once found: a folder never moves to another repository.
 */
export async function repoTop(dir: string): Promise<string | null> {
  const hit = tops.get(dir)
  if (hit) return hit
  if (!existsSync(dir)) return null
  try {
    const top = (await git(dir, ['rev-parse', '--show-toplevel'])).trim()
    tops.set(dir, top)
    return top
  } catch {
    return null
  }
}

/**
 * The object format of the repository `dir` is in ('sha1' outside one), for synchronous callers (the
 * journal's screenshot scan). Blocks briefly, once per folder.
 */
export function objectFormatSync(dir: string): 'sha1' | 'sha256' {
  let f = syncFormats.get(dir)
  if (!f) {
    try {
      f = execFileSync('git', [...PRE, 'rev-parse', '--show-object-format'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: gitEnv() }).trim() === 'sha256' ? 'sha256' : 'sha1'
    } catch {
      f = 'sha1'
    }
    syncFormats.set(dir, f)
  }
  return f
}
const syncFormats = new Lru<'sha1' | 'sha256'>(64)

const indexPaths = new Lru<Promise<string>>(64)

/**
 * The index file's identity (where git keeps it, its size, modification time and inode), so a read
 * that depends on the index is cached until it changes. Found through git, so a linked worktree's
 * own index is the one watched.
 */
export async function indexIdentity(top: string): Promise<string> {
  const path = await memo(indexPaths, top, async () => {
    const p = (await git(top, ['rev-parse', '--git-path', 'index'])).trim()
    return isAbsolute(p) ? p : join(top, p)
  })
  try {
    const st = statSync(path, { bigint: true })
    return `${path}:${st.size}:${st.mtimeNs}:${st.ino}`
  } catch {
    return `${path}:none`
  }
}

/** HEAD's commit, or null with no commits yet. */
export async function headOf(top: string): Promise<string | null> {
  return (await git(top, ['rev-parse', '--verify', '--quiet', 'HEAD^{commit}']).catch(() => '')).trim() || null
}

/* ------------------------------------------------------------------ the log */

/** One `--raw` entry: a path's old and new blob (all zeros where absent), and its status letter (and score). */
export interface RawChange {
  status: string
  oldSha: string
  newSha: string
  path: string
  /** The new path of a rename or copy. */
  to?: string
}

export interface LogCommit {
  info: CommitInfo
  parents: string[]
  changes: RawChange[]
}

/** The format `rawLog` parses: commit, parents, author, date, subject. */
export const LOG_FORMAT = '--format=%x1e%H%x1f%P%x1f%an%x1f%aI%x1f%s'

/**
 * `git log -z --raw ...` (with `LOG_FORMAT`) as commits, newest first. Every path comes back exactly as
 * stored, whatever it holds.
 */
export function parseRawLog(out: string): LogCommit[] {
  // Read token by token: a path is taken only where a raw entry says one follows, so a path holding
  // the commit separator (\x1e is a legal file-name byte) is never read as a new commit.
  const commits: LogCommit[] = []
  const tokens = out.split('\0')
  let cur: LogCommit | null = null
  for (let i = 0; i < tokens.length; ) {
    const t = tokens[i++]!.replace(/^\n/, '')
    const m = RAW_HEAD.exec(t)
    if (m && cur) {
      const change: RawChange = { status: m[3]! + m[4]!, oldSha: m[1]!, newSha: m[2]!, path: tokens[i++] ?? '' }
      if (m[3] === 'R' || m[3] === 'C') change.to = tokens[i++] ?? ''
      cur.changes.push(change)
      continue
    }
    if (!t.startsWith('\x1e')) continue
    const [sha = '', parents = '', author = '', at = '', subject = ''] = t.slice(1).replace(/\n$/, '').split('\x1f')
    cur = { info: { sha, author, at, subject }, parents: parents ? parents.split(' ') : [], changes: [] }
    if (sha) commits.push(cur)
  }
  return commits
}

const RAW_HEAD = /^:\d+ \d+ ([0-9a-f]+) ([0-9a-f]+) ([A-Z])(\d*)$/

/** `-z --raw` entries (`git diff -z --raw` output, or one commit's part of a log). */
export function parseRawChanges(text: string): RawChange[] {
  const changes: RawChange[] = []
  const fields = text.split('\0')
  for (let i = 0; i < fields.length; ) {
    const head = fields[i++]!.replace(/^\n/, '')
    const m = RAW_HEAD.exec(head)
    if (!m) continue
    const status = m[3]!
    const path = fields[i++] ?? ''
    const change: RawChange = { status: status + m[4]!, oldSha: m[1]!, newSha: m[2]!, path }
    if (status === 'R' || status === 'C') change.to = fields[i++] ?? ''
    changes.push(change)
  }
  return changes
}

/** NUL-separated names (`-z` output) as a list. */
export const nulSplit = (s: string) => s.split('\0').filter(Boolean)

/** An all-zeros object name: no blob (the side of an add or a delete). */
export const isNullSha = (s: string) => /^0+$/.test(s)

/* ------------------------------------------------------------------ blobs */

/**
 * Every object in one `git cat-file --batch` process, as text; null where there is none (or it is not
 * a blob). `specs` are object names or `rev:path`; a spec holding a newline (which the batch
 * protocol cannot carry) reads as null.
 */
export async function readBlobs(top: string, specs: string[]): Promise<(string | null)[]> {
  return (await readBlobBytes(top, specs)).map((b) => (b == null ? null : b.toString('utf8')))
}

export async function readBlobBytes(top: string, specs: string[]): Promise<(Buffer | null)[]> {
  const sent = specs.filter((s) => !s.includes('\n'))
  if (!sent.length) return specs.map(() => null)
  const buf = await gitBytes(top, ['cat-file', '--batch'], sent.map((s) => `${s}\n`).join(''))
  const got: (Buffer | null)[] = []
  let at = 0
  for (let i = 0; i < sent.length; i++) {
    const nl = buf.indexOf(0x0a, at)
    if (nl < 0) break
    const head = buf.subarray(at, nl).toString('utf8')
    at = nl + 1
    const m = /^\S+ (\w+) (\d+)$/.exec(head)
    if (!m) {
      got.push(null) // "<spec> missing" (or ambiguous): absent there
      continue
    }
    const size = Number(m[2])
    got.push(m[1] === 'blob' ? buf.subarray(at, at + size) : null)
    at += size + 1
  }
  let j = 0
  return specs.map((s) => (s.includes('\n') ? null : (got[j++] ?? null)))
}

/* ------------------------------------------------------------------ files on disk */

const hashCache = new Lru<string>(512)
const configPaths = new Lru<Promise<string[]>>(64)

/** A file's size and time, or '-' when it is absent: part of a cache key. */
function stamp(path: string): string {
  try {
    const st = statSync(path, { bigint: true })
    return `${st.size}:${st.mtimeNs}`
  } catch {
    return '-'
  }
}

/**
 * The state of everything besides a file's bytes that decides its clean-form name: the repository's
 * config (`core.autocrlf`, filters), `info/attributes` and the top `.gitattributes` (a file's own
 * folder's `.gitattributes` joins the key per file). Global config is not watched.
 */
async function conversionStamp(top: string): Promise<string> {
  const paths = await memo(configPaths, top, async () => {
    const out = (await git(top, ['rev-parse', '--git-path', 'config', '--git-path', 'info/attributes']).catch(() => '')).split('\n').filter(Boolean)
    return [...out.map((p) => (isAbsolute(p) ? p : join(top, p))), join(top, '.gitattributes')]
  })
  return paths.map(stamp).join('|')
}

/**
 * The blob name `git add` would give each file (repository-relative paths) as it is on disk now: a
 * file git reports unchanged from the index takes the index's name; any other is hashed by git, so
 * line-ending conversion, `.gitattributes` and clean filters apply, in the repository's own object
 * format. Files that are missing (or that git cannot name) are left out.
 */
export async function workingNames(top: string, rels: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const unique = [...new Set(rels)].filter((p) => p && !p.includes('\n'))
  if (!unique.length) return out
  const [staged, modified] = await Promise.all([
    inChunks(unique, (part) => git(top, ['ls-files', '-z', '-s', '--', ...part])).catch(() => ''),
    inChunks(unique, (part) => git(top, ['diff-files', '-z', '--name-only', '--', ...part])).catch(() => null),
  ])
  const changed = new Set(modified == null ? unique : modified.split('\0').filter(Boolean))
  for (const entry of staged.split('\0')) {
    const m = /^\d+ ([0-9a-f]+) 0\t(.+)$/s.exec(entry)
    if (m && !changed.has(m[2]!) && existsSync(join(top, m[2]!))) out.set(m[2]!, m[1]!)
  }
  // What the name depends on besides the bytes: the repository's config and attributes files.
  const conversion = await conversionStamp(top)
  const rest: { rel: string; key: string }[] = []
  for (const rel of unique) {
    if (out.has(rel)) continue
    let st
    try {
      st = statSync(join(top, rel), { bigint: true })
      if (!st.isFile()) continue
    } catch {
      continue
    }
    const key = `${top}|${rel}|${st.size}|${st.mtimeNs}|${st.ino}|${conversion}|${stamp(join(top, posix.dirname(rel), '.gitattributes'))}`
    const hit = hashCache.get(key)
    if (hit) out.set(rel, hit)
    else rest.push({ rel, key })
  }
  if (rest.length) {
    const names = await hashPaths(top, rest.map((r) => r.rel))
    rest.forEach((r, i) => {
      const sha = names[i]
      if (sha && OBJECT_SHA.test(sha)) {
        out.set(r.rel, sha)
        hashCache.set(r.key, sha)
      }
    })
  }
  return out
}

/**
 * Runs `fn` over `paths` a slice at a time and joins the outputs, so a long list (a mass move) never
 * overflows the command line.
 */
export async function inChunks(paths: string[], fn: (part: string[]) => Promise<string>, size = 500): Promise<string> {
  let out = ''
  for (let i = 0; i < paths.length; i += size) out += await fn(paths.slice(i, i + size))
  return out
}

/** `git hash-object --stdin-paths` over `rels`: one name per path, '' where git could not name it. */
async function hashPaths(top: string, rels: string[]): Promise<string[]> {
  // The line protocol reads a path starting with `"` as C-quoted: name those one at a time.
  if (rels.some((r) => r.startsWith('"'))) return Promise.all(rels.map((r) => git(top, ['hash-object', '--', r]).then((s) => s.trim(), () => '')))
  try {
    const out = (await gitBytes(top, ['hash-object', '--stdin-paths'], rels.map((r) => `${r}\n`).join(''))).toString('utf8').split('\n')
    return rels.map((_, i) => (out[i] ?? '').trim())
  } catch {
    // One unreadable path fails the batch: name the rest one at a time.
    return Promise.all(rels.map((r) => git(top, ['hash-object', '--', r]).then((s) => s.trim(), () => '')))
  }
}

/** For tests: the sizes and bounds of this module's caches. */
export const coreCacheSizes = () => ({ hashes: { size: hashCache.size, max: hashCache.max }, tops: { size: tops.size, max: tops.max } })

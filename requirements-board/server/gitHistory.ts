/**
 * A record's history in git, read-only: a card's or sidecar's versions, an artifact file's commits
 * and a card's screenshot rewrites, and how each file on disk stands against HEAD. No git, or a
 * folder outside a repository, reads as no history. Asynchronous, so a slow repository never stalls
 * the dev server's other requests. git itself is reached through `gitCore.ts` (no locks, any file
 * name, either hash width, bounded caches).
 *
 * One walk serves every reader (`walk`), so they all follow the same rules:
 * - **HEAD's first parents only**, each commit against its first parent: a lane merged with
 *   `--no-ff` shows as the merge, never as its lane commits interleaved with master's (which would
 *   make neighbours false before-and-after pairs).
 * - **Earlier paths, each bounded** (`gitRenames.ts`): a file is followed back through its renames,
 *   and a path counts for it only up to the commit that moved it there. A commit that only moved
 *   the file is no change to it; a move that also edited it is one change.
 * - **A rename-away ends a history.** A file later added at a path another file was renamed away
 *   from starts there: the other file's past is not its own.
 * - **A deletion is a bound, not an end.** The deletion stays listed (`deleted: true`) and the walk
 *   carries on into the path's earlier life, so a consumer can cut there (a reused ID) or carry on
 *   (a restored record). Only committed deletions on the first-parent chain count.
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { basename, dirname, join, posix, relative, sep } from 'node:path'
import { parseItem } from '../shared/files.ts'
import type { Item } from '../shared/types.ts'
import type { AssetCommit, AssetHistory, GitFileHistory, GitVersion, ScreenshotCommit } from '../shared/history.ts'
import { LOG_FORMAT, Lru, coreCacheSizes, git, gitBytes, headOf, isNullSha, memo, nulSplit, parseRawLog, readBlobs, repoTop, type LogCommit, workingNames } from './gitCore.ts'
import { committedPath, folderMoves, moveContext, pathsOf, renameCacheSizes, type MoveContext } from './gitRenames.ts'
import { gitBlobSha } from './historyJournal.ts'

export { OBJECT_SHA, git, readBlobs, repoTop } from './gitCore.ts'

/** `parse`, reading a file that does not parse as null. */
export const tryParse =
  <T>(parse: (text: string) => T) =>
  (text: string): T | null => {
    try {
      return parse(text)
    } catch {
      return null
    }
  }

/** A file's git blob name from its raw bytes, as a SHA-1 repository names it, or (`sha256`) a SHA-256 one. */
export const blobShaOf = (buf: Buffer, sha256 = false) => gitBlobSha(buf, sha256 ? 'sha256' : 'sha1')

const emptyTrees = new Lru<Promise<string>>(64)

/** The repository's empty tree (SHA-1 or SHA-256, whichever it uses): the state before the first commit. */
export function emptyTree(top: string): Promise<string> {
  return memo(emptyTrees, top, async () => (await gitBytes(top, ['hash-object', '-t', 'tree', '--stdin'])).toString('utf8').trim())
}

/** Does `file` differ from HEAD? False outside a repository. Never takes the index lock. */
export async function gitDirty(file: string): Promise<boolean> {
  try {
    return (await git(dirname(file), ['status', '--porcelain', '--', basename(file)])).trim() !== ''
  } catch {
    return false
  }
}

/** A path relative to the repository's top (git reports its top with symlinks resolved: macOS's /var is /private/var). */
const relTo = (top: string, file: string) => relative(top, join(realDir(dirname(file)), basename(file))).split(sep).join('/')

function realDir(dir: string): string {
  try {
    return realpathSync(dir)
  } catch {
    return dir
  }
}

/* ------------------------------------------------------------------ the walk */

/** One change to a file at one commit: its blob before and after (null: absent). */
interface Step {
  commit: LogCommit
  from: string | null
  to: string | null
  /** The path the file had after this commit. */
  path: string
  deleted?: true
}

/**
 * The commits on HEAD's first parents that touched any of `paths`, each against its first parent,
 * newest first. Every path given literally; output NUL-separated.
 */
async function firstParentLog(top: string, head: string, paths: string[]): Promise<LogCommit[]> {
  if (!paths.length) return []
  return parseRawLog(await git(top, ['log', '-z', '--first-parent', '--diff-merges=first-parent', '--no-renames', '--raw', '--no-abbrev', LOG_FORMAT, head, '--', ...paths]))
}

/**
 * One file's changes, walking `commits` (newest first) from `start` (its path in HEAD's terms).
 * At a commit that renamed the file here, the walk moves to the old path; a deletion at the current
 * path is listed as one and the walk goes on; a rename-away of the current path ends it.
 */
function walk(commits: LogCommit[], start: string, ctx: MoveContext, from = 0): Step[] {
  const out: Step[] = []
  let cur = start
  for (let i = from; i < commits.length; i++) {
    const c = commits[i]!
    const renames = ctx.renames.get(c.info.sha) ?? []
    const moved = renames.find((r) => r.to === cur)
    if (moved) {
      const before = c.changes.find((x) => x.path === moved.from)
      const after = c.changes.find((x) => x.path === cur)
      const a = before && !isNullSha(before.oldSha) ? before.oldSha : null
      const b = after && !isNullSha(after.newSha) ? after.newSha : null
      // A move alone is no change; a move that also edited the file is one.
      if (a && b && a !== b) out.push({ commit: c, from: a, to: b, path: cur })
      cur = moved.from
      continue
    }
    const e = c.changes.find((x) => x.path === cur)
    if (!e) continue
    if (e.status === 'D') {
      // Renamed away from here: what came before at this path is another file's past.
      if (renames.some((r) => r.from === cur)) break
      out.push({ commit: c, from: e.oldSha, to: null, path: cur, deleted: true })
      continue
    }
    const a = isNullSha(e.oldSha) ? null : e.oldSha
    if (a === e.newSha) continue
    out.push({ commit: c, from: a, to: e.newSha, path: cur })
  }
  return out
}

/* ------------------------------------------------------------------ caches */

const fileCache = new Lru<Promise<GitVersion<unknown>[]>>(256)
const assetCache = new Lru<Promise<AssetCommit[]>>(128)
const shotCache = new Lru<Promise<{ commits: ScreenshotCommit[]; ended: { src: string; commit: string }[] }>>(128)
/** Each parser gets its own key space in `fileCache` (a card and a sidecar are parsed differently). */
const parserIds = new WeakMap<object, number>()
let parsers = 0
const parserId = (fn: object) => {
  let id = parserIds.get(fn)
  if (id === undefined) parserIds.set(fn, (id = ++parsers))
  return id
}

/** For tests and diagnostics: every history cache's size and bound. */
export function historyCacheSizes(): Record<string, { size: number; max: number }> {
  return {
    files: { size: fileCache.size, max: fileCache.max },
    assets: { size: assetCache.size, max: assetCache.max },
    screenshots: { size: shotCache.size, max: shotCache.max },
    emptyTrees: { size: emptyTrees.size, max: emptyTrees.max },
    ...renameCacheSizes(),
    ...coreCacheSizes(),
    blobChecks: blobCheckSize(),
  }
}

let blobCheckSize: () => { size: number; max: number } = () => ({ size: 0, max: 0 })
/** The history-blob route reports its own cache here. */
export const reportBlobChecks = (fn: () => { size: number; max: number }) => {
  blobCheckSize = fn
}

/** Where a reader stands: the repository, HEAD and the moves, or null for no history. */
async function standing(dir: string): Promise<{ top: string; head: string; ctx: MoveContext } | null> {
  if (!existsSync(dir)) return null
  const top = await repoTop(dir)
  if (!top) return null
  const head = await headOf(top)
  if (!head) return null
  return { top, head, ctx: await moveContext(top, head) }
}

/* ------------------------------------------------------------------ cards and sidecars */

export async function gitFileHistory<T = Item>(file: string, parseRecord: (text: string) => T = parseItem as unknown as (text: string) => T): Promise<GitFileHistory<T>> {
  const parse = tryParse(parseRecord)
  const working = existsSync(file) ? parse(readFileSync(file, 'utf8')) : null
  const mtime = existsSync(file) ? statSync(file).mtime.toISOString() : undefined
  const none: GitFileHistory<T> = { versions: [], dirty: false, working, mtime }
  try {
    const at = await standing(dirname(file))
    if (!at) return none
    const { top, head, ctx } = at
    const rel = relTo(top, file)
    const status = git(top, ['status', '--porcelain', '--', rel]).catch(() => '')
    const start = committedPath(ctx, rel)
    const paths = pathsOf(ctx, start)
    const key = `${top}|${head}|${parserId(parseRecord)}|${JSON.stringify(paths)}`
    const versions = (await memo(fileCache, key, async () => {
      const steps = walk(await firstParentLog(top, head, paths), start, ctx)
      const blobs = await readBlobs(top, steps.flatMap((s) => (s.to ? [s.to] : [])))
      let i = 0
      return steps.map((s): GitVersion<T> => {
        const text = s.to ? blobs[i++] : null
        return { commit: s.commit.info, item: text == null ? null : parse(text), ...(s.deleted ? { deleted: true as const } : {}) }
      })
    })) as GitVersion<T>[]
    return { versions, dirty: (await status).trim() !== '', working, mtime }
  } catch {
    return none
  }
}

/* ------------------------------------------------------------------ screenshots */

/**
 * Commits that rewrote one of a card's screenshots under `<root>/assets/<id>/` in place (added and
 * removed images show through the card's `images` field), whether any file there is not committed
 * yet, and where a committed deletion ended a screenshot's history (`ended`). Each file is followed
 * through its own renames: a file that only shared a folder with one of the card's never counts.
 * Entries name each file by its path under the card's folder today (`assets/<id>/<name>`).
 */
export async function gitScreenshots(root: string, id: string): Promise<{ commits: ScreenshotCommit[]; dirty: boolean; ended: { src: string; commit: string }[] }> {
  const none = { commits: [], dirty: false, ended: [] }
  try {
    const at = await standing(root)
    if (!at) return none
    const { top, head, ctx } = at
    const folder = join(root, 'assets', id)
    const dir = relative(top, join(realDir(root), 'assets', id)).split(sep).join('/')
    const status = git(top, ['status', '--porcelain', '--', `${dir}/`]).catch(() => '')
    // The card's files: on disk, in the index, at HEAD.
    const [indexed, inHead] = await Promise.all([git(top, ['ls-files', '-z', '--', `${dir}/`]).catch(() => ''), git(top, ['ls-tree', '-z', '--name-only', head, '--', `${dir}/`]).catch(() => '')])
    let onDisk: string[] = []
    try {
      onDisk = readdirSync(folder).filter((n) => statSync(join(folder, n)).isFile()).map((n) => `${dir}/${n}`)
    } catch {
      // no folder on disk
    }
    const files = [...new Set([...onDisk, ...nulSplit(indexed), ...nulSplit(inHead)])].filter((p) => posix.dirname(p) === dir).sort()
    const folders = await folderMoves(top, ctx, dir)
    const starts = files.map((f) => committedPath(ctx, f))
    const paths = [...new Set([...starts.flatMap((s) => pathsOf(ctx, s)), `${committedFolder(folders, dir)}/`, ...folders.map((f) => `${f.from}/`)])]
    const key = `${top}|${head}|${id}|${JSON.stringify([files, starts, paths])}`
    const res = await memo(shotCache, key, async () => {
      const commits = await firstParentLog(top, head, paths)
      const src = (p: string) => `assets/${id}/${posix.basename(p)}`
      const tracks = files.map((f, i) => ({ src: src(f), steps: walk(commits, starts[i]!, ctx) }))
      // Files that were the card's once and were deleted from its folder (the folder as it was then).
      const held = new Set(tracks.flatMap((t) => t.steps.map((s) => `${s.commit.info.sha}|${s.path}`)))
      let active = committedFolder(folders, dir)
      commits.forEach((c, i) => {
        for (const e of c.changes) {
          if (e.status !== 'D' || posix.dirname(e.path) !== active || held.has(`${c.info.sha}|${e.path}`)) continue
          if ((ctx.renames.get(c.info.sha) ?? []).some((r) => r.from === e.path)) continue
          const steps = walk(commits, e.path, ctx, i)
          for (const s of steps) held.add(`${s.commit.info.sha}|${s.path}`)
          tracks.push({ src: src(e.path), steps })
        }
        const moved = folders.find((m) => m.commit === c.info.sha)
        if (moved) active = moved.from
      })
      const byCommit = new Map<string, ScreenshotCommit>()
      const ended: { src: string; commit: string }[] = []
      for (const t of tracks)
        for (const s of t.steps) {
          if (s.deleted) ended.push({ src: t.src, commit: s.commit.info.sha })
          if (!s.from || !s.to || s.from === s.to) continue
          const sc = byCommit.get(s.commit.info.sha) ?? { commit: s.commit.info, files: [] }
          sc.files.push({ from: { src: t.src, sha: s.from }, to: { src: t.src, sha: s.to } })
          byCommit.set(s.commit.info.sha, sc)
        }
      const order = new Map(commits.map((c, i) => [c.info.sha, i]))
      return { commits: [...byCommit.values()].sort((a, b) => order.get(a.commit.sha)! - order.get(b.commit.sha)!), ended: ended.sort((a, b) => order.get(a.commit)! - order.get(b.commit)!) }
    })
    return { ...res, dirty: (await status).trim() !== '' }
  } catch {
    return none
  }
}

/** The card folder's path in HEAD's terms (before any move not committed yet). */
const committedFolder = (folders: { commit: string | null; from: string }[], dir: string) => folders.filter((f) => f.commit == null).at(-1)?.from ?? dir

/* ------------------------------------------------------------------ blobs */

/**
 * A blob's bytes from the repository `cwd` sits in, or null (not in git, or no git). Given the
 * repository-relative path it is served for, the bytes are as a checkout would write them (the
 * path's smudge filters and line endings), else the stored blob.
 */
export async function gitBlob(cwd: string, sha: string, path?: string): Promise<Buffer | null> {
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(sha)) return null
  try {
    if (path && !path.includes('\n')) {
      const out = await gitBytes(cwd, ['cat-file', '--filters', `--path=${path}`, sha]).catch(() => null)
      if (out) return out
    }
    return await gitBytes(cwd, ['cat-file', 'blob', sha])
  } catch {
    return null
  }
}

/**
 * Is the file at `abs` blob `sha` now: its raw bytes hashed in the repository's width (as the
 * journal names screenshots), or its name as `git add` would store it? False when it is not, or
 * there is no such file.
 */
export async function onDiskIs(abs: string, sha: string): Promise<boolean> {
  let buf: Buffer
  try {
    if (!statSync(abs).isFile()) return false
    buf = readFileSync(abs)
  } catch {
    return false
  }
  if (gitBlobSha(buf, sha.length === 64 ? 'sha256' : 'sha1') === sha) return true
  const top = await repoTop(dirname(abs))
  if (!top) return false
  const rel = relTo(top, abs)
  if (rel.startsWith('..')) return false
  return (await workingNames(top, [rel])).get(rel) === sha
}

/* ------------------------------------------------------------------ artifact files */

/**
 * Every commit that added, rewrote or removed one file (an artifact's), and how the file on disk
 * stands against HEAD: `working` is the name git would give it now (line endings and filters
 * applied), so an unchanged file reads as `head`. Outside a repository: no commits, nothing dirty.
 */
export async function gitAssetHistory(file: string): Promise<AssetHistory> {
  const raw = existsSync(file) ? gitBlobSha(readFileSync(file)) : null
  const mtime = existsSync(file) ? statSync(file).mtime.toISOString() : undefined
  const none: AssetHistory = { commits: [], dirty: false, head: null, working: raw, mtime }
  try {
    const at = await standing(dirname(file))
    if (!at) {
      // A repository with no commits yet still names files its own way.
      const top = existsSync(dirname(file)) ? await repoTop(dirname(file)) : null
      if (!top) return none
      const rel = relTo(top, file)
      return { ...none, working: (await workingNames(top, [rel])).get(rel) ?? null }
    }
    const { top, head, ctx } = at
    const rel = relTo(top, file)
    const status = git(top, ['status', '--porcelain', '--', rel]).catch(() => '')
    const atHead = git(top, ['rev-parse', '--verify', '--quiet', `${head}:${rel}`]).then((s) => s.trim() || null, () => null)
    const working = workingNames(top, [rel]).then((m) => m.get(rel) ?? null)
    const start = committedPath(ctx, rel)
    const paths = pathsOf(ctx, start)
    const commits = await memo(assetCache, `${top}|${head}|${JSON.stringify(paths)}`, async () =>
      walk(await firstParentLog(top, head, paths), start, ctx).map((s): AssetCommit => ({ commit: s.commit.info, from: s.from, to: s.to, ...(s.deleted ? { deleted: true as const } : {}) })),
    )
    return { commits, dirty: (await status).trim() !== '', head: await atHead, working: await working, mtime }
  } catch {
    return none
  }
}


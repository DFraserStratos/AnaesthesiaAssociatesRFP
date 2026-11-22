/**
 * Where a file used to live, and from which commit. Cards and artifacts keep their IDs, but their
 * folders move (the requirements folder has moved between layouts, its subfolders have been
 * renamed), so history reads each earlier path as well as today's, each only up to the commit that
 * moved the file away from it. Renames come from git itself, so nothing here knows any layout:
 *
 * - **Committed:** one rename log per repository and HEAD, along HEAD's first parents (a move made
 *   on a lane is dated at the merge that brought it in), shared by every reader asking at once.
 * - **Staged:** the index against HEAD, cached until the index itself changes (found through git, so
 *   a linked worktree's index is the one watched).
 * - **Not yet staged:** a tracked file missing from the working tree paired with an untracked file
 *   of exactly its content (as `git add` would store it): a move made with plain `mv`. A move that
 *   also edited the file shows once it is staged.
 */
import { existsSync, statSync } from 'node:fs'
import { basename, join, posix } from 'node:path'
import { LOG_FORMAT, Lru, git, gitBytes, inChunks, indexIdentity, memo, nulSplit, parseRawChanges, parseRawLog, shared, workingNames } from './gitCore.ts'

export interface Rename {
  from: string
  to: string
}

/** Everything the readers need to know about moves, at one HEAD and one state of the working tree. */
export interface MoveContext {
  /** Renames per commit, by commit hash (first-parent comparisons). */
  renames: Map<string, Rename[]>
  /** The commits that renamed something, newest first. */
  order: string[]
  /** Renames not committed yet: the working tree's (plain moves) first, then the index's. */
  uncommitted: Rename[][]
}

const renameLogs = new Lru<Promise<{ renames: Map<string, Rename[]>; order: string[] }>>(4)
const stagedRenames = new Lru<Promise<Rename[]>>(8)
const contexts = new Map<string, Promise<MoveContext>>()

const renamesIn = (text: string): Rename[] => parseRawChanges(text).flatMap((c) => (c.status.startsWith('R') && c.to ? [{ from: c.path, to: c.to }] : []))

/** The committed renames along HEAD's first parents: one git run per repository and HEAD. */
function renameLog(top: string, head: string) {
  return memo(renameLogs, `${top}@${head}`, async () => {
    const out = await git(top, ['log', '-z', '--first-parent', '--diff-merges=first-parent', '-M', '-l0', '--diff-filter=R', '--raw', '--no-abbrev', LOG_FORMAT, head])
    const renames = new Map<string, Rename[]>()
    const order: string[] = []
    for (const c of parseRawLog(out)) {
      const list = c.changes.flatMap((x) => (x.status.startsWith('R') && x.to ? [{ from: x.path, to: x.to }] : []))
      if (!list.length) continue
      renames.set(c.info.sha, list)
      order.push(c.info.sha)
    }
    return { renames, order }
  })
}

/** Renames staged in the index, against HEAD; cached until the index changes. */
async function staged(top: string, head: string): Promise<Rename[]> {
  const id = await indexIdentity(top)
  return memo(stagedRenames, `${top}@${head}@${id}`, async () => renamesIn(await git(top, ['diff', '-z', '--cached', '-M', '-l0', '--diff-filter=R', '--raw', '--no-abbrev', head])))
}

/**
 * Moves made in the working tree that git has not been told about: each tracked file missing from
 * disk whose index content is exactly that of one untracked file (the same name preferred when
 * several match). Read afresh each time; the listing is cheap and only likely pairs are hashed.
 */
async function unstaged(top: string): Promise<Rename[]> {
  const deleted = [...new Set(nulSplit(await git(top, ['ls-files', '-z', '--deleted']).catch(() => '')))]
  if (!deleted.length) return []
  const [others, stage] = await Promise.all([
    git(top, ['ls-files', '-z', '--others', '--exclude-standard']).catch(() => ''),
    inChunks(deleted, (part) => git(top, ['ls-files', '-z', '-s', '--', ...part])).catch(() => ''),
  ])
  const blobOf = new Map<string, string>()
  for (const entry of stage.split('\0')) {
    const m = /^\d+ ([0-9a-f]+) 0\t(.+)$/s.exec(entry)
    if (m) blobOf.set(m[2]!, m[1]!)
  }
  if (!blobOf.size) return []
  const sizes = await blobSizes(top, [...new Set(blobOf.values())])
  const names = new Set([...blobOf.keys()].map((p) => basename(p)))
  const wantedSizes = new Set(sizes.values())
  // Likely moves only: an untracked file with a missing file's name, or a missing blob's size.
  const candidates = nulSplit(others).filter((p) => {
    if (names.has(basename(p))) return true
    try {
      return wantedSizes.has(Number(statSync(join(top, p)).size))
    } catch {
      return false
    }
  })
  if (!candidates.length) return []
  const shas = await workingNames(top, candidates)
  const used = new Set<string>()
  const out: Rename[] = []
  for (const [from, sha] of blobOf) {
    const hits = candidates.filter((c) => !used.has(c) && shas.get(c) === sha)
    const same = hits.filter((c) => basename(c) === basename(from))
    const pick = same.length === 1 ? same[0] : hits.length === 1 ? hits[0] : undefined
    if (!pick) continue
    used.add(pick)
    out.push({ from, to: pick })
  }
  return out
}

/** Each blob's size, by name (one `cat-file --batch-check`). */
async function blobSizes(top: string, shas: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  const lines = await gitBytes(top, ['cat-file', '--batch-check=%(objectname) %(objectsize)'], shas.map((s) => `${s}\n`).join('')).then(
    (b) => b.toString('utf8').split('\n'),
    () => [] as string[],
  )
  for (const line of lines) {
    const m = /^([0-9a-f]+) (\d+)$/.exec(line)
    if (m) out.set(m[1]!, Number(m[2]))
  }
  return out
}

/**
 * The renames a reader needs at `head` (null: no commits yet), shared by every reader asking at the
 * same moment (a Diff count asks three times at once; a card's history asks for the card and its
 * screenshots).
 */
export function moveContext(top: string, head: string | null): Promise<MoveContext> {
  return shared(contexts, `${top}@${head ?? ''}`, async () => {
    const [log, idx, wt] = await Promise.all([head ? renameLog(top, head) : { renames: new Map<string, Rename[]>(), order: [] }, head ? staged(top, head) : [], unstaged(top)])
    return { ...log, uncommitted: [wt, idx] }
  })
}

/** Where `rel` was before the moves not committed yet: the path the commits know it by. */
export function committedPath(ctx: MoveContext, rel: string): string {
  let cur = rel
  for (const step of ctx.uncommitted) cur = step.find((r) => r.to === cur)?.from ?? cur
  return cur
}

/** Every repository-relative path `rel` has had, newest first, today's first. */
export function pathsOf(ctx: MoveContext, rel: string): string[] {
  const out = [rel]
  let cur = rel
  const add = (r: Rename | undefined) => {
    if (!r) return
    cur = r.from
    if (!out.includes(cur)) out.push(cur)
  }
  for (const step of ctx.uncommitted) add(step.find((r) => r.to === cur))
  for (const sha of ctx.order) add(ctx.renames.get(sha)!.find((r) => r.to === cur))
  return out
}

/** Every earlier repository-relative path of `rel`, newest first (not including `rel`). */
export async function priorPaths(top: string, head: string, rel: string): Promise<string[]> {
  return pathsOf(await moveContext(top, head), rel).slice(1)
}

/** Every earlier repository-relative path of the folder `dir` (from the files renamed out of it), newest first. */
export async function priorDirs(top: string, head: string, dir: string): Promise<string[]> {
  const ctx = await moveContext(top, head)
  const out: string[] = []
  let current = [dir]
  for (const renames of [...ctx.uncommitted, ...ctx.order.map((sha) => ctx.renames.get(sha)!)]) {
    const found = new Set<string>()
    for (const r of renames) for (const d of current) if (posix.dirname(r.to) === d) found.add(posix.dirname(r.from))
    for (const d of found) if (d !== dir && !out.includes(d)) out.push(d)
    current = [...new Set([...current, ...found])]
  }
  return out
}

/**
 * The folders `dir` itself was, newest first, each with the commit that moved it (null: not
 * committed yet): only where a move took every file out of the old folder, so a file moved from
 * one card's folder to another's never makes the first folder the second's past.
 */
export async function folderMoves(top: string, ctx: MoveContext, dir: string): Promise<{ commit: string | null; from: string }[]> {
  const out: { commit: string | null; from: string }[] = []
  let cur = dir
  const step = async (commit: string | null, renames: Rename[]) => {
    const sources = new Set(renames.filter((r) => posix.dirname(r.to) === cur).map((r) => posix.dirname(r.from)))
    if (sources.size !== 1) return
    const from = [...sources][0]!
    if (from === cur) return
    const emptied = commit == null ? !existsSync(join(top, from)) : !(await treeExists(top, `${commit}:${from}`))
    if (!emptied) return
    out.push({ commit, from })
    cur = from
  }
  for (const r of ctx.uncommitted) await step(null, r)
  for (const sha of ctx.order) await step(sha, ctx.renames.get(sha)!)
  return out
}

async function treeExists(top: string, spec: string): Promise<boolean> {
  return git(top, ['cat-file', '-e', spec]).then(
    () => true,
    () => false,
  )
}

/** For tests: the sizes and bounds of this module's caches. */
export const renameCacheSizes = () => ({ renameLog: { size: renameLogs.size, max: renameLogs.max }, staged: { size: stagedRenames.size, max: stagedRenames.max } })

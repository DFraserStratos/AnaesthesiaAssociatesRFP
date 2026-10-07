/**
 * Where a file used to live. Cards and artifacts keep their IDs, but their folders move (the
 * requirements folder has moved between repositories' layouts, and its subfolders have been
 * renamed), so history reads every earlier path as well as today's. Renames come from git itself:
 * one `git log` over the whole repository per HEAD, plus the renames staged or made in the working
 * tree since, so nothing here knows any particular layout.
 */
import { execFile } from 'node:child_process'
import { statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)
const git = async (cwd: string, args: string[]) => (await run('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })).stdout

interface Rename {
  from: string
  to: string
}

/** `R<score>\t<from>\t<to>` lines, in the order git printed them. */
function parseRenames(out: string): Rename[] {
  return out.split('\n').flatMap((line) => {
    const m = /^R\d*\t([^\t]+)\t([^\t]+)$/.exec(line)
    return m ? [{ from: m[1]!, to: m[2]! }] : []
  })
}

/** Renames per commit, newest first. */
const committed = new Map<string, Rename[][]>()
/** Renames between HEAD and the working tree, keyed by HEAD and the index's mtime. */
const uncommitted = new Map<string, Rename[]>()

async function renameSteps(top: string, head: string): Promise<Rename[][]> {
  const key = `${top}@${head}`
  let commits = committed.get(key)
  if (!commits) {
    const out = await git(top, ['log', '-M', '-l0', '--diff-filter=R', '--name-status', '--format=%x1e%H'])
    commits = out.split('\x1e').slice(1).map(parseRenames).filter((r) => r.length)
    committed.set(key, commits)
  }
  let indexTime = 0
  try {
    indexTime = statSync(join(top, '.git', 'index')).mtimeMs
  } catch {
    // a worktree or no index: read afresh each time
  }
  const wkey = `${top}@${head}@${indexTime}`
  let working = indexTime ? uncommitted.get(wkey) : undefined
  if (!working) {
    working = parseRenames(await git(top, ['diff', '-M', '-l0', '--diff-filter=R', '--name-status', 'HEAD']).catch(() => ''))
    if (indexTime) uncommitted.set(wkey, working)
  }
  return [working, ...commits]
}

/** Every earlier repository-relative path of `rel`, newest first (not including `rel`). */
export async function priorPaths(top: string, head: string, rel: string): Promise<string[]> {
  const steps = await renameSteps(top, head)
  const out: string[] = []
  let cur = rel
  for (const renames of steps) {
    const hit = renames.find((r) => r.to === cur)
    if (hit && !out.includes(hit.from) && hit.from !== rel) out.push((cur = hit.from))
  }
  return out
}

/** Every earlier repository-relative path of the folder `dir` (from the files renamed out of it), newest first. */
export async function priorDirs(top: string, head: string, dir: string): Promise<string[]> {
  const steps = await renameSteps(top, head)
  const out: string[] = []
  let current = [dir]
  for (const renames of steps) {
    const found = new Set<string>()
    for (const r of renames) for (const d of current) if (r.to.startsWith(`${d}/`) && dirname(r.to) === d) found.add(dirname(r.from))
    for (const d of found) if (d !== dir && !out.includes(d)) out.push(d)
    current = [...new Set([...current, ...found])]
  }
  return out
}

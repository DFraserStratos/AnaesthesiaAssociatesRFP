/**
 * A card file's history in git, read-only: every commit that touched it, the record at each, and
 * whether the working file differs from HEAD. No git, or a folder outside a repository, reads as
 * no history. Asynchronous, so a slow repository never stalls the dev server's other requests.
 * (Card IDs never change, so a file is never renamed: no `--follow`, which is several times slower.)
 */
import { execFile, spawn } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { promisify } from 'node:util'
import { parseItem } from '../shared/files.ts'
import type { CommitInfo, GitFileHistory, GitVersion, ScreenshotCommit } from '../shared/history.ts'
import type { Item } from '../shared/types.ts'

const run = promisify(execFile)
const git = async (cwd: string, args: string[]) => (await run('git', args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })).stdout

const parse = (text: string): Item | null => {
  try {
    return parseItem(text)
  } catch {
    return null
  }
}

/** Every `sha:path` blob in one `git cat-file --batch` process; null where the file was absent. */
function readBlobs(top: string, specs: string[]): Promise<(string | null)[]> {
  return new Promise((resolve, reject) => {
    const p = spawn('git', ['cat-file', '--batch'], { cwd: top })
    const chunks: Buffer[] = []
    p.stdout.on('data', (c: Buffer) => chunks.push(c))
    p.on('error', reject)
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error(`git cat-file exited ${code}`))
      const buf = Buffer.concat(chunks)
      const out: (string | null)[] = []
      let at = 0
      for (let i = 0; i < specs.length; i++) {
        const nl = buf.indexOf(0x0a, at)
        const head = buf.subarray(at, nl).toString('utf8')
        at = nl + 1
        const size = /^\S+ blob (\d+)$/.exec(head)?.[1]
        if (size === undefined) {
          out.push(null) // "<spec> missing": deleted in that commit
          continue
        }
        out.push(buf.subarray(at, at + Number(size)).toString('utf8'))
        at += Number(size) + 1
      }
      resolve(out)
    })
    p.stdin.end(specs.map((s) => `${s}\n`).join(''))
  })
}

/** Commit history per file, keyed by path and HEAD, so a new commit (or a checkout) reads afresh. */
const cache = new Map<string, GitVersion[]>()

/** Does `file` differ from HEAD? False outside a repository. */
export async function gitDirty(file: string): Promise<boolean> {
  try {
    return (await git(dirname(file), ['status', '--porcelain', '--', basename(file)])).trim() !== ''
  } catch {
    return false
  }
}

export async function gitFileHistory(file: string): Promise<GitFileHistory> {
  const working = existsSync(file) ? parse(readFileSync(file, 'utf8')) : null
  const mtime = existsSync(file) ? statSync(file).mtime.toISOString() : undefined
  const none: GitFileHistory = { versions: [], dirty: false, working, mtime }
  const cwd = dirname(file)
  if (!existsSync(cwd)) return none
  try {
    const [top = '', head = ''] = (await git(cwd, ['rev-parse', '--show-toplevel', 'HEAD'])).trim().split('\n')
    // git reports its top level with symlinks resolved (macOS: /var is /private/var).
    const rel = relative(top, join(realpathSync(cwd), basename(file))).split('\\').join('/')
    const key = `${top}:${rel}@${head}`
    const status = git(top, ['status', '--porcelain', '--', rel]).catch(() => '')
    let versions = cache.get(key)
    if (!versions) {
      const log = await git(top, ['log', '--format=%H%x1f%an%x1f%aI%x1f%s', '--', rel])
      const commits: CommitInfo[] = log
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [sha = '', author = '', at = '', subject = ''] = line.split('\x1f')
          return { sha, author, at, subject }
        })
      const blobs = commits.length ? await readBlobs(top, commits.map((c) => `${c.sha}:${rel}`)) : []
      versions = commits.map((commit, i) => ({ commit, item: blobs[i] == null ? null : parse(blobs[i]!) }))
      cache.set(key, versions)
    }
    return { versions, dirty: (await status).trim() !== '', working, mtime }
  } catch {
    return none
  }
}

const shotCache = new Map<string, ScreenshotCommit[]>()

/**
 * Commits that rewrote a screenshot under `<root>/assets/<id>/` in place (added and removed images
 * show through the card's `images` field), and whether any file there is not committed yet.
 */
export async function gitScreenshots(root: string, id: string): Promise<{ commits: ScreenshotCommit[]; dirty: boolean }> {
  const none = { commits: [], dirty: false }
  if (!existsSync(root)) return none
  try {
    const [top = '', head = ''] = (await git(root, ['rev-parse', '--show-toplevel', 'HEAD'])).trim().split('\n')
    const rel = relative(top, join(realpathSync(root), 'assets', id)).split('\\').join('/')
    const status = git(top, ['status', '--porcelain', '--', `${rel}/`]).catch(() => '')
    const key = `${top}:${rel}@${head}`
    let commits = shotCache.get(key)
    if (!commits) {
      commits = []
      const out = await git(top, ['log', '--no-abbrev', '--raw', '--format=%x1e%H%x1f%an%x1f%aI%x1f%s', '--', `${rel}/`])
      for (const block of out.split('\x1e').slice(1)) {
        const [meta = '', ...lines] = block.split('\n')
        const [sha = '', author = '', at = '', subject = ''] = meta.split('\x1f')
        const files = lines.flatMap((line) => {
          // ":100644 100644 <old> <new> M\t<path>": only a file rewritten in place.
          const m = /^:\d+ \d+ ([0-9a-f]{40}) ([0-9a-f]{40}) M\t(.+)$/.exec(line)
          if (!m) return []
          const src = `assets/${id}/${basename(m[3]!)}`
          return [{ from: { src, sha: m[1]! }, to: { src, sha: m[2]! } }]
        })
        if (sha && files.length) commits.push({ commit: { sha, author, at, subject }, files })
      }
      shotCache.set(key, commits)
    }
    return { commits, dirty: (await status).trim() !== '' }
  } catch {
    return none
  }
}

/** A blob's bytes from the repository `cwd` sits in, or null (not in git, or no git). */
export async function gitBlob(cwd: string, sha: string): Promise<Buffer | null> {
  if (!/^[0-9a-f]{40}$/.test(sha)) return null
  try {
    return (await run('git', ['cat-file', 'blob', sha], { cwd, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })).stdout
  } catch {
    return null
  }
}

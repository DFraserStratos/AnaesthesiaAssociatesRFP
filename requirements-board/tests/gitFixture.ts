/**
 * Throwaway git repositories for the history readers' tests (B08): either hash width, linked
 * worktrees, merges, and a `git` shim on PATH that logs every invocation (and can fail the rename
 * log on demand), so tests can count git runs without reaching into the readers.
 */
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

export const hasGit = (() => {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

/** The object formats this git can make: always SHA-1, SHA-256 where supported. */
export const FORMATS: ('sha1' | 'sha256')[] = (() => {
  if (!hasGit) return []
  const d = mkdtempSync(join(tmpdir(), 'fmt-'))
  try {
    execFileSync('git', ['init', '-q', '--object-format=sha256'], { cwd: d, stdio: 'ignore' })
    return ['sha1', 'sha256']
  } catch {
    return ['sha1']
  } finally {
    rmSync(d, { recursive: true, force: true })
  }
})()

let clock = Date.parse('2026-01-01T00:00:00Z')

export interface Fixture {
  /** The repository's top. */
  dir: string
  /** git in the repository (or `cwd`), output as text. */
  g: (...args: string[]) => string
  /** Stage everything and commit, with a fresh, later date each time. Returns the new commit's hash. */
  commit: (msg: string, cwd?: string) => string
  /** Commit what is staged only. */
  commitStaged: (msg: string, cwd?: string) => string
  write: (rel: string, data: string | Buffer, cwd?: string) => void
  read: (rel: string) => string
  rm: (rel: string, cwd?: string) => void
  /** A plain file-system move (git is not told). */
  mv: (from: string, to: string, cwd?: string) => void
  merge: (branch: string, how: '--no-ff' | '--ff-only', msg?: string) => void
  head: (cwd?: string) => string
  /** A linked worktree on a new branch, next to the repository. */
  worktree: (branch: string) => string
  cleanup: () => void
}

export function makeRepo(format: 'sha1' | 'sha256' = 'sha1', name = 'b08-'): Fixture {
  const base = mkdtempSync(join(tmpdir(), name))
  const dir = join(base, 'repo')
  mkdirSync(dir)
  const env = () => {
    clock += 60_000
    const at = new Date(clock).toISOString()
    return { ...process.env, GIT_AUTHOR_DATE: at, GIT_COMMITTER_DATE: at }
  }
  const run = (cwd: string, args: string[]) =>
    execFileSync('git', ['-c', 'user.name=Tester', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8', env: env(), stdio: ['ignore', 'pipe', 'pipe'] })
  const g = (...args: string[]) => run(dir, args)
  const f: Fixture = {
    dir,
    g,
    commit(msg, cwd = dir) {
      run(cwd, ['add', '-A'])
      return f.commitStaged(msg, cwd)
    },
    commitStaged(msg, cwd = dir) {
      run(cwd, ['commit', '-q', '--allow-empty', '-m', msg])
      return run(cwd, ['rev-parse', 'HEAD']).trim()
    },
    write(rel, data, cwd = dir) {
      mkdirSync(dirname(join(cwd, rel)), { recursive: true })
      writeFileSync(join(cwd, rel), data)
    },
    read: (rel) => readFileSync(join(dir, rel), 'utf8'),
    rm(rel, cwd = dir) {
      rmSync(join(cwd, rel), { recursive: true, force: true })
    },
    mv(from, to, cwd = dir) {
      mkdirSync(dirname(join(cwd, to)), { recursive: true })
      renameSync(join(cwd, from), join(cwd, to))
    },
    merge(branch, how, msg = `Merge ${branch}`) {
      g('merge', '-q', how, ...(how === '--no-ff' ? ['-m', msg] : []), branch)
    },
    head: (cwd = dir) => run(cwd, ['rev-parse', 'HEAD']).trim(),
    worktree(branch) {
      const wt = join(base, `wt-${branch}`)
      g('worktree', 'add', '-q', '-b', branch, wt)
      return wt
    },
    cleanup: () => rmSync(base, { recursive: true, force: true }),
  }
  g('init', '-q', '-b', 'main', `--object-format=${format}`)
  return f
}

/**
 * A `git` on PATH that logs each call's arguments to a file and runs the real git; while the file
 * `fail` names exists, the whole-history rename log fails.
 */
export function gitShim() {
  const dir = mkdtempSync(join(tmpdir(), 'git-shim-'))
  const log = join(dir, 'calls.log')
  const fail = join(dir, 'fail')
  const real = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim()
  writeFileSync(
    join(dir, 'git'),
    `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}'\nif [ -f '${fail}' ]; then case "$*" in *log*diff-filter=R*) exit 1;; esac; fi\nexec '${real}' "$@"\n`,
  )
  chmodSync(join(dir, 'git'), 0o755)
  const oldPath = process.env.PATH
  process.env.PATH = `${dir}:${oldPath}`
  return {
    calls: () => (existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean) : []),
    reset: () => writeFileSync(log, ''),
    failRenames: (on: boolean) => (on ? writeFileSync(fail, '') : rmSync(fail, { force: true })),
    restore() {
      process.env.PATH = oldPath
      rmSync(dir, { recursive: true, force: true })
    },
  }
}

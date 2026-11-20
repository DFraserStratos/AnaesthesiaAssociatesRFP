/**
 * Link runs: each `link-requirements` run keeps its proposal files in its own folder, so applying a
 * run never picks up an earlier run's proposals (a link the user removed since would come back).
 * `links:index` starts a run in `<root>/current/` (moving the previous one to `<root>/runs/<its start>/`),
 * the workflow writes there by default, and `links:apply` applies that folder unless told another.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export const CURRENT_RUN = 'current'
const RUN_FILE = 'run.json'
const isVerified = (f: string) => f.endsWith('.verified.json')

/** A time as a folder-safe stamp, `2026-11-20T13-15-04Z`. */
export const runStamp = (d: Date) => d.toISOString().replace(/\.\d+Z$/, 'Z').replace(/:/g, '-')

function startedOf(dir: string): string | null {
  try {
    const started = (JSON.parse(readFileSync(join(dir, RUN_FILE), 'utf8')) as { started?: unknown }).started
    return typeof started === 'string' && /^[\w-]+$/.test(started) ? started : null
  } catch {
    return null
  }
}

/**
 * Start a new link run under `root`: an existing `current/` holding any proposal file moves to
 * `runs/<its start>/` (an empty one is simply replaced), and a fresh `current/` records its start.
 */
export function startLinkRun(root: string, now: Date): { dir: string; archived: string | null } {
  const cur = join(root, CURRENT_RUN)
  let archived: string | null = null
  if (existsSync(cur)) {
    // Only proposal files make a run worth keeping (links:index copies its index and batches into every run).
    if (readdirSync(cur).some((f) => /\.(proposed|verified)\.json$/.test(f))) {
      const name = startedOf(cur) ?? `before-${runStamp(now)}`
      let to = join(root, 'runs', name)
      for (let n = 2; existsSync(to); n++) to = join(root, 'runs', `${name}-${n}`)
      mkdirSync(join(root, 'runs'), { recursive: true })
      renameSync(cur, to)
      archived = to
    } else rmSync(cur, { recursive: true, force: true })
  }
  mkdirSync(cur, { recursive: true })
  writeFileSync(join(cur, RUN_FILE), JSON.stringify({ started: runStamp(now) }, null, 2) + '\n')
  return { dir: cur, archived }
}

export interface LinkRun {
  /** The run folder applied. */
  dir: string
  /** When `links:index` started it, if it says. */
  started: string | null
  /** Its verified proposal files, sorted. */
  files: string[]
  /** Proposal files loose in `root` from before runs had folders: never applied unless that folder is named. */
  loose: string[]
  /** Earlier run folders under `runs/` that hold proposal files, newest first (named when this run has none). */
  earlier: string[]
}

/** The run `links:apply` applies: the folder named (`dirArg`), else `<root>/current/`. Throws when there is none. */
export function pickLinkRun(root: string, dirArg?: string): LinkRun {
  const dir = resolve(dirArg ?? join(root, CURRENT_RUN))
  if (!existsSync(dir)) throw new Error(`No link run at ${dir}. Run links:index, then the link-requirements workflow (or name a run folder).`)
  const files = readdirSync(dir).filter(isVerified).sort()
  const loose = dirArg === undefined && existsSync(root) ? readdirSync(root).filter(isVerified).sort() : []
  const runs = join(root, 'runs')
  const earlier = !files.length && existsSync(runs) ? readdirSync(runs).sort().reverse().map((r) => join(runs, r)).filter((r) => readdirSync(r).some(isVerified)) : []
  return { dir, started: startedOf(dir), files, loose, earlier }
}

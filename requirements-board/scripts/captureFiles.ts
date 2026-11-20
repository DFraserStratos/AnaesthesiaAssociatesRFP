/**
 * How `capture.ts` names the screenshots it writes, and how it tells them from
 * hand-added ones. Kept apart from the Playwright runner so it can be tested.
 *
 * A generated file is `assets/<ID>/<app>-<shot>[-<state>].png`, where <app> is
 * one of the project's screenshot apps (`board.config.json`). Anything else in
 * the folder is hand-added and never touched, so hand-added screenshots must not
 * start with an app name and a dash (name them e.g. `hand-dashboard.png`, not
 * `web-dashboard.png`).
 */
import { existsSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Matches a generated file name for these app keys. No apps: matches nothing. */
export const generatedPattern = (apps: readonly string[]) => (apps.length ? new RegExp(`^(?:${apps.map(escape).join('|')})-[a-z0-9-]+\\.png$`) : /$^/)

/** The catalogue-relative path a shot's state is written to. */
export const fileFor = (id: string, shot: { app: string; name: string }, state: { state?: string }) =>
  `assets/${id}/${shot.app}-${shot.name}${state.state ? `-${state.state}` : ''}.png`

/** Is this image path one the capture runner writes for item `id`? */
export const isGenerated = (id: string, src: string, apps: readonly string[]) =>
  src.startsWith(`assets/${id}/`) && generatedPattern(apps).test(src.slice(`assets/${id}/`.length))

/** Delete generated files in `dir` that are not in `wanted` (file names). Returns the names removed. */
export function pruneGenerated(dir: string, wanted: Set<string>, apps: readonly string[]): string[] {
  return pruneShots(dir, wanted, apps).removed
}

/**
 * Delete generated files in `dir` that are not in `wanted`, except one another item still lists:
 * `usedBy(name)` names the other items whose `images` point at it, and such a file is kept and
 * returned with them, so no item is left pointing at a missing image.
 */
export function pruneShots(dir: string, wanted: Set<string>, apps: readonly string[], usedBy: (name: string) => string[] = () => []) {
  const removed: string[] = []
  const kept: { file: string; users: string[] }[] = []
  if (!existsSync(dir)) return { removed, kept }
  const generated = generatedPattern(apps)
  for (const f of readdirSync(dir)) {
    if (!generated.test(f) || wanted.has(f)) continue
    const users = usedBy(f)
    if (users.length) kept.push({ file: f, users })
    else {
      unlinkSync(join(dir, f))
      removed.push(f)
    }
  }
  return { removed, kept }
}

/**
 * The item IDs `--only` selects: `--only A,B` or `--only=A,B`. Undefined when `--only` is absent (a full
 * run). A value that is missing, empty, another flag, or a list with no IDs is an error, so a mistyped
 * or empty argument never turns into a full capture.
 */
export function parseOnly(argv: readonly string[]): { ids?: string[]; error?: string } {
  const at = argv.findIndex((a) => a === '--only' || a.startsWith('--only='))
  if (at < 0) return {}
  if (argv.slice(at + 1).some((a) => a === '--only' || a.startsWith('--only='))) return { error: '--only is given twice; give one comma-separated list' }
  const arg = argv[at]!
  const value = arg === '--only' ? argv[at + 1] : arg.slice('--only='.length)
  if (value === undefined || value.startsWith('--')) return { error: '--only needs a list of IDs (--only US-01.1.1,FT-02.3); leave --only out for a full capture' }
  const ids = value.split(',').map((s) => s.trim()).filter(Boolean)
  if (!ids.length) return { error: `--only "${value}" names no IDs; leave --only out for a full capture` }
  return { ids }
}

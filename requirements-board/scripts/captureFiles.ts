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
  if (!existsSync(dir)) return []
  const generated = generatedPattern(apps)
  const removed: string[] = []
  for (const f of readdirSync(dir)) {
    if (generated.test(f) && !wanted.has(f)) {
      unlinkSync(join(dir, f))
      removed.push(f)
    }
  }
  return removed
}

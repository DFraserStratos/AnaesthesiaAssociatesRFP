/**
 * How `capture.ts` names the screenshots it writes, and how it tells them from
 * hand-added ones. Kept apart from the Playwright runner so it can be tested.
 *
 * A generated file is `assets/<ID>/<app>-<shot>[-<state>].png`, where <app> is
 * one of IMAGE_APPS. Anything else in the folder is hand-added and never
 * touched, so hand-added screenshots must not start with an app name and a
 * dash (name them e.g. `hand-dashboard.png`, not `web-dashboard.png`).
 */
import { existsSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { IMAGE_APPS } from '../shared/types.ts'

export const GENERATED = new RegExp(`^(?:${IMAGE_APPS.join('|')})-[a-z0-9-]+\\.png$`)

/** The catalogue-relative path a shot's state is written to. */
export const fileFor = (id: string, shot: { app: string; name: string }, state: { state?: string }) =>
  `assets/${id}/${shot.app}-${shot.name}${state.state ? `-${state.state}` : ''}.png`

/** Is this image path one the capture runner writes for item `id`? */
export const isGenerated = (id: string, src: string) => src.startsWith(`assets/${id}/`) && GENERATED.test(src.slice(`assets/${id}/`.length))

/** Delete generated files in `dir` that are not in `wanted` (file names). Returns the names removed. */
export function pruneGenerated(dir: string, wanted: Set<string>): string[] {
  if (!existsSync(dir)) return []
  const removed: string[] = []
  for (const f of readdirSync(dir)) {
    if (GENERATED.test(f) && !wanted.has(f)) {
      unlinkSync(join(dir, f))
      removed.push(f)
    }
  }
  return removed
}

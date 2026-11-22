/**
 * The source index of a catalogue folder, from its artifact sidecars alone (no file facts), for
 * scripts and agent tools that resolve note cites as the board does (accepted decision 18): an agent
 * imports this and `shared/sources.ts` from the catalogue path it already takes, and calls
 * `resolveNoteCite(loadSourceIndex(req), cite)`. A sidecar that does not parse is left out, as the
 * board leaves it out.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripBom } from '../shared/bom.ts'
import { parseArtifact } from '../shared/files.ts'
import { buildSourceIndex, type SourceIndex } from '../shared/sources.ts'
import type { Artifact } from '../shared/types.ts'

export function loadSourceIndex(requirementsDir: string): SourceIndex {
  const dir = join(requirementsDir, 'artifacts')
  const artifacts: Artifact[] = []
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md') || f.startsWith('.')) continue
    try {
      artifacts.push(parseArtifact(stripBom(readFileSync(join(dir, f), 'utf8'))))
    } catch {
      // The check reports it; resolution goes on without it.
    }
  }
  return buildSourceIndex(artifacts)
}

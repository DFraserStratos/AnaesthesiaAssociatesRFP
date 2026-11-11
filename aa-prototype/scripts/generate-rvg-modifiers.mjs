/**
 * Writes `src/domain/seed/rvgModifiers.generated.ts` from the catalogue's NZSA RVG
 * 2021 modifier files (artifact AR-34). Catch-up Phase 19b (US-05.1.5, RV-38):
 * the modifier master is the RVG table as printed, never re-transcribed by hand.
 * Re-run after the catalogue file changes; the drift guard fails until you do.
 *
 *   npm run rvg:modifiers
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseIncludedModifiers, parseModifierTable, renderGenerated } from './rvgModifiersParse.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const files = join(root, '..', 'requirements-board', 'requirements', 'artifacts', 'files')
const md = readFileSync(join(files, 'NZSA RVG 2021 modifiers.md'), 'utf8')
const csv = readFileSync(join(files, 'NZSA RVG 2021 included modifiers.csv'), 'utf8')
const rows = parseModifierTable(md)
const included = parseIncludedModifiers(csv)
const out = join(root, 'src', 'domain', 'seed', 'rvgModifiers.generated.ts')
writeFileSync(out, renderGenerated(rows, included))
console.log(`Wrote ${rows.length} modifier rows and ${included.length} included-modifier rows to ${out}`)

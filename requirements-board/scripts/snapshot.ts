/**
 * Write a snapshot of the board: a static, read-only copy to host for people outside the team (GitHub
 * Pages, Cloudflare Pages, any static host, ideally behind a sign-in). Readers browse everything and
 * keep answers, comments and suggested edits in their browser, then download them as a file to send
 * back (`src/responses/`).
 *   npm run snapshot -- --out "<folder>"
 * A relative --out is read from the folder the command was run from. The folder must be new, empty, or
 * an earlier snapshot, which is replaced whole. The catalogue is taken as it is on disk, uncommitted
 * changes included (the snapshot says so).
 */
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { REQUIREMENTS_DIR } from '../server/catalogueFs.ts'
import { shown, userPath } from './userPath.ts'
import { boardVersion, gitState, outProblem, sizeOf, staticCatalogue, writeSnapshotData } from './snapshotFiles.ts'

const BOARD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fail = (msg: string): never => {
  console.error(msg)
  process.exit(1)
}

const argv = process.argv.slice(2)
const outArg = argv[argv.indexOf('--out') + 1]
if (!argv.includes('--out') || !outArg || outArg.startsWith('--')) fail('Pass --out "<folder>": where to write the snapshot.')
const out = userPath(outArg!)
const refusal = outProblem(out, BOARD_DIR)
if (refusal) fail(refusal)

// Built beside the target, then swapped in, so a failed run leaves an earlier snapshot as it was.
mkdirSync(dirname(out), { recursive: true })
const work = join(dirname(out), `.${basename(out)}.snapshot-${process.pid}`)
rmSync(work, { recursive: true, force: true })

try {
  console.log('Building the read-only board...')
  await build({ root: BOARD_DIR, configFile: join(BOARD_DIR, 'vite.config.ts'), mode: 'snapshot', logLevel: 'warn', build: { outDir: work, emptyOutDir: true, chunkSizeWarningLimit: 5000 } })

  console.log('Writing the catalogue, screenshots and artifact files...')
  const { commit, dirty } = gitState(REQUIREMENTS_DIR)
  const data = staticCatalogue(REQUIREMENTS_DIR, { takenAt: new Date().toISOString(), commit, dirty, boardVersion: boardVersion(BOARD_DIR) })
  const written = writeSnapshotData(REQUIREMENTS_DIR, work, data)

  if (existsSync(out)) rmSync(out, { recursive: true, force: true })
  renameSync(work, out)

  const size = sizeOf(out)
  const mb = (size.bytes / 1024 / 1024).toFixed(0)
  console.log(`\nWrote a snapshot to ${shown(out)}: ${size.files} files, ${mb} MB.`)
  console.log(`  ${Object.keys(data.items).length} cards, ${Object.keys(data.questions).length} outstanding items, ${Object.keys(data.artifacts).length} artifacts (${written.artifactFiles} files), ${written.screenshots} screenshots.`)
  console.log(`  Taken from ${commit ? `commit ${commit.slice(0, 12)}` : 'outside git'}${dirty ? ', with uncommitted catalogue changes' : ''}.`)
  if (written.missing.length) console.warn(`  Artifact files not found (shown as missing): ${written.missing.join(', ')}`)
  if (size.large.length) console.warn(`  Over 25 MB, too big for Cloudflare Pages: ${size.large.join(', ')}`)
  if (size.bytes > 1024 ** 3) console.warn('  Over 1 GB, more than GitHub Pages hosts.')
  console.log('\nIt holds the whole catalogue: host it behind a sign-in (Cloudflare Access, a private Pages site) unless it is meant to be public.')
  console.log('To look at it first, serve the folder with any static server, for example:')
  console.log(`  python3 -m http.server 5182 --directory "${out}"`)
} catch (e) {
  rmSync(work, { recursive: true, force: true })
  fail(`Snapshot failed: ${(e as Error).stack ?? e}`)
}

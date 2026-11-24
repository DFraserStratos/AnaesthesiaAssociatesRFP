/**
 * The parts of `npm run snapshot` that decide and write files, apart from the Vite build, so they are
 * tested alone (`tests/snapshot.test.ts`): where a snapshot may go, the data file, the screenshots and
 * artifact files beside it, and the host files.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { createCatalogueApi } from '../server/catalogueApi.ts'
import { artifactPath } from '../server/artifactFiles.ts'
import { hasJunk } from '../server/junk.ts'
import { inside, realPath } from '../server/realPaths.ts'
import { SNAPSHOT_DATA, SNAPSHOT_MARKER, snapshotArtifactFile, type SnapshotInfo, type StaticCatalogue } from '../shared/snapshot.ts'
import type { CatalogueSnapshot } from '../shared/types.ts'

/** Finder's and Explorer's droppings: never a reason to refuse a folder. */
const OS_LITTER = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini'])

/**
 * Why a snapshot may not be written to `out`, or null when it may: never the board, a folder inside it
 * or one that holds it, and never a folder with files in it unless an earlier snapshot made it.
 */
export function outProblem(out: string, boardDir: string): string | null {
  const board = realPath(boardDir)
  const same = (a: string, b: string) => resolve(a) === resolve(b) || (existsSync(a) && realPath(a) === b)
  if (same(out, board) || inside(out, board)) return `${out} is inside the board (${board}): write the snapshot somewhere else.`
  if (existsSync(out) && inside(board, realPath(out))) return `${out} holds the board: write the snapshot to a folder of its own.`
  if (!existsSync(out)) return null
  if (!statSync(out).isDirectory()) return `${out} is a file, not a folder.`
  const entries = readdirSync(out).filter((n) => !OS_LITTER.has(n))
  if (entries.length && !entries.includes(SNAPSHOT_MARKER)) return `${out} has files in it and no earlier snapshot: write the snapshot to an empty or new folder.`
  return null
}

/** What the catalogue was taken from: the commit, whether the requirements folder had uncommitted changes. */
export function gitState(root: string): { commit: string | null; dirty: boolean } {
  const git = (args: string[]) => execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } }).toString().trim()
  try {
    return { commit: git(['rev-parse', 'HEAD']), dirty: git(['status', '--porcelain', '--', '.']) !== '' }
  } catch {
    return { commit: null, dirty: false }
  }
}

/** The catalogue as the dev server serves it, without its check output, and the snapshot's facts. */
export function staticCatalogue(root: string, info: Omit<SnapshotInfo, 'project'>): StaticCatalogue {
  const snap = createCatalogueApi(root).handle({ method: 'GET', path: '/api/catalogue' }) as CatalogueSnapshot
  return { ...snap, epoch: '', seq: 0, issues: [], snapshot: { ...info, project: snap.config.project.name ?? '' } }
}

export interface Written {
  screenshots: number
  artifactFiles: number
  /** Artifacts whose file could not be found: shown on the page as missing. */
  missing: string[]
}

/**
 * Write the data file, the screenshots (`requirements/assets/...`, as `assetUrl` builds them) and each
 * artifact's file (`artifact-file/<id><ext>`, resolved per artifact, since some live outside the
 * artifacts folder), plus the host files and the marker. `dir` holds the built page already.
 */
export function writeSnapshotData(root: string, dir: string, data: StaticCatalogue): Written {
  writeFileSync(join(dir, SNAPSHOT_DATA), JSON.stringify(data))
  let screenshots = 0
  const assets = join(root, 'assets')
  if (existsSync(assets)) {
    cpSync(assets, join(dir, 'requirements', 'assets'), {
      recursive: true,
      filter: (src) => {
        const rel = relative(assets, src)
        if (hasJunk(rel)) return false
        if (rel && statSync(src).isFile()) screenshots++
        return true
      },
    })
  }
  let artifactFiles = 0
  const missing: string[] = []
  for (const rec of Object.values(data.artifacts)) {
    const file = rec.data.file
    if (!file) continue // mermaid: its source is in the sidecar
    const src = artifactPath(file, root)
    if (!src || !existsSync(src)) {
      missing.push(rec.data.id)
      continue
    }
    const to = join(dir, ...decodeURIComponent(snapshotArtifactFile(rec.data.id, file)).split('/'))
    mkdirSync(dirname(to), { recursive: true })
    copyFileSync(src, to)
    artifactFiles++
  }
  writeHostFiles(dir)
  writeFileSync(join(dir, SNAPSHOT_MARKER), JSON.stringify({ ...data.snapshot, screenshots, artifactFiles }, null, 2) + '\n')
  return { screenshots, artifactFiles, missing }
}

/**
 * GitHub Pages: `.nojekyll`, so every file is served as is. Cloudflare Pages: `_headers`, keeping the dev
 * server's guards (no type sniffing; an SVG may run no script and load nothing) and the data file fresh.
 * Other hosts ignore both.
 */
function writeHostFiles(dir: string) {
  writeFileSync(join(dir, '.nojekyll'), '')
  const svg = "  Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src data:"
  writeFileSync(
    join(dir, '_headers'),
    ['/*', '  X-Content-Type-Options: nosniff', '', `/${SNAPSHOT_DATA}`, '  Cache-Control: no-cache', '', '/artifact-file/*.svg', svg, '', '/requirements/assets/*.svg', svg, ''].join('\n'),
  )
}

/** Every file under `dir`: how many, how big, and any too big for the common hosts' per-file limit. */
export function sizeOf(dir: string, limit = 25 * 1024 * 1024): { files: number; bytes: number; large: string[] } {
  let files = 0
  let bytes = 0
  const large: string[] = []
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.isFile()) {
        const n = statSync(p).size
        files++
        bytes += n
        if (n > limit) large.push(relative(dir, p).split(sep).join('/'))
      }
    }
  }
  walk(dir)
  return { files, bytes, large }
}

/** The board kit's version, from its package.json. */
export const boardVersion = (boardDir: string) => (JSON.parse(readFileSync(join(boardDir, 'package.json'), 'utf8')) as { version: string }).version

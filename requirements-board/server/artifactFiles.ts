/**
 * An artifact's file on disk: where it is (the requirements folder, or the repository for a path
 * starting `/`), and what it holds, read once per version and cached. Feeds the catalogue check
 * (`ArtifactFacts`) and the board (`ArtifactMeta`).
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { looseText, markdownFacts, mermaidNodeIds, rasterSize, svgFacts } from '../shared/artifacts.ts'
import type { ArtifactFacts } from '../shared/check.ts'
import { artifactFormat, type Artifact, type ArtifactFormat, type ArtifactMeta } from '../shared/types.ts'
import { gitBlobSha } from './historyJournal.ts'
import { pdfFactsFor, primePdfFacts } from './pdfFactsStore.ts'
import { linkOut, realEntry, realPath, under } from './realPaths.ts'

const here = dirname(fileURLToPath(import.meta.url))
/**
 * The repository a `/`-rooted artifact path starts from: `REPO_ROOT` from the environment, else
 * the git repository the requirements folder is in, else the folder that holds it. Anchored on
 * the data, not on this code, so it holds wherever the board itself is installed.
 */
export const REPO_ROOT = process.env.REPO_ROOT ? resolve(process.env.REPO_ROOT) : repoOf(process.env.REQUIREMENTS_DIR ? resolve(process.env.REQUIREMENTS_DIR) : resolve(here, '../requirements'))

/**
 * Where a `/`-rooted path starts for a requirements folder in the git repository `gitTop`:
 * `REPO_ROOT` when the environment sets it (as `artifactPath` reads it), else that repository.
 */
export const repoRootFor = (gitTop: string) => (process.env.REPO_ROOT ? resolve(process.env.REPO_ROOT) : gitTop)

function repoOf(data: string): string {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: data, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return dirname(data) // not in git, or the folder is not there yet
  }
}

export { nodeBinary } from './pdfFactsStore.ts'

export const ARTIFACT_MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
}

/** The folder an artifact's `file` is read from: the repository for a path starting `/`, else the requirements folder. */
export const artifactBase = (file: string, root: string) => resolve(file.startsWith('/') ? REPO_ROOT : root)

/**
 * The absolute path of an artifact's `file`, or null when it would step outside its base (as
 * written: a symbolic link that leads out is followed, and named by `linkOut`).
 */
export function artifactPath(file: string, root: string): string | null {
  const base = artifactBase(file, root)
  const abs = resolve(base, file.startsWith('/') ? file.slice(1) : file)
  return under(abs, base) ? abs : null
}

let repoReal: string | undefined
/**
 * A file's path from the repository root, as `/`-rooted artifact paths are written. Both sides
 * are compared as real folders: git names the repository by its real path, while the requirements
 * folder may be reached through a link (a macOS temp folder under `/var`).
 */
export const repoRelative = (abs: string) => relative((repoReal ??= realPath(REPO_ROOT)), realEntry(abs)).split(sep).join('/')

export interface ArtifactInfo {
  facts: ArtifactFacts
  meta: ArtifactMeta
}

const cache = new Map<string, { key: string; info: ArtifactInfo }>()

const empty = (format: ArtifactFormat | null): ArtifactMeta => ({ format, fileRev: null, bounds: null, pages: null, headings: null, lines: null, points: null, bytes: null, path: null })

function fail(format: ArtifactFormat | null, error: string, meta: ArtifactMeta = empty(format)): ArtifactInfo {
  return { facts: { format, ok: false, error, bounds: null }, meta }
}

/**
 * Read every PDF these artifacts name that this process has not already read, in one extractor run
 * (see `pdfFactsStore.ts`), so `artifactInfo` then finds them all. Never throws.
 */
export function primePdfs(artifacts: Artifact[], root: string) {
  const files: { abs: string; buf: Buffer }[] = []
  for (const a of artifacts) {
    try {
      if (!a.file || artifactFormat(a) !== 'pdf') continue
      const abs = artifactPath(a.file, root)
      if (!abs) continue
      const stat = statSync(abs)
      if (!stat.isFile() || cache.get(abs)?.key === versionKey(a, stat)) continue
      files.push({ abs, buf: readFileSync(abs) })
    } catch {
      // artifactInfo reports it
    }
  }
  try {
    primePdfFacts(files)
  } catch (e) {
    console.error('[artifacts] reading PDFs failed:', e)
  }
}

const versionKey = (a: Artifact, stat: { mtimeMs: number; size: number }) => `${a.file}|${stat.mtimeMs}|${stat.size}`

/**
 * What the artifact's file (or mermaid source) holds. Cached per file version, so a reload reads
 * only what changed. Never throws: any failure is the artifact's error, and a failure to read the
 * file or derive its facts is not cached, so the next load tries again.
 */
export function artifactInfo(a: Artifact, root: string): ArtifactInfo {
  try {
    return infoOf(a, root)
  } catch (e) {
    return fail(null, `file ${a.file}: could not be read (${(e as Error)?.message ?? String(e)})`)
  }
}

function infoOf(a: Artifact, root: string): ArtifactInfo {
  const format = artifactFormat(a)
  if (!a.file) {
    if (format !== 'mermaid') return fail(null, 'no file')
    return { facts: { format, ok: true, bounds: null, nodeIds: mermaidNodeIds(a.source) }, meta: empty(format) }
  }
  const abs = artifactPath(a.file, root)
  if (!abs) return fail(format, `file ${a.file} must stay inside the requirements folder (or start with / for a path from the repository root)`)
  if (format === 'markdown' && dirname(abs) === resolve(root, 'artifacts')) {
    return fail(format, `file ${a.file}: a Markdown document can't live directly in artifacts/, where every .md is a sidecar; put it in artifacts/files/`)
  }
  let stat
  try {
    stat = statSync(abs)
  } catch {
    return fail(format, `file ${a.file} is missing`)
  }
  if (!stat.isFile()) return fail(format, `file ${a.file} is not a file`)
  const key = versionKey(a, stat)
  const hit = cache.get(abs)
  if (hit?.key === key) return hit.info

  let buf: Buffer
  try {
    buf = readFileSync(abs)
  } catch (e) {
    const err = e as NodeJS.ErrnoException
    return fail(format, `file ${a.file} could not be read (${err.code ?? err.message})`)
  }
  try {
    return derive(a, root, format, abs, buf, key, stat.size)
  } catch (e) {
    return fail(format, `file ${a.file}: its contents could not be read (${(e as Error)?.message ?? String(e)})`)
  }
}

function derive(a: Artifact, root: string, format: ArtifactFormat | null, abs: string, buf: Buffer, key: string, size: number): ArtifactInfo {
  const meta: ArtifactMeta = { ...empty(format), fileRev: gitBlobSha(buf), bytes: size, path: repoRelative(abs) }
  const out = linkOut(abs, artifactBase(a.file!, root)) // `a.file` is set: infoOf returned early otherwise
  let info: ArtifactInfo
  if (format === 'svg') {
    const f = svgFacts(buf.toString('utf8'))
    meta.bounds = f.bounds
    info = { facts: { format, ok: !f.error, error: f.error && `file ${a.file}: ${f.error}`, bounds: f.bounds, svg: { texts: f.texts, elements: f.elements } }, meta }
  } else if (format === 'raster') {
    const size = rasterSize(buf)
    meta.bounds = size && { x: 0, y: 0, w: size.w, h: size.h }
    info = size ? { facts: { format, ok: true, bounds: meta.bounds }, meta } : fail(format, `file ${a.file} is not a readable PNG, JPEG or WebP image`, meta)
  } else if (format === 'markdown') {
    const f = markdownFacts(buf.toString('utf8'))
    meta.headings = f.headings
    meta.lines = f.lines
    meta.points = f.points
    info = { facts: { format, ok: true, bounds: null, markdown: f }, meta }
  } else if (format === 'pdf') {
    const r = pdfFactsFor(abs, buf)
    // A run that failed for the moment (a timeout, the reader not starting) is not this version's
    // facts: reported, but not cached, so the next load tries again.
    if ('unread' in r) return fail(format, `file ${a.file} could not be read as a PDF (${r.error})`, meta)
    if ('error' in r) info = fail(format, `file ${a.file} could not be read as a PDF (${r.error})`, meta)
    else {
      meta.pages = r.pages.map((p) => ({ w: p.w, h: p.h }))
      info = { facts: { format, ok: true, bounds: null, pdf: { pages: r.pages.map((p) => ({ w: p.w, h: p.h, loose: looseText(p.text) })) } }, meta }
    }
  } else info = fail(format, `file ${a.file} is not a kind the board shows`, meta)
  if (out) info.facts.linkOut = out
  cache.set(abs, { key, info })
  return info
}

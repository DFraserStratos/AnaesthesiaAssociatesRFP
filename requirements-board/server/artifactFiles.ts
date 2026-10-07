/**
 * An artifact's file on disk: where it is (the requirements folder, or the repository for a path
 * starting `/`), and what it holds, read once per version and cached. Feeds the catalogue check
 * (`ArtifactFacts`) and the board (`ArtifactMeta`).
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { looseText, markdownFacts, mermaidNodeIds, rasterSize, svgFacts } from '../shared/artifacts.ts'
import type { ArtifactFacts } from '../shared/check.ts'
import { artifactFormat, type Artifact, type ArtifactFormat, type ArtifactMeta } from '../shared/types.ts'
import { gitBlobSha } from './historyJournal.ts'

const here = dirname(fileURLToPath(import.meta.url))
/** The repository a `/`-rooted artifact path starts from. */
export const REPO_ROOT = process.env.REPO_ROOT ? resolve(process.env.REPO_ROOT) : resolve(here, '../..')
const PDF_SCRIPT = join(here, 'pdfFacts.ts')

export const ARTIFACT_MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
}

/**
 * The absolute path of an artifact's `file`, or null when it would step outside its base: the
 * requirements folder for a plain path, the repository for one starting `/`.
 */
export function artifactPath(file: string, root: string): string | null {
  const repo = file.startsWith('/')
  const base = resolve(repo ? REPO_ROOT : root)
  const abs = resolve(base, repo ? file.slice(1) : file)
  return abs.startsWith(base + sep) ? abs : null
}

export interface ArtifactInfo {
  facts: ArtifactFacts
  meta: ArtifactMeta
}

const cache = new Map<string, { key: string; info: ArtifactInfo }>()

const empty = (format: ArtifactFormat | null): ArtifactMeta => ({ format, fileRev: null, bounds: null, pages: null, headings: null, lines: null, points: null, bytes: null, path: null })

function fail(format: ArtifactFormat | null, error: string, meta: ArtifactMeta = empty(format)): ArtifactInfo {
  return { facts: { format, ok: false, error, bounds: null }, meta }
}

function readPdf(abs: string): { pages: { w: number; h: number; text: string }[] } | { error: string } {
  try {
    const out = execFileSync(process.execPath, [PDF_SCRIPT, abs], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
    return JSON.parse(out) as { pages: { w: number; h: number; text: string }[] } | { error: string }
  } catch (e) {
    return { error: (e as Error).message.split('\n')[0]! }
  }
}

/** What the artifact's file (or mermaid source) holds. Cached per file version, so a reload reads only what changed. */
export function artifactInfo(a: Artifact, root: string): ArtifactInfo {
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
  const key = `${a.file}|${stat.mtimeMs}|${stat.size}`
  const hit = cache.get(abs)
  if (hit?.key === key) return hit.info

  const buf = readFileSync(abs)
  const meta: ArtifactMeta = { ...empty(format), fileRev: gitBlobSha(buf), bytes: stat.size, path: relative(REPO_ROOT, abs).split(sep).join('/') }
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
    const r = readPdf(abs)
    if ('error' in r) info = fail(format, `file ${a.file} could not be read as a PDF (${r.error})`, meta)
    else {
      meta.pages = r.pages.map((p) => ({ w: p.w, h: p.h }))
      info = { facts: { format, ok: true, bounds: null, pdf: { pages: r.pages.map((p) => ({ w: p.w, h: p.h, loose: looseText(p.text) })) } }, meta }
    }
  } else info = fail(format, `file ${a.file} is not a kind the board shows`, meta)
  cache.set(abs, { key, info })
  return info
}

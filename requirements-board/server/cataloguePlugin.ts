/**
 * The board's "backend": a Vite dev-server plugin that serves the catalogue
 * file API (`catalogueApi.ts`) and screenshot assets, and watches the folder
 * so edits made elsewhere (an agent, a terminal, git) reach the open board as
 * `catalogue:changed` HMR events. No separate server process.
 */
import { createReadStream, existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { basename, dirname, extname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import type { ArtifactRec, CatalogueEvent } from '../shared/types.ts'
import { ARTIFACT_MIME, artifactPath } from './artifactFiles.ts'
import { HttpError, createCatalogueApi } from './catalogueApi.ts'
import { REQUIREMENTS_DIR } from './catalogueFs.ts'
import { OBJECT_SHA, blobShaOf, git, gitBlob, repoTop } from './gitHistory.ts'
import { priorDirs, priorPaths } from './gitRenames.ts'
import { createJournal } from './historyJournal.ts'

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}
/**
 * Where the change journal lives: HISTORY_DIR, else `.history/` beside this app for the real
 * requirements folder, else a temp folder per folder (a fixture never mixes into the real one's history).
 */
function historyDirFor(root: string): string {
  if (process.env.HISTORY_DIR) return resolve(process.env.HISTORY_DIR)
  if (resolve(root) === resolve(REQUIREMENTS_DIR) && !process.env.REQUIREMENTS_DIR) return join(dirname(fileURLToPath(import.meta.url)), '..', '.history')
  return join(tmpdir(), 'requirements-board-history', resolve(root).replace(/[^A-Za-z0-9]+/g, '_').slice(-80))
}

/** Coalesce bursts of file events, but never hold a sync back longer than this. */
const DEBOUNCE_MS = 120
const MAX_WAIT_MS = 600
const MAX_BODY_BYTES = 2_000_000

async function readJson(req: IncomingMessage): Promise<unknown> {
  if (req.method === 'GET') return undefined
  const chunks: Buffer[] = []
  let size = 0
  for await (const c of req) {
    size += (c as Buffer).length
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'request body is too large')
    chunks.push(c as Buffer)
  }
  if (!size) return undefined
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'request body is not JSON')
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function cataloguePlugin(root = REQUIREMENTS_DIR): Plugin {
  return {
    name: 'catalogue-api',
    configureServer(dev) {
      const api = createCatalogueApi(root, (e: CatalogueEvent) => dev.ws.send('catalogue:changed', e), { journal: createJournal(historyDirFor(root)), watched: true })

      const sync = () => {
        try {
          api.syncFromDisk()
        } catch (e) {
          dev.config.logger.error(`[catalogue] could not re-read the catalogue: ${(e as Error).message}`)
        }
      }
      const rootAbs = resolve(root)
      let timer: ReturnType<typeof setTimeout> | undefined
      let firstPending: number | undefined
      dev.watcher.add(rootAbs)
      // Artifacts can show documents that live elsewhere in the repository: watch those files too.
      const outside = new Set<string>()
      const watchArtifactFiles = () => {
        for (const rec of Object.values(api.getState().artifacts)) {
          const abs = rec.data.file ? artifactPath(rec.data.file, root) : null
          if (abs && !abs.startsWith(rootAbs + sep) && !outside.has(abs)) {
            outside.add(abs)
            dev.watcher.add(abs)
          }
        }
      }
      watchArtifactFiles()
      // The Diff review's commit list counts every commit: start it now, after startup, so the
      // first visit to the tab finds it ready. A folder outside git simply has no list.
      setTimeout(() => {
        try {
          api.warmDiff()
        } catch {
          // no git, or no repository: the tab says so when opened
        }
      }, 0).unref?.()
      dev.watcher.on('all', (_event, file) => {
        if ((!resolve(file).startsWith(rootAbs + sep) && !outside.has(resolve(file))) || file.endsWith('.tmp')) return
        // At once, not after the debounce: the Diff review never serves a comparison older than the files.
        api.worktreeChanged()
        const now = performance.now()
        firstPending ??= now
        clearTimeout(timer)
        const wait = Math.max(0, Math.min(DEBOUNCE_MS, firstPending + MAX_WAIT_MS - now))
        timer = setTimeout(() => {
          firstPending = undefined
          sync()
          watchArtifactFiles()
        }, wait)
      })

      dev.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local')
        if (url.pathname.startsWith('/requirements/')) {
          // Only screenshots: the folder sits inside Vite's root, so never fall through to its static files.
          if (!serveAsset(root, url, res)) {
            res.statusCode = 404
            res.end()
          }
          return
        }
        if (url.pathname.startsWith('/artifact-file/')) {
          if (!serveArtifactFile(root, api.getState().artifacts, url, res)) next()
          return
        }
        if (url.pathname.startsWith('/history-blob/')) {
          void serveHistoryBlob(root, url, res, api.getState().artifacts).then((ok) => ok || next())
          return
        }
        if (!url.pathname.startsWith('/api/')) return next()
        readJson(req)
          .then((body) =>
            api.handle({
              method: req.method ?? 'GET',
              path: url.pathname,
              query: Object.fromEntries(url.searchParams),
              body,
              headers: { 'content-type': req.headers['content-type'], origin: req.headers.origin, host: req.headers.host },
            }),
          )
          .then((body) => send(res, 200, body))
          .catch((e: unknown) => {
            if (e instanceof HttpError) send(res, e.status, { error: e.message, ...(e.body as object) })
            else send(res, 500, { error: (e as Error).message })
          })
      })
    },
  }
}

/**
 * An SVG can carry script. The board never runs it (it sanitises before showing one), and this
 * stops it running if an artifact's SVG is opened in a tab of its own.
 */
const SVG_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:"

/** The file an artifact shows: `/artifact-file/<ID>`, resolved through its sidecar only, so no other path is ever served. */
export function serveArtifactFile(root: string, artifacts: Record<string, ArtifactRec>, url: URL, res: ServerResponse): boolean {
  const id = decodeURIComponent(url.pathname.slice('/artifact-file/'.length))
  const file = artifacts[id]?.data.file
  const abs = file ? artifactPath(file, root) : null
  const type = abs ? ARTIFACT_MIME[extname(abs).toLowerCase()] : undefined
  if (!abs || !type || !existsSync(abs) || !statSync(abs).isFile()) return false
  res.setHeader('Content-Type', type)
  res.setHeader('Cache-Control', 'no-cache')
  if (type === 'image/svg+xml') res.setHeader('Content-Security-Policy', SVG_CSP)
  createReadStream(abs)
    .on('error', () => {
      if (!res.headersSent) res.statusCode = 404
      res.end()
    })
    .pipe(res)
  return true
}

/**
 * An earlier version of a screenshot or an artifact's file, for a history or the Diff review:
 * `/history-blob/<git blob sha>?src=assets/<ID>/<file>`, or `?artifact=<ID>` (served as the type of
 * that artifact's file now), or `?artifact=<ID>&file=<its file at that version>` (served as the type
 * of `file`, for a version whose file had another type, or an artifact since removed; honoured only
 * when the blob is at that path in some commit, or on disk). Read from git, or from the file on
 * disk while it still has that content (a version not yet committed). Returns false to fall through.
 */
export async function serveHistoryBlob(root: string, url: URL, res: ServerResponse, artifacts: Record<string, ArtifactRec> = {}): Promise<boolean> {
  const sha = url.pathname.slice('/history-blob/'.length)
  if (!OBJECT_SHA.test(sha)) return false
  const artifactId = url.searchParams.get('artifact')
  const named = url.searchParams.get('file')
  const namedAbs = artifactId && named ? artifactPath(named, root) : null
  const namedOk = !!namedAbs && !!ARTIFACT_MIME[extname(namedAbs).toLowerCase()] && (await blobWasAt(root, sha, namedAbs))
  const artifactFile = artifactId ? (namedOk ? named : (artifacts[artifactId]?.data.file ?? null)) : null
  const src = url.searchParams.get('src') ?? ''
  const abs = artifactFile ? artifactPath(artifactFile, root) : artifactId ? null : resolve(root, src)
  if (!abs) return false
  const type = artifactFile ? ARTIFACT_MIME[extname(abs).toLowerCase()] : MIME[extname(abs).toLowerCase()]
  if (!type || (!artifactFile && !abs.startsWith(resolve(root, 'assets') + sep))) return false
  let buf = await gitBlob(root, sha)
  if (!buf && existsSync(abs) && statSync(abs).isFile()) {
    const onDisk = readFileSync(abs)
    if (blobShaOf(onDisk, sha.length === 64) === sha) buf = onDisk
  }
  if (!buf) return false
  res.setHeader('Content-Type', type)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (type === 'image/svg+xml') res.setHeader('Content-Security-Policy', SVG_CSP)
  // A blob never changes: its name is its content.
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable')
  res.end(buf)
  return true
}

/**
 * `abs` with its symbolic links resolved, as git names the repository's top (a temporary folder
 * on macOS sits under one). The file itself may be gone: its nearest folder that exists is resolved.
 */
function realPath(abs: string): string {
  let dir = abs
  const rest: string[] = []
  while (!existsSync(dir) && dirname(dir) !== dir) {
    rest.unshift(basename(dir))
    dir = dirname(dir)
  }
  try {
    return join(realpathSync(dir), ...rest)
  } catch {
    return abs
  }
}

/**
 * The paths a repository-relative file had before: its own renames, and its name in each folder its
 * folder used to be (for a file removed before the folder moved, so never renamed itself).
 */
async function earlierPaths(top: string, rel: string): Promise<string[]> {
  try {
    const head = (await git(top, ['rev-parse', '--verify', 'HEAD^{commit}'])).trim()
    const dir = posix.dirname(rel)
    const [own, dirs] = await Promise.all([priorPaths(top, head, rel), dir === '.' ? [] : priorDirs(top, head, dir)])
    return [...new Set([...own, ...dirs.map((d) => (d && d !== '.' ? `${d}/${posix.basename(rel)}` : posix.basename(rel)))])].filter((p) => p !== rel)
  } catch {
    return [] // no commits yet
  }
}

/** Blob and path pairs already found together: true answers never change. */
const seenAt = new Set<string>()

/** Is blob `sha` the file at `abs`: on disk now, or at that path in some commit? */
async function blobWasAt(root: string, sha: string, abs: string): Promise<boolean> {
  const key = `${sha}|${abs}`
  if (seenAt.has(key)) return true
  let ok = false
  try {
    if (statSync(abs).isFile() && blobShaOf(readFileSync(abs), sha.length === 64) === sha) ok = true
  } catch {
    // not on disk
  }
  const top = ok ? null : await repoTop(root)
  if (top) {
    const rel = relative(top, realPath(abs)).split(sep).join('/')
    if (rel && !rel.startsWith('..') && !isAbsolute(rel)) {
      // The commits that added or removed this blob at that path, or at any path the file had
      // before (a folder moved since): any at all means it was there.
      const paths = [rel, ...(await earlierPaths(top, rel))]
      const out = await git(top, ['--literal-pathspecs', 'log', '--all', '-n1', '--format=%H', `--find-object=${sha}`, '--', ...paths]).catch(() => '')
      ok = out.trim() !== ''
    }
  }
  if (ok) {
    if (seenAt.size > 2000) seenAt.clear()
    seenAt.add(key)
  }
  return ok
}

/** Stream a file from the requirements folder's `assets/`, and nothing outside it. Returns false when it is not one. */
export function serveAsset(root: string, url: URL, res: ServerResponse): boolean {
  const rel = decodeURIComponent(url.pathname.slice('/requirements/'.length))
  const abs = resolve(root, rel)
  if (!abs.startsWith(resolve(root, 'assets') + sep) || !existsSync(abs) || !statSync(abs).isFile()) return false
  res.setHeader('Content-Type', MIME[extname(abs).toLowerCase()] ?? 'application/octet-stream')
  if (extname(abs).toLowerCase() === '.svg') res.setHeader('Content-Security-Policy', SVG_CSP)
  res.setHeader('Cache-Control', 'no-cache')
  createReadStream(abs)
    .on('error', () => {
      if (!res.headersSent) res.statusCode = 404
      res.end()
    })
    .pipe(res)
  return true
}

/**
 * The board's "backend": a Vite dev-server plugin that serves the catalogue
 * file API (`catalogueApi.ts`) and screenshot assets, and watches the folder
 * so edits made elsewhere (an agent, a terminal, git) reach the open board as
 * `catalogue:changed` HMR deliveries, one per burst of changes (`watchBatch.ts`). No separate server process.
 */
import { createReadStream, readFileSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, extname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import type { ArtifactRec, CatalogueDelivery } from '../shared/types.ts'
import { ARTIFACT_MIME, artifactBase, artifactPath } from './artifactFiles.ts'
import { HttpError, createCatalogueApi, idFromPath } from './catalogueApi.ts'
import { REQUIREMENTS_DIR } from './catalogueFs.ts'
import { Lru } from './gitCore.ts'
import { OBJECT_SHA, git, gitBlob, onDiskIs, repoTop, reportBlobChecks } from './gitHistory.ts'
import { priorDirs, priorPaths } from './gitRenames.ts'
import { holdBoardLock, historyDirFor } from './historyDir.ts'
import { createJournal } from './historyJournal.ts'
import { inside, linkOut, realPath, under } from './realPaths.ts'
import { createWatchBatch } from './watchBatch.ts'

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

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

function end(res: ServerResponse, status: number) {
  res.statusCode = status
  res.end()
}

/** How a file route warns (a file served through a link that leads out of its folder): once per message, in the server log. */
type Warn = (message: string) => void

const ASSET_PREFIX = '/requirements/'
/**
 * The board's file routes. Each answers every request under its prefix, under any spelling: a
 * file, or a 4xx. Prefixes match without regard to case and are cut off by length (every spelling
 * of a prefix has its length).
 */
const FILE_ROUTES = [ASSET_PREFIX, '/artifact-file/', '/history-blob/']

/** Vite's own `server.fs.deny` defaults, which setting the option replaces: kept, so `.env` files and keys stay refused. */
export const VITE_DENY = ['.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**']

/**
 * A folder as Vite `server.fs.deny` globs: the folder and everything in it, as written and as its
 * real path (a temp folder under `/var` is `/private/var`), glob characters escaped. Vite matches
 * them against absolute paths, ignoring case.
 */
export function denyGlobs(dir: string): string[] {
  const spellings = new Set([resolve(dir), realPath(resolve(dir))])
  return [...spellings].map((p) => p.split(sep).join('/').replace(/[\\*?[\]{}()!+@|]/g, '\\$&')).flatMap((p) => [p, `${p}/**`])
}

/**
 * A request target as the board's routes read it: the path decoded, a backslash read as `/`, and doubled
 * slashes and dot segments resolved (as Vite and the file system would read it), with the query as
 * sent. Null when the path has a malformed escape.
 */
export function routeTarget(url: string): { path: string; query: string } | null {
  const q = url.indexOf('?')
  let raw = q < 0 ? url : url.slice(0, q)
  try {
    // A target in absolute form (`http://host/path`): its path.
    if (!raw.startsWith('/')) raw = new URL(raw, 'http://local').pathname
    return { path: posix.normalize(`/${decodeURIComponent(raw).replace(/\\/g, '/')}`), query: q < 0 ? '' : url.slice(q) }
  } catch {
    return null
  }
}

/**
 * A read that another site's page asked for (fetch metadata): refused, so no other page, on
 * another port or host, can read or embed what the board serves. A top-level visit (a link opened
 * from elsewhere, a typed address), the board's own pages and clients that send no metadata (Node,
 * curl, scripts) are served. Writes are refused by the API's own checks.
 */
export function crossSiteRead(method: string, headers: IncomingMessage['headers']): boolean {
  if (method !== 'GET' && method !== 'HEAD') return false
  const site = headers['sec-fetch-site']
  if (site !== 'cross-site' && site !== 'same-site') return false
  return !(headers['sec-fetch-mode'] === 'navigate' && headers['sec-fetch-dest'] === 'document')
}

/** The catalogue folder beside the board, still under Vite's root when REQUIREMENTS_DIR points elsewhere. */
const IN_TREE = join(dirname(fileURLToPath(import.meta.url)), '..', 'requirements')

/** A file's identity (device and inode), or null when there is nothing there. */
function identity(path: string): string | null {
  try {
    const st = statSync(path, { throwIfNoEntry: false })
    return st ? `${st.dev}:${st.ino}` : null
  } catch {
    return null
  }
}

/**
 * Does a request path name a file in one of `folders` through Vite's own serving: its root, an
 * absolute `/@fs/` path, or a `/@id/` module ID? Decided by what the file system opens, not by
 * spelling: each folder above the named file is compared by identity, so letter case, Unicode case
 * folding (`requirementſ`), normalisation and links all count as the folder they open.
 */
export function namesFolder(path: string, viteRoot: string, folders: string[]): boolean {
  const homes = new Set(folders.map(identity).filter((id): id is string => id !== null))
  if (!homes.size) return false
  const abs = path.startsWith('/@fs/') ? path.slice(4).replace(/^\/(?=[A-Za-z]:)/, '') : null
  const named = abs ? [abs] : path.startsWith('/@id/') ? [path.slice(4), join(viteRoot, path.slice(4))] : [join(viteRoot, path)]
  return named.some((n) => {
    for (let p = resolve(n); ; p = dirname(p)) {
      const id = identity(p)
      if (id && homes.has(id)) return true
      if (dirname(p) === p) return false
    }
  })
}

export function cataloguePlugin(root = REQUIREMENTS_DIR): Plugin {
  return {
    name: 'catalogue-api',
    // Vite's own file serving (its root, `/@fs/`, HTML pages, module transforms) never reads a
    // catalogue folder, under any spelling: the one being served, and the one beside the board
    // (still under Vite's root when REQUIREMENTS_DIR points elsewhere). The board's routes below
    // run first and serve what the board shows.
    config(user) {
      return { server: { fs: { deny: [...(user.server?.fs?.deny ? [] : VITE_DENY), ...new Set([...denyGlobs(root), ...denyGlobs(IN_TREE)])] } } }
    },
    configureServer(dev) {
      const warned = new Set<string>()
      const warn: Warn = (message) => {
        if (warned.has(message)) return
        warned.add(message)
        dev.config.logger.warn(`[catalogue] ${message}`)
      }
      const historyDir = historyDirFor(root)
      const api = createCatalogueApi(root, (d: CatalogueDelivery) => dev.ws.send('catalogue:changed', d), { journal: createJournal(historyDir), watched: true })
      // While the board watches, `statuses:recode` refuses to run beside it (see historyDir.ts).
      // The lock is named by process: a Vite restart closes the old server (dropping it) before this
      // one takes it again, and each server removes its own exit hook when it closes.
      const release = holdBoardLock(historyDir)
      process.once('exit', release)
      dev.httpServer?.once('close', () => {
        process.off('exit', release)
        release()
      })

      // One re-sync per burst of file events, re-reading only the files that changed (watchBatch.ts).
      const sync = (paths: string[] | null) => {
        try {
          api.syncFromDisk(paths ?? undefined)
        } catch (e) {
          dev.config.logger.error(`[catalogue] could not re-read the catalogue: ${(e as Error).message}`)
          throw e // the batch reads the whole folder next
        } finally {
          watchArtifactFiles()
        }
      }
      const batch = createWatchBatch({ sync })
      dev.httpServer?.once('close', () => batch.close())
      const rootAbs = resolve(root)
      dev.watcher.add(rootAbs)
      // Artifacts can show documents that live elsewhere in the repository: watch those files too.
      const outside = new Set<string>()
      const watchArtifactFiles = () => {
        for (const rec of Object.values(api.getState().artifacts)) {
          const abs = rec.data.file ? artifactPath(rec.data.file, root) : null
          if (abs && !inside(abs, rootAbs) && !outside.has(abs)) {
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
        if ((!inside(resolve(file), rootAbs) && !outside.has(resolve(file))) || file.endsWith('.tmp')) return
        // At once, not after the debounce: the Diff review never serves a comparison older than the files.
        api.worktreeChanged()
        batch.event(resolve(file))
      })
      dev.watcher.on('error', () => batch.error())

      dev.middlewares.use((req, res, next) => {
        const url = req.url ?? '/'
        const method = req.method ?? 'GET'
        const target = routeTarget(url)
        const lower = target?.path.toLowerCase()
        const isApi = url.startsWith('/api/')
        // Another site's page reads nothing here, the board's routes or Vite's own (`/__open-in-editor` included).
        if (crossSiteRead(method, req.headers)) return end(res, 403)
        // A malformed escape names nothing anywhere: a client error, never Vite's error page.
        if (!target && !isApi) return end(res, 400)
        const route = isApi ? '/api/' : FILE_ROUTES.find((r) => lower!.startsWith(r) || lower === r.slice(0, -1))
        if (!route) {
          // The deny rule keeps Vite from reading a catalogue file; this makes every such request a
          // plain 404, not Vite's page fallback or a module error.
          if (namesFolder(target!.path, dev.config.root, [root, IN_TREE])) return end(res, 404)
          return next()
        }
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
        // Re-encoded from the resolved path, so every spelling reaches its route the same way.
        const routed = () => new URL(target!.path.split('/').map(encodeURIComponent).join('/') + target!.query, 'http://local')
        if (route === ASSET_PREFIX) {
          // Only screenshots, and never a fall-through to Vite's static files.
          if (!serveAsset(root, routed(), res, warn)) end(res, 404)
          return
        }
        if (route === '/artifact-file/') {
          if (!serveArtifactFile(root, api.getState().artifacts, routed(), res, warn)) end(res, 404)
          return
        }
        if (route === '/history-blob/') {
          serveHistoryBlob(root, routed(), res, api.getState().artifacts, warn)
            .then((ok) => ok || end(res, 404))
            .catch(() => (res.headersSent ? res.end() : end(res, 404)))
          return
        }
        const path = url.slice(0, url.includes('?') ? url.indexOf('?') : undefined)
        readJson(req)
          .then((body) =>
            api.handle({
              method,
              path,
              query: Object.fromEntries(new URLSearchParams(target?.query ?? '')),
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

/** Is `abs` a file? False for anything missing, unreadable or looping, never a throw. */
function isFile(abs: string): boolean {
  try {
    return !!statSync(abs, { throwIfNoEntry: false })?.isFile()
  } catch {
    return false
  }
}

/** A file served through a symbolic link that leads out of its folder: still served, and the server log says so. */
function warnLinkOut(abs: string, base: string, warn?: Warn) {
  const out = warn && linkOut(abs, base)
  if (out) warn(`${abs} is a symbolic link to ${out}, outside ${base}; served anyway`)
}

/** Send a file as its type, never sniffed as another, an SVG with script blocked. */
function sendFile(res: ServerResponse, abs: string, type: string) {
  res.setHeader('Content-Type', type)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (type === 'image/svg+xml') res.setHeader('Content-Security-Policy', SVG_CSP)
  res.setHeader('Cache-Control', 'no-cache')
  createReadStream(abs)
    .on('error', () => {
      if (!res.headersSent) res.statusCode = 404
      res.end()
    })
    .pipe(res)
}

/** The file an artifact shows: `/artifact-file/<ID>`, resolved through its sidecar only, so no other path is ever served. Returns false when there is none to serve. */
export function serveArtifactFile(root: string, artifacts: Record<string, ArtifactRec>, url: URL, res: ServerResponse, warn?: Warn): boolean {
  let id: string
  try {
    id = idFromPath(url.pathname.slice('/artifact-file/'.length))
  } catch {
    return false
  }
  const file = Object.hasOwn(artifacts, id) ? artifacts[id]!.data.file : null
  const abs = file ? artifactPath(file, root) : null
  const type = abs ? ARTIFACT_MIME[extname(abs).toLowerCase()] : undefined
  if (!file || !abs || !type || !isFile(abs)) return false
  warnLinkOut(abs, artifactBase(file, root), warn)
  sendFile(res, abs, type)
  return true
}

/**
 * An earlier version of a screenshot or an artifact's file, for a history or the Diff review:
 * `/history-blob/<git blob sha>?src=assets/<ID>/<file>`, or `?artifact=<ID>` (served as the type of
 * that artifact's file now), or `?artifact=<ID>&file=<its file at that version>` (served as the type
 * of `file`, for a version whose file had another type, or an artifact since removed; honoured only
 * when the blob is at that path in some commit, or on disk). Read from git, or from the file on
 * disk while it still has that content (a version not yet committed). Returns false when there is
 * none to serve.
 */
export async function serveHistoryBlob(root: string, url: URL, res: ServerResponse, artifacts: Record<string, ArtifactRec> = {}, warn?: Warn): Promise<boolean> {
  const sha = url.pathname.slice('/history-blob/'.length)
  if (!OBJECT_SHA.test(sha)) return false
  const artifactId = url.searchParams.get('artifact')
  const named = url.searchParams.get('file')
  const namedAbs = artifactId && named ? artifactPath(named, root) : null
  const namedOk = !!namedAbs && !!ARTIFACT_MIME[extname(namedAbs).toLowerCase()] && (await blobWasAt(root, sha, namedAbs))
  const current = artifactId && Object.hasOwn(artifacts, artifactId) ? (artifacts[artifactId]!.data.file ?? null) : null
  const artifactFile = artifactId ? (namedOk ? named : current) : null
  const src = url.searchParams.get('src') ?? ''
  const abs = artifactFile ? artifactPath(artifactFile, root) : artifactId ? null : resolve(root, src)
  if (!abs) return false
  const base = artifactFile ? artifactBase(artifactFile, root) : resolve(root, 'assets')
  const type = artifactFile ? ARTIFACT_MIME[extname(abs).toLowerCase()] : MIME[extname(abs).toLowerCase()]
  if (!type || (!artifactFile && !under(abs, base))) return false
  // A screenshot's blob only if it was ever that file (as an artifact's named file is checked above).
  if (!artifactFile && !(await blobWasAt(root, sha, abs))) return false
  // As a checkout would write it (the path's filters and line endings), from git; else the file on
  // disk while it still has that content, named raw (the journal's way) or as `git add` would.
  let buf = await gitBlob(root, sha, await repoPathOf(root, abs))
  if (!buf && isFile(abs) && (await onDiskIs(abs, sha))) {
    buf = readFileSync(abs)
    warnLinkOut(abs, base, warn)
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
const seenAt = new Lru<true>(2000)
reportBlobChecks(() => ({ size: seenAt.size, max: seenAt.max }))

/** The file at `abs` relative to its repository's top, or undefined outside one. */
async function repoPathOf(root: string, abs: string): Promise<string | undefined> {
  const top = await repoTop(root)
  if (!top) return undefined
  const rel = relative(top, realPath(abs)).split(sep).join('/')
  return rel && !rel.startsWith('..') && !isAbsolute(rel) ? rel : undefined
}

/**
 * Is blob `sha` the file at `abs`: on disk now, or at that path (or any path the file had before) in
 * some commit? Deliberately not bounded by commit (B08-Q5): it never refuses a blob the history lists.
 */
async function blobWasAt(root: string, sha: string, abs: string): Promise<boolean> {
  const key = `${sha}|${abs}`
  if (seenAt.get(key)) return true
  let ok = await onDiskIs(abs, sha)
  const top = ok ? null : await repoTop(root)
  if (top) {
    const rel = relative(top, realPath(abs)).split(sep).join('/')
    if (rel && !rel.startsWith('..') && !isAbsolute(rel)) {
      // The commits that added or removed this blob at that path, or at any path the file had
      // before (a folder moved since): any at all means it was there.
      const paths = [rel, ...(await earlierPaths(top, rel))]
      const out = await git(top, ['log', '--all', '-n1', '--format=%H', `--find-object=${sha}`, '--', ...paths]).catch(() => '')
      ok = out.trim() !== ''
    }
  }
  if (ok) seenAt.set(key, true)
  return ok
}

/**
 * A screenshot: a file of an image type in the requirements folder's `assets/`, and nothing else.
 * Returns false when it is not one.
 */
export function serveAsset(root: string, url: URL, res: ServerResponse, warn?: Warn): boolean {
  let rel: string
  try {
    rel = decodeURIComponent(url.pathname.slice(ASSET_PREFIX.length))
  } catch {
    return false
  }
  const base = resolve(root, 'assets')
  const abs = resolve(root, rel)
  const type = MIME[extname(abs).toLowerCase()]
  if (!under(abs, base) || !type || !isFile(abs)) return false
  warnLinkOut(abs, base, warn)
  sendFile(res, abs, type)
  return true
}

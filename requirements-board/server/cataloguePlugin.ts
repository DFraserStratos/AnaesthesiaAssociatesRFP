/**
 * The board's "backend": a Vite dev-server plugin that serves the catalogue
 * file API (`catalogueApi.ts`) and screenshot assets, and watches the folder
 * so edits made elsewhere (an agent, a terminal, git) reach the open board as
 * `catalogue:changed` HMR events. No separate server process.
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import type { Plugin } from 'vite'
import type { CatalogueEvent } from '../shared/types.ts'
import { HttpError, createCatalogueApi } from './catalogueApi.ts'
import { CATALOGUE_DIR } from './catalogueFs.ts'

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
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

export function cataloguePlugin(root = CATALOGUE_DIR): Plugin {
  return {
    name: 'catalogue-api',
    configureServer(dev) {
      const api = createCatalogueApi(root, (e: CatalogueEvent) => dev.ws.send('catalogue:changed', e))

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
      dev.watcher.on('all', (_event, file) => {
        if (!resolve(file).startsWith(rootAbs + sep) || file.endsWith('.tmp')) return
        const now = performance.now()
        firstPending ??= now
        clearTimeout(timer)
        const wait = Math.max(0, Math.min(DEBOUNCE_MS, firstPending + MAX_WAIT_MS - now))
        timer = setTimeout(() => {
          firstPending = undefined
          sync()
        }, wait)
      })

      dev.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local')
        if (url.pathname.startsWith('/catalogue/')) {
          if (!serveAsset(root, url, res)) next()
          return
        }
        if (!url.pathname.startsWith('/api/')) return next()
        readJson(req)
          .then((body) =>
            api.handle({
              method: req.method ?? 'GET',
              path: url.pathname,
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

function serveAsset(root: string, url: URL, res: ServerResponse): boolean {
  const rel = decodeURIComponent(url.pathname.slice('/catalogue/'.length))
  const abs = resolve(root, rel)
  if (!abs.startsWith(resolve(root, 'assets') + sep) || !existsSync(abs) || !statSync(abs).isFile()) return false
  res.setHeader('Content-Type', MIME[extname(abs).toLowerCase()] ?? 'application/octet-stream')
  res.setHeader('Cache-Control', 'no-cache')
  createReadStream(abs)
    .on('error', () => {
      if (!res.headersSent) res.statusCode = 404
      res.end()
    })
    .pipe(res)
  return true
}

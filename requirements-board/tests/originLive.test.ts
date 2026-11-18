/**
 * The board's origin boundary, proved against a real dev server rather than by reading config (a
 * Vite deny rule can silently match nothing). A board boots on a scratch port over a fixture
 * catalogue that sits inside Vite's root (as the real one does) in a folder whose name has spaces,
 * brackets and parentheses (glob characters). Then: no spelling of a path reaches a catalogue file
 * through Vite's own serving; misses are 4xx; every SVG carries the no-script CSP; other sites
 * cannot read or embed board responses; malformed escapes are client errors; the board still loads.
 */
import { type ChildProcess, spawn } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { request } from 'node:http'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { writeFixture } from '../e2e/fixtureCatalogue.ts'
import { gitBlobSha } from '../server/historyJournal.ts'
import { boardsRunning, historyDirFor } from '../server/historyDir.ts'

const BOARD = fileURLToPath(new URL('..', import.meta.url))
/** Ports a person or another suite may be using: never boot on these. */
const TAKEN = new Set([5173, 5174, 5180, 5181, 5182])

interface Reply {
  status: number
  headers: Record<string, string | string[] | undefined>
  body: string
}

let port = 0
let server: ChildProcess | undefined
let fixture = ''
let rel = '' // the fixture folder as a path from Vite's root, URL-encoded
let history = ''
let log = ''

function freePort(): Promise<number> {
  return new Promise((done, fail) => {
    const s = createServer()
    s.once('error', fail)
    s.listen(0, '127.0.0.1', () => {
      const p = (s.address() as { port: number }).port
      s.close(() => (TAKEN.has(p) ? freePort().then(done, fail) : done(p)))
    })
  })
}

/** A request with its path sent exactly as written (no URL normalising), so odd spellings reach the server as given. */
function call(path: string, opts: { method?: string; headers?: Record<string, string>; body?: string } = {}): Promise<Reply> {
  return new Promise((done) => {
    const req = request({ host: 'localhost', port, path, method: opts.method ?? 'GET', headers: opts.headers, agent: false, timeout: 4000 }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => done({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }))
    })
    // A request that never answers (a hung route) reads as status 0.
    req.on('timeout', () => req.destroy())
    req.on('error', () => done({ status: 0, headers: {}, body: '' }))
    req.end(opts.body)
  })
}

const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')
const EVIL_SVG = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
const PAGE = '<!doctype html><title>catalogue page</title><script>window.__pwned=1</script>'

beforeAll(async () => {
  // Inside Vite's root, as the real catalogue is; git-ignored, and not a folder Playwright clears.
  mkdirSync(join(BOARD, '.origin-fixture'), { recursive: true })
  fixture = mkdtempSync(join(BOARD, '.origin-fixture', 'origin (b01) [x]+{y} é-'))
  rel = `.origin-fixture/${encodeURIComponent(fixture.slice(join(BOARD, '.origin-fixture').length + 1))}`
  history = mkdtempSync(join(tmpdir(), 'origin-history-'))
  writeFixture(fixture)
  const shots = join(fixture, 'assets', 'US-01.1.1')
  mkdirSync(shots, { recursive: true })
  writeFileSync(join(shots, 'shot.png'), PNG)
  writeFileSync(join(shots, 'a b#%é.png'), PNG)
  writeFileSync(join(shots, 'evil.svg'), EVIL_SVG)
  // Unreadable (for anyone but root): the history lookup fails inside, and must still answer.
  writeFileSync(join(shots, 'locked.png'), PNG)
  chmodSync(join(shots, 'locked.png'), 0)
  writeFileSync(join(fixture, 'notes', 'page.html'), PAGE)
  port = await freePort()
  server = spawn(process.execPath, [join(BOARD, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort'], {
    cwd: BOARD,
    env: { ...process.env, REQUIREMENTS_DIR: fixture, HISTORY_DIR: history, BOARD_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout!.on('data', (c: Buffer) => (log += c.toString()))
  server.stderr!.on('data', (c: Buffer) => (log += c.toString()))
  // Ready when our own server says it listens on this port (another process may hold the port).
  for (let i = 0; i < 300 && server.exitCode === null && !log.includes(`:${port}/`); i++) await new Promise((r) => setTimeout(r, 100))
  if (server.exitCode !== null || !log.includes(`:${port}/`)) throw new Error(`the scratch board did not start on ${port}:\n${log}`)
  // The catalogue is read at start-up: the PNG artifact's file goes now, so the board still lists it.
  unlinkSync(join(fixture, 'artifacts', 'files', 'AR-02.png'))
}, 60_000)

afterAll(async () => {
  if (server && server.exitCode === null) {
    const gone = new Promise((r) => server!.once('exit', r))
    server.kill()
    await gone
    // A board that stops takes its lock away (A-2).
    expect(readdirSync(history).filter((n) => n.endsWith('.lock'))).toEqual([])
  }
  try {
    chmodSync(join(fixture, 'assets', 'US-01.1.1', 'locked.png'), 0o644)
  } catch {
    // never made
  }
  rmSync(fixture, { recursive: true, force: true })
  rmSync(history, { recursive: true, force: true })
})

const SAME = { 'sec-fetch-site': 'same-origin' }
// A cold Vite transforms on first request: give each test room.
vi.setConfig({ testTimeout: 20_000 })

describe('the board on a scratch port', () => {
  it('holds the lock statuses:recode looks for, in the journal folder it rewrites (A-2)', () => {
    // The script asks historyDirFor with the same environment the board started with.
    const was = process.env.HISTORY_DIR
    process.env.HISTORY_DIR = history
    try {
      expect(historyDirFor(fixture)).toBe(history)
    } finally {
      if (was === undefined) delete process.env.HISTORY_DIR
      else process.env.HISTORY_DIR = was
    }
    expect(boardsRunning(history)).toEqual([server!.pid])
  })

  it('loads: the page, its client, its source and the catalogue API', async () => {
    expect((await call('/')).body).toContain('<div id="root">')
    expect((await call('/@vite/client')).status).toBe(200)
    expect((await call('/src/main.tsx')).status).toBe(200)
    const cat = await call('/api/catalogue', { headers: SAME })
    expect(cat.status).toBe(200)
    expect(Object.keys((JSON.parse(cat.body) as { artifacts: object }).artifacts)).toContain('AR-01')
  })
})

describe('raw catalogue files are reached only through the board routes (R-04)', () => {
  const inTree = readFileSync(join(BOARD, 'requirements', 'README.md'), 'utf8').split('\n')[0]!
  const abs = encodeURI(BOARD.replace(/\/$/, ''))
  const spellings = [
    '/requirements/README.md',
    '/%72equirements/README.md',
    '/REQUIREMENTS/README.md',
    '/Requirements/README.md',
    '//requirements/README.md',
    '/./requirements/README.md',
    '/src/../requirements/README.md',
    '/src/%2e%2e/requirements/README.md',
    '/requirements%2fREADME.md',
    '/requirements/README.md?raw',
    '/%72equirements/README.md?raw',
    '/%72equirements/README.md?import',
    '/%72equirements/README.md?url',
    `/@fs${abs}/requirements/README.md`,
    `/@fs${abs}/REQUIREMENTS/README.md`,
    `/@fs${abs}/requirements/README.md?raw`,
    `/@fs${abs}/requirements/README.md?import&raw`,
    `/@fs${abs}/%72equirements/README.md`,
    `/@id${abs}/requirements/README.md?raw`,
    // Unicode case folding: the file system opens "requirementſ" (long s) as "requirements".
    '/requirement%C5%BF/README.md',
    '/requirement%C5%BF/README.md?raw',
    '/requirement%C5%BF/README.md?import',
    '/requirement%C5%BF/board.config.json?import',
    `/@fs${abs}/requirement%C5%BF/README.md?import&raw`,
  ]
  it.each(spellings)('the in-tree catalogue under a fixture run: %s', async (path) => {
    const r = await call(path, { headers: SAME })
    expect(r.status, `${path} answered ${r.status}`).toBeGreaterThanOrEqual(400)
    expect(r.status).toBeLessThan(500)
    expect(r.body).not.toContain(inTree)
  })

  const served = ['artifacts/files/AR-01.svg', 'artifacts/files/AR-01.svg?raw', 'artifacts/files/AR-01.svg?import', 'notes/page.html', 'notes/2026-01-02-fixture-meeting.md', 'stories/US-01.1.1.md', 'assets/US-01.1.1/evil.svg']
  it.each(served)('the catalogue being served, inside Vite root: %s', async (file) => {
    // As written, upper case, decomposed (é as e and an accent: the file system treats them alike) and /@fs/.
    const nfd = `.origin-fixture/${encodeURIComponent(fixture.slice(join(BOARD, '.origin-fixture').length + 1).normalize('NFD'))}`
    for (const path of [`/${rel}/${file}`, `/${rel.toUpperCase()}/${file}`, `/${nfd}/${file}`, `/@fs${encodeURI(fixture)}/${file}`]) {
      const r = await call(path, { headers: SAME })
      expect(r.status, `${path} answered ${r.status}`).toBeGreaterThanOrEqual(400)
      expect(r.status).toBeLessThan(500)
      expect(r.body).not.toMatch(/<script|alert\(1\)|Fixture note|^---/)
    }
  })

  it('serves screenshots at the URLs the board builds, encoded names and version tokens included', async () => {
    for (const path of ['/requirements/assets/US-01.1.1/shot.png', '/requirements/assets/US-01.1.1/a%20b%23%25%C3%A9.png', '/requirements/assets/US-01.1.1/shot.png?v=abc123']) {
      const r = await call(path, { headers: SAME })
      expect(r.status, path).toBe(200)
      expect(r.headers['content-type']).toBe('image/png')
    }
  })

  it('refuses anything under the prefix that is not a screenshot, under any spelling, with a 404', async () => {
    for (const path of ['/requirements/artifacts/files/AR-01.svg', '/REQUIREMENTS/artifacts/files/AR-01.svg', '//requirements/artifacts/files/AR-01.svg', '/requirements/assets/../artifacts/files/AR-01.svg', '/requirements/assets/%2e%2e/artifacts/files/AR-01.svg', '/requirements\\assets\\..\\artifacts\\files\\AR-01.svg']) {
      const r = await call(path, { headers: SAME })
      expect(r.status, path).toBe(404)
    }
    // Spelled differently, a screenshot is still the board's route, not Vite's.
    const odd = await call('/REQUIREMENTS//assets/US-01.1.1/evil.svg', { headers: SAME })
    expect(odd.status).toBe(200)
    expect(odd.headers['content-security-policy']).toContain("default-src 'none'")
  })
})

describe('every SVG is no-script, and no file is sniffed (R-04)', () => {
  it('sends the CSP and nosniff from each file route', async () => {
    const sha = gitBlobSha(readFileSync(join(fixture, 'artifacts', 'files', 'AR-01.svg')))
    for (const path of ['/artifact-file/AR-01', '/requirements/assets/US-01.1.1/evil.svg', `/history-blob/${sha}?artifact=AR-01`]) {
      const r = await call(path, { headers: SAME })
      expect(r.status, path).toBe(200)
      expect(r.headers['content-type'], path).toBe('image/svg+xml')
      expect(r.headers['content-security-policy'], path).toContain("default-src 'none'")
      expect(r.headers['x-content-type-options'], path).toBe('nosniff')
    }
    for (const path of ['/artifact-file/AR-04', '/requirements/assets/US-01.1.1/shot.png']) {
      expect((await call(path, { headers: SAME })).headers['x-content-type-options'], path).toBe('nosniff')
    }
  })
})

describe('a file route that cannot serve answers 404 (R-22)', () => {
  const misses = [
    '/artifact-file/AR-99',
    '/artifact-file/AR-02', // its file is gone
    '/artifact-file/AR-03', // mermaid: no file
    '/history-blob/not-a-sha',
    `/history-blob/${'a'.repeat(40)}?src=assets/US-01.1.1/shot.png`,
    `/history-blob/${'a'.repeat(40)}?artifact=AR-99`,
    `/history-blob/${'a'.repeat(40)}?src=stories/US-01.1.1.md`,
    // An unreadable file: the lookup fails inside, and must still answer.
    `/history-blob/${'b'.repeat(40)}?src=assets/US-01.1.1/locked.png`,
  ]
  it.each(misses)('%s', async (path) => {
    for (const method of ['GET', 'HEAD']) {
      const r = await call(path, { method, headers: SAME })
      expect(r.status, `${method} ${path}`).toBe(404)
      expect(r.body).not.toContain('<!doctype html>')
    }
  })
})

describe('other origins cannot read the board (R-36)', () => {
  it('sends no CORS grant to another localhost page', async () => {
    for (const path of ['/api/catalogue', '/artifact-file/AR-01', '/requirements/assets/US-01.1.1/shot.png']) {
      for (const origin of ['http://localhost:6006', 'http://127.0.0.1:6006', 'http://app.localhost:6006', 'http://[::1]:6006']) {
        const r = await call(path, { headers: { origin } })
        expect(r.headers['access-control-allow-origin'], `${origin} reading ${path}`).toBeUndefined()
      }
    }
    const pre = await call('/api/catalogue', { method: 'OPTIONS', headers: { origin: 'http://localhost:6006', 'access-control-request-method': 'GET' } })
    expect(pre.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('refuses a read another site asks for (fetch metadata), and serves the board and new tabs', async () => {
    const sha = gitBlobSha(readFileSync(join(fixture, 'artifacts', 'files', 'AR-01.svg')))
    const routes = ['/api/catalogue', '/artifact-file/AR-01', '/requirements/assets/US-01.1.1/shot.png', `/history-blob/${sha}?artifact=AR-01`]
    for (const path of routes) {
      for (const site of ['cross-site', 'same-site']) {
        for (const method of ['GET', 'HEAD']) {
          const r = await call(path, { method, headers: { 'sec-fetch-site': site, 'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'image' } })
          expect(r.status, `${method} ${path} from ${site}`).toBe(403)
          expect(r.headers['access-control-allow-origin']).toBeUndefined()
        }
      }
      for (const site of ['same-origin', 'none']) expect((await call(path, { headers: { 'sec-fetch-site': site } })).status, `${path} from ${site}`).toBe(200)
      // Node, curl and scripts send no fetch metadata.
      expect((await call(path)).status, path).toBe(200)
    }
  })

  it("refuses another site's request to Vite's own routes too", async () => {
    for (const path of ['/__open-in-editor?file=package.json', '/src/main.tsx', '/@vite/client']) {
      const r = await call(path, { headers: { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'image' } })
      expect(r.status, path).toBe(403)
    }
  })

  it('keeps refusing writes as before: non-JSON 415, a foreign Origin 403', async () => {
    expect((await call('/api/items/US-01.1.1', { method: 'PUT', headers: { 'content-type': 'text/plain' }, body: '{}' })).status).toBe(415)
    expect((await call('/api/items/US-01.1.1', { method: 'PUT', headers: { 'content-type': 'application/json', origin: 'http://localhost:6006' }, body: '{}' })).status).toBe(403)
  })
})

describe('a malformed escape is a client error (R-63)', () => {
  it('answers 4xx on the file routes, never 500 or the error page', async () => {
    for (const path of ['/artifact-file/%E0%A4%A', '/requirements/%E0%A4%A', '/requirements/assets/%E0%A4%A.png', '/%72equirements/%E0%A4%A']) {
      const r = await call(path, { headers: SAME })
      expect(r.status, path).toBeGreaterThanOrEqual(400)
      expect(r.status, path).toBeLessThan(500)
    }
  })

  it('answers 400 with a JSON error on the API', async () => {
    const r = await call('/api/items/%E0%A4%A', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{}' })
    expect(r.status).toBe(400)
    expect(JSON.parse(r.body)).toHaveProperty('error')
  })

  it('logged no unhandled rejection', () => {
    expect(log).not.toMatch(/Unhandled|URIError/)
  })
})

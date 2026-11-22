/**
 * The origin rules (B01) that need no live server: one decode rule for IDs in URLs; symbolic links
 * that lead out of their folder are served but warned about; a requirements folder or repository
 * reached through a link (a macOS temp folder under /var is /private/var) still holds its files;
 * and Vite's own deny rule matches the catalogue folders, glob characters and real paths included.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError, createCatalogueApi, idFromPath } from '../server/catalogueApi.ts'
import { REQUIREMENTS_DIR, loadCatalogue, writeItem, writeLayout, writeQuestion } from '../server/catalogueFs.ts'
import { crossSiteRead, denyGlobs, namesFolder, routeTarget, serveArtifactFile, serveAsset } from '../server/cataloguePlugin.ts'
import { inside, linkOut } from '../server/realPaths.ts'
import { serialiseArtifact } from '../shared/files.ts'
import type { Artifact } from '../shared/types.ts'
import { item, question } from './fixtures.ts'

const JSON_HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }
const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')

let root: string
let outside: string
beforeEach(() => {
  // tmpdir() on macOS is under /var, a link to /private/var: the folder is reached through a link.
  root = mkdtempSync(join(tmpdir(), 'origin-rules-'))
  outside = mkdtempSync(join(tmpdir(), 'origin-outside-'))
  writeItem(item({ id: 'EP-01', type: 'epic' }), root)
  writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), root)
  writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }), root)
  writeQuestion(question({ id: 'OQ-01', affects: ['US-01.1.1'] }), root)
  writeLayout({ positions: {}, lanes: [] }, root)
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
  rmSync(outside, { recursive: true, force: true })
})

const status = (f: () => unknown) => {
  try {
    const out = f()
    return out instanceof Promise ? 'async' : 200
  } catch (e) {
    return e instanceof HttpError ? e.status : 500
  }
}

describe('one decode rule for IDs in URLs (R-63)', () => {
  const BAD = '%E0%A4%A'
  it.each([
    ['GET', `/api/artifacts/${BAD}/history`],
    ['PUT', `/api/artifacts/${BAD}`],
    ['GET', `/api/items/${BAD}/history`],
    ['PUT', `/api/items/${BAD}`],
    ['DELETE', `/api/items/${BAD}`],
    ['PUT', `/api/questions/${BAD}`],
    ['DELETE', `/api/questions/${BAD}`],
  ])('%s %s with a malformed escape is 400', (method, path) => {
    const api = createCatalogueApi(root, () => {})
    expect(status(() => api.handle({ method, path, headers: JSON_HEADERS, body: { baseRev: 'x', patch: {} } }))).toBe(400)
  })

  it.each(['..%2F..%2Fx', '..%5Cx', '..', '%2E%2E', '.', '%2E', 'a%00b', 'a%0Ab', 'US-01.1.1%2F..'])('an ID that could name another file, %s, is refused before any read', (seg) => {
    const api = createCatalogueApi(root, () => {})
    for (const path of [`/api/items/${seg}`, `/api/questions/${seg}`]) {
      expect(status(() => api.handle({ method: 'PUT', path, headers: JSON_HEADERS, body: { baseRev: 'x', patch: {} } }))).toBe(400)
    }
  })

  it('routes every ID a catalogue holds, and odd but harmless ones', () => {
    // A record's ID is its file's name: read the names, not the records.
    const ids = ['stories', 'questions', 'artifacts'].flatMap((d) => (existsSync(join(REQUIREMENTS_DIR, d)) ? readdirSync(join(REQUIREMENTS_DIR, d)) : []).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)))
    expect(ids.length).toBeGreaterThan(0)
    for (const id of [...ids, 'US-01.1.1', 'AR-01', 'OQ-01', 'X 1', 'é-1', 'a..b', '...']) expect(idFromPath(encodeURIComponent(id))).toBe(id)
  })

  it('answers 404 for a name the catalogue object inherits, never 500', async () => {
    const api = createCatalogueApi(root, () => {})
    for (const id of ['__proto__', 'constructor', 'toString']) {
      for (const path of [`/api/artifacts/${id}/history`, `/api/items/${id}/history`]) {
        expect(status(() => api.handle({ method: 'GET', path, headers: JSON_HEADERS })), path).toBe(404)
      }
    }
  })
})

describe('the request guard reads paths as the file system would (R-04)', () => {
  it.each([
    ['/%72equirements/a.svg', '/requirements/a.svg'],
    ['//requirements/a.svg', '/requirements/a.svg'],
    ['/x/../requirements/a.svg', '/requirements/a.svg'],
    ['/x/%2e%2e/requirements/a.svg', '/requirements/a.svg'],
    ['/requirements\\assets\\..\\a.svg', '/requirements/a.svg'],
    ['/requirements%2fa.svg?v=1', '/requirements/a.svg'],
    ['http://h/requirements/a.svg', '/requirements/a.svg'],
  ])('%s is %s', (url, path) => expect(routeTarget(url)?.path).toBe(path))

  it('keeps the query, and reads a malformed escape as null', () => {
    expect(routeTarget('/history-blob/abc?src=assets/a%20b.png')).toEqual({ path: '/history-blob/abc', query: '?src=assets/a%20b.png' })
    expect(routeTarget('/requirements/%E0%A4%A')).toBeNull()
  })

  it("knows a path into a catalogue folder through Vite's root, /@fs/ and /@id/, by what the file system opens", () => {
    const viteRoot = join(root, 'board')
    const cat = join(viteRoot, 'requirements')
    mkdirSync(join(cat, 'stories'), { recursive: true })
    mkdirSync(join(viteRoot, 'requirements-other'))
    // Spellings the file system opens as the same folder where it folds case (macOS, Windows).
    const folded = ['/REQUIREMENTS/a.md', '/requirement\u017f/a.md'].filter((p) => existsSync(join(viteRoot, p.split('/')[1]!)))
    for (const p of ['/requirements/a.md', '/requirements/stories/x.md', '/requirements', ...folded, `/@fs${cat}/a.md`, `/@fs${realpathSync(root)}/board/requirements/a.md`, `/@id${cat}/a.md`, '/@id/requirements/a.md']) {
      expect(namesFolder(p, viteRoot, [cat]), p).toBe(true)
    }
    for (const p of ['/src/main.tsx', '/requirements-other/a.md', '/@fs/etc/hosts', '/@id/react']) expect(namesFolder(p, viteRoot, [cat]), p).toBe(false)
  })

  it('refuses reads another site asks for, but not a top-level visit or the board itself', () => {
    const h = (site: string, mode = 'no-cors', dest = 'image') => ({ 'sec-fetch-site': site, 'sec-fetch-mode': mode, 'sec-fetch-dest': dest })
    expect(crossSiteRead('GET', h('cross-site'))).toBe(true)
    expect(crossSiteRead('HEAD', h('same-site', 'cors', 'empty'))).toBe(true)
    expect(crossSiteRead('GET', h('cross-site', 'navigate', 'iframe'))).toBe(true)
    expect(crossSiteRead('GET', h('cross-site', 'navigate', 'document'))).toBe(false)
    expect(crossSiteRead('GET', h('same-origin'))).toBe(false)
    expect(crossSiteRead('GET', h('none', 'navigate', 'document'))).toBe(false)
    expect(crossSiteRead('GET', {})).toBe(false)
    // Writes keep the API's own refusals (415, 403).
    expect(crossSiteRead('PUT', h('cross-site'))).toBe(false)
  })
})

describe("Vite's deny rule matches the catalogue folders (R-04)", () => {
  it('as resolved by Vite: the folder, its real path, glob characters and case', async () => {
    const odd = join(root, 'a (b) [c]+{d}!')
    mkdirSync(odd)
    const { resolveConfig } = await import('vite')
    const { cataloguePlugin } = await import('../server/cataloguePlugin.ts')
    const config = await resolveConfig({ configFile: false, root: join(root, 'board'), logLevel: 'silent', plugins: [cataloguePlugin(odd)] }, 'serve')
    const deny = (config as unknown as { fsDenyGlob: (path: string) => boolean }).fsDenyGlob
    for (const f of [join(odd, 'stories', 'US-1.md'), join(realpathSync(odd), 'notes', 'a.html'), join(odd, 'ASSETS', 'x.svg').toUpperCase(), odd]) expect(deny(f), f).toBe(true)
    // Vite's own defaults stay.
    expect(deny(join(root, '.env'))).toBe(true)
    expect(deny(join(root, 'a (b) [c]+{d}', 'x.md'))).toBe(false)
    expect(deny(join(root, 'board', 'src', 'main.tsx'))).toBe(false)
  })

  it("keeps Vite's own defaults, which setting the option replaces (the copy must follow a Vite upgrade)", async () => {
    const { resolveConfig } = await import('vite')
    const { VITE_DENY } = await import('../server/cataloguePlugin.ts')
    const plain = await resolveConfig({ configFile: false, root: join(root, 'board'), logLevel: 'silent' }, 'serve')
    expect(VITE_DENY).toEqual(plain.server.fs.deny)
  })

  it('escapes glob characters', () => {
    expect(denyGlobs('/x/a (b)[c]{d}*?!+@|')).toContain('/x/a \\(b\\)\\[c\\]\\{d\\}\\*\\?\\!\\+\\@\\|/**')
  })
})

/** A response that records its headers and whether a body went out. */
const res = () => {
  const headers: Record<string, string> = {}
  const r = { headers, setHeader: (k: string, v: string) => (headers[k] = v), end: () => r, on: () => r, once: () => r, emit: () => true, write: () => true, headersSent: false }
  return r as unknown as ServerResponse & { headers: Record<string, string> }
}

describe('a symbolic link that leads out of its folder is served, and warned about (R-35, B01-Q1)', () => {
  beforeEach(() => {
    writeFileSync(join(outside, 'secret.png'), PNG)
    mkdirSync(join(root, 'assets', 'US-01.1.1'), { recursive: true })
    writeFileSync(join(root, 'assets', 'US-01.1.1', 'plain.png'), PNG)
    symlinkSync(join(outside, 'secret.png'), join(root, 'assets', 'US-01.1.1', 'leak.png'))
    // A link that stays inside its folder is no warning.
    symlinkSync(join(root, 'assets', 'US-01.1.1', 'plain.png'), join(root, 'assets', 'US-01.1.1', 'alias.png'))
    mkdirSync(join(root, 'artifacts', 'files'), { recursive: true })
    symlinkSync(join(outside, 'secret.png'), join(root, 'artifacts', 'files', 'AR-01.png'))
    const a: Artifact = { id: 'AR-01', title: 'Linked picture', kind: 'screenshot', status: 'Current', date: '2026-10', author: null, area: null, sources: ['x'], description: '', file: 'artifacts/files/AR-01.png', source: '', regions: [], steps: [], citedAs: [], supersededBy: null } as unknown as Artifact
    writeFileSync(join(root, 'artifacts', 'AR-01.md'), serialiseArtifact(a))
    writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, images: [{ src: 'assets/US-01.1.1/leak.png', viewport: 'desktop' }, { src: 'assets/US-01.1.1/alias.png', viewport: 'desktop' }] } as never), root)
  })

  it('serves a screenshot and an artifact file through the link, as its type, and warns naming where it leads', () => {
    const warn = vi.fn()
    const url = (p: string) => new URL(p, 'http://local')
    const leak = res()
    expect(serveAsset(root, url('/requirements/assets/US-01.1.1/leak.png'), leak, warn)).toBe(true)
    expect(leak.headers).toMatchObject({ 'Content-Type': 'image/png', 'X-Content-Type-Options': 'nosniff' })
    expect(serveAsset(root, url('/requirements/assets/US-01.1.1/alias.png'), res(), warn)).toBe(true)
    expect(serveAsset(root, url('/requirements/assets/US-01.1.1/plain.png'), res(), warn)).toBe(true)
    expect(serveArtifactFile(root, loadCatalogue(root).artifacts ?? {}, url('/artifact-file/AR-01'), res(), warn)).toBe(true)
    const said = warn.mock.calls.map((c) => c[0] as string)
    expect(said).toHaveLength(2)
    expect(said.every((m) => m.includes(realpathSync(join(outside, 'secret.png'))) && /symbolic link/.test(m))).toBe(true)
  })

  it('npm run check warns, for an image and an artifact file, and nothing for a link that stays inside', () => {
    const issues = loadCatalogue(root).issues.filter((i) => /symbolic link/.test(i.message))
    expect(issues.map((i) => [i.severity, i.id])).toEqual([
      ['warning', 'US-01.1.1'],
      ['warning', 'AR-01'],
    ])
    expect(issues[0]!.message).toContain('assets/US-01.1.1/leak.png')
  })

  it('names where a link leads, and nothing for files and inside links', () => {
    const assets = join(root, 'assets')
    expect(linkOut(join(assets, 'US-01.1.1', 'leak.png'), assets)).toBe(realpathSync(join(outside, 'secret.png')))
    expect(linkOut(join(assets, 'US-01.1.1', 'alias.png'), assets)).toBeNull()
    expect(linkOut(join(assets, 'US-01.1.1', 'plain.png'), assets)).toBeNull()
    expect(linkOut(join(assets, 'US-01.1.1', 'gone.png'), assets)).toBeNull()
    // Spelled out of its folder is not a link: the check says the image must live under assets/.
    expect(linkOut(join(assets, '..', 'stories', 'US-01.1.1.md'), assets)).toBeNull()
  })
})

describe('a folder reached through a link still holds its files (R-47 REPO_ROOT, E7a)', () => {
  it('compares as real folders on both sides', () => {
    const real = realpathSync(root)
    expect(inside(join(real, 'stories', 'a.md'), root)).toBe(true)
    expect(inside(join(root, 'stories', 'a.md'), real)).toBe(true)
    expect(inside(join(outside, 'a.md'), root)).toBe(false)
    expect(inside(`${root}-other/a.md`, root)).toBe(false)
  })

  // REPO_ROOT is read once, when artifactFiles.ts loads: each case loads it afresh.
  const load = async (repo: string) => {
    vi.resetModules()
    vi.stubEnv('REPO_ROOT', repo)
    return import('../server/artifactFiles.ts')
  }
  afterEach(() => vi.unstubAllEnvs())

  it.each([
    ['git names the repository by its real path; the folder is given through /var', true],
    ['REPO_ROOT is given through /var; the folder by its real path', false],
  ])('%s', async (_name, repoReal) => {
    const repo = mkdtempSync(join(tmpdir(), 'origin-repo-'))
    try {
      const req = join(repo, 'req')
      mkdirSync(join(req, 'artifacts', 'files'), { recursive: true })
      writeFileSync(join(req, 'artifacts', 'files', 'a.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>')
      mkdirSync(join(repo, 'docs'))
      writeFileSync(join(repo, 'docs', 'b.md'), '# Outside the requirements folder')
      const reqRoot = repoReal ? req : realpathSync(req)
      const { artifactInfo, artifactPath } = await load(repoReal ? realpathSync(repo) : repo)
      // The file route reads the same REPO_ROOT, so it is loaded afresh with it.
      const { serveArtifactFile: serve } = await import('../server/cataloguePlugin.ts')
      const rec = (id: string, file: string) => ({ data: { id, file }, rev: '' }) as never
      const arts = { 'AR-01': rec('AR-01', '/req/artifacts/files/a.svg'), 'AR-02': rec('AR-02', '/docs/b.md') }
      const sent = res()
      expect(serve(reqRoot, arts, new URL('/artifact-file/AR-01', 'http://local'), sent)).toBe(true)
      expect(sent.headers['Content-Type']).toBe('image/svg+xml')
      expect(serve(reqRoot, arts, new URL('/artifact-file/AR-02', 'http://local'), res())).toBe(true)
      const outsideInfo = artifactInfo({ id: 'AR-02', title: 't', kind: 'note', status: 'Current', date: null, author: null, area: null, sources: [], description: '', file: '/docs/b.md', source: '', regions: [], steps: [], citedAs: [], supersededBy: null } as unknown as Artifact, reqRoot)
      expect(outsideInfo.meta.path).toBe('docs/b.md')
      // Outside the requirements folder, however either is spelled: the watcher watches it on its own.
      expect(inside(artifactPath('/docs/b.md', reqRoot)!, reqRoot)).toBe(false)
      expect(inside(artifactPath('/docs/b.md', reqRoot)!, realpathSync(reqRoot))).toBe(false)
      const base = { id: 'AR-01', title: 't', kind: 'diagram', status: 'Current', date: null, author: null, area: null, sources: [], description: '', source: '', regions: [], steps: [], citedAs: [], supersededBy: null } as unknown as Artifact
      for (const file of ['artifacts/files/a.svg', '/req/artifacts/files/a.svg']) {
        const info = artifactInfo({ ...base, file }, reqRoot)
        expect(info.facts.ok, file).toBe(true)
        expect(info.meta.path, file).toBe('req/artifacts/files/a.svg')
        expect(info.facts.linkOut, file).toBeUndefined()
        expect(inside(artifactPath(file, reqRoot)!, reqRoot), file).toBe(true)
      }
    } finally {
      rmSync(repo, { recursive: true, force: true })
    }
  })
})

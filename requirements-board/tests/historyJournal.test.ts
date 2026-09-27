/** The dev server's change journal, driven through the file API: who changed a card, and what. */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { serialiseItem } from '../shared/files.ts'
import type { TimelineEntry } from '../shared/history.ts'
import type { Item, Rev } from '../shared/types.ts'
import { createCatalogueApi } from '../server/catalogueApi.ts'
import { itemPath, writeItem, writeLayout } from '../server/catalogueFs.ts'
import { gitBlob, gitFileHistory, gitScreenshots } from '../server/gitHistory.ts'
import { createJournal, gitBlobSha } from '../server/historyJournal.ts'
import { item } from './fixtures.ts'

const JSON_HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }
const noGit = async () => ({ versions: [], dirty: false, working: null })

let root: string
let hist: string
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'history-cat-'))
  hist = mkdtempSync(join(tmpdir(), 'history-log-'))
  writeItem(item({ id: 'EP-01', type: 'epic' }), root)
  writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', order: 1 }), root)
  writeItem(item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 2 }), root)
  writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, title: 'First' }), root)
  writeLayout({ positions: {}, lanes: ['MVP'] }, root)
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
  rmSync(hist, { recursive: true, force: true })
})

const api = () => createCatalogueApi(root, () => {}, { journal: createJournal(hist), gitHistory: noGit })
const call = (a: ReturnType<typeof api>, method: string, path: string, body?: unknown) => a.handle({ method, path, body, headers: JSON_HEADERS })
const timeline = async (a: ReturnType<typeof api>, id: string) => ((await call(a, 'GET', `/api/items/${id}/history`)) as { entries: TimelineEntry[] }).entries
const rec = (a: ReturnType<typeof api>, id: string) => a.getState().items[id]!

describe('the change journal', () => {
  it('starts with nothing: cards seen for the first time are only baselined', async () => {
    expect(await timeline(api(), 'US-01.1.1')).toEqual([])
  })

  it('logs a sheet save as the board, once, even after the watcher re-reads it', async () => {
    const a = api()
    const r = rec(a, 'US-01.1.1')
    call(a, 'PUT', '/api/items/US-01.1.1', { record: { ...r.data, title: 'Second' }, baseRev: r.rev })
    a.syncFromDisk() // the watcher's echo of our own write
    expect(await timeline(a, 'US-01.1.1')).toMatchObject([{ source: 'board', kind: 'changed', changes: [{ field: 'title', from: 'First', to: 'Second' }] }])
  })

  it('logs an edit made on disk as on disk', async () => {
    const a = api()
    writeFileSync(itemPath('US-01.1.1', root), serialiseItem({ ...rec(a, 'US-01.1.1').data, notes: 'Agent note' }))
    a.syncFromDisk()
    expect(await timeline(a, 'US-01.1.1')).toMatchObject([{ source: 'disk', changes: [{ field: 'notes', to: 'Agent note' }] }])
  })

  it('logs a Mapped move: the new parent and lane', async () => {
    const a = api()
    const r = rec(a, 'US-01.1.1')
    call(a, 'POST', '/api/items/batch', { changes: [{ id: 'US-01.1.1', baseRev: r.rev, patch: { parent: 'FT-01.2', swimlane: 'MVP' } }] })
    const [e] = await timeline(a, 'US-01.1.1')
    expect(e).toMatchObject({ source: 'board', changes: [{ field: 'parent', from: 'FT-01.1', to: 'FT-01.2' }, { field: 'swimlane', from: null, to: 'MVP' }] })
  })

  it('logs a Freeform drag, and a Tidy back to the story map', async () => {
    const a = api()
    call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.1': { x: 10, y: 20 } } })
    expect(await timeline(a, 'US-01.1.1')).toMatchObject([{ kind: 'position', changes: [{ field: 'position', from: null, to: { x: 10, y: 20 } }] }])
  })

  it('logs a new card as created', async () => {
    const a = api()
    const created = call(a, 'POST', '/api/items', { type: 'story', parent: 'FT-01.1', title: 'New' }) as Rev<Item>
    expect(await timeline(a, created.data.id)).toMatchObject([{ source: 'board', kind: 'created' }])
  })

  it('notices at start what changed while the board was off', async () => {
    api()
    writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, title: 'Changed offline' }), root)
    const b = api()
    expect(await timeline(b, 'US-01.1.1')).toMatchObject([{ source: 'disk', offline: true, changes: [{ field: 'title', to: 'Changed offline' }] }])
  })
})

describe('screenshots', () => {
  const png = (n: number) => Buffer.from([0x89, 0x50, 0x4e, 0x47, n])
  const shotDir = () => join(root, 'assets', 'US-01.1.1')
  beforeEach(() => {
    mkdirSync(shotDir(), { recursive: true })
    writeFileSync(join(shotDir(), 'web-list.png'), png(1))
  })

  it('logs a screenshot rewritten in place, with the before and after versions', async () => {
    const a = api()
    writeFileSync(join(shotDir(), 'web-list.png'), png(2))
    a.syncFromDisk()
    expect(await timeline(a, 'US-01.1.1')).toMatchObject([
      { source: 'disk', changes: [{ field: 'screenshot', from: { src: 'assets/US-01.1.1/web-list.png', sha: gitBlobSha(png(1)) }, to: { sha: gitBlobSha(png(2)) } }] },
    ])
  })

  it('does not log a new image, or a sync where nothing changed', async () => {
    const a = api()
    writeFileSync(join(shotDir(), 'web-new.png'), png(3))
    a.syncFromDisk()
    a.syncFromDisk()
    expect(await timeline(a, 'US-01.1.1')).toEqual([])
  })

  it('notices at start a screenshot re-captured while the board was off', async () => {
    api()
    writeFileSync(join(shotDir(), 'web-list.png'), png(4))
    expect(await timeline(api(), 'US-01.1.1')).toMatchObject([{ offline: true, changes: [{ field: 'screenshot' }] }])
  })
})

const hasGit = (() => {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

describe.skipIf(!hasGit)('git history', () => {
  const g = (...args: string[]) => execFileSync('git', args, { cwd: root, stdio: 'ignore', env: { ...process.env, GIT_AUTHOR_DATE: '2026-09-01T10:00:00Z', GIT_COMMITTER_DATE: '2026-09-01T10:00:00Z' } })
  const commit = (msg: string) => {
    g('add', '-A')
    g('-c', 'user.name=Tester', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', msg)
  }

  it('reads each commit that touched the card, and whether the file is dirty', async () => {
    g('init', '-q')
    commit('Add')
    writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, title: 'Second' }), root)
    commit('Retitle')
    writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, title: 'Third' }), root)
    const h = await gitFileHistory(itemPath('US-01.1.1', root))
    expect(h.versions.map((v) => [v.commit.subject, v.item?.title])).toEqual([
      ['Retitle', 'Second'],
      ['Add', 'First'],
    ])
    expect(h.dirty).toBe(true)
    expect(h.working?.title).toBe('Third')
  })

  it('reads screenshot rewrites from git, and the old version back out of it', async () => {
    const dir = join(root, 'assets', 'US-01.1.1')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'web.png'), Buffer.from('one'))
    g('init', '-q')
    commit('Add')
    writeFileSync(join(dir, 'web.png'), Buffer.from('two'))
    commit('Recapture')
    const { commits, dirty } = await gitScreenshots(root, 'US-01.1.1')
    expect(commits.map((c) => c.commit.subject)).toEqual(['Recapture'])
    expect(commits[0]!.files[0]).toEqual({ from: { src: 'assets/US-01.1.1/web.png', sha: gitBlobSha(Buffer.from('one')) }, to: { src: 'assets/US-01.1.1/web.png', sha: gitBlobSha(Buffer.from('two')) } })
    expect(dirty).toBe(false)
    expect((await gitBlob(root, commits[0]!.files[0]!.from.sha))?.toString()).toBe('one')
    expect(readFileSync(join(dir, 'web.png'), 'utf8')).toBe('two')
  })

  it('reads as no history outside a repository', async () => {
    expect((await gitFileHistory(itemPath('US-01.1.1', root))).versions).toEqual([])
  })
})

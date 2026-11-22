import { changesOf } from './deliveries.ts'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseItem, serialiseItem } from '../shared/files.ts'
import type { CatalogueChange, Item, Rev } from '../shared/types.ts'
import { HttpError, createCatalogueApi } from '../server/catalogueApi.ts'
import { configPath, itemPath, layoutPath, loadCatalogue, questionPath, writeItem, writeLayout, writeQuestion } from '../server/catalogueFs.ts'
import { DEFAULT_ITEM_STATUSES, DEFAULT_QUESTION_STATUSES, type StatusDef } from '../shared/statuses.ts'
import { CONFIG_SECTIONS, configRevs } from '../shared/config.ts'
import type { ServerResponse } from 'node:http'
import { execFileSync } from 'node:child_process'
import { serveAsset, serveHistoryBlob } from '../server/cataloguePlugin.ts'
import { gitBlobSha } from '../server/historyJournal.ts'
import type { DiffResponse } from '../shared/diff.ts'
import { item, question } from './fixtures.ts'

const JSON_HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }

const hasGit = (() => {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

let root: string
let events: CatalogueChange[]
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'catalogue-api-'))
  events = []
  writeItem(item({ id: 'EP-01', type: 'epic' }), root)
  writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), root)
  writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, notes: 'A note.' }), root)
  writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2 }), root)
  writeQuestion(question({ id: 'OQ-01', affects: ['US-01.1.1'] }), root)
  writeLayout({ positions: {}, lanes: [] }, root)
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const api = () => createCatalogueApi(root, (d) => events.push(...changesOf(d)))
const call = (a: ReturnType<typeof api>, method: string, path: string, body?: unknown, headers: Record<string, string> = JSON_HEADERS) =>
  a.handle({ method, path, body, headers })
function status(fn: () => unknown): number {
  try {
    fn()
    return 200
  } catch (e) {
    if (e instanceof HttpError) return e.status
    throw e
  }
}
const recOf = (a: ReturnType<typeof api>, id: string) => a.getState().items[id]!
/** A Settings write as the board sends it: every section with its base, read from the file as it is now. */
const withBases = (body: Record<string, unknown>) => {
  let raw: Record<string, unknown> | null = {}
  try {
    raw = existsSync(configPath(root)) ? (JSON.parse(readFileSync(configPath(root), 'utf8')) as Record<string, unknown> | null) : {}
  } catch {
    raw = null // an unreadable file: any base will do, the save is refused anyway
  }
  const revs = configRevs(raw)
  return { ...body, bases: Object.fromEntries(CONFIG_SECTIONS.filter((k) => body[k] !== undefined).map((k) => [k, revs[k]])) }
}

describe('creating', () => {
  it('never reuses the ID of a file that fails to parse', () => {
    writeFileSync(itemPath('US-01.1.3', root), '---\nid: US-01.1.3\nstatus: RFP\nstatus: Open\n---\nBroken on purpose\n')
    const a = api()
    const rec = call(a, 'POST', '/api/items', { type: 'story', parent: 'FT-01.1', title: 'New' }) as Rev<Item>
    expect(rec.data.id).toBe('US-01.1.4')
    expect(readFileSync(itemPath('US-01.1.3', root), 'utf8')).toContain('Broken on purpose')
  })

  it('skips an ID another writer created after the last sync, instead of overwriting it', () => {
    const a = api()
    writeItem(item({ id: 'US-01.1.3', parent: 'FT-01.1', title: 'Agent made this' }), root) // watcher has not synced yet
    const rec = call(a, 'POST', '/api/items', { type: 'story', parent: 'FT-01.1', title: 'Mine' }) as Rev<Item>
    expect(rec.data.id).toBe('US-01.1.4')
    expect(parseItem(readFileSync(itemPath('US-01.1.3', root), 'utf8')).title).toBe('Agent made this')
  })

  it('does the same for questions', () => {
    const a = api()
    writeFileSync(questionPath('OQ-02', root), 'not a catalogue file')
    const q = call(a, 'POST', '/api/questions', { title: 'Next' }) as Rev<{ id: string }>
    expect(q.data.id).toBe('OQ-03')
  })

  it('makes an epic with the next free number and no parent', () => {
    writeItem(item({ id: 'EP-03', type: 'epic' }), root)
    const rec = call(api(), 'POST', '/api/items', { type: 'epic', title: 'New epic' }) as Rev<Item>
    expect(rec.data).toMatchObject({ id: 'EP-04', parent: null, status: '1', title: 'New epic' })
    expect(existsSync(itemPath('EP-04', root))).toBe(true)
  })

  it('refuses a parent the type cannot have', () => {
    expect(status(() => call(api(), 'POST', '/api/items', { type: 'epic', parent: 'EP-01', title: 'x' }))).toBe(422)
    expect(status(() => call(api(), 'POST', '/api/items', { type: 'feature', parent: 'US-01.1.1', title: 'x' }))).toBe(422)
    expect(status(() => call(api(), 'POST', '/api/items', { type: 'feature', title: 'x' }))).toBe(422)
    expect(status(() => call(api(), 'POST', '/api/items', { type: 'story', parent: 'US-01.1.1', title: 'x' }))).toBe(422)
  })

  it('puts a story straight under an epic in its .0 slot, after the epic’s last child', () => {
    const rec = call(api(), 'POST', '/api/items', { type: 'story', parent: 'EP-01', title: 'Epic-level story' }) as Rev<Item>
    expect(rec.data.id).toBe('US-01.0.1')
    expect(rec.data.order).toBe(2) // after FT-01.1 (order 1)
  })

  it('defaults a new card: last among its siblings, its parent’s components, Proposed', () => {
    writeItem(item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 2, components: ['Admin Console'] }), root)
    const rec = call(api(), 'POST', '/api/items', { type: 'story', parent: 'FT-01.2', title: 'First' }) as Rev<Item>
    expect(rec.data).toMatchObject({ id: 'US-01.2.1', order: 1, components: ['Admin Console'], status: '1' })
    const next = call(api(), 'POST', '/api/items', { type: 'story', parent: 'FT-01.1', title: 'Third' }) as Rev<Item>
    expect(next.data).toMatchObject({ id: 'US-01.1.3', order: 3 })
  })

  it('checks what an outstanding item affects', () => {
    expect(status(() => call(api(), 'POST', '/api/questions', { title: 'x', affects: ['US-09.9.9'] }))).toBe(422)
    const q = call(api(), 'POST', '/api/questions', { kind: 'missing-source', title: 'Where is it', affects: ['FT-01.1'] }) as Rev<{ id: string; kind: string; affects: string[] }>
    expect(q.data).toMatchObject({ id: 'OQ-02', kind: 'missing-source', affects: ['FT-01.1'] })
    expect(readFileSync(questionPath('OQ-02', root), 'utf8')).toContain('FT-01.1')
  })

  it('rejects an unknown type rather than crashing', () => {
    expect(status(() => call(api(), 'POST', '/api/items', { type: 'saga', title: 'x' }))).toBe(422)
  })
})

describe('saving', () => {
  it('re-reads the file, so an edit on disk the watcher has not seen yet is not overwritten', () => {
    const a = api()
    const mine = recOf(a, 'US-01.1.2')
    writeItem({ ...mine.data, title: 'Agent retitled' }, root) // no syncFromDisk
    let err: HttpError | undefined
    try {
      call(a, 'PUT', '/api/items/US-01.1.2', { patch: { ...mine.data, title: 'User title' }, baseRev: mine.rev })
    } catch (e) {
      err = e as HttpError
    }
    expect(err?.status).toBe(409)
    expect((err?.body as { current: Rev<Item> }).current.data.title).toBe('Agent retitled')
    expect(parseItem(readFileSync(itemPath('US-01.1.2', root), 'utf8')).title).toBe('Agent retitled')
    expect(events.some((e) => e.kind === 'item' && e.id === 'US-01.1.2')).toBe(true)
  })

  it('requires baseRev', () => {
    const a = api()
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.2', { patch: recOf(a, 'US-01.1.2').data }))).toBe(400)
  })

  it('writes a clean save as a one-field change', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.2')
    const before = readFileSync(itemPath('US-01.1.2', root), 'utf8')
    call(a, 'PUT', '/api/items/US-01.1.2', { patch: { ...r.data, title: 'Renamed' }, baseRev: r.rev })
    const after = readFileSync(itemPath('US-01.1.2', root), 'utf8')
    expect(after).toBe(before.replace('title: Title of US-01.1.2', 'title: Renamed'))
  })

  it('never lets `extra` override a validated key', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.2')
    call(a, 'PUT', '/api/items/US-01.1.2', { patch: { ...r.data, extra: { type: 'epic', status: 'Bogus', owner: 'kept' } }, baseRev: r.rev })
    const onDisk = parseItem(readFileSync(itemPath('US-01.1.2', root), 'utf8'))
    expect(onDisk.type).toBe('story')
    expect(onDisk.status).toBe('1')
    expect(onDisk.extra).toEqual({ owner: 'kept' })
  })

  it('answers a malformed patch with 422, not a crash', () => {
    const a = api()
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.2', { patch: { id: 'US-01.1.2', status: { not: 'a code' }, parent: 42 }, baseRev: recOf(a, 'US-01.1.2').rev }))).toBe(422)
  })

  it('refuses a description that would split into Notes on the next read', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.1')
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { ...r.data, description: 'Intro\n\n## Notes\n\nnot notes' }, baseRev: r.rev }))).toBe(422)
  })

  it('refuses any section that holds another section\'s heading', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.1')
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { ...r.data, acceptance: '- ok\n## Technical discussion' }, baseRev: r.rev }))).toBe(422)
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { ...r.data, notes: '## Acceptance criteria' }, baseRev: r.rev }))).toBe(422)
  })

  it('refuses to save a file whose id does not match its name', () => {
    writeFileSync(itemPath('US-01.1.9', root), serialiseItem(item({ id: 'US-01.1.2', parent: 'FT-01.1' })))
    const a = api()
    expect(a.getState().items['US-01.1.9']).toBeUndefined()
    expect(a.getState().items['US-01.1.2']!.data.title).toBe('Title of US-01.1.2') // the copy did not shadow the original
    expect(a.getState().issues.some((i) => i.id === 'US-01.1.9' && i.severity === 'error')).toBe(true)
  })
})

describe('cross-site writes', () => {
  it('refuses non-JSON bodies (a form or no-cors fetch from another page)', () => {
    expect(status(() => call(api(), 'POST', '/api/questions', { title: 'x' }, { 'content-type': 'text/plain', host: 'localhost:5180' }))).toBe(415)
  })
  it('refuses a foreign Origin', () => {
    expect(status(() => call(api(), 'POST', '/api/questions', { title: 'x' }, { ...JSON_HEADERS, origin: 'https://evil.example' }))).toBe(403)
  })
  it('allows the board itself', () => {
    expect(status(() => call(api(), 'POST', '/api/questions', { title: 'x' }, { ...JSON_HEADERS, origin: 'http://localhost:5180' }))).toBe(200)
  })
})

describe('batch moves', () => {
  const batch = (a: ReturnType<typeof api>, changes: unknown[]) => call(a, 'POST', '/api/items/batch', { changes }) as { records: Rev<Item>[] }

  it('writes every record in one go, each as its own item event', () => {
    const a = api()
    const r = batch(a, [
      { id: 'US-01.1.2', baseRev: recOf(a, 'US-01.1.2').rev, patch: { order: 1, swimlane: 'MVP' } },
      { id: 'US-01.1.1', baseRev: recOf(a, 'US-01.1.1').rev, patch: { order: 2 } },
    ])
    expect(r.records.map((x) => [x.data.id, x.data.order])).toEqual([
      ['US-01.1.2', 1],
      ['US-01.1.1', 2],
    ])
    expect(parseItem(readFileSync(itemPath('US-01.1.2', root), 'utf8'))).toMatchObject({ order: 1, swimlane: 'MVP' })
    expect(events.filter((e) => e.kind === 'item').map((e) => (e as { id: string }).id)).toEqual(['US-01.1.2', 'US-01.1.1'])
  })

  it('writes nothing when one record is stale, and names it', () => {
    const a = api()
    const before = readFileSync(itemPath('US-01.1.1', root), 'utf8')
    writeItem({ ...recOf(a, 'US-01.1.2').data, title: 'Edited on disk' }, root)
    let err: HttpError | undefined
    try {
      batch(a, [
        { id: 'US-01.1.1', baseRev: recOf(a, 'US-01.1.1').rev, patch: { order: 5 } },
        { id: 'US-01.1.2', baseRev: 'stale', patch: { order: 1 } },
      ])
    } catch (e) {
      err = e as HttpError
    }
    expect(err?.status).toBe(409)
    expect(err?.message).toMatch(/US-01\.1\.2/)
    expect(readFileSync(itemPath('US-01.1.1', root), 'utf8')).toBe(before)
  })

  it('writes nothing when the whole would break a rule', () => {
    const a = api()
    const before = readFileSync(itemPath('US-01.1.1', root), 'utf8')
    const s = status(() =>
      batch(a, [
        { id: 'US-01.1.1', baseRev: recOf(a, 'US-01.1.1').rev, patch: { order: 9 } },
        { id: 'US-01.1.2', baseRev: recOf(a, 'US-01.1.2').rev, patch: { parent: 'US-01.1.1' } },
      ]),
    )
    expect(s).toBe(422)
    expect(readFileSync(itemPath('US-01.1.1', root), 'utf8')).toBe(before)
  })

  it('refuses a type change, a repeated id and a missing baseRev', () => {
    const a = api()
    const rev = recOf(a, 'US-01.1.1').rev
    expect(status(() => batch(a, [{ id: 'US-01.1.1', baseRev: rev, patch: { type: 'feature' } }]))).toBe(422)
    expect(status(() => batch(a, [{ id: 'US-01.1.1', baseRev: rev, patch: {} }, { id: 'US-01.1.1', baseRev: rev, patch: {} }]))).toBe(400)
    expect(status(() => batch(a, [{ id: 'US-01.1.1', patch: {} }]))).toBe(400)
  })
})

describe('lanes', () => {
  // Every lane-list write carries the list's rev it started from (base-less lane writes retired in B11).
  it('saves the lane list beside positions, and re-checks swimlanes against it', () => {
    const a = api()
    call(a, 'PUT', '/api/items/US-01.1.1', { patch: { ...recOf(a, 'US-01.1.1').data, swimlane: 'MVP' }, baseRev: recOf(a, 'US-01.1.1').rev })
    expect(a.getState().issues.some((i) => i.message.startsWith('swimlane "MVP" is not a lane'))).toBe(true)
    call(a, 'PUT', '/api/layout', { lanes: ['MVP', 'Phase 2'], lanesRev: a.getState().layout.lanesRev })
    expect(JSON.parse(readFileSync(layoutPath(root), 'utf8'))).toEqual({ positions: {}, lanes: ['MVP', 'Phase 2'] })
    expect(a.getState().issues.some((i) => i.message.includes('swimlane'))).toBe(false)
    expect(events.some((e) => e.kind === 'layout' && e.layout.lanes.length === 2)).toBe(true)
    // A positions patch leaves the lanes alone.
    call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.1': { x: 1, y: 2 } } })
    expect(loadCatalogue(root).layout.lanes).toEqual(['MVP', 'Phase 2'])
  })

  it('refuses a bad lane list', () => {
    const a = api()
    expect(status(() => call(a, 'PUT', '/api/layout', { lanes: ['MVP', 'mvp'], lanesRev: a.getState().layout.lanesRev }))).toBe(422)
    expect(status(() => call(a, 'PUT', '/api/layout', { lanes: ['Unassigned'], lanesRev: a.getState().layout.lanesRev }))).toBe(422)
    expect(status(() => call(a, 'PUT', '/api/layout', { lanes: [''], lanesRev: a.getState().layout.lanesRev }))).toBe(422)
    expect(status(() => call(a, 'PUT', '/api/layout', { lanes: 'MVP', lanesRev: a.getState().layout.lanesRev }))).toBe(422)
  })

  it('renames the first lane, keeps the name clear of the others, and resets it with null', () => {
    const a = api()
    call(a, 'PUT', '/api/layout', { lanes: ['MVP'], lanesRev: a.getState().layout.lanesRev })
    call(a, 'PUT', '/api/layout', { firstLane: 'Backlog', lanesRev: a.getState().layout.lanesRev })
    expect(loadCatalogue(root).layout).toMatchObject({ firstLane: 'Backlog', lanes: ['MVP'] })
    expect(status(() => call(a, 'PUT', '/api/layout', { firstLane: 'mvp', lanesRev: a.getState().layout.lanesRev }))).toBe(422)
    // Unassigned is free once the first lane has another name.
    call(a, 'PUT', '/api/layout', { lanes: ['MVP', 'Unassigned'], lanesRev: a.getState().layout.lanesRev })
    expect(status(() => call(a, 'PUT', '/api/layout', { firstLane: null, lanesRev: a.getState().layout.lanesRev }))).toBe(422)
    call(a, 'PUT', '/api/layout', { lanes: ['MVP'], lanesRev: a.getState().layout.lanesRev })
    call(a, 'PUT', '/api/layout', { firstLane: null, lanesRev: a.getState().layout.lanesRev })
    expect(loadCatalogue(root).layout.firstLane).toBeUndefined()
  })
})

describe('layout', () => {
  it('applies a patch and keeps positions it was not sent, even for items not currently loaded', () => {
    writeLayout({ positions: { 'US-01.1.1': { x: 1, y: 2 }, 'US-07.7.7': { x: 3, y: 4 } }, lanes: [] }, root)
    const a = api()
    call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.2': { x: 10.4, y: 20 }, 'US-01.1.1': null } })
    expect(JSON.parse(readFileSync(layoutPath(root), 'utf8')).positions).toEqual({ 'US-01.1.2': { x: 10, y: 20 }, 'US-07.7.7': { x: 3, y: 4 } })
  })

  it('reports an unreadable layout file and refuses to overwrite it', () => {
    writeFileSync(layoutPath(root), '{\n<<<<<<< HEAD\n')
    const a = api()
    expect(a.getState().issues.some((i) => i.id === 'layout')).toBe(true)
    expect(status(() => call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.1': { x: 1, y: 1 } } }))).toBe(422)
    expect(readFileSync(layoutPath(root), 'utf8')).toContain('<<<<<<<')
  })
})

describe('sync', () => {
  it('emits an event for a file changed on disk', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.2')
    writeItem({ ...r.data, title: 'Changed elsewhere' }, root)
    a.syncFromDisk()
    expect(events.find((e) => e.kind === 'item' && e.id === 'US-01.1.2')).toBeTruthy()
  })

  it('flags frontmatter that parses but loses data', () => {
    writeFileSync(itemPath('US-01.1.5', root), '---\nid: US-01.1.5\ntype: story\nparent: FT-01.1\ntitle: 1.10\nstatus: RFP\ncomponents:\n  - Admin Console\nsources:\n  - Q&A 2026-09-24 #7\norder: 5\nimages: []\n---\n\nText\n')
    const issues = loadCatalogue(root).issues.filter((i) => i.id === 'US-01.1.5').map((i) => i.message)
    expect(issues.some((m) => m.includes('YAML comment'))).toBe(true)
    expect(issues.some((m) => m.includes('title was read as a number'))).toBe(true)
    expect(existsSync(itemPath('US-01.1.5', root))).toBe(true)
  })
})

describe('refusals the board cannot answer with "Keep mine"', () => {
  it('answers a save to an unreadable file with 422, not a 409 conflict', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.2')
    writeFileSync(itemPath('US-01.1.2', root), '---\nid: US-01.1.2\n<<<<<<< HEAD\n')
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.2', { patch: r.data, baseRev: r.rev }))).toBe(422)
  })

  it('answers a save to a file holding another id with 422', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.2')
    writeItem({ ...r.data, id: 'US-01.1.9' }, root)
    writeFileSync(itemPath('US-01.1.2', root), readFileSync(itemPath('US-01.1.9', root), 'utf8'))
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.2', { patch: r.data, baseRev: r.rev }))).toBe(422)
  })
})

describe('layout re-read', () => {
  it('patches the file as it is on disk, not the last synced copy', () => {
    const a = api()
    writeLayout({ positions: { 'US-01.1.2': { x: 5, y: 6 } }, lanes: [] }, root) // a git pull, not yet synced
    call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.1': { x: 1, y: 2 } } })
    expect(JSON.parse(readFileSync(layoutPath(root), 'utf8')).positions).toEqual({ 'US-01.1.1': { x: 1, y: 2 }, 'US-01.1.2': { x: 5, y: 6 } })
  })

  it('refuses when the file went bad after the last sync, and leaves it alone', () => {
    const a = api()
    writeFileSync(layoutPath(root), '{\n<<<<<<< HEAD\n')
    expect(status(() => call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.1': { x: 1, y: 1 } } }))).toBe(422)
    expect(readFileSync(layoutPath(root), 'utf8')).toContain('<<<<<<<')
  })
})

describe('check warns about what a save would refuse or change', () => {
  it('flags a repeated section heading the board cannot save', () => {
    const text = serialiseItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', notes: 'First' })) + '\n## Notes\n\nSecond\n'
    writeFileSync(itemPath('US-01.1.2', root), text)
    const issues = loadCatalogue(root).issues.filter((i) => i.id === 'US-01.1.2')
    expect(issues.some((i) => i.severity === 'warning' && /cannot save/.test(i.message))).toBe(true)
  })

  it('flags a missing order and image keys the board drops', () => {
    const text = readFileSync(itemPath('US-01.1.2', root), 'utf8').replace(/^order: .*\n/m, '').replace('images: []', 'images:\n  - src: assets/US-01.1.2/a.png\n    viewport: desktop\n    alt: A')
    writeFileSync(itemPath('US-01.1.2', root), text)
    const msgs = loadCatalogue(root).issues.filter((i) => i.id === 'US-01.1.2').map((i) => i.message)
    expect(msgs.some((m) => /order is missing/.test(m))).toBe(true)
    expect(msgs.some((m) => /keys the board does not keep \(alt\)/.test(m))).toBe(true)
  })
})

describe('serveAsset', () => {
  const res = () => ({ setHeader: () => {}, end: () => {} }) as unknown as ServerResponse
  it('serves nothing outside the assets folder', () => {
    writeFileSync(join(root, 'secret.txt'), 'x')
    for (const p of ['/requirements/secret.txt', '/requirements/assets/../secret.txt', '/requirements/assets/%2e%2e/secret.txt', '/requirements/stories/EP-01.md']) {
      expect(serveAsset(root, new URL(p, 'http://local'), res())).toBe(false)
    }
  })
})

describe('deleting a question', () => {
  it('removes the file and tells the clients', () => {
    const a = api()
    const rev = a.getState().questions['OQ-01']!.rev
    call(a, 'DELETE', '/api/questions/OQ-01', { baseRev: rev })
    expect(existsSync(questionPath('OQ-01', root))).toBe(false)
    expect(a.getState().questions['OQ-01']).toBeUndefined()
    expect(events).toContainEqual({ kind: 'question', id: 'OQ-01', record: null })
  })

  it('refuses a stale or missing baseRev, and a question that does not exist', () => {
    const a = api()
    expect(status(() => call(a, 'DELETE', '/api/questions/OQ-01', { baseRev: 'stale' }))).toBe(409)
    expect(status(() => call(a, 'DELETE', '/api/questions/OQ-01', {}))).toBe(400)
    expect(status(() => call(a, 'DELETE', '/api/questions/OQ-99', { baseRev: 'x' }))).toBe(404)
    expect(existsSync(questionPath('OQ-01', root))).toBe(true)
  })
})

describe('deleting an item', () => {
  const del = (a: ReturnType<typeof api>, id: string, ids: string[], baseRev = recOf(a, id).rev) => call(a, 'DELETE', `/api/items/${id}`, { baseRev, ids })

  it('removes a story, its layout position and its screenshots, and tells the clients', () => {
    writeLayout({ positions: { 'US-01.1.2': { x: 1, y: 2 }, 'US-01.1.1': { x: 3, y: 4 } }, lanes: [] }, root)
    mkdirSync(join(root, 'assets', 'US-01.1.2'), { recursive: true })
    writeFileSync(join(root, 'assets', 'US-01.1.2', 'shot.png'), 'png')
    const a = api()
    expect(del(a, 'US-01.1.2', ['US-01.1.2'])).toMatchObject({ deleted: ['US-01.1.2'] })
    expect(existsSync(itemPath('US-01.1.2', root))).toBe(false)
    expect(existsSync(join(root, 'assets', 'US-01.1.2'))).toBe(false)
    expect(Object.keys(loadCatalogue(root).layout.positions)).toEqual(['US-01.1.1'])
    expect(a.getState().items['US-01.1.2']).toBeUndefined()
    expect(events).toContainEqual({ kind: 'item', id: 'US-01.1.2', record: null })
  })

  it('takes everything under an epic, and strips references from the records that stay', () => {
    writeItem(item({ id: 'EP-02', type: 'epic', related: ['FT-01.1', 'EP-01'], description: 'See [the feature](FT-01.1) and `[code](FT-01.1)`.' }), root)
    const a = api()
    const res = del(a, 'EP-01', ['EP-01', 'FT-01.1', 'US-01.1.1', 'US-01.1.2']) as { deleted: string[] }
    expect(res.deleted).toEqual(['US-01.1.1', 'US-01.1.2', 'FT-01.1', 'EP-01'])
    const cat = loadCatalogue(root)
    expect(Object.keys(cat.items)).toEqual(['EP-02'])
    expect(cat.items['EP-02']!.data.related).toEqual([])
    expect(cat.items['EP-02']!.data.description).toBe('See the feature and `[code](FT-01.1)`.')
    expect(cat.questions['OQ-01']!.data.affects).toEqual([])
    expect(cat.issues.filter((i) => i.severity === 'error')).toEqual([])
  })

  it('refuses when what sits under it is not what the user was shown, and deletes nothing', () => {
    const a = api()
    expect(status(() => del(a, 'FT-01.1', ['FT-01.1', 'US-01.1.1']))).toBe(409)
    expect(status(() => call(a, 'DELETE', '/api/items/FT-01.1', { baseRev: recOf(a, 'FT-01.1').rev }))).toBe(400)
    // A story added on disk since the question was asked.
    writeItem(item({ id: 'US-01.1.3', parent: 'FT-01.1' }), root)
    expect(status(() => del(a, 'FT-01.1', ['FT-01.1', 'US-01.1.1', 'US-01.1.2']))).toBe(409)
    expect(existsSync(itemPath('FT-01.1', root))).toBe(true)
    expect(existsSync(itemPath('US-01.1.1', root))).toBe(true)
  })

  it('refuses a stale baseRev and an item that does not exist', () => {
    const a = api()
    expect(status(() => del(a, 'US-01.1.2', ['US-01.1.2'], 'stale'))).toBe(409)
    expect(status(() => call(a, 'DELETE', '/api/items/US-09.9.9', { baseRev: 'x', ids: ['US-09.9.9'] }))).toBe(404)
    expect(existsSync(itemPath('US-01.1.2', root))).toBe(true)
  })
})

describe('the status settings', () => {
  const put = (a: ReturnType<typeof api>, body: Record<string, unknown>) => call(a, 'PUT', '/api/config', withBases(body))
  const renamed: StatusDef[] = DEFAULT_ITEM_STATUSES.map((d) => (d.code === '1' ? { ...d, label: 'Draft', help: 'Not agreed yet' } : d))

  it('rewrites only the status lists, keeping the rest of the file, and tells the clients', () => {
    writeFileSync(configPath(root), JSON.stringify({ project: { name: 'Acme' }, components: [{ name: 'Core', code: 'COR' }] }, null, 2))
    const a = api()
    put(a, { statuses: renamed })
    const file = JSON.parse(readFileSync(configPath(root), 'utf8'))
    expect(file.project).toEqual({ name: 'Acme' })
    expect(file.components).toEqual([{ name: 'Core', code: 'COR' }])
    expect(file.statuses[0]).toEqual({ code: 1, label: 'Draft', help: 'Not agreed yet', tone: 'neutral', role: 'default' })
    expect(file.questionStatuses).toBeUndefined()
    expect(a.getState().config.statuses[0]!.label).toBe('Draft')
    expect(events.some((e) => e.kind === 'config')).toBe(true)
    // A rename touches no card.
    expect(parseItem(readFileSync(itemPath('EP-01', root), 'utf8')).status).toBe('1')
    // A code is written as a bare number, not a quoted string.
    expect(readFileSync(itemPath('EP-01', root), 'utf8')).toMatch(/^status: 1$/m)
  })

  it('keeps the hand-edited voice rules when Settings saves', () => {
    const voice = { descriptionWarnings: [{ pattern: '\\bour reading\\b', message: 'an "our reading" marker' }] }
    writeFileSync(configPath(root), JSON.stringify({ project: { name: 'Acme' }, voice }, null, 2))
    const a = api()
    put(a, { project: { name: 'Acme Two' } })
    expect(JSON.parse(readFileSync(configPath(root), 'utf8')).voice).toEqual(voice)
    expect(a.getState().config.voice.descriptionWarnings).toEqual([{ ...voice.descriptionWarnings[0], flags: 'i' }])
  })

  it('keeps short entries on one line', () => {
    put(api(), { questionStatuses: DEFAULT_QUESTION_STATUSES })
    const text = readFileSync(configPath(root), 'utf8')
    expect(text).toContain('{ "code": 1, "label": "Open", "heading": "Open", "help": "Waiting for an answer", "tone": "amber", "role": "default" }')
  })

  it('refuses a list that breaks the rules, or drops a status still in use', () => {
    const a = api()
    expect(status(() => put(a, { statuses: renamed.filter((d) => d.role !== 'retired') }))).toBe(422)
    expect(status(() => put(a, { statuses: renamed.filter((d) => d.code !== '1').map((d) => (d.code === '2' ? { ...d, role: 'default' } : d)) }))).toBe(422)
    expect(status(() => put(a, { questionStatuses: DEFAULT_QUESTION_STATUSES.filter((d) => d.code !== '2') }))).toBe(200)
    expect(existsSync(configPath(root))).toBe(true)
  })

  it('starts new cards and questions at the default role, whatever its code', () => {
    const a = api()
    put(a, { statuses: [{ code: '9', label: 'Idea', help: '', tone: 'sand', role: 'default' }, ...DEFAULT_ITEM_STATUSES.map((d) => (d.role === 'default' ? { ...d, role: undefined } : d))] })
    const rec = call(a, 'POST', '/api/items', { type: 'epic', title: 'New' }) as Rev<Item>
    expect(rec.data.status).toBe('9')
  })
})

describe('status identity on the server (R-01, R-68)', () => {
  /** This repo's numbering: 4 Agreed, 5 Confirmed, 6 Retired (the defaults have 5 Retired). */
  const SIX = [
    { code: 1, label: 'Proposed', help: 'Needs agreement', tone: 'neutral', role: 'default' },
    { code: 2, label: 'Open', help: 'Waiting', tone: 'amber', role: 'waiting' },
    { code: 3, label: 'Verify', help: 'Check it', tone: 'olive', settle: true },
    { code: 4, label: 'Agreed', help: 'Agreed', tone: 'green', settle: true },
    { code: 5, label: 'Confirmed', help: 'Signed off', tone: 'forest', settle: true },
    { code: 6, label: 'Retired', help: 'Gone', tone: 'hatched', role: 'retired' },
  ]
  const writeConfig = (statuses: unknown, extra: Record<string, unknown> = {}) => writeFileSync(configPath(root), JSON.stringify({ project: { name: 'Acme' }, statuses, ...extra }, null, 2))
  const put = (a: ReturnType<typeof api>, body: Record<string, unknown>) => call(a, 'PUT', '/api/config', withBases(body))
  const codesOnDisk = () => (JSON.parse(readFileSync(configPath(root), 'utf8')).statuses as { code: number; label: string }[]).map((d) => `${d.code} ${d.label}`)
  beforeEach(() => {
    writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, status: '5' }), root)
    writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, status: '6' }), root)
  })

  it('keeps the project\'s codes when a list with a bad tone is reworded and saved (the FINDINGS scenario)', () => {
    writeConfig(SIX.map((d) => (d.code === 4 ? { ...d, tone: 'teal' } : d)))
    const a = api()
    const shown = a.getState().config.statuses
    put(a, { statuses: shown.map((d) => (d.code === '1' ? { ...d, help: 'Reworded' } : d)) })
    expect(codesOnDisk()).toEqual(['1 Proposed', '2 Open', '3 Verify', '4 Agreed', '5 Confirmed', '6 Retired'])
    expect(a.getState().config.statusState.statuses.state).toBe('healthy')
  })

  it('refuses a status save while the list on disk is damaged, leaving the file byte for byte', () => {
    const damaged: Record<string, unknown> = {
      'a bad code': SIX.map((d) => (d.code === 3 ? { ...d, code: 'x' } : d)),
      'a duplicated code': [...SIX, { ...SIX[1] }],
      'two retired roles': SIX.map((d) => (d.code === 5 ? { ...d, role: 'retired' } : d)),
      'not a list': { Proposed: 1 },
    }
    for (const [name, statuses] of Object.entries(damaged)) {
      writeConfig(statuses)
      const before = readFileSync(configPath(root), 'utf8')
      const a = api()
      expect(a.getState().config.statusState.statuses.state, name).toBe('damaged')
      expect(status(() => put(a, { statuses: SIX })), name).toBe(422)
      expect(readFileSync(configPath(root), 'utf8'), name).toBe(before)
    }
    for (const text of ['{ "statuses": [ ,', 'null', '[]']) {
      writeFileSync(configPath(root), text)
      expect(status(() => put(api(), { statuses: SIX })), text).toBe(422)
      expect(readFileSync(configPath(root), 'utf8'), text).toBe(text)
    }
  })

  it('judges a status in use against the list on disk, not the one in memory', () => {
    const a = api()
    // The server read no config (built-in 1 to 5); the file on disk now defines 6, which a card holds.
    writeConfig(SIX)
    expect(status(() => put(a, { statuses: SIX.filter((d) => d.code !== 6).map((d) => (d.code === 5 ? { ...d, settle: undefined, role: 'retired' } : d)) }))).toBe(422)
    expect(codesOnDisk()).toHaveLength(6)
    // A card holding a code the list never defined does not block an unrelated save.
    writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, status: '9' }), root)
    const b = api()
    expect(status(() => put(b, { statuses: SIX.map((d) => (d.code === 2 ? { ...d, label: 'Waiting' } : d)) }))).toBe(200)
  })

  it('tells the client how each list read, in the snapshot and the config event', () => {
    writeConfig(SIX.map((d) => (d.code === 4 ? { ...d, tone: 'teal' } : d)))
    const a = api()
    const snap = call(a, 'GET', '/api/catalogue') as { config: { statusState: Record<string, { state: string; problems: string[] }> } }
    expect(snap.config.statusState.statuses!.state).toBe('degraded')
    expect(snap.config.statusState.statuses!.problems[0]).toMatch(/"4" tone/)
    expect(snap.config.statusState.questionStatuses!.state).toBe('healthy')
    put(a, { statuses: SIX })
    const ev = events.findLast((e) => e.kind === 'config') as { config: { statusState: Record<string, { state: string }> } }
    expect(ev.config.statusState.statuses!.state).toBe('healthy')
    writeConfig({ Proposed: 1 })
    expect((call(api(), 'GET', '/api/catalogue') as typeof snap).config.statusState.statuses!.state).toBe('damaged')
  })

  it('records a removed status and never hands its code out again', () => {
    writeConfig([...SIX, { code: 7, label: 'On hold', help: '', tone: 'sand' }])
    const a = api()
    put(a, { statuses: SIX })
    const file = JSON.parse(readFileSync(configPath(root), 'utf8'))
    expect(file.removedStatuses).toEqual({ statuses: [{ code: 7, label: 'On hold' }] })
    expect(file.project).toEqual({ name: 'Acme' })
    expect(status(() => put(a, { statuses: [...SIX, { code: 7, label: 'Deferred', help: '', tone: 'sand' }] }))).toBe(422)
    expect(status(() => put(a, { statuses: [...SIX, { code: 8, label: 'Deferred', help: '', tone: 'sand' }] }))).toBe(200)
    expect(a.getState().config.statusState.statuses.highWater).toBe(8)
  })

  it('skips codes used only in a recode or only in a record', () => {
    writeConfig(SIX)
    writeFileSync(join(root, 'status-recodes.json'), JSON.stringify([{ date: '2026-11-01', items: { Old: '12' }, questions: {} }]))
    writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, status: '20' }), root)
    const a = api()
    expect(status(() => put(a, { statuses: [...SIX, { code: 10, label: 'New', help: '', tone: 'sand' }] }))).toBe(422)
    expect(status(() => put(a, { statuses: [...SIX, { code: 15, label: 'New', help: '', tone: 'sand' }] }))).toBe(422)
    expect(status(() => put(a, { statuses: [...SIX, { code: 21, label: 'New', help: '', tone: 'sand' }] }))).toBe(200)
  })

  it('refuses a new card while the default status is unresolved, and a status the project\'s list lacks', () => {
    writeConfig(SIX.map((d) => (d.code === 3 ? { ...d, role: 'default' } : d)))
    const a = api()
    expect(status(() => call(a, 'POST', '/api/items', { type: 'story', parent: 'FT-01.1', title: 'New' }))).toBe(422)
    const r = recOf(a, 'US-01.1.1')
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { ...r.data, status: '9' }, baseRev: r.rev }))).toBe(422)
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { ...r.data, status: '4' }, baseRev: r.rev }))).toBe(200)
  })
})

describe('diff review routes', () => {
  it('needs both refs, and reads a folder outside git as nothing to compare', async () => {
    const a = api()
    expect(status(() => a.handle({ method: 'GET', path: '/api/diff', query: { from: 'HEAD' } }))).toBe(400)
    expect(await a.handle({ method: 'GET', path: '/api/diff/commits' })).toEqual({ available: false, commits: [], head: null })
    expect(await a.handle({ method: 'GET', path: '/api/diff', query: { from: 'HEAD', to: 'worktree' } })).toMatchObject({ available: false, records: [] })
    expect(await a.handle({ method: 'GET', path: '/api/diff/count' })).toEqual({ available: false, count: 0 })
    expect(await a.handle({ method: 'GET', path: '/api/diff/auto' })).toMatchObject({ available: false, records: [] })
  })

  describe.skipIf(!hasGit)('in a repository', () => {
    const g = (...args: string[]) => execFileSync('git', args, { cwd: root, stdio: 'ignore' })
    const commitAll = (msg: string) => {
      g('add', '-A')
      g('-c', 'user.name=Tester', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', msg)
    }
    beforeEach(() => {
      g('init', '-q')
      commitAll('Catalogue')
    })

    it('counts, refuses a bad ref with a 400, and gives the default comparison', async () => {
      const a = api()
      writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, notes: 'A longer note.' }), root)
      expect(await a.handle({ method: 'GET', path: '/api/diff/count' })).toEqual({ available: true, count: 1 })
      expect(await a.handle({ method: 'GET', path: '/api/diff/count', query: { from: 'HEAD', to: 'HEAD' } })).toEqual({ available: true, count: 0 })
      await expect(a.handle({ method: 'GET', path: '/api/diff/count', query: { from: 'abcdef1' } }) as Promise<unknown>).rejects.toMatchObject({ status: 400 })
      const auto = (await a.handle({ method: 'GET', path: '/api/diff/auto' })) as DiffResponse
      expect([auto.jumped, auto.records.map((r) => r.id)]).toEqual([false, ['US-01.1.1']])
    })

    it('a write through the API is seen at once, even where comparisons with the disk are kept', async () => {
      const a = createCatalogueApi(root, (d) => events.push(...changesOf(d)), { watched: true })
      const get = () => a.handle({ method: 'GET', path: '/api/diff', query: { from: 'HEAD', to: 'worktree' } }) as Promise<DiffResponse>
      expect((await get()).records).toEqual([])
      const r = recOf(a, 'US-01.1.2')
      call(a, 'PUT', '/api/items/US-01.1.2', { patch: { ...r.data, title: 'Renamed' }, baseRev: r.rev })
      expect((await get()).records.map((x) => x.id)).toEqual(['US-01.1.2'])
      // A change on disk is kept until the watcher says so.
      writeItem(item({ id: 'EP-01', type: 'epic', title: 'Edited elsewhere' }), root)
      expect((await get()).records.map((x) => x.id)).toEqual(['US-01.1.2'])
      a.worktreeChanged()
      expect((await get()).records.map((x) => x.id).sort()).toEqual(['EP-01', 'US-01.1.2'])
    })

    describe('history blobs', () => {
      const res = () => {
        const headers: Record<string, string> = {}
        const r = { headers, body: null as Buffer | null, setHeader: (k: string, v: string) => (headers[k] = v), end: (b: Buffer) => (r.body = b) }
        return r
      }
      const serve = async (path: string, artifacts: Record<string, unknown> = {}) => {
        const r = res()
        const ok = await serveHistoryBlob(root, new URL(path, 'http://local'), r as unknown as ServerResponse, artifacts as never)
        return { ok, type: r.headers['Content-Type'], nosniff: r.headers['X-Content-Type-Options'], body: r.body?.toString() }
      }
      const shaAt = (path: string) => execFileSync('git', ['rev-parse', `HEAD:${path}`], { cwd: root, encoding: 'utf8' }).trim()

      it("serves a version as its own file's type when the blob was at that path, else as the artifact's file now", async () => {
        mkdirSync(join(root, 'artifacts', 'files'), { recursive: true })
        writeFileSync(join(root, 'artifacts', 'files', 'AR-01.png'), 'png bytes')
        writeFileSync(join(root, 'secret.txt'), 'not an artifact')
        commitAll('A picture')
        const png = shaAt('artifacts/files/AR-01.png')
        const secret = shaAt('secret.txt')
        const now = { 'AR-01': { data: { file: 'artifacts/files/AR-01.svg' } } }
        expect(await serve(`/history-blob/${png}?artifact=AR-01&file=artifacts/files/AR-01.png`, now)).toEqual({ ok: true, type: 'image/png', nosniff: 'nosniff', body: 'png bytes' })
        expect((await serve(`/history-blob/${png}?artifact=AR-01`, now)).type).toBe('image/svg+xml')
        // A blob that was never at the named path: not served as that type.
        expect((await serve(`/history-blob/${secret}?artifact=AR-01&file=artifacts/files/x.md`, now)).type).toBe('image/svg+xml')
        expect((await serve(`/history-blob/${secret}?artifact=AR-99&file=artifacts/files/x.md`)).ok).toBe(false)
        expect((await serve(`/history-blob/${secret}?artifact=AR-99&file=../secret.md`)).ok).toBe(false)
        // A file only on disk, not committed yet.
        writeFileSync(join(root, 'artifacts', 'files', 'new.md'), '# New')
        expect(await serve(`/history-blob/${gitBlobSha(Buffer.from('# New'))}?artifact=AR-99&file=artifacts/files/new.md`)).toMatchObject({ ok: true, type: 'text/markdown; charset=utf-8', body: '# New' })
      })

      it('serves an earlier version of an artifact that has since been removed, by the file it had', async () => {
        mkdirSync(join(root, 'artifacts', 'files'), { recursive: true })
        writeFileSync(join(root, 'artifacts', 'files', 'AR-07.md'), '# Gone now')
        commitAll('A note')
        const sha = shaAt('artifacts/files/AR-07.md')
        rmSync(join(root, 'artifacts', 'files', 'AR-07.md'))
        commitAll('Remove it')
        // AR-07 is in no catalogue now: the blob was at that path in a commit, so its type holds.
        expect(await serve(`/history-blob/${sha}?artifact=AR-07&file=artifacts/files/AR-07.md`)).toEqual({ ok: true, type: 'text/markdown; charset=utf-8', nosniff: 'nosniff', body: '# Gone now' })
        // Named for a path it never had, it is not served.
        expect((await serve(`/history-blob/${sha}?artifact=AR-07&file=artifacts/files/AR-07.svg`)).ok).toBe(false)
        // A blob that is not in the repository at all.
        expect((await serve(`/history-blob/${'0'.repeat(40)}?artifact=AR-07&file=artifacts/files/AR-07.md`)).ok).toBe(false)
      })

      it('serves a version of a removed artifact that only existed before the folder moved', async () => {
        // A repository whose requirements folder sits at `old/req`, then moves to `new/req`.
        const top = mkdtempSync(join(tmpdir(), 'catalogue-moved-'))
        try {
          const gt = (...args: string[]) => execFileSync('git', args, { cwd: top, stdio: 'ignore' })
          const commit = (msg: string) => {
            gt('add', '-A')
            gt('-c', 'user.name=Tester', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', msg)
          }
          const files = (base: string) => join(top, base, 'req', 'artifacts', 'files')
          gt('init', '-q')
          mkdirSync(files('old'), { recursive: true })
          writeFileSync(join(files('old'), 'AR-08.md'), '# First version')
          writeFileSync(join(files('old'), 'AR-09.md'), '# Removed before the move')
          writeFileSync(join(files('old'), 'AR-10.md'), '# Stays')
          commit('Notes')
          const first = execFileSync('git', ['rev-parse', 'HEAD:old/req/artifacts/files/AR-08.md'], { cwd: top, encoding: 'utf8' }).trim()
          const early = execFileSync('git', ['rev-parse', 'HEAD:old/req/artifacts/files/AR-09.md'], { cwd: top, encoding: 'utf8' }).trim()
          writeFileSync(join(files('old'), 'AR-08.md'), '# Second version')
          rmSync(join(files('old'), 'AR-09.md'))
          commit('Edit one, remove one')
          mkdirSync(join(top, 'new'))
          gt('mv', 'old/req', 'new/req')
          commit('Move the folder')
          rmSync(join(files('new'), 'AR-08.md'))
          commit('Remove it')
          const moved = join(top, 'new', 'req')
          const serveIn = async (path: string) => {
            const r = res()
            const ok = await serveHistoryBlob(moved, new URL(path, 'http://local'), r as unknown as ServerResponse, {})
            return { ok, type: r.headers['Content-Type'], body: r.body?.toString() }
          }
          // The first version was only ever at the old path: still served, as its own type.
          expect(await serveIn(`/history-blob/${first}?artifact=AR-08&file=artifacts/files/AR-08.md`)).toEqual({ ok: true, type: 'text/markdown; charset=utf-8', body: '# First version' })
          // A file removed before the move, so never renamed itself: found in its folder's earlier place.
          expect(await serveIn(`/history-blob/${early}?artifact=AR-09&file=artifacts/files/AR-09.md`)).toEqual({ ok: true, type: 'text/markdown; charset=utf-8', body: '# Removed before the move' })
          // Named for another file, it is still refused.
          expect((await serveIn(`/history-blob/${first}?artifact=AR-08&file=artifacts/files/AR-10.md`)).ok).toBe(false)
        } finally {
          rmSync(top, { recursive: true, force: true })
        }
      })
    })
  })
})

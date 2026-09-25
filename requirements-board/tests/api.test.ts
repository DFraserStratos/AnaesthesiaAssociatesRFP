import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseItem, serialiseItem } from '../shared/files.ts'
import type { CatalogueEvent, Item, Rev } from '../shared/types.ts'
import { HttpError, createCatalogueApi } from '../server/catalogueApi.ts'
import { itemPath, layoutPath, loadCatalogue, questionPath, writeItem, writeLayout, writeQuestion } from '../server/catalogueFs.ts'
import { item, question } from './fixtures.ts'

const JSON_HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }

let root: string
let events: CatalogueEvent[]
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'catalogue-api-'))
  events = []
  writeItem(item({ id: 'EP-01', type: 'epic' }), root)
  writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), root)
  writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, notes: 'A note.' }), root)
  writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2 }), root)
  writeQuestion(question({ id: 'OQ-01', affects: ['US-01.1.1'] }), root)
  writeLayout({ positions: {} }, root)
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const api = () => createCatalogueApi(root, (e) => events.push(e))
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
    expect(rec.data).toMatchObject({ id: 'EP-04', parent: null, status: 'Proposed', title: 'New epic' })
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
    writeItem(item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 2, components: ['Admin App'] }), root)
    const rec = call(api(), 'POST', '/api/items', { type: 'story', parent: 'FT-01.2', title: 'First' }) as Rev<Item>
    expect(rec.data).toMatchObject({ id: 'US-01.2.1', order: 1, components: ['Admin App'], status: 'Proposed' })
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
      call(a, 'PUT', '/api/items/US-01.1.2', { record: { ...mine.data, title: 'User title' }, baseRev: mine.rev })
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
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.2', { record: recOf(a, 'US-01.1.2').data }))).toBe(400)
  })

  it('writes a clean save as a one-field change', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.2')
    const before = readFileSync(itemPath('US-01.1.2', root), 'utf8')
    call(a, 'PUT', '/api/items/US-01.1.2', { record: { ...r.data, title: 'Renamed' }, baseRev: r.rev })
    const after = readFileSync(itemPath('US-01.1.2', root), 'utf8')
    expect(after).toBe(before.replace('title: Title of US-01.1.2', 'title: Renamed'))
  })

  it('never lets `extra` override a validated key', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.2')
    call(a, 'PUT', '/api/items/US-01.1.2', { record: { ...r.data, extra: { type: 'epic', status: 'Bogus', owner: 'kept' } }, baseRev: r.rev })
    const onDisk = parseItem(readFileSync(itemPath('US-01.1.2', root), 'utf8'))
    expect(onDisk.type).toBe('story')
    expect(onDisk.status).toBe('Proposed')
    expect(onDisk.extra).toEqual({ owner: 'kept' })
  })

  it('answers a malformed record with 422, not a crash', () => {
    const a = api()
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.2', { record: { id: 'US-01.1.2', type: 'story' }, baseRev: recOf(a, 'US-01.1.2').rev }))).toBe(422)
  })

  it('refuses a description that would split into Notes on the next read', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.1')
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.1', { record: { ...r.data, description: 'Intro\n\n## Notes\n\nnot notes' }, baseRev: r.rev }))).toBe(422)
  })

  it('refuses any section that holds another section\'s heading', () => {
    const a = api()
    const r = recOf(a, 'US-01.1.1')
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.1', { record: { ...r.data, acceptance: '- ok\n## Technical discussion' }, baseRev: r.rev }))).toBe(422)
    expect(status(() => call(a, 'PUT', '/api/items/US-01.1.1', { record: { ...r.data, notes: '## Acceptance criteria' }, baseRev: r.rev }))).toBe(422)
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

describe('layout', () => {
  it('applies a patch and keeps positions it was not sent, even for items not currently loaded', () => {
    writeLayout({ positions: { 'US-01.1.1': { x: 1, y: 2 }, 'US-07.7.7': { x: 3, y: 4 } } }, root)
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
    writeFileSync(itemPath('US-01.1.5', root), '---\nid: US-01.1.5\ntype: story\nparent: FT-01.1\ntitle: 1.10\nstatus: RFP\ncomponents:\n  - Admin App\nsources:\n  - Q&A 2026-09-24 #7\norder: 5\nimages: []\n---\n\nText\n')
    const issues = loadCatalogue(root).issues.filter((i) => i.id === 'US-01.1.5').map((i) => i.message)
    expect(issues.some((m) => m.includes('YAML comment'))).toBe(true)
    expect(issues.some((m) => m.includes('title was read as a number'))).toBe(true)
    expect(existsSync(itemPath('US-01.1.5', root))).toBe(true)
  })
})

/**
 * B03 · Load resilience, through the dev server's file API: deletes over parent cycles, layout saves
 * over a damaged board-layout.json, records saved with a byte-order mark, and a screenshot folder
 * the scan cannot fully read. Each failed on the code before B03.
 */
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { serialiseItem } from '../shared/files.ts'
import type { Item, Rev } from '../shared/types.ts'
import { HttpError, createCatalogueApi } from '../server/catalogueApi.ts'
import { itemPath, layoutPath, writeItem, writeLayout } from '../server/catalogueFs.ts'
import { createJournal, gitBlobSha } from '../server/historyJournal.ts'
import { item } from './fixtures.ts'

const JSON_HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }
const BOM = '﻿'

let root: string
let hist: string
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'b03-api-'))
  hist = mkdtempSync(join(tmpdir(), 'b03-hist-'))
  writeItem(item({ id: 'EP-01', type: 'epic' }), root)
  writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), root)
  writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }), root)
  writeLayout({ positions: {}, lanes: [] }, root)
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
  rmSync(hist, { recursive: true, force: true })
})

const api = () => createCatalogueApi(root, () => {}, { journal: createJournal(hist), gitHistory: async () => ({ versions: [], dirty: false, working: null }) })
const call = (a: ReturnType<typeof api>, method: string, path: string, body?: unknown) => a.handle({ method, path, body, headers: JSON_HEADERS })
function status(fn: () => unknown): number {
  try {
    fn()
    return 200
  } catch (e) {
    if (e instanceof HttpError) return e.status
    throw e
  }
}

describe('deleting a card in a parent cycle (R-53)', () => {
  it('a self-parented card: one file removed, the layout cleaned, success', () => {
    writeItem(item({ id: 'US-01.0.1', parent: 'US-01.0.1' }), root)
    writeLayout({ positions: { 'US-01.0.1': { x: 1, y: 1 }, 'EP-01': { x: 0, y: 0 } }, lanes: [] }, root)
    const a = api()
    const rev = a.getState().items['US-01.0.1']!.rev
    const out = call(a, 'DELETE', '/api/items/US-01.0.1', { baseRev: rev, ids: ['US-01.0.1'] }) as { deleted: string[] }
    expect(out.deleted).toEqual(['US-01.0.1'])
    expect(existsSync(itemPath('US-01.0.1', root))).toBe(false)
    expect(JSON.parse(readFileSync(layoutPath(root), 'utf8')).positions).toEqual({ 'EP-01': { x: 0, y: 0 } })
  })

  it('a member of a two-card cycle: both files removed, each once, success', () => {
    writeItem(item({ id: 'US-01.0.2', parent: 'US-01.0.3' }), root)
    writeItem(item({ id: 'US-01.0.3', parent: 'US-01.0.2' }), root)
    const a = api()
    const rev = a.getState().items['US-01.0.2']!.rev
    const out = call(a, 'DELETE', '/api/items/US-01.0.2', { baseRev: rev, ids: ['US-01.0.2', 'US-01.0.3'] }) as { deleted: string[] }
    expect(out.deleted.sort()).toEqual(['US-01.0.2', 'US-01.0.3'])
    expect(existsSync(itemPath('US-01.0.2', root)) || existsSync(itemPath('US-01.0.3', root))).toBe(false)
  })
})

describe('a damaged board-layout.json (R-50; accepted decision 17: the next save drops damaged entries)', () => {
  const junk = () => writeFileSync(layoutPath(root), JSON.stringify({ positions: { 'EP-01': { x: 3, y: 4 }, 'FT-01.1': null, 'US-01.1.1': 'x', 'US-01.1.2': [1] }, lanes: ['MVP'] }))

  it('reads only valid positions, names the dropped ones, and the next move drops them and clears the issue', () => {
    junk()
    const a = api()
    expect(a.getState().layout.positions).toEqual({ 'EP-01': { x: 3, y: 4 } })
    expect(a.getState().issues.find((i) => i.id === 'layout')?.message).toMatch(/FT-01\.1, US-01\.1\.1, US-01\.1\.2/)
    expect(status(() => call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.1': { x: 7, y: 8 } } }))).toBe(200)
    const written = JSON.parse(readFileSync(layoutPath(root), 'utf8'))
    expect(written).toEqual({ positions: { 'EP-01': { x: 3, y: 4 }, 'US-01.1.1': { x: 7, y: 8 } }, lanes: ['MVP'] })
    expect(a.getState().issues.find((i) => i.id === 'layout')).toBeUndefined()
  })

  it('a delete over it reports success and writes no junk', () => {
    writeFileSync(layoutPath(root), JSON.stringify({ positions: { 'EP-01': { x: 3, y: 4 }, 'US-01.1.2': { x: 1, y: 1 }, 'FT-01.1': null, 'US-01.1.1': 'x' }, lanes: [] }))
    writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2 }), root)
    const a = api()
    const rev = a.getState().items['US-01.1.2']!.rev
    expect(status(() => call(a, 'DELETE', '/api/items/US-01.1.2', { baseRev: rev, ids: ['US-01.1.2'] }))).toBe(200)
    expect(JSON.parse(readFileSync(layoutPath(root), 'utf8')).positions).toEqual({ 'EP-01': { x: 3, y: 4 } })
  })

  it('a top level that is not an object blocks moves with an accurate message, as unparseable JSON does', () => {
    writeFileSync(layoutPath(root), 'null')
    const a = api()
    expect(a.getState().issues.find((i) => i.id === 'layout')?.message).toMatch(/does not hold an object/)
    expect(status(() => call(a, 'PUT', '/api/layout', { positions: { 'EP-01': { x: 1, y: 1 } } }))).toBe(422)
    expect(readFileSync(layoutPath(root), 'utf8')).toBe('null')
  })
})

describe('a record saved with a byte-order mark (R-66; accepted decision 17: the mark is kept)', () => {
  it('loads, saves without a false conflict, and keeps its mark', () => {
    writeFileSync(itemPath('US-01.1.1', root), BOM + serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 })))
    const a = api()
    const rec = a.getState().items['US-01.1.1']!
    expect(a.getState().issues.filter((i) => i.severity === 'error')).toEqual([])
    const saved = call(a, 'PUT', '/api/items/US-01.1.1', { baseRev: rec.rev, patch: { ...rec.data, title: 'Renamed' } }) as Rev<Item>
    expect(readFileSync(itemPath('US-01.1.1', root), 'utf8').startsWith(BOM + '---')).toBe(true)
    // The board's copy of the revision matches the file's, so the next save is no conflict.
    const again = call(a, 'PUT', '/api/items/US-01.1.1', { baseRev: saved.rev, patch: { ...saved.data, title: 'Renamed twice' } }) as Rev<Item>
    expect(again.data.title).toBe('Renamed twice')
  })
})

describe('the screenshot scan (R-49)', () => {
  const png = (n: number) => Buffer.from([0x89, 0x50, 0x4e, 0x47, n])
  it('a dangling link, an unreadable image and a torn record never stop start-up or a sync; the rest is recorded and the record repaired', () => {
    const assets = join(root, 'assets')
    mkdirSync(join(assets, 'US-01.1.1'), { recursive: true })
    writeFileSync(join(assets, 'US-01.1.1', 'a.png'), png(1))
    writeFileSync(join(assets, 'US-01.1.1', 'b.png'), png(2))
    symlinkSync(join(root, 'gone'), join(assets, 'FT-01.1')) // dangling
    writeFileSync(join(hist, 'US-01.1.1.shots.json'), '{"a.png": {"sha": "') // torn
    const unreadable = join(assets, 'US-01.1.1', 'b.png')
    chmodSync(unreadable, 0)
    try {
      const a = api() // start-up scans
      expect(() => a.syncFromDisk()).not.toThrow()
      const rec = JSON.parse(readFileSync(join(hist, 'US-01.1.1.shots.json'), 'utf8')) as Record<string, { sha: string }>
      expect(rec['a.png']?.sha).toBe(gitBlobSha(png(1)))
      chmodSync(unreadable, 0o644)
      const rev = a.getState().items['US-01.1.1']!.rev
      expect(status(() => call(a, 'DELETE', '/api/items/US-01.1.1', { baseRev: rev, ids: ['US-01.1.1'] }))).toBe(200)
    } finally {
      if (existsSync(unreadable)) chmodSync(unreadable, 0o644)
    }
  })
})

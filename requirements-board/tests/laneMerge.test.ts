/**
 * B11: a lane rename onto another lane's name merges into it, through B05's one-write lane route
 * (`POST /api/lanes`; FINDINGS R-119, accepted decisions 7 and 25), and a lane-list write carries its
 * base (D-04e's last legacy shape retired). All or nothing, as B05 left the route.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HttpError, createCatalogueApi } from '../server/catalogueApi.ts'
import { itemPath, layoutPath, writeItem, writeLayout } from '../server/catalogueFs.ts'
import { parseItem } from '../shared/files.ts'
import type { Item, Layout, Rev } from '../shared/types.ts'
import { item } from './fixtures.ts'

const JSON_HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }
let root: string
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'lane-merge-'))
  writeItem(item({ id: 'EP-01', type: 'epic' }), root)
  writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), root)
  writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, swimlane: 'MVP' }), root)
  writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, swimlane: 'mvp' }), root)
  writeItem(item({ id: 'US-01.1.3', parent: 'FT-01.1', order: 3, swimlane: 'Unassigned' }), root)
  writeItem(item({ id: 'US-01.1.4', parent: 'FT-01.1', order: 4, swimlane: 'Later' }), root)
  writeLayout({ positions: {}, lanes: ['MVP', 'Later'] }, root)
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

type Api = ReturnType<typeof createCatalogueApi>
const api = (opts: Parameters<typeof createCatalogueApi>[2] = {}) => createCatalogueApi(root, () => {}, opts)
const call = (a: Api, method: string, path: string, body?: unknown) => a.handle({ method, path, body, headers: JSON_HEADERS })
function refusal(fn: () => unknown): HttpError {
  try {
    fn()
  } catch (e) {
    if (e instanceof HttpError) return e
    throw e
  }
  throw new Error('expected a refusal')
}
const onDisk = (id: string) => parseItem(readFileSync(itemPath(id, root), 'utf8'))
const lanesOnDisk = () => (JSON.parse(readFileSync(layoutPath(root), 'utf8')).lanes ?? []) as string[]
const storyRevs = (a: Api, lane: string) => Object.fromEntries(Object.values(a.getState().items).filter((r) => r.data.swimlane === lane).map((r) => [r.data.id, r.rev]))
const rename = (a: Api, from: string, to: string) => call(a, 'POST', '/api/lanes', { op: 'rename', from, to, lanesRev: a.getState().layout.lanesRev, stories: storyRevs(a, from) }) as { records: Rev<Item>[]; layout: Layout }
const swimlaneIssues = (a: Api) => a.getState().issues.filter((i) => /swimlane|lane/i.test(i.message) && i.id.startsWith('US-'))
const files = () => ['US-01.1.1', 'US-01.1.2', 'US-01.1.3', 'US-01.1.4'].map((id) => readFileSync(itemPath(id, root), 'utf8')).concat(readFileSync(layoutPath(root), 'utf8'))

describe('a rename onto an existing lane merges into it (R-119)', () => {
  it('a band that differs from a lane only in case joins that lane in one write, with no duplicate lane, and the check is clean', () => {
    const a = api()
    expect(swimlaneIssues(a).map((i) => i.id)).toContain('US-01.1.2')
    const out = rename(a, 'mvp', 'MVP')
    expect(out.records.map((r) => [r.data.id, r.data.swimlane])).toEqual([['US-01.1.2', 'MVP']])
    expect(onDisk('US-01.1.2').swimlane).toBe('MVP')
    expect(lanesOnDisk()).toEqual(['MVP', 'Later'])
    expect(swimlaneIssues(a).map((i) => i.id)).not.toContain('US-01.1.2')
  })

  it("a band named for the first lane joins the first lane: its stories' swimlane is removed", () => {
    const a = api()
    expect(swimlaneIssues(a).map((i) => i.id)).toContain('US-01.1.3')
    rename(a, 'Unassigned', 'Unassigned')
    expect(onDisk('US-01.1.3').swimlane).toBeNull()
    expect(lanesOnDisk()).toEqual(['MVP', 'Later'])
    expect(swimlaneIssues(a)).toEqual(swimlaneIssues(a).filter((i) => i.id !== 'US-01.1.3'))
  })

  it('a named lane renamed onto another lane in another case merges into it and leaves the list; onto the first lane, its stories go there', () => {
    const a = api()
    rename(a, 'MVP', 'later')
    expect(onDisk('US-01.1.1').swimlane).toBe('Later')
    expect(lanesOnDisk()).toEqual(['Later'])
    const b = api()
    rename(b, 'Later', 'UNASSIGNED')
    expect(onDisk('US-01.1.1').swimlane).toBeNull()
    expect(onDisk('US-01.1.4').swimlane).toBeNull()
    expect(lanesOnDisk()).toEqual([])
  })

  it('a rename to a new name, or of a lane to itself in another case, is still a rename', () => {
    const a = api()
    rename(a, 'Later', 'LATER')
    expect(onDisk('US-01.1.4').swimlane).toBe('LATER')
    expect(lanesOnDisk()).toEqual(['MVP', 'LATER'])
    rename(a, 'LATER', 'Soon')
    expect(lanesOnDisk()).toEqual(['MVP', 'Soon'])
  })

  it('a merge that fails part way, or meets a damaged layout, leaves every story file and the lane list as they were', () => {
    let n = 0
    const a = api({
      beforeWrite: () => {
        if (++n === 2) throw new Error('disk full')
      },
    })
    const before = files()
    const e = refusal(() => rename(a, 'MVP', 'later'))
    expect(e.status).toBe(500)
    expect(files()).toEqual(before)
    writeFileSync(layoutPath(root), '{ broken')
    const b = api()
    const damaged = files()
    expect(refusal(() => call(b, 'POST', '/api/lanes', { op: 'rename', from: 'mvp', to: 'MVP', lanesRev: '', stories: storyRevs(b, 'mvp') })).status).toBe(422)
    expect(files()).toEqual(damaged)
  })
})

describe('a lane-list write carries its base (D-04e retired by B11)', () => {
  it('lanes or firstLane without lanesRev is a 400 and changes nothing; with it, the write saves', () => {
    const a = api()
    const before = readFileSync(layoutPath(root), 'utf8')
    expect(refusal(() => call(a, 'PUT', '/api/layout', { lanes: ['MVP', 'Later', 'Soon'] })).status).toBe(400)
    expect(refusal(() => call(a, 'PUT', '/api/layout', { firstLane: 'Backlog' })).status).toBe(400)
    expect(readFileSync(layoutPath(root), 'utf8')).toBe(before)
    call(a, 'PUT', '/api/layout', { lanes: ['MVP', 'Later', 'Soon'], lanesRev: a.getState().layout.lanesRev })
    expect(lanesOnDisk()).toEqual(['MVP', 'Later', 'Soon'])
    // A positions-only write needs no base, as before.
    call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.1': { x: 1, y: 2 } } })
  })
})

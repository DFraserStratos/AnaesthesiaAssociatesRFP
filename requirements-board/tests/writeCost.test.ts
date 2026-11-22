/**
 * One write request, one check after writing and one issues event, whatever its size (B05: R-26,
 * REQ-14). `checkCatalogue` is wrapped in a counter; a request runs it once before writing (the guard)
 * and once after.
 */
import { changesOf } from './deliveries.ts'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CatalogueChange } from '../shared/types.ts'
import { item } from './fixtures.ts'

const checks = vi.hoisted(() => ({ n: 0 }))
vi.mock('../shared/check.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../shared/check.ts')>()
  return {
    ...real,
    checkCatalogue: (...args: Parameters<typeof real.checkCatalogue>) => {
      checks.n++
      return real.checkCatalogue(...args)
    },
  }
})
const { createCatalogueApi } = await import('../server/catalogueApi.ts')
const { writeItem, writeLayout } = await import('../server/catalogueFs.ts')

const JSON_HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }
let root: string
let events: CatalogueChange[]
const STORIES = (k: number) => Array.from({ length: k }, (_, i) => `US-01.1.${i + 1}`)

function seed(k: number) {
  writeItem(item({ id: 'EP-01', type: 'epic' }), root)
  writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), root)
  STORIES(k).forEach((id, i) => writeItem(item({ id, parent: 'FT-01.1', order: i + 1, swimlane: 'MVP', related: i ? ['US-01.1.1'] : [] }), root))
  writeLayout({ positions: {}, lanes: ['MVP'] }, root)
}
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'write-cost-'))
  events = []
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

/** Checks run and issues events sent by one request. */
function cost(k: number, request: (a: ReturnType<typeof createCatalogueApi>) => unknown) {
  seed(k)
  const a = createCatalogueApi(root, (d) => events.push(...changesOf(d)))
  checks.n = 0
  events.length = 0
  request(a)
  return { checks: checks.n, issues: events.filter((e) => e.kind === 'issues').length, items: events.filter((e) => e.kind === 'item').length }
}
const revs = (a: ReturnType<typeof createCatalogueApi>, ids: string[]) => ids.map((id) => a.getState().items[id]!.rev)
const call = (a: ReturnType<typeof createCatalogueApi>, method: string, path: string, body: unknown) => a.handle({ method, path, body, headers: JSON_HEADERS })

describe('one check and one issues event per write request (R-26)', () => {
  for (const k of [1, 12]) {
    it(`a batch of ${k}`, () => {
      const out = cost(k, (a) => {
        const r = revs(a, STORIES(k))
        call(a, 'POST', '/api/items/batch', { changes: STORIES(k).map((id, i) => ({ id, baseRev: r[i], patch: { order: 100 + i } })) })
      })
      expect(out).toEqual({ checks: 2, issues: 1, items: k })
    })

    it(`a lane rename over ${k} stories`, () => {
      const out = cost(k, (a) => {
        const r = revs(a, STORIES(k))
        call(a, 'POST', '/api/lanes', { op: 'rename', from: 'MVP', to: 'Now', lanesRev: a.getState().layout.lanesRev, stories: Object.fromEntries(STORIES(k).map((id, i) => [id, r[i]])) })
      })
      // It re-reads the folder first (one load, one check), then guards and writes: 3 whatever the size.
      expect(out).toEqual({ checks: 3, issues: 1, items: k })
    })
  }

  it('a delete whose rewrites touch many records', () => {
    const out = cost(12, (a) => call(a, 'DELETE', '/api/items/US-01.1.1', { baseRev: a.getState().items['US-01.1.1']!.rev, ids: ['US-01.1.1'] }))
    // The delete re-reads the folder first (one load, one check), then guards and writes: 3 whatever the size.
    expect(out.checks).toBe(3)
    expect(out.issues).toBe(1)
    expect(out.items).toBe(12) // 11 rewritten (their `related` lost US-01.1.1) and 1 deleted
  })
})

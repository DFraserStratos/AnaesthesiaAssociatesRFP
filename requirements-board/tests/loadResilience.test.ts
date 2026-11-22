/**
 * B03 · Load resilience: bad data becomes an issue, never a crash or a silent omission. Each block
 * names the finding it proves (FINDINGS.md); each failed on the code before B03.
 */
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { decodeEntities, markdownFacts, svgFacts } from '../shared/artifacts.ts'
import { checkCatalogue } from '../shared/check.ts'
import { DEFAULT_CONFIG, parseConfig } from '../shared/config.ts'
import { requirementsCsv } from '../shared/csv.ts'
import { parseArtifact, parseItem, parseQuestion, serialiseArtifact, serialiseItem, serialiseQuestion } from '../shared/files.ts'
import { canParent, lanesRevOf } from '../shared/move.ts'
import { planDelete } from '../shared/remove.ts'
import { parseRecodes } from '../shared/statuses.ts'
import type { Artifact, Item } from '../shared/types.ts'
import { configPath, issuesFor, itemPath, layoutPath, loadCatalogue, readLayout, serialiseLayout, takenIds, storiesDir, writeItem, writeLayout } from '../server/catalogueFs.ts'
import { autoLayout } from '../src/board/autoLayout.ts'
import { mappedLayout } from '../src/board/mappedLayout.ts'
import { questionWalk, type QuestionFilters } from '../src/questionWalk.ts'
import { buildIndex, descendantsOf } from '../src/store.ts'
import { item, question } from './fixtures.ts'

const recs = <T extends { id: string }>(list: T[]) => Object.fromEntries(list.map((x) => [x.id, { data: x, rev: x.id }]))

const epic = item({ id: 'EP-01', type: 'epic' })
const feature = item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' })
const self = item({ id: 'US-01.0.1', parent: 'US-01.0.1' })
const pairA = item({ id: 'US-01.0.2', parent: 'US-01.0.3' })
const pairB = item({ id: 'US-01.0.3', parent: 'US-01.0.2' })
const under = item({ id: 'US-01.0.4', parent: 'US-01.0.2' }) // hangs under a cycle member
const sound = item({ id: 'US-01.1.1', parent: 'FT-01.1' })
const cyclic = [epic, feature, sound, self, pairA, pairB, under]

describe('parent cycles never loop, hide or go unnamed (R-10, R-53)', () => {
  it("the store's descendantsOf is finite, has no repeats and never holds the start", () => {
    const index = buildIndex(recs(cyclic), {})
    expect(descendantsOf(index, 'US-01.0.1').map((i) => i.id)).toEqual([])
    expect(descendantsOf(index, 'US-01.0.2').map((i) => i.id).sort()).toEqual(['US-01.0.3', 'US-01.0.4'])
    expect(descendantsOf(index, 'EP-01').map((i) => i.id)).toEqual(['FT-01.1', 'US-01.1.1'])
  })

  it('a delete plan lists each doomed card once, for a self-parent and a two-card cycle', () => {
    expect(planDelete(cyclic, [], 'US-01.0.1').doomed.map((i) => i.id)).toEqual(['US-01.0.1'])
    const pair = planDelete(cyclic, [], 'US-01.0.2').doomed.map((i) => i.id)
    expect(pair.sort()).toEqual(['US-01.0.2', 'US-01.0.3', 'US-01.0.4'])
  })

  it('Freeform gives every card a place, cycle members once each, below the map', () => {
    const at = autoLayout(cyclic)
    expect(Object.keys(at).sort()).toEqual(cyclic.map((i) => i.id).sort())
    const mapBottom = Math.max(at['EP-01']!.y, at['US-01.1.1']!.y)
    for (const id of ['US-01.0.1', 'US-01.0.2', 'US-01.0.3', 'US-01.0.4']) expect(at[id]!.y).toBeGreaterThan(mapBottom)
    const spots = ['US-01.0.1', 'US-01.0.2', 'US-01.0.3', 'US-01.0.4'].map((id) => `${at[id]!.x},${at[id]!.y}`)
    expect(new Set(spots).size).toBe(4)
  })

  it('the check names each cycle on every member, and an acyclic catalogue gains nothing', () => {
    const issues = checkCatalogue({ items: cyclic, questions: [], fileExists: () => true })
    const cycle = (id: string) => issues.filter((i) => i.id === id && /cycle|own parent/.test(i.message)).map((i) => i.message)
    expect(cycle('US-01.0.1')).toEqual(['is its own parent; a card can never be under itself'])
    expect(cycle('US-01.0.2')).toEqual([expect.stringContaining('US-01.0.2, US-01.0.3')])
    expect(cycle('US-01.0.3')).toEqual(cycle('US-01.0.2'))
    expect(cycle('US-01.0.4')).toEqual([]) // under a cycle, not in one
    const clean = checkCatalogue({ items: [epic, feature, sound], questions: [], fileExists: () => true })
    expect(clean.filter((i) => /cycle|own parent/.test(i.message))).toEqual([])
  })
})

describe('a card of an unconfigured type never throws (R-11)', () => {
  const odd = { ...item({ id: 'US-01.1.9', parent: 'EP-01' }), type: 'user-story' } as unknown as Item
  it('canParent answers false for an unknown type as the card or as the parent', () => {
    expect(canParent(odd, epic)).toBe(false)
    expect(canParent(item({ id: 'US-01.1.2', parent: 'US-01.1.9' }), odd)).toBe(false)
    expect(canParent(sound, feature)).toBe(true)
  })
  it('the Mapped layout draws it in the column of cards with no valid parent', () => {
    const m = mappedLayout([epic, feature, sound, odd], { lanes: [] })
    expect(m.placements['US-01.1.9']).toBeDefined()
  })
  it('the CSV shows its type as stored', () => {
    const csv = requirementsCsv([epic, odd], DEFAULT_CONFIG)
    expect(csv).toContain('user-story')
    expect(csv).not.toContain('undefined')
  })
})

describe('one file never stops the catalogue loading (R-47, R-48, R-65)', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'b03-load-'))
    writeItem(epic, root)
    writeItem(feature, root)
    writeItem(sound, root)
    mkdirSync(join(root, 'artifacts', 'files'), { recursive: true })
  })
  afterEach(() => {
    try {
      chmodSync(join(root, 'artifacts', 'files', 'AR-01.svg'), 0o644)
    } catch {
      /* not made */
    }
    rmSync(root, { recursive: true, force: true })
  })
  const sidecar = (id: string, file: string) => {
    const a = { id, title: `Artifact ${id}`, kind: 'diagram', status: 'Current', date: '2026-10', author: null, area: null, sources: ['x'], description: '', file, source: '', regions: [], steps: [], citedAs: [], supersededBy: null } as unknown as Artifact
    writeFileSync(join(root, 'artifacts', `${id}.md`), serialiseArtifact(a))
  }

  it.skipIf(process.getuid?.() === 0)('an unreadable artifact file is an issue on it; the rest loads; fixing it clears the issue in the same process', () => {
    const file = join(root, 'artifacts', 'files', 'AR-01.svg')
    writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text>x</text></svg>')
    sidecar('AR-01', 'artifacts/files/AR-01.svg')
    chmodSync(file, 0)
    const bad = loadCatalogue(root)
    expect(Object.keys(bad.items).sort()).toEqual(['EP-01', 'FT-01.1', 'US-01.1.1'])
    expect(bad.artifacts['AR-01']).toBeDefined()
    expect(bad.issues.find((i) => i.id === 'AR-01' && /could not be read/.test(i.message))?.message).toMatch(/AR-01\.svg.*EACCES/)
    chmodSync(file, 0o644)
    const good = loadCatalogue(root)
    expect(good.issues.filter((i) => i.id === 'AR-01' && /could not be read/.test(i.message))).toEqual([])
  })

  it('an out-of-range character reference is left as written, and its files load', () => {
    expect(decodeEntities('a&#99999999;b&#x110000;c')).toBe('a&#99999999;b&#x110000;c')
    expect(decodeEntities('&#65;&#x42;&#x1F600;&amp;')).toBe('AB\u{1F600}&')
    expect(() => svgFacts('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text title="&#x110000;">&#99999999;</text></svg>')).not.toThrow()
    expect(() => markdownFacts('# Notes &#99999999;\n\nText &#x110000;.\n')).not.toThrow()
    writeFileSync(join(root, 'artifacts', 'files', 'AR-02.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text>&#99999999;</text></svg>')
    sidecar('AR-02', 'artifacts/files/AR-02.svg')
    expect(() => loadCatalogue(root)).not.toThrow()
  })

  it('a check that fails on unexpected data still lets the load finish, with one error saying so', () => {
    const boom = new Proxy(DEFAULT_CONFIG, {
      get(t, k) {
        if (k === 'statuses') throw new Error('unexpected config')
        return Reflect.get(t, k)
      },
    })
    const issues = issuesFor(recs([epic]), {}, [{ severity: 'warning', id: 'X', message: 'kept' }], root, [], {}, boom)
    expect(issues).toEqual([
      { severity: 'warning', id: 'X', message: 'kept' },
      { severity: 'error', id: 'check', message: expect.stringMatching(/^the check could not finish \(unexpected config\)/) },
    ])
  })

  it('dotfiles in the record folders are not records and claim no ID', () => {
    writeFileSync(join(storiesDir(root), '._EP-01.md'), Buffer.from([0, 5, 22, 7, 0, 2]))
    writeFileSync(join(storiesDir(root), '.#US-01.1.1.md'), 'user@host.1234:1700000000')
    const r = loadCatalogue(root)
    expect(r.issues.filter((i) => i.id.startsWith('.'))).toEqual([])
    expect(r.issues.filter((i) => i.severity === 'error')).toEqual([])
    expect(takenIds(storiesDir(root)).filter((id) => id.startsWith('.'))).toEqual([])
  })
})

describe('record and layout files parse robustly (R-66, R-50)', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'b03-parse-'))
    writeItem(epic, root)
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))
  const BOM = '﻿'

  it('an item, a question and a sidecar with a byte-order mark parse as without it (live and as a git version)', () => {
    const q = question({ id: 'OQ-01' })
    const a = { id: 'AR-01', title: 'A', kind: 'note', status: 'Current', date: '2026-10', author: null, area: null, sources: ['x'], description: '', file: null, source: '', regions: [], steps: [], citedAs: [], supersededBy: null } as unknown as Artifact
    expect(parseItem(BOM + serialiseItem(sound))).toEqual(parseItem(serialiseItem(sound)))
    expect(parseQuestion(BOM + serialiseQuestion(q))).toEqual(parseQuestion(serialiseQuestion(q)))
    expect(parseArtifact(BOM + serialiseArtifact(a))).toEqual(parseArtifact(serialiseArtifact(a)))
    writeFileSync(itemPath('FT-01.1', root), BOM + serialiseItem(feature))
    const r = loadCatalogue(root)
    expect(r.items['FT-01.1']?.data).toEqual(parseItem(serialiseItem(feature)))
    expect(r.items['FT-01.1']?.rev).toBe(loadCatalogue(root).items['FT-01.1']?.rev)
    expect(r.issues.filter((i) => i.severity === 'error')).toEqual([])
  })

  it('the three JSON files read with a byte-order mark', () => {
    writeLayout({ positions: { 'EP-01': { x: 1, y: 2 } }, lanes: ['MVP'] }, root)
    writeFileSync(layoutPath(root), BOM + readFileSync(layoutPath(root), 'utf8'))
    expect(readLayout(root)).toEqual({ layout: { positions: { 'EP-01': { x: 1, y: 2 } }, lanes: ['MVP'], lanesRev: lanesRevOf({ lanes: ['MVP'] }) } })
    expect(parseConfig(BOM + '{ "project": { "name": "P" } }').problems).toEqual([])
    expect(parseRecodes(BOM + '[{ "date": "2026-10-20", "items": { "A": "1" }, "questions": {} }]')).toHaveLength(1)
  })

  it('a rewrite keeps a byte-order mark the file had, and adds none to one that had none', () => {
    writeFileSync(itemPath('EP-01', root), BOM + serialiseItem(epic))
    writeItem({ ...epic, title: 'Renamed' }, root)
    expect(readFileSync(itemPath('EP-01', root), 'utf8').startsWith(BOM)).toBe(true)
    writeItem(feature, root)
    writeItem({ ...feature, title: 'Again' }, root)
    expect(readFileSync(itemPath('FT-01.1', root), 'utf8').startsWith(BOM)).toBe(false)
    writeFileSync(configPath(root), BOM + '{}\n')
    expect(loadCatalogue(root).issues.filter((i) => i.id === 'config')).toEqual([])
  })

  it('layout positions are checked on read: junk entries are dropped and named, never written', () => {
    writeFileSync(layoutPath(root), JSON.stringify({ positions: { 'EP-01': { x: 5, y: 6 }, 'US-01.1.1': null, 'US-01.1.2': 'x', 'US-01.1.3': [1, 2], 'US-01.1.4': { x: 'a', y: 1 } }, lanes: [] }))
    const r = readLayout(root)
    expect(r.layout.positions).toEqual({ 'EP-01': { x: 5, y: 6 } })
    expect(r.damaged).toEqual(['US-01.1.1', 'US-01.1.2', 'US-01.1.3', 'US-01.1.4'])
    expect(() => serialiseLayout(r.layout)).not.toThrow()
    const issue = loadCatalogue(root).issues.find((i) => i.id === 'layout')
    expect(issue?.message).toMatch(/US-01\.1\.1, US-01\.1\.2, US-01\.1\.3, US-01\.1\.4/)
  })

  it('a "__proto__" key in positions is dropped and named, never set', () => {
    writeFileSync(layoutPath(root), '{"positions": {"__proto__": {"x": 1, "y": 2}, "EP-01": {"x": 3, "y": 4}}}')
    const r = readLayout(root)
    expect(Object.keys(r.layout.positions)).toEqual(['EP-01'])
    expect(Object.getPrototypeOf(r.layout.positions)).toBe(Object.prototype)
    expect(r.damaged).toEqual(['__proto__'])
  })

  it('positions that are not an object, and a top level that is not an object, are each reported as what they are', () => {
    writeFileSync(layoutPath(root), '{"positions": [1, 2]}')
    expect(readLayout(root)).toMatchObject({ layout: { positions: {} }, damaged: ['positions'] })
    writeFileSync(layoutPath(root), 'null')
    expect(readLayout(root).error).toMatch(/does not hold an object/)
    writeFileSync(layoutPath(root), '{ nope')
    expect(readLayout(root).error).toMatch(/not valid JSON/)
  })

  it('a valid layout reads and serialises exactly as before', () => {
    const layout = { positions: { 'EP-01': { x: 10, y: 20 }, 'FT-01.1': { x: -3, y: 4 } }, lanes: ['MVP', 'Later'], firstLane: 'Now' }
    writeLayout(layout, root)
    const text = readFileSync(layoutPath(root), 'utf8')
    expect(readLayout(root)).toEqual({ layout: { ...layout, lanesRev: lanesRevOf(layout) } }) // lanesRev: derived, never written (B05)
    expect(serialiseLayout(readLayout(root).layout)).toBe(text)
  })
})

describe('every question the masthead counts is listed (R-121)', () => {
  const none: QuestionFilters = { owner: '', kind: '', query: '', showAnswered: false }
  const qs = [question({ id: 'OQ-01', status: '1' }), question({ id: 'OQ-02', status: 'Open' }), question({ id: 'OQ-03', status: '1' })]
  it('a question with an unconfigured status is stepped through after the configured groups, answered hidden or not', () => {
    expect(questionWalk(DEFAULT_CONFIG, qs, none).map((q) => q.id)).toEqual(['OQ-01', 'OQ-03', 'OQ-02'])
    expect(questionWalk(DEFAULT_CONFIG, qs, { ...none, showAnswered: true }).map((q) => q.id)).toEqual(['OQ-01', 'OQ-03', 'OQ-02'])
    expect(questionWalk(DEFAULT_CONFIG, [qs[1]!], none).map((q) => q.id)).toEqual(['OQ-02'])
  })
})

it('writes nothing to a requirements file when loading (prohibited regression)', () => {
  const root = mkdtempSync(join(tmpdir(), 'b03-nowrite-'))
  writeItem(epic, root)
  const before = readFileSync(itemPath('EP-01', root), 'utf8')
  loadCatalogue(root)
  expect(readFileSync(itemPath('EP-01', root), 'utf8')).toBe(before)
  rmSync(root, { recursive: true, force: true })
})


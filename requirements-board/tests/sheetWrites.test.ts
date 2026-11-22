/**
 * B06 · what the sheets and Settings send, and what the server lets through. The client's field-change
 * helpers (`shared/patch.ts`), the Settings Keep mine merge (`shared/settingsMerge.ts`, R-45 and B02's
 * allocation rule), the per-section read state (B06-Q4), the retired whole-record and base-less config
 * writes (D-04e), and the components rules (R-123, R-124, B06-Q3). Each failed on the board before B06.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HttpError, createCatalogueApi } from '../server/catalogueApi.ts'
import { artifactSidecarPath, configPath, writeItem, writeLayout, writeQuestion } from '../server/catalogueFs.ts'
import { configRevs, parseConfig } from '../shared/config.ts'
import { changedFields, overlay, patchBetween } from '../shared/patch.ts'
import { mergeFields, mergeRows, mergeStatusLists } from '../shared/settingsMerge.ts'
import type { StatusDef } from '../shared/statuses.ts'
import { item, question } from './fixtures.ts'

const JSON_HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }

describe('the fields a sheet changed (R-02)', () => {
  const base = item({ id: 'US-01.1.1', description: 'Old', extra: { reviewer: 'Sam' } })

  it('names only the changed fields, an unknown key by its own name', () => {
    expect(changedFields('item', base, { ...base, description: 'New', related: ['US-01.1.2'] })).toEqual(['related', 'description'])
    expect(changedFields('item', base, { ...base, extra: { reviewer: 'Kim' } })).toEqual(['extra.reviewer'])
    expect(changedFields('item', base, base)).toEqual([])
  })

  it('a patch holds the new values, and its base the values they replace', () => {
    expect(patchBetween('item', base, { ...base, description: 'New', extra: { reviewer: 'Kim' } })).toEqual({
      patch: { description: 'New', extra: { reviewer: 'Kim' } },
      base: { description: 'Old', extra: { reviewer: 'Sam' } },
    })
    // An artifact's patch names its details only, never its file or regions.
    const a = { id: 'AR-01', title: 'A', file: 'x.svg' } as never
    expect(patchBetween('artifact', a, { ...(a as object), title: 'B', file: 'y.svg' } as never).patch).toEqual({ title: 'B' })
  })

  it('a draft laid over a newer copy keeps the user’s fields and takes the rest', () => {
    const disk = { ...base, parent: 'FT-01.2', artifacts: ['AR-01'], extra: { reviewer: 'Sam', added: 1 } }
    const draft = { ...base, description: 'Mine' }
    expect(overlay(disk, draft, changedFields('item', base, draft))).toEqual({ ...disk, description: 'Mine' })
  })
})

describe('Keep mine in Settings (R-45)', () => {
  const s = (code: string, label: string, extra: Partial<StatusDef> = {}): StatusDef => ({ code, label, help: '', tone: 'neutral', ...extra })

  it('keeps every row and field the user changed, and everything the file gained', () => {
    const base = [s('1', 'Proposed'), s('2', 'Agreed')]
    const mine = [s('1', 'Proposed', { help: 'Reworded' }), s('2', 'Agreed')]
    const theirs = [s('1', 'Proposed'), s('2', 'Agreed', { tone: 'green' }), s('7', 'On hold')]
    expect(mergeStatusLists(base, mine, theirs, []).rows).toEqual([s('1', 'Proposed', { help: 'Reworded' }), s('2', 'Agreed', { tone: 'green' }), s('7', 'On hold')])
  })

  it('never gives a new row and a row the file gained the same code', () => {
    const base = [s('1', 'Proposed'), s('2', 'Agreed')]
    const mine = [...base, s('3', 'Mine')]
    const theirs = [...base, s('3', 'Theirs')]
    const m = mergeStatusLists(base, mine, theirs, ['5']) // 5: spent (removed, recoded, or on a card)
    expect(m.rows.map((d) => `${d.code} ${d.label}`)).toEqual(['1 Proposed', '2 Agreed', '3 Theirs', '6 Mine'])
    expect(m.renumbered).toEqual({ '3': '6' })
  })

  it('names a field both sides changed (the user’s value kept), and a row removed on disk', () => {
    const base = [s('1', 'Proposed'), s('2', 'Agreed')]
    const m = mergeRows(base, [s('1', 'Draft'), s('2', 'Agreed', { help: 'x' })], [s('1', 'Suggested')], (d) => d.code)
    expect(m.rows).toEqual([s('1', 'Draft')])
    expect(m.clashes).toEqual(['1'])
    expect(m.removedOnDisk).toEqual(['2'])
    expect(mergeFields({ project: 'A', accent: '' }, { project: 'B', accent: '' }, { project: 'A', accent: '#2b6cb0' })).toEqual({ merged: { project: 'B', accent: '#2b6cb0' }, clashes: [] })
  })
})

describe('how the project and components sections read (B06-Q4)', () => {
  it('a section read with problems is damaged; the others are healthy', () => {
    expect(parseConfig(JSON.stringify({ project: { name: 'P' }, components: [{ name: 'Core' }] })).config.sectionState).toEqual({ project: { state: 'healthy', problems: [] }, components: { state: 'healthy', problems: [] } })
    const bad = parseConfig(JSON.stringify({ project: 'P', components: 'Core' })).config.sectionState
    expect(bad).toEqual({ project: { state: 'damaged', problems: ['project must be an object'] }, components: { state: 'damaged', problems: ['components must be a list'] } })
  })
})

describe('the server (D-04e retirement, R-123, R-124, B06-Q3, B06-Q4)', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'sheet-writes-'))
    writeItem(item({ id: 'EP-01', type: 'epic', components: ['Mobile'] }), root)
    writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', components: ['Admin'] }), root)
    writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', components: ['Mobile'] }), root)
    writeQuestion(question({ id: 'OQ-01' }), root)
    writeLayout({ positions: {}, lanes: [] }, root)
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))
  const api = () => createCatalogueApi(root, () => {})
  const call = (a: ReturnType<typeof api>, method: string, path: string, body?: unknown) => a.handle({ method, path, body, headers: JSON_HEADERS })
  const refusal = (fn: () => unknown): HttpError => {
    try {
      fn()
    } catch (e) {
      if (e instanceof HttpError) return e
      throw e
    }
    throw new Error('expected a refusal')
  }
  const writeConfig = (raw: unknown) => writeFileSync(configPath(root), JSON.stringify(raw, null, 2))
  const config = () => readFileSync(configPath(root), 'utf8')
  const putComponents = (a: ReturnType<typeof api>, components: unknown) => call(a, 'PUT', '/api/config', { components, bases: { components: a.getState().config.revs.components } })

  it('refuses a whole record, the retired shape, for items, questions and artifacts', () => {
    mkdirSync(join(root, 'artifacts'), { recursive: true })
    writeFileSync(artifactSidecarPath('AR-01', root), '---\nid: AR-01\ntitle: A\nkind: diagram\nstatus: Current\ncomponents: []\nsources: []\n---\n')
    const a = api()
    const s = a.getState()
    for (const [path, rec] of [
      ['/api/items/US-01.1.1', s.items['US-01.1.1']!],
      ['/api/questions/OQ-01', s.questions['OQ-01']!],
      ['/api/artifacts/AR-01', s.artifacts['AR-01']!],
    ] as const)
      expect(refusal(() => call(a, 'PUT', path, { record: { ...rec.data, title: 'Whole' }, baseRev: rec.rev })).status, path).toBe(400)
  })

  it('refuses a Settings section sent without its base', () => {
    writeConfig({ project: { name: 'P' } })
    const a = api()
    const before = config()
    expect(refusal(() => call(a, 'PUT', '/api/config', { project: { name: 'Q' } })).status).toBe(400)
    expect(refusal(() => call(a, 'PUT', '/api/config', { project: { name: 'Q' }, bases: {} })).status).toBe(400)
    expect(config()).toBe(before)
    call(a, 'PUT', '/api/config', { project: { name: 'Q' }, bases: { project: configRevs(JSON.parse(before)).project } })
    expect(JSON.parse(config()).project).toEqual({ name: 'Q' })
  })

  it('refuses a first component that would leave the ones in use unlisted, and takes it with them (R-123)', () => {
    writeConfig({ project: { name: 'P' } })
    const a = api()
    const before = config()
    const e = refusal(() => putComponents(a, [{ name: 'Billing' }]))
    expect(e.status).toBe(422)
    expect(e.message).toMatch(/Mobile is still used by 2 cards or artifacts/)
    expect(e.message).toMatch(/Admin is still used by 1 card or artifact/)
    expect(config()).toBe(before)
    putComponents(a, [{ name: 'Billing' }, { name: 'Mobile' }, { name: 'Admin' }])
    expect(JSON.parse(config()).components).toEqual([{ name: 'Billing' }, { name: 'Mobile' }, { name: 'Admin' }])
  })

  it('counts artifacts as uses (R-124), and lets a save that leaves things no worse through', () => {
    mkdirSync(join(root, 'artifacts'), { recursive: true })
    writeFileSync(artifactSidecarPath('AR-01', root), '---\nid: AR-01\ntitle: A\nkind: diagram\nstatus: Current\ncomponents:\n  - Reports\nsources: []\n---\n')
    // Admin is in use but not listed (a hand edit): a save that adds a name is not blocked by it.
    writeConfig({ components: [{ name: 'Mobile' }, { name: 'Reports' }] })
    const a = api()
    expect(refusal(() => putComponents(a, [{ name: 'Mobile' }])).message).toMatch(/Reports is still used by 1 card or artifact/)
    putComponents(a, [{ name: 'Mobile' }, { name: 'Reports' }, { name: 'Billing' }])
    expect(JSON.parse(config()).components.map((c: { name: string }) => c.name)).toEqual(['Mobile', 'Reports', 'Billing'])
  })

  it('never saves over a project or components section that does not read cleanly (B06-Q4)', () => {
    for (const raw of [{ components: [{ code: 'X' }, { name: 'Mobile' }] }, { components: 'Mobile' }]) {
      writeConfig(raw)
      const a = api()
      expect(a.getState().config.sectionState.components.state).toBe('damaged')
      const before = config()
      expect(refusal(() => putComponents(a, [{ name: 'Mobile' }, { name: 'Admin' }])).status).toBe(422)
      expect(config()).toBe(before)
    }
    writeConfig({ project: { name: 'P', accent: 'teal' } })
    const a = api()
    expect(a.getState().config.sectionState.project.state).toBe('damaged')
    const before = config()
    expect(refusal(() => call(a, 'PUT', '/api/config', { project: { name: 'Q' }, bases: { project: a.getState().config.revs.project } })).message).toMatch(/project does not read cleanly/)
    expect(config()).toBe(before)
  })
})

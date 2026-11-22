/**
 * The server write model (B05; accepted decision 20): field patches merged onto the file as it is on
 * disk, conflicts the client can recover from, in-place saves, no-op saves, Settings sections with their
 * own bases, the lane-list rules, the one-write lane change with put-back, and creates without hard links.
 */
import { changesOf } from './deliveries.ts'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseArtifact, parseItem } from '../shared/files.ts'
import type { Artifact, ArtifactRec, CatalogueChange, Item, Layout, Rev } from '../shared/types.ts'
import { HttpError, createCatalogueApi } from '../server/catalogueApi.ts'
import { FileExistsError, REQUIREMENTS_DIR, artifactSidecarPath, claimNext, configPath, createAtomic, itemPath, layoutPath, loadCatalogue, questionPath, writeItem, writeLayout, writeQuestion } from '../server/catalogueFs.ts'
import { createJournal } from '../server/historyJournal.ts'
import { item, question } from './fixtures.ts'

const JSON_HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }

let root: string
let events: CatalogueChange[]
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'write-model-'))
  events = []
  writeItem(item({ id: 'EP-01', type: 'epic' }), root)
  writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), root)
  writeItem(item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01' }), root)
  writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, description: 'First.', swimlane: 'MVP' }), root)
  writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, swimlane: 'MVP' }), root)
  writeQuestion(question({ id: 'OQ-01', affects: ['US-01.1.1'] }), root)
  writeLayout({ positions: {}, lanes: ['MVP', 'Later'] }, root)
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

type Api = ReturnType<typeof createCatalogueApi>
const api = (opts: Parameters<typeof createCatalogueApi>[2] = {}) => createCatalogueApi(root, (d) => events.push(...changesOf(d)), opts)
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
const fileOf = (id: string) => readFileSync(itemPath(id, root), 'utf8')
const onDisk = (id: string) => parseItem(fileOf(id))
const revOfItem = (a: Api, id: string) => a.getState().items[id]!.rev
/** An agent edits a card's file directly. */
const agentEdits = (id: string, fn: (text: string) => string) => writeFileSync(itemPath(id, root), fn(fileOf(id)))

describe('a record write sends the fields it changed (REQ-01 to REQ-04)', () => {
  it('a description patch keeps every field the file changed on disk since (parent, order, swimlane, artifacts, an unknown key)', () => {
    const a = api()
    const base = a.getState().items['US-01.1.1']!
    agentEdits('US-01.1.1', (t) => t.replace('parent: FT-01.1', 'parent: FT-01.2').replace('order: 1', 'order: 9').replace('swimlane: MVP', 'swimlane: Later').replace('images: []', 'images: []\nartifacts:\n  - AR-01\nreviewer: Sam'))
    const rec = call(a, 'PUT', '/api/items/US-01.1.1', { patch: { description: 'Edited.' }, baseRev: base.rev, base: { description: base.data.description } }) as Rev<Item>
    expect(onDisk('US-01.1.1')).toMatchObject({ description: 'Edited.', parent: 'FT-01.2', order: 9, swimlane: 'Later', artifacts: ['AR-01'], extra: { reviewer: 'Sam' } })
    expect(rec.data).toEqual(onDisk('US-01.1.1'))
    // The response is a new base: a second change on it applies without a conflict.
    const again = call(a, 'PUT', '/api/items/US-01.1.1', { patch: { title: 'Renamed' }, baseRev: rec.rev }) as Rev<Item>
    expect(again.data).toMatchObject({ title: 'Renamed', description: 'Edited.', parent: 'FT-01.2' })
  })

  it('a patch with only a rev is refused on any change on disk, with the current copy and nothing written', () => {
    const a = api()
    const baseRev = revOfItem(a, 'US-01.1.1')
    agentEdits('US-01.1.1', (t) => t.replace('order: 1', 'order: 5'))
    const before = fileOf('US-01.1.1')
    const e = refusal(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { description: 'Edited.' }, baseRev }))
    expect(e.status).toBe(409)
    const body = e.body as { current: Rev<Item>; collisions?: string[] }
    expect(body.current.data.order).toBe(5)
    expect(body.collisions).toBeUndefined()
    expect(fileOf('US-01.1.1')).toBe(before)
  })

  it('an overlapping change is a conflict naming the field; "Keep mine" on the new base keeps the concurrent change', () => {
    const a = api()
    const base = a.getState().items['US-01.1.1']!
    agentEdits('US-01.1.1', (t) => t.replace('First.', 'Agent wrote this.').replace('order: 1', 'order: 4'))
    const before = fileOf('US-01.1.1')
    const e = refusal(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { description: 'Mine.' }, baseRev: base.rev, base: { description: 'First.' } }))
    expect(e.status).toBe(409)
    const body = e.body as { current: Rev<Item>; collisions: string[] }
    expect(body.collisions).toEqual(['description'])
    expect(body.current.data.description).toBe('Agent wrote this.')
    expect(fileOf('US-01.1.1')).toBe(before)
    // Keep mine: the same patch, on the current rev.
    call(a, 'PUT', '/api/items/US-01.1.1', { patch: { description: 'Mine.' }, baseRev: body.current.rev })
    expect(onDisk('US-01.1.1')).toMatchObject({ description: 'Mine.', order: 4 })
  })

  it('base values are compared as the file reads them (status 3 and "3" are one value)', () => {
    const a = api()
    const base = a.getState().items['US-01.1.1']!
    agentEdits('US-01.1.1', (t) => t.replace('order: 1', 'order: 2'))
    call(a, 'PUT', '/api/items/US-01.1.1', { patch: { status: '2' }, baseRev: base.rev, base: { status: 1 } })
    expect(onDisk('US-01.1.1')).toMatchObject({ status: '2', order: 2 })
  })

  it('a malformed patch is a 400: an unknown field, a changed id, a patched field with no base value', () => {
    const a = api()
    const baseRev = revOfItem(a, 'US-01.1.1')
    expect(refusal(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { colour: 'red' }, baseRev })).status).toBe(400)
    expect(refusal(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { id: 'US-09' }, baseRev })).status).toBe(400)
    agentEdits('US-01.1.1', (t) => t.replace('order: 1', 'order: 2'))
    expect(refusal(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { title: 'x', order: 3 }, baseRev, base: { title: 'Title of US-01.1.1' } })).status).toBe(400)
    expect(refusal(() => call(a, 'PUT', '/api/items/US-01.1.1', { patch: { type: 'epic' }, baseRev: revOfItem(a, 'US-01.1.1') })).status).toBe(422)
  })

  it('a batch refused for stale records names every blocker with its current copy', () => {
    const a = api()
    const r1 = revOfItem(a, 'US-01.1.1')
    const r2 = revOfItem(a, 'US-01.1.2')
    agentEdits('US-01.1.1', (t) => t.replace('First.', 'Changed.'))
    agentEdits('US-01.1.2', (t) => t.replace('order: 2', 'order: 7'))
    const before = [fileOf('US-01.1.1'), fileOf('US-01.1.2')]
    const e = refusal(() =>
      call(a, 'POST', '/api/items/batch', {
        changes: [
          { id: 'US-01.1.1', baseRev: r1, patch: { order: 3 }, base: { order: 1 } }, // no overlap: would merge
          { id: 'US-01.1.2', baseRev: r2, patch: { order: 1 }, base: { order: 2 } }, // overlap
          { id: 'FT-01.1', baseRev: 'stale', patch: { order: 5 } }, // rev only
        ],
      }),
    )
    expect(e.status).toBe(409)
    const body = e.body as { current: Rev<Item>; blocked: { id: string; current: Rev<Item>; collisions?: string[] }[] }
    expect(body.blocked.map((b) => [b.id, b.collisions])).toEqual([
      ['US-01.1.2', ['order']],
      ['FT-01.1', undefined],
    ])
    expect(body.blocked[0]!.current.data.order).toBe(7)
    expect(body.current).toEqual(body.blocked[0]!.current)
    expect([fileOf('US-01.1.1'), fileOf('US-01.1.2')]).toEqual(before)
  })

  it('a stale batch change whose fields did not change on disk merges', () => {
    const a = api()
    const r1 = revOfItem(a, 'US-01.1.1')
    agentEdits('US-01.1.1', (t) => t.replace('First.', 'Changed by an agent.'))
    call(a, 'POST', '/api/items/batch', { changes: [{ id: 'US-01.1.1', baseRev: r1, patch: { order: 3, swimlane: 'Later' }, base: { order: 1, swimlane: 'MVP' } }] })
    expect(onDisk('US-01.1.1')).toMatchObject({ order: 3, swimlane: 'Later', description: 'Changed by an agent.' })
  })

  it('questions take patches the same way', () => {
    const a = api()
    const q = a.getState().questions['OQ-01']!
    writeFileSync(questionPath('OQ-01', root), readFileSync(questionPath('OQ-01', root), 'utf8').replace(/^owner:.*$/m, 'owner: Sam'))
    call(a, 'PUT', '/api/questions/OQ-01', { patch: { answer: 'Yes.' }, baseRev: q.rev, base: { answer: '' } })
    const text = readFileSync(questionPath('OQ-01', root), 'utf8')
    expect(text).toContain('owner: Sam')
    expect(text).toContain('## Answer\n\nYes.\n')
  })
})

const HAND = `---
# an agent wrote this card
id: US-01.1.1
type: story
parent: FT-01.1
title: "First: story"
status: 1
components: [Core]
sources: []
order: 1
swimlane: MVP
reviewer: Sam   # not a board key
images: []
---
First.

## Notes

A note.
`

describe('saves edit the file in place (REQ-09, REQ-11; R-111 server half)', () => {
  it('a one-field patch writes only that line; a whole record, the retired shape, is refused (D-04e)', () => {
    writeFileSync(itemPath('US-01.1.1', root), HAND)
    const a = api()
    const rec = a.getState().items['US-01.1.1']!
    expect(refusal(() => call(a, 'PUT', '/api/items/US-01.1.1', { record: { ...rec.data, title: 'First story' }, baseRev: rec.rev })).status).toBe(400)
    expect(fileOf('US-01.1.1')).toBe(HAND)
    call(a, 'PUT', '/api/items/US-01.1.1', { patch: { title: 'First story' }, baseRev: rec.rev, base: { title: rec.data.title } })
    expect(fileOf('US-01.1.1')).toBe(HAND.replace('title: "First: story"', 'title: First story'))
  })

  it('an unchanged save, an empty patch and the whole record sent unchanged write nothing, journal nothing and send nothing', () => {
    writeFileSync(itemPath('US-01.1.1', root), HAND)
    const dir = mkdtempSync(join(tmpdir(), 'journal-'))
    try {
      const a = api({ journal: createJournal(dir) })
      const rec = a.getState().items['US-01.1.1']!
      events.length = 0
      const journalBefore = readdirSync(dir).sort()
      // Only the start's first-sight line (B09, R-87): the saves below must add nothing to it.
      const linesBefore = readFileSync(join(dir, 'US-01.1.1.jsonl'), 'utf8')
      expect(linesBefore.trim().split('\n').map((l) => JSON.parse(l).kind)).toEqual(['seen'])
      const answers = [
        call(a, 'PUT', '/api/items/US-01.1.1', { patch: {}, baseRev: rec.rev }),
        call(a, 'PUT', '/api/items/US-01.1.1', { patch: { title: 'First: story', order: 1 }, baseRev: rec.rev }),
        call(a, 'PUT', '/api/items/US-01.1.1', { patch: rec.data, baseRev: rec.rev }),
        call(a, 'POST', '/api/items/batch', { changes: [{ id: 'US-01.1.1', baseRev: rec.rev, patch: { order: 1 } }] }),
      ]
      expect(fileOf('US-01.1.1')).toBe(HAND)
      expect(answers.slice(0, 3)).toEqual([rec, rec, rec])
      expect(answers[3]).toEqual({ records: [rec] })
      expect(events).toEqual([])
      expect(readdirSync(dir).sort()).toEqual(journalBefore)
      expect(readFileSync(join(dir, 'US-01.1.1.jsonl'), 'utf8')).toBe(linesBefore)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

const SIDECAR = `---
id: AR-01
title: Pricing flow   # agent note
kind: diagram
status: Current
components: [Core]
sources: []
cited_as:
  as: RFP
  page_offset: 1
  pagoffset: 3
file: artifacts/files/AR-01.mmd
regions:
  - id: tiers
    name: Tiers
    around: [Tier]
    pad: wide
    colour: red
  - a string row
steps:
  - id: s1
    name: Start
    shine: true
    moves:
      - from: a
        to: b
        speed: 2
---

The description.

## Source

Legend prose.

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

\`\`\`text
not the diagram
\`\`\`
`

describe('the artifact details save (R-37, REQ-10)', () => {
  beforeEach(() => {
    mkdirSync(join(root, 'artifacts'), { recursive: true })
    writeFileSync(artifactSidecarPath('AR-01', root), SIDECAR)
  })
  const sidecar = () => readFileSync(artifactSidecarPath('AR-01', root), 'utf8')

  it('a title save changes only the title line: cited_as, unknown keys, pad: wide, comments and the Source section survive', () => {
    const a = api()
    const rec = a.getState().artifacts['AR-01']!
    call(a, 'PUT', '/api/artifacts/AR-01', { patch: { title: 'Pricing flow v2' }, baseRev: rec.rev })
    expect(sidecar()).toBe(SIDECAR.replace('title: Pricing flow   #', 'title: Pricing flow v2   #'))
  })

  it('every detail at once keeps everything the board does not edit, byte for byte', () => {
    writeFileSync(artifactSidecarPath('AR-02', root), '---\nid: AR-02\ntitle: Its replacement\nkind: diagram\nstatus: Current\ncomponents: []\nsources: []\n---\n')
    const a = api()
    const rec = a.getState().artifacts['AR-01']!
    const out = call(a, 'PUT', '/api/artifacts/AR-01', { patch: { kind: 'document', status: 'Retired', supersededBy: 'AR-02', date: '2026-01-02', author: 'Sam', components: [], sources: ['RFP p.1'], description: 'New words.' }, baseRev: rec.rev }) as ArtifactRec
    const text = sidecar()
    expect(text).toContain(SIDECAR.slice(SIDECAR.indexOf('cited_as:'), SIDECAR.indexOf('---\n\nThe description.')))
    expect(text).toContain(SIDECAR.slice(SIDECAR.indexOf('## Source')))
    expect(text).toContain('\nNew words.\n')
    expect(out.data).toMatchObject({ kind: 'document', status: 'Retired', supersededBy: 'AR-02', author: 'Sam', description: 'New words.' })
  })

  it('a change it cannot write without loss is refused with 422 and the file untouched', () => {
    const flow = '---\n{ id: AR-01, title: Old, kind: diagram, cited_as: { as: RFP } }\n---\n\nText.\n'
    writeFileSync(artifactSidecarPath('AR-01', root), flow)
    const a = api()
    const rec = a.getState().artifacts['AR-01']!
    const e = refusal(() => call(a, 'PUT', '/api/artifacts/AR-01', { patch: { title: 'New' }, baseRev: rec.rev }))
    expect(e.status).toBe(422)
    expect(e.message).toMatch(/cited_as/)
    expect(sidecar()).toBe(flow)
  })

  it('a details save to every sidecar in the real catalogue changes only that line (scratch copy)', () => {
    const copy = mkdtempSync(join(tmpdir(), 'real-catalogue-'))
    try {
      cpSync(REQUIREMENTS_DIR, copy, { recursive: true, filter: (src) => !src.startsWith(join(REQUIREMENTS_DIR, 'assets')) })
      const a = createCatalogueApi(copy)
      const ids = Object.keys(a.getState().artifacts)
      // Every sidecar on disk loads and is swept (a kit's starter has one), so the loop never covers nothing.
      expect(ids.length).toBeGreaterThan(0)
      expect(ids.length).toBe(readdirSync(join(copy, 'artifacts')).filter((f) => /^AR-\d+\.md$/.test(f)).length)
      for (const id of ids) {
        const file = artifactSidecarPath(id, copy)
        const before = readFileSync(file, 'utf8')
        const rec = a.getState().artifacts[id]! as Rev<Artifact>
        a.handle({ method: 'PUT', path: `/api/artifacts/${id}`, body: { patch: { author: `${rec.data.author}x` }, baseRev: rec.rev }, headers: JSON_HEADERS })
        const after = readFileSync(file, 'utf8')
        const b = before.split('\n')
        const changed = after.split('\n').filter((l, i) => l !== b[i])
        // An author already there changes in place; a new one is one line added after the date or status.
        if (rec.data.author) expect([id, changed]).toEqual([id, [`author: ${rec.data.author}x`]])
        else expect([id, after.replace(/\nauthor: x\n/, '\n')]).toEqual([id, before])
        expect(parseArtifact(after).author).toBe(`${rec.data.author}x`)
      }
    } finally {
      rmSync(copy, { recursive: true, force: true })
    }
  }, 120_000)
})

describe('Settings sections carry their own base (R-45 server half, REQ-06)', () => {
  const statuses = (a: Api) => a.getState().config.statuses
  it('the snapshot and config events carry a rev per section', () => {
    const a = api()
    const snap = call(a, 'GET', '/api/catalogue') as { config: { revs: Record<string, string> } }
    expect(Object.keys(snap.config.revs).sort()).toEqual(['components', 'project', 'questionStatuses', 'statuses'])
    const base = snap.config.revs
    call(a, 'PUT', '/api/config', { components: [{ name: 'Core' }], bases: { components: base.components } })
    const ev = events.find((e) => e.kind === 'config') as { config: { revs: Record<string, string> } }
    expect(ev.config.revs.components).not.toBe(base.components)
    expect(ev.config.revs.statuses).toBe(base.statuses)
  })

  it('two writes to one section from one base: the second is a conflict with the section as it is now; another section still saves', () => {
    const a = api()
    const base = a.getState().config.revs
    call(a, 'PUT', '/api/config', { components: [{ name: 'Core' }, { name: 'Billing' }], bases: { components: base.components } })
    const fileBefore = readFileSync(configPath(root), 'utf8')
    const e = refusal(() => call(a, 'PUT', '/api/config', { components: [{ name: 'Core' }], bases: { components: base.components } }))
    expect(e.status).toBe(409)
    const body = e.body as { section: string; current: { data: { name: string }[]; rev: string } }
    expect(body.section).toBe('components')
    expect(body.current.data.map((c) => c.name)).toEqual(['Core', 'Billing'])
    expect(readFileSync(configPath(root), 'utf8')).toBe(fileBefore)
    call(a, 'PUT', '/api/config', { project: { name: 'P' }, bases: { project: base.project } })
    expect(a.getState().config.project.name).toBe('P')
  })

  it('an agent adding a status while Settings is open: the stale save is refused, not a deletion of the new status', () => {
    const a = api()
    const base = a.getState().config.revs
    const raw = existsSync(configPath(root)) ? (JSON.parse(readFileSync(configPath(root), 'utf8')) as Record<string, unknown>) : {}
    const list = [...statuses(a).map((d) => ({ code: Number(d.code), label: d.label, help: d.help, tone: d.tone, ...(d.role ? { role: d.role } : {}) }))]
    writeFileSync(configPath(root), JSON.stringify({ ...raw, statuses: [...list, { code: 99, label: 'Agent added', help: '', tone: 'grey' }] }))
    const e = refusal(() => call(a, 'PUT', '/api/config', { statuses: list.map((d) => ({ ...d, help: 'reworded' })), bases: { statuses: base.statuses } }))
    expect(e.status).toBe(409)
    expect(readFileSync(configPath(root), 'utf8')).toContain('Agent added')
  })

  it("B02's guards still answer 422 on the merged result", () => {
    const a = api()
    const base = a.getState().config.revs
    const kept = statuses(a).filter((d) => d.code !== '1')
    expect(refusal(() => call(a, 'PUT', '/api/config', { statuses: kept, bases: { statuses: base.statuses } })).status).toBe(422) // status 1 is in use
  })
})

describe('the lane-list rule (R-55, REQ-15, REQ-16)', () => {
  const LONG = 'A lane name that runs past forty characters'
  const withLanes = (lanes: unknown[], firstLane?: string) => writeFileSync(layoutPath(root), JSON.stringify({ positions: {}, lanes, ...(firstLane ? { firstLane } : {}) }))
  for (const [what, lanes] of [
    ['a 46-character lane', [LONG + '!!!', 'Later']],
    ['a case duplicate', ['MVP', 'mvp']],
    ['an Unassigned clash', ['MVP', 'unassigned']],
  ] as [string, string[]][]) {
    it(`with ${what} on disk: drags save, the check says so, a lane write that adds no problem saves and one that adds one is refused`, () => {
      withLanes(lanes)
      const a = api()
      expect(a.getState().issues.filter((i) => i.id === 'layout' && i.severity === 'error').length).toBeGreaterThan(0)
      // A drag: positions only.
      const saved = call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.1': { x: 5, y: 6 } } }) as Layout
      expect(saved.positions['US-01.1.1']).toEqual({ x: 5, y: 6 })
      // A lane write that leaves the problem as it was (each with the lane list it started from: B11 retired base-less lane writes).
      const lanesRev = () => a.getState().layout.lanesRev
      call(a, 'PUT', '/api/layout', { lanes: [...lanes, 'Extra'], lanesRev: lanesRev() })
      // One that adds a problem.
      const e = refusal(() => call(a, 'PUT', '/api/layout', { lanes: [...lanes, 'Extra', 'extra'], lanesRev: lanesRev() }))
      expect(e.status).toBe(422)
      expect(e.message).toMatch(/already a lane called "extra"/)
      // One that fixes it.
      call(a, 'PUT', '/api/layout', { lanes: ['MVP', 'Later'], lanesRev: lanesRev() })
      expect(a.getState().issues.filter((i) => i.id === 'layout')).toEqual([])
    })
  }

  it('the check reports lane entries the layout reader drops (blank, not text)', () => {
    withLanes(['MVP', '', 7, 'Later'])
    const issues = loadCatalogue(root).issues.filter((i) => i.id === 'layout')
    expect(issues.map((i) => i.message)).toEqual(['board-layout.json: lane entries 2, 3 are not a name; ignored, and the next layout save drops them'])
  })

  it('a position patch applied twice gives the same file, and a failed one retried succeeds (REQ-07)', () => {
    const a = api()
    const patch = { positions: { 'US-01.1.1': { x: 1.4, y: 2.6 }, 'US-01.1.2': null } }
    call(a, 'PUT', '/api/layout', patch)
    const once = readFileSync(layoutPath(root), 'utf8')
    call(a, 'PUT', '/api/layout', patch)
    expect(readFileSync(layoutPath(root), 'utf8')).toBe(once)
    writeFileSync(layoutPath(root), '{ broken')
    expect(refusal(() => call(a, 'PUT', '/api/layout', patch)).status).toBe(422)
    writeFileSync(layoutPath(root), once)
    call(a, 'PUT', '/api/layout', patch)
    expect(readFileSync(layoutPath(root), 'utf8')).toBe(once)
  })

  it('a lane write from a stale lanesRev is refused with the list as it is now; positions never carry one', () => {
    const a = api()
    const rev = a.getState().layout.lanesRev!
    writeFileSync(layoutPath(root), JSON.stringify({ positions: {}, lanes: ['MVP', 'Later', 'Agent lane'] }))
    const e = refusal(() => call(a, 'PUT', '/api/layout', { lanes: ['MVP'], lanesRev: rev }))
    expect(e.status).toBe(409)
    expect((e.body as { current: { data: { lanes: string[] } } }).current.data.lanes).toEqual(['MVP', 'Later', 'Agent lane'])
    call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.1': { x: 1, y: 1 } }, lanesRev: 'anything' })
    expect(JSON.parse(readFileSync(layoutPath(root), 'utf8')).lanes).toEqual(['MVP', 'Later', 'Agent lane'])
  })
})

describe('renaming or removing a lane is one write (R-56, REQ-12, REQ-13)', () => {
  const storyRevs = (a: Api, lane: string) => Object.fromEntries(Object.values(a.getState().items).filter((r) => r.data.swimlane === lane).map((r) => [r.data.id, r.rev]))
  const snapshot = () => [fileOf('US-01.1.1'), fileOf('US-01.1.2'), readFileSync(layoutPath(root), 'utf8')]
  const rename = (a: Api, extra: Record<string, unknown> = {}) => call(a, 'POST', '/api/lanes', { op: 'rename', from: 'MVP', to: 'Now', lanesRev: a.getState().layout.lanesRev, stories: storyRevs(a, 'MVP'), ...extra })

  it('a good rename changes the lane list and every story in that lane, in one request', () => {
    const a = api()
    events.length = 0
    const out = rename(a) as { records: Rev<Item>[]; layout: Layout }
    expect(out.records.map((r) => [r.data.id, r.data.swimlane])).toEqual([
      ['US-01.1.1', 'Now'],
      ['US-01.1.2', 'Now'],
    ])
    expect(out.layout.lanes).toEqual(['Now', 'Later'])
    expect(JSON.parse(readFileSync(layoutPath(root), 'utf8')).lanes).toEqual(['Now', 'Later'])
    expect(onDisk('US-01.1.2').swimlane).toBe('Now')
    expect(events.filter((e) => e.kind === 'issues')).toHaveLength(1)
  })

  it('a removal clears the stories and drops the lane', () => {
    const a = api()
    call(a, 'POST', '/api/lanes', { op: 'remove', from: 'MVP', lanesRev: a.getState().layout.lanesRev, stories: storyRevs(a, 'MVP') })
    expect(onDisk('US-01.1.1').swimlane).toBeNull()
    expect(JSON.parse(readFileSync(layoutPath(root), 'utf8')).lanes).toEqual(['Later'])
  })

  it('changes no file when the layout is unreadable, the name is refused, a story is stale, or the lane list moved on', () => {
    const cases: [string, (a: Api) => unknown, number][] = [
      ['unreadable layout', (a) => (writeFileSync(layoutPath(root), '<<<<<<< HEAD\n{'), rename(a)), 422],
      // A name the lane rules refuse (a rename onto another lane's name merges since B11: FINDINGS R-119).
      ['refused name', (a) => rename(a, { to: 'Now ' }), 422],
      ['stale story', (a) => (agentEdits('US-01.1.2', (t) => t.replace('order: 2', 'order: 8')), rename(a, { stories: storyRevs(a, 'MVP') }), rename(a)), 409],
      ['lane list moved on', (a) => rename(a, { lanesRev: 'old' }), 409],
    ]
    for (const [what, run, status] of cases) {
      beforeEachReset()
      const a = api()
      const before = snapshot()
      const e = refusal(() => run(a))
      expect([what, e.status]).toEqual([what, status])
      const after = snapshot()
      if (what === 'unreadable layout') expect(after.slice(0, 2)).toEqual(before.slice(0, 2))
      else if (what === 'stale story') expect([after[0], after[2]]).toEqual([before[0], before[2]])
      else expect(after).toEqual(before)
    }
  })

  it('a stale story is named with its current copy', () => {
    const a = api()
    const revs = storyRevs(a, 'MVP')
    agentEdits('US-01.1.2', (t) => t.replace('order: 2', 'order: 8'))
    const e = refusal(() => rename(a, { stories: revs }))
    const body = e.body as { blocked: { id: string; current: Rev<Item> }[] }
    expect(body.blocked.map((b) => [b.id, b.current.data.order])).toEqual([['US-01.1.2', 8]])
  })

  it('a write failure part way puts back the files already written', () => {
    let n = 0
    const a = api({
      beforeWrite: () => {
        if (++n === 2) throw new Error('disk full')
      },
    })
    const before = snapshot()
    const e = refusal(() => rename(a))
    expect(e.status).toBe(500)
    expect(e.message).toMatch(/every file it had already written was put back/)
    expect(snapshot()).toEqual(before)
  })

  it('a batch and a delete with rewrites put back on a failure part way too', () => {
    let n = 0
    const a = api({
      beforeWrite: () => {
        if (++n === 2) throw new Error('disk full')
      },
    })
    const before = snapshot()
    const r1 = revOfItem(a, 'US-01.1.1')
    const r2 = revOfItem(a, 'US-01.1.2')
    expect(refusal(() => call(a, 'POST', '/api/items/batch', { changes: [{ id: 'US-01.1.1', baseRev: r1, patch: { order: 5 } }, { id: 'US-01.1.2', baseRev: r2, patch: { order: 6 } }] })).status).toBe(500)
    expect(snapshot()).toEqual(before)
    n = 0
    const q = readFileSync(questionPath('OQ-01', root), 'utf8')
    expect(refusal(() => call(a, 'DELETE', '/api/items/FT-01.1', { baseRev: revOfItem(a, 'FT-01.1'), ids: ['FT-01.1', 'US-01.1.1', 'US-01.1.2'] })).status).toBe(500)
    expect(snapshot()).toEqual(before)
    expect(readFileSync(questionPath('OQ-01', root), 'utf8')).toBe(q)
    expect(existsSync(itemPath('FT-01.1', root))).toBe(true)
  })

  it('a batch whose second card cannot be saved without loss is refused before any file changes (B05 review)', () => {
    // A flow-mapping frontmatter defeats the splice, and the canonical form would drop the image's `zoom`.
    writeFileSync(itemPath('US-01.1.2', root), '---\n{ id: US-01.1.2, type: story, parent: FT-01.1, title: Two, status: 1, order: 2, swimlane: MVP, images: [{ src: assets/US-01.1.2/a.png, viewport: desktop, zoom: 2 }] }\n---\n')
    let writes = 0
    const a = api({ beforeWrite: () => void writes++ })
    const before = snapshot()
    events.length = 0
    const e = refusal(() =>
      call(a, 'POST', '/api/items/batch', {
        changes: [
          { id: 'US-01.1.1', baseRev: revOfItem(a, 'US-01.1.1'), patch: { order: 5 } },
          { id: 'US-01.1.2', baseRev: revOfItem(a, 'US-01.1.2'), patch: { order: 6 } },
        ],
      }),
    )
    expect(e.status).toBe(422)
    expect(e.message).toMatch(/US-01.1.2: .*"images"/)
    expect(snapshot()).toEqual(before)
    expect(writes).toBe(0) // not even written and put back
    expect(events.filter((x) => x.kind === 'item')).toEqual([])
  })

  it('a lane change against an unreadable layout says so (422), even with no lanesRev to send', () => {
    writeFileSync(layoutPath(root), '{ broken')
    const a = api()
    const e = refusal(() => call(a, 'POST', '/api/lanes', { op: 'remove', from: 'MVP', lanesRev: '', stories: storyRevs(a, 'MVP') }))
    expect(e.status).toBe(422)
  })

  function beforeEachReset() {
    writeItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, description: 'First.', swimlane: 'MVP' }), root)
    writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, swimlane: 'MVP' }), root)
    writeLayout({ positions: {}, lanes: ['MVP', 'Later'] }, root)
  }
})

describe('creating without hard links (R-64, REQ-17)', () => {
  for (const code of ['EPERM', 'ENOTSUP', 'EXDEV']) {
    it(`with links refused (${code}) a create succeeds, never replaces a file, and leaves no temp file`, () => {
      const noLinks = () => {
        throw Object.assign(new Error(`${code}: links not allowed`), { code })
      }
      const file = join(root, 'stories', 'US-09.md')
      createAtomic(file, 'first\n', noLinks)
      expect(readFileSync(file, 'utf8')).toBe('first\n')
      expect(() => createAtomic(file, 'second\n', noLinks)).toThrow(FileExistsError)
      expect(readFileSync(file, 'utf8')).toBe('first\n')
      expect(readdirSync(join(root, 'stories')).filter((n) => n.endsWith('.tmp'))).toEqual([])
      // Two creators of one ID end with two IDs.
      const taken = new Set(['US-09'])
      const made = claimNext(
        new Set<string>(),
        (t) => ({ id: ['US-09', 'US-10', 'US-11'].find((x) => !t.has(x))! }),
        (rec) => createAtomic(join(root, 'stories', `${rec.id}.md`), `${rec.id}\n`, noLinks),
      )
      expect(made?.id).toBe('US-10')
      expect(taken.has('US-09')).toBe(true)
    })
  }

  it('other errors still surface', () => {
    const broken = () => {
      throw Object.assign(new Error('EIO: i/o error'), { code: 'EIO' })
    }
    expect(() => createAtomic(join(root, 'stories', 'US-09.md'), 'x', broken)).toThrow(/EIO/)
    expect(existsSync(join(root, 'stories', 'US-09.md'))).toBe(false)
    expect(readdirSync(join(root, 'stories')).filter((n) => n.endsWith('.tmp'))).toEqual([])
  })
})

describe('a card created at a reused ID starts its journal afresh (R-54)', () => {
  it('a board create at an ID whose earlier card was deleted by hand sets the old journal aside', () => {
    const dir = mkdtempSync(join(tmpdir(), 'journal-'))
    try {
      const a = api({ journal: createJournal(dir) })
      const rec = a.getState().items['US-01.1.2']!
      call(a, 'PUT', '/api/items/US-01.1.2', { patch: { title: 'Old card' }, baseRev: rec.rev })
      expect(readFileSync(join(dir, 'US-01.1.2.jsonl'), 'utf8')).toContain('Old card')
      rmSync(itemPath('US-01.1.2', root)) // by hand
      a.syncFromDisk()
      expect(existsSync(join(dir, 'US-01.1.2.jsonl'))).toBe(true) // a missing file keeps its journal (B05-Q2)
      const made = call(a, 'POST', '/api/items', { type: 'story', parent: 'FT-01.1', title: 'New card' }) as Rev<Item>
      expect(made.data.id).toBe('US-01.1.2')
      const lines = readFileSync(join(dir, 'US-01.1.2.jsonl'), 'utf8').trim().split('\n')
      expect(lines).toHaveLength(1)
      expect(JSON.parse(lines[0]!)).toMatchObject({ kind: 'created', source: 'board', item: { title: 'New card' } })
      expect(readdirSync(join(dir, 'deleted')).some((n) => n.endsWith('US-01.1.2.jsonl'))).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('the layout file never gains a position for a card with no file (B07: R-57 server half)', () => {
  it('drops a position for a deleted card, judged on disk, and keeps one for a card just created there', () => {
    const a = api()
    rmSync(itemPath('US-01.1.2', root)) // gone on disk; the board has not synced yet
    writeItem(item({ id: 'US-01.1.3', parent: 'FT-01.1', order: 3 }), root) // created by an agent, not synced yet
    call(a, 'PUT', '/api/layout', { positions: { 'US-01.1.2': { x: 5, y: 5 }, 'US-01.1.3': { x: 7, y: 8 }, 'US-01.1.1': { x: 1, y: 2 } } })
    const saved = JSON.parse(readFileSync(join(root, 'board-layout.json'), 'utf8')).positions
    expect(saved).toEqual({ 'US-01.1.1': { x: 1, y: 2 }, 'US-01.1.3': { x: 7, y: 8 } })
  })
})

vi.setConfig({ testTimeout: 60_000 })

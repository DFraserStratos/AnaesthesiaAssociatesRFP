/**
 * The re-sync costs what changed (B07: FINDINGS R-158, R-159, D-10).
 * - Equivalence: after any burst, a re-sync of only the changed paths leaves the server exactly as a
 *   full re-read does (records, revs, parse and check issues, layout, config with its revs and status
 *   state, artifact facts, screenshot versions), sends the same delivery and journals the same entries.
 * - Counts: a one-file change re-reads one file; a note re-reads none and sends nothing; the board's
 *   own write echoes nothing; a screenshot change scans one folder.
 * - One delivery per re-sync and per write request.
 * - D-10: screenshot versions in the snapshot and on the delivery.
 */
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { serialiseArtifact, serialiseItem, serialiseQuestion } from '../shared/files.ts'
import type { Artifact, CatalogueDelivery, CatalogueSnapshot } from '../shared/types.ts'
import { FIXTURE_CONFIG, item, question } from './fixtures.ts'

/** Every file read and every folder listed or entry stat-ed, by path (pass-through `node:fs`). */
const reads = vi.hoisted(() => ({ files: [] as string[], walked: [] as string[] }))
/** `/`-rooted artifact files resolve from REPO_ROOT (read once by artifactFiles.ts), so one can sit outside the folder. */
const OUTER = vi.hoisted(() => {
  const fs = require('node:fs') as typeof import('node:fs')
  const dir = fs.realpathSync(fs.mkdtempSync(`${(require('node:os') as typeof import('node:os')).tmpdir()}/resync-outer-`))
  process.env.REPO_ROOT = dir
  return dir
})
vi.mock('node:fs', async (importOriginal) => {
  const real = await importOriginal<typeof import('node:fs')>()
  const readFileSync = ((...args: Parameters<typeof real.readFileSync>) => {
    reads.files.push(String(args[0]))
    return real.readFileSync(...args)
  }) as typeof real.readFileSync
  const readdirSync = ((...args: Parameters<typeof real.readdirSync>) => {
    reads.walked.push(String(args[0]))
    return real.readdirSync(...args)
  }) as typeof real.readdirSync
  const statSync = ((...args: Parameters<typeof real.statSync>) => {
    reads.walked.push(String(args[0]))
    return real.statSync(...args)
  }) as typeof real.statSync
  const fs = { ...real, readFileSync, readdirSync, statSync }
  return { ...fs, default: fs }
})
const { createCatalogueApi } = await import('../server/catalogueApi.ts')
const { loadCatalogue, writeItem, writeLayout, writeQuestion } = await import('../server/catalogueFs.ts')
const { createJournal } = await import('../server/historyJournal.ts')

const HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }
const NOW = () => new Date('2026-11-19T00:00:00Z')
const SVG = (label: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect id="box" x="1" y="1" width="20" height="20"/><text x="5" y="40">${label}</text></svg>`
const PNG = (n: number) => Buffer.from(`\x89PNG fake image ${n}`)

const artifact = (over: Partial<Artifact> & Pick<Artifact, 'id'>): Artifact => ({
  title: `Artifact ${over.id}`,
  kind: 'diagram',
  status: 'Current',
  supersededBy: null,
  citedAs: [],
  date: '2026-10-01',
  author: '',
  components: [],
  sources: ['Fixture'],
  file: `artifacts/files/${over.id}.svg`,
  regions: [],
  steps: [],
  stepView: null,
  description: '',
  source: '',
  extra: {},
  ...over,
})

let root: string
let scratch: string
beforeEach(() => {
  scratch = mkdtempSync(join(OUTER, 'case-'))
  root = join(scratch, 'requirements')
  seed()
})
afterEach(() => rmSync(scratch, { recursive: true, force: true }))
afterAll(() => rmSync(OUTER, { recursive: true, force: true }))
/** A document outside the requirements folder, shown by AR-03 through a `/`-rooted path. */
const outsideDoc = () => join(scratch, 'docs', 'outside.md')

const at = (...p: string[]) => join(root, ...p)
const STORIES = ['US-01.1.1', 'US-01.1.2', 'US-01.1.3', 'US-01.1.4', 'US-01.1.5', 'US-01.1.6']

function seed() {
  writeItem(item({ id: 'EP-01', type: 'epic' }), root)
  writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), root)
  for (const [i, id] of STORIES.entries()) {
    const images = i < 3 ? [{ src: `assets/${id}/a.png`, viewport: 'desktop' as const }, { src: `assets/${id}/b.png`, viewport: 'desktop' as const }] : []
    // A nested image: the scan of screenshot versions does not look in subfolders; the check does.
    if (i === 2) images.push({ src: `assets/${id}/sub/c.png`, viewport: 'desktop' as const })
    writeItem(item({ id, parent: 'FT-01.1', order: i + 1, swimlane: 'MVP', images, artifacts: i === 0 ? ['AR-01#box'] : [] }), root)
    if (images.length) {
      mkdirSync(at('assets', id), { recursive: true })
      writeFileSync(at('assets', id, 'a.png'), PNG(i))
      writeFileSync(at('assets', id, 'b.png'), PNG(i + 100))
    }
  }
  for (const id of ['OQ-01', 'OQ-02']) writeQuestion(question({ id, affects: ['US-01.1.1'] }), root)
  mkdirSync(at('artifacts', 'files'), { recursive: true })
  writeFileSync(at('artifacts', 'files', 'AR-01.svg'), SVG('One'))
  writeFileSync(at('artifacts', 'AR-01.md'), serialiseArtifact(artifact({ id: 'AR-01', regions: [{ id: 'box', name: 'Box', around: ['#box'], box: null, page: null, pad: null, note: '' }] })))
  mkdirSync(at('reference'), { recursive: true })
  writeFileSync(at('reference', 'spec.md'), '# Spec\n\n## Rates\n\nText.\n')
  writeFileSync(at('artifacts', 'AR-02.md'), serialiseArtifact(artifact({ id: 'AR-02', kind: 'document', file: 'reference/spec.md' })))
  mkdirSync(join(scratch, 'docs'), { recursive: true })
  writeFileSync(outsideDoc(), '# Outside\n\n## One\n')
  writeFileSync(at('artifacts', 'AR-03.md'), serialiseArtifact(artifact({ id: 'AR-03', kind: 'document', file: `/${basename(scratch)}/docs/outside.md` })))
  writeLayout({ positions: { 'US-01.1.1': { x: 10, y: 20 } }, lanes: ['MVP'] }, root)
  writeFileSync(at('board.config.json'), JSON.stringify({ statuses: FIXTURE_CONFIG.statuses.map(({ code, label, help, tone, role, settle }) => ({ code: Number(code), label, help, tone, ...(role ? { role } : {}), ...(settle ? { settle } : {}) })) }, null, 2))
  mkdirSync(at('notes'), { recursive: true })
  writeFileSync(at('notes', 'meeting.md'), '# Meeting\n')
}

/** A small seeded random source, so a failing burst can be replayed by its seed. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One change on disk, as an agent, git or a person makes it; returns the paths a watcher reports. */
type Op = (r: () => number, n: number) => string[]
const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)]!
const storyFile = (id: string) => at('stories', `${id}.md`)
const OPS: Op[] = [
  // edit a card (a title change), or create it again if it was removed
  (r, n) => {
    const id = pick(r, STORIES)
    writeItem(item({ id, parent: 'FT-01.1', title: `Edited ${n}`, swimlane: 'MVP', order: 3 }), root)
    return [storyFile(id)]
  },
  // a new card
  (_r, n) => {
    writeItem(item({ id: `US-01.1.${20 + n}`, parent: 'FT-01.1', order: 20 + n }), root)
    return [storyFile(`US-01.1.${20 + n}`)]
  },
  // a card deleted by hand
  (r) => {
    const id = pick(r, STORIES)
    rmSync(storyFile(id), { force: true })
    return [storyFile(id)]
  },
  // a card file broken, or a file not named after an ID
  (r) => {
    const f = r() < 0.5 ? storyFile(pick(r, STORIES)) : at('stories', 'not-an-id.md')
    writeFileSync(f, '---\nid: [unclosed\n---\n')
    return [f]
  },
  // an atomic rewrite (temp file and rename): the watcher sees the temp file and the name
  (r, n) => {
    const id = pick(r, STORIES)
    const tmp = `${storyFile(id)}.99.tmp`
    writeFileSync(tmp, serialiseItem(item({ id, parent: 'FT-01.1', title: `Renamed ${n}`, order: 4 })))
    renameSync(tmp, storyFile(id))
    return [storyFile(id), tmp]
  },
  // a question edited, created or deleted
  (r, n) => {
    const id = pick(r, ['OQ-01', 'OQ-02', 'OQ-03'])
    const f = at('questions', `${id}.md`)
    if (r() < 0.3) rmSync(f, { force: true })
    else writeFileSync(f, serialiseQuestion(question({ id, title: `Q ${n}`, affects: [pick(r, STORIES)] })))
    return [f]
  },
  // an artifact's details, or its file inside the folder, or its document under reference/
  (r, n) => {
    const k = r()
    if (k < 0.33) {
      writeFileSync(at('artifacts', 'AR-01.md'), serialiseArtifact(artifact({ id: 'AR-01', title: `Diagram ${n}`, regions: [{ id: 'box', name: 'Box', around: [r() < 0.5 ? '#box' : '#gone'], box: null, page: null, pad: null, note: '' }] })))
      return [at('artifacts', 'AR-01.md')]
    }
    if (k < 0.66) {
      writeFileSync(at('artifacts', 'files', 'AR-01.svg'), SVG(`Label ${n}`))
      return [at('artifacts', 'files', 'AR-01.svg')]
    }
    writeFileSync(at('reference', 'spec.md'), `# Spec\n\n## Rates ${n}\n\nText.\n`)
    return [at('reference', 'spec.md')]
  },
  // a screenshot rewritten, touched, added or removed; or a card's whole screenshot folder removed
  (r, n) => {
    const id = pick(r, STORIES.slice(0, 3))
    const dir = at('assets', id)
    const k = r()
    mkdirSync(dir, { recursive: true })
    if (k < 0.3) writeFileSync(join(dir, 'a.png'), PNG(1000 + n))
    else if (k < 0.45 && existsSync(join(dir, 'a.png'))) utimesSync(join(dir, 'a.png'), new Date(2020, 0, 1 + n), new Date(2020, 0, 1 + n))
    else if (k < 0.6) writeFileSync(join(dir, `c${n}.png`), PNG(2000 + n))
    else if (k < 0.8) rmSync(join(dir, 'b.png'), { force: true })
    else {
      rmSync(dir, { recursive: true, force: true })
      return [dir]
    }
    return [join(dir, k < 0.45 ? 'a.png' : k < 0.6 ? `c${n}.png` : 'b.png')]
  },
  // the layout: a move, broken JSON, or a lane added
  (r, n) => {
    const k = r()
    if (k < 0.2) writeFileSync(at('board-layout.json'), '{ "positions": ')
    else writeLayout({ positions: { [pick(r, STORIES)]: { x: n, y: 2 * n } }, lanes: k < 0.6 ? ['MVP'] : ['MVP', `Lane ${n}`] }, root)
    return [at('board-layout.json')]
  },
  // the config: a status label, a broken file, or the recodes
  (r, n) => {
    const k = r()
    if (k < 0.15) {
      writeFileSync(at('board.config.json'), '{ nope')
      return [at('board.config.json')]
    }
    if (k < 0.3) {
      writeFileSync(at('status-recodes.json'), JSON.stringify([{ date: '2026-10-20', items: { Proposed: 1 }, questions: {} }]))
      return [at('status-recodes.json')]
    }
    writeFileSync(at('board.config.json'), JSON.stringify({ project: { name: `Project ${n}` }, statuses: FIXTURE_CONFIG.statuses.map(({ code, label, help, tone, role, settle }) => ({ code: Number(code), label: code === '2' ? `Label ${n}` : label, help, tone, ...(role ? { role } : {}), ...(settle ? { settle } : {}) })) }, null, 2))
    return [at('board.config.json')]
  },
  // a nested image added or removed; a screenshot swapped for a symbolic link (identical bytes) outside assets/
  (r, n) => {
    const id = pick(r, STORIES.slice(0, 3))
    if (r() < 0.5) {
      const sub = at('assets', id, 'sub')
      if (existsSync(sub)) rmSync(sub, { recursive: true })
      else {
        mkdirSync(sub, { recursive: true })
        writeFileSync(join(sub, 'c.png'), PNG(3000 + n))
      }
      return [sub, join(sub, 'c.png')]
    }
    const f = at('assets', id, 'a.png')
    if (!existsSync(f)) return []
    const outside = join(scratch, `linked-${n}.png`)
    writeFileSync(outside, readFileSync(f))
    rmSync(f)
    symlinkSync(outside, f)
    return [f]
  },
  // the outside document an artifact shows
  (_r, n) => {
    writeFileSync(outsideDoc(), `# Outside ${n}\n\n## Part ${n}\n`)
    return [outsideDoc()]
  },
  // files that feed nothing the server holds
  (_r, n) => {
    appendFileSync(at('notes', 'meeting.md'), `line ${n}\n`)
    writeFileSync(at('README.md'), `# Readme ${n}\n`)
    return [at('notes', 'meeting.md'), at('README.md')]
  },
]

/** Two servers over one folder: one re-syncs the changed paths, the other the whole folder. */
function twins() {
  const deliveries = { inc: [] as CatalogueDelivery[], full: [] as CatalogueDelivery[] }
  const inc = createCatalogueApi(root, (d) => deliveries.inc.push(d), { journal: createJournal(join(scratch, 'journal-inc'), NOW) })
  const full = createCatalogueApi(root, (d) => deliveries.full.push(d), { journal: createJournal(join(scratch, 'journal-full'), NOW) })
  return { inc, full, deliveries }
}
const snapshot = (a: ReturnType<typeof createCatalogueApi>) => a.handle({ method: 'GET', path: '/api/catalogue' }) as CatalogueSnapshot
const body = (d: CatalogueDelivery) => {
  const { epoch: _e, seq: _s, ...rest } = d
  return rest
}
/** What the server holds, as a full read of the folder would give it. */
function held(a: ReturnType<typeof createCatalogueApi>) {
  const { items, questions, artifacts, layout, layoutReadable, config, parseIssues, issues } = a.getState()
  return { items, questions, artifacts, layout, layoutReadable, config, parseIssues, issues, assets: snapshot(a).assets }
}
function journalFiles(dir: string): Record<string, string> {
  if (!existsSync(dir)) return {}
  return Object.fromEntries(readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => [join(e.parentPath, e.name).slice(dir.length), readFileSync(join(e.parentPath, e.name), 'utf8')]))
}

describe('a re-sync of the changed paths equals a full re-read (REQ-06.5)', () => {
  for (let s = 1; s <= 30; s++) {
    it(`random burst, seed ${s}`, () => {
      const r = rng(s)
      const { inc, full, deliveries } = twins()
      for (let round = 0; round < 3; round++) {
        const paths: string[] = []
        for (let k = 0; k < 6; k++) paths.push(...pick(r, OPS)(r, s * 100 + round * 10 + k))
        // A watcher repeats and reorders paths; the plugin drops temp files before batching.
        const seen = [...paths, ...paths.slice(0, 2)].filter((p) => !p.endsWith('.tmp')).reverse()
        deliveries.inc.length = 0
        deliveries.full.length = 0
        inc.syncFromDisk(seen)
        full.syncFromDisk()
        expect(held(inc)).toEqual(held(full))
        const fresh = loadCatalogue(root)
        expect({ ...held(inc), assets: undefined }).toEqual({ items: fresh.items, questions: fresh.questions, artifacts: fresh.artifacts, layout: fresh.layout, layoutReadable: fresh.layoutReadable, config: fresh.config, parseIssues: fresh.parseIssues, issues: fresh.issues, assets: undefined })
        expect(deliveries.inc.map(body)).toEqual(deliveries.full.map(body))
        expect(deliveries.inc.length).toBeLessThanOrEqual(1)
      }
      expect(journalFiles(join(scratch, 'journal-inc'))).toEqual(journalFiles(join(scratch, 'journal-full')))
    })
  }

  it('reads the whole folder for a path it cannot judge alone (REQ-06.6)', () => {
    const { inc, full } = twins()
    // A record folder replaced wholesale: only the folder's own event arrives.
    rmSync(at('questions'), { recursive: true })
    mkdirSync(at('questions'))
    writeQuestion(question({ id: 'OQ-07' }), root)
    reads.files.length = 0
    inc.syncFromDisk([at('questions')])
    full.syncFromDisk()
    expect(held(inc)).toEqual(held(full))
    expect(Object.keys(inc.getState().questions)).toEqual(['OQ-07'])
    expect(reads.files.filter((f) => f.includes(`${join('stories', '')}`)).length).toBeGreaterThanOrEqual(8) // everything re-read
    // The catalogue folder itself, likewise.
    writeItem(item({ id: 'US-01.1.9', parent: 'FT-01.1' }), root)
    inc.syncFromDisk([root])
    expect(inc.getState().items['US-01.1.9']).toBeTruthy()
  })

  it('keeps the hand-delete journal step: a card back as a different record starts a new life', () => {
    const { inc, full } = twins()
    rmSync(storyFile('US-01.1.2'))
    inc.syncFromDisk([storyFile('US-01.1.2')])
    full.syncFromDisk()
    writeItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', title: 'Someone else', order: 9 }), root)
    inc.syncFromDisk([storyFile('US-01.1.2')])
    full.syncFromDisk()
    const lines = readFileSync(join(scratch, 'journal-inc', 'US-01.1.2.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    expect(lines.at(-1)).toMatchObject({ kind: 'created', item: { title: 'Someone else' } })
    expect(journalFiles(join(scratch, 'journal-inc'))).toEqual(journalFiles(join(scratch, 'journal-full')))
  })
})

describe('a re-sync costs what changed (R-158)', () => {
  const recordReads = () => reads.files.filter((f) => /[\\/](stories|questions|artifacts)[\\/][^\\/]+\.md$/.test(f))

  it('a one-file change re-reads that file alone', () => {
    const { inc } = twins()
    writeItem(item({ id: 'US-01.1.3', parent: 'FT-01.1', title: 'Changed', order: 3 }), root)
    reads.files.length = 0
    inc.syncFromDisk([storyFile('US-01.1.3')])
    expect(recordReads()).toEqual([storyFile('US-01.1.3')])
    expect(inc.getState().items['US-01.1.3']!.data.title).toBe('Changed')
  })

  it('a change under notes/ re-reads nothing and sends nothing', () => {
    const { inc, deliveries } = twins()
    appendFileSync(at('notes', 'meeting.md'), 'more\n')
    reads.files.length = 0
    inc.syncFromDisk([at('notes', 'meeting.md')])
    expect(reads.files).toEqual([])
    expect(deliveries.inc).toEqual([])
  })

  it("the board's own write echoes back as one file read and nothing sent", () => {
    const { inc, deliveries } = twins()
    const rec = inc.getState().items['US-01.1.4']!
    inc.handle({ method: 'PUT', path: '/api/items/US-01.1.4', body: { patch: { title: 'Mine' }, baseRev: rec.rev }, headers: HEADERS })
    deliveries.inc.length = 0
    reads.files.length = 0
    inc.syncFromDisk([storyFile('US-01.1.4')])
    expect(recordReads()).toEqual([storyFile('US-01.1.4')])
    expect(deliveries.inc).toEqual([])
  })

  it("the echo of the board's own drag or Settings save keeps the state as it is: no check, nothing sent", () => {
    const { inc, deliveries } = twins()
    inc.handle({ method: 'PUT', path: '/api/layout', body: { positions: { 'US-01.1.2': { x: 3, y: 4 } } }, headers: HEADERS })
    const held = inc.getState()
    deliveries.inc.length = 0
    inc.syncFromDisk([at('board-layout.json')])
    expect(inc.getState()).toBe(held)
    inc.handle({ method: 'PUT', path: '/api/config', body: { project: { name: 'Echoed' }, bases: { project: inc.getState().config.revs.project } }, headers: HEADERS })
    const after = inc.getState()
    deliveries.inc.length = 0
    inc.syncFromDisk([at('board.config.json')])
    expect(inc.getState()).toBe(after)
    expect(deliveries.inc).toEqual([])
  })

  it('a screenshot rewrite scans its own folder only', () => {
    const { inc } = twins()
    writeFileSync(at('assets', 'US-01.1.2', 'a.png'), PNG(5000))
    reads.files.length = 0
    inc.syncFromDisk([at('assets', 'US-01.1.2', 'a.png')])
    expect(reads.files.filter((f) => f.includes(`${join('assets', '')}`))).toEqual([at('assets', 'US-01.1.2', 'a.png')])
    expect(recordReads()).toEqual([])
  })
})

describe('what a screenshot folder or an outside file feeds (B07 review)', () => {
  it('a nested image and a screenshot swapped for an outside link change the issues as a full read does', () => {
    const { inc, full } = twins()
    const of = (a: ReturnType<typeof createCatalogueApi>, id: string) => a.getState().issues.filter((i) => i.id === id).map((i) => i.message)
    expect(of(inc, 'US-01.1.3').some((m) => /sub\/c\.png is missing/.test(m))).toBe(true)
    mkdirSync(at('assets', 'US-01.1.3', 'sub'))
    writeFileSync(at('assets', 'US-01.1.3', 'sub', 'c.png'), PNG(1))
    inc.syncFromDisk([at('assets', 'US-01.1.3', 'sub'), at('assets', 'US-01.1.3', 'sub', 'c.png')])
    full.syncFromDisk()
    expect(of(inc, 'US-01.1.3')).toEqual(of(full, 'US-01.1.3'))
    expect(of(inc, 'US-01.1.3').some((m) => /sub\/c\.png is missing/.test(m))).toBe(false)
    const f = at('assets', 'US-01.1.1', 'a.png')
    writeFileSync(join(scratch, 'elsewhere.png'), readFileSync(f))
    rmSync(f)
    symlinkSync(join(scratch, 'elsewhere.png'), f)
    inc.syncFromDisk([f])
    full.syncFromDisk()
    expect(inc.getState().issues).toEqual(full.getState().issues)
    expect(of(inc, 'US-01.1.1').some((m) => /symbolic link/.test(m))).toBe(true)
  })

  it("an artifact's file outside the folder updates that artifact's facts", () => {
    const { inc, full } = twins()
    const before = inc.getState().artifacts['AR-03']!.meta
    writeFileSync(outsideDoc(), '# Outside\n\n## One\n\n## Two\n')
    inc.syncFromDisk([outsideDoc()])
    full.syncFromDisk()
    expect(inc.getState().artifacts['AR-03']!.meta).toEqual(full.getState().artifacts['AR-03']!.meta)
    expect(inc.getState().artifacts['AR-03']!.meta).not.toEqual(before)
  })

  it("a card-only change walks no screenshot folder; a screenshot change walks only its card's", () => {
    const { inc } = twins()
    const underAssets = () => reads.walked.filter((p) => p.startsWith(at('assets')))
    writeItem(item({ id: 'US-01.1.4', parent: 'FT-01.1', title: 'Only the card', order: 4 }), root)
    reads.walked.length = 0
    inc.syncFromDisk([storyFile('US-01.1.4')])
    expect(underAssets()).toEqual([])
    writeFileSync(at('assets', 'US-01.1.2', 'b.png'), PNG(4242))
    reads.walked.length = 0
    inc.syncFromDisk([at('assets', 'US-01.1.2', 'b.png')])
    const folders = new Set(underAssets().map((p) => p.slice(at('assets').length + 1).split(/[\\/]/)[0]))
    expect([...folders]).toEqual(['US-01.1.2'])
  })
})

describe('one delivery per re-sync and per write request (R-159)', () => {
  it('a burst of N changed records is one delivery carrying them all', () => {
    const { inc, deliveries } = twins()
    const paths = STORIES.map((id, i) => {
      writeItem(item({ id, parent: 'FT-01.1', title: `Burst ${i}`, order: i + 1 }), root)
      return storyFile(id)
    })
    writeLayout({ positions: {}, lanes: ['MVP', 'Next'] }, root)
    inc.syncFromDisk([...paths, at('board-layout.json')])
    expect(deliveries.inc).toHaveLength(1)
    expect(Object.keys(deliveries.inc[0]!.items!)).toEqual(STORIES)
    expect(deliveries.inc[0]!.layout!.lanes).toEqual(['MVP', 'Next'])
  })

  it('a write of several records is one delivery, numbered after the last', () => {
    const { inc, deliveries } = twins()
    const before = snapshot(inc).seq
    const changes = STORIES.slice(0, 4).map((id) => ({ id, baseRev: inc.getState().items[id]!.rev, patch: { swimlane: 'Next' } }))
    inc.handle({ method: 'POST', path: '/api/items/batch', body: { changes }, headers: HEADERS })
    expect(deliveries.inc).toHaveLength(1)
    expect(deliveries.inc[0]!.seq).toBe(before + 1)
    expect(Object.keys(deliveries.inc[0]!.items!)).toEqual(STORIES.slice(0, 4))
    expect(snapshot(inc).seq).toBe(before + 1)
    expect(inc.handle({ method: 'GET', path: '/api/ping' })).toEqual({ epoch: snapshot(inc).epoch, seq: before + 1 })
  })

  it('a config change keeps its section revs and status state in the delivery', () => {
    const { inc, deliveries } = twins()
    const cfg = JSON.parse(readFileSync(at('board.config.json'), 'utf8'))
    cfg.project = { name: 'Renamed' }
    writeFileSync(at('board.config.json'), JSON.stringify(cfg))
    inc.syncFromDisk([at('board.config.json')])
    const config = deliveries.inc[0]!.config!
    expect(config.revs).toEqual(inc.getState().config.revs)
    expect(config.revs.project).toBeTruthy()
    expect(config.statusState.statuses.state).toBe('healthy')
  })
})

describe('screenshot versions (D-10)', () => {
  it('a rewrite sends one delivery naming the card with a new version, and no record', () => {
    const { inc, deliveries } = twins()
    const was = snapshot(inc).assets['assets/US-01.1.1/a.png']
    expect(was).toMatch(/^[0-9a-f]{40}$/)
    writeFileSync(at('assets', 'US-01.1.1', 'a.png'), PNG(9999))
    inc.syncFromDisk([at('assets', 'US-01.1.1', 'a.png')])
    expect(deliveries.inc).toHaveLength(1)
    const d = deliveries.inc[0]!
    expect(Object.keys(d.assets!)).toEqual(['assets/US-01.1.1/a.png'])
    expect(d.assets!['assets/US-01.1.1/a.png']).not.toBe(was)
    expect(d.items ?? {}).toEqual({})
    expect(d.questions ?? {}).toEqual({})
    // A tab loading now gets the new version.
    expect(snapshot(inc).assets['assets/US-01.1.1/a.png']).toBe(d.assets!['assets/US-01.1.1/a.png'])
  })

  it('an unchanged file keeps its version: across other deliveries, a touch, and a restart', () => {
    const { inc, deliveries } = twins()
    const v = snapshot(inc).assets['assets/US-01.1.2/b.png']
    writeItem(item({ id: 'US-01.1.5', parent: 'FT-01.1', title: 'Other', order: 5 }), root)
    inc.syncFromDisk([storyFile('US-01.1.5')])
    utimesSync(at('assets', 'US-01.1.2', 'b.png'), new Date(2021, 1, 1), new Date(2021, 1, 1))
    inc.syncFromDisk([at('assets', 'US-01.1.2', 'b.png')])
    expect(deliveries.inc.every((d) => !d.assets)).toBe(true)
    expect(snapshot(inc).assets['assets/US-01.1.2/b.png']).toBe(v)
    const restarted = createCatalogueApi(root, () => {}, { journal: createJournal(join(scratch, 'journal-inc'), NOW) })
    expect(snapshot(restarted).assets['assets/US-01.1.2/b.png']).toBe(v)
    const fresh = createCatalogueApi(root)
    expect(snapshot(fresh).assets['assets/US-01.1.2/b.png']).toBe(v)
  })

  it('a burst over several cards names each card once, in one delivery', () => {
    const { inc, deliveries } = twins()
    const paths = STORIES.slice(0, 3).flatMap((id, i) => {
      writeFileSync(at('assets', id, 'a.png'), PNG(7000 + i))
      writeFileSync(at('assets', id, 'b.png'), PNG(8000 + i))
      return [at('assets', id, 'a.png'), at('assets', id, 'b.png'), at('assets', id)]
    })
    inc.syncFromDisk(paths)
    expect(deliveries.inc).toHaveLength(1)
    const cards = Object.keys(deliveries.inc[0]!.assets!).map((src) => src.split('/')[1])
    expect([...new Set(cards)]).toEqual(STORIES.slice(0, 3))
    expect(cards).toHaveLength(6)
  })

  it('a removed screenshot is signalled as gone', () => {
    const { inc, deliveries } = twins()
    rmSync(at('assets', 'US-01.1.3', 'b.png'))
    inc.syncFromDisk([at('assets', 'US-01.1.3', 'b.png')])
    expect(deliveries.inc[0]!.assets).toEqual({ 'assets/US-01.1.3/b.png': null })
    expect(snapshot(inc).assets['assets/US-01.1.3/b.png']).toBeUndefined()
    // The card's image is now missing: the check says so in the same delivery.
    expect(deliveries.inc[0]!.issues!.some((i) => i.id === 'US-01.1.3' && /b\.png is missing/.test(i.message))).toBe(true)
  })
})

// Each burst boots two servers and reads the folder several times; the machine is often loaded (see PROGRESS Discovered).
vi.setConfig({ testTimeout: 60_000 })

/**
 * B08 · the git history readers on fixture repositories: first-parent history (R-23), any file name
 * (R-24), moves not yet staged (R-69), renames bounded by commit (R-70), screenshots per file (R-71),
 * working files in git's clean form (R-72), SHA-256 (R-73), fresh artifact context (R-74), shared
 * in-flight reads and worktree caching (R-161), bounded caches (R-162), the deletion bound (R-54
 * support) and lock-free reads (B08-Q6). Each scenario runs in a SHA-1 and a SHA-256 repository.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { statSync, utimesSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createDiffReader, catalogueDiff } from '../server/catalogueDiff.ts'
import { Lru } from '../server/gitCore.ts'
import { itemPath } from '../server/catalogueFs.ts'
import { serveHistoryBlob } from '../server/cataloguePlugin.ts'
import * as gitHistory from '../server/gitHistory.ts'
import { gitAssetHistory, gitDirty, gitFileHistory, gitScreenshots } from '../server/gitHistory.ts'
import { createJournal } from '../server/historyJournal.ts'
import { WORKTREE } from '../shared/diff.ts'
import { serialiseArtifact, serialiseItem } from '../shared/files.ts'
import type { Artifact, Item } from '../shared/types.ts'
import { FORMATS, gitShim, hasGit, makeRepo, type Fixture } from './gitFixture.ts'
import { item } from './fixtures.ts'

const T = { timeout: 60_000 }
const ID = 'US-01.1.1'
const card = (title: string, description = '') => serialiseItem(item({ id: ID, parent: 'FT-01.1', order: 1, title, description }))
const artifact = (over: Partial<Artifact> & Pick<Artifact, 'id'>): Artifact => ({
  title: `Artifact ${over.id}`,
  kind: 'diagram',
  status: 'Current',
  supersededBy: null,
  date: null,
  author: '',
  components: [],
  sources: [],
  citedAs: [],
  file: `artifacts/files/${over.id}.svg`,
  regions: [],
  steps: [],
  stepView: null,
  description: '',
  source: '',
  extra: {},
  ...over,
})

const subjects = (h: { versions: { commit: { subject: string } }[] }) => h.versions.map((v) => v.commit.subject)
const titled = (h: { versions: { commit: { subject: string }; item: Item | null }[] }) => h.versions.map((v) => [v.commit.subject, v.item?.title ?? null, v.item?.description ?? null])

function fakeRes() {
  const r = { headers: {} as Record<string, string>, body: null as Buffer | null, setHeader(k: string, v: string) { r.headers[k] = v }, end(b: Buffer) { r.body = b } }
  return r as typeof r & ServerResponse
}

/** The first-parent truth for a path: every commit on HEAD's first parents whose tree differs there from its first parent's. */
function firstParentTruth(f: Fixture, path: string): string[] {
  const commits = f.g('rev-list', '--first-parent', 'HEAD').trim().split('\n')
  return commits.flatMap((c) => {
    const parent = f.g('rev-list', '--parents', '-n1', c).trim().split(' ')[1]
    const changed = parent ? f.g('diff-tree', '-r', '--name-only', '--no-commit-id', parent, c, '--', path) : f.g('diff-tree', '-r', '--root', '--name-only', '--no-commit-id', c, '--', path)
    return changed.trim() ? [f.g('log', '-1', '--format=%s', c).trim()] : []
  })
}

describe.skipIf(!hasGit).each(FORMATS)('git history readers (%s)', (format) => {
  let f: Fixture
  const fresh = () => {
    f?.cleanup()
    f = makeRepo(format)
    return f
  }
  afterAll(() => f?.cleanup())
  const root = () => join(f.dir, 'reqs')
  const cardFile = () => itemPath(ID, root())
  const blob = (rel: string) => f.g('hash-object', rel).trim()

  describe('R-23 · first-parent history', () => {
    it('lists a --no-ff merge once, with the first parent before it, and no false revert', T, async () => {
      fresh()
      f.write('reqs/stories/US-01.1.1.md', card('T0', 'D0'))
      f.commit('add')
      f.g('checkout', '-q', '-b', 'lane')
      f.write('reqs/stories/US-01.1.1.md', card('T0', 'D1'))
      f.commit('lane desc')
      f.g('checkout', '-q', 'main')
      f.write('reqs/stories/US-01.1.1.md', card('T1', 'D0'))
      f.commit('main title')
      f.merge('lane', '--no-ff', 'merge')
      const h = await gitFileHistory(cardFile())
      expect(titled(h)).toEqual([
        ['merge', 'T1', 'D1'],
        ['main title', 'T1', 'D0'],
        ['add', 'T0', 'D0'],
      ])
      expect(subjects(h)).toEqual(firstParentTruth(f, 'reqs/stories/US-01.1.1.md'))
    })

    it('lists the lane commits of a fast-forward merge', T, async () => {
      fresh()
      f.write('reqs/stories/US-01.1.1.md', card('T0', 'D0'))
      f.commit('add')
      f.g('checkout', '-q', '-b', 'lane')
      f.write('reqs/stories/US-01.1.1.md', card('T0', 'D1'))
      f.commit('lane desc')
      f.g('checkout', '-q', 'main')
      f.merge('lane', '--ff-only')
      expect(subjects(await gitFileHistory(cardFile()))).toEqual(['lane desc', 'add'])
    })

    it('reads a merge whose resolution differs from both parents as one change from its first parent', T, async () => {
      fresh()
      f.write('reqs/stories/US-01.1.1.md', card('T0'))
      f.commit('add')
      f.g('checkout', '-q', '-b', 'lane')
      f.write('reqs/stories/US-01.1.1.md', card('Lane'))
      f.commit('lane title')
      f.g('checkout', '-q', 'main')
      f.write('reqs/stories/US-01.1.1.md', card('Main'))
      f.commit('main title')
      try {
        f.g('merge', '-q', '--no-ff', 'lane')
      } catch {
        // a conflict, resolved by hand
      }
      f.write('reqs/stories/US-01.1.1.md', card('Both'))
      f.commit('merge resolved')
      const h = await gitFileHistory(cardFile())
      expect(titled(h).map((v) => v.slice(0, 2))).toEqual([
        ['merge resolved', 'Both'],
        ['main title', 'Main'],
        ['add', 'T0'],
      ])
      expect(subjects(h)).toEqual(firstParentTruth(f, 'reqs/stories/US-01.1.1.md'))
    })

    it('reads an asset and a screenshot rewritten on a lane as one change at the merge', T, async () => {
      fresh()
      f.write('reqs/artifacts/files/AR-01.svg', '<svg>1</svg>')
      f.write('reqs/assets/US-01.1.1/web.png', 'png1')
      f.commit('add')
      f.g('checkout', '-q', '-b', 'lane')
      f.write('reqs/artifacts/files/AR-01.svg', '<svg>2</svg>')
      f.write('reqs/assets/US-01.1.1/web.png', 'png2')
      f.commit('lane rewrite')
      f.g('checkout', '-q', 'main')
      f.write('other.txt', 'x')
      f.commit('main other')
      f.merge('lane', '--no-ff', 'merge')
      const asset = await gitAssetHistory(join(root(), 'artifacts/files/AR-01.svg'))
      expect(asset.commits.map((c) => c.commit.subject)).toEqual(['merge', 'add'])
      expect(asset.commits[0]!.to).toBe(blob('reqs/artifacts/files/AR-01.svg'))
      const shots = await gitScreenshots(root(), ID)
      expect(shots.commits.map((c) => c.commit.subject)).toEqual(['merge'])
      expect(asset.commits.map((c) => c.commit.subject)).toEqual(firstParentTruth(f, 'reqs/artifacts/files/AR-01.svg'))
    })
  })

  describe.each(['default', 'false'])('R-24 · any file name (core.quotePath %s)', (quote) => {
    const setup = () => {
      fresh()
      if (quote === 'false') f.g('config', 'core.quotePath', 'false')
    }

    it('gives a non-ASCII artifact file and screenshots their history, named exactly', T, async () => {
      setup()
      const talk = 'reqs/artifacts/files/Transcript – 12 Nov.md'
      const names = ['café.png', 'a "q".png', 'b\\c.png', 't\tab.png']
      f.write(talk, 'one')
      for (const n of names) f.write(`reqs/assets/${ID}/${n}`, `${n}1`)
      f.commit('add')
      f.write(talk, 'two')
      f.write(`reqs/assets/${ID}/café.png`, 'café2')
      f.commit('edit 1')
      for (const n of names) f.write(`reqs/assets/${ID}/${n}`, `${n}3`)
      f.commit('edit 2')
      const asset = await gitAssetHistory(join(f.dir, talk))
      expect(asset.commits.map((c) => c.commit.subject)).toEqual(['edit 1', 'add'])
      const shots = await gitScreenshots(root(), ID)
      expect(shots.commits.map((c) => c.commit.subject)).toEqual(['edit 2', 'edit 1'])
      expect(shots.commits[0]!.files.map((x) => x.to.src).sort()).toEqual(names.map((n) => `assets/${ID}/${n}`).sort())
      expect(shots.commits[1]!.files.map((x) => x.to)).toEqual([{ src: `assets/${ID}/café.png`, sha: f.g('rev-parse', `HEAD~1:reqs/assets/${ID}/café.png`).trim() }])
    })

    it('reads a card back past a move of a non-ASCII folder, leaving out the move', T, async () => {
      setup()
      f.write(`Exigences – café/stories/${ID}.md`, card('First'))
      f.commit('add')
      f.write(`Exigences – café/stories/${ID}.md`, card('Second'))
      f.commit('edit')
      f.g('mv', 'Exigences – café', 'reqs')
      f.commit('move')
      expect(subjects(await gitFileHistory(cardFile()))).toEqual(['edit', 'add'])
    })
  })

  describe('R-69 · moves made in the working tree', () => {
    const seed = () => {
      fresh()
      f.write(`old/stories/${ID}.md`, card('First'))
      f.commit('add')
      f.write(`old/stories/${ID}.md`, card('Second'))
      f.commit('edit')
    }

    it('follows an unchanged move git has not been told about, then staged, then unstaged again', T, async () => {
      seed()
      const file = itemPath(ID, join(f.dir, 'old'))
      expect(subjects(await gitFileHistory(file))).toEqual(['edit', 'add'])
      f.mv('old', 'reqs')
      expect(subjects(await gitFileHistory(cardFile()))).toEqual(['edit', 'add'])
      f.g('add', '-A')
      expect(subjects(await gitFileHistory(cardFile()))).toEqual(['edit', 'add'])
      f.g('reset', '-q')
      expect(subjects(await gitFileHistory(cardFile()))).toEqual(['edit', 'add'])
    })

    it('does the same in a linked worktree', T, async () => {
      seed()
      const wt = f.worktree('lane')
      f.mv('old', 'reqs', wt)
      const file = itemPath(ID, join(wt, 'reqs'))
      expect(subjects(await gitFileHistory(file))).toEqual(['edit', 'add'])
      f.g('-C', wt, 'add', '-A')
      expect(subjects(await gitFileHistory(file))).toEqual(['edit', 'add'])
      f.g('-C', wt, 'reset', '-q')
      expect(subjects(await gitFileHistory(file))).toEqual(['edit', 'add'])
    })
  })

  describe('R-70 · renames bounded by the commit that made them', () => {
    it('keeps an archived file and the new file at its old path apart', T, async () => {
      fresh()
      const dir = 'reqs/artifacts/files'
      f.write(`${dir}/pricing.svg`, '<svg>v1</svg>')
      f.commit('add v1')
      f.g('mv', `${dir}/pricing.svg`, `${dir}/pricing-v1.svg`)
      f.commit('archive')
      f.write(`${dir}/pricing.svg`, '<svg>v2</svg>')
      f.commit('add v2')
      f.write(`${dir}/pricing.svg`, '<svg>v2 edited</svg>')
      f.commit('edit v2')
      expect((await gitAssetHistory(join(f.dir, dir, 'pricing-v1.svg'))).commits.map((c) => c.commit.subject)).toEqual(['add v1'])
      const now = await gitAssetHistory(join(f.dir, dir, 'pricing.svg'))
      expect(now.commits.map((c) => c.commit.subject)).toEqual(['edit v2', 'add v2'])
      expect(now.commits.some((c) => c.deleted)).toBe(false)
    })

    it('follows a chain A to B to C segment by segment', T, async () => {
      fresh()
      f.write('reqs/stories/US-09.md', card('A0'))
      f.commit('add a')
      f.write('reqs/stories/US-09.md', card('A1'))
      f.commit('edit a')
      f.g('mv', 'reqs/stories/US-09.md', 'reqs/stories/US-08.md')
      f.commit('a to b')
      f.write('reqs/stories/US-08.md', card('B1'))
      f.commit('edit b')
      f.g('mv', 'reqs/stories/US-08.md', `reqs/stories/${ID}.md`)
      f.commit('b to c')
      f.write('reqs/stories/US-09.md', card('Another'))
      f.commit('a new card at A')
      expect(subjects(await gitFileHistory(cardFile()))).toEqual(['edit b', 'edit a', 'add a'])
      expect(subjects(await gitFileHistory(itemPath('US-09', root())))).toEqual(['a new card at A'])
    })
  })

  describe('R-71 · screenshots follow each file', () => {
    it("lists only a card's own files, through their moves", T, async () => {
      fresh()
      f.write('reqs/assets/US-1/a.png', 'a0')
      f.write('reqs/assets/US-1/b.png', 'b0')
      f.commit('add')
      f.write('reqs/assets/US-1/a.png', 'a1')
      f.write('reqs/assets/US-1/b.png', 'b1')
      f.commit('recapture 1')
      f.mv('reqs/assets/US-1/b.png', 'reqs/assets/US-2/b.png')
      f.commit('move b')
      f.write('reqs/assets/US-1/a.png', 'a2')
      f.commit('recapture a')
      f.write('reqs/assets/US-2/b.png', 'b2')
      f.commit('recapture b')
      const two = await gitScreenshots(root(), 'US-2')
      expect(two.commits.map((c) => [c.commit.subject, c.files.map((x) => x.to.src)])).toEqual([
        ['recapture b', ['assets/US-2/b.png']],
        ['recapture 1', ['assets/US-2/b.png']],
      ])
      const one = await gitScreenshots(root(), 'US-1')
      expect(one.commits.map((c) => [c.commit.subject, c.files.map((x) => x.to.src)])).toEqual([
        ['recapture a', ['assets/US-1/a.png']],
        ['recapture 1', ['assets/US-1/a.png']],
      ])
    })

    it('keeps every file of a card folder whose whole catalogue moved', T, async () => {
      fresh()
      f.write('old/assets/US-1/a.png', 'a0')
      f.commit('add')
      f.write('old/assets/US-1/a.png', 'a1')
      f.commit('recapture')
      f.g('mv', 'old', 'reqs')
      f.commit('move')
      expect((await gitScreenshots(root(), 'US-1')).commits.map((c) => c.commit.subject)).toEqual(['recapture'])
    })
  })

  describe('R-72 · working files named as git stores them', () => {
    const configs: [string, (f: Fixture) => void][] = [
      ['core.autocrlf=true', (f) => f.g('config', 'core.autocrlf', 'true')],
      ['* text eol=crlf', (f) => f.write('.gitattributes', '* text eol=crlf\n')],
      ['a clean filter', (f) => {
        f.g('config', 'filter.up.clean', 'tr a-z A-Z')
        f.g('config', 'filter.up.smudge', 'cat')
        f.write('.gitattributes', '*.svg filter=up\n')
      }],
    ]
    it.each(configs)('reads an unchanged file as unchanged (%s)', T, async (_name, setup) => {
      fresh()
      setup(f)
      f.write('reqs/artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01' })))
      f.write('reqs/artifacts/files/AR-01.svg', '<svg>\r\none\r\n</svg>\r\n')
      f.commit('add')
      const svg = join(root(), 'artifacts/files/AR-01.svg')
      const h = await gitAssetHistory(svg)
      expect([h.dirty, h.working]).toEqual([false, h.head])
      // A sidecar-only edit is no change to the file in the Diff review.
      f.write('reqs/artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01', title: 'Renamed' })))
      const d = await catalogueDiff(root(), 'HEAD', WORKTREE)
      const r = d.records.find((x) => x.id === 'AR-01')!
      expect(r.kind === 'artifact' && r.fileBefore === r.fileAfter && !!r.fileAfter).toBe(true)
      // An uncommitted edit: the reported working name is served from the disk.
      f.write('reqs/artifacts/files/AR-01.svg', '<svg>\r\ntwo\r\n</svg>\r\n')
      const after = await gitAssetHistory(svg)
      expect(after.working).not.toBe(after.head)
      const res = fakeRes()
      const arts = { 'AR-01': { data: artifact({ id: 'AR-01' }), rev: '' } }
      expect(await serveHistoryBlob(root(), new URL(`http://x/history-blob/${after.working}?artifact=AR-01`), res, arts as never)).toBe(true)
      expect(res.body?.toString()).toBe('<svg>\r\ntwo\r\n</svg>\r\n')
    })
  })

  describe('R-73 · either hash width', () => {
    it('names working files and journal screenshots in the repository width, servable through the route', T, async () => {
      fresh()
      const width = format === 'sha256' ? 64 : 40
      f.write(`reqs/assets/${ID}/web.png`, 'one')
      f.write('reqs/artifacts/files/AR-01.svg', '<svg/>')
      f.commit('add')
      const asset = await gitAssetHistory(join(root(), 'artifacts/files/AR-01.svg'))
      expect([asset.head?.length, asset.working]).toEqual([width, asset.head])
      const journalDir = join(f.dir, '..', 'journal')
      const journal = createJournal(journalDir)
      const assets = join(root(), 'assets')
      journal.screenshots(assets)
      f.write(`reqs/assets/${ID}/web.png`, 'two')
      utimesSync(join(assets, ID, 'web.png'), new Date(Date.now() + 5000), new Date(Date.now() + 5000))
      journal.screenshots(assets)
      const change = journal.read(ID).flatMap((e) => e.changes).find((c) => c.field === 'screenshot')!
      const shas = [(change.from as { sha: string }).sha, (change.to as { sha: string }).sha]
      expect(shas.map((s) => s.length)).toEqual([width, width])
      for (const sha of shas) {
        const res = fakeRes()
        expect(await serveHistoryBlob(root(), new URL(`http://x/history-blob/${sha}?src=assets/${ID}/web.png`), res)).toBe(true)
      }
    })
  })

  describe('R-54 support · the deletion bound', () => {
    it('marks a committed deletion, and keeps both sides readable', T, async () => {
      fresh()
      f.write(`reqs/stories/${ID}.md`, card('Old mistaken card'))
      f.write(`reqs/assets/${ID}/web.png`, 'old0')
      f.write('reqs/artifacts/files/AR-01.svg', '<svg>old</svg>')
      f.commit('add')
      f.write(`reqs/assets/${ID}/web.png`, 'old1')
      f.commit('recapture old')
      f.rm(`reqs/stories/${ID}.md`)
      f.rm(`reqs/assets/${ID}`)
      f.rm('reqs/artifacts/files/AR-01.svg')
      const del = f.commit('delete')
      f.write(`reqs/stories/${ID}.md`, card('New card'))
      f.write(`reqs/assets/${ID}/web.png`, 'new0')
      f.write('reqs/artifacts/files/AR-01.svg', '<svg>new</svg>')
      f.commit('readd')
      f.write(`reqs/assets/${ID}/web.png`, 'new1')
      f.commit('recapture new')
      const h = await gitFileHistory(cardFile())
      expect(h.versions.map((v) => [v.commit.subject, v.item?.title ?? null, v.deleted ?? false])).toEqual([
        ['readd', 'New card', false],
        ['delete', null, true],
        ['add', 'Old mistaken card', false],
      ])
      const asset = await gitAssetHistory(join(root(), 'artifacts/files/AR-01.svg'))
      expect(asset.commits.map((c) => [c.commit.subject, c.deleted ?? false])).toEqual([
        ['readd', false],
        ['delete', true],
        ['add', false],
      ])
      const shots = await gitScreenshots(root(), ID)
      expect(shots.commits.map((c) => c.commit.subject)).toEqual(['recapture new', 'recapture old'])
      expect(shots.ended).toEqual([{ src: `assets/${ID}/web.png`, commit: del }])
    })

    it('keeps a restored record readable on both sides of its deletion', T, async () => {
      fresh()
      f.write(`reqs/stories/${ID}.md`, card('Kept'))
      f.commit('add')
      f.rm(`reqs/stories/${ID}.md`)
      const del = f.commit('delete')
      f.g('revert', '--no-edit', del)
      const h = await gitFileHistory(cardFile())
      expect(h.versions.map((v) => [v.item?.title ?? null, v.deleted ?? false])).toEqual([
        ['Kept', false],
        [null, true],
        ['Kept', false],
      ])
    })

    it('makes no bound for a branch switch or a stash that removes and restores the file', T, async () => {
      fresh()
      f.write('other.txt', 'x')
      f.commit('start')
      f.g('checkout', '-q', '-b', 'empty')
      f.g('checkout', '-q', 'main')
      f.write(`reqs/stories/${ID}.md`, card('Card'))
      f.commit('add')
      f.g('checkout', '-q', 'empty')
      f.g('checkout', '-q', 'main')
      f.rm(`reqs/stories/${ID}.md`)
      f.g('stash', '-q')
      f.g('stash', 'pop', '-q')
      f.g('checkout', '--', '.')
      const h = await gitFileHistory(cardFile())
      expect(h.versions.map((v) => [v.commit.subject, v.deleted ?? false])).toEqual([['add', false]])
    })

    it('bounds a rename-away and a deletion at one path, each as itself', T, async () => {
      fresh()
      const p = `reqs/stories/${ID}.md`
      f.write(p, card('First'))
      f.commit('first')
      f.g('mv', p, 'reqs/stories/US-02.md')
      f.commit('rename away')
      f.write(p, card('Second'))
      f.commit('second')
      f.rm(p)
      f.commit('delete second')
      f.write(p, card('Third'))
      f.commit('third')
      expect(subjects(await gitFileHistory(cardFile()))).toEqual(['third', 'delete second', 'second'])
      expect(subjects(await gitFileHistory(itemPath('US-02', root())))).toEqual(['first'])
    })
  })
})

describe.skipIf(!FORMATS.includes('sha256'))('B08-Q3 · journal hashes kept in the other width', () => {
  it('takes such a hash afresh in the repository width, logging no change', T, () => {
    const f = makeRepo('sha256')
    try {
      f.write(`reqs/assets/${ID}/web.png`, 'one')
      f.commit('add')
      const journalDir = join(f.dir, '..', 'journal')
      const png = join(f.dir, 'reqs', 'assets', ID, 'web.png')
      const st = statSync(png)
      // As a journal written before B08 left it: a SHA-1 name, the file's size and time.
      f.write(`../journal/${ID}.shots.json`, JSON.stringify({ 'web.png': { sha: createHash('sha1').update('blob 3\0one').digest('hex'), size: st.size, mtimeMs: st.mtimeMs } }))
      const journal = createJournal(journalDir)
      journal.screenshots(join(f.dir, 'reqs', 'assets'))
      expect(journal.read(ID)).toEqual([])
      const kept = JSON.parse(f.read(`../journal/${ID}.shots.json`)) as Record<string, { sha: string }>
      expect(kept['web.png']!.sha).toBe(f.g('rev-parse', `HEAD:reqs/assets/${ID}/web.png`).trim())
    } finally {
      f.cleanup()
    }
  })
})

describe.skipIf(!hasGit)('git history readers: locks, sharing and caches', () => {
  let f: Fixture
  let shim: ReturnType<typeof gitShim>
  beforeAll(() => {
    shim = gitShim()
  })
  afterAll(() => {
    shim.restore()
    f?.cleanup()
  })
  const fresh = () => {
    f?.cleanup()
    f = makeRepo('sha1')
    return f
  }
  const root = () => join(f.dir, 'reqs')
  const runs = (re: RegExp) => shim.calls().filter((c) => re.test(c)).length

  it('B08-Q6 · reading history never rewrites the index (no index.lock)', T, async () => {
    fresh()
    for (let i = 0; i < 40; i++) f.write(`reqs/stories/US-0${i}.md`, card(`C${i}`))
    f.commit('add')
    const later = new Date(Date.now() + 10_000)
    for (let i = 0; i < 40; i++) utimesSync(join(root(), 'stories', `US-0${i}.md`), later, later)
    const before = statSync(join(f.dir, '.git', 'index'))
    await gitDirty(join(root(), 'stories', 'US-00.md'))
    await gitFileHistory(join(root(), 'stories', 'US-01.md'))
    await gitAssetHistory(join(root(), 'stories', 'US-02.md'))
    const after = statSync(join(f.dir, '.git', 'index'))
    expect([after.ino, after.mtimeMs]).toEqual([before.ino, before.mtimeMs])
  })

  it('R-161 · a Diff count runs the whole-history rename log once', T, async () => {
    fresh()
    f.write(`reqs/stories/${ID}.md`, card('One'))
    f.write('reqs/artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01' })))
    f.commit('add')
    shim.reset()
    await createDiffReader(root()).count()
    expect(runs(/(^| )log .*diff-filter=R/)).toBe(1)
  })

  it('R-161 · caches uncommitted renames in a linked worktree until its index changes', T, async () => {
    fresh()
    f.write(`old/stories/${ID}.md`, card('One'))
    f.commit('add')
    const wt = f.worktree('lane')
    f.g('-C', wt, 'mv', 'old', 'reqs')
    const file = itemPath(ID, join(wt, 'reqs'))
    expect(subjects(await gitFileHistory(file))).toEqual(['add'])
    shim.reset()
    expect(subjects(await gitFileHistory(file))).toEqual(['add'])
    expect(runs(/(^| )diff .*diff-filter=R/)).toBe(0)
    f.write('reqs/stories/US-05.md', card('Five'), wt)
    f.g('-C', wt, 'add', '-A')
    shim.reset()
    await gitFileHistory(file)
    expect(runs(/(^| )diff .*diff-filter=R/)).toBe(1)
  })

  it('R-161 · a failed rename read is not kept', T, async () => {
    fresh()
    f.write(`old/stories/${ID}.md`, card('One'))
    f.commit('add')
    f.g('mv', 'old', 'reqs')
    f.commit('move')
    shim.failRenames(true)
    await gitFileHistory(itemPath(ID, root()))
    shim.failRenames(false)
    expect(subjects(await gitFileHistory(itemPath(ID, root())))).toEqual(['add'])
  })

  it('R-74 · a cached comparison reads the artifacts of today afresh, without repeating its git work', T, async () => {
    fresh()
    f.write(`reqs/stories/${ID}.md`, card('One'))
    f.write('reqs/artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01', title: 'Pricing' })))
    const a = f.commit('A')
    f.write(`reqs/stories/${ID}.md`, card('Two'))
    const b = f.commit('B')
    const reader = createDiffReader(root(), { watched: true })
    expect((await reader.diff(a, b)).context.artifacts).toEqual({ before: {}, after: {} })
    f.write('reqs/artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01', title: 'Prices' })))
    reader.touched()
    shim.reset()
    const again = await reader.diff(a, b)
    expect(shim.calls().filter((c) => /(^| )(diff|log|ls-tree|cat-file)( |$)/.test(c))).toEqual([])
    expect(again.context.artifacts!.before['AR-01']?.title).toBe('Pricing')
    expect(again.context.artifacts).toEqual((await catalogueDiff(root(), a, b)).context.artifacts)
  })

  it('R-162 · every history cache stays within its bound', T, async () => {
    fresh()
    const sizes = (gitHistory as unknown as { historyCacheSizes: () => Record<string, { size: number; max: number }> }).historyCacheSizes
    expect(typeof sizes).toBe('function')
    for (let i = 0; i < 12; i++) {
      f.write(`reqs/stories/${ID}.md`, card(`T${i}`))
      f.commit(`c${i}`)
      await gitFileHistory(itemPath(ID, root()))
      await gitScreenshots(root(), ID)
    }
    for (const [name, c] of Object.entries(sizes())) {
      expect(c.max, name).toBeLessThanOrEqual(4096)
      expect(c.size, name).toBeLessThanOrEqual(c.max)
    }
    expect(Object.keys(sizes())).toEqual(expect.arrayContaining(['files', 'assets', 'screenshots', 'renameLog', 'staged', 'hashes', 'blobChecks']))
  })

  it('serves a screenshot blob by src only if it was ever at that path', T, async () => {
    fresh()
    f.write(`reqs/assets/${ID}/web.png`, 'one')
    f.write('reqs/other.png', 'secret')
    f.commit('add')
    const secret = f.g('rev-parse', 'HEAD:reqs/other.png').trim()
    f.rm('reqs/other.png')
    f.commit('remove')
    const res = fakeRes()
    expect(await serveHistoryBlob(root(), new URL(`http://x/history-blob/${secret}?src=assets/${ID}/web.png`), res)).toBe(false)
  })

  it('B08-Q2 · serves a historical blob as a checkout would write it (smudge filter applied)', T, async () => {
    fresh()
    f.g('config', 'filter.up.clean', 'tr a-z A-Z')
    f.g('config', 'filter.up.smudge', 'tr A-Z a-z')
    f.write('.gitattributes', '*.svg filter=up\n')
    f.write('reqs/artifacts/files/AR-01.svg', '<svg>one</svg>')
    f.commit('add')
    const stored = f.g('rev-parse', 'HEAD:reqs/artifacts/files/AR-01.svg').trim()
    const res = fakeRes()
    const arts = { 'AR-01': { data: artifact({ id: 'AR-01' }), rev: '' } }
    expect(await serveHistoryBlob(root(), new URL(`http://x/history-blob/${stored}?artifact=AR-01`), res, arts as never)).toBe(true)
    expect(res.body?.toString()).toBe('<svg>one</svg>')
  })

  it('REQ-02.5 · a file name holding a newline gets its own history, never another file’s', T, async () => {
    fresh()
    f.write('reqs/artifacts/files/a\nb.svg', '<svg>1</svg>')
    f.write('reqs/artifacts/files/a.svg', '<svg>x</svg>')
    f.commit('add')
    f.write('reqs/artifacts/files/a\nb.svg', '<svg>2</svg>')
    f.commit('edit')
    const h = await gitAssetHistory(join(root(), 'artifacts/files/a\nb.svg'))
    expect(h.commits.map((c) => c.commit.subject)).toEqual(['edit', 'add'])
  })

  it('review · an untracked card reads as dirty even with status.showUntrackedFiles=no', T, async () => {
    fresh()
    f.write('other.txt', 'x')
    f.commit('start')
    f.g('config', 'status.showUntrackedFiles', 'no')
    f.write(`reqs/stories/${ID}.md`, card('New'))
    expect(await gitDirty(itemPath(ID, root()))).toBe(true)
    expect((await gitFileHistory(itemPath(ID, root()))).dirty).toBe(true)
  })

  it('review · an inherited GIT_DIR never points the readers at another repository', T, async () => {
    fresh()
    f.write(`reqs/stories/${ID}.md`, card('Mine'))
    f.commit('mine')
    const other = makeRepo('sha1', 'b08-other-')
    try {
      other.write('x.txt', 'x')
      other.commit('theirs')
      process.env.GIT_DIR = join(other.dir, '.git')
      expect(subjects(await gitFileHistory(itemPath(ID, root())))).toEqual(['mine'])
    } finally {
      delete process.env.GIT_DIR
      other.cleanup()
    }
  })

  it('review · a path holding the log separator byte reads as one file', T, async () => {
    fresh()
    const name = 'reqs/artifacts/files/a\x1eb.svg'
    f.write(name, '<svg>1</svg>')
    f.commit('add')
    f.write(name, '<svg>2</svg>')
    f.commit('edit')
    const h = await gitAssetHistory(join(f.dir, name))
    expect(h.commits.map((c) => [c.commit.subject, !!c.to])).toEqual([
      ['edit', true],
      ['add', true],
    ])
  })

  it('review · a working name follows a change to core.autocrlf without the file being touched', T, async () => {
    fresh()
    f.write('reqs/artifacts/files/AR-01.svg', '<svg>\r\none\r\n</svg>\r\n')
    f.commit('add')
    f.write('reqs/artifacts/files/AR-01.svg', '<svg>\r\ntwo\r\n</svg>\r\n')
    const file = join(root(), 'artifacts/files/AR-01.svg')
    const raw = (await gitAssetHistory(file)).working
    f.g('config', 'core.autocrlf', 'true')
    const converted = (await gitAssetHistory(file)).working
    expect(converted).not.toBe(raw)
    expect(converted).toBe(f.g('hash-object', 'reqs/artifacts/files/AR-01.svg').trim())
  })

  it('R-162 · a bounded cache evicts its least recently used entries', () => {
    const lru = new Lru<number>(3)
    for (let i = 0; i < 3; i++) lru.set(`k${i}`, i)
    lru.get('k0') // used most recently: k1 is now the oldest
    for (let i = 3; i < 200; i++) {
      lru.set(`k${i}`, i)
      expect(lru.size).toBeLessThanOrEqual(3)
      if (i === 3) expect([lru.get('k0'), lru.get('k1')]).toEqual([0, undefined])
    }
    expect([lru.get('k197'), lru.get('k198'), lru.get('k199'), lru.get('k0')]).toEqual([197, 198, 199, undefined])
  })

  it('reads the card files of no repository as no history', T, async () => {
    const dir = execFileSync('mktemp', ['-d'], { encoding: 'utf8' }).trim()
    expect(await gitFileHistory(join(dir, 'x.md'))).toMatchObject({ versions: [], dirty: false })
    execFileSync('rm', ['-rf', dir])
  })
})

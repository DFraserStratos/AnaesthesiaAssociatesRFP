/**
 * A reused ID's history starts with the new record (B05: R-54, REQ-20; accepted decisions 19 and 20).
 * Unit cases on the timeline, then end to end through the API with a journal and a real repository.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildArtifactTimeline, buildTimeline, type GitFileHistory, type GitVersion, type JournalEntry, type TimelineEntry } from '../shared/history.ts'
import type { Artifact, Item, Rev } from '../shared/types.ts'
import { createCatalogueApi } from '../server/catalogueApi.ts'
import { itemPath, writeItem } from '../server/catalogueFs.ts'
import { createJournal } from '../server/historyJournal.ts'
import { item } from './fixtures.ts'
import { hasGit } from './gitFixture.ts'

vi.setConfig({ testTimeout: 60_000 })

const at = (n: number) => new Date(Date.UTC(2026, 0, 1, n)).toISOString()
const commit = (n: number, sha = `c${n}`) => ({ sha, author: 'T', at: at(n), subject: `commit ${n}` })
const OLD = item({ id: 'US-01.1.1', title: 'Old mistaken card', description: 'Old.' })
const OLD2 = { ...OLD, title: 'Old mistaken card, edited' }
const NEW = item({ id: 'US-01.1.1', title: 'A new card' })
const v = (n: number, it: Item | null, deleted = false): GitVersion => ({ commit: commit(n), item: it, ...(deleted ? { deleted: true as const } : {}) })
const git = (versions: GitVersion[], working: Item | null = versions[0]?.item ?? null): GitFileHistory => ({ versions, dirty: false, working })
const titles = (entries: TimelineEntry[]) => entries.map((e) => (e.type === 'commit' ? `commit ${e.commit.subject}` : `${e.kind}${e.type === 'change' && e.commit ? ` @${e.commit.subject}` : ''}${e.type === 'change' && e.changes.length ? ` ${e.changes.map((c) => c.field).join(',')}` : ''}`))

describe('the timeline starts at the current life (unit)', () => {
  it('a committed deletion with a different record re-added: only the new record', () => {
    const t = buildTimeline([], git([v(4, NEW), v(3, null, true), v(2, OLD2), v(1, OLD)]))
    expect(titles(t)).toEqual(['created @commit 4'])
  })

  it('a committed deletion undone (the same record back): the history carries on', () => {
    const t = buildTimeline([], git([v(4, OLD2), v(3, null, true), v(2, OLD2), v(1, OLD)]))
    expect(titles(t)).toEqual(['changed @commit 2 title', 'created @commit 1'])
  })

  it('an ID reissued before the deletion was committed: the journal\'s created entry starts the life', () => {
    const journal: JournalEntry[] = [{ at: at(3), source: 'board', kind: 'created', rev: 'n', changes: [], item: NEW }]
    const t = buildTimeline(journal, git([v(4, NEW), v(2, OLD2), v(1, OLD)]))
    expect(titles(t)).toEqual(['commit commit 4', 'created'])
  })

  it('a created entry that reads as the version before it is a restore, not a new life', () => {
    const journal: JournalEntry[] = [{ at: at(3), source: 'disk', kind: 'created', rev: 'o', changes: [], item: OLD2 }]
    const t = buildTimeline(journal, git([v(2, OLD2), v(1, OLD)]))
    expect(titles(t)).toEqual(['created', 'changed @commit 2 title', 'created @commit 1'])
  })

  it('a commit in the same second as the create is the new record\'s (git dates have one-second resolution)', () => {
    const created = new Date(Date.UTC(2026, 0, 1, 3, 0, 0, 700)).toISOString()
    const journal: JournalEntry[] = [{ at: created, source: 'board', kind: 'created', rev: 'n', changes: [], item: NEW }]
    const sameSecond = { commit: { sha: 's', author: 'T', at: new Date(Date.UTC(2026, 0, 1, 3)).toISOString(), subject: 'same second' }, item: NEW }
    const t = buildTimeline(journal, git([sameSecond, v(2, OLD2), v(1, OLD)]))
    // Within one second the order follows the timestamps; what matters is that both are kept and nothing older is.
    expect(titles(t).sort()).toEqual(['commit same second', 'created'])
  })

  it('an older created entry with no record counts only when the board made it', () => {
    const board: JournalEntry[] = [{ at: at(3), source: 'board', kind: 'created', rev: 'n', changes: [] }]
    expect(titles(buildTimeline(board, git([v(2, OLD2), v(1, OLD)])))).toEqual(['created'])
    const disk: JournalEntry[] = [{ at: at(3), source: 'disk', kind: 'created', rev: 'n', changes: [] }]
    expect(titles(buildTimeline(disk, git([v(2, OLD2), v(1, OLD)])))).toEqual(['created', 'changed @commit 2 title', 'created @commit 1'])
  })

  it('journal lines and screenshot rewrites from before the start are left out', () => {
    const journal: JournalEntry[] = [
      { at: at(1), source: 'board', kind: 'changed', rev: 'a', changes: [{ field: 'title', from: 'x', to: 'Old mistaken card' }] },
      { at: at(3), source: 'disk', kind: 'created', rev: 'n', changes: [], item: NEW },
      { at: at(5), source: 'board', kind: 'changed', rev: 'b', changes: [{ field: 'title', from: 'A new card', to: 'Newer' }] },
    ]
    const shots = [{ commit: commit(2), files: [{ from: { src: 'assets/US-01.1.1/a.png', sha: '1' }, to: { src: 'assets/US-01.1.1/a.png', sha: '2' } }] }]
    const t = buildTimeline(journal, { ...git([v(2, OLD2), v(1, OLD)]), screenshots: shots })
    expect(titles(t)).toEqual(['changed title', 'created'])
  })

  it('an artifact ID reissued after a committed deletion: its sidecar and its file start afresh', () => {
    const a = (title: string) => ({ id: 'AR-05', title, kind: 'diagram', status: 'Current', supersededBy: null, date: null, author: '', components: [], sources: [], citedAs: [], file: 'artifacts/files/AR-05.svg', regions: [], steps: [], stepView: null, description: '', source: '', extra: {} }) as Artifact
    const sidecar: GitFileHistory<Artifact> = { versions: [{ commit: commit(4), item: a('New drawing') }, { commit: commit(3), item: null, deleted: true }, { commit: commit(1), item: a('Old drawing') }], dirty: false, working: a('New drawing') }
    const asset = { commits: [{ commit: commit(4), from: null, to: 'n1' }, { commit: commit(3), from: 'o1', to: null, deleted: true as const }, { commit: commit(1), from: null, to: 'o1' }], dirty: false, head: 'n1', working: 'n1' }
    expect(titles(buildArtifactTimeline(sidecar, asset))).toEqual(['created @commit 4'])
    // The same file restored under the same sidecar: everything carries on.
    const restored: GitFileHistory<Artifact> = { ...sidecar, versions: [{ commit: commit(4), item: a('Old drawing') }, ...sidecar.versions.slice(1)], working: a('Old drawing') }
    const back = { ...asset, commits: [{ commit: commit(4), from: null, to: 'o1' }, ...asset.commits.slice(1)] }
    // The removal and the return show as content changes; nothing earlier is cut.
    expect(titles(buildArtifactTimeline(restored, back)).at(-1)).toBe('created @commit 1')
  })
})

describe.skipIf(!hasGit)('a reused ID end to end: API, journal and git', () => {
  let base: string
  let repo: string
  let req: string
  let journalDir: string
  let now = 0
  const gitAt = (n: number, ...args: string[]) =>
    execFileSync('git', ['-c', 'user.name=T', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd: repo, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_DATE: at(n), GIT_COMMITTER_DATE: at(n), GIT_OPTIONAL_LOCKS: '0' } })
  const commitAt = (n: number, msg: string) => {
    gitAt(n, 'add', '-A')
    gitAt(n, 'commit', '-qm', msg)
  }
  const JSON_HEADERS = { 'content-type': 'application/json', host: 'localhost:5180' }
  const call = (a: ReturnType<typeof createCatalogueApi>, method: string, path: string, body?: unknown) => a.handle({ method, path, body, headers: JSON_HEADERS })
  const history = async (a: ReturnType<typeof createCatalogueApi>) => (await call(a, 'GET', '/api/items/US-01.1.1/history')) as { entries: TimelineEntry[] }
  const shows = (entries: TimelineEntry[], text: string) => JSON.stringify(entries).includes(text)

  beforeEach(() => {
    base = mkdtempSync(join(tmpdir(), 'reuse-'))
    repo = join(base, 'repo')
    req = join(repo, 'requirements')
    journalDir = join(base, 'journal')
    mkdirSync(req, { recursive: true })
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repo })
    writeItem(item({ id: 'EP-01', type: 'epic' }), req)
    writeItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }), req)
    writeItem(OLD, req)
    commitAt(1, 'old card')
    writeItem(OLD2, req)
    commitAt(2, 'old card edited')
  })
  afterEach(() => rmSync(base, { recursive: true, force: true }))
  const api = () => createCatalogueApi(req, () => {}, { journal: createJournal(journalDir, () => new Date(now)) })

  it('commit a card, delete it on the board, create a card that takes the ID, commit: History shows only the new card', async () => {
    const a = api()
    now = Date.parse(at(3))
    call(a, 'DELETE', '/api/items/US-01.1.1', { baseRev: a.getState().items['US-01.1.1']!.rev, ids: ['US-01.1.1'] })
    now = Date.parse(at(4))
    const made = call(a, 'POST', '/api/items', { type: 'story', parent: 'FT-01.1', title: 'A new card' }) as Rev<Item>
    expect(made.data.id).toBe('US-01.1.1')
    const before = await history(a)
    expect(shows(before.entries, 'Old mistaken card') || shows(before.entries, 'old card')).toBe(false)
    commitAt(5, 'new card') // git sees an edit: no deletion for B08's bound
    const after = await history(a)
    expect(titles(after.entries)).toEqual(['commit new card', 'created'])
  })

  it('a hand delete, committed, then a card created at the ID: the deletion bound cuts git, the create cuts the journal', async () => {
    const a = api()
    now = Date.parse(at(3))
    call(a, 'PUT', '/api/items/US-01.1.1', { patch: { notes: 'A journalled edit of the old card.' }, baseRev: a.getState().items['US-01.1.1']!.rev })
    rmSync(itemPath('US-01.1.1', req))
    a.syncFromDisk()
    commitAt(4, 'delete by hand')
    now = Date.parse(at(5))
    call(a, 'POST', '/api/items', { type: 'story', parent: 'FT-01.1', title: 'A new card' })
    const h = await history(a)
    expect(shows(h.entries, 'journalled edit')).toBe(false)
    expect(shows(h.entries, 'old card')).toBe(false)
    expect(titles(h.entries)).toEqual(['created'])
  })

  it('an agent re-creating the ID by hand as another card (committed deletion between): only the new card', async () => {
    const a = api()
    rmSync(itemPath('US-01.1.1', req))
    a.syncFromDisk()
    commitAt(3, 'delete by hand')
    now = Date.parse(at(4))
    writeFileSync(itemPath('US-01.1.1', req), readFileSync(itemPath('FT-01.1', req), 'utf8').replace(/^id: FT-01.1$/m, 'id: US-01.1.1').replace(/^type: feature$/m, 'type: story').replace(/^title: .*$/m, 'title: Agent card').replace(/^parent: .*$/m, 'parent: FT-01.1'))
    a.syncFromDisk()
    commitAt(5, 'agent card')
    const h = await history(a)
    expect(shows(h.entries, 'old card')).toBe(false)
    expect(titles(h.entries)).toEqual(['commit agent card', 'created'])
  })

  it('a file unreadable for one sync and then repaired with a change is no reappearance: its history stays', async () => {
    const a = api()
    const good = readFileSync(itemPath('US-01.1.1', req), 'utf8')
    writeFileSync(itemPath('US-01.1.1', req), good.replace('id: US-01.1.1', 'id: [broken'))
    a.syncFromDisk()
    expect(a.getState().items['US-01.1.1']).toBeUndefined()
    now = Date.parse(at(3))
    writeFileSync(itemPath('US-01.1.1', req), good.replace('Old.', 'Repaired, and reworded.'))
    a.syncFromDisk()
    const h = await history(a)
    expect(titles(h.entries).slice(-2)).toEqual(['changed @old card edited title', 'created @old card'])
  })

  it('a board delete undone by restoring the file: the history carries on', async () => {
    const a = api()
    now = Date.parse(at(3))
    call(a, 'DELETE', '/api/items/US-01.1.1', { baseRev: a.getState().items['US-01.1.1']!.rev, ids: ['US-01.1.1'] })
    gitAt(3, 'checkout', '--', 'requirements/stories/US-01.1.1.md')
    now = Date.parse(at(4))
    a.syncFromDisk()
    const h = await history(a)
    expect(titles(h.entries).slice(-2)).toEqual(['changed @old card edited title', 'created @old card'])
  })

  it('a committed deletion reverted: the history carries on', async () => {
    const a = api()
    rmSync(itemPath('US-01.1.1', req))
    a.syncFromDisk()
    commitAt(3, 'delete')
    gitAt(4, 'revert', '--no-edit', 'HEAD')
    a.syncFromDisk()
    const h = await history(a)
    expect(titles(h.entries).slice(-2)).toEqual(['changed @old card edited title', 'created @old card'])
  })
})

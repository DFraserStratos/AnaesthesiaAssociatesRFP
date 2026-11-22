/** The Diff review's git reading, on a throwaway repository: which commits and records it finds, and both versions of each. */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Each test drives real git processes; under a loaded machine 5 s is too short (B08: more git runs per read).
vi.setConfig({ testTimeout: 60_000 })
import { DiffRefError, catalogueCommits, catalogueDiff, classify, createDiffReader } from '../server/catalogueDiff.ts'
import { EMPTY_TREE, WORKTREE, isCommitRef, type DiffRecord } from '../shared/diff.ts'
import { countChanges, entriesOf, entryOf, pageRows } from '../shared/diffModel.ts'
import { serialiseArtifact, serialiseItem, serialiseQuestion } from '../shared/files.ts'
import type { Artifact } from '../shared/types.ts'
import { item, question } from './fixtures.ts'

const hasGit = (() => {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

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

let repo: string
let root: string
beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'catalogue-diff-'))
  root = join(repo, 'board', 'requirements')
})
afterEach(() => rmSync(repo, { recursive: true, force: true }))

describe('classify', () => {
  it('names records and nothing else (an artifact file is found through the sidecars that name it)', () => {
    expect(classify('stories/US-01.1.1.md')).toEqual({ kind: 'item', id: 'US-01.1.1' })
    expect(classify('questions/OQ-12.md')).toEqual({ kind: 'question', id: 'OQ-12' })
    expect(classify('artifacts/AR-03.md')).toEqual({ kind: 'artifact', id: 'AR-03' })
    expect(classify('artifacts/files/talk.md')).toBeNull()
    expect(classify('artifacts/README.md')).toBeNull()
    expect(classify('notes/2026-10-01.md')).toBeNull()
  })

  it('accepts SHA-1 and SHA-256 commit hashes, and nothing git could read as an option', () => {
    expect(isCommitRef('a'.repeat(40))).toBe(true)
    expect(isCommitRef('a'.repeat(64))).toBe(true)
    expect(isCommitRef('a'.repeat(65))).toBe(false)
    expect(isCommitRef('--output=x')).toBe(false)
  })
})

describe.skipIf(!hasGit)('catalogue diff', () => {
  const g = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'ignore' })
  const commit = (msg: string) => {
    g('add', '-A')
    g('-c', 'user.name=Tester', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', msg)
  }
  const write = (rel: string, text: string) => {
    mkdirSync(join(root, rel, '..'), { recursive: true })
    writeFileSync(join(root, rel), text)
  }
  const head = () => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()

  function seed() {
    g('init', '-q')
    write('stories/EP-01.md', serialiseItem(item({ id: 'EP-01', type: 'epic', title: 'Billing' })))
    write('stories/FT-01.1.md', serialiseItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', title: 'Invoices' })))
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it.' })))
    write('stories/US-01.1.2.md', serialiseItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, title: 'Void an invoice' })))
    write('questions/OQ-01.md', serialiseQuestion(question({ id: 'OQ-01' })))
    write('artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01' })))
    write('artifacts/files/AR-01.svg', '<svg>one</svg>')
    commit('Catalogue')
    mkdirSync(join(repo, 'app'), { recursive: true })
    writeFileSync(join(repo, 'app', 'main.ts'), 'code')
    commit('App only')
  }

  it('lists only the commits that changed records, newest first', async () => {
    seed()
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it by email.' })))
    commit('Edit a story')
    const r = await catalogueCommits(root)
    expect(r.available).toBe(true)
    expect(r.commits.map((c) => [c.subject, c.records])).toEqual([
      ['Edit a story', 1],
      ['Catalogue', 6],
    ])
  })

  it('finds edits, additions, removals, untracked files and a changed artifact file on disk', async () => {
    seed()
    const base = head()
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it by email.' })))
    write('stories/US-01.1.3.md', serialiseItem(item({ id: 'US-01.1.3', parent: 'FT-01.1', order: 3, title: 'Resend' })))
    rmSync(join(root, 'questions', 'OQ-01.md'))
    write('artifacts/files/AR-01.svg', '<svg>two</svg>')
    const d = await catalogueDiff(root, base, WORKTREE)
    expect(d.available).toBe(true)
    const byId = Object.fromEntries(d.records.map((r) => [r.id, r]))
    expect(Object.keys(byId).sort()).toEqual(['AR-01', 'OQ-01', 'US-01.1.1', 'US-01.1.3'])
    const story = byId['US-01.1.1']!
    expect(story.kind === 'item' && [story.before?.description, story.after?.description]).toEqual(['Sends it.', 'Sends it by email.'])
    expect(byId['US-01.1.3']!.before).toBeNull()
    expect(byId['OQ-01']!.after).toBeNull()
    const art = byId['AR-01']!
    expect(art.kind === 'artifact' && art.fileBefore && art.fileAfter && art.fileBefore !== art.fileAfter).toBe(true)
    // The unchanged feature and epic come along as context, to place the cards.
    expect(Object.keys(d.context.after).sort()).toEqual(['EP-01', 'FT-01.1'])
  })

  it('compares two commits, and leaves out a file rewritten to the same record', async () => {
    seed()
    const base = head()
    write('stories/US-01.1.2.md', serialiseItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, title: 'Void an invoice' })) + '\n')
    write('stories/FT-01.1.md', serialiseItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', title: 'Invoices and receipts' })))
    commit('Rename feature')
    const d = await catalogueDiff(root, base, head())
    expect(d.records.map((r) => r.id)).toEqual(['FT-01.1'])
    expect(d.to).toBe(head())
  })

  it('reads a first commit against the empty tree as all added, and refuses a ref that is not a commit', async () => {
    seed()
    const first = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
    const d = await catalogueDiff(root, EMPTY_TREE, first)
    expect(d.records).toHaveLength(6)
    expect(d.records.every((r) => r.before === null)).toBe(true)
    await expect(catalogueDiff(root, '--output=x', WORKTREE)).rejects.toBeInstanceOf(DiffRefError)
    await expect(catalogueDiff(root, 'abcdef1', WORKTREE)).rejects.toBeInstanceOf(DiffRefError)
  })

  it('orders the page as the Mapped view: epic, feature, then its stories, unchanged parents as headings', async () => {
    seed()
    const base = head()
    write('stories/US-01.1.2.md', serialiseItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, title: 'Void an invoice', description: 'Voids it.' })))
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it now.' })))
    write('questions/OQ-01.md', serialiseQuestion(question({ id: 'OQ-01', answer: 'Yes' })))
    const d = await catalogueDiff(root, base, WORKTREE)
    const rows = pageRows(entriesOf(d), { context: d.context, lanes: [], questionOrder: ['1', '2'] })
    expect(rows.map((r) => (r.row === 'heading' ? `h:${r.item.id}` : r.row === 'card' ? r.entry.id : `s:${r.title}`))).toEqual(['h:EP-01', 'h:FT-01.1', 'US-01.1.1', 'US-01.1.2', 's:Outstanding items', 'OQ-01'])
  })

  const ids = (records: DiffRecord[]) => records.map((r) => r.id).sort()
  const shape = (r: DiffRecord) => `${r.id} ${r.before ? 'B' : '-'}${r.after ? 'A' : '-'}`

  it('compares artifact files wherever the sidecar puts them: notes, and paths from the repository', async () => {
    seed()
    write('artifacts/AR-02.md', serialiseArtifact(artifact({ id: 'AR-02', kind: 'note', file: 'notes/2026-10-01-meeting.md' })))
    write('notes/2026-10-01-meeting.md', '# Meeting\n\nOne.\n')
    write('artifacts/AR-03.md', serialiseArtifact(artifact({ id: 'AR-03', file: '/docs/AR-03.svg' })))
    mkdirSync(join(repo, 'docs'), { recursive: true })
    writeFileSync(join(repo, 'docs', 'AR-03.svg'), '<svg>one</svg>')
    write('notes/README.md', 'Not an artifact.')
    commit('Notes')
    const base = head()
    write('notes/2026-10-01-meeting.md', '# Meeting\n\nTwo.\n')
    writeFileSync(join(repo, 'docs', 'AR-03.svg'), '<svg>two</svg>')
    write('notes/README.md', 'Still not an artifact.')
    const d = await catalogueDiff(root, base, WORKTREE)
    expect(ids(d.records)).toEqual(['AR-02', 'AR-03'])
    for (const r of d.records) expect(r.kind === 'artifact' && r.fileBefore && r.fileAfter && r.fileBefore !== r.fileAfter).toBe(true)
    commit('Edit the files only')
    expect(ids((await catalogueDiff(root, base, head())).records)).toEqual(['AR-02', 'AR-03'])
    const c = await catalogueCommits(root)
    expect(c.commits.map((x) => [x.subject, x.records])).toEqual([
      ['Edit the files only', 2],
      ['Notes', 2],
      ['Catalogue', 6],
    ])
  })

  it('reads a file from the repository when REPO_ROOT names it through a link (B01 discovered row, owner B09)', async () => {
    seed()
    write('artifacts/AR-03.md', serialiseArtifact(artifact({ id: 'AR-03', file: '/docs/AR-03.svg' })))
    mkdirSync(join(repo, 'docs'), { recursive: true })
    writeFileSync(join(repo, 'docs', 'AR-03.svg'), '<svg>one</svg>')
    commit('Docs drawing')
    const base = head()
    writeFileSync(join(repo, 'docs', 'AR-03.svg'), '<svg>two</svg>')
    const link = `${repo}-link`
    symlinkSync(repo, link)
    const was = process.env.REPO_ROOT
    process.env.REPO_ROOT = link
    try {
      const d = await catalogueDiff(root, base, WORKTREE)
      const r = d.records.find((x) => x.id === 'AR-03')
      expect(r?.kind === 'artifact' && r.fileBefore && r.fileAfter && r.fileBefore !== r.fileAfter).toBe(true)
    } finally {
      if (was === undefined) delete process.env.REPO_ROOT
      else process.env.REPO_ROOT = was
      rmSync(link, { force: true })
    }
  })

  it('counts a file named for nothing with the sidecar that names it, not as a record of its own', async () => {
    seed()
    write('artifacts/AR-02.md', serialiseArtifact(artifact({ id: 'AR-02', kind: 'transcript', file: 'artifacts/files/Meeting with the client.md' })))
    write('artifacts/files/Meeting with the client.md', 'Hello.')
    commit('Transcript')
    expect((await catalogueCommits(root)).commits[0]).toMatchObject({ subject: 'Transcript', records: 1 })
  })

  it('reads paths git would quote: accents, quotes, backslashes', async () => {
    seed()
    write('artifacts/AR-02.md', serialiseArtifact(artifact({ id: 'AR-02', file: 'artifacts/files/café "x".svg' })))
    write('artifacts/files/café "x".svg', '<svg>one</svg>')
    commit('Accents')
    const base = head()
    write('artifacts/files/café "x".svg', '<svg>two</svg>')
    write('artifacts/AR-04.md', serialiseArtifact(artifact({ id: 'AR-04', file: 'artifacts/files/new ü.svg' })))
    write('artifacts/files/new ü.svg', '<svg>new</svg>')
    const d = await catalogueDiff(root, base, WORKTREE)
    expect(ids(d.records)).toEqual(['AR-02', 'AR-04'])
    commit('Edit')
    expect((await catalogueCommits(root)).commits[0]).toMatchObject({ subject: 'Edit', records: 2 })
  })

  it('never fails the comparison over a file path that steps outside the repository', async () => {
    seed()
    const base = head()
    write('artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01', file: '../../../outside.svg' })))
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', images: [{ src: '../../../x.png', alt: '', app: 'web' }] as never })))
    commit('Bad paths')
    const bad = head()
    for (const [a, b] of [
      [base, bad],
      [bad, base],
      [bad, WORKTREE],
    ] as const) {
      const d = await catalogueDiff(root, a, b)
      expect(d.available).toBe(true)
    }
    const d = await catalogueDiff(root, base, bad)
    const art = d.records.find((r) => r.id === 'AR-01')!
    expect(art.kind === 'artifact' && art.fileAfter).toBeNull()
  })

  it('reports a record that does not parse as unreadable, never as added or removed', async () => {
    seed()
    const base = head()
    write('stories/US-01.1.1.md', '---\nid: US-01.1.1\nstatus: [unclosed\n---\nBroken\n')
    write('questions/OQ-01.md', 'not a catalogue file at all')
    const d = await catalogueDiff(root, base, WORKTREE)
    const story = d.records.find((r) => r.id === 'US-01.1.1')!
    expect(story.before).not.toBeNull()
    expect(story.after).toBeNull()
    expect(story.afterError).toBeTruthy()
    expect(story.afterText).toContain('Broken')
    expect(story.beforeError).toBeUndefined()
    const e = entryOf(story)
    expect([e.change, e.unreadable, e.minor]).toEqual(['edited', 'after', false])
    // Broken on both sides, and changed: still listed.
    commit('Break them')
    const broken = head()
    write('stories/US-01.1.1.md', '---\nid: US-01.1.1\nstatus: [still unclosed\n---\nBroken\n')
    const both = (await catalogueDiff(root, broken, WORKTREE)).records
    expect(both.map(shape)).toEqual(['US-01.1.1 --'])
    expect(entryOf(both[0]!)).toMatchObject({ change: 'edited', unreadable: 'both', title: 'US-01.1.1', type: 'story' })
    // Broken the same on both sides: no change.
    expect((await catalogueDiff(root, broken, broken)).records).toEqual([])
  })

  it("still compares an artifact's file when its details do not parse, by the file they name", async () => {
    seed()
    write('artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01' })).replace(/^---\n/, '---\ntitle: [unclosed\n'))
    write('artifacts/files/AR-01.svg', '<svg>two</svg>')
    const d = await catalogueDiff(root, head(), WORKTREE)
    const r = d.records.find((x) => x.id === 'AR-01')!
    expect(r.kind === 'artifact' && [r.afterError != null, r.fileNameAfter, !!r.fileBefore, !!r.fileAfter, r.fileBefore !== r.fileAfter]).toEqual([true, 'artifacts/files/AR-01.svg', true, true, true])
  })

  it('sends the artifacts that read differently at a side, slimmed, so their names and citations hold', async () => {
    seed()
    write('artifacts/AR-02.md', serialiseArtifact(artifact({ id: 'AR-02', description: 'Long words.', citedAs: [{ as: 'Old spec', pageOffset: null, within: null, spot: null }] })))
    write('artifacts/files/AR-02.svg', '<svg/>')
    commit('Add a cited artifact')
    const was = head()
    rmSync(join(root, 'artifacts', 'AR-02.md'))
    commit('Remove it')
    const d = await catalogueDiff(root, was, head())
    expect(Object.keys(d.context.artifacts!.before)).toEqual(['AR-02'])
    expect(d.context.artifacts!.before['AR-02']).toMatchObject({ title: 'Artifact AR-02', description: '', citedAs: [{ as: 'Old spec' }] })
    expect(d.context.artifacts!.after).toEqual({})
  })

  it('lists merges along first parents, each commit with its parent, and HEAD', async () => {
    seed()
    const main = execFileSync('git', ['branch', '--show-current'], { cwd: repo, encoding: 'utf8' }).trim()
    g('checkout', '-q', '-b', 'side')
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Side.' })))
    commit('Side edit')
    g('checkout', '-q', main)
    write('stories/US-01.1.2.md', serialiseItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, title: 'Void an invoice', description: 'Main.' })))
    commit('Main edit')
    const mainEdit = head()
    g('-c', 'user.name=Tester', '-c', 'user.email=t@example.com', 'merge', '-q', '--no-ff', 'side', '-m', 'Merge side')
    const c = await catalogueCommits(root)
    expect(c.head).toBe(head())
    expect(c.commits.map((x) => [x.subject, x.records])).toEqual([
      ['Merge side', 1],
      ['Main edit', 1],
      ['Catalogue', 6],
    ])
    expect(c.commits[0]!.parent).toBe(mainEdit)
    expect(c.commits[2]!.parent).toBeNull()
    // What the merge brought in, against its first parent.
    expect((await catalogueDiff(root, c.commits[0]!.parent!, c.commits[0]!.sha)).records.map((r) => r.id)).toEqual(['US-01.1.1'])
    expect((await catalogueDiff(root, 'HEAD', WORKTREE)).records).toEqual([])
  })

  it('follows the folder through a move: earlier commits listed, a pure move no change', async () => {
    const oldRoot = join(repo, 'docs', 'requirements')
    root = oldRoot
    seed()
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Edited.' })))
    commit('Edit before the move')
    const beforeMove = head()
    mkdirSync(join(repo, 'board'), { recursive: true })
    renameSync(oldRoot, join(repo, 'board', 'requirements'))
    root = join(repo, 'board', 'requirements')
    commit('Move the catalogue')
    const moved = head()
    const c = await catalogueCommits(root)
    expect(c.commits.map((x) => x.subject)).toEqual(['Edit before the move', 'Catalogue'])
    expect((await catalogueDiff(root, beforeMove, moved)).records).toEqual([])
    write('stories/US-01.1.2.md', serialiseItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, title: 'Void an invoice', description: 'After the move.' })))
    const first = c.commits[1]!.sha
    const d = await catalogueDiff(root, first, WORKTREE)
    expect(d.records.map(shape).sort()).toEqual(['US-01.1.1 BA', 'US-01.1.2 BA'])
    expect(Object.keys(d.context.before).sort()).toEqual(['EP-01', 'FT-01.1'])
  })

  it('follows a move that also renamed a record folder: the move shows only real edits, earlier changes show', async () => {
    // Before: docs/catalogue with the cards in items/ and the artifact's file beside its sidecar.
    root = join(repo, 'docs', 'catalogue')
    g('init', '-q')
    write('items/EP-01.md', serialiseItem(item({ id: 'EP-01', type: 'epic', title: 'Billing' })))
    write('items/FT-01.1.md', serialiseItem(item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', title: 'Invoices' })))
    write('items/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it.' })))
    write('questions/OQ-01.md', serialiseQuestion(question({ id: 'OQ-01' })))
    write('artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01', file: 'artifacts/AR-01.svg' })))
    write('artifacts/AR-01.svg', '<svg>one</svg>')
    commit('Catalogue')
    write('items/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it by email.' })))
    commit('Edit before the move')
    const edited = head()
    // The move: the folder to board/requirements, items/ to stories/, the file into files/ (its sidecar says so).
    mkdirSync(join(repo, 'board'), { recursive: true })
    renameSync(root, join(repo, 'board', 'requirements'))
    root = join(repo, 'board', 'requirements')
    renameSync(join(root, 'items'), join(root, 'stories'))
    mkdirSync(join(root, 'artifacts', 'files'))
    renameSync(join(root, 'artifacts', 'AR-01.svg'), join(root, 'artifacts', 'files', 'AR-01.svg'))
    write('artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01' })))
    commit('Move the catalogue')
    const moved = head()

    const c = await catalogueCommits(root)
    expect(c.commits.map((x) => [x.subject, x.records])).toEqual([
      ['Move the catalogue', 1],
      ['Edit before the move', 1],
      ['Catalogue', 5],
    ])
    // The move: only the sidecar's new file path, the file itself the same.
    const m = await catalogueDiff(root, edited, moved)
    expect(m.records.map(shape)).toEqual(['AR-01 BA'])
    const art = m.records[0]!
    expect(art.kind === 'artifact' && art.fileBefore && art.fileBefore === art.fileAfter).toBe(true)
    // Before the move, the card's edit is there, read at the old folders.
    const e = await catalogueDiff(root, c.commits[2]!.sha, edited)
    expect(e.records.map(shape)).toEqual(['US-01.1.1 BA'])
    expect(Object.keys(e.context.before).sort()).toEqual(['EP-01', 'FT-01.1'])
    // And from before the move to the disk, cards are edited, never all added.
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it by post.' })))
    const d = await catalogueDiff(root, edited, WORKTREE)
    expect(d.records.map(shape).sort()).toEqual(['AR-01 BA', 'US-01.1.1 BA'])
  })

  it('leaves out a commit that only renumbered statuses, and counts each listed commit as picking it shows', async () => {
    seed()
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it.', status: '7' })))
    write('status-recodes.json', JSON.stringify([{ date: '2026-11-01', items: { '1': '7' }, questions: {} }]))
    commit('Renumber statuses')
    write('stories/US-01.1.2.md', serialiseItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, title: 'Void an invoice', description: 'Voids it.' })))
    commit('Edit a story')
    const reader = createDiffReader(root)
    const c = await reader.commits()
    expect(c.commits.map((x) => [x.subject, x.records])).toEqual([
      ['Edit a story', 1],
      ['Catalogue', 6],
    ])
    for (const x of c.commits) expect(entriesOf(await reader.diff(x.parent ?? EMPTY_TREE, x.sha))).toHaveLength(x.records)
    // With nothing on disk, the default shows the last commit that changed a record.
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it.', status: '7' })))
    const auto = await reader.auto()
    expect(auto.jumped).toBe(true)
    expect(auto.records.map((r) => r.id)).toEqual(['US-01.1.2'])
  })

  it('works in a SHA-256 repository', async () => {
    try {
      execFileSync('git', ['init', '-q', '--object-format=sha256'], { cwd: repo, stdio: 'ignore' })
    } catch {
      return // this git cannot make one
    }
    write('stories/EP-01.md', serialiseItem(item({ id: 'EP-01', type: 'epic', title: 'Billing' })))
    write('artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01' })))
    write('artifacts/files/AR-01.svg', '<svg>one</svg>')
    commit('First')
    const c = await catalogueCommits(root)
    expect(c.commits[0]!.sha).toHaveLength(64)
    expect((await catalogueDiff(root, EMPTY_TREE, c.commits[0]!.sha)).records).toHaveLength(2)
    // An unchanged file on disk names the same blob as the commit.
    write('stories/EP-01.md', serialiseItem(item({ id: 'EP-01', type: 'epic', title: 'Billing and more' })))
    const d = await catalogueDiff(root, c.commits[0]!.sha, WORKTREE)
    expect(d.records.map((r) => r.id)).toEqual(['EP-01'])
  })

  it("reads statuses as today's codes, so a renumbering is no change and a real status change still is", async () => {
    seed()
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it.', status: '7' })))
    write('stories/US-01.1.2.md', serialiseItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, title: 'Void an invoice', status: '2' })))
    write('status-recodes.json', JSON.stringify([{ date: '2026-11-01', items: { '1': '7' }, questions: {} }]))
    const d = await catalogueDiff(root, head(), WORKTREE)
    expect(d.records.map((r) => r.id)).toEqual(['US-01.1.2'])
    const r = d.records[0]!
    expect(r.kind === 'item' && [r.before?.status, r.after?.status]).toEqual(['7', '2'])
  })

  it('reads a version saved after a recode as stored, and still reports a later real move (R-07)', async () => {
    seed()
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it.', status: '7' })))
    write('status-recodes.json', JSON.stringify([{ date: '2026-11-01', items: { '1': '7' }, questions: {} }]))
    commit('Renumber statuses')
    const after = head()
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it.', status: '2' })))
    commit('A real move')
    const d = await catalogueDiff(root, after, head())
    expect(d.records.map((r) => r.id)).toEqual(['US-01.1.1'])
    const r = d.records[0]!
    expect(r.kind === 'item' && [r.before?.status, r.after?.status]).toEqual(['7', '2'])
  })

  it("gives each screenshot its blob on both sides when a card's pictures change", async () => {
    seed()
    const shot = (name: string) => ({ src: `assets/US-01.1.1/${name}.png`, viewport: 'desktop' as const })
    write('assets/US-01.1.1/a.png', 'picture a')
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it.', images: [shot('a')] })))
    commit('A picture')
    const base = head()
    write('assets/US-01.1.1/b.png', 'picture b')
    write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it.', images: [shot('a'), shot('b')] })))
    const [r] = (await catalogueDiff(root, base, WORKTREE)).records
    expect(r?.kind).toBe('item')
    const images = r?.kind === 'item' ? r.images : undefined
    const blob = (path: string) => execFileSync('git', ['hash-object', join(root, path)], { encoding: 'utf8' }).trim()
    expect(images).toEqual({
      before: { 'assets/US-01.1.1/a.png': blob('assets/US-01.1.1/a.png') },
      after: { 'assets/US-01.1.1/a.png': blob('assets/US-01.1.1/a.png'), 'assets/US-01.1.1/b.png': blob('assets/US-01.1.1/b.png') },
    })
  })

  it('shows both files of an artifact whose file changed type', async () => {
    seed()
    const base = head()
    rmSync(join(root, 'artifacts', 'files', 'AR-01.svg'))
    write('artifacts/files/AR-01.png', 'png bytes')
    write('artifacts/AR-01.md', serialiseArtifact(artifact({ id: 'AR-01', kind: 'screenshot', file: 'artifacts/files/AR-01.png' })))
    const [r] = (await catalogueDiff(root, base, WORKTREE)).records
    if (r?.kind !== 'artifact') throw new Error('expected the artifact')
    const blob = (text: string) => execFileSync('git', ['hash-object', '--stdin'], { input: text, encoding: 'utf8' }).trim()
    expect([r.before?.file, r.after?.file, r.fileBefore, r.fileAfter]).toEqual(['artifacts/files/AR-01.svg', 'artifacts/files/AR-01.png', blob('<svg>one</svg>'), blob('png bytes')])
    const [e] = entriesOf({ records: [r] })
    expect([e?.kind === 'artifact' && e.fileChanged, e?.minor, e?.changes.map((c) => c.field)]).toEqual([true, false, ['kind', 'file']])
  })

  describe('the dev server reader', () => {
    it('lists a new commit as soon as HEAD moves, without being told', async () => {
      seed()
      const r = createDiffReader(root, { watched: true })
      expect((await r.commits()).commits.map((c) => c.subject)).toEqual(['Catalogue'])
      write('questions/OQ-01.md', serialiseQuestion(question({ id: 'OQ-01', answer: 'Yes' })))
      commit('Answer')
      const now = await r.commits()
      expect(now.commits.map((c) => c.subject)).toEqual(['Answer', 'Catalogue'])
      expect(now.head).toBe(head())
      expect(await r.count()).toEqual({ available: true, count: 0 })
    })


    it('counts what a reader would notice, minor changes left out', async () => {
      seed()
      write('stories/US-01.1.1.md', serialiseItem(item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it by email.' })))
      write('stories/US-01.1.2.md', serialiseItem(item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 5, title: 'Void an invoice' })))
      const r = createDiffReader(root)
      expect(await r.count()).toEqual({ available: true, count: 1 })
      expect(countChanges(await r.diff('HEAD', WORKTREE))).toBe(1)
    })

    it('keeps a comparison with the disk until told the files changed, and shares requests in flight', async () => {
      seed()
      const r = createDiffReader(root, { watched: true })
      const [a, b] = await Promise.all([r.diff('HEAD', WORKTREE), r.diff('HEAD', WORKTREE)])
      expect(a).toBe(b)
      write('questions/OQ-01.md', serialiseQuestion(question({ id: 'OQ-01', answer: 'Yes' })))
      expect(await r.diff('HEAD', WORKTREE)).toBe(a) // not told yet
      r.touched()
      expect((await r.diff('HEAD', WORKTREE)).records.map((x) => x.id)).toEqual(['OQ-01'])
      // A commit moves HEAD: a new comparison, without being told.
      commit('Answer')
      expect((await r.diff('HEAD', WORKTREE)).records).toEqual([])
    })

    it('reads the disk afresh each time when nothing reports its changes', async () => {
      seed()
      const r = createDiffReader(root)
      expect((await r.diff('HEAD', WORKTREE)).records).toEqual([])
      write('questions/OQ-01.md', serialiseQuestion(question({ id: 'OQ-01', answer: 'Yes' })))
      expect((await r.diff('HEAD', WORKTREE)).records.map((x) => x.id)).toEqual(['OQ-01'])
    })

    it('defaults to HEAD against the disk, else what the last catalogue commit changed', async () => {
      seed()
      const r = createDiffReader(root)
      const jumped = await r.auto()
      expect(jumped.jumped).toBe(true)
      expect(jumped.from).toBe(EMPTY_TREE) // the catalogue's first commit has no parent
      expect(jumped.records).toHaveLength(6)
      write('questions/OQ-01.md', serialiseQuestion(question({ id: 'OQ-01', answer: 'Yes' })))
      const now = await r.auto()
      expect([now.jumped, now.from, now.to, now.records.map((x) => x.id)]).toEqual([false, head(), WORKTREE, ['OQ-01']])
    })

    it('reads a repository with no commits yet as everything new', async () => {
      g('init', '-q')
      write('stories/EP-01.md', serialiseItem(item({ id: 'EP-01', type: 'epic', title: 'Billing' })))
      const r = createDiffReader(root)
      expect(await r.count()).toEqual({ available: true, count: 1 })
      expect(await r.commits()).toEqual({ available: true, commits: [], head: null })
      const a = await r.auto()
      expect([a.jumped, a.from, a.records.length]).toEqual([false, EMPTY_TREE, 1])
    })
  })

  it('reads a folder outside git as nothing to compare', async () => {
    mkdirSync(root, { recursive: true })
    expect(await catalogueCommits(root)).toEqual({ available: false, commits: [], head: null })
    expect((await catalogueDiff(root, 'HEAD', WORKTREE)).available).toBe(false)
  })
})

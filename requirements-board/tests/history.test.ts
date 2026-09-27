/** Card history: field diffs, line diffs, collapsing runs, and the journal + git timeline merge. */
import { describe, expect, it } from 'vitest'
import { buildTimeline, collapse, diffItems, lineDiff, type GitFileHistory, type JournalEntry } from '../shared/history.ts'
import { item } from './fixtures.ts'

const at = (min: number) => new Date(Date.UTC(2026, 8, 28, 9, min)).toISOString()
const noGit: GitFileHistory = { versions: [], dirty: false, working: null }

describe('diffItems', () => {
  it('names only the fields that changed, in display order', () => {
    const a = item({ id: 'US-01.1.1', title: 'Old', parent: 'FT-01.1', sources: ['RFP p.1'] })
    const b = { ...a, sources: ['RFP p.1', 'RFP p.2'], title: 'New', parent: 'FT-01.2' }
    expect(diffItems(a, b)).toEqual([
      { field: 'title', from: 'Old', to: 'New' },
      { field: 'parent', from: 'FT-01.1', to: 'FT-01.2' },
      { field: 'sources', from: ['RFP p.1'], to: ['RFP p.1', 'RFP p.2'] },
    ])
    expect(diffItems(a, { ...a })).toEqual([])
  })
})

describe('lineDiff', () => {
  it('keeps common lines and marks the rest', () => {
    expect(lineDiff('a\nb\nc', 'a\nx\nc\nd')).toEqual([
      { op: 'same', text: 'a' },
      { op: 'del', text: 'b' },
      { op: 'add', text: 'x' },
      { op: 'same', text: 'c' },
      { op: 'add', text: 'd' },
    ])
    expect(lineDiff('', 'new')).toEqual([{ op: 'add', text: 'new' }])
  })
})

describe('collapse', () => {
  const drag = (min: number, from: unknown, to: unknown): JournalEntry => ({ at: at(min), source: 'board', kind: 'position', changes: [{ field: 'position', from, to }] })
  it('merges a run of drags into one, from the first start to the last end', () => {
    const out = collapse([drag(0, null, { x: 1, y: 1 }), drag(2, { x: 1, y: 1 }, { x: 5, y: 5 })])
    expect(out).toHaveLength(1)
    expect(out[0]!.changes[0]).toEqual({ field: 'position', from: null, to: { x: 5, y: 5 } })
  })
  it('keeps drags far apart separate, and drops a run that ended where it began', () => {
    expect(collapse([drag(0, null, { x: 1, y: 1 }), drag(30, { x: 1, y: 1 }, { x: 2, y: 2 })])).toHaveLength(2)
    expect(collapse([drag(0, null, { x: 1, y: 1 }), drag(1, { x: 1, y: 1 }, null)])).toEqual([])
  })
})

describe('buildTimeline', () => {
  const v1 = item({ id: 'US-01.1.1', title: 'First' })
  const v2 = { ...v1, title: 'Second' }
  const commit = (sha: string, min: number, subject: string) => ({ sha, author: 'D', at: at(min), subject })

  it('shows old commits as field diffs, newer ones as dividers, newest first', () => {
    const git: GitFileHistory = {
      versions: [
        { commit: commit('c3', 40, 'Later'), item: { ...v2, notes: 'n' } },
        { commit: commit('c2', 10, 'Retitle'), item: v2 },
        { commit: commit('c1', 0, 'Add'), item: v1 },
      ],
      dirty: false,
      working: { ...v2, notes: 'n' },
    }
    const journal: JournalEntry[] = [{ at: at(30), source: 'board', kind: 'changed', changes: [{ field: 'notes', from: '', to: 'n' }] }]
    const t = buildTimeline(journal, git)
    expect(t.map((e) => (e.type === 'commit' ? `commit ${e.commit.sha}` : `${e.source} ${e.kind}`))).toEqual(['commit c3', 'board changed', 'git changed', 'git created'])
    const retitle = t[2]!
    expect(retitle.type === 'change' && retitle.changes).toEqual([{ field: 'title', from: 'First', to: 'Second' }])
  })

  it('marks journal entries since the last commit as not committed yet', () => {
    const git: GitFileHistory = { versions: [{ commit: commit('c1', 0, 'Add'), item: v1 }], dirty: true, working: v2 }
    const t = buildTimeline([{ at: at(5), source: 'board', kind: 'changed', changes: [{ field: 'title', from: 'First', to: 'Second' }] }], git)
    expect(t[0]).toMatchObject({ source: 'board', uncommitted: true })
    expect(t).toHaveLength(2)
  })

  it('adds a "not committed yet" entry for edits the journal never saw', () => {
    const git: GitFileHistory = { versions: [{ commit: commit('c1', 0, 'Add'), item: v1 }], dirty: true, working: v2, mtime: at(3) }
    const t = buildTimeline([], git)
    expect(t[0]).toMatchObject({ type: 'change', source: 'disk', uncommitted: true, changes: [{ field: 'title', from: 'First', to: 'Second' }] })
  })

  it('works with no git at all', () => {
    expect(buildTimeline([{ at: at(0), source: 'board', kind: 'created', changes: [] }], noGit)).toHaveLength(1)
  })
})

describe('buildTimeline and Freeform drags', () => {
  it('marks a drag not committed yet only when board-layout.json is dirty', () => {
    const drag: JournalEntry = { at: at(5), source: 'board', kind: 'position', changes: [{ field: 'position', from: null, to: { x: 1, y: 1 } }] }
    const git = (layoutDirty: boolean): GitFileHistory => ({ versions: [{ commit: { sha: 'c1', author: 'D', at: at(0), subject: 'Add' }, item: item({ id: 'US-01.1.1' }) }], dirty: false, working: null, layoutDirty })
    expect(buildTimeline([drag], git(true))[0]).toMatchObject({ uncommitted: true })
    expect(buildTimeline([drag], git(false))[0]).not.toHaveProperty('uncommitted')
  })
})

describe('screenshots', () => {
  const shot = (min: number, file: string, from: string, to: string): JournalEntry => ({
    at: at(min),
    source: 'disk',
    kind: 'changed',
    changes: [{ field: 'screenshot', from: { src: `assets/US-01.1.1/${file}`, sha: from }, to: { src: `assets/US-01.1.1/${file}`, sha: to } }],
  })
  it('folds a capture run into one entry, each file from its first version to its last', () => {
    const out = collapse([shot(0, 'web.png', 'a', 'b'), shot(1, 'mobile.png', 'x', 'y'), shot(2, 'web.png', 'b', 'c')])
    expect(out).toHaveLength(1)
    expect(out[0]!.changes.map((c) => [(c.from as { sha: string }).sha, (c.to as { sha: string }).sha])).toEqual([
      ['a', 'c'],
      ['x', 'y'],
    ])
  })
  it('drops a file that ended as it began', () => {
    expect(collapse([shot(0, 'web.png', 'a', 'b'), shot(1, 'web.png', 'b', 'a')])).toEqual([])
  })
  it('folds a commit that rewrote screenshots into that commit, or gives it an entry of its own', () => {
    const c1 = { sha: 'c1', author: 'D', at: at(0), subject: 'Add' }
    const c2 = { sha: 'c2', author: 'D', at: at(10), subject: 'Recapture' }
    const files = [{ from: { src: 'assets/US-01.1.1/web.png', sha: 'a' }, to: { src: 'assets/US-01.1.1/web.png', sha: 'b' } }]
    const git: GitFileHistory = { versions: [{ commit: c1, item: item({ id: 'US-01.1.1' }) }], dirty: false, working: null, screenshots: [{ commit: c2, files }] }
    const t = buildTimeline([], git)
    expect(t[0]).toMatchObject({ type: 'change', source: 'git', commit: { sha: 'c2' }, changes: [{ field: 'screenshot' }] })
    // Once the journal has taken over, the same commit is only a divider.
    const later = buildTimeline([{ at: at(5), source: 'board', kind: 'changed', changes: [{ field: 'notes', from: '', to: 'n' }] }], git)
    expect(later.find((e) => e.type === 'commit')).toMatchObject({ commit: { sha: 'c2' } })
  })
})

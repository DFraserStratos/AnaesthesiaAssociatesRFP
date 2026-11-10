/**
 * The Diff review's model: each changed record as an entry (added, removed, edited, unreadable,
 * minor), the fingerprint a Viewed tick keeps, the tab's count, and the bar's filters and counts.
 */
import { describe, expect, it } from 'vitest'
import type { ArtifactDiff, DiffRecord, ItemDiff, QuestionDiff } from '../shared/diff.ts'
import { ALL_FILTERS, countChanges, counts, entriesOf, entryOf, groupOf, passes, type Filters } from '../shared/diffModel.ts'
import { stepChanges } from '../shared/steps.ts'
import type { Artifact, Step } from '../shared/types.ts'
import { item, question } from './fixtures.ts'

const story = item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Send an invoice', description: 'Sends it.' })
const other = item({ id: 'US-01.1.2', parent: 'FT-01.1', title: 'Void an invoice', order: 2 })
const itemDiff = (before: ItemDiff['before'], after: ItemDiff['after'], more: Partial<ItemDiff> = {}): ItemDiff => ({ kind: 'item', id: (before ?? after)?.id ?? 'US-09.9.9', before, after, ...more })
const art: Artifact = {
  id: 'AR-01',
  title: 'Plan',
  status: 'Current',
  supersededBy: null,
  date: null,
  kind: 'diagram',
  author: '',
  components: [],
  sources: [],
  citedAs: [],
  file: 'artifacts/files/AR-01.svg',
  regions: [],
  steps: [],
  stepView: null,
  description: '',
  source: '',
  extra: {},
}
const artDiff = (before: Artifact | null, after: Artifact | null, fileBefore: string | null, fileAfter: string | null): ArtifactDiff => ({ kind: 'artifact', id: 'AR-01', before, after, fileBefore, fileAfter })

describe('entryOf', () => {
  it('reads added, removed and edited from which sides exist', () => {
    expect(entryOf(itemDiff(null, story)).change).toBe('added')
    expect(entryOf(itemDiff(story, null)).change).toBe('removed')
    const e = entryOf(itemDiff(story, { ...story, description: 'Sends it by email.' }))
    expect([e.change, e.changes.map((c) => c.field), e.minor, e.key, e.title]).toEqual(['edited', ['description'], false, 'item:US-01.1.1', 'Send an invoice'])
  })

  it('reads a side that does not parse as there: edited and unreadable, never added, removed or minor', () => {
    const after = entryOf(itemDiff(story, null, { afterError: 'bad YAML', afterText: 'title: [' }))
    expect([after.change, after.unreadable, after.minor]).toEqual(['edited', 'after', false])
    const before = entryOf(itemDiff(null, story, { beforeError: 'bad YAML', beforeText: 'x' }))
    expect([before.change, before.unreadable]).toEqual(['edited', 'before'])
    // No side reads: the ID names it and gives its type.
    const both = entryOf(itemDiff(null, null, { id: 'FT-02.1', beforeError: 'a', afterError: 'b', beforeText: '1', afterText: '2' }))
    expect([both.change, both.unreadable, both.title, both.kind === 'item' && both.type]).toEqual(['edited', 'both', 'FT-02.1', 'feature'])
  })

  it('counts a reorder or spacing as minor, and notices a move to another parent', () => {
    expect(entryOf(itemDiff(story, { ...story, order: 4 })).minor).toBe(true)
    expect(entryOf(itemDiff(story, { ...story, description: 'Sends  it.\n' })).minor).toBe(true)
    const moved = entryOf(itemDiff(story, { ...story, parent: 'FT-01.2' }))
    expect([moved.kind === 'item' && moved.moved, moved.minor]).toEqual([true, false])
  })

  it("never counts an artifact whose file changed as minor, even with its details the same", () => {
    const e = entryOf(artDiff(art, art, 'aaa', 'bbb'))
    expect([e.kind === 'artifact' && e.fileChanged, e.changes, e.minor]).toEqual([true, [], false])
  })

  it("reads a change to a stepped diagram's steps as an edit, a reorder of them included", () => {
    const step = (id: string, name: string, caption = ''): Step => ({ id, name, group: '', caption, show: [], highlight: [], moves: [], balances: [] })
    const before = { ...art, steps: [step('invoice', 'Invoice'), step('gone', 'Old step'), step('bill', 'Bill'), step('pays', 'Patient pays'), step('pay', 'Pay')] }
    // Invoice renamed and re-captioned, Old step removed, Bill moved after Pay, Check added.
    const after = { ...art, steps: [step('invoice', 'Raise the invoice', 'Cr Sales'), step('pays', 'Patient pays'), step('pay', 'Pay'), step('bill', 'Bill'), step('check', 'Check')] }
    const e = entryOf(artDiff(before, after, 'a', 'a'))
    expect([e.change, e.changes.map((c) => c.field), e.minor]).toEqual(['edited', ['steps'], false])
    const [c] = e.changes
    expect(stepChanges(c!.from as Step[], c!.to as Step[])).toEqual({
      added: [after.steps[4]],
      removed: [before.steps[1]],
      changed: [
        { id: 'invoice', name: 'Raise the invoice', what: ['renamed', 'caption changed'] },
        { id: 'bill', name: 'Bill', what: ['moved'] },
      ],
    })
    // The order is what a stepped diagram walks through, so a reorder alone is never minor.
    const reordered = entryOf(artDiff(before, { ...before, steps: [...before.steps].reverse() }, 'a', 'a'))
    expect([reordered.changes.map((x) => x.field), reordered.minor]).toEqual([['steps'], false])
    expect(reordered.fingerprint).not.toBe(entryOf(artDiff(before, after, 'a', 'a')).fingerprint)
  })

  it('keeps a fingerprint that changes only when the record does', () => {
    const a = entryOf(itemDiff(story, { ...story, title: 'Two' }))
    expect(entryOf(itemDiff(story, { ...story, title: 'Two' })).fingerprint).toBe(a.fingerprint)
    expect(entryOf(itemDiff(story, { ...story, title: 'Three' })).fingerprint).not.toBe(a.fingerprint)
    expect(entryOf(artDiff(art, art, 'aaa', 'bbb')).fingerprint).not.toBe(entryOf(artDiff(art, art, 'aaa', 'ccc')).fingerprint)
    // The raw text of a side that does not parse is part of it: fixing one typo for another is a new change.
    const bad = (t: string) => entryOf(itemDiff(story, null, { afterError: 'bad', afterText: t })).fingerprint
    expect(bad('x: [')).not.toBe(bad('x: {'))
  })
})

describe('entriesOf and the tab count', () => {
  const q = question({ id: 'OQ-01' })
  const records: DiffRecord[] = [
    itemDiff(story, { ...story, description: 'Sends it by email.' }),
    itemDiff(other, { ...other, order: 3 }), // minor
    { kind: 'question', id: 'OQ-01', before: q, after: { ...q } } satisfies QuestionDiff, // reads the same
    artDiff(art, art, 'aaa', 'aaa'), // the same, file and all
    artDiff(art, art, 'aaa', 'bbb'),
  ]
  it('leaves out records whose versions read the same, keeping a file change', () => {
    expect(entriesOf({ records }).map((e) => e.key)).toEqual(['item:US-01.1.1', 'item:US-01.1.2', 'artifact:AR-01'])
  })
  it('counts what a reader would notice: minor changes left out', () => {
    expect(countChanges({ records })).toBe(2)
    expect(countChanges({ records: [] })).toBe(0)
  })
})

describe('filters and the bar counts', () => {
  const epic = item({ id: 'EP-01', type: 'epic', title: 'Epic' })
  const entries = entriesOf({
    records: [
      itemDiff(epic, { ...epic, title: 'Epic, renamed' }),
      itemDiff(null, story),
      itemDiff(other, { ...other, order: 9 }), // minor edit
      { kind: 'question', id: 'OQ-01', before: question({ id: 'OQ-01' }), after: null },
      artDiff(art, { ...art, title: 'Plan, renamed' }, 'a', 'a'),
    ],
  })
  const with_ = (over: Partial<Filters>): Filters => ({ ...ALL_FILTERS(), ...over })

  it('groups items by type, and questions and artifacts by kind', () => {
    expect(entries.map(groupOf)).toEqual(['epic', 'story', 'story', 'question', 'artifact'])
  })

  it('lets through what every filter allows, minor changes only when asked', () => {
    const shown = (f: Filters) => entries.filter((e) => passes(e, f)).map((e) => e.id)
    expect(shown(ALL_FILTERS())).toEqual(['EP-01', 'US-01.1.1', 'OQ-01', 'AR-01'])
    expect(shown(with_({ minor: true }))).toEqual(['EP-01', 'US-01.1.1', 'US-01.1.2', 'OQ-01', 'AR-01'])
    expect(shown(with_({ groups: new Set(['story', 'question'] as const) }))).toEqual(['US-01.1.1', 'OQ-01'])
    expect(shown(with_({ changes: new Set(['edited'] as const) }))).toEqual(['EP-01', 'AR-01'])
  })

  it("counts each group under the change filter, and each change under the group filter", () => {
    const c = counts(entries, with_({ groups: new Set(['story', 'question'] as const), changes: new Set(['added', 'removed'] as const) }))
    // Groups count across the chosen changes, whichever groups are on.
    expect(c.byGroup).toEqual({ epic: 0, feature: 0, story: 1, question: 1, artifact: 0 })
    // Changes count across the chosen groups, whichever changes are on.
    expect(c.byChange).toEqual({ added: 1, edited: 0, removed: 1 })
    expect(c.minor).toBe(1)
    expect(counts(entries, with_({ minor: true })).byChange).toEqual({ added: 1, edited: 3, removed: 1 })
  })
})

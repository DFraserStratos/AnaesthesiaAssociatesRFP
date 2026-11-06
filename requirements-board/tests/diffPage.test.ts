/**
 * The Diff review page: marked Markdown that still parses (sentence folds, tables, links), the
 * page's order when a filter hides a changed parent, refs named as the commit list names them,
 * and the changes no field list may drop.
 */
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'
import type { CatalogueCommit, DiffRecord } from '../shared/diff.ts'
import { EMPTY_TREE } from '../shared/diff.ts'
import { MARK_CLOSE as C, MARK_OPEN as O, markPair, sentenceFold, splitBlocks } from '../shared/proseDiff.ts'
import { resolveSource } from '../shared/sources.ts'
import type { Artifact, ArtifactRec, Item } from '../shared/types.ts'
import { sourceIndexAt, sourceIndexOf } from '../src/sourceRows.ts'
import { remarkDiffMarks } from '../src/diff/diffMarks.ts'
import { ALL_FILTERS, canonicalRef, entriesOf, pageRows, passes } from '../shared/diffModel.ts'
import { item } from './fixtures.ts'

interface Node {
  type: string
  value?: string
  url?: string
  children?: Node[]
}

/** The tree the page draws for a marked block: GFM, then the marks plugin. */
function tree(md: string, tag: 'del' | 'ins' = 'ins'): Node {
  const proc = unified().use(remarkParse).use(remarkGfm, { singleTilde: false })
  const t = proc.parse(md) as Node
  proc.runSync(t as never)
  remarkDiffMarks(tag)()(t as never)
  return t
}
const textOf = (n: Node): string => (n.value ?? '') + (n.children ?? []).map(textOf).join('')
const all = (n: Node): Node[] => [n, ...(n.children ?? []).flatMap(all)]
const SENTINEL = /[-]/

describe('sentence folds keep the Markdown whole', () => {
  const fold = (before: string, after: string) => {
    const b = splitBlocks(before)[0]!
    const a = splitBlocks(after)[0]!
    const m = markPair(b, a)
    return sentenceFold(m.after, a.kind) ?? m.after
  }
  it('never cuts inside link text', () => {
    const out = fold('Intro here. See [the plan. It says so](https://x.y/z) today. Outro one. Outro two.', 'Intro here. See [the plan. It says so](https://x.y/z) tomorrow. Outro one. Outro two.')
    const t = tree(out)
    expect(textOf(t)).not.toContain('](')
    expect(all(t).some((n) => n.type === 'link' && n.url === 'https://x.y/z')).toBe(true)
  })
  it('never cuts inside a bold run', () => {
    const out = fold('Intro stays. **First point. Second point. Third point is old.** Outro stays. Last one.', 'Intro stays. **First point. Second point. Third point is new.** Outro stays. Last one.')
    expect(textOf(tree(out))).not.toContain('**')
  })
  it('never cuts inside a code span', () => {
    const out = fold('One stays. Two stays. Run `a. b. c` now old. Four stays. Five stays.', 'One stays. Two stays. Run `a. b. c` now new. Four stays. Five stays.')
    for (const n of all(tree(out))) if (n.type === 'inlineCode') expect(n.value).toBe('a. b. c')
  })
  it('reads a quote over several lines as one paragraph, with no stray angle', () => {
    const before = '> Line one stays.\n> Line two stays.\n> Line three is old.\n> Line four stays.\n> Line five stays.'
    const after = before.replace('old', 'new')
    const t = tree(fold(before, after))
    expect(textOf(t)).not.toContain('>')
    expect(t.children?.[0]?.type).toBe('blockquote')
  })
  it('leaves a quote with a blank line in it unfolded', () => {
    expect(sentenceFold(`> One. Two.\n>\n> Three ${O}x${C}. Four. Five.`, 'quote')).toBeNull()
  })
})

describe('marks never break a table or an address', () => {
  it('keeps a table a table when a column is added or realigned', () => {
    const before = '| a | b |\n|---|---|\n| 1 | 2 |'
    for (const after of ['| a | b | c |\n|---|---|---|\n| 1 | 2 | 3 |', '| a | b |\n|---|---:|\n| 1 | 2 |']) {
      const m = markPair(splitBlocks(before)[0]!, splitBlocks(after)[0]!)
      if (m.rewritten) continue
      expect(tree(m.before, 'del').children?.[0]?.type).toBe('table')
      expect(tree(m.after).children?.[0]?.type).toBe('table')
    }
  })
  it('never leaves a sentinel in a bare URL or an autolink', () => {
    const words = 'The plan as agreed with the team sets out every step we take next, and'
    for (const [b, a] of [
      [`${words} https://example.com/old-page has more.`, `${words} https://example.com/new-page has more.`],
      [`${words} <https://example.com/old-page> has more.`, `${words} <https://example.com/new-page> has more.`],
    ]) {
      const m = markPair(splitBlocks(b!)[0]!, splitBlocks(a!)[0]!)
      expect(m.rewritten).toBe(false)
      expect(m.after).toContain(`${O}`)
      for (const side of [m.before, m.after]) for (const n of all(tree(side))) if (n.url !== undefined) expect(n.url).not.toMatch(SENTINEL)
    }
  })
})

const commit = (sha: string, parent: string | null): CatalogueCommit => ({ sha, short: sha.slice(0, 7), at: '2026-11-01T00:00:00Z', subject: sha, records: 1, parent })

describe('canonicalRef', () => {
  const list = { head: 'h'.repeat(40), commits: [commit('c'.repeat(40), 'p'.repeat(40)), commit('b'.repeat(40), 'a'.repeat(40))] }
  it('names HEAD as the newest commit that changed a record', () => {
    expect(canonicalRef(list.head, list)).toBe('c'.repeat(40))
  })
  it("names a commit's first parent as the next commit down, or before the first", () => {
    expect(canonicalRef('p'.repeat(40), list)).toBe('b'.repeat(40))
    expect(canonicalRef('a'.repeat(40), list)).toBe(EMPTY_TREE)
  })
  it('leaves listed commits, the worktree and unknown refs as they are', () => {
    expect(canonicalRef('b'.repeat(40), list)).toBe('b'.repeat(40))
    expect(canonicalRef('f'.repeat(40), list)).toBe('f'.repeat(40))
    expect(canonicalRef('x', null)).toBe('x')
  })
})

const edited = (before: Item, after: Item): DiffRecord => ({ kind: 'item', id: before.id, before, after })
const order = { context: { before: {}, after: {} }, lanes: [], questionOrder: [] }

describe('pageRows', () => {
  const epic = item({ id: 'EP-01', type: 'epic', parent: null, title: 'Epic' })
  const feature = item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', title: 'Feature' })
  const story = item({ id: 'US-01.1.1', type: 'story', parent: 'FT-01.1', title: 'Story' })
  const other = item({ id: 'EP-02', type: 'epic', parent: null, title: 'Other' })
  const records = [edited(epic, { ...epic, title: 'Epic, renamed' }), edited(feature, { ...feature, title: 'Feature, renamed' }), edited(story, { ...story, title: 'Story, renamed' }), edited(other, { ...other, title: 'Other, renamed' })]
  it('keeps a changed parent a filter hides as a heading over the cards under it', () => {
    const entries = entriesOf({ records })
    const filters = { ...ALL_FILTERS(), groups: new Set(['story', 'feature'] as const) }
    const shown = entries.filter((e) => passes(e, filters as never))
    const rows = pageRows(shown, { ...order, all: entries }).map((r) => (r.row === 'heading' ? `h:${r.item.id}` : r.row === 'card' ? r.entry.id : r.title))
    expect(rows).toEqual(['h:EP-01', 'FT-01.1', 'US-01.1.1'])
    // The hidden epic is marked changed; an unchanged parent is not.
    expect(pageRows(shown, { ...order, all: entries }).find((r) => r.row === 'heading')).toMatchObject({ item: { id: 'EP-01' }, changed: true })
    const storyOnly = entriesOf({ records: [records[2]!] })
    const parents = { ...order, context: { before: { 'EP-01': epic, 'FT-01.1': feature }, after: { 'EP-01': epic, 'FT-01.1': feature } } }
    expect(pageRows(storyOnly, parents).filter((r) => r.row === 'heading').map((r) => r.row === 'heading' && r.changed)).toEqual([false, false])
  })
  it('places a card no version of which reads after the tree', () => {
    const lost: DiffRecord = { kind: 'item', id: 'US-09.1.1', before: null, after: null, beforeError: 'bad YAML', afterError: 'bad YAML', beforeText: 'a', afterText: 'b' }
    const rows = pageRows(entriesOf({ records: [lost, ...records] }), order).map((r) => (r.row === 'card' ? r.entry.id : r.row))
    expect(rows.at(-1)).toBe('US-09.1.1')
  })
})

describe('artifact changes', () => {
  const art: Artifact = {
    id: 'AR-01',
    title: 'Plan',
    status: 'Current',
    supersededBy: null,
    date: null,
    kind: 'document',
    author: '',
    components: [],
    sources: [],
    citedAs: [{ as: 'Plan p.', pageOffset: null, within: null, spot: null }],
    file: null,
    regions: [],
    description: '',
    source: '',
    extra: {},
  }
  it('keeps an artifact whose only change is how sources cite it', () => {
    const after = { ...art, citedAs: [{ as: 'The plan p.', pageOffset: null, within: null, spot: null }] }
    const [e] = entriesOf({ records: [{ kind: 'artifact', id: 'AR-01', before: art, after, fileBefore: null, fileAfter: null }] })
    expect(e?.changes.map((c) => c.field)).toEqual(['citedAs'])
  })
})

describe('sources read at a side', () => {
  const art = (id: string, as: string, file: string | null = null): Artifact => ({
    id,
    title: `Artifact ${id}`,
    kind: 'document',
    status: 'Current',
    supersededBy: null,
    date: null,
    author: '',
    components: [],
    sources: [],
    citedAs: [{ as, pageOffset: null, within: null, spot: null }],
    file,
    regions: [],
    description: '',
    source: '',
    extra: {},
  })
  const rec = (a: Artifact): ArtifactRec => ({ data: a, rev: 'r', meta: { format: 'pdf', fileRev: null, bounds: null, pages: [{ w: 1, h: 1 }], headings: null, points: null, lines: null, bytes: null, path: null } })
  const today = { 'AR-02': rec(art('AR-02', 'Spec', 'artifacts/files/AR-02.pdf')) }
  const todayIndex = sourceIndexOf(today)

  it("is today's own index when no artifact read differently then", () => {
    expect(sourceIndexAt(today, {}, todayIndex)).toBe(todayIndex)
  })

  it('names an artifact since removed, and one cited by words it has since dropped', () => {
    const at = sourceIndexAt(today, { 'AR-01': art('AR-01', 'Old doc'), 'AR-02': art('AR-02', 'Spec v1', 'artifacts/files/AR-02.pdf') }, todayIndex)
    expect(resolveSource(at, 'Old doc p.3')).toMatchObject({ kind: 'artifact', id: 'AR-01' })
    expect(resolveSource(at, 'Spec v1 p.1')).toMatchObject({ kind: 'artifact', id: 'AR-02' })
    expect(resolveSource(todayIndex, 'Old doc p.3').kind).not.toBe('artifact')
    // Today's file facts still apply to the same file: page 2 of a one-page PDF is flagged.
    const r = resolveSource(at, 'Spec v1 p.2')
    expect(r.kind === 'artifact' && r.spots[0]!.problem).toBeTruthy()
  })
})

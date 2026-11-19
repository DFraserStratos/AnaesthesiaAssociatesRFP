/**
 * B09: diffs and timelines show what really changed. Long documents and paragraphs (R-25), list
 * markers (R-89), the minor rule (R-88), marks that end where the change ends (R-90), mermaid
 * drawings (R-91), and a card the journal saw first (R-87). The shared comparison keeps its old
 * answers for every input its table could hold (P-06).
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'
import { entryOf } from '../shared/diffModel.ts'
import { buildTimeline, isMinorChange, lineDiff, type GitFileHistory, type JournalEntry } from '../shared/history.ts'
import { MARK_ANY, MARK_CLOSE as C, MARK_OPEN as O, foldRows, markPair, pairBlocks, splitBlocks, type Row } from '../shared/proseDiff.ts'
import { stepChanges } from '../shared/steps.ts'
import { lcsPairs } from '../shared/textCompare.ts'
import type { Artifact, Item, Step } from '../shared/types.ts'
import { createJournal } from '../server/historyJournal.ts'
import { remarkDiffMarks } from '../src/diff/diffMarks.ts'
import { item } from './fixtures.ts'

/* ------------------------------------------------------------ helpers */

const ops = (rows: Row[]) => rows.reduce<Record<string, number>>((m, r) => ((m[r.op] = (m[r.op] ?? 0) + 1), m), {})
const rowsOf = (a: string, b: string) => pairBlocks(splitBlocks(a), splitBlocks(b))
const doc = (n: number) => Array.from({ length: n }, (_, i) => `Speaker ${i % 3}: paragraph ${i} says something about topic ${i % 11}.`)

/** Every edited row shows its change: a mark on a side, or both sides tinted whole. */
function noBlankEdits(rows: Row[]) {
  for (const r of rows.filter((x) => x.op === 'edited')) {
    const m = markPair(r.before!, r.after!)
    expect(m.rewritten || m.before.includes(O) || m.after.includes(O), `blank edited row: ${r.before!.text} | ${r.after!.text}`).toBe(true)
  }
}

/** The comparison as it was before B09 (the full table, null past the cap): the reference for P-06. */
function oldLcs<T>(x: readonly T[], y: readonly T[], eq: (a: T, b: T) => boolean, maxCells = 1_000_000): [number, number][] | null {
  if (x.length * y.length > maxCells) return null
  const w = y.length + 1
  const t = new Uint32Array((x.length + 1) * w)
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) t[i * w + j] = eq(x[i]!, y[j]!) ? t[(i + 1) * w + j + 1]! + 1 : Math.max(t[(i + 1) * w + j]!, t[i * w + j + 1]!)
  const out: [number, number][] = []
  let i = 0
  let j = 0
  while (i < x.length && j < y.length) {
    if (eq(x[i]!, y[j]!)) out.push([i++, j++])
    else if (t[(i + 1) * w + j]! >= t[i * w + j + 1]!) i++
    else j++
  }
  return out
}

/** A small seeded generator, so the random cases are the same every run. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32)
}

/* ------------------------------------------------------------ R-25 and P-06 */

describe('the shared comparison (R-25, P-06)', () => {
  it('gives exactly the old pairs for every input its table could hold', () => {
    const r = rng(7)
    for (let n = 0; n < 2000; n++) {
      const alphabet = 1 + Math.floor(r() * 5)
      const list = () => Array.from({ length: Math.floor(r() * 14) }, () => String.fromCharCode(97 + Math.floor(r() * alphabet)))
      const x = list()
      const y = list()
      expect(lcsPairs(x, y, (a, b) => a === b)).toEqual(oldLcs(x, y, (a, b) => a === b))
    }
  })

  it('still pairs everything around a small change past the cap, every pair equal and in order', () => {
    const x = Array.from({ length: 3000 }, (_, i) => `k${i}`)
    const y = [...x.slice(0, 1500), 'new', ...x.slice(1501)]
    const pairs = lcsPairs(x, y, (a, b) => a === b)
    expect(pairs).toHaveLength(2999)
    for (let k = 1; k < pairs.length; k++) expect(pairs[k]![0] > pairs[k - 1]![0] && pairs[k]![1] > pairs[k - 1]![1]).toBe(true)
    for (const [i, j] of pairs) expect(x[i]).toBe(y[j])
  })

  it('cuts a middle too big for the table at values found once each side', () => {
    // Changes spread through the text, so the middle (between the first and last change) is too big for a small table.
    const x = Array.from({ length: 400 }, (_, i) => `k${i}`)
    const y = x.map((v, i) => (i % 50 === 0 ? `${v}-edited` : v))
    const pairs = lcsPairs(x, y, (a, b) => a === b, 1000)
    expect(pairs).toHaveLength(400 - 8)
  })

  it('leaves stepped-diagram steps as before (P-06)', () => {
    const step = (id: string): Step => ({ id, name: id, group: null, caption: '', reveal: [], highlight: [], balances: [] }) as unknown as Step
    const from = ['a', 'b', 'c', 'd'].map(step)
    const to = ['b', 'a', 'c', 'e'].map(step)
    expect(stepChanges(from, to)).toMatchObject({ added: [{ id: 'e' }], removed: [{ id: 'd' }] })
  })

  it('a one-word change in a 2,000-paragraph document is one edited row, the rest folded', () => {
    for (const n of [800, 1538, 2000]) {
      const a = doc(n)
      const b = [...a]
      b[n >> 1] = `Speaker 0: paragraph ${n >> 1} says something else about topic 1.`
      const rows = rowsOf(a.join('\n\n'), b.join('\n\n'))
      expect(ops(rows)).toEqual({ same: n - 1, edited: 1 })
      expect(foldRows(rows).filter((r) => 'fold' in r)).toHaveLength(2)
    }
  })

  it('identical blocks are never edited, even where the comparison cannot pair them', () => {
    // A repeated short paragraph ("Yes.") in a run the table cannot hold: never an edited row with nothing to mark.
    const a = doc(1600).map((p, i) => (i % 9 === 0 ? 'Yes.' : p))
    const b = a.map((p, i) => (i % 40 === 0 && p !== 'Yes.' ? `${p} Added words here.` : p))
    const rows = rowsOf(a.join('\n\n'), b.join('\n\n'))
    for (const r of rows.filter((x) => x.op === 'edited')) expect(r.before!.text).not.toBe(r.after!.text)
    noBlankEdits(rows)
  })

  it('marks one word in a 5,000-token paragraph, never tinting it whole for its length', () => {
    const words = Array.from({ length: 2600 }, (_, i) => `word${i}`)
    const changed = [...words]
    changed[1300] = 'different'
    const m = markPair({ kind: 'para', depth: 0, text: words.join(' ') }, { kind: 'para', depth: 0, text: changed.join(' ') })
    expect(m.rewritten).toBe(false)
    expect(m.after.match(/([^]*)/g)).toEqual([`${O}different${C}`])
    expect(m.before.match(/([^]*)/g)).toEqual([`${O}word1300${C}`])
  })

  it('a one-line change in a 2,000-line field is that line removed and added', () => {
    const a = Array.from({ length: 2000 }, (_, i) => `line ${i}`)
    const b = [...a]
    b[999] = 'line changed'
    const d = lineDiff(a.join('\n'), b.join('\n'))
    expect(d.filter((l) => l.op !== 'same')).toEqual([
      { op: 'del', text: 'line 999' },
      { op: 'add', text: 'line changed' },
    ])
  })
})

/* ------------------------------------------------------------ R-89 */

describe('list markers (R-89, B09-Q3)', () => {
  it('an inserted numbered item is one added row; the renumbered items after it are unchanged', () => {
    const rows = rowsOf('1. a one\n2. b two\n3. c three\n4. d four\n5. e five', '1. a one\n2. new item\n3. b two\n4. c three\n5. d four\n6. e five')
    expect(rows.map((r) => r.op)).toEqual(['same', 'added', 'same', 'same', 'same', 'same'])
    expect(foldRows(rows).filter((r) => 'fold' in r)).toHaveLength(1)
  })

  it('an item inserted or removed at the top of a numbered list changes no other item (review)', () => {
    const list = '1. Record the start time\n2. Record the finish time\n3. Confirm the totals'
    const top = '1. Check the roster\n2. Record the start time\n3. Record the finish time\n4. Confirm the totals'
    expect(rowsOf(list, top).map((r) => r.op)).toEqual(['added', 'same', 'same', 'same'])
    expect(rowsOf(list, '1. Record the finish time\n2. Confirm the totals').map((r) => r.op)).toEqual(['removed', 'same', 'same'])
    expect(isMinorChange({ field: 'acceptance', from: '1. a\n2. b', to: '1. b' })).toBe(false)
    expect(isMinorChange({ field: 'acceptance', from: '1. a\n2. b\n3. c', to: '1. b\n2. c' })).toBe(false)
  })

  it('another bullet character is no change', () => {
    expect(rowsOf('- one\n- two', '* one\n+ two').map((r) => r.op)).toEqual(['same', 'same'])
  })

  it('a bullet turned into a number is an edit with the marker marked', () => {
    const [r] = rowsOf('- one thing', '1. one thing')
    expect(r!.op).toBe('edited')
    const m = markPair(r!.before!, r!.after!)
    expect(m).toEqual({ before: `${O}•${C} one thing`, after: `${O}1.${C} one thing`, rewritten: false })
  })

  it('a list that starts at another number shows its first item edited, marker marked', () => {
    const rows = rowsOf('1. one\n2. two', '3. one\n4. two')
    expect(rows.map((r) => r.op)).toEqual(['edited', 'same'])
    expect(markPair(rows[0]!.before!, rows[0]!.after!).after).toBe(`${O}3.${C} one`)
  })

  it('no edited row is blank, over the marker cases and a heading level change', () => {
    for (const [a, b] of [
      ['- one\n- two', '1. one\n2. two'],
      ['1. one', '2. one'],
      ['## Title', '### Title'],
      ['| a | b |\n|---|---|\n| 1 | 2 |', '| a | b |\n|:--|---|\n| 1 | 2 |'],
      ['Some words here.', 'Some other words here.'],
    ] as const)
      noBlankEdits(rowsOf(a, b))
  })
})

/* ------------------------------------------------------------ R-88 */

describe('minor means nothing a reader would notice (R-88)', () => {
  const minor = (field: 'acceptance' | 'description' | 'source', from: string, to: string) => isMinorChange({ field, from, to })
  it('joined paragraphs, merged bullets, split criteria, a new depth or a heading are not minor', () => {
    expect(minor('acceptance', '- one\n- two', '- one - two')).toBe(false)
    expect(minor('description', 'One.\n\nTwo.', 'One. Two.')).toBe(false)
    expect(minor('acceptance', '- one two', '- one\n- two')).toBe(false)
    expect(minor('acceptance', '- one\n- two', '- one\n  - two')).toBe(false)
    expect(minor('description', 'Title', '# Title')).toBe(false)
  })
  it('a mermaid line joined or split is not minor; re-spacing a line is', () => {
    expect(minor('source', 'graph TD\nA --> B\nB --> C', 'graph TD\nA --> B B --> C')).toBe(false)
    expect(minor('source', 'graph TD\nA --> B B --> C', 'graph TD\nA --> B\nB --> C')).toBe(false)
    expect(minor('source', 'graph TD\n  A --> B', 'graph TD\nA  -->  B')).toBe(true)
  })
  it('re-wrapping, trailing and doubled spaces, and marker-only list changes stay minor', () => {
    expect(minor('description', 'One two\nthree.', 'One two three.')).toBe(true)
    expect(minor('description', 'One  two.  ', 'One two.')).toBe(true)
    expect(minor('acceptance', '- one\n- two', '* one\n* two')).toBe(true)
    expect(minor('acceptance', '1. one\n3. two', '1. one\n2. two')).toBe(true)
  })
  it('a new starting number is not minor (B09-Q3)', () => {
    expect(minor('acceptance', '1. one\n2. two', '3. one\n4. two')).toBe(false)
  })
  it('counts a merged pair of acceptance bullets as a change on the card', () => {
    const s = item({ id: 'US-01.1.1', acceptance: '- one\n- two' })
    expect(entryOf({ kind: 'item', id: s.id, before: s, after: { ...s, acceptance: '- one - two' } }).minor).toBe(false)
  })
})

/* ------------------------------------------------------------ R-90 */

interface Node {
  type: string
  value?: string
  children?: Node[]
  data?: { hName?: string }
}
function marked(md: string): { text: string; marks: string[] } {
  const proc = unified().use(remarkParse).use(remarkGfm, { singleTilde: false })
  const t = proc.parse(md) as Node
  proc.runSync(t as never)
  remarkDiffMarks('ins')()(t as never)
  const textOf = (n: Node): string => (n.value ?? '') + (n.children ?? []).map(textOf).join('')
  const all = (n: Node): Node[] => [n, ...(n.children ?? []).flatMap(all)]
  return { text: textOf(t), marks: all(t).filter((n) => n.data?.hName === 'ins').map(textOf) }
}

describe('marks end where the change ends (R-90)', () => {
  it('a change ending inside a code span that crosses a line leaves the rest unmarked', () => {
    const before = 'Set the `old\nflag` and the rest stays.'
    const after = 'Set the `new\nflag` and the rest stays.'
    const m = markPair(splitBlocks(before)[0]!, splitBlocks(after)[0]!)
    const r = marked(m.after)
    expect(r.marks.join('|')).not.toContain('the rest stays')
    expect(r.marks.some((x) => x.includes('new'))).toBe(true)
    expect(r.text).not.toMatch(MARK_ANY)
  })
  it('a change starting inside a code span marks it, and the text before stays unmarked', () => {
    const r = marked(`Plain words then \`co${O}de\` and more${C} after.`)
    expect(r.marks.join('|')).not.toContain('Plain words')
    expect(r.marks.some((x) => x.includes('code'))).toBe(true)
    expect(r.marks.join('|')).not.toContain('after')
    expect(r.text).not.toMatch(MARK_ANY)
  })
})

/* ------------------------------------------------------------ R-91 data */

describe('a mermaid drawing is its source (R-91)', () => {
  const art = (source: string): Artifact =>
    ({ id: 'AR-01', title: 'Flow', kind: 'diagram', status: 'Current', supersededBy: null, date: null, author: '', components: [], sources: [], citedAs: [], file: null, regions: [], steps: [], stepView: null, description: '', source, extra: {} }) as unknown as Artifact
  const entry = (a: string, b: string) => entryOf({ kind: 'artifact', id: 'AR-01', before: art(a), after: art(b), fileBefore: null, fileAfter: null })
  it('an edited source is a drawing change, so the card is shown and not minor', () => {
    const e = entry('graph TD\nA --> B', 'graph TD\nA --> B\nB --> C')
    expect(e.kind === 'artifact' && e.fileChanged).toBe(true)
    expect(e.minor).toBe(false)
  })
  it('a source only re-spaced is no drawing change', () => {
    const e = entry('graph TD\nA --> B', 'graph TD\n  A  -->  B')
    expect(e.kind === 'artifact' && e.fileChanged).toBe(false)
    expect(e.minor).toBe(true)
  })
})

/* ------------------------------------------------------------ R-87 */

const at = (min: number) => new Date(Date.UTC(2026, 8, 28, 9, min)).toISOString()
const commit = (sha: string, min: number, subject: string) => ({ sha, author: 'D', at: at(min), subject })

describe('each change once, and a first-seen card has a beginning (R-87)', () => {
  const v1 = item({ id: 'US-01.1.1', title: 'First' })
  const v2 = { ...v1, title: 'Second' }
  it('a change committed while the board was off appears once', () => {
    const journal: JournalEntry[] = [
      { at: at(0), source: 'disk', kind: 'seen', rev: 'r1', changes: [] },
      { at: at(20), source: 'disk', kind: 'changed', rev: 'r2', changes: [{ field: 'title', from: 'First', to: 'Second' }], offline: true },
    ]
    const git: GitFileHistory = {
      versions: [
        { commit: commit('c2', 10, 'Retitle'), item: v2 },
        { commit: commit('c1', -60, 'Add'), item: v1 },
      ],
      dirty: false,
      working: v2,
    }
    const t = buildTimeline(journal, git)
    const titles = t.filter((e) => e.type === 'change' && e.changes.some((c) => c.field === 'title'))
    expect(titles).toHaveLength(1)
    expect(t.map((e) => (e.type === 'commit' ? `commit ${e.commit.sha}` : `${e.source} ${e.kind}`))).toEqual(['disk changed', 'commit c2', 'git created'])
  })

  it('a card first seen uncommitted, never in git, has a creation entry, not committed yet', () => {
    const t = buildTimeline([{ at: at(0), source: 'disk', kind: 'seen', rev: 'r1', changes: [] }], { versions: [], dirty: true, working: v1 })
    expect(t).toEqual([{ type: 'change', at: at(0), source: 'disk', kind: 'created', changes: [], uncommitted: true }])
  })

  it('once committed, that creation stays, followed by the commit', () => {
    const t = buildTimeline([{ at: at(0), source: 'disk', kind: 'seen', rev: 'r1', changes: [] }], { versions: [{ commit: commit('c1', 5, 'Add'), item: v1 }], dirty: false, working: v1 })
    expect(t.map((e) => (e.type === 'commit' ? 'commit' : `${e.kind}${e.uncommitted ? ' uncommitted' : ''}`))).toEqual(['commit', 'created'])
  })

  it('a journal from before this phase (no first sight) reads as before', () => {
    const journal: JournalEntry[] = [{ at: at(20), source: 'disk', kind: 'changed', changes: [{ field: 'title', from: 'First', to: 'Second' }], offline: true }]
    const git: GitFileHistory = { versions: [{ commit: commit('c2', 10, 'Retitle'), item: v2 }, { commit: commit('c1', -60, 'Add'), item: v1 }], dirty: false, working: v2 }
    expect(buildTimeline(journal, git).map((e) => (e.type === 'commit' ? 'commit' : `${e.source} ${e.kind}`))).toEqual(['disk changed', 'git changed', 'git created'])
  })

  it('the journal writes a first-sight line when it baselines a card it has never seen, and only then', () => {
    const dir = mkdtempSync(join(tmpdir(), 'b09-journal-'))
    try {
      let t = Date.UTC(2026, 10, 20, 9)
      const j = createJournal(dir, () => new Date(t))
      const rec = { data: v1 as Item, rev: 'r1' }
      j.baseline({ [v1.id]: rec })
      t += 60_000
      j.baseline({ [v1.id]: rec })
      expect(j.read(v1.id)).toEqual([{ at: new Date(Date.UTC(2026, 10, 20, 9)).toISOString(), source: 'disk', kind: 'seen', rev: 'r1', changes: [] }])
      expect(readFileSync(join(dir, `${v1.id}.last.json`), 'utf8')).toContain('"r1"')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

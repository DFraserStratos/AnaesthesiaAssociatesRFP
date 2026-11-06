/** The Diff review's text comparison: blocks, pairing, word marks, folding, and what counts as minor. */
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'
import { diffQuestions, isMinorChange } from '../shared/history.ts'
import { ELLIPSIS as E, MARK_ANY, MARK_CLOSE as C, MARK_OPEN as O, alike, foldRows, markPair, pairBlocks, sentenceFold, splitBlocks, tokenize, wordDiff } from '../shared/proseDiff.ts'
import { question } from './fixtures.ts'

describe('splitBlocks', () => {
  it('cuts paragraphs, headings, list items (with depth), quotes, tables and fenced code', () => {
    const md = ['Intro line one', 'continues here.', '', '## Heading', '- first', '  - nested', '- second', '  lazily continued', '', '> quoted', '> on', '', '| a | b |', '| - | - |', '| 1 | 2 |', '', '```', 'code', '', 'more', '```'].join('\n')
    expect(splitBlocks(md).map((b) => [b.kind, b.depth, b.text])).toEqual([
      ['para', 0, 'Intro line one\ncontinues here.'],
      ['heading', 0, '## Heading'],
      ['item', 0, '- first'],
      ['item', 1, '- nested'],
      ['item', 0, '- second\nlazily continued'],
      ['quote', 0, '> quoted\n> on'],
      ['table', 0, '| a | b |\n| - | - |\n| 1 | 2 |'],
      ['code', 0, '```\ncode\n\nmore\n```'],
    ])
  })
  it('reads empty text as no blocks, and a diagram source line by line', () => {
    expect(splitBlocks('  \n')).toEqual([])
    expect(splitBlocks('graph TD\n  A --> B', { lines: true }).map((b) => b.text)).toEqual(['graph TD', '  A --> B'])
  })
})

describe('pairBlocks', () => {
  const rows = (a: string, b: string) => pairBlocks(splitBlocks(a), splitBlocks(b)).map((r) => [r.op, r.before?.text ?? null, r.after?.text ?? null])
  it('keeps unchanged blocks level, pairs an edited one, and sets new ones against a gap', () => {
    expect(rows('One.\n\nTwo words here.\n\nThree.', 'One.\n\nTwo words here, changed.\n\nNew one about cats.\n\nThree.')).toEqual([
      ['same', 'One.', 'One.'],
      ['edited', 'Two words here.', 'Two words here, changed.'],
      ['added', null, 'New one about cats.'],
      ['same', 'Three.', 'Three.'],
    ])
  })
  it('pairs a short list item that was only extended', () => {
    expect(alike('- Contracts', '- Contracts, with their price ranges')).toBe(true)
    expect(rows('- apples\n- Contracts\n- pears', '- apples\n- Contracts, with their price ranges\n- pears')[1]![0]).toBe('edited')
  })
  it('does not pair blocks that share nothing', () => {
    expect(rows('- contract holders', '- Parties')).toEqual([
      ['removed', '- contract holders', null],
      ['added', null, '- Parties'],
    ])
  })
})

describe('word marks', () => {
  it('keeps record IDs, links and code spans whole', () => {
    expect(tokenize('See US-01.1.6 and [the list](FT-02.1) or `a b`.')).toContain('US-01.1.6')
    expect(tokenize('See US-01.1.6 and [the list](FT-02.1) or `a b`.')).toContain('[the list](FT-02.1)')
    expect(tokenize('See US-01.1.6 and [the list](FT-02.1) or `a b`.')).toContain('`a b`')
  })
  it('marks only the changed words on each side', () => {
    const d = wordDiff('records start and finish times', 'records start and end times')
    expect(d.before.filter((s) => s.changed).map((s) => s.text)).toEqual(['finish'])
    expect(d.after.filter((s) => s.changed).map((s) => s.text)).toEqual(['end'])
  })
  it('puts marks inside emphasis markers and the list bullet, so the Markdown still parses', () => {
    const p = markPair({ kind: 'item', depth: 0, text: '- Given a test system, it holds the same data.' }, { kind: 'item', depth: 0, text: '- **Repeatable.** Given a test system, it holds the same data.' })
    expect(p.rewritten).toBe(false)
    expect(p.after.startsWith('- **')).toBe(true)
    expect(p.after).toContain(`**${O}Repeatable.${C}**`)
  })
  it('never lets a mark span a line break or a table rule', () => {
    const p = markPair({ kind: 'table', depth: 0, text: '| one | two |' }, { kind: 'table', depth: 0, text: '| one | new | two |' })
    expect(p.after).toBe(`| one | ${O}new${C} | two |`)
  })
  it('keeps a quote line\'s angle outside the mark, so a quote gaining or losing a line stays one quote', () => {
    interface Node {
      type: string
      value?: string
      children?: Node[]
    }
    const parse = (md: string) => unified().use(remarkParse).use(remarkGfm).parse(md.replace(MARK_ANY, '')) as Node
    const textOf = (n: Node): string => (n.value ?? '') + (n.children ?? []).map(textOf).join('')
    const oneQuote = (md: string) => {
      const root = parse(md)
      expect(root.children!.map((c) => c.type)).toEqual(['blockquote'])
      expect(textOf(root)).not.toContain('>')
    }
    const short = { kind: 'quote' as const, depth: 0, text: '> The fee is set. It applies daily.' }
    const long = { kind: 'quote' as const, depth: 0, text: '> The fee is set. It applies daily.\n> New line here added now.' }
    const gained = markPair(short, long)
    const lost = markPair(long, short)
    expect(gained.rewritten).toBe(false)
    expect(gained.after).toContain(`\n> ${O}New line here added now.${C}`)
    expect(lost.before).toContain(`\n> ${O}New line here added now.${C}`)
    for (const md of [gained.after, lost.before]) {
      oneQuote(md)
      // Folded: the unchanged first sentence goes, the added line stays, still one quote.
      const folded = sentenceFold(md, 'quote')
      expect(folded).not.toBeNull()
      expect(folded).toContain(`${O}New line here added now.${C}`)
      oneQuote(folded!)
    }
  })
  it('keeps a list bullet at the start of a changed line outside the mark', () => {
    const p = markPair({ kind: 'quote', depth: 0, text: '> Rules:\n> - one rule' }, { kind: 'quote', depth: 0, text: '> Rules:\n> - one rule\n> - two rule' })
    expect(p.after).toContain(`\n> - ${O}two rule${C}`)
  })
  it('treats a block with little kept as rewritten, unmarked', () => {
    const p = markPair({ kind: 'para', depth: 0, text: 'The quick brown fox jumps over the lazy dog.' }, { kind: 'para', depth: 0, text: 'A slow green turtle crawls under the sleepy cat.' })
    expect(p.rewritten).toBe(true)
    expect(p.after).not.toContain(O)
  })
})

describe('sentenceFold', () => {
  it('keeps the sentences holding a change and folds the runs between them', () => {
    const marked = `One stays. Two ${O}changed${C} here. Three stays. Four stays. Five ${O}too${C}.`
    expect(sentenceFold(marked, 'para')).toBe(`${E} Two ${O}changed${C} here. ${E} Five ${O}too${C}.`)
  })
  it('keeps a sentence inside a change that spans sentences, and a list item its bullet', () => {
    expect(sentenceFold(`- Alpha. Beta ${O}one. Gamma${C} two. Delta. Epsilon.`, 'item')).toBe(`- ${E} Beta ${O}one. Gamma${C} two. ${E}`)
  })
  it('leaves short blocks, blocks changed throughout, and tables alone', () => {
    expect(sentenceFold(`Only ${O}one${C}. Two.`, 'para')).toBeNull()
    expect(sentenceFold(`${O}A.${C} ${O}B.${C} ${O}C.${C}`, 'para')).toBeNull()
    expect(sentenceFold(`| a. | b. | ${O}c${C}. |`, 'table')).toBeNull()
  })
})

describe('foldRows', () => {
  it('keeps one row of context either side of a change and folds the rest', () => {
    const b = (t: string) => ({ kind: 'para' as const, depth: 0, text: t })
    const same = (t: string) => ({ op: 'same' as const, before: b(t), after: b(t) })
    const out = foldRows([same('1'), same('2'), same('3'), { op: 'added', before: null, after: b('new') }, same('4'), same('5'), same('6')])
    expect(out.map((r) => ('fold' in r ? `fold:${r.fold.length}` : r.op))).toEqual(['fold:2', 'same', 'added', 'same', 'fold:2'])
  })
})

describe('minor changes', () => {
  it('counts a reorder, a reordered list and spacing as minor, and a real edit as not', () => {
    expect(isMinorChange({ field: 'order', from: 1, to: 2 })).toBe(true)
    expect(isMinorChange({ field: 'related', from: ['A', 'B'], to: ['B', 'A'] })).toBe(true)
    expect(isMinorChange({ field: 'description', from: 'One  two\n', to: 'One two' })).toBe(true)
    expect(isMinorChange({ field: 'description', from: 'One two', to: 'One three' })).toBe(false)
    expect(isMinorChange({ field: 'status', from: '1', to: '2' })).toBe(false)
  })
  it('diffs an outstanding item field by field', () => {
    expect(diffQuestions(question({ id: 'OQ-01' }), question({ id: 'OQ-01', answer: 'Yes', affects: ['US-01.1.1'] })).map((c) => c.field)).toEqual(['affects', 'answer'])
  })
})

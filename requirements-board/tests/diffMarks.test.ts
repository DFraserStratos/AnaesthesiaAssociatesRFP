/**
 * The marks plugin: the sentinels `markPair` leaves round changed words become `del` or `ins`
 * marks, running on across links, bold runs and bare record IDs, with no sentinel left anywhere,
 * and the left-out sentences' ellipsis becomes the button that opens the block.
 */
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'
import { ELLIPSIS as E, MARK_CLOSE as C, MARK_OPEN as O, markPair, splitBlocks } from '../shared/proseDiff.ts'
import { remarkDiffMarks } from '../src/diff/diffMarks.ts'

interface Node {
  type: string
  value?: string
  url?: string
  children?: Node[]
  data?: { hName?: string; hProperties?: Record<string, unknown> }
}

function tree(md: string, tag: 'del' | 'ins' = 'ins'): Node {
  const proc = unified().use(remarkParse).use(remarkGfm, { singleTilde: false })
  const t = proc.parse(md) as Node
  proc.runSync(t as never)
  remarkDiffMarks(tag)()(t as never)
  return t
}
const textOf = (n: Node): string => (n.value ?? '') + (n.children ?? []).map(textOf).join('')
const all = (n: Node): Node[] => [n, ...(n.children ?? []).flatMap(all)]
const marks = (t: Node, tag: string) => all(t).filter((n) => n.data?.hName === tag)
const SENTINEL = /[-]/

describe('remarkDiffMarks', () => {
  it('turns the marked words into ins on the after side and del on the before side', () => {
    const after = tree(`Records start and ${O}end${C} times.`, 'ins')
    expect(marks(after, 'ins').map(textOf)).toEqual(['end'])
    expect(textOf(after)).toBe('Records start and end times.')
    const before = tree(`Records start and ${O}finish${C} times.`, 'del')
    expect(marks(before, 'del').map(textOf)).toEqual(['finish'])
    expect(marks(before, 'ins')).toEqual([])
  })

  it('marks a whole link, bold run or bare ID that a change runs round, and leaves the rest alone', () => {
    const t = tree(`Read ${O}[the plan](https://x.y/z) and **the notes** for US-01.1.1${C} today.`)
    const m = marks(t, 'ins')
    expect(m.map(textOf).join('')).toBe('the plan and the notes for US-01.1.1')
    // The link and the bold run sit inside marks whole, not split.
    expect(m.some((n) => n.children?.[0]?.type === 'link' && n.children[0].url === 'https://x.y/z')).toBe(true)
    expect(m.some((n) => n.children?.[0]?.type === 'strong')).toBe(true)
    expect(all(t).some((n) => n.data?.hName === 'ins' && textOf(n).includes('today'))).toBe(false)
  })

  it('marks words inside a link without breaking its address', () => {
    const t = tree(`See [the ${O}new${C} plan](https://x.y/z) now.`)
    const link = all(t).find((n) => n.type === 'link')!
    expect(link.url).toBe('https://x.y/z')
    expect(marks(link, 'ins').map(textOf)).toEqual(['new'])
  })

  it('keeps a mark open across list items and paragraphs inside a block', () => {
    const t = tree(`- one ${O}two\n- three${C} four`)
    expect(marks(t, 'ins').map(textOf)).toEqual(['two', 'three'])
  })

  it('turns the ellipsis into the button that opens the paragraph', () => {
    const t = tree(`${E} Two ${O}changed${C} here. ${E}`)
    const buttons = all(t).filter((n) => n.data?.hName === 'button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]!.data!.hProperties).toMatchObject({ className: ['diff-ell'], type: 'button' })
    expect(buttons.map(textOf)).toEqual(['…', '…'])
  })

  it('leaves no sentinel in code, an address or anywhere else', () => {
    for (const md of [`Run \`a ${O}b${C} c\` now.`, `Go to <https://x.y/${O}new${C}> now.`, `Code ${E} in \`x ${E} y\`.`]) {
      const t = tree(md)
      for (const n of all(t)) {
        expect(n.value ?? '').not.toMatch(SENTINEL)
        expect(n.url ?? '').not.toMatch(SENTINEL)
      }
    }
    // A changed picture is one word to markPair: marked whole, its address intact.
    const words = 'The plan as agreed with the team sets out every step we take next, and'
    const m = markPair(splitBlocks(`${words} ![pic one](a/b.png) more.`)[0]!, splitBlocks(`${words} ![pic two](a/c.png) more.`)[0]!)
    expect(m.rewritten).toBe(false)
    for (const [side, tag] of [[m.before, 'del'], [m.after, 'ins']] as const) {
      const t = tree(side, tag)
      for (const n of all(t)) expect(`${n.value ?? ''}${n.url ?? ''}${(n as { alt?: string }).alt ?? ''}`).not.toMatch(SENTINEL)
      expect(marks(t, tag).some((n) => n.children?.[0]?.type === 'image')).toBe(true)
    }
    const code = all(tree(`Run \`a ${E} b\` now.`)).find((n) => n.type === 'inlineCode')!
    expect(code.value).toBe('a … b')
  })
})

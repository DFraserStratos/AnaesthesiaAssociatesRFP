import { describe, expect, it } from 'vitest'
import { autoLayout } from '../src/board/autoLayout.ts'
import { buildEdges, buildNodes, countDescendants, type GraphInput } from '../src/board/graph.ts'
import { buildIndex } from '../src/store.ts'
import type { Item, Rev } from '../shared/types.ts'
import { item } from './fixtures.ts'

const items: Item[] = [
  item({ id: 'EP-01', type: 'epic' }),
  item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }),
  item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }),
  item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, status: 'Retired' }),
  item({ id: 'US-01.0.1', parent: 'EP-01', order: 2 }),
]
const recs = Object.fromEntries(items.map((i): [string, Rev<Item>] => [i.id, { data: i, rev: 'r' }]))
const index = buildIndex(recs, {})
const input = (over: Partial<GraphInput> = {}): GraphInput => ({
  index,
  auto: autoLayout(items),
  positions: {},
  showRetired: false,
  selected: null,
  lineage: null,
  filtering: false,
  matches: new Set(),
  ...over,
})

describe('board graph', () => {
  it('hangs stories off the left spine of their feature, and joins everything else top to bottom', () => {
    const e = Object.fromEntries(buildEdges(input()).map((x) => [x.id, x]))
    expect(e['FT-01.1>US-01.1.1']).toMatchObject({ sourceHandle: 'ls', targetHandle: 'l' })
    expect(e['EP-01>US-01.0.1']).toMatchObject({ sourceHandle: undefined, targetHandle: 'l' })
    expect(e['EP-01>FT-01.1']).toMatchObject({ sourceHandle: undefined, targetHandle: undefined })
  })

  it('hides retired cards and their edges, unless shown or open in the panel', () => {
    const hidden = (g: GraphInput) => buildNodes(g, countDescendants(index)).find((n) => n.id === 'US-01.1.2')!.hidden
    expect(hidden(input())).toBe(true)
    expect(buildEdges(input()).some((e) => e.target === 'US-01.1.2')).toBe(false)
    expect(hidden(input({ showRetired: true }))).toBe(false)
    expect(hidden(input({ selected: 'US-01.1.2' }))).toBe(false)
    expect(buildEdges(input({ selected: 'US-01.1.2' })).some((e) => e.target === 'US-01.1.2')).toBe(true)
  })

  it('uses a dragged position over the story-map place', () => {
    const n = buildNodes(input({ positions: { 'US-01.1.1': { x: 5, y: 6 } } }), countDescendants(index)).find((x) => x.id === 'US-01.1.1')!
    expect(n.position).toEqual({ x: 5, y: 6 })
    expect(n.handles?.length).toBeGreaterThan(0)
  })

  it('tones the selected lineage, and fades filtered-out cards first', () => {
    const lineage = new Set(['EP-01', 'FT-01.1', 'US-01.1.1'])
    const tones = Object.fromEntries(
      buildNodes(input({ selected: 'US-01.1.1', lineage, filtering: true, matches: new Set(['EP-01', 'FT-01.1', 'US-01.1.1']) }), countDescendants(index)).map((n) => [n.id, n.data.tone]),
    )
    expect(tones).toMatchObject({ 'US-01.1.1': 'is-selected', 'FT-01.1': 'is-lit', 'US-01.0.1': 'is-faded' })
  })

  it('counts descendants at any depth', () => {
    expect(countDescendants(index).get('EP-01')).toBe(4)
  })
})

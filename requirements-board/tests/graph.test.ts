import { describe, expect, it } from 'vitest'
import { autoLayout } from '../src/board/autoLayout.ts'
import { buildEdges, buildNodes, countDescendants, type GraphInput } from '../src/board/graph.ts'
import { buildIndex, shownIndex } from '../src/store.ts'
import type { Item, Rev } from '../shared/types.ts'
import { item } from './fixtures.ts'

const items: Item[] = [
  item({ id: 'EP-01', type: 'epic' }),
  item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }),
  item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }),
  item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, status: '5' }),
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

  it('joins only the open lineage in Mapped, a feature rising straight to its epic', () => {
    const lineage = new Set(['EP-01', 'FT-01.1', 'US-01.1.1'])
    const e = Object.fromEntries(buildEdges(input({ selected: 'US-01.1.1', lineage }), { mapped: true }).map((x) => [x.id, x]))
    expect(Object.keys(e).sort()).toEqual(['EP-01>FT-01.1', 'FT-01.1>US-01.1.1'])
    expect(e['EP-01>FT-01.1']!.type).toBe('rise')
    expect(e['FT-01.1>US-01.1.1']!.type).toBe('smoothstep')
    expect(buildEdges(input(), { mapped: true })).toEqual([])
  })

  it('counts descendants at any depth, only the shown ones when retired cards are hidden', () => {
    expect(countDescendants(index).get('EP-01')).toBe(4)
    expect(countDescendants(shownIndex(index, false)).get('EP-01')).toBe(3)
    expect(countDescendants(shownIndex(index, true)).get('EP-01')).toBe(4)
  })

  it('hides a live card under a retired one with it', () => {
    const under: Item[] = [...items.map((i) => (i.id === 'FT-01.1' ? { ...i, status: '5' as const } : i))]
    const idx = buildIndex(Object.fromEntries(under.map((i): [string, Rev<Item>] => [i.id, { data: i, rev: 'r' }])), {})
    const g = input({ index: idx, auto: autoLayout(under) })
    const node = (gi: GraphInput) => buildNodes(gi, countDescendants(idx)).find((n) => n.id === 'US-01.1.1')!
    expect(node(g).hidden).toBe(true)
    expect(node({ ...g, showRetired: true }).hidden).toBe(false)
    expect(node({ ...g, selected: 'US-01.1.1' }).hidden).toBe(false)
  })

  it('after a one-card change, every other card keeps its node and data, so only that card re-renders (B07: R-159)', () => {
    const first = buildNodes(input(), countDescendants(index))
    const prev = new Map(first.map((n) => [n.id, n]))
    // One card retitled: a new record for it, the same records for the rest (as a delivery leaves them).
    const changed = { ...recs, 'US-01.1.1': { data: { ...recs['US-01.1.1']!.data, title: 'Renamed' }, rev: 'r2' } }
    const idx = buildIndex(changed, {})
    const next = buildNodes(input({ index: idx }), countDescendants(idx), prev)
    const byId = new Map(next.map((n) => [n.id, n]))
    for (const n of first) {
      if (n.id === 'US-01.1.1') continue
      expect(byId.get(n.id), n.id).toBe(n)
    }
    expect(byId.get('US-01.1.1')).not.toBe(prev.get('US-01.1.1'))
    expect(byId.get('US-01.1.1')!.data.item.title).toBe('Renamed')
    // A card whose tone or count changed gets new data; one only moved keeps its data but not its node.
    const toned = buildNodes(input({ index: idx, selected: 'US-01.0.1', lineage: new Set(['EP-01', 'US-01.0.1']) }), countDescendants(idx), byId)
    expect(toned.find((n) => n.id === 'US-01.0.1')!.data).not.toBe(byId.get('US-01.0.1')!.data)
    const moved = buildNodes(input({ index: idx, positions: { 'US-01.0.1': { x: 1, y: 1 } } }), countDescendants(idx), byId).find((n) => n.id === 'US-01.0.1')!
    expect(moved).not.toBe(byId.get('US-01.0.1'))
    expect(moved.data).toBe(byId.get('US-01.0.1')!.data)
  })
})

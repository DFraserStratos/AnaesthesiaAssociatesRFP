import { describe, expect, it } from 'vitest'
import { applyMove } from '../shared/move.ts'
import type { Item } from '../shared/types.ts'
import { CARD, FEATURE_Y } from '../src/board/autoLayout.ts'
import { LANE_HEAD, dropTarget, mappedLayout } from '../src/board/mappedLayout.ts'
import { item, syntheticCatalogue } from './fixtures.ts'

// 12 epics x 6 features: wide enough that Freeform would wrap into bands.
const base = syntheticCatalogue(12, 6, 3)
const laned = base.map((i, n) => (i.type === 'story' && n % 3 === 0 ? { ...i, swimlane: 'MVP' } : i))
const lanes = ['MVP', 'Phase 2']

describe('mappedLayout', () => {
  it('places every item in one strip, deterministically', () => {
    const m = mappedLayout(base, { lanes: [] })
    expect(Object.keys(m.placements)).toHaveLength(base.length)
    expect(mappedLayout([...base].reverse(), { lanes: [] })).toEqual(m)
    const epics = base.filter((i) => i.type === 'epic').map((i) => m.placements[i.id]!)
    expect(new Set(epics.map((p) => p.y))).toEqual(new Set([0]))
    for (let n = 1; n < epics.length; n++) expect(epics[n]!.x).toBeGreaterThan(epics[n - 1]!.x + epics[n - 1]!.w)
  })

  it('spans each epic over its features, with a headless column for stories directly under it', () => {
    const m = mappedLayout(base, { lanes: [] })
    const ep = m.placements['EP-12']!
    expect(m.placements['FT-12.1']!.x).toBe(ep.x)
    expect(m.placements['FT-12.1']!.y).toBe(FEATURE_Y)
    const direct = m.placements['US-12.0.1']!
    expect(direct.x).toBeGreaterThan(m.placements['FT-12.6']!.x)
    expect(direct.x + direct.w).toBe(ep.x + ep.w)
    expect(m.columns.find((c) => c.parent === 'EP-12')?.direct).toBe(true)
  })

  it('has one headerless lane until lanes are named, then Unassigned first', () => {
    const plain = mappedLayout(base, { lanes: [] })
    expect(plain.lanes).toHaveLength(1)
    expect(plain.lanes[0]).toMatchObject({ key: null, head: 0 })
    const m = mappedLayout(laned, { lanes })
    expect(m.lanes.map((l) => [l.key, l.name])).toEqual([
      [null, 'Unassigned'],
      ['MVP', 'MVP'],
      ['Phase 2', 'Phase 2'],
    ])
    expect(m.lanes[0]!.head).toBe(LANE_HEAD)
    expect(mappedLayout(laned, { lanes, firstLane: 'Backlog' }).lanes[0]!.name).toBe('Backlog')
  })

  it('stacks each column by lane, sizes each lane to its tallest stack, and never overlaps two cards', () => {
    const m = mappedLayout(laned, { lanes })
    const [un, mvp, p2] = m.lanes
    expect(mvp!.y).toBe(un!.y + un!.h)
    expect(p2!.count).toBe(0)
    expect(p2!.h).toBeGreaterThanOrEqual(LANE_HEAD + CARD.story.h)
    for (const it of laned.filter((i) => i.type === 'story')) {
      const p = m.placements[it.id]!
      const lane = m.lanes.find((l) => l.key === it.swimlane)!
      expect(p.y).toBeGreaterThanOrEqual(lane.y + lane.head)
      expect(p.y + p.h).toBeLessThanOrEqual(lane.y + lane.h)
    }
    const boxes = Object.values(m.placements)
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!, b = boxes[j]!
        expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false)
      }
  })

  it('shrinks a collapsed lane to its header and hides its stories', () => {
    const m = mappedLayout(laned, { lanes, collapsed: new Set(['MVP']) })
    const mvp = m.lanes[1]!
    expect(mvp).toMatchObject({ collapsed: true, h: LANE_HEAD })
    const inMvp = laned.filter((i) => i.swimlane === 'MVP').map((i) => i.id)
    expect(inMvp.every((id) => m.collapsed.has(id))).toBe(true)
    expect(m.adds.some((a) => a.swimlane === 'MVP')).toBe(false)
  })

  it('shows a story whose lane is not on the board, in a lane marked unknown', () => {
    const odd = [...base, item({ id: 'US-01.1.9', parent: 'FT-01.1', order: 9, swimlane: 'Phase 9' })]
    const m = mappedLayout(odd, { lanes })
    expect(m.lanes.at(-1)).toMatchObject({ key: 'Phase 9', unknown: true, count: 1 })
    expect(m.placements['US-01.1.9']!.y).toBeGreaterThanOrEqual(m.lanes.at(-1)!.y)
  })

  it('puts an add slot at the foot of every column in every lane', () => {
    const m = mappedLayout(laned, { lanes })
    const cols = m.columns.filter((c) => c.parent).length
    expect(m.adds).toHaveLength(cols * 3)
  })

  it('keeps hidden (retired) cards at the foot of their stack, out of the lane height', () => {
    const retired = base.map((i) => (i.id === 'US-01.1.1' ? { ...i, status: 'Retired' as const } : i))
    const shown = mappedLayout(retired, { lanes: [] })
    const hidden = mappedLayout(retired, { lanes: [], visible: (i: Item) => i.status !== 'Retired' })
    expect(hidden.placements['US-01.1.1']!.y).toBeGreaterThan(hidden.placements['US-01.1.2']!.y)
    expect(hidden.lanes[0]!.count).toBe(shown.lanes[0]!.count - 1)
  })

  it('gives a hidden (retired) feature no column and no add slot', () => {
    const retired = base.map((i) => (i.id === 'FT-01.2' ? { ...i, status: 'Retired' as const } : i))
    const visible = (i: Item) => i.status !== 'Retired' && retired.find((p) => p.id === i.parent)?.status !== 'Retired'
    const shown = mappedLayout(retired, { lanes: [] })
    const hidden = mappedLayout(retired, { lanes: [], visible })
    expect(hidden.columns.some((c) => c.parent === 'FT-01.2')).toBe(false)
    expect(hidden.adds.some((a) => a.parent === 'FT-01.2')).toBe(false)
    expect(hidden.placements['FT-01.2']).toBeUndefined()
    expect(hidden.columns).toHaveLength(shown.columns.length - 1)
    expect(hidden.placements['EP-01']!.w).toBeLessThan(shown.placements['EP-01']!.w)
  })
})

describe('dropTarget', () => {
  const m = mappedLayout(laned, { lanes })
  it('reads a feature slot from the pointer x, within the epic under it', () => {
    const rest = mappedLayout(
      laned.filter((i) => i.id !== 'FT-02.5' && i.parent !== 'FT-02.5'),
      { lanes },
    )
    const over = m.placements['FT-01.3']!
    const t = dropTarget(rest, { x: over.x + 10, y: FEATURE_Y + 20 }, laned.find((i) => i.id === 'FT-02.5')!)
    expect(t).toEqual({ id: 'FT-02.5', parent: 'EP-01', index: 2 })
  })

  it('refuses a feature dropped over the lanes and a story dropped on the backbone', () => {
    const f = laned.find((i) => i.id === 'FT-01.1')!
    const s = laned.find((i) => i.id === 'US-01.1.1')!
    expect(dropTarget(m, { x: 10, y: m.lanes[0]!.y + 100 }, f)).toBeNull()
    expect(dropTarget(m, { x: 10, y: FEATURE_Y + 10 }, s)).toBeNull()
  })

  it('reads a story slot from the column, lane and height under the pointer', () => {
    const s = laned.find((i) => i.id === 'US-03.2.1')!
    const mvp = m.lanes[1]!
    const col = m.placements['FT-01.2']!
    const t = dropTarget(m, { x: col.x + 30, y: mvp.y + mvp.head + 2 }, s)
    expect(t).toMatchObject({ parent: 'FT-01.2', index: 0, swimlane: 'MVP' })
    const moved = applyMove(laned, t!)
    expect(moved.find((i) => i.id === 'US-03.2.1')).toMatchObject({ parent: 'FT-01.2', swimlane: 'MVP' })
  })
})

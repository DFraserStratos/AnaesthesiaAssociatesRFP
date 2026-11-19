/**
 * B11: the board canvas always draws every live card and the open card, and a drop lands where the
 * bar showed (FINDINGS R-29, R-86, R-113, R-114). Pure: the layouts, the graph and the move planner,
 * hit-tested through `dragLayout`, the same function the board's drag uses.
 */
import { describe, expect, it } from 'vitest'
import { applyChanges, applyMove, planMove, type Move } from '../shared/move.ts'
import { retiredTest } from '../shared/statuses.ts'
import type { Item, Rev } from '../shared/types.ts'
import { autoLayout, CARD, type Placement } from '../src/board/autoLayout.ts'
import { buildNodes, countDescendants, isShown, type GraphInput } from '../src/board/graph.ts'
import { dragHold, dragLayout, dropTarget, mappedLayout, stackKey, type MappedLayout, type MappedOptions } from '../src/board/mappedLayout.ts'
import { buildIndex, descendantsOf, type Index } from '../src/store.ts'
import { item } from './fixtures.ts'

const RETIRED = '5' as const
const indexOf = (items: Item[]): Index => buildIndex(Object.fromEntries(items.map((i): [string, Rev<Item>] => [i.id, { data: i, rev: 'r' }])), {})
const overlaps = (a: Placement, b: Placement) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
/** The cards the board draws: placed, shown, not in a collapsed lane. */
const drawn = (m: MappedLayout, items: Item[], visible: (it: Item) => boolean = () => true) => items.filter((i) => m.placements[i.id] && visible(i) && !m.collapsed.has(i.id))
function expectNoOverlap(m: MappedLayout, items: Item[], visible?: (it: Item) => boolean) {
  const cards = drawn(m, items, visible)
  for (let a = 0; a < cards.length; a++)
    for (let b = a + 1; b < cards.length; b++) {
      const pa = m.placements[cards[a]!.id]!
      const pb = m.placements[cards[b]!.id]!
      // An epic spans its own columns: its features and stories sit below it, never beside it.
      expect(overlaps(pa, pb), `${cards[a]!.id} overlaps ${cards[b]!.id}`).toBe(false)
    }
}
/** The visible test the board uses (graph.ts): retired hidden, the open card and its ancestors always shown. */
const shownTest = (items: Item[], selected: string | null, showRetired = false) => {
  const index = indexOf(items)
  return (it: Item) => isShown(it, { index, showRetired, selected })
}

describe('every card is placed on the Mapped board (R-29)', () => {
  const cat: Item[] = [
    item({ id: 'EP-01', type: 'epic', order: 1 }),
    item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }),
    item({ id: 'US-01.1.1', parent: 'FT-01.1' }),
    // A feature whose epic is missing, its stories in the first lane and in MVP.
    item({ id: 'FT-02.1', type: 'feature', parent: 'EP-02' }),
    item({ id: 'US-02.1.1', parent: 'FT-02.1', order: 1 }),
    item({ id: 'US-02.1.2', parent: 'FT-02.1', order: 2, swimlane: 'MVP' }),
    // A feature under a feature (a parent of the wrong type), a story under it in MVP.
    item({ id: 'FT-03.1', type: 'feature', parent: 'FT-01.1' }),
    item({ id: 'US-03.1.1', parent: 'FT-03.1', swimlane: 'MVP' }),
    // An epic with a parent that does not exist: a feature, then a story, two deep under it.
    item({ id: 'EP-05', type: 'epic', parent: 'EP-00', order: 5 }),
    item({ id: 'FT-05.1', type: 'feature', parent: 'EP-05' }),
    item({ id: 'US-05.1.1', parent: 'FT-05.1', swimlane: 'MVP' }),
    // A parent cycle no epic reaches, with a story hanging off it.
    item({ id: 'EP-04', type: 'epic', parent: 'FT-04.1', order: 4 }),
    item({ id: 'FT-04.1', type: 'feature', parent: 'EP-04' }),
    item({ id: 'US-04.1.1', parent: 'FT-04.1' }),
  ]
  const m = mappedLayout(cat, { lanes: ['MVP'] })

  it('places every card, whatever its parent chain, and nothing overlaps', () => {
    expect(cat.filter((i) => !m.placements[i.id]).map((i) => i.id)).toEqual([])
    expectNoOverlap(m, cat)
  })

  it('draws each orphan with what hangs under it, lane by lane, and counts them in their lanes', () => {
    const mvp = m.lanes.find((l) => l.key === 'MVP')!
    const first = m.lanes[0]!
    for (const id of ['US-02.1.2', 'US-03.1.1', 'US-05.1.1']) expect(m.placements[id]!.y).toBeGreaterThanOrEqual(mvp.y + mvp.head)
    // A feature comes before its own stories in the orphan column's first lane.
    const orphanFirst = m.stacks.get(stackKey(null, null))!
    expect(orphanFirst.indexOf('FT-02.1')).toBeLessThan(orphanFirst.indexOf('US-02.1.1'))
    expect(orphanFirst.indexOf('FT-04.1')).toBeLessThan(orphanFirst.indexOf('US-04.1.1'))
    expect(mvp.count).toBe(3)
    expect(first.count + mvp.count).toBe(cat.filter((i) => m.placements[i.id]!.y >= first.y).length)
    // The lanes are tall enough for what they hold: every card ends inside its own lane.
    for (const l of m.lanes) for (const id of [...m.stacks].filter(([k]) => k.endsWith(`|${l.key ?? ''}`)).flatMap(([, ids]) => ids)) expect(m.placements[id]!.y + CARD.story.h).toBeLessThanOrEqual(l.y + l.h)
  })

  it('offers no add slot and no drop column for the orphans', () => {
    expect(m.adds.every((a) => a.parent !== null)).toBe(true)
    expect(m.columns.filter((c) => c.parent === null)).toHaveLength(1)
    const story = cat.find((i) => i.id === 'US-01.1.1')!
    const orphanX = m.columns.find((c) => c.parent === null)!.x
    const t = dropTarget(dragLayout(cat, story, new Set([story.id]), { lanes: ['MVP'] }), { x: orphanX + 20, y: m.lanes[0]!.y + 10 }, story)
    expect(t?.parent ?? null).not.toBeNull()
  })

  it('places the same cards as Freeform does', () => {
    expect(Object.keys(m.placements).sort()).toEqual(Object.keys(autoLayout(cat)).sort())
  })
})

describe('the open card is always drawn (R-113, R-114)', () => {
  const cat: Item[] = [
    item({ id: 'EP-01', type: 'epic' }),
    item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', order: 1, status: RETIRED }),
    item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }),
    item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, status: RETIRED }),
    item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 2, status: RETIRED }),
    item({ id: 'US-01.2.1', parent: 'FT-01.2' }),
    item({ id: 'FT-01.3', type: 'feature', parent: 'EP-01', order: 3 }),
    item({ id: 'US-01.3.1', parent: 'FT-01.3', order: 1, swimlane: 'MVP' }),
    item({ id: 'US-01.3.2', parent: 'FT-01.3', order: 2, swimlane: 'MVP' }),
    item({ id: 'US-01.3.3', parent: 'FT-01.3', order: 3, swimlane: 'Later' }),
  ]
  const lanes = ['MVP', 'Later']

  it('draws a live story under a retired feature, with its ancestors, and nothing else retired', () => {
    const visible = shownTest(cat, 'US-01.1.1')
    const m = mappedLayout(cat, { lanes, visible })
    expect(m.columns.some((c) => c.parent === 'FT-01.1')).toBe(true)
    expect(drawn(m, cat, visible).map((i) => i.id)).toEqual(['EP-01', 'FT-01.1', 'US-01.1.1', 'FT-01.3', 'US-01.3.1', 'US-01.3.2', 'US-01.3.3'])
    // The graph draws the same: its open card and the retired feature over it, never the retired sibling story or feature.
    const index = indexOf(cat)
    const g: GraphInput = { index, auto: m.placements, positions: {}, collapsed: m.collapsed, showRetired: false, selected: 'US-01.1.1', lineage: null, filtering: false, matches: new Set() }
    const hidden = new Set(buildNodes(g, countDescendants(index)).filter((n) => n.hidden).map((n) => n.id))
    expect(hidden.has('FT-01.1') || hidden.has('US-01.1.1')).toBe(false)
    expect(hidden.has('US-01.1.2')).toBe(true)
    // Freeform: the same cards show.
    const free = buildNodes({ ...g, auto: autoLayout(cat), collapsed: undefined }, countDescendants(index))
    expect(free.filter((n) => !n.hidden).map((n) => n.id).sort()).toEqual(['EP-01', 'FT-01.1', 'FT-01.3', 'US-01.1.1', 'US-01.3.1', 'US-01.3.2', 'US-01.3.3'])
  })

  it('still gives a hidden feature no column when nothing under it is open', () => {
    const m = mappedLayout(cat, { lanes, visible: shownTest(cat, 'US-01.3.1') })
    expect(m.columns.some((c) => c.parent === 'FT-01.1' || c.parent === 'FT-01.2')).toBe(false)
  })

  it('draws the open card alone in its collapsed lane, which grows to hold it without overlapping the next lane (B11-Q1)', () => {
    const collapsed = new Set(['MVP'])
    const shut = mappedLayout(cat, { lanes, collapsed, visible: shownTest(cat, null) })
    expect(shut.collapsed.has('US-01.3.2')).toBe(true)
    const m = mappedLayout(cat, { lanes, collapsed, visible: shownTest(cat, 'US-01.3.2'), open: 'US-01.3.2' })
    expect(m.collapsed.has('US-01.3.2')).toBe(false)
    expect(m.collapsed.has('US-01.3.1')).toBe(true)
    const mvp = m.lanes.find((l) => l.key === 'MVP')!
    const later = m.lanes.find((l) => l.key === 'Later')!
    expect(mvp.collapsed).toBe(true)
    const card = m.placements['US-01.3.2']!
    expect(card.y).toBe(mvp.y + mvp.head)
    expect(card.y + card.h).toBeLessThanOrEqual(later.y)
    expect(mvp.y + mvp.h).toBe(later.y)
    expect(m.adds.some((a) => a.swimlane === 'MVP')).toBe(false)
    expectNoOverlap(m, cat, shownTest(cat, 'US-01.3.2'))
    // Closed again, the strip is only its header.
    expect(shut.lanes.find((l) => l.key === 'MVP')!.h).toBe(shut.lanes.find((l) => l.key === 'MVP')!.head)
  })
})

describe('a drop lands where the bar showed (R-86, R-113 merged)', () => {
  const retired = retiredTest(indexOf([]).config)
  /** Drag `id` and drop it with the pointer at `point`, hit-tested as the board does. */
  const dropAt = (items: Item[], id: string, point: { x: number; y: number }, opts: MappedOptions): Move | null => {
    const it = items.find((i) => i.id === id)!
    const subtree = new Set([id, ...descendantsOf(indexOf(items), id).map((d) => d.id)])
    return dropTarget(dragLayout(items, it, subtree, opts), point, it)
  }
  /** The middle of where `id` is drawn now, as a pointer drops it back there. */
  const middle = (m: MappedLayout, id: string) => ({ x: m.placements[id]!.x + CARD.story.w / 2, y: m.placements[id]!.y + CARD.story.h / 2 })

  const stack: Item[] = [
    item({ id: 'EP-01', type: 'epic' }),
    item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', order: 1 }),
    item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, status: RETIRED }),
    item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2 }),
    item({ id: 'US-01.1.3', parent: 'FT-01.1', order: 3 }),
    item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 2 }),
    item({ id: 'US-01.2.1', parent: 'FT-01.2', order: 1 }),
  ]

  for (const showRetired of [true, false]) {
    it(`a story dropped at the foot of a stack holding a low-order retired card lands below every live card (Show retired ${showRetired ? 'on' : 'off'})`, () => {
      const visible = shownTest(stack, null, showRetired)
      const opts = { lanes: [], visible }
      const m = mappedLayout(stack, opts)
      const foot = m.stacks.get(stackKey('FT-01.1', null))!.at(-1)!
      const at = { x: middle(m, foot).x, y: m.placements[foot]!.y + CARD.story.h + 4 }
      const t = dropAt(stack, 'US-01.2.1', at, opts)!
      expect(t).toMatchObject({ parent: 'FT-01.1', swimlane: null })
      const changes = planMove(stack, t, retired)
      // Only the moved card is written; it follows both live stories.
      expect(changes.map((c) => c.id)).toEqual(['US-01.2.1'])
      const after = applyChanges(stack, changes)
      const drawnAfter = mappedLayout(after, opts).stacks.get(stackKey('FT-01.1', null))!
      expect(drawnAfter.filter((id) => id !== 'US-01.1.1')).toEqual(['US-01.1.2', 'US-01.1.3', 'US-01.2.1'])
      // The preview the bar was drawn over is the layout that is saved.
      expect(mappedLayout(applyMove(stack, t, retired), opts).placements['US-01.2.1']).toEqual(mappedLayout(after, opts).placements['US-01.2.1'])
    })
  }

  it('a drop back in place writes nothing, whatever retired card sits between its neighbours', () => {
    const between: Item[] = [
      item({ id: 'EP-01', type: 'epic' }),
      item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }),
      item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }),
      item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, status: RETIRED }),
      item({ id: 'US-01.1.3', parent: 'FT-01.1', order: 3 }),
    ]
    for (const showRetired of [true, false]) {
      const opts = { lanes: [], visible: shownTest(between, null, showRetired) }
      const m = mappedLayout(between, opts)
      for (const id of ['US-01.1.1', 'US-01.1.3', ...(showRetired ? ['US-01.1.2'] : [])]) {
        const t = dropAt(between, id, middle(m, id), opts)!
        expect(planMove(between, t, retired), `${id} with Show retired ${showRetired}`).toEqual([])
      }
    }
  })

  it("the bottom story of a lane's tallest stack dropped back in place stays in its lane and writes nothing", () => {
    const two: Item[] = [
      item({ id: 'EP-01', type: 'epic' }),
      item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', order: 1 }),
      item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, swimlane: 'MVP' }),
      item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, swimlane: 'MVP' }),
      item({ id: 'US-01.1.3', parent: 'FT-01.1', order: 3, swimlane: 'Later' }),
      item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 2 }),
      item({ id: 'US-01.2.1', parent: 'FT-01.2', order: 1, swimlane: 'MVP' }),
    ]
    const opts = { lanes: ['MVP', 'Later'] }
    const m = mappedLayout(two, opts)
    for (const point of [middle(m, 'US-01.1.2'), { x: middle(m, 'US-01.1.2').x, y: m.placements['US-01.1.2']!.y + CARD.story.h - 2 }]) {
      const t = dropAt(two, 'US-01.1.2', point, opts)!
      expect(t).toMatchObject({ parent: 'FT-01.1', swimlane: 'MVP', index: 1 })
      expect(planMove(two, t, retired)).toEqual([])
    }
  })

  it('a lane the preview grew to take the card is the lane hit, all the way down, and the target holds still (review)', () => {
    const cat: Item[] = [
      item({ id: 'EP-01', type: 'epic' }),
      item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', order: 1 }),
      item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1, swimlane: 'MVP' }),
      item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, swimlane: 'MVP' }),
      item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 2 }),
      item({ id: 'US-01.2.1', parent: 'FT-01.2', order: 1, swimlane: 'Later' }),
    ]
    const opts = { lanes: ['MVP', 'Later'] }
    const dragged = cat.find((i) => i.id === 'US-01.2.1')!
    const hold = dragHold(cat, dragged, opts)
    const rest = dragLayout(cat, dragged, new Set([dragged.id]), opts, hold)
    // As the board draws it: the start map while nothing is targeted, then the preview of each target.
    const drawnFor = (t: Move | null) => mappedLayout(t ? applyMove(cat, t, retired) : cat, { ...opts, ...hold })
    const foot = rest.placements['US-01.1.2']!
    const t1 = dropTarget(rest, { x: foot.x + 40, y: foot.y + CARD.story.h + 4 }, dragged, drawnFor(null))!
    expect(t1).toMatchObject({ parent: 'FT-01.1', swimlane: 'MVP', index: 2 })
    // Lower, in the room MVP grew for the card: still MVP's foot, where the bar is drawn, not Later's top.
    const restMvp = rest.lanes.find((l) => l.key === 'MVP')!
    const drawnMvp = drawnFor(t1).lanes.find((l) => l.key === 'MVP')!
    const p2 = { x: foot.x + 40, y: restMvp.y + restMvp.h + 20 }
    expect(p2.y).toBeLessThan(drawnMvp.y + drawnMvp.h)
    const t2 = dropTarget(rest, p2, dragged, drawnFor(t1))!
    expect(t2).toMatchObject({ parent: 'FT-01.1', swimlane: 'MVP', index: 2 })
    expect(dropTarget(rest, p2, dragged, drawnFor(t2))).toEqual(t2)
    // Below the grown lane, in Later as drawn: Later, at its top.
    const drawnLater = drawnFor(t2).lanes.find((l) => l.key === 'Later')!
    expect(dropTarget(rest, { x: foot.x + 40, y: drawnLater.y + drawnLater.head + 4 }, dragged, drawnFor(t2))).toMatchObject({ swimlane: 'Later', index: 0 })
  })

  it("an epic's only direct story dropped back into the epic's own column writes nothing", () => {
    const direct: Item[] = [
      item({ id: 'EP-01', type: 'epic' }),
      item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', order: 1 }),
      item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }),
      item({ id: 'US-01.0.1', parent: 'EP-01', order: 2 }),
      item({ id: 'EP-02', type: 'epic', order: 2 }),
      item({ id: 'FT-02.1', type: 'feature', parent: 'EP-02' }),
    ]
    const opts = { lanes: [] }
    const m = mappedLayout(direct, opts)
    const t = dropAt(direct, 'US-01.0.1', middle(m, 'US-01.0.1'), opts)!
    expect(t).toMatchObject({ parent: 'EP-01', index: 0 })
    expect(planMove(direct, t, retired)).toEqual([])
  })
})

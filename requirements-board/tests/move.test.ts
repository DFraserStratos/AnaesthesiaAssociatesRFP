import { describe, expect, it } from 'vitest'
import { applyChanges, applyMove, driftFrom, invertChanges, laneListProblem, planMove, type Move } from '../shared/move.ts'
import type { Item } from '../shared/types.ts'
import { item } from './fixtures.ts'

// Two epics; EP-01 has three features, FT-01.1 has stories across lanes.
const items: Item[] = [
  item({ id: 'EP-01', type: 'epic', order: 1 }),
  item({ id: 'EP-02', type: 'epic', order: 2 }),
  item({ id: 'EP-03', type: 'epic', order: 3 }),
  item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', order: 1 }),
  item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 2 }),
  item({ id: 'FT-01.3', type: 'feature', parent: 'EP-01', order: 3 }),
  item({ id: 'FT-02.1', type: 'feature', parent: 'EP-02', order: 1 }),
  item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }),
  item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, swimlane: 'MVP' }),
  item({ id: 'US-01.1.3', parent: 'FT-01.1', order: 3 }),
  item({ id: 'US-01.1.4', parent: 'FT-01.1', order: 4, swimlane: 'MVP' }),
  item({ id: 'US-01.2.1', parent: 'FT-01.2', order: 1 }),
  item({ id: 'US-01.2.2', parent: 'FT-01.2', order: 2 }),
]
const byId = (list: Item[]) => new Map(list.map((i) => [i.id, i]))
const orderOf = (list: Item[], parent: string | null, filter = (_: Item) => true) =>
  list
    .filter((i) => i.parent === parent && filter(i))
    .sort((a, b) => a.order - b.order)
    .map((i) => i.id)

describe('planMove', () => {
  it('reorders a story within its feature and lane, renumbering the siblings 1..n', () => {
    const changes = planMove(items, { id: 'US-01.1.3', parent: 'FT-01.1', index: 0, swimlane: null })
    const after = applyMove(items, { id: 'US-01.1.3', parent: 'FT-01.1', index: 0, swimlane: null })
    expect(orderOf(after, 'FT-01.1', (i) => i.swimlane === null)).toEqual(['US-01.1.3', 'US-01.1.1'])
    expect(orderOf(after, 'FT-01.1')).toEqual(['US-01.1.3', 'US-01.1.1', 'US-01.1.2', 'US-01.1.4'])
    // Only records whose order changed, and nothing but order.
    expect(changes).toEqual([
      { id: 'US-01.1.3', order: 1 },
      { id: 'US-01.1.1', order: 2 },
      { id: 'US-01.1.2', order: 3 },
    ])
  })

  it('counts the slot among lane-mates: index 1 in MVP lands after the first MVP story', () => {
    const after = applyMove(items, { id: 'US-01.1.1', parent: 'FT-01.1', index: 1, swimlane: 'MVP' })
    expect(orderOf(after, 'FT-01.1', (i) => i.swimlane === 'MVP')).toEqual(['US-01.1.2', 'US-01.1.1', 'US-01.1.4'])
    expect(byId(after).get('US-01.1.1')!.swimlane).toBe('MVP')
  })

  it('moves a story across lanes without touching its parent', () => {
    const changes = planMove(items, { id: 'US-01.1.3', parent: 'FT-01.1', index: 0, swimlane: 'MVP' })
    const mine = changes.find((c) => c.id === 'US-01.1.3')!
    expect(mine.swimlane).toBe('MVP')
    expect(mine).not.toHaveProperty('parent')
  })

  it('changes only the lane when the card already sits in its new slot', () => {
    expect(planMove(items, { id: 'US-01.1.3', parent: 'FT-01.1', index: 1, swimlane: 'MVP' })).toEqual([{ id: 'US-01.1.3', swimlane: 'MVP' }])
  })

  it('moves a story into another feature, keeping its ID and lane', () => {
    const changes = planMove(items, { id: 'US-01.1.2', parent: 'FT-01.2', index: 0 })
    expect(changes.find((c) => c.id === 'US-01.1.2')).toEqual({ id: 'US-01.1.2', parent: 'FT-01.2', order: 3 }) // no MVP peers there: appended
    const after = applyMove(items, { id: 'US-01.1.2', parent: 'FT-01.2', index: 0, swimlane: null })
    expect(orderOf(after, 'FT-01.2')).toEqual(['US-01.1.2', 'US-01.2.1', 'US-01.2.2'])
    // The feature it left keeps its gap.
    expect(changes.some((c) => c.id === 'US-01.1.3')).toBe(false)
  })

  it('moves a story straight under an epic', () => {
    const after = applyMove(items, { id: 'US-01.2.2', parent: 'EP-01', index: 0, swimlane: null })
    expect(byId(after).get('US-01.2.2')!.parent).toBe('EP-01')
  })

  it('reorders features, and moves one to another epic', () => {
    expect(orderOf(applyMove(items, { id: 'FT-01.3', parent: 'EP-01', index: 0 }), 'EP-01')).toEqual(['FT-01.3', 'FT-01.1', 'FT-01.2'])
    const across = applyMove(items, { id: 'FT-01.1', parent: 'EP-02', index: 1 })
    expect(orderOf(across, 'EP-02')).toEqual(['FT-02.1', 'FT-01.1'])
    expect(byId(across).get('FT-01.1')!.id).toBe('FT-01.1')
  })

  it('reorders epics', () => {
    expect(orderOf(applyMove(items, { id: 'EP-03', parent: null, index: 1 }), null)).toEqual(['EP-01', 'EP-03', 'EP-02'])
  })

  it('returns nothing for a drop back in place', () => {
    expect(planMove(items, { id: 'FT-01.2', parent: 'EP-01', index: 1 })).toEqual([])
    expect(planMove(items, { id: 'US-01.1.2', parent: 'FT-01.1', index: 0, swimlane: 'MVP' })).toEqual([])
    expect(applyMove(items, { id: 'EP-01', parent: null, index: 0 })).toBe(items)
  })

  it('refuses a parent the type cannot have', () => {
    expect(planMove(items, { id: 'FT-01.1', parent: 'FT-01.2', index: 0 })).toEqual([])
    expect(planMove(items, { id: 'US-01.1.1', parent: null, index: 0 })).toEqual([])
    expect(planMove(items, { id: 'EP-01', parent: 'EP-02', index: 0 })).toEqual([])
    expect(planMove(items, { id: 'US-01.1.1', parent: 'US-01.1.2', index: 0 })).toEqual([])
  })

  it('ignores a lane on anything but a story', () => {
    expect(planMove(items, { id: 'FT-01.1', parent: 'EP-01', index: 0, swimlane: 'MVP' })).toEqual([])
  })

  it('keeps retired cards at the end: the slot counts live cards first', () => {
    const withRetired = items.map((i) => (i.id === 'US-01.2.1' ? { ...i, status: 'Retired' as const } : i))
    const after = applyMove(withRetired, { id: 'US-01.1.1', parent: 'FT-01.2', index: 1, swimlane: null })
    // Live peers were [US-01.2.2]; index 1 goes after it, the retired card keeps its place.
    expect(orderOf(after, 'FT-01.2')).toEqual(['US-01.2.1', 'US-01.2.2', 'US-01.1.1'])
  })
})

describe('laneListProblem', () => {
  it('accepts a clean list and refuses empty, padded and duplicate names, the first lane included', () => {
    expect(laneListProblem(['Unassigned', 'MVP', 'Phase 2'])).toBeNull()
    expect(laneListProblem(['Backlog', ''])).toMatch(/needs a name/)
    expect(laneListProblem(['Backlog', ' MVP'])).toMatch(/spaces/)
    expect(laneListProblem(['Backlog', 'MVP', 'mvp'])).toMatch(/already a lane/)
    expect(laneListProblem(['Unassigned', 'unassigned'])).toMatch(/already a lane/)
    expect(laneListProblem('MVP')).toMatch(/list/)
  })
})

describe('invertChanges', () => {
  const moves: [string, Move][] = [
    ['a reorder in one lane', { id: 'US-01.1.3', parent: 'FT-01.1', index: 0, swimlane: null }],
    ['a story into another feature', { id: 'US-01.1.2', parent: 'FT-01.2', index: 1, swimlane: null }],
    ['a lane change', { id: 'US-01.1.1', parent: 'FT-01.1', index: 0, swimlane: 'MVP' }],
    ['a feature into another epic', { id: 'FT-01.2', parent: 'EP-02', index: 0 }],
    ['an epic reorder', { id: 'EP-03', parent: null, index: 0 }],
  ]
  it.each(moves)('puts back %s exactly', (_, move) => {
    const changes = planMove(items, move)
    expect(changes.length).toBeGreaterThan(0)
    const after = applyChanges(items, changes)
    const back = invertChanges(items, changes)
    expect(applyChanges(after, back)).toEqual(items)
    // Touches the same records and fields as the move, nothing else.
    expect(back.map((c) => Object.keys(c).sort())).toEqual(changes.map((c) => Object.keys(c).sort()))
  })

  it('driftFrom names the first record no longer where the changes left it', () => {
    const changes = planMove(items, { id: 'US-01.1.2', parent: 'FT-01.2', index: 0, swimlane: null })
    const after = applyChanges(items, changes)
    expect(driftFrom(after, changes)).toBeNull()
    const moved = after.map((i) => (i.id === 'US-01.1.2' ? { ...i, parent: 'FT-01.3' } : i))
    expect(driftFrom(moved, changes)).toBe('US-01.1.2')
    // A field the changes never touched does not count.
    const retitled = after.map((i) => (i.id === 'US-01.1.2' ? { ...i, title: 'New' } : i))
    expect(driftFrom(retitled, changes)).toBeNull()
  })
})

/** Stepped diagrams: the pure logic in `shared/steps.ts` (the reveal fold, groups, changed balances, history). */
import { describe, expect, it } from 'vitest'
import { changedBalances, stepChanges, stepFocusAnchors, stepGroups, stepIndex, stepOf, stepState } from '../shared/steps.ts'
import type { Step } from '../shared/types.ts'

const step = (over: Partial<Step> & Pick<Step, 'id'>): Step => ({ name: over.id, group: '', caption: '', show: [], highlight: [], moves: [], balances: [], ...over })

// Four steps; `#order` is shown by both the first and the third, `.totals` by the third and fourth.
const STEPS: Step[] = [
  step({ id: 'placed', group: 'Order', show: ['#order', '#stock'], highlight: ['#order'] }),
  step({ id: 'picked', group: 'Order', show: [' #picked '], highlight: ['#picked', '#stock'] }),
  step({ id: 'paid', group: 'Payment', show: ['#order', '.totals', '#paid'] }),
  step({ id: 'closed', group: 'Order', show: ['.totals', '#closed'], highlight: ['#closed'] }),
]

describe('finding a step', () => {
  it('by its ID, or not at all', () => {
    expect(stepOf({ steps: STEPS }, 'paid')?.id).toBe('paid')
    expect(stepOf({ steps: STEPS }, 'nope')).toBeNull()
    expect(stepIndex({ steps: STEPS }, 'paid')).toBe(2)
    expect(stepIndex({ steps: STEPS }, 'nope')).toBe(-1)
    expect(stepIndex({ steps: [] }, 'paid')).toBe(-1)
  })
})

describe('stepState', () => {
  it('shows the whole drawing with no step chosen', () => {
    expect(stepState(STEPS, null)).toEqual({ hidden: [], highlight: [] })
  })

  it("hides at the first step everything a later step reveals, and highlights the step's own anchors", () => {
    // `#order` is also shown later, but the first step already revealed it.
    expect(stepState(STEPS, 0)).toEqual({ hidden: ['#picked', '.totals', '#paid', '#closed'], highlight: ['#order'] })
  })

  it('keeps what earlier steps revealed, comparing anchors trimmed', () => {
    expect(stepState(STEPS, 1)).toEqual({ hidden: ['.totals', '#paid', '#closed'], highlight: ['#picked', '#stock'] })
    expect(stepState(STEPS, 2)).toEqual({ hidden: ['#closed'], highlight: [] })
  })

  it('hides nothing at the last step', () => {
    expect(stepState(STEPS, 3)).toEqual({ hidden: [], highlight: ['#closed'] })
  })
})

describe('stepGroups', () => {
  it('groups consecutive steps with one label, keeping each position', () => {
    expect(stepGroups(STEPS).map((g) => [g.group, g.steps.map((s) => `${s.index}:${s.step.id}`)])).toEqual([
      ['Order', ['0:placed', '1:picked']],
      ['Payment', ['2:paid']],
      ['Order', ['3:closed']],
    ])
    expect(stepGroups([step({ id: 'a' }), step({ id: 'b' })]).map((g) => g.group)).toEqual([''])
    expect(stepGroups([])).toEqual([])
  })
})

describe('changedBalances', () => {
  const steps = [
    step({ id: 'a', balances: [{ account: 'Bank', amount: '$0' }, { account: 'Stock', amount: '$100' }] }),
    step({ id: 'b', balances: [{ account: 'Bank', amount: '$0' }, { account: 'Stock', amount: '$90' }, { account: 'Owed', amount: '$10' }] }),
    step({ id: 'c', balances: [{ account: 'Bank', amount: '$0' }, { account: 'Stock', amount: '$90' }] }),
  ]
  it('marks amounts that moved since the previous step, and new accounts; nothing at the first step', () => {
    expect([...changedBalances(steps, 0)]).toEqual([])
    expect([...changedBalances(steps, 1)]).toEqual(['Stock', 'Owed'])
    expect([...changedBalances(steps, 2)]).toEqual([])
    expect([...changedBalances(steps, 9)]).toEqual([])
  })
})

describe('stepChanges', () => {
  it('names steps added, removed and changed, with why', () => {
    const from = [
      step({ id: 'a', name: 'A' }),
      step({ id: 'b', name: 'B', caption: 'Old', show: ['#b'] }),
      step({ id: 'c', name: 'C', highlight: ['#c'], balances: [{ account: 'Bank', amount: '$0' }] }),
      step({ id: 'gone', name: 'Gone' }),
    ]
    const to = [
      step({ id: 'a', name: 'A' }),
      step({ id: 'b', name: 'B2', group: 'G', caption: 'New', show: ['#b', '#bb'] }),
      step({ id: 'c', name: 'C', highlight: ['#cc'], moves: [{ from: '#a', to: '#cc' }], balances: [{ account: 'Bank', amount: '$5' }] }),
      step({ id: 'new', name: 'New' }),
    ]
    const r = stepChanges(from, to)
    expect(r.added.map((s) => s.id)).toEqual(['new'])
    expect(r.removed.map((s) => s.id)).toEqual(['gone'])
    expect(r.changed).toEqual([
      { id: 'b', name: 'B2', what: ['renamed', 'group changed', 'caption changed', 'reveals changed'] },
      { id: 'c', name: 'C', what: ['highlight changed', 'moves changed', 'balances changed'] },
    ])
  })

  it('calls a step that changed places moved, and leaves the rest alone', () => {
    const from = [step({ id: 'a' }), step({ id: 'b' }), step({ id: 'c' }), step({ id: 'd' })]
    const to = [step({ id: 'a' }), step({ id: 'c' }), step({ id: 'd' }), step({ id: 'b' })]
    expect(stepChanges(from, to).changed).toEqual([{ id: 'b', name: 'b', what: ['moved'] }])
    // A step added or removed in between moves nothing.
    expect(stepChanges(from, [step({ id: 'a' }), step({ id: 'x' }), step({ id: 'c' }), step({ id: 'd' })]).changed).toEqual([])
    expect(stepChanges(from, from).changed).toEqual([])
  })
})

describe('stepFocusAnchors', () => {
  it('frames what the step highlights, with both ends of its moves', () => {
    expect(stepFocusAnchors(step({ id: 'a', show: ['#new'], highlight: [' #lit ', '#other'], moves: [{ from: '#start', to: '#lit' }] }))).toEqual(['#lit', '#other', '#start'])
  })
  it('falls back to what it reveals when it highlights nothing', () => {
    expect(stepFocusAnchors(step({ id: 'a', show: ['#new', ''], moves: [{ from: '#start', to: '#new' }] }))).toEqual(['#new', '#start'])
  })
  it('is empty for a step that names neither, moves or not, so the view stays put', () => {
    expect(stepFocusAnchors(step({ id: 'a' }))).toEqual([])
    expect(stepFocusAnchors(step({ id: 'a', moves: [{ from: '#x', to: '#y' }] }))).toEqual([])
  })
})

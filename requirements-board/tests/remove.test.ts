import { describe, expect, it } from 'vitest'
import { planDelete, unlink } from '../shared/remove.ts'
import { item, question } from './fixtures.ts'

describe('unlink', () => {
  const gone = new Set(['US-01.1.1'])
  it('turns a link to a deleted item into its text, and leaves others, images and code alone', () => {
    expect(unlink('a [one](US-01.1.1) b [two](US-01.1.2)', gone)).toBe('a one b [two](US-01.1.2)')
    expect(unlink('![pic](US-01.1.1)', gone)).toBe('![pic](US-01.1.1)')
    expect(unlink('`[x](US-01.1.1)`\n\n```\n[y](US-01.1.1)\n```\n[z](US-01.1.1)', gone)).toBe('`[x](US-01.1.1)`\n\n```\n[y](US-01.1.1)\n```\nz')
  })
})

describe('planDelete', () => {
  const items = [
    item({ id: 'EP-01', type: 'epic' }),
    item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }),
    item({ id: 'US-01.1.1', parent: 'FT-01.1' }),
    item({ id: 'US-01.0.1', parent: 'EP-01' }),
    item({ id: 'US-02.1.1', parent: 'FT-02.1', related: ['US-01.1.1', 'US-02.1.2'] }),
    item({ id: 'US-02.1.2', parent: 'FT-02.1' }),
  ]
  it('takes the whole subtree, deepest first, and only rewrites records that pointed at it', () => {
    const plan = planDelete(items, [question({ id: 'OQ-01', affects: ['FT-01.1', 'US-02.1.2'] }), question({ id: 'OQ-02', affects: ['US-02.1.2'] })], 'EP-01')
    expect(plan.doomed.map((i) => i.id)).toEqual(['US-01.0.1', 'US-01.1.1', 'FT-01.1', 'EP-01'])
    expect(plan.items.map((i) => [i.id, i.related])).toEqual([['US-02.1.1', ['US-02.1.2']]])
    expect(plan.questions.map((q) => [q.id, q.affects])).toEqual([['OQ-01', ['US-02.1.2']]])
  })
  it('plans nothing for an unknown id', () => {
    expect(planDelete(items, [], 'EP-09')).toEqual({ doomed: [], items: [], questions: [] })
  })
})

import { describe, expect, it } from 'vitest'
import type { Item } from '../shared/types.ts'
import { searchItems } from '../src/itemSearch.ts'
import { item } from './fixtures.ts'

const items: Item[] = [
  item({ id: 'EP-01', type: 'epic', title: 'Scheduling', order: 1 }),
  item({ id: 'EP-02', type: 'epic', title: 'Billing', order: 2 }),
  item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', title: 'Availability calendar', order: 1 }),
  item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', title: 'Settings', order: 2 }),
  item({ id: 'FT-02.1', type: 'feature', parent: 'EP-02', title: 'Settings', order: 1 }),
  item({ id: 'FT-02.2', type: 'feature', parent: 'EP-02', title: 'Invoice calendar sync', order: 2 }),
  item({ id: 'FT-02.3', type: 'feature', parent: 'EP-02', title: 'Old invoices', status: 'Retired', order: 3 }),
  item({ id: 'US-01.1.1', parent: 'FT-01.1', title: 'Mark a day unavailable' }),
]
const index = { items, byId: new Map(items.map((i) => [i.id, i])) }
const ids = (q: string, opts?: Parameters<typeof searchItems>[2]) => searchItems(index, q, opts).map((i) => i.id)

describe('searchItems', () => {
  it('needs every word, in any order, across title, ID and lineage', () => {
    expect(ids('calendar availability')).toEqual(['FT-01.1', 'US-01.1.1']) // the story matches through its feature
    expect(ids('billing settings')).toEqual(['FT-02.1']) // the epic's title tells the two Settings apart
    expect(ids('ft-02.2')).toEqual(['FT-02.2'])
  })

  it('ranks a title that starts with the query, then word starts, then substrings', () => {
    items.push(item({ id: 'US-02.2.1', parent: 'FT-02.2', title: 'Recalendaring', order: 1 }))
    index.byId.set('US-02.2.1', items.at(-1)!)
    try {
      // word start in the title, then inside a word, then only through the lineage
      expect(ids('calendar')).toEqual(['FT-01.1', 'FT-02.2', 'US-02.2.1', 'US-01.1.1'])
      expect(ids('invoice')).toEqual(['FT-02.2', 'US-02.2.1'])
      // a title that starts with the query beats one where it starts a later word
      expect(ids('settings')).toEqual(['FT-01.2', 'FT-02.1'])
      expect(ids('mark')).toEqual(['US-01.1.1'])
      items.push(item({ id: 'FT-01.9', type: 'feature', parent: 'EP-01', title: 'Calendar export', order: 9 }))
      index.byId.set('FT-01.9', items.at(-1)!)
      expect(ids('calendar')[0]).toBe('FT-01.9')
      items.pop()
      index.byId.delete('FT-01.9')
      expect(ids('day unav')).toEqual(['US-01.1.1'])
    } finally {
      items.pop()
      index.byId.delete('US-02.2.1')
    }
  })

  it('filters by type and excludes', () => {
    expect(ids('calendar', { types: ['epic', 'feature'] })).toEqual(['FT-01.1', 'FT-02.2'])
    expect(ids('settings', { exclude: ['FT-01.2'] })).toEqual(['FT-02.1'])
  })

  it('hides retired items unless asked', () => {
    expect(ids('old')).toEqual([])
    expect(ids('old', { includeRetired: true })).toEqual(['FT-02.3'])
  })

  it('lists parents in tree order when nothing is typed', () => {
    expect(ids('', { types: ['feature', 'epic'] })).toEqual(['EP-01', 'FT-01.1', 'FT-01.2', 'EP-02', 'FT-02.1', 'FT-02.2'])
    expect(ids('', { types: ['epic'] })).toEqual(['EP-01', 'EP-02'])
  })
})

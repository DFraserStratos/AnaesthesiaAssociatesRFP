import { describe, expect, it } from 'vitest'
import { buildIndex, shownIndex } from '../src/store.ts'
import type { Item, Rev } from '../shared/types.ts'
import { item } from './fixtures.ts'

const items: Item[] = [
  item({ id: 'EP-01', type: 'epic' }),
  item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }),
  item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }),
  item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, status: 'Retired' }),
  item({ id: 'US-01.1.3', parent: 'FT-01.1', order: 3 }),
  item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', status: 'Retired' }),
  item({ id: 'US-01.2.1', parent: 'FT-01.2' }),
  item({ id: 'EP-02', type: 'epic', status: 'Retired' }),
]
const index = buildIndex(Object.fromEntries(items.map((i): [string, Rev<Item>] => [i.id, { data: i, rev: 'r' }])), {})
const ids = (list: Item[] | undefined) => (list ?? []).map((i) => i.id)

describe('shownIndex', () => {
  it('is the full index while retired cards are shown', () => {
    expect(shownIndex(index, true)).toBe(index)
  })

  it('drops retired cards, and everything under them, from every list', () => {
    const s = shownIndex(index, false)
    expect(ids(s.epics)).toEqual(['EP-01'])
    expect(ids(s.children.get('EP-01'))).toEqual(['FT-01.1'])
    expect(ids(s.children.get('FT-01.1'))).toEqual(['US-01.1.1', 'US-01.1.3'])
    expect(s.children.has('FT-01.2')).toBe(false)
    expect(ids(s.items).sort()).toEqual(['EP-01', 'FT-01.1', 'US-01.1.1', 'US-01.1.3'])
  })

  it('still resolves a retired card by ID', () => {
    expect(shownIndex(index, false).byId.get('US-01.1.2')?.status).toBe('Retired')
  })

  it('keeps the open card in its own sibling list', () => {
    const s = shownIndex(index, false, 'US-01.1.2')
    expect(ids(s.children.get('FT-01.1'))).toEqual(['US-01.1.1', 'US-01.1.2', 'US-01.1.3'])
  })
})

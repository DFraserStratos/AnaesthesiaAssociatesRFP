import { describe, expect, it } from 'vitest'
import { buildIndex, readingWalk, shownIndex } from '../src/store.ts'
import type { Item, Rev } from '../shared/types.ts'
import { item } from './fixtures.ts'

const items: Item[] = [
  item({ id: 'EP-02', type: 'epic', order: 2 }),
  item({ id: 'FT-02.1', type: 'feature', parent: 'EP-02' }),
  item({ id: 'EP-01', type: 'epic', order: 1 }),
  item({ id: 'FT-01.2', type: 'feature', parent: 'EP-01', order: 2 }),
  item({ id: 'US-01.2.1', parent: 'FT-01.2' }),
  item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01', order: 1 }),
  item({ id: 'US-01.1.2', parent: 'FT-01.1', order: 2, status: 'Retired' }),
  item({ id: 'US-01.1.1', parent: 'FT-01.1', order: 1 }),
  item({ id: 'US-09.1.1', parent: 'FT-09.1' }),
]
const index = buildIndex(Object.fromEntries(items.map((i): [string, Rev<Item>] => [i.id, { data: i, rev: 'r' }])), {})
const ids = (list: Item[]) => list.map((i) => i.id)

describe('readingWalk', () => {
  it('runs each epic, then each feature followed by its stories', () => {
    expect(ids(readingWalk(index))).toEqual(['EP-01', 'FT-01.1', 'US-01.1.1', 'US-01.1.2', 'FT-01.2', 'US-01.2.1', 'EP-02', 'FT-02.1'])
  })

  it('skips cards the shown index hides, and orphans', () => {
    expect(ids(readingWalk(shownIndex(index, false)))).toEqual(['EP-01', 'FT-01.1', 'US-01.1.1', 'FT-01.2', 'US-01.2.1', 'EP-02', 'FT-02.1'])
  })
})

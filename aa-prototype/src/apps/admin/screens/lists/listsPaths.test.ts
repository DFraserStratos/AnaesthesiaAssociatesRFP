import { describe, expect, it } from 'vitest'
import { draftListOpenPath, isListsTab, LISTS_BASE, listsPath, listsPathFromLegacy, reviewPath } from './listsPaths'

describe('the Lists paths (US-13.1.3)', () => {
  it('builds each tab, with its query', () => {
    expect(LISTS_BASE).toBe('/admin/lists')
    expect(listsPath('draft-lists')).toBe('/admin/lists/draft-lists')
    expect(listsPath('conflicts', { cleared: '1' })).toBe('/admin/lists/conflicts?cleared=1')
    expect(listsPath('contracts-to-set')).toBe('/admin/lists/contracts-to-set')
    expect(listsPath('to-authorise', new URLSearchParams('q=kim'))).toBe('/admin/lists/to-authorise?q=kim')
    expect(draftListOpenPath('L-9')).toBe('/admin/lists/draft-lists?open=L-9')
  })

  it('puts a review page under To authorise, its id encoded', () => {
    expect(reviewPath('L-34821-2026-11-23-AM')).toBe('/admin/lists/to-authorise/L-34821-2026-11-23-AM')
    expect(reviewPath('a b')).toBe('/admin/lists/to-authorise/a%20b')
  })

  it('knows its tabs', () => {
    expect(isListsTab('conflicts')).toBe(true)
    expect(isListsTab('review')).toBe(false)
  })
})

describe('listsPathFromLegacy', () => {
  it('lands Draft Lists with its query, History read as view=history', () => {
    expect(listsPathFromLegacy('/admin/draft-lists')).toBe('/admin/lists/draft-lists')
    expect(listsPathFromLegacy('/admin/draft-lists', '?open=L-1')).toBe('/admin/lists/draft-lists?open=L-1')
    expect(listsPathFromLegacy('/admin/draft-lists', '?assigned=L-2')).toBe('/admin/lists/draft-lists?assigned=L-2')
    expect(listsPathFromLegacy('/admin/draft-lists', '?tab=history&date=2026-11-25')).toBe('/admin/lists/draft-lists?date=2026-11-25&view=history')
  })

  it('lands Conflicts with its filters', () => {
    expect(listsPathFromLegacy('/admin/conflicts', '?when=past&cleared=1')).toBe('/admin/lists/conflicts?when=past&cleared=1')
  })

  it('lands the Review queue on To authorise, its Events tab on Finances › Payments, a List on its review page', () => {
    expect(listsPathFromLegacy('/admin/review')).toBe('/admin/lists/to-authorise')
    expect(listsPathFromLegacy('/admin/review', '?tab=lists')).toBe('/admin/lists/to-authorise')
    expect(listsPathFromLegacy('/admin/review', '?tab=events')).toBe('/admin/finances/payments')
    expect(listsPathFromLegacy('/admin/review/L-1')).toBe('/admin/lists/to-authorise/L-1')
    expect(listsPathFromLegacy('/admin/review/L-1/', '?x=1')).toBe('/admin/lists/to-authorise/L-1?x=1')
  })

  it('lands an unknown shape on Draft Lists', () => {
    expect(listsPathFromLegacy('/admin/whatever')).toBe('/admin/lists/draft-lists')
  })
})

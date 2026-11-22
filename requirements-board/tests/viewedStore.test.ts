// @vitest-environment jsdom
/**
 * Viewed ticks: kept per comparison with the fingerprint each record had, cleared when the record
 * changes again, the last 20 comparisons kept, a new comparison's ticks read in the same render,
 * and a page that still works when storage is blocked.
 */
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entryOf, type Entry } from '../shared/diffModel.ts'
import { isViewed, useViewed, type Viewed } from '../src/diff/viewedStore.ts'
import { item } from './fixtures.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const KEY = 'requirements-board:diff-viewed'
const story = item({ id: 'US-01.1.1', title: 'One' })
const entry = (title: string): Entry => entryOf({ kind: 'item', id: story.id, before: story, after: { ...story, title } })

type Hook = ReturnType<typeof useViewed>
let root: Root
let host: HTMLElement
let hook: Hook
/** What each render saw, so a render with stale ticks would show up. */
let renders: { comparison: string; viewed: Viewed }[]

function Probe({ comparison }: { comparison: string }) {
  hook = useViewed(comparison)
  renders.push({ comparison, viewed: hook.viewed })
  return null
}
const show = (comparison: string) => act(() => root.render(createElement(Probe, { comparison })))
const stored = () => JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Viewed>

beforeEach(() => {
  localStorage.clear()
  host = document.createElement('div')
  root = createRoot(host)
  renders = []
})
afterEach(() => {
  act(() => root.unmount())
  vi.restoreAllMocks()
})

describe('Viewed ticks', () => {
  it('holds a tick while the record is unchanged, and drops it when it changes again', () => {
    const e = entry('Two')
    const viewed: Viewed = { [e.key]: e.fingerprint }
    expect(isViewed(viewed, e)).toBe(true)
    expect(isViewed(viewed, entry('Three'))).toBe(false)
    expect(isViewed({}, e)).toBe(false)
  })

  it('stores ticks per comparison, and reads them back', () => {
    const e = entry('Two')
    show('a..b')
    act(() => hook.set(e, true))
    expect(isViewed(hook.viewed, e)).toBe(true)
    expect(stored()['a..b']).toEqual({ [e.key]: e.fingerprint })
    // now() sees a set made in the same event, before React renders.
    act(() => {
      hook.set(e, false)
      expect(hook.now()).toEqual({})
    })
    expect(stored()['a..b']).toEqual({})
  })

  it("reads a new comparison's ticks in the same render, never drawing with the old ones", () => {
    const e = entry('Two')
    localStorage.setItem(KEY, JSON.stringify({ 'c..d': { [e.key]: e.fingerprint } }))
    show('a..b')
    act(() => hook.set(e, true))
    renders = []
    show('x..y')
    expect(renders.every((r) => r.comparison !== 'x..y' || Object.keys(r.viewed).length === 0)).toBe(true)
    renders = []
    show('c..d')
    expect(renders.filter((r) => r.comparison === 'c..d').every((r) => isViewed(r.viewed, e))).toBe(true)
    // No comparison yet: nothing ticked, and nothing written.
    show('')
    act(() => hook.set(e, true))
    expect(Object.keys(stored())).not.toContain('')
  })

  it('keeps the 20 comparisons last ticked', () => {
    const e = entry('Two')
    for (let i = 0; i < 22; i++) {
      show(`c${i}..worktree`)
      act(() => hook.set(e, true))
    }
    const keys = Object.keys(stored())
    expect(keys).toHaveLength(20)
    expect(keys).not.toContain('c0..worktree')
    expect(keys).not.toContain('c1..worktree')
    expect(keys.at(-1)).toBe('c21..worktree')
    // Ticking an older one again makes it the newest.
    show('c2..worktree')
    act(() => hook.set(entry('Other'), true))
    show('c22..worktree')
    act(() => hook.set(e, true))
    expect(Object.keys(stored())).toContain('c2..worktree')
    expect(Object.keys(stored())).not.toContain('c3..worktree')
  })

  it("keeps another tab's ticks: each tick changes only its own card (R-93)", () => {
    // Two tabs on one comparison: two hooks over one storage, each with its own memory.
    const other = createRoot(document.createElement('div'))
    let tabB!: Hook
    const ProbeB = () => ((tabB = useViewed('a..b')), null)
    try {
      show('a..b')
      act(() => other.render(createElement(ProbeB)))
      const one = entryOf({ kind: 'item', id: 'US-01.1.1', before: story, after: { ...story, title: 'Two' } })
      const two = entryOf({ kind: 'item', id: 'US-01.1.2', before: { ...story, id: 'US-01.1.2' }, after: { ...story, id: 'US-01.1.2', title: 'Two' } })
      act(() => hook.set(one, true))
      act(() => tabB.set(two, true))
      expect(stored()['a..b']).toEqual({ [one.key]: one.fingerprint, [two.key]: two.fingerprint })
      act(() => tabB.set(two, false))
      expect(stored()['a..b']).toEqual({ [one.key]: one.fingerprint })
      // Tab B ticking again never brings back what tab A unticked meanwhile.
      act(() => hook.set(one, false))
      act(() => tabB.set(two, true))
      expect(stored()['a..b']).toEqual({ [two.key]: two.fingerprint })
    } finally {
      act(() => other.unmount())
    }
  })

  it("shows ticks made in another tab at once (B09-Q4)", () => {
    const e = entry('Two')
    show('a..b')
    localStorage.setItem(KEY, JSON.stringify({ 'a..b': { [e.key]: e.fingerprint } }))
    act(() => void window.dispatchEvent(new StorageEvent('storage', { key: KEY })))
    expect(isViewed(hook.viewed, e)).toBe(true)
    expect(isViewed(hook.now(), e)).toBe(true)
  })

  it('works for the page when storage is blocked or holds rubbish', () => {
    localStorage.setItem(KEY, '{not json')
    const e = entry('Two')
    show('a..b')
    expect(hook.viewed).toEqual({})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    act(() => hook.set(e, true))
    expect(isViewed(hook.viewed, e)).toBe(true)
    // Unticking another card keeps this tab's other ticks (review).
    const other = entryOf({ kind: 'item', id: 'US-01.1.2', before: { ...story, id: 'US-01.1.2' }, after: { ...story, id: 'US-01.1.2', title: 'Two' } })
    act(() => hook.set(other, true))
    act(() => hook.set(other, false))
    expect(isViewed(hook.viewed, e)).toBe(true)
    show('c..d')
    expect(hook.viewed).toEqual({})
  })
})

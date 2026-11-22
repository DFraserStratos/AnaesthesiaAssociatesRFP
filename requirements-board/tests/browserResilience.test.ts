// @vitest-environment jsdom
/**
 * B03 · Load resilience in the browser: stored preferences of the wrong shape read as defaults and
 * never crash a view (R-51), find keeps its matches on the right characters (R-52), the Outline
 * lists every card (R-122), and the error boundary contains, reports and recovers a crash without
 * looping (B03-REQ-01, accepted decision 17). Each failed on the code before B03.
 */
import { act, createElement, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { entryOf } from '../shared/diffModel.ts'
import { countIn, findRanges } from '../src/artifacts/find.ts'
import { useClientProblems, watchPageErrors } from '../src/clientProblems.ts'
import { RegionBoundary } from '../src/components/RegionBoundary.tsx'
import { useViewed } from '../src/diff/viewedStore.ts'
import { forgetStorageNotices } from '../src/storage.ts'
import { buildIndex, useCatalogue } from '../src/store.ts'
import { readViewport } from '../src/views/BoardView.tsx'
import { readCollapsed, unplacedRoots } from '../src/views/OutlineView.tsx'
import { item } from './fixtures.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLElement
let root: Root
beforeEach(() => {
  localStorage.clear()
  forgetStorageNotices()
  useClientProblems.setState({ crashes: [], retries: {}, errors: [], repairs: [] })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.restoreAllMocks()
})
const render = (node: ReactNode) => act(() => root.render(node))

describe('stored preferences of the wrong shape (R-51)', () => {
  const VIEWED = 'requirements-board:diff-viewed'
  const story = item({ id: 'US-01.1.1' })
  const entry = entryOf({ kind: 'item', id: story.id, before: story, after: { ...story, title: 'Two' } })
  let hook: ReturnType<typeof useViewed>
  function Probe() {
    hook = useViewed('a..b')
    return null
  }

  for (const [what, value] of [
    ['null', 'null'],
    ['a number', '7'],
    ['a string', '"x"'],
    ['an array', '[1, 2]'],
    ['a comparison that is not an object', '{"a..b": null, "c..d": 5}'],
  ] as const) {
    it(`the Diff tab's Viewed store reads ${what} as no ticks, and one tick repairs it`, async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorage.setItem(VIEWED, value)
      render(createElement(Probe))
      expect(hook.viewed).toEqual({})
      act(() => hook.set(entry, true))
      const stored = JSON.parse(localStorage.getItem(VIEWED)!)
      expect(stored['a..b']).toEqual({ [entry.key]: entry.fingerprint })
      expect(Object.values(stored).every((v) => v && typeof v === 'object' && !Array.isArray(v))).toBe(true)
      await Promise.resolve() // the notice is raised after the render that read it
      expect(useClientProblems.getState().repairs.map((r) => r.key)).toContain(VIEWED)
    })
  }

  it("the board's view settings: a wrong field falls back alone; status codes are kept as saved", async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem('requirements-board:view', JSON.stringify({ statuses: ['9'], components: 'Core', boardMode: 'sideways', showRetired: true, collapsedLanes: null }))
    vi.resetModules()
    const { useView } = await import('../src/store.ts')
    const v = useView.getState()
    expect(v.statuses).toEqual(['9']) // only B02's rule prunes a status
    expect(v.components).toEqual([])
    expect(v.boardMode).toBe('mapped')
    expect(v.showRetired).toBe(true)
    expect(v.collapsedLanes).toEqual([])
    localStorage.setItem('requirements-board:view', 'null')
    vi.resetModules()
    expect((await import('../src/store.ts')).useView.getState().statuses).toEqual([])
  })

  it('the Artifacts settings: a wrong top level and a wrong field read as defaults for those parts', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem('requirements-board:artifacts', JSON.stringify({ layout: 'list', statuses: 'Current', panelW: 'wide' }))
    vi.resetModules()
    let p = (await import('../src/artifactIndex.ts')).useArtifactView.getState()
    expect([p.layout, p.statuses, p.panelW]).toEqual(['list', [], null])
    localStorage.setItem('requirements-board:artifacts', '[]')
    vi.resetModules()
    p = (await import('../src/artifactIndex.ts')).useArtifactView.getState()
    expect([p.layout, p.statuses]).toEqual(['grid', []])
  })

  it('a repair read while a view renders reaches the problem pill, with no render warning', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem('requirements-board:outline-collapsed', 'null')
    function Pill() {
      return createElement('span', null, useClientProblems((s) => s.repairs.length))
    }
    function Reader() {
      useState(readCollapsed)
      return null
    }
    render(createElement('div', null, createElement(Pill), createElement(Reader)))
    await act(async () => {})
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/Cannot update a component/)
    expect(host.textContent).toBe('1')
  })

  it('the board viewport and the Outline folds read damaged values as none', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem('requirements-board:viewport:mapped', 'null')
    expect(readViewport('mapped')).toBeUndefined()
    localStorage.setItem('requirements-board:viewport', JSON.stringify({ x: 1, y: 'a', zoom: 1 }))
    expect(readViewport('freeform')).toBeUndefined()
    localStorage.setItem('requirements-board:viewport', JSON.stringify({ x: 1, y: 2, zoom: 0.5 }))
    expect(readViewport('freeform')).toEqual({ x: 1, y: 2, zoom: 0.5 })
    localStorage.setItem('requirements-board:outline-collapsed', '{"EP-01": true}')
    expect(readCollapsed()).toEqual(new Set())
    localStorage.setItem('requirements-board:outline-collapsed', '["EP-01", 3]')
    expect(readCollapsed()).toEqual(new Set(['EP-01']))
  })
})

describe('find after a character whose lower case is longer (R-52)', () => {
  it('places each match on its characters, never throws, and counts as the string count does', () => {
    const div = document.createElement('div')
    div.innerHTML = '<p>İzmir fee and İİ fee</p><p>ΟΔΟΣ fee</p>'
    for (const q of ['fee', 'izmir', 'οδος']) {
      const ranges = findRanges(div, q, 'doc')
      expect(ranges.length).toBe(countIn(div.textContent!, q))
    }
    expect(findRanges(div, 'fee', 'doc').map((r) => r.toString())).toEqual(['fee', 'fee', 'fee'])
    expect(findRanges(div, 'οδος', 'doc').map((r) => r.toString())).toEqual(['ΟΔΟΣ'])
    expect(countIn('ΟΔΟΣ', 'ΟΔΟΣ')).toBe(1) // a final sigma in the query matches the same text
  })
})

describe('the Outline lists every card (R-122)', () => {
  it('a missing parent, a parentless feature with its stories, and a cycle are each listed once', () => {
    const recs = (list: ReturnType<typeof item>[]) => Object.fromEntries(list.map((x) => [x.id, { data: x, rev: x.id }]))
    const index = buildIndex(
      recs([
        item({ id: 'EP-01', type: 'epic' }),
        item({ id: 'FT-01.1', type: 'feature', parent: 'EP-01' }),
        item({ id: 'US-04.2.7', parent: 'FT-04.9' }),
        item({ id: 'FT-02.1', type: 'feature' }),
        item({ id: 'US-02.1.1', parent: 'FT-02.1' }),
        item({ id: 'US-03.0.1', parent: 'US-03.0.2' }),
        item({ id: 'US-03.0.2', parent: 'US-03.0.1' }),
      ]),
      {},
    )
    const { roots, reasons } = unplacedRoots(index)
    expect(roots.map((r) => r.id)).toEqual(['FT-02.1', 'US-04.2.7', 'US-03.0.1'])
    expect([...reasons.values()]).toEqual(['no parent', 'parent FT-04.9 does not exist', 'in a parent cycle'])
  })

  it('a card hanging off a cycle is listed under the cycle, which is rooted at its own lowest ID', () => {
    const recs = (list: ReturnType<typeof item>[]) => Object.fromEntries(list.map((x) => [x.id, { data: x, rev: x.id }]))
    // US-05.0.1 (the lowest ID) is not in the cycle: its parent US-05.0.8 and US-05.0.9 parent each other.
    const index = buildIndex(recs([item({ id: 'US-05.0.1', parent: 'US-05.0.8' }), item({ id: 'US-05.0.8', parent: 'US-05.0.9' }), item({ id: 'US-05.0.9', parent: 'US-05.0.8' })]), {})
    const { roots, reasons } = unplacedRoots(index)
    expect(roots.map((r) => r.id)).toEqual(['US-05.0.8'])
    expect(reasons.get('US-05.0.8')).toBe('in a parent cycle')
  })
})

describe('the error boundary (B03-REQ-01)', () => {
  let failing = true
  function Fragile({ label }: { label: string }) {
    if (failing) throw new Error(`broken ${label}`)
    return createElement('p', null, `fine ${label}`)
  }
  function Where() {
    const loc = useLocation()
    return createElement('output', null, loc.search)
  }
  const tree = (props: Partial<Parameters<typeof RegionBoundary>[0]> = {}) =>
    createElement(
      MemoryRouter,
      { initialEntries: ['/outline?item=US-01.1.1'] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: '*',
          element: createElement('div', null, createElement('nav', null, 'masthead'), createElement(Where), createElement(RegionBoundary, { region: 'view', label: 'The Outline', closes: 'item', toBoard: true, ...props, children: createElement(Fragile, { label: 'view' }) })),
        }),
      ),
    )

  beforeEach(() => {
    failing = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows the panel in place, keeps the rest, logs and reports the crash', () => {
    render(tree())
    expect(host.querySelector('nav')?.textContent).toBe('masthead')
    expect(host.querySelector('.crash-panel h2')?.textContent).toContain("The Outline couldn't be shown.")
    expect(host.textContent).toContain('broken view')
    expect(useClientProblems.getState().crashes).toMatchObject([{ region: 'view', label: 'The Outline', message: 'broken view', closable: true }])
    expect(console.error).toHaveBeenCalled()
  })

  it('Try again that fails again shows the panel again, without looping; once fixed it recovers and the report clears', () => {
    let renders = 0
    const Count = () => {
      renders++
      throw new Error('always')
    }
    render(createElement(MemoryRouter, null, createElement(RegionBoundary, { region: 'view', label: 'The Board', children: createElement(Count) })))
    act(() => (host.querySelector('.crash-actions button') as HTMLButtonElement).click()) // Try again
    expect(host.querySelector('.crash-panel')).not.toBeNull()
    // It settles at the panel: nothing renders the failing part again until something changes.
    const settled = renders
    act(() => {})
    act(() => {})
    expect(renders).toBe(settled)
    expect(useClientProblems.getState().retries.view).toBe(1)
    act(() => root.unmount())
    root = createRoot(host)
    render(tree())
    failing = false
    act(() => [...host.querySelectorAll('.crash-actions button')].find((b) => b.textContent === 'Try again')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(host.textContent).toContain('fine view')
    expect(useClientProblems.getState().crashes).toEqual([])
  })

  it('Close card clears the open card from the address, so a reload does not reopen it', () => {
    render(tree())
    expect(host.querySelector('output')?.textContent).toBe('?item=US-01.1.1')
    act(() => [...host.querySelectorAll('.crash-actions button')].find((b) => b.textContent === 'Close card')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(host.querySelector('output')?.textContent).toBe('')
  })

  it('tries once more by itself when the catalogue changes', () => {
    render(tree())
    failing = false
    act(() => useCatalogue.setState({ items: {} }))
    expect(host.textContent).toContain('fine view')
  })
})

describe('uncaught errors from clicks and promises', () => {
  it('are listed once each with a count, never a crash a boundary caught, never browser noise', () => {
    const handlers: Record<string, (e: unknown) => void> = {}
    const now: (() => void)[] = []
    watchPageErrors({ addEventListener: ((t: string, h: (e: unknown) => void) => (handlers[t] = h)) as Window['addEventListener'] }, (fn) => now.push(fn))
    const flush = () => now.splice(0).forEach((fn) => fn())
    handlers.error!({ error: new Error('click failed'), message: 'click failed' })
    handlers.error!({ error: new Error('click failed'), message: 'click failed' })
    handlers.error!({ error: null, message: 'ResizeObserver loop completed with undelivered notifications.' })
    handlers.unhandledrejection!({ reason: new TypeError('Failed to fetch') }) // the Offline entry's, not a page error
    handlers.unhandledrejection!({ reason: new Error('save failed') })
    flush()
    expect(useClientProblems.getState().errors.map((e) => [e.message, e.count])).toEqual([
      ['click failed', 2],
      ['save failed', 1],
    ])
    // React in development reports a failed render here (from a replay, a fresh error object),
    // before and after the boundary catches it: listed neither time.
    handlers.error!({ error: new Error('render failed'), message: 'render failed' })
    flush()
    useClientProblems.getState().caughtCrash('render failed')
    handlers.error!({ error: new Error('render failed'), message: 'render failed' })
    flush()
    expect(useClientProblems.getState().errors.map((e) => e.message)).toEqual(['click failed', 'save failed'])
  })
})

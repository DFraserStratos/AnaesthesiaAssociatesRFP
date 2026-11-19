// @vitest-environment jsdom
/**
 * B09 · the card timeline in the browser: an entry keeps its open state when a refresh adds one above
 * it, keys stay unique for entries sharing a time (R-95); a re-captured screenshot of this card re-reads
 * the open timeline and another card's does not (R-96, through D-10's `assets`); a line diff shows only
 * real context (R-97).
 */
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lineDiff, type TimelineEntry } from '../shared/history.ts'
import type { Rev } from '../shared/types.ts'
import { Diff, entryKeys, HistoryView } from '../src/components/HistoryView.tsx'
import { buildIndex, useCatalogue } from '../src/store.ts'
import { FIXTURE_CONFIG, item } from './fixtures.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const STORY = item({ id: 'US-01.1.1', title: 'Send an invoice' })
const rev = <T>(data: T): Rev<T> => ({ data, rev: 'r1' })
const at = (min: number) => new Date(Date.UTC(2026, 10, 20, 9, min)).toISOString()
const notes = (min: number, to: string): TimelineEntry => ({ type: 'change', at: at(min), source: 'disk', kind: 'changed', changes: [{ field: 'notes', from: 'a\nb', to }] })

let host: HTMLElement
let root: Root
let answers: TimelineEntry[][]
let calls: number
beforeEach(() => {
  calls = 0
  answers = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      const entries = answers[Math.min(calls++, answers.length - 1)] ?? []
      return new Response(JSON.stringify({ entries }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }),
  )
  useCatalogue.setState({ status: 'ready', items: { [STORY.id]: rev(STORY) }, questions: {}, artifacts: {}, issues: [], config: FIXTURE_CONFIG, layout: { positions: {}, lanes: [] }, assets: { [`assets/${STORY.id}/a.png`]: 'v1', 'assets/US-01.1.2/b.png': 'w1' } })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const settle = () => act(() => new Promise((r) => setTimeout(r, 0)))
const show = async () => {
  const s = useCatalogue.getState()
  await act(async () => root.render(h(MemoryRouter, null, h(HistoryView, { item: STORY, index: buildIndex(s.items, s.questions, s.config) }))))
  await settle()
}
const toggles = () => [...host.querySelectorAll<HTMLButtonElement>('.hist-toggle')]

describe('timeline entries keep their identity (R-95)', () => {
  it('an opened disclosure stays open on the same entry when a refresh adds a newer one', async () => {
    answers = [[notes(10, 'a\nB')], [notes(20, 'a\nC'), notes(10, 'a\nB')]]
    await show()
    await act(async () => toggles()[0]!.click())
    expect(host.querySelector('.hist-diff')?.textContent).toContain('B')
    // An agent's edit: the card's rev moves, the timeline re-reads and gets an entry above.
    await act(async () => useCatalogue.setState({ items: { [STORY.id]: { data: STORY, rev: 'r2' } } }))
    await settle()
    const [newer, older] = toggles()
    expect(newer!.getAttribute('aria-expanded')).toBe('false')
    expect(older!.getAttribute('aria-expanded')).toBe('true')
  })

  it('keys are unique for entries at the same time, and for commits of either width', () => {
    const c = (sha: string): TimelineEntry => ({ type: 'commit', at: at(1), commit: { sha, author: 'D', at: at(1), subject: 's' } })
    const keys = entryKeys([notes(1, 'x'), notes(1, 'y'), c('a'.repeat(40)), c('b'.repeat(64))])
    expect(new Set(keys).size).toBe(4)
  })
})

describe('a re-captured screenshot reaches an open timeline (R-96)', () => {
  it("re-reads on this card's screenshot version, not on another card's", async () => {
    answers = [[]]
    await show()
    expect(calls).toBe(1)
    await act(async () => useCatalogue.setState({ assets: { ...useCatalogue.getState().assets, 'assets/US-01.1.2/b.png': 'w2' } }))
    await settle()
    expect(calls).toBe(1)
    await act(async () => useCatalogue.setState({ assets: { ...useCatalogue.getState().assets, [`assets/${STORY.id}/a.png`]: 'v2' } }))
    await settle()
    expect(calls).toBe(2)
  })
})

describe('a line diff shows only real context (R-97)', () => {
  it('a one-line change in 60 lines shows only its neighbours', async () => {
    const a = Array.from({ length: 60 }, (_, i) => `line ${i + 1}`)
    const b = [...a]
    b[30] = 'changed'
    await act(async () => root.render(h(Diff, { lines: lineDiff(a.join('\n'), b.join('\n')) })))
    const shown = [...host.querySelectorAll('.hist-diff > div:not(.fold)')].map((d) => d.textContent?.replace(/^[+−]/, ''))
    expect(shown).toEqual(['line 30', 'line 31', 'changed', 'line 32'])
  })
})

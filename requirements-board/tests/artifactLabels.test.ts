// @vitest-environment jsdom
/**
 * B10 · a version that is not shown says why (R-103, B10-REQ-05; the card timeline's screenshots,
 * B10-REQ-11): "Not kept" only for the server's 404, "Could not be drawn" for a version read but not
 * drawable (a mermaid parse error, an image the browser rejects: B10-Q2), "Could not be read" for any
 * other answer, and "Not there yet" or "Removed" for no version (an empty mermaid source included).
 */
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TimelineEntry } from '../shared/history.ts'
import type { ArtifactRec, Rev } from '../shared/types.ts'

vi.mock('../src/artifacts/mermaid.ts', () => ({
  renderMermaid: async (_seed: string, source: string) => {
    if (!source.trim() || source.includes('bad')) throw new Error('Parse error on line 1')
    return '<svg xmlns="http://www.w3.org/2000/svg"/>'
  },
}))

import { VisualCompare, type Version } from '../src/artifacts/VisualCompare.tsx'
import { HistoryView } from '../src/components/HistoryView.tsx'
import { buildIndex, useCatalogue } from '../src/store.ts'
import { FIXTURE_CONFIG, item } from './fixtures.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** What the server answers a HEAD for a blob, by its hash. */
let heads: Record<string, number | 'down'>
let timeline: TimelineEntry[]
let host: HTMLElement
let root: Root

beforeEach(() => {
  heads = {}
  timeline = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') {
        const sha = /\/history-blob\/([^?]+)/.exec(url)?.[1] ?? ''
        const answer = heads[sha] ?? 200
        if (answer === 'down') throw new TypeError('Failed to fetch')
        return new Response(null, { status: answer })
      }
      return new Response(JSON.stringify({ entries: timeline }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }),
  )
  let n = 0
  URL.createObjectURL = () => `blob:test/${++n}`
  URL.revokeObjectURL = () => {}
  // The browser draws an image unless its URL names a broken one.
  HTMLImageElement.prototype.decode = function (this: HTMLImageElement) {
    return this.src.includes('broken') ? Promise.reject(new Error('EncodingError')) : Promise.resolve()
  }
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

const settle = () => act(() => new Promise((r) => setTimeout(r, 0)))
const rec = (format: 'svg' | 'mermaid'): ArtifactRec => ({ data: { id: format === 'svg' ? 'AR-01' : 'AR-03', title: 'Fixture' }, rev: 'r1', meta: { format } }) as unknown as ArtifactRec
const compare = async (format: 'svg' | 'mermaid', from: Version, to: Version) => {
  await act(async () => root.render(h(VisualCompare, { rec: rec(format), from, to })))
  for (let i = 0; i < 3; i++) await settle()
  return [...host.querySelectorAll('.hist-shot')].map((f) => (f.querySelector('img') ? 'image' : f.querySelector('.hist-shot-gone')?.textContent))
}

describe('history compare says why a version is not shown (R-103)', () => {
  it('a blob the server does not keep reads "Not kept"; any other failed answer reads "Could not be read"', async () => {
    heads = { gone: 404, err: 500 }
    expect(await compare('svg', { sha: 'gone' }, { sha: 'err' })).toEqual(['Not kept: this version was never committed', 'Could not be read: the server answered 500'])
    heads = { ok: 200, down: 'down' }
    expect(await compare('svg', { sha: 'ok' }, { sha: 'down' })).toEqual(['image', 'Could not be read: the server did not answer'])
  })

  it('a committed version the browser cannot draw reads "Could not be drawn" (B10-Q2)', async () => {
    expect(await compare('svg', { sha: 'broken' }, { sha: 'fine' })).toEqual(['Could not be drawn: not an image the browser can show', 'image'])
  })

  it('a committed mermaid source that does not parse reads "Could not be drawn" with the reason', async () => {
    expect(await compare('mermaid', { source: 'flowchart LR\n  A --> B' }, { source: 'flowchart bad' })).toEqual(['image', 'Could not be drawn: Parse error on line 1'])
  })

  it('a mermaid source added from nothing reads "Not there yet" before; one removed reads "Removed" after', async () => {
    expect(await compare('mermaid', { source: '' }, { source: 'flowchart LR\n  A --> B' })).toEqual(['Not there yet', 'image'])
    expect(await compare('mermaid', { source: 'flowchart LR\n  A --> B' }, { source: '' })).toEqual(['image', 'Removed'])
    expect(await compare('svg', null, { sha: 'ok' })).toEqual(['Not there yet', 'image'])
  })
})

describe("the card timeline's screenshots say why a version is not shown (B10-REQ-11)", () => {
  const STORY = item({ id: 'US-01.1.1', title: 'Send an invoice', images: [{ src: 'assets/US-01.1.1/a.png', viewport: 'desktop' }] })
  const rev = <T>(data: T): Rev<T> => ({ data, rev: 'r1' })
  const shots = async (from: string, to: string) => {
    timeline = [{ type: 'change', at: '2026-11-20T09:00:00.000Z', source: 'disk', kind: 'changed', changes: [{ field: 'screenshot', from: { src: 'assets/US-01.1.1/a.png', sha: from }, to: { src: 'assets/US-01.1.1/a.png', sha: to } }] }]
    useCatalogue.setState({ status: 'ready', items: { [STORY.id]: rev(STORY) }, questions: {}, artifacts: {}, issues: [], config: FIXTURE_CONFIG, layout: { positions: {}, lanes: [] }, assets: {} })
    const s = useCatalogue.getState()
    await act(async () => root.render(h(MemoryRouter, null, h(HistoryView, { item: STORY, index: buildIndex(s.items, s.questions, s.config) }))))
    await settle()
    await act(async () => host.querySelector<HTMLButtonElement>('.hist-toggle')!.click())
    // Neither image loads (jsdom has no images): each says why, from the server's answer.
    await act(async () => host.querySelectorAll('.hist-shot img').forEach((img) => img.dispatchEvent(new Event('error'))))
    for (let i = 0; i < 3; i++) await settle()
    return [...host.querySelectorAll('.hist-shot')].map((f) => f.querySelector('.hist-shot-gone')?.textContent ?? 'image')
  }

  it('404 reads "Not kept"; a file the server has but the browser cannot draw reads "Could not be drawn"', async () => {
    heads = { aaa: 404, bbb: 200 }
    expect(await shots('aaa', 'bbb')).toEqual(['Not kept: this version was never committed', 'Could not be drawn: not an image the browser can show'])
  })

  it('another server answer, or none, reads "Could not be read"', async () => {
    heads = { aaa: 500, bbb: 'down' }
    expect(await shots('aaa', 'bbb')).toEqual(['Could not be read: the server answered 500', 'Could not be read: the server did not answer'])
  })

  it('a version that loads still shows its image, linked full size', async () => {
    timeline = [{ type: 'change', at: '2026-11-20T09:00:00.000Z', source: 'disk', kind: 'changed', changes: [{ field: 'screenshot', from: { src: 'assets/US-01.1.1/a.png', sha: 'aaa' }, to: { src: 'assets/US-01.1.1/a.png', sha: 'bbb' } }] }]
    useCatalogue.setState({ status: 'ready', items: { [STORY.id]: rev(STORY) }, questions: {}, artifacts: {}, issues: [], config: FIXTURE_CONFIG, layout: { positions: {}, lanes: [] }, assets: {} })
    const s = useCatalogue.getState()
    await act(async () => root.render(h(MemoryRouter, null, h(HistoryView, { item: STORY, index: buildIndex(s.items, s.questions, s.config) }))))
    await settle()
    await act(async () => host.querySelector<HTMLButtonElement>('.hist-toggle')!.click())
    const links = [...host.querySelectorAll<HTMLAnchorElement>('.hist-shot a')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/history-blob/aaa?src=assets%2FUS-01.1.1%2Fa.png', '/history-blob/bbb?src=assets%2FUS-01.1.1%2Fa.png'])
    expect(host.querySelectorAll('.hist-shot img')).toHaveLength(2)
    expect([...host.querySelectorAll('figcaption')].map((f) => f.textContent)).toEqual(['Before', 'After'])
  })
})

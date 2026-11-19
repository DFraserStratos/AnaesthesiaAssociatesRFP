// @vitest-environment jsdom
/**
 * B10 · the Artifacts tab's saved filters can always be seen and cleared (R-106, decision 24), read
 * through the one storage rule; an item's screenshots carry their version (R-104, D-10) and the
 * lightbox sits on the page's body, above everything (R-105).
 */
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Artifact, ArtifactRec, Rev } from '../shared/types.ts'
import { useArtifactView } from '../src/artifactIndex.ts'
import { Gallery } from '../src/components/Screenshots.tsx'
import { forgetStorageNotices } from '../src/storage.ts'
import { useCatalogue } from '../src/store.ts'
import { ArtifactsView } from '../src/views/ArtifactsView.tsx'
import { FIXTURE_CONFIG, item } from './fixtures.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const artifact = (id: string, title: string, kind: Artifact['kind'], components: string[]): ArtifactRec => ({
  data: { id, title, kind, status: 'Current', supersededBy: null, citedAs: [], date: null, author: '', components, sources: [], file: null, regions: [], steps: [], stepView: null, description: '', source: '', extra: {} },
  rev: 'r1',
  meta: { format: null, fileRev: null, bounds: null, pages: null, headings: null, lines: null, points: null, bytes: null, path: null },
})
const STORY = item({
  id: 'US-01.1.1',
  title: 'Send an invoice',
  images: [
    { src: 'assets/US-01.1.1/a.png', viewport: 'desktop', app: 'web', caption: 'First' },
    { src: 'assets/US-01.1.1/b.png', viewport: 'desktop', app: 'web', caption: 'Second' },
  ],
})
const rev = <T>(data: T): Rev<T> => ({ data, rev: 'r1' })

let host: HTMLElement
let root: Root
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
  useCatalogue.setState({
    status: 'ready',
    items: { [STORY.id]: rev(STORY) },
    questions: {},
    artifacts: { 'AR-01': artifact('AR-01', 'A drawing', 'diagram', ['Core']), 'AR-02': artifact('AR-02', 'A note', 'note', ['Core']) },
    issues: [],
    config: FIXTURE_CONFIG,
    layout: { positions: {}, lanes: [] },
    assets: { 'assets/US-01.1.1/a.png': 'v1', 'assets/US-01.1.1/b.png': 'w1' },
  })
  useArtifactView.setState({ layout: 'grid', kinds: [], statuses: [], components: [], showRetired: false })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  document.querySelectorAll('.lightbox').forEach((el) => el.remove())
  vi.unstubAllGlobals()
  localStorage.clear()
})

const tab = () => act(async () => root.render(h(MemoryRouter, null, h(ArtifactsView))))
const plates = () => host.querySelectorAll('.plate').length

describe('a saved filter can always be seen and cleared (R-106)', () => {
  it('a saved kind no artifact has stays a pressed toggle with a nought, and clearing it brings the list back', async () => {
    useArtifactView.setState({ kinds: ['transcript'] })
    await tab()
    expect(plates()).toBe(0)
    const toggle = [...host.querySelectorAll<HTMLButtonElement>('.kind-toggle')].find((b) => b.textContent?.includes('Transcripts'))!
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(toggle.querySelector('.kind-count')?.textContent).toBe('0')
    await act(async () => toggle.click())
    expect(plates()).toBe(2)
  })

  it('a saved area the config no longer lists is an option, and the empty state offers Clear filters', async () => {
    useArtifactView.setState({ components: ['Retired area'] })
    await tab()
    const area = host.querySelector<HTMLSelectElement>('select[aria-label="Area"]')!
    expect(area.value).toBe('Retired area')
    expect([...area.options].map((o) => o.textContent)).toContain('Retired area')
    expect(host.querySelector('.empty')?.textContent).toContain('Nothing matches the filters.')
    await act(async () => [...host.querySelectorAll<HTMLButtonElement>('.empty button')].find((b) => b.textContent === 'Clear filters')!.click())
    expect(plates()).toBe(2)
    expect(useArtifactView.getState().components).toEqual([])
  })

  it('a status picked when it is the only status there is still has its select', async () => {
    useArtifactView.setState({ statuses: ['Current'] })
    await tab()
    expect(host.querySelector<HTMLSelectElement>('select[aria-label="Status"]')?.value).toBe('Current')
  })

  it('saved preferences go through the storage rule: unknown kinds and statuses dropped there, a damaged value falls back', async () => {
    const { readPrefs } = await import('../src/artifactIndex.ts')
    forgetStorageNotices()
    localStorage.setItem('requirements-board:artifacts', JSON.stringify({ layout: 'list', kinds: ['diagram', 'hologram'], statuses: ['Superseded', 'Draft'], components: ['Gone', 'Core'] }))
    expect(readPrefs()).toMatchObject({ layout: 'list', kinds: ['diagram'], statuses: ['Draft'], components: ['Gone'] })
    localStorage.setItem('requirements-board:artifacts', JSON.stringify({ kinds: 5, components: 'Core' }))
    expect(readPrefs()).toMatchObject({ kinds: [], components: [], layout: 'grid' })
    localStorage.setItem('requirements-board:artifacts', '{not json')
    expect(readPrefs()).toMatchObject({ kinds: [], statuses: [], components: [] })
  })
})

describe("an item's screenshots (R-104, R-105)", () => {
  const gallery = () => act(async () => root.render(h(MemoryRouter, null, h('div', { className: 'dock' }, h(Gallery, { item: STORY })))))
  const srcs = () => [...host.querySelectorAll<HTMLImageElement>('.gallery img')].map((i) => i.getAttribute('src'))

  it('each URL carries its file version; a re-capture changes only that one', async () => {
    await gallery()
    expect(srcs()).toEqual(['/requirements/assets/US-01.1.1/a.png?v=v1', '/requirements/assets/US-01.1.1/b.png?v=w1'])
    await act(async () => useCatalogue.setState({ assets: { 'assets/US-01.1.1/a.png': 'v2', 'assets/US-01.1.1/b.png': 'w1' } }))
    expect(srcs()).toEqual(['/requirements/assets/US-01.1.1/a.png?v=v2', '/requirements/assets/US-01.1.1/b.png?v=w1'])
  })

  it('the lightbox is drawn on the page body (out of the dock), shows the current version, and keeps its keys', async () => {
    await gallery()
    await act(async () => host.querySelector<HTMLButtonElement>('.shot')!.click())
    const box = document.querySelector('.lightbox')!
    expect(box.parentElement).toBe(document.body)
    expect(box.querySelector('img')?.getAttribute('src')).toBe('/requirements/assets/US-01.1.1/a.png?v=v1')
    await act(async () => useCatalogue.setState({ assets: { 'assets/US-01.1.1/a.png': 'v3', 'assets/US-01.1.1/b.png': 'w1' } }))
    expect(document.querySelector('.lightbox img')?.getAttribute('src')).toBe('/requirements/assets/US-01.1.1/a.png?v=v3')
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })))
    expect(document.querySelector('.lightbox-count')?.textContent).toBe('Web · 2 of 2')
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(document.querySelector('.lightbox')).toBeNull()
  })
})

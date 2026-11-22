// @vitest-environment jsdom
/**
 * B09 · the Diff review's cards in the browser: Open only for a record on the board now (R-91), a
 * mermaid diagram's two drawings with a seam tag that says the drawing changed (R-91), and a file
 * that changed format drawn as what each side is, never a broken image (R-92).
 */
import { act, createElement as h, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ArtifactDiff } from '../shared/diff.ts'
import { entryOf, type Entry } from '../shared/diffModel.ts'
import type { Artifact, Rev } from '../shared/types.ts'
import { DiffCard } from '../src/diff/DiffCard.tsx'
import { FileRows } from '../src/diff/DiffFile.tsx'
import { useCatalogue } from '../src/store.ts'
import { FIXTURE_CONFIG, item } from './fixtures.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// The Markdown renderer's first load is slow under a busy machine.
vi.setConfig({ testTimeout: 30_000 })

const STORY = item({ id: 'US-01.1.1', title: 'Send an invoice', description: 'Old words.' })
const rev = <T>(data: T): Rev<T> => ({ data, rev: 'r1' })
const art = (over: Partial<Artifact>): Artifact =>
  ({ id: 'AR-01', title: 'Flow', kind: 'diagram', status: 'Current', supersededBy: null, date: null, author: '', components: [], sources: [], citedAs: [], file: null, regions: [], steps: [], stepView: null, description: '', source: '', extra: {}, ...over }) as Artifact

let host: HTMLElement
let root: Root
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('# Notes\n\nThe document text.\n', { status: 200 })),
  )
  useCatalogue.setState({ status: 'ready', items: { [STORY.id]: rev(STORY) }, questions: {}, artifacts: {}, issues: [], config: FIXTURE_CONFIG, layout: { positions: {}, lanes: [] } })
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

const render = (node: ReactNode) => act(() => root.render(h(MemoryRouter, null, node)))
const card = (entry: Entry) => h(DiffCard, { entry, expanded: false, viewed: false, showMinor: false, onExpand: () => {}, onViewed: () => {} })
const buttons = () => [...host.querySelectorAll('button')].map((b) => b.textContent?.trim())
const tags = () => [...host.querySelectorAll('.diff-tag')].map((t) => t.textContent)

describe('Open opens what is on the board now (R-91)', () => {
  it('is offered for an edited record on the board', () => {
    render(card(entryOf({ kind: 'item', id: STORY.id, before: STORY, after: { ...STORY, title: 'Send it' } })))
    expect(buttons()).toContain('Open')
  })
  it('is not offered for a record deleted since the After side', () => {
    const gone = item({ id: 'US-01.1.9', title: 'Gone now' })
    render(card(entryOf({ kind: 'item', id: gone.id, before: gone, after: { ...gone, title: 'Then edited' } })))
    expect(buttons()).not.toContain('Open')
  })
})

describe('a mermaid diagram shows its drawings (R-91)', () => {
  it('an edited source shows Before and After drawings, tagged as a changed drawing', async () => {
    const before = art({ source: 'graph TD\nA --> B' })
    const after = art({ source: 'graph TD\nA --> B\nB --> C' })
    await act(async () => render(card(entryOf({ kind: 'artifact', id: 'AR-01', before, after, fileBefore: null, fileAfter: null }))))
    expect(tags()).toContain('Drawing changed')
    expect(host.querySelectorAll('.diff-picture')).toHaveLength(2)
    expect(host.textContent).not.toContain('File, unchanged')
  })
})

describe('a file that changed format (R-92)', () => {
  const rec = (before: string, after: string): ArtifactDiff => ({
    kind: 'artifact',
    id: 'AR-07',
    before: art({ id: 'AR-07', kind: 'document', file: before }),
    after: art({ id: 'AR-07', kind: 'document', file: after }),
    fileBefore: 'a'.repeat(40),
    fileAfter: 'b'.repeat(40),
  })
  for (const [from, to, md] of [
    ['artifacts/files/AR-07.md', 'artifacts/files/AR-07.svg', 'before'],
    ['artifacts/files/AR-07.svg', 'artifacts/files/AR-07.md', 'after'],
  ] as const) {
    it(`typesets the Markdown side and pictures the other (${from.split('.').pop()} to ${to.split('.').pop()})`, async () => {
      await act(async () => render(h('div', { className: 'diff-grid' }, h(FileRows, { rec: rec(from, to), changed: true }))))
      for (let n = 0; n < 100 && !host.textContent?.includes('The document text.'); n++) await act(() => new Promise((r) => setTimeout(r, 20)))
      const cells = [...host.querySelectorAll('.dc')]
      const mdCell = cells[md === 'before' ? 0 : 1]!
      const picCell = cells[md === 'before' ? 1 : 0]!
      expect(mdCell.querySelector('img')).toBeNull()
      expect(mdCell.textContent).toContain('The document text.')
      expect(picCell.querySelector('img')?.getAttribute('src')).toContain('.svg')
    })
  }
})

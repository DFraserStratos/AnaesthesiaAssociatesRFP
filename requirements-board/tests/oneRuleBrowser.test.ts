// @vitest-environment jsdom
/**
 * B04 in the browser: the shared rules agree with what the board's renderer draws (react-markdown
 * with remark-gfm), the document reader gives each heading its source slug (R-28), and a quote
 * matches on the same normalised text as the check (R-101, R-83).
 */
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { markdownFacts, mermaidNodeIds, normText } from '../shared/artifacts.ts'
import { isIdHref, mentions } from '../shared/links.ts'
import { MarkdownReader } from '../src/artifacts/MarkdownReader.tsx'
import { quoteRange } from '../src/artifacts/regionsDom.ts'
import { useCatalogue } from '../src/store.ts'
import { item } from './fixtures.ts'
import { CODE_CORPUS, HEADING_CORPUS, MERMAID_CORPUS } from './oneRuleCorpus.ts'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const rendered = (md: string) => {
  const div = document.createElement('div')
  div.innerHTML = renderToStaticMarkup(createElement(Markdown, { remarkPlugins: [remarkGfm] }, md))
  return div
}

describe('the shared rules read Markdown as the renderer draws it', () => {
  it('heading text equals the rendered heading words', () => {
    for (const [md] of HEADING_CORPUS) {
      const h = rendered(md).querySelector('h1, h2, h3, h4, h5, h6')
      expect(markdownFacts(md).headings[0]?.text, md).toBe(normText(h?.textContent ?? ''))
    }
  })
  it('a link counts exactly when the renderer draws it as a link, outside code', () => {
    for (const [md] of CODE_CORPUS) {
      const drawn = [...rendered(md).querySelectorAll('a[href]')].filter((a) => !a.closest('code, pre')).map((a) => a.getAttribute('href')!).filter(isIdHref)
      expect(mentions(md).filter((m) => !m.bare).map((m) => m.id), md).toEqual([...new Set(drawn)])
    }
  })
})

describe('mermaid node IDs equal the vertices mermaid itself declares (R-27)', () => {
  it('for every corpus diagram', { timeout: 60_000 }, async () => {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({ startOnLoad: false })
    for (const src of MERMAID_CORPUS) {
      const diagram = await mermaid.mermaidAPI.getDiagramFromText(src)
      const vertices = (diagram.db as unknown as { getVertices: () => Map<string, unknown> }).getVertices()
      expect([...(mermaidNodeIds(src) ?? [])].sort(), src).toEqual([...vertices.keys()].sort())
    }
  })
})

describe('quoteRange (R-101)', () => {
  it('matches a decomposed passage, and the range covers exactly its characters', () => {
    const NFD = 'Māori health'
    const div = document.createElement('div')
    div.innerHTML = `<p>We talked about <em>${NFD}</em> today.</p>`
    expect(quoteRange(div, 'Māori health')?.toString()).toBe(NFD)
    expect(quoteRange(div, NFD)?.toString()).toBe(NFD)
    expect(quoteRange(div, 'about Māori')?.toString()).toBe('about Māori')
  })
  it('reads a bare record ID drawn as its title by the ID it was written as', () => {
    const div = document.createElement('div')
    div.innerHTML = '<p>See <span data-source-text="EP-04"><a class="record-link bare">Contracts</a></span> for the rules.</p>'
    expect(quoteRange(div, 'See EP-04 for the rules')?.toString()).toBe('See Contracts for the rules')
    expect(quoteRange(div, 'See Contracts for')).toBeNull()
  })
})

describe('the document reader gives each heading its source slug (R-28)', () => {
  let host: HTMLDivElement
  let root: Root
  beforeEach(() => {
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
      observe() {}
      disconnect() {}
    }
    window.matchMedia ??= (() => ({ matches: true })) as never
    act(() => useCatalogue.setState({ items: { 'EP-04': { data: item({ id: 'EP-04', type: 'epic', title: 'Contracts' }), rev: 'r' } } }))
  })
  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })
  it('a heading with a record ID shows the title but keeps the server slug', () => {
    const text = '# Contract model\n\n### 9.1 Catalogue, EP-04 Contracts\n\nBody.\n\n## Q&amp;A\n\n## Q&amp;A\n'
    act(() => root.render(createElement(MemoryRouter, null, createElement(MarkdownReader, { text, spot: { region: null, auto: null }, label: 'Doc' }))))
    const hs = [...host.querySelectorAll('h1, h2, h3')]
    expect(hs[1]!.textContent).toContain('Contracts Contracts') // the ID is drawn as its title
    expect(hs.map((h) => h.getAttribute('data-slug'))).toEqual(markdownFacts(text).headings.map((h) => h.slug))
    expect(hs.map((h) => h.getAttribute('data-slug'))).toEqual(['contract-model', '91-catalogue-ep-04-contracts', 'qa', 'qa-1'])
    // The ID drawn as a title carries its source text, so a quote across it reads as the check reads it.
    expect(host.querySelector('[data-source-text]')?.getAttribute('data-source-text')).toBe('EP-04')
    expect(quoteRange(host.querySelector('.doc-sheet')!, '9.1 Catalogue, EP-04 Contracts')?.toString()).toContain('Contracts')
  })
})

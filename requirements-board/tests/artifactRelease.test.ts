// @vitest-environment jsdom
/**
 * B10 · viewers release what they open (R-13, R-163), under StrictMode as the board runs in development.
 * pdf.js is replaced by a fake that keeps pdf.js's rule (a document given no `worker` makes its own,
 * and destroying the document ends it), so the live counts are what a browser would hold. Object URLs
 * are counted through `URL.createObjectURL` and `revokeObjectURL`.
 */
import { act, Component, createElement as h, StrictMode, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fake = vi.hoisted(() => {
  const s = { workers: 0, liveWorkers: 0, docs: 0, liveDocs: 0, failPage: new Set<string>(), opened: [] as string[], gate: null as Promise<void> | null, throwOnce: new Set<string>() }
  class PDFWorker {
    gone = false
    constructor() {
      s.workers++
      s.liveWorkers++
    }
    static create() {
      return new PDFWorker()
    }
    destroy() {
      if (this.gone) return
      this.gone = true
      s.liveWorkers--
    }
  }
  function getDocument({ url, worker }: { url: string; worker?: PDFWorker }) {
    if (s.throwOnce.delete(url)) throw new Error('The API version does not match the Worker version')
    const own = worker ? null : new PDFWorker()
    s.docs++
    s.liveDocs++
    s.opened.push(url)
    const state = { destroyed: false }
    const page = {
      getViewport: ({ scale }: { scale: number }) => ({ width: 100 * scale, height: 200 * scale }),
      render: () => ({ promise: Promise.resolve() }),
      getTextContent: async () => ({ items: [] }),
    }
    const doc = {
      numPages: 2,
      state,
      getPage: async () => {
        if (state.destroyed) throw new Error('Transport destroyed')
        if (s.failPage.has(url)) throw new Error('Invalid page request')
        return page
      },
    }
    return {
      promise: (s.gate ?? Promise.resolve()).then(() => doc),
      destroy: async () => {
        if (state.destroyed) return
        state.destroyed = true
        s.liveDocs--
        own?.destroy()
      },
    }
  }
  return { s, lib: { GlobalWorkerOptions: { workerSrc: '' }, PDFWorker, getDocument } }
})
vi.mock('pdfjs-dist', () => fake.lib)
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/pdf.worker.js' }))

const mermaid = vi.hoisted(() => ({ waits: [] as (() => void)[], hold: false }))
vi.mock('../src/artifacts/mermaid.ts', () => ({
  renderMermaid: async (_seed: string, source: string) => {
    if (mermaid.hold) await new Promise<void>((r) => mermaid.waits.push(r))
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text>${source.length}</text></svg>`
  },
}))

import { useLoaded } from '../src/artifacts/content.ts'
import { MermaidPicture, PdfThumb } from '../src/artifacts/Thumb.tsx'
import { PdfReader } from '../src/artifacts/PdfReader.tsx'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLElement
let root: Root
const urls = { made: 0, revoked: 0, live: new Set<string>() }
const render = (node: ReactNode) => act(() => root.render(h(StrictMode, null, node)))
const settle = () => act(async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve()
  await new Promise((r) => setTimeout(r, 0))
})

beforeEach(() => {
  Object.assign(fake.s, { workers: 0, liveWorkers: 0, docs: 0, liveDocs: 0, opened: [], gate: null })
  fake.s.failPage.clear()
  mermaid.hold = false
  mermaid.waits = []
  Object.assign(urls, { made: 0, revoked: 0, live: new Set<string>() })
  URL.createObjectURL = () => {
    const u = `blob:test/${++urls.made}`
    urls.live.add(u)
    return u
  }
  URL.revokeObjectURL = (u: string) => {
    if (urls.live.delete(u)) urls.revoked++
  }
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAAA'
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  act(() => root.unmount())
  host.remove()
  await settle()
})

describe('PDF documents and their workers (R-13)', () => {
  it('ten thumbnails opened and closed in turn leave one worker and a bounded number of documents', async () => {
    for (let i = 0; i < 10; i++) {
      await render(h(PdfThumb, { url: `/artifact-file/AR-${i}?v=1` }))
      await settle()
      expect(host.querySelector('img.thumb-page')).not.toBeNull()
      await render(null)
      await settle()
    }
    expect(fake.s.liveWorkers).toBeLessThanOrEqual(1)
    expect(fake.s.liveDocs).toBeLessThanOrEqual(3)
  })

  it('a reader gone before its document arrives gives the document back', async () => {
    for (let i = 0; i < 5; i++) {
      let open!: () => void
      fake.s.gate = new Promise<void>((r) => (open = r))
      await render(h(PdfReader, { url: `/artifact-file/AR-late-${i}?v=1`, spot: { region: null, auto: null }, label: 'Late' }))
      expect(host.textContent).toBe('Opening the PDF')
      await render(null) // gone before the document arrives
      fake.s.gate = null
      open()
      await settle()
    }
    expect(fake.s.liveDocs).toBeLessThanOrEqual(3)
    expect(fake.s.liveWorkers).toBeLessThanOrEqual(1)
    // Nothing is held by a reader that has gone (the count above can hide one behind earlier tests' idle documents).
    const { pdfDocStats } = await import('../src/artifacts/pdfDocs.ts')
    expect(pdfDocStats().held).toBe(0)
  })

  it('a document whose page fails to read is destroyed, not kept', async () => {
    fake.s.failPage.add('/artifact-file/AR-bad?v=1')
    await render(h(PdfThumb, { url: '/artifact-file/AR-bad?v=1' }))
    await settle()
    expect(host.querySelector('img')).toBeNull()
    expect(fake.s.docs).toBeGreaterThan(0)
    expect(fake.s.liveDocs).toBe(0)
  })

  it('a load that fails before its document opens is forgotten, so the next view tries again', async () => {
    const { openPdf, closePdf } = await import('../src/artifacts/pdfDocs.ts')
    fake.s.throwOnce.add('/artifact-file/AR-retry?v=1')
    await expect(openPdf('/artifact-file/AR-retry?v=1')).rejects.toThrow(/Worker version/)
    const pdf = await openPdf('/artifact-file/AR-retry?v=1')
    expect(pdf.sizes).toHaveLength(2)
    closePdf(pdf)
  })

  it('a document still shown is never released under it, however many other views come and go', async () => {
    const { openPdf, closePdf, pdfDocStats } = await import('../src/artifacts/pdfDocs.ts')
    const held = await openPdf('/artifact-file/AR-held?v=1')
    for (let i = 0; i < 6; i++) {
      await render(h(PdfThumb, { url: i % 2 ? '/artifact-file/AR-held?v=1' : `/artifact-file/AR-other-${i}?v=1` }))
      await settle()
      await render(null)
      await settle()
    }
    expect((held.doc as unknown as { state: { destroyed: boolean } }).state.destroyed).toBe(false)
    await expect(held.doc.getPage(1)).resolves.toBeTruthy()
    // One load for the held URL, shared by the thumbnails that showed it.
    expect(fake.s.opened.filter((u) => u === '/artifact-file/AR-held?v=1')).toHaveLength(1)
    closePdf(held)
    expect(pdfDocStats().held).toBe(0)
  })

  it('a document given back and asked for again (the next compare page) is not opened twice', async () => {
    const { withPdf } = await import('../src/artifacts/pdfDocs.ts')
    for (let page = 1; page <= 5; page++) await withPdf('/history-blob/abc?artifact=AR-05', async ({ doc }) => doc.getPage(page))
    expect(fake.s.opened).toEqual(['/history-blob/abc?artifact=AR-05'])
  })
})

describe('object URLs for drawn mermaid diagrams (R-163)', () => {
  it('editing a source many times leaves one URL for the one picture on screen, none once it goes', async () => {
    for (let n = 1; n <= 6; n++) {
      await render(h(MermaidPicture, { id: 'AR-03', source: `flowchart LR\n  A --> B${'x'.repeat(n)}` }))
      await settle()
      expect(host.querySelector('img')?.getAttribute('src')).toMatch(/^blob:/)
      expect(urls.live.has(host.querySelector('img')!.getAttribute('src')!)).toBe(true)
    }
    expect(urls.live.size).toBe(1)
    await render(null)
    await settle()
    expect(urls.live.size).toBe(0)
  })

  it('a drawing that finishes after its picture went is revoked', async () => {
    mermaid.hold = true
    await render(h(MermaidPicture, { id: 'AR-03', source: 'flowchart LR\n  A --> B' }))
    await render(null)
    mermaid.hold = false
    for (const go of mermaid.waits) go()
    await settle()
    expect(urls.made).toBeGreaterThan(0)
    expect(urls.live.size).toBe(0)
  })
})

describe('useLoaded gives back what it no longer shows', () => {
  class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false }
    static getDerivedStateFromError() {
      return { failed: true }
    }
    componentDidCatch() {}
    render() {
      return this.state.failed ? h('p', null, 'Something went wrong') : this.props.children
    }
  }
  function Crashing({ crash, log }: { crash: boolean; log: string[] }) {
    const l = useLoaded('doc', async () => 'held value', (v) => log.push(`dispose ${v}`))
    if (crash && l.status === 'ready') throw new Error('viewer crashed')
    return h('span', null, l.status)
  }

  it('a viewer taken down by an error boundary gives back what it held', async () => {
    const log: string[] = []
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    await render(h(Boundary, null, h(Crashing, { crash: false, log })))
    await settle()
    log.length = 0 // StrictMode's discarded first run
    await render(h(Boundary, null, h(Crashing, { crash: true, log })))
    await settle()
    quiet.mockRestore()
    expect(host.textContent).toBe('Something went wrong')
    expect(log).toEqual(['dispose held value'])
  })

  function Probe({ k, log }: { k: string; log: string[] }) {
    const l = useLoaded(k, async () => `value ${k}`, (v) => log.push(`dispose ${v}`))
    return h('span', null, l.status === 'ready' ? l.value : l.status)
  }

  it('once per value: on a new key, on unmount and for a load that lands late (StrictMode included)', async () => {
    const log: string[] = []
    await render(h(Probe, { k: 'a', log }))
    await settle()
    expect(host.textContent).toBe('value a')
    // StrictMode's discarded first run gave its value back; the one shown is kept.
    expect(log).toEqual(['dispose value a'])
    await render(h(Probe, { k: 'b', log }))
    await settle()
    expect(host.textContent).toBe('value b')
    expect(log).toEqual(['dispose value a', 'dispose value a'])
    await render(null)
    expect(log).toEqual(['dispose value a', 'dispose value a', 'dispose value b'])
  })
})

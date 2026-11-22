/**
 * The PDF documents the board has open, shared and released (FINDINGS R-13). pdf.js is loaded only
 * when a PDF is first shown. Every document runs on one shared worker, so a page never holds more
 * than one pdf.js worker, and destroying a document leaves that worker alone.
 *
 * A view takes a document with `openPdf(url)` and gives it back with `closePdf(pdf)`, once each: the
 * reader for as long as it is mounted, a thumbnail or a compare picture just while it draws. A document
 * with no holder waits, most recent last, in a short idle list (`IDLE_PDFS`), so going back to it or
 * the next page of a comparison opens nothing again; pushed out of that list it is destroyed. A load
 * that fails (the file, or any page of it) is destroyed and forgotten, so the next view tries afresh.
 * Live documents are therefore the ones on show plus at most `IDLE_PDFS`, however many views opened.
 */
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFWorker } from 'pdfjs-dist'

type PdfJs = typeof import('pdfjs-dist')

export interface LoadedPdf {
  lib: PdfJs
  doc: PDFDocumentProxy
  sizes: { w: number; h: number }[]
}

let pdfjs: Promise<PdfJs> | null = null

export function loadPdfJs(): Promise<PdfJs> {
  return (pdfjs ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default
    return lib
  }).catch((e: unknown) => {
    pdfjs = null // a failed load (the dev server restarting) is tried again by the next PDF
    throw e
  }))
}

/** Documents with no holder kept for a quick return; the oldest is destroyed past this. */
export const IDLE_PDFS = 3

interface Entry {
  url: string
  refs: number
  task: PDFDocumentLoadingTask | null
  ready: Promise<LoadedPdf>
}

const entries = new Map<string, Entry>()
const owner = new WeakMap<LoadedPdf, Entry>()
/** URLs of documents nobody holds, oldest first. */
const idle: string[] = []
let worker: PDFWorker | null = null
let destroyed = 0

function destroy(e: Entry) {
  if (entries.get(e.url) === e) entries.delete(e.url)
  const i = idle.indexOf(e.url)
  if (i >= 0) idle.splice(i, 1)
  destroyed++
  void e.task?.destroy().catch(() => {})
}

function start(url: string): Entry {
  const e: Entry = { url, refs: 0, task: null, ready: null! }
  e.ready = (async () => {
    try {
      const lib = await loadPdfJs()
      // A worker that died (its script failed to start) is replaced, so one failure is not for good.
      if (!worker || worker.destroyed) worker = lib.PDFWorker.create({})
      const task = lib.getDocument({ url, worker })
      e.task = task
      const doc = await task.promise
      const sizes: { w: number; h: number }[] = []
      for (let n = 1; n <= doc.numPages; n++) {
        const vp = (await doc.getPage(n)).getViewport({ scale: 1 })
        sizes.push({ w: vp.width, h: vp.height })
      }
      const pdf = { lib, doc, sizes }
      owner.set(pdf, e)
      return pdf
    } catch (err) {
      destroy(e)
      throw err
    }
  })()
  return e
}

/** Take a document (one load shared by every view of the same URL); give it back with `closePdf`. */
export function openPdf(url: string): Promise<LoadedPdf> {
  let e = entries.get(url)
  if (!e) entries.set(url, (e = start(url)))
  const i = idle.indexOf(url)
  if (i >= 0) idle.splice(i, 1)
  e.refs++
  return e.ready
}

/** Give a document back. Once nobody holds it, it waits in the idle list, then is destroyed. */
export function closePdf(pdf: LoadedPdf) {
  const e = owner.get(pdf)
  if (!e || e.refs <= 0 || entries.get(e.url) !== e) return
  if (--e.refs > 0) return
  idle.push(e.url)
  while (idle.length > IDLE_PDFS) destroy(entries.get(idle[0]!)!)
}

/** Take a document just while `use` runs (a thumbnail, a compare picture), then give it back. */
export async function withPdf<T>(url: string, use: (pdf: LoadedPdf) => Promise<T>): Promise<T> {
  const pdf = await openPdf(url)
  try {
    return await use(pdf)
  } finally {
    closePdf(pdf)
  }
}

/** Counts for the leak checks: documents open (held or idle), held, idle, destroyed so far. */
export function pdfDocStats() {
  return { open: entries.size, held: [...entries.values()].filter((e) => e.refs > 0).length, idle: idle.length, destroyed }
}

// The leak check in `e2e/artifacts.spec.ts` reads the counts from the page.
if (import.meta.env?.DEV && typeof window !== 'undefined') (window as { __BOARD_PDF__?: typeof pdfDocStats }).__BOARD_PDF__ = pdfDocStats

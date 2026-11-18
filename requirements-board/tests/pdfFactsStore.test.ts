/**
 * PDF facts kept on disk between runs (FINDINGS R-160, B03-REQ-08): a new process does not re-read
 * an unchanged PDF; a changed one is read again, alone; a damaged entry is rebuilt; two processes
 * writing at once leave whole entries; a failed run is never kept; the facts are the extractor's.
 */
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { serialiseArtifact } from '../shared/files.ts'
import type { Artifact } from '../shared/types.ts'
import { writeItem } from '../server/catalogueFs.ts'
import { contentKey, extractor, forgetPdfMemo, pdfFactsFor, primePdfFacts } from '../server/pdfFactsStore.ts'
import * as store from '../server/pdfFactsStore.ts'
import { tinyPdf } from '../e2e/fixtureCatalogue.ts'
import { item } from './fixtures.ts'

const BOARD = resolve(import.meta.dirname, '..')
const SLOW = 120_000

let root: string
let facts: string
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'b03-pdf-cat-'))
  facts = mkdtempSync(join(tmpdir(), 'b03-pdf-facts-'))
  process.env.PDF_FACTS_DIR = facts
  forgetPdfMemo()
  writeItem(item({ id: 'EP-01', type: 'epic' }), root)
  mkdirSync(join(root, 'artifacts', 'files'), { recursive: true })
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
  rmSync(facts, { recursive: true, force: true })
})

const pdf = (id: string, lines: string[]) => {
  writeFileSync(join(root, 'artifacts', 'files', `${id}.pdf`), tinyPdf([lines]))
  const a = { id, title: `PDF ${id}`, kind: 'document', status: 'Current', date: '2026-10', author: null, area: null, sources: ['x'], description: '', file: `artifacts/files/${id}.pdf`, source: '', regions: [], steps: [], citedAs: [], supersededBy: null } as unknown as Artifact
  writeFileSync(join(root, 'artifacts', `${id}.md`), serialiseArtifact(a))
}

/** Load the catalogue in a new Node process; report how many extractor runs it started and the PDF facts it got. */
function loadInNewProcess(): Promise<{ runs: number; pages: Record<string, unknown> }> {
  const code = `
    const { loadCatalogue } = await import(${JSON.stringify(join(BOARD, 'server/catalogueFs.ts'))})
    const store = await import(${JSON.stringify(join(BOARD, 'server/pdfFactsStore.ts'))})
    const r = loadCatalogue(${JSON.stringify(root)})
    const pages = Object.fromEntries(Object.entries(r.artifacts).map(([id, a]) => [id, a.meta.pages]))
    process.stdout.write(JSON.stringify({ runs: store.extractorRuns, pages }))`
  return new Promise((done, fail) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', code], { env: { ...process.env, PDF_FACTS_DIR: facts }, stdio: ['ignore', 'pipe', 'inherit'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.on('error', fail)
    child.on('close', (code) => (code === 0 ? done(JSON.parse(out)) : fail(new Error(`exit ${code}`))))
  })
}

const entries = () => readdirSync(facts).filter((f) => f.endsWith('.json'))

describe('stored PDF facts', () => {
  it(
    'a second process over an unchanged catalogue starts no extraction; a changed PDF is read again, alone, in one run',
    async () => {
      pdf('AR-01', ['First page'])
      pdf('AR-02', ['Another'])
      const first = await loadInNewProcess()
      expect(first.runs).toBe(1) // both PDFs in one extractor start
      expect(entries()).toHaveLength(2)
      const second = await loadInNewProcess()
      expect(second.runs).toBe(0)
      expect(second.pages).toEqual(first.pages)
      pdf('AR-02', ['Changed text'])
      const third = await loadInNewProcess()
      expect(third.runs).toBe(1)
      expect(entries()).toHaveLength(3)
    },
    SLOW,
  )

  it(
    'a damaged entry is ignored and rebuilt',
    async () => {
      pdf('AR-01', ['First page'])
      await loadInNewProcess()
      const [name] = entries()
      writeFileSync(join(facts, name!), '{"extractor": "') // half-written
      const again = await loadInNewProcess()
      expect(again.runs).toBe(1)
      expect(JSON.parse(readFileSync(join(facts, name!), 'utf8')).extractor).toBe(extractor())
      writeFileSync(join(facts, name!), JSON.stringify({ extractor: extractor(), facts: { pages: 'nope' } })) // wrong shape
      expect((await loadInNewProcess()).runs).toBe(1)
    },
    SLOW,
  )

  it(
    'two processes writing at once leave whole entries',
    async () => {
      for (let n = 1; n <= 4; n++) pdf(`AR-0${n}`, [`Page ${n}`])
      const [a, b] = await Promise.all([loadInNewProcess(), loadInNewProcess()])
      expect(a.pages).toEqual(b.pages)
      for (const f of entries()) expect(JSON.parse(readFileSync(join(facts, f), 'utf8')).extractor).toBe(extractor())
      expect(readdirSync(facts).filter((f) => f.endsWith('.tmp'))).toEqual([])
      expect((await loadInNewProcess()).runs).toBe(0)
    },
    SLOW,
  )

  it(
    'a run that fails is never kept; a file that is not a PDF is remembered as such',
    () => {
      const gone = join(root, 'missing.pdf')
      primePdfFacts([{ abs: gone, buf: Buffer.from('%PDF-1.4 not really') }])
      expect(entries()).toEqual([]) // the reader could not open it: a passing failure
      // Marked for the caller (artifactInfo then caches nothing), and not rerun at once.
      const runs = store.extractorRuns
      expect(pdfFactsFor(gone, Buffer.from('%PDF-1.4 not really'))).toMatchObject({ unread: true })
      expect(store.extractorRuns).toBe(runs)
      const junk = join(root, 'junk.pdf')
      writeFileSync(junk, 'hello, not a PDF')
      const r = pdfFactsFor(junk, readFileSync(junk))
      expect(r).toEqual({ error: expect.any(String) })
      expect(entries()).toEqual([`${contentKey(readFileSync(junk))}.json`])
    },
    SLOW,
  )

  it(
    'facts are kept only under the bytes the extractor read (a file rewritten mid-read is not stored)',
    () => {
      pdf('AR-01', ['What is on disk now'])
      const abs = join(root, 'artifacts', 'files', 'AR-01.pdf')
      const older = tinyPdf([['What we read a moment ago']])
      const r = pdfFactsFor(abs, older)
      expect(r).toMatchObject({ unread: true })
      expect(entries()).toEqual([])
    },
    SLOW,
  )

  it(
    'the facts are what the extractor reads, one file at a time or many at once',
    () => {
      pdf('AR-01', ['Fixture page one', 'Totals live here'])
      const abs = join(root, 'artifacts', 'files', 'AR-01.pdf')
      const single = JSON.parse(execFileSync(process.execPath, [join(BOARD, 'server/pdfFacts.ts'), abs], { encoding: 'utf8' }))
      expect(pdfFactsFor(abs, readFileSync(abs))).toEqual(single)
      expect(store.extractorRuns).toBeGreaterThan(0)
    },
    SLOW,
  )
})

/**
 * PDF facts (page sizes and text) kept on disk between runs, so starting the board or running the
 * check does not re-read PDFs that have not changed (FINDINGS R-160).
 *
 * - **Where:** `PDF_FACTS_DIR` from the environment, else `.pdf-facts/` beside this app (git-ignored,
 *   like `.history/`; never in the requirements folder). Deleting it only costs speed.
 * - **Key:** the SHA-256 of the file's bytes names the entry; inside, the extractor's identity (a
 *   hash of `pdfFacts.ts`, the pdf.js version and a schema number) must match. A changed file, a
 *   changed extractor or a changed shape is a miss. Time stamps are never trusted.
 * - **Damage and races:** an entry is written to a temp file and renamed into place, so a reader
 *   sees a whole entry or none, whichever of two processes wins. An entry that does not parse or has
 *   the wrong shape is ignored and rebuilt.
 * - **What is kept:** pages, or pdf.js's own error for a file that is not a readable PDF. A failed
 *   run (no Node, a timeout, pdf.js not loading, the file unreadable at that moment) is never kept.
 * - **Cost:** every PDF that misses is read by one `pdfFacts.ts --batch` run.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type PdfFacts = { pages: { w: number; h: number; text: string }[] } | { error: string }
/** `unread`: the run failed for the moment (never stored, never cached by the caller). */
type Extracted = PdfFacts | { error: string; unread: true }

const here = dirname(fileURLToPath(import.meta.url))
const PDF_SCRIPT = join(here, 'pdfFacts.ts')
/** Bump when what is stored changes shape. */
const SCHEMA = 1
/** Per file, generous: a large PDF takes a few seconds. The whole run gets this times the count. */
const MS_PER_FILE = 30_000
/** A run that failed for the moment is not retried for this long, so a lasting failure doesn't rerun on every sync. */
const RETRY_MS = 60_000

/**
 * The Node binary to run a helper script with: this process's own, unless it has gone from disk
 * (a package manager upgraded Node under a long-running dev server), then whichever `node` is on
 * the PATH.
 */
export function nodeBinary(): string {
  return existsSync(process.execPath) ? process.execPath : 'node'
}

export const pdfFactsDir = () => (process.env.PDF_FACTS_DIR ? resolve(process.env.PDF_FACTS_DIR) : join(here, '..', '.pdf-facts'))

let extractorId: string | undefined
/** The extractor's identity: its source, the pdf.js version and the schema. */
export function extractor(): string {
  if (extractorId) return extractorId
  let pdfjs = 'unknown'
  try {
    pdfjs = (JSON.parse(readFileSync(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'), 'utf8')) as { version?: string }).version ?? pdfjs
  } catch {
    // An unknown version still keys consistently within one install.
  }
  extractorId = createHash('sha256').update(`${SCHEMA}\n${pdfjs}\n`).update(readFileSync(PDF_SCRIPT)).digest('hex')
  return extractorId
}

export const contentKey = (buf: Buffer) => createHash('sha256').update(buf).digest('hex')

/** Facts already looked up in this process, by content key. */
const memo = new Map<string, PdfFacts>()
/** Runs that failed for the moment, by content key: the error and when, held in this process only. */
const failed = new Map<string, { error: string; at: number }>()
/** How many extractor processes this process has started (tests read it). */
export let extractorRuns = 0

const entryPath = (key: string) => join(pdfFactsDir(), `${key}.json`)

const isFacts = (v: unknown): v is PdfFacts => {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (typeof o.error === 'string') return true
  return (
    Array.isArray(o.pages) &&
    o.pages.every((p) => !!p && typeof p === 'object' && Number.isFinite((p as { w: unknown }).w) && Number.isFinite((p as { h: unknown }).h) && typeof (p as { text: unknown }).text === 'string')
  )
}

function readEntry(key: string): PdfFacts | null {
  try {
    const raw = JSON.parse(readFileSync(entryPath(key), 'utf8')) as { extractor?: unknown; facts?: unknown }
    if (raw?.extractor !== extractor() || !isFacts(raw.facts)) return null
    return 'error' in raw.facts ? { error: raw.facts.error } : { pages: raw.facts.pages }
  } catch {
    return null // none yet, damaged or half-written by an older writer: rebuilt below
  }
}

let tmpCount = 0
function writeEntry(key: string, facts: PdfFacts) {
  const file = entryPath(key)
  const tmp = `${file}.${process.pid}.${++tmpCount}.tmp`
  try {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(tmp, JSON.stringify({ extractor: extractor(), facts }))
    renameSync(tmp, file) // atomic: two writers both land whole entries for the same content
  } catch {
    rmSync(tmp, { force: true }) // a store that can't be written only costs speed
  }
}

/** A recent passing failure for this content, if it should not be retried yet. */
function recentFailure(key: string): Extracted | null {
  const f = failed.get(key)
  if (!f) return null
  if (Date.now() - f.at < RETRY_MS) return { error: f.error, unread: true }
  failed.delete(key)
  return null
}

function lookup(key: string): PdfFacts | null {
  const hit = memo.get(key) ?? readEntry(key)
  if (hit) memo.set(key, hit)
  return hit
}

/**
 * Run the extractor once over many files. If the run as a whole fails (one file hanging, say), each
 * file is tried again alone, so one bad file never keeps the others' facts from being stored.
 */
function extract(paths: string[]): Map<string, Extracted & { sha?: string }> {
  const out = runOnce(paths)
  if (paths.length > 1 && paths.every((p) => { const r = out.get(p); return !!r && 'unread' in r })) {
    for (const p of paths) out.set(p, runOnce([p]).get(p)!)
  }
  return out
}

/**
 * One extractor process over these files. A failed run gives every file its error, marked unread.
 * Each answer carries the hash of the bytes the run read (`sha`).
 */
function runOnce(paths: string[]): Map<string, Extracted & { sha?: string }> {
  const out = new Map<string, Extracted & { sha?: string }>()
  if (!paths.length) return out
  extractorRuns++
  try {
    const text = execFileSync(nodeBinary(), [PDF_SCRIPT, '--batch', ...paths], {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: MS_PER_FILE * paths.length,
    })
    const results = (JSON.parse(text) as { results?: Record<string, Extracted> }).results ?? {}
    for (const p of paths) {
      const r = results[p] as (Extracted & { sha?: string }) | undefined
      out.set(p, r && isFacts(r) ? r : { error: 'no answer from the PDF reader', unread: true })
    }
  } catch (e) {
    const error = (e as Error).message.split('\n')[0]!
    for (const p of paths) out.set(p, { error, unread: true })
  }
  return out
}

function keep(key: string, got: Extracted & { sha?: string }): Extracted {
  // The file changed between our read and the extractor's: those facts belong to other bytes.
  const { sha, ...r } = got
  if (!('unread' in r) && sha !== key) return { error: 'the file changed while it was read', unread: true }
  if ('error' in r) {
    if ('unread' in r) {
      failed.set(key, { error: r.error, at: Date.now() }) // passing failure: not stored, retried after a while
      return r
    }
    const facts = { error: r.error }
    memo.set(key, facts)
    writeEntry(key, facts)
    return facts
  }
  memo.set(key, r)
  writeEntry(key, r)
  return r
}

/** Make sure every one of these PDFs has facts, reading all the misses in one extractor run. */
export function primePdfFacts(files: { abs: string; buf: Buffer }[]) {
  const misses = new Map<string, string>() // key → a path holding that content
  for (const f of files) {
    const key = contentKey(f.buf)
    if (!misses.has(key) && !lookup(key) && !recentFailure(key)) misses.set(key, f.abs)
  }
  const got = extract([...misses.values()])
  for (const [key, abs] of misses) keep(key, got.get(abs)!)
}

/**
 * The facts for one PDF whose bytes are `buf`: from this process, the store, or one extractor run.
 * A result marked `unread` is a passing failure the caller must not keep.
 */
export function pdfFactsFor(abs: string, buf: Buffer): Extracted {
  const key = contentKey(buf)
  return lookup(key) ?? recentFailure(key) ?? keep(key, extract([abs]).get(abs)!)
}

/** Forget this process's lookups (tests). The store on disk is untouched. */
export function forgetPdfMemo() {
  memo.clear()
  failed.clear()
}

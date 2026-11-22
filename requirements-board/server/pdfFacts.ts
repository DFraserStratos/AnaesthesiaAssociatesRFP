/**
 * Read a PDF's pages for the catalogue check: each page's size in points and its text, as JSON
 * on stdout. A separate process because pdf.js is asynchronous and the catalogue loads
 * synchronously (`pdfFactsStore.ts` runs this with execFileSync and keeps the answers on disk).
 *   node server/pdfFacts.ts <file.pdf>                  → { pages } or { error }
 *   node server/pdfFacts.ts --batch <a.pdf> <b.pdf> ... → { results: { <path>: { pages, sha } or { error, sha } } }
 * In the batch form each answer carries `sha`, the SHA-256 of the bytes this run read, so the store
 * keeps facts only under the content they came from (a file rewritten mid-read is not mixed up).
 * The batch form reads many PDFs in one process start. Changing what this script extracts changes
 * the store's key (its source is hashed), so stored facts never outlive it.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

/** `unread`: the file could not be read here (a passing state, so the caller does not keep it). */
type Facts = ({ pages: { w: number; h: number; text: string }[] } | { error: string; unread?: true }) & { sha?: string }

const batch = process.argv[2] === '--batch'
const files = batch ? process.argv.slice(3) : process.argv.slice(2, 3)
if (!files.length) {
  console.error('usage: node server/pdfFacts.ts <file.pdf> | --batch <file.pdf>...')
  process.exit(2)
}

// Outside any per-file try: if pdf.js itself cannot load, the run fails (exit 1), and the caller
// never records that as a file's facts.
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

async function factsOf(file: string): Promise<Facts> {
  let data: Uint8Array
  try {
    data = new Uint8Array(readFileSync(file))
  } catch (e) {
    return { error: (e as Error).message, unread: true }
  }
  try {
    const doc = await pdfjs.getDocument({ data, verbosity: 0 }).promise
    const pages: { w: number; h: number; text: string }[] = []
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const vp = page.getViewport({ scale: 1 })
      const content = await page.getTextContent()
      const text = content.items.map((i) => ('str' in i ? i.str + (i.hasEOL ? '\n' : '') : '')).join('')
      pages.push({ w: vp.width, h: vp.height, text })
    }
    await doc.destroy()
    return { pages }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

if (batch) {
  const results: Record<string, Facts> = {}
  for (const f of files) {
    let sha: string | undefined
    try {
      sha = createHash('sha256').update(readFileSync(f)).digest('hex')
    } catch {
      // factsOf reports the read failure
    }
    results[f] = { ...(await factsOf(f)), ...(sha ? { sha } : {}) }
  }
  process.stdout.write(JSON.stringify({ results }))
} else {
  process.stdout.write(JSON.stringify(await factsOf(files[0]!)))
}

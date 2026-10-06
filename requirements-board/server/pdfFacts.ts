/**
 * Read a PDF's pages for the catalogue check: each page's size in points and its text, as JSON
 * on stdout. A separate process because pdf.js is asynchronous and the catalogue loads
 * synchronously (`artifactFiles.ts` runs this with execFileSync and caches the answer).
 *   node server/pdfFacts.ts <file.pdf>
 */
import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('usage: node server/pdfFacts.ts <file.pdf>')
  process.exit(2)
}
try {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(file)), verbosity: 0 }).promise
  const pages: { w: number; h: number; text: string }[] = []
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const vp = page.getViewport({ scale: 1 })
    const content = await page.getTextContent()
    const text = content.items.map((i) => ('str' in i ? i.str + (i.hasEOL ? '\n' : '') : '')).join('')
    pages.push({ w: vp.width, h: vp.height, text })
  }
  process.stdout.write(JSON.stringify({ pages }))
} catch (e) {
  process.stdout.write(JSON.stringify({ error: (e as Error).message }))
}

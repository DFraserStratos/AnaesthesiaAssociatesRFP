/**
 * Find in an artifact: every place a phrase occurs in its text, ignoring case and runs of
 * whitespace. The same matching works on a plain string (a PDF page not drawn yet, to count) and
 * on the DOM (a drawing's text, a document, a drawn PDF page), where each match becomes a Range.
 */

/** How text in separate elements joins: SVG `<text>` elements are separate lines, a PDF text layer marks line ends with `<br>`, a document has its own whitespace. */
export type Joint = 'svg' | 'pdf' | 'doc'

export const normQuery = (q: string) => normText(q.trim())

/**
 * Text as find reads it: lower case, every run of whitespace one space. Each character is lowered
 * on its own (as `findRanges` does), never the whole string at once, so a word-final sigma or a
 * character whose lower case is longer ("İ" is two code units) reads the same everywhere and the
 * count before a page is drawn equals the matches found on it.
 */
export function normText(s: string): string {
  let out = ''
  for (const ch of s) {
    if (/\s/.test(ch)) {
      if (out && !out.endsWith(' ')) out += ' '
    } else out += lower(ch)
  }
  return out
}

/** One character in lower case; a word-final sigma reads as any sigma, so "ς" typed finds "Σ". */
const lower = (ch: string) => (ch === 'ς' ? 'σ' : ch.toLowerCase())

/** Start offsets of every non-overlapping occurrence of `needle` in `hay`. */
function occurrences(hay: string, needle: string): number[] {
  const out: number[] = []
  if (!needle) return out
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + needle.length)) out.push(i)
  return out
}

/** How many times a phrase occurs in a string. */
export const countIn = (text: string, query: string) => occurrences(normText(text), normQuery(query)).length

/** A PDF page's text as its text layer reads: each item's text, a line end as a space. */
export const pdfPageText = (items: { str?: string; hasEOL?: boolean }[]) => items.map((i) => (i.str ?? '') + (i.hasEOL ? ' ' : '')).join('')

/** Every match in the text under `root`, as DOM ranges, in reading order. `skip` leaves out text not shown (a step's hidden parts). */
export function findRanges(root: Node, query: string, joint: Joint, skip?: (n: Text) => boolean): Range[] {
  const needle = normQuery(query)
  if (!needle) return []
  let text = ''
  // For each code unit of `text`: the node and the source character it came from (start, end).
  // A character whose lower case is longer than it gets one entry per unit, so offsets never drift.
  const at: [Text, number, number][] = []
  let prev: Text | null = null
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    if (n.parentElement?.closest('style, script, title') || skip?.(n)) continue
    if (prev && text && !text.endsWith(' ') && joins(prev, n, joint)) {
      text += ' '
      at.push([n, 0, 0])
    }
    const t = n.data
    for (let i = 0; i < t.length; ) {
      const ch = String.fromCodePoint(t.codePointAt(i)!)
      const end = i + ch.length
      if (/\s/.test(ch)) {
        if (text && !text.endsWith(' ')) {
          text += ' '
          at.push([n, i, end])
        }
      } else {
        const low = lower(ch)
        text += low
        for (let k = 0; k < low.length; k++) at.push([n, i, end])
      }
      i = end
    }
    prev = n
  }
  return occurrences(text, needle).map((i) => {
    const r = document.createRange()
    const [sn, so] = at[i]!
    const [en, , eo] = at[i + needle.length - 1]!
    r.setStart(sn, so)
    r.setEnd(en, Math.min(en.data.length, eo))
    return r
  })
}

/** Is there a line break between two text nodes that the text itself doesn't show? */
function joins(a: Text, b: Text, joint: Joint): boolean {
  if (joint === 'svg') return a.parentElement?.closest('text') !== b.parentElement?.closest('text')
  if (joint === 'pdf') {
    for (let el: Node | null = a.parentElement; el && el !== b.parentElement; el = el.nextSibling) if (el.nodeName === 'BR') return true
    return false
  }
  return false
}

/** A range's line boxes (one per line it spans), skipping empty ones. */
export const lineRects = (r: Range) => [...r.getClientRects()].filter((x) => x.width > 0.5 && x.height > 0.5)

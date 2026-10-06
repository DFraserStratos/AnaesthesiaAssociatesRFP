/**
 * Find in an artifact: every place a phrase occurs in its text, ignoring case and runs of
 * whitespace. The same matching works on a plain string (a PDF page not drawn yet, to count) and
 * on the DOM (a drawing's text, a document, a drawn PDF page), where each match becomes a Range.
 */

/** How text in separate elements joins: SVG `<text>` elements are separate lines, a PDF text layer marks line ends with `<br>`, a document has its own whitespace. */
export type Joint = 'svg' | 'pdf' | 'doc'

export const normQuery = (q: string) => q.trim().replace(/\s+/g, ' ').toLowerCase()

/** Text as find reads it: lower case, every run of whitespace one space. */
export function normText(s: string): string {
  let out = ''
  for (const ch of s) {
    if (/\s/.test(ch)) {
      if (out && !out.endsWith(' ')) out += ' '
    } else out += ch.toLowerCase()
  }
  return out
}

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

/** Every match in the text under `root`, as DOM ranges, in reading order. */
export function findRanges(root: Node, query: string, joint: Joint): Range[] {
  const needle = normQuery(query)
  if (!needle) return []
  let text = ''
  const at: [Text, number][] = []
  let prev: Text | null = null
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    if (n.parentElement?.closest('style, script, title')) continue
    if (prev && text && !text.endsWith(' ') && joins(prev, n, joint)) {
      text += ' '
      at.push([n, 0])
    }
    const t = n.data
    for (let i = 0; i < t.length; i++) {
      const ch = t[i]!
      if (/\s/.test(ch)) {
        if (!text || text.endsWith(' ')) continue
        text += ' '
      } else text += ch.toLowerCase()
      at.push([n, i])
    }
    prev = n
  }
  return occurrences(text, needle).map((i) => {
    const r = document.createRange()
    const [sn, so] = at[i]!
    const [en, eo] = at[i + needle.length - 1]!
    r.setStart(sn, so)
    r.setEnd(en, Math.min(en.data.length, eo + 1))
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

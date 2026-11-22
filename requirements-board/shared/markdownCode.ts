/**
 * What counts as code in a Markdown text: the one rule the check, backlinks, the artifact index,
 * delete planning, the linking scripts and the document readers share, so a link is either code for
 * all of them or for none (FINDINGS R-60, R-61). It follows CommonMark for the forms the catalogue
 * uses:
 *
 * - a fenced block opens with up to three spaces and three or more backticks or tildes (a backtick
 *   fence's info string holds no backtick), and closes only on a line of the same character, at least
 *   as long, with up to three spaces before it and nothing after; an unclosed fence runs to the end;
 * - a code span opens with a run of backticks and closes at the next run of exactly the same length,
 *   never across a blank line (a paragraph break) or a fence; a run with no partner is plain text, as
 *   is a backslash-escaped backtick.
 *
 * Indented code blocks are not read: catalogue text never relies on them, and an indented line is far
 * more often a list's continuation.
 */

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/

/** A stretch of code: [start, end) offsets, and whether it is a fenced block or a backtick span. */
export type CodeRange = [start: number, end: number, kind: 'fence' | 'span']

/** A fenced block's content: its lines without the opening fence line and the closing one. */
export function fenceContent(block: string): string {
  const lines = block.replace(/\n$/, '').split('\n').slice(1)
  if (lines.length && FENCE_CLOSE.test(lines[lines.length - 1]!)) lines.pop()
  return lines.join('\n')
}

/** For each line, whether it is part of a fenced code block (its fence lines included). */
export function fenceMask(lines: readonly string[]): boolean[] {
  const out: boolean[] = []
  let open: string | null = null
  for (const line of lines) {
    if (open !== null) {
      const c = FENCE_CLOSE.exec(line)
      if (c && c[1]![0] === open[0] && c[1]!.length >= open.length) open = null
      out.push(true)
      continue
    }
    const o = FENCE_OPEN.exec(line)
    if (o && !(o[1]![0] === '`' && o[2]!.includes('`'))) {
      open = o[1]!
      out.push(true)
      continue
    }
    out.push(false)
  }
  return out
}

/** Backtick code spans in a stretch of text with no fence in it, as [start, end) offsets into `md`. */
function spansIn(md: string, from: number, to: number, out: CodeRange[]) {
  let i = from
  while (i < to) {
    const ch = md[i]
    if (ch === '\\') {
      i += 2 // an escaped character (an escaped backtick included) is plain text
      continue
    }
    if (ch !== '`') {
      i++
      continue
    }
    let j = i
    while (j < to && md[j] === '`') j++
    const run = j - i
    // Look for a closing run of the same length before a blank line.
    let k = j
    let close = -1
    while (k < to) {
      if (md[k] === '\n') {
        // A blank line ends the paragraph, and a span with it.
        const nl = md.indexOf('\n', k + 1)
        if (!md.slice(k + 1, nl < 0 || nl > to ? to : nl).trim()) break
      }
      if (md[k] === '`') {
        let e = k
        while (e < to && md[e] === '`') e++
        if (e - k === run) {
          close = e
          break
        }
        k = e
        continue
      }
      k++
    }
    if (close < 0) {
      i = j // no partner: the run is plain text
      continue
    }
    out.push([i, close, 'span'])
    i = close
  }
}

/** Every code range of a Markdown text (fenced blocks and backtick spans), in order, as [start, end) offsets. */
export function codeRanges(md: string): CodeRange[] {
  const out: CodeRange[] = []
  if (!md || (!md.includes('`') && !md.includes('~~~'))) return out
  const lines = md.split('\n')
  const mask = fenceMask(lines)
  let at = 0
  let stretch = 0
  let fenceStart = -1
  lines.forEach((line, n) => {
    const end = at + line.length + (n < lines.length - 1 ? 1 : 0)
    if (mask[n]) {
      if (fenceStart < 0) {
        spansIn(md, stretch, at, out)
        fenceStart = at
      }
    } else if (fenceStart >= 0) {
      out.push([fenceStart, at, 'fence'])
      fenceStart = -1
      stretch = at
    }
    at = end
  })
  if (fenceStart >= 0) out.push([fenceStart, md.length, 'fence'])
  else spansIn(md, stretch, md.length, out)
  return out
}

/**
 * The text with every character of code turned to a space, the same length as the text, so nothing
 * inside code reads as prose and an offset found in it is an offset in the text. A link whose words
 * hold code (`` [`x`](US-01.1.2) ``) is still one link, as the board draws it.
 */
export function maskCode(md: string): string {
  const ranges = codeRanges(md)
  if (!ranges.length) return md
  let out = ''
  let at = 0
  for (const [s, e] of ranges) {
    out += md.slice(at, s) + ' '.repeat(e - s)
    at = e
  }
  return out + md.slice(at)
}

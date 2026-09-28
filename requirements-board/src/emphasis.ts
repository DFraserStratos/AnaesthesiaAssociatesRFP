export type Emphasis = 'bold' | 'italic'

/** Replace `from`..`to` with `insert`, then select `selStart`..`selEnd`. */
export interface TextEdit {
  from: number
  to: number
  insert: string
  selStart: number
  selEnd: number
}

const runBefore = (s: string, at: number) => {
  let n = 0
  while (at - n > 0 && s[at - n - 1] === '*') n++
  return n
}
const runAfter = (s: string, at: number) => {
  let n = 0
  while (at + n < s.length && s[at + n] === '*') n++
  return n
}

/**
 * Toggle Markdown bold (`**`) or italic (`*`) on the selection `start`..`end` of `value`, the way
 * Cmd+B / Cmd+I do in an editor: wrap it, or unwrap it when the markers already sit just outside or
 * just inside it. A run of three stars is both, so each toggles independently.
 */
export function toggleEmphasis(value: string, start: number, end: number, kind: Emphasis): TextEdit {
  const mark = kind === 'bold' ? '**' : '*'
  const on = (run: number) => (kind === 'bold' ? run >= 2 : run % 2 === 1)
  // Keep surrounding whitespace outside the markers: `** word**` does not render as bold.
  while (start < end && /\s/.test(value.charAt(start))) start++
  while (end > start && /\s/.test(value.charAt(end - 1))) end--
  const text = value.slice(start, end)

  if (on(runBefore(value, start)) && on(runAfter(value, end))) {
    const from = start - mark.length
    return { from, to: end + mark.length, insert: text, selStart: from, selEnd: from + text.length }
  }
  const lead = runAfter(text, 0)
  const trail = runBefore(text, text.length)
  if (lead + trail < text.length && on(lead) && on(trail)) {
    const inner = text.slice(mark.length, text.length - mark.length)
    return { from: start, to: end, insert: inner, selStart: start, selEnd: start + inner.length }
  }
  const selStart = start + mark.length
  return { from: start, to: end, insert: mark + text + mark, selStart, selEnd: selStart + text.length }
}

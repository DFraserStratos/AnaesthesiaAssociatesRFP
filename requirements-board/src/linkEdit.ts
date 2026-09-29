import type { TextEdit } from './emphasis.ts'

const LINK = /\[([^\]\n]*)\]\(([^)\n]*)\)/g

/**
 * Link the selection `start`..`end` of `value` to record `id`, the way pasting a copied card link
 * over selected text does:
 *
 * - a selection within an existing link retargets that link;
 * - selected words become `[words](ID)` (whitespace at either end stays outside the link);
 * - with nothing selected, `[Title](ID)` goes in with the title selected, ready to retype.
 *
 * Null when the selection can't be a link's text (it spans a paragraph break or holds brackets),
 * so the paste goes in as plain text.
 */
export function linkSelection(value: string, start: number, end: number, id: string, title: string): TextEdit | null {
  for (const m of value.matchAll(LINK)) {
    const from = m.index
    const to = from + m[0].length
    // A caret just outside a link is not in it; a selection is in it when it sits within it.
    const inside = start === end ? start > from && start < to : start >= from && end <= to
    if (!inside) continue
    const textFrom = from + 1
    const hrefFrom = textFrom + m[1]!.length + 2
    return { from: hrefFrom, to: to - 1, insert: id, selStart: textFrom, selEnd: textFrom + m[1]!.length }
  }
  while (start < end && /\s/.test(value.charAt(start))) start++
  while (end > start && /\s/.test(value.charAt(end - 1))) end--
  const text = value.slice(start, end)
  if (/\n\s*\n|[[\]]/.test(text)) return null
  if (!text) {
    const words = title.replace(/[[\]]/g, '') || id
    return { from: start, to: end, insert: `[${words}](${id})`, selStart: start + 1, selEnd: start + 1 + words.length }
  }
  const insert = `[${text}](${id})`
  return { from: start, to: end, insert, selStart: start + insert.length, selEnd: start + insert.length }
}

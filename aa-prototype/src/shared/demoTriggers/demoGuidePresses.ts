import type { DemoTriggerSurface } from './types'

/**
 * The demo presses a demo guide scripts (catch-up Phase 44, work item 5), read
 * so `demoGuideSync.test.ts` can check them against the registry. The guide
 * writes a harness-bar press **Demo actions → Label** and a handset press
 * **Demo sheet → Label**. Test support only: nothing in the apps imports it.
 */

export interface GuidePress {
  /** `bar` for Demo actions, `pwa` for the Demo sheet. */
  surface: DemoTriggerSurface
  /** The entry's label as written: the first step after the arrow. */
  label: string
  /** True when the label is bold, as the convention asks; a plain label is read up to the next comma, full stop, semicolon, quote or arrow, so it may carry more than the label. */
  bold: boolean
}

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  middot: '·',
  rarr: '→',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  times: '×',
}

/**
 * An HTML guide as plain text: scripts and styles dropped, `<strong>` and `<b>`
 * kept as Markdown's `**` (so a bold label stays bounded), every other tag a
 * space, entities decoded.
 */
export function htmlToGuideText(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<\/?(?:strong|b)(?:\s[^>]*)?>/gi, '**')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
      if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(parseInt(code.slice(2), 16))
      if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10))
      return NAMED_ENTITIES[code.toLowerCase()] ?? whole
    })
}

const ARROW = /\s*(?:→|->)\s*/
const PRESS = /Demo (actions|sheet)(\*\*)?\s*(?:→|->)\s*/gi
/** Where a plain (not bold) label ends. */
const PLAIN_END = /\*\*|\s(?:→|->)|[,;"“”]|\.(?:\s|$)/

const count = (s: string, ch: string) => s.split(ch).length - 1

/** A label without the sentence around it: trailing punctuation, a dangling "(", and a ")" the label never opened. */
function trimLabel(raw: string): string {
  let label = raw.trim()
  for (;;) {
    const next = label
      .replace(/[.,;:]+$/, '')
      .replace(/\s*\($/, '')
      .trim()
    const unopened = next.endsWith(')') && count(next, ')') > count(next, '(') ? next.slice(0, -1).trim() : next
    if (unopened === label) return label
    label = unopened
  }
}

/**
 * Every Demo actions and Demo sheet press in `text` (Markdown, or an HTML guide
 * through `htmlToGuideText`), in order. Line breaks inside a bold label are
 * read as spaces; a chain such as "→ Run → Confirm" after the label is dropped.
 */
export function extractGuidePresses(text: string): GuidePress[] {
  const flat = text.replace(/\s+/g, ' ')
  const boldMarks: number[] = []
  for (let i = flat.indexOf('**'); i !== -1; i = flat.indexOf('**', i + 2)) boldMarks.push(i)
  const presses: GuidePress[] = []
  for (const m of flat.matchAll(PRESS)) {
    const at = m.index ?? 0
    // Inside a bold run when an odd number of `**` come before the words; a `**` right after them closes it.
    let inBold = boldMarks.filter((i) => i < at).length % 2 === 1
    if (m[2] !== undefined) inBold = !inBold
    const rest = flat.slice(at + m[0].length)
    let label: string
    let bold: boolean
    if (inBold) {
      label = rest.split('**')[0] ?? ''
      bold = true
    } else if (rest.startsWith('**')) {
      label = rest.slice(2).split('**')[0] ?? ''
      bold = true
    } else {
      const end = PLAIN_END.exec(rest)
      label = end === null ? rest : rest.slice(0, end.index)
      // A ")" the label never opened closes the sentence's own bracket: "(or Demo actions → Label)".
      let depth = 0
      for (let i = 0; i < label.length; i++) {
        if (label[i] === '(') depth++
        else if (label[i] === ')' && --depth < 0) {
          label = label.slice(0, i)
          break
        }
      }
      bold = false
    }
    label = trimLabel(label.split(ARROW)[0] ?? '')
    if (label === '') continue
    presses.push({ surface: m[1]!.toLowerCase() === 'actions' ? 'bar' : 'pwa', label, bold })
  }
  return presses
}

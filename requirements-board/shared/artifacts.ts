/**
 * What an artifact's file holds, read without a DOM, so `npm run check` can hold every region to
 * account and the board can name a document's automatic regions. Pure: the server reads the
 * bytes and the browser reuses the same rules (anchor grammar, slugs, loose text matching).
 */
import { codeRanges, fenceContent, fenceMask } from './markdownCode.ts'
import type { ArtifactFormat, Box, Heading, NotePoint, Rect } from './types.ts'

/* ----------------------------------------------------------------- anchors */

export type AnchorKind = 'text' | 'quote' | 'heading' | 'node' | 'css'

/**
 * One entry of a region's `around`:
 *   `text=<exact text>`   an SVG `<text>` element whose whole text is this (whitespace collapsed);
 *   `quote=<passage>`     a passage in a Markdown or PDF document (whitespace and emphasis ignored);
 *   `heading=<title>`     a Markdown section, its heading and everything under it;
 *   `node=<id>`           a mermaid flowchart node;
 *   anything else         a CSS selector, run inside the drawing.
 */
export function parseAnchor(s: string): { kind: AnchorKind; value: string } {
  const m = /^(text|quote|heading|node)=([\s\S]*)$/.exec(s)
  return m ? { kind: m[1] as AnchorKind, value: m[2]! } : { kind: 'css', value: s }
}

/** Which formats each anchor kind works in. */
export const ANCHOR_FORMATS: Record<AnchorKind, readonly ArtifactFormat[]> = {
  text: ['svg', 'mermaid'],
  quote: ['markdown', 'pdf'],
  heading: ['markdown'],
  node: ['mermaid'],
  css: ['svg', 'mermaid'],
}

/** Whitespace collapsed and trimmed, in Unicode NFC, as `text=` and `heading=` anchors compare (both sides, one form). */
export const normText = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim()

/**
 * Text reduced for passage matching: no whitespace, no emphasis or code marks, no table pipes or
 * escapes. A quote lifted from the rendered page matches the source, and a line break or a
 * reflowed PDF line never stops a match.
 */
export const looseText = (s: string) => (s === s.normalize('NFC') ? s.replace(LOOSE_SKIP_ALL, '') : looseChars(s).map((c) => c.ch).join(''))

/** What `looseText` drops. */
const LOOSE_SKIP = /[\s*_`|\\]/
const LOOSE_SKIP_ALL = /[\s*_`|\\]/g

/**
 * `looseText` one character at a time, each with the offsets in `s` it came from, so a viewer can
 * match in loose text and box the passage it came from (FINDINGS R-101). Each base character is
 * normalised to NFC with the combining marks after it, so a decomposed "a" plus macron is one "ā"
 * from two source characters. The check and both document viewers read quotes through this.
 */
export function looseChars(s: string): { ch: string; from: number; to: number }[] {
  const out: { ch: string; from: number; to: number }[] = []
  if (s === s.normalize('NFC')) {
    // Already composed (nearly every text): each kept character stands for itself.
    for (let i = 0; i < s.length; i++) if (!LOOSE_SKIP.test(s[i]!)) out.push({ ch: s[i]!, from: i, to: i + 1 })
    return out
  }
  for (const m of s.matchAll(/[\s\S]\p{M}*/gu)) {
    const from = m.index!
    const to = from + m[0].length
    for (const ch of m[0].normalize('NFC')) if (!LOOSE_SKIP.test(ch)) out.push({ ch, from, to })
  }
  return out
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      // Only real code points: one past U+10FFFF would throw out of the whole catalogue load.
      return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : all
    }
    return ENTITIES[e.toLowerCase()] ?? all
  })
}

/* --------------------------------------------------------------------- svg */

export interface SvgElement {
  tag: string
  attrs: Record<string, string>
}

export interface SvgFacts {
  bounds: Rect | null
  /** Every `<text>` element's whole text, whitespace collapsed (tspans joined, as `textContent` reads). */
  texts: string[]
  elements: SvgElement[]
  error?: string
}

const ATTR = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

function attrsOf(s: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of s.matchAll(ATTR)) out[m[1]!] = decodeEntities(m[2] ?? m[3] ?? '')
  return out
}

const num = (s: string | undefined) => {
  const n = s === undefined ? NaN : parseFloat(s)
  return Number.isFinite(n) ? n : null
}

/** The extent of an `<svg>` root: its viewBox (offset kept), else its width and height. */
export function svgBounds(attrs: Record<string, string>): Rect | null {
  const vb = (attrs.viewBox ?? '').trim().split(/[\s,]+/).map(Number)
  if (vb.length === 4 && vb.every(Number.isFinite) && vb[2]! > 0 && vb[3]! > 0) return { x: vb[0]!, y: vb[1]!, w: vb[2]!, h: vb[3]! }
  const w = num(attrs.width)
  const h = num(attrs.height)
  return w && h && w > 0 && h > 0 ? { x: 0, y: 0, w, h } : null
}

export function svgFacts(text: string): SvgFacts {
  const src = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
  const root = /<svg\b([^>]*)>/i.exec(src)
  if (!root) return { bounds: null, texts: [], elements: [], error: 'no <svg> root element' }
  const elements: SvgElement[] = []
  for (const m of src.matchAll(/<([a-zA-Z][\w:.-]*)\b([^>]*?)\/?>/g)) elements.push({ tag: m[1]!, attrs: attrsOf(m[2]!) })
  const texts: string[] = []
  for (const m of src.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) texts.push(normText(decodeEntities(m[1]!.replace(/<[^>]*>/g, ''))))
  const bounds = svgBounds(attrsOf(root[1]!))
  return bounds ? { bounds, texts, elements } : { bounds, texts, elements, error: 'the <svg> has no viewBox, width or height' }
}

interface Compound {
  tag: string | null
  id: string | null
  classes: string[]
  attrs: { name: string; value: string | null }[]
}

/** A selector with no combinators or pseudo-classes, as parts; null for anything more. */
function parseCompound(sel: string): Compound | null {
  const re = /^([a-zA-Z][\w-]*|\*)?((?:#[\w-]+|\.[\w-]+|\[[\w:-]+(?:=(?:"[^"]*"|'[^']*'|[\w-]+))?\])*)$/
  const m = re.exec(sel.trim())
  if (!m) return null
  const out: Compound = { tag: m[1] && m[1] !== '*' ? m[1] : null, id: null, classes: [], attrs: [] }
  for (const p of m[2]!.matchAll(/#([\w-]+)|\.([\w-]+)|\[([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([\w-]+)))?\]/g)) {
    if (p[1]) out.id = p[1]
    else if (p[2]) out.classes.push(p[2])
    else out.attrs.push({ name: p[3]!, value: p[4] ?? p[5] ?? p[6] ?? null })
  }
  return out
}

/**
 * How many elements a simple CSS selector matches (`rect[x="460"][y="78"]`, `#stage-2`, `g.panel`,
 * or a comma list of them); null when the selector is beyond this little matcher (combinators,
 * pseudo-classes): the board still resolves it, the check just can't; `'invalid'` when a browser
 * would refuse it (empty, or an empty part of a comma list such as `rect.panel,`), so the board
 * draws nothing for it (FINDINGS R-84).
 */
export function matchSimpleSelector(sel: string, elements: SvgElement[]): number | null | 'invalid' {
  const raw = sel.split(',')
  if (raw.some((p) => !p.trim())) return 'invalid'
  const parts = raw.map(parseCompound)
  if (parts.some((p) => !p)) return null
  let n = 0
  for (const el of elements) {
    const hit = (parts as Compound[]).some(
      (c) =>
        (!c.tag || c.tag === el.tag) &&
        (!c.id || el.attrs.id === c.id) &&
        c.classes.every((k) => (el.attrs.class ?? '').split(/\s+/).includes(k)) &&
        c.attrs.every((a) => (a.value === null ? a.name in el.attrs : el.attrs[a.name] === a.value)),
    )
    if (hit) n++
  }
  return n
}

/* ----------------------------------------------------------------- mermaid */

/** Statements that declare no node: the header, subgraph lines, styling, interaction and accessibility. */
const MERMAID_NOT_NODES = /^(?:flowchart|graph|subgraph|end|direction|style|classDef|class|click|linkStyle|accTitle|accDescr)(?![\w-])/
/** A node ID: word characters, with single hyphens inside (`node-1`), never a link's dashes. */
const MERMAID_ID = /^[A-Za-z0-9_](?:\w|-(?=\w))*/
/**
 * A link between nodes, at the point after one: a labelled form (`-- text -->`, `== text ==>`,
 * `-. text .->`), then a plain one of any length (`-->`, `---`, `-.->`, `==>`, `~~~`, `<-->`), each
 * with optional `o` or `x` heads (`--o`, `o--o`, `x--x`).
 */
const MERMAID_LINK = /^[<ox]?(?:(?:--|==|-\.)\s+[^]*?\s+(?:-{2,}[->]|={2,}[=>]|\.-+>?|-{3,}|={3,})|-{2,}|={2,}|-\.+-|~{3,})>?(?:[ox](?![\w-]))?/
const MERMAID_OPEN: Record<string, string> = { '[': ']', '(': ')', '{': '}', '>': ']' }

/** Past a node's shape (`[..]`, `((..))`, `[(..)]`, `{{..}}`, `>..]`, ...) starting at `i`, or `i` when there is none. */
function pastShape(s: string, i: number): number {
  const first = s[i]
  if (!first || !(first in MERMAID_OPEN)) return i
  if (first === '>') {
    const end = s.indexOf(']', i)
    return end < 0 ? s.length : end + 1
  }
  const stack: string[] = []
  for (let j = i; j < s.length; j++) {
    const c = s[j]!
    if (c === '[' || c === '(' || c === '{') stack.push(MERMAID_OPEN[c]!)
    else if (c === stack[stack.length - 1]) {
      stack.pop()
      if (!stack.length) return j + 1
    }
  }
  return s.length
}

/**
 * The node IDs a mermaid flowchart declares, for checking `node=` anchors; null for any other
 * diagram type (sequence, class, state ...), whose IDs this does not read. Read as mermaid reads a
 * statement: node, link, node ..., with `&` joining nodes, so a shape's label, a link's label or an
 * edge's `o`/`x` head is never taken for a node (FINDINGS R-27).
 */
export function mermaidNodeIds(src: string): Set<string> | null {
  const lines = src.split('\n').map((l) => l.replace(/%%.*$/, ''))
  const first = lines.find((l) => l.trim())
  if (!first || !/^\s*(flowchart|graph)\b/.test(first)) return null
  const ids = new Set<string>()
  // Labels go first (quoted text, `|label|`, `@{...}` shape data, `:::class`), so nothing in them splits a statement.
  const text = lines
    .join('\n')
    .replace(/"[^"]*"/g, '""')
    .replace(/\|[^|\n]*\|/g, ' ')
    .replace(/@\{[^}]*\}/g, ' ')
    .replace(/:::[\w-]+/g, ' ')
  for (const raw of text.split(/[;\n]/)) {
    const s = raw.trim()
    if (!s || MERMAID_NOT_NODES.test(s)) continue
    let i = 0
    while (i < s.length) {
      while (i < s.length && /[\s&]/.test(s[i]!)) i++
      const id = MERMAID_ID.exec(s.slice(i))
      if (!id) {
        i = s.indexOf(' ', i + 1) < 0 ? s.length : s.indexOf(' ', i + 1) // not a node: skip a word
        continue
      }
      ids.add(id[0])
      i = pastShape(s, i + id[0].length)
      while (i < s.length && /\s/.test(s[i]!)) i++
      const link = MERMAID_LINK.exec(s.slice(i))
      if (link) i += link[0].length
    }
  }
  return ids
}

/* ------------------------------------------------------------------ raster */

/** Pixel size from a PNG, JPEG or WebP header; null when the bytes are none of those. */
export function rasterSize(b: Uint8Array): { w: number; h: number } | null {
  const u32 = (o: number) => ((b[o]! << 24) | (b[o + 1]! << 16) | (b[o + 2]! << 8) | b[o + 3]!) >>> 0
  const u16 = (o: number) => (b[o]! << 8) | b[o + 1]!
  const le16 = (o: number) => b[o]! | (b[o + 1]! << 8)
  const le24 = (o: number) => b[o]! | (b[o + 1]! << 8) | (b[o + 2]! << 16)
  const ascii = (o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n))
  if (b.length >= 24 && b[0] === 0x89 && ascii(1, 3) === 'PNG') return { w: u32(16), h: u32(20) }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let o = 2
    while (o + 9 < b.length) {
      if (b[o] !== 0xff) {
        o++
        continue
      }
      const marker = b[o + 1]!
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { w: u16(o + 7), h: u16(o + 5) }
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01 || marker === 0xff) {
        o += marker === 0xff ? 1 : 2
        continue
      }
      o += 2 + u16(o + 2)
    }
    return null
  }
  if (b.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const chunk = ascii(12, 4)
    if (chunk === 'VP8 ') return { w: le16(26) & 0x3fff, h: le16(28) & 0x3fff }
    if (chunk === 'VP8L') {
      const bits = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24)
      return { w: (bits & 0x3fff) + 1, h: ((bits >>> 14) & 0x3fff) + 1 }
    }
    if (chunk === 'VP8X') return { w: le24(24) + 1, h: le24(27) + 1 }
  }
  return null
}

/* ---------------------------------------------------------------- markdown */

/*
 * Inline text as the board renders it, read from the source (FINDINGS R-83). Characters that must
 * stay literal (a backslash escape, an entity, an autolink's URL, code) are held as private-use
 * stand-ins while the marks are dropped, then given back.
 */
const HOLD = 0xe000
const hold = (s: string) => s.replace(/[!-/:-@[-`{-~]/g, (c) => String.fromCharCode(HOLD + c.charCodeAt(0)))
const release = (s: string) => s.replace(/[\uE000-\uE07F]/g, (c) => String.fromCharCode(c.charCodeAt(0) - HOLD))
/** A link label as CommonMark matches it against a definition: case and inner whitespace folded. */
export const linkLabel = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

function inlineProse(s: string, defs: ReadonlySet<string>): string {
  let t = s
    // A backslash escape is the character itself, never a mark.
    .replace(/\\([!-/:-@[-`{-~])/g, (_, c: string) => hold(c))
    // An autolink keeps its URL (or address) as its text; any other tag is dropped.
    .replace(/<([A-Za-z][A-Za-z0-9+.-]{1,31}:[^\s<>]*|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>/g, (_, u: string) => hold(u))
    .replace(/<\/?[A-Za-z][^<>]*>/g, '')
    // An entity is the character it names, kept literal.
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all) => hold(decodeEntities(all)))
  // Images, then links: inline, full reference, collapsed and shortcut (when defined).
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, '') // an image shows no text
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  t = t.replace(/(!?)\[([^\]]*)\](?:\[([^\]]*)\])?/g, (all, bang: string, text: string, ref: string | undefined) => {
    if (!defs.has(linkLabel(ref || text))) return all
    return bang ? '' : text
  })
  // Strikethrough (GFM, one or two tildes), then emphasis: a `*` run pairs anywhere, a `_` run only at a word's edge.
  // Nested marks unwrap one level a pass; stop as soon as a pass changes nothing.
  for (let i = 0, was = ''; i < 3 && was !== t; i++) {
    was = t
    t = t
      .replace(/(~~?)(?=\S)([^~]*?\S)\1(?!~)/g, '$2')
      .replace(/(\*+)(?=[^\s*])([\s\S]*?[^\s*])\1/g, '$2')
      .replace(/(?<![\p{L}\p{N}_])(_+)(?=[^\s_])([\s\S]*?[^\s_])\1(?![\p{L}\p{N}_])/gu, '$2')
  }
  return t
}

/**
 * A line of Markdown as it reads: code spans keep their content, links and references read as their
 * words, escapes and entities as their characters, an autolink as its URL; emphasis, strikethrough
 * and tags dropped, an intraword underscore kept (`fee_schedule`). `defs` are the document's link
 * definitions (`linkLabel` form): a reference link to none stays as written, as it renders.
 */
export const inlinePlain = (s: string, defs: ReadonlySet<string> = new Set()) => normText(readable(s, defs))

/**
 * Text as it reads, line breaks kept: a fenced block as its content lines, an image as nothing. Code
 * is held first, so the marks around it pair across it (`*a \`x\` b*` reads "a x b").
 */
function readable(s: string, defs: ReadonlySet<string>): string {
  let out = ''
  let at = 0
  for (const [from, to, kind] of codeRanges(s)) {
    out += s.slice(at, from)
    const block = s.slice(from, to)
    if (kind === 'fence') out += hold(fenceContent(block)) + (block.endsWith('\n') ? '\n' : '')
    else {
      const run = /^`+/.exec(block)![0].length
      let code = block.slice(run, -run).replace(/\n/g, ' ')
      if (/^ [\s\S]*[^ ][\s\S]* $/.test(code)) code = code.slice(1, -1)
      out += hold(code)
    }
    at = to
  }
  return release(inlineProse(out + s.slice(at), defs))
}

/** The link reference definitions of a document, as `linkLabel`s (pass lines with code blanked). */
export function linkDefinitions(lines: readonly string[]): Set<string> {
  const out = new Set<string>()
  for (const l of lines) {
    const m = /^ {0,3}\[([^\]]+)\]:\s*\S/.exec(l)
    if (m) out.add(linkLabel(m[1]!))
  }
  return out
}

/**
 * An ATX heading line's depth and content. The closing run of `#` goes only when a space or tab comes
 * before it (or it is all there is), as CommonMark reads it, so `# C#` keeps "C#".
 */
function atxHeading(line: string): { depth: number; content: string } | null {
  const m = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/.exec(line)
  if (!m) return null
  return { depth: m[1]!.length, content: (m[2] ?? '').replace(/(?:^|[ \t]+)#+[ \t]*$/, '') }
}

/** GitHub's heading slug: lower case, punctuation dropped, spaces to hyphens. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-')
}

export interface MarkdownFacts {
  headings: Heading[]
  /** The whole document as `looseText`, for `quote=` anchors. */
  loose: string
  lines: number
  /** Its numbered points, which sources cite as `#n`. */
  points: NotePoint[]
}

/** Fenced code blocks blanked out, line count kept (the shared fence rule, `markdownCode.ts`). */
const withoutFences = (lines: string[]) => {
  const mask = fenceMask(lines)
  return lines.map((l, i) => (mask[i] ? '' : l))
}

/** Headings in order, each with a unique slug (a repeat gains -1, -2, as GitHub does). */
export function markdownHeadings(md: string): Heading[] {
  const seen = new Map<string, number>()
  const out: Heading[] = []
  const lines = withoutFences(md.replace(/\r\n/g, '\n').split('\n'))
  const defs = linkDefinitions(lines)
  lines.forEach((line, i) => {
    const atx = atxHeading(line)
    // A setext heading: a paragraph line underlined with === (h1) or --- (h2).
    const under = /^ {0,3}(=+|-+)\s*$/.exec(lines[i + 1] ?? '')
    const setext = !atx && under && line.trim() && !/^ {0,3}([-*+>]|\d+[.)]|#|\|)/.test(line) && (i === 0 || !lines[i - 1]!.trim()) ? { depth: under[1]![0] === '=' ? 1 : 2, text: line } : null
    if (!atx && !setext) return
    const text = inlinePlain(atx ? atx.content : setext!.text, defs)
    const base = slugify(text) || 'section'
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    out.push({ depth: atx ? atx.depth : setext!.depth, text, slug: n ? `${base}-${n}` : base, line: i + 1 })
  })
  return out
}

const POINT = /^(\d+)\.\s+(.*)$/
const HEADING_LINE = /^ {0,3}#{1,6}\s/

/**
 * A note's numbered points: each top-level `n.` list item (at the start of the line, outside code;
 * an indented list inside a point is part of it). A point runs to the line before the next point,
 * the next heading, or the next paragraph that starts at the margin after a blank line, trailing
 * blank lines left out. Numbers are as written: a note may repeat them in different sections.
 */
export function markdownPoints(md: string): NotePoint[] {
  const lines = withoutFences(md.replace(/\r\n/g, '\n').split('\n'))
  const out: NotePoint[] = []
  let open: NotePoint | null = null
  const close = (i: number) => {
    if (!open) return
    let to = i
    while (to > open.from && !lines[to - 1]!.trim()) to--
    open.to = to
    out.push(open)
    open = null
  }
  lines.forEach((line, i) => {
    const m = POINT.exec(line)
    const ends = m || HEADING_LINE.test(line) || (line.trim() && !/^\s/.test(line) && i > 0 && !lines[i - 1]!.trim())
    if (ends) close(i)
    if (m) {
      const bold = /^\*\*(.+?)\*\*/.exec(m[2]!)
      // A bold lead closed on a later line: its opening mark is no part of the title.
      const title = inlinePlain(bold ? bold[1]! : m[2]!.replace(/^(\*\*|__)(?=\S)/, '')).replace(/[.:]$/, '')
      open = { n: Number(m[1]), from: i + 1, to: i + 1, title: title.length > 90 ? `${title.slice(0, 88).trimEnd()}…` : title }
    }
  })
  close(lines.length)
  return out
}

/** A Markdown document's text as it reads, block marks dropped (headings, quotes, lists, links, tags). */
export function markdownReadable(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const code = fenceMask(lines)
  const defs = linkDefinitions(lines.map((l, i) => (code[i] ? '' : l)))
  const blocks = lines.map((l, i) => {
    if (code[i]) return l
    if (/^ {0,3}\[[^\]]+\]:\s*\S/.test(l)) return '' // a link definition is not shown
    const atx = atxHeading(l)
    return (atx ? atx.content : l)
      .replace(/^\s*(?:>\s?)+/, '')
      .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/, '')
      .replace(/^\s*(?:-{3,}|\*{3,}|_{3,}|={3,})\s*$/, '')
      .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/, '')
  })
  // Inline marks as the heading text reads them (one rule, `readable`); an image shows no text.
  return readable(blocks.join('\n'), defs)
}

export function markdownFacts(md: string): MarkdownFacts {
  return {
    headings: markdownHeadings(md),
    loose: looseText(markdownReadable(md)),
    lines: md.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length,
    points: markdownPoints(md),
  }
}

/* ------------------------------------------------------------------- boxes */

export function unionRects(rects: Rect[]): Rect | null {
  if (!rects.length) return null
  const x0 = Math.min(...rects.map((r) => r.x))
  const y0 = Math.min(...rects.map((r) => r.y))
  const x1 = Math.max(...rects.map((r) => r.x + r.w))
  const y1 = Math.max(...rects.map((r) => r.y + r.h))
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

export const padRect = (r: Rect, pad: number): Rect => ({ x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad })

export const boxRect = (b: Box): Rect => ({ x: b[0], y: b[1], w: b[2], h: b[3] })

/** Does `inner` lie inside `outer` (a hair of slack for rounding)? */
export const rectWithin = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.w <= outer.x + outer.w + 0.5 && inner.y + inner.h <= outer.y + outer.h + 0.5

/** Region IDs: lower-case words joined by hyphens. */
export const isRegionId = (s: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)

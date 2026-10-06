/**
 * What an artifact's file holds, read without a DOM, so `npm run check` can hold every region to
 * account and the board can name a document's automatic regions. Pure: the server reads the
 * bytes and the browser reuses the same rules (anchor grammar, slugs, loose text matching).
 */
import type { ArtifactFormat, Box, Heading, Rect } from './types.ts'

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

/** Whitespace collapsed and trimmed, as `text=` anchors compare. */
export const normText = (s: string) => s.replace(/\s+/g, ' ').trim()

/**
 * Text reduced for passage matching: no whitespace, no emphasis or code marks, no table pipes or
 * escapes. A quote lifted from the rendered page matches the source, and a line break or a
 * reflowed PDF line never stops a match.
 */
export const looseText = (s: string) => s.normalize('NFC').replace(/[\s*_`|\\]/g, '')

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : all
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
 * or a comma list of them), or null when the selector is beyond this little matcher (combinators,
 * pseudo-classes): the board still resolves it, the check just can't.
 */
export function matchSimpleSelector(sel: string, elements: SvgElement[]): number | null {
  const parts = sel.split(',').map(parseCompound)
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

const MERMAID_WORDS = new Set(['graph', 'flowchart', 'subgraph', 'end', 'direction', 'TD', 'TB', 'BT', 'RL', 'LR'])
const MERMAID_SKIP_LINE = /^\s*(style|classDef|class|click|linkStyle|%%)/

/**
 * The node IDs a mermaid flowchart declares, for checking `node=` anchors; null for any other
 * diagram type (sequence, class, state ...), whose IDs this does not read.
 */
export function mermaidNodeIds(src: string): Set<string> | null {
  const lines = src.split('\n').map((l) => l.replace(/%%.*$/, ''))
  const first = lines.find((l) => l.trim())
  if (!first || !/^\s*(flowchart|graph)\b/.test(first)) return null
  const ids = new Set<string>()
  for (const raw of lines) {
    if (MERMAID_SKIP_LINE.test(raw) || /^\s*(flowchart|graph)\b/.test(raw)) continue
    let s = raw.replace(/^\s*subgraph\b.*$/, '').replace(/^\s*end\s*$/, '')
    s = s.replace(/"[^"]*"/g, ' ').replace(/:::[\w-]+/g, ' ')
    // Edge labels: |text| and the "-- text -->" forms.
    s = s.replace(/\|[^|]*\|/g, ' ').replace(/(--|==|-\.)\s+[^-=.>]+?\s+(-->|==>|\.->|---|===)/g, ' $2 ')
    // Node shapes, innermost first: [..] (..) {..} >..]
    for (let i = 0; i < 4; i++) s = s.replace(/\[[^[\]]*\]|\([^()]*\)|\{[^{}]*\}|>[^\]]*\]/g, ' ')
    s = s.replace(/<?(?:-{2,}|={2,}|-\.+-|~{3,})>?/g, ' ')
    for (const tok of s.split(/[\s;&]+/)) if (/^[A-Za-z0-9_][\w-]*$/.test(tok) && !MERMAID_WORDS.has(tok)) ids.add(tok)
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

/** A heading's text as it reads: links to their words, emphasis and code marks dropped. */
export const inlinePlain = (s: string) =>
  normText(
    s
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[*_`]/g, '')
      .replace(/\\(.)/g, '$1'),
  )

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
}

/** Fenced code blocks blanked out, line count kept. */
const withoutFences = (lines: string[]) => {
  let fence: string | null = null
  return lines.map((l) => {
    const m = /^\s*(```|~~~)/.exec(l)
    if (m) {
      if (fence === null) fence = m[1]!
      else if (fence === m[1]) fence = null
      return ''
    }
    return fence === null ? l : ''
  })
}

/** Headings in order, each with a unique slug (a repeat gains -1, -2, as GitHub does). */
export function markdownHeadings(md: string): Heading[] {
  const seen = new Map<string, number>()
  const out: Heading[] = []
  const lines = withoutFences(md.replace(/\r\n/g, '\n').split('\n'))
  lines.forEach((line, i) => {
    const atx = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line)
    // A setext heading: a paragraph line underlined with === (h1) or --- (h2).
    const under = /^ {0,3}(=+|-+)\s*$/.exec(lines[i + 1] ?? '')
    const setext = !atx && under && line.trim() && !/^ {0,3}([-*+>]|\d+[.)]|#|\|)/.test(line) && (i === 0 || !lines[i - 1]!.trim()) ? { depth: under[1]![0] === '=' ? 1 : 2, text: line } : null
    if (!atx && !setext) return
    const text = inlinePlain(atx ? atx[2]! : setext!.text)
    const base = slugify(text) || 'section'
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    out.push({ depth: atx ? atx[1]!.length : setext!.depth, text, slug: n ? `${base}-${n}` : base })
  })
  return out
}

/** A Markdown document's text as it reads, block marks dropped (headings, quotes, lists, links, tags). */
export function markdownReadable(md: string): string {
  return md
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) =>
      l
        .replace(/^ {0,3}#{1,6}\s+/, '')
        .replace(/^\s*(?:>\s?)+/, '')
        .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/, '')
        .replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/, '')
        .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/, ''),
    )
    .join('\n')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
}

export function markdownFacts(md: string): MarkdownFacts {
  return { headings: markdownHeadings(md), loose: looseText(decodeEntities(markdownReadable(md))), lines: md.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length }
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

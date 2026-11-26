/**
 * The rooms' PDF layout engine (Intake's simulated PDFs). A template lays a document out on one or more pages with a
 * `PageBuilder`: text, rules, fills and marks, each read value's text tagged with its key. The same pass that places
 * a value's text records its box, so the page that is drawn and the box the reader reports can never drift apart.
 *
 * Text widths come from Helvetica's metrics (Arial is metric-compatible), scaled for a narrower face, and every text
 * is drawn with that width (`textLength`), so whatever font the viewer substitutes, the text fills exactly the room
 * its box gives it. Pure and deterministic: no clock, no randomness.
 */

/** The faces a template prints in. Each maps to a font stack and a width scale against Helvetica. */
export type PdfFont = 'helvetica' | 'arial' | 'calibri' | 'times'

export const FONT_STACKS: Record<PdfFont, { family: string; scale: number }> = {
  helvetica: { family: "Helvetica, Arial, 'Liberation Sans', sans-serif", scale: 1 },
  arial: { family: "Arial, Helvetica, 'Liberation Sans', sans-serif", scale: 1 },
  calibri: { family: "Calibri, Carlito, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif", scale: 0.875 },
  times: { family: "'Times New Roman', Times, 'Liberation Serif', serif", scale: 0.9 },
}

// Helvetica advance widths (per 1000 em) for ASCII 32 to 126, regular then bold (the standard AFM values).
const REGULAR = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
  584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
  278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
  500, 334, 260, 334, 584,
]
const BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584,
  584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333,
  278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556,
  500, 389, 280, 389, 584,
]

/** How a run of text is printed. Colours are the document's own ink (a paper facsimile, not app UI). */
export interface TextStyle {
  size: number
  bold?: boolean
  italic?: boolean
  font?: PdfFont
  fill?: string
  underline?: boolean
  /** A marker fill behind the text (a highlighted cell value). */
  highlight?: string
  /** Raised above the baseline by this much (a superscript ordinal). */
  rise?: number
  letterSpacing?: number
}

/** The width a text takes in a style, in page units. */
export function textWidth(text: string, style: TextStyle): number {
  const table = style.bold === true ? BOLD : REGULAR
  let units = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    units += code >= 32 && code <= 126 ? table[code - 32]! : ch === '☑' || ch === '☐' ? 860 : 556
  }
  const scale = FONT_STACKS[style.font ?? 'helvetica'].scale
  return (units / 1000) * style.size * scale + (style.letterSpacing ?? 0) * Math.max(0, [...text].length - 1)
}

export interface TextOp {
  kind: 'text'
  /** Left edge (every text is drawn start-anchored at its measured width). */
  x: number
  baseline: number
  text: string
  width: number
  style: TextStyle
  /** The read value this text prints (`pdfValueKey`), when it prints one. */
  key?: string
}
export interface LineOp {
  kind: 'line'
  x1: number
  y1: number
  x2: number
  y2: number
  stroke: string
  width: number
  dash?: string
}
export interface RectOp {
  kind: 'rect'
  x: number
  y: number
  w: number
  h: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  rx?: number
}
/** A fragment drawn as given (a logo mark, a barcode): no text, nothing read from it. */
export interface RawOp {
  kind: 'raw'
  svg: string
}
export type DrawOp = TextOp | LineOp | RectOp | RawOp

/** A read value's box on a page, in content units, and whether the reader worked it out rather than read it. */
export interface ContentSpot {
  x0: number
  y0: number
  x1: number
  y1: number
  derived: boolean
}

/** One laid-out page: what is drawn, and where each read value's text sits. */
export interface PageLayout {
  ops: DrawOp[]
  spots: Map<string, ContentSpot>
}

/** One run of a line: its text, its style over the line's, and the read value it prints. */
export interface Run {
  text: string
  style?: Partial<TextStyle>
  key?: string
  derived?: boolean
  /** A run that may break across lines in `flow` (a keyed run stays whole unless this is set). */
  breakable?: boolean
}

export type Anchor = 'start' | 'middle' | 'end'

/** The box around a text: cap height above the baseline to the descenders below, with a point of air. */
export function textBox(x: number, baseline: number, width: number, style: TextStyle): { x0: number; y0: number; x1: number; y1: number } {
  const b = baseline - (style.rise ?? 0)
  return { x0: x - 1, y0: b - style.size * 0.8 - 1, x1: x + width + 1, y1: b + style.size * 0.24 + 1 }
}

/**
 * Builds one page. `text`, `runs` and `flow` place text and return where it ended; a keyed text grows its key's box
 * (a value printed over several lines gets one box around them all).
 */
export class PageBuilder {
  readonly ops: DrawOp[] = []
  readonly spots = new Map<string, ContentSpot>()
  readonly width: number
  readonly height: number
  readonly base: TextStyle

  constructor(width: number, height: number, base: TextStyle) {
    this.width = width
    this.height = height
    this.base = base
  }

  style(over?: Partial<TextStyle>): TextStyle {
    return over === undefined ? this.base : { ...this.base, ...over }
  }

  measure(text: string, over?: Partial<TextStyle>): number {
    return textWidth(text, this.style(over))
  }

  /** Text at a baseline; returns its right edge. */
  text(x: number, baseline: number, text: string, over?: Partial<TextStyle>, opts: { anchor?: Anchor; key?: string; derived?: boolean } = {}): number {
    if (text === '') return x
    const style = this.style(over)
    const full = textWidth(text, style)
    const left = opts.anchor === 'end' ? x - full : opts.anchor === 'middle' ? x - full / 2 : x
    // SVG collapses a text's outer spaces: draw the words alone, after the room the leading spaces take.
    const core = text.trim()
    if (core === '') return left + full
    const lead = textWidth(text.slice(0, text.length - text.trimStart().length), style)
    const width = textWidth(core, style)
    const at = left + lead
    const b = textBox(at, baseline, width, style)
    if (style.highlight !== undefined) this.ops.push({ kind: 'rect', x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0, fill: style.highlight })
    this.ops.push({ kind: 'text', x: at, baseline, text: core, width, style, ...(opts.key !== undefined ? { key: opts.key } : {}) })
    if (style.underline === true) this.line(at, baseline + style.size * 0.12, at + width, baseline + style.size * 0.12, style.fill ?? '#000', Math.max(0.5, style.size * 0.06))
    if (opts.key !== undefined) this.mark(opts.key, b, opts.derived === true)
    return left + full
  }

  /** Runs side by side from x; returns the right edge. */
  runs(x: number, baseline: number, runs: readonly Run[], over?: Partial<TextStyle>, anchor: Anchor = 'start'): number {
    const total = runs.reduce((w, r) => w + this.measure(r.text, { ...over, ...r.style }), 0)
    let at = anchor === 'end' ? x - total : anchor === 'middle' ? x - total / 2 : x
    for (const r of runs) at = this.text(at, baseline, r.text, { ...over, ...r.style }, { ...(r.key !== undefined ? { key: r.key } : {}), ...(r.derived === true ? { derived: true } : {}) })
    return at
  }

  /**
   * Runs flowed into a column `width` wide from (x, baseline), a new line every `leading`. Unkeyed (and breakable)
   * runs break between words; a keyed run moves whole to the next line. Returns the last line's baseline and the
   * number of lines. `align` centres or right-aligns each line in the column.
   */
  flow(
    x: number,
    baseline: number,
    width: number,
    runs: readonly Run[],
    opts: { over?: Partial<TextStyle>; leading?: number; align?: Anchor; maxLines?: number } = {},
  ): { baseline: number; lines: number } {
    const lines = wrapRuns(runs, width, (r) => this.measure(r.text, { ...opts.over, ...r.style }))
    const shown = opts.maxLines !== undefined ? lines.slice(0, opts.maxLines) : lines
    const leading = opts.leading ?? this.style(opts.over).size * 1.2
    shown.forEach((line, i) => {
      const at = opts.align === 'middle' ? x + width / 2 : opts.align === 'end' ? x + width : x
      this.runs(at, baseline + i * leading, line, opts.over, opts.align ?? 'start')
    })
    return { baseline: baseline + Math.max(0, shown.length - 1) * leading, lines: Math.max(1, shown.length) }
  }

  /** How many lines `flow` would take. */
  lineCount(width: number, runs: readonly Run[], over?: Partial<TextStyle>): number {
    return Math.max(1, wrapRuns(runs, width, (r) => this.measure(r.text, { ...over, ...r.style })).length)
  }

  line(x1: number, y1: number, x2: number, y2: number, stroke = '#000', width = 0.75, dash?: string): void {
    this.ops.push({ kind: 'line', x1, y1, x2, y2, stroke, width, ...(dash !== undefined ? { dash } : {}) })
  }

  rect(x: number, y: number, w: number, h: number, look: { fill?: string; stroke?: string; strokeWidth?: number; rx?: number }): void {
    this.ops.push({ kind: 'rect', x, y, w, h, ...look })
  }

  raw(svg: string): void {
    this.ops.push({ kind: 'raw', svg })
  }

  /** Grows a key's box to take in another box (a value printed in parts). */
  mark(key: string, b: { x0: number; y0: number; x1: number; y1: number }, derived = false): void {
    const cur = this.spots.get(key)
    this.spots.set(
      key,
      cur === undefined
        ? { ...b, derived }
        : { x0: Math.min(cur.x0, b.x0), y0: Math.min(cur.y0, b.y0), x1: Math.max(cur.x1, b.x1), y1: Math.max(cur.y1, b.y1), derived: cur.derived || derived },
    )
  }

  page(): PageLayout {
    return { ops: this.ops, spots: this.spots }
  }
}

/** Splits runs into lines no wider than `width` (a word wider than the line is put on its own line). */
function wrapRuns(runs: readonly Run[], width: number, measure: (r: Run) => number): Run[][] {
  // Tokens: a keyed, unbreakable run is one token; anything else is split after each space.
  const tokens: Run[] = []
  for (const r of runs) {
    if (r.text.includes('\n')) {
      r.text.split('\n').forEach((part, i) => {
        if (i > 0) tokens.push({ text: '\n' })
        if (part !== '') tokens.push({ ...r, text: part })
      })
      continue
    }
    if (r.key !== undefined && r.breakable !== true) tokens.push(r)
    else for (const w of r.text.match(/[^ ]+ *| +/g) ?? []) tokens.push({ ...r, text: w })
  }
  const lines: Run[][] = [[]]
  let used = 0
  for (const t of tokens) {
    if (t.text === '\n') {
      lines.push([])
      used = 0
      continue
    }
    const w = measure({ ...t, text: t.text.trimEnd() })
    const line = lines[lines.length - 1]!
    if (line.length > 0 && used + w > width + 0.01) {
      // Drop the trailing space of the line we leave, then start a new one.
      const last = line[line.length - 1]!
      line[line.length - 1] = { ...last, text: last.text.trimEnd() }
      if (t.text.trim() === '') continue
      lines.push([t])
      used = measure(t)
      continue
    }
    line.push(t)
    used += measure(t)
  }
  // Merge neighbouring tokens of one style and key, and trim each line's end.
  return lines
    .map((line) => {
      const out: Run[] = []
      for (const t of line) {
        const prev = out[out.length - 1]
        if (prev !== undefined && prev.key === t.key && prev.derived === t.derived && JSON.stringify(prev.style ?? {}) === JSON.stringify(t.style ?? {})) out[out.length - 1] = { ...prev, text: prev.text + t.text }
        else out.push({ ...t })
      }
      if (out.length > 0) out[out.length - 1] = { ...out[out.length - 1]!, text: out[out.length - 1]!.text.trimEnd() }
      return out.filter((r) => r.text !== '')
    })
    .filter((line, i, all) => line.length > 0 || i < all.length - 1)
}

/** A barcode's bars (a Code 128 look, drawn from the text's character codes: it is not scannable). */
export function barcodeSvg(x: number, y: number, width: number, height: number, text: string, ink = '#000'): string {
  const widths: number[] = [2, 1, 1, 2, 3, 2]
  for (const ch of text) {
    const c = ch.charCodeAt(0)
    widths.push(1 + (c % 3), 1 + ((c >> 2) % 2), 1 + ((c >> 1) % 3), 1 + ((c >> 3) % 2), 2 + (c % 2), 1 + ((c >> 4) % 2))
  }
  widths.push(2, 3, 3, 1, 1, 1, 2)
  const total = widths.reduce((a, b) => a + b, 0)
  const unit = width / total
  let at = x
  const bars: string[] = []
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push(`<rect x="${at.toFixed(2)}" y="${y.toFixed(2)}" width="${(w * unit).toFixed(2)}" height="${height.toFixed(2)}" fill="${ink}"/>`)
    at += w * unit
  })
  return bars.join('')
}

/**
 * The Diff review's text comparison, as pure functions: a Markdown field cut into blocks
 * (paragraphs, list items, headings...), the blocks of two versions paired row by row so a
 * before and after can sit side by side, and the words that changed inside a paired block,
 * marked with private-use sentinels for the renderer to turn into `del` and `ins`.
 */
import { idMentions } from './links.ts'
import { lcsPairs, squashSpace } from './textCompare.ts'

type BlockKind = 'para' | 'heading' | 'item' | 'quote' | 'table' | 'code' | 'line'

export interface Block {
  kind: BlockKind
  /** Nesting depth of a list item (0 at the top level). */
  depth: number
  /** The block's Markdown, dedented (a list item keeps its marker). */
  text: string
  /** A numbered list's first item: the number the list starts at, which Markdown shows. */
  start?: number
}

const FENCE = /^\s*(```|~~~)/
const HEADING = /^\s{0,3}#{1,6}\s/
const TABLE = /^\s*\|/
const QUOTE = /^\s*>/
const ITEM = /^(\s*)([-*+]|\d+[.)])\s+/

const indentOf = (s: string) => s.replace(/\t/g, '    ').length

/**
 * A Markdown text as blocks. With `lines`, every line is its own block (a diagram's source,
 * read as code).
 */
export function splitBlocks(md: string, opts: { lines?: boolean } = {}): Block[] {
  const text = md.replace(/\r\n/g, '\n').replace(/\s+$/, '')
  if (!text.trim()) return []
  if (opts.lines) return text.split('\n').map((l) => ({ kind: 'line', depth: 0, text: l }))
  const out: Block[] = []
  let cur: Block | null = null
  const flush = () => {
    if (cur) out.push(cur)
    cur = null
  }
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const fence = FENCE.exec(line)
    if (fence) {
      flush()
      const body = [line.trimStart()]
      while (++i < lines.length) {
        body.push(lines[i]!)
        if (lines[i]!.trimStart().startsWith(fence[1]!)) break
      }
      out.push({ kind: 'code', depth: 0, text: body.join('\n') })
      continue
    }
    if (!line.trim()) {
      flush()
      continue
    }
    if (HEADING.test(line)) {
      flush()
      out.push({ kind: 'heading', depth: 0, text: line.trim() })
      continue
    }
    if (TABLE.test(line)) {
      if (cur?.kind === 'table') cur.text += `\n${line.trim()}`
      else {
        flush()
        cur = { kind: 'table', depth: 0, text: line.trim() }
      }
      continue
    }
    if (QUOTE.test(line)) {
      if (cur?.kind === 'quote') cur.text += `\n${line.trim()}`
      else {
        flush()
        cur = { kind: 'quote', depth: 0, text: line.trim() }
      }
      continue
    }
    const item = ITEM.exec(line)
    if (item) {
      flush()
      cur = { kind: 'item', depth: Math.floor(indentOf(item[1]!) / 2), text: line.trimStart() }
      continue
    }
    // A plain line continues a paragraph or a list item (lazily), or starts a paragraph.
    if (cur && (cur.kind === 'para' || cur.kind === 'item')) cur.text += `\n${line.trim()}`
    else {
      flush()
      cur = { kind: 'para', depth: 0, text: line.trim() }
    }
  }
  flush()
  // A numbered list's first item: no item at its depth before it in the same list.
  for (let k = 0; k < out.length; k++) {
    const b = out[k]!
    const num = b.kind === 'item' ? /^(\d+)[.)]/.exec(b.text) : null
    if (!num) continue
    let first = true
    for (let p = k - 1; first && p >= 0 && out[p]!.kind === 'item' && out[p]!.depth >= b.depth; p--) if (out[p]!.depth === b.depth) first = false
    if (first) b.start = Number(num[1])
  }
  return out
}

type RowOp = 'same' | 'edited' | 'added' | 'removed'

/** One row of a side by side: a block on each side, or a block on one and a gap on the other. */
export interface Row {
  op: RowOp
  before: Block | null
  after: Block | null
}

const ITEM_MARK = /^([-*+]|\d+[.)])\s+/

/**
 * What a list item's marker shows: a bullet (whichever of `-`, `*`, `+`), a number, or on a numbered
 * list's first item the number it starts at. Renumbering after an insert, or another bullet
 * character, shows nothing new; a bullet turned into a number, or a new starting number, does.
 */
const shownMark = (b: Block) => (b.kind !== 'item' ? '' : /^\d/.test(b.text) ? 'ordered' : 'bullet')

/**
 * Two paired blocks whose markers show differently: a bullet against a number, or two list starts
 * (each its list's first item) at different numbers. The start is compared only between two list
 * starts, so an item inserted or removed at the top of a list changes no other item.
 */
const markerChanged = (a: Block, b: Block) => shownMark(a) !== shownMark(b) || (a.start != null && b.start != null && a.start !== b.start)

/** An item's text without its marker, for counting words (a "2." is no word). */
const bodyOf = (b: Block) => (b.kind === 'item' ? b.text.replace(ITEM_MARK, '') : b.text)

/** A block as the reader sees it: kind, depth, a list item's shown marker, and its text without the marker, spacing squashed. */
const keyOf = (b: Block) => (b.kind === 'item' ? `item:${b.depth}:${shownMark(b)}:${squashSpace(b.text.replace(ITEM_MARK, ''))}` : `${b.kind}:${b.depth}:${squashSpace(b.text)}`)

/**
 * Two Markdown texts with the same blocks, each reading the same but for its spacing (a paragraph
 * re-wrapped, a list renumbered or its bullets changed): nothing a reader would notice. Joining or
 * splitting paragraphs or list items, a new depth or kind, or a new starting number, is a change.
 */
export function sameBlocks(a: string, b: string): boolean {
  const x = splitBlocks(a)
  const y = splitBlocks(b)
  return x.length === y.length && x.every((k, i) => keyOf(k) === keyOf(y[i]!) && !markerChanged(k, y[i]!))
}

const wordsOf = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []

/** How alike two blocks' words read (0 to 1): the share of words they have in common. */
function similarity(x: string[], y: string[]): number {
  if (!x.length && !y.length) return 1
  const count = new Map<string, number>()
  for (const w of x) count.set(w, (count.get(w) ?? 0) + 1)
  let common = 0
  for (const w of y) {
    const n = count.get(w) ?? 0
    if (n > 0) {
      common++
      count.set(w, n - 1)
    }
  }
  return (2 * common) / (x.length + y.length)
}

/** Of a block's words, the share the other block holds too (the shorter block's view): an item only extended scores high. */
function overlap(x: string[], y: string[]): number {
  if (!x.length) return 0
  const has = new Set(y)
  return x.filter((w) => has.has(w)).length / x.length
}

/** Blocks this alike are one block edited, not one removed and another added. */
const PAIR_AT = 0.4

/** Paired when they read alike, or when one is mostly the other with words added (a short list item extended). */
function alikeWords(x: string[], y: string[]) {
  const s = similarity(x, y)
  if (s >= PAIR_AT) return true
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  return s >= 0.25 && overlap(short, long) >= 0.8
}

export const alike = (a: string, b: string) => alikeWords(wordsOf(a), wordsOf(b))

/** A run bigger than this (removed times added blocks) looks only `PAIR_WINDOW` added blocks ahead for each removed one: wholly different documents stay quick. */
const PAIR_ALL_UP_TO = 40_000
const PAIR_WINDOW = 100

/**
 * Pair the removed and added blocks between two unchanged ones, keeping both orders. Two blocks that
 * read the same (equal keys the comparison left unpaired) make a `same` row, never an edit with
 * nothing to mark.
 */
function pairRun(dels: Block[], adds: Block[], keys: Map<Block, string>, out: Row[]) {
  const window = dels.length * adds.length > PAIR_ALL_UP_TO ? PAIR_WINDOW : Infinity
  const words = new Map<Block, string[]>()
  const wordsOfBlock = (b: Block) => {
    let w = words.get(b)
    if (!w) words.set(b, (w = wordsOf(bodyOf(b))))
    return w
  }
  let j = 0
  for (const d of dels) {
    let k = -1
    for (let n = j; n < adds.length && n - j < window; n++) {
      if (keys.get(d) === keys.get(adds[n]!) || alikeWords(wordsOfBlock(d), wordsOfBlock(adds[n]!))) {
        k = n
        break
      }
    }
    if (k < 0) {
      out.push({ op: 'removed', before: d, after: null })
      continue
    }
    for (; j < k; j++) out.push({ op: 'added', before: null, after: adds[j]! })
    out.push({ op: keys.get(d) === keys.get(adds[k]!) ? 'same' : 'edited', before: d, after: adds[k]! })
    j = k + 1
  }
  for (; j < adds.length; j++) out.push({ op: 'added', before: null, after: adds[j]! })
}

/** Two versions' blocks as side by side rows: unchanged blocks level, edited ones paired, the rest against a gap. */
export function pairBlocks(a: Block[], b: Block[]): Row[] {
  const keysA = a.map(keyOf)
  const keysB = b.map(keyOf)
  const keys = new Map<Block, string>()
  a.forEach((x, i) => keys.set(x, keysA[i]!))
  b.forEach((x, i) => keys.set(x, keysB[i]!))
  const pairs = lcsPairs(keysA, keysB, (p, q) => p === q)
  const out: Row[] = []
  let i = 0
  let j = 0
  for (const [pi, pj] of [...pairs, [a.length, b.length] as [number, number]]) {
    pairRun(a.slice(i, pi), b.slice(j, pj), keys, out)
    if (pi < a.length && pj < b.length) out.push({ op: 'same', before: a[pi]!, after: b[pj]! })
    i = pi + 1
    j = pj + 1
  }
  // Two list starts at different numbers read the same in the key but show differently: an edit.
  for (const r of out) if (r.op === 'same' && markerChanged(r.before!, r.after!)) r.op = 'edited'
  return out
}

interface Segment {
  text: string
  changed: boolean
}

/** An `<autolink>` (a URL or an email address in angle brackets), or a bare URL as GFM links it (its closing punctuation left off). */
const AUTOLINK = String.raw`<[A-Za-z][A-Za-z0-9+.-]{1,31}:[^\s<>]*>|<[^\s<>@]+@[^\s<>]+>|(?:https?:\/\/|www\.)[^\s<>]*[^\s<>?!.,:;*_~'")\]]`

/**
 * One token: a record ID, a whole Markdown link or image, a code span, a URL, a word, a run of
 * spaces, or one other character. A link or URL is one token, so a change never lands inside its address.
 */
const TOKEN = new RegExp(String.raw`${idMentions().source}|!?\[[^\]\n]*\]\([^)\n]*\)|` + '`[^`\\n]*`' + `|${AUTOLINK}` + String.raw`|\s+|[\p{L}\p{N}_]+(?:['’][\p{L}\p{N}_]+)*|[^\s\p{L}\p{N}_]`, 'gu')

export const tokenize = (s: string) => s.match(TOKEN) ?? []

type Op = { op: 'same' | 'del' | 'add'; text: string }

/** A short unchanged run between two changes reads better as part of them ("the" between two rewritten clauses). */
const absorbable = (s: string) => !/[\p{L}\p{N}]/u.test(s) || s.trim().length <= 2

/** The words that changed between two versions of a block: each side's text as unchanged and changed segments. */
export function wordDiff(a: string, b: string): { before: Segment[]; after: Segment[] } {
  const x = tokenize(a)
  const y = tokenize(b)
  // The table's budget goes only to what lies between the common start and end (and past it, between
  // words found once each side), so a long paragraph with one word changed still marks that word.
  const pairs = lcsPairs(x, y, (p, q) => p === q, 400_000)
  let ops: Op[] = []
  const push = (op: Op['op'], text: string) => {
    const last = ops.at(-1)
    if (last?.op === op) last.text += text
    else ops.push({ op, text })
  }
  let i = 0
  let j = 0
  for (const [pi, pj] of [...pairs, [x.length, y.length] as [number, number]]) {
    while (i < pi) push('del', x[i++]!)
    while (j < pj) push('add', y[j++]!)
    if (pi < x.length && pj < y.length) push('same', x[pi]!)
    i = pi + 1
    j = pj + 1
  }
  // Fold short unchanged runs sandwiched between changes into both sides' changes.
  for (let changed = true; changed; ) {
    changed = false
    for (let k = 1; k < ops.length - 1; k++) {
      const o = ops[k]!
      if (o.op !== 'same' || !absorbable(o.text) || ops[k - 1]!.op === 'same' || ops[k + 1]!.op === 'same') continue
      const merged: Op[] = [{ op: 'del', text: '' }, { op: 'add', text: '' }]
      let s = k - 1
      while (s >= 0 && ops[s]!.op !== 'same') s--
      let e = k + 1
      while (e < ops.length && ops[e]!.op !== 'same') e++
      for (let n = s + 1; n < e; n++) {
        const p = ops[n]!
        if (p.op !== 'add') merged[0]!.text += p.text
        if (p.op !== 'del') merged[1]!.text += p.text
      }
      ops = [...ops.slice(0, s + 1), ...merged.filter((m) => m.text), ...ops.slice(e)]
      changed = true
      break
    }
  }
  const side = (keep: Op['op']): Segment[] => {
    const out: Segment[] = []
    for (const o of ops) {
      if (o.op !== 'same' && o.op !== keep) continue
      const changedSeg = o.op !== 'same'
      const last = out.at(-1)
      if (last && last.changed === changedSeg) last.text += o.text
      else out.push({ text: o.text, changed: changedSeg })
    }
    return out
  }
  return { before: side('del'), after: side('add') }
}

/** Sentinels around changed words, read back by the renderer (`src/diff/diffMarks.ts`). Private use, so never in real text. */
export const MARK_OPEN = '\uE000'
export const MARK_CLOSE = '\uE001'
export const MARK_ANY = /[\uE000\uE001]/g

/**
 * A block's text with its changed segments wrapped in sentinels. A change never spans a line break
 * or a table's cell rule, and the spaces around it stay outside, so the Markdown still parses.
 */
const PIECE = /^(\s*[*_]*)([\s\S]*?)([*_]*\s*)$/
const LINE_START_PIECE = /^(\s*(?:>\s?)*(?:(?:[-*+]|\d+[.)])\s+)?[*_]*)([\s\S]*?)([*_]*\s*)$/

function markSegments(segments: Segment[]): string {
  let out = ''
  for (const s of segments) {
    if (!s.changed) {
      out += s.text
      continue
    }
    for (const piece of s.text.split(/(\n|\|)/)) {
      if (piece === '\n' || piece === '|') {
        out += piece
        continue
      }
      // Emphasis markers stay outside the mark, so `**bold.**` still closes (a sentinel is not punctuation to Markdown).
      // On a piece that starts a line, so do the line's quote angles and list bullet, or the line stops being part of the quote or list.
      const re = out === '' || out.endsWith('\n') ? LINE_START_PIECE : PIECE
      const m = re.exec(piece)!
      out += m[2] ? `${m[1]}${MARK_OPEN}${m[2]}${MARK_CLOSE}${m[3]}` : piece
    }
  }
  return out
}

/** The marker a block's first line opens with (a list bullet, a heading's hashes, a quote's angle): kept out of the word diff. */
const LEAD: Partial<Record<BlockKind, RegExp>> = { item: /^([-*+]|\d+[.)])\s+/, heading: /^#{1,6}\s+/, quote: /^>\s?/ }

/** Below this share of a block's words kept, it reads as rewritten: tinted whole rather than marked word by word. */
const REWRITTEN_BELOW = 0.4

/** A table's delimiter row (`|---|:--:|`): a mark in it would stop the table parsing as a table. */
const DELIMITER_ROW = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/
const unmarkDelimiterRows = (s: string) =>
  s
    .split('\n')
    .map((l) => (DELIMITER_ROW.test(l.replace(MARK_ANY, '')) ? l.replace(MARK_ANY, '') : l))
    .join('\n')

const keptShare = (segments: Segment[]) => {
  const all = segments.reduce((n, s) => n + (s.text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0), 0)
  const kept = segments.reduce((n, s) => n + (s.changed ? 0 : (s.text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0)), 0)
  return all ? kept / all : 1
}

/**
 * A list item whose shown marker changed (a bullet turned into a number, a new starting number), as a
 * paragraph led by its marker, marked: a mark inside the marker would stop the line being a list item.
 * A bullet is drawn as one.
 */
function markedMarker(b: Block, segs: Segment[]): string {
  const mark = ITEM_MARK.exec(b.text)?.[1] ?? ''
  return `${MARK_OPEN}${/^\d/.test(mark) ? mark : '•'}${MARK_CLOSE} ${markSegments(segs)}`
}

/**
 * A paired block's two sides, marked where their words differ. `rewritten` when so little was kept
 * that word marks would read as confetti: the sides come back unmarked, to be tinted whole. An edited
 * pair always shows its change: a list item whose shown marker changed has the marker marked, and a
 * pair that would show no mark on either side (a heading's level, a table's alignment row) is tinted whole.
 */
export function markPair(before: Block, after: Block): { before: string; after: string; rewritten: boolean } {
  const lead = (b: Block) => LEAD[b.kind]?.exec(b.text)?.[0] ?? ''
  const la = lead(before)
  const lb = lead(after)
  const d = wordDiff(before.text.slice(la.length), after.text.slice(lb.length))
  const whole = { before: before.text, after: after.text, rewritten: true }
  if (Math.min(keptShare(d.before), keptShare(d.after)) < REWRITTEN_BELOW) return whole
  if (before.kind === 'item' && after.kind === 'item' && markerChanged(before, after)) return { before: markedMarker(before, d.before), after: markedMarker(after, d.after), rewritten: false }
  const marked = (b: Block, lead: string, segs: Segment[]) => {
    const out = lead + markSegments(segs)
    return b.kind === 'table' ? unmarkDelimiterRows(out) : out
  }
  const out = { before: marked(before, la, d.before), after: marked(after, lb, d.after), rewritten: false }
  return out.before.includes(MARK_OPEN) || out.after.includes(MARK_OPEN) ? out : whole
}

/** Where sentences were left out of a marked block: the renderer draws it as a "…" that opens the whole block. */
export const ELLIPSIS = '\uE002'

const FOLDABLE: ReadonlySet<BlockKind> = new Set(['para', 'item', 'quote'])

/**
 * True when a run of Markdown closes everything it opens: no code span, link text, strikethrough
 * or emphasis left open, so a sentence break after it is a safe place to cut. Erring on "open"
 * only folds less.
 */
function closed(md: string): boolean {
  const s = md.replace(/[\uE000-\uE002]/g, '').replace(/\\./g, '')
  const noCode = s.replace(/(`+)[\s\S]*?\1/g, '')
  if (noCode.includes('`')) return false
  const count = (re: RegExp) => noCode.match(re)?.length ?? 0
  // Link text: brackets in pairs. An address has no spaces, so no break falls inside one.
  if (count(/\[/g) !== count(/\]/g)) return false
  // Emphasis by its runs of markers (`**` opens once); an underscore inside a word is not emphasis.
  if (count(/~~+/g) % 2 || count(/\*+/g) % 2) return false
  return count(/(?<![\p{L}\p{N}])_+|_+(?![\p{L}\p{N}])/gu) % 2 === 0
}

/**
 * A marked block cut to the sentences that hold a change (or sit inside one), the runs of
 * unchanged sentences between them replaced by `ELLIPSIS`. Null when nothing would be cut: a short
 * block, or one changed throughout. A list item keeps its bullet. Sentences are cut only where the
 * Markdown before the break is closed, never inside a link, a bold run or a code span. A quote's
 * later lines lose their angle (the fold reads as one paragraph, as Markdown reads it); a quote
 * with a blank line or a nested quote in it is not folded.
 */
export function sentenceFold(marked: string, kind: BlockKind): string | null {
  if (!FOLDABLE.has(kind)) return null
  const lead = LEAD[kind]?.exec(marked)?.[0] ?? ''
  let body = marked.slice(lead.length)
  if (kind === 'quote') {
    const [first = '', ...rest] = body.split('\n')
    if (rest.some((l) => /^\s*>\s*(>|$)/.test(l.replace(MARK_ANY, '')))) return null
    body = [first, ...rest.map((l) => l.replace(/^\s*>\s?/, ''))].join('\n')
  }
  // Split at each sentence break (the breaks kept), then join pieces until the text so far is closed.
  const pieces = body.split(/((?<=[.!?;:])\s+(?=\S))/)
  const parts: string[] = []
  let done = ''
  let cur = ''
  for (let i = 0; i < pieces.length; i += 2) {
    cur += (cur ? pieces[i - 1]! : '') + pieces[i]!
    done += (i ? pieces[i - 1]! : '') + pieces[i]!
    if (closed(done) || i + 2 >= pieces.length) {
      parts.push(cur)
      cur = ''
    }
  }
  if (parts.length < 3) return null
  let open = false
  const keep = parts.map((p) => {
    const inside = open
    for (const ch of p) {
      if (ch === MARK_OPEN) open = true
      else if (ch === MARK_CLOSE) open = false
    }
    return inside || p.includes(MARK_OPEN) || p.includes(MARK_CLOSE)
  })
  if (keep.every(Boolean) || !keep.some(Boolean)) return null
  const out: string[] = []
  parts.forEach((p, i) => {
    if (keep[i]) out.push(p)
    else if (out.at(-1) !== ELLIPSIS) out.push(ELLIPSIS)
  })
  return lead + out.join(' ')
}

/** A run of unchanged rows folded away, keeping the rows so it can open. */
interface Fold {
  fold: Row[]
}

/** Changed rows with `context` unchanged rows either side; longer unchanged runs fold. */
export function foldRows(rows: Row[], context = 1): (Row | Fold)[] {
  const keep = rows.map((r) => r.op !== 'same')
  rows.forEach((r, i) => {
    if (r.op === 'same') return
    for (let k = Math.max(0, i - context); k <= Math.min(rows.length - 1, i + context); k++) keep[k] = true
  })
  const out: (Row | Fold)[] = []
  rows.forEach((r, i) => {
    if (keep[i]) out.push(r)
    else {
      const last = out.at(-1)
      if (last && 'fold' in last) last.fold.push(r)
      else out.push({ fold: [r] })
    }
  })
  return out
}


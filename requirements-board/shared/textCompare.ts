/**
 * The comparison primitives the history rows and the Diff review share: one longest common
 * subsequence, and one rule for text that differs only in its spacing.
 */

type Pair = [number, number]

/**
 * The table's longest common subsequence of `x[xs..xe)` and `y[ys..ye)`, as index pairs in order. On a
 * tie the backtrack takes from `x` first, so a removal is listed before the addition beside it.
 */
function table<T>(x: readonly T[], xs: number, xe: number, y: readonly T[], ys: number, ye: number, eq: (a: T, b: T) => boolean, out: Pair[]) {
  const n = xe - xs
  const m = ye - ys
  if (!n || !m) return
  const w = m + 1
  // t[i * w + j]: the longest common run of x[xs + i..] and y[ys + j..].
  const t = new Uint32Array((n + 1) * w)
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) t[i * w + j] = eq(x[xs + i]!, y[ys + j]!) ? t[(i + 1) * w + j + 1]! + 1 : Math.max(t[(i + 1) * w + j]!, t[i * w + j + 1]!)
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (eq(x[xs + i]!, y[ys + j]!)) out.push([xs + i++, ys + j++])
    else if (t[(i + 1) * w + j]! >= t[i * w + j + 1]!) i++
    else j++
  }
}

/**
 * Pairs of values that occur exactly once in `x[xs..xe)` and once in `y[ys..ye)`, the longest run of
 * them in order on both sides (patience sorting): the anchors a comparison too big for the table is
 * cut at. Values are matched as they are (`===`), each pair confirmed by `eq`.
 */
function anchors<T>(x: readonly T[], xs: number, xe: number, y: readonly T[], ys: number, ye: number, eq: (a: T, b: T) => boolean): Pair[] {
  const once = (list: readonly T[], s: number, e: number) => {
    const at = new Map<T, number>()
    for (let k = s; k < e; k++) at.set(list[k]!, at.has(list[k]!) ? -1 : k)
    return at
  }
  const inX = once(x, xs, xe)
  const inY = once(y, ys, ye)
  const cands: Pair[] = []
  for (let k = xs; k < xe; k++) {
    const j = inY.get(x[k]!)
    if (inX.get(x[k]!) === k && j != null && j >= 0 && eq(x[k]!, y[j]!)) cands.push([k, j])
  }
  // Longest increasing run of the y indexes (x indexes already increase).
  const tails: number[] = []
  const back = new Int32Array(cands.length)
  for (let c = 0; c < cands.length; c++) {
    let lo = 0
    let hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cands[tails[mid]!]![1] < cands[c]![1]) lo = mid + 1
      else hi = mid
    }
    back[c] = lo ? tails[lo - 1]! : -1
    tails[lo] = c
  }
  const out: Pair[] = []
  for (let c = tails.length ? tails[tails.length - 1]! : -1; c >= 0; c = back[c]!) out.push(cands[c]!)
  return out.reverse()
}

/** Compare `x[xs..xe)` with `y[ys..ye)`, the ends already unequal: the table when it fits, else cut at anchors. */
function middle<T>(x: readonly T[], xs: number, xe: number, y: readonly T[], ys: number, ye: number, eq: (a: T, b: T) => boolean, maxCells: number, out: Pair[]) {
  // Equal ends first: an anchor's gap starts and ends anywhere.
  while (xs < xe && ys < ye && eq(x[xs]!, y[ys]!)) out.push([xs++, ys++])
  const tail: Pair[] = []
  while (xs < xe && ys < ye && eq(x[xe - 1]!, y[ye - 1]!)) tail.push([--xe, --ye])
  if ((xe - xs) * (ye - ys) <= maxCells) table(x, xs, xe, y, ys, ye, eq, out)
  else {
    let i = xs
    let j = ys
    // Nothing unique in common: everything in between removed, then added.
    for (const [ai, aj] of anchors(x, xs, xe, y, ys, ye, eq)) {
      middle(x, i, ai, y, j, aj, eq, maxCells, out)
      out.push([ai, aj])
      i = ai + 1
      j = aj + 1
    }
    if (i > xs || j > ys) middle(x, i, xe, y, j, ye, eq, maxCells, out)
  }
  for (let k = tail.length - 1; k >= 0; k--) out.push(tail[k]!)
}

/**
 * Longest common subsequence of two lists, as index pairs in order. On a tie the backtrack takes from
 * `x` first, so a removal is listed before the addition beside it. When the table would be bigger
 * than `maxCells`, only the part between the common start and end is compared, and when that is still
 * too big it is cut at values found once on each side (each part between compared the same way), so a
 * long text with a small change still pairs everything else; where nothing is found, that part reads as
 * everything removed, then everything added. Any input whose table fits gives exactly the full table's
 * answer.
 */
export function lcsPairs<T>(x: readonly T[], y: readonly T[], eq: (a: T, b: T) => boolean, maxCells = 1_000_000): Pair[] {
  const out: Pair[] = []
  // A common start is what the full table's backtrack takes too (it takes an equal pair at once).
  let s = 0
  while (s < x.length && s < y.length && eq(x[s]!, y[s]!)) out.push([s, s++])
  if ((x.length - s) * (y.length - s) <= maxCells) table(x, s, x.length, y, s, y.length, eq, out)
  else middle(x, s, x.length, y, s, y.length, eq, maxCells, out)
  return out
}

/** Text with every run of whitespace one space, trimmed: two texts that squash the same differ only in spacing. */
export const squashSpace = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim()

/**
 * The comparison primitives the history rows and the Diff review share: one longest common
 * subsequence, and one rule for text that differs only in its spacing.
 */

/**
 * Longest common subsequence of two lists, as index pairs in order; null when the table would be
 * bigger than `maxCells` (the caller then shows everything removed, then everything added). On a
 * tie the backtrack takes from `x` first, so a removal is listed before the addition beside it.
 */
export function lcsPairs<T>(x: readonly T[], y: readonly T[], eq: (a: T, b: T) => boolean, maxCells = 1_000_000): [number, number][] | null {
  if (x.length * y.length > maxCells) return null
  const w = y.length + 1
  // t[i * w + j]: the longest common run of x[i..] and y[j..].
  const t = new Uint32Array((x.length + 1) * w)
  for (let i = x.length - 1; i >= 0; i--)
    for (let j = y.length - 1; j >= 0; j--) t[i * w + j] = eq(x[i]!, y[j]!) ? t[(i + 1) * w + j + 1]! + 1 : Math.max(t[(i + 1) * w + j]!, t[i * w + j + 1]!)
  const out: [number, number][] = []
  let i = 0
  let j = 0
  while (i < x.length && j < y.length) {
    if (eq(x[i]!, y[j]!)) out.push([i++, j++])
    else if (t[(i + 1) * w + j]! >= t[i * w + j + 1]!) i++
    else j++
  }
  return out
}

/** Text with every run of whitespace one space, trimmed: two texts that squash the same differ only in spacing. */
export const squashSpace = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim()

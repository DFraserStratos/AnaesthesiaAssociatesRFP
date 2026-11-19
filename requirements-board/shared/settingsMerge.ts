/**
 * "Keep mine" for a Settings section that changed on disk while it was being edited (B06, R-45): a
 * three-way merge of what the section was when editing started (`base`), the user's edit (`mine`) and
 * the file now (`theirs`). Rows are matched by identity (a status by its code, a component by its name);
 * within a row, each field the user changed keeps the user's value and every other field takes the
 * file's. Rows added on disk are kept, in their place; rows removed on disk stay removed; rows the user
 * removed stay removed. A field both sides changed, to different values, keeps the user's and is named.
 */
import { sameValue } from './patch.ts'
import { nextStatusCode, type StatusDef } from './statuses.ts'

type Row = object

/** Field by field: the user's changes over the file's. `clashes` names the fields both changed. */
export function mergeFields<T extends Row>(base: T, mine: T, theirs: T): { merged: T; clashes: string[] } {
  const b = base as Record<string, unknown>
  const m = mine as Record<string, unknown>
  const t = theirs as Record<string, unknown>
  const out: Record<string, unknown> = {}
  const clashes: string[] = []
  // Keys in the file's order, then any the user added.
  for (const k of new Set([...Object.keys(t), ...Object.keys(m), ...Object.keys(b)])) {
    const mineChanged = !sameValue(b[k], m[k])
    const theirsChanged = !sameValue(b[k], t[k])
    if (mineChanged && theirsChanged && !sameValue(m[k], t[k])) clashes.push(k)
    const v = mineChanged ? m[k] : t[k]
    if (v !== undefined) out[k] = v
  }
  return { merged: out as T, clashes }
}

export interface RowMerge<T> {
  rows: T[]
  /** Rows (by key) where both sides changed the same field: the user's value was kept. */
  clashes: string[]
  /** Rows (by key) the user edited that were removed on disk: they stay removed. */
  removedOnDisk: string[]
}

/** Row by row (see the module comment). The result follows the user's order, with rows added on disk after the row they follow on disk. */
export function mergeRows<T extends Row>(base: readonly T[], mine: readonly T[], theirs: readonly T[], keyOf: (r: T) => string): RowMerge<T> {
  const baseBy = new Map(base.map((r) => [keyOf(r), r]))
  const theirsBy = new Map(theirs.map((r) => [keyOf(r), r]))
  const mineKeys = new Set(mine.map(keyOf))
  const rows: T[] = []
  const clashes: string[] = []
  const removedOnDisk: string[] = []
  for (const r of mine) {
    const k = keyOf(r)
    const was = baseBy.get(k)
    const now = theirsBy.get(k)
    if (!was) {
      rows.push(r) // the user's new row (a new row the file also gained under the same key: the user's wins)
      continue
    }
    if (!now) {
      if (!sameValue(was, r)) removedOnDisk.push(k)
      continue
    }
    const { merged, clashes: c } = mergeFields(was, r, now)
    if (c.length) clashes.push(k)
    rows.push(merged)
  }
  // Rows the file gained, each placed after the row it follows in the file (or first).
  theirs.forEach((r, i) => {
    const k = keyOf(r)
    if (baseBy.has(k) || mineKeys.has(k)) return
    let at = 0
    for (let j = i - 1; j >= 0; j--) {
      const prev = rows.findIndex((x) => keyOf(x) === keyOf(theirs[j]!))
      if (prev >= 0) {
        at = prev + 1
        break
      }
    }
    rows.splice(at, 0, r)
  })
  return { rows, clashes, removedOnDisk }
}

/**
 * Keep mine for a status list, row by row by code. A status the user added whose code the file has since
 * given to another status takes the next free code, past every code the file lists, the user's rows, the
 * list's spent codes (its high-water mark) and the codes records hold (`spent`), so two statuses never
 * share a code and none is reissued (B02's allocation rule, accepted decision 16). `renumbered` maps each
 * moved code to its new one.
 */
export function mergeStatusLists(base: readonly StatusDef[], mine: readonly StatusDef[], theirs: readonly StatusDef[], spent: Iterable<string>): RowMerge<StatusDef> & { renumbered: Record<string, string> } {
  const baseCodes = new Set(base.map((d) => d.code))
  const theirsCodes = new Set(theirs.map((d) => d.code))
  const taken = [...theirsCodes, ...mine.map((d) => d.code)]
  const spentCodes = [...spent]
  const renumbered: Record<string, string> = {}
  const own = mine.map((d) => {
    if (baseCodes.has(d.code) || !theirsCodes.has(d.code)) return d
    const code = nextStatusCode(taken, spentCodes)
    taken.push(code)
    renumbered[d.code] = code
    return { ...d, code }
  })
  return { ...mergeRows(base, own, theirs, (d) => d.code), renumbered }
}

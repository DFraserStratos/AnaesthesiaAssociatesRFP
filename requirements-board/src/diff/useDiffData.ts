/**
 * The Diff review's data: the commit list and the comparison asked for (the URL's `from..to`, or the
 * default from `/api/diff/auto`), read side by side. One read at a time, a refresh asked for meanwhile
 * run once after it; an answer that reads the same as the last changes nothing, and a record that
 * reads the same keeps its entry, so its card (memoised) is not drawn again. While To is what is on
 * disk, it refreshes as records change and when the window comes back into focus.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { WORKTREE, type CommitsResponse, type DiffResponse } from '../../shared/diff.ts'
import { canonicalRef, entriesOf, hash, type Entry } from '../../shared/diffModel.ts'
import { api } from '../api.ts'
import { useCatalogueRefresh } from '../useCatalogueRefresh.ts'

export interface Loaded {
  /** The request it answers: `auto`, or the URL's `from..to`. */
  key: string
  /** As the server sent it, its refs named as the commit list names them (`canonicalRef`). */
  res: DiffResponse
  entries: Entry[]
  /** Nothing was uncommitted, so the default fell back to what the last commit changed. */
  jumped: boolean
  /** The whole response, hashed: a refresh that brings back the same answer changes nothing. */
  sig: string
}

/** The comparison a load holds, `from..to` as the commit list names them: the Viewed ticks' key. */
export const comparisonOf = (d: Loaded | null) => (d ? `${d.res.from}..${d.res.to}` : '')

/** The last comparison loaded, kept across leaving the tab and coming back: drawn at once, then refreshed. */
let kept: { key: string; commits: CommitsResponse; data: Loaded | null } | null = null

/**
 * `from` and `to` as in the URL (both null for the default). `onNewComparison` runs when a load
 * brings a different comparison from the one on the page (not the first).
 */
export function useDiffData(from: string | null, to: string | null, onNewComparison: () => void) {
  const auto = !from || !to
  const key = auto ? 'auto' : `${from}..${to}`
  const [initial] = useState(() => (kept?.key === key ? kept : null))
  const [commits, setCommits] = useState<CommitsResponse | null>(initial?.commits ?? null)
  const [data, setData] = useState<Loaded | null>(initial?.data ?? null)
  // An error belongs to the request that raised it: another comparison picked never shows it (R-94).
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null)
  // Picking another comparison drops the error, so coming back never shows it before a new read fails.
  if (failed && failed.key !== key) setFailed(null)
  const seq = useRef(0)
  const commitsRef = useRef(commits)
  const dataRef = useRef(data)
  const onNew = useRef(onNewComparison)
  onNew.current = onNewComparison

  const load = useCallback(async () => {
    const n = ++seq.current
    try {
      // The commit list and the comparison side by side: the server picks the default's From
      // (HEAD, or with nothing uncommitted the last catalogue commit's first parent).
      const [c, raw] = await Promise.all([api.diffCommits(), auto ? api.diffAuto() : api.diff(from!, to!)])
      if (n !== seq.current) return
      if (JSON.stringify(c) !== JSON.stringify(commitsRef.current)) {
        commitsRef.current = c
        setCommits(c)
      }
      setFailed(null)
      if (!c.available || !raw.available) {
        kept = { key, commits: c, data: null }
        dataRef.current = null
        return setData(null)
      }
      const jumped = !!raw.jumped
      const res: DiffResponse = { ...raw, from: canonicalRef(raw.from, c), to: raw.to === WORKTREE ? raw.to : canonicalRef(raw.to, c) }
      const sig = `${key}|${jumped ? 'j' : ''}${res.from}..${res.to}|${hash(JSON.stringify(raw))}`
      const prev = dataRef.current
      if (prev?.sig === sig) {
        kept = { key, commits: c, data: prev }
        return
      }
      const before = new Map(prev?.entries.map((e) => [e.key, e]))
      const entries = entriesOf(res).map((e) => {
        const old = before.get(e.key)
        return old && old.fingerprint === e.fingerprint && JSON.stringify(old.rec) === JSON.stringify(e.rec) ? old : e
      })
      const next: Loaded = { key, res, entries, jumped, sig }
      kept = { key, commits: c, data: next }
      if (prev && comparisonOf(next) !== comparisonOf(prev)) onNew.current()
      dataRef.current = next
      setData(next)
    } catch (e) {
      if (n === seq.current) setFailed({ key, message: (e as Error).message })
    }
  }, [auto, from, to, key])

  // One load at a time: a refresh asked for while one runs runs once more after it.
  const running = useRef<Promise<void> | null>(null)
  const again = useRef(false)
  const run = useRef(() => {})
  run.current = () => {
    if (running.current) {
      again.current = true
      return
    }
    const p = load().finally(() => {
      if (running.current !== p) return
      running.current = null
      if (again.current) {
        again.current = false
        run.current()
      }
    })
    running.current = p
  }
  useEffect(() => {
    running.current = null
    again.current = false
    run.current()
  }, [load])
  useCatalogueRefresh(() => run.current(), auto || to === WORKTREE)

  /** Picked, and still being read: the old comparison stays up, dimmed, until the new one comes. */
  const stale = !!data && data.key !== key
  const error = failed?.key === key ? failed.message : null
  return { auto, commits, data, error, stale }
}

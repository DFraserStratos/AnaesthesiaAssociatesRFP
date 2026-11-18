/**
 * The Diff review's Viewed ticks: per browser, per comparison, each with the fingerprint the record
 * had when ticked, so a tick clears itself when the record changes again. The last few comparisons
 * are kept.
 */
import { useCallback, useRef, useState } from 'react'
import type { Entry } from '../../shared/diffModel.ts'
import { isRecord, isString, readJson, writeJson, type Coerce } from '../storage.ts'

const VIEWED_KEY = 'requirements-board:diff-viewed'
const KEEP_COMPARISONS = 20

/** Ticked records by key, with the fingerprint each had when ticked. */
export type Viewed = Record<string, string>

/** Comparisons by key, each an object of fingerprints; anything else is no ticks (FINDINGS R-51). */
const viewedShape: Coerce<Record<string, Viewed>> = (raw, bad) => {
  if (!isRecord(raw)) {
    bad()
    return {}
  }
  const out: Record<string, Viewed> = {}
  for (const [comparison, ticks] of Object.entries(raw)) {
    if (!isRecord(ticks)) {
      bad()
      continue
    }
    const viewed: Viewed = {}
    for (const [key, fp] of Object.entries(ticks)) {
      if (isString(fp)) viewed[key] = fp
      else bad()
    }
    out[comparison] = viewed
  }
  return out
}

const readStore = () => readJson(VIEWED_KEY, "Diff review's Viewed ticks", {}, viewedShape)

const readViewed = (comparison: string): Viewed => (comparison ? (readStore()[comparison] ?? {}) : {})

/** Save one comparison's ticks; a damaged stored value is replaced, so the repair sticks. A blocked store keeps them until the page closes. */
function writeViewed(comparison: string, viewed: Viewed) {
  const store = readStore()
  delete store[comparison]
  store[comparison] = viewed
  const keys = Object.keys(store)
  for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_COMPARISONS))) delete store[k]
  writeJson(VIEWED_KEY, store)
}

/** Ticked, and not changed since. */
export const isViewed = (viewed: Viewed, e: Entry) => viewed[e.key] === e.fingerprint

/**
 * The ticks of one comparison (`from..to`, '' for none yet). A new comparison reads its own ticks in
 * the same render, so its cards never draw first with the old ones. `set` is stable; `now()` reads
 * the ticks as they are after a `set` in the same event (for v, which ticks and moves on).
 */
export function useViewed(comparison: string) {
  const [state, setState] = useState(() => ({ comparison, viewed: readViewed(comparison) }))
  let current = state
  if (state.comparison !== comparison) {
    current = { comparison, viewed: readViewed(comparison) }
    setState(current)
  }
  const ref = useRef(current)
  ref.current = current
  const set = useCallback((e: Entry, on: boolean) => {
    const { comparison: c, viewed } = ref.current
    const next = { ...viewed }
    if (on) next[e.key] = e.fingerprint
    else delete next[e.key]
    ref.current = { comparison: c, viewed: next }
    setState(ref.current)
    if (c) writeViewed(c, next)
  }, [])
  const now = useCallback(() => ref.current.viewed, [])
  return { viewed: current.viewed, set, now }
}

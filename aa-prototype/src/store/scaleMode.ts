/**
 * Scale mode (catch-up Phase 43; US-15.0.4): whether the full-scale data is
 * loaded, what it holds and how long things took. A tiny zustand store of its
 * own, never persisted and never part of `AppState` (like Phase 14's demo
 * memory), so a timing can never reach domain state or the saved payload.
 * Reset clears it (`resetDomainState`).
 *
 * `performance.now()` lives here and in `src/shared/scale/` only: everything
 * else measures through `timed()`. Timings never change what is generated.
 */

import { create } from 'zustand'
import type { FullScaleCounts } from '../domain/seed/fullScale'

export type ScaleModeName = 'demo' | 'generating' | 'fullScale'
export type ScaleSampleMode = 'demo' | 'fullScale'

/** A screen's last render samples at each scale (ms; render and commit, then paint). */
export interface ScreenSamples {
  demo: number[]
  fullScale: number[]
  demoPaint: number[]
  fullScalePaint: number[]
}

export interface ScaleModeState {
  mode: ScaleModeName
  counts: FullScaleCounts | null
  /** The horizon the set was generated across (months), for the banner. */
  horizonMonths: number | null
  generateMs: number | null
  installMs: number | null
  firstPaintMs: number | null
  /** Shown by the banner when generation failed (the app is back on the demo data). */
  error: string | null
  samples: Record<string, ScreenSamples>
}

/** How many samples a screen keeps per scale (the banner shows their median). */
export const SAMPLES_KEPT = 5

function initial(): ScaleModeState {
  return { mode: 'demo', counts: null, horizonMonths: null, generateMs: null, installMs: null, firstPaintMs: null, error: null, samples: {} }
}

interface ScaleModeStore extends ScaleModeState {
  /** The one writer (the helpers below call it): a merge into the scale state. */
  patch: (patch: Partial<ScaleModeState>) => void
}

export const useScaleMode = create<ScaleModeStore>()((set) => ({ ...initial(), patch: (patch) => set(patch) }))

/** The current scale (a plain read for store code and tests). */
export function scaleMode(): ScaleModeState {
  return useScaleMode.getState()
}

/** Patch the scale state (the load flow and the banner's readers only). */
export function setScaleMode(patch: Partial<ScaleModeState>): void {
  useScaleMode.getState().patch(patch)
}

/**
 * Back to the demo data (called by `resetDomainState`): the mode, counts and
 * full-scale timings clear; the demo-scale samples are kept so the Timings
 * table still has its baseline column.
 */
export function clearScaleMode(): void {
  const { samples } = useScaleMode.getState()
  const kept: Record<string, ScreenSamples> = {}
  for (const [key, s] of Object.entries(samples)) kept[key] = { demo: s.demo, fullScale: [], demoPaint: s.demoPaint, fullScalePaint: [] }
  useScaleMode.getState().patch({ ...initial(), samples: kept })
}

/** The one clock for measuring (never for data). */
export function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : 0
}

/** Run `fn` and say how long it took, in ms. */
export function timed<T>(fn: () => T): { result: T; ms: number } {
  const start = nowMs()
  const result = fn()
  return { result, ms: nowMs() - start }
}

/** Record one render (or paint) sample for a screen at the current scale. */
export function recordScreenSample(key: string, ms: number, kind: 'render' | 'paint' = 'render'): void {
  const state = useScaleMode.getState()
  if (state.mode === 'generating') return
  const at: ScaleSampleMode = state.mode === 'fullScale' ? 'fullScale' : 'demo'
  const prev = state.samples[key] ?? { demo: [], fullScale: [], demoPaint: [], fullScalePaint: [] }
  const field = kind === 'render' ? at : at === 'demo' ? 'demoPaint' : 'fullScalePaint'
  const next: ScreenSamples = { ...prev, [field]: [...prev[field], Math.round(ms * 10) / 10].slice(-SAMPLES_KEPT) }
  state.patch({ samples: { ...state.samples, [key]: next } })
}

/** The median of a sample set (undefined when empty). */
export function medianOf(values: readonly number[]): number | undefined {
  if (values.length === 0) return undefined
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) * 10) / 10
}

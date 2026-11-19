/**
 * Loading the full-scale data (catch-up Phase 43; US-15.0.4).
 *
 * `loadFullScaleData` answers at once, like every demo trigger's `run`, and
 * does the work after one frame (so the "Generating" banner paints first):
 * Reset to the pristine seed, import the generator on demand (code-split: the
 * main chunk and the PWA never carry it until used), build the dataset, pause
 * saving, drop the saved payload (so a reload returns the pristine seed, never a
 * half state), install the dataset in one wholesale replace and record the
 * timings in `scaleMode`. Reset, a scenario jump or the PWA reset leave full
 * scale through `resetDomainState`, which resumes saving first.
 */

import type { AppStoreApi } from './appStore'
import { PERSIST_KEY } from './appStore'
import { installDomainState, ok, refuse, resetDomainState, type DomainState, type Outcome } from './mutate'
import { pausePersist, resilientLocalStorage } from './persistStorage'
import { nowMs, scaleMode, setScaleMode, timed } from './scaleMode'

/** Why saving is paused while the full-scale data is loaded (the Data Inspector says it). */
export const FULL_SCALE_PAUSE_REASON = 'Full-scale data is held in memory only'

export const FULL_SCALE_GENERATING_MESSAGE = 'Generating'
export const FULL_SCALE_LOADED_MESSAGE = 'Full-scale data is loaded. Reset returns to the demo data.'

/** Waits one frame (injected so Vitest does not depend on requestAnimationFrame). */
export type FrameScheduler = (callback: () => void) => void

export const animationFrame: FrameScheduler = (callback) => {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => callback())
  else setTimeout(callback, 0)
}

export interface LoadFullScaleOptions {
  frame?: FrameScheduler
  /** Called when the load has finished (or failed): tests await it. */
  onDone?: () => void
  /** Reports a failure (the diagnostics log, catch-up Phase 43 work item 12). */
  report?: (message: string, context?: Record<string, unknown>) => void
}

/** Why the load is refused now, or null. */
export function loadFullScaleRefusal(): string | null {
  const { mode } = scaleMode()
  if (mode === 'generating') return FULL_SCALE_GENERATING_MESSAGE
  if (mode === 'fullScale') return FULL_SCALE_LOADED_MESSAGE
  return null
}

export function loadFullScaleData(api: AppStoreApi, options: LoadFullScaleOptions = {}): Outcome {
  const refusal = loadFullScaleRefusal()
  if (refusal !== null) return refuse(scaleMode().mode === 'generating' ? 'generating' : 'alreadyLoaded', refusal)
  const frame = options.frame ?? animationFrame
  setScaleMode({ mode: 'generating', error: null })
  frame(() => {
    void run(api, frame, options)
  })
  return ok(undefined)
}

async function run(api: AppStoreApi, frame: FrameScheduler, options: LoadFullScaleOptions): Promise<void> {
  try {
    // On top of the untouched pristine seed (and saving resumed by the reset, so the pristine seed is what was last written).
    resetDomainState(api)
    setScaleMode({ mode: 'generating' })
    const { buildFullScaleDataset } = await import('../domain/seed/fullScale')
    const base = api.getState()
    const generatedAt = timed(() => buildFullScaleDataset(base, { todayISO: base.clock.todayISO }))
    pausePersist(FULL_SCALE_PAUSE_REASON)
    resilientLocalStorage.removeItem(PERSIST_KEY)
    const installed = timed(() => installDomainState(api, generatedAt.result.state as DomainState))
    setScaleMode({
      mode: 'fullScale',
      counts: generatedAt.result.counts,
      horizonMonths: base.appSettings.schedule.horizonMonths,
      generateMs: Math.round(generatedAt.ms),
      installMs: Math.round(installed.ms),
      error: null,
    })
    // First paint: two frames after the install.
    const paintStart = nowMs()
    frame(() =>
      frame(() => {
        setScaleMode({ firstPaintMs: Math.round(nowMs() - paintStart) })
        options.onDone?.()
      }),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    options.report?.(`Full-scale data could not be generated: ${message}`)
    resetDomainState(api)
    setScaleMode({ mode: 'demo', error: `Full-scale data could not be generated: ${message}` })
    options.onDone?.()
  }
}

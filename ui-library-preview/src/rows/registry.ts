import type { ComponentType } from 'react'
import type { AppId } from '../kit/verdicts'
import slicesJson from '../../slices.json'

/**
 * One library replacement for one catalogue row. Slices never edit this file:
 * each slice exports `replacements` from `src/rows/<app>/<slice>/index.ts`,
 * keyed by the row's exact `name` as it appears in the prototype catalogue,
 * and the glob below merges them.
 */
/**
 * A live alternative for a design tweak the library leaves open (corner X or
 * not, toast tinted or neutral, ...). The row shows option pills above the
 * replacement stage; the viewer switches between them for real, and the
 * selected one is exported as the row's preferred option.
 */
export interface ReplacementOption {
  /** Short, plain label shown on the pill, e.g. "No corner X (as today)". */
  label: string
  Component: ComponentType
  /** One line on what differs in this option (shown under the pills). */
  note?: string
}

export interface Replacement {
  /** The live, interactive rebuild. Local state only; never writes to the prototype store. */
  Component?: ComponentType
  /**
   * Alternatives for an open design tweak. When present, they replace
   * `Component`; list the option closest to today's prototype FIRST.
   */
  options?: ReplacementOption[]
  /** The library component(s) actually used, e.g. "shadcn Dialog (Base UI Dialog)". */
  library: string
  /** What the replacement gains or loses, one short item each: "Adds focus trap and Escape". */
  changes: string[]
  /**
   * built: a full rebuild. partial: the representative part only (say what was
   * left out in `changes`). custom: no library replacement, stays custom
   * (give `customReason`; `Component` optional, e.g. the custom piece rebuilt
   * on library primitives).
   */
  status: 'built' | 'partial' | 'custom'
  customReason?: string
}

export type SliceReplacements = Record<string, Replacement>

/*
 * Slices load one by one (lazy glob + catch), so a slice whose code breaks,
 * e.g. because the prototype it imports from changed under it, fails ALONE:
 * its rows show the error, every other row still renders.
 */
const loaders = import.meta.glob<{ replacements: SliceReplacements }>(['./*/*/index.ts', './*/*/index.tsx'])
const SLICE_ROWS = slicesJson as unknown as { app: AppId; id: string; rows: string[] }[]

const REGISTRY: Record<AppId, SliceReplacements> = { admin: {}, web: {}, mobile: {} }
const FAILED: Record<AppId, Record<string, string>> = { admin: {}, web: {}, mobile: {} }

/** Called once before the first render (main.tsx). */
export async function loadRegistry() {
  await Promise.all(
    Object.entries(loaders).map(async ([path, load]) => {
      const [, app, slice] = path.split('/') as [string, AppId, string]
      if (!(app in REGISTRY)) return
      try {
        const mod = await load()
        for (const [name, rep] of Object.entries(mod.replacements ?? {})) {
          if (REGISTRY[app][name]) console.warn(`[registry] duplicate replacement for ${app}:${name} (${path})`)
          REGISTRY[app][name] = rep
        }
      } catch (err) {
        const msg = `Slice ${app}/${slice} failed to load: ${err instanceof Error ? err.message : String(err)}`
        console.error(`[registry] ${msg}`)
        for (const name of SLICE_ROWS.find((x) => x.app === app && x.id === slice)?.rows ?? []) FAILED[app][name] = msg
      }
    }),
  )
}

export function getLoadFailure(app: AppId, name: string): string | undefined {
  return FAILED[app][name]
}

export function getReplacement(app: AppId, name: string): Replacement | undefined {
  return REGISTRY[app][name]
}

export function registryCounts(app: AppId) {
  const c = { built: 0, partial: 0, custom: 0 }
  Object.values(REGISTRY[app]).forEach((r) => c[r.status]++)
  return c
}

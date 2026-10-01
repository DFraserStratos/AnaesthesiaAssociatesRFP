import { matchPath } from 'react-router-dom'
import type { AppState } from '../../store'
import type { DemoContextValues } from './context'
import { DEMO_TRIGGERS } from './registry'
import type { DemoTrigger, DemoTriggerCtx, DemoTriggerSurface } from './types'

export interface MatchedDemoTrigger {
  trigger: DemoTrigger
  ctx: DemoTriggerCtx
}

/** The first route pattern of `trigger` that matches `pathname`, as its params. */
function matchRoutes(trigger: DemoTrigger, pathname: string): Record<string, string> | null {
  for (const pattern of trigger.routes) {
    const m = matchPath({ path: pattern, end: true }, pathname)
    if (m !== null) {
      const params: Record<string, string> = {}
      for (const [k, v] of Object.entries(m.params)) if (v !== undefined) params[k] = v
      return params
    }
  }
  return null
}

/**
 * The entries visible on `pathname` for `surface`, in registry order, each with
 * its resolved context. Pure: the bar menu, the PWA sheet and the tests all
 * read this.
 */
export function demoTriggersFor(
  state: AppState,
  pathname: string,
  surface: DemoTriggerSurface,
  published: Readonly<Partial<DemoContextValues>> = {},
  triggers: readonly DemoTrigger[] = DEMO_TRIGGERS,
): MatchedDemoTrigger[] {
  const out: MatchedDemoTrigger[] = []
  for (const trigger of triggers) {
    if (!trigger.surfaces.includes(surface)) continue
    const params = matchRoutes(trigger, pathname)
    if (params === null) continue
    const ctx: DemoTriggerCtx = { pathname, params, published }
    if (trigger.when !== undefined && !trigger.when(state, ctx)) continue
    out.push({ trigger, ctx })
  }
  return out
}

/** The choice a row starts on: the entry's default if offered, else the first. */
export function initialChoice(trigger: DemoTrigger, state: AppState, ctx: DemoTriggerCtx): string | undefined {
  const choices = trigger.choices?.(state, ctx)
  if (choices === undefined || choices.length === 0) return undefined
  const preferred = trigger.defaultChoice?.(state, ctx)
  return choices.some((c) => c.id === preferred) ? preferred : choices[0]?.id
}

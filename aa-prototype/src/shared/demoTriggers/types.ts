import type { AppState, AppStoreApi } from '../../store'
import type { DemoContextValues } from './context'

/**
 * The demo-trigger registry's contract (catch-up Phase 14). Every later phase
 * registers its demo actions as `DemoTrigger` entries in `registry.ts`; none
 * adds a button to the Control Panel page.
 */

/** Where an entry shows: the framed build's harness bar, the installed PWA's Demo sheet, or both. */
export type DemoTriggerSurface = 'bar' | 'pwa'

/** What a trigger knows about the screen it was fired from. */
export interface DemoTriggerCtx {
  pathname: string
  /** Params from the route pattern that matched, e.g. `listId`, `invoiceId`. */
  params: Readonly<Record<string, string>>
  /** Screen state the URL cannot carry, published through `useDemoTriggerContext`. */
  published: Readonly<Partial<DemoContextValues>>
}

export interface DemoTriggerChoice {
  id: string
  label: string
}

export interface DemoTriggerResult {
  ok: boolean
  message: string
}

export interface DemoTrigger {
  /** Stable, kebab-case; also the `data-shot="demo-action-<id>"` suffix. */
  id: string
  /** Button text. No en or em dashes. */
  label: string
  /** One line: what it will do, stated before firing. */
  description: string
  /** The Control Panel index heading, e.g. 'Admin · Billing monitor'. */
  screen: string
  /** react-router `matchPath` patterns, matched against the full pathname. */
  routes: readonly string[]
  surfaces: readonly DemoTriggerSurface[]
  badge?: 'future-scope' | 'office-stand-in'
  /** Visibility on a matched route (a seed-scoped entry gates itself here). */
  when?: (state: AppState, ctx: DemoTriggerCtx) => boolean
  /** Options the presenter picks between before running. */
  choices?: (state: AppState, ctx: DemoTriggerCtx) => readonly DemoTriggerChoice[]
  /** The preselected choice; the first choice when absent or not offered. */
  defaultChoice?: (state: AppState, ctx: DemoTriggerCtx) => string | undefined
  /** Null when it can run; otherwise the reason shown under the disabled Run. */
  disabledReason: (state: AppState, ctx: DemoTriggerCtx, choiceId?: string) => string | null
  run: (api: AppStoreApi, ctx: DemoTriggerCtx, choiceId?: string) => DemoTriggerResult
  /** Where the Control Panel's "Open screen" goes; null when there is nowhere yet. */
  indexPath: (state: AppState) => string | null
  /** Shown instead of "Open screen" when `indexPath` is null. */
  indexEmptyReason?: string
  /** Shown beside "Open screen" when the entry needs a step the URL cannot carry. */
  indexHint?: string
}

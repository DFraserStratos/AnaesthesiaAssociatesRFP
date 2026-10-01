import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore, type AppState } from '../../store'
import { useDemoTriggerPublished } from './context'
import { demoTriggersFor, initialChoice, type MatchedDemoTrigger } from './match'
import { useDemoTriggerMemory } from './memory'
import type { DemoTriggerChoice, DemoTriggerResult, DemoTriggerSurface } from './types'

/**
 * The entries for the current route and `surface`, with the state they were
 * evaluated against, re-evaluated live on every render: the subscriptions
 * below re-render on a route change, a store change (so `when` and
 * `disabledReason` follow a run or a reset), a published-context change and a
 * trigger-memory change (read inside the replay entries).
 */
export function useDemoTriggers(surface: DemoTriggerSurface): { state: AppState; entries: MatchedDemoTrigger[] } {
  const { pathname } = useLocation()
  const state = useAppStore()
  const published = useDemoTriggerPublished()
  useDemoTriggerMemory()
  return { state, entries: demoTriggersFor(state, pathname, surface, published) }
}

/** One row of a demo-actions surface, ready to render. */
export interface DemoTriggerRow extends MatchedDemoTrigger {
  options: readonly DemoTriggerChoice[]
  chosen: string | undefined
  /** Null when Run is enabled. */
  reason: string | null
  result: DemoTriggerResult | undefined
  choose: (choiceId: string) => void
  run: () => void
}

/**
 * The shared behaviour of the harness bar's menu and the PWA's Demo sheet, so
 * the two surfaces only render: per-row choice and result state (reset when
 * the route changes), the default choice, the disabled reason and Run.
 */
export function useDemoTriggerRows(surface: DemoTriggerSurface): DemoTriggerRow[] {
  const { pathname } = useLocation()
  const { state, entries } = useDemoTriggers(surface)
  const [choices, setChoices] = useState<Record<string, string>>({})
  // Results are keyed by pathname as well as id, so a result line from one
  // invoice never shows, even for a frame, on the next invoice's same entry.
  const [results, setResults] = useState<Record<string, DemoTriggerResult>>({})

  // A new screen starts with fresh choices and no stale result lines.
  useEffect(() => {
    setChoices({})
    setResults({})
  }, [pathname])

  return entries.map(({ trigger, ctx }) => {
    const options = trigger.choices?.(state, ctx) ?? []
    const picked = choices[trigger.id]
    const chosen = picked !== undefined && options.some((o) => o.id === picked) ? picked : initialChoice(trigger, state, ctx)
    return {
      trigger,
      ctx,
      options,
      chosen,
      reason: trigger.disabledReason(state, ctx, chosen),
      result: results[`${pathname}|${trigger.id}`],
      choose: (choiceId) => setChoices((c) => ({ ...c, [trigger.id]: choiceId })),
      run: () => {
        const res = trigger.run(useAppStore, ctx, chosen)
        setResults((r) => ({ ...r, [`${pathname}|${trigger.id}`]: res }))
      },
    }
  })
}

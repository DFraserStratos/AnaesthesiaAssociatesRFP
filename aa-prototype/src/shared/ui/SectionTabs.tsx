import { useDemoTriggerContext, type DemoContextKey, type DemoContextValues } from '../demoTriggers/context'
import { CountBadge, type CountBadgeTone } from './CountBadge'
import { LineTabLink, LineTabs } from './LineTabs'

/** One tab of a section's strip: its id, its label and the route it links to. */
export interface SectionTabEntry<T extends string> {
  tab: T
  label: string
  path: string
}

/** The demo-trigger context keys whose value can hold this section's tab ids. */
export type SectionTabContextKey<T extends string> = { [K in DemoContextKey]: [T] extends [DemoContextValues[K]] ? K : never }[DemoContextKey]

/**
 * A routed section's tab strip (the Lists section; the Finances, People and Contracts strips are the
 * same pattern on `LineTabs`): one `LineTabLink` per registry entry, in order, the shown tab
 * `aria-current="page"`. A tab's `counts` entry draws a `CountBadge` after its label, hidden at zero
 * unless `hideAtZero` is false; a tab with no entry shows none. Each link carries
 * `data-<name>-tab="<id>"`; the strip takes `shot`. Showing a tab publishes its id under `context`
 * for the demo triggers.
 */
export function SectionTabs<T extends string>({
  label,
  name,
  tabs,
  active,
  context,
  counts,
  hideAtZero = true,
  tone = 'neutral',
  mono = false,
  shot,
}: {
  /** The strip's accessible name (the section's title). */
  label: string
  /** The `data-<name>-tab` attribute's middle word ("lists" gives `data-lists-tab`). */
  name: string
  tabs: readonly SectionTabEntry<T>[]
  active: T
  /** The demo-trigger context key the shown tab's id is published under. */
  context: SectionTabContextKey<T>
  counts?: Partial<Record<T, number>>
  hideAtZero?: boolean
  tone?: CountBadgeTone
  mono?: boolean
  shot?: string
}) {
  useDemoTriggerContext(context, active as unknown as DemoContextValues[typeof context])
  return (
    <LineTabs label={label} {...(shot !== undefined ? { shot } : {})}>
      {tabs.map((t) => {
        const count = counts?.[t.tab]
        const data = { [`data-${name}-tab`]: t.tab } as Record<`data-${string}`, string>
        return (
          <LineTabLink
            key={t.tab}
            to={t.path}
            active={active === t.tab}
            {...data}
            {...(count !== undefined ? { badge: <CountBadge count={count} hideAtZero={hideAtZero} tone={tone} mono={mono} /> } : {})}
          >
            {t.label}
          </LineTabLink>
        )
      })}
    </LineTabs>
  )
}

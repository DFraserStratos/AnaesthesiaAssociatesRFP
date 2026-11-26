/**
 * The Lists section (US-13.1.3): one Admin side-nav entry in place of Draft Lists, Conflicts and the
 * Review queue, with four routed tabs (`LISTS_TABS`, `listsTabs.ts`), opening on Draft Lists. Every
 * tab is an `AdminPage` titled Lists with the tab strip under it; a tab's number counts only what
 * needs doing there (`listsCounts.ts`) and is hidden at zero. Each tab renders from its own file in
 * this folder; a list keeps its filters in the URL (`useListParams`, `apps/admin/useListParams.ts`).
 */

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { SectionTabs } from '../../../../shared/ui'
import { useAppStore } from '../../../../store'
import { AdminPage, type AdminPageMode } from '../../components/AdminPage'
import { type ListsTab } from './listsPaths'
import { LISTS_TABS, listsTabEntry } from './listsTabs'
import { listsTabCounts } from './listsCounts'

/** The tab counts, from the store (what needs doing on each tab). */
function useListsTabCounts(): Record<ListsTab, number> {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  return useMemo(() => listsTabCounts({ schedule, masters, clock, appSettings }), [schedule, masters, clock, appSettings])
}

/**
 * The section's tab strip: each tab with a number only where something needs doing (hidden at zero).
 * Showing a tab publishes its id under `adminLists.tab`.
 */
export function ListsTabs({ active }: { active: ListsTab }) {
  const counts = useListsTabCounts()
  return <SectionTabs label="Lists" name="lists" tabs={LISTS_TABS} active={active} context="adminLists.tab" counts={counts} shot="lists-tabs" />
}

/**
 * One Lists tab's page: the Lists title, the tab's one-line sub from `LISTS_TABS` (every tab has one,
 * so the strip never moves), its primary action, the tab strip and the tab's body. A list tab fits the
 * window (`mode` fit, the default).
 */
export function ListsPage({
  tab,
  mode = 'fit',
  actions,
  testId,
  shot,
  children,
  ...data
}: {
  tab: ListsTab
  mode?: AdminPageMode
  actions?: ReactNode
  testId?: string
  shot?: string
  children: ReactNode
} & { [key: `data-${string}`]: string | undefined }) {
  return (
    <AdminPage
      mode={mode}
      title="Lists"
      sub={listsTabEntry(tab).sub}
      {...(actions !== undefined ? { actions } : {})}
      tabs={<ListsTabs active={tab} />}
      {...(testId !== undefined ? { testId } : {})}
      {...(shot !== undefined ? { shot } : {})}
      data-lists-page={tab}
      {...data}
    >
      {children}
    </AdminPage>
  )
}

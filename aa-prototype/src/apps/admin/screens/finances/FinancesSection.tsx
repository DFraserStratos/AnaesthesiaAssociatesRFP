/**
 * The Finances section (build plan Phase 58; D107, D109, US-13.3.3): one Admin
 * side-nav entry in place of Invoices, the Billing monitor and the Ledger, with
 * six routed tabs (`FINANCE_TABS`, `financeTabs.ts`), opening on Billing. Every tab is an
 * `AdminPage` titled Finances with the tab strip under it; a tab's number counts
 * only what needs doing there (`financeCounts.ts`), and Payments and AA fees
 * never show one. Each tab and record renders from its own file in this folder
 * (LANES.md "The file contract 58 sets up").
 */

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { CountBadge, LineTabLink, LineTabs } from '../../../../shared/ui'
import { useDemoTriggerContext } from '../../../../shared/demoTriggers'
import { useAppStore } from '../../../../store'
import { AdminPage, type AdminPageMode } from '../../components/AdminPage'
import { type FinanceTab } from './financePaths'
import { FINANCE_TABS } from './financeTabs'
import { financeTabCounts } from './financeCounts'

/**
 * The section's tab strip: each tab with a number only where something needs doing (hidden at
 * zero; Payments and AA fees have none). Showing a tab publishes its id under `adminFinances.tab`.
 */
export function FinancesTabs({ active }: { active: FinanceTab }) {
  useDemoTriggerContext('adminFinances.tab', active)
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  const counts = useMemo(() => financeTabCounts({ billing, schedule, masters, appSettings, clock }), [billing, schedule, masters, appSettings, clock])
  return (
    <LineTabs label="Finances" shot="finances-tabs">
      {FINANCE_TABS.map((t) => {
        const count = (counts as Partial<Record<FinanceTab, number>>)[t.tab]
        return (
          <LineTabLink
            key={t.tab}
            to={t.path}
            active={active === t.tab}
            data-finances-tab={t.tab}
            {...(count !== undefined ? { badge: <CountBadge count={count} /> } : {})}
          >
            {t.label}
          </LineTabLink>
        )
      })}
    </LineTabs>
  )
}

/**
 * One Finances tab's page: the Finances title, the tab's own sub line and mode (each screen keeps
 * today's), its primary action, the tab strip and the tab's body.
 */
export function FinancesPage({
  tab,
  sub,
  mode,
  actions,
  testId,
  shot,
  children,
  ...data
}: {
  tab: FinanceTab
  sub?: ReactNode
  mode: AdminPageMode
  actions?: ReactNode
  testId?: string
  shot?: string
  children: ReactNode
} & { [key: `data-${string}`]: string | undefined }) {
  return (
    <AdminPage
      mode={mode}
      title="Finances"
      {...(sub !== undefined ? { sub } : {})}
      {...(actions !== undefined ? { actions } : {})}
      tabs={<FinancesTabs active={tab} />}
      {...(testId !== undefined ? { testId } : {})}
      {...(shot !== undefined ? { shot } : {})}
      data-finances-page={tab}
      {...data}
    >
      {children}
    </AdminPage>
  )
}

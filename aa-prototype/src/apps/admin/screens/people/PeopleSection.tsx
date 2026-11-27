/**
 * The People section (build plan Phase 53; D99, US-13.4.1): one Admin side-nav
 * entry where Patients was, with four routed tabs (Anaesthetists, Surgeons,
 * Specialties, Patients; `peopleTabs.ts`). Every tab is an `AdminPage` titled
 * People with the tab strip under it; a list tab fits the window, its table
 * scrolling inside its card with the pager in the card's footer. Each list
 * keeps its state in the URL (`q`, `status`, `tier`, `specialty`, `page`), a
 * replace so Back is not a filter change.
 */

import type { ReactNode } from 'react'
import { CountBadge, LineTabLink, LineTabs } from '../../../../shared/ui'
import { useDemoTriggerContext } from '../../../../shared/demoTriggers'
import { practiceAnaesthetistCount } from '../../../../domain/anaesthetistStatus'
import { isRetired } from '../../../../domain/masterLifecycle'
import { useAppStore, useToday } from '../../../../store'
import { AdminPage, type AdminPageMode } from '../../components/AdminPage'
import { useListParams } from '../../useListParams'
import { LoadResultBanner } from '../masters/chrome'
import { PEOPLE_TAB_SEEDED, PEOPLE_TABS, type PeopleTab } from './peopleTabs'

/**
 * The section's tab strip, each list tab with its count as the mock's `#map` draws them: the
 * practice's anaesthetists (`practiceAnaesthetistCount`, on the demo clock's today), active surgeons, specialties. Patients carries none: its
 * count is the side nav's. Showing a tab publishes its id under `adminPeople.tab`, which the
 * sample-sheet trigger reads.
 */
export function PeopleTabs({ active }: { active: PeopleTab }) {
  useDemoTriggerContext('adminPeople.tab', active)
  const todayISO = useToday()
  const anaesthetistCount = useAppStore((s) => practiceAnaesthetistCount(Object.values(s.masters.anaesthetists), todayISO))
  const surgeonCount = useAppStore((s) => Object.values(s.masters.surgeons).filter((x) => !isRetired(x)).length)
  const specialtyCount = useAppStore((s) => Object.keys(s.masters.specialties).length)
  const counts: Partial<Record<PeopleTab, number>> = { anaesthetists: anaesthetistCount, surgeons: surgeonCount, specialties: specialtyCount }
  return (
    <LineTabs label="People" shot="people-tabs">
      {PEOPLE_TABS.map((t) => {
        const count = counts[t.tab]
        return (
          <LineTabLink
            key={t.tab}
            to={t.path}
            active={active === t.tab}
            data-people-tab={t.tab}
            {...(count !== undefined ? { badge: <CountBadge count={count} hideAtZero={false} mono /> } : {})}
          >
            {t.label}
          </LineTabLink>
        )
      })}
    </LineTabs>
  )
}

/**
 * One People tab's page: the People title, the tab's one-line sub from `PEOPLE_TABS`, its primary Add
 * action, the tab strip and, on a seeded tab, the waiting-load banner. A list tab fits the window;
 * Patients' Needs follow-up is fluid.
 */
export function PeoplePage({ tab, actions, mode = 'fit', shot, children }: { tab: PeopleTab; actions?: ReactNode; mode?: AdminPageMode; shot?: string; children: ReactNode }) {
  const seeded = PEOPLE_TAB_SEEDED[tab]
  const sub = PEOPLE_TABS.find((t) => t.tab === tab)?.sub ?? ''
  return (
    <AdminPage
      mode={mode}
      title="People"
      sub={sub}
      {...(actions !== undefined ? { actions } : {})}
      tabs={<PeopleTabs active={tab} />}
      {...(shot !== undefined ? { shot } : {})}
      data-people-page={tab}
    >
      {seeded.length > 0 && <LoadResultBanner seeded={seeded} />}
      {children}
    </AdminPage>
  )
}

/** A People list's state in the URL: the Admin lists' one hook (`useListParams`). */
export const usePeopleListParams = useListParams

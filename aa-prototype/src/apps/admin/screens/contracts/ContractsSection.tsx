/**
 * The Contracts section (build plan Phase 45; D92, US-04.1.7): its own entry in
 * the Admin side nav, between Ledger and Master data. A list page on the Admin
 * frame (`AdminPage fit`) under a route strip: Contracts, Parties and Funding
 * tags (Phase 48, `contractsTabs.ts`). New contract opens its own page,
 * `/admin/contracts/new`, keeping `?holder=` (Phase 46).
 */

import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, CountBadge, LineTabLink, LineTabs } from '../../../../shared/ui'
import { useDemoTriggerContext } from '../../../../shared/demoTriggers'
import { activeContractCount } from '../../../../domain/billing/contracts'
import { useAppStore } from '../../../../store'
import { AdminPage } from '../../components/AdminPage'
import { newContractPath } from '../../contractsPaths'
import { SEEDED_SUBTITLE } from '../masters/masterViews'
import { CONTRACTS_TABS, type ContractsTab } from './contractsTabs'
import { ContractsView } from './ContractsView'

/**
 * The section's tabs, in order, each with its count as the mock draws them (contracts-section.html
 * #parties): Active Contracts (what the catalogue lists by default, system backstops included),
 * Parties, funding tags. Showing a tab publishes its id under
 * `adminContracts.tab`, which the demo triggers on the section read (the sample sheets, Phase 48).
 */
export function ContractsTabs({ active }: { active: ContractsTab }) {
  useDemoTriggerContext('adminContracts.tab', active)
  const contractCount = useAppStore((s) => activeContractCount(s.masters.contracts))
  const partyCount = useAppStore((s) => Object.keys(s.masters.parties).length)
  const tagCount = useAppStore((s) => Object.keys(s.masters.fundingTags).length)
  const counts: Record<ContractsTab, number> = { contracts: contractCount, parties: partyCount, fundingTags: tagCount }
  return (
    <LineTabs label="Contracts" shot="contracts-tabs">
      {CONTRACTS_TABS.map((t) => (
        <LineTabLink key={t.tab} to={t.path} active={active === t.tab} data-contracts-tab={t.tab} badge={<CountBadge count={counts[t.tab]} hideAtZero={false} mono />}>
          {t.label}
        </LineTabLink>
      ))}
    </LineTabs>
  )
}

export function ContractsSection() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // The holder New contract starts with: the holder grouping's picked Party (Phase 47), or an old `?holder=`.
  const holderParam = params.get('holder') ?? (params.get('group') === 'holder' ? (params.get('in') ?? '') : '')
  const holder = useAppStore((s) => (s.masters.parties[holderParam] !== undefined ? holderParam : ''))

  return (
    <AdminPage
      mode="fit"
      shot="contracts-section"
      title="Contracts"
      sub={`What each Procedure can be priced at, and who it bills. ${SEEDED_SUBTITLE}`}
      actions={
        <Button variant="primary" size="desktop" shot="contract-new" onClick={() => navigate(newContractPath(holder !== '' ? { holder } : {}))}>
          New contract
        </Button>
      }
      tabs={<ContractsTabs active="contracts" />}
    >
      {/* The catalogue holds its own toolbar and body, its index in the body's nav (Phase 47). */}
      <ContractsView />
    </AdminPage>
  )
}

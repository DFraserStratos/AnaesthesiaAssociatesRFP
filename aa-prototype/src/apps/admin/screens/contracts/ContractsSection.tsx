/**
 * The Contracts section (build plan Phase 45; D92, US-04.1.7): its own entry in
 * the Admin side nav, between Ledger and Master data. A list page on the Admin
 * frame (`AdminPage fit`) under a route strip: Contracts is live here; Parties
 * and Funding tags still open their Master data views until Phase 48 moves
 * them. `/admin/contracts/new` shows the same list with the create panel open
 * (`ContractPanel` in create mode, the holder from `?holder=`) until Phase 46
 * gives New contract its own page.
 */

import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, LineTabLink, LineTabs } from '../../../../shared/ui'
import { useDemoTriggerContext } from '../../../../shared/demoTriggers'
import { useAppStore, type Actor } from '../../../../store'
import { AdminPage } from '../../components/AdminPage'
import { ContractPanel } from '../../flows/ContractEditSheet'
import { contractsPath, newContractPath } from '../../contractsPaths'
import { mastersViewPath } from '../../mastersPaths'
import { SEEDED_SUBTITLE } from '../masters/masterViews'
import { ContractsView } from './ContractsView'

/** The section's tabs, in order. Parties and Funding tags link across to Master data until 48. */
export function ContractsTabs({ active }: { active: 'contracts' }) {
  return (
    <LineTabs label="Contracts" shot="contracts-tabs">
      <LineTabLink to={contractsPath()} active={active === 'contracts'} data-contracts-tab="contracts">Contracts</LineTabLink>
      <LineTabLink to={mastersViewPath('parties')} active={false} data-contracts-tab="parties">Parties</LineTabLink>
      <LineTabLink to={mastersViewPath('fundingTags')} active={false} data-contracts-tab="fundingTags">Funding tags</LineTabLink>
    </LineTabs>
  )
}

export function ContractsSection({ actor, creating = false }: { actor: Actor; creating?: boolean }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // The demo triggers on the Contract list (the backdated range, the sample sheets) key on the tab shown; 48 adds its tabs.
  useDemoTriggerContext('adminContracts.tab', 'contracts')
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
      {creating && (
        <ContractPanel
          open
          actor={actor}
          {...(holder !== '' ? { initialHolderId: holder } : {})}
          onClose={() => navigate(contractsPath(holder !== '' ? { holder } : {}))}
        />
      )}
    </AdminPage>
  )
}

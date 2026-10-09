import { useSearchParams } from 'react-router-dom'
import { accent, neutral } from '../../../../theme/tokens'
import type { Actor } from '../../../../store'
import { AnaesthetistsView } from './AnaesthetistsView'
import { HospitalsView } from './HospitalsView'
import { SurgeonGroupsView, SurgeonRoomsView, SurgeonsView } from './SurgeonsView'
import {
  ContractsMaster,
  InsurersView,
  ListStatusesView,
  ModifierCodesView,
  OrganisationsView,
  PermanentListsMaster,
  RvgCodesView,
  XeroArchivingView,
} from './ReferenceViews'
import { MASTERS_NAV, parseMastersView, type MastersView } from './view'

interface MasterDataProps {
  actor: Actor
}

/**
 * Master data: a sub-nav of reference tables. The selected view lives in the
 * `?view=` search param (catch-up Phase 17), so the surgeon profile and the
 * anaesthetist record link back to their view. Each view owns its sheets.
 */
export function MasterData({ actor }: MasterDataProps) {
  const [params, setParams] = useSearchParams()
  const view = parseMastersView(params.get('view'))

  function select(next: MastersView) {
    setParams((prev) => {
      const copy = new URLSearchParams(prev)
      copy.set('view', next)
      return copy
    }, { replace: true })
  }

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', maxWidth: 1180 }}>
      <nav aria-label="Master data" style={{ width: 190, flex: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Master data</h1>
        {MASTERS_NAV.map((n) => {
          const active = n.view === view
          return (
            <button
              key={n.view}
              type="button"
              aria-current={active ? 'page' : undefined}
              data-masters-view={n.view}
              onClick={() => select(n.view)}
              style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', background: active ? accent.tint : 'transparent', color: active ? accent.pressed : neutral.slate, fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer' }}
            >
              {n.label}
            </button>
          )
        })}
      </nav>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {view === 'anaesthetists' && <AnaesthetistsView actor={actor} />}
        {view === 'contracts' && <ContractsMaster actor={actor} />}
        {view === 'permanentLists' && <PermanentListsMaster actor={actor} />}
        {view === 'hospitals' && <HospitalsView actor={actor} />}
        {view === 'surgeons' && <SurgeonsView actor={actor} />}
        {view === 'surgeonRooms' && <SurgeonRoomsView actor={actor} />}
        {view === 'surgeonGroups' && <SurgeonGroupsView actor={actor} />}
        {view === 'insurers' && <InsurersView actor={actor} />}
        {view === 'organisations' && <OrganisationsView />}
        {view === 'rvgCodes' && <RvgCodesView />}
        {view === 'modifierCodes' && <ModifierCodesView />}
        {view === 'listStatuses' && <ListStatusesView />}
        {view === 'xeroArchiving' && <XeroArchivingView actor={actor} />}
      </div>
    </div>
  )
}

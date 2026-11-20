import { useSearchParams } from 'react-router-dom'
import { useDemoTriggerContext } from '../../../../shared/demoTriggers'
import { accent, neutral, radius } from '../../../../theme/tokens'
import { useAppStore, type Actor } from '../../../../store'
import { AttentionDot } from '../../../../shared/warnings/AttentionDot'
import { AnaesthetistsView } from './AnaesthetistsView'
import { HospitalsView } from './HospitalsView'
import { SurgeonGroupsView, SurgeonsView } from './SurgeonsView'
import {
  RecurringBookingsMaster,
  XeroArchivingView,
} from './ReferenceViews'
import { parseMastersView, type MastersView } from './view'
import { MASTER_VIEW_GROUPS, MASTER_VIEWS } from './masterViews'
import { PublicHolidaysView } from './PublicHolidaysView'
import { SeedLoadView } from './SeedLoadView'
import { GoLiveLoadView } from './GoLiveLoadView'
import { ScheduleSettingsView } from './ScheduleSettingsView'
import { AvailabilityStatusesView } from './AvailabilityStatusesView'
import { PartiesView } from './PartiesView'
import { ContractsView } from './ContractsView'
import { SpecialtiesView } from './SpecialtiesView'
import { FundingTagsView } from './FundingTagsView'
import { RvgGroupsView } from './RvgGroupsView'
import { ModifiersView } from './ModifiersView'
import { EmailTemplatesView } from './EmailTemplatesView'

interface MasterDataProps {
  actor: Actor
}

/**
 * Master data: a grouped sub-nav of every master (catch-up Phase 42's registry, `masterViews.ts`). The selected view lives in the
 * `?view=` search param (catch-up Phase 17), so the surgeon profile and the
 * anaesthetist record link back to their view. Each view owns its sheets.
 */
export function MasterData({ actor }: MasterDataProps) {
  const [params, setParams] = useSearchParams()
  const view = parseMastersView(params.get('view'))
  useDemoTriggerContext('adminMasters.view', view)
  // A staged go-live batch puts a warn dot on its sub-nav item (catch-up Phase 42).
  const goLiveWaiting = useAppStore((s) => s.masterLoads.goLive?.status === 'staged')

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
        {MASTER_VIEW_GROUPS.map((group) => (
          <div key={group} role="group" aria-label={group} data-masters-group={group} style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: neutral.mist, padding: '4px 10px 2px' }}>{group}</div>
            {MASTER_VIEWS.filter((n) => n.group === group).map((n) => {
              const active = n.view === view
              return (
                <button
                  key={n.view}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  data-masters-view={n.view}
                  onClick={() => select(n.view)}
                  style={{ textAlign: 'left', padding: '8px 10px', borderRadius: radius.sm, border: 'none', background: active ? accent.tint : 'transparent', color: active ? accent.pressed : neutral.slate, fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {n.label}
                    {n.view === 'goLive' && goLiveWaiting && <AttentionDot size={12} label="A go-live load is ready to review" />}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {view === 'anaesthetists' && <AnaesthetistsView actor={actor} />}
        {view === 'contracts' && <ContractsView actor={actor} />}
        {view === 'fundingTags' && <FundingTagsView actor={actor} />}
        {view === 'specialties' && <SpecialtiesView actor={actor} />}
        {view === 'parties' && <PartiesView actor={actor} />}
        {view === 'recurringBookings' && <RecurringBookingsMaster actor={actor} />}
        {view === 'hospitals' && <HospitalsView actor={actor} />}
        {view === 'surgeons' && <SurgeonsView actor={actor} />}
        {view === 'surgeonGroups' && <SurgeonGroupsView actor={actor} />}
        {view === 'rvgGroups' && <RvgGroupsView actor={actor} />}
        {view === 'modifiers' && <ModifiersView actor={actor} />}
        {view === 'scheduleSettings' && <ScheduleSettingsView actor={actor} />}
        {view === 'availability-statuses' && <AvailabilityStatusesView actor={actor} />}
        {view === 'emailTemplates' && <EmailTemplatesView actor={actor} />}
        {view === 'xeroArchiving' && <XeroArchivingView actor={actor} />}
        {view === 'publicHolidays' && <PublicHolidaysView actor={actor} />}
        {view === 'seedLoad' && <SeedLoadView actor={actor} />}
        {view === 'goLive' && <GoLiveLoadView actor={actor} />}
      </div>
    </div>
  )
}

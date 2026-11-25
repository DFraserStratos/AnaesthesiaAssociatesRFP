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
import { MASTER_VIEW_GROUPS, MASTER_VIEWS, masterViewMode } from './masterViews'
import { AdminPage, PageBody } from '../../components/AdminPage'
import { PublicHolidaysView } from './PublicHolidaysView'
import { SeedLoadView } from './SeedLoadView'
import { GoLiveLoadView } from './GoLiveLoadView'
import { ScheduleSettingsView } from './ScheduleSettingsView'
import { AvailabilityStatusesView } from './AvailabilityStatusesView'
import { SpecialtiesView } from './SpecialtiesView'
import { TextAction } from '../../../../shared/ui'
import { contractsPath } from '../../contractsPaths'
import { RvgGroupsView } from './RvgGroupsView'
import { ModifiersView } from './ModifiersView'
import { EmailTemplatesView } from './EmailTemplatesView'
import { PatientBalanceThresholdView } from './PatientBalanceThresholdView'
import { PrepaymentLettersView } from './PrepaymentLettersView'

interface MasterDataProps {
  actor: Actor
}

/**
 * Master data on the Admin page frame: the "Master data" title across the top, then the grouped
 * view list as the body's section navigation (`PageBody nav`) and the view on its right. The mode
 * follows the view (`masterViewMode`): a list of records fits the window, a settings or load view
 * scrolls as a fluid page.
 *
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

  const nav = (
    <nav aria-label="Master data" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
  )

  return (
    <AdminPage
      mode={masterViewMode(view)}
      title="Master data"
      sub={
        <span data-shot="masters-moved-note">
          Contracts, Parties and Funding tags are now in{' '}
          <TextAction size="sm" flush to={contractsPath()}>Contracts</TextAction>.
        </span>
      }
    >
      <PageBody nav={nav} gap={12}>
        {view === 'anaesthetists' && <AnaesthetistsView actor={actor} />}
        {/* Contracts, Parties and Funding tags are tabs of the Contracts section (build plan Phases 45 and 48): `AdminMastersRoute` redirects their old views. */}
        {view === 'specialties' && <SpecialtiesView actor={actor} />}
        {view === 'recurringBookings' && <RecurringBookingsMaster actor={actor} />}
        {view === 'hospitals' && <HospitalsView actor={actor} />}
        {view === 'surgeons' && <SurgeonsView actor={actor} />}
        {view === 'surgeonGroups' && <SurgeonGroupsView actor={actor} />}
        {view === 'rvgGroups' && <RvgGroupsView actor={actor} />}
        {view === 'modifiers' && <ModifiersView actor={actor} />}
        {view === 'scheduleSettings' && <ScheduleSettingsView actor={actor} />}
        {view === 'availability-statuses' && <AvailabilityStatusesView actor={actor} />}
        {view === 'emailTemplates' && <EmailTemplatesView actor={actor} />}
        {view === 'prepaymentLetters' && <PrepaymentLettersView actor={actor} />}
        {view === 'xeroArchiving' && <XeroArchivingView actor={actor} />}
        {view === 'patientBalance' && <PatientBalanceThresholdView actor={actor} />}
        {view === 'publicHolidays' && <PublicHolidaysView actor={actor} />}
        {view === 'seedLoad' && <SeedLoadView actor={actor} />}
        {view === 'goLive' && <GoLiveLoadView actor={actor} />}
      </PageBody>
    </AdminPage>
  )
}

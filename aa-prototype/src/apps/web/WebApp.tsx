import { useMemo, useState } from 'react'
import { APP_CONFIG } from '../../shell/appConfig'
import { neutral } from '../../theme/tokens'
import { useToday, type Actor } from '../../store'
import { SurfaceProvider } from '../../shared'
import { RequestCoverSheet } from '../../shared/flows'
import { shiftWeeks } from '../../shared/format'
import { WebNav, type WebTab } from './components'
import {
  AccountsScreen,
  AvailabilityGrid,
  CardDetailView,
  DashboardScreen,
  ListDetailView,
  ListsScreen,
  type AccountsSubTab,
} from './screens'
import type { CoverTarget } from './types'

/**
 * Anaesthetist Web App (Phase 05) — the desktop twin of the mobile app for
 * Dr Souter. App-owned local navigation (NOT router sub-routes, mirroring the
 * mobile pattern): a top-level tab (Dashboard / Lists / Availability / Accounts)
 * plus a Lists drill-down stack (table → List detail → Card detail) rendered as
 * normal desktop pages. Wrapped in `<SurfaceProvider variant="web">` so every
 * shared flow / capture sheet / card body renders as a centred dialog. Every
 * read is view-scoped to Souter (A8); there are no authorise controls anywhere.
 */
export function WebApp() {
  const persona = APP_CONFIG.web.persona
  const anaesthetistId = persona.anaesthetistId ?? '34821'
  const actor: Actor = useMemo(
    () => ({ who: persona.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }),
    [persona, anaesthetistId],
  )
  const todayISO = useToday()

  const [tab, setTab] = useState<WebTab>('dashboard')
  const [drill, setDrill] = useState<{ listId: string | null; cardId: string | null }>({ listId: null, cardId: null })
  const [accountsSubTab, setAccountsSubTab] = useState<AccountsSubTab>('overdue')
  const [weekOffset, setWeekOffset] = useState(0)
  const [cover, setCover] = useState<CoverTarget | null>(null)

  const weekAnchorISO = shiftWeeks(todayISO, weekOffset)

  function handleNavTab(next: WebTab) {
    setTab(next)
    if (next === 'lists') setDrill({ listId: null, cardId: null })
  }
  function openList(listId: string) {
    setDrill({ listId, cardId: null })
    setTab('lists')
  }
  function viewOverdue() {
    setAccountsSubTab('overdue')
    setTab('accounts')
  }

  return (
    <SurfaceProvider variant="web">
      <div style={{ minHeight: '100%', minWidth: 1240, background: neutral.bg, color: neutral.ink }}>
        <WebNav tab={tab} onTab={handleNavTab} personaName={persona.name} initials={persona.initials} />
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 32px 48px' }}>
          {tab === 'dashboard' && (
            <DashboardScreen
              anaesthetistId={anaesthetistId}
              personaName={persona.name}
              todayISO={todayISO}
              weekAnchorISO={weekAnchorISO}
              onPrevWeek={() => setWeekOffset((o) => o - 1)}
              onNextWeek={() => setWeekOffset((o) => o + 1)}
              onOpenList={openList}
              onViewOverdue={viewOverdue}
              onOpenAvailability={() => setTab('availability')}
              onCover={setCover}
            />
          )}

          {tab === 'lists' &&
            (drill.cardId !== null ? (
              <CardDetailView
                cardId={drill.cardId}
                actor={actor}
                todayISO={todayISO}
                onBack={() => setDrill((d) => ({ listId: d.listId, cardId: null }))}
                onCopied={() => setDrill((d) => ({ listId: d.listId, cardId: null }))}
              />
            ) : drill.listId !== null ? (
              <ListDetailView
                listId={drill.listId}
                actor={actor}
                todayISO={todayISO}
                onBack={() => setDrill({ listId: null, cardId: null })}
                onOpenCard={(cardId) => setDrill((d) => ({ listId: d.listId, cardId }))}
              />
            ) : (
              <ListsScreen anaesthetistId={anaesthetistId} todayISO={todayISO} onOpenList={openList} />
            ))}

          {tab === 'availability' && (
            <AvailabilityGrid anaesthetistId={anaesthetistId} personaName={persona.name} todayISO={todayISO} onCover={setCover} />
          )}

          {tab === 'accounts' && (
            <AccountsScreen anaesthetistId={anaesthetistId} subTab={accountsSubTab} onSubTab={setAccountsSubTab} />
          )}
        </div>
      </div>

      {cover !== null && (
        <RequestCoverSheet
          open
          listId={cover.listId}
          actor={actor}
          kind={cover.kind}
          personName={cover.personName}
          slotLabel={cover.slotLabel}
          {...(cover.targetAnaesthetistId !== undefined ? { targetAnaesthetistId: cover.targetAnaesthetistId } : {})}
          onClose={() => setCover(null)}
          onSent={() => undefined}
        />
      )}
    </SurfaceProvider>
  )
}

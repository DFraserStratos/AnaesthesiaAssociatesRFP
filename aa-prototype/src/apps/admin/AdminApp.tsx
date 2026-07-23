import { useMemo, useState } from 'react'
import { neutral } from '../../theme/tokens'
import { SurfaceProvider } from '../../shared'
import type { List } from '../../domain/types'
import { addDayNote, useAppStore, useToday, type Actor } from '../../store'
import { ANAESTHETISTS } from '../../domain/seed'
import { Placeholder } from '../Placeholder'
import { SideNav, type NavSection } from './components/SideNav'
import { DayNav, type SortMode } from './components/DayNav'
import { DayGrid } from './components/DayGrid'
import { RightRail } from './components/RightRail'
import { ListDrawer } from './components/ListDrawer'
import { AdminCardDetail } from './screens/AdminCardDetail'
import { isBooked, surnameOf } from './util'

/** The office persona actor, built once (Decisions log 2026-07-21). */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

const PLACEHOLDERS: Record<Exclude<NavSection, 'day'>, { title: string; phase: string; body: string }> = {
  review: { title: 'Review queue', phase: 'Phase 07', body: 'The authorisation review queue (submitted lists, per-card flags, authorise choreography) is built in Phase 07.' },
  billing: { title: 'Billing monitor', phase: 'Phase 09', body: 'The billing run monitor, exceptions and dead-letter handling arrive in Phase 09.' },
  masters: { title: 'Master data', phase: 'Phase 07', body: 'The anaesthetist / hospital / contract / RVG master-data screens arrive in Phase 07.' },
  audit: { title: 'Audit', phase: 'Phase 07', body: 'The append-only audit-trail viewer arrives in Phase 07.' },
}

export function AdminApp() {
  const todayISO = useToday()
  return (
    <SurfaceProvider variant="web">
      <AdminShell todayISO={todayISO} />
    </SurfaceProvider>
  )
}

function AdminShell({ todayISO }: { todayISO: string }) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const cardsRecord = useAppStore((s) => s.schedule.cards)
  const masters = useAppStore((s) => s.masters)
  const dayNotesRecord = useAppStore((s) => s.dayNotes)
  const [section, setSection] = useState<NavSection>('day')
  const [selectedDate, setSelectedDate] = useState(todayISO)
  const [sortMode, setSortMode] = useState<SortMode>('roster')
  const [drawerListId, setDrawerListId] = useState<string | null>(null)
  const [cardDetailId, setCardDetailId] = useState<string | null>(null)

  // Roster order = the canonical cast order (matches the Tue-21 mockup 1:1).
  // NB: Object.values(record) would sort by registration number (numeric-like
  // keys enumerate ascending), so we drive roster order from the cast array.
  const anaesthetists = useMemo(() => {
    const all = ANAESTHETISTS.map((a) => masters.anaesthetists[a.registrationNumber]).filter(
      (a): a is NonNullable<typeof a> => a !== undefined,
    )
    if (sortMode === 'az') return [...all].sort((a, b) => surnameOf(a.name).localeCompare(surnameOf(b.name)))
    return all
  }, [masters.anaesthetists, sortMode])

  const dayLists = useMemo(() => Object.values(listsRecord).filter((l) => l.dateISO === selectedDate), [listsRecord, selectedDate])

  const listsByAnaesthetist = useMemo(() => {
    const map: Record<string, List[]> = {}
    for (const l of dayLists) (map[l.anaesthetistId] ??= []).push(l)
    return map
  }, [dayLists])

  const activeCardCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of Object.values(cardsRecord)) {
      if (c.cancellation === undefined) counts[c.listId] = (counts[c.listId] ?? 0) + 1
    }
    return counts
  }, [cardsRecord])

  const summary = useMemo(() => {
    // A Free list booked via phone-advice (cards or an assigned hospital) counts
    // as a session, not free, matching the grid's derived display.
    const effectivelyBooked = (l: List) =>
      isBooked(l.statusKey) || (l.statusKey === 'free' && ((activeCardCounts[l.id] ?? 0) > 0 || l.hospitalId !== undefined))
    const anaes = new Set(dayLists.map((l) => l.anaesthetistId)).size
    const sessions = dayLists.filter(effectivelyBooked).length
    const free = dayLists.filter((l) => l.statusKey === 'free' && !effectivelyBooked(l)).length
    const submitted = dayLists.filter((l) => l.state === 'SUBMITTED').length
    return `${anaes} anaesthetists · ${sessions} sessions · ${free} free · ${submitted} submitted`
  }, [dayLists, activeCardCounts])

  // Derived review queue (all SUBMITTED lists; the badge + awaiting-review rows).
  const reviewLists = useMemo(
    () =>
      Object.values(listsRecord)
        .filter((l) => l.state === 'SUBMITTED')
        .sort((a, b) =>
          a.dateISO === b.dateISO ? a.anaesthetistId.localeCompare(b.anaesthetistId) : a.dateISO.localeCompare(b.dateISO),
        ),
    [listsRecord],
  )
  const reviewRows = useMemo(
    () =>
      reviewLists.map((l) => {
        const anae = masters.anaesthetists[l.anaesthetistId]
        const hospital = l.hospitalId !== undefined ? masters.hospitals[l.hospitalId]?.name : 'Unassigned'
        const count = Object.values(cardsRecord).filter((c) => c.listId === l.id && c.cancellation === undefined).length
        return {
          listId: l.id,
          title: `${anae !== undefined ? surnameOf(anae.name) : l.anaesthetistId} — ${hospital} ${l.session}`,
          sub: `${count} card${count === 1 ? '' : 's'} · submitted`,
        }
      }),
    [reviewLists, masters, cardsRecord],
  )

  const notes = dayNotesRecord[selectedDate] ?? []

  function navigateDate(dateISO: string) {
    setSelectedDate(dateISO)
    setDrawerListId(null)
    setCardDetailId(null)
  }

  function openCard(cardId: string) {
    setCardDetailId(cardId)
    setDrawerListId(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100%', minWidth: 1320, background: neutral.bg, color: neutral.ink }}>
      <SideNav active={section} reviewBadge={reviewLists.length} onNavigate={(s) => { setSection(s); setCardDetailId(null); setDrawerListId(null) }} />

      <div style={{ flex: 1, minWidth: 0, padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {section !== 'day' ? (
          <Placeholder title={PLACEHOLDERS[section].title} phase={PLACEHOLDERS[section].phase}>
            {PLACEHOLDERS[section].body}
          </Placeholder>
        ) : cardDetailId !== null ? (
          <AdminCardDetail cardId={cardDetailId} actor={OFFICE} todayISO={todayISO} onBack={() => setCardDetailId(null)} />
        ) : (
          <>
            <DayNav selectedDateISO={selectedDate} summary={summary} sortMode={sortMode} onSort={setSortMode} onNavigateDate={navigateDate} todayISO={todayISO} />
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <DayGrid anaesthetists={anaesthetists} listsByAnaesthetist={listsByAnaesthetist} masters={masters} activeCardCounts={activeCardCounts} onSelectList={setDrawerListId} />
              <RightRail
                monthDateISO={selectedDate}
                selectedDateISO={selectedDate}
                todayISO={todayISO}
                onNavigateDate={navigateDate}
                notes={notes}
                onAddNote={(text, flagged) => addDayNote(useAppStore, OFFICE, selectedDate, text, flagged)}
                reviewRows={reviewRows}
                onReviewList={() => setSection('review')}
              />
            </div>
          </>
        )}
      </div>

      {drawerListId !== null && (
        <ListDrawer listId={drawerListId} actor={OFFICE} onClose={() => setDrawerListId(null)} onOpenCard={openCard} />
      )}
    </div>
  )
}

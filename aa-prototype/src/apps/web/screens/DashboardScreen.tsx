import { useMemo, useState } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { neutral, radius } from '../../../theme/tokens'
import { hasLeftMainView } from '../../../domain/listProgress'
import type { Slot } from '../../../domain/types'
import { anaesthetistLedgerPosition, openSlotViews, outstandingPayableRowsFor, POSITION_LABEL, useAppStore } from '../../../store'
import { drSurname, formatCurrency, plural, shortDay, longDayNoYear } from '../../../shared/format'
import { useDefaultStatus, useSurface } from '../../../shared'
import { sessionKey, useMovableLists, useMoveListPrompt, useMoveTargets } from '../../../shared/flows'
import { locationName } from '../../../shared/format'
import { WeekStrip } from '../components'
import { SESSIONS_IN_ORDER, sessionText } from '../../../domain/outOfHours'
import { OverlayHeader } from '../../../shared/surface/OverlayHeader'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Button, Card, PageHeader, StatTile, TextAction } from '../../../shared/ui'

interface DashboardScreenProps {
  anaesthetistId: string
  personaName: string
  todayISO: string
  weekAnchorISO: string
  onPrevWeek: () => void
  onNextWeek: () => void
  onOpenList: (listId: string) => void
  onViewOutstanding: () => void
  onViewPayments: () => void
  onOpenAvailability: () => void
}

/**
 * The anaesthetist web dashboard (Web Dashboard mockup is authoritative; W1;
 * US-12.2.3): the greeting and day summary, the week strip, then one row of two
 * panels: the financial position (owed, collected, paid out) from the ledger
 * (catch-up Phase 38; the same selector and labels as Accounts' "Your
 * position"), in the mockup's Receivables slot, and the live "Who's free"
 * locum panel. No seeded figures remain (the Productivity and Leave panels are
 * gone, RV-34); leave shows as holiday blocks in the week strip.
 */
export function DashboardScreen({
  anaesthetistId,
  personaName,
  todayISO,
  weekAnchorISO,
  onPrevWeek,
  onNextWeek,
  onOpenList,
  onViewOutstanding,
  onViewPayments,
  onOpenAvailability,
}: DashboardScreenProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  // The same Slot views every app and finder reads (catch-up Phase 28).
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const openVisual = useDefaultStatus().visual
  const slotState = useMemo(() => ({ schedule, appSettings, masters: { slotStatuses } }), [schedule, appSettings, slotStatuses])

  // Catch-up Phase 32: "Move a List" (her movable Lists in the next six days) and the Who's free gesture.
  const movableLists = useMovableLists(anaesthetistId, 6)
  const movePrompt = useMoveListPrompt()
  const { Overlay } = useSurface()
  const [picking, setPicking] = useState(false)
  const canMove = movableLists.length > 0 && movePrompt !== null
  // Who's free spans five days from today: her movable Lists there, and the colleagues each could go to.
  const moveTargets = useMoveTargets(anaesthetistId, todayISO, format(addDays(parseISO(todayISO), 4), 'yyyy-MM-dd'))

  // The financial position: the one ledger position (catch-up Phase 36) and the flat Outstanding list it equals (38).
  const position = useMemo(() => anaesthetistLedgerPosition({ billing }, anaesthetistId), [billing, anaesthetistId])
  const unpaidCount = useMemo(
    () => outstandingPayableRowsFor({ billing, schedule, masters }, anaesthetistId).length,
    [billing, schedule, masters, anaesthetistId],
  )
  const nothingBilled = position.owedToThem === 0 && position.collected === 0 && position.paidOut === 0

  // The mockup greets by surname ("Kia ora, Dr Souter"); mobile does the same.
  const greetingName = drSurname(personaName)

  // Day summary: today's Lists still on the main view (an authorised List has
  // left it; catch-up Phase 38a) + active bookings + lists ready to submit.
  const daySummary = useMemo(() => {
    const booked = Object.values(listsRecord).filter(
      (l) => l.anaesthetistId === anaesthetistId && l.dateISO === todayISO && !hasLeftMainView(l),
    )
    let bookings = 0
    let awaiting = 0
    for (const l of booked) {
      const active = Object.values(bookingsRecord).filter((c) => c.listId === l.id && c.cancellation === undefined)
      bookings += active.length
      if (l.state === 'ACTIVE' && active.length > 0 && active.every((c) => c.completed)) awaiting += 1
    }
    return { lists: booked.length, bookings, awaiting }
  }, [listsRecord, bookingsRecord, anaesthetistId, todayISO])

  // Who's free, next 5 days (live open sessions, name order, no tiers).
  const locumRows = useMemo(() => {
    const rows: { key: string; label: string; entries: { name: string; phone: string; slot: Slot }[] }[] = []
    for (let i = 0; i < 5; i++) {
      const dateISO = format(addDays(parseISO(todayISO), i), 'yyyy-MM-dd')
      // An opened, free out-of-hours session is free like any (catch-up Phase 32c).
      for (const session of SESSIONS_IN_ORDER) {
        const entries = openSlotViews(slotState, dateISO, session)
          .filter((v) => v.slot.anaesthetistId !== anaesthetistId)
          .map(({ slot }) => {
            const a = anaesthetists[slot.anaesthetistId]
            return { name: a?.name ?? 'Anaesthetist', phone: a?.phone ?? '', slot }
          })
          .sort((a, b) => a.name.localeCompare(b.name))
        if (entries.length > 0) {
          rows.push({ key: `${dateISO}-${sessionText(session)}`, label: `${format(parseISO(dateISO), 'EEE d')} ${sessionText(session)}`.toUpperCase(), entries })
        }
      }
    }
    return rows
  }, [slotState, anaesthetists, anaesthetistId, todayISO])

  const summaryLine = `${longDayNoYear(todayISO)} · ${plural(daySummary.lists, 'list')} today · ${plural(daySummary.bookings, 'booking')}${daySummary.awaiting > 0 ? ` · ${daySummary.awaiting} awaiting submission` : ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <PageHeader
        size="web"
        wrap
        title={`Kia ora, ${greetingName}`}
        sub={summaryLine}
        actions={
          <Button
            variant="primary"
            size="desktop"
            shot="dashboard-move-list"
            onClick={() => setPicking(true)}
            disabled={!canMove}
            {...(movableLists.length === 0 ? { title: 'No upcoming Lists to move' } : {})}
          >
            Move a List
          </Button>
        }
      />

      <Overlay open={picking} onClose={() => setPicking(false)}>
        <div data-shot="dashboard-move-picker" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 460, maxWidth: '100%' }}>
          <div>
            <OverlayHeader title="Which List?" />
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>Your Lists in the next six days. Choose one to move it back to the office or to a colleague.</div>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', border: `1px solid ${neutral.line}`, borderRadius: radius.card, overflow: 'hidden' }}>
            {movableLists.map((l, i) => (
              <li key={l.id} style={{ display: 'flex' }}>
              <button
                type="button"
                onClick={() => {
                  setPicking(false)
                  movePrompt?.openMove(l.id)
                }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: 'none', borderTop: i === 0 ? 'none' : `1px solid ${neutral.sunken}`, background: neutral.surface, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
              >
                <span className="mono" style={{ width: 92, fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>{shortDay(l.dateISO)} {sessionText(l.session)}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: neutral.ink }}>{locationName(l.hospitalId, masters.hospitals)}</span>
                <span style={{ fontSize: 13, color: neutral.slate }}>{masters.surgeons[l.surgeonId]?.name ?? ''}</span>
              </button>
              </li>
            ))}
          </ul>
        </div>
      </Overlay>

      <WeekStrip
        anaesthetistId={anaesthetistId}
        weekAnchorISO={weekAnchorISO}
        todayISO={todayISO}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onOpenList={onOpenList}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
        {/* Financial position (catch-up Phase 38; US-12.2.3 with US-08.3.5) */}
        <Card
          padding="panel"
          title="Financial position"
          shot="web-financial-position"
          action={
            nothingBilled ? undefined : (
              <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
                {formatCurrency(position.owedToThem)} owed
              </span>
            )
          }
          // Its own height, not Who's free's: a long free list would leave the panel mostly empty.
          style={{ gridColumn: 'span 7', alignSelf: 'start' }}
        >
          {nothingBilled ? (
            <EmptyState style={{ padding: '4px 0' }}>No billed work yet.</EmptyState>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <StatTile variant="quiet" label={POSITION_LABEL.owedToThem} value={formatCurrency(position.owedToThem)} />
                <StatTile variant="quiet" label={POSITION_LABEL.collected} value={formatCurrency(position.collected)} />
                <StatTile variant="quiet" label={POSITION_LABEL.paidOut} value={formatCurrency(position.paidOut)} />
              </div>
              <div style={{ fontSize: 12, color: neutral.mist }}>
                To date, from the Billing Engine&apos;s ledger. New invoices appear as soon as the office authorises a List.
              </div>
              <div style={{ fontSize: 13, color: neutral.slate, borderTop: `1px solid ${neutral.sunken}`, paddingTop: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 6, rowGap: 4 }}>
                <span>{plural(unpaidCount, 'unpaid invoice')}</span>
                <span aria-hidden>·</span>
                <span><span className="mono">{formatCurrency(position.awaitingCollection)}</span> {POSITION_LABEL.awaitingCollection.toLowerCase()}</span>
                <span aria-hidden>·</span>
                <span><span className="mono">{formatCurrency(position.dueNow)}</span> {POSITION_LABEL.dueNow.toLowerCase()}</span>
                <span aria-hidden>·</span>
                <TextAction size="sm" flush onClick={onViewOutstanding} style={{ fontSize: 13 }}>View outstanding invoices</TextAction>
                <span aria-hidden>·</span>
                <TextAction size="sm" flush onClick={onViewPayments} style={{ fontSize: 13 }}>View payments</TextAction>
              </div>
            </>
          )}
        </Card>

        {/* Who's free (live) */}
        <Card
          padding="panel"
          title="Who's free · next 5 days"
          action={<TextAction size="sm" flush onClick={onOpenAvailability} style={{ fontSize: 13 }}>Full availability grid →</TextAction>}
          style={{ gridColumn: 'span 5' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {locumRows.length === 0 && <EmptyState style={{ padding: '4px 0' }}>No free sessions in the next 5 days.</EmptyState>}
            {locumRows.map((row, i) => (
              <div
                key={row.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '11px 4px',
                  borderBottom: i < locumRows.length - 1 ? `1px solid ${neutral.sunken}` : 'none',
                }}
              >
                <span className="mono" style={{ width: 84, fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>{row.label}</span>
                <span style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {row.entries.map((e) => {
                    // Her List that session can move straight into this colleague's free session.
                    const mine = moveTargets.get(sessionKey(e.slot.dateISO, e.slot.session))
                    const canMove = mine !== undefined && mine.targetSlotIds.has(e.slot.id) && movePrompt !== null
                    const chip = {
                      padding: '5px 11px',
                      borderRadius: radius.pill,
                      border: 'none',
                      background: openVisual.tint,
                      fontFamily: 'inherit',
                      fontSize: 12,
                      fontWeight: 600,
                      color: openVisual.onTint,
                    } as const
                    return canMove ? (
                      <button
                        key={e.slot.id}
                        type="button"
                        data-shot={`dashboard-move-to-${e.slot.anaesthetistId}`}
                        onClick={() => movePrompt.openMove(mine.list.id, { toSlotId: e.slot.id })}
                        title={`Move your ${sessionText(e.slot.session)} List to ${e.name}${e.phone !== '' ? ` · ${e.phone}` : ''}`}
                        style={{ ...chip, cursor: 'pointer' }}
                      >
                        {drSurname(e.name)}
                      </button>
                    ) : (
                      <span key={e.slot.id} title="You have no List in this session" style={chip}>
                        {drSurname(e.name)}
                      </span>
                    )
                  })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

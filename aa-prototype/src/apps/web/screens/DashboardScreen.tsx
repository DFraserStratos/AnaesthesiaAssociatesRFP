import { useMemo, useState } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { accent, neutral, semantic } from '../../../theme/tokens'
import { STATUS_PALETTE } from '../../../theme/statusColours'
import type { Session, Slot } from '../../../domain/types'
import { type AgingBucketKey } from '../../../domain/seed'
import { openSlotViews, receivablesAgingFor, useAppStore } from '../../../store'
import { drSurname, formatCurrency } from '../../../shared/format'
import { useDefaultStatus, useSurface } from '../../../shared'
import { sessionKey, useMovableLists, useMoveListPrompt, useMoveTargets } from '../../../shared/flows'
import { locationName } from '../../../shared/format'
import { Panel, WeekStrip } from '../components'
import { useDashboardFigures } from '../useDashboardFigures'

interface DashboardScreenProps {
  anaesthetistId: string
  personaName: string
  todayISO: string
  weekAnchorISO: string
  onPrevWeek: () => void
  onNextWeek: () => void
  onOpenList: (listId: string) => void
  onViewOverdue: () => void
  onOpenAvailability: () => void
}

const AGING_ROWS: { key: AgingBucketKey; label: string; color: string; opacity: number }[] = [
  { key: 'current', label: 'Current', color: accent.base, opacity: 1 },
  { key: 'd31_60', label: '31 to 60 d', color: accent.base, opacity: 0.55 },
  { key: 'd61_90', label: '61 to 90 d', color: STATUS_PALETTE.preop.solid, opacity: 1 },
  { key: 'd90plus', label: '90 d +', color: semantic.error.solid, opacity: 1 },
]

/**
 * The anaesthetist web dashboard (Web Dashboard mockup is authoritative; W1).
 * Five panels over seeded figures + live schedule: welcome + day summary,
 * the week strip, receivables aging, productivity, leave, and the
 * live "who's free" locum panel. Receivables + productivity + leave are seeded
 * demo figures (Phase 10 replaces receivables); "who's free" is live so the
 * names can differ from the mockup (Discovered-for-later note).
 */
export function DashboardScreen({
  anaesthetistId,
  personaName,
  todayISO,
  weekAnchorISO,
  onPrevWeek,
  onNextWeek,
  onOpenList,
  onViewOverdue,
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

  const figures = useDashboardFigures(anaesthetistId)
  // Receivables aging now derives from the billing mirror (Phase 10; W1/W4).
  const receivables = useMemo(
    () => receivablesAgingFor({ billing, schedule, masters }, anaesthetistId, todayISO),
    [billing, schedule, masters, anaesthetistId, todayISO],
  )

  // The mockup greets by surname ("Kia ora, Dr Souter"); mobile does the same.
  const greetingName = drSurname(personaName)

  // Day summary: today's Lists (a session holding a List counts as booked) +
  // active bookings + lists ready to submit.
  const daySummary = useMemo(() => {
    const booked = Object.values(listsRecord).filter(
      (l) => l.anaesthetistId === anaesthetistId && l.dateISO === todayISO && l.billedAtISO === undefined,
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
      for (const session of ['AM', 'PM'] as Session[]) {
        const entries = openSlotViews(slotState, dateISO, session)
          .filter((v) => v.slot.anaesthetistId !== anaesthetistId)
          .map(({ slot }) => {
            const a = anaesthetists[slot.anaesthetistId]
            return { name: a?.name ?? 'Anaesthetist', phone: a?.phone ?? '', slot }
          })
          .sort((a, b) => a.name.localeCompare(b.name))
        if (entries.length > 0) {
          rows.push({ key: `${dateISO}-${session}`, label: `${format(parseISO(dateISO), 'EEE d')} ${session}`.toUpperCase(), entries })
        }
      }
    }
    return rows
  }, [slotState, anaesthetists, anaesthetistId, todayISO])

  const summaryLine = `${format(parseISO(todayISO), 'EEEE d MMMM')} · ${daySummary.lists} ${daySummary.lists === 1 ? 'list' : 'lists'} today · ${daySummary.bookings} ${daySummary.bookings === 1 ? 'booking' : 'bookings'}${daySummary.awaiting > 0 ? ` · ${daySummary.awaiting} awaiting submission` : ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>
            Kia ora, {greetingName}
          </h1>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 4 }}>{summaryLine}</div>
        </div>
        <button
          type="button"
          data-shot="dashboard-move-list"
          onClick={() => setPicking(true)}
          disabled={!canMove}
          title={movableLists.length === 0 ? 'No upcoming Lists to move' : undefined}
          style={{
            height: 42,
            padding: '0 20px',
            borderRadius: 12,
            border: 'none',
            background: canMove ? accent.base : neutral.line,
            color: canMove ? neutral.surface : neutral.mist,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 600,
            cursor: canMove ? 'pointer' : 'default',
          }}
        >
          Move a List
        </button>
      </div>

      <Overlay open={picking} onClose={() => setPicking(false)}>
        <div data-shot="dashboard-move-picker" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 460, maxWidth: '100%' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Which List?</div>
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>Your Lists in the next six days. Choose one to move it back to the office or to a colleague.</div>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', border: `1px solid ${neutral.line}`, borderRadius: 14, overflow: 'hidden' }}>
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
                <span className="mono" style={{ width: 92, fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>{format(parseISO(l.dateISO), 'EEE d MMM')} {l.session}</span>
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
        {/* Receivables */}
        <Panel
          title="Receivables aging"
          action={
            <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
              {receivables.aging.total > 0 ? `${formatCurrency(receivables.aging.total)} outstanding` : ''}
            </span>
          }
          style={{ gridColumn: 'span 7' }}
        >
          {receivables.rows.length === 0 ? (
            <EmptyNote>No outstanding accounts. Receivables appear here once billed work goes unpaid.</EmptyNote>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {AGING_ROWS.map((r) => {
                  const amount = receivables.aging[r.key]
                  const pct = receivables.aging.total > 0 ? Math.round((amount / receivables.aging.total) * 100) : 0
                  return (
                    <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 72, fontSize: 12, fontWeight: 600, color: neutral.slate }}>{r.label}</span>
                      <span style={{ flex: 1, height: 14, borderRadius: 99, background: neutral.sunken, overflow: 'hidden', display: 'block' }}>
                        <span style={{ display: 'block', height: '100%', borderRadius: 99, background: r.color, opacity: r.opacity, width: `${pct}%` }} />
                      </span>
                      <span className="mono" style={{ width: 72, textAlign: 'right', fontSize: 12 }}>{formatCurrency(amount)}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 13, color: neutral.slate, borderTop: `1px solid ${neutral.sunken}`, paddingTop: 12 }}>
                {receivables.accountsOver60} {receivables.accountsOver60 === 1 ? 'account' : 'accounts'} over 60 days ·{' '}
                <LinkButton onClick={onViewOverdue}>view overdue accounts</LinkButton>
              </div>
            </>
          )}
        </Panel>

        {/* Productivity */}
        <Panel
          title="Productivity"
          action={<span style={{ fontSize: 12, color: neutral.mist }}>{figures?.productivity.periodLabel}</span>}
          style={{ gridColumn: 'span 5' }}
        >
          {figures === undefined ? (
            <EmptyNote>No productivity history yet.</EmptyNote>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <StatTile label="UNITS" value={String(figures.productivity.units)} pill={`+${figures.productivity.unitsChangePct}%`} />
                <StatTile label="LISTS" value={String(figures.productivity.lists)} />
                <StatTile label="AVG UNITS / LIST" value={figures.productivity.avgUnitsPerList.toFixed(1)} />
                <StatTile label="FEES INVOICED" value={formatCurrency(figures.productivity.feesInvoiced)} />
              </div>
              <div style={{ fontSize: 12, color: neutral.slate, borderTop: `1px solid ${neutral.sunken}`, paddingTop: 10 }}>
                6 months: <strong className="mono">{figures.productivity.sixMonthUnits.toLocaleString('en-NZ')}</strong> units ·{' '}
                {(() => {
                  const p = figures.productivity
                  const delta = p.sixMonthPriorYearUnits > 0
                    ? Math.round(((p.sixMonthUnits - p.sixMonthPriorYearUnits) / p.sixMonthPriorYearUnits) * 100)
                    : 0
                  return (
                    <span style={{ color: delta >= 0 ? semantic.success.onTint : semantic.error.onTint, fontWeight: 600 }}>
                      {delta >= 0 ? '+' : ''}{delta}%
                    </span>
                  )
                })()}{' '}
                vs last year
              </div>
            </>
          )}
        </Panel>

        {/* Leave */}
        <Panel title="Leave" style={{ gridColumn: 'span 5' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {figures !== undefined && figures.leave.length > 0 ? (
              figures.leave.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: neutral.bg, borderRadius: 10 }}>
                  <span style={{ width: 4, height: 34, borderRadius: 99, background: STATUS_PALETTE.holiday.solid, flex: 'none' }} />
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{leaveRange(l.fromISO, l.toISO)}</span>
                    <span style={{ fontSize: 12, color: neutral.slate }}>{l.label}</span>
                  </span>
                  {l.status === 'approved' ? (
                    <span style={{ padding: '4px 10px', borderRadius: 999, background: semantic.success.tint, fontSize: 11, fontWeight: 600, color: semantic.success.onTint }}>Approved</span>
                  ) : (
                    <span style={{ padding: '4px 10px', borderRadius: 999, background: semantic.warning.tint, fontSize: 11, fontWeight: 600, color: semantic.warning.onTint }}>Pending</span>
                  )}
                </div>
              ))
            ) : (
              <EmptyNote>No leave booked.</EmptyNote>
            )}
          </div>
        </Panel>

        {/* Who's free (live) */}
        <Panel
          title="Who's free · next 5 days"
          action={<LinkButton onClick={onOpenAvailability}>Full availability grid →</LinkButton>}
          style={{ gridColumn: 'span 7' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {locumRows.length === 0 && <EmptyNote>No free sessions in the next 5 days.</EmptyNote>}
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
                      borderRadius: 999,
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
                        title={`Move your ${e.slot.session} List to ${e.name}${e.phone !== '' ? ` · ${e.phone}` : ''}`}
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
        </Panel>
      </div>
    </div>
  )
}

function StatTile({ label, value, pill }: { label: string; value: string; pill?: string }) {
  return (
    <div style={{ background: neutral.bg, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{value}</span>
        {pill !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 600, color: semantic.success.onTint, background: semantic.success.tint, borderRadius: 999, padding: '2px 7px' }}>{pill}</span>
        )}
      </div>
    </div>
  )
}

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: accent.base, cursor: 'pointer' }}
    >
      {children}
    </button>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: neutral.mist, padding: '4px 0' }}>{children}</div>
}

function leaveRange(fromISO: string, toISO: string): string {
  const from = parseISO(fromISO)
  const to = parseISO(toISO)
  if (fromISO === toISO) return format(from, 'EEE d MMM')
  const sameMonth = format(from, 'MMM') === format(to, 'MMM')
  return sameMonth
    ? `${format(from, 'EEE d')} to ${format(to, 'EEE d MMM')}`
    : `${format(from, 'EEE d MMM')} to ${format(to, 'EEE d MMM')}`
}

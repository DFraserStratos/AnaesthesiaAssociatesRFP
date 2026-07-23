import { useMemo } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { accent, neutral, semantic } from '../../../theme/tokens'
import { statusColours } from '../../../theme/statusColours'
import type { List, Session } from '../../../domain/types'
import { type AgingBucketKey } from '../../../domain/seed'
import { useAppStore } from '../../../store'
import { formatCurrency } from '../../../shared/format'
import { Panel, WeekStrip } from '../components'
import { useDashboardFigures } from '../useDashboardFigures'
import type { CoverTarget } from '../types'

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
  onCover: (target: CoverTarget) => void
}

const AGING_ROWS: { key: AgingBucketKey; label: string; color: string; opacity: number }[] = [
  { key: 'current', label: 'Current', color: accent.base, opacity: 1 },
  { key: 'd31_60', label: '31 to 60 d', color: accent.base, opacity: 0.55 },
  { key: 'd61_90', label: '61 to 90 d', color: statusColours.preop.solid, opacity: 1 },
  { key: 'd90plus', label: '90 d +', color: semantic.error.solid, opacity: 1 },
]

/**
 * The anaesthetist web dashboard (Web Dashboard mockup is authoritative; W1).
 * Five panels over seeded figures + live schedule: welcome + day summary +
 * Offer cover, the week strip, receivables aging, productivity, leave, and the
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
  onCover,
}: DashboardScreenProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const cardsRecord = useAppStore((s) => s.schedule.cards)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)

  const figures = useDashboardFigures(anaesthetistId)

  // The mockup greets by surname ("Kia ora, Dr Souter").
  const surname = personaName.replace(/^Dr\s+/, '').split(' ').pop() ?? personaName

  // Day summary: today's booked lists + active cards + lists ready to submit.
  const daySummary = useMemo(() => {
    const todays = Object.values(listsRecord).filter(
      (l) => l.anaesthetistId === anaesthetistId && l.dateISO === todayISO && l.billedAtISO === undefined,
    )
    const booked = todays.filter((l) => l.statusKey === 'private' || l.statusKey === 'public' || l.statusKey === 'preop')
    let cards = 0
    let awaiting = 0
    for (const l of booked) {
      const active = Object.values(cardsRecord).filter((c) => c.listId === l.id && c.cancellation === undefined)
      cards += active.length
      if (l.state === 'DRAFT' && active.length > 0 && active.every((c) => c.completed)) awaiting += 1
    }
    return { lists: booked.length, cards, awaiting }
  }, [listsRecord, cardsRecord, anaesthetistId, todayISO])

  // Souter's own next free session, for the Offer cover button.
  const myFreeList = useMemo(
    () =>
      Object.values(listsRecord)
        .filter((l) => l.anaesthetistId === anaesthetistId && l.statusKey === 'free' && l.dateISO >= todayISO && l.coverRequest === undefined)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.session.localeCompare(b.session))[0],
    [listsRecord, anaesthetistId, todayISO],
  )

  // Who's free, next 5 days (live availability, not the mockup's names).
  const locumRows = useMemo(() => {
    const rows: { key: string; label: string; entries: { name: string; phone: string; list: List }[] }[] = []
    for (let i = 0; i < 5; i++) {
      const dateISO = format(addDays(parseISO(todayISO), i), 'yyyy-MM-dd')
      for (const session of ['AM', 'PM'] as Session[]) {
        const entries = Object.values(listsRecord)
          .filter((l) => l.dateISO === dateISO && l.session === session && l.statusKey === 'free' && l.anaesthetistId !== anaesthetistId)
          .map((list) => {
            const a = anaesthetists[list.anaesthetistId]
            return { name: a?.name ?? 'Anaesthetist', phone: a?.phone ?? '', list }
          })
          .sort((a, b) => a.name.localeCompare(b.name))
        if (entries.length > 0) {
          rows.push({ key: `${dateISO}-${session}`, label: `${format(parseISO(dateISO), 'EEE d')} ${session}`.toUpperCase(), entries })
        }
      }
    }
    return rows
  }, [listsRecord, anaesthetists, anaesthetistId, todayISO])

  function offerCover() {
    if (myFreeList === undefined) return
    onCover({
      listId: myFreeList.id,
      personName: personaName,
      slotLabel: `${format(parseISO(myFreeList.dateISO), 'EEE d MMM')} · ${myFreeList.session}`,
      kind: 'offer',
    })
  }

  function askCover(name: string, list: List) {
    // A pending request already exists — the chip/link is disabled, but guard
    // here too so this can never dead-end in the store's duplicate refusal.
    if (list.coverRequest !== undefined) return
    onCover({
      listId: list.id,
      personName: name,
      slotLabel: `${format(parseISO(list.dateISO), 'EEE d MMM')} · ${list.session}`,
      kind: 'request',
      targetAnaesthetistId: list.anaesthetistId,
    })
  }

  const summaryLine = `${format(parseISO(todayISO), 'EEEE d MMMM')} · ${daySummary.lists} ${daySummary.lists === 1 ? 'list' : 'lists'} today · ${daySummary.cards} ${daySummary.cards === 1 ? 'card' : 'cards'}${daySummary.awaiting > 0 ? ` · ${daySummary.awaiting} awaiting submission` : ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>
            Kia ora, Dr {surname}
          </h1>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 4 }}>{summaryLine}</div>
        </div>
        <button
          type="button"
          onClick={offerCover}
          disabled={myFreeList === undefined}
          title={myFreeList === undefined ? 'No free session to offer' : undefined}
          style={{
            height: 42,
            padding: '0 20px',
            borderRadius: 12,
            border: 'none',
            background: myFreeList === undefined ? neutral.line : accent.base,
            color: myFreeList === undefined ? neutral.mist : neutral.surface,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 600,
            cursor: myFreeList === undefined ? 'default' : 'pointer',
          }}
        >
          Offer cover
        </button>
      </div>

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
              {figures !== undefined ? `${formatCurrency(figures.aging.total)} outstanding` : ''}
            </span>
          }
          style={{ gridColumn: 'span 7' }}
        >
          {figures === undefined ? (
            <EmptyNote>No billed work yet. Receivables appear once billing runs (Phase 10).</EmptyNote>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {AGING_ROWS.map((r) => {
                  const amount = figures.aging[r.key]
                  const pct = figures.aging.total > 0 ? Math.round((amount / figures.aging.total) * 100) : 0
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
                {figures.accountsOver60} {figures.accountsOver60 === 1 ? 'account' : 'accounts'} over 60 days ·{' '}
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
                  <span style={{ width: 4, height: 34, borderRadius: 99, background: statusColours.holiday.solid, flex: 'none' }} />
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
          <button
            type="button"
            title="Visual stub · leave requests are a later phase"
            style={{ height: 40, borderRadius: 10, border: `1px solid ${accent.base}`, background: neutral.surface, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 'auto' }}
          >
            Request leave
          </button>
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
                    const requested = e.list.coverRequest !== undefined
                    return (
                      <button
                        key={e.list.id}
                        type="button"
                        disabled={requested}
                        onClick={() => askCover(e.name, e.list)}
                        title={requested ? 'Cover already requested' : `Ask ${e.name} to cover${e.phone !== '' ? ` · ${e.phone}` : ''}`}
                        style={{
                          padding: '5px 11px',
                          borderRadius: 999,
                          border: 'none',
                          background: statusColours.free.tint,
                          fontFamily: 'inherit',
                          fontSize: 12,
                          fontWeight: 600,
                          color: statusColours.free.onTint,
                          cursor: requested ? 'default' : 'pointer',
                          opacity: requested ? 0.7 : 1,
                        }}
                      >
                        {e.name}
                        {requested ? ' ✓' : ''}
                      </button>
                    )
                  })}
                </span>
                {row.entries.some((e) => e.list.coverRequest === undefined) && (
                  <LinkButton
                    onClick={() => {
                      const first = row.entries.find((e) => e.list.coverRequest === undefined)
                      if (first !== undefined) askCover(first.name, first.list)
                    }}
                  >
                    Ask to cover
                  </LinkButton>
                )}
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

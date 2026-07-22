import { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { accent, neutral } from '../../../theme/tokens'
import type { Card, List } from '../../../domain/types'
import { isListBilled, useAppStore, useToday } from '../../../store'
import { ListRow, MobileHeader, type ListRowRight } from '../components'
import { dayHeading, sessionStart } from '../format'

type Filter = 'week' | 'month' | 'todo' | 'done'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'todo', label: 'To-Do' },
  { key: 'done', label: 'Done' },
]

interface Row {
  list: List
  variant: 'default' | 'free' | 'holiday'
  session?: string
  time?: string
  title: string
  subtitle?: string
  right: ListRowRight
  onClick?: () => void
}

interface ForwardListsScreenProps {
  anaesthetistId: string
  personaName: string
  initials: string
  onOpenList: (listId: string) => void
  onOfferCover: (listId: string) => void
}

export function ForwardListsScreen({ anaesthetistId, personaName, initials, onOpenList, onOfferCover }: ForwardListsScreenProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const cardsRecord = useAppStore((s) => s.schedule.cards)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const todayISO = useToday()
  const [filter, setFilter] = useState<Filter>('week')

  const firstName = personaName.replace(/^Dr\s+/, '').split(' ')[0] ?? personaName

  const sections = useMemo(() => {
    const cardsByList = new Map<string, Card[]>()
    for (const c of Object.values(cardsRecord)) {
      const arr = cardsByList.get(c.listId)
      if (arr === undefined) cardsByList.set(c.listId, [c])
      else arr.push(c)
    }

    const weekEnd = format(addDays(parseISO(todayISO), 7), 'yyyy-MM-dd')
    const monthEnd = format(addDays(parseISO(todayISO), 31), 'yyyy-MM-dd')

    // Billed lists vanish from every forward view (M10): the billing run's
    // billedAtISO stamp keys the disappearance, not AUTHORISED — Phase 08
    // drives the stamp.
    const mine = Object.values(listsRecord).filter(
      (l) => l.anaesthetistId === anaesthetistId && !isListBilled(l),
    )

    function activeCards(listId: string): Card[] {
      return (cardsByList.get(listId) ?? []).filter((c) => c.cancellation === undefined)
    }

    function inWindow(l: List): boolean {
      if (filter === 'todo') {
        return l.state === 'DRAFT' && activeCards(l.id).some((c) => !c.completed)
      }
      // Done = submitted or authorised and still unbilled (an authorised list
      // is still unbilled until Phase 08's run stamps it).
      if (filter === 'done') return l.state === 'SUBMITTED' || l.state === 'AUTHORISED'
      if (l.dateISO < todayISO) return false
      return filter === 'week' ? l.dateISO <= weekEnd : l.dateISO <= monthEnd
    }

    function surgeonLine(l: List): string {
      const parts: string[] = []
      const surgeon = l.surgeonId !== undefined ? surgeons[l.surgeonId] : undefined
      if (surgeon !== undefined) {
        parts.push(surgeon.name)
        if (surgeon.specialty !== undefined) parts.push(surgeon.specialty)
      } else if (l.notes !== undefined) {
        parts.push(l.notes)
      }
      return parts.join(' · ')
    }

    function toRow(l: List): Row | null {
      // Holiday leave row.
      if (l.statusKey === 'holiday') {
        return {
          list: l,
          variant: 'holiday',
          title: l.notes ?? 'On leave',
          subtitle: 'On leave',
          right: { kind: 'chip', statusKey: 'holiday', label: 'Holiday' },
        }
      }
      // Free session row → offer cover (or a pending marker).
      if (l.statusKey === 'free') {
        const pending = l.coverRequest !== undefined
        return {
          list: l,
          variant: 'free',
          session: l.session,
          time: l.startTime,
          title: 'Free session',
          subtitle: pending ? 'Cover request sent' : 'Open for bookings or cover',
          right: pending
            ? { kind: 'custom', node: <span style={{ fontSize: 12, fontWeight: 600, color: accent.pressed }}>Requested</span> }
            : { kind: 'offerCover' },
          onClick: pending ? undefined : () => onOfferCover(l.id),
        }
      }
      // Unavailable collapses out of the schedule.
      if (l.statusKey === 'unavailable') return null

      // Booked list (private / public / preop).
      const active = activeCards(l.id)
      const total = active.length
      const done = active.filter((c) => c.completed).length
      const isPreop = l.statusKey === 'preop'
      const hospitalName = l.hospitalId !== undefined ? (hospitals[l.hospitalId]?.name ?? 'Hospital') : 'AA rooms'
      const title = isPreop ? 'Pre-op assessment' : hospitalName

      let right: ListRowRight
      let countInSubtitle = false
      if (l.state === 'SUBMITTED' || l.state === 'AUTHORISED' || (total > 0 && done === total)) {
        right = { kind: 'doneUnbilled' }
        countInSubtitle = true
      } else if (total > 0 && l.dateISO <= todayISO && done < total) {
        right = { kind: 'toFinish', count: total - done }
        countInSubtitle = true
      } else {
        right = { kind: 'count', count: total, statusKey: l.statusKey }
      }

      const base = isPreop ? 'AA rooms' : surgeonLine(l)
      const unit = isPreop ? 'appointments' : 'cards'
      const subtitle = countInSubtitle
        ? [base, `${total} ${total === 1 ? unit.replace(/s$/, '') : unit}`].filter(Boolean).join(' · ')
        : base || undefined

      return { list: l, variant: 'default', session: l.session, time: sessionStart(l), title, subtitle, right, onClick: () => onOpenList(l.id) }
    }

    const rows = mine.filter(inWindow).map(toRow).filter((r): r is Row => r !== null)

    // Group by date, then AM before PM within a date.
    const byDate = new Map<string, Row[]>()
    for (const r of rows) {
      const arr = byDate.get(r.list.dateISO)
      if (arr === undefined) byDate.set(r.list.dateISO, [r])
      else arr.push(r)
    }
    return [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, dayRows]) => ({
        date,
        rows: dayRows.sort((a, b) => a.list.session.localeCompare(b.list.session)),
      }))
  }, [listsRecord, cardsRecord, hospitals, surgeons, todayISO, filter, anaesthetistId, onOpenList, onOfferCover])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '64px 20px 0', flex: 'none' }}>
        <MobileHeader eyebrow={dayHeading(todayISO, todayISO)} title={`Kia ora, Dr ${firstName}`} initials={initials} />
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '16px 20px 10px', flex: 'none' }}>
        {FILTERS.map((f) => {
          const active = f.key === filter
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                height: 38,
                padding: '0 16px',
                borderRadius: 999,
                border: active ? 'none' : `1px solid ${neutral.line}`,
                background: active ? accent.base : neutral.surface,
                color: active ? neutral.surface : neutral.slate,
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 116px' }}>
        {sections.length === 0 && (
          <div style={{ marginTop: 28, textAlign: 'center', color: neutral.mist, fontSize: 14 }}>
            {filter === 'done'
              ? 'No submitted lists yet.'
              : filter === 'todo'
                ? 'Nothing left to finish.'
                : 'No lists in this window.'}
          </div>
        )}
        {sections.map((section) => (
          <div key={section.date}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: neutral.mist,
                margin: '18px 0 8px',
              }}
            >
              {dayHeading(section.date, todayISO)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.rows.map((r) => (
                <ListRow
                  key={r.list.id}
                  statusKey={r.list.statusKey}
                  session={r.session}
                  time={r.time}
                  title={r.title}
                  subtitle={r.subtitle}
                  right={r.right}
                  variant={r.variant}
                  onClick={r.onClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

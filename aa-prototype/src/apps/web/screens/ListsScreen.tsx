import { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { neutral, radius } from '../../../theme/tokens'
import { statusColours } from '../../../theme/statusColours'
import type { List } from '../../../domain/types'
import { isListBilled, useAppStore } from '../../../store'
import { StatusChip, StatusLegend } from '../../../shared'
import { Panel } from '../components'

interface ListsScreenProps {
  anaesthetistId: string
  todayISO: string
  onOpenList: (listId: string) => void
}

interface Row {
  list: List
  description: string
  clickable: boolean
}

const dateInputStyle = {
  height: 38,
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.line}`,
  background: neutral.surface,
  padding: '0 12px',
  fontFamily: 'inherit',
  fontSize: 14,
  color: neutral.ink,
} as const

/**
 * The Lists table (W2). Date-ranged (default today +4 weeks), Souter's Lists,
 * the 2-per-day rhythm visible, colour-coded rows. From/To read the List's
 * ACTUAL start/end times (`startTime`/`endTime`, incl. office overrides), never
 * hardcoded session defaults. Billed Lists are filtered out (`isListBilled`).
 * A booked row drills into List detail.
 */
export function ListsScreen({ anaesthetistId, todayISO, onOpenList }: ListsScreenProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)

  const [fromISO, setFromISO] = useState(todayISO)
  const [toISO, setToISO] = useState(format(addDays(parseISO(todayISO), 28), 'yyyy-MM-dd'))

  const rows = useMemo(() => {
    function describe(l: List): string {
      if (l.statusKey === 'free') return l.notes ?? 'Free / open for cover'
      if (l.statusKey === 'holiday') return l.notes ?? 'Annual leave'
      if (l.statusKey === 'unavailable') return l.notes ?? 'Not available'
      if (l.statusKey === 'preop') return l.notes ?? 'Pre-op assessment clinic · AA rooms'
      const hospital = l.hospitalId !== undefined ? (hospitals[l.hospitalId]?.name ?? 'Hospital') : 'AA rooms'
      const surgeon = l.surgeonId !== undefined ? surgeons[l.surgeonId] : undefined
      const parts = [hospital, surgeon?.name, surgeon?.specialty].filter((p): p is string => p !== undefined && p !== '')
      return parts.join(' · ')
    }
    return Object.values(listsRecord)
      .filter(
        (l) =>
          l.anaesthetistId === anaesthetistId &&
          !isListBilled(l) &&
          // A cleared date input is unbounded (empty string), not "matches nothing".
          (fromISO === '' || l.dateISO >= fromISO) &&
          (toISO === '' || l.dateISO <= toISO),
      )
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.session.localeCompare(b.session))
      .map((list): Row => ({
        list,
        description: describe(list),
        clickable: list.statusKey === 'private' || list.statusKey === 'public' || list.statusKey === 'preop',
      }))
  }, [listsRecord, hospitals, surgeons, anaesthetistId, fromISO, toISO])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>Lists</h1>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 4 }}>Your Lists, two per day. From/To are the actual session times.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: neutral.slate }}>
            From
            <input type="date" value={fromISO} max={toISO} onChange={(e) => setFromISO(e.target.value)} style={dateInputStyle} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: neutral.slate }}>
            To
            <input type="date" value={toISO} min={fromISO} onChange={(e) => setToISO(e.target.value)} style={dateInputStyle} />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <StatusLegend variant="chips" />
      </div>

      <Panel flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
                <Th>Date</Th>
                <Th>Session</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Description</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px 20px', textAlign: 'center', color: neutral.mist }}>
                    No lists in this date range.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const c = statusColours[r.list.statusKey]
                return (
                  <tr
                    key={r.list.id}
                    onClick={r.clickable ? () => onOpenList(r.list.id) : undefined}
                    style={{
                      borderBottom: `1px solid ${neutral.sunken}`,
                      cursor: r.clickable ? 'pointer' : 'default',
                      background: r.list.dateISO === todayISO ? neutral.bg : neutral.surface,
                    }}
                  >
                    <Td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span aria-hidden style={{ width: 3, height: 20, borderRadius: 99, background: c.solid, flex: 'none' }} />
                        {format(parseISO(r.list.dateISO), 'EEE d MMM')}
                        {r.list.dateISO === todayISO && <span style={{ fontSize: 11, fontWeight: 600, color: neutral.mist }}>Today</span>}
                      </span>
                    </Td>
                    <Td mono>{r.list.session}</Td>
                    <Td mono>{r.list.startTime ?? '·'}</Td>
                    <Td mono>{r.list.endTime ?? '·'}</Td>
                    <Td>{r.description}</Td>
                    <Td><StatusChip status={r.list.statusKey} /></Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={mono === true ? 'mono' : undefined} style={{ padding: '12px 20px', color: neutral.ink, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
      {children}
    </td>
  )
}

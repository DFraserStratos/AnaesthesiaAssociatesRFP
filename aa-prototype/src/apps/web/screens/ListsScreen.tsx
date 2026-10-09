import { useMemo, useState } from 'react'
import { locationName } from '../../../shared/format'
import { addDays, format, parseISO } from 'date-fns'
import { neutral, radius } from '../../../theme/tokens'
import { isListBilled, slotViewsForAnaesthetist, useAppStore, type SlotView } from '../../../store'
import { emptySessionLine, resolveDisplayStatus, StatusChip, StatusLegend } from '../../../shared'
import { Panel } from '../components'

interface ListsScreenProps {
  anaesthetistId: string
  todayISO: string
  onOpenList: (listId: string) => void
}

interface Row {
  view: SlotView
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
 * The Lists table (W2). Date-ranged (default today +4 weeks), Souter's
 * sessions, the 2-per-day rhythm visible, colour-coded rows, from the same
 * Slot views every app reads (catch-up Phase 28): a session holding a List
 * shows the List (and drills into List detail), an empty one its status.
 * From/To are a List's session times (its own, or the settings default).
 * Billed Lists are filtered out (`isListBilled`).
 */
export function ListsScreen({ anaesthetistId, todayISO, onOpenList }: ListsScreenProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const slotsRecord = useAppStore((s) => s.schedule.slots)
  const appSettings = useAppStore((s) => s.appSettings)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)

  const [fromISO, setFromISO] = useState(todayISO)
  const [toISO, setToISO] = useState(format(addDays(parseISO(todayISO), 28), 'yyyy-MM-dd'))

  const rows = useMemo(() => {
    function describe(v: SlotView): string {
      const l = v.list
      if (l === undefined) return emptySessionLine(v.slot, v.open, slotStatuses)
      const location = locationName(l.hospitalId, hospitals)
      if (l.kind === 'preop') return l.notes ?? `Pre-op assessment clinic · ${location}`
      const hospital = location
      const surgeon = surgeons[l.surgeonId]
      const parts = [hospital, surgeon?.name, surgeon?.specialty].filter((p): p is string => p !== undefined && p !== '')
      return parts.join(' · ')
    }
    // A cleared date input is unbounded (empty string), not "matches nothing".
    return slotViewsForAnaesthetist(
      { schedule: { slots: slotsRecord, lists: listsRecord }, appSettings, masters: { slotStatuses } },
      anaesthetistId,
      fromISO === '' ? '0000-01-01' : fromISO,
      toISO === '' ? '9999-12-31' : toISO,
    )
      .filter((v) => v.list === undefined || !isListBilled(v.list))
      .map((view): Row => ({ view, description: describe(view), clickable: view.list !== undefined }))
  }, [listsRecord, slotsRecord, appSettings, slotStatuses, hospitals, surgeons, anaesthetistId, fromISO, toISO])

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
                const { slot, list, displayKey, times } = r.view
                const c = resolveDisplayStatus(displayKey, slotStatuses).visual
                const showTimes = list !== undefined || times.overridden
                return (
                  <tr
                    key={slot.id}
                    data-slot-id={slot.id}
                    onClick={list !== undefined ? () => onOpenList(list.id) : undefined}
                    style={{
                      borderBottom: `1px solid ${neutral.sunken}`,
                      cursor: r.clickable ? 'pointer' : 'default',
                      background: slot.dateISO === todayISO ? neutral.bg : neutral.surface,
                    }}
                  >
                    <Td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span aria-hidden style={{ width: 3, height: 20, borderRadius: 99, background: c.solid, flex: 'none' }} />
                        {format(parseISO(slot.dateISO), 'EEE d MMM')}
                        {slot.dateISO === todayISO && <span style={{ fontSize: 11, fontWeight: 600, color: neutral.mist }}>Today</span>}
                      </span>
                    </Td>
                    <Td mono>{slot.session}</Td>
                    <Td mono>{showTimes ? times.startTime : '·'}</Td>
                    <Td mono>{showTimes ? times.endTime : '·'}</Td>
                    <Td>{r.description}</Td>
                    <Td><StatusChip status={displayKey} /></Td>
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

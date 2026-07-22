import { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { accent, neutral, radius } from '../../../theme/tokens'
import { freeDashedBorder, statusColours, unavailableHatchTint, type StatusKey } from '../../../theme/statusColours'
import type { List, Session } from '../../../domain/types'
import { setAvailability, useAppStore, useToday, type Actor } from '../../../store'
import { MobileHeader } from '../components'
import { RequestCoverSheet } from '../flows/RequestCoverSheet'

interface AvailabilityScreenProps {
  actor: Actor
  anaesthetistId: string
  initials: string
}

interface CoverTarget {
  listId: string
  personName: string
  slotLabel: string
  kind: 'offer' | 'request'
  targetAnaesthetistId?: string
}

/** Cell visual per status (colleague cells show status only, never patient detail — A8). */
function cellStyle(statusKey: StatusKey): { bg: string; border: string; color: string } {
  const c = statusColours[statusKey]
  if (statusKey === 'free') return { bg: c.tint, border: freeDashedBorder, color: c.onTint }
  if (statusKey === 'unavailable') return { bg: unavailableHatchTint, border: `1px solid ${neutral.line}`, color: c.onTint }
  return { bg: c.tint, border: '1px solid transparent', color: c.onTint }
}

export function AvailabilityScreen({ actor, anaesthetistId, initials }: AvailabilityScreenProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const todayISO = useToday()

  const [selectedDate, setSelectedDate] = useState(todayISO)
  const [mode, setMode] = useState<'everyone' | 'free'>('everyone')
  const [cover, setCover] = useState<CoverTarget | null>(null)
  const [availResult, setAvailResult] = useState<string | null>(null)

  const days = useMemo(() => {
    const out: { dateISO: string; dow: string; date: string; hasFree: boolean }[] = []
    for (let i = 0; i < 6; i++) {
      const d = format(addDays(parseISO(todayISO), i), 'yyyy-MM-dd')
      const hasFree = Object.values(listsRecord).some((l) => l.dateISO === d && l.statusKey === 'free')
      out.push({ dateISO: d, dow: format(parseISO(d), 'EEE').toUpperCase(), date: format(parseISO(d), 'd'), hasFree })
    }
    return out
  }, [todayISO, listsRecord])

  const model = useMemo(() => {
    function slot(aid: string, session: Session): List | undefined {
      return Object.values(listsRecord).find((l) => l.anaesthetistId === aid && l.dateISO === selectedDate && l.session === session)
    }
    const rows = Object.values(anaesthetists)
      .filter((a) => a.registrationNumber !== anaesthetistId)
      .map((a) => ({ anaesthetist: a, am: slot(a.registrationNumber, 'AM'), pm: slot(a.registrationNumber, 'PM') }))
      .sort((x, y) => x.anaesthetist.name.localeCompare(y.anaesthetist.name))
    const freeCount = Object.values(listsRecord).filter((l) => l.dateISO === selectedDate && l.statusKey === 'free').length
    const mine = { am: slot(anaesthetistId, 'AM'), pm: slot(anaesthetistId, 'PM') }
    return { rows, freeCount, mine }
  }, [listsRecord, anaesthetists, selectedDate, anaesthetistId])

  const selLong = format(parseISO(selectedDate), 'EEE d MMM')

  function cellSubtitle(list: List | undefined): string {
    if (list === undefined) return ''
    if (list.statusKey === 'free') return 'Tap to ask'
    if (list.statusKey === 'holiday') return 'Leave'
    if (list.statusKey === 'unavailable') return 'Unavailable'
    const hospital = list.hospitalId !== undefined ? (hospitals[list.hospitalId]?.name ?? '') : 'AA rooms'
    const surgeon = list.surgeonId !== undefined ? (surgeons[list.surgeonId]?.name ?? '') : ''
    return [hospital, surgeon].filter(Boolean).join(' · ')
  }

  function cellTitle(list: List | undefined): string {
    if (list === undefined) return 'No session'
    if (list.statusKey === 'free') return 'Free'
    if (list.statusKey === 'holiday') return 'Leave'
    if (list.statusKey === 'unavailable') return 'Unavailable'
    return list.hospitalId !== undefined ? (hospitals[list.hospitalId]?.name ?? 'Booked') : 'Pre-op'
  }

  function openRequest(list: List, personName: string, session: Session) {
    setCover({
      listId: list.id,
      personName,
      slotLabel: `${selLong} · ${session}`,
      kind: 'request',
      targetAnaesthetistId: list.anaesthetistId,
    })
  }

  function setMine(session: Session, kind: 'available' | 'unavailable' | 'holiday') {
    const outcome = setAvailability(useAppStore, actor, anaesthetistId, selectedDate, session, kind)
    if (!outcome.ok) {
      setAvailResult(outcome.message)
      return
    }
    const r = outcome.value.reconciled
    setAvailResult(
      r === 'restatused'
        ? `${session} session updated on the canvas.`
        : r === 'conflictFlagged'
          ? `${session} has bookings; a conflict was flagged and the office notified.`
          : `${session} unchanged.`,
    )
  }

  const rowsToShow = mode === 'free' ? model.rows.filter((r) => r.am?.statusKey === 'free' || r.pm?.statusKey === 'free') : model.rows

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '64px 20px 0', flex: 'none' }}>
        <MobileHeader eyebrow="Find cover" title="Availability" initials={initials} />
      </div>

      {/* Date strip */}
      <div style={{ padding: '14px 20px 4px', flex: 'none' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          {days.map((d) => {
            const active = d.dateISO === selectedDate
            return (
              <button
                key={d.dateISO}
                onClick={() => { setSelectedDate(d.dateISO); setAvailResult(null) }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: '9px 0',
                  borderRadius: 12,
                  border: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  background: active ? accent.base : neutral.surface,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', color: active ? 'rgba(255,255,255,0.7)' : neutral.mist }}>{d.dow}</span>
                <span className="mono" style={{ fontSize: 17, fontWeight: 700, color: active ? neutral.surface : neutral.ink }}>{d.date}</span>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: d.hasFree ? (active ? '#8FE3B4' : statusColours.free.solid) : 'transparent' }} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Segmented */}
      <div style={{ padding: '12px 20px 6px', flex: 'none' }}>
        <div style={{ display: 'flex', background: neutral.sunken, borderRadius: 12, padding: 4, gap: 4 }}>
          {(['everyone', 'free'] as const).map((m) => {
            const active = m === mode
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{ flex: 1, height: 40, borderRadius: 9, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: active ? neutral.surface : 'transparent', color: active ? accent.base : neutral.slate, boxShadow: active ? '0 1px 3px rgba(23,35,32,0.15)' : 'none' }}
              >
                {m === 'everyone' ? 'Everyone' : 'Free only'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div style={{ padding: '6px 20px 2px', display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: statusColours.free.solid }} />
        <span style={{ fontSize: 13, color: neutral.slate }}>
          <span style={{ fontWeight: 700, color: statusColours.free.onTint }}>{model.freeCount} free sessions</span> on {selLong}
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 116px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* My availability */}
        <div style={{ background: neutral.surface, border: `1px solid ${accent.base}`, borderRadius: radius.card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: 999, background: '#F7E7EC', color: '#A91E3E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flex: 'none' }}>{initials}</span>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>My availability</span>
          </div>
          {(['AM', 'PM'] as const).map((session) => {
            const list = session === 'AM' ? model.mine.am : model.mine.pm
            const cs = list !== undefined ? cellStyle(list.statusKey) : { bg: neutral.sunken, border: `1px solid ${neutral.line}`, color: neutral.mist }
            return (
              <div key={session} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ width: 28, fontSize: 11, fontWeight: 600, color: neutral.mist }}>{session}</span>
                <span style={{ flex: 1, minWidth: 0, borderRadius: 10, padding: '8px 10px', background: cs.bg, border: cs.border, color: cs.color, fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cellTitle(list)}
                </span>
                <button onClick={() => setMine(session, 'available')} style={miniBtn(statusColours.free.solid)}>Free</button>
                <button onClick={() => setMine(session, 'unavailable')} style={miniBtn(neutral.slate)}>Block</button>
              </div>
            )
          })}
          {availResult !== null && <div style={{ fontSize: 12, color: accent.pressed }}>{availResult}</div>}
        </div>

        {rowsToShow.map((r) => {
          const anyFree = r.am?.statusKey === 'free' || r.pm?.statusKey === 'free'
          return (
            <div key={r.anaesthetist.registrationNumber} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 2px rgba(23,35,32,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 999, background: '#F7E7EC', color: '#A91E3E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flex: 'none' }}>
                  {r.anaesthetist.name.replace(/^Dr\s+/, '').split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.anaesthetist.name}</span>
                {anyFree && <span style={{ fontSize: 11, fontWeight: 600, color: statusColours.free.onTint, background: statusColours.free.tint, borderRadius: 999, padding: '3px 9px' }}>Free</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['AM', 'PM'] as const).map((session) => {
                  const list = session === 'AM' ? r.am : r.pm
                  const isFree = list?.statusKey === 'free'
                  const cs = list !== undefined ? cellStyle(list.statusKey) : { bg: neutral.sunken, border: `1px solid ${neutral.line}`, color: neutral.mist }
                  const pending = list?.coverRequest !== undefined
                  return (
                    <button
                      key={session}
                      onClick={isFree && list !== undefined && !pending ? () => openRequest(list, r.anaesthetist.name, session) : undefined}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, minHeight: 52, borderRadius: 10, padding: '8px 10px', textAlign: 'left', fontFamily: 'inherit', cursor: isFree && !pending ? 'pointer' : 'default', background: cs.bg, border: cs.border }}
                    >
                      <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: cs.color, opacity: 0.7, flex: 'none' }}>{session}</span>
                      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: cs.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cellTitle(list)}</span>
                        <span style={{ fontSize: 10.5, color: cs.color, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pending ? 'Cover requested' : cellSubtitle(list)}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        {rowsToShow.length === 0 && (
          <div style={{ marginTop: 20, textAlign: 'center', color: neutral.mist, fontSize: 14 }}>No free sessions on this day.</div>
        )}
      </div>

      {cover !== null && (
        <RequestCoverSheet
          open
          listId={cover.listId}
          actor={actor}
          kind={cover.kind}
          personName={cover.personName}
          slotLabel={cover.slotLabel}
          targetAnaesthetistId={cover.targetAnaesthetistId}
          onClose={() => setCover(null)}
          onSent={() => undefined}
        />
      )}
    </div>
  )
}

function miniBtn(color: string): React.CSSProperties {
  return {
    minHeight: 32,
    padding: '0 10px',
    borderRadius: 999,
    border: `1px solid ${color}55`,
    background: neutral.surface,
    color,
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    flex: 'none',
  }
}

import { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { accent, brand, neutral } from '../../../theme/tokens'
import { freeDashedBorder, statusColours, unavailableHatchTint } from '../../../theme/statusColours'
import type { List, Session } from '../../../domain/types'
import { useAppStore } from '../../../store'
import { StatusChip } from '../../../shared'
import { Panel } from '../components'
import type { CoverTarget } from '../types'

interface AvailabilityGridProps {
  anaesthetistId: string
  personaName: string
  todayISO: string
  onCover: (target: CoverTarget) => void
}

interface GridRow {
  anaesthetistId: string
  name: string
  initials: string
  am: List | undefined
  pm: List | undefined
  hasFree: boolean
}

function initialsOf(name: string): string {
  return name.replace(/^Dr\s+/, '').split(' ').map((w) => w[0]).slice(0, 2).join('')
}

/**
 * The all-anaesthetists availability grid (Web Availability mockup is
 * authoritative; W3) — the locum finder. Day nav + All / Free-only filters
 * (Free shows the count) + name search + inline six-status legend; a 220px name
 * column and AM/PM cell buttons (status bar + two lines). Free cells are dashed
 * with a "Book" affordance that flips to a solid green "Cover requested ✓" once
 * a request is sent (driven by `list.coverRequest`). Every read is session
 * status only (A8) — no card / patient detail leaks.
 */
export function AvailabilityGrid({ anaesthetistId, personaName, todayISO, onCover }: AvailabilityGridProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)

  const [selectedDate, setSelectedDate] = useState(todayISO)
  const [filter, setFilter] = useState<'all' | 'free'>('all')
  const [query, setQuery] = useState('')

  const { rows, freeCount } = useMemo(() => {
    function slot(aid: string, session: Session): List | undefined {
      return Object.values(listsRecord).find((l) => l.anaesthetistId === aid && l.dateISO === selectedDate && l.session === session)
    }
    const all: GridRow[] = Object.values(anaesthetists)
      .map((a) => {
        const am = slot(a.registrationNumber, 'AM')
        const pm = slot(a.registrationNumber, 'PM')
        return {
          anaesthetistId: a.registrationNumber,
          name: a.name,
          initials: initialsOf(a.name),
          am,
          pm,
          hasFree: am?.statusKey === 'free' || pm?.statusKey === 'free',
        }
      })
      .sort((x, y) => x.name.localeCompare(y.name))
    const count = all.reduce((n, r) => n + (r.am?.statusKey === 'free' ? 1 : 0) + (r.pm?.statusKey === 'free' ? 1 : 0), 0)
    return { rows: all, freeCount: count }
  }, [listsRecord, anaesthetists, selectedDate])

  const q = query.trim().toLowerCase()
  const visible = rows
    .filter((r) => (filter === 'free' ? r.hasFree : true))
    .filter((r) => q === '' || r.name.toLowerCase().includes(q))

  const selLong = format(parseISO(selectedDate), 'EEEE d MMMM')

  function cellLabels(list: List | undefined): { l1: string; l2: string } {
    if (list === undefined) return { l1: 'No session', l2: '' }
    if (list.statusKey === 'free') return { l1: list.coverRequest !== undefined ? 'Cover requested' : 'Free', l2: 'Open for booking' }
    if (list.statusKey === 'holiday') return { l1: 'Annual leave', l2: list.notes ?? '' }
    if (list.statusKey === 'unavailable') return { l1: 'Not available', l2: list.notes ?? '' }
    if (list.statusKey === 'preop') return { l1: 'Pre-op clinic', l2: 'AA rooms' }
    const hospital = list.hospitalId !== undefined ? (hospitals[list.hospitalId]?.name ?? 'Hospital') : 'AA rooms'
    const surgeon = list.surgeonId !== undefined ? (surgeons[list.surgeonId]?.name ?? '') : (list.notes ?? '')
    return { l1: hospital, l2: surgeon }
  }

  function clickCell(row: GridRow, list: List | undefined, session: Session) {
    if (list === undefined || list.statusKey !== 'free' || list.coverRequest !== undefined) return
    const isMine = list.anaesthetistId === anaesthetistId
    onCover({
      listId: list.id,
      personName: isMine ? personaName : row.name,
      slotLabel: `${format(parseISO(selectedDate), 'EEE d MMM')} · ${session}`,
      kind: isMine ? 'offer' : 'request',
      ...(isMine ? {} : { targetAnaesthetistId: list.anaesthetistId }),
    })
  }

  function shiftDay(delta: number) {
    setSelectedDate(format(addDays(parseISO(selectedDate), delta), 'yyyy-MM-dd'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>Availability</h1>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 4 }}>Find cover fast. Free sessions are clickable.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconBtn label="Previous day" onClick={() => shiftDay(-1)}><ChevronLeft size={16} aria-hidden /></IconBtn>
          <div style={{ height: 38, padding: '0 18px', borderRadius: 10, border: `1px solid ${neutral.line}`, background: neutral.surface, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 600 }}>{selLong}</div>
          <IconBtn label="Next day" onClick={() => shiftDay(1)}><ChevronRight size={16} aria-hidden /></IconBtn>
          <button
            type="button"
            onClick={() => setSelectedDate(todayISO)}
            style={{ height: 38, padding: '0 14px', borderRadius: 10, border: `1px solid ${accent.base}`, background: neutral.surface, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Today
          </button>
        </div>
      </div>

      {/* Filters + search + legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All anaesthetists</FilterChip>
          <FilterChip active={filter === 'free'} onClick={() => setFilter('free')}>Free only · {freeCount}</FilterChip>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <Search size={14} aria-hidden style={{ position: 'absolute', left: 10, color: neutral.mist }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name"
              style={{ height: 36, borderRadius: 999, border: `1px solid ${neutral.line}`, background: neutral.surface, padding: '0 14px 0 30px', fontFamily: 'inherit', fontSize: 13, color: neutral.ink, width: 160 }}
            />
          </div>
        </div>
        <StatusChipsLegend />
      </div>

      <Panel flush>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 720 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr', gap: '0 12px', padding: '10px 20px', borderBottom: `1px solid ${neutral.line}`, background: neutral.bg }}>
              <HeaderCell>Anaesthetist</HeaderCell>
              <HeaderCell>AM</HeaderCell>
              <HeaderCell>PM</HeaderCell>
            </div>
            {visible.length === 0 && (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: neutral.mist }}>No anaesthetists match.</div>
            )}
            {visible.map((row) => (
              <div key={row.anaesthetistId} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr', gap: '0 12px', alignItems: 'center', padding: '7px 20px', borderBottom: `1px solid ${neutral.sunken}` }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span aria-hidden style={{ width: 30, height: 30, borderRadius: 99, background: brand.tint, color: brand.base, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flex: 'none' }}>{row.initials}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.name}
                    {row.anaesthetistId === anaesthetistId && <span style={{ marginLeft: 6, fontSize: 11, color: neutral.mist }}>(you)</span>}
                  </span>
                </span>
                <Cell list={row.am} labels={cellLabels(row.am)} onClick={() => clickCell(row, row.am, 'AM')} />
                <Cell list={row.pm} labels={cellLabels(row.pm)} onClick={() => clickCell(row, row.pm, 'PM')} />
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  )
}

function Cell({ list, labels, onClick }: { list: List | undefined; labels: { l1: string; l2: string }; onClick: () => void }) {
  if (list === undefined) {
    return <div style={{ height: 52, borderRadius: 9, background: neutral.sunken, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, color: neutral.mist }}>No session</div>
  }
  const c = statusColours[list.statusKey]
  const isFree = list.statusKey === 'free'
  const requested = list.coverRequest !== undefined
  const isUnavailable = list.statusKey === 'unavailable'
  const bg = isUnavailable ? unavailableHatchTint : isFree && requested ? statusColours.free.solid : c.tint
  const tc = isFree && requested ? neutral.surface : c.onTint
  const border = isFree ? (requested ? `1.5px solid ${statusColours.free.solid}` : freeDashedBorder) : '1.5px solid transparent'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isFree || requested}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 52,
        borderRadius: 9,
        padding: '0 10px',
        textAlign: 'left',
        fontFamily: 'inherit',
        cursor: isFree && !requested ? 'pointer' : 'default',
        background: bg,
        border,
        width: '100%',
      }}
    >
      {!isFree && <span aria-hidden style={{ width: 4, height: 34, borderRadius: 99, background: c.solid, flex: 'none' }} />}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: tc, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{labels.l1}</span>
        <span style={{ fontSize: 11, color: tc, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{labels.l2}</span>
      </span>
      {isFree && <span style={{ fontSize: 12, fontWeight: 600, color: tc, flex: 'none' }}>{requested ? '✓' : 'Book'}</span>}
    </button>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>{children}</span>
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.slate, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 36,
        padding: '0 16px',
        borderRadius: 999,
        border: `1px solid ${active ? accent.base : neutral.line}`,
        background: active ? accent.base : neutral.surface,
        color: active ? neutral.surface : neutral.slate,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function StatusChipsLegend() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(['private', 'public', 'preop', 'holiday', 'unavailable', 'free'] as const).map((k) => (
        <StatusChip key={k} status={k} />
      ))}
    </div>
  )
}

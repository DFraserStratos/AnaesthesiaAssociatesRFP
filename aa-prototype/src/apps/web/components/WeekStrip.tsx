import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { brand, neutral } from '../../../theme/tokens'
import { freeDashedBorder, statusColours } from '../../../theme/statusColours'
import type { List, Session } from '../../../domain/types'
import { isListBilled, useAppStore } from '../../../store'
import { sessionTimeRange, weekDays } from '../../../shared/format'
import { Panel } from './Panel'

interface WeekStripProps {
  anaesthetistId: string
  /** Any date in the week to show (Monday-anchored). */
  weekAnchorISO: string
  todayISO: string
  onPrevWeek: () => void
  onNextWeek: () => void
  onOpenList: (listId: string) => void
}

/**
 * The dashboard week strip (Web Dashboard mockup): 7 Monday-anchored columns,
 * each with the anaesthetist's AM/PM Lists colour-coded via `statusColours`.
 * Booked blocks show hospital / surgeon and the List's ACTUAL start/end times
 * (via `sessionTimeRange`, so office overrides show — D2 / reviewer steer); the
 * Free block is dashed; a full-day holiday merges AM+PM into one tall block;
 * today's column is outlined crimson. Blocks click through to List detail.
 */
export function WeekStrip({ anaesthetistId, weekAnchorISO, todayISO, onPrevWeek, onNextWeek, onOpenList }: WeekStripProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)

  const days = useMemo(() => weekDays(weekAnchorISO), [weekAnchorISO])

  function slotFor(dateISO: string, session: Session): List | undefined {
    // Billed lists vanish from the anaesthetist's forward views (M10), matching
    // mobile Forward Lists — so the week strip agrees once billing runs.
    return Object.values(listsRecord).find(
      (l) => l.anaesthetistId === anaesthetistId && l.dateISO === dateISO && l.session === session && !isListBilled(l),
    )
  }

  function labels(list: List): { l1: string; l2: string } {
    if (list.statusKey === 'free') return { l1: `Free · ${list.session}`, l2: list.notes ?? 'Open for cover' }
    if (list.statusKey === 'holiday') return { l1: list.notes ?? 'On leave', l2: 'Annual leave' }
    if (list.statusKey === 'unavailable') return { l1: 'Unavailable', l2: list.notes ?? '' }
    if (list.statusKey === 'preop') return { l1: 'Pre-op clinic', l2: 'AA rooms' }
    const hospital = list.hospitalId !== undefined ? (hospitals[list.hospitalId]?.name ?? 'Hospital') : 'AA rooms'
    const surgeon = list.surgeonId !== undefined ? (surgeons[list.surgeonId]?.name ?? '') : (list.notes ?? '')
    return { l1: hospital, l2: `${surgeon}${surgeon !== '' ? ' · ' : ''}${list.session}` }
  }

  return (
    <Panel
      title="This week"
      action={
        <div style={{ display: 'flex', gap: 6 }}>
          <WeekNavButton onClick={onPrevWeek} label="Previous week"><ChevronLeft size={16} aria-hidden /></WeekNavButton>
          <WeekNavButton onClick={onNextWeek} label="Next week"><ChevronRight size={16} aria-hidden /></WeekNavButton>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {days.map((dateISO) => {
          const isToday = dateISO === todayISO
          const am = slotFor(dateISO, 'AM')
          const pm = slotFor(dateISO, 'PM')
          const mergedHoliday = am?.statusKey === 'holiday' && pm?.statusKey === 'holiday'
          return (
            <div
              key={dateISO}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: isToday ? '3px 5px 5px' : 5,
                border: isToday ? `2px solid ${brand.base}` : '2px solid transparent',
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: isToday ? 700 : 600,
                  letterSpacing: '0.06em',
                  color: isToday ? brand.base : neutral.mist,
                  textAlign: 'center',
                }}
              >
                {format(parseISO(dateISO), 'EEE d').toUpperCase()}
              </div>
              {mergedHoliday && am !== undefined ? (
                <Block list={am} labels={labels(am)} onOpenList={onOpenList} tall />
              ) : (
                <>
                  <Block list={am} labels={am !== undefined ? labels(am) : undefined} onOpenList={onOpenList} />
                  <Block list={pm} labels={pm !== undefined ? labels(pm) : undefined} onOpenList={onOpenList} />
                </>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function WeekNavButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        border: `1px solid ${neutral.line}`,
        background: neutral.surface,
        color: neutral.slate,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

function Block({
  list,
  labels,
  onOpenList,
  tall,
}: {
  list: List | undefined
  labels?: { l1: string; l2: string }
  onOpenList: (listId: string) => void
  tall?: boolean
}) {
  const height = tall === true ? 110 : 52
  if (list === undefined || labels === undefined) {
    return <div style={{ height, borderRadius: 8, background: neutral.sunken }} aria-hidden />
  }
  const c = statusColours[list.statusKey]
  const isFree = list.statusKey === 'free'
  const bg = c.tint
  const timeRange = list.statusKey === 'holiday' || list.statusKey === 'unavailable' ? undefined : sessionTimeRange(list)
  return (
    <button
      type="button"
      onClick={() => onOpenList(list.id)}
      style={{
        height,
        borderRadius: 8,
        background: bg,
        border: isFree ? freeDashedBorder : 'none',
        borderLeft: isFree ? freeDashedBorder : `3px solid ${c.solid}`,
        padding: isFree ? '6px 8px' : '7px 9px',
        boxSizing: 'border-box',
        textAlign: 'left',
        fontFamily: 'inherit',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: c.onTint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {labels.l1}
      </span>
      <span style={{ fontSize: 10, color: c.onTint, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {labels.l2}
      </span>
      {timeRange !== undefined && (
        <span className="mono" style={{ fontSize: 9.5, color: c.onTint, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {timeRange}
        </span>
      )}
    </button>
  )
}

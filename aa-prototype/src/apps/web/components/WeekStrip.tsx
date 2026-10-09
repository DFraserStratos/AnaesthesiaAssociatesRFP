import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { brand, neutral } from '../../../theme/tokens'
import { resolveDisplayStatus, useDisplayStatus } from '../../../shared'
import type { Session } from '../../../domain/types'
import { isListBilled, slotViewsForAnaesthetist, useAppStore, type SlotView } from '../../../store'
import { slotTimeRange, weekDays, locationName } from '../../../shared/format'
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
 * each with the anaesthetist's AM/PM sessions colour-coded via the status master,
 * from the same Slot views every app reads (catch-up Phase 28). A session
 * holding a List shows the List (hospital / surgeon and its session times,
 * office overrides included) and clicks through to List detail; an empty
 * session shows its status: the Free block dashed, a full-day holiday merged
 * into one tall block. Today's pair is outlined crimson.
 */
export function WeekStrip({ anaesthetistId, weekAnchorISO, todayISO, onPrevWeek, onNextWeek, onOpenList }: WeekStripProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const slotsRecord = useAppStore((s) => s.schedule.slots)
  const appSettings = useAppStore((s) => s.appSettings)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)

  const days = useMemo(() => weekDays(weekAnchorISO), [weekAnchorISO])
  const views = useMemo(() => {
    const out = new Map<string, SlotView>()
    const first = days[0]
    const last = days[days.length - 1]
    if (first === undefined || last === undefined) return out
    for (const v of slotViewsForAnaesthetist({ schedule: { slots: slotsRecord, lists: listsRecord }, appSettings, masters: { slotStatuses } }, anaesthetistId, first, last)) {
      out.set(`${v.slot.dateISO}|${v.slot.session}`, v)
    }
    return out
  }, [days, slotsRecord, listsRecord, appSettings, slotStatuses, anaesthetistId])

  function slotFor(dateISO: string, session: Session): SlotView | undefined {
    // Billed lists vanish from the anaesthetist's forward views (M10), matching
    // mobile Forward Lists — so the week strip agrees once billing runs.
    const v = views.get(`${dateISO}|${session}`)
    return v?.list !== undefined && isListBilled(v.list) ? undefined : v
  }

  function labels(v: SlotView): { l1: string; l2: string } {
    const list = v.list
    if (list === undefined) {
      const status = resolveDisplayStatus(v.slot.status, slotStatuses)
      if (v.open) return { l1: `${status.label} · ${v.slot.session}`, l2: v.slot.note ?? 'Open for cover' }
      return { l1: status.longLabel, l2: v.slot.note ?? '' }
    }
    if (list.kind === 'preop') return { l1: 'Pre-op clinic', l2: locationName(list.hospitalId, hospitals) }
    const hospital = locationName(list.hospitalId, hospitals)
    // A public List keeps its template label ("Acute theatre"); a private one names its surgeon.
    const surgeon = list.kind !== 'private' && list.notes !== undefined ? list.notes : (surgeons[list.surgeonId]?.name ?? '')
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
          // A whole day under one closed status (a day off) reads as one tall block.
          const mergedHoliday =
            am !== undefined && pm !== undefined && am.list === undefined && pm.list === undefined && !am.open && am.slot.status === pm.slot.status
          return (
            <div
              key={dateISO}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
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
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: 5,
                  border: isToday ? `2px solid ${brand.base}` : '2px solid transparent',
                  borderRadius: 12,
                }}
              >
                {mergedHoliday && am !== undefined ? (
                  <Block view={am} labels={labels(am)} onOpenList={onOpenList} tall />
                ) : (
                  <>
                    <Block view={am} labels={am !== undefined ? labels(am) : undefined} onOpenList={onOpenList} />
                    <Block view={pm} labels={pm !== undefined ? labels(pm) : undefined} onOpenList={onOpenList} />
                  </>
                )}
              </div>
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
  view,
  labels,
  onOpenList,
  tall,
}: {
  view: SlotView | undefined
  labels?: { l1: string; l2: string }
  onOpenList: (listId: string) => void
  tall?: boolean
}) {
  const height = tall === true ? 110 : 52
  const resolved = useDisplayStatus(view?.displayKey ?? '')
  if (view === undefined || labels === undefined) {
    return <div style={{ height, borderRadius: 8, background: neutral.sunken }} aria-hidden />
  }
  const list = view.list
  const c = resolved.visual
  const isFree = c.treatment === 'dashed'
  const bg = c.tint
  const timeRange = list === undefined && !view.open ? undefined : slotTimeRange(view.times)
  // Only a List opens; an empty session has nothing to open.
  const Tag = list !== undefined ? 'button' : 'div'
  return (
    <Tag
      {...(list !== undefined ? { type: 'button' as const, onClick: () => onOpenList(list.id) } : {})}
      data-slot-id={view.slot.id}
      style={{
        height,
        borderRadius: 8,
        background: bg,
        border: isFree ? c.border : 'none',
        borderLeft: isFree ? c.border : `3px solid ${c.solid}`,
        padding: isFree ? '6px 8px' : '7px 9px',
        boxSizing: 'border-box',
        textAlign: 'left',
        fontFamily: 'inherit',
        cursor: list !== undefined ? 'pointer' : 'default',
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
    </Tag>
  )
}

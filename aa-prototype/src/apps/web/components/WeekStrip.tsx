import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { brand, neutral, radius } from '../../../theme/tokens'
import { blockFill, resolveDisplayStatus, useDisplayStatus } from '../../../shared'
import type { Session } from '../../../domain/types'
import { slotViewsForAnaesthetist, useAppStore, type SlotView } from '../../../store'
import { hasLeftMainView, LIST_PROGRESS_LABEL, listProgress } from '../../../domain/listProgress'
import { slotTimeRange, weekDays, locationName } from '../../../shared/format'
import { Card, Eyebrow, IconButton } from '../../../shared/ui'
import { sessionText } from '../../../domain/outOfHours'

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
 * into one tall block. Today's pair is outlined crimson. A submitted List keeps
 * its block, quieter, with the design's "✓" and "Done · unbilled" as part of its
 * accessible name; an authorised List has left the main view and its session
 * shows empty (catch-up Phase 38a, `hasLeftMainView`).
 */
export function WeekStrip({ anaesthetistId, weekAnchorISO, todayISO, onPrevWeek, onNextWeek, onOpenList }: WeekStripProps) {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const slotsRecord = useAppStore((s) => s.schedule.slots)
  const appSettings = useAppStore((s) => s.appSettings)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)

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
    // An authorised List has left the main view (catch-up Phase 38a), matching
    // the mobile main view and the web Lists table.
    const v = views.get(`${dateISO}|${session}`)
    return v?.list !== undefined && hasLeftMainView(v.list) ? undefined : v
  }

  /** Submitted with nothing left to finish: the design's ✓ (a reopened Booking reads To finish instead). */
  function submittedDone(v: SlotView | undefined): boolean {
    const list = v?.list
    if (list === undefined) return false
    const active = Object.values(bookingsRecord).filter((b) => b.listId === list.id && b.cancellation === undefined)
    return listProgress(list, active, todayISO) === 'submitted'
  }

  function labels(v: SlotView): { l1: string; l2: string } {
    const list = v.list
    if (list === undefined) {
      const status = resolveDisplayStatus(v.slot.status, slotStatuses)
      if (v.open) return { l1: `${status.label} · ${sessionText(v.slot.session)}`, l2: v.slot.note ?? 'Open for cover' }
      // A closed session: its label, then its note (Public, then "CPH"; catch-up Phase 32d), never List detail.
      return { l1: status.longLabel, l2: v.slot.note ?? '' }
    }
    if (list.kind === 'preop') return { l1: 'Pre-op clinic', l2: locationName(list.hospitalId, hospitals) }
    const hospital = locationName(list.hospitalId, hospitals)
    const surgeon = surgeons[list.surgeonId]?.name ?? ''
    return { l1: hospital, l2: `${surgeon}${surgeon !== '' ? ' · ' : ''}${sessionText(list.session)}` }
  }

  return (
    <Card
      padding="panel"
      title="This week"
      action={
        <div style={{ display: 'flex', gap: 6 }}>
          <IconButton size={32} onClick={onPrevWeek} label="Previous week">‹</IconButton>
          <IconButton size={32} onClick={onNextWeek} label="Next week">›</IconButton>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {days.map((dateISO) => {
          const isToday = dateISO === todayISO
          const am = slotFor(dateISO, 'AM')
          const pm = slotFor(dateISO, 'PM')
          const ooh = slotFor(dateISO, 'OOH')
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
              <Eyebrow tone={isToday ? 'brand' : 'mist'} style={{ textAlign: 'center' }}>
                {format(parseISO(dateISO), 'EEE d').toUpperCase()}
              </Eyebrow>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: 5,
                  border: isToday ? `2px solid ${brand.base}` : '2px solid transparent',
                  borderRadius: radius.md,
                }}
              >
                {mergedHoliday && am !== undefined ? (
                  <Block view={am} labels={labels(am)} onOpenList={onOpenList} submitted={submittedDone(am)} tall />
                ) : (
                  <>
                    <Block view={am} labels={am !== undefined ? labels(am) : undefined} onOpenList={onOpenList} submitted={submittedDone(am)} />
                    <Block view={pm} labels={pm !== undefined ? labels(pm) : undefined} onOpenList={onOpenList} submitted={submittedDone(pm)} />
                  </>
                )}
                {/* An opened out-of-hours session, after PM (catch-up Phase 32c). */}
                {ooh !== undefined && <Block view={ooh} labels={labels(ooh)} onOpenList={onOpenList} submitted={submittedDone(ooh)} />}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function Block({
  view,
  labels,
  onOpenList,
  tall,
  submitted = false,
}: {
  view: SlotView | undefined
  labels?: { l1: string; l2: string }
  onOpenList: (listId: string) => void
  tall?: boolean
  /** Submitted with every Booking complete (`listProgress`): quieter, with the ✓. */
  submitted?: boolean
}) {
  const height = tall === true ? 110 : 52
  const resolved = useDisplayStatus(view?.displayKey ?? '')
  if (view === undefined || labels === undefined) {
    return <div style={{ height, borderRadius: radius.sm, background: neutral.sunken }} aria-hidden />
  }
  const list = view.list
  const c = resolved.visual
  const isFree = c.treatment === 'dashed'
  // The fill through the one rule (UI unification U6, bug 7): the hatch for a hatched status, the
  // dashed outline for Free; the strip keeps its own bar, radius and size.
  const fill = blockFill(c)
  const timeRange = list === undefined && !view.open ? undefined : slotTimeRange(view.times)
  // Only a List opens; an empty session has nothing to open.
  const Tag = list !== undefined ? 'button' : 'div'
  return (
    <Tag
      {...(list !== undefined ? { type: 'button' as const, onClick: () => onOpenList(list.id) } : {})}
      data-slot-id={view.slot.id}
      {...(submitted ? { 'data-progress': 'submitted', 'aria-label': `${labels.l1}, ${labels.l2}, ${LIST_PROGRESS_LABEL.submitted}` } : {})}
      style={{
        height,
        opacity: submitted ? 0.72 : 1,
        borderRadius: radius.sm,
        background: fill.background,
        border: isFree ? fill.border : 'none',
        borderLeft: isFree ? fill.border : `3px solid ${c.solid}`,
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
        {submitted && <span aria-hidden> ✓</span>}
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

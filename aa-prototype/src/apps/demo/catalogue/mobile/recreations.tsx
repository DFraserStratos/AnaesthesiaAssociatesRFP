/**
 * Faithful static recreations of Mobile components that are local to a screen
 * file (not exported), so the catalogue can show them without editing the
 * screens. Markup and styles are copied from the named source; only the data
 * and handlers are local. Each row that uses one says "Recreated: local to ...".
 */

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, CircleDollarSign, LayoutGrid, List as ListIcon, Lock, MoreHorizontal, Repeat, RefreshCw, Share, SquarePlus, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { accent, brand, elevation, neutral, radius, semantic } from '../../../../theme/tokens'
import { motion } from '../../../../theme/motion'
import { STATUS_PALETTE } from '../../../../theme/statusColours'
import type { DisplayKey } from '../../../../domain/types'
import type { SlotStatusRecords } from '../../../../domain/slotStatus'
import { sessionText } from '../../../../domain/outOfHours'
import {
  isOpenSlotView,
  outstandingAccpayInvoicesFor,
  receivablesAgingFor,
  rosterForDate,
  slotViewsForDate,
  useAppStore,
  useToday,
  type CalendarSession,
  type SlotView,
} from '../../../../store'
import { Avatar, blockFill, resolveDisplayStatus, useDefaultStatus, useDisplayStatus, useSlotStatusRecords } from '../../../../shared'
import { AttentionDot } from '../../../../shared/warnings/AttentionDot'
import { TickBadge } from '../../../../shared/ui'
import {
  describeDayForScreenReaders,
  monthCells,
  monthOf,
  shiftMonth,
  useAvailabilityBounds,
  useAvailabilityMonth,
  WEEKDAY_INITIALS,
} from '../../../../shared/availability'
import { formatCurrency, locationName } from '../../../../shared/format'

// ---------------------------------------------------------------------------
// MobileApp.tsx: BottomTabBar
// ---------------------------------------------------------------------------

type Tab = 'lists' | 'availability' | 'balances' | 'more'
const TABS: readonly { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: 'lists', label: 'Lists', icon: ListIcon },
  { key: 'availability', label: 'Availability', icon: LayoutGrid },
  { key: 'balances', label: 'Balances', icon: CircleDollarSign },
  { key: 'more', label: 'More', icon: MoreHorizontal },
]

export function BottomTabBarCopy({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        paddingTop: 10,
        paddingLeft: 8,
        paddingRight: 8,
        paddingBottom: 'max(calc(var(--aa-inset-bottom, 34px) - 8px), 10px)',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(14px)',
        borderTop: `1px solid ${neutral.line}`,
      }}
    >
      {TABS.map((tab) => {
        const on = tab.key === active
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '4px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: on ? accent.base : neutral.mist,
            }}
          >
            <Icon size={22} strokeWidth={2} aria-hidden />
            <span style={{ fontSize: 11, fontWeight: 600 }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ForwardListsScreen.tsx: the filter chips and DayHeading
// ---------------------------------------------------------------------------

export type Filter = 'week' | 'month' | 'todo' | 'done'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'todo', label: 'To-Do' },
  { key: 'done', label: 'Done' },
]

export function FilterChipsCopy({ filter, onChange }: { filter: Filter; onChange: (f: Filter) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 38 }}>
      {FILTERS.map((f) => {
        const active = f.key === filter
        return (
          <button
            key={f.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(f.key)}
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
  )
}

// ---------------------------------------------------------------------------
// ListDetailScreen.tsx: the Booking card, the progress bar, the submit dock
// ---------------------------------------------------------------------------

export interface BookingCardData {
  time: string
  patientName: string
  nhi?: string
  operation: string
}

export type BookingCardState = 'capture' | 'done' | 'cancelled'

export function BookingCardCopy({ row, state, animateTick, onClick }: { row: BookingCardData; state: BookingCardState; animateTick: boolean; onClick: () => void }) {
  const cancelled = state === 'cancelled'
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: neutral.surface,
        border: `1px solid ${neutral.line}`,
        borderRadius: radius.card,
        fontFamily: 'inherit',
        textAlign: 'left',
        width: '100%',
        cursor: 'pointer',
        opacity: cancelled ? 0.6 : 1,
      }}
    >
      <span className="mono" style={{ width: 44, flex: 'none', fontSize: 12, fontWeight: 600, color: neutral.mist }}>
        {row.time}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span data-aa-selectable style={{ fontSize: 16, fontWeight: 600, textDecoration: cancelled ? 'line-through' : 'none' }}>
            {row.patientName}
          </span>
        </span>
        {row.nhi !== undefined && (
          <span className="mono" style={{ fontSize: 11, color: neutral.mist }}>
            {row.nhi}
          </span>
        )}
        <span style={{ fontSize: 13, color: neutral.slate }}>{row.operation}</span>
      </span>
      {cancelled ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: semantic.error.onTint, flex: 'none' }}>Cancelled</span>
      ) : state === 'done' ? (
        <TickBadge size={28} animate={animateTick} />
      ) : (
        <span style={{ padding: '9px 16px', borderRadius: 999, background: accent.tint, fontSize: 13, fontWeight: 600, color: accent.pressed, flex: 'none' }}>Capture</span>
      )}
    </button>
  )
}

export function ProgressBarCopy({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 4px' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate, flex: 'none' }}>
        {done} of {total} complete
      </span>
      <span style={{ flex: 1, height: 6, borderRadius: 99, background: neutral.line, overflow: 'hidden', display: 'block' }}>
        <span style={{ display: 'block', height: '100%', borderRadius: 99, background: semantic.success.solid, transition: 'width 300ms cubic-bezier(0.2,0.8,0.2,1)', width: `${pct}%` }} />
      </span>
    </div>
  )
}

export type DockState = 'toFinish' | 'ready' | 'submitted' | 'authorised'

export function SubmitDockCopy({ state, incomplete, onTap }: { state: DockState; incomplete: number; onTap: (what: 'blockers' | 'confirm') => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 14,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 'max(calc(var(--aa-inset-bottom, 34px) - 2px), 14px)',
        background: 'rgba(246,248,247,0.92)',
        backdropFilter: 'blur(14px)',
        borderTop: `1px solid ${neutral.line}`,
      }}
    >
      {state === 'authorised' ? (
        <div style={{ height: 54, borderRadius: radius.card, background: neutral.sunken, color: neutral.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 700 }}>
          <Lock size={17} strokeWidth={2.4} aria-hidden />
          Authorised · read only
        </div>
      ) : state === 'submitted' ? (
        <div
          style={{
            height: 54,
            borderRadius: radius.card,
            background: semantic.success.solid,
            color: neutral.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 17,
            fontWeight: 700,
            animation: `aa-tick-pop 340ms ${motion.completeTick.easing}`,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden>
            <path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" fill="none" stroke={neutral.surface} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Submitted to office
        </div>
      ) : state === 'toFinish' ? (
        <button
          type="button"
          onClick={() => onTap('blockers')}
          style={{
            height: 54,
            width: '100%',
            borderRadius: radius.card,
            border: 'none',
            background: neutral.line,
            color: neutral.mist,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            fontSize: 15,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: '18px',
            cursor: 'pointer',
          }}
        >
          <span>Mark list completed · {incomplete} to finish</span>
          <span style={{ fontSize: 11, fontWeight: 500 }}>Tap to see what is left</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onTap('confirm')}
          style={{
            height: 54,
            width: '100%',
            borderRadius: radius.card,
            border: 'none',
            background: accent.base,
            color: neutral.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            fontSize: 17,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: elevation.e2,
          }}
        >
          Mark list completed
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AvailabilityScreen.tsx: the 6-day date strip and the colleague cells
// ---------------------------------------------------------------------------

function useSlotState() {
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const slotsRecord = useAppStore((s) => s.schedule.slots)
  const appSettings = useAppStore((s) => s.appSettings)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  return useMemo(
    () => ({ schedule: { slots: slotsRecord, lists: listsRecord }, appSettings, masters: { slotStatuses } }),
    [slotsRecord, listsRecord, appSettings, slotStatuses],
  )
}

export function DateStripCopy({ selected, onSelect }: { selected: string; onSelect: (dateISO: string) => void }) {
  const todayISO = useToday()
  const slotState = useSlotState()
  const { visual: openVisual } = useDefaultStatus()
  const days = useMemo(() => {
    const out: { dateISO: string; dow: string; date: string; hasFree: boolean }[] = []
    for (let i = 0; i < 6; i++) {
      const d = format(addDays(parseISO(todayISO), i), 'yyyy-MM-dd')
      const hasFree = slotViewsForDate(slotState, d).some(isOpenSlotView)
      out.push({ dateISO: d, dow: format(parseISO(d), 'EEE').toUpperCase(), date: format(parseISO(d), 'd'), hasFree })
    }
    return out
  }, [todayISO, slotState])
  return (
    <div style={{ display: 'flex', gap: 7 }}>
      {days.map((d) => {
        const active = d.dateISO === selected
        return (
          <button
            key={d.dateISO}
            data-date={d.dateISO}
            aria-pressed={active}
            onClick={() => onSelect(d.dateISO)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 0', borderRadius: 12, border: 'none', fontFamily: 'inherit', cursor: 'pointer', background: active ? accent.base : neutral.surface }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', color: active ? 'rgba(255,255,255,0.7)' : neutral.mist }}>{d.dow}</span>
            <span className="mono" style={{ fontSize: 17, fontWeight: 700, color: active ? neutral.surface : neutral.ink }}>{d.date}</span>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: d.hasFree ? (active ? '#8FE3B4' : openVisual.solid) : 'transparent' }} />
          </button>
        )
      })}
    </div>
  )
}

function cellStyle(key: DisplayKey, statuses: SlotStatusRecords): { bg: string; border: string; color: string } {
  const c = resolveDisplayStatus(key, statuses).visual
  if (c.border !== undefined) return { bg: c.blockBackground, border: c.border, color: c.onTint }
  if (c.treatment === 'hatched') return { bg: c.blockBackground, border: `1px solid ${neutral.line}`, color: c.onTint }
  return { bg: c.tint, border: '1px solid transparent', color: c.onTint }
}

/** Colleague cards with AM / PM cells for one day. `moveTargets` turns open cells into the "Tap to move your List here" buttons. */
export function ColleagueCellsCopy({ dateISO, excludeId, limit, moveTargets, onMoveHere }: { dateISO: string; excludeId: string; limit: number; moveTargets: boolean; onMoveHere: (line: string) => void }) {
  const slotState = useSlotState()
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const slotStatuses = slotState.masters.slotStatuses
  const { visual: openVisual, label: openLabel } = useDefaultStatus()
  const rows = useMemo(() => {
    const views = slotViewsForDate(slotState, dateISO)
    const slot = (aid: string, session: string): SlotView | undefined => views.find((v) => v.slot.anaesthetistId === aid && v.slot.session === session)
    return rosterForDate({ schedule: slotState.schedule, masters: { anaesthetists } }, dateISO)
      .filter((a) => a.registrationNumber !== excludeId)
      .map((a) => ({ anaesthetist: a, am: slot(a.registrationNumber, 'AM'), pm: slot(a.registrationNumber, 'PM') }))
      .sort((x, y) => {
        // Show colleagues with something free first, so the open-cell treatment is in view.
        const fx = isFree(x.am) || isFree(x.pm) ? 0 : 1
        const fy = isFree(y.am) || isFree(y.pm) ? 0 : 1
        return fx - fy || x.anaesthetist.name.localeCompare(y.anaesthetist.name)
      })
      .slice(0, limit)
  }, [slotState, anaesthetists, dateISO, excludeId, limit])

  function cellTitle(view: SlotView | undefined): string {
    if (view === undefined) return 'No session'
    const list = view.list
    if (list === undefined) return resolveDisplayStatus(view.slot.status, slotStatuses).label
    return list.kind === 'preop' ? 'Pre-op' : locationName(list.hospitalId, hospitals)
  }
  function cellSubtitle(view: SlotView | undefined): string {
    if (view === undefined) return ''
    const list = view.list
    if (list === undefined) return view.open ? 'Open for bookings' : (view.slot.note ?? resolveDisplayStatus(view.slot.status, slotStatuses).longLabel)
    return [locationName(list.hospitalId, hospitals), surgeons[list.surgeonId]?.name ?? ''].filter(Boolean).join(' · ')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r) => {
        const anyFree = isFree(r.am) || isFree(r.pm)
        return (
          <div key={r.anaesthetist.registrationNumber} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 2px rgba(23,35,32,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={r.anaesthetist.name} size={34} variant="tint" />
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.anaesthetist.name}</span>
              {anyFree && <span style={{ fontSize: 11, fontWeight: 600, color: openVisual.onTint, background: openVisual.tint, borderRadius: 999, padding: '3px 9px' }}>{openLabel}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['AM', 'PM'] as const).map((session) => {
                const view = session === 'AM' ? r.am : r.pm
                const cs = view !== undefined ? cellStyle(view.displayKey, slotStatuses) : { bg: neutral.sunken, border: `1px solid ${neutral.line}`, color: neutral.mist }
                const canReceive = moveTargets && isFree(view)
                const Tag = canReceive ? 'button' : 'div'
                return (
                  <Tag
                    key={session}
                    {...(canReceive ? { type: 'button' as const, onClick: () => onMoveHere(`Would open the move sheet: your ${session} List to ${r.anaesthetist.name}.`) } : {})}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, minHeight: 52, borderRadius: 10, padding: '8px 10px', textAlign: 'left', fontFamily: 'inherit', cursor: canReceive ? 'pointer' : 'default', background: cs.bg, border: cs.border }}
                  >
                    <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: cs.color, opacity: 0.7, flex: 'none' }}>{sessionText(session)}</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: cs.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cellTitle(view)}</span>
                      <span style={{ fontSize: 10.5, color: cs.color, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{canReceive ? 'Tap to move your List here' : cellSubtitle(view)}</span>
                    </span>
                  </Tag>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const isFree = (v: SlotView | undefined) => v !== undefined && isOpenSlotView(v)

// ---------------------------------------------------------------------------
// MyAvailabilityCalendarScreen.tsx: the month grid, HalfBlock, MonthButton
// ---------------------------------------------------------------------------

export function HalfBlockCopy({ session }: { session: CalendarSession | undefined }) {
  const resolved = useDisplayStatus(session?.displayKey ?? '')
  if (session === undefined) return <span aria-hidden style={{ height: 18, borderRadius: 5, background: neutral.sunken }} />
  const v = resolved.visual
  const fill = blockFill(v)
  return (
    <span
      title={`${sessionText(session.session)} ${resolved.label}`}
      data-slot-id={session.slotId}
      style={{ position: 'relative', height: 18, borderRadius: 5, boxSizing: 'border-box', ...fill, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 2 }}
    >
      {session.series !== undefined && <Repeat size={9} strokeWidth={2.6} color={v.onTint} aria-hidden />}
      {session.conflict && (
        <AttentionDot style={{ position: 'absolute', top: -5, right: -5 }} />
      )}
    </span>
  )
}

function MonthButtonCopy({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{ width: 44, height: 44, borderRadius: 999, border: `1px solid ${neutral.line}`, background: neutral.surface, color: disabled ? neutral.lineStrong : accent.pressed, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer' }}
    >
      {children}
    </button>
  )
}

/** The My calendar month: heading with prev / next, the weekday row, and the day buttons of two HalfBlocks each. */
export function MyCalendarGridCopy({ anaesthetistId, onOpenDay }: { anaesthetistId: string; onOpenDay: (dateISO: string) => void }) {
  const { todayISO, horizonEndISO } = useAvailabilityBounds()
  const firstMonth = monthOf(todayISO)
  const lastMonth = monthOf(horizonEndISO)
  const [monthISO, setMonthISO] = useState(firstMonth)
  const month = monthISO < firstMonth ? firstMonth : monthISO > lastMonth ? lastMonth : monthISO
  const days = useAvailabilityMonth(anaesthetistId, month)
  const byDate = new Map(days.map((d) => [d.dateISO, d]))
  const cells = monthCells(month)
  const records = useSlotStatusRecords()
  const labelOf = (key: string) => resolveDisplayStatus(key, records).label
  const monthLabel = format(parseISO(`${month}-01`), 'MMMM yyyy')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>{monthLabel}</div>
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>My calendar · tap a day to change it</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <MonthButtonCopy label="Previous month" disabled={month <= firstMonth} onClick={() => setMonthISO(shiftMonth(month, -1))}>
            <ChevronLeft size={18} aria-hidden />
          </MonthButtonCopy>
          <MonthButtonCopy label="Next month" disabled={month >= lastMonth} onClick={() => setMonthISO(shiftMonth(month, 1))}>
            <ChevronRight size={18} aria-hidden />
          </MonthButtonCopy>
        </div>
      </div>
      <div>
        <div aria-hidden style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {WEEKDAY_INITIALS.map((d, i) => (
            <span key={i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 600, color: neutral.mist }}>{d}</span>
          ))}
        </div>
        <div aria-label={`${monthLabel}, your sessions`} role="group" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((dateISO, i) => {
            if (dateISO === null) return <span key={`pad-${i}`} aria-hidden />
            const day = byDate.get(dateISO)
            const past = dateISO < todayISO
            const isToday = dateISO === todayISO
            const hasSessions = day?.AM !== undefined || day?.PM !== undefined
            return (
              <button
                key={dateISO}
                type="button"
                aria-label={describeDayForScreenReaders(dateISO, day, labelOf, past)}
                aria-current={isToday ? 'date' : undefined}
                data-date={dateISO}
                disabled={past || !hasSessions}
                onClick={() => onOpenDay(dateISO)}
                style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 3, borderRadius: 10, border: isToday ? `1.5px solid ${brand.base}` : '1.5px solid transparent', background: neutral.surface, opacity: past ? 0.42 : 1, cursor: past || !hasSessions ? 'default' : 'pointer', fontFamily: 'inherit', minWidth: 0 }}
              >
                <span className="mono" style={{ fontSize: 11, lineHeight: '13px', fontWeight: isToday ? 700 : 600, color: isToday ? brand.base : neutral.slate, textAlign: 'left', paddingLeft: 2 }}>
                  {Number(dateISO.slice(8))}
                </span>
                <HalfBlockCopy session={day?.AM} />
                <HalfBlockCopy session={day?.PM} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BalancesScreen.tsx: the hero figure card, AgeChip, EmptyCard
// ---------------------------------------------------------------------------

export function HeroFigureCardCopy({ anaesthetistId }: { anaesthetistId: string }) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const todayISO = useToday()
  const outstanding = useMemo(() => outstandingAccpayInvoicesFor({ billing, schedule, masters }, anaesthetistId, todayISO), [billing, schedule, masters, anaesthetistId, todayISO])
  const aging = useMemo(() => receivablesAgingFor({ billing, schedule, masters }, anaesthetistId, todayISO).aging, [billing, schedule, masters, anaesthetistId, todayISO])
  return (
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ width: 44, height: 44, borderRadius: 999, background: neutral.sunken, display: 'flex', alignItems: 'center', justifyContent: 'center', color: neutral.slate, flex: 'none' }}>
        <CircleDollarSign size={22} strokeWidth={2} aria-hidden />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 12, color: neutral.slate }}>Outstanding to you</span>
        <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(aging.total)}</span>
        <span style={{ fontSize: 12, color: neutral.mist }}>{outstanding.length} unpaid invoice{outstanding.length === 1 ? '' : 's'}</span>
      </div>
    </div>
  )
}

export function AgeChipCopy({ days, accFunded }: { days: number; accFunded: boolean }) {
  const overdue = days > 60
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      {accFunded && <span style={{ fontSize: 10.5, fontWeight: 600, color: STATUS_PALETTE.preop.onTint, background: STATUS_PALETTE.preop.tint, borderRadius: 999, padding: '2px 8px' }}>ACC</span>}
      <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 9px', background: overdue ? semantic.warning.tint : neutral.sunken, color: overdue ? semantic.warning.onTint : neutral.slate }}>{days}d</span>
    </span>
  )
}

export function EmptyCardCopy({ children }: { children: ReactNode }) {
  return <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 16, padding: '20px', textAlign: 'center', fontSize: 13.5, color: neutral.mist }}>{children}</div>
}

// ---------------------------------------------------------------------------
// pwa/PwaDemoPanel.tsx: ToggleRow; pwa/UpdatePrompt.tsx; pwa/InstallCoach.tsx
// ---------------------------------------------------------------------------

export function ToggleRowCopy({ on, onChange, label }: { on: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 44, padding: 0, border: 'none', background: 'none', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
    >
      <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{label}</span>
      <span aria-hidden style={{ flex: 'none', width: 52, height: 32, padding: 3, borderRadius: radius.pill, background: on ? accent.base : neutral.lineStrong, display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', alignItems: 'center', transition: 'background 150ms cubic-bezier(0.2,0.8,0.2,1)' }}>
        <span style={{ display: 'block', width: 26, height: 26, borderRadius: radius.pill, background: neutral.surface }} />
      </span>
    </button>
  )
}

/** UpdatePrompt's live region and pill. `bottom` replaces the dock-height calc, which has no dock to clear here. */
export function UpdatePromptCopy({ needRefresh, onReload, bottom }: { needRefresh: boolean; onReload: () => void; bottom: number }) {
  return (
    <div role="status" aria-live="polite" style={{ position: 'absolute', left: 0, right: 0, bottom, zIndex: 60, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      {needRefresh && (
        <button
          type="button"
          onClick={onReload}
          style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 18px', borderRadius: radius.pill, border: 'none', background: accent.base, color: neutral.surface, boxShadow: elevation.e3, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', pointerEvents: 'auto' }}
        >
          <RefreshCw size={16} strokeWidth={2.2} aria-hidden />
          New version ready · Tap to reload
        </button>
      )}
    </div>
  )
}

export function InstallCoachCopy({ ios, canInstall, onDismiss, onInstall }: { ios: boolean; canInstall: boolean; onDismiss: () => void; onInstall: () => void }) {
  const dismissBtn: CSSProperties = { flex: 'none', width: 44, height: 44, margin: -12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', color: neutral.mist, cursor: 'pointer' }
  return (
    <div style={{ marginTop: 16, background: neutral.surface, border: `1px solid ${accent.base}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Add to your home screen</span>
        <button type="button" aria-label="Dismiss the install tip" onClick={onDismiss} style={dismissBtn}>
          <X size={18} strokeWidth={2.2} aria-hidden />
        </button>
      </div>
      {ios ? (
        <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Share size={16} strokeWidth={2} aria-hidden style={{ flex: 'none', color: accent.base }} />
            Tap Share in the browser toolbar
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SquarePlus size={16} strokeWidth={2} aria-hidden style={{ flex: 'none', color: accent.base }} />
            Choose Add to Home Screen
          </span>
          <span style={{ fontSize: 13, color: neutral.mist }}>It then opens full screen, with no browser bars, and works with no connection.</span>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>Install it and it opens full screen, with no browser bars, and works with no connection.</div>
          {canInstall ? (
            <button type="button" onClick={onInstall} style={{ minHeight: 44, borderRadius: radius.ctl, border: 'none', background: accent.base, color: neutral.surface, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Install
            </button>
          ) : (
            <div style={{ fontSize: 13, color: neutral.mist }}>You can install it from the browser menu: choose Install app, or Add to Home screen.</div>
          )}
        </>
      )}
    </div>
  )
}


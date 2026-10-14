import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Repeat } from 'lucide-react'
import { accent, brand, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor, CalendarSession } from '../../../store'
import { blockFill, DockSpacer, resolveDisplayStatus, StatusChip, useAnaesthetistStatusChoices, useDisplayStatus, useSlotStatusRecords } from '../../../shared'
import {
  describeDayForScreenReaders,
  monthCells,
  monthOf,
  SeriesList,
  shiftMonth,
  useAvailabilityBounds,
  useAvailabilityMonth,
  WEEKDAY_INITIALS,
} from '../../../shared/availability'

interface MyAvailabilityCalendarScreenProps {
  actor: Actor
  anaesthetistId: string
  onBack: () => void
  onOpenDay: (dateISO: string) => void
  onAddDaysOff: (fromISO: string) => void
}

/**
 * My calendar (catch-up Phase 29; US-01.2.1, US-01.5.3, US-15.0.2): the
 * anaesthetist's own AM and PM sessions as a month, weeks ahead to the
 * schedule horizon. Each day is a pair of half-blocks, AM over PM, in the
 * session's status (or the List in its place); a repeat glyph marks a series
 * instance and the amber "!" a List with a conflict for the office (a sickness
 * the office recorded, a hospital closure). Tapping
 * a day opens its bottom sheet; "Add days off" is the sticky thumb action.
 */
export function MyAvailabilityCalendarScreen({ actor, anaesthetistId, onBack, onOpenDay, onAddDaysOff }: MyAvailabilityCalendarScreenProps) {
  const { todayISO, horizonEndISO } = useAvailabilityBounds()
  const firstMonth = monthOf(todayISO)
  const lastMonth = monthOf(horizonEndISO)
  const [monthISO, setMonthISO] = useState(firstMonth)
  const month = monthISO < firstMonth ? firstMonth : monthISO > lastMonth ? lastMonth : monthISO
  const days = useAvailabilityMonth(anaesthetistId, month)
  const byDate = new Map(days.map((d) => [d.dateISO, d]))
  const cells = monthCells(month)
  const choices = useAnaesthetistStatusChoices()
  const records = useSlotStatusRecords()
  const labelOf = (key: string) => resolveDisplayStatus(key, records).label

  const addFrom = month === firstMonth ? todayISO : `${month}-01`

  return (
    <div data-shot="mobile-availability-calendar" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: 'calc(var(--aa-inset-top, 54px) + 6px) 20px 6px', flex: 'none' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44, border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          <ChevronLeft size={18} strokeWidth={2.4} aria-hidden />
          Availability
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>{format(parseISO(`${month}-01`), 'MMMM yyyy')}</div>
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>My calendar · tap a day to change it</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <MonthButton label="Previous month" disabled={month <= firstMonth} onClick={() => setMonthISO(shiftMonth(month, -1))}>
              <ChevronLeft size={18} aria-hidden />
            </MonthButton>
            <MonthButton label="Next month" disabled={month >= lastMonth} onClick={() => setMonthISO(shiftMonth(month, 1))}>
              <ChevronRight size={18} aria-hidden />
            </MonthButton>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div aria-hidden style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {WEEKDAY_INITIALS.map((d, i) => (
              <span key={i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 600, color: neutral.mist }}>{d}</span>
            ))}
          </div>
          <div data-shot="mobile-availability-grid" aria-label={`${format(parseISO(`${month}-01`), 'MMMM yyyy')}, your sessions`} role="group" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((dateISO, i) => {
              if (dateISO === null) return <span key={`pad-${i}`} aria-hidden />
              const day = byDate.get(dateISO)
              const past = dateISO < todayISO
              const isToday = dateISO === todayISO
              const hasSessions = day?.AM !== undefined || day?.PM !== undefined
              const label = describeDayForScreenReaders(dateISO, day, labelOf, past)
              return (
                <button
                  key={dateISO}
                  type="button"
                  aria-label={label}
                  aria-current={isToday ? 'date' : undefined}
                  data-date={dateISO}
                  disabled={past || !hasSessions}
                  onClick={() => onOpenDay(dateISO)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    padding: 3,
                    borderRadius: 10,
                    border: isToday ? `1.5px solid ${brand.base}` : '1.5px solid transparent',
                    background: neutral.surface,
                    opacity: past ? 0.42 : 1,
                    cursor: past || !hasSessions ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    minWidth: 0,
                  }}
                >
                  <span className="mono" style={{ fontSize: 11, lineHeight: '13px', fontWeight: isToday ? 700 : 600, color: isToday ? brand.base : neutral.slate, textAlign: 'left', paddingLeft: 2 }}>
                    {Number(dateISO.slice(8))}
                  </span>
                  <HalfBlock session={day?.AM} />
                  <HalfBlock session={day?.PM} />
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {choices.map((s) => <StatusChip key={s.key} status={s.key} label={s.longLabel} />)}
          </div>
          <div style={{ fontSize: 12, color: neutral.mist }}>A session holding a List shows the List in place of its status.</div>
        </div>

        <section aria-label="Your series" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Your series</div>
          <SeriesList actor={actor} anaesthetistId={anaesthetistId} shot="mobile-availability-series" emptyText="No repeating days off. Choose Repeat in Add days off to set one." />
        </section>

        <DockSpacer height="calc(var(--aa-inset-bottom, 34px) + 86px)" />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '14px 20px max(calc(var(--aa-inset-bottom, 34px) - 2px), 14px)',
          background: 'rgba(246,248,247,0.92)',
          backdropFilter: 'blur(14px)',
          borderTop: `1px solid ${neutral.line}`,
        }}
      >
        <button
          type="button"
          data-shot="mobile-add-days-off"
          onClick={() => onAddDaysOff(addFrom)}
          style={{ width: '100%', height: 54, borderRadius: radius.card, border: 'none', background: accent.base, color: neutral.surface, fontFamily: 'inherit', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
        >
          <Plus size={18} strokeWidth={2.4} aria-hidden />
          Add days off
        </button>
      </div>
    </div>
  )
}

/** One session's half-block: the status's fill (or the List's), with the repeat glyph and the amber flag. */
function HalfBlock({ session }: { session: CalendarSession | undefined }) {
  const resolved = useDisplayStatus(session?.displayKey ?? '')
  if (session === undefined) return <span aria-hidden style={{ height: 18, borderRadius: 5, background: neutral.sunken }} />
  const v = resolved.visual
  const fill = blockFill(v)
  return (
    <span
      title={`${session.session} ${resolved.label}`}
      data-slot-id={session.slotId}
      style={{
        position: 'relative',
        height: 18,
        borderRadius: 5,
        boxSizing: 'border-box',
        ...fill,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 2,
      }}
    >
      {session.series !== undefined && <Repeat size={9} strokeWidth={2.6} color={v.onTint} aria-hidden />}
      {session.conflict && (
        <span aria-hidden style={{ position: 'absolute', top: -4, right: -4, width: 11, height: 11, borderRadius: 99, background: semantic.warning.solid, color: neutral.surface, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>
      )}
    </span>
  )
}

function MonthButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
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


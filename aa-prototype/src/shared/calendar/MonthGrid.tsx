/**
 * A Monday-first month grid (catch-up Phase 38a): the anaesthetist's date
 * lookup on the phone, built on Phase 29's `monthCells`. Bounded (previous and
 * next stop at the bounds; days outside them are inert), with a month and year
 * jump (tap the title: a year stepper over twelve month chips), a Today button,
 * and the admin mini calendar's keyboard model: arrows by day and week, Home
 * and End within the week, Page Up and Page Down by month (with Shift, by
 * year), one roving tab stop. Every day is a real button with a readable
 * label. The caller renders each day's content (`renderDay`). PWA-safe.
 *
 * Teal is the only action colour here; today is marked in teal too, never
 * crimson (the date sheet carries no identity colour).
 */

import { useState, type CSSProperties, type ReactNode } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import { monthCells, monthOf, shiftMonth } from '../availability/monthCells'
import { clampToBounds, useCalendarKeys } from './useCalendarKeys'
import { MonthHeaderRow, MonthStepButton } from './MonthHeaderRow'

export interface MonthGridProps {
  /** The visible month, `yyyy-MM` (controlled). */
  monthISO: string
  onMonthChange: (monthISO: string) => void
  /** The first and last dates that can be picked. */
  bounds: { firstISO: string; lastISO: string }
  todayISO: string
  /** The accessible name of a day ("Friday 13 March 2026, 1 List"). */
  dayLabel: (dateISO: string) => string
  /** The day's content inside its button (the numeral and any marker). */
  renderDay: (dateISO: string, state: { today: boolean; inBounds: boolean }) => ReactNode
  onPickDay: (dateISO: string) => void
  /** The day the roving tab stop starts on (default: today, else the month's first day in bounds). */
  initialFocusISO?: string
}

export function MonthGrid({ monthISO, onMonthChange, bounds, todayISO, dayLabel, renderDay, onPickDay, initialFocusISO }: MonthGridProps) {
  const firstMonth = monthOf(bounds.firstISO)
  const lastMonth = monthOf(bounds.lastISO)
  const [focusISO, setFocusISO] = useState(() => clampToBounds(initialFocusISO ?? todayISO, bounds))
  const [picker, setPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(() => Number(monthISO.slice(0, 4)))
  // The shared calendar keyboard model (UI unification U4), clamped to the bounds.
  const keys = useCalendarKeys({ monthISO, bounds, focusISO, onFocusMove: setFocusISO, onMonthChange })

  const title = format(parseISO(`${monthISO}-01`), 'MMMM yyyy')
  const firstYear = Number(firstMonth.slice(0, 4))
  const lastYear = Number(lastMonth.slice(0, 4))
  const todayInBounds = todayISO >= bounds.firstISO && todayISO <= bounds.lastISO

  return (
    <div data-testid="month-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MonthStepButton label="Previous month" disabled={monthISO <= firstMonth} onClick={() => onMonthChange(shiftMonth(monthISO, -1))}>
          <ChevronLeft size={18} aria-hidden />
        </MonthStepButton>
        <button
          type="button"
          aria-expanded={picker}
          aria-label={`${title}. Choose a month and year`}
          onClick={() => {
            setPickerYear(Number(monthISO.slice(0, 4)))
            setPicker((p) => !p)
          }}
          style={{ flex: 1, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: 'none', background: 'none', padding: 0, fontFamily: 'inherit', fontSize: 17, fontWeight: 700, color: neutral.ink, cursor: 'pointer' }}
        >
          {title}
          {picker ? <ChevronUp size={16} aria-hidden color={accent.base} /> : <ChevronDown size={16} aria-hidden color={accent.base} />}
        </button>
        <MonthStepButton label="Next month" disabled={monthISO >= lastMonth} onClick={() => onMonthChange(shiftMonth(monthISO, 1))}>
          <ChevronRight size={18} aria-hidden />
        </MonthStepButton>
      </div>

      {picker ? (
        <div data-testid="month-grid-picker" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <MonthStepButton label="Previous year" disabled={pickerYear <= firstYear} onClick={() => setPickerYear((y) => y - 1)}>
              <ChevronLeft size={18} aria-hidden />
            </MonthStepButton>
            <span className="mono" aria-live="polite" style={{ fontSize: 17, fontWeight: 700, minWidth: 56, textAlign: 'center' }}>{pickerYear}</span>
            <MonthStepButton label="Next year" disabled={pickerYear >= lastYear} onClick={() => setPickerYear((y) => y + 1)}>
              <ChevronRight size={18} aria-hidden />
            </MonthStepButton>
          </div>
          <div role="group" aria-label={`Months of ${pickerYear}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const m = `${pickerYear}-${String(i + 1).padStart(2, '0')}`
              const enabled = m >= firstMonth && m <= lastMonth
              const current = m === monthISO
              return (
                <button
                  key={m}
                  type="button"
                  disabled={!enabled}
                  aria-pressed={current}
                  aria-label={format(parseISO(`${m}-01`), 'MMMM yyyy')}
                  onClick={() => {
                    onMonthChange(m)
                    setPicker(false)
                  }}
                  style={{
                    minHeight: 44,
                    borderRadius: radius.pill,
                    border: current ? 'none' : `1px solid ${neutral.line}`,
                    background: current ? accent.base : neutral.surface,
                    color: current ? neutral.surface : enabled ? neutral.slate : neutral.lineStrong,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: enabled ? 'pointer' : 'default',
                  }}
                >
                  {format(parseISO(`${m}-01`), 'MMM')}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div>
          <MonthHeaderRow />
          <div
            role="group"
            aria-label={`${title}. Arrow keys move by day or week, Home and End within a week, Page Up and Page Down by month, with Shift by year.`}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}
          >
            {monthCells(monthISO).map((dateISO, i) => {
              if (dateISO === null) return <span key={`pad-${i}`} aria-hidden />
              const inBounds = dateISO >= bounds.firstISO && dateISO <= bounds.lastISO
              const today = dateISO === todayISO
              const style: CSSProperties = {
                minHeight: 44,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: 0,
                borderRadius: radius.ctl,
                border: today ? `1.5px solid ${accent.base}` : '1.5px solid transparent',
                background: neutral.surface,
                opacity: inBounds ? 1 : 0.35,
                cursor: inBounds ? 'pointer' : 'default',
                fontFamily: 'inherit',
                minWidth: 0,
              }
              return (
                <button
                  key={dateISO}
                  {...keys.dayProps(dateISO)}
                  type="button"
                  data-date={dateISO}
                  aria-label={dayLabel(dateISO)}
                  aria-current={today ? 'date' : undefined}
                  disabled={!inBounds}
                  onClick={() => onPickDay(dateISO)}
                  style={style}
                >
                  {renderDay(dateISO, { today, inBounds })}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!todayInBounds}
        onClick={() => {
          setPicker(false)
          onMonthChange(monthOf(todayISO))
          setFocusISO(todayISO)
        }}
        style={{ alignSelf: 'center', minHeight: 44, padding: '0 18px', borderRadius: radius.pill, border: `1px solid ${accent.base}`, background: neutral.surface, color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        Today
      </button>
    </div>
  )
}

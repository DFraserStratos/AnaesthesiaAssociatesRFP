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

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { addDays, addMonths, addYears, format, getDay, parseISO } from 'date-fns'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import { monthCells, monthOf, shiftMonth, WEEKDAY_INITIALS } from '../availability/monthCells'

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

const KEYS = 'ArrowLeft ArrowRight ArrowUp ArrowDown Home End PageUp PageDown Shift+PageUp Shift+PageDown'

const iso = (d: Date): string => format(d, 'yyyy-MM-dd')

function clamp(dateISO: string, bounds: { firstISO: string; lastISO: string }): string {
  return dateISO < bounds.firstISO ? bounds.firstISO : dateISO > bounds.lastISO ? bounds.lastISO : dateISO
}

export function MonthGrid({ monthISO, onMonthChange, bounds, todayISO, dayLabel, renderDay, onPickDay, initialFocusISO }: MonthGridProps) {
  const firstMonth = monthOf(bounds.firstISO)
  const lastMonth = monthOf(bounds.lastISO)
  const [focusISO, setFocusISO] = useState(() => clamp(initialFocusISO ?? todayISO, bounds))
  const [picker, setPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(() => Number(monthISO.slice(0, 4)))
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const restoreFocus = useRef(false)

  // Keep the tab stop inside the visible month.
  const focusInMonth = monthOf(focusISO) === monthISO ? focusISO : clamp(`${monthISO}-01`, bounds)

  useEffect(() => {
    if (!restoreFocus.current) return
    dayRefs.current[focusInMonth]?.focus()
    restoreFocus.current = false
  }, [focusInMonth, monthISO])

  function moveFocus(next: string) {
    const target = clamp(next, bounds)
    // At a bound the key goes nowhere: leave the flag down, or a later month
    // click would pull focus back into the grid.
    if (target === focusInMonth) return
    restoreFocus.current = true
    setFocusISO(target)
    if (monthOf(target) !== monthISO) onMonthChange(monthOf(target))
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, dateISO: string) {
    const date = parseISO(dateISO)
    const mondayIndex = (getDay(date) + 6) % 7
    let next: Date
    switch (event.key) {
      case 'ArrowLeft': next = addDays(date, -1); break
      case 'ArrowRight': next = addDays(date, 1); break
      case 'ArrowUp': next = addDays(date, -7); break
      case 'ArrowDown': next = addDays(date, 7); break
      case 'Home': next = addDays(date, -mondayIndex); break
      case 'End': next = addDays(date, 6 - mondayIndex); break
      case 'PageUp': next = event.shiftKey ? addYears(date, -1) : addMonths(date, -1); break
      case 'PageDown': next = event.shiftKey ? addYears(date, 1) : addMonths(date, 1); break
      default: return
    }
    event.preventDefault()
    moveFocus(iso(next))
  }

  const title = format(parseISO(`${monthISO}-01`), 'MMMM yyyy')
  const firstYear = Number(firstMonth.slice(0, 4))
  const lastYear = Number(lastMonth.slice(0, 4))
  const todayInBounds = todayISO >= bounds.firstISO && todayISO <= bounds.lastISO

  return (
    <div data-testid="month-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <RoundButton label="Previous month" disabled={monthISO <= firstMonth} onClick={() => onMonthChange(shiftMonth(monthISO, -1))}>
          <ChevronLeft size={18} aria-hidden />
        </RoundButton>
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
        <RoundButton label="Next month" disabled={monthISO >= lastMonth} onClick={() => onMonthChange(shiftMonth(monthISO, 1))}>
          <ChevronRight size={18} aria-hidden />
        </RoundButton>
      </div>

      {picker ? (
        <div data-testid="month-grid-picker" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <RoundButton label="Previous year" disabled={pickerYear <= firstYear} onClick={() => setPickerYear((y) => y - 1)}>
              <ChevronLeft size={18} aria-hidden />
            </RoundButton>
            <span className="mono" aria-live="polite" style={{ fontSize: 17, fontWeight: 700, minWidth: 56, textAlign: 'center' }}>{pickerYear}</span>
            <RoundButton label="Next year" disabled={pickerYear >= lastYear} onClick={() => setPickerYear((y) => y + 1)}>
              <ChevronRight size={18} aria-hidden />
            </RoundButton>
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
          <div aria-hidden style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {WEEKDAY_INITIALS.map((d, i) => (
              <span key={i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 600, color: neutral.mist }}>{d}</span>
            ))}
          </div>
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
                  ref={(el) => {
                    dayRefs.current[dateISO] = el
                  }}
                  type="button"
                  data-date={dateISO}
                  aria-label={dayLabel(dateISO)}
                  aria-current={today ? 'date' : undefined}
                  aria-keyshortcuts={KEYS}
                  disabled={!inBounds}
                  tabIndex={dateISO === focusInMonth ? 0 : -1}
                  onFocus={() => setFocusISO(dateISO)}
                  onKeyDown={(e) => onKeyDown(e, dateISO)}
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

function RoundButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{ width: 44, height: 44, flex: 'none', borderRadius: radius.pill, border: `1px solid ${neutral.line}`, background: neutral.surface, color: disabled ? neutral.lineStrong : accent.pressed, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer' }}
    >
      {children}
    </button>
  )
}

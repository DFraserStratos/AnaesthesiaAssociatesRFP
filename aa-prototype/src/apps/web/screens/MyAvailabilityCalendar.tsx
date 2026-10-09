import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import { accent, brand, neutral, semantic } from '../../../theme/tokens'
import { useAppStore, type Actor, type CalendarSession } from '../../../store'
import { defaultSlotStatus } from '../../../domain/slotStatus'
import { blockFill, resolveDisplayStatus, StatusChip, useAnaesthetistStatusChoices, useDisplayStatus, useSlotStatusRecords } from '../../../shared'
import {
  AvailabilityEditor,
  describeDayForScreenReaders,
  monthCells,
  monthOf,
  SeriesList,
  shiftMonth,
  useAvailabilityBounds,
  useAvailabilityMonth,
  WEEKDAY_SHORT_NAMES,
} from '../../../shared/availability'
import { AvailabilityPageSwitch, Panel } from '../components'

interface MyAvailabilityCalendarProps {
  actor: Actor
  anaesthetistId: string
  /** `?date=`: the day to open on (from the Find cover grid's Change link). */
  initialDateISO?: string
}


/**
 * My availability on the web (catch-up Phase 29; US-03.1.4, US-01.5.3): the
 * same capability as the mobile calendar in a desktop layout. A month of the
 * anaesthetist's sessions, each day's AM and PM drawn with the Web
 * Availability cell anatomy; click a day, shift-click to extend to a range;
 * the right rail holds the same session panel and form the phone uses, then
 * "Your series" and the legend.
 */
export function MyAvailabilityCalendar({ actor, anaesthetistId, initialDateISO }: MyAvailabilityCalendarProps) {
  const { todayISO, horizonEndISO } = useAvailabilityBounds()
  const firstMonth = monthOf(todayISO)
  const lastMonth = monthOf(horizonEndISO)
  const openOn = initialDateISO !== undefined && initialDateISO >= todayISO && initialDateISO <= horizonEndISO ? initialDateISO : undefined
  const [monthISO, setMonthISO] = useState(openOn !== undefined ? monthOf(openOn) : firstMonth)
  const month = monthISO < firstMonth ? firstMonth : monthISO > lastMonth ? lastMonth : monthISO
  const [selection, setSelection] = useState<{ from: string; to: string } | null>(openOn !== undefined ? { from: openOn, to: openOn } : null)
  const days = useAvailabilityMonth(anaesthetistId, month)
  const byDate = new Map(days.map((d) => [d.dateISO, d]))
  const cells = monthCells(month)
  const choices = useAnaesthetistStatusChoices()
  const defaultLabel = useAppStore((s) => defaultSlotStatus(s.masters.slotStatuses).longLabel)
  const records = useSlotStatusRecords()
  const labelOf = (key: string) => resolveDisplayStatus(key, records).label
  // The shift-click anchor stays where the range began.
  const [anchor, setAnchor] = useState<string | null>(openOn ?? null)

  function pick(dateISO: string, extend: boolean) {
    if (extend && anchor !== null) {
      setSelection(dateISO < anchor ? { from: dateISO, to: anchor } : { from: anchor, to: dateISO })
    } else {
      setAnchor(dateISO)
      setSelection({ from: dateISO, to: dateISO })
    }
  }

  const inSelection = (d: string) => selection !== null && d >= selection.from && d <= selection.to

  return (
    <div data-shot="web-availability-mine" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>Availability</h1>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 4 }}>
            Mark days off weeks ahead, set repeating days off, and change or delete one occurrence. Every session is {defaultLabel} until you change it.
          </div>
        </div>
        <AvailabilityPageSwitch current="mine" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20, alignItems: 'start' }}>
        <Panel
          title={format(parseISO(`${month}-01`), 'MMMM yyyy')}
          action={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <NavButton label="Previous month" disabled={month <= firstMonth} onClick={() => setMonthISO(shiftMonth(month, -1))}><ChevronLeft size={16} aria-hidden /></NavButton>
              <NavButton label="Next month" disabled={month >= lastMonth} onClick={() => setMonthISO(shiftMonth(month, 1))}><ChevronRight size={16} aria-hidden /></NavButton>
              <button type="button" onClick={() => setMonthISO(firstMonth)} style={{ height: 34, padding: '0 12px', borderRadius: 10, border: `1px solid ${accent.base}`, background: neutral.surface, color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>This month</button>
            </div>
          }
        >
          <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: -6 }}>Click a day to see its sessions. Shift-click another day to select the dates between.</div>
          <div aria-hidden style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
            {WEEKDAY_SHORT_NAMES.map((d) => <span key={d} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase', paddingLeft: 4 }}>{d}</span>)}
          </div>
          <div role="group" aria-label={`${format(parseISO(`${month}-01`), 'MMMM yyyy')}, your sessions`} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
            {cells.map((dateISO, i) => {
              if (dateISO === null) return <span key={`pad-${i}`} aria-hidden />
              const day = byDate.get(dateISO)
              const past = dateISO < todayISO
              const isToday = dateISO === todayISO
              const selected = inSelection(dateISO)
              const hasSessions = day?.AM !== undefined || day?.PM !== undefined
              return (
                <button
                  key={dateISO}
                  type="button"
                  aria-pressed={selected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={describeDayForScreenReaders(dateISO, day, labelOf, past)}
                  data-date={dateISO}
                  disabled={past || !hasSessions}
                  onClick={(e) => pick(dateISO, e.shiftKey)}
                  className="aa-web-calendar-day"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    padding: 6,
                    borderRadius: 12,
                    border: selected ? `2px solid ${accent.base}` : isToday ? `2px solid ${brand.base}` : `1px solid ${neutral.line}`,
                    margin: selected || isToday ? 0 : 1,
                    background: selected ? accent.tint : neutral.surface,
                    opacity: past ? 0.45 : 1,
                    cursor: past || !hasSessions ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    minWidth: 0,
                  }}
                >
                  <span className="mono" style={{ fontSize: 12, fontWeight: isToday ? 700 : 600, color: isToday ? brand.base : neutral.slate }}>{Number(dateISO.slice(8))}</span>
                  <DayCell session={day?.AM} />
                  <DayCell session={day?.PM} />
                </button>
              )
            })}
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            {selection === null ? (
              <div data-shot="web-availability-rail-empty" style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
                Select a day to see its AM and PM sessions, or shift-click to select a range of days off.
              </div>
            ) : (
              <AvailabilityEditor
                key={`${selection.from}-${selection.to}`}
                actor={actor}
                anaesthetistId={anaesthetistId}
                fromISO={selection.from}
                {...(selection.to !== selection.from ? { toISO: selection.to } : {})}
                shot="web-availability-rail"
              />
            )}
          </Panel>

          <Panel title="Your series">
            <SeriesList actor={actor} anaesthetistId={anaesthetistId} shot="web-availability-series" emptyText="No repeating days off. Choose Repeat in the form to set one." />
          </Panel>

          <Panel title="Legend">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {choices.map((s) => <StatusChip key={s.key} status={s.key} label={s.longLabel} />)}
            </div>
            <div style={{ fontSize: 12.5, color: neutral.mist }}>A session holding a List shows the List in place of its status.</div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/** A session in the Web Availability cell anatomy: status bar, label, and the note or series line. */
function DayCell({ session }: { session: CalendarSession | undefined }) {
  const resolved = useDisplayStatus(session?.displayKey ?? '')
  if (session === undefined) return <span aria-hidden style={{ height: 34, borderRadius: 7, background: neutral.sunken }} />
  const v = resolved.visual
  const line2 = session.list !== undefined ? session.list.hospitalName : (session.series?.line ?? session.note ?? '')
  return (
    <span
      data-slot-id={session.slotId}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 34, borderRadius: 7, padding: '0 6px 0 7px', boxSizing: 'border-box', ...blockFill(v), minWidth: 0 }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: v.onTint, whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <span className="mono" style={{ fontSize: 9.5, opacity: 0.75 }}>{session.session}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{resolved.label}</span>
        {session.series !== undefined && <Repeat size={10} strokeWidth={2.6} aria-label="Repeating" style={{ flex: 'none' }} />}
      </span>
      {line2 !== '' && <span style={{ fontSize: 10, color: v.onTint, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{line2}</span>}
      {session.conflict && (
        <span title="Flagged on the office's Day view" style={{ position: 'absolute', top: -5, right: -5, width: 14, height: 14, borderRadius: 99, background: semantic.warning.solid, color: neutral.surface, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>
      )}
    </span>
  )
}

function NavButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${neutral.line}`, background: neutral.surface, color: disabled ? neutral.lineStrong : neutral.slate, cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
  )
}


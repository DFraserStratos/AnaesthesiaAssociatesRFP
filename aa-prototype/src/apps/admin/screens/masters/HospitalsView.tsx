import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import { accent, neutral, radius, semantic } from '../../../../theme/tokens'
import { STATUS_PALETTE } from '../../../../theme/statusColours'
import { hospitalMonth, scheduleHorizon, useAppStore, type Actor } from '../../../../store'
import { Segmented } from '../../../../shared'
import { TextAction } from '../../../../shared/ui'
import { MonthHeaderRow, useCalendarKeys } from '../../../../shared/calendar'
import { monthCells, monthOf, shiftMonth } from '../../../../shared/availability'
import { isRetired } from '../../../../domain/masterLifecycle'
import type { Hospital, PublicHoliday } from '../../../../domain/types'
import { HolidaySheet } from '../../flows/HolidaySheet'
import { AttentionDot } from '../../../../shared/warnings/AttentionDot'
import { AddHospitalSheet } from '../../flows/AddHospitalSheet'
import { EditHospitalSheet } from '../../flows/EditHospitalSheet'
import { selectControlStyle } from '../../flows/fieldChrome'
import { MasterHeader, RetiredPill, ShowRetiredToggle } from './chrome'
import { plural, longDayNoYear } from '../../../../shared/format'

type Sheet =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'edit'; id: string }
  | { kind: 'holiday'; hospitalId: string; dateISO?: string }
  | { kind: 'editHoliday'; holidayId: string }

type Mode = 'list' | 'calendar'

const HOLIDAY = STATUS_PALETTE.holiday

/** "Closed on all public holidays", or "Open on Labour Day and ..." listing those it runs on. */
export function publicHolidayLine(hospitalId: string, publicHolidays: Readonly<Record<string, PublicHoliday>>): string {
  const open = Object.values(publicHolidays)
    .filter((p) => p.openHospitalIds.includes(hospitalId))
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
  if (open.length === 0) return 'Closed on all public holidays'
  const names = [...new Set(open.map((p) => p.name))]
  const list = names.length === 1 ? names[0]! : `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`
  return `Open on ${list}`
}

/**
 * Hospitals & holidays (catch-up Phase 17, US-13.4.1; catch-up Phase 30,
 * US-01.5.1 and FT-01.5; catch-up Phase 42): each hospital with its contact
 * email, its own closure calendar and the master public holidays it is open
 * on. A closure flags every List at that hospital on that date; editing or
 * deleting it clears the flags. "List" shows the hospitals with their closures
 * as buttons; "Calendar" shows one hospital's month, its own closures and the
 * public holidays (read-only here). Retired hospitals hide behind "Show retired".
 */
export function HospitalsView({ actor }: { actor: Actor }) {
  const hospitalsById = useAppStore((s) => s.masters.hospitals)
  const holidays = useAppStore((s) => s.masters.holidays)
  const publicHolidays = useAppStore((s) => s.masters.publicHolidays)
  const [sheet, setSheet] = useState<Sheet>({ kind: 'none' })
  const [mode, setMode] = useState<Mode>('list')
  const [showRetired, setShowRetired] = useState(false)
  const all = Object.values(hospitalsById).sort((a, b) => a.name.localeCompare(b.name))
  const retiredCount = all.filter((h) => isRetired(h)).length
  const hospitals = showRetired ? all : all.filter((h) => !isRetired(h))
  const holidaysByHospital = useMemo(() => {
    const map: Record<string, { id: string; dateISO: string; name: string }[]> = {}
    for (const h of Object.values(holidays)) (map[h.hospitalId] ??= []).push(h)
    for (const list of Object.values(map)) list.sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    return map
  }, [holidays])
  const close = () => setSheet({ kind: 'none' })
  const editing = sheet.kind === 'edit' ? hospitalsById[sheet.id] : undefined

  return (
    <>
      <MasterHeader
        title="Hospitals & holidays"
        sub="Each hospital keeps its own closure calendar, and closes on the master public holidays unless it is listed open. A closure flags every List at that hospital on that date. Adding a hospital also adds its Party."
        add={{ label: 'Add hospital', onClick: () => setSheet({ kind: 'add' }) }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 240 }} data-shot="hospitals-mode">
          <Segmented<Mode> value={mode} options={[{ value: 'list', label: 'List' }, { value: 'calendar', label: 'Calendar' }]} onChange={setMode} />
        </div>
        {mode === 'list' && <ShowRetiredToggle checked={showRetired} onChange={setShowRetired} count={retiredCount} />}
      </div>
      {mode === 'list' ? (
        <div data-shot="masters-hospitals" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hospitals.map((h) => (
            <HospitalCard
              key={h.id}
              hospital={h}
              holidays={holidaysByHospital[h.id] ?? []}
              publicLine={publicHolidayLine(h.id, publicHolidays)}
              onEdit={() => setSheet({ kind: 'edit', id: h.id })}
              onAddHoliday={() => setSheet({ kind: 'holiday', hospitalId: h.id })}
              onEditHoliday={(holidayId) => setSheet({ kind: 'editHoliday', holidayId })}
            />
          ))}
        </div>
      ) : (
        <HospitalCalendar
          hospitals={all.filter((h) => !isRetired(h))}
          onAdd={(hospitalId, dateISO) => setSheet({ kind: 'holiday', hospitalId, dateISO })}
          onEdit={(holidayId) => setSheet({ kind: 'editHoliday', holidayId })}
        />
      )}
      {sheet.kind === 'add' && <AddHospitalSheet actor={actor} onClose={close} />}
      {editing !== undefined && <EditHospitalSheet key={editing.id} hospital={editing} actor={actor} onClose={close} />}
      <HolidaySheet
        open={sheet.kind === 'holiday' || sheet.kind === 'editHoliday'}
        actor={actor}
        {...(sheet.kind === 'holiday' ? { hospitalId: sheet.hospitalId, ...(sheet.dateISO !== undefined ? { dateISO: sheet.dateISO } : {}) } : {})}
        {...(sheet.kind === 'editHoliday' ? { holidayId: sheet.holidayId } : {})}
        onClose={close}
      />
    </>
  )
}

function HospitalCard({
  hospital: h,
  holidays,
  publicLine,
  onEdit,
  onAddHoliday,
  onEditHoliday,
}: {
  hospital: Hospital
  holidays: { id: string; dateISO: string; name: string }[]
  publicLine: string
  onEdit: () => void
  onAddHoliday: () => void
  onEditHoliday: (holidayId: string) => void
}) {
  const retired = isRetired(h)
  return (
    <div
      data-hospital={h.id}
      data-retired={retired ? 'true' : undefined}
      style={{ background: retired ? neutral.bg : neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14, color: retired ? neutral.mist : undefined }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            {h.name}
            {retired && <RetiredPill reason={h.retiredReason} />}
          </div>
          {h.contactEmail !== undefined ? (
            <div style={{ fontSize: 12.5, color: retired ? neutral.mist : neutral.slate, marginTop: 2 }}>{h.contactEmail}</div>
          ) : (
            <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: 2 }}>No contact email</div>
          )}
          <div data-public-holiday-line style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>
            <span style={{ color: neutral.mist }}>Public holidays: </span>
            {publicLine}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, flex: 'none' }}>
          <TextAction size="sm" flush onClick={onEdit} label={`Edit ${h.name}`}>Edit</TextAction>
          {!retired && <TextAction size="sm" flush onClick={onAddHoliday}>Add holiday</TextAction>}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {holidays.length === 0 ? (
          <span style={{ fontSize: 12, color: neutral.mist }}>No holidays recorded.</span>
        ) : (
          holidays.map((hol) => (
            <button
              key={hol.id}
              type="button"
              data-holiday={hol.id}
              onClick={() => onEditHoliday(hol.id)}
              title={`Change or delete ${hol.name}`}
              className="mono"
              style={{ fontSize: 11.5, background: neutral.sunken, border: `1px solid ${neutral.line}`, borderRadius: radius.pill, padding: '3px 10px', color: neutral.slate, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {hol.dateISO} · {hol.name}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

const WEEKDAY_ROW = { gap: 6 }
const WEEKDAY_CELL = { fontSize: 11.5, fontWeight: 600, color: neutral.mist, padding: '0 4px' }

/**
 * One hospital's month (Monday first, bounded by the schedule horizon), in
 * Phase 29's month-cell anatomy: the date numeral, a closure as a holiday-tint
 * block carrying its name, a master public holiday the same way labelled
 * "Public holiday" (read-only here: it opens the Public holidays view), the
 * Lists at that hospital that day, and the flagged count with the warning "!"
 * when it is closed. An open day adds a closure; a closure opens it to change
 * or delete. Today carries `aria-current="date"`; the arrow keys move by day
 * and week (`useCalendarKeys`).
 */
function HospitalCalendar({
  hospitals,
  onAdd,
  onEdit,
}: {
  hospitals: { id: string; name: string }[]
  onAdd: (hospitalId: string, dateISO: string) => void
  onEdit: (holidayId: string) => void
}) {
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  const [, setParams] = useSearchParams()
  const horizon = scheduleHorizon({ clock, appSettings })
  const firstMonth = monthOf(horizon.startISO)
  const lastMonth = monthOf(horizon.endISO)
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id ?? '')
  const [month, setMonth] = useState(monthOf(clock.todayISO))
  const [focusISO, setFocusISO] = useState(clock.todayISO)
  const days = useMemo(() => new Map(hospitalMonth({ schedule, masters }, hospitalId, month).map((d) => [d.dateISO, d])), [schedule, masters, hospitalId, month])
  const cells = monthCells(month)
  const { dayProps } = useCalendarKeys({
    monthISO: month,
    bounds: { firstISO: horizon.startISO, lastISO: horizon.endISO },
    focusISO,
    onFocusMove: setFocusISO,
    onMonthChange: setMonth,
  })

  function openPublicHolidays() {
    setParams((prev) => {
      const copy = new URLSearchParams(prev)
      copy.set('view', 'publicHolidays')
      return copy
    })
  }

  const navBtn = (label: string, delta: number, disabled: boolean) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => setMonth(shiftMonth(month, delta))}
      className="aa-ctl"
      style={{ minWidth: 36, height: 36, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.surface, color: disabled ? neutral.mist : accent.base, fontFamily: 'inherit', fontSize: 16, fontWeight: 700, cursor: disabled ? 'default' : 'pointer' }}
    >
      {delta < 0 ? '‹' : '›'}
    </button>
  )

  return (
    <div data-shot="hospital-calendar" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <select aria-label="Hospital" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} style={{ ...selectControlStyle, width: 280, minHeight: 36, fontSize: 13.5 }}>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {navBtn('Previous month', -1, month <= firstMonth)}
          <span style={{ minWidth: 130, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>{format(parseISO(`${month}-01`), 'MMMM yyyy')}</span>
          {navBtn('Next month', 1, month >= lastMonth)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <MonthHeaderRow variant="short" style={WEEKDAY_ROW} cellStyle={WEEKDAY_CELL} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
          {cells.map((dateISO, i) => {
            if (dateISO === null) return <div key={`blank-${i}`} />
            const day = days.get(dateISO)
            const inHorizon = dateISO >= horizon.startISO && dateISO <= horizon.endISO
            const isToday = dateISO === clock.todayISO
            const closures = day?.closures ?? []
            const closure = closures[0]
            // The master public holidays closing it that day (catch-up Phase 42): read-only here.
            const publicClosures = day?.publicClosures ?? []
            const closed = closure !== undefined || publicClosures.length > 0
            const listCount = day?.listCount ?? 0
            const names = [...closures.map((c) => c.name), ...publicClosures.map((p) => `${p.name} (public holiday)`)]
            const label = `${longDayNoYear(dateISO)}${isToday ? ', today' : ''}: ${closed ? `closed, ${names.join(' and ')}` : 'open'}, ${plural(listCount, 'List')}`
            return (
              <button
                key={dateISO}
                type="button"
                aria-label={label}
                aria-current={isToday ? 'date' : undefined}
                data-calendar-day={dateISO}
                disabled={!inHorizon && closure === undefined}
                {...dayProps(dateISO)}
                onClick={(event) => {
                  // A public-holiday block opens the Public holidays view, where it is kept.
                  if ((event.target as HTMLElement).closest('[data-public-holiday]') !== null && closure === undefined) {
                    openPublicHolidays()
                    return
                  }
                  if (closure !== undefined) onEdit(closure.id)
                  else onAdd(hospitalId, dateISO)
                }}
                className="aa-ctl"
                style={{ minHeight: 84, padding: 6, borderRadius: radius.ctl, border: `1px solid ${closed ? HOLIDAY.solid : isToday ? accent.base : neutral.line}`, boxShadow: isToday ? `inset 0 0 0 1px ${accent.base}` : undefined, background: inHorizon ? neutral.surface : neutral.bg, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'stretch', textAlign: 'left', fontFamily: 'inherit', cursor: inHorizon || closure !== undefined ? 'pointer' : 'default' }}
              >
                <span className="mono" style={{ fontSize: 12, fontWeight: isToday ? 700 : 600, color: isToday ? accent.base : inHorizon ? neutral.ink : neutral.mist }}>{Number(dateISO.slice(8))}</span>
                {closures.map((c) => (
                  <span key={c.id} style={{ background: HOLIDAY.tint, color: HOLIDAY.onTint, boxShadow: `inset 3px 0 0 ${HOLIDAY.solid}`, borderRadius: radius.xs, padding: '3px 6px 3px 8px', fontSize: 11, fontWeight: 600, lineHeight: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </span>
                ))}
                {publicClosures.map((p) => (
                  <span key={p.id} data-public-holiday={p.id} title={`${p.name}: public holiday. Change it in Public holidays.`} style={{ background: HOLIDAY.tint, color: HOLIDAY.onTint, boxShadow: `inset 3px 0 0 ${HOLIDAY.solid}`, borderRadius: radius.xs, padding: '3px 6px 3px 8px', fontSize: 11, fontWeight: 600, lineHeight: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span style={{ fontWeight: 500, opacity: 0.85 }}>Public holiday</span>
                  </span>
                ))}
                <span style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: neutral.slate }}>
                  {listCount > 0 && <span>{plural(listCount, 'List')}</span>}
                  {closed && (day?.conflictedCount ?? 0) > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: semantic.warning.onTint, fontWeight: 600 }}>
                      <AttentionDot size={12} />
                      {day?.conflictedCount} flagged
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ fontSize: 12, color: neutral.mist, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <span>Choose an open day to add a closure, or a closure to change or delete it. Public holidays show here read-only.</span>
        <TextAction size="sm" flush onClick={openPublicHolidays} shot="hospital-calendar-public-link">Open Public holidays</TextAction>
      </div>
    </div>
  )
}

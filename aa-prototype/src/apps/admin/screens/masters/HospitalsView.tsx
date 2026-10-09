import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { accent, neutral, radius, semantic } from '../../../../theme/tokens'
import { STATUS_PALETTE } from '../../../../theme/statusColours'
import { hospitalMonth, scheduleHorizon, useAppStore, type Actor } from '../../../../store'
import { Button, Segmented } from '../../../../shared'
import { monthCells, monthOf, shiftMonth, WEEKDAY_SHORT_NAMES } from '../../../../shared/availability'
import { HolidaySheet } from '../../flows/HolidaySheet'
import { ConflictDot } from '../../components/conflicts/ConflictDot'
import { AddHospitalSheet } from '../../flows/AddHospitalSheet'
import { EditHospitalSheet } from '../../flows/EditHospitalSheet'
import { selectControlStyle } from '../../flows/fieldChrome'
import { Header, TextAction } from './chrome'

type Sheet =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'edit'; id: string }
  | { kind: 'holiday'; hospitalId: string; dateISO?: string }
  | { kind: 'editHoliday'; holidayId: string }

type Mode = 'list' | 'calendar'

const HOLIDAY = STATUS_PALETTE.holiday

/**
 * Hospitals & holidays (catch-up Phase 17, US-13.4.1; catch-up Phase 30,
 * US-01.5.1 and FT-01.5): each hospital with its contact email and its own
 * closure calendar. A closure flags every List at that hospital on that date;
 * editing or deleting it clears the flags. "List" shows the hospitals with
 * their closures as buttons; "Calendar" shows one hospital's month.
 */
export function HospitalsView({ actor }: { actor: Actor }) {
  const hospitalsById = useAppStore((s) => s.masters.hospitals)
  const holidays = useAppStore((s) => s.masters.holidays)
  const [sheet, setSheet] = useState<Sheet>({ kind: 'none' })
  const [mode, setMode] = useState<Mode>('list')
  const hospitals = Object.values(hospitalsById).sort((a, b) => a.name.localeCompare(b.name))
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
      <Header
        title="Hospitals & holidays"
        sub="Each hospital keeps its own closure calendar. A closure flags every List at that hospital on that date; editing or deleting it clears the flags. Adding a hospital creates its protected default Type 1 contract (visible in Contracts)."
        action={<Button variant="secondary" onClick={() => setSheet({ kind: 'add' })}>Add hospital</Button>}
      />
      <div style={{ width: 240 }} data-shot="hospitals-mode">
        <Segmented<Mode> value={mode} options={[{ value: 'list', label: 'List' }, { value: 'calendar', label: 'Calendar' }]} onChange={setMode} />
      </div>
      {mode === 'list' ? (
        <div data-shot="masters-hospitals" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hospitals.map((h) => (
            <div key={h.id} data-hospital={h.id} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</div>
                  {h.contactEmail !== undefined ? (
                    <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>{h.contactEmail}</div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: 2 }}>No contact email</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, flex: 'none' }}>
                  <TextAction onClick={() => setSheet({ kind: 'edit', id: h.id })} label={`Edit ${h.name}`}>Edit</TextAction>
                  <TextAction onClick={() => setSheet({ kind: 'holiday', hospitalId: h.id })}>Add holiday</TextAction>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {(holidaysByHospital[h.id] ?? []).length === 0 ? (
                  <span style={{ fontSize: 12, color: neutral.mist }}>No holidays recorded.</span>
                ) : (
                  (holidaysByHospital[h.id] ?? []).map((hol) => (
                    <button
                      key={hol.id}
                      type="button"
                      data-holiday={hol.id}
                      onClick={() => setSheet({ kind: 'editHoliday', holidayId: hol.id })}
                      title={`Change or delete ${hol.name}`}
                      className="mono"
                      style={{ fontSize: 11.5, background: neutral.sunken, border: `1px solid ${neutral.line}`, borderRadius: 999, padding: '3px 10px', color: neutral.slate, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {hol.dateISO} · {hol.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <HospitalCalendar
          hospitals={hospitals}
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

/**
 * One hospital's month (Monday first, bounded by the schedule horizon), in
 * Phase 29's month-cell anatomy: the date numeral, a closure as a holiday-tint
 * block carrying its name, the Lists at that hospital that day, and the
 * flagged count with the warning "!" when it is closed. An open day adds a
 * closure; a closure opens it to change or delete.
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
  const horizon = scheduleHorizon({ clock, appSettings })
  const firstMonth = monthOf(horizon.startISO)
  const lastMonth = monthOf(horizon.endISO)
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id ?? '')
  const [month, setMonth] = useState(monthOf(clock.todayISO))
  const days = useMemo(() => new Map(hospitalMonth({ schedule, masters }, hospitalId, month).map((d) => [d.dateISO, d])), [schedule, masters, hospitalId, month])
  const cells = monthCells(month)

  const navBtn = (label: string, delta: number, disabled: boolean) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => setMonth(shiftMonth(month, delta))}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {WEEKDAY_SHORT_NAMES.map((d) => (
          <div key={d} style={{ fontSize: 11.5, fontWeight: 600, color: neutral.mist, padding: '0 4px' }}>{d}</div>
        ))}
        {cells.map((dateISO, i) => {
          if (dateISO === null) return <div key={`blank-${i}`} />
          const day = days.get(dateISO)
          const inHorizon = dateISO >= horizon.startISO && dateISO <= horizon.endISO
          const closures = day?.closures ?? []
          const closure = closures[0]
          const listCount = day?.listCount ?? 0
          const label = `${format(parseISO(dateISO), 'EEEE d MMMM')}: ${closure !== undefined ? `closed, ${closures.map((c) => c.name).join(' and ')}` : 'open'}, ${listCount} List${listCount === 1 ? '' : 's'}`
          return (
            <button
              key={dateISO}
              type="button"
              aria-label={label}
              data-calendar-day={dateISO}
              disabled={!inHorizon && closure === undefined}
              onClick={() => (closure !== undefined ? onEdit(closure.id) : onAdd(hospitalId, dateISO))}
              style={{ minHeight: 84, padding: 6, borderRadius: 10, border: `1px solid ${closure !== undefined ? HOLIDAY.solid : neutral.line}`, background: inHorizon ? neutral.surface : neutral.bg, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'stretch', textAlign: 'left', fontFamily: 'inherit', cursor: inHorizon || closure !== undefined ? 'pointer' : 'default' }}
            >
              <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: inHorizon ? neutral.ink : neutral.mist }}>{Number(dateISO.slice(8))}</span>
              {closures.map((c) => (
                <span key={c.id} style={{ background: HOLIDAY.tint, color: HOLIDAY.onTint, boxShadow: `inset 3px 0 0 ${HOLIDAY.solid}`, borderRadius: 6, padding: '3px 6px 3px 8px', fontSize: 11, fontWeight: 600, lineHeight: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </span>
              ))}
              <span style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: neutral.slate }}>
                {listCount > 0 && <span>{listCount} List{listCount === 1 ? '' : 's'}</span>}
                {closure !== undefined && (day?.conflictedCount ?? 0) > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: semantic.warning.onTint, fontWeight: 600 }}>
                    <ConflictDot size={12} />
                    {day?.conflictedCount} flagged
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
      <div style={{ fontSize: 12, color: neutral.mist }}>Choose an open day to add a closure, or a closure to change or delete it.</div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import type { RecurringBooking } from '../../../domain/types'
import { LIST_KIND_LABELS } from '../../../domain/types'
import { displayStatusLabel } from '../../../domain/slotStatus'
import {
  runsNote,
  runsText,
  timesText,
  USUAL_WEEK_DAYS,
  USUAL_WEEK_SESSIONS,
  usualWeek,
  weekdayPlural,
  weekdayShort,
  type UsualWeekCell,
  type UsualWeekPerspective,
  type UsualWeekPublicSession,
} from '../../../domain/usualWeek'
import { useAppStore, type Actor } from '../../../store'
import { Button, Card, Pill, SlidingSegmentedControl, TextAction, visuallyHidden, type SlidingSegmentOption } from '../../../shared/ui'
import { TableShell, Td, Th } from '../../../shared/table'
import { drSurname, locationName, plural, titledSurname } from '../../../shared/format'
import { neutral } from '../../../theme/tokens'
import { PROFILE_CARD } from './ProfileChrome'
import { RecurringBookingSheet, type RecurringBookingPrefill } from '../flows/RecurringBookingSheet'

type View = 'week' | 'list'
type SheetState = { edit: RecurringBooking } | { add: RecurringBookingPrefill }

/**
 * A person's usual week (the profile pages' first card; `docs/explorations/profile-ideas.html` tab 3):
 * their live recurring bookings on a Monday to Friday by AM and PM grid, or as a list with the retired
 * ones at its foot. On the anaesthetist page their weekly Public sessions (a Public series on their
 * availability, not a recurring booking) sit in the grid too, hatched and not clickable. A recurring
 * booking opens the recurring booking sheet to edit it; an empty half-day or "+ Add" opens it to add
 * one for this person.
 */
export function UsualWeekCard({ perspective, subjectId, actor }: { perspective: UsualWeekPerspective; subjectId: string; actor: Actor }) {
  const recurringBookings = useAppStore((s) => s.masters.recurringBookings)
  const availabilitySeries = useAppStore((s) => s.schedule.availabilitySeries)
  const todayISO = useAppStore((s) => s.clock.todayISO)
  const [view, setView] = useState<View>('week')
  const [sheet, setSheet] = useState<SheetState | null>(null)

  const week = useMemo(
    () => usualWeek({ recurringBookings, availabilitySeries, perspective, subjectId, todayISO }),
    [recurringBookings, availabilitySeries, perspective, subjectId, todayISO],
  )

  const self: RecurringBookingPrefill = perspective === 'anaesthetist' ? { anaesthetistId: subjectId } : { surgeonId: subjectId }
  const openAdd = (more: RecurringBookingPrefill = {}) => setSheet({ add: { ...self, ...more } })
  const openEdit = (rb: RecurringBooking) => setSheet({ edit: rb })

  const viewOptions: readonly SlidingSegmentOption<View>[] = [
    { value: 'week', label: 'Week' },
    {
      value: 'list',
      label: week.ended.length > 0 ? (
        <span>
          List <span style={{ fontWeight: 500, opacity: 0.75 }}>+{week.ended.length} retired</span>
        </span>
      ) : (
        'List'
      ),
    },
  ]

  return (
    <Card
      style={PROFILE_CARD}
      title="Usual week"
      shot="usual-week"
      data-perspective={perspective}
      action={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div data-shot="usual-week-view">
            <SlidingSegmentedControl size="sm" variant="teal" ariaLabel="Usual week view" value={view} options={viewOptions} onSelect={setView} />
          </div>
          <Button variant="secondary" size="compact" shot="usual-week-add" onClick={() => openAdd()}>+ Add</Button>
        </div>
      }
    >
      {view === 'week' ? (
        <WeekView perspective={perspective} week={week} onEdit={openEdit} onAdd={openAdd} />
      ) : (
        <ListView perspective={perspective} live={week.live} ended={week.ended} todayISO={todayISO} onEdit={openEdit} />
      )}
      {sheet !== null && (
        <RecurringBookingSheet
          open
          actor={actor}
          {...('edit' in sheet ? { recurringBooking: recurringBookings[sheet.edit.id] ?? sheet.edit } : { initial: sheet.add })}
          onClose={() => setSheet(null)}
        />
      )}
    </Card>
  )
}

/** The names a recurring booking shows from this side: the bold line and the slate line under it. */
function useEntryNames(perspective: UsualWeekPerspective) {
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  return useMemo(() => {
    const hospital = (rb: RecurringBooking) => locationName(rb.hospitalId, hospitals)
    const anaesthetist = (rb: RecurringBooking) => {
      const name = anaesthetists[rb.anaesthetistId]?.name
      return name !== undefined ? drSurname(name) : rb.anaesthetistId
    }
    const surgeon = (rb: RecurringBooking) => {
      const name = surgeons[rb.surgeonId]?.name
      return name !== undefined ? titledSurname(name) : rb.surgeonId
    }
    return {
      hospital,
      other: perspective === 'anaesthetist' ? surgeon : anaesthetist,
      bold: perspective === 'anaesthetist' ? hospital : anaesthetist,
      under: perspective === 'anaesthetist' ? surgeon : hospital,
    }
  }, [perspective, hospitals, anaesthetists, surgeons])
}

function WeekView({
  perspective,
  week,
  onEdit,
  onAdd,
}: {
  perspective: UsualWeekPerspective
  week: ReturnType<typeof usualWeek>
  onEdit: (rb: RecurringBooking) => void
  onAdd: (prefill: RecurringBookingPrefill) => void
}) {
  const names = useEntryNames(perspective)
  const statuses = useAppStore((s) => s.masters.slotStatuses)
  const todayISO = useAppStore((s) => s.clock.todayISO)
  const emptyWord = perspective === 'anaesthetist' ? 'Free' : 'No recurring booking'
  const publicLabel = (p: UsualWeekPublicSession) => displayStatusLabel(p.statusKey, statuses)

  const cell = (c: UsualWeekCell) => {
    const when = `${weekdayPlural(c.dayOfWeek)} ${c.session}`
    if (c.recurringBookings.length === 1) {
      const rb = c.recurringBookings[0]!
      return (
        <button
          key={`${c.dayOfWeek}${c.session}`}
          type="button"
          className="aa-usual-week-cell aa-ctl"
          data-cell="recurring"
          data-shot="usual-week-cell"
          data-day={c.dayOfWeek}
          data-session={c.session}
          aria-label={`Edit recurring booking, ${when}: ${names.bold(rb)}, ${names.under(rb)}`}
          onClick={() => onEdit(rb)}
        >
          <Entry rb={rb} names={names} todayISO={todayISO} />
        </button>
      )
    }
    if (c.recurringBookings.length > 1) {
      // Several in one half-day (a surgeon's, one per anaesthetist): the cell holds a button per entry.
      return (
        <div key={`${c.dayOfWeek}${c.session}`} className="aa-usual-week-cell" data-cell="recurring" data-shot="usual-week-cell" data-day={c.dayOfWeek} data-session={c.session}>
          {c.recurringBookings.map((rb) => (
            <button
              key={rb.id}
              type="button"
              className="aa-usual-week-entry aa-usual-week-entry-button aa-ctl"
              data-recurring-booking={rb.id}
              aria-label={`Edit recurring booking, ${when}: ${names.bold(rb)}, ${names.under(rb)}`}
              onClick={() => onEdit(rb)}
            >
              <EntryBody rb={rb} names={names} todayISO={todayISO} />
            </button>
          ))}
        </div>
      )
    }
    if (c.publicSession !== undefined) {
      const p = c.publicSession
      return (
        <div key={`${c.dayOfWeek}${c.session}`} className="aa-usual-week-cell" data-cell="public" data-shot="usual-week-cell" data-day={c.dayOfWeek} data-session={c.session}>
          <div className="aa-usual-week-entry">
            <b>{publicLabel(p)}</b>
            <span>{publicLine(p)}</span>
          </div>
        </div>
      )
    }
    return (
      <button
        key={`${c.dayOfWeek}${c.session}`}
        type="button"
        className="aa-usual-week-cell aa-ctl"
        data-cell="free"
        data-shot="usual-week-cell"
        data-day={c.dayOfWeek}
        data-session={c.session}
        aria-label={`${emptyWord}, ${when}. Add a recurring booking`}
        onClick={() => onAdd({ dayOfWeek: c.dayOfWeek, session: c.session })}
      >
        {emptyWord}
      </button>
    )
  }

  const offGrid = [
    ...week.offGrid.map((rb) => `${weekdayPlural(rb.dayOfWeek)} ${rb.session} · ${names.bold(rb)}, ${names.under(rb)}`),
    ...week.offGridPublic.map((p) => `${weekdayPlural(p.dayOfWeek)} ${p.session} · ${publicLabel(p)}${p.note !== undefined ? `, ${p.note}` : ''}`),
  ]
  const count = perspective === 'surgeon'
    ? `${plural(week.live.length, 'recurring booking')} · ${plural(week.otherPeople, 'anaesthetist')}`
    : plural(week.live.length, 'recurring booking')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="aa-usual-week-grid" data-shot="usual-week-grid">
        <span />
        {USUAL_WEEK_DAYS.map((d) => (
          <span key={d} className="aa-usual-week-day">{weekdayShort(d)}</span>
        ))}
        {USUAL_WEEK_SESSIONS.map((session) => [
          <span key={`label-${session}`} className="aa-usual-week-session">{session}</span>,
          ...week.grid[session].map(cell),
        ])}
      </div>
      {offGrid.length > 0 && (
        <div data-shot="usual-week-off-grid" style={{ fontSize: 12, color: neutral.slate }}>
          Also {offGrid.join('; ')}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div className="aa-usual-week-legend" data-shot="usual-week-legend">
          <span><i className="aa-usual-week-swatch" data-cell="recurring" />Recurring booking</span>
          {perspective === 'anaesthetist' && <span><i className="aa-usual-week-swatch" data-cell="public" />Public session (availability)</span>}
          <span><i className="aa-usual-week-swatch" data-cell="free" />{emptyWord}</span>
        </div>
        <span data-shot="usual-week-count" style={{ fontSize: 12, color: neutral.slate }}>{count}</span>
      </div>
    </div>
  )
}

/** "CPH", or "CPH · every 2 weeks" when the series skips weeks. */
function publicLine(p: UsualWeekPublicSession): string {
  const every = p.everyWeeks > 1 ? `every ${p.everyWeeks} weeks` : undefined
  return [p.note, every].filter((s): s is string => s !== undefined && s !== '').join(' · ')
}

function Entry({ rb, names, todayISO }: { rb: RecurringBooking; names: ReturnType<typeof useEntryNames>; todayISO: string }) {
  return (
    <div className="aa-usual-week-entry" data-recurring-booking={rb.id}>
      <EntryBody rb={rb} names={names} todayISO={todayISO} />
    </div>
  )
}

/** One recurring booking's lines: the bold name, the slate one under it, and its Pre-op or runs pill. */
function EntryBody({ rb, names, todayISO }: { rb: RecurringBooking; names: ReturnType<typeof useEntryNames>; todayISO: string }) {
  const times = timesText(rb)
  const note = runsNote(rb, todayISO)
  // Two lines in every cell, so the AM and PM rows stay one height: the bold name with the times at its
  // right (hidden when the cell is too narrow; they stay in the tooltip and the List view), then the
  // slate name with its pill at the right.
  return (
    <>
      <span className="aa-usual-week-line" {...(times !== undefined ? { title: times } : {})}>
        <b>{names.bold(rb)}</b>
        {times !== undefined && <span className="aa-usual-week-times mono">{times}</span>}
      </span>
      <span className="aa-usual-week-line">
        <span className="aa-usual-week-under">{names.under(rb)}</span>
        {rb.kind === 'preop' && <Pill size="sm" style={PILL_PLACE}>Pre-op</Pill>}
        {note !== undefined && <Pill size="sm" tone="warning" style={PILL_PLACE}>{note}</Pill>}
      </span>
    </>
  )
}

/** A pill at a line's right end: never squeezed by the name, and never wider than most of the cell. */
const PILL_PLACE = { flex: 'none', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis' } as const

function ListView({
  perspective,
  live,
  ended,
  todayISO,
  onEdit,
}: {
  perspective: UsualWeekPerspective
  live: RecurringBooking[]
  ended: RecurringBooking[]
  todayISO: string
  onEdit: (rb: RecurringBooking) => void
}) {
  const names = useEntryNames(perspective)
  const row = (rb: RecurringBooking, dim: boolean) => {
    const times = timesText(rb)
    const style = dim ? { color: neutral.mist, background: neutral.bg } : undefined
    return (
      <tr key={rb.id} data-shot="usual-week-row" data-recurring-booking={rb.id} data-retired={dim ? 'true' : undefined}>
        <Td style={style} nowrap>{weekdayPlural(rb.dayOfWeek)}</Td>
        <Td style={style} mono>{rb.session}</Td>
        <Td style={style}>{names.hospital(rb)}</Td>
        <Td style={style}>{names.other(rb)}</Td>
        <Td style={style}>{LIST_KIND_LABELS[rb.kind].label}</Td>
        <Td style={style}>
          <div>{runsText(rb, todayISO)}</div>
          {times !== undefined && <div className="mono" style={{ fontSize: 11.5, color: dim ? neutral.mist : neutral.slate }}>{times}</div>}
        </Td>
        <Td style={style} align="right">
          {!dim && (
            <TextAction size="sm" flush label={`Edit recurring booking, ${weekdayPlural(rb.dayOfWeek)} ${rb.session}`} onClick={() => onEdit(rb)}>
              Edit
            </TextAction>
          )}
        </Td>
      </tr>
    )
  }
  return (
    <TableShell label="Usual week" nested density="compact" shot="usual-week-table">
      <thead>
        <tr>
          <Th>Day</Th>
          <Th>Session</Th>
          <Th>Hospital</Th>
          <Th>{perspective === 'anaesthetist' ? 'Surgeon' : 'Anaesthetist'}</Th>
          <Th>Kind</Th>
          <Th>Runs</Th>
          <Th align="right"><span style={visuallyHidden}>Edit</span></Th>
        </tr>
      </thead>
      <tbody>
        {live.length === 0 && ended.length === 0 && (
          <tr>
            <Td colSpan={7} style={{ color: neutral.mist }}>No recurring bookings yet.</Td>
          </tr>
        )}
        {live.map((rb) => row(rb, false))}
        {ended.map((rb) => row(rb, true))}
      </tbody>
    </TableShell>
  )
}

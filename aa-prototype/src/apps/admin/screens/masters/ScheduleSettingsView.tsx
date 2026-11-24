/**
 * Master data, Schedule settings (catch-up Phase 28): the one schedule
 * settings record. The horizon in whole months (FT-01.1: "four months in
 * current practice", any number of months) and the default AM and PM session
 * times (US-01.1.4: "Admins set default start and end times for AM and PM
 * Slots"). Sessions with their own times keep them. The UI says session,
 * never "slot".
 */

import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral } from '../../../../theme/tokens'
import type { Session } from '../../../../domain/types'
import {
  HORIZON_MONTHS_MAX,
  HORIZON_MONTHS_MIN,
  previewHorizonChange,
  scheduleHorizon,
  setHorizonMonths,
  setSlotDefaultTimes,
  useAppStore,
  type Actor,
} from '../../../../store'
import { Button, FormError, useSurface } from '../../../../shared'
import { TextField, TimeRangeFields } from '../../../../shared/ui'
import { OverlayHeader, SheetActions } from '../../../../shared/surface'
import { MasterHeader, MasterTable } from './chrome'
import { ADMIN_FORM_WIDTH } from '../../layout'
import { TextAction } from '../../../../shared/ui'
import { cellStyle } from './tableStyles'
import { sessionText, SESSIONS_IN_ORDER } from '../../../../domain/outOfHours'
import { Notice } from '../../../../shared/ui/Notice'

const longDate = (iso: string) => format(parseISO(iso), 'EEE d MMM yyyy')

export function ScheduleSettingsView({ actor }: { actor: Actor }) {
  const settings = useAppStore((s) => s.appSettings.schedule)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  const end = useMemo(() => scheduleHorizon({ clock, appSettings }).endISO, [clock, appSettings])
  const [sheet, setSheet] = useState<'none' | 'horizon' | 'times'>('none')

  return (
    <div data-shot="admin-schedule-settings" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MasterHeader
          title="Schedule horizon"
          sub="Every active anaesthetist has an AM and a PM session each day up to the horizon. It rolls forward each day."
          actions={<Button variant="secondary" onClick={() => setSheet('horizon')}>Edit horizon</Button>}
        />
        <MasterTable columns={['Horizon', 'Last day', '']} rightAlign={[2]} label="Schedule horizon" style={{ maxWidth: ADMIN_FORM_WIDTH }}>
          <tr>
            <td style={cellStyle}>
              <span style={{ fontWeight: 600 }}>{settings.horizonMonths} {settings.horizonMonths === 1 ? 'month' : 'months'}</span>
              <span style={{ marginLeft: 10, fontSize: 12, color: neutral.mist }}>Four months is current practice.</span>
            </td>
            <td className="mono" style={cellStyle}>{longDate(end)}</td>
            <td style={{ ...cellStyle, textAlign: 'right' }}><TextAction size="sm" flush onClick={() => setSheet('horizon')}>Edit</TextAction></td>
          </tr>
        </MasterTable>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MasterHeader
          title="Session times"
          sub="Sessions with their own times keep them."
          section
          actions={<Button variant="secondary" onClick={() => setSheet('times')}>Edit session times</Button>}
        />
        <MasterTable columns={['Session', 'Start', 'End', '']} rightAlign={[3]} shot="admin-session-times" style={{ maxWidth: ADMIN_FORM_WIDTH }}>
          {SESSIONS_IN_ORDER.map((session) => (
            <tr key={session}>
              <td style={{ ...cellStyle, fontWeight: 600 }}>{sessionText(session)}</td>
              <td className="mono" style={cellStyle}>{settings.defaultTimes[session].startTime}</td>
              <td className="mono" style={cellStyle}>{settings.defaultTimes[session].endTime}</td>
              <td style={{ ...cellStyle, textAlign: 'right' }}><TextAction size="sm" flush onClick={() => setSheet('times')}>Edit</TextAction></td>
            </tr>
          ))}
        </MasterTable>
      </div>

      <HorizonSheet open={sheet === 'horizon'} actor={actor} onClose={() => setSheet('none')} />
      <SessionTimesSheet open={sheet === 'times'} actor={actor} onClose={() => setSheet('none')} />
    </div>
  )
}

function HorizonSheet({ open, actor, onClose }: { open: boolean; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const current = useAppStore((s) => s.appSettings.schedule.horizonMonths)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  const lists = useAppStore((s) => s.schedule.lists)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const [value, setValue] = useState(String(current))
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValue(String(current))
      setConfirming(false)
      setError(null)
    }
  }, [open, current])

  const months = Number(value)
  const valid = Number.isInteger(months) && months >= HORIZON_MONTHS_MIN && months <= HORIZON_MONTHS_MAX
  // Computed only while the sheet is open (it scans the Lists and Bookings).
  const preview = useMemo(
    () => (open && valid ? previewHorizonChange({ clock, appSettings, schedule: { lists, bookings } }, months) : null),
    [open, valid, months, clock, appSettings, lists, bookings],
  )

  const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`
  let line = `A whole number of months from ${HORIZON_MONTHS_MIN} to ${HORIZON_MONTHS_MAX}.`
  if (preview !== null && preview.direction === 'extend') line = `Adds ${days(preview.days)}, to ${longDate(preview.toEndISO)}.`
  if (preview !== null && preview.direction === 'shorten') {
    line = `Removes ${days(preview.days)} after ${longDate(preview.toEndISO)}, with ${preview.listsDropped} ${preview.listsDropped === 1 ? 'List' : 'Lists'} that hold no Bookings.`
  }
  if (preview !== null && preview.direction === 'none') line = 'This is the current horizon.'
  const blocked = preview !== null && preview.listsWithBookings > 0

  function save() {
    setError(null)
    if (!valid || preview === null || preview.direction === 'none') return
    if (preview.direction === 'shorten' && !confirming) {
      setConfirming(true)
      return
    }
    const outcome = setHorizonMonths(useAppStore, actor, months)
    if (!outcome.ok) {
      setError(outcome.message)
      setConfirming(false)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-horizon-months" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Schedule horizon" />
        <TextField
          label="Months ahead"
          type="number"
          min={HORIZON_MONTHS_MIN}
          max={HORIZON_MONTHS_MAX}
          step={1}
          value={value}
          onChange={(v) => {
            setValue(v)
            setConfirming(false)
            setError(null)
          }}
          mono
        />
        <div data-shot="horizon-preview" style={{ fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>{line}</div>
        {blocked && preview !== null && (
          <FormError message={`${preview.listsWithBookings} ${preview.listsWithBookings === 1 ? 'List' : 'Lists'} after ${longDate(preview.toEndISO)} ${preview.listsWithBookings === 1 ? 'holds' : 'hold'} Bookings. Move them first.`} />
        )}
        {!blocked && <FormError message={error} />}
        {confirming && preview !== null && (
          <Notice tone="neutral">
            <span>The sessions after {longDate(preview.toEndISO)} are removed, with their empty Lists. Lists assigned there by the office are not restored by extending again; recurring bookings are.</span>
          </Notice>
        )}
        <SheetActions
          primary={
            <Button variant="primary" block onClick={save} disabled={!valid || blocked || preview?.direction === 'none'}>
              {confirming && preview !== null ? `Confirm and remove ${days(preview.days)}` : 'Save horizon'}
            </Button>
          }
          secondary={<Button variant="secondary" block onClick={onClose}>Cancel</Button>}
        />
      </div>
    </Overlay>
  )
}

function SessionTimesSheet({ open, actor, onClose }: { open: boolean; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const defaults = useAppStore((s) => s.appSettings.schedule.defaultTimes)
  const [draft, setDraft] = useState(defaults)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(defaults)
      setError(null)
    }
  }, [open, defaults])

  function set(session: Session, key: 'startTime' | 'endTime', value: string) {
    setDraft((d) => ({ ...d, [session]: { ...d[session], [key]: value } }))
    setError(null)
  }

  function save() {
    const outcome = setSlotDefaultTimes(useAppStore, actor, draft)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-session-times-edit" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Default session times" />
        {SESSIONS_IN_ORDER.map((session) => (
          <div key={session} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <span className="mono" style={{ width: 88, paddingBottom: 16, fontSize: 12, fontWeight: 600, color: neutral.mist }}>{sessionText(session)}</span>
            <div style={{ flex: 1 }}>
              <TimeRangeFields
                startLabel={`${sessionText(session)} start`}
                endLabel={`${sessionText(session)} end`}
                value={{ start: draft[session].startTime, end: draft[session].endTime }}
                onChange={(next) => {
                  if (next.start !== draft[session].startTime) set(session, 'startTime', next.start)
                  if (next.end !== draft[session].endTime) set(session, 'endTime', next.end)
                }}
              />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12.5, color: neutral.slate }}>Sessions with their own times keep them.</div>
        <FormError message={error} />
        <SheetActions
          primary={<Button variant="primary" block onClick={save}>Save session times</Button>}
          secondary={<Button variant="secondary" block onClick={onClose}>Cancel</Button>}
        />
      </div>
    </Overlay>
  )
}

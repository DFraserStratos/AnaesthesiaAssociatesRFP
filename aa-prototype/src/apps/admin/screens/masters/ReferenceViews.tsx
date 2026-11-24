import { useMemo, useState } from 'react'
import { accent, neutral, radius } from '../../../../theme/tokens'
import type { RecurringBooking } from '../../../../domain/types'
import {
  applyRecurringBookingsToCanvas,
  eligibleArchiveContactIds,
  runArchiveJob,
  setArchiveWindowDays,
  useAppStore,
  type Actor,
} from '../../../../store'
import { Button, StatusChip, TextField } from '../../../../shared'
import { formatCount, shortDay, locationName } from '../../../../shared/format'
import { useScaleMode } from '../../../../store/scaleMode'
import { applyAllLine } from '../../recurringBookingCopy'
import { useNavigate } from 'react-router-dom'
import { RecurringBookingSheet } from '../../flows/RecurringBookingSheet'
import { EditCell, MasterHeader, MasterTable } from './chrome'
import { cellStyle } from './tableStyles'
import { Card, ResultLine, TextAction } from '../../../../shared/ui'
import { ADMIN_FORM_WIDTH } from '../../layout'
import { sessionText } from '../../../../domain/outOfHours'

/**
 * The Master data views catch-up Phase 17 did not change, moved out of the
 * old single file as they were: recurring bookings, list
 * statuses, and Xero & archiving. (Contracts and Parties have their own files
 * since catch-up Phase 18.)
 */

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ---------------------------------------------------------------------------
// Recurring bookings
// ---------------------------------------------------------------------------

export function RecurringBookingsMaster({ actor }: { actor: Actor }) {
  const recurringBookings = useAppStore((s) => s.masters.recurringBookings)
  const [sheet, setSheet] = useState<{ id?: string } | null>(null)
  return (
    <>
      <RecurringBookingsView actor={actor} onEdit={(id) => setSheet({ id })} onAdd={() => setSheet({})} />
      {sheet !== null && (
        <RecurringBookingSheet open actor={actor} recurringBooking={sheet.id !== undefined ? recurringBookings[sheet.id] : undefined} onClose={() => setSheet(null)} />
      )}
    </>
  )
}

/**
 * Recurring bookings (US-01.3.2, DM-53; catch-up Phase 30): the standing
 * arrangements, with when each runs, retired ones muted at the foot, and the
 * view-level "Apply to canvas now" that re-paints every running arrangement
 * onto sessions that have come free (it never removes).
 */
function RecurringBookingsView({ actor, onEdit, onAdd }: { actor: Actor; onEdit: (id: string) => void; onAdd: () => void }) {
  const masters = useAppStore((s) => s.masters)
  const navigate = useNavigate()
  const [result, setResult] = useState<{ line: string; firstDate?: string } | null>(null)
  const byName = (a: RecurringBooking, b: RecurringBooking) => {
    const an = masters.anaesthetists[a.anaesthetistId]?.name ?? ''
    const bn = masters.anaesthetists[b.anaesthetistId]?.name ?? ''
    return an.localeCompare(bn) || ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7) || a.session.localeCompare(b.session)
  }
  const all = Object.values(masters.recurringBookings)
  const rows = [...all.filter((r) => r.retiredAtISO === undefined).sort(byName), ...all.filter((r) => r.retiredAtISO !== undefined).sort(byName)]

  function applyAll() {
    const out = applyRecurringBookingsToCanvas(useAppStore, actor)
    if (!out.ok) {
      setResult({ line: out.message })
      return
    }
    setResult({ line: applyAllLine(out.value), ...(out.value.firstAffectedDateISO !== undefined ? { firstDate: out.value.firstAffectedDateISO } : {}) })
  }

  const runs = (r: RecurringBooking) => {
    if (r.retiredAtISO !== undefined) return r.effectiveToISO !== undefined ? `Retired, last ${shortDay(r.effectiveToISO)}` : 'Retired'
    if (r.effectiveFromISO === undefined && r.effectiveToISO === undefined) return 'Ongoing'
    const from = r.effectiveFromISO !== undefined ? `From ${shortDay(r.effectiveFromISO)}` : ''
    const to = r.effectiveToISO !== undefined ? `until ${shortDay(r.effectiveToISO)}` : 'ongoing'
    return from !== '' ? `${from}, ${to}` : `Until ${shortDay(r.effectiveToISO!)}`
  }

  return (
    <>
      <MasterHeader
        title="Recurring bookings"
        sub="Standing arrangements of hospital, anaesthetist and surgeon on a day and session, each creating its Lists across the schedule ahead. Applying adds or updates empty Lists from tomorrow; Lists with Bookings or office edits are left as they are."
        actions={<Button variant="secondary" size="desktop" onClick={applyAll}>Apply to canvas now</Button>}
        add={{ label: 'Add recurring booking', onClick: onAdd }}
      />
      <ResultLine
        line={result?.line}
        shot="recurring-bookings-apply-result"
        actions={
          result?.firstDate !== undefined ? (
            <TextAction size="sm" flush onClick={() => navigate(`/admin/day/${result.firstDate}`)}>Show on day grid</TextAction>
          ) : undefined
        }
      />
      <MasterTable shot="recurring-bookings-table" label="Recurring bookings" columns={['Anaesthetist', 'Day', 'Session', 'Kind', 'Hospital', 'Surgeon', 'Runs', '']} rightAlign={[7]}>
        {rows.map((p) => {
          const retired = p.retiredAtISO !== undefined
          const style = retired ? { ...cellStyle, color: neutral.mist } : cellStyle
          return (
            <tr key={p.id} data-recurring-booking={p.id} data-retired={retired ? 'true' : undefined} style={retired ? { background: neutral.bg } : undefined}>
              <td style={style}>{masters.anaesthetists[p.anaesthetistId]?.name ?? p.anaesthetistId}</td>
              <td style={style}>{DAY_LABELS[p.dayOfWeek]}</td>
              <td style={style}>{sessionText(p.session)}</td>
              <td style={style}><span style={{ opacity: retired ? 0.6 : 1 }}><StatusChip status={p.kind} /></span></td>
              <td style={style}>{locationName(p.hospitalId, masters.hospitals)}</td>
              <td style={style}>{p.surgeonId !== null ? (masters.surgeons[p.surgeonId]?.name ?? p.surgeonId) : '·'}</td>
              <td style={style}>{runs(p)}</td>
              {retired ? <td style={style} /> : <EditCell onClick={() => onEdit(p.id)} />}
            </tr>
          )
        })}
      </MasterTable>
    </>
  )
}

// ---------------------------------------------------------------------------
// Xero & archiving (the configurable inactivity window + the nightly job)
// ---------------------------------------------------------------------------

export function XeroArchivingView({ actor }: { actor: Actor }) {
  const settings = useAppStore((s) => s.settings)
  const xero = useAppStore((s) => s.xero)
  const billing = useAppStore((s) => s.billing)
  const clock = useAppStore((s) => s.clock)
  const [windowInput, setWindowInput] = useState(String(settings.contactArchiveInactivityDays))
  const [windowMsg, setWindowMsg] = useState<string | null>(null)
  const [runMsg, setRunMsg] = useState<string | null>(null)

  const eligible = useMemo(
    () => eligibleArchiveContactIds({ xero, billing, settings, clock }),
    [xero, billing, settings, clock],
  )
  const archivedCount = useMemo(() => Object.values(xero.contacts).filter((c) => c.archived).length, [xero.contacts])
  const vs = settings.volumeStory
  const scaleCounts = useScaleMode((s) => (s.mode === 'fullScale' ? s.counts : null))
  const contactCount = Object.keys(xero.contacts).length

  function saveWindow() {
    const outcome = setArchiveWindowDays(useAppStore, actor, Number(windowInput))
    setWindowMsg(
      outcome.ok
        ? `Archive window set to ${Math.round(Number(windowInput))} days. Next-run eligibility updated.`
        : outcome.message,
    )
  }

  function runNow() {
    const outcome = runArchiveJob(useAppStore)
    if (!outcome.ok) {
      setRunMsg(outcome.message)
      return
    }
    setRunMsg(
      outcome.value.count === 0
        ? 'No individual contacts are eligible to archive right now (fully paid + inactive beyond the window).'
        : `Archived ${outcome.value.count} contact${outcome.value.count === 1 ? '' : 's'}. Active-contact count is now ${useAppStore.getState().settings.volumeStory.activeContacts.toLocaleString('en-NZ')}.`,
    )
  }

  return (
    <>
      <MasterHeader title="Xero & archiving" sub="Contact-archive policy for the Xero contact store. Patient and Billable Party contacts archive once fully paid and inactive; organisational contacts never archive." />

      {/* Configurable window */}
      <Card padding="card" titleLevel={3} title="Contact archive inactivity window" style={{ maxWidth: ADMIN_FORM_WIDTH }}>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>
          A contact is archived once every invoice is paid and this many days pass with no activity. 90
          days is an example, not a fixed rule. Changing it changes which contacts the next nightly run archives.
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ width: 160 }}>
            <TextField label="Inactivity days" value={windowInput} onChange={setWindowInput} mono />
          </div>
          <Button variant="secondary" onClick={saveWindow}>Save window</Button>
        </div>
        {windowMsg !== null && <div style={{ fontSize: 12.5, color: accent.pressed }}>{windowMsg}</div>}
      </Card>

      {/* Nightly job */}
      <Card padding="card" titleLevel={3} title="Nightly contact-archive job" style={{ maxWidth: ADMIN_FORM_WIDTH }}>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>
          The scheduled job runs automatically each time the demo clock advances a day. Run it now to
          archive currently-eligible contacts. {eligible.length} contact{eligible.length === 1 ? '' : 's'} eligible right now;
          {' '}{archivedCount} already archived.
        </div>
        <div data-shot="archive-scale-line" style={{ fontSize: 12, color: neutral.mist, background: neutral.sunken, borderRadius: radius.ctl, padding: '8px 12px' }}>
          {scaleCounts !== null ? (
            // Catch-up Phase 43: counted from the loaded full-scale data.
            <>
              Scale (counted from the loaded data): <span className="mono">{formatCount(scaleCounts.invoicesLast12Months)}</span> invoices in the last 12 months,{' '}
              <span className="mono">{formatCount(contactCount)}</span> contacts, <span className="mono">{formatCount(vs.activeContacts)}</span> active against Xero&apos;s ~{formatCount(vs.softLimit)} soft limit.
            </>
          ) : (
            <>
              Scale (narrated, not simulated): ~{vs.invoicesPerYear.toLocaleString('en-NZ')} invoices/year, ~{vs.oneTimePct}% one-time
              clients, {vs.activeContacts.toLocaleString('en-NZ')} active contacts against Xero&apos;s ~{vs.softLimit.toLocaleString('en-NZ')} soft limit.
            </>
          )}
        </div>
        <div>
          <Button variant="secondary" onClick={runNow}>Run nightly archive job now</Button>
        </div>
        {runMsg !== null && <div style={{ fontSize: 12.5, color: accent.pressed }}>{runMsg}</div>}
      </Card>
    </>
  )
}

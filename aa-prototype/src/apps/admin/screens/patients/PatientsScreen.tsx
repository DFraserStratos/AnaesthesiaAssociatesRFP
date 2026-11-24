/**
 * Admin · Patients (catch-up Phase 40, item 12; US-11.1.1, US-11.1.5,
 * US-11.3.2, US-11.3.3): the three list views on routed tabs, each with its
 * count: Search, Waiting for NHI and Follow-up. Search and Waiting for NHI are
 * `fit` list pages; Follow-up is `fluid`, because its three sections are
 * tables of different shapes (money on the warnings, a reminder's text, a
 * received set of details), not groups of one list. The NHI is the
 * identifier everywhere; the internal patient id is never shown. Every figure
 * comes from the session-1 selectors (`store/patientSelectors.ts`), which read
 * 36's ledger, never `state.xero`.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearBalanceWarningWithNote,
  completeFollowUp,
  followUpsDue,
  openBalanceWarnings,
  patientBalanceThresholdDays,
  patientRecordView,
  patientSearch,
  patientsWithPendingDetails,
  useAppStore,
  waitingNhiRows,
  type Actor,
} from '../../../../store'
import { EmptyState, FormError, LineTabLink, LineTabs, NameSearchBox, PageHeader, TextAction } from '../../../../shared/ui'
import { ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../../shared/table'
import { ClearWarningButton, StrengthPill } from '../../../../shared/warnings'
import { patientPath } from '../../../../shared/patients'
import { formatDob, plural, shortDay, stampText } from '../../../../shared/format'
import { sessionText } from '../../../../domain/outOfHours'
import { accent, fontFamily, neutral } from '../../../../theme/tokens'
import { AdminPage, PageBody, PageToolbar } from '../../components/AdminPage'
import { ADMIN_PROSE_WIDTH } from '../../layout'
import { balanceText, detailsFromText } from './patientParts'
import { WaitingNhiView } from './WaitingNhiView'

export type PatientListView = 'search' | 'waiting' | 'followUp'

export const PATIENT_LIST_PATHS: Record<PatientListView, string> = {
  search: '/admin/patients',
  waiting: '/admin/patients/waiting',
  followUp: '/admin/patients/follow-up',
}

const SHOTS: Record<PatientListView, string> = {
  search: 'admin-patients',
  waiting: 'admin-waiting-nhi',
  followUp: 'admin-patient-follow-up',
}

/** The slices every patient selector reads, picked one by one so a render only follows what changed. */
function usePatientSlices() {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  const patientCare = useAppStore((s) => s.patientCare)
  const intake = useAppStore((s) => s.intake)
  const audit = useAppStore((s) => s.audit)
  return useMemo(
    () => ({ billing, schedule, masters, appSettings, clock, patientCare, intake, audit }),
    [billing, schedule, masters, appSettings, clock, patientCare, intake, audit],
  )
}
export { usePatientSlices }

export function PatientsScreen({
  view,
  actor,
  onOpenList,
  onOpenMatching,
}: {
  view: PatientListView
  actor: Actor
  onOpenList: (listId: string) => void
  onOpenMatching: (rowId: string) => void
}) {
  const slices = usePatientSlices()
  const [query, setQuery] = useState('')
  const searchRows = useMemo(() => patientSearch(slices, query), [slices, query])
  const waiting = useMemo(() => waitingNhiRows(slices), [slices])
  const warnings = useMemo(() => openBalanceWarnings(slices), [slices])
  const due = useMemo(() => followUpsDue(slices), [slices])
  const pending = useMemo(() => patientsWithPendingDetails(slices), [slices])
  const followUpCount = warnings.length + due.length + pending.length

  const counts: Record<PatientListView, number> = { search: searchRows.length, waiting: waiting.length, followUp: followUpCount }
  const labels: Record<PatientListView, string> = { search: 'Search', waiting: 'Waiting for NHI', followUp: 'Follow-up' }

  return (
    <AdminPage
      mode={view === 'followUp' ? 'fluid' : 'fit'}
      shot={SHOTS[view]}
      title="Patients"
      sub="Find a patient by name, NHI or date of birth. The NHI is the patient's identifier."
      tabs={
        <LineTabs label="Patients view" shot="patients-tabs">
          {(['search', 'waiting', 'followUp'] as const).map((v) => {
            const active = v === view
            return (
              <LineTabLink
                key={v}
                to={PATIENT_LIST_PATHS[v]}
                active={active}
                data-patients-view={v}
                badge={<span style={{ fontFamily: fontFamily.mono, fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: active ? accent.base : neutral.slate }}>{counts[v]}</span>}
              >
                {labels[v]}
              </LineTabLink>
            )
          })}
        </LineTabs>
      }
    >
      {view === 'search' && <SearchView query={query} onQuery={setQuery} rows={searchRows} />}
      {view === 'waiting' && <WaitingNhiView rows={waiting} actor={actor} onOpenList={onOpenList} onOpenMatching={onOpenMatching} />}
      {view === 'followUp' && <FollowUpView actor={actor} />}
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function SearchView({ query, onQuery, rows }: { query: string; onQuery: (q: string) => void; rows: ReturnType<typeof patientSearch> }) {
  const navigate = useNavigate()
  return (
    <>
      <PageToolbar
        end={
          query.trim() === '' ? (
            <span>Booked in the next 14 days, then anyone to follow up</span>
          ) : (
            <span className="mono">{plural(rows.length, 'patient')}</span>
          )
        }
      >
        <NameSearchBox label="Search patients" placeholder="Name, NHI or date of birth" value={query} onChange={onQuery} size="pill" width={420} shot="patient-search-box" />
      </PageToolbar>
      <PageBody>
      {rows.length === 0 ? (
        <EmptyState variant="card" shot="patient-search-empty">No patient matches "{query.trim()}". Try the NHI or the date of birth.</EmptyState>
      ) : (
        <TableShell fit label="Patients" density="compact" minWidth={760} shot="patient-search-table">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>NHI</Th>
              <Th>Date of birth</Th>
              <Th>Next Booking</Th>
              <Th align="right">Balance</Th>
              <Th>Warning</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <ClickableRow key={r.nhi} onOpen={() => navigate(patientPath(r.nhi))} data-patient-nhi={r.nhi}>
                <Td bold>
                  <RowOpenButton label={`Open the record of ${r.name}, NHI ${r.nhi}`} onOpen={() => navigate(patientPath(r.nhi))}>{r.name}</RowOpenButton>
                </Td>
                <Td mono>{r.nhi}</Td>
                <Td nowrap>
                  {r.dobISO === '' ? <span style={{ color: neutral.mist }}>{formatDob(r.dobISO)}</span> : <span className="mono">{formatDob(r.dobISO)}</span>}
                  {r.age !== undefined && <span style={{ color: neutral.mist }}> · {r.age}</span>}
                </Td>
                <Td nowrap>{r.nextBooking !== undefined ? <><span className="mono">{shortDay(r.nextBooking.dateISO)}</span> {sessionText(r.nextBooking.session)}</> : <span style={{ color: neutral.mist }}>None</span>}</Td>
                <Td align="right" mono>{balanceText(r.balance)}</Td>
                <Td><StrengthPill strength={r.warning} size="sm" /></Td>
              </ClickableRow>
            ))}
          </tbody>
        </TableShell>
      )}
      </PageBody>
    </>
  )
}

// ---------------------------------------------------------------------------
// Follow-up: balance warnings, reminders due, details to review
// ---------------------------------------------------------------------------

function SectionTitle({ title, count }: { title: string; count: number }) {
  return <PageHeader size="section" level={2} title={title} count={<span className="mono" style={{ fontSize: 13, color: neutral.slate }}>{count}</span>} />
}

function FollowUpView({ actor }: { actor: Actor }) {
  const slices = usePatientSlices()
  const [error, setError] = useState<string | null>(null)
  const threshold = patientBalanceThresholdDays(slices)
  const warnings = useMemo(() => {
    const rows = openBalanceWarnings(slices)
    const rank = (s: string) => (s === 'strong' ? 0 : 1)
    return rows
      .map((r) => {
        const patient = slices.masters.patients[r.patientId]
        const view = patient !== undefined ? patientRecordView(slices, patient.nhi) : undefined
        const list = slices.schedule.lists[r.listId]
        return { row: r, patient, owed: view?.billedToPatient, list }
      })
      .sort((a, b) => rank(a.row.warning.strength) - rank(b.row.warning.strength) || a.row.dateISO.localeCompare(b.row.dateISO))
  }, [slices])
  const due = useMemo(() => followUpsDue(slices), [slices])
  const pending = useMemo(() => patientsWithPendingDetails(slices), [slices])

  return (
    <PageBody gap={24}>
      <p data-shot="patient-threshold-line" style={{ margin: 0, fontSize: 13, color: neutral.slate, maxWidth: ADMIN_PROSE_WIDTH, lineHeight: '19px' }}>
        Strong when an invoice billed to the patient is unpaid more than <span className="mono">{threshold}</span> days from its invoice date. A patient in credit shows a mild warning.{' '}
        <TextAction to="/admin/masters?view=patientBalance" size="sm" flush style={{ fontSize: 'inherit' }}>Change in Master data</TextAction>
      </p>
      <FormError message={error} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionTitle title="Balance warnings" count={warnings.length} />
        {warnings.length === 0 ? (
          <EmptyState variant="card" shot="patient-follow-up-warnings-empty">No open balance warnings.</EmptyState>
        ) : (
          <TableShell label="Balance warnings" density="compact" minWidth={960} shot="patient-follow-up-warnings">
            <thead>
              <tr>
                <Th>Patient</Th>
                <Th>Booking</Th>
                <Th>Warning</Th>
                <Th align="right">Owes</Th>
                <Th align="right">Oldest</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {warnings.map(({ row, patient, owed, list }) => (
                <tr key={row.warning.key} data-warning-key={row.warning.key}>
                  <Td bold>{patient !== undefined ? <TextAction to={patientPath(patient.nhi)} size="sm" flush style={{ fontSize: 'inherit' }} label={`Open the record of ${patient.name}`}>{patient.name}</TextAction> : 'A patient'}</Td>
                  <Td nowrap>
                    <span className="mono">{shortDay(row.dateISO)}</span> {sessionText(row.session)}
                    {list !== undefined && <span style={{ color: neutral.mist }}> · {slices.masters.hospitals[list.hospitalId]?.name ?? ''}</span>}
                  </Td>
                  <Td><StrengthPill strength={row.warning.strength} size="sm" /></Td>
                  <Td align="right" mono>{owed !== undefined ? balanceText(owed.net) : ''}</Td>
                  <Td align="right" mono nowrap>{owed !== undefined && owed.owingCount > 0 ? `${owed.oldestAgeDays} days` : ''}</Td>
                  <Td align="right" nowrap>
                    <span style={{ display: 'inline-flex', gap: 14, alignItems: 'center' }}>
                      {patient !== undefined && <TextAction to={patientPath(patient.nhi)} size="sm" flush>Open record</TextAction>}
                      <ClearWarningButton
                        compact
                        warning={row.warning}
                        label={`${row.warning.strength === 'mild' ? 'Clear (optional)' : 'Clear'} the balance warning for ${patient?.name ?? 'this patient'}`}
                        onClear={() => {
                          const res = clearBalanceWarningWithNote(useAppStore, actor, row.bookingId, row.warning.key)
                          setError(res.ok ? null : res.message)
                        }}
                      />
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionTitle title="Follow-ups due" count={due.length} />
        {due.length === 0 ? (
          <EmptyState variant="card" shot="patient-follow-up-due-empty">No reminders are due today.</EmptyState>
        ) : (
          <TableShell label="Follow-ups due" density="compact" minWidth={760} shot="patient-follow-ups-due">
            <thead>
              <tr>
                <Th>Patient</Th>
                <Th>Reminder</Th>
                <Th>Due</Th>
                <Th>Set by</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {due.map((f) => {
                const patient = slices.masters.patients[f.patientId]
                return (
                  <tr key={f.id} data-follow-up-id={f.id}>
                    <Td bold>{patient !== undefined ? <TextAction to={patientPath(patient.nhi)} size="sm" flush style={{ fontSize: 'inherit' }}>{patient.name}</TextAction> : 'A patient'}</Td>
                    <Td>{f.text}</Td>
                    <Td mono nowrap>{f.dueDateISO !== undefined ? shortDay(f.dueDateISO) : ''}</Td>
                    <Td nowrap style={{ color: neutral.slate }}>{f.by}, <span className="mono">{stampText(f.atISO)}</span></Td>
                    <Td align="right">
                      <TextAction size="sm" flush label={`Mark done: ${f.text}`} onClick={() => {
                        const res = completeFollowUp(useAppStore, actor, f.id)
                        setError(res.ok ? null : res.message)
                      }}>Done</TextAction>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </TableShell>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionTitle title="Details to review" count={pending.length} />
        {pending.length === 0 ? (
          <EmptyState variant="card" shot="patient-details-review-empty">No patient details are waiting for review.</EmptyState>
        ) : (
          <TableShell label="Details to review" density="compact" minWidth={760} shot="patient-details-review">
            <thead>
              <tr>
                <Th>Patient</Th>
                <Th>NHI</Th>
                <Th>Differences</Th>
                <Th>Received</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.nhi} data-patient-nhi={p.nhi}>
                  <Td bold>{p.name}</Td>
                  <Td mono>{p.nhi}</Td>
                  <Td>{plural(p.pendingDetails!.differences.length, 'detail')} from {detailsFromText(p.pendingDetails!)}</Td>
                  <Td mono nowrap>{stampText(p.pendingDetails!.receivedAtISO)}</Td>
                  <Td align="right"><TextAction to={patientPath(p.nhi)} size="sm" flush label={`Review the details of ${p.name}`}>Review</TextAction></Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </section>
    </PageBody>
  )
}

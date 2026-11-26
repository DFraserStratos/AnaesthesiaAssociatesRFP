/**
 * The patient's page (catch-up Phase 40; build plan Phases 53 and 57; US-11.1.1, US-11.3.1,
 * US-11.3.2, US-11.3.3, US-13.2.2): `/admin/people/patients/:nhi`, on the record pattern every People
 * page shares (D104). The NHI is the key and sits beside the name; the internal id is never shown.
 *
 * A `fluid` record with the side panel: the main column holds the balance tiles, the Needs the office
 * card (the patient's reasons from `patientsNeedingOffice`, each with its action in place: Clear with a
 * note, Done on a due reminder, Keep or Use on details that differ), the Invoices across every
 * anaesthetist and the Follow-up log. The side panel holds Details, edited in place as one audited
 * `patient.update` (`EditableCard` with the form `EditPatientSheet` shares), and the Bookings, a few
 * with See all. No tabs (US-11.1.1 and D104 win over the design page's). Back returns to the list the
 * office came from. Everything reads `patientRecordView`, which reads 36's ledger, never `state.xero`.
 *
 * The data-quality flag (build plan Phase 68's join; DM-15): an ethnicity code held for review
 * (`dataQualityItems`) shows in Needs the office with Apply code (`correctEthnicityCode`), which moved
 * here from Intake's retired Data quality tab. Applying a valid code clears the flag.
 */

import { Fragment, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  clearBalanceWarningWithNote,
  completeFollowUp,
  correctEthnicityCode,
  creditNoteForInvoice,
  dataQualityItems,
  editPatient,
  logPatientFollowUp,
  openBalanceWarnings,
  patientByNhi,
  patientNeedReasons,
  patientRecordView,
  resendInvoiceFromRecord,
  resolvePatientDetails,
  useAppStore,
  type Actor,
  type DataQualityItem,
  type FollowUpKind,
  type PatientBookingRow,
  type PatientInvoiceRow,
  type PatientNeedReason,
  type PatientRecordView,
} from '../../../../store'
import type { Patient, PatientDetailField, PatientFollowUp } from '../../../../domain/types'
import { Button, Card, DefList, DefRow, EditableCard, EmptyState, FormError, Pill, RailSection, ResultLine, SelectField, StatTile, TextAction, TextArea, TextField, useCardEdit, type RailSectionRow } from '../../../../shared/ui'
import { Segmented } from '../../../../shared/ui'
import { TableShell, Td, Th } from '../../../../shared/table'
import { useBookingWarnings, WarningsPanel, ClearWarningButton, StrengthPill } from '../../../../shared/warnings'
import type { Warning } from '../../../../domain/warnings'
import { PatientFormFields, patientDraftBlocked, patientDraftOf, patientPatchOf, type PatientDraft } from '../../../../shared/flows'
import { formatDob, formatMoney, plainDate, plural, shortDay, stampText } from '../../../../shared/format'
import { formatPostalAddress } from '../../../../domain/billing/payer'
import { sessionText } from '../../../../domain/outOfHours'
import { neutral } from '../../../../theme/tokens'
import { UNASSIGNED } from '../../../../shared/scheduleTerms'
import { AdminPage, PageBody } from '../../components/AdminPage'
import { patientsBackPath, usePatientSlices } from './PatientsScreen'
import { balanceText, DetailChoiceTable, detailsFromText, InvoiceStatusPill, reasonText } from './patientParts'
import { RegisterRefreshPanel, RegisterRefreshRow } from './RegisterRefresh'
import { creditNotePath, invoicePath } from '../finances/financePaths'

const NOT_SUPPLIED = <span style={{ color: neutral.mist }}>Not supplied</span>

/** How many Bookings the side panel shows before See all. */
const RAIL_BOOKINGS = 3
/** Why Details' Save is held back: a blank name, or an NHI or Ethnicity code marked under its field. */
const DETAILS_BLOCKED = 'A patient needs a name, and any field marked above fixed, before Save.'

export function PatientRecord({ nhi, actor, onOpenBooking }: { nhi: string; actor: Actor; onOpenBooking?: (dateISO: string, bookingId: string) => void }) {
  const slices = usePatientSlices()
  const view = useMemo(() => patientRecordView(slices, nhi), [slices, nhi])
  const reasons = useMemo(() => patientNeedReasons(slices, nhi), [slices, nhi])
  // The record itself, for the actions that take it (never shown).
  const patient = useAppStore((s) => patientByNhi(s, nhi))
  const masters = useAppStore((s) => s.masters)
  const quality = useMemo(() => (patient === undefined ? undefined : dataQualityItems({ masters }).find((i) => i.patientId === patient.hiddenInternalId)), [masters, patient])
  const navigate = useNavigate()
  const location = useLocation()
  const openBooking = onOpenBooking ?? ((dateISO: string, bookingId: string) => navigate(`/admin/day/${dateISO}/bookings/${bookingId}`))
  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const [linkInvoice, setLinkInvoice] = useState<string>('')

  if (view === undefined || patient === undefined) return null

  const logFollowUp = (invoiceId?: string) => {
    if (invoiceId !== undefined) setLinkInvoice(invoiceId)
    composerRef.current?.focus()
  }

  const rail = (
    <>
      <DetailsCard view={view} patient={patient} actor={actor} />
      <BookingsSection view={view} />
    </>
  )

  return (
    <AdminPage
      mode="fluid"
      shot="admin-patient-record"
      data-patient-nhi={view.patient.nhi}
      back={{ label: 'Patients', to: patientsBackPath(location.state) }}
      title={view.patient.name}
      aside={
        <Pill size="lg" mono shot="patient-record-nhi" ariaLabel={`NHI ${view.patient.nhi}`}>
          NHI {view.patient.nhi}
        </Pill>
      }
      sub={
        <span>
          Born {view.patient.dobISO === '' ? NOT_SUPPLIED : <span className="mono">{formatDob(view.patient.dobISO)}</span>}
          {view.age !== undefined && <>, {view.age}</>}
        </span>
      }
    >
      <PageBody gap={18} rail={rail} railLabel="Patient details">
        <BalanceTiles view={view} patientId={patient.hiddenInternalId} />
        {(reasons.length > 0 || quality !== undefined) && <NeedsOfficeCard view={view} patient={patient} reasons={reasons} quality={quality} actor={actor} onLogFollowUp={() => logFollowUp()} />}
        <InvoicesCard view={view} actor={actor} onLogFollowUp={logFollowUp} onOpenBooking={openBooking} />
        <FollowUpLogCard view={view} actor={actor} linkInvoice={linkInvoice} onLinkInvoice={setLinkInvoice} composerRef={composerRef} />
      </PageBody>
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
// Balance tiles and the By payer line
// ---------------------------------------------------------------------------

function BalanceTiles({ view, patientId }: { view: PatientRecordView; patientId: string }) {
  const own = view.billedToPatient
  const others = view.balance.byPayer.filter((p) => !(p.billedTo.kind === 'patient' && p.billedTo.id === patientId))
  const ownSub =
    own.owingCount > 0
      ? `${plural(own.owingCount, 'unpaid invoice')}, oldest ${own.oldestAgeDays} days`
      : own.creditHeld > 0
        ? 'Credit held for the patient'
        : 'Nothing owing'
  return (
    <div data-shot="patient-balance" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        <StatTile variant="outlined" label="Balance" value={balanceText(view.balance.outstandingTotal)} sub="Every invoice, whoever pays" data-tile="balance" />
        <StatTile
          variant="outlined"
          label="Billed to the patient"
          value={balanceText(own.net)}
          {...(own.strength !== 'none' ? { tone: own.strength === 'strong' ? ('error' as const) : ('warning' as const) } : {})}
          sub={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <StrengthPill strength={own.strength} size="sm" shot="patient-balance-strength" />
              {ownSub}
            </span>
          }
          data-tile="billedToPatient"
        />
        <StatTile variant="outlined" label="Other payers" value={balanceText(view.otherPayersTotal)} sub={others.length === 0 ? 'None' : plural(others.length, 'payer')} data-tile="otherPayers" />
      </div>
      {view.balance.byPayer.length > 0 && (
        <div data-shot="patient-by-payer" style={{ fontSize: 12.5, color: neutral.slate }}>
          By payer:{' '}
          {view.balance.byPayer.map((p, i) => (
            <Fragment key={`${p.billedTo.kind}:${p.billedTo.id}`}>
              {i > 0 && ' · '}
              {p.name ?? 'A payer'} <span className="mono" style={{ color: neutral.ink }}>{balanceText(p.outstanding - p.creditHeld)}</span>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Needs the office (build plan Phase 57; US-11.3.3, DM-10)
// ---------------------------------------------------------------------------

/**
 * The patient's reasons to need the office, from the same read as the Needs follow-up list and the
 * People badge, each with its action in place. Resolving the last one takes the patient off the list
 * and drops the badge by one, with no extra code: they read the same selector.
 */
function NeedsOfficeCard({ view, patient, reasons, quality, actor, onLogFollowUp }: { view: PatientRecordView; patient: Patient; reasons: readonly PatientNeedReason[]; quality: DataQualityItem | undefined; actor: Actor; onLogFollowUp: () => void }) {
  const today = useAppStore((s) => s.clock.todayISO)
  const kinds = [...reasons.map((r) => r.kind), ...(quality !== undefined ? ['dataQuality'] : [])]
  return (
    <Card title="Needs the office" padding="panel" tone="warning" shot="patient-needs-office" data-reasons={kinds.join(' ')}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {reasons.map((reason, i) => {
          const t = reasonText(reason, today)
          return (
            <div key={reason.kind} data-reason={reason.kind} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: i === 0 ? '0 0 14px' : '14px 0', borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, color: neutral.ink }}>
                    {t.title}
                    {reason.kind === 'balance' && <StrengthPill strength={reason.strength} size="sm" />}
                  </span>
                  <span style={{ fontSize: 12.5, color: neutral.slate }}>{t.detail}</span>
                </span>
                <span style={{ display: 'inline-flex', gap: 14, alignItems: 'center' }}>
                  {reason.kind !== 'detailsDiffer' && <TextAction size="sm" flush onClick={onLogFollowUp} shot="patient-needs-log">Log a follow-up</TextAction>}
                  {reason.kind === 'followUpDue' && <DueDone followUpId={reason.followUpId} text={reason.text} actor={actor} />}
                </span>
              </div>
              {reason.kind === 'balance' && <RecordWarnings patientId={patient.hiddenInternalId} actor={actor} />}
              {reason.kind === 'detailsDiffer' && view.pendingDetails !== undefined && <DetailsDiffer view={view} patientId={patient.hiddenInternalId} actor={actor} />}
            </div>
          )
        })}
        {quality !== undefined && <DataQualityRow item={quality} first={reasons.length === 0} actor={actor} />}
      </div>
    </Card>
  )
}

/**
 * An ethnicity code that came in but is not a valid NZHIS code: held for review, never stored. The
 * office supplies a valid code and Apply code stores it (`correctEthnicityCode`), clearing the flag.
 */
function DataQualityRow({ item, first, actor }: { item: DataQualityItem; first: boolean; actor: Actor }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const apply = () => {
    const res = correctEthnicityCode(useAppStore, actor, item.patientId, code)
    setError(res.ok ? null : res.message)
  }
  return (
    <div data-reason="dataQuality" data-shot="patient-data-quality" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: first ? '0 0 14px' : '14px 0', borderTop: first ? 'none' : `1px solid ${neutral.line}` }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, color: neutral.ink }}>
          Ethnicity code not recognised
          <Pill size="sm" tone="warning" mono>{item.receivedCode}</Pill>
        </span>
        <span style={{ fontSize: 12.5, color: neutral.slate }}>
          The code received is held for review and not stored. {item.reason} Enter a valid NZHIS code to clear it.
        </span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <TextField
          label="Valid NZHIS ethnicity code"
          hideLabel
          value={code}
          onChange={(v) => {
            setCode(v)
            setError(null)
          }}
          placeholder="Valid NZHIS code"
          mono
          size="compact"
          fill="surface"
          width={160}
          invalid={error !== null}
          shot="patient-data-quality-code"
        />
        <Button variant="primary" size="compact" onClick={apply} disabled={code.trim() === ''} disabledReason={code.trim() === '' ? 'Enter a code first.' : undefined} shot="patient-data-quality-apply">
          Apply code
        </Button>
        <FormError message={error} variant="inline" />
      </span>
    </div>
  )
}

function DueDone({ followUpId, text, actor }: { followUpId: string; text: string; actor: Actor }) {
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <Button
        variant="secondary"
        size="compact"
        shot="patient-needs-done"
        ariaLabel={`Mark done: ${text}`}
        onClick={() => {
          const res = completeFollowUp(useAppStore, actor, followUpId)
          setError(res.ok ? null : res.message)
        }}
      >
        Done
      </Button>
      <FormError message={error} variant="inline" />
    </>
  )
}

/** The open balance warnings on the patient's Bookings (15a's WarningsPanel), each with Clear and a note. */
function RecordWarnings({ patientId, actor }: { patientId: string; actor: Actor }) {
  const slices = usePatientSlices()
  const bookingIds = useMemo(() => [...new Set(openBalanceWarnings(slices).filter((r) => r.patientId === patientId).map((r) => r.bookingId))], [slices, patientId])
  if (bookingIds.length === 0) return null
  return (
    <div data-shot="patient-warnings" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {bookingIds.map((id) => (
        <BookingBalanceWarnings key={id} bookingId={id} actor={actor} />
      ))}
    </div>
  )
}

function BookingBalanceWarnings({ bookingId, actor }: { bookingId: string; actor: Actor }) {
  const warnings = useBookingWarnings(bookingId).filter((w) => w.ruleId === 'patientBalance')
  return <WarningsPanel warnings={warnings} actor={actor} canClear={false} extra={(w) => (w.clearance === undefined ? <ClearWithNote warning={w} actor={actor} /> : null)} />
}

/** Clear, with an optional note logged to the follow-up log (linked by the warning key). */
function ClearWithNote({ warning, actor }: { warning: Warning; actor: Actor }) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <span style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap', width: '100%' }}>
      <span style={{ flex: '1 1 260px' }}>
        <TextField label="Note (optional)" size="compact" fill="surface" value={note} onChange={setNote} placeholder="Why the office is going ahead" shot="patient-clear-note" />
      </span>
      <ClearWarningButton
        warning={warning}
        label={`${warning.strength === 'mild' ? 'Clear (optional)' : 'Clear'} warning: ${warning.text}`}
        onClear={() => {
          const res = clearBalanceWarningWithNote(useAppStore, actor, warning.bookingId, warning.key, note)
          setError(res.ok ? null : res.message)
        }}
      />
      <FormError message={error} variant="inline" />
    </span>
  )
}

// ---------------------------------------------------------------------------
// Invoices (US-11.3.1)
// ---------------------------------------------------------------------------

function sortInvoices(rows: readonly PatientInvoiceRow[]): PatientInvoiceRow[] {
  const owing = (r: PatientInvoiceRow) => r.status === 'unpaid' || r.status === 'partPaid'
  const unpaid = rows.filter(owing).sort((a, b) => a.raisedAtISO.localeCompare(b.raisedAtISO))
  const rest = rows.filter((r) => !owing(r)).sort((a, b) => b.raisedAtISO.localeCompare(a.raisedAtISO))
  return [...unpaid, ...rest]
}

function InvoicesCard({
  view,
  actor,
  onLogFollowUp,
  onOpenBooking,
}: {
  view: PatientRecordView
  actor: Actor
  onLogFollowUp: (invoiceId: string) => void
  onOpenBooking: ((dateISO: string, bookingId: string) => void) | undefined
}) {
  const billing = useAppStore((s) => s.billing)
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const rows = useMemo(() => sortInvoices(view.invoices), [view.invoices])

  function resend(row: PatientInvoiceRow) {
    const res = resendInvoiceFromRecord(useAppStore, actor, view.patient.nhi, row.invoiceId)
    setError(res.ok ? null : res.message)
    setSent(res.ok ? `${row.invoiceNumber} sent again to ${res.value.to}.` : null)
    if (res.ok) setOpen((prev) => new Set(prev).add(row.invoiceId))
  }
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Card title="Invoices" padding="panel" shot="patient-invoices-card">
      <ResultLine shot="patient-resend-result" line={sent ?? undefined} onDismiss={() => setSent(null)} />
      <FormError message={error} />
      {rows.length === 0 ? (
        <EmptyState variant="inline">No invoices for this patient yet.</EmptyState>
      ) : (
        <TableShell label="Invoices" density="compact" minWidth={1040} shot="patient-invoices" nested>
          <thead>
            <tr>
              <Th>Number</Th>
              <Th>Anaesthetist</Th>
              <Th>Booking</Th>
              <Th>Billed to</Th>
              <Th>Raised</Th>
              <Th align="right">Age</Th>
              <Th align="right">Total</Th>
              <Th align="right">Outstanding</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const expanded = open.has(r.invoiceId)
              const credit = r.status === 'credited' ? creditNoteForInvoice({ billing }, r.invoiceId) : undefined
              const owing = r.status === 'unpaid' || r.status === 'partPaid'
              return (
                <Fragment key={r.invoiceId}>
                  <tr data-invoice-id={r.invoiceId} data-invoice-number={r.invoiceNumber} data-counts={r.countsTowardBalance ? 'true' : 'false'}>
                    <Td mono nowrap><TextAction to={invoicePath(r.invoiceId)} size="sm" flush style={{ fontSize: 'inherit', fontFamily: 'inherit' }}>{r.invoiceNumber}</TextAction></Td>
                    <Td nowrap>{r.anaesthetist ?? <span style={{ color: neutral.mist }}>AA Holding</span>}</Td>
                    <Td mono nowrap>
                      {r.bookingDateISO !== undefined && onOpenBooking !== undefined ? (
                        <TextAction size="sm" flush onClick={() => onOpenBooking(r.bookingDateISO!, r.bookingId)} label={`Open the Booking of ${shortDay(r.bookingDateISO)}`}>{plainDate(r.bookingDateISO)}</TextAction>
                      ) : r.bookingDateISO !== undefined ? plainDate(r.bookingDateISO) : ''}
                    </Td>
                    <Td>
                      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {r.billedToName ?? 'A payer'}
                        {r.countsTowardBalance && <Pill size="sm" tone="neutral" shot="patient-invoice-patient-tag">Patient</Pill>}
                      </span>
                    </Td>
                    <Td mono nowrap>{plainDate(r.raisedAtISO)}</Td>
                    <Td align="right" mono nowrap>{owing ? `${r.ageDays} days` : ''}</Td>
                    <Td align="right" mono>{formatMoney(r.total)}</Td>
                    <Td align="right" mono>{formatMoney(r.status === 'credited' ? 0 : r.outstanding)}</Td>
                    <Td>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                        <InvoiceStatusPill status={r.status} />
                        {r.creditHeld > 0 && (
                          <span style={{ fontSize: 12, color: neutral.slate }}>
                            Credit held <span className="mono">{formatMoney(r.creditHeld)}</span>
                            {credit !== undefined && (
                              <>
                                {' · '}
                                <TextAction to={creditNotePath(credit.id)} size="sm" flush style={{ fontSize: 'inherit' }}>{credit.creditNoteNumber}</TextAction>
                              </>
                            )}
                          </span>
                        )}
                      </span>
                    </Td>
                    <Td align="right" nowrap>
                      <span style={{ display: 'inline-flex', gap: 12 }}>
                        {r.resendable && <TextAction size="sm" flush onClick={() => resend(r)} label={`Resend ${r.invoiceNumber}`}>Resend</TextAction>}
                        <TextAction size="sm" flush onClick={() => onLogFollowUp(r.invoiceId)} label={`Log a follow-up on ${r.invoiceNumber}`}>Log follow-up</TextAction>
                        <TextAction size="sm" flush onClick={() => toggle(r.invoiceId)} ariaExpanded={expanded} label={`Send history of ${r.invoiceNumber}`}>
                          {`Sends (${r.sends.length})`}
                        </TextAction>
                      </span>
                    </Td>
                  </tr>
                  {expanded && (
                    <tr data-shot="patient-invoice-sends" data-invoice-id={r.invoiceId}>
                      <td colSpan={10} style={{ padding: '6px 10px 12px 28px', background: neutral.bg }}>
                        <SendHistory row={r} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <Td bold>Outstanding</Td>
              <td colSpan={6} />
              <Td align="right" mono bold>{formatMoney(view.invoicesOutstanding)}</Td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </TableShell>
      )}
    </Card>
  )
}

function SendHistory({ row }: { row: PatientInvoiceRow }) {
  const delivery = useAppStore((s) => s.billing.invoices[row.invoiceId]?.delivery)
  if (row.sends.length === 0) {
    const why = delivery?.status === 'toPost' ? 'Marked to post; not emailed yet.' : delivery?.status === 'noAddress' ? 'Not sent: no email address held.' : 'Not sent by the billing run.'
    return <span style={{ fontSize: 12.5, color: neutral.slate }}>{why}</span>
  }
  return (
    <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12.5 }}>
      {row.sends.map((s, i) => (
        <li key={`${s.atISO}-${i}`} data-send-index={i}>
          <span className="mono">{stampText(s.atISO)}</span> to {s.to}, by {s.by}
        </li>
      ))}
    </ol>
  )
}

/** Details received that differ from the record: Keep or Use each, then Apply (`resolvePatientDetails`). */
function DetailsDiffer({ view, patientId, actor }: { view: PatientRecordView; patientId: string; actor: Actor }) {
  const pending = view.pendingDetails!
  const [choices, setChoices] = useState<Partial<Record<PatientDetailField, 'keep' | 'useIncoming'>>>({})
  const [error, setError] = useState<string | null>(null)
  const from = detailsFromText(pending)
  return (
    <div data-shot="patient-details-differ" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 12.5 }}>
        From {from}, {stampText(pending.receivedAtISO)}. The record is unchanged: keep its value or use the incoming one, then apply.
      </span>
      <DetailChoiceTable
        rows={pending.differences}
        recordHeader="Record"
        incomingHeader="Incoming"
        choice={{
          header: 'Use',
          useLabel: 'Use incoming',
          value: (field) => (choices[field as PatientDetailField] === 'useIncoming' ? 'use' : 'keep'),
          onChange: (field, v) => setChoices((c) => ({ ...c, [field]: v === 'use' ? 'useIncoming' : 'keep' })),
        }}
      />
      <FormError message={error} />
      <div>
        <Button
          variant="primary"
          size="compact"
          shot="patient-details-apply"
          onClick={() => {
            const res = resolvePatientDetails(useAppStore, actor, patientId, choices)
            setError(res.ok ? null : res.message)
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The side panel: Details (edited in place) and Bookings
// ---------------------------------------------------------------------------

function DetailsCard({ view, patient, actor }: { view: PatientRecordView; patient: Patient; actor: Actor }) {
  const [refreshing, setRefreshing] = useState(false)
  const [refreshed, setRefreshed] = useState<string | null>(null)
  const rights = { nhi: false, ethnicity: actor.role === 'office' }
  const edit = useCardEdit<PatientDraft, PatientDraft>(
    () => patientDraftOf(patient),
    (draft) => editPatient(useAppStore, actor, patient.hiddenInternalId, patientPatchOf(draft, patient, rights)),
  )
  const p = view.patient
  const ethnicity =
    p.ethnicityCode !== undefined ? (
      <span className="mono">{p.ethnicityCode} · {view.ethnicityLabel ?? p.ethnicityCode}</span>
    ) : view.ethnicityPending !== undefined ? (
      <span>
        <span className="mono">{view.ethnicityPending.receivedCode}</span> held for review. {view.ethnicityPending.reason}
      </span>
    ) : (
      NOT_SUPPLIED
    )
  const draft = edit.draft
  return (
    <EditableCard
      title="Details"
      shot="patient-details"
      editable
      editing={draft !== null}
      onEdit={edit.start}
      onCancel={edit.cancel}
      onSave={() => {
        if (draft !== null && !patientDraftBlocked(draft, patient, rights)) edit.save(draft)
      }}
      saveDisabledReason={draft !== null && patientDraftBlocked(draft, patient, rights) ? DETAILS_BLOCKED : null}
      error={edit.error}
    >
      {draft !== null ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PatientFormFields draft={draft} onChange={edit.setDraft} rights={rights} />
        </div>
      ) : (
        <>
          <DefList gap={8}>
            <DefRow label="Name" labelWidth={104}>{p.name}</DefRow>
            <DefRow label="Date of birth" labelWidth={104} mono={p.dobISO !== ''}>{p.dobISO === '' ? NOT_SUPPLIED : formatDob(p.dobISO)}</DefRow>
            <DefRow label="Phone" labelWidth={104}>{p.phone ?? NOT_SUPPLIED}</DefRow>
            <DefRow label="Email" labelWidth={104}>{p.email ?? NOT_SUPPLIED}</DefRow>
            <DefRow label="Address" labelWidth={104}>{p.postalAddress !== undefined ? formatPostalAddress(p.postalAddress) : NOT_SUPPLIED}</DefRow>
            <DefRow label="Ethnicity" labelWidth={104} shot="patient-ethnicity">{ethnicity}</DefRow>
            {view.source !== undefined && (
              <DefRow label="Details from" labelWidth={104}>
                {view.source.who}, <span className="mono">{stampText(view.source.atISO)}</span>
              </DefRow>
            )}
            {/* Catch-up Phase 40a: refresh from the NHI register (hidden without an NHI, which the required NHI makes rare). */}
            {patient.nhi.trim() !== '' && (
              <RegisterRefreshRow
                {...(patient.registerRefreshedAtISO !== undefined ? { lastRefreshedAtISO: patient.registerRefreshedAtISO } : {})}
                open={refreshing}
                onRefresh={() => {
                  setRefreshed(null)
                  setRefreshing(true)
                }}
              />
            )}
          </DefList>
          {refreshing && (
            <RegisterRefreshPanel
              patientId={patient.hiddenInternalId}
              nhi={patient.nhi}
              patientName={patient.name}
              actor={actor}
              onClose={() => setRefreshing(false)}
              onDone={(line) => {
                setRefreshing(false)
                setRefreshed(line)
              }}
            />
          )}
          <ResultLine line={refreshed} onDismiss={() => setRefreshed(null)} shot="patient-register-done" />
        </>
      )}
    </EditableCard>
  )
}

function bookingRow(b: PatientBookingRow, upcoming: boolean): RailSectionRow {
  return {
    key: b.bookingId,
    to: `/admin/day/${b.dateISO}/bookings/${b.bookingId}`,
    title: `${shortDay(b.dateISO)} · ${sessionText(b.session)}${b.scheduledTime !== undefined ? ` ${b.scheduledTime}` : ''}`,
    sub: (
      <>
        {b.hospital} · {b.anaesthetist ?? UNASSIGNED}
        {!upcoming && ' · Past'}
      </>
    ),
    data: { 'data-booking-id': b.bookingId, 'data-upcoming': upcoming ? 'true' : 'false' },
  }
}

/** The patient's Bookings: the next few, See all for the rest, past ones included (most recent first). */
function BookingsSection({ view }: { view: PatientRecordView }) {
  const rows = [...view.upcoming.map((b) => bookingRow(b, true)), ...view.past.map((b) => bookingRow(b, false))]
  return <RailSection title="Bookings" countNoun="Bookings" rows={rows} limit={RAIL_BOOKINGS} empty="No Bookings for this patient." shot="patient-bookings" />
}

// ---------------------------------------------------------------------------
// The follow-up log (US-11.3.3)
// ---------------------------------------------------------------------------

const KIND_TEXT: Record<FollowUpKind, string> = { call: 'Call', note: 'Note', reminder: 'Reminder', resend: 'Resent' }
type ComposerKind = 'call' | 'note' | 'reminder'
const SAVE_TEXT: Record<ComposerKind, string> = { call: 'Log call', note: 'Add note', reminder: 'Set reminder' }

function FollowUpLogCard({
  view,
  actor,
  linkInvoice,
  onLinkInvoice,
  composerRef,
}: {
  view: PatientRecordView
  actor: Actor
  linkInvoice: string
  onLinkInvoice: (id: string) => void
  composerRef: React.MutableRefObject<HTMLTextAreaElement | null>
}) {
  const today = useAppStore((s) => s.clock.todayISO)
  const invoices = useAppStore((s) => s.billing.invoices)
  const [kind, setKind] = useState<ComposerKind>('call')
  const [text, setText] = useState('')
  // Undefined until the user picks a day, so the default follows the demo clock (today when saved).
  const [picked, setDue] = useState<string | undefined>(undefined)
  const due = picked ?? today
  const [error, setError] = useState<string | null>(null)

  function save() {
    const res = logPatientFollowUp(useAppStore, actor, {
      nhi: view.patient.nhi,
      kind,
      text,
      ...(kind === 'reminder' ? { dueDateISO: due } : {}),
      ...(linkInvoice !== '' ? { invoiceId: linkInvoice } : {}),
    })
    if (!res.ok) {
      setError(res.message)
      return
    }
    setError(null)
    setText('')
    setDue(undefined)
    onLinkInvoice('')
  }

  return (
    <Card title="Follow-up log" padding="card" shot="patient-follow-up-log">
      <div ref={(el) => { composerRef.current = el?.querySelector('textarea') ?? null }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Segmented<ComposerKind>
          label="Log"
          value={kind}
          size="sm"
          onChange={setKind}
          options={[
            { value: 'call', label: 'Call' },
            { value: 'note', label: 'Note' },
            { value: 'reminder', label: 'Reminder' },
          ]}
        />
        <TextArea ariaLabel={kind === 'call' ? 'What was said' : kind === 'note' ? 'Note' : 'What to do'} value={text} onChange={setText} size="compact" fill="well" placeholder={kind === 'call' ? 'Who you spoke to and what was agreed' : kind === 'note' ? 'A note for the office' : 'What to follow up'} shot="patient-follow-up-text" />
        {kind === 'reminder' && <TextField label="Remind on" type="date" size="compact" value={due} onChange={setDue} min={today} mono shot="patient-follow-up-date" />}
        <SelectField label="Invoice (optional)" size="compact" value={linkInvoice} onChange={onLinkInvoice}>
          <option value="">No invoice</option>
          {view.invoices.map((i) => (
            <option key={i.invoiceId} value={i.invoiceId}>{i.invoiceNumber}</option>
          ))}
        </SelectField>
        <FormError message={error} />
        <div>
          <Button variant="primary" size="compact" onClick={save} disabled={text.trim() === ''} disabledReason={text.trim() === '' ? 'Write what happened first.' : undefined} shot="patient-follow-up-save">
            {SAVE_TEXT[kind]}
          </Button>
        </div>
      </div>
      {view.followUps.length === 0 ? (
        <EmptyState variant="inline">Nothing logged yet.</EmptyState>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {view.followUps.map((f, i) => (
            <FollowUpItem key={f.id} entry={f} first={i === 0} invoiceNumber={f.invoiceId !== undefined ? invoices[f.invoiceId]?.invoiceNumber : undefined} actor={actor} today={today} />
          ))}
        </ol>
      )}
    </Card>
  )
}

function FollowUpItem({ entry, first, invoiceNumber, actor, today }: { entry: PatientFollowUp; first: boolean; invoiceNumber: string | undefined; actor: Actor; today: string }) {
  const [error, setError] = useState<string | null>(null)
  const openReminder = entry.kind === 'reminder' && entry.doneAtISO === undefined
  const overdue = openReminder && entry.dueDateISO !== undefined && entry.dueDateISO <= today
  return (
    <li data-follow-up-id={entry.id} data-kind={entry.kind} style={{ padding: '10px 0', borderTop: first ? 'none' : `1px solid ${neutral.sunken}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Pill size="sm" tone={overdue ? 'warning' : 'neutral'}>{KIND_TEXT[entry.kind]}</Pill>
        {entry.kind === 'reminder' && entry.dueDateISO !== undefined && <span className="mono" style={{ fontSize: 12 }}>{shortDay(entry.dueDateISO)}</span>}
        {invoiceNumber !== undefined && <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{invoiceNumber}</span>}
      </span>
      <span style={{ fontSize: 13.5 }}>{entry.text}</span>
      <span style={{ fontSize: 12, color: neutral.mist, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>{entry.by}, <span className="mono">{stampText(entry.atISO)}</span></span>
        {entry.doneAtISO !== undefined && <span>Done by {entry.doneBy ?? 'the office'}, <span className="mono">{stampText(entry.doneAtISO)}</span></span>}
        {openReminder && (
          <TextAction size="sm" flush label={`Mark done: ${entry.text}`} onClick={() => {
            const res = completeFollowUp(useAppStore, actor, entry.id)
            setError(res.ok ? null : res.message)
          }}>Done</TextAction>
        )}
      </span>
      <FormError message={error} variant="inline" />
    </li>
  )
}

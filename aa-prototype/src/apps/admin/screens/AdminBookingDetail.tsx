import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UnassignedPill } from '../components/draftLists/DraftListParts'
import { neutral } from '../../../theme/tokens'
import { BackLink, FormError, PageHeader, TextAction } from '../../../shared/ui'
import type { Procedure } from '../../../domain/types'
import { applyDefaultInvoiceDescription, useAppStore, type Actor } from '../../../store'
import { newerInvoiceDescription } from '../../../domain/billing/procedureStack'
import { StatusChip, useBookingWarnings, WarningTriangle } from '../../../shared'
import { BookingDetailBody, type PrepaymentOfficeLinks } from '../../../shared/booking'
import { ageYears, formatDob, nhiBadge, locationName } from '../../../shared/format'
import { ChangedSinceSubmittedPill, useChangedSinceSubmitted } from '../components/ChangedSinceSubmitted'
import { procedureLabel } from '../../../domain/billing/procedureStack'
import { listOriginText } from '../../../domain/lists/listOrigin'

interface AdminBookingDetailProps {
  bookingId: string
  actor: Actor
  todayISO: string
  onBack: () => void
  backLabel?: string
  /** The prepayment panel's links to the Invoices screen (catch-up Phase 27). */
  officeLinks?: PrepaymentOfficeLinks
}

/**
 * Admin booking detail — desktop chrome around the shared `BookingDetailBody` with the
 * OFFICE actor, so it gains the office billing-setup section (Step 2), edit
 * rights on SUBMITTED lists, the audited soft-cancel, and BTM/patient edits, all
 * audited `source=office`. Identical guards and validation to the other apps,
 * and the same desktop record layout the anaesthetist web app gets — both run
 * on `variant="web"`, so the capture column and sticky commit rail come free.
 */
export function AdminBookingDetail({ bookingId, actor, todayISO, onBack, backLabel = 'Day view', officeLinks }: AdminBookingDetailProps) {
  const booking = useAppStore((s) => s.schedule.bookings[bookingId])
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const masters = useAppStore((s) => s.masters)

  const list = booking !== undefined ? listsRecord[booking.listId] : undefined
  const primary: Procedure | undefined = useMemo(() => {
    if (booking === undefined) return undefined
    // The Booking's primary Procedure (catch-up Phase 23), not the first by id.
    return Object.values(proceduresRecord).find((p) => p.bookingId === bookingId && p.isPrimary)
  }, [booking, bookingId, proceduresRecord])

  // The hospital row this Booking came from or was last updated by (catch-up Phase 33): the newest applied one.
  const intakeRows = useAppStore((s) => s.intake.rows)
  const fromRowId = useMemo(
    () =>
      Object.values(intakeRows)
        .filter((r) => r.status === 'applied' && r.decision !== undefined && 'bookingId' in r.decision && r.decision.bookingId === bookingId)
        .sort((a, b) => (b.decidedAtISO ?? '').localeCompare(a.decidedAtISO ?? '') || b.id.localeCompare(a.id))[0]?.id,
    [intakeRows, bookingId],
  )
  // Under the invoice description: an office edit kept against newer hospital text (D73, OQ-130).
  const newerHospital = useMemo(
    () =>
      Object.values(proceduresRecord)
        .filter((p) => p.bookingId === bookingId)
        .flatMap((p) => {
          const newer = newerInvoiceDescription(p, masters.contracts)
          return newer !== undefined && newer.origin === 'hospital' ? [{ procedureId: p.id, text: newer.text }] : []
        }),
    [proceduresRecord, bookingId, masters.contracts],
  )
  const navigate = useNavigate()
  const [useError, setUseError] = useState<string | null>(null)

  const warnings = useBookingWarnings(bookingId)
  // The anaesthetist changed this Booking after submitting (catch-up Phase 38a).
  const changed = useChangedSinceSubmitted(booking?.listId)

  if (booking === undefined || list === undefined) return null
  const patient = masters.patients[booking.patientId]
  const badge = nhiBadge(patient?.nhi)
  const hospitalName = locationName(list.hospitalId, masters.hospitals)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackLink onClick={onBack} size="desktop">{backLabel}</BackLink>

      {/* The admin page title, 24/30 since UI unification U6 (was 26/32). */}
      <PageHeader
        size="admin"
        wrap
        title={patient?.name ?? 'Unknown patient'}
        aside={<WarningTriangle warnings={warnings} />}
        subStyle={{ marginTop: 0 }}
        sub={
          <>
            <div className="mono" style={{ fontSize: 12, color: neutral.mist, marginTop: 6 }}>
              {badge.text}
              {patient !== undefined && ` · DOB ${formatDob(patient.dobISO)} (${ageYears(patient.dobISO, todayISO)}y)`}
            </div>
            <div style={{ fontSize: 14, color: neutral.slate, marginTop: 2 }}>
              {primary !== undefined ? procedureLabel(primary, masters.rvgGroups, 1) : 'Procedure to capture'} · {hospitalName}
            </div>
            {/* Where its List came from (catch-up Phase 34; US-02.2.4), beside the Booking's own source in the body. */}
            <div data-shot="booking-list-origin" data-origin={list.origin.kind} style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>
              List origin · {listOriginText(list.origin, (id) => locationName(id, masters.hospitals))}
            </div>
            {fromRowId !== undefined && (
              <div style={{ marginTop: 4 }}>
                <TextAction size="sm" flush shot="booking-from-hospital-row" onClick={() => navigate('/admin/matching', { state: { selectRowId: fromRowId } })} style={{ color: neutral.slate }}>
                  From hospital row {fromRowId}
                </TextAction>
              </div>
            )}
          </>
        }
        actions={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* A Booking on a Draft List has no anaesthetist yet (catch-up Phase 31). */}
            {list.state === 'DRAFT' && <UnassignedPill />}
            {changed !== null && changed.bookingIds.includes(bookingId) && <ChangedSinceSubmittedPill cue={changed} />}
            <StatusChip status={list.kind} />
          </div>
        }
      />

      {newerHospital.map((n) => (
        <div key={n.procedureId} data-shot="booking-newer-hospital-text" style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', fontSize: 12.5, color: neutral.slate }}>
          <span>
            Newer hospital text has arrived: <span className="mono">“{n.text}”</span>
          </span>
          <TextAction
            size="sm"
            flush
            onClick={() => {
              const out = applyDefaultInvoiceDescription(useAppStore, actor, n.procedureId)
              setUseError(out.ok ? null : out.message)
            }}
          >
            Use it
          </TextAction>
        </div>
      ))}
      <FormError message={useError} />

      <BookingDetailBody bookingId={bookingId} actor={actor} onBack={onBack} {...(officeLinks !== undefined ? { officeLinks } : {})} />
    </div>
  )
}

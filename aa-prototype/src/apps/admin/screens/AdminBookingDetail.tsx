import { useMemo } from 'react'
import { UnassignedPill } from '../components/draftLists/DraftListParts'
import { neutral } from '../../../theme/tokens'
import { BackLink } from '../../../shared/ui'
import type { Procedure } from '../../../domain/types'
import { useAppStore, type Actor } from '../../../store'
import { StatusChip, useBookingWarnings, WarningTriangle } from '../../../shared'
import { BookingDetailBody } from '../../../shared/booking'
import { ageYears, formatDob, nhiBadge, locationName } from '../../../shared/format'
import { ChangedSinceSubmittedPill, useChangedSinceSubmitted } from '../components/ChangedSinceSubmitted'
import { procedureLabel } from '../../../domain/billing/procedureStack'

interface AdminBookingDetailProps {
  bookingId: string
  actor: Actor
  todayISO: string
  onBack: () => void
  backLabel?: string
}

/**
 * Admin booking detail — desktop chrome around the shared `BookingDetailBody` with the
 * OFFICE actor, so it gains the office billing-setup section (Step 2), edit
 * rights on SUBMITTED lists, the audited soft-cancel, and BTM/patient edits, all
 * audited `source=office`. Identical guards and validation to the other apps,
 * and the same desktop record layout the anaesthetist web app gets — both run
 * on `variant="web"`, so the capture column and sticky commit rail come free.
 */
export function AdminBookingDetail({ bookingId, actor, todayISO, onBack, backLabel = 'Day view' }: AdminBookingDetailProps) {
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

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 26, lineHeight: '32px', fontWeight: 700, letterSpacing: '-0.01em' }}>{patient?.name ?? 'Unknown patient'}</h1>
            <WarningTriangle warnings={warnings} />
          </div>
          <div className="mono" style={{ fontSize: 12, color: neutral.mist, marginTop: 6 }}>
            {badge.text}
            {patient !== undefined && ` · DOB ${formatDob(patient.dobISO)} (${ageYears(patient.dobISO, todayISO)}y)`}
          </div>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 2 }}>
            {primary !== undefined ? procedureLabel(primary, masters.rvgGroups, 1) : 'Procedure to capture'} · {hospitalName}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* A Booking on a Draft List has no anaesthetist yet (catch-up Phase 31). */}
          {list.state === 'DRAFT' && <UnassignedPill />}
          {changed !== null && changed.bookingIds.includes(bookingId) && <ChangedSinceSubmittedPill cue={changed} />}
          <StatusChip status={list.kind} />
        </div>
      </div>

      <BookingDetailBody bookingId={bookingId} actor={actor} onBack={onBack} />
    </div>
  )
}

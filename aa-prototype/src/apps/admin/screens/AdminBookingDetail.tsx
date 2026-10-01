import { useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { accent, neutral } from '../../../theme/tokens'
import type { Procedure } from '../../../domain/types'
import { useAppStore, type Actor } from '../../../store'
import { StatusChip } from '../../../shared'
import { BookingDetailBody } from '../../../shared/booking'
import { ageYears, formatDob, nhiBadge } from '../../../shared/format'

interface AdminBookingDetailProps {
  bookingId: string
  actor: Actor
  todayISO: string
  onBack: () => void
  /** Opens the new Booking a Copy made. */
  onCopied: (newBookingId: string) => void
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
export function AdminBookingDetail({ bookingId, actor, todayISO, onBack, onCopied, backLabel = 'Day view' }: AdminBookingDetailProps) {
  const booking = useAppStore((s) => s.schedule.bookings[bookingId])
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const masters = useAppStore((s) => s.masters)

  const list = booking !== undefined ? listsRecord[booking.listId] : undefined
  const primary: Procedure | undefined = useMemo(() => {
    if (booking === undefined) return undefined
    return Object.values(proceduresRecord)
      .filter((p) => p.bookingId === bookingId)
      .sort((a, b) => a.id.localeCompare(b.id))[0]
  }, [booking, bookingId, proceduresRecord])

  if (booking === undefined || list === undefined) return null
  const patient = masters.patients[booking.patientId]
  const badge = nhiBadge(patient?.nhi)
  const hospitalName = list.hospitalId !== undefined ? (masters.hospitals[list.hospitalId]?.name ?? 'Hospital') : 'AA rooms'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        <ChevronLeft size={16} strokeWidth={2.4} aria-hidden /> {backLabel}
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, lineHeight: '32px', fontWeight: 700, letterSpacing: '-0.01em' }}>{patient?.name ?? 'Unknown patient'}</h1>
          <div className="mono" style={{ fontSize: 12, color: neutral.mist, marginTop: 6 }}>
            {badge.text}
            {patient !== undefined && ` · DOB ${formatDob(patient.dobISO)} (${ageYears(patient.dobISO, todayISO)}y)`}
          </div>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 2 }}>
            {primary?.description || 'Operation to capture'} · {hospitalName}
          </div>
        </div>
        <StatusChip status={list.statusKey} />
      </div>

      <BookingDetailBody bookingId={bookingId} actor={actor} onBack={onBack} onCopied={onCopied} />
    </div>
  )
}

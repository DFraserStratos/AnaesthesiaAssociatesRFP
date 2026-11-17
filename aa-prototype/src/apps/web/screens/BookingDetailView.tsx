import { useMemo } from 'react'
import { neutral } from '../../../theme/tokens'
import type { Procedure } from '../../../domain/types'
import { useAppStore, type Actor } from '../../../store'
import { StatusChip, useBookingWarnings, WarningTriangle } from '../../../shared'
import { BookingDetailBody } from '../../../shared/booking'
import { ageYears, formatDob, nhiBadge, locationName } from '../../../shared/format'
import { procedureLabel } from '../../../domain/billing/procedureStack'
import { BackLink, PageHeader } from '../../../shared/ui'

interface BookingDetailViewProps {
  bookingId: string
  actor: Actor
  todayISO: string
  onBack: () => void
}

/**
 * Web booking detail (drill-down page; W2 / M6-M7 parity). Desktop chrome around
 * the shared `BookingDetailBody` — identical BTM capture, validation and lifecycle
 * guards to mobile; the edit / copy / add-booking flows render as centred dialogs
 * via the web surface.
 *
 * The chrome is a page header in the web app's own language (the 28/34 title
 * and slate sub-line the dashboard and lists table use), and then the body
 * spans the full page width. There is deliberately no wrapping panel: the web
 * `BookingLayout` puts the capture cards straight onto the grey canvas the way
 * every other web screen puts its panels there. Nesting white cards inside one
 * white panel was the mobile stack borrowed whole, and it flattened the
 * hierarchy on a surface that has room for a real one.
 */
export function BookingDetailView({ bookingId, actor, todayISO, onBack }: BookingDetailViewProps) {
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

  if (booking === undefined || list === undefined) return null
  const patient = masters.patients[booking.patientId]
  const badge = nhiBadge(patient?.nhi)
  const hospitalName = locationName(list.hospitalId, masters.hospitals)

  const header = (_collapsed: boolean, history: React.ReactNode) => (
    <PageHeader
      data-testid="web-booking-header"
      size="web"
      wrap
      style={{ gap: 20, marginBottom: 16 }}
      title={patient?.name ?? 'Unknown patient'}
      aside={<WarningTriangle warnings={warnings} />}
      subStyle={{ fontSize: 'inherit', color: 'inherit', marginTop: 0 }}
      sub={
        <>
          <div className="mono" style={{ fontSize: 12.5, color: neutral.mist, marginTop: 6 }}>
            {badge.text}
            {patient !== undefined && ` · DOB ${formatDob(patient.dobISO)} (${ageYears(patient.dobISO, todayISO)}y)`}
          </div>
          <div style={{ fontSize: 14, color: neutral.slate, marginTop: 2 }}>
            {primary !== undefined ? procedureLabel(primary, masters.rvgGroups, 1) : 'Procedure to capture'} · {hospitalName}
          </div>
        </>
      }
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 2 }}>
          <StatusChip status={list.kind} />
          {history}
        </div>
      }
    />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackLink onClick={onBack}>List</BackLink>

      <BookingDetailBody bookingId={bookingId} actor={actor} onBack={onBack} header={header} />
    </div>
  )
}

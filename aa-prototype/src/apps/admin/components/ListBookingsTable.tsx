import type { ReactNode } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { accent, neutral, semantic } from '../../../theme/tokens'
import { GroupRow, ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../shared/table'
import { IconButton, Pill, TextAction, visuallyHidden } from '../../../shared/ui'
import { strongestOpen, WarningTriangle, warningTone } from '../../../shared/warnings'
import { isOpen, type Warning } from '../../../domain/warnings'
import { StubRow } from '../../../shared/stubs'
import { withStubsInTimeOrder } from '../../../domain/intake/stubs'
import type { Booking, BookingId } from '../../../domain/types'
import type { ProcedureStackView } from '../../../domain/billing/procedureStack'
import { StubResolveLink } from './StubResolveLink'

type Stubs = Parameters<typeof withStubsInTimeOrder>[2]

/**
 * The Bookings on a List as one compact table (the Admin Day view's List drawer): time, patient and
 * procedure, RVG code and progress per row, under a summary row that names the List's span and how
 * many Bookings need attention. The row opens the Booking (its name is the keyboard handle); Move sits
 * at the row's end. A Booking with an open warning carries the Day view's outline colour down to its
 * row as a left bar (US-13.7.3), and its warning text replaces the contract line. Stubs waiting at
 * intake sit among the Bookings in time order, never counted.
 */
export function ListBookingsTable({
  bookings,
  stubs,
  warningsByBooking,
  procedureViews,
  patientName,
  editable,
  onOpen,
  onMove,
  onAdd,
}: {
  bookings: readonly Booking[]
  stubs: Stubs
  warningsByBooking: ReadonlyMap<BookingId, readonly Warning[]>
  /** Each Booking's Procedure stack views, in display order. */
  procedureViews: (bookingId: BookingId) => readonly ProcedureStackView[]
  patientName: (booking: Booking) => string
  editable: boolean
  onOpen: (bookingId: BookingId) => void
  onMove: (bookingId: BookingId) => void
  onAdd: () => void
}) {
  const active = bookings.filter((b) => b.cancellation === undefined)
  const times = active.map((b) => b.scheduledTime).filter((t): t is string => t !== undefined).sort()
  const attention = active.filter((b) => strongestOpen(warningsByBooking.get(b.id) ?? []) !== undefined).length
  const entries = withStubsInTimeOrder(bookings, (b) => b.scheduledTime, stubs)

  const summary = (
    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: 500 }}>
      <span>
        {active.length === 0 ? 'No bookings on this List yet' : `${active.length} on this List`}
        {times.length > 1 ? `, ${times[0]} to ${times[times.length - 1]}` : times.length === 1 ? `, ${times[0]}` : ''}
      </span>
      {attention > 0 && (
        <span data-shot="drawer-bookings-attention" style={{ color: warningTone('mild').onTint, fontWeight: 600 }}>
          {attention} {attention === 1 ? 'needs' : 'need'} attention
        </span>
      )}
    </span>
  )

  return (
    <TableShell
      label="Bookings"
      nested
      density="dense"
      shot="drawer-bookings-table"
      footer={
        editable ? (
          <TextAction size="sm" shot="list-add-booking" onClick={onAdd}>
            Add Booking
          </TextAction>
        ) : undefined
      }
    >
      <colgroup>
        <col style={{ width: 58 }} />
        <col />
        <col style={{ width: 1 }} />
        <col style={{ width: 1 }} />
      </colgroup>
      <thead>
        <GroupRow span={4} style={{ fontSize: 12, padding: '7px 10px' }}>
          {summary}
        </GroupRow>
        <tr style={visuallyHidden}>
          <Th>Time</Th>
          <Th>Booking</Th>
          <Th>Code and progress</Th>
          <Th>Move</Th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          if (entry.kind === 'stub') {
            return (
              <tr key={entry.stub.id}>
                <Td colSpan={4} style={{ padding: '4px 10px' }}>
                  <StubRow stub={entry.stub} density="table" trailing={<StubResolveLink stub={entry.stub} />} />
                </Td>
              </tr>
            )
          }
          const b = entry.booking
          return (
            <BookingRow
              key={b.id}
              booking={b}
              name={patientName(b)}
              warnings={warningsByBooking.get(b.id) ?? []}
              views={b.cancellation === undefined ? procedureViews(b.id) : []}
              canMove={editable && b.cancellation === undefined}
              onOpen={() => onOpen(b.id)}
              onMove={() => onMove(b.id)}
            />
          )
        })}
      </tbody>
    </TableShell>
  )
}

function BookingRow({
  booking,
  name,
  warnings,
  views,
  canMove,
  onOpen,
  onMove,
}: {
  booking: Booking
  name: string
  warnings: readonly Warning[]
  views: readonly ProcedureStackView[]
  canMove: boolean
  onOpen: () => void
  onMove: () => void
}) {
  const cancelled = booking.cancellation !== undefined
  const strongest = strongestOpen(warnings)
  const tone = strongest !== undefined ? warningTone(strongest) : undefined
  const firstOpen = warnings.find(isOpen)
  const progress = cancelled ? 'Cancelled' : booking.completed ? 'Completed' : 'In progress'
  const dot = cancelled ? neutral.lineStrong : booking.completed ? semantic.success.solid : accent.base
  const procedures = views.map((v) => v.procedureText?.text ?? 'No description received')
  const codes = views.map((v) => (v.rvg !== null && typeof v.rvg === 'object' ? v.rvg.code : undefined)).filter((c): c is string => c !== undefined)
  const contract = views[0]?.contract
  const struck = cancelled ? { textDecoration: 'line-through', color: neutral.mist } : {}

  let secondary: ReactNode = null
  if (!cancelled) {
    secondary =
      firstOpen !== undefined && tone !== undefined ? (
        <Line color={tone.onTint} weight={600}>{firstOpen.text}</Line>
      ) : contract === null ? (
        <Line color={warningTone('mild').onTint} weight={600}>Needs an invoice destination</Line>
      ) : contract !== undefined ? (
        <Line color={neutral.mist}>{contract.name}</Line>
      ) : null
  }

  return (
    <ClickableRow
      onOpen={onOpen}
      align="top"
      quiet={cancelled}
      data-booking-id={booking.id}
      {...(tone !== undefined ? { 'data-shot': 'drawer-booking-warning' } : {})}
    >
      <Td mono nowrap style={{ color: neutral.slate, ...struck, ...(tone !== undefined ? { boxShadow: `inset 3px 0 0 ${tone.solid}` } : {}) }}>
        {booking.scheduledTime ?? '·'}
      </Td>
      <Td style={{ maxWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <RowOpenButton
            label={`Open Booking for ${name}${booking.scheduledTime !== undefined ? ` at ${booking.scheduledTime}` : ''}`}
            onOpen={onOpen}
            style={{ fontSize: 13.5, lineHeight: '19px', fontWeight: 600, color: neutral.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, ...struck }}
          >
            {name}
          </RowOpenButton>
          <WarningTriangle warnings={warnings} size="sm" />
        </span>
        {procedures.length > 0 && (
          <Line color={neutral.slate} title={procedures.join('\n')}>
            {procedures.join(', ')}
          </Line>
        )}
        {secondary}
      </Td>
      <Td align="right" nowrap>
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {codes.length > 0 && (
            <Pill size="sm" mono title={views.map((v) => (v.rvg !== null && typeof v.rvg === 'object' ? `${v.rvg.code} ${v.rvg.description}` : '')).filter(Boolean).join('\n')}>
              {codes.join(' ')}
            </Pill>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: neutral.mist }}>
            <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />
            {progress}
          </span>
        </span>
      </Td>
      <Td style={{ padding: '4px 4px 4px 0' }}>
        {canMove && (
          <IconButton size={32} bordered={false} label={`Move ${name}'s Booking to another List`} title="Move to another List" onClick={onMove}>
            <ArrowLeftRight size={15} strokeWidth={2} aria-hidden />
          </IconButton>
        )}
      </Td>
    </ClickableRow>
  )
}

function Line({ color, weight, title, children }: { color: string; weight?: number; title?: string; children: ReactNode }) {
  return (
    <span title={title} style={{ display: 'block', fontSize: 12.5, lineHeight: '17px', color, fontWeight: weight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {children}
    </span>
  )
}

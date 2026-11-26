/**
 * The bench for a hospital's cancellation of a Booking AA holds (build plan Phase 69; US-02.5.3, US-02.1.2; D117):
 * the Booking the hospital cancelled (patient, time, procedure) with the hospital's reason, beside where it sits. On
 * the opened arrival (O1) the document is the rows as received; Reject and Mark cancelled sit in the column's footer.
 * "Mark cancelled" records the cancellation through today's cancel path, so the Booking stays visible, marked
 * cancelled; Reject (with a reason) changes nothing. One change set either way (`decideCancellation`).
 *
 * Hooks: `intake-bench-cancellation`; each Booking `intake-cancellation-booking` with `data-row-id` and
 * `data-booking-id`; `intake-cancellation-apply`, `intake-cancellation-reject`, `intake-cancellation-reject-form`,
 * `intake-cancellation-decided`.
 */

import { useState } from 'react'
import { decideCancellation } from '../../../../../store/intakeApply'
import { useArrivalRows } from '../../../../../store/intakeSelectors'
import { useAppStore } from '../../../../../store/appStore'
import { effectiveIncoming } from '../../../../../domain/intake/matching'
import { formatDob, stampText } from '../../../../../shared/format'
import { Button, Card, DefList, DefRow, FormError, Notice, OptionChip, TextField } from '../../../../../shared/ui'
import { neutral, space, type as typeScale } from '../../../../../theme/tokens'
import { DecisionHeading } from '../../../../../shared/surface'
import { ArrivalDocument } from './ArrivalDocument'
import { BenchLayout } from './BenchLayout'
import type { BenchActions, BenchProps } from './benchProps'
import { NextArrivalButton } from './NextArrivalButton'
import { SlotCard } from './update/SlotCard'
import { QUICK_REJECT_REASONS } from './update/updateText'

const NOTE = { margin: `${space[2]}px 0 0`, fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate } as const

const DECIDED_TEXT = { applied: 'Marked cancelled', rejected: 'Rejected', leftOut: 'Left out' } as const

export function CancellationBench(props: BenchProps) {
  return <CancellationBenchFor key={props.arrival.key} {...props} />
}

function CancellationBenchFor({ arrival, actor, onDone, onNext }: BenchProps) {
  const rows = useArrivalRows(arrival.key)
  const intakeRows = useAppStore((s) => s.intake.rows)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const open = rows.some((r) => r.status === 'open')
  const listId = arrival.heldListId ?? rows.flatMap((r) => (r.bookingId !== undefined ? [bookings[r.bookingId]?.listId] : [])).find((id) => id !== undefined)

  function decide(choice: 'apply' | 'reject') {
    const out = decideCancellation(useAppStore, actor, arrival.key, choice, choice === 'reject' ? reason : undefined)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    onDone()
  }

  const actions: BenchActions | undefined = !open
    ? onNext !== undefined
      ? { primary: <NextArrivalButton onNext={onNext} /> }
      : undefined
    : rejecting
      ? {
          note: 'Nothing on the schedule changes. The Booking stays as it is.',
          secondary: (
            <Button variant="secondary" size="desktop" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          ),
          primary: (
            <Button variant="danger" size="desktop" onClick={() => decide('reject')} disabled={reason.trim() === ''} shot="intake-cancellation-reject">
              Reject cancellation
            </Button>
          ),
        }
      : {
          note: 'The Booking stays visible on its List, marked cancelled.',
          secondary: (
            <Button variant="secondary" size="desktop" onClick={() => setRejecting(true)} shot="intake-cancellation-reject">
              Reject
            </Button>
          ),
          primary: (
            <Button variant="primary" size="desktop" onClick={() => decide('apply')} shot="intake-cancellation-apply">
              Mark cancelled
            </Button>
          ),
        }

  const decision = (
    <>
      <DecisionHeading>{rows.length === 1 ? 'The Booking the hospital cancelled' : 'The Bookings the hospital cancelled'}</DecisionHeading>
      {rows.map((row) => {
        const ir = intakeRows[row.rowId]
        const f = ir !== undefined ? effectiveIncoming(ir) : undefined
        const booking = row.bookingId !== undefined ? bookings[row.bookingId] : undefined
        return (
          <Card key={row.rowId} title={row.patientName} titleLevel={3} shot="intake-cancellation-booking" data-row-id={row.rowId} data-booking-id={row.bookingId} data-row-status={row.status}>
            <DefList gap={6}>
              {row.dobISO !== undefined && <DefRow label="Born">{formatDob(row.dobISO)}</DefRow>}
              <DefRow label="Time">{row.scheduledTime ?? 'Not sent'}</DefRow>
              <DefRow label="Procedure">{row.procedureText ?? 'Not sent'}</DefRow>
              <DefRow label="Hospital's reason">{f?.cancelReason ?? 'None given'}</DefRow>
            </DefList>
            {booking === undefined && <p style={NOTE}>No Booking AA holds matches this cancellation.</p>}
            {booking?.cancellation !== undefined && row.status === 'open' && <p style={NOTE}>This Booking is already cancelled.</p>}
          </Card>
        )
      })}

      {!open && (
        <Notice tone="neutral" shot="intake-cancellation-decided">
          {rows.map((r) => (r.status === 'open' ? '' : DECIDED_TEXT[r.status])).filter((s) => s !== '').join(' · ')}
          {(() => {
            const last = rows.flatMap((r) => {
              const ir = intakeRows[r.rowId]
              return ir?.decidedAtISO !== undefined ? [{ who: ir.decidedBy ?? 'The office', at: ir.decidedAtISO }] : []
            }).sort((a, b) => b.at.localeCompare(a.at))[0]
            return last !== undefined ? ` · ${last.who}, ${stampText(last.at)}` : ''
          })()}
        </Notice>
      )}

      {open && rejecting && (
        <div data-shot="intake-cancellation-reject-form" style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
          <TextField label="Why reject this cancellation" value={reason} onChange={setReason} size="compact" placeholder="The Booking stays as it is" autoFocus />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: space[2] }}>
            {QUICK_REJECT_REASONS.map((r) => (
              <OptionChip key={r} pressed={reason === r} onClick={() => setReason(r)}>
                {r}
              </OptionChip>
            ))}
          </div>
        </div>
      )}

      <FormError message={error} />

      {listId !== undefined && <SlotCard listId={listId} />}
    </>
  )

  return <BenchLayout shot="intake-bench-cancellation" data-arrival-key={arrival.key} document={<ArrivalDocument arrival={arrival} />} decision={decision} {...(actions !== undefined ? { actions } : {})} />
}

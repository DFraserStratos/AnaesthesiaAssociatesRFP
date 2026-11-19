import { useBookingApi, useBookingStore } from '../booking/draft'
import { useEffect, useState } from 'react'
import { neutral } from '../../theme/tokens'
import { prepaymentRecheckLine, prepaymentStatusFor, removeProcedure, type Actor } from '../../store'
import { FormError } from '../ui'
import { ConfirmSheet } from '../surface/ConfirmSheet'
import { procedureLabel } from '../../domain/billing/procedureStack'

interface RemoveProcedureSheetProps {
  open: boolean
  procedureId: string
  /** 1-based number in display order (the primary is 1), for the heading. */
  displayNumber: number
  actor: Actor
  onClose: () => void
  /** After the removal, with the prepayment re-check line or null (catch-up Phase 27, US-06.3.5). */
  onRemoved: (recheckLine: string | null) => void
}

/**
 * Confirms removing a procedure from a Booking. Deliberately lighter than
 * `CancelBookingSheet`: no reason field. A cancelled Booking stays visible in the
 * List and the reason is what explains it to the office, whereas a removed
 * procedure is a data-entry correction that leaves nothing on screen to
 * explain — the audit entry carries who and when, and the removed row is
 * snapshotted into it.
 *
 * What it does owe the user is the consequences, since capture is destroyed:
 * the sheet names the procedure and counts the billing lines going with it.
 */
export function RemoveProcedureSheet({ open, procedureId, displayNumber, actor, onClose, onRemoved }: RemoveProcedureSheetProps) {
  const bookingApi = useBookingApi()
  const procedure = useBookingStore((s) => s.schedule.procedures[procedureId])
  const rvgGroups = useBookingStore((s) => s.masters.rvgGroups)
  const lineCount = useBookingStore(
    (s) => Object.values(s.schedule.billingLines).filter((l) => l.procedureId === procedureId).length,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  if (procedure === undefined) return null
  const name = procedureLabel(procedure, rvgGroups, displayNumber)

  function submit() {
    setError(null)
    const bookingId = bookingApi.getState().schedule.procedures[procedureId]?.bookingId ?? ''
    const before = prepaymentStatusFor(bookingApi.getState(), bookingId)
    const outcome = removeProcedure(bookingApi, actor, procedureId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onRemoved(prepaymentRecheckLine(before, prepaymentStatusFor(bookingApi.getState(), bookingId)))
    onClose()
  }

  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title={`Remove procedure ${displayNumber}?`}
      description={
        <>
          <strong style={{ color: neutral.ink }}>{name}</strong> and everything captured on it (times, units,
          modifiers and notes) are removed from this booking. This is audited and cannot be undone from here.
        </>
      }
      confirmLabel="Remove procedure"
      onConfirm={submit}
      cancelLabel="Keep it"
    >
        {lineCount > 0 && (
          <div style={{ fontSize: 13, color: neutral.slate }}>
            {lineCount === 1 ? 'Its 1 billing line goes with it.' : `Its ${lineCount} billing lines go with it.`}
          </div>
        )}
        <FormError message={error} />
    </ConfirmSheet>
  )
}

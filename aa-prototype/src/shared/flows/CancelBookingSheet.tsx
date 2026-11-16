import { useEffect, useState } from 'react'
import { cancelBooking, useAppStore, type Actor } from '../../store'
import { TextArea, FormError } from '../ui'
import { ConfirmSheet } from '../surface/ConfirmSheet'

interface CancelBookingSheetProps {
  open: boolean
  bookingId: string
  actor: Actor
  onClose: () => void
  onCancelled: () => void
}

/** Reason-gated booking cancellation (audited soft-cancel). The reason is required. */
export function CancelBookingSheet({ open, bookingId, actor, onClose, onCancelled }: CancelBookingSheetProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setReason('')
      setError(null)
    }
  }, [open])

  function submit() {
    setError(null)
    const outcome = cancelBooking(useAppStore, actor, bookingId, reason)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onCancelled()
    onClose()
  }

  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title="Cancel this booking"
      description="The booking stays visible in a cancelled state and drops out of the list's completion count. This is audited."
      confirmLabel="Cancel booking"
      onConfirm={submit}
      confirmDisabled={reason.trim() === ''}
      cancelLabel="Keep the booking"
    >
        <TextArea label="Reason" value={reason} onChange={setReason} placeholder="Why is this booking being cancelled?" />
        <FormError message={error} />
    </ConfirmSheet>
  )
}

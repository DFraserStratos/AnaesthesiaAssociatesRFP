import { useEffect, useState } from 'react'
import { neutral } from '../../theme/tokens'
import { cancelBooking, useAppStore, type Actor } from '../../store'
import { Button, TextArea, FormError } from '../ui'
import { useSurface } from '../surface'

interface CancelBookingSheetProps {
  open: boolean
  bookingId: string
  actor: Actor
  onClose: () => void
  onCancelled: () => void
}

/** Reason-gated booking cancellation (audited soft-cancel). The reason is required. */
export function CancelBookingSheet({ open, bookingId, actor, onClose, onCancelled }: CancelBookingSheetProps) {
  const { Overlay } = useSurface()
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
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Cancel this booking</div>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          The booking stays visible in a cancelled state and drops out of the list's completion count. This is audited.
        </div>
        <TextArea label="Reason" value={reason} onChange={setReason} placeholder="Why is this booking being cancelled?" />
        <FormError message={error} />
        <Button variant="primary" block onClick={submit} disabled={reason.trim() === ''}>
          Cancel booking
        </Button>
        <Button variant="secondary" block onClick={onClose}>
          Keep the booking
        </Button>
      </div>
    </Overlay>
  )
}

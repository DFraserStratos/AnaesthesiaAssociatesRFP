import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import { cancelCard, useAppStore, type Actor } from '../../store'
import { Button, TextArea } from '../ui'
import { useSurface } from '../surface'

interface CancelCardSheetProps {
  open: boolean
  cardId: string
  actor: Actor
  onClose: () => void
  onCancelled: () => void
}

/** Reason-gated card cancellation (audited soft-cancel). The reason is required. */
export function CancelCardSheet({ open, cardId, actor, onClose, onCancelled }: CancelCardSheetProps) {
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
    const outcome = cancelCard(useAppStore, actor, cardId, reason)
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
        <div style={{ fontSize: 18, fontWeight: 700 }}>Cancel this card</div>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          The card stays visible in a cancelled state and drops out of the list's completion count. This is audited.
        </div>
        <TextArea label="Reason" value={reason} onChange={setReason} placeholder="Why is this card being cancelled?" />
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}
        <Button variant="primary" block onClick={submit} disabled={reason.trim() === ''}>
          Cancel card
        </Button>
        <Button variant="secondary" block onClick={onClose}>
          Keep the card
        </Button>
      </div>
    </Overlay>
  )
}

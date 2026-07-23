import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import { overridePrepaymentGate, useAppStore, type Actor } from '../../store'
import { Button, TextArea } from '../ui'
import { useSurface } from '../surface'

interface PrepaymentOverrideSheetProps {
  open: boolean
  cardId: string
  actor: Actor
  onClose: () => void
  onOverridden: () => void
}

/**
 * Office override of the pre-payment completion gate (Phase 09; B7). A browser
 * prototype cannot verify a real-world payment, so the office records its
 * "proceed anyway" judgement with a mandatory reason. The override is audited
 * and shown as a flagged state wherever the Card appears; it is NOT a silent pass.
 */
export function PrepaymentOverrideSheet({ open, cardId, actor, onClose, onOverridden }: PrepaymentOverrideSheetProps) {
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
    const outcome = overridePrepaymentGate(useAppStore, actor, cardId, reason)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onOverridden()
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Override the pre-payment gate</div>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          Pre-payment must be collected before the procedure. Only override when the office has confirmed payment
          outside the system. The override is audited and shown as a flagged state on the card everywhere it appears.
        </div>
        <TextArea label="Reason" value={reason} onChange={setReason} placeholder="e.g. Patient paid by EFTPOS in clinic, receipt on file." />
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}
        <Button variant="primary" block onClick={submit} disabled={reason.trim() === ''}>
          Override and allow completion
        </Button>
        <Button variant="secondary" block onClick={onClose}>
          Keep the gate
        </Button>
      </div>
    </Overlay>
  )
}

import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import { statusColours } from '../../theme/statusColours'
import { requestCover, useAppStore, type Actor } from '../../store'
import { Button, TextArea, TickBadge } from '../ui'
import { useSurface } from '../surface'

interface RequestCoverSheetProps {
  open: boolean
  listId: string
  actor: Actor
  kind: 'offer' | 'request'
  /** Whom the sheet concerns (the colleague for a request; the actor for an offer). */
  personName: string
  slotLabel: string
  targetAnaesthetistId?: string
  onClose: () => void
  onSent: () => void
}

/**
 * The request-cover bottom sheet (Mobile Availability mockup). `offer` hands
 * over the actor's own free session; `request` asks a colleague to cover a free
 * session. Sends via `requestCover`, then shows the completion tick.
 */
export function RequestCoverSheet({
  open,
  listId,
  actor,
  kind,
  personName,
  slotLabel,
  targetAnaesthetistId,
  onClose,
  onSent,
}: RequestCoverSheetProps) {
  const { Overlay } = useSurface()
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setMessage('')
      setSent(false)
      setError(null)
    }
  }, [open])

  function send() {
    setError(null)
    const outcome = requestCover(useAppStore, actor, listId, kind, message, targetAnaesthetistId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setSent(true)
    onSent()
  }

  const firstName = personName.replace(/^Dr\s+/, '')
  const verb = kind === 'offer' ? 'Offer cover for' : `Ask ${firstName} to cover`

  return (
    <Overlay open={open} onClose={onClose}>
      {!sent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              aria-hidden
              style={{ width: 44, height: 44, borderRadius: 999, background: statusColours.free.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 4, background: statusColours.free.solid }} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{kind === 'offer' ? 'Offer cover' : personName}</span>
              <span style={{ fontSize: 13, color: neutral.slate }}>{slotLabel} · Free session</span>
            </div>
          </div>
          <div style={{ background: neutral.bg, borderRadius: radius.ctl, padding: 14, fontSize: 13, lineHeight: '19px', color: neutral.slate }}>
            {verb} this session. This is a simulated notification: it records a pending request and an audit entry.
          </div>
          <TextArea label="Add a message" value={message} onChange={setMessage} placeholder="Optional note…" />
          {error !== null && (
            <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}
          <Button variant="primary" block onClick={send}>
            Send cover request
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0 8px' }}>
          <TickBadge size={72} animate />
          <div style={{ fontSize: 18, fontWeight: 700, color: semantic.success.onTint }}>Request sent</div>
          <div style={{ fontSize: 13, color: neutral.slate, textAlign: 'center' }}>
            {kind === 'offer'
              ? 'Your free session has been offered for cover. You will be notified when someone accepts.'
              : `${firstName} has been asked to cover. You will be notified when they respond.`}
          </div>
          <Button variant="secondary" block onClick={onClose} style={{ marginTop: 4 }}>
            Done
          </Button>
        </div>
      )}
    </Overlay>
  )
}

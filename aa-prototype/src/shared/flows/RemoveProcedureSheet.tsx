import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import { removeProcedure, useAppStore, type Actor } from '../../store'
import { Button } from '../ui'
import { useSurface } from '../surface'

interface RemoveProcedureSheetProps {
  open: boolean
  procedureId: string
  /** 1-based position on the Card, for the heading. */
  ordinal: number
  actor: Actor
  onClose: () => void
  onRemoved: () => void
}

/**
 * Confirms removing a procedure from a Card. Deliberately lighter than
 * `CancelCardSheet`: no reason field. A cancelled Card stays visible in the
 * List and the reason is what explains it to the office, whereas a removed
 * procedure is a data-entry correction that leaves nothing on screen to
 * explain — the audit entry carries who and when, and the removed row is
 * snapshotted into it.
 *
 * What it does owe the user is the consequences, since capture is destroyed:
 * the sheet names the procedure and counts the billing lines going with it.
 */
export function RemoveProcedureSheet({ open, procedureId, ordinal, actor, onClose, onRemoved }: RemoveProcedureSheetProps) {
  const { Overlay } = useSurface()
  const procedure = useAppStore((s) => s.schedule.procedures[procedureId])
  const lineCount = useAppStore(
    (s) => Object.values(s.schedule.billingLines).filter((l) => l.procedureId === procedureId).length,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  if (procedure === undefined) return null
  const name = procedure.description === '' ? `Procedure ${ordinal}` : procedure.description

  function submit() {
    setError(null)
    const outcome = removeProcedure(useAppStore, actor, procedureId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onRemoved()
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Remove procedure {ordinal}?</div>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          <strong style={{ color: neutral.ink }}>{name}</strong> and everything captured on it (times, units,
          modifiers and notes) are removed from this card. This is audited and cannot be undone from here.
        </div>
        {lineCount > 0 && (
          <div style={{ fontSize: 13, color: neutral.slate }}>
            {lineCount === 1 ? 'Its 1 billing line goes with it.' : `Its ${lineCount} billing lines go with it.`}
          </div>
        )}
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}
        <Button variant="primary" block onClick={submit}>
          Remove procedure
        </Button>
        <Button variant="secondary" block onClick={onClose}>
          Keep it
        </Button>
      </div>
    </Overlay>
  )
}

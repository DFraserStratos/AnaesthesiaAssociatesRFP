import { useEffect, useState } from 'react'
import { neutral } from '../../theme/tokens'
import { removeProcedure, useAppStore, type Actor } from '../../store'
import { FormError } from '../ui'
import { ConfirmSheet } from '../surface/ConfirmSheet'
import { procedureLabel } from '../../domain/billing/procedureStack'

interface RemoveProcedureSheetProps {
  open: boolean
  procedureId: string
  /** 1-based position on the Booking, for the heading. */
  ordinal: number
  actor: Actor
  onClose: () => void
  onRemoved: () => void
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
export function RemoveProcedureSheet({ open, procedureId, ordinal, actor, onClose, onRemoved }: RemoveProcedureSheetProps) {
  const procedure = useAppStore((s) => s.schedule.procedures[procedureId])
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const lineCount = useAppStore(
    (s) => Object.values(s.schedule.billingLines).filter((l) => l.procedureId === procedureId).length,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  if (procedure === undefined) return null
  const name = procedureLabel(procedure, rvgGroups, ordinal)

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
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title={`Remove procedure ${ordinal}?`}
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

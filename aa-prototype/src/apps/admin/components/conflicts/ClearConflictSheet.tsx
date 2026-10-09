/**
 * Clear one conflict (catch-up Phase 30; US-01.5.4). The office confirms the
 * clash does not need action, with an optional note (OQ-09: no reason is
 * required). The clear holds only while the cause stands, and "Flag again"
 * undoes it.
 */

import { useEffect, useState } from 'react'
import { describeConflict, type ExpectedConflict } from '../../../../domain/conflicts'
import { clearListConflict, useAppStore, useConflictLookups, type Actor } from '../../../../store'
import { Button, FormError, TextArea, useSurface } from '../../../../shared'
import { neutral } from '../../../../theme/tokens'

export function ClearConflictSheet({
  open,
  actor,
  listId,
  conflict,
  onClose,
  onCleared,
}: {
  open: boolean
  actor: Actor
  listId: string
  conflict: ExpectedConflict | null
  onClose: () => void
  onCleared?: () => void
}) {
  const { Overlay } = useSurface()
  const list = useAppStore((s) => s.schedule.lists[listId])
  const lookups = useConflictLookups()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (open) {
      setNote('')
      setError(null)
    }
  }, [open, conflict?.cause])

  if (list === undefined || conflict === null) return null
  const described = describeConflict(conflict, list, lookups)

  function clear() {
    if (conflict === null) return
    const out = clearListConflict(useAppStore, actor, listId, conflict.cause, note)
    if (!out.ok) {
      setError(out.message)
      return
    }
    onCleared?.()
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="conflict-clear-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Clear this conflict</div>
        <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>
          <strong style={{ color: neutral.ink }}>{described.reason}.</strong> {described.detail}
        </div>
        <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>
          The List and its Bookings stay as they are. The flag stays cleared while this cause stands; if the clash goes and comes back, it flags again.
        </div>
        <TextArea label="Note (optional)" value={note} onChange={setNote} placeholder="e.g. Theatre confirmed running" />
        <FormError message={error} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" block onClick={onClose}>Cancel</Button>
          <Button variant="primary" block onClick={clear}>Clear</Button>
        </div>
      </div>
    </Overlay>
  )
}

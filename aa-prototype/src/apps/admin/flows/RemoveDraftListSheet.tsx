/**
 * Remove a Draft List (catch-up Phase 31; US-01.6.4: a request the rooms
 * cancelled, or one never filled). The reason is optional, with quick chips.
 * Refused while it holds an active Booking, so no Booking is ever orphaned:
 * the button is disabled and the sheet says why.
 */

import { useEffect, useState } from 'react'
import { neutral, radius, accent } from '../../../theme/tokens'
import { bookingCountsByList, removeDraftList, useAppStore, type Actor } from '../../../store'
import { removeBlockedReason } from '../../../domain/draftLists'
import { Button, FormError, TextField } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { DRAFT_LIST } from '../../../shared/scheduleTerms'

const REASONS = ['Request cancelled by the rooms', 'No anaesthetist found', 'Duplicate request'] as const

export function RemoveDraftListSheet({ open, listId, actor, onClose, onDone }: { open: boolean; listId: string; actor: Actor; onClose: () => void; onDone: () => void }) {
  const { Overlay } = useSurface()
  const bookings = useAppStore((s) => bookingCountsByList(s.schedule.bookings).get(listId) ?? 0)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setReason('')
      setError(null)
    }
  }, [open])

  const blocked = bookings > 0

  function remove() {
    const out = removeDraftList(useAppStore, actor, listId, reason)
    if (!out.ok) {
      setError(out.message)
      return
    }
    onDone()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-remove-draft-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Remove {DRAFT_LIST}</div>
        {blocked ? (
          <div role="status" style={{ fontSize: 13, color: neutral.slate }}>
            {removeBlockedReason(bookings)}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: neutral.slate }}>It leaves the waiting list and stays in History with who removed it and when.</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Reason">
              {REASONS.map((r) => {
                const on = reason === r
                return (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setReason(on ? '' : r)}
                    style={{ border: `1px solid ${on ? accent.base : neutral.line}`, background: on ? accent.tint : neutral.surface, color: on ? accent.pressed : neutral.slate, borderRadius: radius.pill, padding: '5px 12px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {r}
                  </button>
                )
              })}
            </div>
            <TextField label="Reason (optional)" value={reason} onChange={setReason} placeholder="Why it is no longer needed" />
          </>
        )}
        <FormError message={error} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" block onClick={remove} disabled={blocked}>Remove</Button>
        </div>
      </div>
    </Overlay>
  )
}

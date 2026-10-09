/**
 * Assign List (catch-up Phase 28; US-01.3.3: "an admin assigns a surgeon and
 * hospital to an available Slot", which creates its List). Opened from the
 * empty-session drawer, or from Find available with the surgeon already
 * chosen. A not-preferred pairing shows Phase 17's soft warning and reads
 * "Assign anyway"; the store records the acknowledgement (US-01.3.5, OQ-43).
 * The new List starts ACTIVE and shows in place of the session's status.
 */

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral } from '../../../theme/tokens'
import { assignListToSlot, useAppStore, type Actor } from '../../../store'
import { Button, FormError } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { surnameFirst } from '../util'
import { NotPreferredWarning, useNotPreferredWarning } from '../components/pairing'
import { AssignListFields, assignDraftError, emptyAssignDraft, type AssignDraft } from './AssignListFields'

interface AssignListSheetProps {
  open: boolean
  slotId: string
  actor: Actor
  /** The surgeon the office already chose (Find available). */
  initialSurgeonId?: string
  onClose: () => void
  onAssigned: (listId: string) => void
}

export function AssignListSheet({ open, slotId, actor, initialSurgeonId, onClose, onAssigned }: AssignListSheetProps) {
  const { Overlay } = useSurface()
  const slot = useAppStore((s) => s.schedule.slots[slotId])
  const anaesthetistName = useAppStore((s) => (slot !== undefined ? s.masters.anaesthetists[slot.anaesthetistId]?.name : undefined))
  const [draft, setDraft] = useState<AssignDraft>(() => emptyAssignDraft(initialSurgeonId))
  const [error, setError] = useState<string | null>(null)
  const pairingWarning = useNotPreferredWarning(slot?.anaesthetistId, draft.surgeonId !== '' ? draft.surgeonId : undefined)

  useEffect(() => {
    if (open) {
      setDraft(emptyAssignDraft(initialSurgeonId))
      setError(null)
    }
  }, [open, initialSurgeonId])

  if (slot === undefined) return null

  function save() {
    if (slot === undefined) return
    const invalid = assignDraftError(draft)
    if (invalid !== null) {
      setError(invalid)
      return
    }
    const outcome = assignListToSlot(useAppStore, actor, slot.id, {
      hospitalId: draft.hospitalId,
      surgeonId: draft.surgeonId,
      kind: draft.kind,
      ...(draft.notes.trim() !== '' ? { notes: draft.notes } : {}),
    })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onAssigned(outcome.value.listId)
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-assign-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Assign List</div>
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>
            {surnameFirst(anaesthetistName ?? slot.anaesthetistId)} · {format(parseISO(slot.dateISO), 'EEE d MMM')} · {slot.session}
          </div>
        </div>
        <div style={{ fontSize: 13, color: neutral.slate }}>Assigning a surgeon and hospital turns this free session into a List.</div>

        <AssignListFields anaesthetistId={slot.anaesthetistId} dateISO={slot.dateISO} draft={draft} onChange={(next) => { setDraft(next); setError(null) }} />

        <FormError message={error} />
        <NotPreferredWarning warning={pairingWarning} shot="assign-list-pairing-warning" />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" block onClick={save}>{pairingWarning !== null ? 'Assign anyway' : 'Assign List'}</Button>
        </div>
      </div>
    </Overlay>
  )
}

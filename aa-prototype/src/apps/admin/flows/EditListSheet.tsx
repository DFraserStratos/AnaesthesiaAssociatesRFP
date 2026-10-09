import { useEffect, useMemo, useState } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'
import type { List } from '../../../domain/types'
import { editList, setSlotTimes, useAppStore, useListTimes, type Actor, type ListPatch } from '../../../store'
import { Button, FieldLabel, TextArea } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { NotPreferredWarning, SurgeonPicker, useNotPreferredWarning } from '../components/pairing'
import { SessionTimesFields, timesDraftError, timesPatch, type TimesDraft } from './SessionTimesFields'

interface EditListSheetProps {
  open: boolean
  list: List
  actor: Actor
  onClose: () => void
}

const selectStyle = {
  minHeight: 48,
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.line}`,
  background: neutral.bg,
  padding: '0 12px',
  fontFamily: 'inherit',
  fontSize: 15,
} as const

/**
 * Office edit of a List's hospital, surgeon and notes through `editList`, and
 * of its session's times through `setSlotTimes` (catch-up Phase 28: the times
 * belong to the session, which "can override" the default, US-01.1.4; saved
 * only when they changed; the grid block resizes to the new span). Kind and
 * anaesthetist are not editable here (a move owns the anaesthetist).
 */
export function EditListSheet({ open, list, actor, onClose }: EditListSheetProps) {
  const { Overlay } = useSurface()
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const times = useListTimes(list)
  const defaultTimes = useAppStore((s) => s.appSettings.schedule.defaultTimes[list.session])
  const hasSlot = useAppStore((s) => s.schedule.slots[list.slotId] !== undefined)

  const [hospitalId, setHospitalId] = useState(list.hospitalId ?? '')
  const [surgeonId, setSurgeonId] = useState(list.surgeonId ?? '')
  // Only a changed surgeon warns, as only a changed pairing is acknowledged.
  const pairingWarning = useNotPreferredWarning(list.anaesthetistId, surgeonId !== (list.surgeonId ?? '') ? surgeonId : undefined)
  const current = useMemo<TimesDraft>(() => ({ startTime: times?.startTime ?? '', endTime: times?.endTime ?? '' }), [times])
  const [timesDraft, setTimesDraft] = useState<TimesDraft>(current)
  const [notes, setNotes] = useState(list.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setHospitalId(list.hospitalId ?? '')
      setSurgeonId(list.surgeonId ?? '')
      setTimesDraft(current)
      setNotes(list.notes ?? '')
      setError(null)
    }
    // Reset when the sheet opens or the List changes underneath it.
  }, [open, list, current])

  function save() {
    setError(null)
    const timesError = hasSlot ? timesDraftError(timesDraft) : null
    if (timesError !== null) {
      setError(timesError)
      return
    }
    // The session's times first: a refusal there leaves nothing half-saved.
    if (hasSlot && (timesDraft.startTime !== current.startTime || timesDraft.endTime !== current.endTime)) {
      const timed = setSlotTimes(useAppStore, actor, list.slotId, timesPatch(timesDraft, defaultTimes))
      if (!timed.ok) {
        setError(timed.message)
        return
      }
    }
    const patch: ListPatch = {
      hospitalId: hospitalId !== '' ? hospitalId : '',
      surgeonId: surgeonId !== '' ? surgeonId : '',
      notes: notes.trim() !== '' ? notes.trim() : '',
    }
    const outcome = editList(useAppStore, actor, list.id, patch)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Edit list</div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Hospital</FieldLabel>
          <select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} style={selectStyle}>
            <option value="">None (AA rooms / unassigned)</option>
            {Object.values(hospitals).map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Surgeon</FieldLabel>
          <SurgeonPicker
            anaesthetistId={list.anaesthetistId}
            value={surgeonId}
            onChange={setSurgeonId}
            emptyLabel="Not assigned"
            optionLabel={(s) => `${s.name}${s.specialty !== undefined ? ` (${s.specialty})` : ''}`}
            style={selectStyle}
          />
        </label>

        {hasSlot && <SessionTimesFields session={list.session} draft={timesDraft} defaults={defaultTimes} onChange={setTimesDraft} controlStyle={selectStyle} />}

        <TextArea label="Notes" value={notes} onChange={setNotes} placeholder="Office annotation for this list" />

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        {/* Catch-up Phase 17: warn, never block. Only a changed surgeon warns. */}
        <NotPreferredWarning warning={pairingWarning} shot="edit-list-pairing-warning" />
        <Button variant="primary" block onClick={save}>{pairingWarning !== null ? 'Save list anyway' : 'Save list'}</Button>
      </div>
    </Overlay>
  )
}

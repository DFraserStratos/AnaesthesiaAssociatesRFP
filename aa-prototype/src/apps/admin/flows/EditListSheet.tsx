import { useEffect, useMemo, useState } from 'react'
import type { List } from '../../../domain/types'
import { activeHospitals, editList, setSlotTimes, useAppStore, useListTimes, type Actor, type ListPatch } from '../../../store'
import { Button, SelectField, TextArea, FormError } from '../../../shared/ui'
import { OverlayHeader, SheetActions, useSurface } from '../../../shared/surface'
import { NotPreferredWarning, SurgeonPicker, useNotPreferredWarning } from '../components/pairing'
import { ConflictCallout, useConflictPreview, useHospitalOptionLabel } from '../components/conflicts/ConflictCallout'
import { SessionTimesFields, timesDraftError, timesPatch, type TimesDraft } from './SessionTimesFields'
import { surgeonSpecialtyLabel, withSpecialties } from '../../../domain/specialties'
import { retiredLabel } from '../../../domain/masterLifecycle'

interface EditListSheetProps {
  open: boolean
  list: List
  actor: Actor
  onClose: () => void
}

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
  // Retired hospitals are not offered, except the List's own, labelled (catch-up Phase 42).
  const hospitalOptions = useMemo(() => activeHospitals({ masters: { hospitals } }, list.hospitalId), [hospitals, list.hospitalId])
  const specialties = useAppStore((s) => s.masters.specialties)
  const times = useListTimes(list)
  const defaultTimes = useAppStore((s) => s.appSettings.schedule.defaultTimes[list.session])
  // A Draft List has no session yet, so no session times to edit (catch-up Phase 31).
  const hasSlot = useAppStore((s) => list.slotId !== undefined && s.schedule.slots[list.slotId] !== undefined)

  const [hospitalId, setHospitalId] = useState(list.hospitalId)
  const [surgeonId, setSurgeonId] = useState(list.surgeonId)
  // Only a changed surgeon warns, as only a changed pairing is acknowledged.
  const pairingWarning = useNotPreferredWarning(list.anaesthetistId, surgeonId !== list.surgeonId ? surgeonId : undefined)
  // A new hospital closed that day warns before saving and never blocks (catch-up Phase 30, OQ-09).
  const hospitalChanged = hospitalId !== list.hospitalId
  const closures = useConflictPreview(hospitalChanged && hospitalId !== '' ? { dateISO: list.dateISO, hospitalId } : null)
  const optionLabel = useHospitalOptionLabel(list.dateISO)
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
    if (hasSlot && list.slotId !== undefined && (timesDraft.startTime !== current.startTime || timesDraft.endTime !== current.endTime)) {
      const timed = setSlotTimes(useAppStore, actor, list.slotId, timesPatch(timesDraft, defaultTimes))
      if (!timed.ok) {
        setError(timed.message)
        return
      }
    }
    // Every List names its hospital and surgeon (US-01.3.1): neither can be cleared.
    if (hospitalId === '') return setError('Choose the hospital.')
    if (surgeonId === '') return setError('Choose the surgeon.')
    const patch: ListPatch = { hospitalId, surgeonId, notes: notes.trim() !== '' ? notes.trim() : '' }
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
        <OverlayHeader title="Edit list" />

        <SelectField label="Hospital" value={hospitalId} onChange={setHospitalId}>
          {hospitalOptions.map((h) => (
            <option key={h.id} value={h.id}>{optionLabel(h.id, retiredLabel(h.name, h))}</option>
          ))}
        </SelectField>

        <SurgeonPicker
          label="Surgeon"
          anaesthetistId={list.anaesthetistId}
          value={surgeonId}
          keepId={list.surgeonId}
          onChange={setSurgeonId}
          emptyLabel="Choose a surgeon"
          optionLabel={(s) => withSpecialties(s.name, surgeonSpecialtyLabel({ specialties }, s))}
        />

        {hasSlot && <SessionTimesFields session={list.session} draft={timesDraft} defaults={defaultTimes} onChange={setTimesDraft} />}

        <TextArea label="Notes" value={notes} onChange={setNotes} placeholder="Office annotation for this list" />

        <FormError message={error} />
        {/* Catch-up Phase 30: a hospital closed that day warns, never blocks (OQ-09). */}
        <ConflictCallout conflicts={closures} hospitalId={hospitalId} shot="edit-list-conflict-warning" />
        {/* Catch-up Phase 17: warn, never block. Only a changed surgeon warns. */}
        <NotPreferredWarning warning={pairingWarning} shot="edit-list-pairing-warning" />
        <SheetActions primary={<Button variant="primary" block onClick={save}>{pairingWarning !== null ? 'Save list anyway' : 'Save list'}</Button>} />
      </div>
    </Overlay>
  )
}

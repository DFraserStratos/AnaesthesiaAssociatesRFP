import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'
import type { List } from '../../../domain/types'
import { editList, useAppStore, type Actor, type ListPatch } from '../../../store'
import { Button, FieldLabel, TextArea } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'

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
 * Office edit of a List's hospital / surgeon / start-end times / notes via
 * `editList` (5th review #6 — the office may override the default session
 * times; the grid block resizes to the new span). Status and anaesthetist are
 * deliberately not editable here (reassignment owns those).
 */
export function EditListSheet({ open, list, actor, onClose }: EditListSheetProps) {
  const { Overlay } = useSurface()
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)

  const [hospitalId, setHospitalId] = useState(list.hospitalId ?? '')
  const [surgeonId, setSurgeonId] = useState(list.surgeonId ?? '')
  const [startTime, setStartTime] = useState(list.startTime ?? '')
  const [endTime, setEndTime] = useState(list.endTime ?? '')
  const [notes, setNotes] = useState(list.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setHospitalId(list.hospitalId ?? '')
      setSurgeonId(list.surgeonId ?? '')
      setStartTime(list.startTime ?? '')
      setEndTime(list.endTime ?? '')
      setNotes(list.notes ?? '')
      setError(null)
    }
  }, [open, list])

  function save() {
    setError(null)
    const patch: ListPatch = {
      hospitalId: hospitalId !== '' ? hospitalId : '',
      surgeonId: surgeonId !== '' ? surgeonId : '',
      startTime: startTime !== '' ? startTime : '',
      endTime: endTime !== '' ? endTime : '',
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
          <select value={surgeonId} onChange={(e) => setSurgeonId(e.target.value)} style={selectStyle}>
            <option value="">Not assigned</option>
            {Object.values(surgeons).map((s) => (
              <option key={s.id} value={s.id}>{s.name}{s.specialty !== undefined ? ` (${s.specialty})` : ''}</option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Start</FieldLabel>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={selectStyle} />
          </label>
          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>End</FieldLabel>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={selectStyle} />
          </label>
        </div>

        <TextArea label="Notes" value={notes} onChange={setNotes} placeholder="Office annotation for this list" />

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        <Button variant="primary" block onClick={save}>Save list</Button>
      </div>
    </Overlay>
  )
}

import { useState } from 'react'
import type { Surgeon } from '../../../domain/types'
import { createSurgeon, editSurgeon, useAppStore, type Actor } from '../../../store'
import { Button, FieldLabel, TextField, useSurface, FormError } from '../../../shared'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { selectControlStyle } from './fieldChrome'
import { ChipMultiSelect } from '../components/ChipMultiSelect'
import { specialtiesInOrder } from '../../../domain/specialties'

interface Props {
  /** Absent: add a surgeon. */
  surgeon?: Surgeon
  actor: Actor
  onClose: () => void
}

/**
 * Add or edit a surgeon (catch-up Phase 17, US-13.6.2): the HPI CPN is
 * required, the surgeon's unique index (OQ-52); the NZ medical registration
 * number is held for information. The store normalises the HPI CPN and
 * refuses a blank, malformed or already held one. Catch-up Phase 18a
 * (US-13.6.6): one or more specialties from AA's list, required; the store
 * refuses a save with none and this sheet shows its sentence.
 */
export function SurgeonEditSheet({ surgeon, actor, onClose }: Props) {
  const { Overlay } = useSurface()
  const rooms = useAppStore((s) => s.masters.surgeonRooms)
  const specialties = useAppStore((s) => s.masters.specialties)
  const [name, setName] = useState(surgeon?.name ?? '')
  const [specialtyIds, setSpecialtyIds] = useState<string[]>(surgeon?.specialtyIds ?? [])
  const [roomId, setRoomId] = useState(surgeon?.roomId ?? '')
  const [hpiId, setHpiId] = useState(surgeon?.hpiId ?? '')
  const [registration, setRegistration] = useState(surgeon?.medicalRegistrationNumber ?? '')
  const [error, setError] = useState<string | null>(null)
  const roomOptions = Object.values(rooms).sort((a, b) => a.name.localeCompare(b.name))

  function save() {
    const fields = { name, specialtyIds, roomId, hpiId, medicalRegistrationNumber: registration }
    const outcome = surgeon === undefined ? createSurgeon(useAppStore, actor, fields) : editSurgeon(useAppStore, actor, surgeon.id, fields)
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="surgeon-edit-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title={surgeon === undefined ? 'Add a surgeon' : 'Edit surgeon'} />
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Ms A. Reid" />
        <ChipMultiSelect
          label="Specialties"
          options={specialtiesInOrder(specialties)}
          value={specialtyIds}
          onChange={(ids) => { setSpecialtyIds(ids); setError(null) }}
          addLabel={specialtyIds.length === 0 ? 'Choose a specialty' : 'Add another specialty'}
          empty="None chosen yet"
          hint="At least one, from AA's list. Usually one."
          shot="surgeon-specialties-field"
        />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Surgeons&apos; room</FieldLabel>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={selectControlStyle}>
            <option value="">Choose a room</option>
            {roomOptions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <TextField label="HPI CPN (required)" value={hpiId} onChange={setHpiId} mono placeholder="12ABCD" hint="The surgeon's unique number on the Health Provider Index, for example 12ABCD" />
        <TextField label="NZ medical registration number (optional)" value={registration} onChange={setRegistration} mono hint="For information" />
        <FormError message={error} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>{surgeon === undefined ? 'Add surgeon' : 'Save changes'}</Button>} />
      </div>
    </Overlay>
  )
}

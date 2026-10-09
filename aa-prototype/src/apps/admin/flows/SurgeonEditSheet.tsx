import { useState } from 'react'
import type { Surgeon } from '../../../domain/types'
import { createSurgeon, editSurgeon, useAppStore, type Actor } from '../../../store'
import { Button, FieldLabel, TextField, useSurface, FormError } from '../../../shared'
import { selectControlStyle } from './fieldChrome'

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
 * refuses a blank, malformed or already held one.
 */
export function SurgeonEditSheet({ surgeon, actor, onClose }: Props) {
  const { Overlay } = useSurface()
  const rooms = useAppStore((s) => s.masters.surgeonRooms)
  const [name, setName] = useState(surgeon?.name ?? '')
  const [specialty, setSpecialty] = useState(surgeon?.specialty ?? '')
  const [roomId, setRoomId] = useState(surgeon?.roomId ?? '')
  const [hpiId, setHpiId] = useState(surgeon?.hpiId ?? '')
  const [registration, setRegistration] = useState(surgeon?.medicalRegistrationNumber ?? '')
  const [error, setError] = useState<string | null>(null)
  const roomOptions = Object.values(rooms).sort((a, b) => a.name.localeCompare(b.name))

  function save() {
    const fields = { name, specialty, roomId, hpiId, medicalRegistrationNumber: registration }
    const outcome = surgeon === undefined ? createSurgeon(useAppStore, actor, fields) : editSurgeon(useAppStore, actor, surgeon.id, fields)
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="surgeon-edit-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{surgeon === undefined ? 'Add a surgeon' : 'Edit surgeon'}</div>
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Ms A. Reid" />
        <TextField label="Specialty (optional)" value={specialty} onChange={setSpecialty} placeholder="e.g. Ophthalmology" />
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
        <Button variant="primary" block onClick={save}>{surgeon === undefined ? 'Add surgeon' : 'Save changes'}</Button>
      </div>
    </Overlay>
  )
}

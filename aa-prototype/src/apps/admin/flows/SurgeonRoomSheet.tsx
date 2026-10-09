import { useState } from 'react'
import type { SurgeonRoom } from '../../../domain/types'
import { createSurgeonRoom, editSurgeonRoom, useAppStore, type Actor } from '../../../store'
import { Button, TextField, useSurface, FormError } from '../../../shared'

/**
 * Add or edit a surgeons' room (catch-up Phase 17, US-13.6.1): its contact
 * email and phone. The room's surgeons are derived from each surgeon's room,
 * so membership is changed from the surgeon.
 */
export function SurgeonRoomSheet({ room, actor, onClose }: { room?: SurgeonRoom; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [name, setName] = useState(room?.name ?? '')
  const [contactEmail, setContactEmail] = useState(room?.contactEmail ?? '')
  const [phone, setPhone] = useState(room?.phone ?? '')
  const [error, setError] = useState<string | null>(null)

  function save() {
    const fields = { name, contactEmail, phone }
    const outcome = room === undefined ? createSurgeonRoom(useAppStore, actor, fields) : editSurgeonRoom(useAppStore, actor, room.id, fields)
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="surgeon-room-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{room === undefined ? "Add a surgeons' room" : "Edit surgeons' room"}</div>
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Avonside Surgical Rooms" />
        <TextField label="Contact email" value={contactEmail} onChange={setContactEmail} type="email" placeholder="reception@rooms.example" />
        <TextField label="Phone" value={phone} onChange={setPhone} type="tel" placeholder="03 555 0000" hint="Surgeons join a room from their own record." />
        <FormError message={error} />
        <Button variant="primary" block onClick={save}>{room === undefined ? 'Add room' : 'Save changes'}</Button>
      </div>
    </Overlay>
  )
}

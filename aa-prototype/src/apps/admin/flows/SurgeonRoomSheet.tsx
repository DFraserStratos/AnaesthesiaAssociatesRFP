import { useState } from 'react'
import type { SurgeonRoom } from '../../../domain/types'
import { createSurgeonRoom, editSurgeonRoom, useAppStore, type Actor } from '../../../store'
import { Button, TextField, useSurface, FormError } from '../../../shared'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { FieldLabel } from '../../../shared/ui'
import { RoomContactsList } from '../components/RoomContactsList'

/**
 * Add or edit a surgeons' room (catch-up Phase 17, US-13.6.1): its contact
 * email and phone, both optional since catch-up Phase 17a (DM-60). Editing a
 * room also shows its practice manager and PA contacts (US-13.6.5), the add
 * and edit form swapped in place; a new room adds contacts once saved. The room's surgeons are derived from each surgeon's room,
 * so membership is changed from the surgeon.
 */
export function SurgeonRoomSheet({ room, actor, onClose }: { room?: SurgeonRoom; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  // The live room, so contacts added here show at once.
  const live = useAppStore((s) => (room !== undefined ? s.masters.surgeonRooms[room.id] : undefined))
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
        <OverlayHeader title={room === undefined ? "Add a surgeons' room" : "Edit surgeons' room"} />
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Avonside Surgical Rooms" />
        <TextField label="Contact email (optional)" value={contactEmail} onChange={setContactEmail} type="email" placeholder="reception@rooms.example" hint="Leave blank where the practice gives no shared inbox" />
        <TextField label="Phone (optional)" value={phone} onChange={setPhone} type="tel" placeholder="03 555 0000" hint="Surgeons join a room from their own record." />
        <FormError message={error} />
        {live !== undefined && (
          <div data-shot="room-sheet-contacts" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Practice manager and PAs</FieldLabel>
            <RoomContactsList room={live} actor={actor} formIn="inline" />
          </div>
        )}
        <SheetActions primary={<Button variant="primary" block onClick={save}>{room === undefined ? 'Add room' : 'Save changes'}</Button>} />
      </div>
    </Overlay>
  )
}

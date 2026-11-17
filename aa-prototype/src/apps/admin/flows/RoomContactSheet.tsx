import { useState } from 'react'
import type { RoomContact, RoomContactRole, SurgeonRoom } from '../../../domain/types'
import { ROOM_CONTACT_ROLE_LABELS, ROOM_CONTACT_ROLES, WHOLE_ROOM_LABEL } from '../../../domain/roomContacts'
import { surgeonsInRoom } from '../../../domain/surgeons'
import { addRoomContact, editRoomContact, useAppStore, type Actor } from '../../../store'
import { Button, TextField, useSurface, FormError } from '../../../shared'
import { Segmented, SelectField, TextAction } from '../../../shared/ui'
import { OverlayHeader, SheetActions } from '../../../shared/surface'

export interface RoomContactFormProps {
  room: SurgeonRoom
  /** Absent: add a contact. */
  contact?: RoomContact
  /** The surgeon a new contact is for by default (opened from their profile); absent, the whole room. */
  defaultSurgeonId?: string
  actor: Actor
  onClose: () => void
}

/**
 * Add or edit a practice manager or PA on a surgeons' room (catch-up Phase
 * 17a; US-13.6.5): a name, an email, the role, and who it is for, the whole
 * room or one of the room's surgeons. Writes through the contact actions; the
 * store refuses and this form shows its sentence.
 */
export function RoomContactForm({ room, contact, defaultSurgeonId, actor, onClose, inline = false }: RoomContactFormProps & { inline?: boolean }) {
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const roomSurgeons = surgeonsInRoom(surgeons, room.id)
  const [name, setName] = useState(contact?.name ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [role, setRole] = useState<RoomContactRole>(contact?.role ?? 'PA')
  const [forSurgeonId, setForSurgeonId] = useState(contact !== undefined ? contact.forSurgeonId ?? '' : defaultSurgeonId ?? '')
  const [error, setError] = useState<string | null>(null)

  function save() {
    const fields = { name, email, role, forSurgeonId }
    const outcome = contact === undefined ? addRoomContact(useAppStore, actor, room.id, fields) : editRoomContact(useAppStore, actor, room.id, contact.id, fields)
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  const label = contact === undefined ? 'Add contact' : 'Save contact'
  return (
    <div data-shot="room-contact-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {inline ? (
        <h3 style={{ margin: 0, fontSize: 15, lineHeight: '22px', fontWeight: 600 }}>{contact === undefined ? 'Add a contact' : 'Edit contact'}</h3>
      ) : (
        <OverlayHeader title={contact === undefined ? 'Add a contact' : 'Edit contact'} description={room.name} />
      )}
      <TextField label="Contact name" value={name} onChange={(v) => { setName(v); setError(null) }} placeholder="e.g. Bev" />
      <TextField label="Email" value={email} onChange={(v) => { setEmail(v); setError(null) }} type="email" mono placeholder="name@rooms.example" />
      <Segmented
        label="Role"
        value={role}
        options={ROOM_CONTACT_ROLES.map((r) => ({ value: r, label: ROOM_CONTACT_ROLE_LABELS[r] }))}
        onChange={(r) => { setRole(r); setError(null) }}
      />
      <SelectField label="For" value={forSurgeonId} onChange={(v) => { setForSurgeonId(v); setError(null) }} hint="The whole room, or one of the room's surgeons">
        <option value="">{WHOLE_ROOM_LABEL}</option>
        {roomSurgeons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </SelectField>
      <FormError message={error} />
      {inline ? (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Button variant="primary" size="compact" onClick={save}>{label}</Button>
          <TextAction onClick={onClose}>Cancel</TextAction>
        </div>
      ) : (
        <SheetActions primary={<Button variant="primary" block onClick={save}>{label}</Button>} />
      )}
    </div>
  )
}

/** The contact form in the app's overlay (a surgeon's profile). */
export function RoomContactSheet(props: RoomContactFormProps) {
  const { Overlay } = useSurface()
  return (
    <Overlay open onClose={props.onClose}>
      <RoomContactForm {...props} />
    </Overlay>
  )
}

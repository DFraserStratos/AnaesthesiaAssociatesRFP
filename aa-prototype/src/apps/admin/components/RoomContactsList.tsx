/**
 * A surgeons' room's practice manager and PA contacts (catch-up Phase 17a;
 * US-13.6.5): one list for the surgeon profile's contacts cards and the room
 * sheet, so the two cannot drift. Each row: the name, a neutral role pill,
 * the email in mono and who it is for in mist; Edit and Remove (with an
 * in-card confirm); "Add contact" below. Reads only through
 * `domain/roomContacts.ts`; writes only through the contact actions.
 */

import { useEffect, useRef, useState } from 'react'
import { neutral } from '../../../theme/tokens'
import type { RoomContact, SurgeonRoom } from '../../../domain/types'
import { contactsForRoom, contactsForSurgeon, FOR_THIS_SURGEON_LABEL, ROOM_CONTACT_ROLE_LABELS, WHOLE_ROOM_LABEL } from '../../../domain/roomContacts'
import { removeRoomContact, useAppStore, type Actor } from '../../../store'
import { EmptyState, FormError, InlineConfirm, Pill, TextAction } from '../../../shared/ui'
import { RoomContactForm, RoomContactSheet } from '../flows/RoomContactSheet'

type Form = { contact?: RoomContact } | null

export function RoomContactsList({
  room,
  surgeonId,
  actor,
  formIn = 'sheet',
  onEditingChange,
}: {
  room: SurgeonRoom
  /** On a surgeon's profile: the room's whole-room contacts and those named for this surgeon. Absent: every contact. */
  surgeonId?: string
  actor: Actor
  /** `sheet` opens the form in the app's overlay; `inline` swaps it in place (inside the room sheet). */
  formIn?: 'sheet' | 'inline'
  /** Told when the inline form opens and closes, so the room sheet can hold back its own Save. */
  onEditingChange?: (editing: boolean) => void
}) {
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const [form, setForm] = useState<Form>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const removeRefs = useRef(new Map<string, HTMLButtonElement | null>())
  const editing = formIn === 'inline' && form !== null
  useEffect(() => onEditingChange?.(editing), [editing, onEditingChange])

  const rows =
    surgeonId !== undefined
      ? contactsForSurgeon(room, surgeonId).map((contact) => ({ contact, forLine: contact.forSurgeonId === undefined ? WHOLE_ROOM_LABEL : FOR_THIS_SURGEON_LABEL }))
      : contactsForRoom(room, surgeons).map(({ contact, surgeon }) => ({
          contact,
          forLine: contact.forSurgeonId === undefined ? WHOLE_ROOM_LABEL : `For ${surgeon?.name ?? contact.forSurgeonId}`,
        }))

  if (formIn === 'inline' && form !== null) {
    return <RoomContactForm inline room={room} contact={form.contact} defaultSurgeonId={surgeonId} actor={actor} onClose={() => setForm(null)} />
  }

  function remove(contactId: string) {
    const outcome = removeRoomContact(useAppStore, actor, room.id, contactId)
    setConfirming(null)
    setError(outcome.ok ? null : outcome.message)
  }

  return (
    <div data-room-contacts={room.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.length === 0 ? (
        <EmptyState>No practice manager or PA recorded.</EmptyState>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {rows.map(({ contact, forLine }, index) => (
            <li
              key={contact.id}
              data-contact={contact.id}
              style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 0', borderTop: index === 0 ? 'none' : `1px solid ${neutral.line}` }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: neutral.ink }}>{contact.name}</span>
                    <Pill size="sm">{ROOM_CONTACT_ROLE_LABELS[contact.role]}</Pill>
                  </div>
                  <span className="mono" style={{ fontSize: 13, color: neutral.slate, overflowWrap: 'anywhere' }}>{contact.email}</span>
                  <span style={{ fontSize: 12, color: neutral.mist }}>{forLine}</span>
                </div>
                {confirming !== contact.id && (
                  <div style={{ display: 'flex', gap: 12, flex: 'none' }}>
                    <TextAction size="sm" flush label={`Edit ${contact.name}, ${forLine}`} onClick={() => setForm({ contact })}>Edit</TextAction>
                    <TextAction
                      size="sm"
                      flush
                      label={`Remove ${contact.name}, ${forLine}`}
                      buttonRef={(el) => { removeRefs.current.set(contact.id, el) }}
                      onClick={() => setConfirming(contact.id)}
                    >
                      Remove
                    </TextAction>
                  </div>
                )}
              </div>
              {confirming === contact.id && (
                <InlineConfirm
                  label={`Remove ${contact.name}, ${forLine}`}
                  message={`Remove ${contact.name} (${forLine.toLowerCase()}) from ${room.name}? This is recorded in the room's history.`}
                  confirmLabel="Remove contact"
                  onConfirm={() => remove(contact.id)}
                  cancelLabel="Keep it"
                  onCancel={() => setConfirming(null)}
                  returnFocus={() => removeRefs.current.get(contact.id)}
                  shot="room-contact-remove"
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <FormError message={error} />
      <div>
        <TextAction size="sm" flush shot="room-contact-add" label={`Add contact to ${room.name}`} onClick={() => setForm({})}>Add contact</TextAction>
      </div>
      {formIn === 'sheet' && form !== null && (
        <RoomContactSheet room={room} contact={form.contact} defaultSurgeonId={surgeonId} actor={actor} onClose={() => setForm(null)} />
      )}
    </div>
  )
}

import { useState } from 'react'
import type { Hospital } from '../../../domain/types'
import { editHospital, useAppStore, type Actor } from '../../../store'
import { Button, TextField, useSurface, FormError } from '../../../shared'
import { OverlayHeader, SheetActions } from '../../../shared/surface'

/**
 * Edit a hospital's name and its contact email for booking updates (catch-up
 * Phase 17, US-13.4.1). Office-only; the store refuses a blank or duplicate
 * name and an implausible email.
 */
export function EditHospitalSheet({ hospital, actor, onClose }: { hospital: Hospital; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [name, setName] = useState(hospital.name)
  const [contactEmail, setContactEmail] = useState(hospital.contactEmail ?? '')
  const [error, setError] = useState<string | null>(null)

  function save() {
    const outcome = editHospital(useAppStore, actor, hospital.id, { name, contactEmail })
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="edit-hospital-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Edit hospital" />
        <TextField label="Hospital name" value={name} onChange={setName} />
        <TextField label="Contact email" value={contactEmail} onChange={setContactEmail} type="email" placeholder="bookings@hospital.example" hint="The contact for booking updates to this hospital." />
        <FormError message={error} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>Save changes</Button>} />
      </div>
    </Overlay>
  )
}

import { useState } from 'react'
import type { Hospital } from '../../../domain/types'
import { editHospital, partyRenameFollowing, useAppStore, type Actor } from '../../../store'
import { Button, TextField, useSurface, FormError } from '../../../shared'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { RetireSection } from '../screens/masters/chrome'

/**
 * Edit a hospital's name and its contact email for booking updates (catch-up
 * Phase 17, US-13.4.1). Office-only; the store refuses a blank or duplicate
 * name and an implausible email. A rename carries its Party along while the
 * Party still has the old name (catch-up Phase 42), and the sheet says so.
 * Retire (with a reason) or Reinstate sits at its foot; AA rooms has neither.
 */
export function EditHospitalSheet({ hospital, actor, onClose }: { hospital: Hospital; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const parties = useAppStore((s) => s.masters.parties)
  const [name, setName] = useState(hospital.name)
  const [contactEmail, setContactEmail] = useState(hospital.contactEmail ?? '')
  const [error, setError] = useState<string | null>(null)
  const partyFollows = partyRenameFollowing({ parties }, { kind: 'hospital', hospitalId: hospital.id }, hospital.name, name.trim()) !== null

  function save() {
    const outcome = editHospital(useAppStore, actor, hospital.id, { name, contactEmail })
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="edit-hospital-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Edit hospital" />
        <TextField
          label="Hospital name"
          value={name}
          onChange={setName}
          {...(partyFollows ? { hint: 'Its Party is renamed too.' } : {})}
        />
        <TextField label="Contact email" value={contactEmail} onChange={setContactEmail} type="email" placeholder="bookings@hospital.example" hint="The contact for booking updates to this hospital." />
        <FormError message={error} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>Save changes</Button>} />
        <RetireSection kind="hospital" id={hospital.id} actor={actor} onDone={onClose} />
      </div>
    </Overlay>
  )
}

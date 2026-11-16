import { useState } from 'react'
import { createHospital, useAppStore, type Actor } from '../../../store'
import { Button, TextField, useSurface, FormError } from '../../../shared'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { ResultLine } from '../../../shared/ui/ResultLine'

/**
 * Add a hospital (office-only). The name stays the first field (a retired
 * capture recipe still types into it); the contact email for booking updates
 * is optional (catch-up Phase 17, US-13.4.1).
 */
export function AddHospitalSheet({ actor, onClose }: { actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  function save() {
    const email = contactEmail.trim()
    const outcome = createHospital(useAppStore, actor, name, email !== '' ? email : undefined)
    if (!outcome.ok) { setError(outcome.message); return }
    setError(null)
    setResult(`Added ${outcome.value.hospital.name}. Its Party now appears in Parties; add its Contracts in Contracts.`)
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="add-hospital-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Add a hospital" />
        <TextField label="Hospital name" value={name} onChange={setName} placeholder="e.g. Rangiora Day Surgery" />
        <TextField label="Contact email (optional)" value={contactEmail} onChange={setContactEmail} type="email" placeholder="bookings@hospital.example" />
        <FormError message={error} />
        <ResultLine line={result} />
        {result !== null ? (
          <SheetActions primary={<Button variant="primary" block onClick={onClose}>Done</Button>} />
        ) : (
          <SheetActions primary={<Button variant="primary" block onClick={save}>Add hospital</Button>} />
        )}
      </div>
    </Overlay>
  )
}

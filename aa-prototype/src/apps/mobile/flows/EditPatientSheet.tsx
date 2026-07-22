import { useEffect, useState } from 'react'
import { radius, semantic } from '../../../theme/tokens'
import type { Patient } from '../../../domain/types'
import { editPatient, useAppStore, type Actor } from '../../../store'
import { BottomSheet, MobileButton, TextField } from '../components'

interface EditPatientSheetProps {
  open: boolean
  patient: Patient
  cardId: string
  actor: Actor
  onClose: () => void
}

/** Edit patient demographics via the audited `editPatient`, gated by the card's list. */
export function EditPatientSheet({ open, patient, cardId, actor, onClose }: EditPatientSheetProps) {
  const [name, setName] = useState(patient.name)
  const [dob, setDob] = useState(patient.dobISO)
  const [phone, setPhone] = useState(patient.phone ?? '')
  const [email, setEmail] = useState(patient.email ?? '')
  const [address, setAddress] = useState(patient.address ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(patient.name)
      setDob(patient.dobISO)
      setPhone(patient.phone ?? '')
      setEmail(patient.email ?? '')
      setAddress(patient.address ?? '')
      setError(null)
    }
  }, [open, patient])

  function save() {
    setError(null)
    const outcome = editPatient(
      useAppStore,
      actor,
      patient.hiddenInternalId,
      { name: name.trim(), dobISO: dob, phone: phone.trim(), email: email.trim(), address: address.trim() },
      cardId,
    )
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Edit patient details</div>
        <TextField label="Name" value={name} onChange={setName} />
        <TextField label="Date of birth" value={dob} onChange={setDob} type="date" />
        <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <TextField label="Address" value={address} onChange={setAddress} />
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}
        <MobileButton variant="primary" block onClick={save} disabled={name.trim() === '' || dob === ''}>
          Save details
        </MobileButton>
      </div>
    </BottomSheet>
  )
}

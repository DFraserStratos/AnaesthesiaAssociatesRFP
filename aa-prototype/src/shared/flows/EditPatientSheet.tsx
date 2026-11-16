import { useEffect, useState } from 'react'
import type { Patient } from '../../domain/types'
import { editPatient, useAppStore, type Actor } from '../../store'
import { Button, TextField, FormError } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { cleanPostalAddress } from '../../domain/billing/payer'
import { PostalAddressFields, addressDraftOf, type PostalAddressDraft } from './PostalAddressFields'

interface EditPatientSheetProps {
  open: boolean
  patient: Patient
  bookingId: string
  actor: Actor
  onClose: () => void
}

/** Edit patient demographics via the audited `editPatient`, gated by the booking's list. */
export function EditPatientSheet({ open, patient, bookingId, actor, onClose }: EditPatientSheetProps) {
  const { Overlay } = useSurface()
  const [name, setName] = useState(patient.name)
  const [dob, setDob] = useState(patient.dobISO)
  const [phone, setPhone] = useState(patient.phone ?? '')
  const [email, setEmail] = useState(patient.email ?? '')
  const [address, setAddress] = useState<PostalAddressDraft>(addressDraftOf(patient.postalAddress))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(patient.name)
      setDob(patient.dobISO)
      setPhone(patient.phone ?? '')
      setEmail(patient.email ?? '')
      setAddress(addressDraftOf(patient.postalAddress))
      setError(null)
    }
  }, [open, patient])

  function save() {
    setError(null)
    const outcome = editPatient(
      useAppStore,
      actor,
      patient.hiddenInternalId,
      { name: name.trim(), dobISO: dob, phone: phone.trim(), email: email.trim(), postalAddress: cleanPostalAddress(address) },
      bookingId,
    )
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Edit patient details" />
        <TextField label="Name" value={name} onChange={setName} />
        <TextField label="Date of birth" value={dob} onChange={setDob} type="date" />
        <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <PostalAddressFields value={address} onChange={setAddress} shot="patient-postal-address" />
        <FormError message={error} />
        <SheetActions
          primary={
            <Button variant="primary" block onClick={save} disabled={name.trim() === '' || dob === ''}>
              Save details
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}

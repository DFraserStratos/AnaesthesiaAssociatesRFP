import { useBookingApi, useBookingStoreMode, usePrimaryEditLabel } from '../booking/draft'
import { validateNhi } from '../../domain/nhi'
import { PATIENT_NHI_REQUIRED_MESSAGE } from '../../store'
import { useEffect, useState } from 'react'
import type { Patient } from '../../domain/types'
import { editPatient, type Actor } from '../../store'
import { Button, TextField, FormError } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { cleanPostalAddress } from '../../domain/billing/payer'
import { PostalAddressFields, addressDraftOf, type PostalAddressDraft } from './PostalAddressFields'
import { validateEthnicityCode } from '../../domain/nzhis'

interface EditPatientSheetProps {
  open: boolean
  patient: Patient
  /** The Booking the edit is made through (its List's rights apply); absent on the Admin patient record (catch-up Phase 40). */
  bookingId?: string
  actor: Actor
  onClose: () => void
}

/** The Ethnicity code field's live line (catch-up Phase 40): the label, the quarantine note or the format reason. */
function ethnicityHint(code: string): { text: string; invalid: boolean } | undefined {
  if (code.trim() === '') return undefined
  const v = validateEthnicityCode(code)
  if (v.verdict === 'valid') return { text: v.label, invalid: false }
  if (v.verdict === 'outsideDemoSubset') return { text: `Held for review. ${v.message}`, invalid: false }
  return { text: v.reason, invalid: true }
}

/** Edit patient demographics via the audited `editPatient`, gated by the booking's list. */
export function EditPatientSheet({ open, patient, bookingId, actor, onClose }: EditPatientSheetProps) {
  const bookingApi = useBookingApi()
  // "Apply" in the Admin draft (catch-up Phase 35): the draft's Save changes saves.
  const primaryLabel = usePrimaryEditLabel('Save details')
  const { Overlay } = useSurface()
  const [name, setName] = useState(patient.name)
  const [dob, setDob] = useState(patient.dobISO)
  const [phone, setPhone] = useState(patient.phone ?? '')
  const [email, setEmail] = useState(patient.email ?? '')
  const [address, setAddress] = useState<PostalAddressDraft>(addressDraftOf(patient.postalAddress))
  const [error, setError] = useState<string | null>(null)
  // The office corrects the NHI in the Admin draft (catch-up Phase 35); anaesthetist surfaces have no NHI field.
  const officeDraft = useBookingStoreMode() === 'draft' && actor.role === 'office'
  const [nhi, setNhi] = useState(patient.nhi ?? '')
  const nhiProblem = !officeDraft ? null : nhi.trim() === '' ? PATIENT_NHI_REQUIRED_MESSAGE : (validateNhi(nhi).valid ? null : (validateNhi(nhi).reason ?? 'That NHI is not valid.'))
  // The office keeps the Ethnicity code (catch-up Phase 40; US-11.1.1): optional, checked live.
  const office = actor.role === 'office'
  const storedEthnicity = patient.ethnicityCode ?? patient.ethnicityPending?.receivedCode ?? ''
  const [ethnicity, setEthnicity] = useState(storedEthnicity)
  const ethnicityLine = ethnicityHint(ethnicity)
  const ethnicityChanged = office && ethnicity.trim() !== '' && ethnicity.trim() !== storedEthnicity

  useEffect(() => {
    if (open) {
      setName(patient.name)
      setDob(patient.dobISO)
      setPhone(patient.phone ?? '')
      setEmail(patient.email ?? '')
      setAddress(addressDraftOf(patient.postalAddress))
      setNhi(patient.nhi ?? '')
      setEthnicity(patient.ethnicityCode ?? patient.ethnicityPending?.receivedCode ?? '')
      setError(null)
    }
  }, [open, patient])

  function save() {
    setError(null)
    const outcome = editPatient(
      bookingApi,
      actor,
      patient.hiddenInternalId,
      {
        name: name.trim(),
        dobISO: dob,
        phone: phone.trim(),
        email: email.trim(),
        postalAddress: cleanPostalAddress(address),
        ...(officeDraft && nhi.trim().toUpperCase() !== (patient.nhi ?? '') ? { nhi } : {}),
        ...(ethnicityChanged ? { ethnicityCode: ethnicity.trim() } : {}),
      },
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
        {officeDraft && (
          <div data-shot="patient-nhi-field">
            <TextField label="NHI" mono value={nhi} onChange={setNhi} invalid={nhiProblem !== null} {...(nhiProblem !== null ? { hint: nhiProblem } : {})} />
          </div>
        )}
        <TextField label="Date of birth" value={dob} onChange={setDob} type="date" />
        <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <PostalAddressFields value={address} onChange={setAddress} shot="patient-postal-address" />
        {office && (
          <TextField
            label="Ethnicity code"
            mono
            inputMode="numeric"
            value={ethnicity}
            onChange={setEthnicity}
            shot="patient-ethnicity-field"
            invalid={ethnicityLine?.invalid === true}
            hint={ethnicityLine?.text ?? 'NZHIS Level 4, 5 digits. Not required.'}
          />
        )}
        <FormError message={error} />
        <SheetActions
          primary={
            <Button variant="primary" block onClick={save} disabled={name.trim() === '' || nhiProblem !== null || (ethnicityChanged && ethnicityLine?.invalid === true)}>
              {primaryLabel}
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}

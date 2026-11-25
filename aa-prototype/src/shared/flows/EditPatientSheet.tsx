import { useBookingApi, useBookingStoreMode, usePrimaryEditLabel } from '../booking/draft'
import { useEffect, useState } from 'react'
import type { Patient } from '../../domain/types'
import { editPatient, type Actor } from '../../store'
import { Button, FormError } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { PatientFormFields, patientDraftBlocked, patientDraftOf, patientPatchOf, type PatientDraft } from './PatientFormFields'

interface EditPatientSheetProps {
  open: boolean
  patient: Patient
  /** The Booking the edit is made through (its List's rights apply). */
  bookingId?: string
  actor: Actor
  onClose: () => void
}

/** Edit patient demographics via the audited `editPatient`, gated by the booking's list. The form is `PatientFormFields`, shared with the Admin patient's page (build plan Phase 57). */
export function EditPatientSheet({ open, patient, bookingId, actor, onClose }: EditPatientSheetProps) {
  const bookingApi = useBookingApi()
  // "Apply" in the Admin draft (catch-up Phase 35): the draft's Save changes saves.
  const primaryLabel = usePrimaryEditLabel('Save details')
  const { Overlay } = useSurface()
  // The office corrects the NHI in the Admin draft (catch-up Phase 35); anaesthetist surfaces have no NHI field.
  // The office keeps the Ethnicity code (catch-up Phase 40; US-11.1.1): optional, checked live.
  const rights = { nhi: useBookingStoreMode() === 'draft' && actor.role === 'office', ethnicity: actor.role === 'office' }
  const [draft, setDraft] = useState<PatientDraft>(() => patientDraftOf(patient))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(patientDraftOf(patient))
      setError(null)
    }
  }, [open, patient])

  function save() {
    setError(null)
    const outcome = editPatient(bookingApi, actor, patient.hiddenInternalId, patientPatchOf(draft, patient, rights), bookingId)
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
        <PatientFormFields draft={draft} onChange={setDraft} rights={rights} />
        <FormError message={error} />
        <SheetActions
          primary={
            <Button variant="primary" block onClick={save} disabled={patientDraftBlocked(draft, patient, rights)}>
              {primaryLabel}
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}

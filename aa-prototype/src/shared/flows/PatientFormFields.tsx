/**
 * The patient details form (build plan Phase 57; US-11.1.1): name, the NHI where the office may
 * correct it, date of birth, phone, email, postal address and, for the office, the Ethnicity code
 * checked live. One form for `EditPatientSheet` (opened from a Booking) and the Details card on the
 * Admin patient's page, so the two never drift. `patientDraftOf` fills it from the record and
 * `patientPatchOf` turns it into `editPatient`'s patch: one audited `patient.update`.
 */

import type { Patient } from '../../domain/types'
import type { PatientEditPatch } from '../../store'
import { validateNhi } from '../../domain/nhi'
import { validateEthnicityCode } from '../../domain/nzhis'
import { cleanPostalAddress } from '../../domain/billing/payer'
import { PATIENT_NHI_REQUIRED_MESSAGE } from '../../store'
import { TextField } from '../ui'
import { PostalAddressFields, addressDraftOf, type PostalAddressDraft } from './PostalAddressFields'

export interface PatientDraft {
  name: string
  nhi: string
  dobISO: string
  phone: string
  email: string
  address: PostalAddressDraft
  ethnicity: string
}

/** What the form may show: the NHI (the office in the Admin Booking draft) and the Ethnicity code (the office). */
export interface PatientFormRights {
  nhi: boolean
  ethnicity: boolean
}

function storedEthnicity(patient: Patient): string {
  return patient.ethnicityCode ?? patient.ethnicityPending?.receivedCode ?? ''
}

export function patientDraftOf(patient: Patient): PatientDraft {
  return {
    name: patient.name,
    nhi: patient.nhi ?? '',
    dobISO: patient.dobISO,
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    address: addressDraftOf(patient.postalAddress),
    ethnicity: storedEthnicity(patient),
  }
}

/** The Ethnicity code field's live line (catch-up Phase 40): the label, the quarantine note or the format reason. */
function ethnicityHint(code: string): { text: string; invalid: boolean } | undefined {
  if (code.trim() === '') return undefined
  const v = validateEthnicityCode(code)
  if (v.verdict === 'valid') return { text: v.label, invalid: false }
  if (v.verdict === 'outsideDemoSubset') return { text: `Held for review. ${v.message}`, invalid: false }
  return { text: v.reason, invalid: true }
}

function nhiProblemOf(draft: PatientDraft, rights: PatientFormRights): string | null {
  if (!rights.nhi) return null
  if (draft.nhi.trim() === '') return PATIENT_NHI_REQUIRED_MESSAGE
  const v = validateNhi(draft.nhi)
  return v.valid ? null : (v.reason ?? 'That NHI is not valid.')
}

function ethnicityChanged(draft: PatientDraft, patient: Patient, rights: PatientFormRights): boolean {
  return rights.ethnicity && draft.ethnicity.trim() !== '' && draft.ethnicity.trim() !== storedEthnicity(patient)
}

/** Why the draft cannot be saved yet, or null: a blank name, a bad NHI or a malformed Ethnicity code. */
export function patientDraftBlocked(draft: PatientDraft, patient: Patient, rights: PatientFormRights): boolean {
  return draft.name.trim() === '' || nhiProblemOf(draft, rights) !== null || (ethnicityChanged(draft, patient, rights) && ethnicityHint(draft.ethnicity)?.invalid === true)
}

/** The draft as `editPatient`'s patch: the NHI only when the office changed it, the Ethnicity code only when changed. */
export function patientPatchOf(draft: PatientDraft, patient: Patient, rights: PatientFormRights): PatientEditPatch {
  return {
    name: draft.name.trim(),
    dobISO: draft.dobISO,
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    postalAddress: cleanPostalAddress(draft.address),
    ...(rights.nhi && draft.nhi.trim().toUpperCase() !== (patient.nhi ?? '') ? { nhi: draft.nhi } : {}),
    ...(ethnicityChanged(draft, patient, rights) ? { ethnicityCode: draft.ethnicity.trim() } : {}),
  }
}

export function PatientFormFields({ draft, onChange, rights }: { draft: PatientDraft; onChange: (next: PatientDraft) => void; rights: PatientFormRights }) {
  const set = <K extends keyof PatientDraft>(key: K) => (value: PatientDraft[K]) => onChange({ ...draft, [key]: value })
  const nhiProblem = nhiProblemOf(draft, rights)
  const ethnicityLine = ethnicityHint(draft.ethnicity)
  return (
    <>
      <TextField label="Name" value={draft.name} onChange={set('name')} />
      {rights.nhi && (
        <div data-shot="patient-nhi-field">
          <TextField label="NHI" mono value={draft.nhi} onChange={set('nhi')} invalid={nhiProblem !== null} {...(nhiProblem !== null ? { hint: nhiProblem } : {})} />
        </div>
      )}
      <TextField label="Date of birth" value={draft.dobISO} onChange={set('dobISO')} type="date" />
      <TextField label="Phone" value={draft.phone} onChange={set('phone')} type="tel" />
      <TextField label="Email" value={draft.email} onChange={set('email')} type="email" />
      <PostalAddressFields value={draft.address} onChange={set('address')} shot="patient-postal-address" />
      {rights.ethnicity && (
        <TextField
          label="Ethnicity code"
          mono
          inputMode="numeric"
          value={draft.ethnicity}
          onChange={set('ethnicity')}
          shot="patient-ethnicity-field"
          invalid={ethnicityLine?.invalid === true}
          hint={ethnicityLine?.text ?? 'NZHIS Level 4, 5 digits. Not required.'}
        />
      )}
    </>
  )
}

/**
 * Patient intake — the ONE upsert path every booking-creation flow uses (manual,
 * photo, HL7, FHIR, PDF; Phases 03/11). The RFP's Appendix 2 places dedupe at
 * intake: match by NHI when present (either format) and enrich + reuse the
 * existing Patient; without an NHI, create a provisional record. One person,
 * one Patient row, before Xero contact resolution ever matters.
 */

import { autoSendPrepayments } from './prepaymentActions'
import type { Patient, PostalAddress } from '../domain/types'
import { emailProblem, formatPostalAddress, postalAddressProblem } from '../domain/billing/payer'
import { validateNhi } from '../domain/nhi'
import { validateEthnicityCode } from '../domain/nzhis'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { editRefusal, getBooking } from './lifecycle'

export interface PatientIntakeDetails {
  nhi?: string
  name: string
  dobISO: string
  phone?: string
  email?: string
  postalAddress?: PostalAddress
  ethnicityCode?: string
}

export interface IntakeResult {
  patient: Patient
  /** 'reused' = an existing record matched by NHI and was enriched. */
  outcome: 'created' | 'createdProvisional' | 'reused'
}

/** Apply the intake's ethnicity handling: valid codes store, others quarantine. */
function withEthnicity(patient: Patient, code: string | undefined): Patient {
  if (code === undefined) return patient
  const verdict = validateEthnicityCode(code)
  if (verdict.verdict === 'valid') {
    // Drop any prior quarantine flag: a re-intake with a valid code must not
    // leave a stale ethnicityPending alongside the stored code (7th review A11).
    const { ethnicityPending: _cleared, ...rest } = patient
    return { ...rest, ethnicityCode: verdict.code }
  }
  // Quarantined pending correction (7th review A11) — never stored as the code.
  return {
    ...patient,
    ethnicityPending: {
      receivedCode: code,
      reason: verdict.verdict === 'malformed' ? verdict.reason : verdict.message,
    },
  }
}

export function upsertPatient(
  api: AppStoreApi,
  actor: Actor,
  details: PatientIntakeDetails,
): Outcome<IntakeResult> {
  const state = api.getState()

  let normalisedNhi: string | undefined
  if (details.nhi !== undefined && details.nhi.trim() !== '') {
    const verdict = validateNhi(details.nhi)
    if (!verdict.valid) {
      return refuse('invalidNhi', verdict.reason ?? 'The NHI is not valid.')
    }
    normalisedNhi = verdict.normalised
  }

  // NHI match (either format): enrich and reuse — never a duplicate row.
  if (normalisedNhi !== undefined) {
    const existing = Object.values(state.masters.patients).find((p) => p.nhi === normalisedNhi)
    if (existing !== undefined) {
      let enriched: Patient = { ...existing }
      if (existing.phone === undefined && details.phone !== undefined) enriched.phone = details.phone
      if (existing.email === undefined && details.email !== undefined) enriched.email = details.email
      if (existing.postalAddress === undefined && details.postalAddress !== undefined) enriched.postalAddress = details.postalAddress
      if (existing.ethnicityCode === undefined) enriched = withEthnicity(enriched, details.ethnicityCode)
      mutate(
        api,
        actor,
        {
          entityType: 'patient',
          entityId: existing.hiddenInternalId,
          action: 'patient.reuse',
          after: { matchedByNhi: normalisedNhi },
        },
        (s) => ({
          masters: {
            ...s.masters,
            patients: { ...s.masters.patients, [existing.hiddenInternalId]: enriched },
          },
        }),
      )
      return ok({ patient: enriched, outcome: 'reused' })
    }
  }

  // New record — provisional when no NHI is available yet.
  const provisional = normalisedNhi === undefined
  let created: Patient | undefined
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const { id, counters } = allocateId(s.counters, 'patient')
    let patient: Patient = {
      hiddenInternalId: id,
      name: details.name,
      dobISO: details.dobISO,
    }
    if (normalisedNhi !== undefined) patient.nhi = normalisedNhi
    if (details.phone !== undefined) patient.phone = details.phone
    if (details.email !== undefined) patient.email = details.email
    if (details.postalAddress !== undefined) patient.postalAddress = details.postalAddress
    patient = withEthnicity(patient, details.ethnicityCode)
    created = patient
    metas.push({
      entityType: 'patient',
      entityId: id,
      action: 'patient.create',
      after: provisional ? { provisional: true } : { nhi: normalisedNhi },
    })
    return {
      masters: { ...s.masters, patients: { ...s.masters.patients, [id]: patient } },
      counters,
    }
  })

  if (created === undefined) return refuse('createFailed', 'The patient record could not be created.')
  return ok({ patient: created, outcome: provisional ? 'createdProvisional' : 'created' })
}

// ---------------------------------------------------------------------------
// editPatient
// ---------------------------------------------------------------------------

/** Editable patient demographics (Phase 03 Booking-screen patient block). */
export type PatientEditPatch = Partial<Pick<Patient, 'name' | 'dobISO' | 'phone' | 'email' | 'postalAddress'>>

/**
 * Edit a Patient's demographics, audited `patient.update` (phase doc item 3).
 * Mirrors `editBooking`: when a `viaBookingId` is supplied (the Booking screen always
 * does), the same `editRefusal` gate applies against that Booking's List: the
 * anaesthetist edits their own ACTIVE or SUBMITTED List (catch-up Phase 38a) and
 * an AUTHORISED List is locked. Called without a booking context (later office master edits) it skips
 * the list gate.
 */
export function editPatient(
  api: AppStoreApi,
  actor: Actor,
  patientId: string,
  patch: PatientEditPatch,
  viaBookingId?: string,
): Outcome {
  const state = api.getState()
  const patient = state.masters.patients[patientId]
  if (patient === undefined) return refuse('notFound', 'Patient not found.')
  if (viaBookingId !== undefined) {
    const found = getBooking(state, viaBookingId)
    if (found === undefined) return refuse('notFound', 'Booking not found.')
    const rights = editRefusal(actor, found.list)
    if (rights !== null) return rights
  }
  // The payer rules (catch-up Phase 21): an email's shape and an NZ Post address.
  const badEmail = emailProblem(patch.email)
  if (badEmail !== null) return refuse('emailInvalid', badEmail)
  if (patch.postalAddress !== undefined) {
    const badAddress = postalAddressProblem(patch.postalAddress)
    if (badAddress !== null) return refuse('postalAddressInvalid', badAddress)
  }
  // History reads an address as one line.
  const narrate = (values: Partial<Patient>): Record<string, unknown> =>
    Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, k === 'postalAddress' && v !== undefined ? formatPostalAddress(v as PostalAddress) : v]),
    )

  mutate(
    api,
    actor,
    {
      entityType: 'patient',
      entityId: patientId,
      action: 'patient.update',
      before: narrate(Object.fromEntries(Object.keys(patch).map((k) => [k, patient[k as keyof Patient]])) as Partial<Patient>),
      after: narrate(patch),
    },
    (s) => ({
      masters: {
        ...s.masters,
        patients: { ...s.masters.patients, [patientId]: { ...patient, ...patch } },
      },
    }),
  )
  // With prepayment approval off, a group this makes ready is sent now (catch-up Phase 27).
  autoSendPrepayments(api)
  return ok(undefined)
}

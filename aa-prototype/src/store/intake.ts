/**
 * Patient intake: the ONE upsert path every booking-creation flow uses
 * (manual, phone advice, hospital rows, the rooms' PDF rows; Phases 03/11,
 * 33, 33a). The RFP's Appendix 2 places dedupe at intake: match by NHI
 * (either format) and reuse the existing Patient. The NHI is mandatory
 * (catch-up Phase 40; D11, OQ-49, US-11.1.1): there is no record without one.
 * Details that differ from the record are held for review
 * (`pendingDetails`), never written over it.
 */

import { autoSendPrepayments } from './prepaymentActions'
import type { Patient, PatientDetailField, PatientPendingDetails, PostalAddress } from '../domain/types'
import { emailProblem, formatPostalAddress, postalAddressProblem } from '../domain/billing/payer'
import { validateNhi } from '../domain/nhi'
import { validateEthnicityCode } from '../domain/nzhis'
import { detailDifferences } from '../domain/patients'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { editRefusal, getBooking } from './lifecycle'

export interface PatientIntakeDetails {
  /** Required (D11): a blank or invalid NHI is refused with `nhiRequired` / `invalidNhi` before any write. */
  nhi: string
  name: string
  dobISO: string
  phone?: string
  email?: string
  postalAddress?: PostalAddress
  ethnicityCode?: string
  /** Who supplied these details, for a "details differ" review (catch-up Phase 40). Default: the actor's side. */
  detailsSource?: PatientPendingDetails['source']
}

export interface IntakeResult {
  patient: Patient
  /** 'reused' = an existing record matched by NHI (enriched where a field was empty). */
  outcome: 'created' | 'reused'
  /** Details that differ from the record, held as `pendingDetails` for review (catch-up Phase 40). */
  pendingDifferences?: PatientPendingDetails['differences']
}

/** The NHI is mandatory (catch-up Phase 40; D11, US-11.1.4). */
export const NHI_REQUIRED_FOR_BOOKING_MESSAGE = 'An NHI is needed before this Booking can be saved.'

/** The NHI check every create path shares: `nhiRequired` when blank, `invalidNhi` with `validateNhi`'s reason. */
export function nhiRefusal(nhi: string | undefined): Outcome<never> | null {
  if (nhi === undefined || nhi.trim() === '') return refuse('nhiRequired', NHI_REQUIRED_FOR_BOOKING_MESSAGE)
  const verdict = validateNhi(nhi)
  if (!verdict.valid) return refuse('invalidNhi', verdict.reason ?? 'The NHI is not valid.')
  return null
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

function sourceFor(actor: Actor, details: PatientIntakeDetails): PatientPendingDetails['source'] {
  if (details.detailsSource !== undefined) return details.detailsSource
  return actor.source === 'integration' ? 'hospital' : 'aa'
}

export function upsertPatient(
  api: AppStoreApi,
  actor: Actor,
  details: PatientIntakeDetails,
): Outcome<IntakeResult> {
  const refused = nhiRefusal(details.nhi)
  if (refused !== null) return refused
  const normalisedNhi = validateNhi(details.nhi).normalised
  const state = api.getState()

  // NHI match (either format): reuse, enrich empty fields, hold differing ones for review (never a duplicate row).
  const existing = Object.values(state.masters.patients).find((p) => p.nhi === normalisedNhi)
  if (existing !== undefined) {
    let enriched: Patient = { ...existing }
    if (existing.phone === undefined && details.phone !== undefined) enriched.phone = details.phone
    if (existing.email === undefined && details.email !== undefined) enriched.email = details.email
    if (existing.postalAddress === undefined && details.postalAddress !== undefined) enriched.postalAddress = details.postalAddress
    if (existing.ethnicityCode === undefined) enriched = withEthnicity(enriched, details.ethnicityCode)
    const differences = detailDifferences(existing, details)
    const metas: MutationMeta[] = [
      { entityType: 'patient', entityId: existing.hiddenInternalId, action: 'patient.reuse', after: { matchedByNhi: normalisedNhi } },
    ]
    if (differences.length > 0) {
      metas.push({
        entityType: 'patient',
        entityId: existing.hiddenInternalId,
        action: 'patient.detailsPending',
        after: { fields: differences.map((d) => d.field) },
      })
    }
    mutate(api, actor, metas, (s) => {
      if (differences.length > 0) {
        const pending: PatientPendingDetails = {
          receivedAtISO: clockISO(s.clock),
          source: sourceFor(actor, details),
          differences,
          ...(differences.some((d) => d.field === 'address') && details.postalAddress !== undefined ? { incomingAddress: details.postalAddress } : {}),
        }
        enriched = { ...enriched, pendingDetails: pending }
      }
      return { masters: { ...s.masters, patients: { ...s.masters.patients, [existing.hiddenInternalId]: enriched } } }
    })
    return ok({ patient: enriched, outcome: 'reused', ...(differences.length > 0 ? { pendingDifferences: differences } : {}) })
  }

  let created: Patient | undefined
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const { id, counters } = allocateId(s.counters, 'patient')
    let patient: Patient = { hiddenInternalId: id, nhi: normalisedNhi, name: details.name, dobISO: details.dobISO }
    if (details.phone !== undefined) patient.phone = details.phone
    if (details.email !== undefined) patient.email = details.email
    if (details.postalAddress !== undefined) patient.postalAddress = details.postalAddress
    patient = withEthnicity(patient, details.ethnicityCode)
    created = patient
    metas.push({ entityType: 'patient', entityId: id, action: 'patient.create', after: { nhi: normalisedNhi } })
    return { masters: { ...s.masters, patients: { ...s.masters.patients, [id]: patient } }, counters }
  })

  if (created === undefined) return refuse('createFailed', 'The patient record could not be created.')
  return ok({ patient: created, outcome: 'created' })
}

// ---------------------------------------------------------------------------
// resolvePatientDetails
// ---------------------------------------------------------------------------

export const NOTHING_TO_REVIEW_MESSAGE = 'Nothing to review.'

/**
 * The office's review of details that arrived with a returning NHI
 * (catch-up Phase 40; US-11.1.1): each differing field kept or replaced by
 * the incoming value, then `pendingDetails` cleared. Audited
 * `patient.detailsResolved`. Office only.
 */
export function resolvePatientDetails(
  api: AppStoreApi,
  actor: Actor,
  patientId: string,
  choices: Partial<Record<PatientDetailField, 'keep' | 'useIncoming'>>,
): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the AA office reviews patient details.')
  const patient = api.getState().masters.patients[patientId]
  if (patient === undefined) return refuse('notFound', 'Patient not found.')
  const pending = patient.pendingDetails
  if (pending === undefined || pending.differences.length === 0) return refuse('nothingToReview', NOTHING_TO_REVIEW_MESSAGE)
  const patch: Partial<Patient> = {}
  const used: PatientDetailField[] = []
  for (const d of pending.differences) {
    if (choices[d.field] !== 'useIncoming') continue
    used.push(d.field)
    if (d.field === 'address') {
      if (pending.incomingAddress !== undefined) patch.postalAddress = pending.incomingAddress
    } else {
      patch[d.field] = d.incoming
    }
  }
  mutate(
    api,
    actor,
    {
      entityType: 'patient',
      entityId: patientId,
      action: 'patient.detailsResolved',
      after: { usedIncoming: used, kept: pending.differences.map((d) => d.field).filter((f) => !used.includes(f)) },
    },
    (s) => {
      const { pendingDetails: _cleared, ...rest } = s.masters.patients[patientId]!
      return { masters: { ...s.masters, patients: { ...s.masters.patients, [patientId]: { ...rest, ...patch } } } }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// editPatient
// ---------------------------------------------------------------------------

/** Editable patient demographics (Phase 03 Booking-screen patient block). */
export type PatientEditPatch = Partial<Pick<Patient, 'name' | 'dobISO' | 'phone' | 'email' | 'postalAddress' | 'nhi' | 'ethnicityCode'>>

/** The NHI is mandatory and never cleared (catch-up Phase 35; D11, OQ-49). */
export const PATIENT_NHI_REQUIRED_MESSAGE = 'The NHI is required.'
export const PATIENT_NHI_OFFICE_ONLY_MESSAGE = 'Only the AA office changes the NHI.'

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
  // The office corrects the NHI (catch-up Phase 35; US-02.3.1): mandatory, never cleared (D11), either format.
  if (patch.nhi !== undefined) {
    if (actor.role !== 'office') return refuse('officeOnly', PATIENT_NHI_OFFICE_ONLY_MESSAGE)
    if (patch.nhi.trim() === '') return refuse('nhiRequired', PATIENT_NHI_REQUIRED_MESSAGE)
    const verdict = validateNhi(patch.nhi)
    if (!verdict.valid) return refuse('nhiInvalid', verdict.reason ?? 'That NHI is not valid.')
    patch = { ...patch, nhi: verdict.normalised }
  }
  // Ethnicity (catch-up Phase 40; US-11.1.1, FT-14.4): a malformed code is refused; a code outside
  // the demo subset is quarantined as `ethnicityPending`; a valid code stores and clears the quarantine.
  let ethnicity: Pick<Patient, 'ethnicityCode' | 'ethnicityPending'> | undefined
  if (patch.ethnicityCode !== undefined) {
    const verdict = validateEthnicityCode(patch.ethnicityCode)
    if (verdict.verdict === 'malformed') return refuse('ethnicityInvalid', verdict.reason)
    const { ethnicityCode: _code, ...rest } = patch
    patch = rest
    ethnicity = verdict.verdict === 'valid' ? { ethnicityCode: verdict.code } : { ethnicityPending: { receivedCode: verdict.code, reason: verdict.message } }
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
      before: narrate({
        ...(Object.fromEntries(Object.keys(patch).map((k) => [k, patient[k as keyof Patient]])) as Partial<Patient>),
        ...(ethnicity !== undefined ? { ethnicityCode: patient.ethnicityCode } : {}),
      }),
      after: narrate({ ...patch, ...(ethnicity !== undefined ? { ethnicityCode: ethnicity.ethnicityCode ?? ethnicity.ethnicityPending?.receivedCode } : {}) }),
    },
    (s) => {
      let next: Patient = { ...patient, ...patch }
      if (ethnicity?.ethnicityCode !== undefined) {
        const { ethnicityPending: _cleared, ...rest } = next
        next = { ...rest, ethnicityCode: ethnicity.ethnicityCode }
      } else if (ethnicity?.ethnicityPending !== undefined) {
        next = { ...next, ethnicityPending: ethnicity.ethnicityPending }
      }
      return { masters: { ...s.masters, patients: { ...s.masters.patients, [patientId]: next } } }
    },
  )
  // With prepayment approval off, a group this makes ready is sent now (catch-up Phase 27).
  autoSendPrepayments(api)
  return ok(undefined)
}

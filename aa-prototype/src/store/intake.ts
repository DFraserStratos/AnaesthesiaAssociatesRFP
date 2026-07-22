/**
 * Patient intake — the ONE upsert path every card-creation flow uses (manual,
 * photo, HL7, FHIR, PDF; Phases 03/11). The RFP's Appendix 2 places dedupe at
 * intake: match by NHI when present (either format) and enrich + reuse the
 * existing Patient; without an NHI, create a provisional record. One person,
 * one Patient row, before Xero contact resolution ever matters.
 */

import type { Patient } from '../domain/types'
import { validateNhi } from '../domain/nhi'
import { validateEthnicityCode } from '../domain/nzhis'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { editRefusal, getCard } from './lifecycle'

export interface PatientIntakeDetails {
  nhi?: string
  name: string
  dobISO: string
  phone?: string
  email?: string
  address?: string
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
      if (existing.address === undefined && details.address !== undefined) enriched.address = details.address
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
    if (details.address !== undefined) patient.address = details.address
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

/** Editable patient demographics (Phase 03 Card-screen patient block). */
export type PatientEditPatch = Partial<Pick<Patient, 'name' | 'dobISO' | 'phone' | 'email' | 'address'>>

/**
 * Edit a Patient's demographics, audited `patient.update` (phase doc item 3).
 * Mirrors `editCard`: when a `viaCardId` is supplied (the Card screen always
 * does), the same `editRefusal` gate applies against that Card's List, so a
 * SUBMITTED List is read-only to the anaesthetist and an AUTHORISED List is
 * locked. Called without a card context (later office master edits) it skips
 * the list gate.
 */
export function editPatient(
  api: AppStoreApi,
  actor: Actor,
  patientId: string,
  patch: PatientEditPatch,
  viaCardId?: string,
): Outcome {
  const state = api.getState()
  const patient = state.masters.patients[patientId]
  if (patient === undefined) return refuse('notFound', 'Patient not found.')
  if (viaCardId !== undefined) {
    const found = getCard(state, viaCardId)
    if (found === undefined) return refuse('notFound', 'Card not found.')
    const rights = editRefusal(actor, found.list)
    if (rights !== null) return rights
  }

  mutate(
    api,
    actor,
    {
      entityType: 'patient',
      entityId: patientId,
      action: 'patient.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, patient[k as keyof Patient]])),
      after: patch,
    },
    (s) => ({
      masters: {
        ...s.masters,
        patients: { ...s.masters.patients, [patientId]: { ...patient, ...patch } },
      },
    }),
  )
  return ok(undefined)
}

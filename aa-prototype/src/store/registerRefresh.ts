/**
 * The office's refresh of a patient record from the NHI register (catch-up
 * Phase 40a; US-14.4.1's note, DM-30). On demand, per patient, by the office:
 * a provisional build default (no scheduled job; the twice-daily cadence is a
 * note about hospitals).
 *
 * The store re-reads the register itself (`nhiRegister()`), so no screen can
 * inject data. Enrichments apply, differences need the office's choice
 * (default Keep), and the record is stamped from the demo clock. It never
 * touches Xero (OQ-30: no PII there), the ledger, any Booking, or Phase 40's
 * `pendingDetails`, which came from a hospital or surgeon and keep their own
 * review. Bookings show a new name because they reference the patient id.
 */

import {
  applyRegisterRefresh,
  registerDifferences,
  type NhiRegisterPerson,
  type RegisterChoices,
  type RegisterDifference,
  type RegisterEnrichment,
  type RegisterField,
} from '../domain/nhiRegister'
import { nhiRegister } from '../domain/seed/nhiRegister'
import { formatPostalAddress } from '../domain/billing/payer'
import type { Patient } from '../domain/types'
import type { AppState, AppStoreApi } from './appStore'
import { clockISO, mutate, ok, refuse, type Actor, type Outcome } from './mutate'

export const REGISTER_REFRESH_MESSAGES = {
  officeOnly: 'The office refreshes patient details from the NHI register.',
  hubUnavailable: 'The Digital Services Hub is not answering. Try again later.',
  noNhi: 'Attach an NHI first.',
  notOnRegister: 'No one with this NHI is on the NHI register.',
  notADifference: 'That detail does not differ from the NHI register.',
  notFound: 'Patient not found.',
} as const

export type RegisterRefreshPreview =
  | { kind: 'notFound' }
  | { kind: 'noNhi' }
  | { kind: 'notOnRegister'; nhi: string }
  | {
      kind: 'ready'
      person: NhiRegisterPerson
      differences: RegisterDifference[]
      enrichments: RegisterEnrichment[]
      lastRefreshedAtISO?: string
    }

/** What a refresh of this patient would change. */
export function registerRefreshPreview(state: Pick<AppState, 'masters'>, patientId: string): RegisterRefreshPreview {
  const patient = state.masters.patients[patientId]
  if (patient === undefined) return { kind: 'notFound' }
  if (patient.nhi.trim() === '') return { kind: 'noNhi' }
  const person = nhiRegister().get(patient.nhi)
  if (person === undefined) return { kind: 'notOnRegister', nhi: patient.nhi }
  const { differences, enrichments } = registerDifferences(patient, person)
  return {
    kind: 'ready',
    person,
    differences,
    enrichments,
    ...(patient.registerRefreshedAtISO !== undefined ? { lastRefreshedAtISO: patient.registerRefreshedAtISO } : {}),
  }
}

/** A field's value as the audit records it (an address as its one line). */
function auditValue(patient: Patient, field: keyof Patient | 'address'): string | undefined {
  if (field === 'address') return patient.postalAddress !== undefined ? formatPostalAddress(patient.postalAddress) : undefined
  const v = patient[field]
  return typeof v === 'string' ? v : undefined
}

/**
 * Apply a refresh in one audited `mutate`: every enrichment, each difference
 * chosen `useRegister`, and the `registerRefreshedAtISO` stamp. With nothing
 * to change it still stamps and audits ("no changes"). Refusals leave state
 * untouched.
 */
export function refreshPatientFromRegister(
  api: AppStoreApi,
  actor: Actor,
  patientId: string,
  choices: RegisterChoices = {},
): Outcome<{ changed: RegisterField[] }> {
  if (actor.role !== 'office') return refuse('officeOnly', REGISTER_REFRESH_MESSAGES.officeOnly)
  const state = api.getState()
  if ((state.settings.nhiHubMode ?? 'available') === 'unavailable') return refuse('hubUnavailable', REGISTER_REFRESH_MESSAGES.hubUnavailable)
  const preview = registerRefreshPreview(state, patientId)
  if (preview.kind === 'notFound') return refuse('notFound', REGISTER_REFRESH_MESSAGES.notFound)
  if (preview.kind === 'noNhi') return refuse('noNhi', REGISTER_REFRESH_MESSAGES.noNhi)
  if (preview.kind === 'notOnRegister') return refuse('notOnRegister', REGISTER_REFRESH_MESSAGES.notOnRegister)
  const differing = new Set<string>(preview.differences.map((d) => d.field))
  for (const field of Object.keys(choices)) {
    if (!differing.has(field)) return refuse('notADifference', REGISTER_REFRESH_MESSAGES.notADifference)
  }

  const patient = state.masters.patients[patientId] as Patient
  const { patient: refreshed, changed } = applyRegisterRefresh(patient, preview.person, choices)
  const stamp = clockISO(state.clock)
  const before: Record<string, unknown> = {}
  const after: Record<string, unknown> = {}
  for (const field of changed) {
    before[field] = auditValue(patient, field) ?? null
    after[field] = auditValue(refreshed, field) ?? null
  }
  if (changed.length === 0) after.changes = 'no changes'
  after.registerRefreshedAtISO = stamp
  after.from = 'NHI register'

  mutate(
    api,
    actor,
    { entityType: 'patient', entityId: patientId, action: 'patient.registerRefreshed', before, after, stampBookingId: null },
    (s) => {
      const current = s.masters.patients[patientId] as Patient
      // Re-apply on the live record (the same values `applyRegisterRefresh` chose), then stamp.
      const { patient: next } = applyRegisterRefresh(current, preview.person, choices)
      return { masters: { ...s.masters, patients: { ...s.masters.patients, [patientId]: { ...next, registerRefreshedAtISO: stamp } } } }
    },
  )
  return ok({ changed })
}

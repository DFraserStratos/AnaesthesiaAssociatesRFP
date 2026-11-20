/**
 * The one "find the patient by NHI" (catch-up Phase 40): the NHI is the
 * record's key, normalised by `validateNhi` so every caller (the record
 * route, the follow-up log, the forms' previews) reads it the same way.
 */

import { validateNhi } from '../domain/nhi'
import type { Patient } from '../domain/types'
import type { AppState } from './appStore'

export function patientByNhi(state: Pick<AppState, 'masters'>, nhi: string): Patient | undefined {
  const key = validateNhi(nhi.replace(/\s+/g, '')).normalised
  if (key === '') return undefined
  return Object.values(state.masters.patients).find((p) => p.nhi === key)
}

/**
 * Catch-up Phase 22a's seed additions, taken out of a state so a parity
 * capture covers exactly what existed before the phase: Grace Park's second
 * Procedure and the two-payer Booking (`seed/procedurePayerBookings.ts`).
 * The earlier parity suites (18, 19, 19a, 19b, 20, 21) read the seed through
 * this, as they set aside each later phase's named additions. Imported only
 * by tests.
 */

import { freshAppState, type AppState } from '../appStore'
import { PROCEDURE_PAYER_ADDITIONS } from '../../domain/seed'
import { withoutPhase23Additions } from './phase23Additions'
import { withoutPhase40 } from './phase40Declared'

export type Phase22aAdditions = { procedureIds: readonly string[]; bookingIds: readonly string[] }

/** Take the given additions out of a state (its Procedures, Bookings and the Bookings' Procedures). */
export function withoutPhase22aAdditions(state: AppState, additions: Phase22aAdditions = PROCEDURE_PAYER_ADDITIONS): AppState {
  if (additions.procedureIds.length === 0 && additions.bookingIds.length === 0) return state
  const procedures = { ...state.schedule.procedures }
  for (const id of additions.procedureIds) delete procedures[id]
  for (const p of Object.values(state.schedule.procedures)) if (additions.bookingIds.includes(p.bookingId)) delete procedures[p.id]
  const bookings = { ...state.schedule.bookings }
  for (const id of additions.bookingIds) delete bookings[id]
  return { ...state, schedule: { ...state.schedule, procedures, bookings } }
}

/** The pristine seed without 22a's additions (nor any later phase's: Phase 23's three-procedure Booking). */
export function freshAppStateBefore22a(): AppState {
  return withoutPhase22aAdditions(withoutPhase23Additions(withoutPhase40(freshAppState())))
}

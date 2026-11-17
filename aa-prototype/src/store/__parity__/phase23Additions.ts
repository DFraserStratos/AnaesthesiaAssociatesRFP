/**
 * Catch-up Phase 23's seed addition, taken out of a state so the earlier
 * parity captures (18 to 22a) cover exactly what existed before it: the
 * three-procedure Booking and its Procedures (`seed/multiProcedureDemo.ts`),
 * with Dr Souter's Mon 13 Jul AM List back to ACTIVE. Imported only by tests.
 */

import type { AppState } from '../appStore'
import { MULTI_PROCEDURE_IDS, SEED_LIST_IDS } from '../../domain/seed'

export function withoutPhase23Additions(state: AppState): AppState {
  const procedures = { ...state.schedule.procedures }
  for (const id of MULTI_PROCEDURE_IDS.procedures) delete procedures[id]
  const bookings = { ...state.schedule.bookings }
  delete bookings[MULTI_PROCEDURE_IDS.booking]
  const lists = { ...state.schedule.lists }
  const list = lists[SEED_LIST_IDS.multiProcedure]
  if (list !== undefined && list.state !== 'DRAFT') lists[list.id] = { ...list, state: 'ACTIVE' }
  return { ...state, schedule: { ...state.schedule, procedures, bookings, lists } }
}

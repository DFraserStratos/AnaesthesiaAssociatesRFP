/**
 * The PWA office stand-in for stubs (catch-up Phase 33a): "Office adds the NHI
 * to this stub". The phone has no Admin app, so this plays the office's Add NHI
 * on Matching through the one resolve path, as `OFFICE_SIMULATION_ACTOR`.
 */

import type { ImportRow } from '../domain/types'
import { SEED_STUB } from '../domain/seed/intakeSeed'
import { SAMPLE_SX, SX_NO_NHI_TYPED } from '../domain/intake/hospitalDownloads'
import { HOSP } from '../domain/seed/cast'
import { stubsOnList } from '../domain/intake/stubs'
import { refuse, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { resolveStub, type ResolveStubResult } from './stubActions'

const SX_R4_PATIENT = SAMPLE_SX.rows[3]!.patient.name

/** The synthetic NHI the fixtures hold for a waiting row: the seeded row's, or Southern Cross R4's. */
export function fixtureNhiForRow(row: Pick<ImportRow, 'id' | 'incoming'>): string | undefined {
  if (row.id === SEED_STUB.rowId) return SEED_STUB.nhiToType
  if (row.incoming.hospitalId === HOSP.sx && row.incoming.patient.name === SX_R4_PATIENT) return SX_NO_NHI_TYPED
  return undefined
}

/** Why the stand-in cannot run on this List, or null. */
export function officeAddsNhiRefusal(state: Pick<AppState, 'intake'>, listId: string | undefined): string | null {
  if (listId === undefined) return 'Open a List first'
  const stub = stubsOnList(state.intake.stubs, listId)[0]
  if (stub === undefined) return 'No stub on this List'
  const row = state.intake.rows[stub.importRowId]
  if (row === undefined || fixtureNhiForRow(row) === undefined) return 'No NHI to add for this stub'
  if (row.corrections?.nhi !== undefined) return 'The NHI is added; the office decides it at Intake'
  return null
}

/** The office adds the fixture's NHI to the List's first standing stub. */
export function officeAddsNhiToStub(api: AppStoreApi, listId: string): Outcome<ResolveStubResult & { patient: string }> {
  const state = api.getState()
  const refusal = officeAddsNhiRefusal(state, listId)
  if (refusal !== null) return refuse('noStub', refusal)
  const stub = stubsOnList(state.intake.stubs, listId)[0]!
  const nhi = fixtureNhiForRow(state.intake.rows[stub.importRowId]!)!
  const out = resolveStub(api, OFFICE_SIMULATION_ACTOR, stub.id, { kind: 'addNhi', nhi })
  if (!out.ok) return out
  return { ok: true, value: { ...out.value, patient: stub.asReceived.patientName } }
}

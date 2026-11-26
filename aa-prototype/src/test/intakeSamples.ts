/**
 * Test support (build plan Phase 68): the hospital download samples arriving now that Intake has no import.
 *
 * - `receiveSample`: a connected hospital's sample (St George's, Southern Cross) sent by its feed through the ingest
 *   (`receiveHospitalBatch`, as the hospital's integration, never the office), as the demo actions and the PWA
 *   stand-ins send theirs.
 * - `stageNoNhiList`: Forte Health's sheet with two missing NHIs (`NO_NHI_LIST`). Forte Health is not connected
 *   (D125: its Lists come by PDF to the rooms' mailbox), so the ingest has no way in for a keyed sheet; the tests
 *   that read its two waiting rows stage them straight through `stageImportRows`, as the sheet they were.
 */

import type { AppStoreApi } from '../store/appStore'
import { OFFICE_ACTOR } from '../store/demoActors'
import { receiveHospitalBatch } from '../store/intakeIngest'
import { stageImportRows } from '../store/matchingActions'
import { NO_NHI_LIST, type HospitalDownloadSample } from '../domain/intake/hospitalDownloads'

/** A connected hospital's sample sent by its feed; its batch and row ids in file order. Throws on a refusal. */
export function receiveSample(api: AppStoreApi, sample: HospitalDownloadSample): { batchId: string; rowIds: string[] } {
  const out = receiveHospitalBatch(api, sample.hospitalId, sample.label, sample.rows, { sampleId: sample.id })
  if (!out.ok) throw new Error(`${sample.id}: ${out.message}`)
  return out.value
}

/** Forte Health's two rows with no NHI, staged as the keyed sheet; its batch and row ids. Throws on a refusal. */
export function stageNoNhiList(api: AppStoreApi): { batchId: string; rowIds: string[] } {
  const out = stageImportRows(api, OFFICE_ACTOR, NO_NHI_LIST.channel, NO_NHI_LIST.hospitalId, NO_NHI_LIST.label, NO_NHI_LIST.rows, { sampleId: NO_NHI_LIST.id })
  if (!out.ok || out.value.batchId === undefined) throw new Error(`${NO_NHI_LIST.id}: ${out.ok ? 'every row already waiting' : out.message}`)
  return { batchId: out.value.batchId, rowIds: out.value.rowIds }
}

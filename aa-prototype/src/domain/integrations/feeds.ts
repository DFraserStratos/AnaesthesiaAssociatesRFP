/**
 * The three seeded integration feeds (Phase 11). The per-hospital field mapping
 * is load-bearing, not decorative:
 *
 *  - Feed A · St George's (HL7 v2, webPAS) — mapping CORRECT (`nhi ← PID-2`,
 *    which is where St George's actually sends it). Carries the bulk of the
 *    SIU traffic.
 *  - Feed B · Christchurch Public (HL7 v2) — mapping MISCONFIGURED at
 *    onboarding (`nhi ← PID-2`), but Christchurch Public actually sends the NHI
 *    in PID-3. Its messages dead-letter until an operator corrects the mapping
 *    to `nhi ← PID-3` — after which A (PID-2) and B (PID-3) genuinely differ.
 *  - Feed C · Southern Cross (FHIR-native) — walks a FHIR-path mapping; the
 *    target state, no HL7 translation step.
 */

import type { IntegrationFeed } from '../types'
import { HOSP } from '../seed/cast'
import { ETHNICITY_EXT_URL, HPI_SYSTEM, NHI_SYSTEM } from './fhir'

export const FEED = {
  stg: 'FEED-STG',
  cph: 'FEED-CPH',
  sx: 'FEED-SX',
} as const

export interface FeedMeta {
  id: string
  /** Short display name for the simulator + monitor. */
  name: string
  /** The system-actor label integration writes are attributed to. */
  actorLabel: string
  transport: 'hl7v2' | 'fhir'
}

export const FEED_META: Readonly<Record<string, FeedMeta>> = {
  [FEED.stg]: { id: FEED.stg, name: "St George's (webPAS)", actorLabel: "St George's webPAS feed", transport: 'hl7v2' },
  [FEED.cph]: { id: FEED.cph, name: 'Christchurch Public', actorLabel: 'Christchurch Public HL7 feed', transport: 'hl7v2' },
  [FEED.sx]: { id: FEED.sx, name: 'Southern Cross (FHIR)', actorLabel: 'Southern Cross FHIR feed', transport: 'fhir' },
}

/**
 * The correct HL7 demographic mapping (St George's puts the NHI in PID-2). The
 * SCH-2 appointment id, SCH-7 procedure and AIS-4 start-time positions follow
 * the RFP's own annotated SIU sample (RFP.md's worked example).
 */
const STG_MAPPING: Record<string, string> = {
  nhi: 'PID-2',
  patientName: 'PID-5',
  dob: 'PID-7',
  ethnicity: 'PID-10',
  appointmentId: 'SCH-2',
  scheduledDateTime: 'AIS-4',
  operation: 'SCH-7.2',
}

/**
 * Christchurch Public's mapping AS ONBOARDED — wrong for its NHI: it copies St
 * George's `PID-2`, but Christchurch Public sends the NHI in PID-3 (PID-2 holds
 * a local MRN). The failure-fix flow edits `nhi` to `PID-3`.
 */
const CPH_MAPPING_MISCONFIGURED: Record<string, string> = {
  ...STG_MAPPING,
  nhi: 'PID-2',
}

/** The corrected Christchurch Public NHI mapping the operator applies. */
export const CPH_NHI_FIX = 'PID-3'

/** Southern Cross FHIR-path mapping (identifier systems the extractor matches on). */
const SX_MAPPING: Record<string, string> = {
  nhi: NHI_SYSTEM,
  patientName: 'Patient.name',
  dob: 'Patient.birthDate',
  ethnicity: ETHNICITY_EXT_URL,
  appointmentId: 'Appointment.identifier',
  scheduledDateTime: 'Appointment.start',
  operation: 'Appointment.description',
  practitionerHpi: HPI_SYSTEM,
}

export const INTEGRATION_FEEDS: readonly IntegrationFeed[] = [
  { id: FEED.stg, hospitalId: HOSP.stg, transport: 'hl7v2', fieldMapping: { ...STG_MAPPING } },
  { id: FEED.cph, hospitalId: HOSP.cph, transport: 'hl7v2', fieldMapping: { ...CPH_MAPPING_MISCONFIGURED } },
  { id: FEED.sx, hospitalId: HOSP.sx, transport: 'fhir', fieldMapping: { ...SX_MAPPING } },
] as const

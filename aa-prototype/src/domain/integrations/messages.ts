/**
 * The canned SIU message library (Phase 11) — styled on the RFP's HL7 v2.3.1
 * sample (MSH / SCH / AIS / PID segments) plus one FHIR-native bundle. This is
 * demo data, NOT a generator: a fixed, replayable set that exercises every
 * behaviour the integration story needs.
 *
 * Two keys do two different jobs (6th review #1):
 *  - MSH-10 (`id`) dedupes MESSAGES (idempotency / replay).
 *  - SCH-2 (`correlationAppointmentId`) correlates APPOINTMENTS — S13/S14/S15
 *    locate their Card by `{sourceFeedId, externalAppointmentId}`, never by
 *    patient guesswork; the seed plants the matching Cards.
 *
 * Routing (which Souter List a create lands on) is the demo's binding of a
 * canned message to a known List, not something extracted from the wire — the
 * AIL/AIP location/personnel segments a real feed carries are out of the
 * extractor's demo scope (§10 fence). The load-bearing extraction is the
 * patient identity + appointment correlation, which DO come through the mapping.
 */

import { ANAE, ANAESTHETISTS } from '../seed/cast'
import { FEED } from './feeds'
import { toFhirBundle, type FhirBundle, type FhirPractitionerInput } from './fhir'
import type { ParsedMessage } from './hl7'

// ---------------------------------------------------------------------------
// Correlation appointment ids (SCH-2). The seed's modify-target Cards carry the
// matching ones (S13/S14/S15/locked); creates mint their own.
// ---------------------------------------------------------------------------

export const APPT = {
  s12: '1661243', // the RFP sample's filler appointment id (headline S12 create)
  s12NewFormat: '1661251',
  s12Ethnicity: '1661252',
  transient: '1661253',
  malformedCph: '1661260',
  fhirCreate: '1661270',
  // Modify targets (seeded Cards carry these).
  s13Time: '1661301',
  s13Move: '1661302',
  s14: '1661303',
  s15: '1661304',
  lockedTarget: '1661305',
} as const

const SOUTER_PRACTITIONER: FhirPractitionerInput = (() => {
  const s = ANAESTHETISTS.find((a) => a.registrationNumber === ANAE.souter)
  return { name: s?.name ?? 'Dr Melanie Souter', hpiId: s?.hpiId ?? '10SOUM' }
})()

// ---------------------------------------------------------------------------
// HL7 builders
// ---------------------------------------------------------------------------

interface Hl7Spec {
  event: 'S12' | 'S13' | 'S14' | 'S15'
  controlId: string
  sendingFacility: 'STG' | 'CPH'
  appointmentId: string
  scheduled?: { dateISO: string; time: string }
  reason?: string
  note?: string
  operation?: { code: string; description: string }
  patient: {
    nhi: string
    /** Where this hospital physically sends the NHI. */
    nhiField: 'PID-2' | 'PID-3'
    /** A local hospital record number, sent in the OTHER of PID-2 / PID-3. */
    localId: string
    name: { family: string; given: string }
    dobISO: string
    ethnicity?: string
  }
}

function yyyymmdd(dateISO: string): string {
  return dateISO.replace(/-/g, '')
}

function buildHl7(spec: Hl7Spec): string {
  const dt = spec.scheduled !== undefined ? `${yyyymmdd(spec.scheduled.dateISO)}${spec.scheduled.time.replace(':', '')}` : ''
  const nhiValue = `${spec.patient.nhi}^^^NHI`
  const mrnValue = `${spec.patient.localId}^^^MRN`
  const pid2 = spec.patient.nhiField === 'PID-2' ? nhiValue : mrnValue
  const pid3 = spec.patient.nhiField === 'PID-3' ? nhiValue : mrnValue

  const msh = ['MSH', '^~\\&', 'WEBPAS', spec.sendingFacility, 'BOOKING', 'AA', dt || '20260721080000', '', `SIU^${spec.event}`, spec.controlId, 'P', '2.3.1']
  // Segment positions follow the RFP's annotated SIU sample: SCH-2 filler appt
  // id, SCH-6 event reason, SCH-7 procedure code^description; AIS-4 start time.
  const procedure = spec.operation !== undefined ? `${spec.operation.code}^${spec.operation.description}` : ''
  const sch = ['SCH', '', spec.appointmentId, '', '', '', spec.reason ?? '', procedure]
  const ais = ['AIS', '1', 'U', '', dt, '0', '', '240', 'MIN^Minute(TI)^ISO+', '', 'BOOKED']
  const pid = [
    'PID', '1', pid2, pid3, '',
    `${spec.patient.name.family}^${spec.patient.name.given}`, '',
    yyyymmdd(spec.patient.dobISO), '', '', spec.patient.ethnicity ?? '',
  ]
  const segments = [msh, sch, ais, pid]
  if (spec.note !== undefined) segments.push(['NTE', '1', '', spec.note])
  return segments.map((s) => s.join('|')).join('\n')
}

// ---------------------------------------------------------------------------
// Canned message shape
// ---------------------------------------------------------------------------

export interface CannedMessage {
  /** MSH-10 message control id (unique) — the dedupe / idempotency key. */
  id: string
  feedId: string
  eventType: 'S12' | 'S13' | 'S14' | 'S15'
  transport: 'hl7v2' | 'fhir'
  label: string
  description: string
  /** SCH-2 / Appointment.identifier — the appointment correlation key. */
  correlationAppointmentId: string
  raw?: string
  fhirBundle?: FhirBundle
  /** Create-only: which Souter List the new Card lands on. */
  routing?: { anaesthetistId: string; dateISO: string; session: 'AM' | 'PM' }
  /** Fails once then succeeds on retry (the auto-retry demo). */
  simulatedFault?: 'transient'
}

// Souter forward DRAFT Lists the creates land on (hospital-coherent with the feed).
const STG_LIST = { anaesthetistId: ANAE.souter, dateISO: '2026-07-28', session: 'AM' } as const // St George's / Mr Hale
const SX_LIST = { anaesthetistId: ANAE.souter, dateISO: '2026-07-28', session: 'PM' } as const // Southern Cross / Ms Patel
const CPH_LIST = { anaesthetistId: ANAE.souter, dateISO: '2026-07-30', session: 'AM' } as const // Christchurch Public acute

// ---------------------------------------------------------------------------
// The FHIR-native create bundle (built from a parsed spec so extraction round-trips)
// ---------------------------------------------------------------------------

const FHIR_CREATE_PARSED: ParsedMessage = {
  eventType: 'S12',
  messageControlId: 'FHIR-SX-2001',
  appointmentId: APPT.fhirCreate,
  operation: 'Diagnostic knee arthroscopy',
  scheduledDateISO: SX_LIST.dateISO,
  scheduledTime: '14:30',
  patient: {
    nhi: 'MYY54SL', // Priya Nair (seeded, valid new-format) — proves upsertPatient reuse
    name: 'Priya Nair',
    dobISO: '1969-11-08',
    ethnicityCode: '43111', // Indian (valid NZHIS L4)
  },
}

// ---------------------------------------------------------------------------
// The library
// ---------------------------------------------------------------------------

export const CANNED_MESSAGES: readonly CannedMessage[] = [
  {
    id: 'MSG-STG-1001',
    feedId: FEED.stg,
    eventType: 'S12',
    transport: 'hl7v2',
    label: 'S12 · New booking',
    description: 'A new appointment from St George\'s for a repeat patient (Sarah Mitchell). Her NHI matches an existing record, so intake reuses it, no duplicate.',
    correlationAppointmentId: APPT.s12,
    routing: STG_LIST,
    raw: buildHl7({
      event: 'S12',
      controlId: 'MSG-STG-1001',
      sendingFacility: 'STG',
      appointmentId: APPT.s12,
      scheduled: { dateISO: STG_LIST.dateISO, time: '08:30' },
      operation: { code: '20950', description: 'Appendicectomy, laparoscopic' },
      patient: { nhi: 'CQY9304', nhiField: 'PID-2', localId: 'SG-880021', name: { family: 'Mitchell', given: 'Sarah' }, dobISO: '1988-04-12', ethnicity: '11111' },
    }),
  },
  {
    id: 'MSG-STG-1002',
    feedId: FEED.stg,
    eventType: 'S12',
    transport: 'hl7v2',
    label: 'S12 · New-format NHI',
    description: 'A new booking whose patient carries a new-format NHI (mod-23 check letter). Validates and processes end to end.',
    correlationAppointmentId: APPT.s12NewFormat,
    routing: STG_LIST,
    raw: buildHl7({
      event: 'S12',
      controlId: 'MSG-STG-1002',
      sendingFacility: 'STG',
      appointmentId: APPT.s12NewFormat,
      scheduled: { dateISO: STG_LIST.dateISO, time: '09:15' },
      operation: { code: '20941', description: 'Laparoscopic cholecystectomy' },
      patient: { nhi: 'ACA31FM', nhiField: 'PID-2', localId: 'SG-880102', name: { family: 'Manaia', given: 'Te Ariki' }, dobISO: '1990-07-19', ethnicity: '21111' },
    }),
  },
  {
    id: 'MSG-STG-1003',
    feedId: FEED.stg,
    eventType: 'S12',
    transport: 'hl7v2',
    label: 'S12 · Out-of-range ethnicity',
    description: 'A new booking, for a patient new to AA, carrying an ethnicity code outside the NZHIS demo subset. The Card is still created, but the bad code is quarantined "pending correction", never stored, and a data-quality item is raised.',
    correlationAppointmentId: APPT.s12Ethnicity,
    routing: STG_LIST,
    raw: buildHl7({
      event: 'S12',
      controlId: 'MSG-STG-1003',
      sendingFacility: 'STG',
      appointmentId: APPT.s12Ethnicity,
      scheduled: { dateISO: STG_LIST.dateISO, time: '10:00' },
      operation: { code: '49558', description: 'Knee arthroscopy' },
      patient: { nhi: 'TFP7896', nhiField: 'PID-2', localId: 'SG-880140', name: { family: 'Ashford', given: 'Rongo' }, dobISO: '1980-05-14', ethnicity: '77777' },
    }),
  },
  {
    id: 'MSG-STG-1004',
    feedId: FEED.stg,
    eventType: 'S12',
    transport: 'hl7v2',
    label: 'S12 · Transient failure (auto-retry)',
    description: 'A new booking whose first delivery fails transiently (a simulated timeout). It auto-retries on a short timer and succeeds on attempt 2, with the attempt count shown in the monitor.',
    correlationAppointmentId: APPT.transient,
    routing: STG_LIST,
    simulatedFault: 'transient',
    raw: buildHl7({
      event: 'S12',
      controlId: 'MSG-STG-1004',
      sendingFacility: 'STG',
      appointmentId: APPT.transient,
      scheduled: { dateISO: STG_LIST.dateISO, time: '10:45' },
      operation: { code: '49115', description: 'Inguinal hernia repair' },
      patient: { nhi: 'JKL1188', nhiField: 'PID-2', localId: 'SG-880175', name: { family: 'Tuilagi', given: 'Losa' }, dobISO: '1992-01-27', ethnicity: '31111' },
    }),
  },
  {
    id: 'MSG-CPH-2001',
    feedId: FEED.cph,
    eventType: 'S12',
    transport: 'hl7v2',
    label: 'S12 · Malformed under mapping (dead-letter)',
    description: 'Christchurch Public sends the NHI in PID-3, but its feed mapping was onboarded reading PID-2 (a local MRN). Extraction pulls the MRN, the NHI fails validation, and after its retries the message dead-letters. Fixing the feed mapping to PID-3 and reprocessing recovers it.',
    correlationAppointmentId: APPT.malformedCph,
    routing: CPH_LIST,
    raw: buildHl7({
      event: 'S12',
      controlId: 'MSG-CPH-2001',
      sendingFacility: 'CPH',
      appointmentId: APPT.malformedCph,
      scheduled: { dateISO: CPH_LIST.dateISO, time: '08:15' },
      operation: { code: '20905', description: 'Laparotomy, exploratory' },
      patient: { nhi: 'ZBC1123', nhiField: 'PID-3', localId: 'CPH-44718', name: { family: 'Tane', given: 'Wiremu' }, dobISO: '1979-08-22', ethnicity: '21111' },
    }),
  },
  {
    id: 'FHIR-SX-2001',
    feedId: FEED.sx,
    eventType: 'S12',
    transport: 'fhir',
    label: 'S12 · FHIR-native booking',
    description: 'A FHIR R4 booking from Southern Cross, the target-state feed: no HL7 translation step. Carries the NHI as a typed identifier, an NZHIS ethnicity extension, and the anaesthetist HPI on the Practitioner resource.',
    correlationAppointmentId: APPT.fhirCreate,
    routing: SX_LIST,
    fhirBundle: toFhirBundle(FHIR_CREATE_PARSED, SOUTER_PRACTITIONER),
  },
  {
    id: 'MSG-STG-1010',
    feedId: FEED.stg,
    eventType: 'S13',
    transport: 'hl7v2',
    label: 'S13 · Reschedule (same list, new time)',
    description: 'A reschedule that keeps the appointment on the same session but changes its time. Locates its Card by the appointment id and updates the scheduled time in place.',
    correlationAppointmentId: APPT.s13Time,
    raw: buildHl7({
      event: 'S13',
      controlId: 'MSG-STG-1010',
      sendingFacility: 'STG',
      appointmentId: APPT.s13Time,
      scheduled: { dateISO: STG_LIST.dateISO, time: '11:30' },
      operation: { code: '49558', description: 'Knee arthroscopy' },
      patient: { nhi: 'ZAF4434', nhiField: 'PID-2', localId: 'SG-880201', name: { family: 'Holt', given: 'Brian' }, dobISO: '1971-12-18', ethnicity: '61118' },
    }),
  },
  {
    id: 'MSG-STG-1011',
    feedId: FEED.stg,
    eventType: 'S13',
    transport: 'hl7v2',
    label: 'S13 · Reschedule (moves to another day)',
    description: 'A reschedule that moves the appointment to a different day/session. Locates its Card by the appointment id and reassigns it to the target List, leaving both Lists\' other Cards untouched.',
    correlationAppointmentId: APPT.s13Move,
    raw: buildHl7({
      event: 'S13',
      controlId: 'MSG-STG-1011',
      sendingFacility: 'STG',
      appointmentId: APPT.s13Move,
      scheduled: { dateISO: STG_LIST.dateISO, time: '09:00' },
      operation: { code: '46360', description: 'Wrist ORIF, distal radius' },
      patient: { nhi: 'ZAH6659', nhiField: 'PID-2', localId: 'SG-880233', name: { family: 'Webb', given: 'Marcus' }, dobISO: '1977-10-11', ethnicity: '53111' },
    }),
  },
  {
    id: 'MSG-STG-1012',
    feedId: FEED.stg,
    eventType: 'S14',
    transport: 'hl7v2',
    label: 'S14 · Modification',
    description: 'A modification to an existing appointment (a new time plus a note from the booking office). Locates its Card by the appointment id and applies the update.',
    correlationAppointmentId: APPT.s14,
    raw: buildHl7({
      event: 'S14',
      controlId: 'MSG-STG-1012',
      sendingFacility: 'STG',
      appointmentId: APPT.s14,
      scheduled: { dateISO: STG_LIST.dateISO, time: '12:15' },
      note: 'Bumped 15 min at surgeon request',
      operation: { code: '47516', description: 'Total hip replacement' },
      patient: { nhi: 'ZAK8873', nhiField: 'PID-2', localId: 'SG-880260', name: { family: 'Foster', given: 'Diane' }, dobISO: '1958-09-19', ethnicity: '11111' },
    }),
  },
  {
    id: 'MSG-STG-1013',
    feedId: FEED.stg,
    eventType: 'S15',
    transport: 'hl7v2',
    label: 'S15 · Cancellation',
    description: 'A cancellation from St George\'s. Locates its Card by the appointment id and soft-cancels it (retained, visibly cancelled, excluded from billing), the same audited mechanism as a manual cancel.',
    correlationAppointmentId: APPT.s15,
    raw: buildHl7({
      event: 'S15',
      controlId: 'MSG-STG-1013',
      sendingFacility: 'STG',
      appointmentId: APPT.s15,
      reason: 'Cancelled by St George\'s booking office, patient deferred',
      operation: { code: '36561', description: 'Cystoscopy' },
      patient: { nhi: 'ZAM1098', nhiField: 'PID-2', localId: 'SG-880290', name: { family: 'Gray', given: 'Fiona' }, dobISO: '1963-06-13', ethnicity: '11111' },
    }),
  },
  {
    id: 'MSG-STG-1014',
    feedId: FEED.stg,
    eventType: 'S14',
    transport: 'hl7v2',
    label: 'S14 · Locked target (manual intervention)',
    description: 'A modification addressing a Card that sits on a SUBMITTED List (office-only). Integration writes obey the lifecycle: it is NOT applied, and parks as a manual-intervention item for the office to action. Nothing is lost.',
    correlationAppointmentId: APPT.lockedTarget,
    raw: buildHl7({
      event: 'S14',
      controlId: 'MSG-STG-1014',
      sendingFacility: 'STG',
      appointmentId: APPT.lockedTarget,
      scheduled: { dateISO: '2026-07-17', time: '10:15' },
      note: 'Surgeon changed to Mr Tan',
      operation: { code: '36840', description: 'TURP' },
      patient: { nhi: 'ZAC3326', nhiField: 'PID-2', localId: 'SG-880310', name: { family: 'Prentice', given: 'Alan' }, dobISO: '1966-07-04', ethnicity: '11111' },
    }),
  },
] as const

export const CANNED_BY_ID: ReadonlyMap<string, CannedMessage> = new Map(CANNED_MESSAGES.map((m) => [m.id, m]))

export function cannedMessage(id: string): CannedMessage | undefined {
  return CANNED_BY_ID.get(id)
}

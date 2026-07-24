/**
 * FHIR R4 translation (Phase 11) — the target-state view the RFP's HNZ
 * "FHIR-first" direction points at. `toFhirBundle` turns a neutral
 * `ParsedMessage` into an Appointment + Patient + Practitioner message bundle
 * with the NZ-profile touches (NHI identifier system, an NZHIS ethnicity
 * extension run through Phase 01's `validateEthnicityCode`, and the
 * anaesthetist's HPI on the Practitioner); `extractFromFhir` reads a bundle
 * back into the same `ParsedMessage`, so the FHIR-native feed and the
 * HL7-translated feeds converge on one store effect.
 *
 * Demo-grade and scoped to the canned shapes (the §10 fence): not a general
 * FHIR engine.
 */

import { validateEthnicityCode } from '../nzhis'
import type { ParsedMessage } from './hl7'

// NZ profile system URIs (plausible stand-ins for the demo).
export const NHI_SYSTEM = 'https://standards.digital.health.nz/ns/nhi-id'
export const HPI_SYSTEM = 'https://standards.digital.health.nz/ns/hpi-person-id'
/** The extension's StructureDefinition URL (distinct from the code system below). */
export const ETHNICITY_EXT_URL = 'http://hl7.org.nz/fhir/StructureDefinition/nz-ethnicity'
/** The NZHIS Level 4 ethnicity code SYSTEM the `Coding.system` points at (per FHIR R4, not the extension URL). */
export const ETHNICITY_CODE_SYSTEM = 'https://standards.digital.health.nz/ns/nzhis-ethnicity-l4'
const APPOINTMENT_SYSTEM = 'https://standards.digital.health.nz/ns/appointment-id'

// ---------------------------------------------------------------------------
// FHIR resource shapes (only the fields the demo uses)
// ---------------------------------------------------------------------------

export interface FhirCoding {
  system?: string
  code?: string
  display?: string
}
export interface FhirIdentifier {
  system?: string
  value?: string
}
export interface FhirExtension {
  url: string
  valueCoding?: FhirCoding
  /** Set to "pending correction" when the received ethnicity code is not a valid NZHIS L4 code. */
  valueString?: string
}
export interface FhirHumanName {
  family?: string
  given?: string[]
  text?: string
}
export interface FhirPatient {
  resourceType: 'Patient'
  identifier?: FhirIdentifier[]
  name?: FhirHumanName[]
  birthDate?: string
  extension?: FhirExtension[]
}
export interface FhirPractitioner {
  resourceType: 'Practitioner'
  identifier?: FhirIdentifier[]
  name?: FhirHumanName[]
}
export interface FhirAppointment {
  resourceType: 'Appointment'
  identifier?: FhirIdentifier[]
  status: string
  description?: string
  start?: string
}
export interface FhirMessageHeader {
  resourceType: 'MessageHeader'
  id?: string
  eventCoding?: FhirCoding
}
export type FhirResource =
  | FhirPatient
  | FhirPractitioner
  | FhirAppointment
  | FhirMessageHeader
export interface FhirBundleEntry {
  resource: FhirResource
}
export interface FhirBundle {
  resourceType: 'Bundle'
  type: 'message'
  entry: FhirBundleEntry[]
}

export interface FhirPractitionerInput {
  name: string
  hpiId: string
}

// ---------------------------------------------------------------------------
// toFhirBundle — ParsedMessage → FHIR R4 message bundle
// ---------------------------------------------------------------------------

function appointmentStatusFor(eventType: string): string {
  return eventType === 'S15' ? 'cancelled' : 'booked'
}

/**
 * Build the FHIR R4 bundle for a parsed message. The ethnicity code is run
 * through `validateEthnicityCode`: a valid code carries its NZHIS display; a
 * code outside the demo subset (or malformed) is held "pending correction" in
 * the extension (never presented as a settled code) — the same load-bearing
 * validator the store quarantines with. The Practitioner carries the
 * anaesthetist's HPI where one is supplied.
 */
export function toFhirBundle(
  parsed: ParsedMessage,
  practitioner?: FhirPractitionerInput,
): FhirBundle {
  const entry: FhirBundleEntry[] = []

  entry.push({
    resource: {
      resourceType: 'MessageHeader',
      id: parsed.messageControlId,
      eventCoding: { system: 'http://terminology.hl7.org/CodeSystem/v2-0003', code: parsed.eventType },
    },
  })

  const patient: FhirPatient = { resourceType: 'Patient' }
  if (parsed.patient.nhi !== undefined) {
    patient.identifier = [{ system: NHI_SYSTEM, value: parsed.patient.nhi }]
  }
  if (parsed.patient.name !== undefined) {
    patient.name = [{ text: parsed.patient.name }]
  }
  if (parsed.patient.dobISO !== undefined) patient.birthDate = parsed.patient.dobISO
  if (parsed.patient.ethnicityCode !== undefined) {
    const verdict = validateEthnicityCode(parsed.patient.ethnicityCode)
    const coding: FhirCoding = { system: ETHNICITY_CODE_SYSTEM, code: parsed.patient.ethnicityCode }
    const ext: FhirExtension = { url: ETHNICITY_EXT_URL, valueCoding: coding }
    if (verdict.verdict === 'valid') {
      coding.display = verdict.label
    } else {
      // Never present a non-NZHIS value as a settled code (the RFP mandates the
      // L4 set). Flag it for correction in the resource itself.
      ext.valueString = 'pending correction'
    }
    patient.extension = [ext]
  }
  entry.push({ resource: patient })

  if (practitioner !== undefined) {
    entry.push({
      resource: {
        resourceType: 'Practitioner',
        identifier: [{ system: HPI_SYSTEM, value: practitioner.hpiId }],
        name: [{ text: practitioner.name }],
      },
    })
  }

  const appointment: FhirAppointment = {
    resourceType: 'Appointment',
    status: appointmentStatusFor(parsed.eventType),
  }
  if (parsed.appointmentId !== undefined) {
    appointment.identifier = [{ system: APPOINTMENT_SYSTEM, value: parsed.appointmentId }]
  }
  if (parsed.operation !== undefined) appointment.description = parsed.operation
  if (parsed.scheduledDateISO !== undefined) {
    const time = parsed.scheduledTime ?? '00:00'
    appointment.start = `${parsed.scheduledDateISO}T${time}:00`
  }
  entry.push({ resource: appointment })

  return { resourceType: 'Bundle', type: 'message', entry }
}

// ---------------------------------------------------------------------------
// extractFromFhir — FHIR bundle → ParsedMessage
// ---------------------------------------------------------------------------

function resourceOf<T extends FhirResource['resourceType']>(
  bundle: FhirBundle,
  type: T,
): Extract<FhirResource, { resourceType: T }> | undefined {
  const found = bundle.entry.find((e) => e.resource.resourceType === type)?.resource
  return found as Extract<FhirResource, { resourceType: T }> | undefined
}

function identifierValue(identifiers: FhirIdentifier[] | undefined, system: string): string | undefined {
  return identifiers?.find((i) => i.system === system)?.value
}

/**
 * Read a FHIR bundle back into the neutral `ParsedMessage`. The `mapping`
 * documents where each field lives (it is shown in the feed-config view); the
 * identifier systems it names are what the resolver matches on, so the FHIR feed
 * is mapping-driven in the same spirit as the HL7 extractor.
 */
export function extractFromFhir(bundle: FhirBundle, mapping: Record<string, string>): ParsedMessage {
  const header = resourceOf(bundle, 'MessageHeader')
  const patient = resourceOf(bundle, 'Patient')
  const practitioner = resourceOf(bundle, 'Practitioner')
  const appointment = resourceOf(bundle, 'Appointment')

  const nhiSystem = mapping.nhi ?? NHI_SYSTEM
  const hpiSystem = mapping.practitionerHpi ?? HPI_SYSTEM

  const message: ParsedMessage = {
    eventType: header?.eventCoding?.code ?? '',
    messageControlId: header?.id ?? '',
    patient: {},
  }

  const nhi = identifierValue(patient?.identifier, nhiSystem)
  if (nhi !== undefined && nhi !== '') message.patient.nhi = nhi
  const name = patient?.name?.[0]
  const displayName = name?.text ?? [name?.given?.join(' '), name?.family].filter((s) => s !== undefined && s !== '').join(' ')
  if (displayName !== undefined && displayName !== '') message.patient.name = displayName
  if (patient?.birthDate !== undefined && patient.birthDate !== '') message.patient.dobISO = patient.birthDate
  const ethnicity = patient?.extension?.find((e) => e.url === ETHNICITY_EXT_URL)?.valueCoding?.code
  if (ethnicity !== undefined && ethnicity !== '') message.patient.ethnicityCode = ethnicity

  const hpi = identifierValue(practitioner?.identifier, hpiSystem)
  // (practitioner HPI is display-only in the FHIR pane; not part of the store effect)

  const apptId = identifierValue(appointment?.identifier, APPOINTMENT_SYSTEM)
  if (apptId !== undefined && apptId !== '') message.appointmentId = apptId
  if (appointment?.description !== undefined) message.operation = appointment.description
  if (appointment?.start !== undefined && appointment.start.length >= 16) {
    message.scheduledDateISO = appointment.start.slice(0, 10)
    message.scheduledTime = appointment.start.slice(11, 16)
  }
  void hpi
  return message
}

/** The HPI on a bundle's Practitioner, for the FHIR-pane display + checklist. */
export function practitionerHpiOf(bundle: FhirBundle): string | undefined {
  const practitioner = resourceOf(bundle, 'Practitioner')
  return practitioner?.identifier?.find((i) => i.system === HPI_SYSTEM)?.value
}

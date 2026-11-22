/**
 * Refreshing a patient from the NHI register (catch-up Phase 40a; US-14.4.1's
 * note, DM-30). Pure.
 *
 * Phase 40's rule holds: a field the record lacks and the register has is an
 * enrichment, filled in; a field both hold with different values is a
 * difference, written only when the office chooses "Use register" (the
 * default is Keep). Name, DOB, phone and address compare through
 * `detailDifferences`; the ethnicity code compares exactly. The register
 * holds no email.
 */

import { formatPostalAddress } from '../billing/payer'
import { detailDifferences } from '../patients/patientDetails'
import type { Patient } from '../types'
import type { NhiRegisterPerson, RegisterField } from './types'

export interface RegisterDifference {
  field: RegisterField
  onRecord: string
  onRegister: string
}

export interface RegisterEnrichment {
  field: RegisterField
  onRegister: string
}

export interface RegisterComparison {
  differences: RegisterDifference[]
  enrichments: RegisterEnrichment[]
}

export type RegisterChoice = 'keep' | 'useRegister'
export type RegisterChoices = Partial<Record<RegisterField, RegisterChoice>>

function registerText(person: NhiRegisterPerson, field: RegisterField): string | undefined {
  switch (field) {
    case 'name':
      return person.name
    case 'dobISO':
      return person.dobISO
    case 'phone':
      return person.phone
    case 'address':
      return person.postalAddress !== undefined ? formatPostalAddress(person.postalAddress) : undefined
    case 'ethnicityCode':
      return person.ethnicityCode
  }
}

function recordHas(patient: Patient, field: RegisterField): boolean {
  switch (field) {
    case 'name':
      return patient.name.trim() !== ''
    case 'dobISO':
      return patient.dobISO !== ''
    case 'phone':
      return patient.phone !== undefined && patient.phone.trim() !== ''
    case 'address':
      return patient.postalAddress !== undefined
    case 'ethnicityCode':
      return patient.ethnicityCode !== undefined && patient.ethnicityCode !== ''
  }
}

// Every field the register holds: one the record lacks is filled in (a record from intake may lack a DOB).
const ENRICHABLE: readonly RegisterField[] = ['name', 'dobISO', 'phone', 'address', 'ethnicityCode']

export function registerDifferences(patient: Patient, person: NhiRegisterPerson): RegisterComparison {
  const differences: RegisterDifference[] = detailDifferences(patient, {
    name: person.name,
    dobISO: person.dobISO,
    ...(person.phone !== undefined ? { phone: person.phone } : {}),
    ...(person.postalAddress !== undefined ? { postalAddress: person.postalAddress } : {}),
  }).flatMap((d) => (d.field === 'email' ? [] : [{ field: d.field, onRecord: d.existing ?? '', onRegister: d.incoming }]))
  if (
    patient.ethnicityCode !== undefined &&
    patient.ethnicityCode !== '' &&
    person.ethnicityCode !== undefined &&
    person.ethnicityCode !== patient.ethnicityCode
  ) {
    differences.push({ field: 'ethnicityCode', onRecord: patient.ethnicityCode, onRegister: person.ethnicityCode })
  }
  const enrichments: RegisterEnrichment[] = []
  for (const field of ENRICHABLE) {
    const value = registerText(person, field)
    if (value !== undefined && value.trim() !== '' && !recordHas(patient, field)) enrichments.push({ field, onRegister: value })
  }
  return { differences, enrichments }
}

function withField(patient: Patient, person: NhiRegisterPerson, field: RegisterField): Patient {
  switch (field) {
    case 'name':
      return { ...patient, name: person.name }
    case 'dobISO':
      return { ...patient, dobISO: person.dobISO }
    case 'phone':
      return person.phone !== undefined ? { ...patient, phone: person.phone } : patient
    case 'address':
      return person.postalAddress !== undefined ? { ...patient, postalAddress: person.postalAddress } : patient
    case 'ethnicityCode': {
      if (person.ethnicityCode === undefined) return patient
      // A code held for review is replaced by the register's valid one (as `editPatient` does).
      const { ethnicityPending: _held, ...rest } = patient
      return { ...rest, ethnicityCode: person.ethnicityCode }
    }
  }
}

/**
 * The record after a refresh: every enrichment applied, then each difference
 * whose choice is `useRegister` (a missing choice is Keep). Returns the fields
 * that changed, enrichments first.
 */
export function applyRegisterRefresh(
  patient: Patient,
  person: NhiRegisterPerson,
  choices: RegisterChoices,
): { patient: Patient; changed: RegisterField[] } {
  const { differences, enrichments } = registerDifferences(patient, person)
  let next = patient
  const changed: RegisterField[] = []
  for (const e of enrichments) {
    next = withField(next, person, e.field)
    changed.push(e.field)
  }
  for (const d of differences) {
    if (choices[d.field] !== 'useRegister') continue
    next = withField(next, person, d.field)
    changed.push(d.field)
  }
  return { patient: next, changed }
}
